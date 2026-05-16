import * as THREE from 'three'
import { Environment, showProjectPanel } from './Environment'
import { PROJECTS, Project } from '../sections/data'

function drawPanel(proj: Project): THREE.CanvasTexture {
  const W = 900, H = 400
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  const neon = proj.neonColor

  ctx.clearRect(0, 0, W, H)

  // Faint dark background so panel reads against sky
  ctx.fillStyle = 'rgba(4,6,20,0.82)'
  ctx.fillRect(0, 0, W, H)

  // Left accent bar
  ctx.fillStyle = neon
  ctx.shadowColor = neon; ctx.shadowBlur = 22
  ctx.fillRect(0, 0, 6, H)
  ctx.shadowBlur = 0

  // District label
  ctx.font = '11px monospace'
  ctx.fillStyle = neon + '88'
  ctx.textAlign = 'left'
  ctx.fillText(proj.district.toUpperCase(), 30, 34)

  // Title — huge, white with neon glow
  const titleSize = proj.title.length > 16 ? 52 : 72
  ctx.font = `bold ${titleSize}px monospace`
  ctx.shadowColor = neon; ctx.shadowBlur = 48
  ctx.fillStyle = '#ffffff'
  ctx.fillText(proj.title, 30, 82 + (72 - titleSize))
  ctx.shadowBlur = 24; ctx.fillStyle = neon + 'cc'
  ctx.fillText(proj.title, 30, 82 + (72 - titleSize))

  // Subtitle
  ctx.shadowBlur = 0
  ctx.font = '20px monospace'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fillText(proj.subtitle, 30, 152)

  // Separator
  ctx.strokeStyle = neon + '33'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(30, 174); ctx.lineTo(W - 30, 174); ctx.stroke()

  // Tag pills
  ctx.font = 'bold 15px monospace'
  let tx = 30
  for (const tag of proj.tags.slice(0, 4)) {
    const tw = ctx.measureText(tag).width + 24
    ctx.strokeStyle = neon + '55'; ctx.lineWidth = 1
    ctx.strokeRect(tx, 190, tw, 30)
    ctx.fillStyle = neon + 'dd'
    ctx.fillText(tag, tx + 12, 210)
    tx += tw + 10
  }

  // Click hint
  ctx.font = '13px monospace'
  ctx.fillStyle = neon + '66'
  ctx.fillText('[ CLICK TO VIEW PROJECT ]', 30, H - 20)

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

    // ── Pivot: positioned at panel centre, facing the section camera ──
    const pivot = new THREE.Group()
    pivot.position.copy(this.panelPos)
    pivot.lookAt(this.camPos)
    this.group.add(pivot)

    const track = (mat: THREE.MeshBasicMaterial, maxOpacity: number) => {
      mat.opacity = 0
      this.fadeMats.push([mat, maxOpacity])
      return mat
    }

    // ── Panel face ────────────────────────────────────────────────────
    const panelMat = track(new THREE.MeshBasicMaterial({
      map: drawPanel(proj),
      transparent: true, depthWrite: false,
      side: THREE.FrontSide, alphaTest: 0.01,
    }), 1.0)
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(40, 18), panelMat)
    panel.frustumCulled = false
    panel.userData.isLabel = true
    panel.userData.onClick = () => showProjectPanel(proj)
    pivot.add(panel)

    // ── Neon frame border ─────────────────────────────────────────────
    const frameMat = track(new THREE.MeshBasicMaterial({
      color: neon, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }), 0.85)
    pivot.add(box(41, 0.5, 0.4, new THREE.Vector3(0,  9.25, 0.1), frameMat))
    pivot.add(box(41, 0.5, 0.4, new THREE.Vector3(0, -9.25, 0.1), frameMat))
    pivot.add(box(0.5, 19, 0.4, new THREE.Vector3(-20.25, 0, 0.1), frameMat))
    pivot.add(box(0.5, 19, 0.4, new THREE.Vector3( 20.25, 0, 0.1), frameMat))

    // ── Mounting structure (poles + crossbeam) ────────────────────────
    const POLE_H = 14
    const structMat = track(new THREE.MeshBasicMaterial({
      color: 0x2a2a3e, transparent: true,
    }), 1.0)
    const lc = new THREE.Vector3(-13, -9 - POLE_H / 2, 0)
    const rc = new THREE.Vector3( 13, -9 - POLE_H / 2, 0)
    pivot.add(box(0.9, POLE_H, 0.9, lc, structMat))
    pivot.add(box(0.9, POLE_H, 0.9, rc, structMat))
    pivot.add(box(27, 0.7, 0.9, new THREE.Vector3(0, -9 - POLE_H + 0.4, 0), structMat))

    // Neon glow strip on top edge
    const glowMat = track(new THREE.MeshBasicMaterial({
      color: neon, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }), 0.5)
    pivot.add(box(41, 0.3, 0.1, new THREE.Vector3(0, 9.25, 0.2), glowMat))

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
    for (const [mat, max] of this.fadeMats) mat.opacity = v * max
    if (this.particleMat) this.particleMat.opacity = v * 0.45
  }

  onHover() {}
}
