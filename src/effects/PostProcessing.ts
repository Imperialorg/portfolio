import * as THREE from 'three'
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  Effect,
  BloomEffect,
  ChromaticAberrationEffect,
  VignetteEffect,
  NoiseEffect,
  GlitchEffect,
  ScanlineEffect,
  BlendFunction,
} from 'postprocessing'

// ──────────────────────────────────────────────────────────────
// Custom lens streak — single-pass horizontal bright-source streak
// Samples 8 taps left + 8 right from each pixel, accumulating only
// above-threshold brightness. Gives the "anamorphic lens flare" look.
// ──────────────────────────────────────────────────────────────
const lensStreakFrag = /* glsl */`
  uniform float uIntensity;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    const int TAPS = 8;
    const float THRESHOLD = 0.78;
    const float TAP_SPACING = 0.005;

    vec3 streak = vec3(0.0);

    for (int i = 1; i <= TAPS; i++) {
      float ofs    = float(i) * TAP_SPACING;
      float weight = 1.0 / float(i);

      // Sample left
      vec4 sL = texture2D(inputBuffer, vec2(uv.x - ofs, uv.y));
      float lL = dot(sL.rgb, vec3(0.299, 0.587, 0.114));
      streak += sL.rgb * max(0.0, lL - THRESHOLD) * weight;

      // Sample right
      vec4 sR = texture2D(inputBuffer, vec2(uv.x + ofs, uv.y));
      float lR = dot(sR.rgb, vec3(0.299, 0.587, 0.114));
      streak += sR.rgb * max(0.0, lR - THRESHOLD) * weight;
    }

    outputColor = vec4(inputColor.rgb + streak * uIntensity, inputColor.a);
  }
`

class LensStreakEffect extends Effect {
  constructor(intensity = 0.45) {
    super('LensStreakEffect', lensStreakFrag, {
      uniforms: new Map([['uIntensity', new THREE.Uniform(intensity)]]),
    })
  }
}

// ──────────────────────────────────────────────────────────────

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
      intensity: 2.4,
      radius: 0.6,
    })

    const lensStreak = new LensStreakEffect(0.45)

    const chromAb = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.0018, 0.0012),
      radialModulation: true,
      modulationOffset: 0.5,
    })

    const vignette = new VignetteEffect({
      eskil: false,
      offset: 0.35,
      darkness: 0.75,
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
    scanlines.blendMode.opacity.value = 0.07

    this.glitch = new GlitchEffect({
      delay: new THREE.Vector2(99999, 99999), // disabled by default — triggered on section change
      duration: new THREE.Vector2(0.15, 0.35),
      strength: new THREE.Vector2(0.15, 0.4),
      columns: 0.04,
      ratio: 0.85,
    })

    this.composer.addPass(renderPass)
    // Bloom + lens streak together — streak samples post-bloom brightness
    this.composer.addPass(new EffectPass(camera, bloom, lensStreak))
    // Chromatic aberration + scanlines + vignette + film grain
    this.composer.addPass(new EffectPass(camera, chromAb, scanlines, vignette, filmNoise))
    // Glitch — separate pass so it can be triggered independently
    this.composer.addPass(new EffectPass(camera, this.glitch))

    return this.composer
  }

  /** Trigger a brief digital glitch (call on section transitions) */
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

