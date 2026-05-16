const BOOT_STEPS = [
  { label: '[BOOT] Initializing GPU context', delay: 200 },
  { label: '[BOOT] Loading city geometry', delay: 350 },
  { label: '[BOOT] Compiling GLSL shaders', delay: 280 },
  { label: '[BOOT] Spawning rain system', delay: 200 },
  { label: '[BOOT] Calibrating neon grid', delay: 250 },
  { label: '[BOOT] Loading neural pathways', delay: 300 },
  { label: '[BOOT] System ready', delay: 150 },
]

export class LoadingScreen {
  private el: HTMLElement
  private lines: HTMLElement
  private bar: HTMLElement
  private pct: HTMLElement
  private step = 0

  constructor() {
    this.el = document.getElementById('loading-screen')!
    this.lines = document.getElementById('boot-lines')!
    this.bar = document.getElementById('boot-bar')!
    this.pct = document.getElementById('boot-pct')!
  }

  async run(): Promise<void> {
    for (let i = 0; i < BOOT_STEPS.length; i++) {
      await this.delay(BOOT_STEPS[i].delay)
      this.addLine(BOOT_STEPS[i].label, i === BOOT_STEPS.length - 1 ? 'ok' : 'ok')
      this.setProgress(Math.round(((i + 1) / BOOT_STEPS.length) * 100))
    }
    await this.delay(400)
  }

  hide() {
    this.el.classList.add('fade-out')
    setTimeout(() => { this.el.style.display = 'none' }, 900)
  }

  private addLine(label: string, type: 'ok' | 'warn' = 'ok') {
    const div = document.createElement('div')
    div.className = 'boot-line'
    div.innerHTML = `<span class="label">${label}...</span><span class="${type}">[${type.toUpperCase()}]</span>`
    this.lines.appendChild(div)
    this.lines.scrollTop = this.lines.scrollHeight
  }

  private setProgress(pct: number) {
    this.bar.style.setProperty('--pct', `${pct}%`)
    this.pct.textContent = `${pct}%`
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
  }
}
