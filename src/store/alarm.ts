import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 全局告警事件数据 store（对照 uscweb Vuex alarmData 模块）
 * 不做持久化：内存级跨页面保持，刷新后重新拉取。
 * View.vue / 未来的 Alarm 页面均可读写，避免切换页面时数据丢失。
 */
export const useAlarmStore = defineStore('alarm', () => {
  const tableData = ref<any[]>([])
  const total = computed(() => tableData.value.length)

  /** 替换全量数据（初始 REST 拉取时使用，对照 uscweb updateAlarmData） */
  function updateAlarmData(list: any[]) {
    tableData.value = list
  }

  /** 头部插入一条实时事件，超过70条时移除末尾（对照 uscweb addAlarmItem） */
  function addAlarmItem(item: any) {
    tableData.value.unshift(item)
    if (tableData.value.length > 70) {
      tableData.value.pop()
    }
  }

  return { tableData, total, updateAlarmData, addAlarmItem }
  // 注意：不配置 persist，数据只存活于当前 session，刷新后重新加载
})
