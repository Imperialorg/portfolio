import * as THREE from 'three'
import gsap from 'gsap'

export interface HoverInfo {
  title: string
  lines: string[]
}

export abstract class Environment {
  readonly group = new THREE.Group()
  hoverTargets: THREE.Object3D[] = []
  protected visible = false
  protected visibleValue = 0

  abstract create(scene: THREE.Scene): void
  abstract update(t: number): void
  abstract onHover(obj: THREE.Object3D | null, info: HoverInfo | null): void

  enter() {
    this.group.visible = true
    this.visible = true
    gsap.killTweensOf(this)
    gsap.to(this, { visibleValue: 1, duration: 0.5, ease: 'power1.inOut',
      onUpdate: () => this.setVisible(this.visibleValue) })
  }

  exit() {
    this.visible = false
    gsap.killTweensOf(this)
    gsap.to(this, { visibleValue: 0, duration: 0.5, ease: 'power1.inOut',
      onUpdate: () => this.setVisible(this.visibleValue),
      onComplete: () => { this.group.visible = false } })
  }

  protected setVisible(_v: number) {}

  dispose() { this.group.traverse(o => {
    if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose()
  }) }
}

// ─── Project detail panel ─────────────────────────────────────────────────────
// Singleton overlay shown when user clicks a label
let _panel: HTMLElement | null = null

function getPanel(): HTMLElement {
  if (_panel) return _panel
  _panel = document.createElement('div')
  _panel.id = 'env-detail-panel'
  Object.assign(_panel.style, {
    position: 'fixed', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%) scale(0.92)',
    background: 'rgba(4,6,20,0.92)',
    border: '1px solid var(--neon, #00f5ff)',
    boxShadow: '0 0 32px var(--neon, #00f5ff)44',
    padding: '28px 36px',
    maxWidth: '480px', width: '90vw',
    zIndex: '9999',
    fontFamily: 'monospace',
    color: '#e8f4ff',
    opacity: '0',
    pointerEvents: 'none',
    transition: 'opacity 0.3s, transform 0.3s',
    borderRadius: '4px',
  })
  document.body.appendChild(_panel)
  return _panel
}

export function showProjectPanel(project: {
  title: string, subtitle: string, desc: string,
  tags: string[], url: string, neonColor: string
}) {
  const p = getPanel()
  p.style.setProperty('--neon', project.neonColor)
  p.style.borderColor = project.neonColor + '88'
  p.style.boxShadow = `0 0 40px ${project.neonColor}33`
  p.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
      <div>
        <div style="color:${project.neonColor};font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px">${project.subtitle}</div>
        <div style="font-size:20px;font-weight:bold;color:#fff">${project.title}</div>
      </div>
      <button id="env-panel-close" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer;line-height:1;padding:0 0 0 16px">✕</button>
    </div>
    <div style="font-size:13px;line-height:1.7;color:#c8d8ef;margin-bottom:16px">${project.desc}</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px">
      ${project.tags.map(t => `<span style="background:${project.neonColor}18;border:1px solid ${project.neonColor}44;color:${project.neonColor};font-size:10px;padding:3px 8px;border-radius:2px">${t}</span>`).join('')}
    </div>
    <a href="${project.url}" target="_blank" rel="noopener"
       style="display:inline-block;padding:9px 20px;background:${project.neonColor}22;border:1px solid ${project.neonColor};color:${project.neonColor};text-decoration:none;font-size:12px;letter-spacing:1px;transition:background 0.2s"
       onmouseover="this.style.background='${project.neonColor}44'"
       onmouseout="this.style.background='${project.neonColor}22'">
      VIEW ON GITHUB →
    </a>
  `
  p.querySelector('#env-panel-close')?.addEventListener('click', e => { e.stopPropagation(); hidePanel() })
  p.style.pointerEvents = 'all'
  p.style.opacity = '1'
  p.style.transform = 'translate(-50%, -50%) scale(1)'
}

export function hidePanel() {
  const p = _panel
  if (!p) return
  p.style.opacity = '0'
  p.style.transform = 'translate(-50%, -50%) scale(0.92)'
  p.style.pointerEvents = 'none'
}

// ─── Floating 3D label (clickable) ───────────────────────────────────────────
export function makeFloatingLabel(
  title: string,
  color: string,
  onClick: () => void
): THREE.Mesh {
  const W = 512, H = 64
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  // fully transparent background — no rect fill
  ctx.clearRect(0, 0, W, H)

  // Title — glow layers first, then solid fill on top
  ctx.font = 'bold 20px monospace'
  ctx.textAlign = 'center'
  ctx.shadowColor = color
  for (const blur of [24, 12, 6]) {
    ctx.shadowBlur = blur
    ctx.fillStyle = color
    ctx.fillText(title, W / 2, 34)
  }
  ctx.shadowBlur = 0
  ctx.fillStyle = '#ffffff'
  ctx.fillText(title, W / 2, 34)

  // Hint line
  ctx.font = '11px monospace'
  ctx.shadowBlur = 6
  ctx.shadowColor = color
  ctx.fillStyle = color
  ctx.fillText('▶  CLICK FOR DETAILS', W / 2, 54)

  const tex = new THREE.CanvasTexture(canvas)
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false,
    side: THREE.DoubleSide, alphaTest: 0.02,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.2), mat)
  mesh.userData.isLabel = true
  mesh.userData.onClick = onClick
  mesh.frustumCulled = false
  // Always face camera (billboard)
  mesh.onBeforeRender = (_r, _s, cam) => mesh.quaternion.copy(cam.quaternion)
  return mesh
}

// ─── Legacy label helpers (used by CityGenerator) ────────────────────────────
export function makeLabel(text: string, sub: string, color = '#00f5ff'): THREE.Texture {
  const W = 512, H = 80
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, W, H)
  const grd = ctx.createRadialGradient(W/2, H/2, 4, W/2, H/2, W/2)
  grd.addColorStop(0, color + '22'); grd.addColorStop(1, 'transparent')
  ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = color; ctx.font = 'bold 22px monospace'
  ctx.textAlign = 'center'
  ctx.shadowColor = color; ctx.shadowBlur = 12
  ctx.fillText(text, W/2, 32)
  ctx.fillStyle = 'rgba(200,230,255,0.6)'; ctx.font = '13px monospace'
  ctx.shadowBlur = 6; ctx.fillText(sub, W/2, 54)
  return new THREE.CanvasTexture(c)
}

export function makeLabelMesh(text: string, sub: string, color = '#00f5ff'): THREE.Mesh {
  const tex = makeLabel(text, sub, color)
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
  return new THREE.Mesh(new THREE.PlaneGeometry(5, 1.5), mat)
}
