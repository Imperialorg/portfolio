import * as THREE from 'three'
import { skyVert, skyFrag } from '../shaders/index'

export class SkyDome {
  private mesh!: THREE.Mesh
  private mat!: THREE.ShaderMaterial

  create(scene: THREE.Scene) {
    // Large inverted sphere — camera follows it each frame so it never clips
    const geo = new THREE.SphereGeometry(2000, 32, 16)

    this.mat = new THREE.ShaderMaterial({
      vertexShader: skyVert,
      fragmentShader: skyFrag,
      uniforms: {
        uTime:         { value: 0.0 },
        uZenithColor:  { value: new THREE.Color(0x020408) },   // near-black zenith
        uHorizonColor: { value: new THREE.Color(0x1a0810) },   // dark reddish city glow
        uDistrictNeon: { value: new THREE.Color(0x00f5ff) },   // cyan by default
      },
      side: THREE.BackSide,
      depthWrite: false,
    })

    this.mesh = new THREE.Mesh(geo, this.mat)
    // Render first so everything draws on top of sky
    this.mesh.renderOrder = -1
    scene.add(this.mesh)
  }

  /** Call every frame — keeps dome centered on camera and updates time/color */
  update(t: number, cameraPos: THREE.Vector3, neonColor?: THREE.Color) {
    this.mesh.position.copy(cameraPos)
    this.mat.uniforms.uTime.value = t
    if (neonColor) {
      this.mat.uniforms.uDistrictNeon.value.copy(neonColor)
    }
  }

  setDistrictColors(horizon: THREE.Color, neon: THREE.Color) {
    this.mat.uniforms.uHorizonColor.value.copy(horizon)
    this.mat.uniforms.uDistrictNeon.value.copy(neon)
  }
}
