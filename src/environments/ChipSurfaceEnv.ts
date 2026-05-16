import * as THREE from 'three'
import { Environment, makeFloatingLabel, showProjectPanel } from './Environment'
import { PROJECTS } from '../sections/data'

// Section 3 — CPUonGPU: macro PCB surface, top-down
const CENTER = new THREE.Vector3(-75, 0, -25)

export class ChipSurfaceEnv extends Environment {
  private pcbMeshMat!: THREE.MeshBasicMaterial
  private pipeMeshMat!: THREE.MeshBasicMaterial
  private electrons!: THREE.Points
  private electronMat!: THREE.PointsMaterial
  private ePos!: Float32Array
  private tracePaths!: number[][][]

  create(scene: THREE.Scene) {
    scene.add(this.group)

    // ── PCB substrate — canvas rendered once ──────────────────────────────────
    const W = 1024, H = 1024
    const c = document.createElement('canvas'); c.width = W; c.height = H
    const ctx = c.getContext('2d')!

    // Substrate
    ctx.fillStyle = '#051408'
    ctx.fillRect(0, 0, W, H)

    // Copper traces
    ctx.strokeStyle = '#c8a030'
    ctx.lineWidth = 8
    const traces: [number, number, number, number][] = [
      [40, 500, 960, 500],
      [40, 800, 960, 800],
      [40, 200, 960, 200],
      [300, 650, 300, 500],
      [300, 500, 650, 500],
      [650, 500, 650, 650],
      [200, 350, 200, 650],
      [600, 550, 930, 550],
      [600, 590, 930, 590],
      [600, 630, 930, 630],
    ]
    for (const [x1, y1, x2, y2] of traces) {
      ctx.shadowColor = '#c8a030'; ctx.shadowBlur = 6
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
    }

    // Pads
    ctx.fillStyle = '#d4a820'
    const pads = [[300, 650], [200, 650], [200, 350], [300, 500], [650, 650],
                  [650, 500], [500, 500], [500, 350], [350, 500], [350, 650]]
    for (const [px, py] of pads) {
      ctx.shadowColor = '#d4a820'; ctx.shadowBlur = 10
      ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#d4a820'
    }

    // CPU die
    ctx.fillStyle = '#0d1420'; ctx.fillRect(180, 430, 145, 230)
    ctx.strokeStyle = 'rgba(200,200,255,0.6)'; ctx.lineWidth = 2
    ctx.strokeRect(182, 432, 141, 226)
    ctx.fillStyle = 'rgba(200,220,255,0.7)'; ctx.font = 'bold 22px monospace'
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0
    ctx.fillText('CPU', 230, 560)

    // GPU die
    ctx.fillStyle = '#080d1a'; ctx.fillRect(600, 500, 210, 180)
    ctx.strokeStyle = 'rgba(200,200,255,0.6)'; ctx.lineWidth = 2
    ctx.strokeRect(602, 502, 206, 176)
    ctx.fillStyle = 'rgba(200,220,255,0.7)'; ctx.font = 'bold 28px monospace'
    ctx.fillText('GPU', 660, 600)

    // Decap caps
    ctx.fillStyle = '#7a5c18'
    const caps = [[480, 250], [480, 280], [350, 250], [350, 280],
                  [120, 450], [120, 470], [120, 500], [120, 530]]
    for (const [cx, cy] of caps) {
      ctx.fillRect(cx - 12, cy - 5, 24, 10)
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1
      ctx.strokeRect(cx - 12, cy - 5, 24, 10)
    }

    // Edge vignette
    const vignette = ctx.createRadialGradient(512, 512, 200, 512, 512, 600)
    vignette.addColorStop(0, 'transparent')
    vignette.addColorStop(1, 'rgba(0,8,4,0.85)')
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H)

    const pcbTex = new THREE.CanvasTexture(c)
    this.pcbMeshMat = new THREE.MeshBasicMaterial({ map: pcbTex, transparent: true })
    const pcb = new THREE.Mesh(new THREE.PlaneGeometry(45, 45), this.pcbMeshMat)
    pcb.rotation.x = -Math.PI / 2
    pcb.position.copy(CENTER)
    pcb.renderOrder = 1
    pcb.frustumCulled = false
    this.group.add(pcb)

    // ── Pipeline diagram — canvas rendered once ───────────────────────────────
    const PW = 1024, PH = 256
    const pc = document.createElement('canvas'); pc.width = PW; pc.height = PH
    const pctx = pc.getContext('2d')!

    pctx.fillStyle = '#020307'
    pctx.fillRect(0, 0, PW, PH)

    const stageNames = ['IF', 'ID', 'EX', 'MEM', 'WB']
    const stageColors = ['#00d4ff', '#5a9aff', '#d44dff', '#ff8c26', '#40ff66']
    for (let i = 0; i < 5; i++) {
      const cx = (i + 0.5) * (PW / 5)
      const bx = cx - 80, by = 20, bw = 160, bh = PH - 40

      pctx.strokeStyle = stageColors[i]
      pctx.lineWidth = 2
      pctx.shadowColor = stageColors[i]; pctx.shadowBlur = 12
      pctx.strokeRect(bx, by, bw, bh)
      pctx.fillStyle = stageColors[i] + '20'
      pctx.fillRect(bx, by, bw, bh)

      pctx.fillStyle = stageColors[i]
      pctx.font = 'bold 36px monospace'
      pctx.textAlign = 'center'
      pctx.shadowBlur = 16
      pctx.fillText(stageNames[i], cx, PH / 2 + 12)

      if (i < 4) {
        const ax = (i + 1) * (PW / 5) - 10
        pctx.strokeStyle = 'rgba(200,200,200,0.5)'
        pctx.lineWidth = 2
        pctx.shadowBlur = 0
        pctx.beginPath()
        pctx.moveTo(ax - 10, PH / 2)
        pctx.lineTo(ax + 10, PH / 2)
        pctx.moveTo(ax + 4, PH / 2 - 8)
        pctx.lineTo(ax + 10, PH / 2)
        pctx.lineTo(ax + 4, PH / 2 + 8)
        pctx.stroke()
      }
    }

    const pipeTex = new THREE.CanvasTexture(pc)
    this.pipeMeshMat = new THREE.MeshBasicMaterial({ map: pipeTex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    const pipe = new THREE.Mesh(new THREE.PlaneGeometry(26, 8), this.pipeMeshMat)
    pipe.position.set(CENTER.x, CENTER.y + 12, CENTER.z)
    pipe.rotation.x = -0.2
    pipe.frustumCulled = false
    this.group.add(pipe)

    // ── Component 3D geometry ──────────────────────────────────────────────────
    const cpuDie = new THREE.Mesh(
      new THREE.BoxGeometry(11.2, 0.9, 14.0),
      new THREE.MeshBasicMaterial({ color: 0x0a0e16 })
    )
    cpuDie.position.set(CENTER.x - 17, CENTER.y + 0.45, CENTER.z + 1.5)
    this.group.add(cpuDie)

    const cpuTop = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 12),
      new THREE.MeshBasicMaterial({ color: 0x061808 })
    )
    cpuTop.rotation.x = -Math.PI / 2
    cpuTop.position.set(CENTER.x - 17, CENTER.y + 0.92, CENTER.z + 1.5)
    this.group.add(cpuTop)

    const gpuDie = new THREE.Mesh(
      new THREE.BoxGeometry(14, 1.1, 11.2),
      new THREE.MeshBasicMaterial({ color: 0x060a14 })
    )
    gpuDie.position.set(CENTER.x + 7, CENTER.y + 0.55, CENTER.z - 2)
    this.group.add(gpuDie)

    const pinMat = new THREE.MeshBasicMaterial({ color: 0xc8a840 })
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 14; i++) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.6), pinMat)
        pin.position.set(CENTER.x - 22 + row * 18, CENTER.y + 0.15, CENTER.z - 5 + i)
        this.group.add(pin)
      }
    }

    const capMat = new THREE.MeshBasicMaterial({ color: 0x8b6914 })
    const capPositions = [[-10, -8], [-10, 4], [-5, -8], [-5, 4], [2, -6], [2, 2], [12, -6], [12, 2]]
    for (const [x, z] of capPositions) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.8, 8), capMat)
      cap.position.set(CENTER.x + x, CENTER.y + 0.4, CENTER.z + z)
      this.group.add(cap)
    }

    // ── Electron particles along traces ───────────────────────────────────────
    const electronGeo = new THREE.BufferGeometry()
    const ePos = new Float32Array(30 * 3)
    electronGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3))
    this.electronMat = new THREE.PointsMaterial({
      size: 1.2, color: 0x00ffcc, sizeAttenuation: true,
      transparent: true, opacity: 1, blending: THREE.AdditiveBlending,
    })
    this.electrons = new THREE.Points(electronGeo, this.electronMat)
    this.electrons.frustumCulled = false
    this.group.add(this.electrons)
    this.ePos = ePos

    // Trace paths in world space [x, z] coords (PCB plane y=CENTER.y+0.1)
    this.tracePaths = [
      [[CENTER.x - 22, CENTER.z], [CENTER.x + 22, CENTER.z]],
      [[CENTER.x - 22, CENTER.z - 14], [CENTER.x + 22, CENTER.z - 14]],
      [[CENTER.x - 22, CENTER.z + 14], [CENTER.x + 22, CENTER.z + 14]],
      [[CENTER.x - 10, CENTER.z - 7], [CENTER.x - 10, CENTER.z], [CENTER.x + 7, CENTER.z], [CENTER.x + 7, CENTER.z - 7]],
      [[CENTER.x - 12, CENTER.z + 7], [CENTER.x - 12, CENTER.z - 7]],
      [[CENTER.x + 4, CENTER.z - 2], [CENTER.x + 20, CENTER.z - 2]],
    ]

    // Floating label
    const proj = PROJECTS[1]
    const lbl = makeFloatingLabel(proj.title, proj.neonColor, () => showProjectPanel(proj))
    lbl.position.set(CENTER.x - 14, CENTER.y + 6, CENTER.z + 16)
    lbl.rotation.x = -0.4
    this.group.add(lbl)
  }

  update(t: number) {
    let eIdx = 0
    const Y = CENTER.y + 0.1
    for (let ti = 0; ti < this.tracePaths.length && eIdx < 30; ti++) {
      const path = this.tracePaths[ti]
      const totalLen = path.length - 1
      for (let e = 0; e < 5 && eIdx < 30; e++, eIdx++) {
        const tNorm = (t * 0.6 + e / 5 + ti * 0.16) % 1
        const segF = tNorm * totalLen
        const seg = Math.floor(segF)
        const f = segF - seg
        const segClamped = Math.min(seg, totalLen - 1)
        const a = path[segClamped]
        const b = path[Math.min(segClamped + 1, totalLen)]
        this.ePos[eIdx * 3 + 0] = a[0] + (b[0] - a[0]) * f
        this.ePos[eIdx * 3 + 1] = Y
        this.ePos[eIdx * 3 + 2] = a[1] + (b[1] - a[1]) * f
      }
    }
    ;(this.electrons.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
  }

  protected setVisible(v: number) {
    this.pcbMeshMat.opacity = v
    this.pipeMeshMat.opacity = v
    this.electronMat.opacity = v
  }

  onHover() {}
}
