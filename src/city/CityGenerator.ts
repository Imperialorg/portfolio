import * as THREE from 'three'
import { fbm, rand, randInt } from '../utils/noise'
import { buildingVert, buildingFrag } from '../shaders/index'

const GRID = 32
const BLOCK = 16
const GAP = 6
const CELL = BLOCK + GAP
const HALF = (GRID / 2) * CELL

const FOG = { color: new THREE.Color(0x030318), near: 100, far: 500 }

// 6 district neon colors
export const DISTRICT_COLORS = [
  new THREE.Color(0x00f5ff),  // 0 cyan  — GPU
  new THREE.Color(0x00f5ff),  // 1 cyan
  new THREE.Color(0xff00aa),  // 2 magenta — AI
  new THREE.Color(0xff00aa),  // 3 magenta
  new THREE.Color(0xff6b1a),  // 4 orange — systems
  new THREE.Color(0x7b2fff),  // 5 purple — web
  new THREE.Color(0x7b2fff),  // 6 purple
  new THREE.Color(0x00ff88),  // 7 green — edtech
  new THREE.Color(0x00ff88),  // 8 green
  new THREE.Color(0xffe642),  // 9 yellow — hackathon
]

function makeShaderMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: buildingVert,
    fragmentShader: buildingFrag,
    uniforms: {
      uTime:     { value: 0 },
      uFogColor: { value: FOG.color },
      uFogNear:  { value: FOG.near },
      uFogFar:   { value: FOG.far },
    },
  })
}

// Map grid cell to district index (0–9) based on spatial zone
function cellToDistrict(ix: number, iz: number): number {
  const nx = ix / GRID  // 0..1
  const nz = iz / GRID
  // 10 zones: divide into rough sectors
  if (nx < 0.35 && nz < 0.35) return 0
  if (nx < 0.65 && nz < 0.35) return 1
  if (nx >= 0.65 && nz < 0.35) return 2
  if (nx < 0.35 && nz < 0.65) return 3
  if (nx >= 0.65 && nz < 0.65) return 4
  if (nx < 0.35 && nz >= 0.65) return 5
  if (nx < 0.65 && nz >= 0.65) return 6
  if (nx >= 0.65 && nz >= 0.65) return 7
  if (nz > 0.45 && nz < 0.55) return 8
  return 9
}

export class CityGenerator {
  // Setback building sections (wider at base, narrowing upward)
  sectionLow!: THREE.InstancedMesh  // lower body — full width, bottom 62% of height
  sectionMid!: THREE.InstancedMesh  // middle section — 0.68x width, next 23%
  sectionTop!: THREE.InstancedMesh  // top spire — 0.38x width, top 15%
  meshD!: THREE.InstancedMesh       // needle towers (extra 5% pass)
  meshLedge!: THREE.InstancedMesh   // dark floor-plate rings
  private mats: THREE.ShaderMaterial[] = []
  // Building footprints stored during generate() for reuse in sign/equipment placement
  private buildings: Array<{ wx: number; wz: number; fw: number; fd: number; h: number }> = []

  generate(scene: THREE.Scene) {
    const MAX = GRID * GRID
    const mat = makeShaderMaterial()
    this.mats.push(mat)

    // Helper to create a section InstancedMesh with shader attributes
    const makeSection = (): {
      geo: THREE.BoxGeometry
      heights: Float32Array
      colors: Float32Array
      mesh: THREE.InstancedMesh
    } => {
      const geo = new THREE.BoxGeometry(1, 1, 1)
      const heights = new Float32Array(MAX)
      const colors  = new Float32Array(MAX * 3)
      geo.setAttribute('aHeight',    new THREE.InstancedBufferAttribute(heights, 1))
      geo.setAttribute('aNeonColor', new THREE.InstancedBufferAttribute(colors, 3))
      const mesh = new THREE.InstancedMesh(geo, mat.clone(), MAX)
      mesh.frustumCulled = false
      return { geo, heights, colors, mesh }
    }

    const low = makeSection()
    const mid = makeSection()
    const top = makeSection()
    this.sectionLow = low.mesh
    this.sectionMid = mid.mesh
    this.sectionTop = top.mesh
    for (const m of [low.mesh, mid.mesh, top.mesh]) {
      this.mats.push(m.material as THREE.ShaderMaterial)
    }

    // ── Needle towers ────────────────────────────────────
    const geoD = new THREE.BoxGeometry(1, 1, 1)
    const heightsD = new Float32Array(MAX)
    const colorsD  = new Float32Array(MAX * 3)
    geoD.setAttribute('aHeight',    new THREE.InstancedBufferAttribute(heightsD, 1))
    geoD.setAttribute('aNeonColor', new THREE.InstancedBufferAttribute(colorsD, 3))
    this.meshD = new THREE.InstancedMesh(geoD, mat.clone(), MAX)
    this.meshD.frustumCulled = false
    this.mats.push(this.meshD.material as THREE.ShaderMaterial)

    // ── Ledge rings ──────────────────────────────────────
    const ledgeGeo = new THREE.BoxGeometry(1, 1, 1)
    const ledgeMat = new THREE.MeshBasicMaterial({ color: 0x0c0c14 })
    this.meshLedge = new THREE.InstancedMesh(ledgeGeo, ledgeMat, GRID * GRID * 6)
    this.meshLedge.frustumCulled = false
    this.meshLedge.count = 0

    const mtx  = new THREE.Matrix4()
    const pos  = new THREE.Vector3()
    const scl  = new THREE.Vector3()
    const quat = new THREE.Quaternion()

    let cLow = 0, cMid = 0, cTop = 0, cD = 0, cLedge = 0

    for (let ix = 0; ix < GRID; ix++) {
      for (let iz = 0; iz < GRID; iz++) {
        const wx = ix * CELL - HALF
        const wz = iz * CELL - HALF

        // Roads: avenues every 5, side streets every 2
        if (ix % 5 === 0 || iz % 5 === 0) continue
        if (ix % 2 === 0 && iz % 2 === 0 && Math.random() < 0.25) continue

        const nx = (ix / GRID) * 4 - 2
        const nz = (iz / GRID) * 4 - 2
        const noise = fbm(nx, nz, 5)
        const dist  = Math.sqrt(nx * nx + nz * nz) / 3
        const hf    = Math.max(0.18, 1 - dist * 0.6)
        const h     = Math.max(8, (22 + noise * 170) * hf) + rand(4, 28)

        const fw = rand(BLOCK * 0.42, BLOCK * 0.9)
        const fd = rand(BLOCK * 0.42, BLOCK * 0.9)

        const di   = cellToDistrict(ix, iz)
        const neon = DISTRICT_COLORS[di]

        // ── sectionLow: always ──────────────────────────
        const lowH = h * 0.62
        low.heights[cLow] = h
        low.colors[cLow*3] = neon.r; low.colors[cLow*3+1] = neon.g; low.colors[cLow*3+2] = neon.b
        pos.set(wx, lowH / 2, wz); scl.set(fw, lowH, fd)
        mtx.compose(pos, quat, scl)
        this.sectionLow.setMatrixAt(cLow, mtx); cLow++
        this.buildings.push({ wx, wz, fw, fd, h })

        // ── sectionMid: if h > 40 ───────────────────────
        if (h > 40) {
          const midH = h * 0.23
          const midW = fw * 0.68
          const midD = fd * 0.68
          mid.heights[cMid] = h
          mid.colors[cMid*3] = neon.r; mid.colors[cMid*3+1] = neon.g; mid.colors[cMid*3+2] = neon.b
          pos.set(wx, h * 0.62 + midH / 2, wz); scl.set(midW, midH, midD)
          mtx.compose(pos, quat, scl)
          this.sectionMid.setMatrixAt(cMid, mtx); cMid++
        }

        // ── sectionTop: if h > 100 ──────────────────────
        if (h > 100) {
          const topH = h * 0.15
          const topW = fw * 0.38
          const topD = fd * 0.38
          top.heights[cTop] = h
          top.colors[cTop*3] = neon.r; top.colors[cTop*3+1] = neon.g; top.colors[cTop*3+2] = neon.b
          pos.set(wx, h * 0.85 + topH / 2, wz); scl.set(topW, topH, topD)
          mtx.compose(pos, quat, scl)
          this.sectionTop.setMatrixAt(cTop, mtx); cTop++
        }

        // ── Needle tower: extra 5% pass ──────────────────
        if (Math.random() >= 0.95) {
          const nfw = rand(1.5, 4)
          const nfd = rand(1.5, 4)
          const nh  = h * 1.8
          heightsD[cD] = nh
          colorsD[cD*3] = neon.r; colorsD[cD*3+1] = neon.g; colorsD[cD*3+2] = neon.b
          pos.set(wx + rand(-2, 2), nh / 2, wz + rand(-2, 2)); scl.set(nfw, nh, nfd)
          mtx.compose(pos, quat, scl)
          this.meshD.setMatrixAt(cD, mtx); cD++
        }

        // ── Ledge rings — only ~50% of buildings ─────────
        if (Math.random() < 0.5) {
          const ledgeCount = Math.floor(rand(2, 4))
          for (let li = 1; li <= ledgeCount; li++) {
            const ly = (li / (ledgeCount + 1)) * lowH
            pos.set(wx, ly, wz)
            scl.set(fw + 1.2, 0.7, fd + 1.2)
            mtx.compose(pos, quat, scl)
            this.meshLedge.setMatrixAt(cLedge, mtx)
            cLedge++
          }
          // Junction ledge between sectionLow and sectionMid
          if (h > 40) {
            pos.set(wx, h * 0.62, wz)
            scl.set(fw * 0.72, 0.7, fd * 0.72)
            mtx.compose(pos, quat, scl)
            this.meshLedge.setMatrixAt(cLedge, mtx)
            cLedge++
          }
          // Junction ledge between sectionMid and sectionTop
          if (h > 100) {
            pos.set(wx, h * 0.85, wz)
            scl.set(fw * 0.42, 0.7, fd * 0.42)
            mtx.compose(pos, quat, scl)
            this.meshLedge.setMatrixAt(cLedge, mtx)
            cLedge++
          }
        }
      }
    }

    this.sectionLow.count = cLow
    this.sectionMid.count = cMid
    this.sectionTop.count = cTop
    this.meshD.count = cD

    for (const mesh of [this.sectionLow, this.sectionMid, this.sectionTop, this.meshD]) {
      mesh.instanceMatrix.needsUpdate = true
      const g = mesh.geometry
      ;(g.getAttribute('aHeight')    as THREE.BufferAttribute).needsUpdate = true
      ;(g.getAttribute('aNeonColor') as THREE.BufferAttribute).needsUpdate = true
      scene.add(mesh)
    }

    this.meshLedge.count = cLedge
    this.meshLedge.instanceMatrix.needsUpdate = true
    scene.add(this.meshLedge)
  }

  addBillboardScreens(scene: THREE.Scene) {
    const SIGN_PER_MESH = 20

    const makeCanvas = (draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture => {
      const cvs = document.createElement('canvas')
      cvs.width = 512; cvs.height = 256
      const ctx = cvs.getContext('2d')!
      draw(ctx)
      return new THREE.CanvasTexture(cvs)
    }

    // Design 1: Cyan circuit schematic
    const tex0 = makeCanvas(ctx => {
      ctx.fillStyle = '#000'; ctx.fillRect(0,0,512,256)
      ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 2
      for (let i=0;i<6;i++) { ctx.beginPath(); ctx.moveTo(20,30+i*36); ctx.lineTo(492,30+i*36); ctx.stroke() }
      ctx.fillStyle = '#00f5ff'
      for (let i=0;i<8;i++) for (let j=0;j<5;j++) {
        ctx.beginPath(); ctx.arc(40+i*60, 30+j*36, 5, 0, Math.PI*2); ctx.fill()
      }
      ctx.font = 'bold 32px monospace'; ctx.fillStyle = '#00f5ff88'; ctx.textAlign='center'
      ctx.fillText('SYSTEM ONLINE', 256, 230)
    })

    // Design 2: Magenta DANGER bilingual
    const tex1 = makeCanvas(ctx => {
      ctx.fillStyle = '#000'; ctx.fillRect(0,0,512,256)
      ctx.fillStyle = '#ff00aa18'
      for (let i=-4;i<20;i+=2) { ctx.beginPath(); ctx.moveTo(i*30,0); ctx.lineTo(i*30+30,0); ctx.lineTo(i*30+30+256,256); ctx.lineTo(i*30+256,256); ctx.closePath(); ctx.fill() }
      ctx.strokeStyle = '#ff00aa'; ctx.lineWidth = 3; ctx.strokeRect(6,6,500,244)
      ctx.fillStyle = '#ff00aa'; ctx.font = 'bold 56px monospace'; ctx.textAlign='center'
      ctx.fillText('DANGER', 256, 110)
      ctx.font = 'bold 42px serif'
      ctx.fillText('危険区域', 256, 180)
      ctx.font = '18px monospace'; ctx.fillStyle = '#ff00aa88'
      ctx.fillText('AUTHORIZED PERSONNEL ONLY', 256, 230)
    })

    // Design 3: Amber stock/price ticker
    const tex2 = makeCanvas(ctx => {
      ctx.fillStyle = '#0a0500'; ctx.fillRect(0,0,512,256)
      ctx.fillStyle = '#ff8800'; ctx.font='bold 28px monospace'; ctx.textAlign='left'
      const rows = ['GPU-X  \u25b2 4821.3', 'NET-7  \u25bc 219.08', 'SYS-4  \u25b2 1104.7', 'AI-12  \u25b2 8820.0', 'HRD-3  \u25bc  553.2']
      rows.forEach((r,i) => ctx.fillText(r, 20, 48+i*44))
      ctx.strokeStyle = '#ff8800'; ctx.lineWidth = 2; ctx.strokeRect(6,6,500,244)
      ctx.fillStyle = '#ff880044'; ctx.fillRect(6,6,500,30)
      ctx.fillStyle = '#ff8800'; ctx.font='bold 22px monospace'; ctx.textAlign='center'
      ctx.fillText('\u25c8 NEON DISTRICT EXCHANGE \u25c8', 256, 26)
    })

    // Design 4: White/blue tech corp hexagons
    const tex3 = makeCanvas(ctx => {
      ctx.fillStyle = '#000510'; ctx.fillRect(0,0,512,256)
      ctx.strokeStyle = '#4488ff'; ctx.lineWidth = 2
      for (let r=20;r<110;r+=22) {
        ctx.beginPath()
        for (let a=0;a<6;a++) { const ang=a*Math.PI/3-Math.PI/6; const x=256+Math.cos(ang)*r; const y=128+Math.sin(ang)*r; a===0?ctx.moveTo(x,y):ctx.lineTo(x,y) }
        ctx.closePath(); ctx.stroke()
      }
      ctx.fillStyle = '#4488ff'; ctx.font='bold 22px monospace'; ctx.textAlign='center'
      ctx.fillText('NEXUS CORP', 256, 220)
      ctx.font='14px monospace'; ctx.fillStyle='#4488ff88'
      ctx.fillText('EST. 2047  |  SECTOR 7', 256, 248)
    })

    // Design 5: Green matrix cascade
    const tex4 = makeCanvas(ctx => {
      ctx.fillStyle = '#000a00'; ctx.fillRect(0,0,512,256)
      ctx.fillStyle = '#00ff44'; ctx.font='12px monospace'
      for (let c=0;c<32;c++) for (let r=0;r<16;r++) {
        if (Math.random()>0.45) ctx.fillText(Math.random()>0.5?'1':'0', 8+c*16, 14+r*15)
      }
      ctx.fillStyle = '#00ff4422'; ctx.fillRect(0,0,512,256)
      ctx.strokeStyle = '#00ff44'; ctx.lineWidth = 2; ctx.strokeRect(4,4,504,248)
      ctx.fillStyle = '#00ff44'; ctx.font='bold 34px monospace'; ctx.textAlign='center'
      ctx.shadowBlur=16; ctx.shadowColor='#00ff44'
      ctx.fillText('MATRIX CORE', 256, 148)
      ctx.shadowBlur=0
    })

    // Design 6: Purple RESTRICTED ACCESS
    const tex5 = makeCanvas(ctx => {
      ctx.fillStyle = '#05000a'; ctx.fillRect(0,0,512,256)
      ctx.strokeStyle = '#aa00ff'; ctx.lineWidth = 3; ctx.strokeRect(6,6,500,244)
      ctx.strokeStyle = '#aa00ff66'; ctx.lineWidth = 1; ctx.strokeRect(16,16,480,224)
      ctx.fillStyle = '#aa00ff'; ctx.font='bold 40px monospace'; ctx.textAlign='center'
      ctx.shadowBlur=20; ctx.shadowColor='#aa00ff'
      ctx.fillText('RESTRICTED', 256, 100)
      ctx.fillText('ACCESS', 256, 155)
      ctx.shadowBlur=0
      ctx.font='16px monospace'; ctx.fillStyle='#aa00ff88'
      ctx.fillText('CLEARANCE LEVEL \u03a9 REQUIRED', 256, 220)
    })

    // Design 7: Red emergency alert
    const tex6 = makeCanvas(ctx => {
      ctx.fillStyle = '#0a0000'; ctx.fillRect(0,0,512,256)
      ctx.fillStyle = '#ff112244'
      ctx.fillRect(0,0,512,256)
      ctx.strokeStyle = '#ff1122'; ctx.lineWidth = 4; ctx.strokeRect(6,6,500,244)
      ctx.fillStyle = '#ff1122'; ctx.font='bold 80px monospace'; ctx.textAlign='center'
      ctx.fillText('\u26a0', 256, 140)
      ctx.font='bold 28px monospace'
      ctx.fillText('ALERT', 256, 200)
      ctx.font='14px monospace'; ctx.fillStyle='#ff112288'
      ctx.fillText('EMERGENCY BROADCAST ACTIVE', 256, 240)
    })

    // Design 8: Orange construction/industrial
    const tex7 = makeCanvas(ctx => {
      ctx.fillStyle = '#080400'; ctx.fillRect(0,0,512,256)
      ctx.fillStyle = '#ff8800'
      for (let i=-4;i<20;i+=2) { ctx.beginPath(); ctx.moveTo(i*28,0); ctx.lineTo(i*28+28,0); ctx.lineTo(i*28+28+256,256); ctx.lineTo(i*28+256,256); ctx.closePath(); ctx.fill() }
      ctx.fillStyle = '#080400'
      for (let i=-4;i<20;i+=2) { ctx.beginPath(); ctx.moveTo((i+1)*28,0); ctx.lineTo((i+1)*28+28,0); ctx.lineTo((i+1)*28+28+256,256); ctx.lineTo((i+1)*28+256,256); ctx.closePath(); ctx.fill() }
      ctx.fillStyle = '#ff8800'; ctx.font='bold 52px monospace'; ctx.textAlign='center'
      ctx.fillText('UNDER', 256, 110)
      ctx.fillText('CONSTRUCTION', 256, 175)
      ctx.font='16px monospace'; ctx.fillText('SECTOR 4 - ZONE B', 256, 230)
    })

    const textures = [tex0, tex1, tex2, tex3, tex4, tex5, tex6, tex7]
    const signGeo = new THREE.PlaneGeometry(1, 1)

    const signMeshes = textures.map(tex => {
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: false, side: THREE.DoubleSide })
      const m = new THREE.InstancedMesh(signGeo, mat, SIGN_PER_MESH)
      m.frustumCulled = false; m.count = 0
      return m
    })

    const signCounts = new Array(8).fill(0)
    const mtx2  = new THREE.Matrix4()
    const pos2  = new THREE.Vector3()
    const quat2 = new THREE.Quaternion()
    const scl2  = new THREE.Vector3()
    const yAxis = new THREE.Vector3(0, 1, 0)

    const total = 8 * SIGN_PER_MESH
    for (let i = 0; i < total; i++) {
      const meshIdx = i % 8
      const ci = signCounts[meshIdx]
      if (ci >= SIGN_PER_MESH) continue

      // Pick a real building from stored footprints — only ones tall enough
      const b = this.buildings[Math.floor(Math.random() * this.buildings.length)]
      const { wx, wz, fw, fd, h } = b
      if (h < 14) continue

      const face = Math.floor(Math.random() * 4)
      // Face width: ±Z faces are fw wide, ±X faces are fd wide
      const faceWidth = (face < 2) ? fw : fd
      const signW = rand(faceWidth * 0.5, faceWidth * 0.9)
      const signH = Math.min(rand(3, 8), h * 0.4)
      // Sign center Y: bottom ~10% to 60% of building, never higher than 20 units
      const signY = rand(signH * 0.5 + 1, Math.min(h * 0.55, 20))

      let px = wx, pz = wz, angle = 0
      if      (face === 0) { pz = wz + fd / 2 + 0.15; angle = 0 }
      else if (face === 1) { pz = wz - fd / 2 - 0.15; angle = Math.PI }
      else if (face === 2) { px = wx + fw / 2 + 0.15; angle = Math.PI / 2 }
      else                 { px = wx - fw / 2 - 0.15; angle = -Math.PI / 2 }

      pos2.set(px, signY, pz)
      quat2.setFromAxisAngle(yAxis, angle)
      scl2.set(signW, signH, 1)
      mtx2.compose(pos2, quat2, scl2)
      signMeshes[meshIdx].setMatrixAt(ci, mtx2)
      signCounts[meshIdx]++
    }

    for (let i = 0; i < 8; i++) {
      signMeshes[i].count = signCounts[i]
      signMeshes[i].instanceMatrix.needsUpdate = true
      scene.add(signMeshes[i])
    }
  }

  addRooftopEquipment(scene: THREE.Scene) {
    const darkMat = new THREE.MeshBasicMaterial({ color: 0x080810 })

    const boxGeo = new THREE.BoxGeometry(1, 1, 1)
    const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 8)
    const dishGeo = new THREE.CylinderGeometry(0.05, 1, 0.6, 12)

    const boxMesh = new THREE.InstancedMesh(boxGeo, darkMat.clone(), 200)
    const cylMesh = new THREE.InstancedMesh(cylGeo, darkMat.clone(), 200)
    const dishMesh = new THREE.InstancedMesh(dishGeo, darkMat.clone(), 200)
    boxMesh.frustumCulled = cylMesh.frustumCulled = dishMesh.frustumCulled = false

    let cBox = 0, cCyl = 0, cDish = 0
    const mtx = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()
    const quat = new THREE.Quaternion()

    for (const b of this.buildings) {
      const { wx, wz, fw, fd, h } = b
      if (h < 60 || Math.random() > 0.20) continue

      const count = randInt(1, 3)
      for (let e = 0; e < count; e++) {
        const ex = wx + rand(-fw*0.3, fw*0.3)
        const ez = wz + rand(-fd*0.3, fd*0.3)
        const roll = Math.random()

        if (roll < 0.5 && cBox < 200) {
          const bw = rand(2, 6), bh = rand(3, 8), bd = rand(2, 6)
          pos.set(ex, h + bh/2, ez); scl.set(bw, bh, bd)
          mtx.compose(pos, quat, scl)
          boxMesh.setMatrixAt(cBox++, mtx)
        } else if (roll < 0.8 && cCyl < 200) {
          const r = rand(1, 3), ch = rand(4, 10)
          pos.set(ex, h + ch/2, ez); scl.set(r*2, ch, r*2)
          mtx.compose(pos, quat, scl)
          cylMesh.setMatrixAt(cCyl++, mtx)
        } else if (cDish < 200) {
          const r = rand(2, 5)
          pos.set(ex, h + 0.3, ez); scl.set(r*2, 1, r*2)
          mtx.compose(pos, quat, scl)
          dishMesh.setMatrixAt(cDish++, mtx)
        }
      }
    }

    boxMesh.count = cBox; boxMesh.instanceMatrix.needsUpdate = true; scene.add(boxMesh)
    cylMesh.count = cCyl; cylMesh.instanceMatrix.needsUpdate = true; scene.add(cylMesh)
    dishMesh.count = cDish; dishMesh.instanceMatrix.needsUpdate = true; scene.add(dishMesh)
  }

  addSearchlights(scene: THREE.Scene) {
    // Open cone geometry pointing upward
    const geo = new THREE.CylinderGeometry(0.3, 2.5, 1, 6, 1, true)

    const configs = [
      { color: 0xffffff, opacity: 0.08, count: 34 },
      { color: 0x44ffff, opacity: 0.07, count: 26 },
      { color: 0xff44aa, opacity: 0.07, count: 20 },
    ]

    const mtx = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()
    const quat = new THREE.Quaternion()

    for (const cfg of configs) {
      const mat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: cfg.opacity,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const mesh = new THREE.InstancedMesh(geo, mat, cfg.count)
      mesh.frustumCulled = false

      for (let i = 0; i < cfg.count; i++) {
        const ix = randInt(0, GRID - 1)
        const iz = randInt(0, GRID - 1)
        const wx = ix * CELL - HALF
        const wz = iz * CELL - HALF
        const nx = (ix / GRID) * 4 - 2
        const nz = (iz / GRID) * 4 - 2
        const hf = Math.max(0.18, 1 - Math.sqrt(nx*nx + nz*nz) / 3 * 0.6)
        const h  = Math.max(8, (22 + fbm(nx, nz, 5) * 170) * hf) + rand(4, 28)
        // Place beam base at top of building, scale very tall
        pos.set(wx + rand(-2, 2), h + 150, wz + rand(-2, 2))
        scl.set(1, 300, 1)
        mtx.compose(pos, quat, scl)
        mesh.setMatrixAt(i, mtx)
      }
      mesh.instanceMatrix.needsUpdate = true
      scene.add(mesh)
    }
  }

  addAntennas(scene: THREE.Scene) {
    const geo = new THREE.CylinderGeometry(0.1, 0.1, 1, 4)
    const mat = new THREE.MeshBasicMaterial({ color: 0xff1133 })
    const mesh = new THREE.InstancedMesh(geo, mat, 400)
    mesh.frustumCulled = false

    const mtx = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    let count = 0

    for (let i = 0; i < 400; i++) {
      const ix = randInt(0, GRID - 1)
      const iz = randInt(0, GRID - 1)
      const wx = ix * CELL - HALF
      const wz = iz * CELL - HALF
      const nx = (ix / GRID) * 4 - 2
      const nz = (iz / GRID) * 4 - 2
      const hf = Math.max(0.18, 1 - Math.sqrt(nx*nx + nz*nz) / 3 * 0.6)
      const h  = Math.max(8, (22 + fbm(nx,nz,5) * 170) * hf) + 20
      const aH = rand(8, 30)
      pos.set(wx + rand(-3, 3), h + aH / 2, wz + rand(-3, 3))
      scl.set(1, aH, 1)
      mtx.compose(pos, quat, scl)
      mesh.setMatrixAt(count++, mtx)
    }
    mesh.count = count
    mesh.instanceMatrix.needsUpdate = true
    scene.add(mesh)
  }

  // Neon district label signs
  addNeonSigns(scene: THREE.Scene, labels: Array<{text: string; pos: THREE.Vector3; color: string}>) {
    labels.forEach(({ text, pos, color }) => {
      const cvs = document.createElement('canvas')
      cvs.width = 256; cvs.height = 64
      const ctx = cvs.getContext('2d')!
      ctx.clearRect(0, 0, 256, 64)
      ctx.fillStyle = color + '22'
      ctx.fillRect(0, 0, 256, 64)
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.strokeRect(2, 2, 252, 60)
      ctx.fillStyle = color
      ctx.font = 'bold 22px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(text, 128, 40)

      const tex = new THREE.CanvasTexture(cvs)
      const geo = new THREE.PlaneGeometry(18, 4.5)
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(pos)
      scene.add(mesh)
    })
  }

  update(t: number) {
    for (const m of this.mats) m.uniforms.uTime.value = t
  }
}
