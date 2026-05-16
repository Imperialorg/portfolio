import * as THREE from 'three'
import { Environment, makeFloatingLabel, showProjectPanel } from './Environment'
import { PROJECTS } from '../sections/data'

// Section 6 — Oris AI
// Neural network hologram: InstancedMesh sphere nodes, animated activation edges, anomaly detection, log stream
const CENTER = new THREE.Vector3(95, 40, -90)

// ── edge shaders: activation pulses traveling along connections ──────────────
const EDGE_VERT = `
attribute float aEdgePhase;
varying float vEdgePhase;
varying float vT;        // 0=start vertex, 1=end vertex (from position along segment)
void main() {
  vEdgePhase = aEdgePhase;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const EDGE_FRAG = `
uniform float uTime;
uniform float uVisible;
varying float vEdgePhase;
void main() {
  float t     = fract(uTime * 0.9 + vEdgePhase);
  float pulse = exp(-abs(t - 0.5) * 6.0);
  float base  = 0.18;
  vec3 col    = mix(vec3(0.4, 0.0, 0.9), vec3(1.0, 0.6, 1.0), pulse);
  float alpha = (base + (1.0 - base) * pulse * 2.2) * uVisible;
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}`

// ── dark holographic floor ───────────────────────────────────────────────────
const FLOOR_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`
const FLOOR_FRAG = `
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;
void main() {
  vec2 g  = fract(vUv * 20.0);
  float grid = step(0.96, g.x) + step(0.96, g.y);
  float dist = length(vUv - 0.5);
  float fade = 1.0 - smoothstep(0.2, 0.5, dist);
  vec3 col = vec3(0.3, 0.05, 0.6) * grid * fade;
  gl_FragColor = vec4(col, grid * fade * 0.5 * uVisible);
}
`

export class NeuralNetEnv extends Environment {
  private coreNodes!: THREE.InstancedMesh
  private glowNodes!: THREE.InstancedMesh
  private coreMat!: THREE.MeshBasicMaterial
  private glowMat!: THREE.MeshBasicMaterial
  private activations = new Float32Array(40)
  private nodePositions: THREE.Vector3[] = []
  private anomalyNode = -1
  private edgeMat!: THREE.ShaderMaterial
  private floorMat!: THREE.ShaderMaterial
  private logTexture!: THREE.CanvasTexture
  private logCanvas!: HTMLCanvasElement
  private logCtx!: CanvasRenderingContext2D
  private logLines: string[] = []
  private logTimer = 0
  private anomalyTimer = 0

  private static LOG_POOL = [
    'INFO  processing log batch #4821',
    'INFO  PII masking: email→[REDACTED]',
    'WARN  anomaly score: 0.82 (thresh 0.75)',
    'ERROR latency spike: 3.2s on node_07',
    'INFO  filing GitHub PR #89 auto-patch',
    'INFO  LLM class: INCIDENT_RESOLVED',
    'INFO  alert: slack #oncall notified',
    'INFO  MTTR: 16s — system healed',
    'INFO  model confidence: 0.96',
    'WARN  CPU spike 94% → gpu-04 offload',
  ]

  create(scene: THREE.Scene) {
    scene.add(this.group)

    // Holographic floor grid
    const floorMat = new THREE.ShaderMaterial({
      vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 } },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    })
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(CENTER.x, CENTER.y - 18, CENTER.z)
    this.group.add(floor)
    this.floorMat = floorMat

    // 5 layers × 8 nodes = 40 nodes as real 3D spheres
    const LAYERS = 5, NPL = 8

    for (let l = 0; l < LAYERS; l++) {
      for (let n = 0; n < NPL; n++) {
        const idx = l * NPL + n
        this.activations[idx] = Math.random()
        this.nodePositions.push(new THREE.Vector3(
          CENTER.x + (l - 2) * 12.0,
          CENTER.y + (n - NPL / 2 + 0.5) * 8.0,
          CENTER.z
        ))
      }
    }

    // Solid core spheres
    const coreGeo = new THREE.SphereGeometry(1.4, 10, 8)
    this.coreMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 })
    this.coreNodes = new THREE.InstancedMesh(coreGeo, this.coreMat, 40)
    this.coreNodes.frustumCulled = false
    this.group.add(this.coreNodes)

    // Outer glow (larger sphere, additive)
    const glowGeo = new THREE.SphereGeometry(3.2, 8, 6)
    this.glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    this.glowNodes = new THREE.InstancedMesh(glowGeo, this.glowMat, 40)
    this.glowNodes.frustumCulled = false
    this.group.add(this.glowNodes)

    // Edges between adjacent layers (~30% sampled for clarity)
    const edgePos: number[] = [], edgePhases: number[] = []
    for (let l = 0; l < LAYERS - 1; l++) {
      for (let n = 0; n < NPL; n++) {
        for (let m = 0; m < NPL; m++) {
          if (Math.random() > 0.3) continue
          const a = this.nodePositions[l * NPL + n]
          const b = this.nodePositions[(l + 1) * NPL + m]
          edgePos.push(a.x, a.y, a.z, b.x, b.y, b.z)
          const ph = Math.random()
          edgePhases.push(ph, ph)   // same phase for both endpoints of a segment
        }
      }
    }

    const edgeGeo = new THREE.BufferGeometry()
    edgeGeo.setAttribute('position',   new THREE.BufferAttribute(new Float32Array(edgePos), 3))
    edgeGeo.setAttribute('aEdgePhase', new THREE.BufferAttribute(new Float32Array(edgePhases), 1))

    this.edgeMat = new THREE.ShaderMaterial({
      vertexShader: EDGE_VERT, fragmentShader: EDGE_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const edges = new THREE.LineSegments(edgeGeo, this.edgeMat)
    edges.frustumCulled = false
    this.group.add(edges)

    // Title plate — makes the model instantly readable
    const titleCanvas = document.createElement('canvas')
    titleCanvas.width = 512; titleCanvas.height = 128
    const tc = titleCanvas.getContext('2d')!
    tc.clearRect(0, 0, 512, 128)
    tc.font = 'bold 36px monospace'
    tc.textAlign = 'center'
    tc.shadowColor = '#b000ff'; tc.shadowBlur = 28
    tc.fillStyle = '#ffffff'; tc.fillText('ORIS AI', 256, 52)
    tc.shadowBlur = 10; tc.font = '16px monospace'
    tc.fillStyle = '#b000ff'; tc.fillText('5-LAYER ANOMALY DETECTION NETWORK', 256, 86)
    tc.shadowBlur = 6; tc.font = '11px monospace'
    tc.fillStyle = '#7040ff88'; tc.fillText('40 NODES  ·  5 LAYERS  ·  GEMINI 2.0 BACKEND', 256, 112)
    const titleTex = new THREE.CanvasTexture(titleCanvas)
    const titleMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 7),
      new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, alphaTest: 0.02 })
    )
    titleMesh.position.set(CENTER.x, CENTER.y + 30, CENTER.z)
    titleMesh.frustumCulled = false
    titleMesh.onBeforeRender = (_r, _s, cam) => titleMesh.quaternion.copy(cam.quaternion)
    this.group.add(titleMesh)

    // Clickable label
    const proj = PROJECTS[4]
    const lbl = makeFloatingLabel(proj.title, proj.neonColor, () => showProjectPanel(proj))
    lbl.position.set(CENTER.x + 20, CENTER.y + 20, CENTER.z)
    lbl.scale.setScalar(2.0)
    this.group.add(lbl)

    // Log stream panel
    this.logCanvas = document.createElement('canvas')
    this.logCanvas.width = 512; this.logCanvas.height = 320
    this.logCtx = this.logCanvas.getContext('2d')!
    this.logTexture = new THREE.CanvasTexture(this.logCanvas)
    this.drawLog()

    const logMat = new THREE.MeshBasicMaterial({
      map: this.logTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    })
    const logPanel = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), logMat)
    logPanel.position.set(CENTER.x + 16, CENTER.y - 2, CENTER.z + 4)
    logPanel.rotation.y = -0.5
    this.group.add(logPanel)
  }

  private drawLog() {
    const ctx = this.logCtx, W = 512, H = 320
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(4, 0, 18, 0.92)'; ctx.fillRect(0, 0, W, H)
    // scanlines
    for (let y = 0; y < H; y += 3) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, y, W, 1)
    }
    ctx.font = '12px monospace'
    const show = this.logLines.slice(-20)
    for (let i = 0; i < show.length; i++) {
      const line = show[i]
      ctx.fillStyle = line.startsWith('ERROR') ? '#ff4455'
        : line.startsWith('WARN') ? '#ffaa22' : '#22ee88'
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 4
      ctx.fillText(line, 10, 18 + i * 15)
    }
    ctx.fillStyle = '#b000ff'; ctx.shadowColor = '#b000ff'; ctx.shadowBlur = 8
    ctx.fillText('▋', 10, 18 + show.length * 15)
    this.logTexture.needsUpdate = true
  }

  update(t: number) {
    this.edgeMat.uniforms.uTime.value = t
    this.floorMat.uniforms.uTime.value = t

    // Update InstancedMesh node positions, scales, colors
    const dummy = new THREE.Object3D()
    for (let i = 0; i < 40; i++) {
      const a = this.activations[i]
      const pulse = 0.85 + 0.15 * Math.sin(t * 2.0 + i * 0.73)
      const isAnomaly = i === this.anomalyNode ? 1.0 : 0.0
      const scale = (0.8 + a * 0.7) * pulse * (1 + isAnomaly * 1.0)
      dummy.position.copy(this.nodePositions[i])
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      this.coreNodes.setMatrixAt(i, dummy.matrix)
      dummy.scale.setScalar(scale * 2.2)
      dummy.updateMatrix()
      this.glowNodes.setMatrixAt(i, dummy.matrix)
      const hue = isAnomaly > 0 ? (Math.sin(t * 3) > 0 ? 0.0 : 0.33) : 0.75 + a * 0.12
      const col = new THREE.Color().setHSL(hue, 1.0, 0.55 + a * 0.3)
      this.coreNodes.setColorAt(i, col)
      this.glowNodes.setColorAt(i, col)
    }
    this.coreNodes.instanceMatrix.needsUpdate = true
    this.coreNodes.instanceColor!.needsUpdate = true
    this.glowNodes.instanceMatrix.needsUpdate = true
    this.glowNodes.instanceColor!.needsUpdate = true

    this.logTimer += 1 / 60
    if (this.logTimer > 0.75) {
      this.logTimer = 0
      this.logLines.push(NeuralNetEnv.LOG_POOL[Math.floor(Math.random() * NeuralNetEnv.LOG_POOL.length)])
      this.drawLog()
    }

    this.anomalyTimer += 1 / 60
    if (this.anomalyNode === -1 && this.anomalyTimer > 5) {
      this.anomalyTimer = 0
      this.anomalyNode = Math.floor(Math.random() * 40)
      this.logLines.push(`ERROR anomaly on node_${this.anomalyNode}`)
      this.drawLog()
    } else if (this.anomalyNode !== -1 && this.anomalyTimer > 2.5) {
      this.anomalyTimer = 0
      this.logLines.push(`INFO  node_${this.anomalyNode} resolved ✓`)
      this.drawLog()
      this.anomalyNode = -1
    }
  }

  protected setVisible(v: number) {
    this.coreMat.opacity = v
    this.glowMat.opacity = v * 0.3
    this.edgeMat.uniforms.uVisible.value = v
    this.floorMat.uniforms.uVisible.value = v
    this.group.traverse(o => {
      const m = (o as THREE.Mesh).material as any
      if (m?.map === this.logTexture) m.opacity = v
    })
  }

  onHover() {}
}
