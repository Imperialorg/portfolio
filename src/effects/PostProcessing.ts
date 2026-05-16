import * as THREE from 'three'
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  ChromaticAberrationEffect,
  VignetteEffect,
  NoiseEffect,
  GlitchEffect,
  ScanlineEffect,
  BlendFunction,
} from 'postprocessing'

export class PostProcessing {
  composer!: EffectComposer
  private glitch!: GlitchEffect
  private glitchTimeout = 0

  setup(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.composer = new EffectComposer(renderer)

    const renderPass = new RenderPass(scene, camera)

    const bloom = new BloomEffect({
      blendFunction: BlendFunction.ADD,
      luminanceThreshold: 0.25,
      luminanceSmoothing: 0.4,
      intensity: 2.2,
      radius: 0.6,
    })

    const chromAb = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.0018, 0.0012),
      radialModulation: true,
      modulationOffset: 0.5,
    })

    const vignette = new VignetteEffect({
      eskil: false,
      offset: 0.35,
      darkness: 0.7,
    })

    const filmNoise = new NoiseEffect({
      blendFunction: BlendFunction.OVERLAY,
      premultiply: true,
    })
    filmNoise.blendMode.opacity.value = 0.04

    const scanlines = new ScanlineEffect({
      blendFunction: BlendFunction.OVERLAY,
      density: 1.4,
    })
    scanlines.blendMode.opacity.value = 0.08

    this.glitch = new GlitchEffect({
      delay: new THREE.Vector2(99999, 99999), // disabled by default — triggered on section change
      duration: new THREE.Vector2(0.15, 0.35),
      strength: new THREE.Vector2(0.15, 0.4),
      columns: 0.04,
      ratio: 0.85,
    })

    this.composer.addPass(renderPass)
    this.composer.addPass(new EffectPass(camera, bloom))
    this.composer.addPass(new EffectPass(camera, chromAb, scanlines, vignette, filmNoise))
    this.composer.addPass(new EffectPass(camera, this.glitch))

    return this.composer
  }

  triggerGlitch() {
    this.glitch.delay.set(0, 0.05)
    clearTimeout(this.glitchTimeout)
    this.glitchTimeout = window.setTimeout(() => {
      this.glitch.delay.set(99999, 99999)
    }, 600)
  }

  resize(w: number, h: number) {
    this.composer.setSize(w, h)
  }

  render() {
    this.composer.render()
  }
}
