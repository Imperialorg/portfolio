import * as THREE from 'three'
import { Environment, makeLabelMesh } from './Environment'

// Section 6 — Oris AI
// Neural network hologram: sphere nodes, animated activation edges, anomaly detection, log stream
const CENTER = new THREE.Vector3(95, 40, -90)

// ── vertex: passes nodeId + activation to fragment ──────────────────────────
const NODE_VERT = `
attribute float aNodeId;
attribute float aActivation;
varying float vActivation;
varying float vIsAnomaly;
uniform int uAnomalyNode;
uniform float uTime;
void main() {
  vActivation = aActivation;
  vIsAnomaly = float(int(aNodeId) == uAnomalyNode ? 1 : 0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 14.0 + 8.0 * vActivation + 8.0 * vIsAnomaly;
}
`
const NODE_FRAG = `
uniform float uTime;
uniform float uVisible;
varying float vActivation;
varying float vIsAnomaly;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float ring  = 1.0 - smoothstep(0.30, 0.50, d);
  float inner = 1.0 - smoothstep(0.08, 0.22, d);
  float pulse = 0.7 + 0.3 * sin(uTime * 3.0 + vActivation * 6.28);
  vec3 normalCol  = mix(vec3(0.4, 0.05, 0.9), vec3(0.9, 0.3, 1.0), vActivation);
  float resolved  = 0.5 + 0.5 * sin(uTime * 2.5);
  vec3 anomalyCol = mix(vec3(1.0, 0.05, 0.1), vec3(0.0, 1.0, 0.5), resolved);
  vec3 col = mix(normalCol, anomalyCol, vIsAnomaly);
  float alpha = (ring * 0.4 + inner) * pulse * uVisible;
  gl_FragColor = vec4(col * (ring + inner * 1.5), alpha);
}
`

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
  float t   = fract(uTime * 0.7 + vEdgePhase);
  float pulse = exp(-abs(t - 0.5) * 9.0);
  vec3 col  = mix(vec3(0.25, 0.0, 0.6), vec3(1.0, 0.5, 1.0), pulse);
  float alpha = (0.18 + 0.82 * pulse) * uVisible;
  gl_FragColor = vec4(col, alpha);
}
`

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
  private nodeMat!: THREE.ShaderMaterial
  private edgeMat!: THREE.ShaderMaterial
  private floorMat!: THREE.ShaderMaterial
  private logTexture!: THREE.CanvasTexture
  private logCanvas!: HTMLCanvasElement
  private logCtx!: CanvasRenderingContext2D
  private logLines: string[] = []
  private logTimer = 0
  private anomalyTimer = 0
  private currentAnomaly = -1

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

    // 5 layers × 8 nodes
    const LAYERS = 5, NPL = 8
    const nodePositions: THREE.Vector3[] = []
    const nodeIds      = new Float32Array(LAYERS * NPL)
    const activations  = new Float32Array(LAYERS * NPL)

    for (let l = 0; l < LAYERS; l++) {
      for (let n = 0; n < NPL; n++) {
        const idx = l * NPL + n
        nodePositions.push(new THREE.Vector3(
          CENTER.x + (l - 2) * 8.0,
          CENTER.y + (n - NPL / 2 + 0.5) * 5.5,
          CENTER.z
        ))
        nodeIds[idx]     = idx
        activations[idx] = Math.random()
      }
    }

    const posArr = new Float32Array(nodePositions.flatMap(p => [p.x, p.y, p.z]))
    const nodeGeo = new THREE.BufferGeometry()
    nodeGeo.setAttribute('position',    new THREE.BufferAttribute(posArr, 3))
    nodeGeo.setAttribute('aNodeId',     new THREE.BufferAttribute(nodeIds, 1))
    nodeGeo.setAttribute('aActivation', new THREE.BufferAttribute(activations, 1))

    this.nodeMat = new THREE.ShaderMaterial({
      vertexShader: NODE_VERT, fragmentShader: NODE_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 }, uAnomalyNode: { value: -1 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    this.group.add(new THREE.Points(nodeGeo, this.nodeMat))

    // Edges between adjacent layers (~30% sampled for clarity)
    const edgePos: number[] = [], edgePhases: number[] = []
    for (let l = 0; l < LAYERS - 1; l++) {
      for (let n = 0; n < NPL; n++) {
        for (let m = 0; m < NPL; m++) {
          if (Math.random() > 0.3) continue
          const a = nodePositions[l * NPL + n]
          const b = nodePositions[(l + 1) * NPL + m]
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
    this.group.add(new THREE.LineSegments(edgeGeo, this.edgeMat))

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
    this.nodeMat.uniforms.uTime.value = t
    this.edgeMat.uniforms.uTime.value = t
    this.floorMat.uniforms.uTime.value = t

    this.logTimer += 1 / 60
    if (this.logTimer > 0.75) {
      this.logTimer = 0
      this.logLines.push(NeuralNetEnv.LOG_POOL[Math.floor(Math.random() * NeuralNetEnv.LOG_POOL.length)])
      this.drawLog()
    }

    this.anomalyTimer += 1 / 60
    if (this.currentAnomaly === -1 && this.anomalyTimer > 5) {
      this.anomalyTimer = 0
      this.currentAnomaly = Math.floor(Math.random() * 40)
      this.nodeMat.uniforms.uAnomalyNode.value = this.currentAnomaly
      this.logLines.push(`ERROR anomaly on node_${this.currentAnomaly}`)
      this.drawLog()
    } else if (this.currentAnomaly !== -1 && this.anomalyTimer > 2.5) {
      this.anomalyTimer = 0
      this.logLines.push(`INFO  node_${this.currentAnomaly} resolved ✓`)
      this.drawLog()
      this.currentAnomaly = -1
      this.nodeMat.uniforms.uAnomalyNode.value = -1
    }
  }

  protected setVisible(v: number) {
    this.nodeMat.uniforms.uVisible.value = v
    this.edgeMat.uniforms.uVisible.value = v
    this.floorMat.uniforms.uVisible.value = v
    this.group.traverse(o => {
      const m = (o as THREE.Mesh).material as any
      if (m?.map === this.logTexture) m.opacity = v
    })
  }

  onHover() {}
}
