import * as THREE from 'three'
import { CityGenerator } from './city/CityGenerator'
import { Ground } from './city/Ground'
import { Rain } from './atmosphere/Rain'
import { SkyDome } from './city/SkyDome'
import { NeonSigns } from './city/NeonSigns'
import { PostProcessing } from './effects/PostProcessing'
import { CameraPath, SECTION_KEYFRAMES } from './scene/CameraPath'
import { PROJECTS, SKILLS } from './sections/data'
import { DISTRICT_COLORS } from './city/CityGenerator'
import { EnvironmentManager } from './environments/EnvironmentManager'

// ──────────────────────────────────────────────────────────────
// RENDERER + SCENE
// ──────────────────────────────────────────────────────────────
const canvas = document.getElementById('scene-canvas') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setSize(innerWidth, innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.95

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x020212)
scene.fog = new THREE.FogExp2(0x030318, 0.003)

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.5, 1200)

// ──────────────────────────────────────────────────────────────
// POST-PROCESSING  (pmndrs/postprocessing — better than three/addons)
// ──────────────────────────────────────────────────────────────
const postFX = new PostProcessing()
postFX.setup(renderer, scene, camera)

// ──────────────────────────────────────────────────────────────
// SKY DOME  (before city so it renders behind everything)
// ──────────────────────────────────────────────────────────────
const sky = new SkyDome()
sky.create(scene)

// ──────────────────────────────────────────────────────────────
// SCENE OBJECTS
// ──────────────────────────────────────────────────────────────
const city = new CityGenerator()
city.generate(scene)
city.addBillboardScreens(scene)
city.addRooftopEquipment(scene)
city.addSearchlights(scene)
// antennas removed — red bars cluttering skyline

// District name labels floating above rooftops (canvas texture, readable)
const LABELS = PROJECTS.map((p, i) => {
  const kf = SECTION_KEYFRAMES[i + 2]
  return { text: p.district, pos: new THREE.Vector3(kf.pos.x + 12, 80, kf.pos.z - 18), color: p.neonColor }
})
city.addNeonSigns(scene, LABELS)

// Procedural decorative neon signs along building faces
const neonSigns = new NeonSigns()
neonSigns.create(scene)

const ground = new Ground()
ground.create(scene)

const rain = new Rain()
rain.create(scene)

// Minimal ambient fill — everything else is emissive + bloom
const hemi = new THREE.HemisphereLight(0x000080, 0x000000, 0.4)
scene.add(hemi)

// ──────────────────────────────────────────────────────────────
// CITY GROUP — for unified hide/show per environment
// ──────────────────────────────────────────────────────────────
const cityGroup = new THREE.Group()
scene.add(cityGroup)
// Move existing city children into group
;(city as any).cityGroup?.children?.forEach((c: THREE.Object3D) => cityGroup.add(c))

// ──────────────────────────────────────────────────────────────
// ENVIRONMENT MANAGER
// ──────────────────────────────────────────────────────────────
const envManager = new EnvironmentManager(scene, cityGroup)

// ──────────────────────────────────────────────────────────────
// DISTRICT NEON COLOR — drives ground puddles + sky glow
// Updated each frame based on camera section
// ──────────────────────────────────────────────────────────────
const currentNeon = new THREE.Color(0x00f5ff)  // starts cyan

function updateDistrictColor(sectionIdx: number) {
  // Map section 0–13 to district color index (0–9)
  const distIdx = Math.min(sectionIdx, DISTRICT_COLORS.length - 1)
  currentNeon.copy(DISTRICT_COLORS[distIdx])
  ground.setDistrictNeon(currentNeon)
  sky.update(0, camera.position, currentNeon)
}

// ──────────────────────────────────────────────────────────────
// SECTION ENTRY BANNER
// ──────────────────────────────────────────────────────────────
const SECTION_META: [string, string][] = [
  ['NEON DISTRICT',   'A cyberpunk portfolio'],
  ['ABOUT',           'Who is behind this'],
  ['PS3 CELL GPU',    'PS3 SPU emulator in WebGL'],
  ['CPUonGPU',        'x86 CPU running on GPU'],
  ['GPU STREAMING',   'Sub-frame game streaming'],
  ['SELKIES RUST',    'WebRTC stack rebuilt in Rust'],
  ['ORIS AI',         'Autonomous SRE agent'],
  ['VAJRAGRID',       'AI power grid security'],
  ['VIDYAMITRA',      'Adaptive JEE AI tutor'],
  ['NETFLIP',         'HLS streaming platform'],
  ['ARENA OJ',        'Online judge platform'],
  ['HACKATHON',       'Competition highlights'],
  ['TECH STACK',      'Tools and languages'],
  ['CONTACT',         'Get in touch'],
]

const _banner = document.createElement('div')
_banner.id = 'section-banner'
Object.assign(_banner.style, {
  position: 'fixed', bottom: '24px', left: '50%',
  transform: 'translateX(-50%)',
  textAlign: 'center', pointerEvents: 'none',
  zIndex: '50', opacity: '0', transition: 'opacity 0.4s',
  background: 'rgba(0,0,8,0.65)', padding: '10px 28px',
  borderTop: '1px solid currentColor',
})
document.body.appendChild(_banner)

function showBanner(idx: number) {
  const [name, purpose] = SECTION_META[idx] ?? ['', '']
  const neon = DISTRICT_COLORS[idx] ? '#' + DISTRICT_COLORS[idx].getHexString() : '#00f5ff'
  _banner.style.color = neon
  _banner.innerHTML = `
    <div style="font-family:monospace;font-size:8px;letter-spacing:4px;color:${neon};margin-bottom:4px;text-transform:uppercase;opacity:0.7">
      DISTRICT_${String(idx).padStart(2,'0')}
    </div>
    <div style="font-family:monospace;font-size:1.1rem;font-weight:900;color:#fff;
                text-shadow:0 0 20px ${neon},0 0 40px ${neon}88;letter-spacing:0.08em;line-height:1.1">
      ${name}
    </div>
    <div style="font-family:monospace;font-size:0.75rem;color:${neon};
                letter-spacing:0.15em;margin-top:4px;opacity:0.85">
      ${purpose}
    </div>
  `
  _banner.style.opacity = '1'
}

// ──────────────────────────────────────────────────────────────
// CAMERA PATH
// ──────────────────────────────────────────────────────────────
const camPath = new CameraPath(camera)
camPath.onSectionChange = (idx) => {
  showSection(idx)
  updateHUD(idx)
  updateDistrictColor(idx)
  postFX.triggerGlitch()
  envManager.onSection(idx)
  showBanner(idx)
}

// ──────────────────────────────────────────────────────────────
// NAVIGATION DOTS
// ──────────────────────────────────────────────────────────────
const dotsContainer = document.getElementById('nav-dots')!
SECTION_KEYFRAMES.forEach((kf, i) => {
  const dot = document.createElement('div')
  dot.className = 'nav-dot' + (i === 0 ? ' active' : '')
  dot.title = kf.label
  dot.addEventListener('click', () => camPath.goTo(i))
  dotsContainer.appendChild(dot)
})

// ──────────────────────────────────────────────────────────────
// SECTION SHOW/HIDE
// ──────────────────────────────────────────────────────────────
function showSection(idx: number) {
  document.querySelectorAll('.sect').forEach((el, i) => {
    el.classList.toggle('active', i === idx)
  })
  // Update nav dot active state
  document.querySelectorAll('.nav-dot').forEach((el, i) => {
    el.classList.toggle('active', i === idx)
  })
}

function updateHUD(idx: number) {
  const d = document.getElementById('hud-section')
  if (d) d.textContent = `DISTRICT_${String(idx).padStart(2,'0')} / ${SECTION_KEYFRAMES[idx].label}`
}

// ──────────────────────────────────────────────────────────────
// SKILLS PANEL
// ──────────────────────────────────────────────────────────────
const sg = document.getElementById('skills-grid')
if (sg) {
  Object.entries(SKILLS).forEach(([cat, items]) => {
    const div = document.createElement('div')
    div.className = 'skill-cat'
    div.innerHTML = `<div class="skill-cat-name">// ${cat}</div>` +
      items.map(s => `<div class="skill-item">${s}</div>`).join('')
    sg.appendChild(div)
  })
}

// ──────────────────────────────────────────────────────────────
// CONTACT TERMINAL INPUT
// ──────────────────────────────────────────────────────────────
const contactInput = document.getElementById('contact-input') as HTMLInputElement
const contactDisplay = document.getElementById('contact-input-display')
document.getElementById('sect-13')?.addEventListener('click', () => contactInput?.focus())
contactInput?.addEventListener('input', () => {
  if (contactDisplay) contactDisplay.textContent = (contactInput.value || '') + '_'
  if (contactInput.value.trim().toLowerCase() === 'sudo') {
    triggerSudo()
    contactInput.value = ''
    if (contactDisplay) contactDisplay.textContent = '_'
  }
})

function triggerSudo() {
  const body = document.querySelector('#sect-13 .terminal-body')
  if (!body) return
  const p = document.createElement('p')
  p.className = 'output neon-green'
  p.textContent = '> Permission granted. Downloading your future...'
  body.appendChild(p)
  setTimeout(() => {
    const p2 = document.createElement('p')
    p2.className = 'output'
    p2.innerHTML = '<span style="color:#ffe642">root@neon-district:~# ██████████ 100%  COMPLETE</span>'
    body.appendChild(p2)
  }, 1500)
}

// ──────────────────────────────────────────────────────────────
// KONAMI CODE → WIREFRAME MODE
// ──────────────────────────────────────────────────────────────
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']
let kIdx = 0
window.addEventListener('keydown', (e) => {
  if (e.key === KONAMI[kIdx]) { kIdx++ } else { kIdx = 0 }
  if (kIdx === KONAMI.length) {
    kIdx = 0
    toggleWireframe()
  }
})
let wireframe = false
function toggleWireframe() {
  wireframe = !wireframe
  ;[city.sectionLow, city.sectionMid, city.sectionTop, city.meshD].forEach(m => {
    const mat = m.material as THREE.ShaderMaterial
    mat.wireframe = wireframe
  })
}

// ──────────────────────────────────────────────────────────────
// LOADING SEQUENCE
// ──────────────────────────────────────────────────────────────
const bootLog = document.getElementById('boot-log')
const bootBar = document.getElementById('boot-bar')
const loadingScreen = document.getElementById('loading-screen')

const BOOT_STEPS = [
  'Initializing WebGPU context',
  'Generating city geometry',
  'Compiling 47 shader programs',
  'Spawning rain particles',
  'Calibrating post-processing chain',
  'System ready',
]

async function runBoot() {
  for (let i = 0; i < BOOT_STEPS.length; i++) {
    await new Promise(r => setTimeout(r, 260 + Math.random() * 200))
    const p = document.createElement('p')
    p.innerHTML = `<span style="color:rgba(0,245,255,.5)">[BOOT]</span> ${BOOT_STEPS[i]}... <span class="ok">[OK]</span>`
    bootLog?.appendChild(p)
    if (bootBar) bootBar.style.width = ((i + 1) / BOOT_STEPS.length * 100) + '%'
  }
  await new Promise(r => setTimeout(r, 600))
  loadingScreen?.classList.add('fade-out')
  setTimeout(() => { if (loadingScreen) loadingScreen.style.display = 'none' }, 850)
}
runBoot()

// ──────────────────────────────────────────────────────────────
// LABEL CLICK RAYCASTING
// ──────────────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
window.addEventListener('click', (e) => {
  // Don't raycast if clicking on the detail panel itself
  if ((e.target as HTMLElement).closest('#env-detail-panel')) return
  mouse.x =  (e.clientX / innerWidth)  * 2 - 1
  mouse.y = -(e.clientY / innerHeight) * 2 + 1
  raycaster.setFromCamera(mouse, camera)
  const hits = raycaster.intersectObjects(scene.children, true)
  for (const hit of hits) {
    const obj = hit.object
    if (obj.userData.isLabel && obj.userData.onClick) {
      e.stopPropagation()
      obj.userData.onClick()
      return
    }
  }
  // Click on empty space — nothing to do (no panel)
})

// ──────────────────────────────────────────────────────────────
// RESIZE
// ──────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
  postFX.resize(innerWidth, innerHeight)
})

// ──────────────────────────────────────────────────────────────
// RENDER LOOP
// ──────────────────────────────────────────────────────────────
const clock = new THREE.Clock()
function animate() {
  requestAnimationFrame(animate)
  const t   = clock.getElapsedTime()
  const dt  = clock.getDelta()

  city.update(t)
  ground.update(t)
  rain.update(t, camera.position)
  neonSigns.update(t)
  sky.update(t, camera.position, currentNeon)
  camPath.update(dt)
  envManager.update(t)

  postFX.render()
}
animate()
