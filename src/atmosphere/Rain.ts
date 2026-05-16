import * as THREE from 'three'
import { rand } from '../utils/noise'
import { rainVert, rainFrag } from '../shaders/index'

export class Rain {
  private points!: THREE.Points
  private count = 8000

  create(scene: THREE.Scene) {
    const positions = new Float32Array(this.count * 3)
    const speeds = new Float32Array(this.count)
    const offsets = new Float32Array(this.count)

    for (let i = 0; i < this.count; i++) {
      positions[i * 3] = rand(-300, 300)
      positions[i * 3 + 1] = rand(-60, 60)
      positions[i * 3 + 2] = rand(-300, 300)
      speeds[i] = rand(0.3, 1.0)
      offsets[i] = Math.random()
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
    geo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1))

    const mat = new THREE.RawShaderMaterial({
      vertexShader: rainVert,
      fragmentShader: rainFrag,
      uniforms: { uTime: { value: 0 }, uCameraPos: { value: new THREE.Vector3() } },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      glslVersion: THREE.GLSL3,
    })

    this.points = new THREE.Points(geo, mat)
    scene.add(this.points)
  }

  update(time: number, cameraPos: THREE.Vector3) {
    const mat = this.points.material as THREE.RawShaderMaterial
    mat.uniforms.uTime.value = time
    mat.uniforms.uCameraPos.value.copy(cameraPos)
    // Follow camera
    this.points.position.x = cameraPos.x
    this.points.position.z = cameraPos.z
  }
}
