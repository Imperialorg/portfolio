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

  // Left accent bar
  ctx.fillStyle = neon
  ctx.shadowColor = neon; ctx.shadowBlur = 16
  ctx.fillRect(0, 0, 5, H)
  ctx.shadowBlur = 0

  // District / section label (top left, small)
  ctx.font = '11px monospace'
  ctx.fillStyle = neon + '88'
  ctx.textAlign = 'left'
  ctx.fillText(proj.district.toUpperCase(), 28, 32)

  // Title — huge, white with neon glow
  const titleSize = proj.title.length > 16 ? 52 : 72
  ctx.font = `bold ${titleSize}px monospace`
  ctx.shadowColor = neon; ctx.shadowBlur = 48
  ctx.fillStyle = '#ffffff'
  ctx.fillText(proj.title, 28, 80 + (72 - titleSize))
  ctx.shadowBlur = 20; ctx.fillStyle = neon + 'cc'
  ctx.fillText(proj.title, 28, 80 + (72 - titleSize))

  // Subtitle — one line, muted
  ctx.shadowBlur = 0
  ctx.font = '20px monospace'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fillText(proj.subtitle, 28, 150)

  // Thin separator line
  ctx.strokeStyle = neon + '33'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(28, 172); ctx.lineTo(W - 28, 172); ctx.stroke()

  // Tags — pill style, first 4 only
  ctx.font = 'bold 15px monospace'
  let tx = 28
  for (const tag of proj.tags.slice(0, 4)) {
    const tw = ctx.measureText(tag).width + 24
    ctx.strokeStyle = neon + '55'; ctx.lineWidth = 1
    ctx.strokeRect(tx, 188, tw, 30)
    ctx.fillStyle = neon + 'dd'
    ctx.fillText(tag, tx + 12, 208)
    tx += tw + 10
  }

  // Bottom: "[ VIEW PROJECT ]" hint
  ctx.font = '13px monospace'
  ctx.fillStyle = neon + '66'
  ctx.fillText('[ CLICK TO VIEW PROJECT ]', 28, H - 20)

  return new THREE.CanvasTexture(c)
}

export class PanelEnv extends Environment {
  private projIdx: number
  private panelPos: THREE.Vector3
  private panelMat!: THREE.MeshBasicMaterial
  private particleMat!: THREE.PointsMaterial

  constructor(projIdx: number, panelPos: THREE.Vector3) {
    super()
    this.projIdx = projIdx
    this.panelPos = panelPos
  }

  create(scene: THREE.Scene) {
    scene.add(this.group)
    const proj = PROJECTS[this.projIdx]

    // Main billboard
    const tex = drawPanel(proj)
    this.panelMat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthWrite: false,
      side: THREE.DoubleSide, alphaTest: 0.02,
    })
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(40, 18), this.panelMat)
    panel.position.copy(this.panelPos)
    panel.frustumCulled = false
    panel.onBeforeRender = (_r, _s, cam) => panel.quaternion.copy(cam.quaternion)
    panel.userData.isLabel = true
    panel.userData.onClick = () => showProjectPanel(proj)
    this.group.add(panel)

    // Sparse ambient particles
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
      size: 0.4, color: new THREE.Color(proj.neonColor),
      transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, sizeAttenuation: true,
    })
    const pts = new THREE.Points(pGeo, this.particleMat)
    pts.frustumCulled = false
    this.group.add(pts)
  }

  update(_t: number) {}

  protected setVisible(v: number) {
    if (this.panelMat) this.panelMat.opacity = v
    if (this.particleMat) this.particleMat.opacity = v * 0.5
  }

  onHover() {}
}
