import * as THREE from 'three'
import gsap from 'gsap'

export interface HoverInfo {
  title: string
  lines: string[]
}

export abstract class Environment {
  readonly group = new THREE.Group()
  hoverTargets: THREE.Object3D[] = []
  protected visible = false
  protected visibleValue = 0  // uVisible 0→1

  abstract create(scene: THREE.Scene): void
  abstract update(t: number): void
  abstract onHover(obj: THREE.Object3D | null, info: HoverInfo | null): void

  enter() {
    this.group.visible = true
    this.visible = true
    gsap.killTweensOf(this)
    gsap.to(this, { visibleValue: 1, duration: 1.4, ease: 'power2.out',
      onUpdate: () => this.setVisible(this.visibleValue) })
  }

  exit() {
    this.visible = false
    gsap.killTweensOf(this)
    gsap.to(this, { visibleValue: 0, duration: 0.8, ease: 'power2.in',
      onUpdate: () => this.setVisible(this.visibleValue),
      onComplete: () => { this.group.visible = false } })
  }

  // Subclasses override to drive uVisible uniforms + GSAP state
  protected setVisible(_v: number) {}

  dispose() { this.group.traverse(o => {
    if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose()
  }) }
}

// Minimal canvas label texture
export function makeLabel(text: string, sub: string, color = '#00f5ff'): THREE.Texture {
  const W = 320, H = 96
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, W, H)
  ctx.strokeStyle = color; ctx.lineWidth = 1.5
  ctx.strokeRect(1, 1, W-2, H-2)
  ctx.fillStyle = color + '18'; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = color; ctx.font = 'bold 20px monospace'
  ctx.textAlign = 'center'; ctx.fillText(text, W/2, 34)
  ctx.fillStyle = 'rgba(200,230,255,0.7)'; ctx.font = '13px monospace'
  ctx.fillText(sub, W/2, 58)
  return new THREE.CanvasTexture(c)
}

export function makeLabelMesh(text: string, sub: string, color = '#00f5ff'): THREE.Mesh {
  const tex = makeLabel(text, sub, color)
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.5), mat)
  return mesh
}
