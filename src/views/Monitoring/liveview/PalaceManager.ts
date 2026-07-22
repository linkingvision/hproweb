/**
 * PalaceManager — 对照 GridLayoutManager SDK，为 View.vue 的 .palace 格子
 * 动态注入悬浮按钮层（float-layer）及关闭按钮，并通过 CustomEvent 派发动作。
 *
 * 事件列表（与 GridLayoutManager 保持一致）：
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
  recEnable?:    boolean   // 初始手动录像状态
  audio?:        boolean   // 初始对讲状态
  playModeText?: string    // 覆盖全局 playModeText
}

export class PalaceManager extends EventTarget {
  private options:     PalaceManagerOptions
  private layers  = new Map<string, HTMLElement>()  // cellId → float-layer

  constructor(options: PalaceManagerOptions = {}) {
    super()
    this.options = options
  }

  // ─── 注入单个格子的悬浮层 ──────────────────────────────────────────────
  injectFloatLayer(cellId: string, opts: InjectOptions = {}) {
    const container = document.getElementById('h' + cellId)
    if (!container) return

    // 幂等：先移除旧层
    this.removeFloatLayer(cellId)

    const icons = this.options.createIcons ?? {}

    // ── float-layer ──
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

    // ── 关闭按钮（左上角，对照 GridLayoutManager closeCell） ──
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

  // ─── 移除单个格子的悬浮层 ─────────────────────────────────────────────
  removeFloatLayer(cellId: string) {
    const layer = this.layers.get(cellId)
    if (layer) {
      // 同时移除 close 按钮（紧随 layer 之后插入，parentElement 相同）
      layer.parentElement?.querySelector('.pm-cell-close')?.remove()
      layer.remove()
      this.layers.delete(cellId)
    }
  }

  // ─── 切换对讲激活状态图标 ─────────────────────────────────────────────
  changeAudio(cellId: string, isActive: boolean) {
    const icon = this.layers.get(cellId)?.querySelector<HTMLElement>('[data-action="shoutwheat"]')
    if (!icon) return
    icon.className = `iconfont ${isActive ? 'icon-duijiang audio-active' : 'icon-duijiang'}`
    icon.setAttribute('data-audio', isActive ? 'true' : 'false')
  }

  // ─── 切换手动录像激活状态图标 ─────────────────────────────────────────
  changeRecEnable(cellId: string, recEnable: boolean) {
    const icon = this.layers.get(cellId)?.querySelector<HTMLElement>('[data-action="rec"]')
    if (!icon) return
    icon.className = `iconfont ${recEnable ? 'icon-luzhi rec-active' : 'icon-luzhi'}`
    icon.setAttribute('data-rec', recEnable ? 'true' : 'false')
  }

  // ─── 更新所有格子的播放模式文字 ───────────────────────────────────────
  changePlayModeText(text: string) {
    this.layers.forEach(layer => {
      const span = layer.querySelector<HTMLElement>('.pm-text')
      if (span) span.textContent = text
    })
  }

  // ─── 销毁全部 ─────────────────────────────────────────────────────────
  destroy() {
    ;[...this.layers.keys()].forEach(id => this.removeFloatLayer(id))
    this.layers.clear()
  }

  // ─── 私有工具 ─────────────────────────────────────────────────────────
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
