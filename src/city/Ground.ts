import * as THREE from 'three'
import { groundVert, groundFrag } from '../shaders/index'

export class Ground {
  mesh!: THREE.Mesh

  create(scene: THREE.Scene) {
    const geo = new THREE.PlaneGeometry(1200, 1200, 1, 1)
    const mat = new THREE.RawShaderMaterial({
      vertexShader: groundVert,
      fragmentShader: groundFrag,
      uniforms: {
        uTime: { value: 0 },
      },
      glslVersion: THREE.GLSL3,
    })

    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.position.y = 0
    scene.add(this.mesh)
    return this.mesh
  }

  update(time: number) {
    const mat = this.mesh.material as THREE.RawShaderMaterial
    mat.uniforms.uTime.value = time
  }
}
