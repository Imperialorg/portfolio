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
  private mats: THREE.ShaderMaterial[] = []

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

    const mtx  = new THREE.Matrix4()
    const pos  = new THREE.Vector3()
    const scl  = new THREE.Vector3()
    const quat = new THREE.Quaternion()

    let cLow = 0, cMid = 0, cTop = 0, cD = 0

    // Rooftop glow discs (up to 34 per color)
    const discGeo = new THREE.CylinderGeometry(1, 1, 0.3, 16)
    const discMeshes: THREE.InstancedMesh[] = []
    const DISC_COLORS = [0x00f5ff, 0xff00aa, 0xff6b1a, 0x7b2fff, 0x00ff88, 0xffe642]
    for (const col of DISC_COLORS) {
      const discMat = new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
      const dm = new THREE.InstancedMesh(discGeo, discMat, 34)
      dm.frustumCulled = false
      dm.count = 0
      discMeshes.push(dm)
    }
    const discCounts = new Int32Array(DISC_COLORS.length)

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

        // Rooftop glow disc — 15% chance
        if (Math.random() < 0.15) {
          const colorIdx = di % DISC_COLORS.length
          const dm = discMeshes[colorIdx]
          const ci = discCounts[colorIdx]
          if (ci < 34) {
            const discR = fw * 0.6
            pos.set(wx, h, wz); scl.set(discR, 1, discR)
            mtx.compose(pos, quat, scl)
            dm.setMatrixAt(ci, mtx)
            discCounts[colorIdx]++
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

    // Add rooftop glow discs
    for (let i = 0; i < discMeshes.length; i++) {
      discMeshes[i].count = discCounts[i]
      discMeshes[i].instanceMatrix.needsUpdate = true
      scene.add(discMeshes[i])
    }
  }

  addFacadeSigns(scene: THREE.Scene) {
    // Atlas: 512×384, 2 cols × 3 rows, each tile 256×128
    const ATLAS_W = 512, ATLAS_H = 384
    const TILE_W  = 256, TILE_H  = 128

    const cvs = document.createElement('canvas')
    cvs.width = ATLAS_W; cvs.height = ATLAS_H
    const ctx = cvs.getContext('2d')!

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, ATLAS_W, ATLAS_H)

    const drawTile = (
      col: number, row: number,
      draw: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void
    ) => {
      const tx = col * TILE_W, ty = row * TILE_H
      ctx.save()
      ctx.beginPath(); ctx.rect(tx, ty, TILE_W, TILE_H); ctx.clip()
      draw(ctx, tx, ty, TILE_W, TILE_H)
      ctx.restore()
    }

    // Style 1: Cyan circuit board
    drawTile(0, 0, (c, x, y, w, h) => {
      c.strokeStyle = '#00f5ff'; c.lineWidth = 1.5
      for (let i = 0; i < 6; i++) {
        const ly = y + 18 + i * 16
        c.beginPath(); c.moveTo(x + 10, ly); c.lineTo(x + w - 10, ly); c.stroke()
      }
      c.fillStyle = '#00f5ff'
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 3; j++) {
          const cx2 = x + 20 + i * 28, cy2 = y + 26 + j * 34
          c.beginPath(); c.arc(cx2, cy2, 3, 0, Math.PI * 2); c.fill()
          c.beginPath(); c.arc(cx2, cy2, 7, 0, Math.PI * 2); c.stroke()
        }
      }
    })

    // Style 2: Magenta WARNING + diagonal stripes
    drawTile(1, 0, (c, x, y, w, h) => {
      c.fillStyle = '#ff00aa22'; c.fillRect(x, y, w, h)
      c.fillStyle = '#ff00aa44'
      for (let i = -4; i < 14; i += 2) {
        const sx = x + i * 24
        c.beginPath()
        c.moveTo(sx, y); c.lineTo(sx + 20, y)
        c.lineTo(sx + 20 + h, y + h); c.lineTo(sx + h, y + h)
        c.closePath(); c.fill()
      }
      c.fillStyle = '#ff00aa'; c.font = 'bold 26px monospace'; c.textAlign = 'center'
      c.fillText('WARNING', x + w / 2, y + h / 2 + 9)
      c.strokeStyle = '#ff00aa'; c.lineWidth = 2
      c.strokeRect(x + 4, y + 4, w - 8, h - 8)
    })

    // Style 3: Orange/amber kanji-style block characters
    drawTile(0, 1, (c, x, y, w, h) => {
      c.fillStyle = '#ff6b1a'; c.font = 'bold 40px serif'; c.textAlign = 'center'
      const chars = ['火', '電', '夜', '光']
      chars.forEach((ch, i) => c.fillText(ch, x + 28 + i * 52, y + 82))
      c.strokeStyle = '#ff6b1a88'; c.lineWidth = 1.5
      c.strokeRect(x + 4, y + 4, w - 8, h - 8)
    })

    // Style 4: Green matrix grid
    drawTile(1, 1, (c, x, y, w, h) => {
      c.strokeStyle = '#00ff8844'; c.lineWidth = 1
      for (let i = 0; i <= 16; i++) { const lx = x + i * (w / 16); c.beginPath(); c.moveTo(lx, y); c.lineTo(lx, y + h); c.stroke() }
      for (let i = 0; i <= 8;  i++) { const ly = y + i * (h / 8);  c.beginPath(); c.moveTo(x, ly); c.lineTo(x + w, ly); c.stroke() }
      c.fillStyle = '#00ff88'; c.font = '10px monospace'
      for (let r = 0; r < 8; r++) {
        for (let col = 0; col < 10; col++) {
          if (Math.random() > 0.55) c.fillText(Math.random() > 0.5 ? '1' : '0', x + 5 + col * 24, y + 14 + r * 14)
        }
      }
    })

    // Style 5: Red triangle warning patterns
    drawTile(0, 2, (c, x, y, w, h) => {
      const tris: [number, number][] = [[0.15, 0.2], [0.5, 0.2], [0.85, 0.2], [0.32, 0.72], [0.68, 0.72]]
      c.lineWidth = 2.5
      tris.forEach(([tx2, ty2]) => {
        const cx2 = x + tx2 * w, cy2 = y + ty2 * h, s = 22
        c.fillStyle = '#ff224422'; c.strokeStyle = '#ff2244'
        c.beginPath(); c.moveTo(cx2, cy2 - s); c.lineTo(cx2 + s, cy2 + s * 0.6); c.lineTo(cx2 - s, cy2 + s * 0.6); c.closePath()
        c.fill(); c.stroke()
        c.fillStyle = '#ff2244'; c.font = 'bold 14px monospace'; c.textAlign = 'center'
        c.fillText('!', cx2, cy2 + s * 0.35)
      })
    })

    // Style 6: Purple/violet abstract geometric
    drawTile(1, 2, (c, x, y, w, h) => {
      const cx2 = x + w / 2, cy2 = y + h / 2
      c.strokeStyle = '#9b30ff'; c.lineWidth = 2
      for (let r = 10; r < 58; r += 14) { c.beginPath(); c.arc(cx2, cy2, r, 0, Math.PI * 2); c.stroke() }
      for (let a = 0; a < 6; a++) {
        const angle = a * Math.PI / 3
        c.beginPath(); c.moveTo(cx2, cy2); c.lineTo(cx2 + Math.cos(angle) * 56, cy2 + Math.sin(angle) * 56); c.stroke()
      }
      c.strokeStyle = '#cc44ff'; c.lineWidth = 1.5
      c.strokeRect(x + 8, y + 8, w - 16, h - 16)
    })

    const atlas = new THREE.CanvasTexture(cvs)

    // Build a PlaneGeometry with UVs pre-baked for the given atlas tile
    const makeTileGeo = (col: number, row: number): THREE.PlaneGeometry => {
      const geo  = new THREE.PlaneGeometry(1, 1)
      const uMin = col * 0.5,         uMax = (col + 1) * 0.5
      const vMin = 1.0 - (row + 1) / 3.0, vMax = 1.0 - row / 3.0
      const uvAttr = geo.getAttribute('uv') as THREE.BufferAttribute
      // PlaneGeometry vertex order: 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right
      uvAttr.setXY(0, uMin, vMax); uvAttr.setXY(1, uMax, vMax)
      uvAttr.setXY(2, uMin, vMin); uvAttr.setXY(3, uMax, vMin)
      uvAttr.needsUpdate = true
      return geo
    }

    const signMat = new THREE.MeshBasicMaterial({
      map: atlas, transparent: true,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    })

    const SIGN_PER_MESH = 100
    const signGeos   = [makeTileGeo(0, 0), makeTileGeo(1, 0), makeTileGeo(0, 1)]
    const signMeshes = signGeos.map(geo => {
      const m = new THREE.InstancedMesh(geo, signMat.clone(), SIGN_PER_MESH)
      m.frustumCulled = false; m.count = 0
      return m
    })

    const signCounts = [0, 0, 0]
    const mtx2  = new THREE.Matrix4()
    const pos2  = new THREE.Vector3()
    const quat2 = new THREE.Quaternion()
    const scl2  = new THREE.Vector3()
    const yAxis = new THREE.Vector3(0, 1, 0)

    for (let i = 0; i < SIGN_PER_MESH * 3; i++) {
      const meshIdx = i % 3
      const ci = signCounts[meshIdx]
      if (ci >= SIGN_PER_MESH) continue

      const ix = randInt(1, GRID - 2)
      const iz = randInt(1, GRID - 2)
      const wx = ix * CELL - HALF
      const wz = iz * CELL - HALF
      const nx = (ix / GRID) * 4 - 2
      const nz = (iz / GRID) * 4 - 2
      const hf = Math.max(0.18, 1 - Math.sqrt(nx * nx + nz * nz) / 3 * 0.6)
      const h  = Math.max(8, (22 + fbm(nx, nz, 5) * 170) * hf) + rand(4, 28)
      const fw = rand(BLOCK * 0.42, BLOCK * 0.9)
      const fd = rand(BLOCK * 0.42, BLOCK * 0.9)

      const signW = rand(8, 20)
      const signH = rand(4, 10)
      const signY = rand(4, h * 0.7)

      // Place on one of 4 building faces
      const face = Math.floor(Math.random() * 4)
      let px = wx, pz = wz, angle = 0
      if      (face === 0) { pz = wz + fd / 2 + 0.5; angle = 0 }
      else if (face === 1) { pz = wz - fd / 2 - 0.5; angle = Math.PI }
      else if (face === 2) { px = wx + fw / 2 + 0.5; angle = Math.PI / 2 }
      else                 { px = wx - fw / 2 - 0.5; angle = -Math.PI / 2 }

      pos2.set(px, signY, pz)
      quat2.setFromAxisAngle(yAxis, angle)
      scl2.set(signW, signH, 1)
      mtx2.compose(pos2, quat2, scl2)
      signMeshes[meshIdx].setMatrixAt(ci, mtx2)
      signCounts[meshIdx]++
    }

    for (let i = 0; i < 3; i++) {
      signMeshes[i].count = signCounts[i]
      signMeshes[i].instanceMatrix.needsUpdate = true
      scene.add(signMeshes[i])
    }
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
