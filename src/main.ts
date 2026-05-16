import * as THREE from 'three'
import '../style.css'
import { CityGenerator } from './city/CityGenerator'
import { Ground } from './city/Ground'
import { Rain } from './atmosphere/Rain'
import { CameraPath, SECTIONS } from './scene/CameraPath'
import { PostProcessing } from './effects/PostProcessing'
import { LoadingScreen } from './ui/LoadingScreen'
import { Overlay } from './ui/Overlay'
import { Terminal } from './ui/Terminal'
import { createHoloText, createHoloRing, createDataStream } from './ui/HolographicText'
import { PROJECTS, SKILLS } from './sections/data'

// ── Renderer ──────────────────────────────────────────────
const canvas = document.getElementById('canvas') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2

// ── Scene ─────────────────────────────────────────────────
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x02020a)
scene.fog = new THREE.FogExp2(0x030318, 0.0018)

// ── Camera ────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 1200)
const camPath = new CameraPath(camera)

// ── Ambient light ─────────────────────────────────────────
const ambLight = new THREE.AmbientLight(0x0a0a1a, 0.5)
scene.add(ambLight)

// ── City objects ──────────────────────────────────────────
const city = new CityGenerator()
const ground = new Ground()
const rain = new Rain()

// ── UI ────────────────────────────────────────────────────
const loading = new LoadingScreen()
const overlay = new Overlay()
const terminal = new Terminal()
const postfx = new PostProcessing()

// ── HUD Labels (2D projected) ─────────────────────────────
const hudContainer = document.createElement('div')
hudContainer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:40;font-family:"Share Tech Mono",monospace'
document.body.appendChild(hudContainer)

// Section label HUD
const sectionLabel = document.createElement('div')
sectionLabel.style.cssText = `
  position:absolute;top:32px;left:40px;
  font-size:0.7rem;letter-spacing:0.2em;
  color:rgba(0,245,255,0.7);
  transition:opacity 0.4s;
`
hudContainer.appendChild(sectionLabel)

// Coordinates HUD
const coordsEl = document.createElement('div')
coordsEl.style.cssText = `
  position:absolute;bottom:60px;left:40px;
  font-size:0.65rem;color:rgba(0,245,255,0.3);
  letter-spacing:0.08em;
`
hudContainer.appendChild(coordsEl)

// Scroll hint
const scrollHint = document.createElement('div')
scrollHint.id = 'scroll-hint'
scrollHint.textContent = '▼  SCROLL TO NAVIGATE  ▼'
document.body.appendChild(scrollHint)

// ── Click-to-open project billboards ─────────────────────
// Simple raycaster for billboard planes
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const billboards: Array<{ mesh: THREE.Mesh; projectId: string }> = []

function createBillboard(project: typeof PROJECTS[0], position: THREE.Vector3) {
  const geo = new THREE.PlaneGeometry(20, 12)

  // Canvas texture with project info
  const cvs = document.createElement('canvas')
  cvs.width = 512; cvs.height = 320
  const ctx = cvs.getContext('2d')!
  ctx.fillStyle = '#010810'
  ctx.fillRect(0, 0, 512, 320)
  ctx.strokeStyle = project.neonColor
  ctx.lineWidth = 3
  ctx.strokeRect(4, 4, 504, 312)

  // Title
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 28px "Share Tech Mono", monospace'
  ctx.fillText(project.title.toUpperCase().slice(0, 22), 20, 60)

  // Badge
  if (project.badge) {
    ctx.fillStyle = project.neonColor
    ctx.font = '14px "Share Tech Mono", monospace'
    ctx.fillText(`[ ${project.badge.toUpperCase()} ]`, 20, 90)
  }

  // Description (word wrap)
  ctx.fillStyle = '#888'
  ctx.font = '13px "Share Tech Mono", monospace'
  const words = project.desc.split(' ')
  let line = '', y = 130
  for (const word of words) {
    const test = line + word + ' '
    if (ctx.measureText(test).width > 470) {
      ctx.fillText(line, 20, y); line = word + ' '; y += 20
      if (y > 230) break
    } else { line = test }
  }
  ctx.fillText(line, 20, y)

  // Tags
  ctx.fillStyle = project.neonColor + '88'
  ctx.font = '11px "Share Tech Mono", monospace'
  ctx.fillText(project.tags.slice(0, 4).join('  ·  '), 20, 280)

  // Click hint
  ctx.fillStyle = project.neonColor
  ctx.font = '13px "Share Tech Mono", monospace'
  ctx.fillText('[ CLICK TO EXPAND → ]', 20, 305)

  const tex = new THREE.CanvasTexture(cvs)
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.copy(position)
  mesh.lookAt(camera.position)
  scene.add(mesh)
  billboards.push({ mesh, projectId: project.id })
}

// Place project billboards at offset positions around the city
function setupBillboards() {
  const positions = [
    new THREE.Vector3(-80, 60, -40),
    new THREE.Vector3(-60, 50, -80),
    new THREE.Vector3(-40, 70, -100),
    new THREE.Vector3(20, 55, -90),
    new THREE.Vector3(60, 65, -70),
    new THREE.Vector3(80, 50, -40),
    new THREE.Vector3(70, 45, 10),
    new THREE.Vector3(-70, 40, 10),
    new THREE.Vector3(-90, 55, -20),
    new THREE.Vector3(30, 60, -110),
  ]
  PROJECTS.forEach((p, i) => {
    if (i < positions.length) createBillboard(p, positions[i])
  })
}

canvas.addEventListener('click', (e) => {
  if (overlay.isActive()) return
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(billboards.map(b => b.mesh))
  if (hits.length > 0) {
    const hit = billboards.find(b => b.mesh === hits[0].object)
    if (hit) overlay.open(hit.projectId)
  }
})

// Update nav dots
function updateNavDots(idx: number) {
  document.querySelectorAll('.nav-dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx)
  })
  sectionLabel.textContent = `// ${SECTIONS[idx].label}`
  if (idx > 0) {
    scrollHint.style.opacity = '0'
  }
}

// ── Init ──────────────────────────────────────────────────
async function init() {
  await loading.run()

  city.generate(scene)
  city.addAntennas(scene)
  ground.create(scene)
  rain.create(scene)

  // Post-processing
  postfx.setup(renderer, scene, camera)

  // Hero holographic text
  createHoloText(scene, {
    text: 'D SHANTAN DHEER',
    subtitle: 'SYSTEMS · GPU · AI · CREATIVE DEV',
    size: 1.2,
    position: new THREE.Vector3(0, 80, -30),
  })
  createHoloText(scene, {
    text: '1ST YEAR EEE · GCET',
    color: '#ff00aa',
    size: 0.5,
    position: new THREE.Vector3(0, 50, -30),
  })

  // Decorative holo rings
  createHoloRing(scene, new THREE.Vector3(0, 80, -30), 0x00f5ff)
  createHoloRing(scene, new THREE.Vector3(0, 55, -30), 0xff00aa)

  // Data streams for skills section
  createDataStream(scene, new THREE.Vector3(40, 15, -100))
  createDataStream(scene, new THREE.Vector3(60, 15, -120))

  // Hackathon trophies label
  createHoloText(scene, {
    text: '🏆 RUNNER-UP',
    subtitle: 'TECHSYNAPSE 2026 · NATIONAL 24HR HACKATHON',
    color: '#ffe642',
    size: 0.55,
    position: new THREE.Vector3(80, 100, 20),
  })
  createHoloText(scene, {
    text: '🇮🇳 INDIA INNOVATES 2026',
    subtitle: 'BHARAT MANDAPAM · 5K OF 1CR APPLICANTS',
    color: '#ffe642',
    size: 0.55,
    position: new THREE.Vector3(80, 75, 20),
  })

  setupBillboards()

  // Terminal & terminal toggle button
  terminal.create()
  const termBtn = document.createElement('button')
  termBtn.textContent = '> TERMINAL'
  termBtn.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:70;
    background:rgba(0,8,16,0.9);border:1px solid rgba(0,245,255,0.4);
    color:#00f5ff;font-family:'Share Tech Mono',monospace;font-size:0.78rem;
    padding:8px 16px;cursor:pointer;letter-spacing:0.08em;
    transition:all 0.2s;
  `
  termBtn.onmouseenter = () => termBtn.style.background = 'rgba(0,245,255,0.12)'
  termBtn.onmouseleave = () => termBtn.style.background = 'rgba(0,8,16,0.9)'
  termBtn.onclick = () => terminal.toggle()
  document.body.appendChild(termBtn)

  camPath.setupScrollListener((idx) => {
    updateNavDots(idx)
    postfx.triggerGlitch()  // glitch on every section change
  })
  updateNavDots(0)

  loading.hide()
  animate()
}

// ── Render loop ───────────────────────────────────────────
const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const dt = clock.getDelta()
  const elapsed = clock.getElapsedTime()

  camPath.update(dt)
  city.update(elapsed)
  ground.update(elapsed)
  rain.update(elapsed, camera.position)

  // Make billboards face camera
  billboards.forEach(b => b.mesh.lookAt(camera.position))

  // Update coords HUD
  const p = camera.position
  coordsEl.textContent = `X:${p.x.toFixed(1)}  Y:${p.y.toFixed(1)}  Z:${p.z.toFixed(1)}`

  postfx.render()
}

// ── Resize ────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  postfx.resize(window.innerWidth, window.innerHeight)
})

// ── Konami Easter Egg ─────────────────────────────────────
const KONAMI = [38,38,40,40,37,39,37,39,66,65]
let konamiIdx = 0
window.addEventListener('keydown', (e) => {
  if (e.keyCode === KONAMI[konamiIdx]) {
    konamiIdx++
    if (konamiIdx === KONAMI.length) {
      konamiIdx = 0
      // Wireframe mode toggle
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh && obj.material instanceof THREE.RawShaderMaterial) {
          (obj.material as any).wireframe = !(obj.material as any).wireframe
        }
      })
    }
  } else { konamiIdx = 0 }
})

init()
