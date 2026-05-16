import * as THREE from 'three'
import { Environment, makeFloatingLabel, showProjectPanel } from './Environment'
import { PROJECTS } from '../sections/data'

// Section 7 — VajraGrid (Power Grid Cybersecurity)
// Holographic topology map: substations as hex nodes, power lines as data flows,
// cyberattack spreading + 4-layer defense shields activating
const CENTER = new THREE.Vector3(100, 22, -10)

// ── substation hex node ──────────────────────────────────────────────────────
const NODE_VERT = `
attribute float aState;   // 0=normal, 1=infected, 2=defended
attribute float aPhase;
varying float vState;
varying float vPhase;
void main() {
  vState = aState;
  vPhase = aPhase;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 22.0 + 10.0 * step(0.5, aState);
}
`
const NODE_FRAG = `
uniform float uTime;
uniform float uVisible;
varying float vState;
varying float vPhase;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float ring  = 1.0 - smoothstep(0.33, 0.50, d);
  float core  = 1.0 - smoothstep(0.05, 0.18, d);
  float pulse = 0.6 + 0.4 * sin(uTime * 2.0 + vPhase);
  // normal=cyan, infected=red, defended=orange
  vec3 col = vState < 0.5 ? vec3(0.0, 0.9, 1.0)
           : vState < 1.5 ? vec3(1.0, 0.1, 0.15)
                           : vec3(1.0, 0.55, 0.0);
  float alpha = (ring * 0.5 + core * 1.8) * pulse * uVisible;
  gl_FragColor = vec4(col, alpha);
}
`

// ── power line / data flow between nodes ────────────────────────────────────
const LINE_VERT = `
attribute float aLinePhase;
varying float vLinePhase;
void main() {
  vLinePhase = aLinePhase;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const LINE_FRAG = `
uniform float uTime;
uniform float uVisible;
varying float vLinePhase;
void main() {
  float t     = fract(uTime * 0.5 + vLinePhase);
  float pulse = exp(-abs(t - 0.5) * 10.0);
  vec3 col    = mix(vec3(0.0, 0.5, 0.9), vec3(0.8, 1.0, 1.0), pulse);
  gl_FragColor = vec4(col, (0.2 + 0.8 * pulse * 1.3) * uVisible);
}
`

// ── attack infection wave (radial on floor plane) ────────────────────────────
const ATTACK_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`
const ATTACK_FRAG = `
uniform float uTime;
uniform float uVisible;
uniform float uWave;      // 0→1 normalized wave radius
uniform vec2  uOrigin;    // uv origin of attack source (0.5,0.5 = center)
varying vec2 vUv;
void main() {
  float r    = length(vUv - uOrigin);
  float ring = abs(r - uWave * 0.55);
  float glow = exp(-ring * 28.0) * (1.0 - uWave * 0.8);
  // trailing ghost rings
  float ghost = exp(-abs(r - uWave * 0.4) * 18.0) * 0.25 * (1.0 - uWave);
  vec3 col = vec3(1.0, 0.08, 0.12) * (glow + ghost);
  gl_FragColor = vec4(col, (glow + ghost) * uVisible);
}
`

// ── defence shield rings ─────────────────────────────────────────────────────
const SHIELD_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`
const SHIELD_FRAG = `
uniform float uTime;
uniform float uLayer;
uniform float uVisible;
varying vec2 vUv;
void main() {
  float r         = length(vUv - 0.5);
  float ringR     = 0.44;
  float ring      = 1.0 - smoothstep(0.0, 0.035, abs(r - ringR));
  float t         = fract(uTime * 0.25 - uLayer * 0.1);
  float active    = smoothstep(0.0, 0.25, t) * (1.0 - smoothstep(0.55, 0.85, t));
  float scanAngle = atan(vUv.y - 0.5, vUv.x - 0.5);
  float scan      = 0.5 + 0.5 * sin(scanAngle * 6.0 - uTime * 2.0);
  vec3 col        = mix(vec3(0.9, 0.45, 0.0), vec3(0.0, 0.8, 1.0), uLayer / 3.0);
  col            *= ring * (0.4 + 0.6 * active * scan);
  gl_FragColor    = vec4(col, ring * active * 0.65 * uVisible);
}
`

// ── holographic floor grid ────────────────────────────────────────────────────
const GRID_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`
const GRID_FRAG = `
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;
void main() {
  vec2 g    = fract(vUv * 18.0);
  float line = step(0.94, g.x) + step(0.94, g.y);
  float dist = length(vUv - 0.5);
  float fade = 1.0 - smoothstep(0.2, 0.5, dist);
  float pulse = 0.6 + 0.4 * sin(uTime * 0.8 - dist * 6.0);
  vec3 col  = vec3(0.0, 0.55, 0.9) * line * fade * pulse;
  gl_FragColor = vec4(col, line * fade * 0.45 * uVisible);
}
`

// Substation world positions (ring + a few inner nodes)
const SUBSTATION_POSITIONS = [
  [ 0,  28], [ 16, 18], [ 22, -6], [ 11, -22],
  [-11, -22], [-22, -6], [-16, 18],            // outer ring (7)
  [ 0,   6], [ 8,  -8], [-8,  -8],            // inner triangle (3)
]

export class PowerGridEnv extends Environment {
  private nodeMat!:    THREE.ShaderMaterial
  private lineMat!:    THREE.ShaderMaterial
  private attackMat!:  THREE.ShaderMaterial
  private shieldMats:  THREE.ShaderMaterial[] = []
  private gridMat!:    THREE.ShaderMaterial

  private nodeStates!: Float32Array          // live state per node
  private nodeAttr!:   THREE.BufferAttribute

  private attackTimer  = 3.0                 // first attack in 3s
  private attackActive = false
  private attackWave   = 1.0                 // start fully expanded (invisible)
  private infectedNode = -1

  create(scene: THREE.Scene) {
    scene.add(this.group)

    // Holographic floor grid
    this.gridMat = new THREE.ShaderMaterial({
      vertexShader: GRID_VERT, fragmentShader: GRID_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 } },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    })
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), this.gridMat)
    grid.rotation.x = -Math.PI / 2
    grid.position.set(CENTER.x, CENTER.y - 6, CENTER.z)
    this.group.add(grid)

    // Substation nodes (Points)
    const N = SUBSTATION_POSITIONS.length
    const posArr    = new Float32Array(N * 3)
    this.nodeStates = new Float32Array(N)   // all 0 = normal
    const phases    = new Float32Array(N)

    SUBSTATION_POSITIONS.forEach(([x, z], i) => {
      posArr[i*3]   = CENTER.x + x
      posArr[i*3+1] = CENTER.y - 2
      posArr[i*3+2] = CENTER.z + z
      phases[i]     = Math.random() * Math.PI * 2
    })

    const nodeGeo = new THREE.BufferGeometry()
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
    this.nodeAttr = new THREE.BufferAttribute(this.nodeStates, 1)
    nodeGeo.setAttribute('aState', this.nodeAttr)
    nodeGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))

    this.nodeMat = new THREE.ShaderMaterial({
      vertexShader: NODE_VERT, fragmentShader: NODE_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    this.group.add(new THREE.Points(nodeGeo, this.nodeMat))

    // Power lines between substations (star from inner nodes + ring)
    const edges: [number, number][] = [
      [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],   // outer ring
      [7,0],[7,1],[7,6],                            // inner→outer
      [8,2],[8,3],[8,7],
      [9,4],[9,5],[9,7],
    ]

    const linePos: number[] = [], linePhases: number[] = []
    edges.forEach(([a, b]) => {
      const ai = a * 3, bi = b * 3
      linePos.push(posArr[ai], posArr[ai+1], posArr[ai+2])
      linePos.push(posArr[bi], posArr[bi+1], posArr[bi+2])
      const ph = Math.random()
      linePhases.push(ph, ph)
    })

    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position',   new THREE.BufferAttribute(new Float32Array(linePos), 3))
    lineGeo.setAttribute('aLinePhase', new THREE.BufferAttribute(new Float32Array(linePhases), 1))

    this.lineMat = new THREE.ShaderMaterial({
      vertexShader: LINE_VERT, fragmentShader: LINE_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    this.group.add(new THREE.LineSegments(lineGeo, this.lineMat))

    // Attack wave plane (flat, slightly above grid)
    this.attackMat = new THREE.ShaderMaterial({
      vertexShader: ATTACK_VERT, fragmentShader: ATTACK_FRAG,
      uniforms: {
        uTime: { value: 0 }, uVisible: { value: 0 },
        uWave: { value: 1.0 },                      // start invisible (expanded)
        uOrigin: { value: new THREE.Vector2(0.5, 0.5) },
      },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })
    const attackPlane = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), this.attackMat)
    attackPlane.rotation.x = -Math.PI / 2
    attackPlane.position.set(CENTER.x, CENTER.y - 5.5, CENTER.z)
    this.group.add(attackPlane)

    // 4-layer defence shields (vertical, around center)
    for (let i = 0; i < 4; i++) {
      const r = (i + 1) * 9
      const mat = new THREE.ShaderMaterial({
        vertexShader: SHIELD_VERT, fragmentShader: SHIELD_FRAG,
        uniforms: { uTime: { value: 0 }, uVisible: { value: 0 }, uLayer: { value: i } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      })
      const shield = new THREE.Mesh(new THREE.PlaneGeometry(r*2, r*2), mat)
      shield.rotation.x = -Math.PI / 2
      shield.position.set(CENTER.x, CENTER.y - 5 + i * 0.3, CENTER.z)
      this.group.add(shield)
      this.shieldMats.push(mat)
    }

    // Labels
  }

  update(t: number) {
    this.nodeMat.uniforms.uTime.value    = t
    this.lineMat.uniforms.uTime.value    = t
    this.attackMat.uniforms.uTime.value  = t
    this.gridMat.uniforms.uTime.value    = t
    this.shieldMats.forEach(m => m.uniforms.uTime.value = t)

    // Attack cycle: trigger every ~5s
    this.attackTimer -= 1 / 60
    if (!this.attackActive && this.attackTimer <= 0) {
      // Pick a random outer node to infect
      this.infectedNode = Math.floor(Math.random() * 7) // outer ring
      this.nodeStates[this.infectedNode] = 1.0          // infected (red)
      this.nodeAttr.needsUpdate = true
      this.attackWave = 0.0
      this.attackActive = true

      // Attack origin: map substation to uv (0-1) on the 60×60 floor plane
      const [sx, sz] = SUBSTATION_POSITIONS[this.infectedNode]
      this.attackMat.uniforms.uOrigin.value.set(
        0.5 + sx / 60,
        0.5 + sz / 60,
      )
    }

    if (this.attackActive) {
      this.attackWave += 0.003
      this.attackMat.uniforms.uWave.value = this.attackWave

      // Defend at wave ≈ 0.45 → turn node orange (defended)
      if (this.attackWave > 0.45 && this.infectedNode >= 0 && this.nodeStates[this.infectedNode] === 1.0) {
        this.nodeStates[this.infectedNode] = 2.0   // defended (orange)
        this.nodeAttr.needsUpdate = true
      }

      // Recover at wave ≈ 0.9
      if (this.attackWave >= 0.9) {
        if (this.infectedNode >= 0) {
          this.nodeStates[this.infectedNode] = 0.0  // back to normal
          this.nodeAttr.needsUpdate = true
          this.infectedNode = -1
        }
        this.attackActive = false
        this.attackTimer  = 5.0 + Math.random() * 3
      }
    }
  }

  protected setVisible(v: number) {
    this.nodeMat.uniforms.uVisible.value   = v
    this.lineMat.uniforms.uVisible.value   = v
    this.attackMat.uniforms.uVisible.value = v
    this.gridMat.uniforms.uVisible.value   = v
    this.shieldMats.forEach(m => m.uniforms.uVisible.value = v)
  }

  onHover() {}
}
