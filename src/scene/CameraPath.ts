import * as THREE from 'three'
import GSAP from 'gsap'

// 14 sections: 0=hero, 1=about, 2-11=projects(10), 12=skills, 13=contact
// Camera flies through the city grid (grid spans ±256 units)
export const SECTION_KEYFRAMES: Array<{
  pos: THREE.Vector3
  look: THREE.Vector3
  label: string
}> = [
  // 0 — HERO: high bird's eye dive in
  { pos: new THREE.Vector3(0, 180, 220),   look: new THREE.Vector3(0, 0, 0),       label: 'HERO' },
  // 1 — ABOUT: street level alley
  { pos: new THREE.Vector3(-40, 12, 110),  look: new THREE.Vector3(-20, 20, 60),   label: 'ABOUT' },
  // 2 — Project 0 (GPU Emulator): underground server room, looking at racks
  { pos: new THREE.Vector3(-80, -8, 55),   look: new THREE.Vector3(-80, -8, 20),   label: 'PS3 GPU' },
  // 3 — Project 1 (CPUonGPU): top-down chip surface view
  { pos: new THREE.Vector3(-75, 30, -25),  look: new THREE.Vector3(-75, 0, -25),   label: 'CPUonGPU' },
  // 4 — Project 2 (GPU Streaming): billboard alley
  { pos: new THREE.Vector3(-30, 10, -60),  look: new THREE.Vector3(0, 20, -90),    label: 'GPU Stream' },
  // 5 — Project 3 (Selkies-Rust): rise to mid level
  { pos: new THREE.Vector3(20, 35, -80),   look: new THREE.Vector3(40, 25, -110),  label: 'Selkies' },
  // 6 — Project 4 (Oris AI): neon AI district rooftop
  { pos: new THREE.Vector3(80, 55, -70),   look: new THREE.Vector3(100, 35, -100), label: 'Oris AI' },
  // 7 — Project 5 (VajraGrid): power grid tower flyby
  { pos: new THREE.Vector3(110, 40, 0),    look: new THREE.Vector3(90, 22, -20),   label: 'VajraGrid' },
  // 8 — Project 6 (VidyaMitra): education zone, gentle
  { pos: new THREE.Vector3(100, 20, 70),   look: new THREE.Vector3(70, 14, 50),    label: 'VidyaMitra' },
  // 9 — Project 7 (Netflip): commercial neon zone
  { pos: new THREE.Vector3(50, 16, 100),   look: new THREE.Vector3(20, 12, 80),    label: 'Netflip' },
  // 10 — Project 8 (Coding Arena): arena building
  { pos: new THREE.Vector3(10, 22, 90),    look: new THREE.Vector3(-20, 16, 70),   label: 'Arena' },
  // 11 — Project 9 (Hackathon): trophy building
  { pos: new THREE.Vector3(-30, 60, 70),   look: new THREE.Vector3(-10, 40, 40),   label: 'Hackathon' },
  // 12 — SKILLS: server corridor, close low
  { pos: new THREE.Vector3(-60, 8, 30),    look: new THREE.Vector3(-40, 8, 0),     label: 'SKILLS' },
  // 13 — CONTACT: final pullback
  { pos: new THREE.Vector3(0, 120, 160),   look: new THREE.Vector3(0, 0, 0),       label: 'CONTACT' },
]

export class CameraPath {
  private camera: THREE.PerspectiveCamera
  private currentSection = 0
  private mouseX = 0
  private mouseY = 0
  private parallaxTarget = new THREE.Vector3()
  onSectionChange?: (idx: number) => void

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera
    this.init()
  }

  private init() {
    // Set initial position
    const kf = SECTION_KEYFRAMES[0]
    this.camera.position.copy(kf.pos)
    this.camera.lookAt(kf.look)

    // Mouse parallax
    window.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    })

    // Scroll drives section changes
    this.setupScrollListener()

    // Keyboard arrow nav
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') this.goTo(this.currentSection + 1)
      if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  this.goTo(this.currentSection - 1)
    })
  }

  private setupScrollListener() {
    let lastY = 0
    let locked = false

    window.addEventListener('wheel', (e) => {
      if (locked) return
      locked = true
      const dir = e.deltaY > 0 ? 1 : -1
      this.goTo(this.currentSection + dir)
      setTimeout(() => { locked = false }, 900)
    }, { passive: true })

    // Touch
    window.addEventListener('touchstart', (e) => { lastY = e.touches[0].clientY })
    window.addEventListener('touchend', (e) => {
      const dy = lastY - e.changedTouches[0].clientY
      if (Math.abs(dy) > 40) this.goTo(this.currentSection + (dy > 0 ? 1 : -1))
    })
  }

  goTo(idx: number) {
    idx = Math.max(0, Math.min(SECTION_KEYFRAMES.length - 1, idx))
    if (idx === this.currentSection) return
    this.currentSection = idx
    const kf = SECTION_KEYFRAMES[idx]

    GSAP.to(this.camera.position, {
      x: kf.pos.x, y: kf.pos.y, z: kf.pos.z,
      duration: 1.8,
      ease: 'power2.inOut',
    })
    GSAP.to(this.parallaxTarget, {
      x: kf.look.x, y: kf.look.y, z: kf.look.z,
      duration: 1.8,
      ease: 'power2.inOut',
      onUpdate: () => this.camera.lookAt(this.parallaxTarget),
    })

    this.onSectionChange?.(idx)

    // Update progress dots
    const dots = document.querySelectorAll('.nav-dot')
    dots.forEach((d, i) => d.classList.toggle('active', i === idx))
    const pct = (idx / (SECTION_KEYFRAMES.length - 1)) * 100
    const bar = document.getElementById('progress-bar')
    if (bar) bar.style.height = pct + '%'
  }

  update(_delta: number) {
    // Subtle parallax wiggle — only when camera has settled
    const kf = SECTION_KEYFRAMES[this.currentSection]
    const lookTarget = new THREE.Vector3(
      kf.look.x + this.mouseX * 8,
      kf.look.y - this.mouseY * 5,
      kf.look.z
    )
    this.camera.lookAt(lookTarget)
  }

  getCurrentSection() { return this.currentSection }
}
