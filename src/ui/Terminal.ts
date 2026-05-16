export class Terminal {
  private el!: HTMLElement
  private input!: HTMLInputElement
  private output!: HTMLElement
  private history: string[] = []
  private visible = false

  readonly COMMANDS: Record<string, () => string> = {
    help: () => `Available commands:
  github      — open GitHub profile
  linkedin    — open LinkedIn
  email       — copy email address
  whoami      — about Shantan
  skills      — tech stack
  clear       — clear terminal
  sudo        — try it ;)`,
    github: () => {
      window.open('https://github.com/Aerosane', '_blank')
      return 'Opening github.com/Aerosane...'
    },
    linkedin: () => {
      window.open('https://linkedin.com/in/shantan-dheer-932082383', '_blank')
      return 'Opening LinkedIn...'
    },
    email: () => {
      navigator.clipboard?.writeText('shantandheerd@gmail.com').catch(() => {})
      return 'Email copied: shantandheerd@gmail.com'
    },
    whoami: () => `D Shantan Dheer
1st-year EEE @ GCET, Hyderabad
GPU kernels · CUDA emulators · AI systems
Runner-up TechSynapse 2026
Exhibited India Innovates 2026, Bharat Mandapam`,
    skills: () => `SYSTEMS  CUDA · C · C++ · Rust · x86-64 ASM
WEB      TypeScript · Python · Go · Next.js · FastAPI
INFRA    Docker · Azure · Fastly CDN · GitHub Actions
AI       ONNX Runtime · scikit-learn · LLM APIs`,
    clear: () => { this.output.innerHTML = ''; return '' },
    sudo: () => `[sudo] password for shantan: \n\nAccess granted.\nDownloading your future...\n\n> Connecting to opportunity.net...\n> Found: 3 open internship slots\n> Initiating contact sequence...`,
  }

  create(): HTMLElement {
    this.el = document.createElement('div')
    this.el.id = 'terminal'
    this.el.style.cssText = `
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: 320px;
      background: rgba(0, 8, 16, 0.97);
      border-top: 1px solid rgba(0,245,255,0.3);
      font-family: 'Share Tech Mono', monospace;
      font-size: 0.82rem;
      color: #ccc;
      display: flex;
      flex-direction: column;
      z-index: 60;
      transform: translateY(100%);
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: auto;
    `

    this.el.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 20px;border-bottom:1px solid rgba(0,245,255,0.15);background:rgba(0,245,255,0.04)">
        <span style="color:#00f5ff;font-size:0.75rem;letter-spacing:0.1em">NEON DISTRICT TERMINAL v1.0</span>
        <span style="flex:1"></span>
        <button id="term-close" style="background:none;border:1px solid rgba(0,245,255,0.3);color:#00f5ff;padding:2px 10px;cursor:pointer;font-family:inherit;font-size:0.75rem">✕ CLOSE</button>
      </div>
      <div id="term-output" style="flex:1;overflow-y:auto;padding:12px 20px;scrollbar-width:thin;scrollbar-color:#00f5ff22 transparent"></div>
      <div style="display:flex;align-items:center;padding:8px 20px;border-top:1px solid rgba(0,245,255,0.1)">
        <span style="color:#00f5ff;margin-right:8px">~/neon $</span>
        <input id="term-input" type="text" autocomplete="off" spellcheck="false"
          style="flex:1;background:none;border:none;outline:none;color:#e0e0e0;font-family:inherit;font-size:0.82rem;caret-color:#00f5ff" 
          placeholder="type 'help' for commands" />
      </div>
    `

    document.body.appendChild(this.el)
    this.output = document.getElementById('term-output') as HTMLElement
    this.input = document.getElementById('term-input') as HTMLInputElement

    document.getElementById('term-close')!.addEventListener('click', () => this.hide())

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = this.input.value.trim().toLowerCase()
        this.input.value = ''
        if (!cmd) return
        this.history.push(cmd)
        this.print(`<span style="color:#00f5ff">~/neon $</span> ${cmd}`)
        const result = this.COMMANDS[cmd]
          ? this.COMMANDS[cmd]()
          : `Command not found: ${cmd}. Type 'help'.`
        if (result) this.print(result)
      }
      // History navigation
      if (e.key === 'ArrowUp' && this.history.length) {
        this.input.value = this.history[this.history.length - 1]
      }
    })

    // Show intro message
    this.print(`<span style="color:#00f5ff">NEON DISTRICT TERMINAL</span>
<span style="color:#888">Type 'help' for available commands.</span>`)

    return this.el
  }

  private print(text: string) {
    const div = document.createElement('div')
    div.style.cssText = 'margin-bottom:6px;line-height:1.6;white-space:pre-wrap'
    div.innerHTML = text
    this.output.appendChild(div)
    this.output.scrollTop = this.output.scrollHeight
  }

  show() {
    this.visible = true
    this.el.style.transform = 'translateY(0)'
    setTimeout(() => this.input.focus(), 400)
  }

  hide() {
    this.visible = false
    this.el.style.transform = 'translateY(100%)'
  }

  toggle() {
    this.visible ? this.hide() : this.show()
  }

  isVisible() { return this.visible }
}
