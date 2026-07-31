<template>
  <div class="liveview TimeTemplate">
    <!-- 左侧：模板列表 -->
    <div class="liveview_left TimeTemplate_left">
      <div class="TimeTemplate_left_title">
        <div class="TimeTemplate_add" @click="addTimeTemplate">
          <i class="iconfont icon-xinjian"></i>
        </div>
        <div class="TimeTemplate_delete" @click="deleteTemplate">
          <i class="iconfont icon-lajitong1"></i>
        </div>
      </div>
      <div class="TimeTemplate_left_list">
        <div v-for="(item, index) in templates" :key="item.id"
          :class="{ active: index === isActive }" @click="handleClick(item, index)">
          <div v-if="index !== operationVis"
            style="display:flex;justify-content:space-between;align-items:center;">
            <el-button style="background:transparent;border:0px;">{{ item.name }}</el-button>
            <span v-if="index === isActive && item.id > 4" style="margin-right:15px;"
              @click.stop="updateTemplateName(item, index)">
              <i class="iconfont icon-bianji"></i>
            </span>
          </div>
          <div v-else style="display:flex;justify-content:space-between;align-items:center;">
            <el-input class="EditName" v-model="item.name"></el-input>
            <span v-if="index === isActive && item.id > 4" style="margin-right:15px;">
              <i class="iconfont icon-wancheng" style="margin-right:15px;"
                @click.stop="updateNameConfirm(item)"></i>
              <i class="iconfont icon-guanbi" @click.stop="operationVis = -1"></i>
            </span>
          </div>
        </div>
      </div>
    </div>
    <!-- 右侧：周时间表格 -->
    <div class="liveview_right">
      <div class="sdk_button1" style="display:flex;justify-content:space-between;">
        <div class="button_edi">
          <el-button class="btn-holiday" @click="Add">
            {{ t('Setting.set_public_holiday_configuration') }}
          </el-button>
        </div>
        <div class="button_edi" style="display:flex;">
          <el-button class="btn-delete" @click="deleteTemplateContent">
            {{ t('CommTableEdit.comm_delete') }}
          </el-button>
          <el-button class="btn-save" @click="saveTemplate">
            {{ t('CommTableEdit.comm_save') }}
          </el-button>
        </div>
      </div>
      <div class="byted-weektime" v-if="isTimeTemplate" style="margin-left:10px;display:flex;">
        <div class="calendar">
          <table class="calendar-table" style="width:1000px">
            <thead class="calendar-head">
              <tr>
                <td></td><td></td><td></td><td></td>
                <td colspan="2" v-for="h in tableHeader" :key="h">{{ h }}</td>
              </tr>
            </thead>
            <tbody @mousemove.prevent.stop="kuangMove" @mouseleave.prevent.stop="kuangLeave"
              @mousedown.prevent.stop="kuangDown" @mouseup.prevent.stop="kuangUp">
              <div id="kuang" :style="{ width: kuangObj.width+'px', height: kuangObj.height+'px',
                top: kuangObj.top+'px', left: kuangObj.left+'px' }"></div>
              <tr>
                <td colspan="4">{{ t('Common.comm_monday') }}</td>
                <td v-for="(item,i) in rowUnit[0]" :key="i" class="calendar-atom-time" :class="item.class"
                  @mousedown.prevent="handleMouseDown(i,0)" @mouseup.prevent="handleMouseUp(i,0)"></td>
              </tr>
              <tr>
                <td colspan="4">{{ t('Common.comm_tuesday') }}</td>
                <td v-for="(item,i) in rowUnit[1]" :key="i" class="calendar-atom-time" :class="item.class"
                  @mousedown.prevent="handleMouseDown(i,1)" @mouseup.prevent="handleMouseUp(i,1)"></td>
              </tr>
              <tr>
                <td colspan="4">{{ t('Common.comm_wednesday') }}</td>
                <td v-for="(item,i) in rowUnit[2]" :key="i" class="calendar-atom-time" :class="item.class"
                  @mousedown.prevent="handleMouseDown(i,2)" @mouseup.prevent="handleMouseUp(i,2)"></td>
              </tr>
              <tr>
                <td colspan="4">{{ t('Common.comm_thursday') }}</td>
                <td v-for="(item,i) in rowUnit[3]" :key="i" class="calendar-atom-time" :class="item.class"
                  @mousedown.prevent="handleMouseDown(i,3)" @mouseup.prevent="handleMouseUp(i,3)"></td>
              </tr>
              <tr>
                <td colspan="4">{{ t('Common.comm_friday') }}</td>
                <td v-for="(item,i) in rowUnit[4]" :key="i" class="calendar-atom-time" :class="item.class"
                  @mousedown.prevent="handleMouseDown(i,4)" @mouseup.prevent="handleMouseUp(i,4)"></td>
              </tr>
              <tr>
                <td colspan="4">{{ t('Common.comm_saturday') }}</td>
                <td v-for="(item,i) in rowUnit[5]" :key="i" class="calendar-atom-time" :class="item.class"
                  @mousedown.prevent="handleMouseDown(i,5)" @mouseup.prevent="handleMouseUp(i,5)"></td>
              </tr>
              <tr>
                <td colspan="4">{{ t('Common.comm_sunday') }}</td>
                <td v-for="(item,i) in rowUnit[6]" :key="i" class="calendar-atom-time" :class="item.class"
                  @mousedown.prevent="handleMouseDown(i,6)" @mouseup.prevent="handleMouseUp(i,6)"></td>
              </tr>
              <tr>
                <td colspan="4" style="white-space:nowrap;">{{ t('Common.comm_public_holiday') }}</td>
                <td v-for="(item,i) in rowUnit[7]" :key="i" class="calendar-atom-time" :class="item.class"
                  @mousedown.prevent="handleMouseDown(i,7)" @mouseup.prevent="handleMouseUp(i,7)"></td>
              </tr>
              <tr><td colspan="52"></td></tr>
            </tbody>
          </table>
        </div>
        <!-- 每行复制按钮 -->
        <div class="copyWeek">
          <div class="copy" v-for="(_, idx) in 8" :key="idx" style="height:30px;line-height:30px;">
            <el-popover :ref="(el: any) => { if (el) popoverRefs[idx] = el }"
              placement="left" :title="t('Setting.set_copy_to')" :width="480" trigger="click">
              <div>
                <div style="display:flex;flex-direction:row;flex-wrap:wrap;width:100%;margin-bottom:10px;">
                  <div v-for="(sub, si) in subscribeType" :key="si">
                    <div class="copyContainer">
                      <span>{{ sub.label }}</span>
                      <el-button :class="si===4||si===8?'specialBtn':''" :style="getSelectStyle(sub.checked)"
                        :disabled="sub.disabled" @click="copyWeek(sub, si)"></el-button>
                    </div>
                  </div>
                </div>
                <div style="display:flex;justify-content:center;gap:8px;height:45px;align-items:center;">
                  <el-button class="form_butt1" @click="closePopover(idx)">{{ t('CommTableEdit.comm_cancel') }}</el-button>
                  <el-button class="form_butt" type="primary" @click="copyConfirm(idx)">{{ t('CommTableEdit.comm_ok') }}</el-button>
                </div>
              </div>
              <template #reference>
                <i class="copyBtn iconfont icon-fuzhi1" v-show="activeCopyDay === idx"
                  style="cursor:pointer;font-size:16px;"></i>
              </template>
            </el-popover>
          </div>
        </div>
      </div>
    </div>
    <!-- 公休日配置弹窗 -->
    <el-dialog v-model="dialogFormVisible" width="680px" :title="t('Setting.set_public_holiday_configuration')">
      <div class="holiday-nav">
        <el-select v-model="holiday" :placeholder="t('Setting.set_holiday')" style="width:90px;" @change="ChangeHolidy">
          <el-option v-for="item in optionHoliday" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>
        <el-select v-model="Year" style="width:90px;margin:0 16px;" @change="ChangeYearMonth">
          <el-option v-for="y in OptionYear" :key="y.value" :label="y.label" :value="y.value"></el-option>
        </el-select>
        <span class="nav-arrow" @click="ChangeMonth('prev',1)">&lt;</span>
        <el-select v-model="Month" style="width:80px;margin:0 10px;" @change="ChangeYearMonth">
          <el-option v-for="m in OptionMonth" :key="m.value" :label="m.label" :value="m.value"></el-option>
        </el-select>
        <span class="nav-arrow" @click="ChangeMonth('next',1)">&gt;</span>
        <el-button size="small" class="today-btn" @click="clickToday">{{ t('Setting.set_today') }}</el-button>
      </div>
      <div class="holiday-dialog">
        <div class="occupying"></div>
        <div class="holiday-calendar-wrap">
          <div class="cal-weekday-row">
            <div v-for="d in calWeekdays" :key="d" class="cal-weekday">{{ d }}</div>
          </div>
          <div class="cal-body">
            <div v-for="(cell, idx) in calendarDays" :key="idx"
              class="cal-cell"
              :class="{ 'cal-cell-overflow': !cell.isCurrentMonth, 'cal-cell-selected': cell.isCurrentMonth && isDateSelected(cell.dayStr) }"
              @click="cell.isCurrentMonth && toggleDate(cell.dayStr)">
              {{ cell.date }}
            </div>
          </div>
        </div>
        <div class="occupying-right"></div>
        <div class="holiday-list">
          <div class="holiday-list-title">{{ t('Setting.set_planned_date') }}</div>
          <div class="holiday-list-content">
            <template v-for="item in tableData" :key="item.publicHolidayId">
              <div v-for="(h, idx2) in item.publicHoliday.publicHoliday" :key="h.holiday" class="holiday-entry">
                <span>{{ item.year }}-{{ h.holiday }}</span>
                <i class="iconfont icon-lajitong del-icon" @click="DeletePublicHoliday(item, h, idx2)"></i>
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

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { HolidayUtil } from 'lunar-javascript'
import axios from '@/api/http'
import { useStore } from '@/store'

const { t } = useI18n()
const store = useStore()

// ── 左侧模板列表 ────────────────────────────────────────────
const templates = ref<any[]>([])
const isActive = ref(-1)
const operationVis = ref(-1)
const clickItem = ref<any>({})
const isTimeTemplate = ref(false)

// ── 时间表格 ────────────────────────────────────────────────
const tableHeader = ['00','01','02','03','04','05','06','07','08','09','10','11',
  '12','13','14','15','16','17','18','19','20','21','22','23']
const rowUnit = ref<any[][]>([])
const timeContent = ref<any[]>([])
const timeSection = ref<any[][]>([])
const beginDay = ref(0)
const beginTime = ref(0)
const downEvent = ref(false)
const activeCopyDay = ref(-1)

// ── 拖选框 ──────────────────────────────────────────────────
const kuangObj = reactive({ width:0, height:0, top:0, left:0, oldLeft:0, oldTop:0, flag:false })

// ── 复制 popover ────────────────────────────────────────────
const popoverRefs = ref<any[]>([])
const subscribeType = ref([
  { label: computed(() => t('Common.comm_monday')).value,    value:1, disabled:false, checked:false },
  { label: computed(() => t('Common.comm_tuesday')).value,   value:2, disabled:false, checked:false },
  { label: computed(() => t('Common.comm_wednesday')).value, value:3, disabled:false, checked:false },
  { label: computed(() => t('Common.comm_thursday')).value,  value:4, disabled:false, checked:false },
  { label: computed(() => t('Common.comm_friday')).value,    value:5, disabled:false, checked:false },
  { label: computed(() => t('Common.comm_saturday')).value,  value:6, disabled:false, checked:false },
  { label: computed(() => t('Common.comm_sunday')).value,    value:7, disabled:false, checked:false },
  { label: computed(() => t('Common.comm_public_holiday')).value, value:8, disabled:false, checked:false },
  { label: computed(() => t('Common.comm_check_all')).value, value:9, disabled:false, checked:false },
])

// ── 公休日弹窗 ──────────────────────────────────────────────
const dialogFormVisible = ref(false)
const tableData = ref<any[]>([])
const date = ref<string[]>([])
const holiday = ref('')
const Year = ref(new Date().getFullYear())
const Month = ref(new Date().getMonth() + 1)
const OptionYear = ref<any[]>([])
const OptionMonth = ref<any[]>([])
const optionHoliday = [
  { label: '元旦', value: '1' }, { label: '春节', value: '2' },
  { label: '清明节', value: '3' }, { label: '劳动节', value: '4' },
  { label: '端午节', value: '5' }, { label: '中秋节', value: '6' },
  { label: '国庆节', value: '7' },
]

// ── 日历格数据（与 RecordingTemplate 完全一致）────────────────
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
const calWeekdays = ['一', '二', '三', '四', '五', '六', '日']

// ── API：获取模板列表 ───────────────────────────────────────
async function loadTemplates() {
  const res: any = await axios({ url: '/uapi/v1/TimeTemplate', method: 'GET' })
  if (res.status !== 200 || res.data.msg !== 'Success') return
  templates.value = res.data.result.map((d: any) => {
    const nameMap: Record<string, string> = {
      'Everyday template': t('Setting.set_everyday_template'),
      'Weekend template':  t('Setting.set_weekend_template'),
      'Workday template':  t('Setting.set_workday_template'),
      'Public holiday template': t('Setting.set_public_holiday_template'),
      'Empty Template':    t('Setting.set_empty_template'),
    }
    return {
      id: d.timeTemplateId,
      name: nameMap[d.timeTemplateName] ?? d.timeTemplateName,
      timeRange: d.setting.templateData,
      uuid: d.uuid,
    }
  })
}

// ── API：获取公休日 ─────────────────────────────────────────
async function PublicHoliday(resetKey = false) {
  const res: any = await axios({ url: '/uapi/v1/PublicHoliday', method: 'GET' })
  if (res.status !== 200 || res.data.msg !== 'Success') return
  tableData.value = []
  date.value = []
  for (const d of res.data.result) {
    tableData.value.push({
      publicHolidayId: d.publicHolidayId, year: d.year,
      publicHoliday: d.setting, uuid: d.uuid,
    })
    for (const h of d.setting.publicHoliday)
      date.value.push(d.year + '-' + h.holiday)
  }
}

// ── 模板列表操作 ────────────────────────────────────────────
function handleClick(item: any, index: number) {
  clearGrid()
  clickItem.value = item
  isActive.value = index
  operationVis.value = -1
  isTimeTemplate.value = true
  if (!item.timeRange) return
  for (const row of item.timeRange) {
    for (const cell of row.timeRange) {
      if (cell.enable === 'true' || cell.enable === 'ON') {
        handleMouseDown(cell.index - 1, row.date - 1, 'init')
        handleMouseUp(cell.index - 1, row.date - 1, 'init')
      }
    }
  }
}

async function addTimeTemplate() {
  const res: any = await axios({
    url: '/uapi/v1/TimeTemplate', method: 'POST',
    data: { timeTemplateName: t('Liveview.live_customization') + '1', setting: { templateData: [] } },
  })
  if (res.status === 200 && res.data.msg === 'Success') {
    await loadTemplates()
    ElMessage({ message: t('CommTableEdit.comm_add_successfully'), type: 'success', duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_add_failed'), type: 'error', duration: 5000 })
  }
}

async function deleteTemplate() {
  if (!clickItem.value.id) return
  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
      confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel'),
    })
    const res: any = await axios({ url: '/uapi/v1/TimeTemplate', method: 'DELETE', data: { ids: [clickItem.value.id] } })
    if (res.status === 200 && res.data.msg === 'Success') {
      await loadTemplates()
      isActive.value = -1; isTimeTemplate.value = false
      ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success', duration: 5000 })
    } else {
      const msg = res.data.code === 15007 ? 'Delete failed, rule event use this entity'
        : res.data.code === 15008 ? 'Delete failed, alarm rule use this entity'
        : t('CommTableEdit.comm_delete_failed')
      ElMessage({ message: msg, type: 'error', duration: 5000 })
    }
  } catch { }
}

async function deleteTemplateContent() {
  if (!clickItem.value.uuid) return
  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
      confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel'),
    })
    const res: any = await axios({
      url: '/uapi/v1/TimeTemplate', method: 'PUT',
      data: { uuid: clickItem.value.uuid, timeTemplateName: clickItem.value.name, setting: { templateData: [] } },
    })
    if (res.status === 200 && res.data.msg === 'Success') {
      await loadTemplates()
      ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success', duration: 5000 })
    }
  } catch { }
}

async function saveTemplate() {
  if (!clickItem.value.uuid) return
  function startEnd(k: number): [string, string] {
    const h = Math.floor(k / 2), m = k % 2 * 30
    const eh = Math.floor(k / 2), em = k % 2 !== 0 ? '59' : '29', es = '59'
    return [
      `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`,
      `${String(eh).padStart(2,'0')}:${em}:${es}`,
    ]
  }
  const templateData = rowUnit.value.map((row, i) => ({
    date: i + 1 === 7 ? 0 : i + 1,
    timeRange: row.map((cell, k) => {
      const [st, et] = startEnd(k + 1)
      return { startTime: st, endTime: et, enable: cell.class ? 'ON' : 'OFF', index: cell.timeData + 1 }
    }),
  }))
  const res: any = await axios({
    url: '/uapi/v1/TimeTemplate', method: 'PUT',
    data: { uuid: clickItem.value.uuid, timeTemplateName: clickItem.value.name, setting: { templateData } },
  })
  if (res.status === 200 && res.data.msg === 'Success') {
    await loadTemplates()
    ElMessage({ message: t('CommTableEdit.comm_save_successfully'), type: 'success', duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_save_failed'), type: 'error', duration: 5000 })
  }
}

function updateTemplateName(item: any, index: number) {
  operationVis.value = index
  nextTick(() => {
    const el = document.querySelector('.EditName input') as HTMLInputElement
    el?.focus()
  })
}

async function updateNameConfirm(item: any) {
  const res: any = await axios({
    url: '/uapi/v1/TimeTemplate', method: 'PUT',
    data: { uuid: item.uuid, timeTemplateName: item.name, setting: { templateData: item.timeRange } },
  })
  if (res.status === 200 && res.data.msg === 'Success') {
    operationVis.value = -1
    await loadTemplates()
    ElMessage({ message: t('CommTableEdit.comm_edit_successfully'), type: 'success', duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_edit_failed'), type: 'error', duration: 5000 })
  }
}

// ── 公休日配置 ──────────────────────────────────────────────
function Add() {
  dialogFormVisible.value = true
  holiday.value = ''
  OptionYear.value = []
  OptionMonth.value = []
  const now = new Date()
  Year.value = now.getFullYear()
  Month.value = now.getMonth() + 1
  for (let i = 1900; i <= 2050; i++)
    OptionYear.value.push({ label: i + t('Common.comm_year'), value: i })
  for (let i = 1; i <= 12; i++)
    OptionMonth.value.push({ label: i + t('Common.comm_month'), value: i })
}

function getSpringFestivalDate(year: number, name: string): string {
  const arr = HolidayUtil.getHolidays(year)
  for (const h of arr) {
    if ((h as any)._p?.name === name && !(h as any)._p?.work)
      return (h as any)._p.day
  }
  return ''
}

function ChangeHolidy() {
  const y = Year.value
  switch (holiday.value) {
    case '1': Month.value = 1; break
    case '2': { const d = getSpringFestivalDate(y,'春节').split('-'); Month.value = Number(d[1]); break }
    case '3': { const d = getSpringFestivalDate(y,'清明节').split('-'); Month.value = Number(d[1]); break }
    case '4': Month.value = 5; break
    case '5': Month.value = 6; break
    case '6': Month.value = 9; break
    case '7': Month.value = 10; break
  }
}

function ChangeYearMonth() { /* Year/Month already bound via v-model, calendarDays recomputes */ }

function ChangeMonth(dir: 'prev' | 'next') {
  let m = Month.value, y = Year.value
  dir === 'prev' ? m-- : m++
  if (m <= 0) { m = 12; y-- }
  else if (m > 12) { m = 1; y++ }
  Month.value = m; Year.value = y
}

function clickToday() {
  Year.value = new Date().getFullYear()
  Month.value = new Date().getMonth() + 1
}

async function platformyes() {
  dialogFormVisible.value = false
  const y = String(Year.value)
  const publicHoliday = date.value
    .filter(d => d.startsWith(y + '-'))
    .map(d => ({ holiday: d.substring(y.length + 1) }))
  if (publicHoliday.length === 0) { await PublicHoliday(); return }
  const existing = tableData.value.find(r => r.year === y)
  if (existing) {
    await UpdatePublicHoliday(existing, publicHoliday)
  } else {
    const res: any = await axios({
      url: '/uapi/v1/PublicHoliday', method: 'POST',
      data: { year: y, setting: { publicHoliday } },
    })
    if (res.status === 200 && res.data.msg === 'Success') {
      await PublicHoliday()
      ElMessage({ message: t('CommTableEdit.comm_add_successfully'), type: 'success', duration: 5000 })
    }
  }
}

async function UpdatePublicHoliday(item: any, publicHoliday: any[]) {
  await axios({ url: '/uapi/v1/PublicHoliday', method: 'DELETE', data: { ids: [item.publicHolidayId] } })
  const res: any = await axios({
    url: '/uapi/v1/PublicHoliday', method: 'POST',
    data: { year: item.year, setting: { publicHoliday } },
  })
  if (res.status === 200 && res.data.msg === 'Success') {
    await PublicHoliday()
    ElMessage({ message: t('CommTableEdit.comm_edit_successfully'), type: 'success', duration: 5000 })
  }
}

async function DeletePublicHoliday(item: any, item1: any) {
  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
      confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel'),
    })
    const remaining = item.publicHoliday.publicHoliday.filter((h: any) => h.holiday !== item1.holiday)
    await axios({ url: '/uapi/v1/PublicHoliday', method: 'DELETE', data: { ids: [item.publicHolidayId] } })
    if (remaining.length > 0) {
      await axios({ url: '/uapi/v1/PublicHoliday', method: 'POST',
        data: { year: item.year, setting: { publicHoliday: remaining } } })
    }
    await PublicHoliday()
    ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success', duration: 5000 })
  } catch { }
}

// ── 时间表格初始化 ──────────────────────────────────────────
function initGrid() {
  rowUnit.value = []
  timeContent.value = []
  timeSection.value = []
  for (let i = 0; i < 8; i++) {
    const arr: any[] = []
    for (let j = 0; j < 48; j++) arr.push({ class: null, timeData: j })
    rowUnit.value.push(arr)
    timeContent.value.push({ arr: [] })
    timeSection.value.push([])
  }
}

function handleMouseDown(i: number, day: number, init?: string) {
  if (day === -1) day = 6
  if (clickItem.value.id < 5 && !init) return
  downEvent.value = true
  beginDay.value = day
  beginTime.value = i
  if (!init) {
    activeCopyDay.value = -1
    nextTick(() => { activeCopyDay.value = day })
    subscribeType.value.forEach((item, idx) => { item.disabled = idx === day })
  }
}

function handleMouseUp(i: number, day: number, init?: string, data?: any) {
  if (day === -1) day = 6
  if (clickItem.value.id < 5 && !init) return
  if (!downEvent.value) return
  const begin = beginTime.value
  const start = Math.min(begin, i), end = Math.max(begin, i)
  const dayStart = Math.min(beginDay.value, day), dayEnd = Math.max(beginDay.value, day)

  function hasEmpty() {
    for (let x = dayStart; x <= dayEnd; x++)
      for (let y = start; y <= end; y++)
        if (rowUnit.value[x][y].class === null) return true
    return false
  }

  if (!data) {
    const adding = hasEmpty()
    for (let x = dayStart; x <= dayEnd; x++) {
      for (let y = start; y <= end; y++) {
        if (adding && rowUnit.value[x][y].class === null) {
          rowUnit.value[x][y].class = 'ui-selected'
          timeContent.value[x].arr.push(rowUnit.value[x][y].timeData)
        } else if (!adding) {
          rowUnit.value[x][y].class = null
          const idx = timeContent.value[x].arr.indexOf(rowUnit.value[x][y].timeData)
          if (idx > -1) timeContent.value[x].arr.splice(idx, 1)
        }
      }
    }
  } else {
    for (let x = dayStart; x <= dayEnd; x++) {
      for (let y = start; y <= end; y++) {
        if (data.type === 'on') {
          rowUnit.value[x][y].class = 'ui-selected'
          timeContent.value[x].arr.push(rowUnit.value[x][y].timeData)
        } else {
          rowUnit.value[x][y].class = null
          const idx = timeContent.value[x].arr.indexOf(rowUnit.value[x][y].timeData)
          if (idx > -1) timeContent.value[x].arr.splice(idx, 1)
        }
      }
    }
  }
  downEvent.value = false
}

function clearGrid() {
  rowUnit.value.forEach(row => row.forEach(cell => { cell.class = null }))
  timeContent.value.forEach(tc => { tc.arr = [] })
  timeSection.value.forEach(ts => { ts.length = 0 })
}

// ── 复制功能 ────────────────────────────────────────────────
function openPopover(idx: number) {
  subscribeType.value.forEach((item, i) => { item.checked = false; item.disabled = i === idx })
}
function copyWeek(item1: any, index1: number) {
  if (index1 === 8) {
    subscribeType.value.forEach(item => { if (!item.disabled) item.checked = !item1.checked })
  } else {
    item1.checked = !item1.checked
  }
}
function closePopover(idx: number) { popoverRefs.value[idx]?.hide() }
function copyConfirm(idx: number) {
  const row = rowUnit.value[idx]
  for (let i = 0; i < row.length; i++) {
    subscribeType.value.forEach((sub, k) => {
      if (sub.checked && k < 8) {
        const type = row[i].class ? 'on' : 'off'
        handleMouseDown(row[i].timeData, k, 'init')
        handleMouseUp(row[i].timeData, k, 'init', { type })
      }
    })
  }
  closePopover(idx)
}
function getSelectStyle(checked: boolean) {
  if (checked) return { backgroundColor: '#0399FE' }
  const m = store.darkMode
  return { backgroundColor: m === 'c-dark-theme' ? '#353535' : m === 'darkblue' ? '#040C1F' : '#DBDBDB' }
}

// ── 拖选框 ──────────────────────────────────────────────────
function kuangMove() {
  if (!kuangObj.flag || !downEvent.value) return
  const e = window.event as MouseEvent
  const x2 = e.layerX, y2 = e.layerY
  kuangObj.left = Math.min(kuangObj.oldLeft, x2)
  kuangObj.top = Math.min(kuangObj.oldTop, y2)
  kuangObj.width = Math.abs(x2 - kuangObj.oldLeft)
  kuangObj.height = Math.abs(y2 - kuangObj.oldTop)
}
function kuangDown() { kuangObj.flag = true; const e = window.event as MouseEvent; kuangObj.oldLeft = e.layerX; kuangObj.oldTop = e.layerY }
function kuangUp() { kuangObj.flag = false; Object.assign(kuangObj, { width:0, height:0, top:0, left:0 }) }
function kuangLeave() { kuangObj.flag = false; Object.assign(kuangObj, { width:0, height:0, top:0, left:0 }) }

onMounted(() => { initGrid(); loadTemplates(); PublicHoliday() })
</script>

<style scoped lang="scss">
.liveview {
  width: 100%; height: 100%;
  display: flex; justify-content: space-between;

  .liveview_left {
    width: 16%; min-width: 290px;
    overflow-y: auto;
    margin: 0;
    &::-webkit-scrollbar { display: none; }
  }

  .liveview_right {
    flex: 1; overflow: auto;
    .sdk_button1 { padding: 10px 10px 6px; line-height: 27px; }
    .button_edi { display: flex; position: relative; }
  }
}

/* 右侧按钮样式，对照uscweb .form_butt */
.btn-holiday {
  border: none !important;
  background: #177DDC !important;
  border-radius: 4px !important;
  padding: 4px 12px !important;
  height: auto !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  box-sizing: border-box;
  :deep(span) { color: #FFFFFF !important; }
}
.btn-delete {
  border: 1px solid #177DDC !important;
  background: transparent !important;
  border-radius: 4px !important;
  padding: 4px 12px !important;
  height: auto !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  box-sizing: border-box;
  margin-right: 10px !important;
  :deep(span) { color: #177DDC !important; }
}
.btn-save {
  border: none !important;
  background: #177DDC !important;
  border-radius: 4px !important;
  padding: 4px 12px !important;
  height: auto !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  margin-right: 20px !important;
  :deep(span) { color: #FFFFFF !important; }
}

.TimeTemplate_left {
  .TimeTemplate_left_title {
    display: flex; justify-content: space-between; align-items: center;
    color: #fff;
    .TimeTemplate_add {
      width: 50%; height: 32px; line-height: 32px; text-align: center; cursor: pointer;
      background: #353535;
      i { font-size: 18px; }
      &:hover { background: rgba(3,153,254,0.15); }
    }
    .TimeTemplate_delete {
      width: 50%; height: 32px; line-height: 32px; text-align: center; cursor: pointer;
      background: #2A2A2A;
      i { font-size: 18px; }
      &:hover { background: rgba(3,153,254,0.15); }
    }
  }
  .TimeTemplate_left_list {
    > div {
      padding: 4px 0; cursor: pointer;
      &:hover { background: rgba(3,153,254,0.12); }
      &.active { background-color: #0399FE; }
      .el-button { font-size: 13px; padding: 4px 16px; color: #FFFFFF; }
    }
    :deep(.EditName) {
      width: 60%; margin: 4px 16px;
      .el-input__inner { padding: 0 5px; }
    }
  }
}

/* 时间表格 */
.byted-weektime .calendar { -webkit-user-select: none; position: relative; display: inline-block; }
.byted-weektime .calendar .calendar-table { border-collapse: separate; border-spacing: 1px; background-color: #181818; border-radius: 4px; }
.byted-weektime .calendar .calendar-table tr .calendar-atom-time:hover { background: #ccc; }
.byted-weektime .calendar .calendar-table tr .ui-selected { background: #2F88FF !important; }
.byted-weektime .calendar .calendar-table tr,
.byted-weektime .calendar .calendar-table td,
.byted-weektime .calendar .calendar-table th {
  border: 0; background: #292929; font-size: 12px; text-align: center;
  min-width: 25px; line-height: 1.8em;
  transition: background 200ms ease;
}
.byted-weektime .calendar .calendar-table .calendar-head tr,
.byted-weektime .calendar .calendar-table .calendar-head td,
.byted-weektime .calendar .calendar-table tbody tr td:nth-child(1) { border: 0; }
.byted-weektime .calendar .calendar-table tbody tr { border: 0; height: 30px; }
#kuang { position: absolute; background-color: blue; opacity: 0.3; }

/* 复制列 */
.copyWeek { display: flex; flex-direction: column; margin-left: 4px; }
.copyBtn { font-size: 16px; cursor: pointer; }
:deep(.popoverCopy) {
  .copyContainer {
    display: flex; flex-direction: column; justify-content: space-between; width: 90px;
    span { height: 30px; line-height: 30px; text-align: center; }
    .el-button { height: 30px; border: 0; border-radius: 0; padding: 0; }
  }
}

/* 公休日弹窗（与 RecordingTemplate 完全一致）*/
.holiday-nav {
  display: flex; align-items: center; height: 80px; padding-left: 50px; gap: 4px;
  .nav-arrow { cursor: pointer; padding: 0 6px; font-size: 14px; user-select: none; &:hover { color: #0399FE; } }
  .today-btn { margin: 0 20px; min-width: 88px; height: 32px; border: 1px solid #0399FE; color: #0399FE; background: transparent; }
}

.holiday-dialog {
  display: flex; justify-content: flex-start;
  .occupying       { width: 30px; flex-shrink: 0; }
  .occupying-right { width: 50px; flex-shrink: 0; }

  .holiday-calendar-wrap {
    width: 60%; flex-shrink: 0; display: flex; flex-direction: column; height: 485px;
    .cal-weekday-row {
      display: grid; grid-template-columns: repeat(7, 1fr); height: 41px;
      .cal-weekday { display: flex; align-items: center; justify-content: center; font-size: 12px; border: 1px solid #2a2a2a; }
    }
    .cal-body {
      flex: 1; display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: calc((485px - 41px) / 6);
      .cal-cell {
        border: 1px solid #2a2a2a; display: flex; align-items: center; justify-content: center;
        font-size: 13px; transition: background 200ms ease;
        &:not(.cal-cell-overflow) { cursor: pointer; }
        &:not(.cal-cell-overflow):hover { background: rgba(3,153,254,0.15); }
        &.cal-cell-selected { background: #0399FE !important; color: #fff; }
        &.cal-cell-overflow { color: #555; cursor: default; }
      }
    }
  }

  .holiday-list {
    width: 31%;
    .holiday-list-title { padding: 10px 0 10px 20px; font-weight: 400; }
    .holiday-list-content {
      overflow-y: auto; height: 444px; padding-left: 20px;
      &::-webkit-scrollbar { width: 8px; height: 8px; }
      &::-webkit-scrollbar-thumb { border-radius: 5px; background: rgba(218,218,218,0.2); }
      &::-webkit-scrollbar-track { background: rgba(218,218,218,0.1); }
      .holiday-entry {
        display: flex; justify-content: space-between; align-items: center; margin: 15px 0; font-size: 13px;
        .del-icon { cursor: pointer; margin-right: 15px; &:hover { color: #ff4d4f; } }
      }
    }
  }
}
</style>
