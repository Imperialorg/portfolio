import * as THREE from 'three'
import { groundVert, groundFrag } from '../shaders/index'

export class Ground {
  mesh!: THREE.Mesh
  private mat!: THREE.ShaderMaterial

  create(scene: THREE.Scene) {
    const geo = new THREE.PlaneGeometry(1200, 1200, 1, 1)
    this.mat = new THREE.ShaderMaterial({
      vertexShader: groundVert,
      fragmentShader: groundFrag,
      uniforms: {
        uTime:          { value: 0 },
        uDistrictNeon:  { value: new THREE.Color(0x00f5ff) },
        uRainIntensity: { value: 1.0 },
      },
    })

    this.mesh = new THREE.Mesh(geo, this.mat)
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.position.y = 0
    scene.add(this.mesh)
    return this.mesh
  }

  update(time: number) {
    this.mat.uniforms.uTime.value = time
  }

  setDistrictNeon(color: THREE.Color) {
    this.mat.uniforms.uDistrictNeon.value.copy(color)
  }

  setRainIntensity(v: number) {
    this.mat.uniforms.uRainIntensity.value = v
  }
}

