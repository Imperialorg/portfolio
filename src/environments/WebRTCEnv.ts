import * as THREE from 'three'
import { Environment, makeLabelMesh } from './Environment'

// Section 4 — GPU Streaming (NvFBC + NVENC + Selkies)
// Broadcast towers + signal rings + fiber optic path + encoding pipeline screen
// World center: (-10, 10, -80)
const CENTER = new THREE.Vector3(-10, 10, -80)

const FIBER_FRAG = `
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;

void main() {
  // Fiber optic tube: animated light pulse racing along it
  float t = fract(vUv.x * 3.0 - uTime * 1.2);
  float pulse = exp(-abs(t - 0.5) * 12.0);
  vec3 fiberBase = vec3(0.05, 0.05, 0.12);
  vec3 pulseColor = vec3(1.0, 0.2, 0.8);
  vec3 col = fiberBase + pulseColor * pulse * 8.0;
  // Glow around the tube body
  float radial = 1.0 - smoothstep(0.3, 0.5, abs(vUv.y - 0.5));
  col *= radial * 2.0;
  gl_FragColor = vec4(col, radial * uVisible);
}
`

const RING_VERT = `
uniform float uTime;
uniform float uScale;
void main() {
  vec3 pos = position * (1.0 + uScale * 0.3 + sin(uTime) * 0.05 * uScale);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const RING_FRAG = `
uniform float uTime;
uniform float uScale;
uniform float uVisible;
void main() {
  float fade = 1.0 - uScale * 0.28;
  float pulse = 0.5 + 0.5 * sin(uTime * 2.0 - uScale * 2.0);
  vec3 col = vec3(1.0, 0.1, 0.6) * (fade + 0.3 * pulse);
  gl_FragColor = vec4(col, fade * 0.7 * uVisible);
}
`

const ENCODE_FRAG = `
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;

float hash(float n){ return fract(sin(n)*43758.5); }

void main() {
  vec2 uv = vUv;
  // Screen background
  vec3 col = vec3(0.02, 0.04, 0.08);

  // Pipeline stages: 4 boxes
  int stage = int(floor(uv.x * 4.0));
  float stx = fract(uv.x * 4.0);
  float sty = uv.y;

  // Box borders
  float border = step(0.91, stx) + step(stx, 0.05) + step(0.88, sty) + step(sty, 0.08);
  vec3 stageColors[4];
  stageColors[0] = vec3(0.0, 0.9, 1.0);   // Capture
  stageColors[1] = vec3(1.0, 0.4, 0.0);   // NVENC
  stageColors[2] = vec3(0.8, 0.2, 1.0);   // RTP stream
  stageColors[3] = vec3(0.2, 1.0, 0.4);   // Browser decode

  vec3 stCol = vec3(0.0);
  for(int i=0;i<4;i++) stCol += stageColors[i] * float(i==stage ? 1:0);

  float active = 0.3 + 0.7 * (0.5 + 0.5 * sin(uTime * 2.0 - float(stage) * 1.5));
  col = mix(col, stCol * active, border * 0.6 + 0.15);

  // Data packet arrow
  float pkt = fract(uTime * 0.35) * 4.0;
  float pktStage = floor(pkt);
  float inStage = float(stage) == pktStage ? 1.0 : 0.0;
  float arrowX = fract(pkt);
  float arrow = inStage * step(0.4, arrowX) * step(arrowX, 0.55);
  col += vec3(1.0) * arrow * 2.0;

  // Label scanlines
  col += vec3(0.0, 0.2, 0.1) * step(0.95, fract(uv.y * 30.0));

  // Latency readout: blink "< 1 FRAME" green
  float inHUD = step(0.0, uv.y - 0.88) * step(uv.y, 1.0) * step(0.25, uv.x) * step(uv.x, 0.75);
  float blink = step(0.4, sin(uTime * 1.5) * 0.5 + 0.5);
  col = mix(col, vec3(0.0, 1.0, 0.3) * blink, inHUD * 0.8);

  gl_FragColor = vec4(col, uVisible);
}
`

function buildTower(scene: THREE.Group, cx: number, cy: number, cz: number) {
  const mat = new THREE.MeshBasicMaterial({ color: 0x888888 })
  // Main pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 20, 8), mat)
  pole.position.set(cx, cy + 10, cz)
  scene.add(pole)
  // Crossbars
  for (let i = 0; i < 4; i++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4 - i * 0.6, 6), mat)
    bar.rotation.z = Math.PI / 2
    bar.position.set(cx, cy + 4 + i * 4, cz)
    scene.add(bar)
  }
  // Red warning light at top
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff2200 }))
  light.position.set(cx, cy + 21, cz)
  scene.add(light)
}

export class WebRTCEnv extends Environment {
  private mats: THREE.ShaderMaterial[] = []
  private rings: { mesh: THREE.Mesh, mat: THREE.ShaderMaterial, delay: number }[] = []

  create(scene: THREE.Scene) {
    scene.add(this.group)

    // 3 broadcast towers
    buildTower(this.group, CENTER.x - 20, CENTER.y - 4, CENTER.z)
    buildTower(this.group, CENTER.x + 15, CENTER.y - 4, CENTER.z - 10)
    buildTower(this.group, CENTER.x + 5, CENTER.y - 4, CENTER.z + 20)

    // Concentric RF signal rings from tower 0
    for (let i = 0; i < 4; i++) {
      const ringGeo = new THREE.RingGeometry(6 + i * 7, 6.4 + i * 7, 48)
      const ringMat = new THREE.ShaderMaterial({
        vertexShader: RING_VERT,
        fragmentShader: RING_FRAG,
        uniforms: { uTime: { value: 0 }, uScale: { value: i }, uVisible: { value: 0 } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = -Math.PI / 2
      ring.position.set(CENTER.x - 20, CENTER.y + 6, CENTER.z)
      this.group.add(ring)
      this.rings.push({ mesh: ring, mat: ringMat, delay: i * 0.4 })
      this.mats.push(ringMat)
    }

    // Fiber optic path: curved tube from tower to encoding screen
    const fiberCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(CENTER.x - 20, CENTER.y + 8, CENTER.z),
      new THREE.Vector3(CENTER.x - 5, CENTER.y + 12, CENTER.z - 5),
      new THREE.Vector3(CENTER.x + 18, CENTER.y + 6, CENTER.z + 5),
    ])
    const fiberGeo = new THREE.TubeGeometry(fiberCurve, 60, 0.15, 6, false)
    const fiberMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: FIBER_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.group.add(new THREE.Mesh(fiberGeo, fiberMat))
    this.mats.push(fiberMat)

    // Encoding pipeline screen
    const encMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: ENCODE_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 } },
      transparent: true,
    })
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(28, 14), encMat)
    screen.position.set(CENTER.x + 18, CENTER.y + 8, CENTER.z + 5)
    screen.rotation.y = -0.6
    this.group.add(screen)
    this.mats.push(encMat)

    // Label
  }

  update(t: number) {
    for (const m of this.mats) m.uniforms.uTime.value = t
  }

  protected setVisible(v: number) {
    for (const m of this.mats) m.uniforms.uVisible.value = v
  }

  onHover() {}
}
