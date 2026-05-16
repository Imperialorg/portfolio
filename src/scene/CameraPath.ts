import * as THREE from 'three'
import GSAP from 'gsap'

export const SECTION_KEYFRAMES: Array<{
  pos: THREE.Vector3
  look: THREE.Vector3
  label: string
  t: number   // normalized position along spline (0–1), set after build
}> = [
  { pos: new THREE.Vector3(0, 180, 220),   look: new THREE.Vector3(0, 0, 0),        label: 'HERO',       t: 0 },
  { pos: new THREE.Vector3(-40, 12, 110),  look: new THREE.Vector3(-20, 20, 60),    label: 'ABOUT',      t: 0 },
  { pos: new THREE.Vector3(-80, 200, 65),  look: new THREE.Vector3(-80, 200, 20),   label: 'PS3 GPU',    t: 0 },
  { pos: new THREE.Vector3(-75, 200, 25),  look: new THREE.Vector3(-75, 200, -25),  label: 'CPUonGPU',   t: 0 },
  { pos: new THREE.Vector3(-13, 200, -55), look: new THREE.Vector3(0,   200, -90),  label: 'GPU Stream', t: 0 },
  { pos: new THREE.Vector3(19, 200, -80),  look: new THREE.Vector3(40,  200, -110), label: 'Selkies',    t: 0 },
  { pos: new THREE.Vector3(90, 200, -65),  look: new THREE.Vector3(100, 200, -100), label: 'Oris AI',    t: 0 },
  { pos: new THREE.Vector3(101, 200, 8),   look: new THREE.Vector3(90,  200, -20),  label: 'VajraGrid',  t: 0 },
  { pos: new THREE.Vector3(84, 200, 76),   look: new THREE.Vector3(70,  200, 50),   label: 'VidyaMitra', t: 0 },
  { pos: new THREE.Vector3(34, 200, 106),  look: new THREE.Vector3(20,  200, 80),   label: 'Netflip',    t: 0 },
  { pos: new THREE.Vector3(-5, 200, 96),   look: new THREE.Vector3(-20, 200, 70),   label: 'Arena',      t: 0 },
  { pos: new THREE.Vector3(-20, 200, 67),  look: new THREE.Vector3(-10, 200, 40),   label: 'Hackathon',  t: 0 },
  { pos: new THREE.Vector3(-60, 8, 30),    look: new THREE.Vector3(-40, 8, 0),      label: 'SKILLS',     t: 0 },
  { pos: new THREE.Vector3(0, 120, 160),   look: new THREE.Vector3(0, 0, 0),        label: 'CONTACT',    t: 0 },
]

const SCROLL_LOCK_MS = 320

export class CameraPath {
  private camera: THREE.PerspectiveCamera

  // The spline through all camera positions
  private posSpline!: THREE.CatmullRomCurve3
  // A second spline for look-at targets
  private lookSpline!: THREE.CatmullRomCurve3

  // Current animated t (0→1 along spline)
  private t = 0
  private currentSection = 0

  private mouseX = 0
  private mouseY = 0

  // Scratch vectors reused every frame
  private _pos  = new THREE.Vector3()
  private _look = new THREE.Vector3()
  private _ahead = new THREE.Vector3()

  onSectionChange?: (idx: number) => void

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera
    this.buildSpline()
    this.init()
  }

  private buildSpline() {
    const posPoints  = SECTION_KEYFRAMES.map(kf => kf.pos.clone())
    const lookPoints = SECTION_KEYFRAMES.map(kf => kf.look.clone())

    this.posSpline  = new THREE.CatmullRomCurve3(posPoints,  false, 'catmullrom', 0.5)
    this.lookSpline = new THREE.CatmullRomCurve3(lookPoints, false, 'catmullrom', 0.5)

    // Bake approximate t for each keyframe by finding closest point on spline
    // Since keyframes ARE the spline control points, t ≈ i/(N-1)
    const N = SECTION_KEYFRAMES.length
    SECTION_KEYFRAMES.forEach((kf, i) => { kf.t = i / (N - 1) })

    // Set initial camera state
    this.t = 0
    this.posSpline.getPoint(0, this._pos)
    this.lookSpline.getPoint(0, this._look)
    this.camera.position.copy(this._pos)
    this.camera.lookAt(this._look)
  }

  private init() {
    window.addEventListener('mousemove', e => {
      this.mouseX = (e.clientX / window.innerWidth  - 0.5) * 2
      this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    })

    let scrollLocked = false
    window.addEventListener('wheel', e => {
      if (scrollLocked) return
      scrollLocked = true
      const dir = e.deltaY > 0 ? 1 : -1
      this.goTo(this.currentSection + dir)
      setTimeout(() => { scrollLocked = false }, SCROLL_LOCK_MS)
    }, { passive: true })

    let touchY = 0
    window.addEventListener('touchstart', e => { touchY = e.touches[0].clientY })
    window.addEventListener('touchend', e => {
      const dy = touchY - e.changedTouches[0].clientY
      if (Math.abs(dy) > 40) this.goTo(this.currentSection + (dy > 0 ? 1 : -1))
    })

    window.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') this.goTo(this.currentSection + 1)
      if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  this.goTo(this.currentSection - 1)
    })
  }

  goTo(idx: number) {
    idx = Math.max(0, Math.min(SECTION_KEYFRAMES.length - 1, idx))
    if (idx === this.currentSection) return

    const prevSection = this.currentSection
    this.currentSection = idx
    this._lastFiredSection = idx
    const targetT = SECTION_KEYFRAMES[idx].t

    // Fire transition IMMEDIATELY on scroll — don't wait for camera to arrive
    this.onSectionChange?.(idx)
    this._updateUI(idx)

    // Camera follows after — its travel time is independent of the transition
    const dist = Math.abs(targetT - this.t)
    const duration = 0.6 + dist * 5.0

    GSAP.killTweensOf(this)
    GSAP.to(this, {
      t: targetT,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => this._fireCrossings(prevSection, idx),
    })
  }

  private _lastFiredSection = 0

  // Fire onSectionChange as camera passes through intermediate sections
  private _fireCrossings(from: number, to: number) {
    const dir = to > from ? 1 : -1
    SECTION_KEYFRAMES.forEach((kf, i) => {
      const crossed = dir > 0
        ? (this.t >= kf.t && i > this._lastFiredSection && i <= to)
        : (this.t <= kf.t && i < this._lastFiredSection && i >= to)
      if (crossed) {
        this._lastFiredSection = i
        this.onSectionChange?.(i)
        this._updateUI(i)
      }
    })
  }

  update(_delta: number) {
    // Sample spline at current t
    this.posSpline.getPoint(this.t, this._pos)
    this.camera.position.copy(this._pos)

    // Look slightly ahead on the path for natural forward motion feel,
    // blended with the explicit look target
    const tAhead = Math.min(1, this.t + 0.015)
    this.posSpline.getPoint(tAhead, this._ahead)

    this.lookSpline.getPoint(this.t, this._look)

    // Blend: explicit look target (80%) + forward direction (20%)
    const lookX = this._look.x * 0.8 + this._ahead.x * 0.2 + this.mouseX * 5
    const lookY = this._look.y * 0.8 + this._ahead.y * 0.2 - this.mouseY * 3
    const lookZ = this._look.z * 0.8 + this._ahead.z * 0.2

    this.camera.lookAt(lookX, lookY, lookZ)
  }

  private _updateUI(idx: number) {
    document.querySelectorAll('.nav-dot').forEach((d, i) => d.classList.toggle('active', i === idx))
    const bar = document.getElementById('progress-bar')
    if (bar) bar.style.height = (idx / (SECTION_KEYFRAMES.length - 1) * 100) + '%'
  }

  getCurrentSection() { return this.currentSection }
}
