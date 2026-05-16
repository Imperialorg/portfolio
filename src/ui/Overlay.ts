import { PROJECTS, Project as ProjectData } from '../sections/data'

export class Overlay {
  private el: HTMLElement
  private content: HTMLElement
  private closeBtn: HTMLElement
  private active = false

  constructor() {
    this.el = document.getElementById('overlay')!
    this.content = document.getElementById('overlay-content')!
    this.closeBtn = document.getElementById('overlay-close')!

    this.closeBtn.addEventListener('click', () => this.close())
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.close()
    })
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close()
    })
  }

  open(projectId: string) {
    const p = PROJECTS.find(p => p.id === projectId)
    if (!p) return

    this.content.innerHTML = this.renderProject(p)
    this.el.classList.remove('hidden')
    this.active = true
    this.closeBtn.focus()
  }

  close() {
    this.el.classList.add('hidden')
    this.active = false
  }

  isActive() { return this.active }

  private renderProject(p: ProjectData): string {
    const tags = p.tags.map((t: string) => `<span class="proj-overlay-tag">${t}</span>`).join('')
    const badge = (p as any).badge ? `<div class="proj-overlay-badge">${(p as any).badge}</div>` : ''
    return `
      <div class="proj-overlay-title" style="text-shadow: 0 0 20px ${p.neonColor}">${p.title}</div>
      ${badge}
      <p class="proj-overlay-desc">${p.desc}</p>
      <div class="proj-overlay-tags">${tags}</div>
      <a class="proj-overlay-link" href="${p.url}" target="_blank" rel="noopener noreferrer"
         style="border-color:${p.neonColor};color:${p.neonColor}">
        [ VIEW ON GITHUB → ]
      </a>
    `
  }
}
