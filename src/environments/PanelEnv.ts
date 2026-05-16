import * as THREE from 'three'
import { Environment, makeFloatingLabel, showProjectPanel } from './Environment'
import { PROJECTS } from '../sections/data'

// A billboard environment: large canvas panel + ambient particles
// panelPos = look target of the section camera (panel placed right where camera looks)
export class PanelEnv extends Environment {
  private projIdx: number
  private panelPos: THREE.Vector3
  private panelMat!: THREE.MeshBasicMaterial
  private particles!: THREE.Points
  private particleMat!: THREE.PointsMaterial

  constructor(projIdx: number, panelPos: THREE.Vector3) {
    super()
    this.projIdx = projIdx
    this.panelPos = panelPos
  }

  create(scene: THREE.Scene) {
    scene.add(this.group)
    const proj = PROJECTS[this.projIdx]
    const W = 1024, H = 512
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!
    const neon = proj.neonColor

    ctx.clearRect(0, 0, W, H)

    // Subtle neon border lines (top + bottom)
    ctx.strokeStyle = neon + 'aa'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(W, 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, H - 2); ctx.lineTo(W, H - 2); ctx.stroke()

    // District label
    ctx.font = '13px monospace'
    ctx.fillStyle = neon + '99'
    ctx.textAlign = 'left'
    ctx.shadowColor = neon; ctx.shadowBlur = 8
    ctx.fillText(`DISTRICT_${String(this.projIdx + 2).padStart(2, '0')}  ·  ${proj.district}`, 32, 40)

    // Large title — glow pass then solid
    ctx.font = 'bold 80px monospace'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = neon; ctx.shadowBlur = 40
    ctx.fillText(proj.title, 32, 130)
    ctx.shadowBlur = 20
    ctx.fillStyle = neon
    ctx.fillText(proj.title, 32, 130)

    // Subtitle
    ctx.font = '22px monospace'
    ctx.fillStyle = '#ffffffbb'
    ctx.shadowBlur = 8
    ctx.fillText(proj.subtitle, 32, 172)

    // Tags row
    ctx.font = '16px monospace'
    ctx.shadowBlur = 0
    let tagX = 32
    for (const tag of proj.tags.slice(0, 5)) {
      ctx.fillStyle = neon + 'cc'
      ctx.strokeStyle = neon + '66'
      ctx.lineWidth = 1
      const tw = ctx.measureText(tag).width
      ctx.strokeRect(tagX, 196, tw + 16, 28)
      ctx.fillText(tag, tagX + 8, 215)
      tagX += tw + 28
    }

    // Description (wrap at ~90 chars per line)
    ctx.font = '17px monospace'
    ctx.fillStyle = '#cce0ff'
    ctx.shadowBlur = 0
    const words = proj.desc.split(' ')
    let line = '', y = 268
    for (const word of words) {
      const test = line + word + ' '
      if (ctx.measureText(test).width > W - 64 && line) {
        ctx.fillText(line, 32, y); y += 28; line = word + ' '
      } else { line = test }
    }
    if (line) ctx.fillText(line.trim(), 32, y)

    // Click hint
    ctx.font = '13px monospace'
    ctx.fillStyle = neon + '88'
    ctx.shadowColor = neon; ctx.shadowBlur = 6
    ctx.fillText('▶  CLICK LABEL FOR FULL DETAILS', 32, H - 18)

    const tex = new THREE.CanvasTexture(canvas)
    this.panelMat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, alphaTest: 0.02,
    })
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(36, 18), this.panelMat)
    panel.position.copy(this.panelPos)
    panel.frustumCulled = false
    panel.onBeforeRender = (_r, _s, cam) => panel.quaternion.copy(cam.quaternion)
    this.group.add(panel)

    // Ambient particles floating around the panel
    const N = 80
    const pPos = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      pPos[i * 3]     = this.panelPos.x + (Math.random() - 0.5) * 50
      pPos[i * 3 + 1] = this.panelPos.y + (Math.random() - 0.5) * 30
      pPos[i * 3 + 2] = this.panelPos.z + (Math.random() - 0.5) * 50
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    this.particleMat = new THREE.PointsMaterial({
      size: 0.5, color: new THREE.Color(neon), transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, sizeAttenuation: true,
    })
    this.particles = new THREE.Points(pGeo, this.particleMat)
    this.particles.frustumCulled = false
    this.group.add(this.particles)

    // Floating clickable label
    const lbl = makeFloatingLabel(proj.title, proj.neonColor, () => showProjectPanel(proj))
    lbl.position.set(this.panelPos.x, this.panelPos.y - 12, this.panelPos.z)
    lbl.scale.setScalar(2.0)
    this.group.add(lbl)
  }

  update(_t: number) {}

  protected setVisible(v: number) {
    if (this.panelMat) this.panelMat.opacity = v
    if (this.particleMat) this.particleMat.opacity = v * 0.7
  }

  onHover() {}
}
