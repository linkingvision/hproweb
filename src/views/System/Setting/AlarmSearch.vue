<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import AlarmEventTable from '@/components/alarm/AlarmEventTable.vue'
import AlarmOperationDialog from '@/components/alarm/AlarmOperationDialog.vue'
import type { AlarmEventItem } from '@/api/alarmEvent'
import { GetAlarmEventListApi } from '@/api/alarmEvent'
import { GetAlarmLevelListApi, GetAlarmOwnerListApi } from '@/api/configuration/alarmConfig'
import type { AlarmLevelOption } from '@/utils/alarmOptions'
import dayjs from 'dayjs'
import { useUserStore } from '@/store/user'

interface AlarmOwnerOption {
  uuid: string
  username: string
}

const { t } = useI18n()
const userStore = useUserStore()

const queryForm = reactive({
  beginTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
  endTime: new Date(),
  channelName: '',
  pageSize: 30,
  pageIndex: 1,
  username: userStore.username
})

const loading = ref(false)
const tableData = ref<AlarmEventItem[]>([])
const total = ref(0)
const operationVisible = ref(false)
const currentEvent = ref<AlarmEventItem | null>(null)
const alarmOwners = ref<AlarmOwnerOption[]>([])
const alarmLevels = ref<AlarmLevelOption[]>([])

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
    console.warn('[AlarmSearch] load options failed', error)
  }
}

const search = async () => {
  loading.value = true
  try {
    const res = await GetAlarmEventListApi({
      beginTime: dayjs(queryForm.beginTime).format('YYYY-MM-DDTHH:mm:ss+08:00'),
      endTime: dayjs(queryForm.endTime).format('YYYY-MM-DDTHH:mm:ss+08:00'),
      channelName: queryForm.channelName,
      moduleType: [],
      pageSize: queryForm.pageSize,
      pageIndex: queryForm.pageIndex,
      username: queryForm.username
    })
    if (res.status === 200 && res.data.code === 0) {
      tableData.value = res.data.result?.list || []
      total.value = res.data.result?.count || 0
    } else {
      ElMessage.error(t('CommTableEdit.comm_edit_failed'))
    }
  } catch (error) {
    ElMessage.error(t('CommTableEdit.comm_edit_failed'))
  } finally {
    loading.value = false
  }
}

const reset = () => {
  queryForm.endTime = new Date()
  queryForm.beginTime = new Date(Date.now() - 24 * 60 * 60 * 1000)
  queryForm.channelName = ''
  queryForm.pageSize = 30
  queryForm.pageIndex = 1
}

const handleSizeChange = (val: number) => {
  queryForm.pageSize = val
  queryForm.pageIndex = 1
  search()
}

const handleCurrentChange = (val: number) => {
  queryForm.pageIndex = val
  search()
}

const openOperation = (row: AlarmEventItem) => {
  currentEvent.value = { ...row }
  operationVisible.value = true
}

const handleSaved = () => {
  search()
}

onMounted(async () => {
  await loadOptions()
})
</script>

<template>
  <div class="alarm-search">
    <div class="search-info">
      <div class="search-bar">
        <div class="search-dates">
          <span class="time-label">{{ t('CommTime.comm_time_start') }}</span>
          <el-date-picker
            v-model="queryForm.beginTime"
            type="datetime"
            :placeholder="t('Common.comm_select_date_time')"
            style="margin-right: 30px;" />
          <span class="time-label">{{ t('CommTime.comm_time_end') }}</span>
          <el-date-picker
            v-model="queryForm.endTime"
            type="datetime"
            :placeholder="t('Common.comm_select_date_time')" />
        </div>
        <div class="search-channel">
          <span class="time-label">{{ t('SystemInfo.system_channel') }}</span>
          <el-input v-model="queryForm.channelName" clearable style="width: 200px" />
        </div>
        <div class="search-buttons">
          <el-button class="form_butt1" @click="reset" style="margin-right: 12px;">{{ t('CommTableEdit.comm_reset') }}</el-button>
          <el-button class="form_butt" type="primary" @click="search">{{ t('CommTableEdit.comm_search') }}</el-button>
        </div>
      </div>
    </div>

    <div class="table-container" v-loading="loading">
      <AlarmEventTable
        :data="tableData"
        :alarm-levels="alarmLevels"
        height="100%"
        @operate="openOperation" />
    </div>

    <div class="pagination-box">
      <el-pagination
        v-model:current-page="queryForm.pageIndex"
        v-model:page-size="queryForm.pageSize"
        :page-sizes="[10, 30, 50, 100, 500, 1000]"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
    </div>

    <AlarmOperationDialog
      v-model="operationVisible"
      :event="currentEvent"
      :alarm-owners="alarmOwners"
      :alarm-levels="alarmLevels"
      @saved="handleSaved" />
  </div>
</template>

<style scoped lang="scss">
.alarm-search {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .search-info {
    padding: 15px 20px;

    .search-bar {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      flex-wrap: nowrap;
      gap: 0;

      .search-dates {
        display: flex;
        align-items: center;
        min-width: 600px;
        margin-right: 30px;
      }

      .search-channel {
        display: flex;
        align-items: center;
        min-width: 230px;
        margin-right: 30px;
      }

      .time-label {
        margin-right: 10px;
        white-space: nowrap;
      }

      .search-buttons {
        display: flex;
        align-items: center;
      }
    }
  }

  .table-container {
    flex: 1;
    min-height: 0;
    padding: 0 10px;
  }

  .pagination-box {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 12px;
  }
}
</style>
