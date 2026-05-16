import * as THREE from 'three'
import { Environment, makeLabelMesh } from './Environment'

// Section 2 — PS3 Cell BE GPU Emulator
// Underground server room: racks + Cell chip hologram + data particles
// World center: (-80, -8, 38)
const CENTER = new THREE.Vector3(-80, -8, 38)

const RACK_FRAG = `
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;

float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5); }

void main() {
  // Rack body: dark metal
  vec3 col = vec3(0.06, 0.07, 0.10);

  // 1U blade rows
  float row = floor(vUv.y * 24.0);
  float rowFrac = fract(vUv.y * 24.0);

  // LED strip on each blade
  float ledX = fract(vUv.x * 8.0);
  float ledRow = mod(row, 2.0);

  // Flicker per blade
  float h = hash(vec2(row, 0.0));
  float flicker = 0.85 + 0.15 * sin(uTime * 3.0 + h * 12.0);
  float led = step(0.72, ledX) * step(ledX, 0.86) * step(0.08, rowFrac) * step(rowFrac, 0.28);
  vec3 ledColor = mix(vec3(0.0, 0.9, 0.2), vec3(0.9, 0.4, 0.0), step(h, 0.15));
  col += ledColor * led * flicker * 2.0;

  // Blade gap
  col *= 1.0 - step(0.9, rowFrac) * 0.5;

  // Glow edge
  col += vec3(0.0, 0.3, 0.15) * (1.0 - abs(vUv.x - 0.5) * 2.0) * 0.03;

  gl_FragColor = vec4(col, uVisible);
}
`

const CELL_VERT = `
attribute float aPhase;
varying float vPhase;
varying vec3 vPos;
void main() {
  vPhase = aPhase;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 4.0;
}
`

const CELL_FRAG = `
uniform float uTime;
uniform float uVisible;
varying float vPhase;
varying vec3 vPos;
void main() {
  float t = fract(uTime * 0.6 + vPhase);
  float alive = step(0.0, t) * step(t, 0.8);
  float fade = alive * sin(t * 3.14159);
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float circle = 1.0 - smoothstep(0.2, 0.5, d);
  vec3 col = mix(vec3(0.0, 0.9, 1.0), vec3(0.8, 0.3, 1.0), vPhase);
  gl_FragColor = vec4(col * circle * fade * 4.0, circle * fade * uVisible);
}
`

const FLOOR_FRAG = `
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;
void main() {
  vec2 grid = fract(vUv * 30.0);
  float lines = step(0.92, grid.x) + step(0.92, grid.y);
  float glow = lines * 0.6;
  vec3 col = vec3(0.0, 0.6, 0.4) * glow;
  col += vec3(0.01, 0.02, 0.04); // dark base
  gl_FragColor = vec4(col, uVisible);
}
`

export class ServerRoomEnv extends Environment {
  private mats: THREE.ShaderMaterial[] = []
  private particleMat!: THREE.ShaderMaterial

  create(scene: THREE.Scene) {
    scene.add(this.group)

    // Floor grating
    const floorGeo = new THREE.PlaneGeometry(60, 50)
    const floorMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: FLOOR_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 } },
      transparent: true,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(CENTER.x, CENTER.y - 6, CENTER.z)
    this.group.add(floor)
    this.mats.push(floorMat)

    // 8 server racks (2 rows × 4)
    const rackGeo = new THREE.BoxGeometry(4, 24, 6)
    const rackMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: RACK_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 } },
      transparent: true,
    })
    this.mats.push(rackMat)
    const rackPositions = [
      [-18,-9,10],[-12,-9,10],[-6,-9,10],[0,-9,10],
      [-18,-9,-10],[-12,-9,-10],[-6,-9,-10],[0,-9,-10],
    ]
    for (const [x,y,z] of rackPositions) {
      const rack = new THREE.Mesh(rackGeo, rackMat)
      rack.position.set(CENTER.x + x, CENTER.y + y + 10, CENTER.z + z)
      this.group.add(rack)
    }

    // Ceiling strips of light
    const stripGeo = new THREE.PlaneGeometry(40, 0.4)
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa, transparent: true })
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(stripGeo, stripMat.clone())
      s.rotation.x = Math.PI / 2
      s.position.set(CENTER.x - 9, CENTER.y + 5, CENTER.z - 8 + i * 8)
      this.group.add(s)
    }

    // Cell BE hologram: PPE center + 6 SPE hexagons
    this.buildCellHologram()

    // Data flow particles between SPEs
    this.buildParticles()

    // Label
  }

  private buildCellHologram() {
    const CENTER_H = new THREE.Vector3(CENTER.x + 14, CENTER.y + 2, CENTER.z)
    // PPE core
    const ppeMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, wireframe: true, transparent: true })
    const ppe = new THREE.Mesh(new THREE.OctahedronGeometry(2.5, 1), ppeMat)
    ppe.position.copy(CENTER_H)
    this.group.add(ppe)

    // 6 SPE hexagons at 60° increments
    const speMat = new THREE.MeshBasicMaterial({ color: 0x39ff14, wireframe: true, transparent: true })
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const spe = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.4, 6), speMat.clone())
      spe.position.set(
        CENTER_H.x + Math.cos(angle) * 6,
        CENTER_H.y,
        CENTER_H.z + Math.sin(angle) * 6
      )
      this.group.add(spe)
    }
  }

  private buildParticles() {
    const N = 200
    const positions = new Float32Array(N * 3)
    const phases = new Float32Array(N)

    // Distribute particles along radial spoke paths (PPE→SPE)
    const CENTER_H = new THREE.Vector3(CENTER.x + 14, CENTER.y + 2, CENTER.z)
    for (let i = 0; i < N; i++) {
      const spoke = i % 6
      const angle = (spoke / 6) * Math.PI * 2
      const t = Math.random()
      positions[i*3]   = CENTER_H.x + Math.cos(angle) * 6 * t
      positions[i*3+1] = CENTER_H.y + (Math.random() - 0.5) * 0.5
      positions[i*3+2] = CENTER_H.z + Math.sin(angle) * 6 * t
      phases[i] = Math.random()
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))

    this.particleMat = new THREE.ShaderMaterial({
      vertexShader: CELL_VERT,
      fragmentShader: CELL_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const pts = new THREE.Points(geo, this.particleMat)
    this.group.add(pts)
  }

  update(t: number) {
    for (const m of this.mats) {
      if (m.uniforms?.uTime) m.uniforms.uTime.value = t
    }
    if (this.particleMat) this.particleMat.uniforms.uTime.value = t
  }

  protected setVisible(v: number) {
    for (const m of this.mats) {
      (m as any).uniforms.uVisible.value = v
    }
    if (this.particleMat) this.particleMat.uniforms.uVisible.value = v
    // Also fade ceiling strips (MeshBasicMaterial, no uniforms)
    this.group.traverse(o => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as any
      if (mat && mat.color && !mat.uniforms) mat.opacity = v
    })
  }

  onHover() {}
}
