import gsap from 'gsap'
import { PROJECTS } from '../sections/data'
import { drawPanelCanvas } from './PanelEnv'

/**
 * Screen-space card crossfade overlay.
 * When navigating between project sections, the old card fades out while
 * the new card fades in at the same screen position — "one card becoming another."
 * The 3D billboard in world space enters only after this overlay fades out.
 */
export class TransitionOverlay {
  private wrap: HTMLDivElement
  private oldCanvas: HTMLCanvasElement
  private newCanvas: HTMLCanvasElement
  // neon border element that flashes with new section's color
  private border: HTMLDivElement

  // called when crossfade is ~80% done — time for 3D billboard to start entering
  onReadyToReveal?: () => void

  constructor() {
    this.wrap = document.createElement('div')
    Object.assign(this.wrap.style, {
      position: 'fixed',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'clamp(320px, 72vw, 900px)',
      aspectRatio: '900 / 440',
      pointerEvents: 'none',
      zIndex: '50',
      opacity: '0',
      borderRadius: '3px',
      overflow: 'hidden',
      willChange: 'opacity',
    })

    this.oldCanvas = this._makeCanvas()
    this.newCanvas = this._makeCanvas()

    // Neon border flash
    this.border = document.createElement('div')
    Object.assign(this.border.style, {
      position: 'absolute', inset: '0',
      border: '2px solid transparent',
      borderRadius: '3px',
      pointerEvents: 'none',
      opacity: '0',
      zIndex: '2',
      boxSizing: 'border-box',
    })

    this.wrap.appendChild(this.oldCanvas)
    this.wrap.appendChild(this.newCanvas)
    this.wrap.appendChild(this.border)
    document.body.appendChild(this.wrap)
  }

  private _makeCanvas(): HTMLCanvasElement {
    const c = document.createElement('canvas')
    Object.assign(c.style, {
      position: 'absolute', top: '0', left: '0',
      width: '100%', height: '100%',
      opacity: '0',
    })
    return c
  }

  private _blit(dest: HTMLCanvasElement, src: HTMLCanvasElement) {
    dest.width = src.width
    dest.height = src.height
    dest.getContext('2d')!.drawImage(src, 0, 0)
  }

  /**
   * Cross-dissolve from fromIdx to toIdx (section indices).
   * fromIdx can be -1 (no previous card — just fade in new one).
   */
  transition(fromIdx: number, toIdx: number) {
    const isProjectSection = (i: number) => i >= 2 && i <= 11
    if (!isProjectSection(toIdx)) return   // non-project sections: skip overlay

    const fromProj = isProjectSection(fromIdx) ? PROJECTS[fromIdx - 2] : null
    const toProj   = PROJECTS[toIdx - 2]
    const neonHex  = toProj.neonColor

    // Paint canvases
    if (fromProj) {
      this._blit(this.oldCanvas, drawPanelCanvas(fromProj))
      gsap.set(this.oldCanvas, { opacity: 1 })
    } else {
      gsap.set(this.oldCanvas, { opacity: 0 })
    }
    this._blit(this.newCanvas, drawPanelCanvas(toProj))
    gsap.set(this.newCanvas, { opacity: 0 })

    // Neon border color = destination project
    this.border.style.borderColor  = neonHex
    this.border.style.boxShadow    = `0 0 18px ${neonHex}88, inset 0 0 12px ${neonHex}22`

    // Kill any previous tweens
    gsap.killTweensOf([this.wrap, this.oldCanvas, this.newCanvas, this.border])

    // Show wrapper instantly
    gsap.set(this.wrap, { opacity: 1 })

    // Crossfade: old out + new in simultaneously over 0.45s
    gsap.to(this.oldCanvas, { opacity: 0, duration: 0.45, ease: 'power2.in' })
    gsap.to(this.newCanvas, { opacity: 1, duration: 0.45, ease: 'power2.out' })

    // Border flash: pulse in then out
    gsap.fromTo(this.border,
      { opacity: 0 },
      { opacity: 1, duration: 0.15, ease: 'power2.out',
        onComplete: () => gsap.to(this.border, { opacity: 0, duration: 0.35, ease: 'power2.in' })
      }
    )

    // At 80% of crossfade → signal 3D billboard to start entering
    gsap.delayedCall(0.36, () => this.onReadyToReveal?.())

    // Fade out the whole overlay after crossfade completes
    gsap.to(this.wrap, { opacity: 0, duration: 0.35, delay: 0.5, ease: 'power2.in' })
  }
}
