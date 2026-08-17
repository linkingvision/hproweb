<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { XboxGamepad, type GamepadAxes, type GamepadButtonState } from '@/utils/gamepad'

interface ButtonItem {
  pressed: boolean
  value: number
  bind: string
}

const { t } = useI18n()

const sensitivityPT = ref(50)
const sensitivityZ = ref(50)
const connected = ref(false)
const zoomPressed = ref(false)
const joystickPressed = ref(false)

const buttonMap = reactive<Record<string, ButtonItem>>({
  '0': { pressed: false, value: 0, bind: t('Joystick.joystick_next_layout') },
  '1': { pressed: false, value: 0, bind: t('Joystick.joystick_previous_layout') },
  '2': { pressed: false, value: 0, bind: t('Joystick.joystick_fullscreen') },
  '3': { pressed: false, value: 0, bind: t('Joystick.joystick_hotkey1') },
  '4': { pressed: false, value: 0, bind: t('Joystick.joystick_hotkey2') },
  '5': { pressed: false, value: 0, bind: t('Joystick.joystick_hotkey3') }
})

const buttonEntries = computed(() => buttonMap)

const getStoredSensitivity = (key: string) => {
  const value = localStorage.getItem(key)
  if (!value) {
    localStorage.setItem(key, '0.5')
    return 50
  }
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized * 100 : 50
}

const saveSensitivity = (key: string, value: number) => {
  const normalized = value / 100
  localStorage.setItem(key, String(normalized))
  return normalized
}

const formatTooltipPT = (value: number) => saveSensitivity('sensitivityPT', value)
const formatTooltipZ = (value: number) => saveSensitivity('sensitivityZ', value)

const setButtonState = (data: GamepadButtonState) => {
  if (data.index === 6 || data.index === 7) {
    zoomPressed.value = data.pressed
    return
  }
  const button = buttonMap[String(data.index)]
  if (button) {
    button.pressed = data.pressed
    button.value = data.value
  }
}

const onAxisChange = (axes: GamepadAxes) => {
  joystickPressed.value = Object.values(axes).some(axis => {
    return (axis.index === 0 || axis.index === 1) && Math.abs(axis.value) > 0.15
  })
}

const gamepad = new XboxGamepad({
  onButtonPress: setButtonState,
  onButtonRelease: setButtonState,
  onAxisChange,
  onConnected: (value: boolean) => {
    connected.value = value
    if (!value) {
      zoomPressed.value = false
      joystickPressed.value = false
      Object.values(buttonMap).forEach(button => {
        button.pressed = false
        button.value = 0
      })
    }
  },
  deadZone: 0.15
})

onMounted(() => {
  sensitivityPT.value = getStoredSensitivity('sensitivityPT')
  sensitivityZ.value = getStoredSensitivity('sensitivityZ')
  gamepad.startListening()
  connected.value = gamepad.connected
})

onBeforeUnmount(() => {
  gamepad.stopListening()
})
</script>

<template>
  <div class="joystick">
    <div class="gamepad-container">
      <h5>{{ t('Joystick.joystick_basic') }}</h5>
      <div class="status" :class="{ connected }">
        <i class="iconfont icon-caozongganzhuangtai"></i>
        <span>{{ connected ? t('CommTableEdit.comm_online') : t('CommTableEdit.comm_offline') }}</span>
      </div>
      <div class="controls">
        <div class="joystickzoom">
          <div class="joystick-card" :class="{ pressed: joystickPressed }">
            <span class="icon iconfont icon-pingyi-qingxie"></span>
            <div class="content">
              <div class="text">{{ t('Joystick.joystick_pt') }}</div>
              <div class="sensitivity">
                <span>{{ t('Joystick.joystick_sensitivity') }}</span>
                <el-slider v-model="sensitivityPT" :format-tooltip="formatTooltipPT" />
              </div>
            </div>
          </div>
          <div class="joystick-card" :class="{ pressed: zoomPressed }">
            <span class="icon iconfont icon-fangda-suoxiao"></span>
            <div class="content">
              <div class="text">{{ t('Joystick.joystick_z') }}</div>
              <div class="sensitivity">
                <span>{{ t('Joystick.joystick_sensitivity') }}</span>
                <el-slider v-model="sensitivityZ" :format-tooltip="formatTooltipZ" />
              </div>
            </div>
          </div>
        </div>

        <div v-for="(value, key) in buttonEntries" :key="key" class="button" :class="{ pressed: value.pressed }">
          <span class="button-name">Button {{ Number(key) + 1 }}</span>
          <div class="btnvalue">{{ value.bind }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.joystick {
  width: 100%;
  min-height: 100%;
  padding: 0 20px;

  .gamepad-container {
    max-width: 800px;
    font-family: Arial, sans-serif;

    h5 {
      padding: 30px 0 15px;
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    color: #999;

    &.connected {
      color: #06d20b;
    }
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .joystickzoom {
    display: flex;
    flex-direction: column;
    padding-bottom: 10px;
    gap: 15px;
  }

  .joystick-card {
    width: 380px;
    height: 120px;
    padding: 20px 10px;
    display: flex;
    border-radius: 5px;
    align-items: center;
    background-color: #202020;
    border: 1px solid transparent;
    transition: all 0.2s;

    .icon {
      width: 100px;
      text-align: center;
      font-size: 70px;
      color: #999;
    }

    .content {
      padding: 0 15px;
      flex: 1;

      .text {
        font-size: 17px;
        padding-bottom: 15px;
      }

      .sensitivity {
        display: flex;
        align-items: center;
        gap: 16px;

        span {
          flex-shrink: 0;
        }

        .el-slider {
          flex: 1;

          :deep(.el-slider__button) {
            width: 16px;
            height: 16px;
          }
        }
      }
    }
  }

  .button {
    width: 390px;
    padding: 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    border: 1px solid transparent;
    transition: all 0.2s;

    .button-name {
      display: inline-block;
      width: 70px;
    }

    .btnvalue {
      display: inline-block;
      border-radius: 4px;
      padding: 5px;
      width: 300px;
      background-color: #202020;
    }
  }

  .pressed {
    color: #0399fe;
    border-color: #0399fe;
    background-color: rgba(3, 153, 254, 0.12);

    .icon {
      color: #0399fe;
    }

    .btnvalue {
      background-color: rgba(3, 153, 254, 0.18);
    }
  }
}
</style>
