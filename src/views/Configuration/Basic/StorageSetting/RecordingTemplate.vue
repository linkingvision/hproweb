<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  GetRecordingTemplateApi,
  AddRecordingTemplateApi,
  UpdateRecordingTemplateApi,
  DeleteRecordingTemplateApi,
  GetPublicHolidayApi,
  AddPublicHolidayApi,
  DeletePublicHolidayApi,
  type TemplateDay,
} from '@/api/configuration/storage'
import { HolidayUtil } from 'lunar-javascript'

const { t, locale } = useI18n()

// ─── Types ───────────────────────────────────────────────
interface CellUnit {
  timeData: number      // 0-47 slot index
  class: string | null  // CSS class determining color
  type: string          // recordAlways | notRecord | motion | object | motionObject
  text: string          // 'M' | 'S' | ''
}

interface HolidayEntry { holiday: string }
interface HolidayItem {
  publicHolidayId: number
  year: string
  publicHoliday: { publicHoliday: HolidayEntry[] }
  uuid: string
}

interface TemplateItem {
  id: number
  name: string
  timeRange: TemplateDay[]
  uuid: string
  recordingTemplateName: string
  preRecInSecond: number
  postRecInSecond: number
  RecordingExpireInDay: number
  ANR: boolean
  ANRTimeInHour: number
}

// ─── Grid state ──────────────────────────────────────────
// 8 rows (Mon–Sun + public holiday), 48 half-hour slots each
const rowUnit = ref<CellUnit[][]>([])
const timeContent = ref<{ arr: number[] }[]>([])

function initGrid() {
  rowUnit.value = []
  timeContent.value = []
  for (let i = 0; i < 8; i++) {
    const row: CellUnit[] = []
    for (let j = 0; j < 48; j++) {
      row.push({ timeData: j, class: null, type: '', text: '' })
    }
    rowUnit.value.push(row)
    timeContent.value.push({ arr: [] })
  }
}

function clearGrid() {
  rowUnit.value.forEach(row => row.forEach(cell => {
    cell.class = null
    cell.type = ''
    cell.text = ''
  }))
  timeContent.value.forEach(d => { d.arr = [] })
}

// ─── Template list ───────────────────────────────────────
const templates = ref<TemplateItem[]>([])
const isActive = ref(-1)
const operationVis = ref(-1)
const clickItem = ref<TemplateItem | null>(null)
const isTemplateSelected = ref(false)
const editingName = ref('')

// i18n name mapping for built-in templates
function mapTemplateName(raw: string): string {
  const map: Record<string, string> = {
    'Recording always': 'Setting.set_recording_always',
    'Recording Always': 'Setting.set_recording_always',
    '持續錄像': 'Setting.set_recording_always',
    'Motion recording': 'Setting.set_motion_recording',
    'Motion Recording': 'Setting.set_motion_recording',
    '移動偵測錄像': 'Setting.set_motion_recording',
    'Object recording': 'Setting.set_object_recording',
    'Object Recording': 'Setting.set_object_recording',
    '目標檢測錄像': 'Setting.set_object_recording',
    '物體偵測錄像': 'Setting.set_object_recording',
    'Motion & Object recording': 'Setting.set_motion_object_recording',
    'Motion & Object Recording': 'Setting.set_motion_object_recording',
    '移動+目標錄像': 'Setting.set_motion_object_recording',
    '移動&物體偵測錄像': 'Setting.set_motion_object_recording',
    'Not recording': 'Setting.set_not_recording',
    'Not Recording': 'Setting.set_not_recording',
    '不錄像': 'Setting.set_not_recording',
    'Recording always 30 day': 'Setting.set_continue_30',
    'Recording Always (30 Days)': 'Setting.set_continue_30',
    'Recording Always (30 Day)': 'Setting.set_continue_30',
    '持續錄像（30天）': 'Setting.set_continue_30',
    '持續錄像(30天)': 'Setting.set_continue_30',
    'Recording always 60 day': 'Setting.set_continue_60',
    'Recording Always (60 Days)': 'Setting.set_continue_60',
    'Recording Always (60 Day)': 'Setting.set_continue_60',
    '持續錄像（60天）': 'Setting.set_continue_60',
    '持續錄像(60天)': 'Setting.set_continue_60',
    'Recording always 90 day': 'Setting.set_continue_90',
    'Recording Always (90 Days)': 'Setting.set_continue_90',
    'Recording Always (90 Day)': 'Setting.set_continue_90',
    '持續錄像（90天）': 'Setting.set_continue_90',
    '持續錄像(90天)': 'Setting.set_continue_90',
    'Recording always 365 day': 'Setting.set_continue_365',
    'Recording Always (365 Days)': 'Setting.set_continue_365',
    'Recording Always (365 Day)': 'Setting.set_continue_365',
    '持續錄像（365天）': 'Setting.set_continue_365',
    '持續錄像(365天)': 'Setting.set_continue_365',
  }
  const key = map[raw.trim()]
  return key ? t(key) : raw
}

async function loadTemplates() {
  const res = await GetRecordingTemplateApi()
  if (res.data.msg !== 'Success') return
  templates.value = res.data.result.map((d: any) => ({
    id: d.recordingTemplateId,
    name: mapTemplateName(d.recordingTemplateName),
    timeRange: d.setting.templateData,
    uuid: d.uuid,
    recordingTemplateName: d.recordingTemplateName,
    preRecInSecond: d.preRecInSecond,
    postRecInSecond: d.postRecInSecond,
    RecordingExpireInDay: d.recordingExpireInDay,
    ANR: d.ANR,
    ANRTimeInHour: d.ANRTimeInHour,
  }))
}

async function addTemplate() {
  const res = await AddRecordingTemplateApi({
    recordingTemplateName: t('Liveview.live_customization') + '1',
    preRecInSecond: 15,
    postRecInSecond: 15,
    RecordingExpireInDay: 0,
    ANR: false,
    ANRTimeInHour: 72,
    setting: { templateData: [] },
  })
  if (res.data.msg === 'Success') {
    ElMessage({ message: t('CommTableEdit.comm_add_successfully'), type: 'success' })
    loadTemplates()
  } else {
    ElMessage({ message: t('CommTableEdit.comm_add_failed'), type: 'error' })
  }
}

async function deleteTemplate() {
  if (!clickItem.value) return
  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
      confirmButtonText: t('CommTableEdit.comm_ok'),
      cancelButtonText: t('CommTableEdit.comm_cancel'),
    })
  } catch { return }
  const res = await DeleteRecordingTemplateApi({ ids: [clickItem.value.id] })
  if (res.data.msg === 'Success') {
    ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success' })
    isActive.value = -1
    clickItem.value = null
    isTemplateSelected.value = false
    loadTemplates()
  } else {
    ElMessage({ message: t('CommTableEdit.comm_delete_failed') + (res.data.msg ?? ''), type: 'error' })
  }
}

// Rename a template inline
function startRename(index: number) { operationVis.value = index }
function cancelRename() { operationVis.value = -1 }

async function confirmRename(item: TemplateItem) {
  const res = await UpdateRecordingTemplateApi({
    uuid: item.uuid,
    recordingTemplateName: item.name,
    preRecInSecond: item.preRecInSecond,
    postRecInSecond: item.postRecInSecond,
    RecordingExpireInDay: item.RecordingExpireInDay,
    ANR: item.ANR,
    ANRTimeInHour: item.ANRTimeInHour,
    setting: { templateData: item.timeRange },
  })
  if (res.data.msg === 'Success') {
    operationVis.value = -1
    ElMessage({ message: t('CommTableEdit.comm_edit_successfully'), type: 'success' })
    loadTemplates()
  } else {
    ElMessage({ message: t('CommTableEdit.comm_edit_failed'), type: 'error' })
  }
}

// Select a template from the list and render its grid
function handleSelectTemplate(item: TemplateItem, index: number) {
  clearGrid()
  clickItem.value = item
  isActive.value = index
  operationVis.value = -1
  isTemplateSelected.value = true

  if (item.timeRange && item.timeRange.length > 0) {
    for (const dayData of item.timeRange) {
      for (const slot of dayData.recordingRange) {
        let rowIdx = dayData.dayIndex - 1
        if (rowIdx === -1) rowIdx = 6               // dayIndex 0 (Sun) → row 6
        if (dayData.dayIndex === 8) rowIdx = 7       // public holiday → row 7
        applyCell(slot.index - 1, rowIdx, slot)
      }
    }
    // uscweb: id < 5 内置模板，对 timeRange 未覆盖的行补填 notRecord
    if (item.id < 5) {
      const notRecordSlot = { type: 'notRecord', stream: streamType.value, enable: 'false' }
      for (let rowIdx = item.timeRange.length; rowIdx < 8; rowIdx++) {
        for (let c = 0; c < 48; c++) {
          applyCell(c, rowIdx, notRecordSlot)
        }
      }
    }
  }
}

// ─── Draw type ───────────────────────────────────────────
const drawType = ref('on')   // 'on' | 'false' | 'motion' | 'object' | 'motion_object'
const streamType = ref('main')

function setDrawType(type: string) { drawType.value = type }

// ─── Mouse drag selection ─────────────────────────────────
const mouseDown = ref(false)
const beginDay = ref(0)
const beginTime = ref(0)
const kuangObj = ref({ width: 0, height: 0, top: 0, left: 0, flag: false, oldLeft: 0, oldTop: 0 })
const activeRow = ref(-1)   // 当前操作行，-1 表示全部隐藏（对照 uscweb $('.copyBtn').hide()）

function onCellMouseDown(colIdx: number, rowIdx: number) {
  mouseDown.value = true
  beginDay.value = rowIdx
  beginTime.value = colIdx
  activeRow.value = rowIdx  // 只显示本行图标，对照 uscweb $('.copy').eq(day).find('.copyBtn').show()
}

function onCellMouseUp(colIdx: number, rowIdx: number) {
  if (!mouseDown.value) return
  const rStart = Math.min(beginDay.value, rowIdx)
  const rEnd   = Math.max(beginDay.value, rowIdx)
  const cStart = Math.min(beginTime.value, colIdx)
  const cEnd   = Math.max(beginTime.value, colIdx)

  for (let r = rStart; r <= rEnd; r++) {
    for (let c = cStart; c <= cEnd; c++) {
      paintCell(c, r)
    }
  }
  mouseDown.value = false
}

function onGridMouseLeave() { mouseDown.value = false }

// Apply a loaded cell (from API data)
function applyCell(c: number, r: number, slot: any) {
  const cell = rowUnit.value[r]?.[c]
  if (!cell) return
  if (slot.type === 'recordAlways') {
    cell.class = 'ui-selected'; cell.type = 'recordAlways'
    cell.text = slot.stream === 'main' ? 'M' : 'S'
  } else if (slot.type === 'motion') {
    cell.class = 'ui-selected-motion'; cell.type = 'motion'
    cell.text = slot.stream === 'main' ? 'M' : 'S'
  } else if (slot.type === 'object') {
    cell.class = 'ui-selected-object'; cell.type = 'object'
    cell.text = slot.stream === 'main' ? 'M' : 'S'
  } else if (slot.type === 'motionObject') {
    cell.class = 'ui-selected-motion-object'; cell.type = 'motionObject'
    cell.text = slot.stream === 'main' ? 'M' : 'S'
  } else {
    // notRecord：不显示 M/S
    cell.class = null; cell.type = 'notRecord'; cell.text = ''
  }
}

// Paint a cell with the current draw type
function paintCell(c: number, r: number) {
  const cell = rowUnit.value[r]?.[c]
  if (!cell) return
  if (drawType.value === 'on') {
    cell.class = 'ui-selected'; cell.type = 'recordAlways'
    cell.text = streamType.value === 'main' ? 'M' : 'S'
  } else if (drawType.value === 'motion') {
    cell.class = 'ui-selected-motion'; cell.type = 'motion'
    cell.text = streamType.value === 'main' ? 'M' : 'S'
  } else if (drawType.value === 'object') {
    cell.class = 'ui-selected-object'; cell.type = 'object'
    cell.text = streamType.value === 'main' ? 'M' : 'S'
  } else if (drawType.value === 'motion_object') {
    cell.class = 'ui-selected-motion-object'; cell.type = 'motionObject'
    cell.text = streamType.value === 'main' ? 'M' : 'S'
  } else {
    cell.class = null; cell.type = 'notRecord'; cell.text = ''
  }
}

// ─── Kuang drag-selection box ─────────────────────────────
function kuangDown(e: MouseEvent) {
  kuangObj.value.flag = true
  kuangObj.value.oldLeft = (e as any).layerX
  kuangObj.value.oldTop  = (e as any).layerY
}
function kuangMove(e: MouseEvent) {
  if (!kuangObj.value.flag || !mouseDown.value) return
  const x1 = kuangObj.value.oldLeft, y1 = kuangObj.value.oldTop
  const x2 = (e as any).layerX,      y2 = (e as any).layerY
  kuangObj.value.left   = Math.min(x1, x2)
  kuangObj.value.top    = Math.min(y1, y2)
  kuangObj.value.width  = Math.abs(x2 - x1)
  kuangObj.value.height = Math.abs(y2 - y1)
}
function clearKuang() {
  kuangObj.value.flag = false
  Object.assign(kuangObj.value, { width: 0, height: 0, top: 0, left: 0 })
}
function kuangUp()    { clearKuang() }
function kuangLeave() { clearKuang(); mouseDown.value = false }

// ─── Copy row ────────────────────────────────────────────
const copyPopoverVisible = ref<boolean[]>(Array(8).fill(false))

interface DayOption { label: string; value: number; disabled: boolean; checked: boolean }
function buildDayOptions(): DayOption[] {
  return [
    { label: t('Common.comm_monday'),       value: 0, disabled: false, checked: false },
    { label: t('Common.comm_tuesday'),      value: 1, disabled: false, checked: false },
    { label: t('Common.comm_wednesday'),    value: 2, disabled: false, checked: false },
    { label: t('Common.comm_thursday'),     value: 3, disabled: false, checked: false },
    { label: t('Common.comm_friday'),       value: 4, disabled: false, checked: false },
    { label: t('Common.comm_saturday'),     value: 5, disabled: false, checked: false },
    { label: t('Common.comm_sunday'),       value: 6, disabled: false, checked: false },
    { label: t('Common.comm_public_holiday'), value: 7, disabled: false, checked: false },
    { label: t('Common.comm_check_all'),    value: 8, disabled: false, checked: false },
  ]
}
const copyOptions = ref<DayOption[][]>(Array.from({ length: 8 }, () => buildDayOptions()))

function openCopyPopover(rowIdx: number) {
  copyOptions.value[rowIdx] = buildDayOptions()
  copyOptions.value[rowIdx][rowIdx].disabled = true
  copyPopoverVisible.value[rowIdx] = true
}

function toggleCopyDay(rowIdx: number, optIdx: number) {
  const opts = copyOptions.value[rowIdx]
  if (optIdx === 8) {
    // check-all toggle
    const allChecked = opts.filter((o, i) => i < 8 && !o.disabled).every(o => o.checked)
    opts.forEach((o, i) => { if (i < 8 && !o.disabled) o.checked = !allChecked })
    opts[8].checked = !allChecked
  } else {
    opts[optIdx].checked = !opts[optIdx].checked
    opts[8].checked = opts.filter((o, i) => i < 8 && !o.disabled).every(o => o.checked)
  }
}

function confirmCopy(rowIdx: number) {
  const src = rowUnit.value[rowIdx]
  const opts = copyOptions.value[rowIdx]
  opts.forEach((opt, i) => {
    if (i < 8 && opt.checked) {
      src.forEach((cell, c) => {
        const dst = rowUnit.value[i][c]
        dst.class = cell.class
        dst.type = cell.type
        dst.text = cell.text
      })
    }
  })
  copyPopoverVisible.value[rowIdx] = false
}

function closeCopyPopover(rowIdx: number) {
  copyPopoverVisible.value[rowIdx] = false
}

// ─── Save / Reset ─────────────────────────────────────────
function buildStartEndTime(slotIdx: number): [string, string] {
  const hour = Math.floor(slotIdx / 2)
  const minute = (slotIdx % 2) * 30
  const startTime = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00`
  const endHour = Math.floor(slotIdx / 2)
  const endMinute = slotIdx % 2 !== 0 ? '59' : '29'
  const endTime = `${String(endHour).padStart(2,'0')}:${endMinute}:59`
  return [startTime, endTime]
}

async function saveTemplate() {
  if (!clickItem.value) return
  const templateData: TemplateDay[] = rowUnit.value.map((row, i) => {
    let dayIndex = i + 1
    if (dayIndex === 7) dayIndex = 0   // Sunday
    // row 7 = public holiday → dayIndex 8
    if (i === 7) dayIndex = 8
    const recordingRange = row.map((cell, c) => {
      const [startTime, endTime] = buildStartEndTime(c)
      return {
        index: cell.timeData + 1,
        startTime,
        endTime,
        enable: cell.class ? 'true' : 'false',
        type: cell.type || 'notRecord',
        stream: cell.text === 'M' ? 'main' : cell.text === 'S' ? 'sub' : streamType.value,
      }
    })
    return { dayIndex, recordingRange }
  })

  const res = await UpdateRecordingTemplateApi({
    uuid: clickItem.value.uuid,
    recordingTemplateName: clickItem.value.name,
    preRecInSecond: Number(clickItem.value.preRecInSecond),
    postRecInSecond: Number(clickItem.value.postRecInSecond),
    RecordingExpireInDay: Number(clickItem.value.RecordingExpireInDay),
    ANR: clickItem.value.ANR,
    ANRTimeInHour: Number(clickItem.value.ANRTimeInHour),
    setting: { templateData },
  })
  if (res.data.msg === 'Success') {
    ElMessage({ message: t('CommTableEdit.comm_save_successfully'), type: 'success' })
    loadTemplates()
  } else {
    ElMessage({ message: t('CommTableEdit.comm_save_failed'), type: 'error' })
  }
}

async function resetTemplate() {
  if (!clickItem.value) return
  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
      confirmButtonText: t('CommTableEdit.comm_ok'),
      cancelButtonText: t('CommTableEdit.comm_cancel'),
    })
  } catch { return }
  const res = await UpdateRecordingTemplateApi({
    uuid: clickItem.value.uuid,
    recordingTemplateName: clickItem.value.name,
    preRecInSecond: clickItem.value.preRecInSecond,
    postRecInSecond: clickItem.value.postRecInSecond,
    RecordingExpireInDay: clickItem.value.RecordingExpireInDay,
    ANR: clickItem.value.ANR,
    ANRTimeInHour: clickItem.value.ANRTimeInHour,
    setting: { templateData: [] },
  })
  if (res.data.msg === 'Success') {
    clearGrid()
    ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success' })
    loadTemplates()
  } else {
    ElMessage({ message: t('CommTableEdit.comm_delete_failed'), type: 'error' })
  }
}

// ─── Public Holiday（变量名/方法名完全对照 uscweb RecordingTemplate）─────────
const dialogFormVisible = ref(false)
const tableData         = ref<HolidayItem[]>([])
const holiday           = ref('')
const date              = ref<string[]>([])  // 对照 uscweb this.date
const Year              = ref(new Date().getFullYear())
const Month             = ref(new Date().getMonth() + 1)
const OptionYear        = ref<{ label: string; value: number }[]>([])
const OptionMonth       = ref<{ label: string; value: number }[]>([])

const OptionHoliday = computed(() => [
  { label: t('Setting.set_holiday_new_year'),    value: '1' },
  { label: t('Setting.set_holiday_spring'),      value: '2' },
  { label: t('Setting.set_holiday_qingming'),    value: '3' },
  { label: t('Setting.set_holiday_labor'),       value: '4' },
  { label: t('Setting.set_holiday_dragon_boat'), value: '5' },
  { label: t('Setting.set_holiday_mid_autumn'),  value: '6' },
  { label: t('Setting.set_holiday_national'),    value: '7' },
])

// calendarDays：唯一与 uscweb 不同之处（用自实现替代第三方 <calendar> 组件）
interface CalDay { dayStr: string; date: number; isCurrentMonth: boolean }
const calendarDays = computed<CalDay[]>(() => {
  const y = Year.value, m = Month.value
  const startOffset = (new Date(y, m - 1, 1).getDay() + 6) % 7
  const daysInMonth = new Date(y, m, 0).getDate()
  const prevYear  = m === 1 ? y - 1 : y
  const prevMonth = m === 1 ? 12 : m - 1
  const prevDays  = new Date(prevYear, prevMonth, 0).getDate()
  const nextYear  = m === 12 ? y + 1 : y
  const nextMonth = m === 12 ? 1 : m + 1
  const cells: CalDay[] = []
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = prevDays - i
    cells.push({ dayStr: `${prevYear}-${String(prevMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`, date: d, isCurrentMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ dayStr: `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`, date: d, isCurrentMonth: true })
  let nextDay = 1
  while (cells.length % 7 !== 0)
    cells.push({ dayStr: `${nextYear}-${String(nextMonth).padStart(2,'0')}-${String(nextDay).padStart(2,'0')}`, date: nextDay++, isCurrentMonth: false })
  return cells
})

function isDateSelected(day: string) { return date.value.includes(day) }
function toggleDate(day: string) {
  const idx = date.value.indexOf(day)
  if (idx >= 0) date.value.splice(idx, 1)
  else date.value.push(day)
}

// 对照 uscweb PublicHoliday(Delete)
async function PublicHoliday(_Delete?: boolean) {
  const res = await GetPublicHolidayApi()
  if (res.data.msg !== 'Success') return
  tableData.value = []
  date.value = []
  for (const d of res.data.result) {
    tableData.value.push({ publicHolidayId: d.publicHolidayId, year: d.year, publicHoliday: d.setting, uuid: d.uuid })
    for (const h of d.setting.publicHoliday)
      date.value.push(d.year + '-' + h.holiday)
  }
}

// 对照 uscweb Add()
function Add() {
  dialogFormVisible.value = true
  OptionYear.value = []; OptionMonth.value = []
  for (let i = 1900; i <= 2050; i++)
    OptionYear.value.push({ label: i + t('Common.comm_year'), value: i })
  Year.value = new Date().getFullYear()
  for (let i = 1; i <= 12; i++)
    OptionMonth.value.push({ label: i + t('Common.comm_month'), value: i })
  Month.value = new Date().getMonth() + 1
}

// 对照 uscweb platformyes()
async function platformyes() {
  dialogFormVisible.value = false
  const publicHoliday: { holiday: string }[] = []
  for (const str of date.value) {
    const dashIndex = str.indexOf('-')
    if (str.substring(0, dashIndex) == String(Year.value))
      publicHoliday.push({ holiday: str.substring(dashIndex + 1) })
  }
  if (JSON.stringify(publicHoliday) === '[]') { PublicHoliday(); return }
  for (const row of tableData.value) {
    if (row.year == String(Year.value)) { await UpdatePublicHoliday(row, publicHoliday); return }
  }
  const res = await AddPublicHolidayApi({ year: String(Year.value), setting: { publicHoliday } })
  if (res.data.msg === 'Success') {
    PublicHoliday()
    ElMessage({ message: t('CommTableEdit.comm_add_successfully'), type: 'success' })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_add_failed'), type: 'error' })
  }
}

async function UpdatePublicHoliday(item: HolidayItem, publicHoliday: { holiday: string }[]) {
  const del = await DeletePublicHolidayApi({ ids: [item.publicHolidayId] })
  if (del.data.msg !== 'Success') return
  const res = await AddPublicHolidayApi({ year: item.year, setting: { publicHoliday } })
  if (res.data.msg === 'Success') {
    PublicHoliday()
    ElMessage({ message: t('CommTableEdit.comm_edit_successfully'), type: 'success' })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_edit_failed'), type: 'error' })
  }
}

async function DeletePublicHoliday(item: HolidayItem, item1: HolidayEntry, _index: number) {
  const publicHoliday = item.publicHoliday.publicHoliday.filter(h => h.holiday !== item1.holiday)
  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
      confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel'),
    })
  } catch { return }
  const del = await DeletePublicHolidayApi({ ids: [item.publicHolidayId] })
  if (del.data.msg !== 'Success') { ElMessage({ message: t('CommTableEdit.comm_delete_failed'), type: 'error' }); return }
  ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success' })
  if (JSON.stringify(publicHoliday) === '[]') { PublicHoliday(true); return }
  const res = await AddPublicHolidayApi({ year: item.year, setting: { publicHoliday } })
  if (res.data.msg === 'Success') PublicHoliday(true)
}

function getSpringFestivalDate(year: number, name: string): string {
  try {
    const holidays = (HolidayUtil as any).getHolidays(year)
    for (const h of holidays) {
      if ((h as any)._p?.name === name && !(h as any)._p?.work) return (h as any)._p.day as string
    }
  } catch { /* fallback */ }
  return ''
}

function ChangeHolidy() {
  if (!holiday.value) return
  switch (holiday.value) {
    case '1': Month.value = 1; break
    case '2': {
      const d = getSpringFestivalDate(Year.value, '春节')
      Month.value = d ? Number(d.split('-')[1]) : 2
      break
    }
    case '3': {
      const d = getSpringFestivalDate(Year.value, '清明节')
      Month.value = d ? Number(d.split('-')[1]) : 4
      break
    }
    case '4': Month.value = 5; break
    case '5': Month.value = 6; break
    case '6': Month.value = 9; break
    case '7': Month.value = 10; break
  }
}

function ChangeYearMonth() { /* Year/Month 变化时 calendarDays 自动响应 */ }

function ChangeMonth(direction: 'prev' | 'next', step: number) {
  let y = Year.value, m = Month.value
  direction === 'prev' ? (m -= step) : (m += step)
  if (m <= 0)  { m += 12; y-- }
  if (m > 12)  { m -= 12; y++ }
  Month.value = m; Year.value = y
}

// 对照 uscweb clickToday()
function clickToday() {
  Year.value = new Date().getFullYear(); Month.value = new Date().getMonth() + 1
}

function onCalendarChange(_val: Date) { /* 不使用 el-calendar */ }

// ─── Table header (hour labels 00-23) ────────────────────
const tableHeader = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

// ─── Draw type legend entries ─────────────────────────────
// Defined as a computed-like getter so labels pick up i18n at render time
const drawTypes = computed(() => [
  { value: 'on',            color: '#0399FE', label: t('Setting.set_record_always') },
  { value: 'false',         color: '#292929', label: t('Setting.set_do_not_record') },
  { value: 'motion',        color: '#FF443B', label: t('Setting.set_motion') },
  { value: 'object',        color: '#FDD23A', label: t('Setting.set_object') },
  { value: 'motion_object', color: '#FF6F00', label: t('Setting.set_motion_and_object') },
])

// ─── Lifecycle ───────────────────────────────────────────
onMounted(() => {
  initGrid()
  loadTemplates()
  PublicHoliday()
})

// 语言切换后重新翻译模板名称
watch(locale, () => loadTemplates())

const calWeekdays = ['一', '二', '三', '四', '五', '六', '日']
</script>

<template>
  <div class="recording-template">
    <!-- ── Left: template list ── -->
    <div class="tpl-left">
      <div class="tpl-left-title">
        <div class="tpl-btn" @click="addTemplate" :title="t('CommTableEdit.comm_add')">
          <i class="iconfont icon-xinjian"></i>
        </div>
        <div class="tpl-btn" @click="deleteTemplate" :title="t('CommTableEdit.comm_delete')">
          <i class="iconfont icon-lajitong1"></i>
        </div>
      </div>
      <div class="tpl-left-list">
        <div
          v-for="(item, index) in templates"
          :key="item.id"
          :class="['tpl-list-item', { active: index === isActive }]"
          @click="handleSelectTemplate(item, index)"
        >
          <!-- Normal display -->
          <template v-if="index !== operationVis">
            <span class="tpl-name-btn">{{ item.name }}</span>
            <i
              v-if="index === isActive"
              class="iconfont icon-bianji tpl-edit-icon"
              @click.stop="startRename(index)"
            ></i>
          </template>
          <!-- Rename input -->
          <template v-else>
            <el-input v-model="item.name" class="tpl-rename-input" @click.stop />
            <i class="iconfont icon-wancheng tpl-action-icon" @click.stop="confirmRename(item)"></i>
            <i class="iconfont icon-guanbi tpl-action-icon" @click.stop="cancelRename"></i>
          </template>
        </div>
      </div>
    </div>

    <!-- ── Right: grid + settings ── -->
    <div class="tpl-right">
      <!-- Top action bar -->
      <div class="tpl-top-bar">
        <el-button class="btn-holiday" @click="Add">
          {{ t('Setting.set_public_holiday_configuration') }}
        </el-button>
        <div class="btn-group">
          <el-button class="btn-reset" @click="resetTemplate">{{ t('CommTableEdit.comm_reset') }}</el-button>
          <el-button class="btn-save" @click="saveTemplate">{{ t('CommTableEdit.comm_save') }}</el-button>
        </div>
      </div>

      <template v-if="isTemplateSelected">
        <!-- Time grid + copy column -->
        <div class="grid-wrapper">
          <div
            id="kuang"
            :style="{ width: kuangObj.width + 'px', height: kuangObj.height + 'px', top: kuangObj.top + 'px', left: kuangObj.left + 'px' }"
          ></div>
          <table class="calendar-table" style="width:1000px">
            <thead>
              <tr>
                <td class="row-label-cell"></td>
                <td colspan="2" v-for="h in tableHeader" :key="h" class="hour-label">{{ h }}</td>
              </tr>
            </thead>
            <tbody
              @mousedown.prevent.stop="kuangDown"
              @mouseup.prevent.stop="kuangUp"
              @mousemove.prevent.stop="kuangMove"
              @mouseleave.prevent.stop="kuangLeave"
            >
              <tr v-for="(row, rIdx) in rowUnit" :key="rIdx">
                <td class="row-label">
                  <template v-if="rIdx===0">{{ t('Common.comm_monday') }}</template>
                  <template v-else-if="rIdx===1">{{ t('Common.comm_tuesday') }}</template>
                  <template v-else-if="rIdx===2">{{ t('Common.comm_wednesday') }}</template>
                  <template v-else-if="rIdx===3">{{ t('Common.comm_thursday') }}</template>
                  <template v-else-if="rIdx===4">{{ t('Common.comm_friday') }}</template>
                  <template v-else-if="rIdx===5">{{ t('Common.comm_saturday') }}</template>
                  <template v-else-if="rIdx===6">{{ t('Common.comm_sunday') }}</template>
                  <template v-else>{{ t('Common.comm_public_holiday') }}</template>                </td>
                <td
                  v-for="(cell, cIdx) in row"
                  :key="cIdx"
                  class="time-cell"
                  :class="cell.class"
                  @mousedown.prevent="onCellMouseDown(cIdx, rIdx)"
                  @mouseup.prevent="onCellMouseUp(cIdx, rIdx)"
                >{{ cell.text }}</td>
              </tr>
              <tr class="spacer-row"><td colspan="49"></td></tr>
            </tbody>
          </table>

          <!-- Copy buttons column -->
          <div class="copy-col">
            <div v-for="(_, rIdx) in rowUnit" :key="rIdx" class="copy-row">
              <el-popover
                v-model:visible="copyPopoverVisible[rIdx]"
                placement="left"
                :title="t('Setting.set_copy_to')"
                width="460"
                trigger="click"
                @show="openCopyPopover(rIdx)"
              >
                <div class="copy-popover-body">
                  <div class="copy-day-grid">
                    <div
                      v-for="(opt, oIdx) in copyOptions[rIdx]"
                      :key="oIdx"
                      class="copy-day-item"
                      :class="{ 'is-break': oIdx === 4 || oIdx === 8 }"
                    >
                      <span>{{ opt.label }}</span>
                      <el-button
                        size="small"
                        :disabled="opt.disabled"
                        :class="['day-check-btn', { checked: opt.checked }]"
                        @click="toggleCopyDay(rIdx, oIdx)"
                      />
                    </div>
                  </div>
                  <div class="copy-footer">
                    <el-button @click="closeCopyPopover(rIdx)">{{ t('CommTableEdit.comm_cancel') }}</el-button>
                    <el-button type="primary" @click="confirmCopy(rIdx)">{{ t('CommTableEdit.comm_ok') }}</el-button>
                  </div>
                </div>
                <template #reference>
                  <i v-show="activeRow === rIdx" class="iconfont icon-fuzhi copy-icon"></i>
                </template>
              </el-popover>
            </div>
          </div>
        </div>

        <!-- Draw type legend -->
        <div class="draw-type-bar">
          <div class="stream-select">
            <span>{{ t('CommDev.comm_dev_stream') }}</span>
            <el-select v-model="streamType" style="width:120px;margin-left:10px;">
              <el-option :label="t('CommDev.comm_dev_main_stream')" value="main" />
              <el-option :label="t('CommDev.comm_dev_sub_stream')" value="sub" />
            </el-select>
          </div>
          <div class="type-legend">
            <div
              v-for="item in drawTypes"
              :key="item.value"
              class="legend-item"
              @click="setDrawType(item.value)"
            >
              <div
                class="legend-color"
                :style="{ background: item.color }"
                :class="{ selected: drawType === item.value }"
              ></div>
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>

        <!-- Settings form -->
        <div class="settings-form" v-if="clickItem">
          <el-form :model="clickItem" inline label-width="150px" label-position="left">
            <el-form-item :label="t('Setting.set_pre_record')" style="width:350px;">
              <el-input v-model="clickItem.preRecInSecond" style="width:170px">
                <template #suffix>{{ t('Common.comm_s') }}</template>
              </el-input>
            </el-form-item>
            <el-form-item :label="t('Setting.set_post_record')" style="width:350px;">
              <el-input v-model="clickItem.postRecInSecond" style="width:170px">
                <template #suffix>{{ t('Common.comm_s') }}</template>
              </el-input>
            </el-form-item>
            <el-form-item :label="t('Setting.set_anr_max_time')">
              <el-input v-model="clickItem.ANRTimeInHour" style="width:170px">
                <template #suffix>{{ t('SystemInfo.system_hour') }}</template>
              </el-input>
            </el-form-item>
            <el-form-item :label="t('Setting.set_record_expire_day')" style="width:350px;">
              <div class="input-with-hint">
                <el-input v-model="clickItem.RecordingExpireInDay" style="width:170px">
                  <template #suffix>{{ t('Common.comm_day') }}</template>
                </el-input>
                <p class="expire-hint">（{{ t('Setting.set_0_auto') }}）</p>
              </div>
            </el-form-item>
            <el-form-item :label="t('Setting.set_enable_anr')" style="width:350px;">
              <el-switch v-model="clickItem.ANR" />
            </el-form-item>
          </el-form>
        </div>
      </template>
    </div>

    <!-- ── Public Holiday Dialog（变量名/逻辑完全对照 uscweb）── -->
    <el-dialog
      v-model="dialogFormVisible"
      width="680px"
      :title="t('Setting.set_public_holiday_configuration')"
    >
      <!-- 年月导航栏，对照 uscweb .YearMonth -->
      <div class="holiday-nav">
        <el-select
          v-model="holiday"
          :placeholder="t('Setting.set_holiday')"
          style="width:90px;"
          @change="ChangeHolidy"
        >
          <el-option v-for="h in OptionHoliday" :key="h.value" :label="h.label" :value="h.value" />
        </el-select>
        <el-select v-model="Year" style="width:90px;margin:0 16px;" @change="ChangeYearMonth">
          <el-option v-for="y in OptionYear" :key="y.value" :label="y.label" :value="y.value" />
        </el-select>
        <span class="nav-arrow" @click="ChangeMonth('prev', 1)">&lt;</span>
        <el-select v-model="Month" style="width:80px;margin:0 10px;" @change="ChangeYearMonth">
          <el-option v-for="m in OptionMonth" :key="m.value" :label="m.label" :value="m.value" />
        </el-select>
        <span class="nav-arrow" @click="ChangeMonth('next', 1)">&gt;</span>
        <el-button size="small" class="today-btn" @click="clickToday">{{ t('Setting.set_today') }}</el-button>
      </div>

      <div class="holiday-dialog">
        <div class="occupying"></div>
        <div class="holiday-calendar-wrap">
          <div class="cal-weekday-row">
            <div v-for="d in calWeekdays" :key="d" class="cal-weekday">{{ d }}</div>
          </div>
          <div class="cal-body">
            <div
              v-for="(cell, idx) in calendarDays"
              :key="idx"
              class="cal-cell"
              :class="{
                'cal-cell-overflow': !cell.isCurrentMonth,
                'cal-cell-selected': cell.isCurrentMonth && isDateSelected(cell.dayStr)
              }"
              @click="cell.isCurrentMonth && toggleDate(cell.dayStr)"
            >{{ cell.date }}</div>
          </div>
        </div>
        <div class="occupying-right"></div>
        <!-- 已配置日期列表，对照 uscweb .getPublicHoliday -->
        <div class="holiday-list">
          <div class="holiday-list-title">{{ t('Setting.set_planned_date') }}</div>
          <div class="holiday-list-content">
            <template v-for="item in tableData" :key="item.publicHolidayId">
              <div
                v-for="(h, idx) in item.publicHoliday.publicHoliday"
                :key="h.holiday"
                class="holiday-entry"
              >
                <span>{{ item.year }}-{{ h.holiday }}</span>
                <i
                  class="iconfont icon-lajitong del-icon"
                  @click="DeletePublicHoliday(item, h, idx)"
                ></i>
              </div>
            </template>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="dialogFormVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button type="primary" @click="platformyes">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.recording-template {
  display: flex;
  width: 100%;
  height: 100%;

  /* ── Left list ── */
  .tpl-left {
    width: 16%;
    min-width: 290px;
    background-color: #1B1B1B;
    display: flex;
    flex-direction: column;

    &::-webkit-scrollbar { display: none; }

    .tpl-left-title {
      display: flex;
      height: 5%;
      min-height: 32px;
      .tpl-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        i { font-size: 16px; color: #fff; }
        &:first-child { background: #353535; }
        &:last-child  { background: #2A2A2A; }
      }
    }

    .tpl-left-list {
      flex: 1;
      overflow-y: auto;
      &::-webkit-scrollbar { display: none; }

      .tpl-list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 36px;
        cursor: pointer;

        &.active { background-color: #0399FE; }

        /* 名称 span — 替换 el-button，彻底避免 EP 居中/间距问题 */
        .tpl-name-btn {
          flex: 1;
          padding: 0 0 0 15px;
          font-size: 13px;
          color: #fff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tpl-edit-icon  { cursor: pointer; font-size: 14px; color: #fff; margin-right: 15px; }
        .tpl-rename-input { flex: 1; margin: 0 4px; }
        .tpl-action-icon  { cursor: pointer; font-size: 14px; margin-left: 4px; color: #fff; }
      }
    }
  }

  /* ── Right panel ── */
  .tpl-right {
    flex: 1;
    overflow: auto;
    padding: 10px 10px 10px 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .tpl-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      line-height: 27px;
      margin-bottom: 2px;

      .btn-holiday {
        border: 1px solid #177DDC !important;
        background: #177DDC !important;
        border-radius: 2px !important;
        font-size: 12px;
        font-weight: 500;
        padding: 4px 10px !important;
        height: auto !important;
        :deep(span) { color: #fff !important; }
      }

      .btn-group {
        display: flex;
        gap: 6px;
        .btn-reset {
          border: 1px solid #3ABBFE !important;
          background: transparent !important;
          border-radius: 2px !important;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 10px !important;
          height: auto !important;
          :deep(span) { color: #32B3FE !important; }
        }
        .btn-save {
          border: none !important;
          background: #177DDC !important;
          border-radius: 2px !important;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 10px !important;
          height: auto !important;
          margin-right: 20px;
          :deep(span) { color: #fff !important; }
        }
      }
    }
  }
}

/* ── Grid wrapper ── */
.grid-wrapper {
  display: flex;
  align-items: flex-start;
  user-select: none;
  overflow-x: auto;
  margin-left: 10px;
  position: relative;
}

#kuang {
  position: absolute;
  background-color: #0399FE;
  opacity: 0.3;
  pointer-events: none;
  z-index: 10;
}

/* ── Time table ── */
.calendar-table {
  border-collapse: separate;
  border-spacing: 1px;
  background-color: #181818;
  border-radius: 4px;

  tr, td, th {
    font-size: 12px;
    text-align: center;
    min-width: 25px;
    line-height: 1.8em;
    transition: background 200ms ease;
  }

  thead td { background: #353535; }
  .row-label-cell { width: 100px; background: #353535; }

  tbody tr { height: 30px; }

  td.row-label {
    background: #353535;
    width: 100px;
    white-space: nowrap;
    font-size: 12px;
    text-align: center;
  }

  tr.spacer-row td { background: #353535; }

  td.time-cell {
    background: #292929;
    width: 25px;
    cursor: pointer;

    &:hover                     { background: #ccc; }
    &.ui-selected               { background: #0399FE !important; }
    &.ui-selected:hover         { background: #0399FE; }
    &.ui-selected-motion        { background: #FF443B !important; }
    &.ui-selected-object        { background: #FDD23A !important; }
    &.ui-selected-motion-object { background: #FF6F00 !important; }
  }
}

/* ── Copy column ── */
.copy-col {
  display: flex;
  flex-direction: column;
  width: 35px;
  background: #353535;
  /* 撑满 grid-wrapper 全高，覆盖 spacer-row 右侧空缺 */
  align-self: stretch;
  /* border-spacing:1px 在表格外边缘各加 1px、thead 行高约 22px、thead/tbody 间加 1px = 24px */
  padding-top: 24px;

  .copy-row {
    /* 数据行高 30px + 行间 border-spacing 1px = 31px，保证每行图标精确对齐 */
    height: 31px;
    display: flex;
    align-items: center;
    justify-content: center;
    /* el-popover 的 reference wrapper 默认 inline，穿透确保它撑满整行 */
    :deep(.el-popover__reference-wrapper) {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .copy-icon { font-size: 16px; cursor: pointer; color: #fff; &:hover { color: #0399FE; } }
  }
}

/* ── Copy popover（全局，不能 scoped）── */
/* 用 :deep 穿透以覆盖 el-popover */
</style>

/* Copy popover 全局样式（必须放在非 scoped 的 style 块中） */
<style lang="scss">
.copy-popover-body {
  .copy-day-grid {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 10px;

    .copy-day-item {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      width: 90px;      

      span {
        height: 30px;
        line-height: 30px;
        text-align: center;
        font-size: 12px;
      }

      .day-check-btn.el-button {
        width: 64px;
        height: 30px;
        line-height: 5px;
        text-align: right;
        border: 0 !important;
        border-radius: 0 !important;
        padding: 0 !important;
        background-color: #353535;

        &.checked {
          background-color: #0399FE !important;
        }
        &.is-disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }
    }
  }
  .copy-footer {
    display: flex;
    justify-content: center;
    height: 45px;
    align-items: center;
    gap: 10px;
  }
}
</style>

<style scoped lang="scss">
/* ── Draw type bar ── */
.draw-type-bar {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  height: 120px;
  margin-left: 10px;
  padding-left: 100px;
  background-color: #353535;
  border-top: 1px solid #000000;

  .stream-select {
    width: 16%;
    height: 100%;
    display: flex;
    align-items: center;
    font-size: 13px;
    flex-shrink: 0;
  }

  .type-legend {
    display: flex;
    align-items: center;
    height: 100%;

    .legend-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      height: 56px;
      margin: 0 25px;
      font-size: 12px;

      .legend-color {
        width: 25px;
        height: 25px;
        border-radius: 5px;
        margin: 0 30px;
        border: 2px solid transparent;
        &.selected { border-color: #0399FE; }
      }
    }

    .legend-item:first-child { margin-left: 0; }
  }
}

/* ── Settings form ── */
.settings-form {
  margin-left: 10px;
  margin-top: 1px;
  padding: 20px;
  background-color: #353535;

  :deep(.el-form-item) { margin-bottom: 16px; }
  :deep(.el-form-item__label) { font-size: 12px; }

  .expire-hint {
    position: absolute;
    bottom: -23px;
    margin: 0;
    font-size: 12px;
    color: #FE5003;
    white-space: nowrap;
  }

  .input-with-hint {
    position: relative;
    display: flex;
    flex-direction: column;
  }

}

/* ── Holiday dialog ── */
/* 年月导航栏 */
.holiday-nav {
  display: flex;
  align-items: center;
  height: 80px;
  padding-left: 50px;
  gap: 4px;
  .nav-arrow {
    cursor: pointer;
    padding: 0 6px;
    font-size: 14px;
    user-select: none;
    &:hover { color: #0399FE; }
  }
  .today-btn {
    margin: 0 20px;
    min-width: 88px;
    height: 32px;
    border: 1px solid #0399FE;
    color: #0399FE;
    background: transparent;
  }
}

.holiday-dialog {
  display: flex;
  justify-content: flex-start;

  .occupying       { width: 30px; flex-shrink: 0; }
  .occupying-right { width: 50px; flex-shrink: 0; }

  /* 日历区 */
  .holiday-calendar-wrap {
    width: 60%;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    height: 485px;

    /* 星期表头 */
    .cal-weekday-row {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      height: 41px;
      .cal-weekday {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        border: 1px solid #2a2a2a;
      }
    }

    /* 日期格子，6行×(485-41)/6 ≈ 74px/行 */
    .cal-body {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      grid-auto-rows: calc((485px - 41px) / 6);

      .cal-cell {
        border: 1px solid #2a2a2a;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        transition: background 200ms ease;

        &:not(.cal-cell-overflow) { cursor: pointer; }
        &:not(.cal-cell-overflow):hover { background: rgba(3,153,254,0.15); }

        &.cal-cell-selected {
          background: #0399FE !important;
          color: #fff;
        }

        /* 上/下月溢出日：灰色显示 */
        &.cal-cell-overflow {
          color: #555;
          cursor: default;
        }
      }
    }
  }

  /* 已选日期列表 */
  .holiday-list {
    width: 31%;

    .holiday-list-title {
      padding: 10px 0;
      padding-left: 20px;
      font-weight: 400;
    }

    .holiday-list-content {
      overflow-y: auto;
      height: 444px;
      padding-left: 20px;

      &::-webkit-scrollbar { width: 8px; height: 8px; }
      &::-webkit-scrollbar-thumb {
        border-radius: 5px;
        box-shadow: inset 0 0 5px rgba(218,218,218,0.2);
        background: rgba(218,218,218,0.2);
      }
      &::-webkit-scrollbar-track {
        box-shadow: inset 0 0 5px rgba(218,218,218,0.2);
        background: rgba(218,218,218,0.1);
      }

      .holiday-entry {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 15px 0;
        font-size: 13px;
        .del-icon { cursor: pointer; margin-right: 15px; &:hover { color: #ff4d4f; } }
      }
    }
  }
}
</style>