import * as THREE from 'three'
import { Environment, makeLabelMesh } from './Environment'

// Section 6 — Oris AI
// Neural network hologram cloud + anomaly detection + log stream
// World center: (95, 40, -90)
const CENTER = new THREE.Vector3(95, 40, -90)

const NODE_FRAG = `
uniform float uTime;
uniform float uVisible;
uniform int uAnomalyNode;
attribute float aNodeId;
attribute float aActivation;
varying float vActivation;
varying float vAnomaly;

void main() {
  vActivation = aActivation;
  vAnomaly = float(int(aNodeId) == uAnomalyNode ? 1 : 0);

  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float circle = 1.0 - smoothstep(0.3, 0.5, d);

  // Normal node: violet. Anomaly node: red. Resolved: green.
  float resolved = step(0.6, vAnomaly * sin(uTime * 2.0 + 1.0) * 0.5 + 0.5);
  vec3 normalCol = mix(vec3(0.5, 0.1, 1.0), vec3(0.9, 0.2, 1.0), vActivation);
  vec3 anomalyCol = mix(vec3(1.0, 0.1, 0.1), vec3(0.1, 1.0, 0.4), resolved);
  vec3 col = mix(normalCol, anomalyCol, vAnomaly);

  float pulse = 0.7 + 0.3 * sin(uTime * 3.0 + aNodeId * 1.3);
  gl_FragColor = vec4(col * circle * pulse * (0.6 + 0.4 * vActivation), circle * uVisible);
}
`

const EDGE_FRAG = `
uniform float uTime;
uniform float uVisible;
attribute float aEdgePhase;
varying float vEdgePhase;
void main() {
  vEdgePhase = aEdgePhase;
  float t = fract(uTime * 0.8 + vEdgePhase);
  float pulse = exp(-abs(t - 0.5) * 8.0);
  vec3 col = mix(vec3(0.3, 0.0, 0.7), vec3(1.0, 0.5, 1.0), pulse);
  gl_FragColor = vec4(col, (0.15 + 0.85 * pulse) * uVisible);
}
`

export class NeuralNetEnv extends Environment {
  private nodeMat!: THREE.ShaderMaterial
  private edgeMat!: THREE.ShaderMaterial
  private logTexture!: THREE.CanvasTexture
  private logCanvas!: HTMLCanvasElement
  private logCtx!: CanvasRenderingContext2D
  private logLines: string[] = []
  private logTimer = 0
  private anomalyTimer = 0
  private currentAnomaly = -1

  private static LOG_POOL = [
    'INFO  processing log batch #4821',
    'INFO  PII masking: email redacted',
    'WARN  anomaly score: 0.82 (threshold 0.75)',
    'ERROR latency spike detected: 3.2s',
    'INFO  filing GitHub PR #89: auto-patch',
    'INFO  LLM classification: INCIDENT',
    'INFO  alert: slack #oncall notified',
    'INFO  MTTR: 16s — system healed',
    'INFO  model confidence: 0.96',
    'WARN  CPU spike 94% on node gpu-04',
  ]

  create(scene: THREE.Scene) {
    scene.add(this.group)

    // 5 layers × 8 nodes = 40 nodes
    const LAYERS = 5
    const NODES_PER_LAYER = 8
    const LAYER_SPACING = 5
    const NODE_SPACING = 3.5

    const nodePositions: THREE.Vector3[] = []
    const nodeIds: number[] = []
    const activations: number[] = []

    for (let l = 0; l < LAYERS; l++) {
      for (let n = 0; n < NODES_PER_LAYER; n++) {
        const x = CENTER.x + (l - 2) * LAYER_SPACING
        const y = CENTER.y + (n - NODES_PER_LAYER / 2 + 0.5) * NODE_SPACING
        const z = CENTER.z
        nodePositions.push(new THREE.Vector3(x, y, z))
        nodeIds.push(l * NODES_PER_LAYER + n)
        activations.push(Math.random())
      }
    }

    // Node points
    const nodeGeo = new THREE.BufferGeometry()
    const posArr = new Float32Array(nodePositions.flatMap(p => [p.x, p.y, p.z]))
    const idArr = new Float32Array(nodeIds)
    const actArr = new Float32Array(activations)
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
    nodeGeo.setAttribute('aNodeId', new THREE.BufferAttribute(idArr, 1))
    nodeGeo.setAttribute('aActivation', new THREE.BufferAttribute(actArr, 1))

    this.nodeMat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float aNodeId;
        attribute float aActivation;
        varying float vActivation;
        varying float vAnomaly;
        uniform int uAnomalyNode;
        void main() {
          vActivation = aActivation;
          vAnomaly = float(int(aNodeId) == uAnomalyNode ? 1 : 0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 6.0 + 4.0 * vActivation;
        }
      `,
      fragmentShader: NODE_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uVisible: { value: 0 },
        uAnomalyNode: { value: -1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const nodes = new THREE.Points(nodeGeo, this.nodeMat)
    this.group.add(nodes)

    // Edges between adjacent layers
    const edgePositions: number[] = []
    const edgePhases: number[] = []
    for (let l = 0; l < LAYERS - 1; l++) {
      for (let n = 0; n < NODES_PER_LAYER; n++) {
        for (let m = 0; m < NODES_PER_LAYER; m++) {
          // Only connect ~30% of edges for clarity
          if (Math.random() > 0.3) continue
          const a = nodePositions[l * NODES_PER_LAYER + n]
          const b = nodePositions[(l + 1) * NODES_PER_LAYER + m]
          edgePositions.push(a.x, a.y, a.z, b.x, b.y, b.z)
          const phase = Math.random()
          edgePhases.push(phase, phase)
        }
      }
    }

    const edgeGeo = new THREE.BufferGeometry()
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgePositions), 3))
    edgeGeo.setAttribute('aEdgePhase', new THREE.BufferAttribute(new Float32Array(edgePhases), 1))

    this.edgeMat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float aEdgePhase;
        varying float vEdgePhase;
        void main() {
          vEdgePhase = aEdgePhase;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: EDGE_FRAG,
      uniforms: { uTime: { value: 0 }, uVisible: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const edges = new THREE.LineSegments(edgeGeo, this.edgeMat)
    this.group.add(edges)

    // Log stream panel (CanvasTexture)
    this.logCanvas = document.createElement('canvas')
    this.logCanvas.width = 512
    this.logCanvas.height = 256
    this.logCtx = this.logCanvas.getContext('2d')!
    this.logTexture = new THREE.CanvasTexture(this.logCanvas)
    this.drawLog()

    const logPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 9),
      new THREE.MeshBasicMaterial({ map: this.logTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    )
    logPanel.position.set(CENTER.x + 14, CENTER.y, CENTER.z)
    logPanel.rotation.y = -0.4
    this.group.add(logPanel)

    // Label
    const lbl = makeLabelMesh('ORIS', 'AI Site Reliability Engineer', '#b000ff')
    lbl.position.set(CENTER.x, CENTER.y + 20, CENTER.z)
    lbl.scale.setScalar(4)
    this.group.add(lbl)
  }

  private drawLog() {
    const ctx = this.logCtx
    const W = this.logCanvas.width, H = this.logCanvas.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(5,0,20,0.9)'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = '#b000ff'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, W, H)

    ctx.font = '11px monospace'
    const maxLines = 16
    const display = this.logLines.slice(-maxLines)
    for (let i = 0; i < display.length; i++) {
      const line = display[i]
      ctx.fillStyle = line.startsWith('ERROR') ? '#ff4444'
        : line.startsWith('WARN') ? '#ffaa00' : '#00ee88'
      ctx.fillText(line, 10, 20 + i * 14)
    }
    // Cursor blink
    ctx.fillStyle = '#b000ff'
    ctx.fillText('▋', 10, 20 + display.length * 14)
    this.logTexture.needsUpdate = true
  }

  update(t: number) {
    this.nodeMat.uniforms.uTime.value = t
    this.edgeMat.uniforms.uTime.value = t

    // Add log lines every ~0.8s
    this.logTimer += 1 / 60
    if (this.logTimer > 0.8) {
      this.logTimer = 0
      const line = NeuralNetEnv.LOG_POOL[Math.floor(Math.random() * NeuralNetEnv.LOG_POOL.length)]
      this.logLines.push(line)
      this.drawLog()
    }

    // Anomaly cycle: trigger every ~5s, resolve after 2s
    this.anomalyTimer += 1 / 60
    if (this.currentAnomaly === -1 && this.anomalyTimer > 5) {
      this.anomalyTimer = 0
      this.currentAnomaly = Math.floor(Math.random() * 40)
      this.nodeMat.uniforms.uAnomalyNode.value = this.currentAnomaly
      this.logLines.push(`ERROR anomaly on node_${this.currentAnomaly}`)
      this.drawLog()
    } else if (this.currentAnomaly !== -1 && this.anomalyTimer > 2) {
      this.anomalyTimer = 0
      this.logLines.push(`INFO  node_${this.currentAnomaly} resolved`)
      this.drawLog()
      this.currentAnomaly = -1
      this.nodeMat.uniforms.uAnomalyNode.value = -1
    }
  }

  protected setVisible(v: number) {
    this.nodeMat.uniforms.uVisible.value = v
    this.edgeMat.uniforms.uVisible.value = v
    // Log panel opacity via material
    this.group.traverse(o => {
      const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial
      if (m?.map === this.logTexture) m.opacity = v
    })
  }

  onHover() {}
}
