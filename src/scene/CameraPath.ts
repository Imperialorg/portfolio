import * as THREE from 'three'

// Scroll-driven camera path through the city
export const SECTIONS = [
  { name: 'hero',     label: 'JACK IN' },
  { name: 'about',    label: 'IDENTITY' },
  { name: 'projects', label: 'WORK' },
  { name: 'skills',   label: 'ARSENAL' },
  { name: 'contact',  label: 'REACH OUT' },
]

// Camera keyframes: [position, lookAt target]
const KEYFRAMES: Array<{ pos: THREE.Vector3; target: THREE.Vector3 }> = [
  // 0 — Hero: high above center, looking down at city
  { pos: new THREE.Vector3(0, 220, 80),   target: new THREE.Vector3(0, 0, 0) },
  // 1 — About: dive into street level alley
  { pos: new THREE.Vector3(20, 30, 60),   target: new THREE.Vector3(20, 20, 0) },
  // 2 — Projects: rooftop level arc, facing buildings
  { pos: new THREE.Vector3(-60, 90, 20),  target: new THREE.Vector3(-20, 60, -60) },
  // 3 — Skills: inside a grid corridor
  { pos: new THREE.Vector3(40, 15, -80),  target: new THREE.Vector3(40, 20, -140) },
  // 4 — Contact: ground level terminal plaza
  { pos: new THREE.Vector3(-10, 8, -20),  target: new THREE.Vector3(-10, 10, -60) },
]

export class CameraPath {
  private camera: THREE.PerspectiveCamera
  private currentSection = 0
  private totalScroll = 0
  private mouseX = 0
  private mouseY = 0
  private lerpPos = new THREE.Vector3()
  private lerpTarget = new THREE.Vector3()

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera
    this.lerpPos.copy(KEYFRAMES[0].pos)
    this.lerpTarget.copy(KEYFRAMES[0].target)
    this.camera.position.copy(KEYFRAMES[0].pos)
    this.camera.lookAt(KEYFRAMES[0].target)
  }

  setupScrollListener(onSectionChange: (idx: number) => void) {
    const totalSections = SECTIONS.length

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY * 0.0012
      this.totalScroll = Math.max(0, Math.min(totalSections - 1, this.totalScroll + delta))
      const newSection = Math.floor(this.totalScroll)
      if (newSection !== this.currentSection) {
        this.currentSection = newSection
        onSectionChange(newSection)
      }
    }

    let lastTouchY = 0
    const onTouchStart = (e: TouchEvent) => { lastTouchY = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => {
      const dy = (lastTouchY - e.touches[0].clientY) * 0.003
      lastTouchY = e.touches[0].clientY
      this.totalScroll = Math.max(0, Math.min(totalSections - 1, this.totalScroll + dy))
      const newSection = Math.floor(this.totalScroll)
      if (newSection !== this.currentSection) {
        this.currentSection = newSection
        onSectionChange(newSection)
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    })

    document.querySelectorAll('.nav-dot').forEach((dot, i) => {
      dot.addEventListener('click', () => {
        this.totalScroll = i
        this.currentSection = i
        onSectionChange(i)
      })
    })
  }

  update(dt: number) {
    const t = this.totalScroll
    const i0 = Math.floor(t)
    const i1 = Math.min(i0 + 1, KEYFRAMES.length - 1)
    const frac = t - i0
    const smooth = frac * frac * (3 - 2 * frac)

    const tPos = new THREE.Vector3().lerpVectors(KEYFRAMES[i0].pos, KEYFRAMES[i1].pos, smooth)
    const tLook = new THREE.Vector3().lerpVectors(KEYFRAMES[i0].target, KEYFRAMES[i1].target, smooth)

    // Mouse parallax
    tPos.x += this.mouseX * 8
    tPos.y -= this.mouseY * 5

    this.lerpPos.lerp(tPos, Math.min(dt * 2.5, 1))
    this.lerpTarget.lerp(tLook, Math.min(dt * 3, 1))

    this.camera.position.copy(this.lerpPos)
    this.camera.lookAt(this.lerpTarget)
  }

  getSection() { return this.currentSection }
  getScrollT() { return this.totalScroll }
}
