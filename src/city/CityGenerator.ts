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
  // 4 mesh types for visual variety
  meshA!: THREE.InstancedMesh  // box skyscrapers (60%)
  meshB!: THREE.InstancedMesh  // slim cylinder towers (20%)
  meshC!: THREE.InstancedMesh  // wide slab buildings (20%)
  meshD!: THREE.InstancedMesh  // needle towers (5% extra pass)
  private mats: THREE.ShaderMaterial[] = []

  generate(scene: THREE.Scene) {
    const MAX = GRID * GRID
    const mat = makeShaderMaterial()
    this.mats.push(mat)

    // ── Type A: Box skyscrapers ──────────────────────────
    const geoA = new THREE.BoxGeometry(1, 1, 1)
    const heightsA = new Float32Array(MAX)
    const colorsA  = new Float32Array(MAX * 3)
    geoA.setAttribute('aHeight',    new THREE.InstancedBufferAttribute(heightsA, 1))
    geoA.setAttribute('aNeonColor', new THREE.InstancedBufferAttribute(colorsA, 3))
    this.meshA = new THREE.InstancedMesh(geoA, mat.clone(), MAX)
    this.meshA.frustumCulled = false
    this.mats.push(this.meshA.material as THREE.ShaderMaterial)

    // ── Type B: Cylinder towers ──────────────────────────
    const geoB = new THREE.CylinderGeometry(0.45, 0.55, 1, 10)
    const heightsB = new Float32Array(MAX)
    const colorsB  = new Float32Array(MAX * 3)
    geoB.setAttribute('aHeight',    new THREE.InstancedBufferAttribute(heightsB, 1))
    geoB.setAttribute('aNeonColor', new THREE.InstancedBufferAttribute(colorsB, 3))
    this.meshB = new THREE.InstancedMesh(geoB, mat.clone(), MAX)
    this.meshB.frustumCulled = false
    this.mats.push(this.meshB.material as THREE.ShaderMaterial)

    // ── Type C: Wide slab buildings ──────────────────────
    const geoC = new THREE.BoxGeometry(1, 0.4, 1)  // flat wide base shape
    const heightsC = new Float32Array(MAX)
    const colorsC  = new Float32Array(MAX * 3)
    geoC.setAttribute('aHeight',    new THREE.InstancedBufferAttribute(heightsC, 1))
    geoC.setAttribute('aNeonColor', new THREE.InstancedBufferAttribute(colorsC, 3))
    this.meshC = new THREE.InstancedMesh(geoC, mat.clone(), MAX)
    this.meshC.frustumCulled = false
    this.mats.push(this.meshC.material as THREE.ShaderMaterial)

    // ── Type D: Needle towers ────────────────────────────
    const geoD = new THREE.BoxGeometry(1, 1, 1)
    const heightsD = new Float32Array(MAX)
    const colorsD  = new Float32Array(MAX * 3)
    geoD.setAttribute('aHeight',    new THREE.InstancedBufferAttribute(heightsD, 1))
    geoD.setAttribute('aNeonColor', new THREE.InstancedBufferAttribute(colorsD, 3))
    this.meshD = new THREE.InstancedMesh(geoD, mat.clone(), MAX)
    this.meshD.frustumCulled = false
    this.mats.push(this.meshD.material as THREE.ShaderMaterial)

    const mtx = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()
    const quat = new THREE.Quaternion()

    let cA = 0, cB = 0, cC = 0, cD = 0

    // Rooftop glow disc instances (up to 200)
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

        const di = cellToDistrict(ix, iz)
        const neon = DISTRICT_COLORS[di]

        // Assign type by random roll
        const roll = Math.random()
        if (roll < 0.65) {
          // Type A — box
          heightsA[cA] = h
          colorsA[cA*3]   = neon.r; colorsA[cA*3+1] = neon.g; colorsA[cA*3+2] = neon.b
          pos.set(wx, h / 2, wz); scl.set(fw, h, fd)
          mtx.compose(pos, quat, scl)
          this.meshA.setMatrixAt(cA, mtx); cA++
        } else if (roll < 0.82) {
          // Type B — cylinder
          const r = rand(BLOCK * 0.18, BLOCK * 0.32)
          heightsB[cB] = h
          colorsB[cB*3]   = neon.r; colorsB[cB*3+1] = neon.g; colorsB[cB*3+2] = neon.b
          pos.set(wx + rand(-3,3), h / 2, wz + rand(-3,3)); scl.set(r*2, h, r*2)
          mtx.compose(pos, quat, scl)
          this.meshB.setMatrixAt(cB, mtx); cB++
        } else {
          // Type C — wide slab
          const slabH = Math.max(6, h * 0.35)
          heightsC[cC] = slabH
          colorsC[cC*3]   = neon.r; colorsC[cC*3+1] = neon.g; colorsC[cC*3+2] = neon.b
          pos.set(wx, slabH / 2, wz); scl.set(fw * 1.4, slabH, fd * 1.4)
          mtx.compose(pos, quat, scl)
          this.meshC.setMatrixAt(cC, mtx); cC++
        }

        // Type D — needle tower (extra 5% pass, independent of main roll)
        if (Math.random() >= 0.95) {
          const nfw = rand(1.5, 4)
          const nfd = rand(1.5, 4)
          const nh  = h * 1.8
          heightsD[cD] = nh
          colorsD[cD*3]   = neon.r; colorsD[cD*3+1] = neon.g; colorsD[cD*3+2] = neon.b
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

    this.meshA.count = cA
    this.meshB.count = cB
    this.meshC.count = cC
    this.meshD.count = cD

    for (const mesh of [this.meshA, this.meshB, this.meshC, this.meshD]) {
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
