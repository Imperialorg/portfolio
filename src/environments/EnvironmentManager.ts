import * as THREE from 'three'
import { Environment } from './Environment'
import { PanelEnv } from './PanelEnv'
import { TransitionOverlay } from './TransitionOverlay'
import { SECTION_KEYFRAMES } from '../scene/CameraPath'

// [sectionIdx, projectIdx] — panel pos = look target, cam pos = camera pos for that section
const PANEL_SECTIONS: [number, number][] = [
  [2,  0],
  [3,  1],
  [4,  2],
  [5,  3],
  [6,  4],
  [7,  5],
  [8,  6],
  [9,  7],
  [10, 8],
  [11, 9],
]

export class EnvironmentManager {
  private envs = new Map<number, Environment>()
  private activeEnv: Environment | null = null
  private activeIdx = -1
  private overlay = new TransitionOverlay()

  constructor(scene: THREE.Scene, _cityGroup: THREE.Group) {
    for (const [sectionIdx, projIdx] of PANEL_SECTIONS) {
      const kf = SECTION_KEYFRAMES[sectionIdx]
      const env = new PanelEnv(projIdx, kf.look.clone(), kf.pos.clone())
      env.create(scene)
      env.group.visible = false
      this.envs.set(sectionIdx, env)
    }
  }

  onSection(idx: number) {
    if (idx === this.activeIdx) return
    const prevIdx = this.activeIdx
    this.activeIdx = idx

    // Exit old env immediately
    if (this.activeEnv) { this.activeEnv.exit(); this.activeEnv = null }

    const env = this.envs.get(idx)
    if (!env) return

    this.activeEnv = env

    // Run the 2D crossfade overlay — one card dissolves into the next
    this.overlay.onReadyToReveal = () => env.enter()
    this.overlay.transition(prevIdx, idx)
  }

  update(t: number) {
    if (this.activeEnv) this.activeEnv.update(t)
  }
}
