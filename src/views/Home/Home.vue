<template>
  <div id="home" :class="store.darkMode">
    <!-- 顶部：问候语 + 时间 -->
    <div class="home-top">
      <div class="greeting">{{ greetingText }}</div>
      <div class="datetime">{{ dateTimeText }}</div>
    </div>

    <!-- 导航卡片 -->
    <div class="home-tabs">
      <div
        v-for="item in navCards"
        :key="item.name"
        class="home-tab-item"
        @click="router.push(item.router)"
      >
        <div class="home-tab-name">
          <span class="icon" :class="item.icon"></span>&nbsp;
          <span class="name">{{ item.name }}</span>
        </div>
        <div class="home-tab-children">{{ item.children.join(', ') }}</div>
        <div class="jump">
          <span class="iconfont icon-youshang"></span>
        </div>
      </div>
    </div>

    <!-- 事件区 -->
    <div class="home-event">
      <header>{{ siteName }}</header>
      <div class="home-event-content">
        <!-- 左侧：告警图表 -->
        <div class="content-left">
          <div class="alarm-header">
            <div>
              <svg class="icon" aria-hidden="true"><use xlink:href="#icon-biaoqian"></use></svg>
              {{ t('Playback.pb_alarm') }}
            </div>
            <div>
              <el-select v-model="alarmTime" :placeholder="t('Common.comm_please_select')" @change="onAlarmTimeChange">
                <el-option v-for="opt in alarmTimeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
          </div>
          <div class="alarm-main">
            <div class="alarm-text">
              {{ alarmTimeOptions.find(o => o.value === alarmTime)?.label }}
              {{ t('Common.comm_alarms_count').replace('number', String(alarmEventCount)) }}
            </div>
            <div class="chart-alarm-container" ref="chartAlarmContainerRef"></div>
            <div class="event-status">
              <span class="iconfont icon-yuandian" style="color:#D83D3D"></span><span>{{ t('Setting.set_high') }}</span>&nbsp;&nbsp;
              <span class="iconfont icon-yuandian" style="color:#F09C37"></span><span>{{ t('Setting.set_middle') }}</span>&nbsp;&nbsp;
              <span class="iconfont icon-yuandian" style="color:#00B75B"></span><span>{{ t('Setting.set_low') }}</span>&nbsp;&nbsp;
              <span class="iconfont icon-yuandian" style="color:#7DDFDF"></span><span>{{ t('Setting.set_critical') }}</span>
            </div>
          </div>
          <div class="alarm-footer">
            <div @click="router.push('/System/Setting/OperationLog')">{{ t('CommTableEdit.comm_detail_alarm') }}</div>
          </div>
        </div>

        <!-- 右侧：资源 + 设备 + 系统 -->
        <div class="content-right">
          <div class="memory-cpu">
            <div class="memory-cpu-header">
              <div>
                <svg class="icon" aria-hidden="true"><use xlink:href="#icon-biaoqian"></use></svg>
                <span class="system-title">{{ t('CommDev.comm_dev_systemload') }}</span>
                <span class="runned-time">{{ t('SystemInfo.system_runtime') }}:</span>
                <span class="runtime-text">
                  <template v-if="strRunTime && strRunTime.match(/\d+/g)">
                    <span class="runtime-nums">{{ strRunTime.match(/\d+/g)![0] }}</span> {{ t('SystemInfo.system_hour') }}
                    <span class="runtime-nums">{{ strRunTime.match(/\d+/g)![1] }}</span> {{ t('SystemInfo.system_minute') }}
                  </template>
                  <template v-else>--{{ t('SystemInfo.system_hour') }}--{{ t('SystemInfo.system_minute') }}</template>
                </span>
              </div>
              <div>
                <el-select v-model="workServer" :placeholder="t('Common.comm_please_select')" @change="onWorkServerChange">
                  <el-option v-for="srv in workServerList" :key="srv.nodeId" :label="srv.nodeName" :value="srv.nodeId" />
                </el-select>
              </div>
            </div>
            <div class="memory-cpu-main">
              <div class="network-content" ref="chartNetworkContainerRef"></div>
              <div class="cpu-content" ref="chartCPUContainerRef"></div>
              <div class="memory-content" ref="chartMemoryContainerRef"></div>
            </div>
          </div>
          <div class="run-system">
            <div class="run">
              <div class="run-header">
                <div><svg class="icon" aria-hidden="true"><use xlink:href="#icon-biaoqian"></use></svg>{{ t('CommDev.comm_dev_device') }}</div>
              </div>
              <div class="run-main">
                <div class="stat-card">
                  <div class="stat-numbers">
                    <div class="stat-item">
                      <span class="stat-value" :class="deviceTotalClasses">{{ deviceInfo.nDeviceTotal }}</span>
                      <span class="stat-label">{{ t('CommDev.comm_dev_sum') }}</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                      <span class="stat-value" :class="deviceOnlineClasses">{{ deviceInfo.nDeviceOnline }}</span>
                      <span class="stat-label">{{ t('CommDev.comm_online') }}</span>
                    </div>
                  </div>
                  <div class="stat-title"><span class="dot"></span>{{ t('CommDev.comm_dev_device') }}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-numbers">
                    <div class="stat-item">
                      <span class="stat-value" :class="cameraTotalClasses">{{ cameraInfo.nCameraTotal }}</span>
                      <span class="stat-label">{{ t('CommDev.comm_dev_sum') }}</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                      <span class="stat-value" :class="cameraOnlineClasses">{{ cameraInfo.nCameraOnline }}</span>
                      <span class="stat-label">{{ t('CommDev.comm_online') }}</span>
                    </div>
                  </div>
                  <div class="stat-title"><span class="dot"></span>{{ t('Liveview.live_camera') }}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-numbers">
                    <div class="stat-item">
                      <span class="stat-value" :class="accessControlTotalClasses">{{ accessControlInfo.nAccessControlTotal }}</span>
                      <span class="stat-label">{{ t('CommDev.comm_dev_sum') }}</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                      <span class="stat-value" :class="accessControlOnlineClasses">{{ accessControlInfo.nAccessControlOnline }}</span>
                      <span class="stat-label">{{ t('CommDev.comm_online') }}</span>
                    </div>
                  </div>
                  <div class="stat-title"><span class="dot"></span>{{ t('CommDev.comm_dev_accesscontroler') }}</div>
                </div>
              </div>
            </div>
            <div class="system">
              <div class="system-header">
                <div><svg class="icon" aria-hidden="true"><use xlink:href="#icon-biaoqian"></use></svg>{{ t('System.sys_system') }}</div>
              </div>
              <div class="system-main">
                <div><label>{{ t('SystemInfo.system_version') }}：</label>{{ systemInfo.strVersion }}</div>
                <div>
                  <label class="strHostId">{{ t('SystemInfo.system_hostid') }}：</label>
                  <span id="hostIdText">{{ systemInfo.strHostId }}</span>
                  <i @click="copyHostId" style="margin-left:10px;cursor:pointer" class="iconfont icon-fuzhi"></i>
                </div>
                <div><label>{{ t('SystemInfo.system_license') }}：</label>{{ systemInfo.strType }}</div>
                <div><label>{{ t('SystemInfo.system_channel') }}：</label>{{ systemInfo.nVideoChannel }}</div>
                <div><label>{{ t('SystemInfo.system_endtime') }}：</label>{{ systemInfo.strEndTime }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { useStore } from '@/store/index'
import { useUserStore } from '@/store/user'
import {
  GetAlarmEventHomeList, GetDeviceSummaryApi, GetDeviceInfoApi,
  GetWorkServerListApi, GetRunInfoApi, GetRunTimeApi, GetDiscoverServiceSiteApi,
} from '@/api/home'
import { GetSystemInfo, GetLicenseInfoApi } from '@/api/system'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const router = useRouter()
const store = useStore()
const userStore = useUserStore()

const greetingText = ref('')
const dateTimeText = ref('')
const siteName = ref('System')

const formatDateTime = () => {
  const now = new Date()
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).replace(', ', ',')
  return `${time} ${date}`
}

const getGreeting = () => {
  const h = new Date().getHours()
  let key: string
  if (h < 6) key = 'Common.comm_good_midnight'
  else if (h < 9) key = 'Common.comm_good_early_morning'
  else if (h < 12) key = 'Common.comm_good_morning'
  else if (h < 14) key = 'Common.comm_good_noon'
  else if (h < 18) key = 'Common.comm_good_afternoon'
  else key = 'Common.comm_good_evening'
  return `${t(key)}, ${userStore.username || 'ADMIN'}.`
}

const updateDateTime = () => {
  dateTimeText.value = formatDateTime()
  greetingText.value = getGreeting()
}

// ── 导航卡片（静态）──────────────────────────────────────────────
const navCards = [
  { name: t('Monitoring.mon_monitoring'), icon: 'iconfont icon-chakan', children: [t('Monitoring.mon_view'), t('Monitoring.mon_grid_view')], router: '/Monitoring' },
  { name: t('Router.router_configuration'), icon: 'iconfont icon-peizhi', children: [t('Router.router_basic'), t('Device.device_dev')], router: '/Configuration' },
  { name: t('Router.router_analytics'), icon: 'iconfont icon-fenxipeizhi', children: [t('System.sys_setting')], router: '/Analytics' },
  { name: t('System.sys_system'), icon: 'iconfont icon-xitong', children: [t('System.sys_setting')], router: '/System' },
]

// ── 告警统计 ─────────────────────────────────────────────────────
const alarmTime = ref<number>(24)
const alarmTimeOptions = computed(() => [
  { value: 1,       label: t('Common.comm_last_time1')    },
  { value: 12,      label: t('Common.comm_last_time12')   },
  { value: 24,      label: t('Common.comm_last_time24')   },
  { value: 15 * 24, label: t('Common.comm_last_time1524') },
  { value: 30 * 24, label: t('Common.comm_last_time3024') },
])
const alarmEvent = ref({ critical: 0, high: 0, medium: 0, low: 0 })
const alarmEventCount = ref(0)
const alarmEventTotal = ref<string | number>(0)
const alarmColors = { critical: '#7DDFDF', high: '#D83D3D', medium: '#F09C37', low: '#00B75B' } as const
let alarmChart: echarts.ECharts | null = null

// ── 系统资源 ─────────────────────────────────────────────────────
const workServer = ref('')
const workServerList = ref<Array<{ nodeId: string; nodeName: string; nodeType: string }>>([])
const strRunTime = ref('')
const networkDataIn = ref<number[]>(new Array(60).fill(0))
const networkDataOut = ref<number[]>(new Array(60).fill(0))
let networkChart: echarts.ECharts | null = null
let cpuChart: echarts.ECharts | null = null
let memChart: echarts.ECharts | null = null
const cpuUsageData = ref<number[]>(new Array(60).fill(0))

// ── 设备统计 ─────────────────────────────────────────────────────
const cameraInfo = ref({ nCameraTotal: 0, nCameraOnline: 0 })
const deviceInfo = ref({ nDeviceTotal: 0, nDeviceOnline: 0 })
const accessControlInfo = ref({ nAccessControlTotal: 0, nAccessControlOnline: 0 })

// ── 系统信息 ─────────────────────────────────────────────────────
const systemInfo = ref({ strVersion: store.version || '', strHostId: '', strType: '', nVideoChannel: '' as string | number, strEndTime: '' })

// ── DOM refs ─────────────────────────────────────────────────────
const chartAlarmContainerRef = ref<HTMLElement | null>(null)
const chartNetworkContainerRef = ref<HTMLElement | null>(null)
const chartCPUContainerRef = ref<HTMLElement | null>(null)
const chartMemoryContainerRef = ref<HTMLElement | null>(null)

// ── computed ─────────────────────────────────────────────────────
const deviceTotalClasses = computed(() => ({ 'zero-value': deviceInfo.value.nDeviceTotal === 0, 'positive-value': deviceInfo.value.nDeviceTotal > 0 }))
const deviceOnlineClasses = computed(() => ({ 'isOnline': deviceInfo.value.nDeviceOnline > 0, 'isOffline': deviceInfo.value.nDeviceOnline === 0 }))
const cameraTotalClasses = computed(() => ({ 'zero-value': cameraInfo.value.nCameraTotal === 0, 'positive-value': cameraInfo.value.nCameraTotal > 0 }))
const cameraOnlineClasses = computed(() => ({ 'isOnline': cameraInfo.value.nCameraOnline > 0, 'isOffline': cameraInfo.value.nCameraOnline === 0 }))
const accessControlTotalClasses = computed(() => ({ 'zero-value': accessControlInfo.value.nAccessControlTotal === 0, 'positive-value': accessControlInfo.value.nAccessControlTotal > 0 }))
const accessControlOnlineClasses = computed(() => ({ 'isOnline': accessControlInfo.value.nAccessControlOnline > 0, 'isOffline': accessControlInfo.value.nAccessControlOnline === 0, 'zero-value': accessControlInfo.value.nAccessControlOnline === 0, 'positive-value': accessControlInfo.value.nAccessControlOnline > 0 }))

// ── API 方法 ─────────────────────────────────────────────────────
const getDiscoverServiceSite = async () => {
  const res = await GetDiscoverServiceSiteApi()
  if (res.status === 200) siteName.value = res.data.result?.DeviceName ?? 'System'
}

const getAlarmEventList = async () => {
  const beginTime = dayjs(Date.now() - alarmTime.value * 3600000).format('YYYY-MM-DDTHH:mm:ss+08:00')
  const endTime = dayjs(new Date()).format('YYYY-MM-DDTHH:mm:ss+08:00')
  const res = await GetAlarmEventHomeList({ beginTime, endTime, username: userStore.username })
  if (res.status === 200 && res.data.msg?.toLowerCase() === 'success') {
    const r = res.data.result
    alarmEvent.value = { high: r.high ?? 0, medium: r.medium ?? 0, low: r.low ?? 0, critical: r.critical ?? 0 }
    const total = (r.high ?? 0) + (r.medium ?? 0) + (r.low ?? 0) + (r.critical ?? 0)
    alarmEventTotal.value = total > 999 ? '999+' : total
    alarmEventCount.value = total
    initAlarmChart()
  }
}

const onAlarmTimeChange = () => getAlarmEventList()

const initAlarmChart = () => {
  if (!chartAlarmContainerRef.value) return
  if (!alarmChart) alarmChart = echarts.init(chartAlarmContainerRef.value)
  const titlecol = store.darkMode ? '#FFFFFF' : '#000000'
  const keys = ['critical', 'high', 'medium', 'low'] as const
  alarmChart.setOption({
    tooltip: { show: true, backgroundColor: 'rgba(102,102,102,0.7)', borderRadius: 4, padding: [0, 10],
      formatter: (p: any) => `<div style="display:flex;justify-content:space-between;gap:20px;margin-top:8px;">${p.marker} ${p.name}<span>${p.value}</span></div>` },
    title: { x: 'center', y: 'center', show: true,
      text: ['{count|' + alarmEventTotal.value + '}', '{label|' + t('Event.event_count') + '}'].join('\n'),
      textStyle: { rich: { count: { fontSize: 50, color: titlecol, lineHeight: 56 }, label: { fontSize: 20, color: titlecol, lineHeight: 24 } } } },
    series: [{ name: 'alarm', type: 'pie', radius: ['60%', '70%'], label: { show: false }, labelLine: { show: false },
      data: keys.map(k => ({ value: alarmEvent.value[k], name: k, itemStyle: { color: alarmColors[k] } })) }] })
}

const getWorkServer = async () => {
  const res = await GetWorkServerListApi()
  if (res.status === 200 && res.data.msg?.toLowerCase() === 'success') {
    const list = res.data.result.list
    workServerList.value = list
    workServer.value = list[0]?.nodeId ?? ''
    // 优先找 main 节点，找不到则用第一个节点
    const mainNode = list.find((item: any) => item.nodeType === 'main') ?? list[0]
    if (mainNode) await getRunTime(mainNode.nodeId)
    await getRunInfo()
  }
}

const getRunTime = async (nodeId: string) => {
  const res = await GetRunTimeApi(nodeId)
  if (res.status === 200 && res.data.msg?.toLowerCase() === 'success') strRunTime.value = res.data.result.strRunTime
}

const formatNetworkSpeed = (speed: number) => (!speed ? '0 Kbps' : speed < 1024 ? `${Math.round(speed)}Kbps` : `${(speed / 1024).toFixed(1)}Mbps`)

const getRunInfo = async () => {
  if (!workServer.value) return
  const res = await GetRunInfoApi(workServer.value)
  if (res.status === 200 && res.data) {
    const d = res.data
    const nIn = parseInt(d.strNetworkInK) || 0, nOut = parseInt(d.strNetworkOutK) || 0
    // 首次加载时用真实数据填满60个点，避免图表全显示为0
    if (networkDataIn.value.every(v => v === 0) && nIn > 0) {
      networkDataIn.value.fill(nIn)
      networkDataOut.value.fill(nOut)
    }
    initResourceCharts({ nCPUUsage: d.nCPUUsage, strMemory: d.strMemory, nMemoryUsage: d.nMemoryUsage, nTotalMemoryByte: d.nTotalMemoryByte,
      strNetworkIn: formatNetworkSpeed(nIn), strNetworkOut: formatNetworkSpeed(nOut), nNetworkIn: nIn, nNetworkOut: nOut })
    if (cpuChart) updateCPUChart(parseInt(d.nCPUUsage) || 0)
  }
}

const onWorkServerChange = () => getRunInfo()

const initResourceCharts = (data: any) => {
  if (!chartNetworkContainerRef.value || !chartCPUContainerRef.value || !chartMemoryContainerRef.value) return
  const titlecol = store.darkMode ? '#FFFFFF' : '#000000', bgcol = store.darkMode ? '#2C2C2C' : '#F5F5F5'
  const timeAxis = new Array(60).fill(''); timeAxis[0] = '60s'; timeAxis[59] = '0s'
  if (!networkChart) {
    networkChart = echarts.init(chartNetworkContainerRef.value)
    networkChart.setOption({ tooltip: { trigger: 'axis', backgroundColor: bgcol }, legend: { data: [t('SystemInfo.system_network_in'), t('SystemInfo.system_network_out')], icon: 'circle', itemWidth: 8, textStyle: { color: titlecol }, bottom: 37, left: 161 },
      grid: { left: 109, right: 20, top: 40, bottom: 73 }, xAxis: { type: 'category', boundaryGap: false, data: timeAxis, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { color: titlecol, interval: 58 } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { color: titlecol, fontSize: 10 } },
      series: [{ name: t('SystemInfo.system_network_in'), data: networkDataIn.value, type: 'line', smooth: true, symbol: 'none', sampling: 'average', lineStyle: { color: '#00FF66' }, itemStyle: { color: '#00FF66' }, areaStyle: { color: 'rgba(0,255,102,0.5)' } },
               { name: t('SystemInfo.system_network_out'), data: networkDataOut.value, type: 'line', smooth: true, symbol: 'none', sampling: 'average', lineStyle: { color: '#468AFF' }, itemStyle: { color: '#468AFF' }, areaStyle: { color: 'rgba(70,138,255,0.5)' } }] })
  }
  if (!cpuChart) {
    cpuChart = echarts.init(chartCPUContainerRef.value)
    cpuChart.setOption({ tooltip: { trigger: 'axis', backgroundColor: bgcol }, legend: { data: [t('CommDev.comm_dev_cpuusage')], icon: 'circle', itemWidth: 8, textStyle: { color: titlecol }, bottom: 37, left: 161 },
      grid: { left: 50, right: 20, top: 40, bottom: 73 }, xAxis: { type: 'category', boundaryGap: false, data: timeAxis, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { color: titlecol, interval: 58 } },
      yAxis: { type: 'value', min: 0, max: 100, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { color: titlecol, fontSize: 10 } },
      series: [{ name: t('CommDev.comm_dev_cpuusage'), data: cpuUsageData.value, type: 'line', smooth: true, symbol: 'none', lineStyle: { color: '#55EEDA' }, areaStyle: { color: 'rgba(85,238,218,0.5)' } }] })
  }
  if (!memChart) {
    memChart = echarts.init(chartMemoryContainerRef.value!)
  }
  const formatMemory = (bytes: number) => { const units = ['B','KB','MB','GB','TB']; let v = bytes, i = 0; while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }; return `${parseFloat(v.toFixed(2))} ${units[i]}` }
  memChart.setOption({ legend: { bottom: '3%', left: 'center', selectedMode: false, textStyle: { color: titlecol, fontSize: 16 }, itemWidth: 12, itemHeight: 12 },
    series: [{ type: 'pie', radius: ['60%', '70%'], center: ['50%', '40%'], hoverOffset: 0,
      label: { show: true, position: 'center', formatter: data.nTotalMemoryByte === 0 ? data.strMemory : `${data.strMemory}\n${t('CommTable.comm_total')} ${formatMemory(data.nTotalMemoryByte)}`, fontSize: 16, color: titlecol },
      labelLine: { show: false },
      data: [{ value: data.nMemoryUsage, name: t('SystemInfo.system_memory'), itemStyle: { color: '#0399FE' } }, { value: 100 - data.nMemoryUsage, name: 'Free', itemStyle: { color: '#50586E' } }] }] })
}

const updateCPUChart = (usage: number) => { if (!cpuChart) return; cpuUsageData.value.push(usage); cpuUsageData.value.shift(); cpuChart.setOption({ series: [{ data: cpuUsageData.value }] }) }

let networkInterval: ReturnType<typeof setInterval> | null = null
const networkRealtimeUpdate = () => {
  networkInterval = setInterval(async () => {
    if (!workServer.value) return
    const res = await GetRunInfoApi(workServer.value)
    if (res.status === 200) {
      const d = res.data
      // 兼容两种字段名：strNetworkInK（字符串）和 nNetworkInK（整数）
      const nIn = parseInt(d.strNetworkInK || d.nNetworkInK) || 0
      const nOut = parseInt(d.strNetworkOutK || d.nNetworkOutK) || 0
      networkDataIn.value.push(nIn); networkDataIn.value.shift(); networkDataOut.value.push(nOut); networkDataOut.value.shift()
      if (networkChart) networkChart.setOption({ series: [{ data: networkDataIn.value }, { data: networkDataOut.value }] })
      if (cpuChart) updateCPUChart(parseInt(res.data.nCPUUsage) || 0)
    }
  }, 3000)
}

const getDeviceSummary = async () => {
  const [r1, r2] = await Promise.all([GetDeviceSummaryApi(), GetDeviceInfoApi()])
  if (r1.status === 200) {
    cameraInfo.value = r1.data.result
    const d = r1.data.result
    accessControlInfo.value = {
      nAccessControlTotal: (d.accessControlOnline || 0) + (d.accessControlOffline || 0),
      nAccessControlOnline: d.accessControlOnline || 0,
    }
  }
  if (r2.status === 200) { const d = r2.data.result; deviceInfo.value = { nDeviceTotal: (d.online||0)+(d.offline||0), nDeviceOnline: d.online||0 } }
}

const getLicenseInfo = async () => {
  const [r1, r2] = await Promise.all([GetLicenseInfoApi(), GetSystemInfo()])
  if (r1.status === 200 && r2.status === 200) {
    const cap = r1.data.result.capacity
    systemInfo.value = { strVersion: r2.data.result.version || '', strHostId: cap.strHostId, strType: cap.strType, nVideoChannel: cap.nVideoChannel, strEndTime: cap.strEndTime }
  }
}

const copyHostId = async () => {
  try { await navigator.clipboard.writeText(systemInfo.value.strHostId); ElMessage({ message: t('SystemInfo.system_copysuccessful'), type: 'success', duration: 3000 }) }
  catch { /* ignore */ }
}

let resizeTimer: ReturnType<typeof setTimeout> | null = null
const handleResize = () => {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    networkChart?.resize()
    cpuChart?.resize()
    alarmChart?.resize()
    memChart?.resize()
  }, 200)
}

let updateInterval: ReturnType<typeof setInterval> | null = null
let alarmInterval: ReturnType<typeof setInterval> | null = null

watch(() => store.darkMode, () => { alarmChart?.dispose(); networkChart?.dispose(); cpuChart?.dispose(); memChart?.dispose(); alarmChart = null; networkChart = null; cpuChart = null; memChart = null; getRunInfo(); getAlarmEventList() })

onMounted(async () => {
  updateDateTime()
  await Promise.all([getDiscoverServiceSite(), getWorkServer(), getDeviceSummary(), getLicenseInfo(), getAlarmEventList()])
  networkRealtimeUpdate()
  updateInterval = setInterval(() => { updateDateTime(); getRunInfo() }, 5000)
  alarmInterval = setInterval(getAlarmEventList, 10000)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (updateInterval) clearInterval(updateInterval)
  if (alarmInterval) clearInterval(alarmInterval)
  if (networkInterval) clearInterval(networkInterval)
  if (resizeTimer) clearTimeout(resizeTimer)
  window.removeEventListener('resize', handleResize)
  networkChart?.dispose(); cpuChart?.dispose(); alarmChart?.dispose(); memChart?.dispose()
  // 必须置 null，否则下次进入 Home 时初始化判断会失败
  networkChart = null
  cpuChart = null
  alarmChart = null
  memChart = null
})
</script>

<style scoped lang="scss">
#home {
  flex: 1;
  min-height: 0;
  padding: 30px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  .home-top {
    height: 120px;
    padding: 20px;
    align-items: center;
    font-family: Inter, Inter;
    font-style: normal;
    text-transform: none;
    .greeting {
      height: 40px;
      line-height: 40px;
      font-weight: 400;
      font-size: 32px;
    }
    .datetime {
      height: 40px;
      line-height: 40px;
      font-size: 20px;
    }
  }

  .home-tabs {
    height: 130px;
    padding: 20px;
    display: flex;
    gap: 40px;
    justify-content: space-between;
    .home-tab-item {
      position: relative;
      flex: 1;
      padding: 20px;
      border-radius: 8px;
      cursor: pointer;
      .home-tab-name {
        margin-bottom: 5px;
        line-height: 26px;
        height: 26px;
        .icon {
          font-size: 26px;
        }
        .name {
          font-size: 14px;
        }
      }
      .home-tab-children {
        width: 270px;
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .jump {
        position: absolute;
        right: 30px;
        top: 35%;
        transform: translateY(-50%);
        .iconfont {
          font-size: 20px;
        }
      }
    }
  }

  .home-event {
    flex: 1;
    padding: 5px 20px 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
    header {
      font-size: 26px;
      padding-bottom: 5px;
    }
    .home-event-content {
      display: flex;
      gap: 20px;
      flex: 1;
      .content-left {
        width: 511px;
        height: 100%;
        border-radius: 8px;
        .alarm-header {
          display: flex;
          justify-content: space-between;
          padding: 40px;

          :deep(.el-select__wrapper) {
            background: #F1F3F4 !important;
            --el-text-color-regular: #333333;
            --el-text-color-placeholder: #606266;
            --el-select-input-color: #333333;
            --el-select-disabled-color: #333333;
          }
          :deep(.el-select__selected-item) { color: #333333 !important; }
        }
        .alarm-main {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          .alarm-text {
            text-align: center;
            font-size: 30px;
          }
          .chart-alarm-container {
            width: 220px;
            height: 220px;
            align-self: center;
          }
          .event-status {
            text-align: center;
          }
        }
        .alarm-footer {
          display: flex;
          justify-content: space-between;
          padding: 40px 40px 0;
          div:nth-child(1) {
            border-radius: 16px;
            padding: 5px 25px 4px;
            cursor: pointer;
          }
        }
      }
      .content-right {
        flex: 1;
        height: 100%;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        .memory-cpu {
          height: 52%;
          border-radius: 8px;
          .memory-cpu-header {
            display: flex;
            justify-content: space-between;
            padding: 25px 40px 0;
            .system-title {
              font-size: 20px;
              margin-right: 20px;
            }
            .runtime-text .runtime-nums {
              font-size: 18px;
            }

            :deep(.el-select__wrapper) {
              background: #F1F3F4 !important;
            }
          }
          .memory-cpu-main {
            display: flex;
            justify-content: space-between;
            div {
              flex: 1;
              height: 220px;
            }
          }
        }
        .run-system {
          flex: 1;
          display: flex;
          gap: 20px;
          .run {
            width: 50%;
            border-radius: 8px;
            .run-header {
              display: flex;
              justify-content: space-between;
              padding: 25px 40px 0;
            }
            .run-main {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              padding: 20px 40px 0;
              .stat-card {
                flex: 1;
                text-align: center;
              }
              .stat-title {
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                gap: 8px;
                .dot {
                  display: inline-block;
                  width: 8px;
                  height: 8px;
                  border-radius: 50%;
                  background-color: #0399FE;
                  margin-right: 8px;
                  vertical-align: middle;
                  flex-shrink: 0;
                }
              }
              .stat-numbers {
                display: flex;
                justify-content: space-around;
                gap: 30px;
                padding-inline: 30px;
                .stat-divider {
                  width: 2px;
                  height: 20px;
                  background-color: rgba(255, 255, 255, 0.06);
                  align-self: flex-start;
                  margin-top: 20px;
                }
                .stat-item {
                  flex: 1;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  min-width: 0;
                  .stat-label {
                    font-size: 10px;
                    margin-bottom: 19px;
                    order: 2;
                    white-space: nowrap;
                  }
                  .stat-value {
                    font-size: 40px;
                    order: 1;
                  }
                }
              }
            }
          }
          .system {
            flex: 1;
            border-radius: 6px;
            .system-header {
              display: flex;
              justify-content: space-between;
              padding: 25px 40px 0;
            }
            .system-main {
              padding: 20px 0 0 25px;
              div {
                height: 30px;
              }
              label {
                display: inline-block;
                width: 100px;
              }
              .strHostId {
                display: inline-block;
                transform: translateY(-5px);
              }
              #hostIdText {
                display: inline-block;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }
          }
        }
      }
    }
  }

  // ── Light mode colors (default) ───────────────────────────────────────
  background: #F1F3F4;

  .home-top {
    .greeting { color: #0399FE; }
    .datetime  { color: #999999; }
  }

  .home-tabs {
    .home-tab-item {
      background: #FFFFFF;
      box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.2);
      .home-tab-name { color: #0399FE; }
      .home-tab-children { color: #666666; }
      .jump .iconfont { color: #0399FE; }
      &:hover {
        background: rgba(141, 189, 255, 0.3);
        box-shadow: 0 0 0 1px #0399FE;
      }
    }
  }

  .home-event .home-event-content {
    .content-left {
      background: #ffffff;
      .alarm-header :deep(.el-select__wrapper) {
        background: #F1F3F4 !important;
        --el-text-color-regular: #333333;
        --el-text-color-placeholder: #606266;
        --el-select-input-color: #333333;
        --el-select-disabled-color: #333333;
      }
      .alarm-header :deep(.el-select__selected-item) { color: #333333 !important; }
      .alarm-footer div:nth-child(1) {
        color: #0399FE;
        background: rgba(147, 211, 255, 0.1);
      }
    }
    .content-right {
      .memory-cpu {
        background: #ffffff;
        .memory-cpu-header {
          .runtime-text {
            color: rgba(0, 0, 0, 0.7);
            .runtime-nums { color: #000000; }
          }
          :deep(.el-select__wrapper) {
            background: #F1F3F4 !important;
          }
        }
      }
      .run-system {
        .run {
          background: #ffffff;
          .run-main .stat-numbers {
            .stat-divider { background-color: rgba(0, 0, 0, 0.06); }
            .stat-item .stat-value {
              &.zero-value   { color: #000000; opacity: 0.32; }
              &.positive-value { color: #000000; opacity: 1; }
              &.isOffline    { color: #000000; opacity: 0.32; }
              &.isOnline     { color: #00D856; opacity: 1; }
            }
          }
        }
        .system { background: #ffffff; }
      }
    }
  }

  // ── Dark theme overrides ───────────────────────────────────────────────
  &.c-dark-theme {
    background: #1D1D1D;
    .home-top {
      .greeting { color: #0399FE; }   // 与 uscweb 对齐：深色模式 greeting 也是蓝色
      .datetime  { color: #999999; }
    }
    .home-tabs .home-tab-item {
      background: #2A2A2A;
      box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.2);
      .home-tab-name { color: #FFFFFF; }
      .home-tab-children { color: #FFFFFF; }
      .jump .iconfont { color: #0399FE; }  // youshang 图标深色模式也是蓝色
      &:hover { background: #31373D; box-shadow: 0 0 0 1px #0399FE; }
    }
    .home-event .home-event-content {
      .content-left {
        background: #2A2A2A;
        .alarm-header {
          :deep(.el-select__wrapper) {
            background: #3D3D3D !important;
            --el-text-color-regular: #FFFFFF;
            --el-text-color-placeholder: rgba(255,255,255,0.5);
            --el-select-input-color: rgba(255,255,255,0.5);
          }
        }
        .alarm-footer div:nth-child(1) { color: #0399FE; background: rgba(147, 211, 255, 0.1); }
      }
      .content-right {
        .memory-cpu {
          background: #2A2A2A;
          .memory-cpu-header {
            .runtime-text {
              color: rgba(255, 255, 255, 0.7);
              .runtime-nums { color: #FFFFFF; }
            }
            :deep(.el-select__wrapper) {
              background: #3D3D3D !important;
            }
            :deep(.el-select__selected-item) { color: #FFFFFF; }
            :deep(.el-select__placeholder)   { color: rgba(255,255,255,0.5); }
          }
        }
        .run-system {
          .run {
            background: #2A2A2A;
            .run-main .stat-numbers {
              .stat-divider { background-color: rgba(255, 255, 255, 0.06); }
              .stat-item .stat-value {
                &.zero-value    { color: #FFFFFF; opacity: 0.32; }
                &.positive-value { color: #FFFFFF; opacity: 1; }
                &.isOffline     { color: #FFFFFF; opacity: 0.32; }
                &.isOnline      { color: #00D856; opacity: 1; }
              }
            }
          }
          .system { background: #2A2A2A; }
        }
      }
    }
  }

  &.darkblue {
    background: #0D1929;
    .home-tabs .home-tab-item {
      background: #1A2233;
      box-shadow: none;
      &:hover { background: rgba(3, 153, 254, 0.15); box-shadow: 0 0 0 1px #0399FE; }
    }
    .home-event .home-event-content {
      .content-left { background: #1A2233; }
      .content-right {
        .memory-cpu { background: #1A2233; }
        .run-system {
          .run { background: #1A2233; }
          .system { background: #1A2233; }
        }
      }
    }
  }
}
</style>
