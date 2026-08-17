export interface GamepadButtonState {
  pressed: boolean
  value: number
  index: number
}

export interface GamepadAxisState {
  value: number
  index: number
}

export type GamepadButtons = Record<string, GamepadButtonState>
export type GamepadAxes = Record<string, GamepadAxisState>

interface XboxGamepadOptions {
  onButtonPress?: (data: GamepadButtonState, name: string) => void
  onButtonRelease?: (data: GamepadButtonState, name: string) => void
  onAxisChange?: (axes: GamepadAxes) => void
  onConnected?: (connected: boolean) => void
  deadZone?: number
}

export class XboxGamepad {
  static XBOX_BUTTONS_MAP: Record<number, string> = {
    0: 'A',
    1: 'B',
    2: 'X',
    3: 'Y',
    4: 'LB',
    5: 'RB',
    6: 'LT',
    7: 'RT'
  }

  static XBOX_AXES_MAP: Record<number, string> = {
    0: 'LeftStickX',
    1: 'LeftStickY'
  }

  connected = false
  buttons: GamepadButtons
  axes: GamepadAxes

  private onButtonPress: (data: GamepadButtonState, name: string) => void
  private onButtonRelease: (data: GamepadButtonState, name: string) => void
  private onAxisChange: (axes: GamepadAxes) => void
  private onConnected: (connected: boolean) => void
  private deadZone: number
  private gamepadIndex: number | null = null
  private previousButtons: GamepadButtons
  private previousAxes: GamepadAxes
  private animationFrameId: number | null = null
  private listening = false

  private handleConnected = (event: GamepadEvent) => {
    this.gamepadIndex = event.gamepad.index
    this.connected = true
    this.onConnected(true)
    this.checkGamepad()
  }

  private handleDisconnected = (event: GamepadEvent) => {
    if (this.gamepadIndex === event.gamepad.index) {
      this.connected = false
      this.onConnected(false)
      this.gamepadIndex = null
      this.cancelFrame()
    }
  }

  constructor(options: XboxGamepadOptions = {}) {
    const {
      onButtonPress = () => { },
      onButtonRelease = () => { },
      onAxisChange = () => { },
      onConnected = () => { },
      deadZone = 0.05
    } = options

    this.onButtonPress = onButtonPress
    this.onButtonRelease = onButtonRelease
    this.onAxisChange = onAxisChange
    this.onConnected = onConnected
    this.deadZone = deadZone

    this.buttons = this.initButtons()
    this.axes = this.initAxes()
    this.previousButtons = this.initButtons()
    this.previousAxes = this.initAxes()
  }

  startListening() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('getGamepads' in navigator)) return
    if (!this.listening) {
      window.addEventListener('gamepadconnected', this.handleConnected)
      window.addEventListener('gamepaddisconnected', this.handleDisconnected)
      this.listening = true
    }

    const gamepad = this.findFirstConnectedGamepad(navigator.getGamepads())
    if (gamepad) {
      this.gamepadIndex = gamepad.index
      this.connected = true
      this.onConnected(true)
      this.checkGamepad()
    }
  }

  stopListening() {
    if (typeof window !== 'undefined' && this.listening) {
      window.removeEventListener('gamepadconnected', this.handleConnected)
      window.removeEventListener('gamepaddisconnected', this.handleDisconnected)
      this.listening = false
    }
    this.cancelFrame()
    this.connected = false
    this.gamepadIndex = null
  }

  private initButtons(): GamepadButtons {
    const buttons: GamepadButtons = {}
    Object.entries(XboxGamepad.XBOX_BUTTONS_MAP).forEach(([key, name]) => {
      buttons[name] = {
        pressed: false,
        value: 0,
        index: Number(key)
      }
    })
    return buttons
  }

  private initAxes(): GamepadAxes {
    const axes: GamepadAxes = {}
    Object.entries(XboxGamepad.XBOX_AXES_MAP).forEach(([key, name]) => {
      axes[name] = {
        value: 0,
        index: Number(key)
      }
    })
    return axes
  }

  private checkGamepad = () => {
    if (typeof navigator === 'undefined' || !('getGamepads' in navigator)) return

    const gamepads = navigator.getGamepads()
    const gamepad = this.gamepadIndex !== null ? gamepads[this.gamepadIndex] : this.findFirstConnectedGamepad(gamepads)

    if (!gamepad) {
      this.connected = false
      this.onConnected(false)
      this.gamepadIndex = null
      this.animationFrameId = requestAnimationFrame(this.checkGamepad)
      return
    }

    this.connected = true
    this.onConnected(true)
    this.gamepadIndex = gamepad.index
    this.updateButtonsState(gamepad)
    this.updateAxesState(gamepad)
    this.previousButtons = JSON.parse(JSON.stringify(this.buttons))
    this.animationFrameId = requestAnimationFrame(this.checkGamepad)
  }

  private findFirstConnectedGamepad(gamepads: readonly (Gamepad | null)[]): Gamepad | null {
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i]
      if (gamepad) return gamepad
    }
    return null
  }

  private updateButtonsState(gamepad: Gamepad) {
    Object.entries(XboxGamepad.XBOX_BUTTONS_MAP).forEach(([key, name]) => {
      const index = Number(key)
      const button = gamepad.buttons[index]
      if (!button) return

      const data: GamepadButtonState = {
        pressed: button.pressed,
        value: button.value,
        index
      }
      const previousButton = this.previousButtons[name]
      this.buttons[name] = data
      if (button.pressed && !previousButton?.pressed) {
        this.onButtonPress(data, name)
      }
      if (!button.pressed && previousButton?.pressed) {
        this.onButtonRelease(data, name)
      }
    })
  }

  private updateAxesState(gamepad: Gamepad) {
    let axesStatus = false
    Object.entries(XboxGamepad.XBOX_AXES_MAP).forEach(([key, name]) => {
      const index = Number(key)
      const rawValue = gamepad.axes[index] ?? 0
      const axisValue = Math.abs(rawValue) > this.deadZone ? rawValue : 0

      this.axes[name] = {
        value: axisValue,
        index
      }

      const previousAxisValue = this.previousAxes[name]?.value ?? 0
      if (Math.abs(Math.ceil(axisValue * 10) / 10 - Math.ceil(previousAxisValue * 10) / 10) >= 0.1) {
        axesStatus = true
      }
    })

    if (axesStatus) {
      this.onAxisChange(JSON.parse(JSON.stringify(this.axes)))
      this.previousAxes = JSON.parse(JSON.stringify(this.axes))
    }
  }

  private cancelFrame() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }
}
