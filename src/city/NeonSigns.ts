import * as THREE from 'three'
import { neonSignVert, neonSignFrag } from '../shaders/index'

// Deterministic seeded RNG (mulberry32) — same layout every load
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SIGN_COLORS = [
  new THREE.Color(0xff2200),  // red
  new THREE.Color(0x00eeff),  // cyan
  new THREE.Color(0x0055ff),  // blue
  new THREE.Color(0xff00cc),  // magenta
  new THREE.Color(0x00ff66),  // green
  new THREE.Color(0xff6600),  // orange
  new THREE.Color(0xaa00ff),  // purple
  new THREE.Color(0xffe642),  // yellow
]

// Grid constants must match CityGenerator's layout
const GRID = 32
const BLOCK = 16
const GAP = 6
const CELL = BLOCK + GAP
const HALF = (GRID / 2) * CELL

export class NeonSigns {
  mesh!: THREE.InstancedMesh
  private mat!: THREE.ShaderMaterial

  create(scene: THREE.Scene) {
    const MAX = 150
    const geo = new THREE.PlaneGeometry(5, 1.4)

    // Per-instance attributes
    const colors       = new Float32Array(MAX * 3)
    const flickerSeeds = new Float32Array(MAX)
    const pulseModes   = new Float32Array(MAX)

    geo.setAttribute('aColor',       new THREE.InstancedBufferAttribute(colors,       3))
    geo.setAttribute('aFlickerSeed', new THREE.InstancedBufferAttribute(flickerSeeds, 1))
    geo.setAttribute('aPulseMode',   new THREE.InstancedBufferAttribute(pulseModes,   1))

    this.mat = new THREE.ShaderMaterial({
      vertexShader:   neonSignVert,
      fragmentShader: neonSignFrag,
      uniforms: { uTime: { value: 0 } },
      transparent:  true,
      depthWrite:   false,
      side:         THREE.DoubleSide,
      blending:     THREE.AdditiveBlending,
    })

    this.mesh = new THREE.InstancedMesh(geo, this.mat, MAX)
    this.mesh.frustumCulled = false

    const rng  = mulberry32(42)
    const mtx  = new THREE.Matrix4()
    const pos  = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scl  = new THREE.Vector3(1, 1, 1)
    let count = 0

    for (let ix = 0; ix < GRID && count < MAX; ix++) {
      for (let iz = 0; iz < GRID && count < MAX; iz++) {
        // Skip road columns — same logic as CityGenerator
        if (ix % 5 === 0 || iz % 5 === 0) continue
        // ~10% of building cells get a sign
        if (rng() > 0.10) continue

        const wx = ix * CELL - HALF
        const wz = iz * CELL - HALF

        // Vary sign height (lower half of building face)
        const wallH = 6 + rng() * 12

        // Pick which face (N/S/E/W) to hang the sign on
        const face   = Math.floor(rng() * 4)
        const outset = BLOCK * 0.5 + 0.3  // just past building face
        let sx = wx, sz = wz, ry = 0

        if      (face === 0) { sz = wz + outset; ry = 0 }
        else if (face === 1) { sz = wz - outset; ry = Math.PI }
        else if (face === 2) { sx = wx + outset; ry = Math.PI * 0.5 }
        else                 { sx = wx - outset; ry = -Math.PI * 0.5 }

        pos.set(sx, wallH, sz)
        quat.setFromEuler(new THREE.Euler(0, ry, 0))
        mtx.compose(pos, quat, scl)
        this.mesh.setMatrixAt(count, mtx)

        // Random color from palette
        const col = SIGN_COLORS[Math.floor(rng() * SIGN_COLORS.length)]
        colors[count * 3]     = col.r
        colors[count * 3 + 1] = col.g
        colors[count * 3 + 2] = col.b

        flickerSeeds[count] = rng()

        // 60% static, 25% pulse, 10% blink, 5% glitch
        const roll = rng()
        pulseModes[count] = roll < 0.60 ? 0 : roll < 0.85 ? 1 : roll < 0.95 ? 2 : 3

        count++
      }
    }

    this.mesh.count = count
    this.mesh.instanceMatrix.needsUpdate = true
    ;(geo.getAttribute('aColor')       as THREE.BufferAttribute).needsUpdate = true
    ;(geo.getAttribute('aFlickerSeed') as THREE.BufferAttribute).needsUpdate = true
    ;(geo.getAttribute('aPulseMode')   as THREE.BufferAttribute).needsUpdate = true

    scene.add(this.mesh)
  }

  update(t: number) {
    this.mat.uniforms.uTime.value = t
  }
}
