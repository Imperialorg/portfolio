import * as THREE from 'three'
import { Environment, makeLabelMesh } from './Environment'

// Section 3 — CPUonGPU
// Camera top-down from Y=30 looking at Y=0. PCB plane at Y=0.
// World center: (-75, 0, -25)
const CENTER = new THREE.Vector3(-75, 0, -25)

const PCB_FRAG = `
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;

float hash(float n){ return fract(sin(n)*43758.5); }

void main() {
  vec2 uv = vUv;
  vec3 col = vec3(0.04, 0.12, 0.06); // dark green PCB

  // Circuit trace grid
  vec2 grid = fract(uv * 24.0);
  float hline = step(0.94, grid.y) * step(grid.x, 0.5);
  float vline = step(0.94, grid.x) * step(grid.y, 0.5);
  col += vec3(0.6, 0.9, 0.4) * (hline + vline) * 0.5;

  // Via pads: small circles on grid intersections
  vec2 cell = floor(uv * 24.0);
  vec2 gf = fract(uv * 24.0) - 0.5;
  float h = hash(cell.x * 17.0 + cell.y * 43.0);
  if (h > 0.7) {
    float via = 1.0 - smoothstep(0.08, 0.14, length(gf));
    col += vec3(0.9, 0.8, 0.2) * via; // gold via
  }

  // Electron flow along horizontal traces: animated bright dots
  float traceLine = step(0.96, grid.y);
  float dotX = fract(uv.x * 8.0 - uTime * 0.4 + hash(floor(uv.y * 24.0) * 7.1) * 10.0);
  float dot = traceLine * step(0.86, dotX) * step(dotX, 0.96);
  col += vec3(0.3, 1.0, 0.6) * dot * 6.0;

  gl_FragColor = vec4(col, uVisible);
}
`

const DIE_FRAG = `
uniform float uTime;
uniform float uVisible;
uniform vec3 uColor;
varying vec2 vUv;
void main() {
  vec3 col = vec3(0.12, 0.14, 0.20);
  // grid of functional units
  vec2 cell = fract(vUv * 8.0);
  float border = step(0.88, cell.x) + step(0.88, cell.y);
  col = mix(col, uColor * 0.6, border * 0.5);
  // edge glow
  float edge = 1.0 - smoothstep(0.0, 0.08, min(min(vUv.x, 1.0-vUv.x), min(vUv.y, 1.0-vUv.y)));
  col += uColor * edge;
  gl_FragColor = vec4(col, uVisible);
}
`

const PIPE_FRAG = `
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;

void main() {
  // Pipeline stages: IF ID EX MEM WB
  int stage = int(floor(vUv.x * 5.0));
  float stageF = fract(vUv.x * 5.0);
  float active = sin(uTime * 1.5 - float(stage) * 1.2);
  active = 0.5 + 0.5 * active;

  vec3 cols[5];
  cols[0] = vec3(0.0, 0.8, 1.0);   // IF cyan
  cols[1] = vec3(0.4, 0.6, 1.0);   // ID blue
  cols[2] = vec3(0.9, 0.4, 1.0);   // EX purple
  cols[3] = vec3(1.0, 0.6, 0.2);   // MEM orange
  cols[4] = vec3(0.3, 1.0, 0.4);   // WB green

  vec3 c = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    float sel = float(i == stage ? 1 : 0);
    c += cols[i] * sel;
  }

  float border = step(0.88, stageF) + step(stageF, 0.04);
  c = mix(c * active, vec3(1.0), border * 0.3);

  // Instruction packet: moving left to right
  float pkt = fract(uTime * 0.4) * 5.0;
  float pktCell = floor(pkt);
  float pktFrac = fract(pkt);
  float inStage = float(stage) == pktCell ? 1.0 : 0.0;
  float dot = inStage * (1.0 - smoothstep(0.3, 0.7, abs(stageF - pktFrac)));
  c += vec3(1.0) * dot * 2.0;

  gl_FragColor = vec4(c, 0.85 * uVisible);
}
`

export class ChipSurfaceEnv extends Environment {
  private mats: THREE.ShaderMaterial[] = []

  create(scene: THREE.Scene) {
    scene.add(this.group)

    // PCB substrate plane
    const pcbGeo = new THREE.PlaneGeometry(70, 70)
    const pcbMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: PCB_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 } },
      transparent: true,
    })
    const pcb = new THREE.Mesh(pcbGeo, pcbMat)
    pcb.rotation.x = -Math.PI / 2
    pcb.position.copy(CENTER)
    this.group.add(pcb)
    this.mats.push(pcbMat)

    // GPU die package (large dark chip)
    const gpuDieMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: DIE_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 }, uColor: { value: new THREE.Color(0x00a8ff) } },
      transparent: true,
    })
    const gpuDie = new THREE.Mesh(new THREE.BoxGeometry(14, 0.8, 14), gpuDieMat)
    gpuDie.position.set(CENTER.x + 3, CENTER.y + 0.3, CENTER.z)
    this.group.add(gpuDie)
    this.mats.push(gpuDieMat)

    // CPU die (smaller)
    const cpuDieMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: DIE_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 }, uColor: { value: new THREE.Color(0x39ff14) } },
      transparent: true,
    })
    const cpuDie = new THREE.Mesh(new THREE.BoxGeometry(8, 1.0, 8), cpuDieMat)
    cpuDie.position.set(CENTER.x - 10, CENTER.y + 0.4, CENTER.z - 6)
    this.group.add(cpuDie)
    this.mats.push(cpuDieMat)

    // Instruction pipeline hologram floating above chip
    const pipeMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: PIPE_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 } },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const pipePanel = new THREE.Mesh(new THREE.PlaneGeometry(18, 5), pipeMat)
    pipePanel.position.set(CENTER.x + 3, CENTER.y + 11, CENTER.z)
    pipePanel.rotation.x = -0.3
    this.group.add(pipePanel)
    this.mats.push(pipeMat)

    // Labels
  }

  update(t: number) {
    for (const m of this.mats) m.uniforms.uTime.value = t
  }

  protected setVisible(v: number) {
    for (const m of this.mats) m.uniforms.uVisible.value = v
  }

  onHover() {}
}
