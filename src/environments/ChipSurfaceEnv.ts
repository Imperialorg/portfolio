import * as THREE from 'three'
import { Environment, makeFloatingLabel, showProjectPanel } from './Environment'
import { PROJECTS } from '../sections/data'

// Section 3 — CPUonGPU: macro PCB surface, top-down
const CENTER = new THREE.Vector3(-75, 0, -25)

// ─── PCB substrate + SDF trace network ───────────────────────────────────────
// Traces defined as UV-space segments. UV (0,0)=bottom-left (1,1)=top-right
// Each vec4 = (x1,y1, x2,y2) in UV. Width baked into sdSegment.
const PCB_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`
const PCB_FRAG = `
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;

// SDF: distance from point p to line segment (a→b)
float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa=p-a, ba=b-a;
  float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);
  return length(pa-ba*h);
}
// Rounded pad
float sdPad(vec2 p, vec2 c, float r) { return length(p-c)-r; }
// IC package rectangle
float sdRect(vec2 p, vec2 c, vec2 hs) {
  vec2 d=abs(p-c)-hs; return length(max(d,0.))+min(max(d.x,d.y),0.);
}

// Trace SDF — returns distance to nearest trace and which trace index (for electron animation)
// Returns: (dist, traceId, traceT)
float traceNet(vec2 uv, float traceW, out float tId, out float tPos) {
  tId=-1.; tPos=0.;
  float best=1e9;
  float d;
  // --- POWER BUS (thick horizontal center) ---
  d=sdSeg(uv,vec2(0.04,0.50),vec2(0.96,0.50)); if(d<best){best=d;tId=0.;tPos=(uv.x-0.04)/0.92;}
  // --- VDD rail (top) ---
  d=sdSeg(uv,vec2(0.04,0.80),vec2(0.96,0.80)); if(d<best){best=d;tId=1.;tPos=(uv.x-0.04)/0.92;}
  // --- GND rail (bottom) ---
  d=sdSeg(uv,vec2(0.04,0.20),vec2(0.96,0.20)); if(d<best){best=d;tId=2.;tPos=(uv.x-0.04)/0.92;}
  // --- CPU→GPU data bus (L-route) ---
  d=sdSeg(uv,vec2(0.30,0.65),vec2(0.30,0.50)); if(d<best){best=d;tId=3.;tPos=(0.65-uv.y)/0.15;}
  d=sdSeg(uv,vec2(0.30,0.50),vec2(0.65,0.50)); if(d<best){best=d;tId=3.;tPos=0.5+(uv.x-0.30)/0.70;}
  d=sdSeg(uv,vec2(0.65,0.50),vec2(0.65,0.65)); if(d<best){best=d;tId=3.;tPos=0.85+(uv.y-0.50)/0.30;}
  // --- Cache bus (vertical) ---
  d=sdSeg(uv,vec2(0.20,0.35),vec2(0.20,0.65)); if(d<best){best=d;tId=4.;tPos=(uv.y-0.35)/0.30;}
  // --- GPU shader bus x3 parallel ---
  d=sdSeg(uv,vec2(0.60,0.55),vec2(0.93,0.55)); if(d<best){best=d;tId=5.;tPos=(uv.x-0.60)/0.33;}
  d=sdSeg(uv,vec2(0.60,0.59),vec2(0.93,0.59)); if(d<best){best=d;tId=6.;tPos=(uv.x-0.60)/0.33;}
  d=sdSeg(uv,vec2(0.60,0.63),vec2(0.93,0.63)); if(d<best){best=d;tId=7.;tPos=(uv.x-0.60)/0.33;}
  return best;
}

// Pad locations
float padNet(vec2 uv, float r) {
  float d=1e9;
  // CPU die pads
  d=min(d,sdPad(uv,vec2(0.28,0.68),r));
  d=min(d,sdPad(uv,vec2(0.22,0.65),r));
  d=min(d,sdPad(uv,vec2(0.22,0.35),r));
  d=min(d,sdPad(uv,vec2(0.28,0.50),r));
  // GPU die pads
  d=min(d,sdPad(uv,vec2(0.62,0.65),r));
  d=min(d,sdPad(uv,vec2(0.62,0.50),r));
  d=min(d,sdPad(uv,vec2(0.50,0.50),r));
  // Decap pads
  d=min(d,sdPad(uv,vec2(0.50,0.35),r));
  d=min(d,sdPad(uv,vec2(0.35,0.50),r));
  d=min(d,sdPad(uv,vec2(0.35,0.65),r));
  return d;
}

void main() {
  vec2 uv = vUv;
  // Solder-mask green substrate
  vec3 col = vec3(0.025, 0.085, 0.038);

  // ── Trace network ─────────────────────────────────────────────
  float tId, tPos;
  float TRACE_W   = 0.010;
  float POWER_W   = 0.018;
  float dist = traceNet(uv, TRACE_W, tId, tPos);

  // Power bus wider
  float isPower = step(tId, 2.5) * step(-0.5, tId);
  float width   = mix(TRACE_W, POWER_W, isPower);

  float traceMask = 1.0 - smoothstep(0., width, dist);
  // Copper colour — warm gold
  vec3 copper = vec3(0.85, 0.62, 0.18);
  col = mix(col, copper, traceMask);

  // ── Via / pad pads ────────────────────────────────────────────
  float padR   = 0.012;
  float viaR   = 0.007;
  float padD   = padNet(uv, padR);
  float viaMask= 1.0 - smoothstep(0., 0.002, padD);
  float holeD  = padNet(uv, viaR * 0.55);
  float holeMask = 1.0 - smoothstep(0., 0.002, holeD);
  col = mix(col, copper, viaMask * (1.0 - holeMask));
  // Drill hole: dark
  col = mix(col, vec3(0.01), holeMask);

  // ── IC package outlines ───────────────────────────────────────
  // CPU die (left-center)
  float cpuD  = sdRect(uv, vec2(0.25, 0.52), vec2(0.08, 0.10));
  float cpuPkg = 1.0 - smoothstep(0., 0.003, abs(cpuD) - 0.001);
  // GPU die (right-center)
  float gpuD  = sdRect(uv, vec2(0.70, 0.57), vec2(0.10, 0.08));
  float gpuPkg = 1.0 - smoothstep(0., 0.003, abs(gpuD) - 0.001);
  // Chip body fill
  float cpuFill = 1.0 - smoothstep(0., 0.003, cpuD);
  float gpuFill = 1.0 - smoothstep(0., 0.003, gpuD);
  col = mix(col, vec3(0.08, 0.11, 0.15), cpuFill);
  col = mix(col, vec3(0.05, 0.09, 0.14), gpuFill);
  // Package outline in silk-screen white
  col += vec3(0.7) * cpuPkg * 0.6;
  col += vec3(0.7) * gpuPkg * 0.6;

  // Small passives (capacitors / resistors)
  for(int i=0;i<6;i++){
    vec2 cPos = vec2(0.12+float(i)*0.13, 0.25 + sin(float(i)*2.1)*0.04);
    float compD = sdRect(uv, cPos, vec2(0.018, 0.008));
    float cap = 1.0 - smoothstep(0.,0.002,compD);
    col = mix(col, vec3(0.55,0.45,0.35), cap * 0.9);
    col += vec3(0.6) * (1.0-smoothstep(0.,0.002,abs(compD)-0.001)) * 0.4;
  }

  // ── Electron flow along traces ────────────────────────────────
  // Only animate if we're near a trace
  if(traceMask > 0.05 && tId >= 0.) {
    // Multiple electrons spaced along each trace
    float speed = mix(0.5, 1.4, fract(tId * 0.37));
    for(int k=0;k<3;k++){
      float offset = float(k) / 3.0 + tId * 0.17;
      float t      = fract(uTime * speed + offset);
      float electron = exp(-abs(tPos - t) * 80.0);
      // Electrons on power/GND are yellow; signal traces cyan/green
      vec3 eCol = tId < 2.5
        ? vec3(1.0, 0.85, 0.2)   // power: yellow
        : tId < 4.5
        ? vec3(0.2, 1.0, 0.6)    // data bus: green
        : vec3(0.2, 0.8, 1.0);   // signals: cyan
      col += eCol * electron * traceMask * 8.0;
    }
  }

  // ── Silkscreen text areas (faint white marks) ─────────────────
  float silkU = fract(uv.x * 40.0);
  float silkV = fract(uv.y * 40.0);
  float silkDot = step(0.92, silkU) * step(0.92, silkV) * 0.07;
  col += vec3(0.5) * silkDot;

  // ── Edge fade ─────────────────────────────────────────────────
  float edgeFade = 1.0 - smoothstep(0.38, 0.50, length(uv - 0.5));
  gl_FragColor = vec4(col * edgeFade, edgeFade * uVisible);
}
`

// ─── Instruction pipeline (IF→ID→EX→MEM→WB) shown as a chip diagram ─────────
const PIPE_FRAG = `
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;

float sdRect(vec2 p, vec2 c, vec2 hs) {
  vec2 d=abs(p-c)-hs; return length(max(d,0.))+min(max(d.x,d.y),0.);
}

void main() {
  vec2 uv = vUv;
  vec3 col = vec3(0.02, 0.03, 0.07);

  // 5 pipeline stage boxes
  vec3 stageColors[5];
  stageColors[0] = vec3(0.0, 0.85, 1.0);
  stageColors[1] = vec3(0.35, 0.6, 1.0);
  stageColors[2] = vec3(0.85, 0.3, 1.0);
  stageColors[3] = vec3(1.0, 0.55, 0.15);
  stageColors[4] = vec3(0.25, 1.0, 0.4);

  for(int i=0;i<5;i++){
    float cx  = (float(i) + 0.5) / 5.0;
    float d   = sdRect(uv, vec2(cx, 0.55), vec2(0.08, 0.28));
    float fill = 1.0-smoothstep(0.,0.004,d);
    float edge = 1.0-smoothstep(0.,0.003,abs(d)-0.002);
    float act = 0.3+0.7*(0.5+0.5*sin(uTime*1.8-float(i)*1.3));
    col = mix(col, stageColors[i]*0.18, fill);
    col += stageColors[i] * edge * 0.9;
    col += stageColors[i] * fill * act * 0.25;

    // Arrow connector to next stage
    if(i<4){
      float ax = (float(i)+1.0)/5.0;
      float arrow = step(0.97, 1.0-abs(uv.x - ax)*20.0) * step(0.45,uv.y)*step(uv.y,0.65);
      col += vec3(0.4) * arrow * 0.5;
    }
  }

  // Instruction packet travelling right
  float pktT   = fract(uTime * 0.35) * 1.05;
  float pktX   = 0.0 + pktT * 1.0;
  float pkt    = exp(-abs(uv.x - pktX) * 60.0) * step(0.27,uv.y) * step(uv.y,0.83);
  col += vec3(1.0,1.0,0.8) * pkt * 2.5;

  // Stage labels via scanlines hint
  col += vec3(0.06) * step(0.96, fract(uv.y * 22.0));

  gl_FragColor = vec4(col, 0.92 * uVisible);
}
`

const PLAIN_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`

export class ChipSurfaceEnv extends Environment {
  private pcbMat!: THREE.ShaderMaterial
  private pipeMat!: THREE.ShaderMaterial

  create(scene: THREE.Scene) {
    scene.add(this.group)

    // PCB substrate (large, top-down)
    this.pcbMat = new THREE.ShaderMaterial({
      vertexShader: PLAIN_VERT, fragmentShader: PCB_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 } },
      transparent: true,
    })
    const pcb = new THREE.Mesh(new THREE.PlaneGeometry(45, 45), this.pcbMat)
    pcb.rotation.x = -Math.PI / 2
    pcb.position.copy(CENTER)
    pcb.renderOrder = 1
    this.group.add(pcb)

    // Pipeline diagram floating above (vertical billboard, faces camera looking down)
    this.pipeMat = new THREE.ShaderMaterial({
      vertexShader: PLAIN_VERT, fragmentShader: PIPE_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 } },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    })
    const pipe = new THREE.Mesh(new THREE.PlaneGeometry(26, 8), this.pipeMat)
    pipe.position.set(CENTER.x, CENTER.y + 12, CENTER.z)
    pipe.rotation.x = -0.2
    this.group.add(pipe)

    // Component 3D geometry: CPU die package (dark ceramic)
    const cpuDie = new THREE.Mesh(
      new THREE.BoxGeometry(11.2, 0.9, 14.0),
      new THREE.MeshBasicMaterial({ color: 0x0a0e16 })
    )
    cpuDie.position.set(CENTER.x - 17, CENTER.y + 0.45, CENTER.z + 1.5)
    this.group.add(cpuDie)
    // CPU die top surface (green with pads)
    const cpuTop = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 12),
      new THREE.MeshBasicMaterial({ color: 0x061808 })
    )
    cpuTop.rotation.x = -Math.PI / 2
    cpuTop.position.set(CENTER.x - 17, CENTER.y + 0.92, CENTER.z + 1.5)
    this.group.add(cpuTop)

    // GPU die (larger)
    const gpuDie = new THREE.Mesh(
      new THREE.BoxGeometry(14, 1.1, 11.2),
      new THREE.MeshBasicMaterial({ color: 0x060a14 })
    )
    gpuDie.position.set(CENTER.x + 7, CENTER.y + 0.55, CENTER.z - 2)
    this.group.add(gpuDie)

    // Pin rows around CPU die
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xc8a840 })
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 14; i++) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.6), pinMat)
        pin.position.set(
          CENTER.x - 22 + row * 18,
          CENTER.y + 0.15,
          CENTER.z - 5 + i
        )
        this.group.add(pin)
      }
    }

    // Decoupling caps (small cylinders near dies)
    const capMat = new THREE.MeshBasicMaterial({ color: 0x8b6914 })
    const capPositions = [
      [-10, -8], [-10, 4], [-5, -8], [-5, 4],
      [2, -6], [2, 2], [12, -6], [12, 2]
    ]
    for (const [x, z] of capPositions) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.8, 8), capMat)
      cap.position.set(CENTER.x + x, CENTER.y + 0.4, CENTER.z + z)
      this.group.add(cap)
    }

    // Floating label
    const proj = PROJECTS[1]  // CPUonGPU
    const lbl = makeFloatingLabel(proj.title, proj.neonColor, () => showProjectPanel(proj))
    lbl.position.set(CENTER.x - 14, CENTER.y + 6, CENTER.z + 16)
    lbl.rotation.x = -0.4
    this.group.add(lbl)
  }

  update(t: number) {
    this.pcbMat.uniforms.uTime.value = t
    this.pipeMat.uniforms.uTime.value = t
  }

  protected setVisible(v: number) {
    this.pcbMat.uniforms.uVisible.value = v
    this.pipeMat.uniforms.uVisible.value = v
  }

  onHover() {}
}
