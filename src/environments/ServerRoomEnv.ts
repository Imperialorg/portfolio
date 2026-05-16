import * as THREE from 'three'
import { Environment, makeFloatingLabel, showProjectPanel } from './Environment'
import { PROJECTS } from '../sections/data'

const CENTER = new THREE.Vector3(-80, -8, 38)

// ─── Server rack LED blade shader ────────────────────────────────────────────
const RACK_FRAG = `
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;
float hash(float n){ return fract(sin(n)*43758.5); }
void main() {
  vec3 col = vec3(0.06, 0.07, 0.11);
  float row = floor(vUv.y * 24.0);
  float rowF = fract(vUv.y * 24.0);
  float ledX = fract(vUv.x * 6.0);
  float h    = hash(row);
  float flicker = 0.82 + 0.18*sin(uTime*3.2 + h*12.0);
  float led  = step(0.70,ledX)*step(ledX,0.86)*step(0.1,rowF)*step(rowF,0.3);
  vec3 lCol  = h>0.15 ? vec3(0.0,0.9,0.25) : vec3(0.9,0.4,0.0);
  col += lCol * led * flicker * 3.0;
  col *= 1.0 - step(0.88,rowF)*0.6;
  col += vec3(0.0,0.25,0.12)*(1.0-abs(vUv.x-0.5)*2.0)*0.04;
  gl_FragColor = vec4(col, uVisible);
}
`

// ─── Floor grating ────────────────────────────────────────────────────────────
const FLOOR_FRAG = `
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;
void main() {
  vec2 g  = fract(vUv*32.0);
  float grid = step(0.91,g.x)+step(0.91,g.y);
  float dist  = length(vUv-0.5);
  float fade  = 1.0-smoothstep(0.2,0.5,dist);
  float pulse = 0.5+0.5*sin(uTime*0.6-dist*8.0);
  col = vec3(0.0,0.55,0.35)*grid*fade*(0.4+0.6*pulse);
  gl_FragColor = vec4(col, grid*fade*0.55*uVisible);
}
`

// ─── SPE→PPE data bus: bright beam + particles along it ─────────────────────
const BUS_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`
const BUS_FRAG = `
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;
void main() {
  // Tube cross-section: distance from center
  float radial = 1.0 - smoothstep(0.28,0.5,abs(vUv.y-0.5)*2.0);
  // Core glow
  float core = exp(-abs(vUv.y-0.5)*12.0);
  // Electron packets: 4 per bus
  float flow = 0.0;
  for(int k=0;k<4;k++){
    float t = fract(uTime*0.9 + float(k)*0.25);
    float pkt = exp(-abs(vUv.x - t)*22.0);
    flow += pkt;
  }
  vec3 col = vec3(0.1,0.85,1.0)*(core*0.6 + flow*radial*1.8);
  gl_FragColor = vec4(col, (radial*0.35+flow*radial*0.9)*uVisible);
}
`

// ─── Cell BE hologram ring shader ────────────────────────────────────────────
const RING_FRAG = `
uniform float uTime;
uniform float uRadius;
uniform float uVisible;
uniform vec3  uColor;
varying vec2 vUv;
void main() {
  vec2 uv = vUv - 0.5;
  float r   = length(uv);
  float ring = 1.0-smoothstep(0.,0.025,abs(r-uRadius));
  float angle = atan(uv.y,uv.x);
  float scan = 0.5+0.5*sin(angle*4.0 - uTime*2.5);
  float pulse = 0.6+0.4*sin(uTime*2.0);
  gl_FragColor = vec4(uColor*(ring*(0.5+0.5*scan)*pulse), ring*0.8*uVisible);
}
`

const PLAIN_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`

export class ServerRoomEnv extends Environment {
  private rackMat!:   THREE.ShaderMaterial
  private floorMat!:  THREE.ShaderMaterial
  private busMats:    THREE.ShaderMaterial[] = []
  private ringMats:   THREE.ShaderMaterial[] = []
  private ppeMat!:    THREE.MeshBasicMaterial

  create(scene: THREE.Scene) {
    scene.add(this.group)

    // Floor grating
    this.floorMat = new THREE.ShaderMaterial({
      vertexShader: PLAIN_VERT,
      fragmentShader: FLOOR_FRAG.replace('col =', 'vec3 col ='),
      uniforms: { uTime:{value:0}, uVisible:{value:0} },
      transparent: true,
    })
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(64, 54), this.floorMat)
    floor.rotation.x = -Math.PI/2
    floor.position.set(CENTER.x, CENTER.y-6, CENTER.z)
    this.group.add(floor)

    // 8 server racks (2 rows × 4)
    this.rackMat = new THREE.ShaderMaterial({
      vertexShader: PLAIN_VERT, fragmentShader: RACK_FRAG,
      uniforms: { uTime:{value:0}, uVisible:{value:0} },
      transparent: true,
    })
    const rackPositions: [number,number,number][] = [
      [-18,-9,10],[-12,-9,10],[-6,-9,10],[0,-9,10],
      [-18,-9,-10],[-12,-9,-10],[-6,-9,-10],[0,-9,-10],
    ]
    for (const [x,y,z] of rackPositions) {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(4,24,6), this.rackMat)
      rack.position.set(CENTER.x+x, CENTER.y+y+12, CENTER.z+z)
      this.group.add(rack)
    }

    // Ceiling fluorescent strips
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: 0.7 })
    for (let i=0;i<3;i++){
      const s = new THREE.Mesh(new THREE.PlaneGeometry(42, 0.5), stripMat.clone())
      s.rotation.x = Math.PI/2
      s.position.set(CENTER.x-9, CENTER.y+5.8, CENTER.z-8+i*8)
      this.group.add(s)
    }

    // ── Cell BE hologram ──────────────────────────────────────────
    const HOLO = new THREE.Vector3(CENTER.x+14, CENTER.y+2, CENTER.z)

    // PPE core — rotating octahedron
    this.ppeMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, wireframe: true, transparent: true, opacity: 0.9 })
    const ppe = new THREE.Mesh(new THREE.OctahedronGeometry(2.8, 1), this.ppeMat)
    ppe.position.copy(HOLO)
    this.group.add(ppe)
    ppe.userData.rotating = true

    // PPE orbit ring
    const orbitRingMat = new THREE.ShaderMaterial({
      vertexShader: PLAIN_VERT, fragmentShader: RING_FRAG,
      uniforms: { uTime:{value:0}, uVisible:{value:0}, uRadius:{value:0.42}, uColor:{value:new THREE.Color(0x00f5ff)} },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    })
    const orbitRing = new THREE.Mesh(new THREE.PlaneGeometry(14,14), orbitRingMat)
    orbitRing.rotation.x = -Math.PI/2
    orbitRing.position.set(HOLO.x, HOLO.y, HOLO.z)
    this.group.add(orbitRing)
    this.ringMats.push(orbitRingMat)

    // 6 SPE nodes at hex positions
    const speMat = new THREE.MeshBasicMaterial({ color: 0x39ff14, wireframe: true, transparent: true, opacity: 0.85 })
    const spePositions: THREE.Vector3[] = []
    for(let i=0;i<6;i++){
      const angle = (i/6)*Math.PI*2
      const p = new THREE.Vector3(HOLO.x+Math.cos(angle)*6, HOLO.y, HOLO.z+Math.sin(angle)*6)
      spePositions.push(p)
      const spe = new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.9,0.5,6), speMat.clone())
      spe.position.copy(p)
      this.group.add(spe)

      // Vertical ring around each SPE
      const speRingMat = new THREE.ShaderMaterial({
        vertexShader: PLAIN_VERT, fragmentShader: RING_FRAG,
        uniforms: { uTime:{value:0}, uVisible:{value:0}, uRadius:{value:0.46}, uColor:{value:new THREE.Color(0x39ff14)} },
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
      })
      const speRing = new THREE.Mesh(new THREE.PlaneGeometry(4,4), speRingMat)
      speRing.rotation.x = -Math.PI/2
      speRing.position.copy(p)
      this.group.add(speRing)
      this.ringMats.push(speRingMat)
    }

    // ── Data bus beams: PPE → each SPE ─────────────────────────────
    // Each bus is a TubeGeometry with an animated flow shader
    for(let i=0;i<6;i++){
      const curve = new THREE.LineCurve3(HOLO, spePositions[i])
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.12, 6, false)
      const busMat = new THREE.ShaderMaterial({
        vertexShader: PLAIN_VERT, fragmentShader: BUS_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uVisible: { value: 0 },
        },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      })
      // Stagger phase so buses don't all pulse together
      busMat.uniforms.uTime.value = i * 0.16
      this.group.add(new THREE.Mesh(tubeGeo, busMat))
      this.busMats.push(busMat)
    }

    // Floating label
    const proj = PROJECTS[0]
    const lbl = makeFloatingLabel(proj.title, proj.neonColor, () => showProjectPanel(proj))
    lbl.position.set(HOLO.x + 5, HOLO.y + 8, HOLO.z)
    lbl.scale.setScalar(1.8)
    this.group.add(lbl)
  }

  update(t: number) {
    this.rackMat.uniforms.uTime.value  = t
    this.floorMat.uniforms.uTime.value = t
    this.ringMats.forEach(m => m.uniforms.uTime.value = t)
    this.busMats.forEach((m, i) => m.uniforms.uTime.value = t + i * 0.16)

    // Rotate PPE core
    this.group.traverse(o => {
      if (o.userData.rotating) { o.rotation.y += 0.008; o.rotation.x += 0.003 }
    })
  }

  protected setVisible(v: number) {
    this.rackMat.uniforms.uVisible.value  = v
    this.floorMat.uniforms.uVisible.value = v
    this.ringMats.forEach(m => m.uniforms.uVisible.value = v)
    this.busMats.forEach(m => m.uniforms.uVisible.value = v)
    if (this.ppeMat) this.ppeMat.opacity = v * 0.9
  }

  onHover() {}
}
