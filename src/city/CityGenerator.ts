import * as THREE from 'three'
import { fbm, rand, randInt } from '../utils/noise'
import { buildingVert, buildingFrag } from '../shaders/index'

const GRID = 28       // city grid size (28x28 blocks)
const BLOCK = 18      // block size in world units
const GAP = 4         // road gap between blocks
const CELL = BLOCK + GAP

// Neon color palette per district
const NEON_PALETTES = [
  new THREE.Color(0x00f5ff),  // cyan  — GPU district
  new THREE.Color(0xff00aa),  // magenta — AI district
  new THREE.Color(0xff6b1a),  // orange — web district
  new THREE.Color(0x7b2fff),  // purple — systems
  new THREE.Color(0x00ff88),  // green — open source
  new THREE.Color(0xffe642),  // yellow — hackathon
]

export class CityGenerator {
  mesh!: THREE.InstancedMesh
  private count = 0

  generate(scene: THREE.Scene) {
    const maxBuildings = GRID * GRID
    const geometry = new THREE.BoxGeometry(1, 1, 1)

    // Per-instance attributes
    const heights = new Float32Array(maxBuildings)
    const neonColors = new Float32Array(maxBuildings * 3)

    const material = new THREE.RawShaderMaterial({
      vertexShader: buildingVert,
      fragmentShader: buildingFrag,
      uniforms: {
        uTime: { value: 0 },
        uFogColor: { value: new THREE.Color(0x030318) },
        uFogDensity: { value: 0.8 },
      },
      glslVersion: THREE.GLSL3,
    })

    // Add custom attributes to geometry
    geometry.setAttribute('aHeight', new THREE.BufferAttribute(heights, 1))
    geometry.setAttribute('aNeonColor', new THREE.BufferAttribute(neonColors, 3))

    this.mesh = new THREE.InstancedMesh(geometry, material, maxBuildings)
    this.mesh.castShadow = false
    this.mesh.receiveShadow = false

    const matrix = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const scale = new THREE.Vector3()
    const quat = new THREE.Quaternion()

    const half = (GRID / 2) * CELL

    for (let ix = 0; ix < GRID; ix++) {
      for (let iz = 0; iz < GRID; iz++) {
        const wx = ix * CELL - half
        const wz = iz * CELL - half

        // Skip road intersections (every 4 blocks create a major avenue)
        const isAvenue = (ix % 4 === 0) || (iz % 4 === 0)
        const isSideStreet = (ix % 2 === 0) && (iz % 2 === 0) && !isAvenue
        if (isAvenue || (isSideStreet && Math.random() < 0.3)) continue

        // Height from fbm noise — tallest near center, shorter at edges
        const nx = (ix / GRID) * 4 - 2
        const nz = (iz / GRID) * 4 - 2
        const noiseVal = fbm(nx, nz, 5)
        const distFromCenter = Math.sqrt(nx * nx + nz * nz) / 3
        const heightFactor = Math.max(0, 1 - distFromCenter * 0.7)
        const h = (20 + noiseVal * 180) * heightFactor + rand(5, 30)

        // Footprint variation
        const fw = rand(BLOCK * 0.4, BLOCK * 0.95)
        const fd = rand(BLOCK * 0.4, BLOCK * 0.95)

        // District-based neon color (determined by grid quadrant)
        const qx = Math.floor(ix / (GRID / 3))
        const qz = Math.floor(iz / (GRID / 3))
        const paletteIdx = (qx * 3 + qz) % NEON_PALETTES.length
        const neon = NEON_PALETTES[paletteIdx]

        heights[this.count] = h
        neonColors[this.count * 3] = neon.r
        neonColors[this.count * 3 + 1] = neon.g
        neonColors[this.count * 3 + 2] = neon.b

        pos.set(wx, h / 2, wz)
        scale.set(fw, h, fd)
        matrix.compose(pos, quat, scale)
        this.mesh.setMatrixAt(this.count, matrix)
        this.count++
      }
    }

    this.mesh.count = this.count
    this.mesh.instanceMatrix.needsUpdate = true

    // Also update custom attributes
    const heightAttr = geometry.getAttribute('aHeight') as THREE.BufferAttribute
    const neonAttr = geometry.getAttribute('aNeonColor') as THREE.BufferAttribute
    heightAttr.needsUpdate = true
    neonAttr.needsUpdate = true

    scene.add(this.mesh)
    return this.mesh
  }

  addAntennas(scene: THREE.Scene) {
    // Thin antenna towers on top of some buildings
    const antGeo = new THREE.CylinderGeometry(0.15, 0.15, 1, 4)
    const antMat = new THREE.MeshBasicMaterial({ color: 0xff3333 })
    const antMesh = new THREE.InstancedMesh(antGeo, antMat, 300)

    const matrix = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const scale = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const half = (GRID / 2) * CELL
    let count = 0

    for (let i = 0; i < 300 && count < 300; i++) {
      const ix = randInt(0, GRID - 1)
      const iz = randInt(0, GRID - 1)
      const wx = ix * CELL - half
      const wz = iz * CELL - half
      const nx = (ix / GRID) * 4 - 2
      const nz = (iz / GRID) * 4 - 2
      const noiseVal = fbm(nx, nz, 5)
      const h = (20 + noiseVal * 180) * Math.max(0, 1 - Math.sqrt(nx * nx + nz * nz) / 3 * 0.7) + 20
      const antH = rand(8, 25)
      pos.set(wx + rand(-4, 4), h + antH / 2, wz + rand(-4, 4))
      scale.set(1, antH, 1)
      matrix.compose(pos, quat, scale)
      antMesh.setMatrixAt(count, matrix)
      count++
    }

    antMesh.count = count
    antMesh.instanceMatrix.needsUpdate = true
    scene.add(antMesh)
  }

  update(time: number) {
    const mat = this.mesh.material as THREE.RawShaderMaterial
    mat.uniforms.uTime.value = time
  }
}
