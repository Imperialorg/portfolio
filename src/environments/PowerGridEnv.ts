import * as THREE from 'three'
import { Environment, makeLabelMesh } from './Environment'

// Section 7 — VajraGrid (Power Grid Security)
// Transmission towers + catenary lines + attack viz + defense rings
// World center: (100, 22, -10)
const CENTER = new THREE.Vector3(100, 22, -10)

const CATENARY_FRAG = `
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;
void main() {
  float pulse = 0.5 + 0.5 * sin(uTime * 2.0 - vUv.x * 6.0);
  vec3 col = mix(vec3(0.6, 0.6, 0.7), vec3(1.0, 0.8, 0.2), pulse * 0.3);
  float alpha = (1.0 - smoothstep(0.3, 0.5, abs(vUv.y - 0.5) * 2.0)) * uVisible;
  gl_FragColor = vec4(col, alpha * 0.9);
}
`

const ATTACK_FRAG = `
uniform float uTime;
uniform float uVisible;
uniform float uAttackT; // 0=idle, >0 = normalized attack progress
varying vec2 vUv;
void main() {
  // Expanding red ring with decay
  float ring = abs(length(vUv - vec2(0.5)) - uAttackT * 0.5);
  float glow = exp(-ring * 30.0) * (1.0 - uAttackT);
  vec3 col = vec3(1.0, 0.15, 0.15) * glow * 4.0;
  gl_FragColor = vec4(col, glow * uVisible);
}
`

const SHIELD_FRAG = `
uniform float uTime;
uniform float uVisible;
uniform float uLayer;   // 0-3 shield layer
varying vec2 vUv;
void main() {
  float r = length(vUv - vec2(0.5));
  float ringR = 0.45;
  float thickness = 0.04;
  float ring = 1.0 - smoothstep(0.0, thickness, abs(r - ringR));

  // Shield activates when attack happens: uLayer controls timing
  float t = fract(uTime * 0.3 - uLayer * 0.12);
  float active = smoothstep(0.1, 0.3, t) * (1.0 - smoothstep(0.5, 0.8, t));

  vec3 col = mix(vec3(0.8, 0.4, 0.0), vec3(0.2, 0.9, 1.0), uLayer / 3.0);
  gl_FragColor = vec4(col * ring * (0.3 + 0.7 * active), ring * active * 0.7 * uVisible);
}
`

const LIGHTNING_VERT = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const LIGHTNING_FRAG = `
uniform float uTime;
uniform float uVisible;
uniform float uFlash; // 0-1 flash intensity
void main() {
  float flicker = step(0.4, sin(uTime * 25.0));
  gl_FragColor = vec4(vec3(0.7, 0.9, 1.0) * uFlash * flicker, uFlash * flicker * uVisible);
}
`

function buildTransmissionTower(parent: THREE.Group, cx: number, cy: number, cz: number) {
  const metalMat = new THREE.MeshBasicMaterial({ color: 0x888899, wireframe: false })
  const darkMat = new THREE.MeshBasicMaterial({ color: 0x444455 })

  // Main vertical column (tapered)
  const col1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, 30, 6), darkMat)
  col1.position.set(cx, cy + 15, cz)
  parent.add(col1)

  // Cross arms at different heights
  const armHeights = [8, 14, 20, 26]
  const armWidths  = [8, 6, 4, 2.5]
  for (let i = 0; i < armHeights.length; i++) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, armWidths[i], 4), metalMat)
    arm.rotation.z = Math.PI / 2
    arm.position.set(cx, cy + armHeights[i], cz)
    parent.add(arm)
  }

  // Diagonal bracing
  const braceGeo = new THREE.CylinderGeometry(0.06, 0.06, 10, 4)
  const brace = new THREE.Mesh(braceGeo, metalMat)
  brace.rotation.z = Math.PI / 4
  brace.position.set(cx + 2, cy + 10, cz)
  parent.add(brace)

  // Insulators (small spheres at arm tips)
  const insMat = new THREE.MeshBasicMaterial({ color: 0x8899aa })
  for (const aw of armWidths) {
    for (const side of [-1, 1]) {
      const ins = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), insMat)
      ins.position.set(cx + side * aw / 2, cy + armHeights[armWidths.indexOf(aw)] - 0.5, cz)
      parent.add(ins)
    }
  }
}

function makeCatenary(a: THREE.Vector3, b: THREE.Vector3, sag: number, nSeg = 30): THREE.TubeGeometry {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= nSeg; i++) {
    const u = i / nSeg
    const p = a.clone().lerp(b, u)
    p.y -= sag * 4.0 * u * (1.0 - u)
    pts.push(p)
  }
  const curve = new THREE.CatmullRomCurve3(pts)
  return new THREE.TubeGeometry(curve, nSeg, 0.08, 6, false)
}

export class PowerGridEnv extends Environment {
  private mats: THREE.ShaderMaterial[] = []
  private lightningMat!: THREE.ShaderMaterial
  private lightningGeo!: THREE.BufferGeometry
  private lightningLine!: THREE.Line
  private lightningTimer = 0
  private flashIntensity = 0
  private attackPlane!: THREE.Mesh
  private attackMat!: THREE.ShaderMaterial
  private shieldMats: THREE.ShaderMaterial[] = []

  create(scene: THREE.Scene) {
    scene.add(this.group)

    // 6 towers in a ring
    const towerPositions: [number, number, number][] = [
      [CENTER.x - 22, CENTER.y - 6, CENTER.z - 12],
      [CENTER.x - 8,  CENTER.y - 6, CENTER.z - 20],
      [CENTER.x + 10, CENTER.y - 6, CENTER.z - 16],
      [CENTER.x + 20, CENTER.y - 6, CENTER.z + 4],
      [CENTER.x + 6,  CENTER.y - 6, CENTER.z + 18],
      [CENTER.x - 14, CENTER.y - 6, CENTER.z + 14],
    ]

    for (const [x, y, z] of towerPositions) {
      buildTransmissionTower(this.group, x, y, z)
    }

    // Catenary power lines between adjacent towers
    const catenarySeg = 30
    const catenarMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: CATENARY_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 } },
      transparent: true,
    })
    this.mats.push(catenarMat)

    for (let i = 0; i < towerPositions.length; i++) {
      const [x1,y1,z1] = towerPositions[i]
      const [x2,y2,z2] = towerPositions[(i + 1) % towerPositions.length]
      const a = new THREE.Vector3(x1, y1 + 20, z1)
      const b = new THREE.Vector3(x2, y2 + 20, z2)
      for (let w = 0; w < 3; w++) {
        const aOff = a.clone().add(new THREE.Vector3(w * 0.6 - 0.6, 0, 0))
        const bOff = b.clone().add(new THREE.Vector3(w * 0.6 - 0.6, 0, 0))
        const cGeo = makeCatenary(aOff, bOff, 2.5, catenarySeg)
        this.group.add(new THREE.Mesh(cGeo, catenarMat))
      }
    }

    // Attack expanding ring (a large plane at center)
    this.attackMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: ATTACK_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 }, uAttackT: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
    this.attackPlane = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), this.attackMat)
    this.attackPlane.rotation.x = -Math.PI / 2
    this.attackPlane.position.set(CENTER.x, CENTER.y - 4, CENTER.z)
    this.group.add(this.attackPlane)
    this.mats.push(this.attackMat)

    // 4-layer defense rings
    for (let i = 0; i < 4; i++) {
      const mat = new THREE.ShaderMaterial({
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: SHIELD_FRAG,
        uniforms: { uTime: { value: 0 }, uVisible: { value: 0 }, uLayer: { value: i } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
      const radius = 10 + i * 5
      const shield = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), mat)
      shield.rotation.x = -Math.PI / 2
      shield.position.set(CENTER.x, CENTER.y - 3 + i * 0.5, CENTER.z)
      this.group.add(shield)
      this.shieldMats.push(mat)
    }

    // Lightning line (reusable geometry)
    this.lightningGeo = new THREE.BufferGeometry()
    this.lightningGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(20 * 3), 3))
    this.lightningMat = new THREE.ShaderMaterial({
      vertexShader: LIGHTNING_VERT,
      fragmentShader: LIGHTNING_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 }, uFlash: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.lightningLine = new THREE.Line(this.lightningGeo, this.lightningMat)
    this.group.add(this.lightningLine)

    // Label
    const lbl = makeLabelMesh('VAJRAGRID', 'Power Grid Cybersecurity — 4-Layer Shield', '#ff6b00')
    lbl.position.set(CENTER.x, CENTER.y + 22, CENTER.z)
    lbl.scale.setScalar(4.5)
    this.group.add(lbl)

    const recLbl = makeLabelMesh('RECOVERY: 16s', 'India Innovates 2026 — Exhibited', '#ffcc00')
    recLbl.position.set(CENTER.x + 20, CENTER.y + 14, CENTER.z)
    recLbl.scale.setScalar(3)
    this.group.add(recLbl)
  }

  private regenerateLightning(t1: [number,number,number], t2: [number,number,number]) {
    const [x1,y1,z1] = t1
    const [x2,y2,z2] = t2
    const pos = this.lightningGeo.attributes.position as THREE.BufferAttribute
    const N = 20
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1)
      const jitter = (1 - Math.abs(u - 0.5) * 2) * 3
      pos.setXYZ(
        i,
        x1 + (x2 - x1) * u + (Math.random() - 0.5) * jitter,
        (y1 + 20) + ((y2 + 20) - (y1 + 20)) * u + (Math.random() - 0.5) * jitter,
        z1 + (z2 - z1) * u + (Math.random() - 0.5) * jitter
      )
    }
    pos.needsUpdate = true
  }

  update(t: number) {
    for (const m of this.mats) m.uniforms.uTime.value = t
    for (const m of this.shieldMats) m.uniforms.uTime.value = t
    this.lightningMat.uniforms.uTime.value = t

    // Attack cycle: every ~4s
    this.lightningTimer += 1 / 60
    if (this.lightningTimer > 4.0) {
      this.lightningTimer = 0
      this.flashIntensity = 1.0
      // Connect two random adjacent towers
      const towerPositions: [number,number,number][] = [
        [CENTER.x - 22, CENTER.y - 6, CENTER.z - 12],
        [CENTER.x + 20, CENTER.y - 6, CENTER.z + 4],
      ]
      this.regenerateLightning(towerPositions[0], towerPositions[1])
      this.attackMat.uniforms.uAttackT.value = 0
    }

    // Fade flash over 0.5s
    this.flashIntensity = Math.max(0, this.flashIntensity - 1 / 30)
    this.lightningMat.uniforms.uFlash.value = this.flashIntensity

    // Advance attack ring
    const at = this.attackMat.uniforms.uAttackT
    if (at.value < 1.0) at.value += 0.004
  }

  protected setVisible(v: number) {
    for (const m of this.mats) m.uniforms.uVisible.value = v
    for (const m of this.shieldMats) m.uniforms.uVisible.value = v
    this.lightningMat.uniforms.uVisible.value = v
  }

  onHover() {}
}
