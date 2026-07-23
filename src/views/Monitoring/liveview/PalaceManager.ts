/**
 * PalaceManager — mirrors the GridLayoutManager SDK to dynamically inject a
 * floating button layer (float-layer) and a close button into each .palace cell
 * in View.vue, dispatching actions via CustomEvent.
 *
 * Events (kept consistent with GridLayoutManager):
 *   closeCell       detail: cellId (string)
 *   cellClick       detail: cellId (string)
 *   Information     detail: { id: cellId }
 *   Shoutwheat      detail: { id: cellId, audio: boolean }
 *   Snapshot        detail: { id: cellId }
 *   recEnableClick  detail: { id: cellId, recEnable: boolean }
 *   PtzControlShow  detail: { id: cellId }
 */

export interface PalaceManagerIcons {
  playModeIcon?:   boolean
  playModeText?:   string
  informationIcon?: boolean
  shouwhearIcon?:   boolean
  snapshotIcon?:    boolean
  recEnableIcon?:   boolean
  ptzcontrolIcon?:  boolean
}

export interface PalaceManagerOptions {
  createIcons?: PalaceManagerIcons
}

export interface InjectOptions {
  recEnable?:    boolean   // initial manual recording state
  audio?:        boolean   // initial intercom state
  playModeText?: string    // overrides the global playModeText
}

export class PalaceManager extends EventTarget {
  private options:     PalaceManagerOptions
  private layers  = new Map<string, HTMLElement>()  // cellId → float-layer element

  constructor(options: PalaceManagerOptions = {}) {
    super()
    this.options = options
  }

  // ─── Inject float layer into a single cell ───────────────────────────────
  injectFloatLayer(cellId: string, opts: InjectOptions = {}) {
    const container = document.getElementById('h' + cellId)
    if (!container) return

    // Idempotent: remove any existing layer before injecting a new one
    this.removeFloatLayer(cellId)

    const icons = this.options.createIcons ?? {}

    const layer = document.createElement('div')
    layer.className = 'float-layer'

    if (icons.playModeIcon) {
      const span = document.createElement('span')
      span.className = 'pm-text'
      span.textContent = opts.playModeText ?? icons.playModeText ?? 'WS'
      layer.appendChild(span)
    }
    if (icons.informationIcon)  layer.appendChild(this._icon('icon-xinxi',    'information'))
    if (icons.shouwhearIcon)    layer.appendChild(this._icon(
      opts.audio ? 'icon-duijiang audio-active' : 'icon-duijiang', 'shoutwheat',
      { 'data-audio': opts.audio ? 'true' : 'false' }
    ))
    if (icons.snapshotIcon)     layer.appendChild(this._icon('icon-kuaizhao', 'snapshot'))
    if (icons.recEnableIcon)    layer.appendChild(this._icon(
      opts.recEnable ? 'icon-luzhi rec-active' : 'icon-luzhi', 'rec',
      { 'data-rec': opts.recEnable ? 'true' : 'false' }
    ))
    if (icons.ptzcontrolIcon)   layer.appendChild(this._icon('icon-ptz',      'ptz'))

    layer.addEventListener('click', (e) => this._onLayerClick(e, cellId))
    container.appendChild(layer)

    // Close button (top-left corner, mirrors GridLayoutManager closeCell)
    const closeBtn = document.createElement('button')
    closeBtn.className = 'pm-cell-close'
    closeBtn.textContent = '×'
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this._dispatch('closeCell', cellId)
    })
    container.appendChild(closeBtn)

    this.layers.set(cellId, layer)
  }

  // ─── Remove float layer from a single cell ───────────────────────────────
  removeFloatLayer(cellId: string) {
    const layer = this.layers.get(cellId)
    if (layer) {
      // Also remove the close button, which is inserted immediately after the layer under the same parentElement
      layer.parentElement?.querySelector('.pm-cell-close')?.remove()
      layer.remove()
      this.layers.delete(cellId)
    }
  }

  // ─── Toggle intercom active-state icon ───────────────────────────────────
  changeAudio(cellId: string, isActive: boolean) {
    const icon = this.layers.get(cellId)?.querySelector<HTMLElement>('[data-action="shoutwheat"]')
    if (!icon) return
    icon.className = `iconfont ${isActive ? 'icon-duijiang audio-active' : 'icon-duijiang'}`
    icon.setAttribute('data-audio', isActive ? 'true' : 'false')
  }

  // ─── Toggle manual recording active-state icon ───────────────────────────
  changeRecEnable(cellId: string, recEnable: boolean) {
    const icon = this.layers.get(cellId)?.querySelector<HTMLElement>('[data-action="rec"]')
    if (!icon) return
    icon.className = `iconfont ${recEnable ? 'icon-luzhi rec-active' : 'icon-luzhi'}`
    icon.setAttribute('data-rec', recEnable ? 'true' : 'false')
  }

  // ─── Update play mode text across all cells ──────────────────────────────
  changePlayModeText(text: string) {
    this.layers.forEach(layer => {
      const span = layer.querySelector<HTMLElement>('.pm-text')
      if (span) span.textContent = text
    })
  }

  // ─── Destroy all layers ───────────────────────────────────────────────────
  destroy() {
    ;[...this.layers.keys()].forEach(id => this.removeFloatLayer(id))
    this.layers.clear()
  }

  // ─── Private utilities ────────────────────────────────────────────────────
  private _icon(cls: string, action: string, attrs: Record<string, string> = {}): HTMLElement {
    const i = document.createElement('i')
    i.className = `iconfont ${cls}`
    i.setAttribute('data-action', action)
    Object.entries(attrs).forEach(([k, v]) => i.setAttribute(k, v))
    return i
  }

  private _onLayerClick(e: MouseEvent, cellId: string) {
    e.stopPropagation()
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')
    if (!target) return
    const action = target.getAttribute('data-action')!

    switch (action) {
      case 'information':
        this._dispatch('Information', { id: cellId }); break
      case 'shoutwheat': {
        const audio = target.getAttribute('data-audio') === 'true'
        this._dispatch('Shoutwheat', { id: cellId, audio }); break
      }
      case 'snapshot':
        this._dispatch('Snapshot', { id: cellId }); break
      case 'rec': {
        const recEnable = target.getAttribute('data-rec') === 'true'
        this._dispatch('recEnableClick', { id: cellId, recEnable }); break
      }
      case 'ptz':
        this._dispatch('PtzControlShow', { id: cellId }); break
    }
  }

  private _dispatch(event: string, detail: any) {
    this.dispatchEvent(new CustomEvent(event, { detail }))
  }
}
