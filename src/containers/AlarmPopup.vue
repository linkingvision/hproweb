<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import AlarmEventTable from '@/components/alarm/AlarmEventTable.vue'
import AlarmOperationDialog from '@/components/alarm/AlarmOperationDialog.vue'
import type { AlarmEventItem } from '@/api/alarmEvent'
import { GetAlarmEventStateCountApi, GetAlarmEventStateListApi } from '@/api/alarmEvent'
import { GetAlarmLevelListApi, GetAlarmOwnerListApi } from '@/api/configuration/alarmConfig'
import { GetUserConfigApi } from '@/api/system'
import { getSearchDeviceRecordByTimeApi, getSearchStorRecordByTimeApi } from '@/api/channel'
import http from '@/api/http'
import { useAlarmStore } from '@/store/alarm'
import { useStore } from '@/store'
import { useUserStore } from '@/store/user'
import type { AlarmLevelOption } from '@/utils/alarmOptions'
import { getAlarmStateOptions } from '@/utils/alarmOptions'
import { formatISOWithOffset } from '@/utils/formatTime'
import 'ol/ol.css'
import { Map as OLMap, View as OLView } from 'ol'
import ImageLayer from 'ol/layer/Image'
import ImageStatic from 'ol/source/ImageStatic'
import TileLayer from 'ol/layer/Tile'
import Overlay from 'ol/Overlay'
import { WMTS, XYZ } from 'ol/source'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import { fromLonLat, get } from 'ol/proj'
import { getWidth, getTopLeft } from 'ol/extent'
// @ts-ignore
import H5smap from '@/assets/js/h5mapjs.js'
// @ts-ignore
import { H5sPlayerWS2 } from '@/assets/js/uplayersdk.esm.js'

interface AlarmOwnerOption {
  uuid: string
  username: string
}

const { t } = useI18n()
const alarmStore = useAlarmStore()
const store = useStore()
const userStore = useUserStore()

const visible = computed({
  get: () => alarmStore.popupVisible,
  set: value => value ? alarmStore.openPopup(alarmStore.activeState) : alarmStore.closePopup()
})

const activeState = ref(1)
const tabColors = computed(() => {
  if (store.darkMode === 'darkblue') {
    return { activeTextColor: '#06E8EA', backgroundColor: '#2C4163', textColor: 'rgba(255, 255, 255, 0.87)' }
  }
  if (store.darkMode === 'c-dark-theme') {
    return { activeTextColor: '#0399FE', backgroundColor: '#383838', textColor: 'rgba(255, 255, 255, 0.87)' }
  }
  return { activeTextColor: '#0399FE', backgroundColor: '#F9F9F9', textColor: 'rgba(0, 0, 0, 0.6)' }
})
const pageIndex = ref(1)
const pageSize = ref(30)
const total = ref(0)
const tableData = ref<AlarmEventItem[]>([])
const loading = ref(false)
const operationVisible = ref(false)
const currentEvent = ref<AlarmEventItem | null>(null)
const selectedEvent = ref<AlarmEventItem | null>(null)
const alarmOwners = ref<AlarmOwnerOption[]>([])
const alarmLevels = ref<AlarmLevelOption[]>([])
const defaultMapId = ref<string | number>('')
const mapReady = ref(false)
const videoLoading = ref(false)
const videoError = ref('')
const selectedDate = ref(new Date())
const showRecodeType = ref(false)
const timelineCells = ref<Array<{ beginTime: number, endTime: number, style: { background: string } }>>([])
const timelineCenter = ref<Date | null>(null)
const currentPlaybackTime = ref<Date | null>(null)
const draggingTimeline = ref(false)
const timelineCanvasRef = ref<HTMLCanvasElement | null>(null)
const videoPlaying = ref(false)

let refreshTimer: ReturnType<typeof setTimeout> | null = null
let videoTimeout: ReturnType<typeof setTimeout> | null = null
let listRequestSeq = 0
let olMap: any = null
let drawMap: any = null
let pbPlayer: any = null
const mapLivePlayers = new Map<string, any>()
const mapLiveOverlays = new Map<string, any>()
const mapLiveElements = new Map<string, HTMLElement>()
const videoId = 'alarm-popup-video'
const timelineWindowMs = 6 * 60 * 1000
const timelineHoursPerRuler = 0.1
const timelineGraduationStep = 10
const timelineTitleDistance = 80
const timelineMinutesPerStep = [1, 2, 5, 10, 15, 20, 30, 60, 120, 180, 240, 360, 720, 1440]

const stateOptions = computed(() => getAlarmStateOptions(t, true))

const countForState = (code: number) => {
  const counts = alarmStore.stateCounts
  if (code === 0) return counts.all ?? ((counts.new || 0) + (counts.inProgress || 0) + (counts.onHold || 0) + (counts.closed || 0))
  const key = stateOptions.value.find(item => item.code === code)?.countKey
  return key ? counts[key] || 0 : 0
}

const imageSource = computed(() => {
  const img = selectedEvent.value?.strImg
  if (!img) return ''
  return img.startsWith('data:image') ? img : `data:image/jpeg;base64,${img}`
})

const formatDisplayTime = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const formatTimelineCenterTime = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const startTimeText = computed(() => {
  if (!selectedEvent.value) return ''
  return formatISOWithOffset(new Date(parseAlarmTime(selectedEvent.value).getTime() - 45 * 1000))
})

const endTimeText = computed(() => {
  if (!selectedEvent.value) return ''
  return formatISOWithOffset(new Date(parseAlarmTime(selectedEvent.value).getTime() + 30 * 1000))
})

const graduationTitle = (datetime: Date) => {
  if (datetime.getHours() === 0 && datetime.getMinutes() === 0 && datetime.getMilliseconds() === 0) {
    const day = String(datetime.getDate()).padStart(2, '0')
    const month = String(datetime.getMonth() + 1).padStart(2, '0')
    return `${day}.${month}.${datetime.getFullYear()}`
  }
  return `${datetime.getHours()}:${String(datetime.getMinutes()).padStart(2, '0')}:${String(datetime.getSeconds()).padStart(2, '0')}`
}

const drawTimelineLine = (ctx: CanvasRenderingContext2D, beginX: number, beginY: number, endX: number, endY: number, color: string, width: number) => {
  if (beginX < 0) return
  ctx.beginPath()
  ctx.moveTo(beginX, beginY)
  ctx.lineTo(endX, endY)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}

const drawTimelineTriangle = (ctx: CanvasRenderingContext2D, width: number) => {
  ctx.fillStyle = '#2C7BF4'
  ctx.beginPath()
  ctx.moveTo(width / 2, 22)
  ctx.lineTo(width / 2 - 7, 12)
  ctx.lineTo(width / 2 + 7, 12)
  ctx.fill()
}

const msToNextStep = (timestamp: number, step: number) => {
  const remainder = timestamp % step
  return remainder ? step - remainder : 0
}

const drawTimelineCells = (ctx: CanvasRenderingContext2D, width: number, startTimestamp: number) => {
  let lastBeginX = 0
  const pxPerMs = width / timelineWindowMs
  timelineCells.value.forEach(cell => {
    const beginX = (cell.beginTime - startTimestamp) * pxPerMs
    const cellWidth = (cell.endTime - cell.beginTime) * pxPerMs
    if (beginX > width || beginX + cellWidth < 0) return
    ctx.fillStyle = cell.style.background
    if (beginX < lastBeginX) {
      ctx.fillRect(lastBeginX, 50, cellWidth - lastBeginX + beginX, 8)
    } else {
      ctx.fillRect(beginX, 50, cellWidth, 8)
    }
    lastBeginX = beginX + cellWidth
  })
}

const drawTimelineGraduations = (ctx: CanvasRenderingContext2D, width: number, startTimestamp: number) => {
  const pxPerMin = width / (timelineHoursPerRuler * 60)
  const pxPerMs = width / timelineWindowMs
  let pxPerStep = timelineGraduationStep
  let minPerStep = pxPerStep / pxPerMin

  for (const step of timelineMinutesPerStep) {
    if (minPerStep <= step) {
      minPerStep = step
      pxPerStep = pxPerMin * minPerStep
      break
    }
  }

  let mediumStep = timelineMinutesPerStep[timelineMinutesPerStep.length - 1] ?? 1440
  for (const step of timelineMinutesPerStep) {
    if (timelineTitleDistance / pxPerMin <= step) {
      mediumStep = step
      break
    }
  }

  const numSteps = width / pxPerStep
  const msOffset = msToNextStep(startTimestamp, minPerStep * 60 * 1000)
  const pxOffset = msOffset * pxPerMs
  const msPerStep = pxPerStep / pxPerMs

  ctx.fillStyle = 'rgba(151,158,167,1)'
  ctx.font = '13px Arial'
  for (let i = 0; i < numSteps; i += 1) {
    const graduationLeft = pxOffset + i * pxPerStep
    const graduationTime = startTimestamp + msOffset + i * msPerStep
    const date = new Date(graduationTime)
    let lineH = 22
    if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) {
      lineH = 27
      ctx.font = '13px Arial'
      ctx.fillStyle = 'rgba(151,158,167,1)'
      ctx.fillText(graduationTitle(date), graduationLeft - 20, 45)
    } else if (graduationTime / (60 * 1000) % mediumStep === 0) {
      lineH = 27
      const title = graduationTitle(date)
      if (title.length > 9) {
        ctx.font = '11px Arial'
        ctx.fillStyle = '#FFF'
        ctx.fillText(title, graduationLeft - 30, 43)
      } else {
        ctx.font = '13px Arial'
        ctx.fillStyle = 'rgba(151,158,167,1)'
        ctx.fillText(title, graduationLeft - 25, 43)
      }
    }
    drawTimelineLine(ctx, graduationLeft, 15, graduationLeft, lineH, 'rgba(151,158,167,1)', 1)
    if (timelineHoursPerRuler === 0.1) {
      for (let j = 1; j < 30; j += 1) {
        if (i === 0) drawTimelineLine(ctx, graduationLeft - (pxPerStep / 30) * j, 15, graduationLeft - (pxPerStep / 30) * j, 22, 'rgba(151,158,167,1)', 1)
        drawTimelineLine(ctx, graduationLeft + (pxPerStep / 30) * j, 15, graduationLeft + (pxPerStep / 30) * j, 22, 'rgba(151,158,167,1)', 1)
      }
    }
  }
}

const drawTimeline = async () => {
  await nextTick()
  const canvas = timelineCanvasRef.value
  const video = document.getElementById(videoId) as HTMLVideoElement | null
  if (!canvas || !video) return
  const width = video.offsetWidth || canvas.parentElement?.offsetWidth || 0
  if (!width) return
  canvas.width = width
  canvas.height = 55
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const center = timelineCenter.value || currentPlaybackTime.value || parseAlarmTime(selectedEvent.value)
  const startTimestamp = center.getTime() - timelineWindowMs / 2

  ctx.clearRect(0, 0, width, 55)
  ctx.font = '16px Arial'
  drawTimelineGraduations(ctx, width, startTimestamp)
  drawTimelineCells(ctx, width, startTimestamp)
  ctx.fillStyle = 'rgb(12, 12, 12)'
  ctx.fillRect(0, 0, width, 13)
  ctx.fillStyle = '#2C7BF4'
  ctx.fillRect(width / 2 - 70, 0, 130, 13)
  drawTimelineLine(ctx, width / 2, 18, width / 2, 55, 'yellow', 2)
  drawTimelineTriangle(ctx, width)
  ctx.fillStyle = '#FFF'
  ctx.font = '12px Arial'
  ctx.fillText(formatTimelineCenterTime(center), width / 2 - 60, 10.5)
}

const loadOptions = async () => {
  try {
    const [ownersRes, levelsRes] = await Promise.all([
      GetAlarmOwnerListApi(),
      GetAlarmLevelListApi()
    ])
    if (ownersRes.status === 200 && ownersRes.data.code === 0) {
      alarmOwners.value = ownersRes.data.result?.list || []
    }
    if (levelsRes.status === 200 && levelsRes.data.code === 0) {
      alarmLevels.value = levelsRes.data.result || []
    }
  } catch (error) {
    console.warn('[AlarmPopup] load options failed', error)
  }
}

const loadDefaultMapId = async () => {
  try {
    const configRes: any = await GetUserConfigApi()
    if (configRes.status === 200 && configRes.data.code === 0) {
      const list: any[] = configRes.data.result?.list ?? configRes.data.result ?? []
      const item = list.find((i: any) => i.key === 'DefaultMap')
      if (item?.value) defaultMapId.value = item.value
    }
    if (!defaultMapId.value) {
      const listRes: any = await http({ url: '/uapi/v1/MapList', method: 'GET' })
      if (listRes.status === 200 && (listRes.data.code === 0 || listRes.data.msg === 'Success')) {
        defaultMapId.value = listRes.data.result?.[0]?.mapId || ''
      }
    }
  } catch (error) {
    console.warn('[AlarmPopup] load default map failed', error)
  }
}

const loadCounts = async () => {
  if (!userStore.username) return
  try {
    const res = await GetAlarmEventStateCountApi(userStore.username)
    if (res.status === 200 && res.data.code === 0) {
      alarmStore.setStateCounts(res.data.result || {})
    }
  } catch (error) {
    console.warn('[AlarmPopup] load counts failed', error)
  }
}

const loadList = async (showLoading = true) => {
  const seq = ++listRequestSeq
  if (showLoading) loading.value = true
  try {
    const res = await GetAlarmEventStateListApi({
      username: userStore.username,
      pageSize: pageSize.value,
      pageIndex: pageIndex.value,
      stateLevel: activeState.value
    })
    if (seq !== listRequestSeq) return
    if (res.status === 200 && res.data.code === 0) {
      const list = res.data.result?.list || []
      tableData.value = list
      total.value = res.data.result?.count || 0
      if (!selectedEvent.value || !list.some((item: AlarmEventItem) => item.uuid === selectedEvent.value?.uuid)) {
        selectedEvent.value = list[0] ? { ...list[0] } : null
      }
    } else if (showLoading) {
      ElMessage.error(t('CommTableEdit.comm_edit_failed'))
    }
  } catch (error) {
    if (showLoading) ElMessage.error(t('CommTableEdit.comm_edit_failed'))
  } finally {
    if (seq === listRequestSeq && showLoading) loading.value = false
  }
}

const refreshAll = async (showLoading = true) => {
  await Promise.all([loadCounts(), loadList(showLoading)])
}

const scheduleBackgroundRefresh = () => {
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => {
    refreshTimer = null
    if (alarmStore.popupVisible) loadList(false)
  }, 800)
}

const handleStateSelect = (key: string) => {
  activeState.value = Number(key)
  pageIndex.value = 1
  loadList(true)
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  pageIndex.value = 1
  loadList(true)
}

const handleCurrentChange = (val: number) => {
  pageIndex.value = val
  loadList(true)
}

const openOperation = (row: AlarmEventItem) => {
  currentEvent.value = { ...row }
  operationVisible.value = true
}

const handleRowClick = (row: AlarmEventItem) => {
  selectedEvent.value = { ...row }
}

const handleSaved = () => {
  refreshAll(true)
}

const closeMapLiveOverlay = (key: string) => {
  const player = mapLivePlayers.get(key)
  if (player) {
    try { player.disconnect() } catch {}
    mapLivePlayers.delete(key)
  }

  const overlay = mapLiveOverlays.get(key)
  if (overlay) {
    try { olMap?.removeOverlay(overlay) } catch {}
    mapLiveOverlays.delete(key)
  }

  const element = mapLiveElements.get(key)
  element?.remove()
  mapLiveElements.delete(key)
}

const cleanupMapLiveOverlays = () => {
  const keys = new Set([...mapLivePlayers.keys(), ...mapLiveOverlays.keys(), ...mapLiveElements.keys()])
  keys.forEach(key => closeMapLiveOverlay(key))
}

const cleanupMap = () => {
  cleanupMapLiveOverlays()
  if (drawMap) {
    try { drawMap.destroy?.() } catch {}
    drawMap = null
  }
  if (olMap) {
    try { olMap.setTarget(undefined) } catch {}
    olMap = null
  }
  const container = document.getElementById('alarm-popup-map')
  container?.querySelectorAll('.ol-viewport').forEach(el => el.remove())
}

const coordFix = (map: any, item: any) => {
  const proj = map.getView()?.getProjection()
  if (proj?.getCode() === 'EPSG:3857' && item.longitude !== undefined && item.latitude !== undefined) {
    const coord = fromLonLat([item.longitude, item.latitude])
    item.longitude = coord[0]
    item.latitude = coord[1]
  }
}

const createLiveVideoElement = (key: string, videoElementId: string, title: string) => {
  const element = document.createElement('div')
  element.className = 'alarm-map-live-overlay'
  element.dataset.overlayKey = key

  const closeButton = document.createElement('button')
  closeButton.type = 'button'
  closeButton.className = 'alarm-map-live-close'
  closeButton.innerHTML = '×'
  closeButton.addEventListener('click', () => closeMapLiveOverlay(key))

  const titleElement = document.createElement('div')
  titleElement.className = 'alarm-map-live-title'
  titleElement.textContent = title

  const video = document.createElement('video')
  video.id = videoElementId
  video.className = 'alarm-map-live-video'
  video.autoplay = true
  video.muted = true
  video.controls = false
  video.setAttribute('playsinline', 'true')
  video.setAttribute('webkit-playsinline', 'true')

  element.appendChild(closeButton)
  element.appendChild(titleElement)
  element.appendChild(video)
  return element
}

const openMapLiveOverlay = async (data: any) => {
  if (!olMap || !data?.cameraToken) return
  const key = String(data.cameraToken)
  const existingOverlay = mapLiveOverlays.get(key)
  if (existingOverlay) {
    existingOverlay.setPosition(data.center)
    return
  }

  try {
    const res: any = await http({ url: `/uapi/v1/Device/Channel?channelUUID=${encodeURIComponent(key)}`, method: 'GET' })
    if (!(res.status === 200 && (res.data.code === 0 || res.data.msg === 'Success'))) return
    const channel = res.data.result || {}
    const token = channel.token || data.cameraToken
    if (!token) return

    const videoElementId = `alarm-map-live-video-${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`
    const element = createLiveVideoElement(key, videoElementId, channel.name || data.cameraName || key)
    const overlay = new Overlay({ element, positioning: 'bottom-center', stopEvent: true, offset: [0, -18] })
    olMap.addOverlay(overlay)
    overlay.setPosition(data.center)
    mapLiveOverlays.set(key, overlay)
    mapLiveElements.set(key, element)

    const baseUrl = new URL(userStore.IPPORT || window.location.origin)
    const conf: any = {
      videoid: videoElementId,
      protocol: baseUrl.protocol,
      host: userStore.WSROOT,
      rootpath: '/',
      token,
      streamprofile: 'main',
      hlsver: 'v1',
      session: userStore.session,
      consolelog: 'true',
      buffersize: store.RBufferTime || 300,
      h264cpumode: String(store.H264CpuDecode),
      name: channel.name || data.cameraName
    }
    const player = new H5sPlayerWS2(conf)
    player.connect()
    mapLivePlayers.set(key, player)
  } catch (error) {
    console.warn('[AlarmPopup] open map live overlay failed', error)
    closeMapLiveOverlay(key)
  }
}

const handleMapElementEvent = (data: any) => {
  if (!visible.value || !data?.cameraToken) return
  if (data.type !== 'camera' || data.callbackType !== 'Update') return
  openMapLiveOverlay(data)
}

const renderChannels = (map: any, data: any[]) => {
  if (!drawMap) return
  data.forEach(item => {
    coordFix(map, item)
    drawMap.addLayer({
      map,
      cameraName: item.channelName,
      cameraToken: item.channelUUID,
      radius: item.Radius,
      angle: item.angle,
      rotationAngle: item.rotationAngle,
      cameraType: item.fillColor,
      coordinate: [item.longitude, item.latitude],
      id: item.id,
      type: 'camera',
      RejectOperation: false,
      callback: handleMapElementEvent
    })
  })
}

const renderViews = (map: any, data: any[]) => {
  if (!drawMap) return
  data.forEach(item => {
    coordFix(map, item)
    drawMap.addLayer({ map, cameraName: item.viewName, cameraToken: item.viewUUID, cameraType: item.fillColor, coordinate: [item.longitude, item.latitude], drawIcon: true, id: item.id, type: 'view', RejectOperation: false, callback: handleMapElementEvent })
  })
}

const renderLinks = (map: any, data: any[]) => {
  if (!drawMap) return
  data.forEach(item => {
    coordFix(map, item)
    drawMap.addLayer({ map, cameraName: item.resName, cameraToken: item.id, cameraType: item.fillColor, coordinate: [item.longitude, item.latitude], drawIcon: true, id: item.mapLinkId, type: 'link', RejectOperation: false, callback: handleMapElementEvent })
  })
}

const renderMap = async () => {
  cleanupMap()
  mapReady.value = false
  if (!defaultMapId.value || !visible.value) return
  await nextTick()
  const container = document.getElementById('alarm-popup-map')
  if (!container) return
  try {
    const res: any = await http({ url: `/uapi/v1/Map/${defaultMapId.value}`, method: 'GET' })
    if (!(res.status === 200 && (res.data.code === 0 || res.data.msg === 'Success'))) return
    const data = res.data.result
    const allowed = ['USC_MAP_STATIC', 'USC_MAP_CAD', 'USC_MAP_GOOGLE', 'USC_MAP_GAO_DE', 'USC_MAP_TIAN', 'USC_MAP_TILE']
    if (!allowed.includes(data.type)) return

    olMap = new OLMap({ target: container })
    if (data.type === 'USC_MAP_STATIC') {
      olMap.setView(new OLView({ center: fromLonLat([0, 0]), zoom: data.zoom || 7, minZoom: data.minZoom, maxZoom: data.maxZoom || 8 }))
      const img = new Image()
      img.src = `${userStore.IPPORT}/${data.mapUrl}?session=${userStore.session}`
      img.onload = () => {
        const ext = [-img.width * 1000, -img.height * 1000, img.width * 1000, img.height * 1000]
        olMap?.addLayer(new ImageLayer({ source: new ImageStatic({ url: img.src, imageExtent: ext }) }))
      }
    } else if (data.type === 'USC_MAP_TIAN') {
      const proj = get('EPSG:4326')!
      const ext = proj.getExtent()
      const size = getWidth(ext) / 256
      const resolutions: number[] = Array.from({ length: 18 }, (_, z) => size / Math.pow(2, z))
      const matrixIds: string[] = Array.from({ length: 18 }, (_, z) => String(z))
      olMap.setView(new OLView({ projection: data.projection || 'EPSG:4326', center: data.center, zoom: data.zoom || 7, minZoom: data.minZoom, maxZoom: data.maxZoom || 8 }))
      olMap.addLayer(new TileLayer({ source: new WMTS({ url: data.mapUrl, layer: 'vec', matrixSet: 'c', format: 'tiles', style: 'default', crossOrigin: 'anonymous', tileGrid: new WMTSTileGrid({ origin: getTopLeft(ext), resolutions, matrixIds }) }) }))
      if (data.mapUrl2) olMap.addLayer(new TileLayer({ source: new WMTS({ url: data.mapUrl2, layer: 'cva', matrixSet: 'c', format: 'tiles', style: 'default', crossOrigin: 'anonymous', tileGrid: new WMTSTileGrid({ origin: getTopLeft(ext), resolutions, matrixIds }) }) }))
    } else {
      const projection = data.projection || 'EPSG:4326'
      const center = projection === 'EPSG:3857' ? fromLonLat(data.center) : (data.center || fromLonLat([0, 0]))
      olMap.setView(new OLView({ center, zoom: data.zoom || 7, minZoom: data.minZoom, maxZoom: data.maxZoom || 8, projection }))
      olMap.addLayer(new TileLayer({ source: new XYZ({ url: data.mapUrl, projection }) }))
    }

    setTimeout(() => {
      if (!olMap) return
      drawMap = new H5smap(olMap)
      if (data.mapElementChannel?.length) renderChannels(olMap, data.mapElementChannel)
      if (data.mapView?.length) renderViews(olMap, data.mapView)
      if (data.mapElementLink?.length) renderLinks(olMap, data.mapElementLink)
      olMap.updateSize()
      mapReady.value = true
    }, 300)
  } catch (error) {
    console.warn('[AlarmPopup] render map failed', error)
  }
}

const cleanupVideo = () => {
  videoPlaying.value = false
  if (videoTimeout) {
    clearTimeout(videoTimeout)
    videoTimeout = null
  }
  if (pbPlayer) {
    try { pbPlayer.disconnect() } catch {}
    pbPlayer = null
  }
  // 清空静态 video 的 src（对照 uscweb poster='' + load()）
  const vid = document.getElementById(videoId) as HTMLVideoElement | null
  if (vid) { vid.poster = ''; vid.load() }
}

const getEventToken = (event: AlarmEventItem | null) => {
  const value = event?.channelToken || event?.token || event?.channelUUID
  if (Array.isArray(value)) return value[0] || ''
  return value ? String(value) : ''
}

const parseAlarmTime = (event: AlarmEventItem | null) => {
  const raw = event?.strTime || event?.time || event?.eventTime
  if (!raw) return new Date()
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

const loadRecordTimeline = async (date: Date, token = getEventToken(selectedEvent.value)) => {
  timelineCells.value = []
  if (!token) {
    drawTimeline()
    return
  }
  const startDate = new Date(date.getTime() - 12 * 60 * 60 * 1000)
  const endDate = new Date(date.getTime() + 12 * 60 * 60 * 1000)
  try {
    const api = store.DefaultStorage === 'CentralStorage' ? getSearchStorRecordByTimeApi : getSearchDeviceRecordByTimeApi
    const res: any = await api(token, formatISOWithOffset(startDate), formatISOWithOffset(endDate))
    const records = Array.isArray(res?.data?.record) ? res.data.record : []
    timelineCells.value = records.map((item: any) => {
      const beginTime = new Date(item.strStartTime).getTime()
      const endTime = new Date(item.strEndTime).getTime()
      let background = 'rgba(60,196,60,0.498039)'
      const type = String(item.type || '')
      if (type.includes('H5_STOR_REC_ALERT') || type.includes('H5_STOR_REC_A_MOTION') || type.includes('H5_STOR_REC_A_OBJECT')) {
        background = 'rgba(238,17,17,0.498039)'
      } else if (type.includes('H5_STOR_REC_N_SCHED')) {
        background = '#31b1ff'
      }
      return { beginTime, endTime, style: { background } }
    })
    drawTimeline()
  } catch (error) {
    console.warn('[AlarmPopup] load record timeline failed', error)
  }
}

const handlePlaybackMessage = (msg: string) => {
  if (draggingTimeline.value) return
  try {
    const data = JSON.parse(msg)
    if (data.type === 'H5S_EVENT_PB_TIME' && data.pbTime?.strTime) {
      const time = new Date(data.pbTime.strTime)
      currentPlaybackTime.value = time
      timelineCenter.value = time
      drawTimeline()
      if (data.pbTime.strDevToken) loadRecordTimeline(time, data.pbTime.strDevToken)
    }
  } catch {}
}

const handleDateChange = (value: Date | string | number | null) => {
  if (!value) return
  const date = value instanceof Date ? value : new Date(value)
  selectedDate.value = date
  timelineCenter.value = date
  currentPlaybackTime.value = date
  drawTimeline()
  loadRecordTimeline(date)
}

const moveTimelineTo = (event: MouseEvent) => {
  const bar = event.currentTarget as HTMLElement
  const rect = bar.getBoundingClientRect()
  const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  const center = timelineCenter.value || currentPlaybackTime.value || parseAlarmTime(selectedEvent.value)
  const start = center.getTime() - timelineWindowMs / 2
  const time = new Date(start + ratio * timelineWindowMs)
  timelineCenter.value = time
  currentPlaybackTime.value = time
  drawTimeline()
  loadRecordTimeline(time)
  try { pbPlayer?.moveto?.(formatISOWithOffset(time)) } catch {}
}

const buildVideo = async () => {
  cleanupVideo()
  videoError.value = ''
  const event = selectedEvent.value
  const token = getEventToken(event)
  if (!token || !visible.value) {
    videoError.value = t('CommTable.comm_no_data_available')
    return
  }

  await new Promise<void>(resolve => setTimeout(resolve, 200))
  await nextTick()

  const vid = document.getElementById(videoId) as HTMLVideoElement | null
  const canvas = document.getElementById('alarm-popup-pbcanvas') as HTMLCanvasElement | null
  if (!vid || !canvas) return

  const divWidth = vid.offsetWidth
  const divHeight = vid.offsetHeight
  canvas.width = divWidth
  canvas.height = divHeight

  const alarmTime = parseAlarmTime(event)
  selectedDate.value = alarmTime
  timelineCenter.value = new Date(alarmTime)
  currentPlaybackTime.value = new Date(alarmTime)
  drawTimeline()
  loadRecordTimeline(alarmTime, token)

  const beginTime = new Date(alarmTime.getTime() - 45 * 1000)
  const endTime = new Date(alarmTime.getTime() + 30 * 1000)
  const beginStr = formatISOWithOffset(beginTime)
  const endStr = formatISOWithOffset(endTime)
  const baseUrl = new URL(userStore.IPPORT || window.location.origin)

  const conf: any = {
    videoid: videoId,
    protocol: baseUrl.protocol,
    host: userStore.WSROOT,
    rootpath: '/',
    token,
    pbconf: {
      begintime: beginStr,
      endtime: endStr,
      moveto: beginStr,
      showposter: 'false',
      autoplay: 'true',
      serverpb: 'true',
      callback: handlePlaybackMessage,
      userdata: ''
    },
    hlsver: 'v1',
    consolelog: 'true',
    buffersize: store.RBufferTime || 300,
    h264cpumode: String(store.H264CpuDecode),
    session: userStore.session
  }

  try {
    pbPlayer = new H5sPlayerWS2(conf)
    pbPlayer.connect()
    videoPlaying.value = true
    videoTimeout = setTimeout(() => {
      videoTimeout = null
    }, 15000)
  } catch (error) {
    console.warn('[AlarmPopup] build video failed', error)
    videoError.value = t('CommTable.comm_no_data_available')
  }
}

watch(() => alarmStore.activeState, value => {
  activeState.value = value
  pageIndex.value = 1
  if (alarmStore.popupVisible) refreshAll(true)
})

watch(() => alarmStore.popupVisible, value => {
  if (value) {
    activeState.value = alarmStore.activeState
    pageIndex.value = 1
    refreshAll(true)
    renderMap()
  } else {
    cleanupVideo()
    cleanupMap()
  }
})

watch(() => alarmStore.refreshKey, () => {
  scheduleBackgroundRefresh()
})

watch(selectedEvent, () => {
  if (visible.value) buildVideo()
})

onMounted(async () => {
  await Promise.all([loadOptions(), loadDefaultMapId()])
  await loadCounts()
  if (visible.value) {
    activeState.value = alarmStore.activeState
    pageIndex.value = 1
    await refreshAll(true)
    renderMap()
  }
})

onBeforeUnmount(() => {
  if (refreshTimer) clearTimeout(refreshTimer)
  cleanupVideo()
  cleanupMap()
})
</script>

<template>
  <el-dialog v-model="visible" class="alarm-popup-dialog" :title="''" width="62%" top="7vh" :append-to-body="false" destroy-on-close>
    <div class="alarm-popup popup-container">
      <div class="popup-top">
        <div class="popup-left">
          <div class="map-title">{{ t('Configuration.conf_map') }}</div>
          <div id="alarm-popup-map" class="map-container">
          </div>
        </div>
        <div class="popup-right">
          <div class="video-title">
            <span>{{ t('CommTime.comm_time_start') + '：' + startTimeText }}</span>
            <span>{{ t('CommTime.comm_time_end') + '：' + endTimeText }}</span>
          </div>
          <div class="video-box">
            <div class="video-container">
              <video class="popup-video" id="alarm-popup-video" muted></video>
              <canvas class="h5vcanvas" id="alarm-popup-pbcanvas"></canvas>
              <el-image v-if="!getEventToken(selectedEvent) && imageSource" :src="imageSource" fit="contain" class="fallback-image" />
            </div>
            <div class="progress-bar" @mousedown="draggingTimeline = true" @mouseup="draggingTimeline = false; moveTimelineTo($event)" @mouseleave="draggingTimeline = false">
              <canvas ref="timelineCanvasRef" id="alarm-popup-progress-bar"></canvas>
            </div>
          </div>
          <div class="time-out-box">
            <div class="date-picker-box">
              <el-date-picker v-model="selectedDate" size="small" type="date" style="width:150px;" :placeholder="t('Common.comm_select_date_time')" @change="handleDateChange" />
            </div>
            <div class="caveat-seek">
              <i class="iconfont icon-zuobeisu"></i>
              <i class="iconfont icon-zanting" style="padding:0 12px;"></i>
              <i class="iconfont icon-youbeisu"></i>
            </div>
            <div class="caveat-butt">
              <div class="show-recode-type">
                <i class="iconfont" :class="showRecodeType ? 'icon-youjiantou' : 'icon-zuojiantou'"
                  @click="showRecodeType = !showRecodeType"></i>
              </div>
              <div class="recode-type" v-if="showRecodeType">
                <button class="mr-0" type="button"></button>{{ t('Playback.pb_schedule') }}
                <button class="mr-1" type="button"></button>{{ t('Playback.pb_manual') }}
                <button class="mr-2" type="button"></button>{{ t('Playback.pb_alarm') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="popup-bottom">
      <el-menu
        :default-active="String(activeState)"
        class="el-menu-demo"
        mode="horizontal"
        :text-color="tabColors.textColor"
        :active-text-color="tabColors.activeTextColor"
        :background-color="tabColors.backgroundColor"
        @select="handleStateSelect">
        <el-menu-item v-for="item in stateOptions" :key="item.code" :index="String(item.code)">
          {{ item.label }} ({{ countForState(item.code) }})
        </el-menu-item>
      </el-menu>
      <div class="popup-table" v-loading="loading">
        <AlarmEventTable
          :data="tableData"
          :alarm-levels="alarmLevels"
          :show-index="false"
          :show-status="false"
          :show-uuid="false"
          :show-channel-token="false"
          :compact="true"
          :current-uuid="selectedEvent?.uuid || ''"
          height="280"
          @row-click="handleRowClick"
          @operate="openOperation" />
      </div>
      <div class="pagination-box">
        <el-pagination
          v-model:current-page="pageIndex"
          v-model:page-size="pageSize"
          :page-sizes="[10, 30, 50, 100]"
          :background="true"
          layout="total, prev, pager, next"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
      </div>
    </div>

    <AlarmOperationDialog
      v-model="operationVisible"
      :event="currentEvent"
      :alarm-owners="alarmOwners"
      :alarm-levels="alarmLevels"
      @saved="handleSaved" />
  </el-dialog>
</template>

<style scoped lang="scss">
.popup-container {
  width: 100%;
  overflow: hidden;
  background: #2d2d2d;

  .popup-top {
    width: 100%;
    height: 400px;
    margin-top: 10px;
    display: flex;
    justify-content: space-between;

    .popup-left,
    .popup-right {
      width: 49.5%;
      height: 100%;
      position: relative;
      min-width: 0;
    }

    .map-title,
    .video-title {
      width: 100%;
      height: 20px;
      line-height: 20px;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.87);
    }

    .video-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .popup-left {
      overflow: hidden;
      .map-container {
        width: 100%;
        height: calc(100% - 20px);
        position: relative;
        overflow: hidden;
      }
    }

    .popup-right {
      display: flex;
      flex-direction: column;

      .video-box {
        width: 100%;
        height: 340px;
        .video-container {
          position: relative;
          width: 100%;
          height: 285px;
          overflow: hidden;
          background: #000;

          .popup-video {
            width: 100%;
            height: 100%;
            object-fit: fill;
          }

          .h5vcanvas {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            background-color: transparent;
          }

          .fallback-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }
        }
        .progress-bar {
          height: 55px;
          background-color: #232323;
          cursor: pointer;
          overflow: hidden;
          user-select: none;

          canvas {
            width: 100%;
            height: 55px;
            display: block;
          }
        }
      }

      .time-out-box {
        width: 100%;
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        overflow: hidden;

        .date-picker-box {
          min-width: 200px;
          padding-left: 10px;
        }

        .caveat-seek {
          min-width: 120px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          i {
            cursor: pointer;
            font-size: 20px;
            color: #FFFFFFDE;
            &:hover { color: #0399FE; }
          }
        }

        .caveat-butt {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          min-width: 200px;

          .show-recode-type {
            width: 24px;
            height: 32px;
            text-align: center;
            line-height: 32px;
            border-radius: 4px;
            margin-right: 10px;
            cursor: pointer;
            i { font-size: 14px; color: #fff; }
          }

          .recode-type {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #fff;

            .mr-0 {
              width: 15px; height: 15px; border-radius: 50px; border: 0;
              margin-right: 5px; vertical-align: middle;
              background-color: #31b1ff;
            }
            .mr-1 {
              width: 15px; height: 15px; border-radius: 50px; border: 0;
              margin: 0 5px; vertical-align: middle;
              background-color: rgb(60, 196, 60);
            }
            .mr-2 {
              width: 15px; height: 15px; border-radius: 50px; border: 0;
              margin: 0 5px; vertical-align: middle;
              background-color: #ee1011;
            }
          }
        }
      }
    }
  }

  .popup-bottom {
    width: 100%;
    position: relative;

    :deep(.el-menu-demo) {
      display: flex;
      height: 40px;
      padding-left: 20px;
      border-bottom: 0 !important;
      background-color: #404040;
      color: #FFFFFFDE;
    }

    :deep(.el-menu-demo .el-menu-item) {
      height: 40px;
      line-height: 40px;
      margin-right: 20px;
      padding: 0 12px;
      border-bottom: 0 !important;
      color: #FFFFFFDE;
    }

    :deep(.el-menu-demo .el-menu-item:hover) {
      background: rgba(141, 189, 255, 0.16);
      color: #fff;
    }

    :deep(.el-menu-demo .el-menu-item.is-active) {
      color: #fff;
      background: rgba(141, 189, 255, 0.16);
    }

    .state-count {
      margin-left: 8px;
    }

    .popup-table {
      background: #2d2d2d;
    }

    .pagination-box {
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      color: #FFFFFFDE;
    }

    :deep(.el-pagination),
    :deep(.el-pagination button),
    :deep(.el-pagination .el-pager li) {
      color: #FFFFFFDE;
    }
  }

  .fallback-image {
    width: 100%;
    height: 100%;
    background: #000;
  }
}

:global(.alarm-popup-dialog.el-dialog) {
  margin-bottom: 0;
  background: #2d2d2d;
}

:global(.alarm-popup-dialog .el-dialog__header) {
  height: 30px;
  padding: 0;
  color: #FFFFFFDE;
}

:global(.alarm-popup-dialog .el-dialog__title) {
  color: #FFFFFFDE;
}

:global(.alarm-popup-dialog .el-dialog__headerbtn) {
  top: 10px;
  right: 10px;
}

:global(.alarm-popup-dialog .el-dialog__body) {
  padding: 0 20px 16px;
  background: #2d2d2d;
}

:global(.alarm-popup-dialog .el-table),
:global(.alarm-popup-dialog .el-table__inner-wrapper),
:global(.alarm-popup-dialog .el-table__header-wrapper),
:global(.alarm-popup-dialog .el-table__body-wrapper),
:global(.alarm-popup-dialog .el-table__empty-block),
:global(.alarm-popup-dialog .el-table tr),
:global(.alarm-popup-dialog .el-table th.el-table__cell),
:global(.alarm-popup-dialog .el-table td.el-table__cell) {
  background-color: #2d2d2d;
}

:global(.alarm-popup-dialog .el-table .el-table__row .el-table__cell) {
  padding: 4px 0;
}

:global(.alarm-popup-dialog .el-date-editor),
:global(.alarm-popup-dialog .el-date-editor .el-input__wrapper),
:global(.alarm-popup-dialog .el-select),
:global(.alarm-popup-dialog .el-select .el-input__wrapper) {
  background-color: #383838 !important;
  color: #FFFFFFDE;
  box-shadow: none !important;
}

:global(.alarm-popup-dialog .el-date-editor .el-input__inner),
:global(.alarm-popup-dialog .el-select .el-input__inner) {
  color: #FFFFFFDE;
}

:global(.alarm-map-live-overlay) {
  position: relative;
  width: 320px;
  border-radius: 4px;
  overflow: hidden;
  background: #1f1f1f;
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.45);
}

:global(.alarm-map-live-title) {
  height: 28px;
  line-height: 28px;
  padding: 0 34px 0 10px;
  color: #fff;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: #383838;
}

:global(.alarm-map-live-close) {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  width: 28px;
  height: 28px;
  border: 0;
  padding: 0;
  color: #fff;
  background: transparent;
  font-size: 20px;
  line-height: 28px;
  cursor: pointer;
}

:global(.alarm-map-live-close:hover) {
  color: #0399FE;
}

:global(.alarm-map-live-video) {
  display: block;
  width: 320px;
  height: 180px;
  background: #000;
  object-fit: fill;
}
</style>