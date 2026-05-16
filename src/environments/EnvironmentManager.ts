import * as THREE from 'three'
import { Environment } from './Environment'
import { ServerRoomEnv } from './ServerRoomEnv'
import { ChipSurfaceEnv } from './ChipSurfaceEnv'
import { WebRTCEnv } from './WebRTCEnv'
import { NeuralNetEnv } from './NeuralNetEnv'
import { PowerGridEnv } from './PowerGridEnv'

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
