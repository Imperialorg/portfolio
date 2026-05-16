import * as THREE from 'three'
import { Environment } from './Environment'
import { PROJECTS, Project } from '../sections/data'

// Scan-wipe reveal shader for the billboard panel
const revealVert = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const revealFrag = /* glsl */`
uniform sampler2D uMap;
uniform float uReveal;   // 0=hidden, 1=fully shown
uniform float uOpacity;
uniform vec3 uNeon;
varying vec2 vUv;
void main() {
  vec4 tex = texture2D(uMap, vUv);
  // Wipe left→right: pixels with x < uReveal are shown
  float hidden = smoothstep(uReveal - 0.04, uReveal + 0.04, vUv.x);
  // Bright neon scan-line at the leading edge
  float atEdge = 1.0 - smoothstep(0.0, 0.04, abs(vUv.x - uReveal));
  vec3 col = tex.rgb + uNeon * atEdge * 3.5;
  gl_FragColor = vec4(col, tex.a * (1.0 - hidden) * uOpacity);
}
`

function drawPanel(proj: Project): THREE.CanvasTexture {
  const W = 900, H = 440
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  const neon = proj.neonColor

  // Solid dark background
  ctx.fillStyle = '#010208'
  ctx.fillRect(0, 0, W, H)
  // Inner border for depth
  ctx.fillStyle = 'rgba(10,12,30,0.95)'
  ctx.fillRect(3, 3, W - 6, H - 6)

  // Subtle scanlines
  for (let y = 0; y < H; y += 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.fillRect(0, y, W, 2)
  }

  // Left accent bar with glow gradient
  const grad = ctx.createLinearGradient(0, 0, 14, 0)
  grad.addColorStop(0, neon)
  grad.addColorStop(1, 'transparent')
  ctx.fillStyle = grad
  ctx.shadowColor = neon; ctx.shadowBlur = 28
  ctx.fillRect(0, 0, 7, H)
  ctx.shadowBlur = 0

  // District badge
  ctx.font = 'bold 11px monospace'
  ctx.fillStyle = neon + 'aa'
  ctx.textAlign = 'left'
  ctx.fillText('◈ ' + proj.district.toUpperCase(), 24, 28)

  // Title
  const titleSize = proj.title.length > 18 ? 48 : proj.title.length > 13 ? 58 : 70
  ctx.font = `bold ${titleSize}px monospace`
  ctx.shadowColor = neon; ctx.shadowBlur = 50
  ctx.fillStyle = '#ffffff'
  ctx.fillText(proj.title, 24, 62 + (70 - titleSize))
  ctx.shadowBlur = 26; ctx.fillStyle = neon + 'bb'
  ctx.fillText(proj.title, 24, 62 + (70 - titleSize))

  // Subtitle
  ctx.shadowBlur = 0
  ctx.font = '18px monospace'
  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.fillText(proj.subtitle, 24, 138)

  // Description — 2 lines wrapped
  ctx.font = '14px monospace'
  ctx.fillStyle = 'rgba(200,220,255,0.45)'
  const maxW = W - 48
  const words = proj.desc.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w
    if (ctx.measureText(test).width > maxW) {
      if (lines.length === 1) { lines.push(cur + '…'); cur = ''; break }
      lines.push(cur); cur = w
    } else cur = test
  }
  if (cur && lines.length < 2) lines.push(cur)
  lines.forEach((l, i) => ctx.fillText(l, 24, 164 + i * 20))

  // Separator
  ctx.strokeStyle = neon + '30'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(24, 212); ctx.lineTo(W - 24, 212); ctx.stroke()

  // Tag pills — up to 5
  ctx.font = 'bold 13px monospace'
  let tx = 24
  for (const tag of proj.tags.slice(0, 5)) {
    const tw = ctx.measureText(tag).width + 20
    if (tx + tw > W - 24) break
    ctx.fillStyle = neon + '18'
    ctx.fillRect(tx, 224, tw, 26)
    ctx.strokeStyle = neon + '66'; ctx.lineWidth = 1
    ctx.strokeRect(tx, 224, tw, 26)
    ctx.fillStyle = neon + 'ee'
    ctx.fillText(tag, tx + 10, 241)
    tx += tw + 8
  }

  // URL
  ctx.font = '12px monospace'
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.fillText(proj.url.replace('https://', ''), 24, 278)

  // Click hint with glow
  ctx.font = 'bold 13px monospace'
  ctx.shadowColor = neon; ctx.shadowBlur = 14
  ctx.fillStyle = neon + '99'
  ctx.fillText('▶  CLICK TO VIEW PROJECT', 24, H - 18)
  ctx.shadowBlur = 0

  return new THREE.CanvasTexture(c)
}

function box(
  w: number, h: number, d: number,
  pos: THREE.Vector3,
  mat: THREE.Material,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.copy(pos)
  m.frustumCulled = false
  return m
}

export class PanelEnv extends Environment {
  private projIdx: number
  private panelPos: THREE.Vector3
  private camPos: THREE.Vector3
  // [material, maxOpacity] pairs for fade-in/out
  private fadeMats: Array<[THREE.MeshBasicMaterial, number]> = []
  private particleMat!: THREE.PointsMaterial
  private panelShaderMat!: THREE.ShaderMaterial

  constructor(projIdx: number, panelPos: THREE.Vector3, camPos: THREE.Vector3) {
    super()
    this.projIdx = projIdx
    this.panelPos = panelPos
    this.camPos = camPos
  }

  create(scene: THREE.Scene) {
    scene.add(this.group)
    const proj = PROJECTS[this.projIdx]
    const neon = new THREE.Color(proj.neonColor)

    // Rotate only around Y so the billboard stays vertical, facing the camera horizontally
    const pivot = new THREE.Group()
    pivot.position.copy(this.panelPos)
    const dx = this.camPos.x - this.panelPos.x
    const dz = this.camPos.z - this.panelPos.z
    pivot.rotation.y = Math.atan2(dx, dz)
    this.group.add(pivot)

    const track = (mat: THREE.MeshBasicMaterial, maxOpacity: number) => {
      mat.opacity = 0
      this.fadeMats.push([mat, maxOpacity])
      return mat
    }

    // ── Panel face — scan-wipe shader ─────────────────────────────────
    const neonArr: [number, number, number] = [neon.r, neon.g, neon.b]
    this.panelShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap:    { value: drawPanel(proj) },
        uReveal: { value: 0.0 },          // 0=hidden, 1=fully revealed (wipe progress)
        uOpacity:{ value: 1.0 },
        uNeon:   { value: new THREE.Vector3(...neonArr) },
      },
      vertexShader: revealVert,
      fragmentShader: revealFrag,
      transparent: true,
      depthWrite: true,
      side: THREE.FrontSide,
    })
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(40, 19.5), this.panelShaderMat)
    panel.frustumCulled = false
    panel.userData.isLabel = true
    panel.userData.onClick = () => window.open(proj.url, '_blank')
    pivot.add(panel)

    // ── Neon frame border ─────────────────────────────────────────────
    const frameMat = track(new THREE.MeshBasicMaterial({
      color: neon, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }), 0.85)
    pivot.add(box(41, 0.5, 0.4, new THREE.Vector3(0,  9.75, 0.1), frameMat))
    pivot.add(box(41, 0.5, 0.4, new THREE.Vector3(0, -9.75, 0.1), frameMat))
    pivot.add(box(0.5, 20.5, 0.4, new THREE.Vector3(-20.25, 0, 0.1), frameMat))
    pivot.add(box(0.5, 20.5, 0.4, new THREE.Vector3( 20.25, 0, 0.1), frameMat))

    // ── Mounting structure (poles + crossbeam) ────────────────────────
    const POLE_H = 190
    const structMat = track(new THREE.MeshBasicMaterial({
      color: 0x2a2a3e, transparent: true,
    }), 1.0)
    const lc = new THREE.Vector3(-13, -9.75 - POLE_H / 2, 0)
    const rc = new THREE.Vector3( 13, -9.75 - POLE_H / 2, 0)
    pivot.add(box(0.9, POLE_H, 0.9, lc, structMat))
    pivot.add(box(0.9, POLE_H, 0.9, rc, structMat))
    pivot.add(box(27, 0.7, 0.9, new THREE.Vector3(0, -9.75 - POLE_H + 0.4, 0), structMat))

    // Neon glow strip on top edge
    const glowMat = track(new THREE.MeshBasicMaterial({
      color: neon, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }), 0.5)
    pivot.add(box(41, 0.3, 0.1, new THREE.Vector3(0, 9.75, 0.2), glowMat))

    // ── Sparse ambient particles ───────────────────────────────────────
    const N = 60
    const pPos = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      pPos[i*3]   = this.panelPos.x + (Math.random()-0.5)*60
      pPos[i*3+1] = this.panelPos.y + (Math.random()-0.5)*35
      pPos[i*3+2] = this.panelPos.z + (Math.random()-0.5)*60
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    this.particleMat = new THREE.PointsMaterial({
      size: 0.4, color: neon, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, sizeAttenuation: true,
    })
    const pts = new THREE.Points(pGeo, this.particleMat)
    pts.frustumCulled = false
    this.group.add(pts)
  }

  update(_t: number) {}

  protected setVisible(v: number) {
    // Panel wipe: uReveal drives the left→right scan sweep
    if (this.panelShaderMat) this.panelShaderMat.uniforms.uReveal.value = v
    // Frame, poles, glow, particles fade normally
    for (const [mat, max] of this.fadeMats) mat.opacity = v * max
    if (this.particleMat) this.particleMat.opacity = v * 0.45
  }

  onHover() {}
}
