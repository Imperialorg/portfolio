import * as THREE from 'three'
import { Environment } from './Environment'
import { PanelEnv } from './PanelEnv'

// look-at targets per section (camera looks here → panel appears here)
const PANEL_MAP: [number, number, THREE.Vector3][] = [
  [2,  0, new THREE.Vector3(-80, -8, 20)],
  [3,  1, new THREE.Vector3(-75, 0, -25)],
  [4,  2, new THREE.Vector3(0,  20, -90)],
  [5,  3, new THREE.Vector3(40, 25, -110)],
  [6,  4, new THREE.Vector3(100, 35, -100)],
  [7,  5, new THREE.Vector3(90, 22, -20)],
  [8,  6, new THREE.Vector3(70, 14, 50)],
  [9,  7, new THREE.Vector3(20, 12, 80)],
  [10, 8, new THREE.Vector3(-20, 16, 70)],
  [11, 9, new THREE.Vector3(-10, 40, 40)],
]

export class EnvironmentManager {
  private envs = new Map<number, Environment>()
  private activeEnv: Environment | null = null
  private activeIdx = -1

  constructor(scene: THREE.Scene, _cityGroup: THREE.Group) {
    for (const [sectionIdx, projIdx, panelPos] of PANEL_MAP) {
      const env = new PanelEnv(projIdx, panelPos)
      env.create(scene)
      env.group.visible = false
      this.envs.set(sectionIdx, env)
    }
  }

  onSection(idx: number) {
    if (idx === this.activeIdx) return
    this.activeIdx = idx
    if (this.activeEnv) { this.activeEnv.exit(); this.activeEnv = null }
    const env = this.envs.get(idx)
    if (env) { this.activeEnv = env; env.enter() }
  }

  update(t: number) {
    if (this.activeEnv) this.activeEnv.update(t)
  }
}
