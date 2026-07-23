<template>
  <div class="Aside">
    <div class="upperPart">
      <div style="width:50%;">

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="Aside_title">{{ t('SetUser.set_user_config') }}</div>
          <div style="margin-right:10%; margin-bottom:20px; display:flex; align-items:center;">
            <div v-if="avatar">
              <img :src="avatar" alt="" width="24px" height="24px" style="border-radius:50%;" />
            </div>
            <div v-else class="avatar-circle"
              :style="{ background: background, width:'24px', height:'24px', borderRadius:'50%',
                        fontSize:'14px', textAlign:'center', lineHeight:'24px', position:'relative' }">
              {{ acronym }}
              <div style="width:6px;height:6px;background:#5CFF00;border-radius:50%;
                          position:absolute;right:2px;top:17px;"></div>
            </div>
            <div style="margin-left:5px;">{{ userStore.username }}</div>
          </div>
        </div>

        <div class="Aside_content">

          <!-- ── Protocol (locked to WS2) + WS2-specific settings ──── -->
          <div class="Aside_content_part">
            <div class="Aside_content_top">
              <div class="Aside_content_title">{{ t('SetUser.set_liveview_protocol') }}: {{ proto }}</div>
              <div class="up_you_but">
                <el-select v-model="proto" size="small" style="width:252px;" disabled>
                  <el-option label="WS2" value="WS2" />
                </el-select>
              </div>
            </div>
            <div class="Aside_content_top">
              <div class="Aside_content_title">{{ t('SetUser.set_playback_protocol') }}: {{ proto1 }}</div>
              <div class="up_you_but">
                <el-select v-model="proto1" size="small" style="width:252px;" disabled>
                  <el-option label="WS2" value="WS2" />
                </el-select>
              </div>
            </div>
          </div>

          <!-- WS2-specific settings (protocol locked, always shown) -->
          <div class="Aside_content_part">
            <div class="Aside_content_buttom">
              <div class="Aside_content_title">{{ t('SetUser.set_buffertime') }}</div>
              <div class="up_you_but">
                <el-input class="liveview_left_input" v-model="RBufferTime" size="small" />
                <span style="margin-left:10px;">{{ t('SetUser.set_millisecond') }}</span>
              </div>
            </div>
            <div class="Aside_content_buttom">
              <div class="Aside_content_title">{{ t('SetUser.set_h264_cpu_decode') }}</div>
              <div class="up_you_but">
                <el-switch v-model="H264CpuDecode" />
              </div>
            </div>
          </div>

          <!-- ── Watermark ─────────────────────────────────────────── -->
          <div class="Aside_content_part">
            <div class="Aside_content_buttom">
              <div class="Aside_content_title">{{ t('SetUser.set_watermark') }}</div>
              <div class="up_you_but">
                <el-input class="liveview_left_input" :placeholder="t('SetUser.set_watermark_content')"
                  v-model="watermarkstring" />
              </div>
            </div>
            <div class="Aside_content_buttom">
              <div class="Aside_content_title"></div>
              <div class="up_you_but">
                <div class="WatermarkStatus">
                  <el-button size="small" type="primary"
                    :class="watermarktoggle === 'true' ? 'button_watermark' : 'button_watermark1'"
                    @click="watermarktoggle = 'true'">{{ t('SetUser.set_enable_watermark') }}</el-button>
                  <el-button size="small" type="primary"
                    :class="watermarktoggle === 'false' ? 'button_watermark' : 'button_watermark1'"
                    @click="watermarktoggle = 'false'">{{ t('SetUser.set_disable_watermark') }}</el-button>
                </div>
              </div>
            </div>
            <div class="Aside_content_buttom">
              <div class="Aside_content_title">{{ t('SetUser.set_rtc_engine') }}</div>
              <div class="up_you_but changeRTC">
                <el-select v-model="rtcEngine" size="small" style="width:252px;" disabled>
                  <el-option label="v1" value="v1" />
                  <el-option label="v2" value="v2" />
                </el-select>
              </div>
            </div>
          </div>

          <!-- ── Display / Image quality ───────────────────────────── -->
          <div class="Aside_content_part">
            <div class="Aside_content_buttom">
              <div class="Aside_content_title">{{ t('SetUser.set_display_disable') }}</div>
              <div class="up_you_but">
                <el-select v-model="devicemarktoggle" size="small" style="width:252px;">
                  <el-option :label="t('SetUser.set_show')" value="true" />
                  <el-option :label="t('SetUser.set_hide')" value="false" />
                </el-select>
              </div>
            </div>
            <div class="Aside_content_buttom">
              <div class="Aside_content_title">{{ t('SetUser.set_image_quality_selection') }}</div>
              <div class="up_you_but">
                <el-select v-model="elqualitytoggle" size="small" style="width:252px;">
                  <el-option :label="t('SetUser.set_show')" value="true" />
                  <el-option :label="t('SetUser.set_hide')" value="false" />
                </el-select>
              </div>
            </div>
          </div>

          <!-- ── Auto logout ────────────────────────────────────────── -->
          <div class="Aside_content_part">
            <div class="Aside_content_buttom">
              <div class="Aside_content_title">{{ t('SetUser.set_web_client_auto-logout_time') }}</div>
              <div class="up_you_but">
                <el-input class="liveview_left_input" v-model="WebclientAutoLogoutTime" />
                <span style="margin-left:10px;">{{ t('Common.comm_minutes') }}</span>
              </div>
            </div>
            <div class="Aside_content_buttom">
              <div class="Aside_content_title" style="word-break:normal;">
                {{ t('SetUser.set_enable_web_client_auto-logout') }}
              </div>
              <div>
                <el-switch v-model="WebclientAutoLogoutTimeEnable" />
              </div>
            </div>
          </div>

          <!-- ── Decoder (read-only) / Aspect ratio / Video background ── -->
          <div class="Aside_content_part">
            <div class="Aside_content_buttom" style="margin-bottom:26px;">
              <div class="Aside_content_title1">
                <span>{{ t('SetUser.set_ws_decoder') }}</span>
              </div>
              <div><span>{{ websocketDecoder }}</span></div>
            </div>
            <div class="Aside_content_buttom" style="margin-bottom:26px;">
              <div class="Aside_content_title1">
                <span>{{ t('SetUser.set_rtc_decoder') }}</span>
              </div>
              <div><span>{{ rtcDecoder }}</span></div>
            </div>
            <div class="Aside_content_buttom" style="margin-bottom:21px;">
              <div class="Aside_content_title1">
                <span>{{ t('SetUser.set_keep_aspect_ratio') }}</span>
              </div>
              <div><el-switch v-model="keepAspectRatio" /></div>
            </div>
            <div class="Aside_content_buttom">
              <div class="Aside_content_title">{{ t('SetUser.set_video_background_color') }}</div>
              <div class="up_you_but ChangeVideoBackground">
                <el-select v-model="VideoBackground" @change="onVideoBackgroundChange"
                  style="width:85px; margin-right:10px;" size="small">
                  <el-option :label="t('Theme.theme_white')" :value="1" />
                  <el-option :label="t('Theme.theme_black')" :value="2" />
                  <el-option :label="t('Theme.theme_dark_blue')" :value="3" />
                </el-select>
                <el-color-picker v-model="bgColor" :predefine="predefineColors" size="small" />
                <el-input style="margin-left:10px;" class="liveview_left_input video_input"
                  v-model="bgColor" disabled />
                <el-button type="primary" @click="resetBgColor" class="single_button ResetVideoBackground">
                  {{ t('Common.comm_reset') }}
                </el-button>
              </div>
            </div>
            <div class="Aside_content_buttom" style="margin-bottom:26px;">
              <div class="Aside_content_title1">
                <span>{{ t('SetUser.set_map_cluster') }}</span>
              </div>
              <div><el-switch v-model="mapCluster" /></div>
            </div>
            <div class="Aside_content_buttom">
              <div class="Aside_content_title">{{ t('SetUser.set_cascade_loading_level') }}</div>
              <div class="up_you_but">
                <el-input class="liveview_left_input" v-model="CascadeLoadingLevel" />
              </div>
            </div>
            <div class="Aside_content_buttom">
              <div class="Aside_content_title">{{ t('SetUser.set_playback_mode') }}</div>
              <div class="up_you_but">
                <el-select v-model="DefaultStorage" style="width:252px;" size="small">
                  <el-option :label="t('Cascade.cascade_central_record')" value="CentralStorage" />
                  <el-option :label="t('Playback.pb_device_record')" value="DeviceStorage" />
                </el-select>
              </div>
            </div>
            <div class="Aside_content_buttom" style="align-items:flex-start;">
              <div class="Aside_content_title">{{ t('SetUser.set_default_view') }}</div>
              <div class="up_you_but">
                <div class="DefaultView">
                  <div class="DefaultView_contnt">
                    <div v-for="item in canvasItems" :key="item.value"
                      class="canvasItems"
                      @click="DefaultView = item.value">
                      <i :class="[item.icon, String(DefaultView) === String(item.value) ? 'WhichView' : '']" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="Aside_content_buttom">
              <div class="Aside_content_title">{{ t('SetUser.set_default_map') }}</div>
              <div class="up_you_but">
                <el-select v-model="DefaultMap" style="width:252px;" size="small" clearable
                  :placeholder="t('Common.comm_please_select')">
                  <el-option v-for="m in mapList" :key="m.mapId" :label="m.mapName" :value="m.mapId" />
                </el-select>
                <el-button type="primary" @click="DefaultMap = ''" class="single_button ResetDefaultMap">
                  {{ t('Common.comm_reset') }}
                </el-button>
              </div>
            </div>
            <div class="Aside_content_buttom" style="align-items:flex-start;">
              <div class="Aside_content_title">{{ t('SetUser.set_default_partition') }}</div>
              <div class="up_you_but">
                <div style="display:flex; flex-direction:column;">
                  <el-select v-model="partitionType" @change="onPartitionTypeChange"
                    style="width:252px;" size="small" :placeholder="t('Common.comm_please_select')">
                    <el-option :label="t('Common.comm_device_partition')" value="devPartition" />
                    <el-option :label="t('Common.comm_logic_partition')" value="logicPartition" />
                  </el-select>
                  <div v-if="partitionType" class="DefaultPartition">
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
                          <i v-if="data.iconclass" :class="data.iconclass" style="font-size:14px;" />
                          <span style="padding-left:4px;">{{ data.label }}</span>
                        </span>
                      </template>
                    </el-tree>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div class="Cluster_but LowerPart" style="display:flex; justify-content:center;">
      <el-button class="cancelBtn" @click="loadAll">{{ t('CommTableEdit.comm_cancel') }}</el-button>
      <el-button class="saveBtn" @click="updateConfig">{{ t('CommTableEdit.comm_save') }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
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

// ─── User avatar ─────────────────────────────────────────────────────────────
const avatar     = ref('')
const acronym    = ref(userStore.username.charAt(0).toUpperCase())
const background = ref('#222222')

// ─── Protocol (locked to WS2) ────────────────────────────────────────────────
const proto  = ref('WS2')
const proto1 = ref('WS2')

// ─── WS2-specific settings ───────────────────────────────────────────────────
const RBufferTime   = ref(String(store.RBufferTime || 0))
const H264CpuDecode = ref(store.H264CpuDecode === 'true' || store.H264CpuDecode === true)

// ─── Watermark ────────────────────────────────────────────────────────────────
const watermarkstring = ref(store.watermarkstring)
const watermarktoggle = ref(store.watermarktoggle)

// ─── RTC engine ───────────────────────────────────────────────────────────────
const rtcEngine = ref(store.H5sRtcengine || 'v1')

// ─── Display / Image quality ──────────────────────────────────────────────────
const devicemarktoggle = ref(store.devicemarktoggle)
const elqualitytoggle  = ref(store.elqualitytoggle)

// ─── Auto logout ──────────────────────────────────────────────────────────────
const WebclientAutoLogoutTime       = ref(store.WebclientAutoLogoutTime)
const WebclientAutoLogoutTimeEnable = ref(store.WebclientAutoLogoutTimeEnable === 'true')

// ─── Decoder (read-only) ──────────────────────────────────────────────────────
const websocketDecoder = ref('')
const rtcDecoder       = ref('')

// ─── Aspect ratio ─────────────────────────────────────────────────────────────
const keepAspectRatio = ref(store.keepAspectRatio === 'true')

// ─── Video background ─────────────────────────────────────────────────────────
const VideoBackground = ref(2)   // 1=white 2=black 3=darkblue
const bgColor         = ref(store.VideoBackgroundBlack)
const predefineColors = ['#222222', '#494A4B', '#202731']

function onVideoBackgroundChange(val: number) {
  bgColor.value = val === 2 ? store.VideoBackgroundBlack
                : val === 3 ? store.VideoBackgroundDarkblue
                :             store.VideoBackgroundWhite
}
function resetBgColor() {
  bgColor.value = VideoBackground.value === 2 ? '#222222'
                : VideoBackground.value === 3 ? '#202731'
                : '#494A4B'
}

// ─── Map cluster / Cascade ────────────────────────────────────────────────────
const mapCluster          = ref(store.mapCluster)
const CascadeLoadingLevel = ref(String(store.CascadeLoadingLevel || 3))

// ─── Playback mode ────────────────────────────────────────────────────────────
const DefaultStorage = ref(store.DefaultStorage)

// ─── Default view ─────────────────────────────────────────────────────────────
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

// ─── Default map (silently ignored if API does not exist) ────────────────────
const DefaultMap = ref<string | number>('')
const mapList    = ref<{ mapId: number; mapName: string }[]>([])

async function loadMapList() {
  try {
    const res: any = await axios({ url: '/uapi/v1/MapList', method: 'GET' })
    if (res.status === 200 && res.data.msg === 'Success') {
      mapList.value = res.data.result || []
    }
  } catch { /* may not exist */ }
}

// ─── Default partition ────────────────────────────────────────────────────────
const partitionTreeRef   = ref<InstanceType<typeof ElTree> | null>(null)
const partitionType      = ref('')
const partitionData      = ref<any[]>([])
const DefaultPartition   = ref('')
const defaultCheckedKeys = ref<string[]>([])
const devData            = ref<any[]>([])
const logicData          = ref<any[]>([])
const treeProps          = { children: 'children', label: 'label' }

// Maps node fields returned by DevPartition/List to the format required by el-tree
function mapPartitionTree(nodes: any[]): any[] {
  return (nodes || []).map((n: any) => ({
    uuid:      String(n.devPartitionId ?? n.uuid ?? ''),
    label:     n.devPartitionName ?? n.name ?? n.label ?? 'Partition',
    iconclass: n.iconclass,
    children:  n.children?.length ? mapPartitionTree(n.children) : [],
  }))
}

async function loadPartitions() {
  try {
    // Device partition: uses the existing hproweb API endpoint
    const devRes: any = await axios({ url: '/uapi/v1/DevPartition/List?pageSize=100000', method: 'GET' })
    if (devRes?.status === 200 && devRes.data.code === 0) {
      devData.value = mapPartitionTree(devRes.data.result || [])
    }
  } catch { /* may not exist */ }
  try {
    // Logic partition: API does not exist yet, silently ignore
    const logicRes: any = await axios({ url: '/uapi/v1/LogicPartition/Tree', method: 'GET' })
    if (logicRes?.status === 200) logicData.value = logicRes.data.result || []
  } catch { /* may not exist */ }
}

function onPartitionTypeChange(val: string) {
  partitionData.value = val === 'devPartition' ? devData.value : logicData.value
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

// ─── Load user avatar + default partition ────────────────────────────────────
async function loadUserInfo() {
  try {
    const res: any = await axios({
      url: '/uapi/v1/User/Item?username=' + userStore.username,
      method: 'GET',
    })
    if (res?.status === 200 && res.data.msg === 'Success') {
      const item = res.data.result
      avatar.value     = item.avatar     || ''
      background.value = item.background || '#222222'
      acronym.value    = item.acronym    || userStore.username.charAt(0).toUpperCase()
      const partRes: any = await axios({
        url: '/uapi/v1/User/DefaultPartition?userId=' + item.userId,
        method: 'GET',
      })
      if (partRes?.status === 200 && partRes.data.msg === 'Success') {
        DefaultPartition.value = partRes.data.result.uuid || ''
        partitionType.value    = partRes.data.result.type || ''
        if (partitionType.value) onPartitionTypeChange(partitionType.value)
      }
    }
  } catch { /* may not exist */ }
}

// ─── Load server-side user config ────────────────────────────────────────────
async function loadUserConfig() {
  try {
    const res: any = await GetUserConfigApi()
    if (res.status === 200 && (res.data.msg === 'Success' || res.data.code === 0)) {
      const list: any[] = res.data.result?.list ?? res.data.result ?? []
      for (const item of list) {
        switch (item.key) {
          case 'LiveViewProtocol':  /* locked */ break
          case 'PlaybackProtocol':  /* locked */ break
          case 'WatermarkContent':  watermarkstring.value = item.value; break
          case 'WatermarkStatus':   watermarktoggle.value = item.value; break
          case 'RTCEngine':         rtcEngine.value = item.value; break
          case 'DeviceDisable':     devicemarktoggle.value = item.value; break
          case 'PictureQuality':    elqualitytoggle.value = item.value; break
          case 'VideoBackgroundBlack':    store.setVideoBackgroundBlack(item.value); break
          case 'VideoBackgroundWhite':    store.setVideoBackgroundWhite(item.value); break
          case 'VideoBackgroundDarkblue': store.setVideoBackgroundDarkblue(item.value); break
          case 'VideoAspectRatio':
            keepAspectRatio.value = item.value === 'true'; break
          case 'WebclientAutoLogoutTime':
            WebclientAutoLogoutTime.value = item.value; break
          case 'WebclientAutoLogoutTimeEnable':
            WebclientAutoLogoutTimeEnable.value = item.value === 'true'; break
          case 'BufferTime':
            RBufferTime.value = item.value
            store.setRBufferTime(Number(item.value)); break
          case 'H264CPUDecode':
            H264CpuDecode.value = item.value === 'true'; break
          case 'MapCluster':
            mapCluster.value = item.value === 'true'; break
          case 'CasLevel':
            CascadeLoadingLevel.value = item.value; break
          case 'DefaultStorage':
            DefaultStorage.value = item.value
            store.setDefaultStorage(item.value); break
          case 'DefaultView':
            DefaultView.value = item.value; break
          case 'DefaultMap':
            DefaultMap.value = item.value ? Number(item.value) : ''; break
        }
      }
      // Sync background color selection to match current theme
      if (store.darkMode === 'c-dark-theme') {
        VideoBackground.value = 2; bgColor.value = store.VideoBackgroundBlack
      } else if (store.darkMode === 'darkblue') {
        VideoBackground.value = 3; bgColor.value = store.VideoBackgroundDarkblue
      } else {
        VideoBackground.value = 1; bgColor.value = store.VideoBackgroundWhite
      }
    }
  } catch (e) {
    console.warn('[UserConfig] load error', e)
  }
}

// ─── Save ─────────────────────────────────────────────────────────────────────
async function updateConfig() {
  const bgKey = VideoBackground.value === 3 ? 'VideoBackgroundDarkblue'
              : VideoBackground.value === 1 ? 'VideoBackgroundWhite'
              : 'VideoBackgroundBlack'

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

  let ok = 0
  for (const cfg of configs) {
    try {
      const res: any = await UpdateUserConfigApi(cfg)
      if (res.status === 200 && (res.data.msg === 'Success' || res.data.code === 0)) {
        ok++
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
          case 'BufferTime':    store.setRBufferTime(Number(cfg.value)); break
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
      console.warn('[UserConfig] save', cfg.key, e)
    }
  }

  ElMessage({
    message: ok > 0 ? t('CommTableEdit.comm_save_successfully') : t('CommTableEdit.comm_save_failed'),
    type: ok > 0 ? 'success' : 'error',
    duration: 3000,
  })
}

// ─── Initialization ───────────────────────────────────────────────────────────
async function loadAll() {
  websocketDecoder.value = H5sGetClientWSDecoder() || ''
  rtcDecoder.value       = H5sGetClientRTCDecoder() || ''
  await Promise.all([loadUserConfig(), loadMapList(), loadPartitions(), loadUserInfo()])
}

onMounted(loadAll)
</script>

<style lang="scss" scoped>
.Aside {
  height: calc(100vh - 30px);  /* 30px = header height, fills the full viewport */
  display: flex;
  flex-direction: column;

  .upperPart {
    flex: 1;
    min-height: 0;       /* required for flex child to allow shrink-then-scroll */
    width: 100%;
    padding-left: 2%;
    padding-top: 2%;
    padding-bottom: 2%;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 5px;
      box-shadow: inset 0 0 5px rgba(218, 218, 218, 0.2);
      background: rgba(218, 218, 218, 0.2);
    }
    &::-webkit-scrollbar-track {
      box-shadow: inset 0 0 5px rgba(218, 218, 218, 0.2);
      border-radius: 0;
      background: rgba(218, 218, 218, 0.1);
    }

    .Aside_title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 20px;
    }

    .Aside_content {
      width: 100%;

      .Aside_content_part {
        display: flex;
        flex-flow: column wrap;
        justify-content: space-between;
      }

      .Aside_content_top {
        margin-bottom: 16px;
        display: flex;
        align-items: center;
      }

      .Aside_content_buttom {
        margin-bottom: 16px;
        display: flex;
        align-items: center;
      }

      .Aside_content_title {
        width: 220px;
        text-align: right;
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 7px;
        margin-right: 32px;
      }

      .Aside_content_title1 {
        width: 220px;
        text-align: right;
        font-size: 14px;
        font-weight: bold;
        margin-right: 32px;
      }

      .up_you_but {
        margin-bottom: 10px;
        line-height: 35px;
        display: flex;
        align-items: center;

        .liveview_left_input {
          width: 252px;
          :deep(.el-input__inner) {
            height: 28px;
            font-size: 12px;
          }
        }

        .video_input {
          width: 120px;
        }

        .el-button {
          height: 29px;
          line-height: 29px;
        }

        .button_watermark {
          // Active state: keeps primary blue fill, removes border
          font-size: 12px;
          padding: 2px 12px;
          border: none;
          line-height: 25px;
        }

        .button_watermark1 {
          // Inactive state: transparent background + blue border (matches theme color #0399FE)
          font-size: 12px;
          padding: 2px 12px;
          line-height: 25px;
          background-color: transparent !important;
          background: transparent !important;
          border: 1px solid #0399FE !important;
          color: #fff !important;
        }
      }

      .changeRTC {
        :deep(.el-input__inner) {
          height: 32px;
          line-height: 32px;
        }
      }

      .ChangeVideoBackground {
        display: flex;
        align-items: center;

        :deep(.el-input__inner) {
          height: 24px;
          line-height: 24px;
        }

        :deep(.el-color-picker) {
          margin-top: 4px;
          .el-color-picker__trigger {
            height: 25px !important;
            width: 25px !important;
            border: 1px solid #555555;
            border-radius: 0;
            .el-color-picker__color { border: none; }
          }
        }

        .ResetVideoBackground { margin-left: 10px; }
      }

      .ResetDefaultMap { margin-left: 10px; }

      /* Default partition tree */
      .DefaultPartition {
        width: 252px;
        height: 150px;
        border-radius: 4px;
        border: 1px solid #4A4A4A;
        margin-top: 5px;
        padding-top: 10px;
        overflow: auto;

        &::-webkit-scrollbar { width: 8px; height: 8px; }
        &::-webkit-scrollbar-thumb {
          border-radius: 5px;
          box-shadow: inset 0 0 5px rgba(218, 218, 218, 0.2);
          background: rgba(218, 218, 218, 0.2);
        }
        &::-webkit-scrollbar-track {
          box-shadow: inset 0 0 5px rgba(218, 218, 218, 0.2);
          border-radius: 0;
          background: rgba(218, 218, 218, 0.1);
        }
      }
    }
  }
}

/* Watermark button group */
.WatermarkStatus {
  display: flex;
  button:nth-child(1) { border-radius: 3px 0 0 3px; }
  button:nth-child(2) { margin-left: 0; border-radius: 0 3px 3px 0; }
}

/* Default view selector */
.DefaultView {
  width: 252px;
  height: 150px;
  border-radius: 4px;
  border: 1px solid #4A4A4A;

  .DefaultView_contnt {
    width: 100%;
    overflow: auto;
    padding: 10px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;

    .canvasItems {
      margin: 0 10px;
      cursor: pointer;
      i { font-size: 25px; }
      .WhichView { color: #0399FE; }
    }
  }
}

/* Bottom button area: flex-shrink:0 ensures it always stays pinned to the bottom */
.LowerPart {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  gap: 12px;
}

/* Cancel button: dark background + blue border, aligned with uscweb cancelBtn style */
.cancelBtn {
  min-width: 78px;
  height: 32px;
  background: #252525 !important;
  border: 1px solid #019afd !important;
  padding: 2px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #fff !important;
  box-sizing: border-box;
}

/* Save button: blue fill, aligned with uscweb saveBtn style */
.saveBtn {
  min-width: 78px;
  height: 32px;
  background: #019afd !important;
  border-radius: 4px;
  padding: 2px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #fff !important;
  border: none !important;
}

.avatar-circle {
  color: #fff;
}

/* Generic small button (reset, etc.) */
.single_button {
  height: 29px;
  line-height: 29px;
  font-size: 12px;
  padding: 0 12px;
}
</style>