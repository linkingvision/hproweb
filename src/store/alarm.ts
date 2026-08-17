import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AlarmEventItem, AlarmEventStateCount } from '@/api/alarmEvent'

/**
 * 全局告警事件数据 store
 * 不做持久化：内存级跨页面保持，刷新后重新拉取。
 * View.vue / AlarmSearch / AlarmPopup 均可读写，避免切换页面时数据丢失。
 */
export const useAlarmStore = defineStore('alarm', () => {
  const tableData = ref<any[]>([])
  const total = computed(() => tableData.value.length)
  const popupVisible = ref(false)
  const activeState = ref(1)
  const stateCounts = ref<AlarmEventStateCount>({})
  const newCount = ref(0)
  const lastEvent = ref<AlarmEventItem | null>(null)
  const refreshKey = ref(0)

  /** 替换全量数据 */
  function updateAlarmData(list: any[]) {
    tableData.value = list
  }

  /** 头部插入一条实时事件，超过70条时移除末尾 */
  function addAlarmItem(item: any) {
    tableData.value.unshift(item)
    if (tableData.value.length > 70) {
      tableData.value.pop()
    }
  }

  function openPopup(stateLevel = 1) {
    activeState.value = Number(stateLevel) || 1
    popupVisible.value = true
  }

  function closePopup() {
    popupVisible.value = false
  }

  function setStateCounts(counts: AlarmEventStateCount) {
    stateCounts.value = counts || {}
    newCount.value = counts?.new || 0
  }

  function setNewCount(count: number) {
    newCount.value = count || 0
  }

  function setLastEvent(item: AlarmEventItem | null) {
    lastEvent.value = item
  }

  function markRefresh() {
    refreshKey.value += 1
  }

  return {
    tableData,
    total,
    popupVisible,
    activeState,
    stateCounts,
    newCount,
    lastEvent,
    refreshKey,
    updateAlarmData,
    addAlarmItem,
    openPopup,
    closePopup,
    setStateCounts,
    setNewCount,
    setLastEvent,
    markRefresh
  }
})
