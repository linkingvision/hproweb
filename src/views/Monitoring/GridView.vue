<template>
  <div class="liveview_container grid-view" style="width:100%;">
    <div class="liveview">

      <!-- ── 左侧设备树 ── -->
      <div class="liveview_left" :class="{'liveview_lefts': isTreeFold}">
        <div class="liveview_left_input" style="display:flex;align-items:center;padding:4px 8px;gap:6px;">
          <el-input :placeholder="t('Common.comm_filtration')" v-model="filterText" size="small" style="flex:1">
            <template #suffix><i class="iconfont icon-sousuo1"></i></template>
          </el-input>
          <i class="iconfont icon-liebiao" style="cursor:pointer;font-size:18px;" @click="toggleFold"></i>
        </div>
        <el-collapse v-model="activeNames">
          <el-collapse-item name="device">
            <template #title>
              <div style="display:flex;justify-content:space-between;width:90%;align-items:center;">
                <span>{{ t('Common.comm_device_partition') }}</span>
                <div class="liveview_colltitle">
                  <i class="liveview_titleicon1 iconfont icon-shuaxin1" @click.stop="refreshTree"></i>
                </div>
              </div>
            </template>
            <el-tree ref="treeRef" :data="treeData" :props="treeProps" node-key="id"
              :default-expanded-keys="expandedKeys" :filter-node-method="filterNode"
              style="overflow:auto;">
              <template #default="{ node, data }">
                <div style="width:100%;display:flex;justify-content:space-between;align-items:center;"
                  draggable="true" @dragstart="onDragStart($event, data)">
                  <span class="size_color" style="display:flex;align-items:center;flex:1;overflow:hidden;">
                    <i :class="`iconfont ${getNodeIcon(data)}`"
                      style="margin-right:6px;font-size:19px;flex-shrink:0;"></i>
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ node.label }}</span>
                    <span v-if="data.totalCount !== undefined" style="padding-left:4px;flex-shrink:0;">
                      {{ data.onlineCount }}/{{ data.totalCount }}
                    </span>
                  </span>
                  <span v-if="isNodePlaying(data)" class="nowplay">
                    <span class="dot">●</span>
                    <span class="nowplayText">
                      {{ data.isDeviceChannel ? t('Liveview.live_playing') : t('Liveview.live_displaying') }}
                    </span>
                  </span>
                </div>
              </template>
            </el-tree>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- ── 右侧视频区 ── -->
      <div class="liveview_right" id="gv-videoPanel">
        <div style="width:100%;flex:1;min-height:0;display:flex;flex-direction:column;">

          <!-- GridLayoutManager 挂载容器 -->
          <div class="liveview_right_video_hed" id="gv_video_hed"
            @drop.prevent="onDrop($event)" @dragover.prevent="onDragOver($event)">
            <!-- 码率信息浮层 -->
            <div class="malv" :class="infoShow ? '' : 'malv-hide'">
              <div class="malv-close" @click="closeInfo">×</div>
              <div class="malv-left">
                <div class="information_title">{{ t('Liveview.live_video') }}</div>
                <div class="information_content" v-for="(a,i) in infoVideo" :key="i">
                  <div class="information_content_left">{{ a.name }}</div>
                  <div class="information_content_right">{{ a.data }}</div>
                </div>
              </div>
              <div class="malv-right">
                <div class="information_title">{{ t('CommDev.comm_dev_audio') }}</div>
                <div class="information_content" v-for="(a,i) in infoAudio" :key="i">
                  <div class="information_content_left">{{ a.name }}</div>
                  <div class="information_content_right">{{ a.data }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 回放控制区（仅回放模式显示） -->
          <div v-show="!isLiveview" class="control_area" style="width:100%;">
            <div class="timeline-box" style="width:100%;height:80px;padding:0;box-sizing:border-box;border:none;">
              <svg id="gv-timeline"></svg>
            </div>
            <div class="control_btns">
              <div class="storage_box">
                <div class="storage_mode">
                  <div class="CentralStorage" :class="{active: playbackMode==='CentralStorage'}"
                    @click="changeStorage('CentralStorage')">{{ t('Cascade.cascade_central_record') }}</div>
                  <div class="DeviceStorage"  :class="{active: playbackMode==='DeviceStorage'}"
                    @click="changeStorage('DeviceStorage')">{{ t('Playback.pb_device_record') }}</div>
                </div>
              </div>
              <div class="control-center">
                <el-date-picker class="fixed_input" v-model="xzvalue" size="small"
                  @change="onDateChange" @focus="onDateFocus" @blur="onDateBlur"
                  type="date" :placeholder="t('Common.comm_select_date_time')"
                  :clearable="false" :append-to-body="false"
                  :default-time="new Date(2000, 0, 1, 0, 0, 0)">
                </el-date-picker>
                <el-select v-model="speedVal" size="small" class="ele" :popper-append-to-body="false"
                  popper-class="selectdrop" @change="setSpeed(speedVal)"
                  @visible-change="onSpeedDropdown">
                  <el-option v-for="s in speedOptions" :key="s.value" :label="s.label" :value="s.value" />
                </el-select>
                <button class="resume-btn" @click="togglePlay">
                  <i class="iconfont" :class="isPlaying ? 'icon-zanting' : 'icon-bofang'"></i>
                </button>
                <div class="Audio_slider-bottom">
                  <div style="margin-right:10px;">
                    <i class="iconfont" :class="volumeVal===0 ? 'icon-shengyinguan' : 'icon-shengyinkai'"
                      style="font-size:22px;"></i>
                  </div>
                  <el-slider :step="0.1" :show-tooltip="false" :max="1" v-model="volumeVal"
                    style="width:60%;margin-right:10px;"></el-slider>
                </div>
              </div>
              <div class="caveat_butt">
                <div class="showRecodeType" @click="showRecType=!showRecType">
                  <i class="iconfont" :class="showRecType ? 'icon-youjiantou' : 'icon-zuojiantou'"></i>
                </div>
                <div class="recodeType" v-if="showRecType" style="padding:0 10px;">
                  <button class="mr-0"></button>{{ t('Playback.pb_schedule') }}
                  <button class="mr-1"></button>{{ t('Playback.pb_manual') }}
                  <button class="mr-2"></button>{{ t('Playback.pb_alarm') }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 底部工具栏（在 liveview_right 内，仅覆盖视频区宽度，居中精准） -->
        <div class="liveview_footer">
          <div class="BlankPlaceholder"></div>
          <div class="show-play-replay">
            <div class="changeLiveReplay" @click="setLiveMode(true)"
              :class="isLiveview ? 'live' : 'replay'">{{ t('Monitoring.mon_live') }}</div>
            <div class="changeLiveReplay" @click="setLiveMode(false)"
              :class="!isLiveview ? 'live' : 'replay'">{{ t('Monitoring.mon_playback') }}</div>
          </div>
          <div class="footer-right">
            <el-button class="iconfont icon-guanbi2 offAllVideo" @click="closeAllVideo"></el-button>
            <el-button class="iconfont icon-quanping1" @click="panelFullScreen"></el-button>
          </div>
        </div>
      </div>

      <!-- 树折叠时的展开按钮 -->
      <div v-if="isTreeFold" class="TreeFold" @click="toggleFold">
        <i class="iconfont icon-liebiao"></i>
      </div>

      <!-- PTZ 云台面板 -->
      <div class="yuntai" :class="ptzShow ? '' : 'yuntai-hide'">
        <div class="header">
          <span>{{ t('Liveview.live_ptz') }}</span>
          <i class="iconfont icon-zhankai2" @click="closePtz"></i>
        </div>
        <div class="controls">
          <div class="left">
            <i class="iconfont icon-jujiao2"      @mousedown="ptzAction('focusin')"  @mouseup="ptzAction('stop')"></i>
            <i class="iconfont icon-jujiao1"      @mousedown="ptzAction('focusout')" @mouseup="ptzAction('stop')"></i>
            <i class="iconfont icon-guangquanjia" @mousedown="ptzAction('irisin')"   @mouseup="ptzAction('stop')"></i>
            <i class="iconfont icon-guangquanjian"@mousedown="ptzAction('irisout')"  @mouseup="ptzAction('stop')"></i>
            <i class="iconfont icon-light-open"   @mousedown="ptzAction('lighton')"  @mouseup="ptzAction('stop')"></i>
            <i class="iconfont icon-light-close"  @mousedown="ptzAction('lightoff')" @mouseup="ptzAction('stop')"></i>
            <i class="iconfont icon-kaiyushua"    @mousedown="ptzAction('wiperon')"  @mouseup="ptzAction('stop')"></i>
            <i class="iconfont icon-guanyushua"   @mousedown="ptzAction('wiperoff')" @mouseup="ptzAction('stop')"></i>
          </div>
          <div class="right">
            <div class="ptz-item corner"><div class="zs" @mousedown="ptzAction('upleft')"   @mouseup="ptzAction('stop')"><i class="iconfont icon-zuoshang"></i></div></div>
            <div class="ptz-item shang"              @mousedown="ptzAction('up')"       @mouseup="ptzAction('stop')"><i class="iconfont icon-shang"></i></div>
            <div class="ptz-item corner"><div class="ys" @mousedown="ptzAction('upright')"  @mouseup="ptzAction('stop')"><i class="iconfont icon-youshang"></i></div></div>
            <div class="ptz-item zuo"                @mousedown="ptzAction('left')"     @mouseup="ptzAction('stop')"><i class="iconfont icon-zuo"></i></div>
            <div class="ptz-item center"></div>
            <div class="ptz-item you"                @mousedown="ptzAction('right')"    @mouseup="ptzAction('stop')"><i class="iconfont icon-you"></i></div>
            <div class="ptz-item corner"><div class="zx" @mousedown="ptzAction('downleft')" @mouseup="ptzAction('stop')"><i class="iconfont icon-zuoxia"></i></div></div>
            <div class="ptz-item xia"                @mousedown="ptzAction('down')"     @mouseup="ptzAction('stop')"><i class="iconfont icon-xia"></i></div>
            <div class="ptz-item corner"><div class="yx" @mousedown="ptzAction('downright')"@mouseup="ptzAction('stop')"><i class="iconfont icon-youxia"></i></div></div>
          </div>
        </div>
        <div class="ptz-slider">
          <span>{{ ptzSpeed }}</span>
          <el-slider v-model="ptzSpeed" :show-tooltip="false" :max="1" :min="0.1" :step="0.1" />
        </div>
        <el-timeline>
          <el-timeline-item placement="top" v-for="pre in presetList" :key="pre.strToken">
            <el-card>
              <div class="preset_bgc">
                <input type="text" class="preset_input" :value="pre.strName" />
                <button class="iconfont icon-RectangleCopy1" @click="gotoPreset(pre.strToken)"></button>
                <button class="iconfont icon-icon-test1"     @click="setPreset(pre.strToken,$event)"></button>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { GridLayoutManager, Timeline, H5sPlayerWS2 } from '@/assets/js/uplayersdk.esm.js'
import { H5sPlayerWS, H5sPlayerRTC, H5sPlayerAudBack } from '@/assets/js/h5splayer.js'
import { useUserStore } from '@/store/user'
import { useStore } from '@/store'
import { GetDevPartitionApi } from '@/api/configuration/device'
import {
  GetDeviceChannels, getSearchStorRecordByTimeApi, getSearchDeviceRecordByTimeApi,
  RecEnableApi, setRecEnableApi, GetRecordCalendar, GetInformationDataApi,
  GetPresetsApi, PresetJumpApi, SetPresetApi, PtzApi
} from '@/api/channel'
import { GetViewApi } from '@/api/view'
import uuid from '@/assets/js/uuid.js'

const { t } = useI18n()
const userStore = useUserStore()
const store     = useStore()

// ─── Tree state ─────────────────────────────────────────────────────────────
interface TreeNode {
  id: string; label: string; type: string; data: any
  token?: string; isDeviceChannel?: boolean; online?: boolean
  totalCount?: number; onlineCount?: number; children?: TreeNode[]
}
const treeRef        = ref<any>(null)
const treeData       = ref<TreeNode[]>([])
const expandedKeys   = ref<string[]>([])
const filterText     = ref('')
const activeNames    = ref(['device'])
const isTreeFold     = ref(false)
const treeProps      = { value: 'id', label: 'label', children: 'children' }
const deviceCache    = new Map<string, TreeNode[]>()
const playingNodeIds = ref<string[]>([])

// ─── Player / Grid state ─────────────────────────────────────────────────────
let GridManager: any = null
let timeline: any    = null
let audioback: any   = null
const isLiveview   = ref(true)
const isPlaying    = ref(false)
const isDrag       = ref(false)
const dragData     = ref<any>({})
const isPlayingArr = ref<any[]>([])
const selectCellId = ref('')

// ─── Playback controls ───────────────────────────────────────────────────────
const xzvalue      = ref<Date>(new Date())
const playbackMode = ref(store.DefaultStorage ?? 'CentralStorage')
const speedVal     = ref('1.0')
const volumeVal    = ref(0)
const showRecType  = ref(false)
const customDateArr = ref<number[]>([])
const speedOptions = [
  { value:'16.0', label:'16x' }, { value:'8.0', label:'8x' }, { value:'4.0', label:'4x' },
  { value:'2.0', label:'2x' },   { value:'1.0', label:'1x' }, { value:'0.5', label:'1/2x' },
  { value:'0.25', label:'1/4x' },
]
const pickerOptions = {
  cellClassName(date: Date) {
    return customDateArr.value.indexOf(date.getTime()) !== -1 ? 'custom_date_class' : ''
  }
}

// 音量变化时同步到所有播放器
watch(volumeVal, (val) => {
  isPlayingArr.value.forEach(item => {
    try { item.v1?.setVolume?.(val) } catch {}
  })
})

// ─── Info overlay ────────────────────────────────────────────────────────────
const infoShow  = ref(false)
const infoVideo = ref<any[]>([])
const infoAudio = ref<any[]>([])
let timerRunInfo: any = null

// ─── PTZ state ───────────────────────────────────────────────────────────────
const ptzShow    = ref(false)
const ptzToken   = ref('')
const ptzSpeed   = ref(0.5)
const presetList = ref<any[]>([])

// ─── Tree helpers ─────────────────────────────────────────────────────────────
const getNodeIcon = (n: TreeNode) => {
  if (n.type === 'view') return 'icon-shitu2'
  if (n.isDeviceChannel) return 'icon-shexiangjizaixian'
  if (n.type === 'device') return 'icon-Device'
  return 'icon-gen'
}
const isNodePlaying = (n: TreeNode) => playingNodeIds.value.includes(n.id)
const filterNode = (query: string, data: TreeNode) => !query || (data.label?.includes(query) ?? false)
watch(filterText, v => treeRef.value?.filter(v))

// ─── Load device tree ─────────────────────────────────────────────────────────
const loadTree = async () => {
  const res = await GetDevPartitionApi()
  if (res.status !== 200 || res.data.code !== 0) return
  const list: TreeNode[] = []
  const walk = (nodes: any[]) => {
    nodes.forEach(p => {
      if (p.children?.length) walk(p.children)
      p.dev?.forEach((d: any) => list.push({
        id: `dev_${d.devId}`, label: d.name, type: 'device', online: d.online, data: d,
        children: [{ id: 'ph', label: '', type: 'device', data: null }],
      }))
      p.view?.forEach((v: any) => list.push({
        id: `view_${v.viewId}`, label: v.viewName, type: 'view', data: v,
      }))
    })
  }
  walk(res.data.result ?? [])
  const devs = list.filter(n => n.type === 'device' && n.data?.token)
  for (let i = 0; i < devs.length; i += 3) {
    await Promise.allSettled(devs.slice(i, i + 3).map(async item => {
      if (deviceCache.has(item.data.token)) {
        const c = deviceCache.get(item.data.token)!
        item.children = c.length ? c : undefined; return
      }
      const r = await GetDeviceChannels(item.data.token)
      if (r.status === 200 && r.data.code === 0 && r.data.result?.length) {
        const chs: TreeNode[] = r.data.result.map((ch: any, i: number) => ({
          id: `ch_${item.data.devId}_${i}`, label: ch.name || `ch${i+1}`,
          type: 'device', data: ch, isDeviceChannel: true, online: ch.online,
        }))
        deviceCache.set(item.data.token, chs)
        item.children = chs; item.totalCount = chs.length
        item.onlineCount = chs.filter((c: any) => c.online).length
      } else { deviceCache.set(item.data.token, []); item.children = undefined }
    }))
  }
  expandedKeys.value = list.filter(n => n.type === 'device' && !n.isDeviceChannel).map(n => n.id)
  treeData.value = list
}
const refreshTree = () => { deviceCache.clear(); loadTree() }
const toggleFold = () => {
  isTreeFold.value = !isTreeFold.value
  const left  = document.querySelector('.liveview_left')  as HTMLElement | null
  const right = document.querySelector('.liveview_right') as HTMLElement | null
  if (left && right) {
    left.style.flex   = isTreeFold.value ? '0 0 0%'  : '0 0 15%'
    right.style.width = isTreeFold.value ? '100%'     : 'calc(100% - 15%)'
  }
}

// ─── Drag from tree ───────────────────────────────────────────────────────────
const onDragStart = (ev: DragEvent, data: TreeNode) => {
  if (!data || !data.data) return
  isDrag.value = true
  const baseUrl = new URL(userStore.IPPORT || window.location.origin)
  if (data.type === 'view') {
    dragData.value = { viewid: data.data?.viewId, token: data.data?.viewId }
  } else if (data.isDeviceChannel && data.data?.token) {
    if (isLiveview.value) {
      dragData.value = {
        videoid: uuid(8), name: data.label,
        protocol: baseUrl.protocol, host: userStore.WSROOT,
        token: data.data.token, rootpath: '/',
        session: userStore.session, streamprofile: 'main',
        hlsver: 'v1', consolelog: 'true',
        resourceUUID: data.data.uuid ?? data.data.resourceUUID,
      }
    } else {
      const vid = uuid(8)
      const d = xzvalue.value ? new Date(xzvalue.value) : new Date()
      d.setHours(0, 0, 0, 0); const st = d.getTime()
      d.setHours(23, 59, 59, 999); const et = d.getTime()
      const Adswitch = playbackMode.value === 'CentralStorage' ? 'true' : 'false'
      dragData.value = {
        videoid: vid, name: data.label,
        protocol: baseUrl.protocol, host: userStore.WSROOT,
        rootpath: '/', token: data.data.token, serverpb: Adswitch,
        pbconf: {
          begintime: formatISO(st), endtime: formatISO(et),
          autoplay: 'true', showposter: 'false',
          callback: playbackCB, serverpb: Adswitch,
          userdata: { videoid: vid },
        },
        hlsver: 'v1', consolelog: 'false',
        session: userStore.session,
        resourceUUID: data.data.uuid ?? data.data.resourceUUID,
      }
    }
  }
  if (GridManager) {
    GridManager.showLines()
    GridManager.highlightCells([])
  }
}

const onDragOver = (ev: DragEvent) => {
  if (!isDrag.value || !GridManager) return
  GridManager.showLines()
  const pos = GridManager.findGridPositionByCoordinates(ev.pageX, ev.pageY)
  if (pos !== false) {
    const dims = GridManager.getDimensionsForGridPosition(pos[0], pos[1])
    GridManager.highlightCells([dims], 'rgba(141,189,255,0.3)')
  }
}

const onDrop = async (ev: DragEvent) => {
  if (!isDrag.value || !GridManager) {
    if (GridManager) { GridManager.hideLines(); GridManager.highlightCells([]) }
    return
  }
  const drag = dragData.value
  if (drag.videoid) {
    // 摄像头拖入
    let recEnable: boolean | undefined
    try {
      const res = await RecEnableApi(drag.token)
      if (res?.data?.code === 0) recEnable = res.data.result?.manualRecEnable
    } catch {}
    const conf = {
      pageX: ev.pageX, pageY: ev.pageY,
      id: 'G' + drag.videoid, recording: drag.recording, recEnable, audio: false,
      camera: { videoid: drag.videoid, token: drag.token, session: drag.session,
        name: drag.name, streamprofile: drag.streamprofile, resourceUUID: drag.resourceUUID },
    }
    GridManager.claimCellByCoordinates(conf)
    const container = document.getElementById(conf.id)
    if (container) {
      const video = document.createElement('video')
      Object.assign(video.style, { position:'absolute', width:'100%', height:'100%', top:'0', left:'0', display:'block' })
      video.id = drag.videoid; video.controls = false; video.muted = true; video.autoplay = true
      container.appendChild(video)
    }
    const obj: any = { v1: null, conf: { ...drag }, data: { isPlaying: true, region: '1.0' } }
    const rtcMode = isLiveview.value ? store.liveviewrtc : store.liveviewrtc1
    if (rtcMode === 'WS') obj.v1 = new H5sPlayerWS(drag)
    else obj.v1 = new H5sPlayerWS2(drag)
    obj.v1.connect()
    isPlayingArr.value.push(obj)
    selectedSDK('G' + drag.videoid)
    markNodePlaying(drag.token)
    // 回放模式下拖入画面后，同步播放按钮为"正在播放"状态（pbconf.autoplay:'true'）
    if (!isLiveview.value) isPlaying.value = true
  } else if (drag.viewid) {
    loadViewInGrid(drag.viewid)
  }
  isDrag.value = false
  dragData.value = {}
  GridManager.hideLines()
  GridManager.highlightCells([])
}

// ─── Load view into grid ──────────────────────────────────────────────────────
const loadViewInGrid = async (viewId: string | number) => {
  const res = await GetViewApi(viewId)
  if (res.status !== 200 || res.data.code !== 0) return
  const result = res.data.result
  const layoutData = transformViewToGrid(result.layout, result.viewEntity)
  localStorage.setItem('gv-grid-layout', JSON.stringify(layoutData))
  GridManager.initialize()
  await nextTick()
}

const transformViewToGrid = (layoutData: any, viewEntities: any[]) => {
  const layout = layoutData?.setting?.layoutView ?? []
  const positionMap: Record<string, any> = {}
  viewEntities?.forEach((entity: any) => {
    if (entity.layoutPosition) {
      positionMap[entity.layoutPosition] = {
        token: entity.Channel?.token, name: entity.Channel?.name,
        resourceUUID: entity.resourceUUID, recording: entity.Channel?.recording,
      }
    }
  })
  const maxRow = Math.max(...layout.map((c: any) => c.rowEnd)) - 1
  const maxCol = Math.max(...layout.map((c: any) => c.colEnd)) - 1
  const result = Array.from({ length: maxRow }, () => Array.from({ length: maxCol }, () => ({})))
  const processed = new Set<string>()
  layout.forEach((cell: any) => {
    const row = cell.rowStart - 1; const col = cell.colStart - 1
    const key = `${row}-${col}`
    if (processed.has(key)) return
    const posKey = `h${cell.rowStart}-${cell.colStart}`
    const cam = positionMap[posKey]
    const vid = uuid(8)
    if (cam) {
      result[row][col] = {
        row, column: col, rowSpan: cell.rowEnd - cell.rowStart, columnSpan: cell.colEnd - cell.colStart,
        forceLbm: false, claimed: true, spannedUpon: false,
        camera: { videoid: vid, token: cam.token, session: userStore.session,
          name: cam.name, label: cam.name, resourceUUID: cam.resourceUUID, recording: cam.recording },
        id: `G${vid}`,
      }
    }
    processed.add(key)
  })
  return result
}

// ─── GridLayoutManager init ───────────────────────────────────────────────────
const initGridLayout = () => {
  GridManager = new GridLayoutManager('#gv_video_hed', {
    cacheKey: 'gv-grid-layout',
    padding: 20, aspectRatio: [16, 9], animationDuration: 500,
    createIcons: {
      playModeIcon: true, playModeText: store.liveviewrtc,
      informationIcon: true, shouwhearIcon: true, snapshotIcon: true,
      recEnableIcon: true, ptzcontrolIcon: true,
    },
  })

  const closeCellH  = (e: any) => closePlayContainer(e.detail)
  const clickCellH  = (e: any) => selectedSDK(e.detail)
  const infoH       = (e: any) => showInfo(e.detail.id)
  const shoutH      = (e: any) => doShoutwheat(e.detail.id, e.detail.audio)
  const snapH       = (e: any) => doSnapshot(e.detail.id)
  const recH        = (e: any) => doManualRec(e.detail.id, e.detail.recEnable)
  const ptzH        = (e: any) => showPtz(e.detail.id)
  const layoutReadyH= (e: any) => onLayoutReady(e.detail)

  GridManager.addEventListener('closeCell',            closeCellH)
  GridManager.addEventListener('cellClick',            clickCellH)
  GridManager.addEventListener('Information',          infoH)
  GridManager.addEventListener('Shoutwheat',           shoutH)
  GridManager.addEventListener('Snapshot',             snapH)
  GridManager.addEventListener('recEnableClick',       recH)
  GridManager.addEventListener('PtzControlShow',       ptzH)
  GridManager.addEventListener('layoutLoadedFromCache', layoutReadyH)
  GridManager.initialize()
}

// ─── Layout-ready callback (restores players from cache) ─────────────────────
const onLayoutReady = async (detail: any[][]) => {
  isLiveview.value = true
  await nextTick()
  detail.forEach(row => row.forEach(cell => {
    if (!cell?.camera) return
    const cam = cell.camera
    const obj: any = {
      conf: { videoid: cam.videoid, name: cam.name, protocol: 'http:', host: userStore.WSROOT,
        token: cam.token, rootpath: '/', session: userStore.session, streamprofile: cam.streamprofile ?? 'main',
        hlsver: 'v1', consolelog: 'true', resourceUUID: cam.resourceUUID },
      v1: null, data: { isPlaying: true, region: '1.0' },
    }
    const container = document.getElementById('G' + cam.videoid)
    if (container) {
      const video = document.createElement('video')
      Object.assign(video.style, { position:'absolute', width:'100%', height:'100%', top:'0', left:'0', display:'block' })
      video.id = cam.videoid; video.controls = false; video.muted = true; video.autoplay = true
      container.appendChild(video)
    }
    obj.v1 = new H5sPlayerWS2(obj.conf)
    obj.v1.connect()
    isPlayingArr.value.push(obj)
  }))
}

// ─── Cell close / select helpers ─────────────────────────────────────────────
const closePlayContainer = (id: string) => {
  const vid = id.slice(1)
  const idx = isPlayingArr.value.findIndex(item => item.conf.videoid === vid)
  if (idx === -1) return
  const obj = isPlayingArr.value[idx]
  try { obj.v1?.disconnect(); delete obj.v1 } catch {}
  unmarkNodePlaying(obj.conf.token)
  isPlayingArr.value.splice(idx, 1)
  if (selectCellId.value === vid) { selectCellId.value = '' }
  // 最后一格关闭后：重置播放状态，并清除时间轴上的蓝色录像色块
  if (isPlayingArr.value.length === 0) {
    isPlaying.value = false
    if (timeline) {
      timeline.options.name = ''; timeline._initEventBarName?.(); timeline.updateMotionEvents?.([], null)
    }
  }
}

const selectedSDK = (id: string) => {
  const vid = id.slice(1)
  selectCellId.value = vid
  document.querySelectorAll('.grid_cell.red_border').forEach(el => el.classList.remove('red_border'))
  const target = document.getElementById(id)
  if (target) target.classList.add('red_border')
  if (!isLiveview.value && timeline) {
    const cur = isPlayingArr.value.find(item => item.conf.videoid === vid)
    if (cur) getEventBar(cur.conf.token, cur.conf.name, cur.conf.pbconf?.begintime)
  }
}

// ─── Info (bitrate) panel ─────────────────────────────────────────────────────
const showInfo = (id: string) => {
  const vid = id.slice(1)
  const cur = isPlayingArr.value.find(item => item.conf.videoid === vid)
  if (infoShow.value) {
    infoShow.value = false; clearInterval(timerRunInfo); timerRunInfo = null
  } else {
    infoShow.value = true
    fetchInfo(vid, cur?.conf.token)
    timerRunInfo = setInterval(() => fetchInfo(vid, cur?.conf.token), 8000)
  }
}
const closeInfo = () => {
  infoShow.value = false; clearInterval(timerRunInfo); timerRunInfo = null
}
const fetchInfo = async (_vid: string, token: string) => {
  if (!token) return
  try {
    const res = await GetInformationDataApi(token)
    if (res.status !== 200) return
    const d = res.data
    infoAudio.value = [
      { name: t('Liveview.live_codec'),      data: d.strAudioType },
      { name: t('Liveview.live_sampleRate'), data: d.nAudioSampleRate },
      { name: t('Liveview.live_sampleBit'),  data: d.nAudioSampleBit },
      { name: t('Liveview.live_channels'),   data: d.nAudioChannels },
      { name: t('CommDev.comm_dev_bitrate'), data: (d.nAudioBitrate / 1024).toFixed(1) + 'kbps' },
    ]
    infoVideo.value = [
      { name: t('Liveview.live_codec'),      data: d.strVideoType },
      { name: t('Common.comm_width'),        data: d.nVideoWidth },
      { name: t('Common.comm_height'),       data: d.nVideoHeight },
      { name: t('Common.comm_fps'),          data: d.nVideoFPS },
      { name: t('CommDev.comm_dev_bitrate'), data: (d.nVideoBitrate / 1024).toFixed(1) + 'kbps' },
    ]
  } catch {}
}

// ─── Shoutwheat (audio intercom) ─────────────────────────────────────────────
const doShoutwheat = (id: string, audio: boolean) => {
  const vid = id.slice(1)
  const cur = isPlayingArr.value.find(item => item.conf.videoid === vid)
  if (!cur) return
  if (audio) {
    audioback?.disconnect(); audioback = null
  } else {
    audioback?.disconnect()
    audioback = new H5sPlayerAudBack({
      protocol: window.location.protocol, host: userStore.WSROOT, rootpath: '/',
      token: cur.conf.token, session: userStore.session,
    })
    audioback.connect()
  }
  GridManager?.changeAudio(id, !audio)
}

// ─── Snapshot ────────────────────────────────────────────────────────────────
const doSnapshot = (id: string) => {
  const vid = id.slice(1)
  const cur = isPlayingArr.value.find(item => item.conf.videoid === vid)
  if (!cur) return
  const video = document.getElementById(vid) as HTMLVideoElement | null
  if (!video) return
  const d = new Date()
  const fileName = `${cur.conf.token}_${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth; canvas.height = video.videoHeight
  canvas.getContext('2d')!.drawImage(video, 0, 0)
  const a = document.createElement('a')
  a.download = fileName; a.href = canvas.toDataURL('image/png')
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}

// ─── Manual record ────────────────────────────────────────────────────────────
const doManualRec = async (id: string, recEnable: boolean) => {
  const vid = id.slice(1)
  const cur = isPlayingArr.value.find(item => item.conf.videoid === vid)
  if (!cur) return
  const newState = !recEnable
  try {
    const res = await setRecEnableApi({ devUUID: cur.conf.resourceUUID, setting: { manualRecEnable: newState } })
    if (res.status === 200 && res.data.msg === 'Success') GridManager?.changeRecEnable(id, newState)
  } catch {}
}

// ─── PTZ ─────────────────────────────────────────────────────────────────────
const showPtz = async (id: string) => {
  const vid = id.slice(1)
  const cur = isPlayingArr.value.find(item => item.conf.videoid === vid)
  if (!cur) return
  ptzShow.value = true; ptzToken.value = cur.conf.token; presetList.value = []
  try {
    const res = await GetPresetsApi(ptzToken.value)
    if (res.status === 200) presetList.value = (res.data.preset ?? []).slice(0, 8)
  } catch {}
}
const closePtz = () => { ptzShow.value = false; ptzToken.value = '' }
const ptzAction = (action: string) => {
  if (!ptzToken.value) return
  PtzApi(ptzToken.value, action, ptzSpeed.value)
}
const gotoPreset = (presetToken: string) => {
  PresetJumpApi(ptzToken.value, presetToken, ptzSpeed.value)
}
const setPreset = (presetToken: string, ev: MouseEvent) => {
  const inputVal = (ev.currentTarget as HTMLElement)
    ?.previousElementSibling?.previousElementSibling
    ?.querySelector('input')?.value ?? ''
  SetPresetApi(ptzToken.value, inputVal, presetToken)
}

// ─── Close all / fullscreen ───────────────────────────────────────────────────
const closeAllVideo = () => {
  isPlayingArr.value.forEach(item => { try { item.v1?.disconnect(); delete item.v1 } catch {} })
  if (audioback) { audioback.disconnect(); audioback = null }
  isPlayingArr.value = []; selectCellId.value = ''; playingNodeIds.value = []
  if (!isLiveview.value && timeline) {
    timeline.options.name = ''; timeline._initEventBarName?.(); timeline.updateMotionEvents?.([], null)
  }
  // 保持回放/实时模式不变，进度条由 v-show 的 length 条件控制隐藏
  isPlaying.value = false
  GridManager?.reloadStageConfiguration(async () => {})
}
const panelFullScreen = () => {
  const el: any = document.getElementById('gv_video_hed'), doc: any = document
  if (!el) return
  if (doc.fullscreenElement || doc.webkitFullscreenElement) {
    (doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc)
  } else {
    (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el)
  }
}

// ─── Node playing mark/unmark ─────────────────────────────────────────────────
const markNodePlaying = (token: string) => {
  const node = treeData.value.find(n => n.data?.token === token)
  if (node && !playingNodeIds.value.includes(node.id)) playingNodeIds.value.push(node.id)
}
const unmarkNodePlaying = (token: string) => {
  const still = isPlayingArr.value.some(item => item.conf.token === token)
  if (!still) {
    const node = treeData.value.find(n => n.data?.token === token)
    if (node) playingNodeIds.value = playingNodeIds.value.filter(id => id !== node.id)
  }
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
const initTimeline = () => {
  const darkMode = store.darkMode
  let bg = '#343434'
  if (darkMode === false)        bg = '#E4E4E4'
  else if (darkMode === 'darkblue') bg = '#1C2850'

  timeline = new Timeline('#gv-timeline', { timelineBackgroundColor: bg, singleEvent: true })
  timeline.updateBackgroundColor(bg)

  // 拖拽时间轴结束 → 所有播放器跳转
  timeline.addEventListener('resume', (e: CustomEvent) => {
    if (!isPlayingArr.value.length) return
    const cur = isPlayingArr.value.find(item => item.conf.videoid === selectCellId.value)
    if (cur) {
      cur.v1.moveto(formatISO(e.detail))
      xzvalue.value = new Date(e.detail)
      getEventBar(cur.conf.token, cur.conf.name, xzvalue.value)
    }
  })

  // 时间轴当前时间更新 → 同步日期选择器
  timeline.addEventListener('timelineCurrentTime', (e: CustomEvent) => {
    if (e.detail) xzvalue.value = new Date(e.detail)
  })
}

const getEventBar = async (token: string, name: string, strTime: any) => {
  const date = strTime ? new Date(strTime) : new Date()
  date.setHours(23, 59, 59, 0); const endTime = date.getTime()
  date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - 1); const startTime = date.getTime()
  try {
    let res: any
    if (playbackMode.value === 'CentralStorage') {
      res = await getSearchStorRecordByTimeApi(token, new Date(startTime).toISOString(), new Date(endTime).toISOString())
    } else {
      res = await getSearchDeviceRecordByTimeApi(token, new Date(startTime).toISOString(), new Date(endTime).toISOString())
    }
    if (res.status === 200 && res.data?.record) {
      timeline.options.name = name; timeline._initEventBarName?.()
      timeline.updateMotionEvents?.(res.data.record, null)
    }
  } catch {}
}

// ─── Live / Playback toggle ───────────────────────────────────────────────────
const setLiveMode = (live: boolean) => {
  isLiveview.value = live
  if (!live && !timeline) {
    nextTick(() => initTimeline())
  }
  resetPlayMode()
  GridManager?.changePlayModeText(live ? store.liveviewrtc : store.liveviewrtc1)
}

const resetPlayMode = () => {
  const Adswitch = playbackMode.value === 'CentralStorage' ? 'true' : 'false'
  const d = new Date(); d.setHours(0,0,0,0); const st = d.getTime()
  d.setHours(23,59,59,999); const et = d.getTime()
  isPlayingArr.value.forEach(item => {
    try { item.v1?.disconnect(); delete item.v1 } catch {}
    const conf = item.conf
    if (isLiveview.value) {
      item.conf = { videoid: conf.videoid, name: conf.name, protocol: conf.protocol, host: conf.host,
        rootpath: '/', token: conf.token, streamprofile: conf.streamprofile, hlsver: 'v1',
        consolelog: 'false', session: conf.session, resourceUUID: conf.resourceUUID }
    } else {
      item.conf = { videoid: conf.videoid, name: conf.name, protocol: conf.protocol, host: conf.host,
        rootpath: '/', token: conf.token, serverpb: Adswitch, streamprofile: conf.streamprofile,
        pbconf: { begintime: formatISO(st), endtime: formatISO(et), autoplay: 'true', showposter: 'false',
          callback: playbackCB, serverpb: Adswitch, userdata: { videoid: conf.videoid } },
        hlsver: 'v1', consolelog: 'false', session: conf.session, resourceUUID: conf.resourceUUID }
      item.data = { isPlaying: true, region: '1.0' }
    }
    item.v1 = new H5sPlayerWS2(item.conf)
    item.v1.connect()
  })
  // 回放模式且有画面时，同步播放按钮为"正在播放"状态（autoplay:'true' 已自动开始）
  if (!isLiveview.value && isPlayingArr.value.length > 0) {
    isPlaying.value = true
  }
}

const playbackCB = (event: string, userdata: any) => {
  if (selectCellId.value !== userdata?.videoid) return
  try {
    const strTime = JSON.parse(event).strTime
    if (strTime && strTime !== 'none') { timeline?.setCurrentTime(strTime); xzvalue.value = new Date(strTime) }
  } catch {}
}

// ─── Playback UI controls ─────────────────────────────────────────────────────
const togglePlay = () => {
  if (!isPlayingArr.value.length) return
  const cur = isPlayingArr.value.find(item => item.conf.videoid === selectCellId.value)
  if (!cur) return
  if (isPlaying.value) { cur.v1.pause(); cur.data.isPlaying = false; isPlaying.value = false }
  else                 { cur.v1.resume(); cur.data.isPlaying = true;  isPlaying.value = true  }
}
const setSpeed = (speed: string) => {
  if (!isPlayingArr.value.length) { speedVal.value = '1.0'; return }
  const cur = isPlayingArr.value.find(item => item.conf.videoid === selectCellId.value)
  cur?.v1?.speed(speed)
}
const changeStorage = (mode: string) => {
  if (mode === playbackMode.value) return
  playbackMode.value = mode; resetPlayMode()
}
const onDateChange = () => {
  if (!isPlayingArr.value.length) return
  const cur = isPlayingArr.value.find(item => item.conf.videoid === selectCellId.value)
  if (cur) { cur.v1.moveto(formatISO(xzvalue.value)); getEventBar(cur.conf.token, cur.conf.name, xzvalue.value) }
}
const onSpeedDropdown = (e: boolean) => {
  if (e) { (document.querySelector('.ele .selectdrop') as HTMLElement)?.style?.setProperty('left', '-19px') }
}
const onDateFocus = async () => {
  await nextTick()
  if (!selectCellId.value) return
  const cur = isPlayingArr.value.find(item => item.conf.videoid === selectCellId.value)
  if (cur) SearchRecordCalendar(cur.conf.token, xzvalue.value.getFullYear(), xzvalue.value.getMonth()+1)
}
const onDateBlur = () => {}

const SearchRecordCalendar = async (token: string, year: number, month: number) => {
  customDateArr.value = []
  try {
    const res = await GetRecordCalendar(token, year, month)
    res.data?.record?.forEach((key: any) => {
      if (key.bHasRec || key.bHasAlarmRec) {
        const m = month < 10 ? '0'+month : month, d2 = key.nDay < 10 ? '0'+key.nDay : key.nDay
        customDateArr.value.push(new Date(`${year}-${m}-${d2}T00:00:00+08:00`).getTime())
      }
    })
  } catch {}
}

// ─── Utility ──────────────────────────────────────────────────────────────────
const formatISO = (input: any) => {
  const d = new Date(input)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}+08:00`
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  loadTree()
  initGridLayout()
})

onBeforeUnmount(() => {
  isPlayingArr.value.forEach(item => { try { item.v1?.disconnect(); delete item.v1 } catch {} })
  if (audioback) { audioback.disconnect(); audioback = null }
  isPlayingArr.value = []
  if (timeline) {
    timeline.removeEventListener?.('resume', () => {})
    timeline.clearMotionBars?.(); timeline = null
  }
  if (GridManager) {
    GridManager.removeEventListener('closeCell',            () => {})
    GridManager.removeEventListener('cellClick',            () => {})
    GridManager.removeEventListener('Information',          () => {})
    GridManager.removeEventListener('Shoutwheat',           () => {})
    GridManager.removeEventListener('Snapshot',             () => {})
    GridManager.removeEventListener('recEnableClick',       () => {})
    GridManager.removeEventListener('PtzControlShow',       () => {})
    GridManager.removeEventListener('layoutLoadedFromCache',() => {})
    GridManager.destroy?.(); GridManager = null
  }
})
</script>

<style lang="scss" scoped>
.liveview_container {
  width: 100%;
  height: calc(100vh - 30px);
}
.liveview {
  display: flex;
  height: calc(100vh - 30px);
  justify-content: space-between;
  position: relative;
  overflow: hidden;

  .liveview_left {
    flex: 0 0 15%;
    height: 100%;
    overflow: auto;
    transition: flex 0.2s;
    &::-webkit-scrollbar { display: none; }

    .liveview_left_input {
      background: #1B1B1B;
      :deep(.el-input__inner) { color: #fff; }
      :deep(.el-input__wrapper) { background: #232323; box-shadow: none; }
    }

    .nowplay {
      display: flex; align-items: center; font-size: 12px; color: #30d158;
      .dot { font-size: 12px; padding-right: 4px; }
    }

    :deep(.el-collapse) {
      border: 0;
      .el-collapse-item__header { background: #303030; border: 0; color: #fff; font-size: 14px; height: 36px; }
      .el-collapse-item__wrap   { background: transparent; border: 0; }
      .el-tree { background: transparent; font-size: 13px;
        .el-tree-node__content { min-height: 26px; &:hover { background: rgba(255,255,255,0.1); } }
      }
    }
  }

  .liveview_lefts { flex: 0 0 0%; }

  .liveview_right {
    width: calc(100% - 15%);
    height: 100%;
    margin-right: 2px;
    display: flex;
    flex-direction: column;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .liveview_right_video_hed {
    position: relative;
    width: 100%;
    flex: 1;
    overflow: hidden;
    background-color: #1a1a1a;
    background-image: url('../../assets/imgs/GridLogo.png');
    background-size: 380px 350px;
    background-repeat: no-repeat;
    background-position: center center;

    .malv {
      position: absolute; top: 20px; right: 16px; z-index: 100;
      width: 336px; height: 150px; display: flex; transition: 0.2s;
      .malv-close { position: absolute; top: 3px; right: 8px; font-size: 16px; cursor: pointer; }
      .malv-left, .malv-right {
        width: 50%; height: 100%; background-color: rgba(#333, 0.5);
        .information_title { width: 100%; height: 30px; line-height: 30px; background-color: rgba(0,0,0,0.7); padding: 0 10px; }
        .information_content { width: 100%; display: flex; justify-content: space-between; padding: 0 2px;
          .information_content_left  { width: 50%; color: #3ABBFE; }
          .information_content_right { width: 50%; color: #3ABBFE; }
        }
      }
    }
    .malv-hide { right: -336px; }

    :deep(.line-matrix)  { position: absolute; z-index: 40; top: 0; left: 0; line { shape-rendering: crispEdges; stroke: #585858; } }
    :deep(.cell-matrix)  { z-index: 42; position: absolute; top: 0; left: 0;
      .red_border  { border: #f44336 2px solid; }
      .blue_dashed { border: #0399FE 2px dashed; }
      div { overflow: hidden; position: absolute; }
      .grid_cell:hover { .cell-i { bottom: 3px; } .float-layer { top: 0; } }
      .float-layer {
        position: absolute; right: 0; top: -30px; z-index: 10; height: 30px; line-height: 30px;
        background: url('~@/views/Monitoring/liveview/imgs/liveview_buttback.png') no-repeat;
        background-size: 290px 30px; text-align: right; padding: 0 10px; transition: 0.2s;
        i, span { margin-left: 10px; cursor: pointer; color: #fff; }
      }
      .cell-i { font-style: normal; position: absolute; bottom: -30px; right: 5px; color: aliceblue; font-size: 20px; z-index: 10; cursor: nwse-resize; transition: 0.2s; }
    }
    :deep(.cell-highlighter) { z-index: 44; position: absolute; top: 0; left: 0; display: none; }
  }

  .TreeFold {
    position: absolute; top: 0; left: 0; width: 40px; height: 40px;
    background: rgba(124,124,124,0.5); border-radius: 0 2px 2px 0; z-index: 1031;
    text-align: center; line-height: 40px; cursor: pointer; i { font-size: 18px; }
  }

  .yuntai {
    position: absolute; left: 5px; bottom: 0; width: 288px; height: 550px; transition: 0.3s;
    background: rgba(#232323, 0.95); border-radius: 4px;
    .header { width: 100%; height: 32px; padding: 0 10px; display: flex; justify-content: space-between; align-items: center;
      i { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 10px; }
    }
    .ptz-slider { width: 100%; padding: 0 20px; display: flex; flex-direction: column; align-items: center; :deep(.el-slider) { width: 100%; } }
    .controls {
      width: 100%; height: 144px; display: flex; justify-content: space-between; padding: 0 20px; margin: 20px 0;
      .left { width: 70px; height: 100%; display: grid; grid-template-columns: repeat(2,32px); grid-template-rows: repeat(4,32px); gap: 5px;
        i { display: flex; align-items: center; justify-content: center; border-radius: 4px; width: 32px; height: 32px; font-size: 20px; cursor: pointer; &:active { color: #0399FE; } }
      }
      .right { width: 144px; height: 100%; display: grid; grid-template-columns: repeat(3,1fr); grid-template-rows: repeat(3,1fr);
        .ptz-item { display: flex; justify-content: center; align-items: center; position: relative; i { font-size: 22px; } }
        .shang { border-radius: 4px 4px 0 0; cursor: pointer; }
        .zuo   { border-radius: 4px 0 0 4px; cursor: pointer; }
        .you   { border-radius: 0 4px 4px 0; cursor: pointer; }
        .xia   { border-radius: 0 0 4px 4px; cursor: pointer; }
        .corner { background: transparent;
          .zs, .ys, .zx, .yx { position: absolute; width: 32px; height: 32px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; i { font-size: 20px; } }
          .zs { top: 0; left: 0; } .ys { top: 0; right: 0; } .zx { left: 0; bottom: 0; } .yx { right: 0; bottom: 0; }
        }
        .ptz-item:active i { color: #0399FE; }
      }
    }
    :deep(.el-timeline) { padding: 0 20px;
      .preset_bgc { width: 100%; display: flex; justify-content: space-between; align-items: center;
        .preset_input { width: 150px; background: transparent; border: none; box-shadow: none; padding-left: 10px; }
        button { background: transparent; border: none; }
      }
    }
  }
  .yuntai-hide { bottom: -550px; }
}

.liveview_footer {
  height: 30px; width: 100%; display: flex; align-items: center;
  flex-shrink: 0; background: #232323;
  .BlankPlaceholder { flex: 1; }
  .show-play-replay {
    display: flex; align-items: center;
    .changeLiveReplay {
      width: 60px; height: 22px; border-radius: 4px; text-align: center; line-height: 22px; cursor: pointer; font-size: 13px;
      &.live   { color: #0399FE; background: rgba(3,153,254,0.15); }
      &.replay { color: #888;   background: transparent; }
    }
  }
  .footer-right {
    flex: 1; display: flex; align-items: center; justify-content: flex-end;
    padding-right: 30px; gap: 4px;
  }
  :deep(button) { padding: 0; border: none; background: none; box-shadow: none; font-size: 22px; color: #fff; cursor: pointer; &:hover { color: #0399FE; } }
}

// 回放控制区
.control_area {
  width: 100%; display: flex; flex-direction: column; flex-shrink: 0;
  .control_btns {
    width: 100%; flex: 1; background: #282828; display: flex; align-items: center; justify-content: space-between;
    .storage_box { width: 17%; }
    .storage_mode { 
      width: 240px; display: flex; height: 24px; margin-left: 10px; border-radius: 12px;
      .CentralStorage, .DeviceStorage { 
        flex: 1; height: 100%; line-height: 24px; text-align: center; 
        border-radius: 12px; cursor: pointer; white-space: nowrap;
      }
        .active { background-color: #0399FE; }
    }
    .control-center { display: flex; align-items: center;
      .resume-btn { background: transparent; border: none; i { font-size: 24px; cursor: pointer; color: #fff; } }
      :deep(.fixed_input) { width: 120px; margin-right: 20px; .el-input__wrapper { background: #121212; border: 0; box-shadow: none; } }
      :deep(.ele) {
        width: 45px; height: 24px; border-radius: 12px; background-color: #0399FE;
        margin: 0; padding: 0; margin-right: 10px;
        .el-select__wrapper { width: 100%; height: 100%; line-height: 24px; border: none; box-shadow: none; background-color: transparent; padding: 0; text-align: center; }
        .el-select__suffix { display: none; }
      }
      .Audio_slider-bottom { display: flex; align-items: center; width: 210px; i { font-size: 20px; }
        :deep(.el-slider__runway) { height: 3px; background: rgba(73,74,76,0.5) !important;
          .el-slider__bar { height: 3px; }
          .el-slider__button-wrapper { height: 34px; width: 36px; .el-slider__button { width: 4px; border: 1px solid #409EFF; height: 12px; background: #409eff; border-radius: 0; } }
        }
      }
    }
    .caveat_butt { display: flex; align-items: center; justify-content: flex-end; width: 17%;
      .showRecodeType { width: 24px; height: 30px; text-align: center; line-height: 30px; border-radius: 4px; cursor: pointer; }
      .mr-0 { width: 15px; height: 15px; border-radius: 50px; border: 0; margin-right: 5px; vertical-align: middle; background: #31b1ff; }
      .mr-1 { width: 15px; height: 15px; border-radius: 50px; border: 0; margin: 0 5px; vertical-align: middle; background: rgb(60,196,60); }
      .mr-2 { width: 15px; height: 15px; border-radius: 50px; border: 0; margin: 0 5px; vertical-align: middle; background: #ee1011; }
    }
  }
}
</style>

<style lang="scss">
/* 时间轴 SVG 全局样式（非 scoped） */
#gv-timeline {
  .center-pointer line { stroke: #FEEF03; stroke-width: 2; }
  .label text  { font-size: 14px; }
  .bar-name text { font-size: 10px; }
  .domain { display: none; visibility: hidden; }
  .x.axis text { fill: white; }
  .x.axis.minor text { fill: #999; }
}
</style>
