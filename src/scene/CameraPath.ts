import * as THREE from 'three'
import GSAP from 'gsap'

// 14 sections: 0=hero, 1=about, 2-11=projects(10), 12=skills, 13=contact
export const SECTION_KEYFRAMES: Array<{
  pos: THREE.Vector3
  look: THREE.Vector3
  label: string
}> = [
  { pos: new THREE.Vector3(0, 180, 220),   look: new THREE.Vector3(0, 0, 0),       label: 'HERO' },
  { pos: new THREE.Vector3(-40, 12, 110),  look: new THREE.Vector3(-20, 20, 60),   label: 'ABOUT' },
  { pos: new THREE.Vector3(-80, -8, 55),   look: new THREE.Vector3(-80, -8, 20),   label: 'PS3 GPU' },
  { pos: new THREE.Vector3(-75, 30, -25),  look: new THREE.Vector3(-75, 0, -25),   label: 'CPUonGPU' },
  { pos: new THREE.Vector3(-30, 10, -60),  look: new THREE.Vector3(0, 20, -90),    label: 'GPU Stream' },
  { pos: new THREE.Vector3(20, 35, -80),   look: new THREE.Vector3(40, 25, -110),  label: 'Selkies' },
  { pos: new THREE.Vector3(80, 55, -70),   look: new THREE.Vector3(100, 35, -100), label: 'Oris AI' },
  { pos: new THREE.Vector3(110, 40, 0),    look: new THREE.Vector3(90, 22, -20),   label: 'VajraGrid' },
  { pos: new THREE.Vector3(100, 20, 70),   look: new THREE.Vector3(70, 14, 50),    label: 'VidyaMitra' },
  { pos: new THREE.Vector3(50, 16, 100),   look: new THREE.Vector3(20, 12, 80),    label: 'Netflip' },
  { pos: new THREE.Vector3(10, 22, 90),    look: new THREE.Vector3(-20, 16, 70),   label: 'Arena' },
  { pos: new THREE.Vector3(-30, 60, 70),   look: new THREE.Vector3(-10, 40, 40),   label: 'Hackathon' },
  { pos: new THREE.Vector3(-60, 8, 30),    look: new THREE.Vector3(-40, 8, 0),     label: 'SKILLS' },
  { pos: new THREE.Vector3(0, 120, 160),   look: new THREE.Vector3(0, 0, 0),       label: 'CONTACT' },
]

const TRANSITION_DURATION = 2.2  // seconds
const SCROLL_LOCK_MS = 2300       // slightly longer than tween so overlapping can't stack

export class CameraPath {
  private camera: THREE.PerspectiveCamera
  private currentSection = 0
  private mouseX = 0
  private mouseY = 0

  // live look target — GSAP animates this, update() reads it
  private liveLook = new THREE.Vector3()
  // mouse-offset look target (applied on top of liveLook when settled)
  private mouseLook = new THREE.Vector3()

  private transitioning = false
  private transitionProgress = 0  // 0→1

  onSectionChange?: (idx: number) => void

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera
    this.init()
  }

  private init() {
    const kf = SECTION_KEYFRAMES[0]
    this.camera.position.copy(kf.pos)
    this.liveLook.copy(kf.look)
    this.camera.lookAt(this.liveLook)

    window.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    })

    this.setupScrollListener()

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
      setTimeout(() => { locked = false }, SCROLL_LOCK_MS)
    }, { passive: true })

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

    this.transitioning = true
    this.transitionProgress = 0

    // Kill any in-flight tweens
    GSAP.killTweensOf(this.camera.position)
    GSAP.killTweensOf(this.liveLook)

    const proxy = { t: 0 }

    GSAP.to(this.camera.position, {
      x: kf.pos.x, y: kf.pos.y, z: kf.pos.z,
      duration: TRANSITION_DURATION,
      ease: 'power3.inOut',
    })

    GSAP.to(this.liveLook, {
      x: kf.look.x, y: kf.look.y, z: kf.look.z,
      duration: TRANSITION_DURATION,
      ease: 'power3.inOut',
    })

    // Fire environment/section callbacks near camera arrival (70% through)
    GSAP.to(proxy, {
      t: 1,
      duration: TRANSITION_DURATION,
      ease: 'none',
      onUpdate: () => {
        this.transitionProgress = proxy.t
        if (proxy.t >= 0.65 && !this._sectionFired) {
          this._sectionFired = true
          this.onSectionChange?.(idx)
          this._updateUI(idx)
        }
      },
      onComplete: () => {
        this.transitioning = false
        this._sectionFired = false
      },
    })

    // UI can update immediately (dots, progress bar) — just not environment
    this._updateUI(idx)
  }

  private _sectionFired = false

  private _updateUI(idx: number) {
    document.querySelectorAll('.nav-dot').forEach((d, i) => d.classList.toggle('active', i === idx))
    const pct = (idx / (SECTION_KEYFRAMES.length - 1)) * 100
    const bar = document.getElementById('progress-bar')
    if (bar) bar.style.height = pct + '%'
  }

  update(_delta: number) {
    // During transition: pure GSAP control — just follow liveLook
    // When settled: add subtle mouse parallax
    const kf = SECTION_KEYFRAMES[this.currentSection]
    const parallaxStrength = this.transitioning
      ? 0  // no mouse wiggle during flight
      : 1.0

    this.mouseLook.set(
      this.liveLook.x + this.mouseX * 6 * parallaxStrength,
      this.liveLook.y - this.mouseY * 4 * parallaxStrength,
      this.liveLook.z
    )

    this.camera.lookAt(this.mouseLook)
    void kf  // suppress unused warning
  }

  getCurrentSection() { return this.currentSection }
}
