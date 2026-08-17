<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  GetNodeListApi,
  GetAutoBackupConfigApi,
  SaveAutoBackupConfigApi,
  GetBackupPathsApi,
  SaveBackupPathApi
} from '@/api/system'

const { t } = useI18n()

const nodeList = ref<any[]>([])
const selectedNodeId = ref<string>('')

const autoBackupConfig = ref({
  uuid: '',
  isEvent: false,
  enabled: false,
  backupType: 'USC_EVERY_DAY',
  startTime: new Date() as Date | null
})

const backupPaths = ref<string[]>([])
const selectedBackupPath = ref<string>('')

const backupTypeOptions = computed(() => [
  { value: 'USC_EVERY_DAY', label: t('Analytics.ana_every_day') },
  { value: 'USC_EVERY_WEEK', label: t('Analytics.ana_weekly') }
])

const getNodeList = async () => {
  const res = await GetNodeListApi()
  if (res?.status !== 200) return
  if (res.data.msg === 'Success') {
    const list = res.data.result.list
    nodeList.value = list
    if (list.length > 0) {
      selectedNodeId.value = list[0].nodeId
    }
  }
}

const getAutoBackupConfig = async () => {
  const res = await GetAutoBackupConfigApi()
  if (res?.status !== 200) return
  if (res.data.code === 0 || res.data.msg === 'Success') {
    const data = res.data.result
    autoBackupConfig.value = {
      uuid: data.uuid || '',
      enabled: data.enabled || false,
      isEvent: data.isEvent || false,
      backupType: data.backupType || 'USC_EVERY_DAY',
      startTime: data.startTime ? new Date(data.startTime) : new Date()
    }
    selectedBackupPath.value = data.backupPath || ''
  }
}

const getBackupPaths = async (nodeId: string) => {
  const res = await GetBackupPathsApi(nodeId)
  if (res?.status !== 200) return
  if (res.data.code === 0 || res.data.msg === 'Success') {
    backupPaths.value = res.data.result?.paths || []
    selectedBackupPath.value = res.data.result?.currentPath || ''
  }
}

const onNodeChange = () => {
  if (selectedNodeId.value) {
    getBackupPaths(selectedNodeId.value)
  }
}

const nextBackupTime = (): string => {
  let resultTime: Date
  const now = new Date()
  const selectedTime = new Date(autoBackupConfig.value.startTime!)

  if (autoBackupConfig.value.backupType === 'USC_EVERY_DAY') {
    const today = new Date()
    today.setHours(selectedTime.getHours(), selectedTime.getMinutes(), selectedTime.getSeconds(), 0)
    if (today > now) {
      resultTime = today
    } else {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      resultTime = tomorrow
    }
  } else {
    const targetDay = selectedTime.getDay()
    const currentDay = now.getDay()
    let daysToAdd = targetDay - currentDay
    if (daysToAdd <= 0) daysToAdd += 7
    const next = new Date(now)
    next.setDate(now.getDate() + daysToAdd)
    next.setHours(selectedTime.getHours(), selectedTime.getMinutes(), selectedTime.getSeconds(), 0)
    resultTime = next
  }

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${resultTime.getFullYear()}-${pad(resultTime.getMonth() + 1)}-${pad(resultTime.getDate())}T${pad(resultTime.getHours())}:${pad(resultTime.getMinutes())}:${pad(resultTime.getSeconds())}+08:00`
}

const saveConfig = async () => {
  if (!selectedNodeId.value) return
  try {
    const [configRes, pathRes] = await Promise.all([
      SaveAutoBackupConfigApi({
        uuid: autoBackupConfig.value.uuid,
        startTime: nextBackupTime(),
        backupType: autoBackupConfig.value.backupType,
        isEvent: autoBackupConfig.value.isEvent,
        enabled: autoBackupConfig.value.enabled
      }),
      SaveBackupPathApi({
        nodeId: selectedNodeId.value,
        backupPath: selectedBackupPath.value
      })
    ])
    const ok =
      configRes?.status === 200 && (configRes.data.code === 0 || configRes.data.msg === 'Success') &&
      pathRes?.status === 200 && (pathRes.data.code === 0 || pathRes.data.msg === 'Success')
    if (ok) {
      ElMessage.success(t('CommTableEdit.comm_save_successfully'))
    } else {
      ElMessage.error(t('CommTableEdit.comm_save_failed'))
    }
  } catch (error) {
    ElMessage.error(t('CommTableEdit.comm_save_failed'))
    console.error('Save failed', error)
  }
}

onMounted(async () => {
  await getNodeList()
  await getAutoBackupConfig()
  if (selectedNodeId.value) {
    await getBackupPaths(selectedNodeId.value)
  }
})
</script>

<template>
  <div class="auto-backup" style="padding: 40px 27px;">
    <el-form class="el-form" label-position="left" label-width="220px">
      <el-form-item :label="t('Setting.set_work_server')">
        <el-select v-model="selectedNodeId" placeholder="" style="width: 310px;" @change="onNodeChange">
          <el-option
            v-for="(item, index) in nodeList"
            :key="index"
            :label="item.nodeName"
            :value="item.nodeId"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('Backup.backup_enable')">
        <el-switch v-model="autoBackupConfig.enabled" />
      </el-form-item>
      <el-form-item :label="t('Backup.backup_event')">
        <el-switch v-model="autoBackupConfig.isEvent" />
      </el-form-item>
      <el-form-item :label="t('Backup.backup_frenquency_time')">
        <div class="combined-control">
          <el-select v-model="autoBackupConfig.backupType" style="width: 120px;">
            <el-option
              v-for="item in backupTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-date-picker
            v-model="autoBackupConfig.startTime"
            type="datetime"
            :placeholder="t('Common.comm_select_date_time')"
            default-time="08:00:00"
            style="width: 200px; height: 32px; margin-left: 8px;"
          />
        </div>
      </el-form-item>
      <el-form-item :label="t('Backup.backup_path')">
        <el-select v-model="selectedBackupPath" placeholder="" style="width: 500px;">
          <el-option
            v-for="(path, index) in backupPaths"
            :key="index"
            :label="path"
            :value="path"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <div class="button-row" style="margin-top: 15px;">
      <el-button type="primary" @click="saveConfig">{{ t('CommTableEdit.comm_save') }}</el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.auto-backup {
  .combined-control {
    display: flex;
    align-items: center;
  }
}
</style>
