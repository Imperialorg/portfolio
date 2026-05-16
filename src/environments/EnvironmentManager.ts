import * as THREE from 'three'
import { Environment } from './Environment'
import { ServerRoomEnv } from './ServerRoomEnv'
import { ChipSurfaceEnv } from './ChipSurfaceEnv'
import { WebRTCEnv } from './WebRTCEnv'
import { NeuralNetEnv } from './NeuralNetEnv'
import { PowerGridEnv } from './PowerGridEnv'
import { PanelEnv } from './PanelEnv'

// Sections that need the city hidden (underground or macro close-up)
const HIDE_CITY_SECTIONS = new Set([2, 3])

export class EnvironmentManager {
  private envs = new Map<number, Environment>()
  private activeEnv: Environment | null = null
  private activeIdx = -1
  private cityGroup: THREE.Group
  private cityVisible = true

  constructor(scene: THREE.Scene, cityGroup: THREE.Group) {
    this.cityGroup = cityGroup

    const map: [number, Environment][] = [
      [2,  new ServerRoomEnv()],
      [3,  new ChipSurfaceEnv()],
      [4,  new WebRTCEnv()],
      [6,  new NeuralNetEnv()],
      [7,  new PowerGridEnv()],
    ]

    for (const [idx, env] of map) {
      env.create(scene)
      env.group.visible = false
      this.envs.set(idx, env)
    }

    // PanelEnv for sections without dedicated environments
    const panelMap: [number, number, THREE.Vector3][] = [
      [5,   3, new THREE.Vector3(40, 25, -110)],   // Selkies
      [8,   6, new THREE.Vector3(70, 14, 50)],     // VidyaMitra
      [9,   7, new THREE.Vector3(20, 12, 80)],     // Netflip
      [10,  8, new THREE.Vector3(-20, 16, 70)],    // Arena
      [11,  9, new THREE.Vector3(-10, 40, 40)],    // Hackathon
    ]

    for (const [sectionIdx, projIdx, panelPos] of panelMap) {
      const env = new PanelEnv(projIdx, panelPos)
      env.create(scene)
      env.group.visible = false
      this.envs.set(sectionIdx, env)
    }
  }

  onSection(idx: number) {
    if (idx === this.activeIdx) return
    this.activeIdx = idx

    // Exit old environment
    if (this.activeEnv) {
      this.activeEnv.exit()
      this.activeEnv = null
    }

    // Restore city if leaving a hide-city section
    const needHide = HIDE_CITY_SECTIONS.has(idx)
    if (needHide && this.cityVisible) {
      this.cityVisible = false
      this.cityGroup.visible = false
    } else if (!needHide && !this.cityVisible) {
      this.cityVisible = true
      this.cityGroup.visible = true
    }

    // Enter new environment if one exists for this section
    const env = this.envs.get(idx)
    if (env) {
      this.activeEnv = env
      env.enter()
    }
  }

  update(t: number) {
    if (this.activeEnv) this.activeEnv.update(t)
  }
}
