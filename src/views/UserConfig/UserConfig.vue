<template>
  <el-drawer
    v-model="drawerVisible"
    :title="t('SetUser.set_user_config')"
    direction="rtl"
    size="520px"
    :destroy-on-close="false"
    class="user-config-drawer"
  >
    <div class="userconfig-body">
      <div class="userconfig-header">
        <div class="avatar-wrap">
          <div v-if="avatar">
            <img :src="avatar" alt="" width="36px" height="36px" style="border-radius:50%;" />
          </div>
          <div v-else class="avatar-circle" :style="{ background: background }">{{ acronym }}</div>
        </div>
        <span class="username-text">{{ userStore.username }}</span>
      </div>

      <el-divider />

      <!-- Protocol section: locked to WS2 -->
      <div class="config-section">
        <div class="config-row">
          <span class="config-label">{{ t('SetUser.set_liveview_protocol') }}</span>
          <el-select v-model="proto" style="width:200px;" size="small" disabled>
            <el-option label="WS2" value="WS2" />
          </el-select>
        </div>
        <div class="config-row">
          <span class="config-label">{{ t('SetUser.set_playback_protocol') }}</span>
          <el-select v-model="proto1" style="width:200px;" size="small" disabled>
            <el-option label="WS2" value="WS2" />
          </el-select>
        </div>
      </div>

      <!-- WS2-specific config (always shown because protocol is locked to WS2) -->
      <div class="config-section">
        <div class="config-row">
          <span class="config-label">{{ t('SetUser.set_buffertime') }}</span>
          <div class="input-unit-wrap">
            <el-input v-model="RBufferTime" size="small" style="width:160px;" />
            <span class="unit-text">{{ t('SetUser.set_millisecond') }}</span>
          </div>
        </div>
        <div class="config-row">
          <span class="config-label">{{ t('SetUser.set_h264_cpu_decode') }}</span>
          <el-switch v-model="H264CpuDecode" />
        </div>
      </div>

      <el-divider />

      <div class="config-section">
        <div class="config-row" style="align-items:flex-start;">
          <span class="config-label">{{ t('SetUser.set_watermark') }}</span>
          <div>
            <el-input v-model="watermarkstring" :placeholder="t('SetUser.set_watermark_content')" size="small" style="width:200px;margin-bottom:8px;" />
            <div class="watermark-btns">
              <el-button
                :class="watermarktoggle === 'true' ? 'btn-active' : 'btn-inactive'"
                size="small"
                @click="watermarktoggle = 'true'"
              >{{ t('SetUser.set_enable_watermark') }}</el-button>
              <el-button
                :class="watermarktoggle === 'false' ? 'btn-active' : 'btn-inactive'"
                size="small"
                @click="watermarktoggle = 'false'"
              >{{ t('SetUser.set_disable_watermark') }}</el-button>
            </div>
          </div>
        </div>
        <div class="config-row">
          <span class="config-label">{{ t('SetUser.set_rtc_engine') }}</span>
          <el-select v-model="rtcEngine" style="width:200px;" size="small" disabled>
            <el-option label="v1" value="v1" />
            <el-option label="v2" value="v2" />
          </el-select>
        </div>
      </div>

      <el-divider />

      <div class="config-section">
        <div class="config-row">
          <span class="config-label">{{ t('SetUser.set_display_disable') }}</span>
          <el-select v-model="devicemarktoggle" style="width:200px;" size="small">
            <el-option :label="t('SetUser.set_show')" value="true" />
            <el-option :label="t('SetUser.set_hide')" value="false" />
          </el-select>
        </div>
        <div class="config-row">
          <span class="config-label">{{ t('SetUser.set_image_quality_selection') }}</span>
          <el-select v-model="elqualitytoggle" style="width:200px;" size="small">
            <el-option :label="t('SetUser.set_show')" value="true" />
            <el-option :label="t('SetUser.set_hide')" value="false" />
          </el-select>
        </div>
      </div>

      <el-divider />

      <div class="config-section">
        <div class="config-row">
          <span class="config-label">{{ t('SetUser.set_web_client_auto-logout_time') }}</span>
          <div class="input-unit-wrap">
            <el-input v-model="WebclientAutoLogoutTime" size="small" style="width:160px;" />
            <span class="unit-text">{{ t('Common.comm_minutes') }}</span>
          </div>
        </div>
        <div class="config-row">
          <span class="config-label" style="word-break:normal;">{{ t('SetUser.set_enable_web_client_auto-logout') }}</span>
          <el-switch v-model="WebclientAutoLogoutTimeEnable" />
        </div>
      </div>

      <el-divider />

      <!-- Decoder info (read-only) -->
      <div class="config-section">
        <div class="config-row">
          <span class="config-label config-label-sm">{{ t('SetUser.set_ws_decoder') }}</span>
          <span>{{ websocketDecoder }}</span>
        </div>
        <div class="config-row">
          <span class="config-label config-label-sm">{{ t('SetUser.set_rtc_decoder') }}</span>
          <span>{{ rtcDecoder }}</span>
        </div>
        <div class="config-row">
          <span class="config-label config-label-sm">{{ t('SetUser.set_keep_aspect_ratio') }}</span>
          <el-switch v-model="keepAspectRatio" />
        </div>
      </div>

      <el-divider />

      <div class="config-section">
        <div class="config-row">
          <span class="config-label">{{ t('SetUser.set_video_background_color') }}</span>
          <div class="bg-color-wrap">
            <el-select v-model="VideoBackground" @change="onVideoBackgroundChange" style="width:100px;margin-right:8px;" size="small">
              <el-option :label="t('Theme.theme_white')" :value="1" />
              <el-option :label="t('Theme.theme_black')" :value="2" />
              <el-option :label="t('Theme.theme_dark_blue')" :value="3" />
            </el-select>
            <el-color-picker v-model="bgColor" size="small" :predefine="predefineColors" />
            <el-input v-model="bgColor" size="small" style="width:90px;margin-left:8px;" disabled />
            <el-button size="small" class="ml-8" @click="resetVideoBackground">{{ t('Common.comm_reset') }}</el-button>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="config-section">
        <div class="config-row">
          <span class="config-label config-label-sm">{{ t('SetUser.set_map_cluster') }}</span>
          <el-switch v-model="mapCluster" />
        </div>
        <div class="config-row">
          <span class="config-label">{{ t('SetUser.set_cascade_loading_level') }}</span>
          <el-input v-model="CascadeLoadingLevel" size="small" style="width:200px;" />
        </div>
      </div>

      <el-divider />

      <div class="config-section">
        <div class="config-row">
          <span class="config-label">{{ t('SetUser.set_playback_mode') }}</span>
          <el-select v-model="DefaultStorage" style="width:200px;" size="small">
            <el-option :label="t('Cascade.cascade_central_record')" value="CentralStorage" />
            <el-option :label="t('Playback.pb_device_record')" value="DeviceStorage" />
          </el-select>
        </div>
        <div class="config-row" style="align-items:flex-start;">
          <span class="config-label">{{ t('SetUser.set_default_view') }}</span>
          <div class="default-view-grid">
            <div
              v-for="item in canvasItems"
              :key="item.value"
              class="view-item"
              :class="{ 'view-item-active': DefaultView == item.value }"
              @click="DefaultView = item.value"
            >
              <i :class="item.icon" />
            </div>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="config-section">
        <div class="config-row">
          <span class="config-label">{{ t('SetUser.set_default_map') }}</span>
          <div class="input-unit-wrap">
            <el-select v-model="DefaultMap" style="width:200px;" size="small" clearable :placeholder="t('Common.comm_please_select')">
              <el-option v-for="item in mapList" :key="item.mapId" :label="item.mapName" :value="item.mapId" />
            </el-select>
            <el-button size="small" class="ml-8" @click="DefaultMap = ''">{{ t('Common.comm_reset') }}</el-button>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="config-section">
        <div class="config-row" style="align-items:flex-start;">
          <span class="config-label">{{ t('SetUser.set_default_partition') }}</span>
          <div>
            <el-select v-model="partitionType" @change="onPartitionTypeChange" style="width:200px;margin-bottom:8px;" size="small" :placeholder="t('Common.comm_please_select')">
              <el-option :label="t('Common.comm_device_partition')" value="devPartition" />
              <el-option label="Logic Partition" value="logicPartition" />
            </el-select>
            <div v-if="partitionType" class="partition-tree-wrap">
              <el-tree
                ref="partitionTreeRef"
                :data="partitionData"
                node-key="uuid"
                :props="treeProps"
                show-checkbox
                @check="onTreeCheck"
                :default-checked-keys="defaultCheckedKeys"
                :empty-text="t('CommTable.comm_no_data_available')"
              >
                <template #default="{ data }">
                  <span>
                    <i v-if="data.iconclass" :class="data.iconclass" style="font-size:13px;" />
                    <span style="padding-left:4px;">{{ data.label }}</span>
                  </span>
                </template>
              </el-tree>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="drawerVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button type="primary" @click="updateConfig">{{ t('CommTableEdit.comm_save') }}</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from '@/store'
import { useUserStore } from '@/store/user'
import { GetUserConfigApi, UpdateUserConfigApi } from '@/api/system'
import { ElMessage, ElTree } from 'element-plus'
// @ts-ignore
import { H5sGetClientWSDecoder, H5sGetClientRTCDecoder } from '@/assets/js/h5splayer.js'
import axios from '@/api/http'

const { t } = useI18n()
const store = useStore()
const userStore = useUserStore()

// ─── drawer v-model ──────────────────────────────────────────────────────────
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
const drawerVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

// ─── user avatar ─────────────────────────────────────────────────────────────
const avatar = ref('')
const acronym = ref(userStore.username.charAt(0).toUpperCase())
const background = ref('#70CFC9')

// ─── protocols: locked to WS2 ────────────────────────────────────────────────
const proto = ref('WS2')
const proto1 = ref('WS2')

// ─── WS2-specific ────────────────────────────────────────────────────────────
const RBufferTime = ref(String(store.RBufferTime || 0))
const H264CpuDecode = ref(store.H264CpuDecode === 'true' || store.H264CpuDecode === true)

// ─── watermark ───────────────────────────────────────────────────────────────
const watermarkstring = ref(store.watermarkstring)
const watermarktoggle = ref(store.watermarktoggle)

// ─── RTC engine (disabled) ───────────────────────────────────────────────────
const rtcEngine = ref(store.H5sRtcengine || 'v1')

// ─── display / quality ───────────────────────────────────────────────────────
const devicemarktoggle = ref(store.devicemarktoggle)
const elqualitytoggle = ref(store.elqualitytoggle)

// ─── auto logout ─────────────────────────────────────────────────────────────
const WebclientAutoLogoutTime = ref(store.WebclientAutoLogoutTime)
const WebclientAutoLogoutTimeEnable = ref(
  store.WebclientAutoLogoutTimeEnable === 'true'
)

// ─── decoders (read-only) ────────────────────────────────────────────────────
const websocketDecoder = ref('')
const rtcDecoder = ref('')

// ─── aspect ratio ────────────────────────────────────────────────────────────
const keepAspectRatio = ref(store.keepAspectRatio === 'true')

// ─── video background color ──────────────────────────────────────────────────
const VideoBackground = ref(2) // 1=white, 2=black, 3=darkblue
const bgColor = ref(store.VideoBackgroundBlack)
const predefineColors = ['#222222', '#494A4B', '#202731']

function onVideoBackgroundChange(val: number) {
  if (val === 2) bgColor.value = store.VideoBackgroundBlack
  else if (val === 3) bgColor.value = store.VideoBackgroundDarkblue
  else bgColor.value = store.VideoBackgroundWhite
}

function resetVideoBackground() {
  if (VideoBackground.value === 2) bgColor.value = '#222222'
  else if (VideoBackground.value === 3) bgColor.value = '#202731'
  else bgColor.value = '#494A4B'
}

// ─── map cluster / cascade level ─────────────────────────────────────────────
const mapCluster = ref(store.mapCluster)
const CascadeLoadingLevel = ref(String(store.CascadeLoadingLevel || 3))

// ─── playback mode ───────────────────────────────────────────────────────────
const DefaultStorage = ref(store.DefaultStorage)

// ─── default view ────────────────────────────────────────────────────────────
const DefaultView = ref<string | number>(store.DefaultView)
const canvasItems = [
  { icon: 'iconfont icon-a-1gongge',  value: 1 },
  { icon: 'iconfont icon-a-3gongge',  value: 3 },
  { icon: 'iconfont icon-a-4gongge',  value: 4 },
  { icon: 'iconfont icon-sigongge',   value: '4Alt' },
  { icon: 'iconfont icon-a-6gongge',  value: 6 },
  { icon: 'iconfont icon-a-7gongge',  value: 7 },
  { icon: 'iconfont icon-a-9gongge',  value: 9 },
  { icon: 'iconfont icon-a-13gongge', value: 13 },
  { icon: 'iconfont icon-a-16gongge', value: 16 },
  { icon: 'iconfont icon-a-25gongge', value: 25 },
]

// ─── default map ─────────────────────────────────────────────────────────────
const DefaultMap = ref<string | number>('')
const mapList = ref<{ mapId: number; mapName: string }[]>([])

async function loadMapList() {
  try {
    const res: any = await axios({ url: '/uapi/v1/MapList', method: 'GET' })
    if (res.status === 200 && res.data.msg === 'Success') {
      mapList.value = res.data.result || []
    }
  } catch { /* map API may not exist in this deployment */ }
}

// ─── default partition ───────────────────────────────────────────────────────
const partitionTreeRef = ref<InstanceType<typeof ElTree> | null>(null)
const partitionType = ref('')
const partitionData = ref<any[]>([])
const DefaultPartition = ref('')
const defaultCheckedKeys = ref<string[]>([])
const devPartitionData = ref<any[]>([])
const logicPartitionData = ref<any[]>([])
const treeProps = { children: 'children', label: 'label' }

async function loadPartitions() {
  try {
    const [devRes, logicRes]: any[] = await Promise.all([
      axios({ url: '/uapi/v1/DevicePartition/Tree', method: 'GET' }),
      axios({ url: '/uapi/v1/LogicPartition/Tree', method: 'GET' }),
    ])
    if (devRes?.status === 200) devPartitionData.value = devRes.data.result || []
    if (logicRes?.status === 200) logicPartitionData.value = logicRes.data.result || []
  } catch { /* partition API may not exist */ }
}

function onPartitionTypeChange(val: string) {
  partitionData.value = val === 'devPartition' ? devPartitionData.value : logicPartitionData.value
  nextTick(() => {
    if (DefaultPartition.value && partitionTreeRef.value) {
      partitionTreeRef.value.setCheckedKeys([DefaultPartition.value])
    }
  })
}

function onTreeCheck(node: any, list: any) {
  if (list.checkedKeys.length >= 1) {
    partitionTreeRef.value?.setCheckedKeys([node.uuid])
    DefaultPartition.value = node.uuid
  }
  defaultCheckedKeys.value = []
}

async function loadDefaultPartition() {
  try {
    const userRes: any = await axios({
      url: '/uapi/v1/User/Item?username=' + userStore.username,
      method: 'GET',
    })
    if (userRes?.status === 200 && userRes.data.msg === 'Success') {
      const item = userRes.data.result
      avatar.value = item.avatar || ''
      background.value = item.background || '#222222'
      acronym.value = item.acronym || userStore.username.charAt(0).toUpperCase()
      const partRes: any = await axios({
        url: '/uapi/v1/User/DefaultPartition?userId=' + item.userId,
        method: 'GET',
      })
      if (partRes?.status === 200 && partRes.data.msg === 'Success') {
        DefaultPartition.value = partRes.data.result.uuid || ''
        partitionType.value = partRes.data.result.type || ''
        if (partitionType.value) onPartitionTypeChange(partitionType.value)
      }
    }
  } catch { /* may not exist */ }
}

// ─── load user config from server ────────────────────────────────────────────
async function loadUserConfig() {
  try {
    const res: any = await GetUserConfigApi()
    if (res.status === 200 && (res.data.msg === 'Success' || res.data.code === 0)) {
      const list: any[] = res.data.result?.list ?? res.data.result ?? []
      for (const item of list) {
        switch (item.key) {
          case 'LiveViewProtocol':  /* locked to WS2, skip */ break
          case 'PlaybackProtocol':  /* locked to WS2, skip */ break
          case 'WatermarkContent':  watermarkstring.value = item.value; break
          case 'WatermarkStatus':   watermarktoggle.value = item.value; break
          case 'RTCEngine':         rtcEngine.value = item.value; break
          case 'DeviceDisable':     devicemarktoggle.value = item.value; break
          case 'PictureQuality':    elqualitytoggle.value = item.value; break
          case 'VideoBackgroundBlack':    store.setVideoBackgroundBlack(item.value); break
          case 'VideoBackgroundWhite':    store.setVideoBackgroundWhite(item.value); break
          case 'VideoBackgroundDarkblue': store.setVideoBackgroundDarkblue(item.value); break
          case 'VideoAspectRatio':  keepAspectRatio.value = item.value === 'true'; break
          case 'WebclientAutoLogoutTime':
            WebclientAutoLogoutTime.value = item.value; break
          case 'WebclientAutoLogoutTimeEnable':
            WebclientAutoLogoutTimeEnable.value = item.value === 'true'; break
          case 'BufferTime':
            RBufferTime.value = item.value
            store.setRBufferTime(Number(item.value))
            break
          case 'H264CPUDecode':
            H264CpuDecode.value = item.value === 'true'; break
          case 'MapCluster':
            mapCluster.value = item.value === 'true'; break
          case 'CasLevel':
            CascadeLoadingLevel.value = item.value; break
          case 'DefaultStorage':
            DefaultStorage.value = item.value
            store.setDefaultStorage(item.value)
            break
          case 'DefaultView':
            DefaultView.value = item.value; break
          case 'DefaultMap':
            DefaultMap.value = item.value ? Number(item.value) : ''; break
        }
      }
      // sync bg color display
      if (store.darkMode === 'c-dark-theme') {
        VideoBackground.value = 2
        bgColor.value = store.VideoBackgroundBlack
      } else if (store.darkMode === 'darkblue') {
        VideoBackground.value = 3
        bgColor.value = store.VideoBackgroundDarkblue
      } else {
        VideoBackground.value = 1
        bgColor.value = store.VideoBackgroundWhite
      }
    }
  } catch (e) {
    console.warn('[UserConfig] loadUserConfig error', e)
  }
}

// ─── save ────────────────────────────────────────────────────────────────────
async function updateConfig() {
  let bgKey = 'VideoBackgroundBlack'
  if (VideoBackground.value === 3) bgKey = 'VideoBackgroundDarkblue'
  else if (VideoBackground.value === 1) bgKey = 'VideoBackgroundWhite'

  const configs = [
    { key: 'LiveViewProtocol',              value: 'WS2' },
    { key: 'PlaybackProtocol',              value: 'WS2' },
    { key: 'WatermarkContent',              value: watermarkstring.value },
    { key: 'WatermarkStatus',               value: watermarktoggle.value },
    { key: 'RTCEngine',                     value: rtcEngine.value },
    { key: 'DeviceDisable',                 value: devicemarktoggle.value },
    { key: 'PictureQuality',                value: elqualitytoggle.value },
    { key: bgKey,                           value: bgColor.value },
    { key: 'VideoAspectRatio',              value: String(keepAspectRatio.value) },
    { key: 'WebclientAutoLogoutTime',       value: WebclientAutoLogoutTime.value },
    { key: 'WebclientAutoLogoutTimeEnable', value: String(WebclientAutoLogoutTimeEnable.value) },
    { key: 'BufferTime',                    value: String(RBufferTime.value) },
    { key: 'H264CPUDecode',                 value: String(H264CpuDecode.value) },
    { key: 'MapCluster',                    value: String(mapCluster.value) },
    { key: 'CasLevel',                      value: String(CascadeLoadingLevel.value) },
    { key: 'DefaultStorage',                value: String(DefaultStorage.value) },
    { key: 'DefaultView',                   value: String(DefaultView.value) },
    { key: 'DefaultMap',                    value: String(DefaultMap.value) },
    { key: 'DefaultPartition',              value: String(DefaultPartition.value) },
  ]

  let savedCount = 0
  for (const cfg of configs) {
    try {
      const res: any = await UpdateUserConfigApi(cfg)
      if (res.status === 200 && (res.data.msg === 'Success' || res.data.code === 0)) {
        savedCount++
        switch (cfg.key) {
          case 'WatermarkContent':  store.setWatermarkstring(cfg.value); break
          case 'WatermarkStatus':   store.setWatermarktoggle(cfg.value); break
          case 'RTCEngine':         store.setH5sRtcengine(cfg.value); break
          case 'DeviceDisable':     store.setDevicemarktoggle(cfg.value); break
          case 'PictureQuality':    store.setElqualitytoggle(cfg.value); break
          case 'VideoBackgroundBlack':    store.setVideoBackgroundBlack(cfg.value); break
          case 'VideoBackgroundWhite':    store.setVideoBackgroundWhite(cfg.value); break
          case 'VideoBackgroundDarkblue': store.setVideoBackgroundDarkblue(cfg.value); break
          case 'VideoAspectRatio':  store.setKeepAspectRatio(cfg.value); break
          case 'WebclientAutoLogoutTime':       store.setWebclientAutoLogoutTime(cfg.value); break
          case 'WebclientAutoLogoutTimeEnable': store.setWebclientAutoLogoutTimeEnable(cfg.value); break
          case 'BufferTime':   store.setRBufferTime(Number(cfg.value)); break
          case 'H264CPUDecode': store.setH264CpuDecode(cfg.value); break
          case 'MapCluster':    store.setMapCluster(cfg.value === 'true'); break
          case 'CasLevel':      store.setCascadeLoadingLevel(Number(cfg.value)); break
          case 'DefaultStorage': store.setDefaultStorage(cfg.value); break
          case 'DefaultView':    store.setDefaultView(cfg.value); break
          case 'LiveViewProtocol':  store.setLiveviewrtc(cfg.value); break
          case 'PlaybackProtocol':  store.setLiveviewrtc1(cfg.value); break
        }
      }
    } catch (e) {
      console.warn('[UserConfig] save error', cfg.key, e)
    }
  }

  if (savedCount > 0) {
    ElMessage({ message: t('CommTableEdit.comm_save_successfully'), type: 'success', duration: 3000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_save_failed'), type: 'error', duration: 3000 })
  }
}

// ─── init when drawer opens ───────────────────────────────────────────────────
watch(drawerVisible, async (open) => {
  if (!open) return
  websocketDecoder.value = H5sGetClientWSDecoder() || ''
  rtcDecoder.value = H5sGetClientRTCDecoder() || ''
  await Promise.all([
    loadUserConfig(),
    loadMapList(),
    loadPartitions(),
    loadDefaultPartition(),
  ])
})
</script>

<style lang="scss" scoped>
.userconfig-body {
  padding: 0 8px 16px;
  overflow-y: auto;
  height: calc(100% - 60px);

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background: rgba(255,255,255,0.15);
  }
}

.userconfig-header {
  display: flex;
  align-items: center;
  padding: 8px 0 4px;
  .avatar-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    text-align: center;
    line-height: 36px;
    font-size: 16px;
    color: #8F3036;
    background-color: #70CFC9;
  }
  .username-text {
    margin-left: 10px;
    font-size: 14px;
    font-weight: bold;
  }
}

.config-section {
  margin-bottom: 4px;
}

.config-row {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}

.config-label {
  width: 190px;
  min-width: 190px;
  text-align: right;
  font-size: 13px;
  font-weight: 500;
  margin-right: 20px;
}

.config-label-sm {
  width: 190px;
  min-width: 190px;
  text-align: right;
  font-size: 13px;
  margin-right: 20px;
}

.input-unit-wrap {
  display: flex;
  align-items: center;
  .unit-text {
    margin-left: 8px;
    font-size: 12px;
    white-space: nowrap;
  }
}

.ml-8 { margin-left: 8px; }

.watermark-btns {
  display: flex;
  .el-button:first-child { border-radius: 3px 0 0 3px; }
  .el-button:last-child  { margin-left: 0; border-radius: 0 3px 3px 0; }
}

.btn-active  { border: none; }
.btn-inactive { background: none; }

.bg-color-wrap {
  display: flex;
  align-items: center;
}

.default-view-grid {
  width: 220px;
  min-height: 80px;
  border: 1px solid #4A4A4A;
  border-radius: 4px;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .view-item {
    cursor: pointer;
    padding: 2px;
    border-radius: 3px;
    i { font-size: 22px; }
    &:hover i { color: #0399FE; }
  }

  .view-item-active i { color: #0399FE; }
}

.partition-tree-wrap {
  width: 200px;
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #4A4A4A;
  border-radius: 4px;
  padding: 6px 0;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background: rgba(255,255,255,0.15);
  }
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

<style lang="scss">
/* drawer panel dark background to match app theme */
.user-config-drawer {
  .el-drawer__header { margin-bottom: 0; }
  .el-drawer__body   { padding: 16px; overflow: hidden; }
  .el-divider { margin: 8px 0; }
}
</style>
