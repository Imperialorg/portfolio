import * as THREE from 'three'

interface HoloTextOptions {
  text: string
  size?: number
  color?: string
  position: THREE.Vector3
  subtitle?: string
}

// Creates a holographic text billboard using CanvasTexture
export function createHoloText(scene: THREE.Scene, opts: HoloTextOptions): THREE.Mesh {
  const {
    text, size = 1, color = '#00f5ff',
    position, subtitle
  } = opts

  const W = 1024, H = subtitle ? 320 : 200
  const cvs = document.createElement('canvas')
  cvs.width = W; cvs.height = H
  const ctx = cvs.getContext('2d')!

  // Transparent background
  ctx.clearRect(0, 0, W, H)

  // Glow effect
  ctx.shadowColor = color
  ctx.shadowBlur = 30

  // Main text
  const fontSize = Math.floor(H * 0.42)
  ctx.font = `700 ${fontSize}px "Rajdhani", sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Draw multiple times for bloom effect
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = color
    ctx.globalAlpha = 0.15
    ctx.fillText(text, W / 2, H * 0.42)
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, W / 2, H * 0.42)

  if (subtitle) {
    ctx.shadowBlur = 10
    ctx.font = `300 ${Math.floor(fontSize * 0.3)}px "Share Tech Mono", monospace`
    ctx.fillStyle = color
    ctx.globalAlpha = 0.9
    ctx.fillText(subtitle, W / 2, H * 0.78)
  }

  const tex = new THREE.CanvasTexture(cvs)
  const aspect = W / H
  const geo = new THREE.PlaneGeometry(60 * size * aspect, 60 * size)
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  })

  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.copy(position)
  scene.add(mesh)
  return mesh
}

// Animated hologram ring
export function createHoloRing(scene: THREE.Scene, position: THREE.Vector3, color: number): THREE.Mesh {
  const geo = new THREE.TorusGeometry(12, 0.3, 8, 64)
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.copy(position)
  scene.add(mesh)
  return mesh
}

// Data stream lines (Matrix-style falling chars)
export function createDataStream(scene: THREE.Scene, position: THREE.Vector3): THREE.Points {
  const count = 200
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40
    positions[i * 3 + 1] = (Math.random() - 0.5) * 60
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    color: 0x00ff88,
    size: 0.8,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const pts = new THREE.Points(geo, mat)
  pts.position.copy(position)
  scene.add(pts)
  return pts
}
