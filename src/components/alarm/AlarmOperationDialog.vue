<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import type { AlarmEventItem } from '@/api/alarmEvent'
import { UpdateAlarmEventInfoApi } from '@/api/alarmEvent'
import type { AlarmLevelOption } from '@/utils/alarmOptions'
import {
  ALARM_CLOSE_REASON,
  formatModuleType,
  getAlarmStateOptions
} from '@/utils/alarmOptions'

interface AlarmOwnerOption {
  uuid: string
  username: string
}

const props = withDefaults(defineProps<{
  modelValue: boolean
  event?: AlarmEventItem | null
  alarmOwners: AlarmOwnerOption[]
  alarmLevels: AlarmLevelOption[]
}>(), {
  event: null,
  alarmOwners: () => [],
  alarmLevels: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const { t } = useI18n()

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const dialogForm = reactive({
  uuid: '',
  assigned: '',
  stateLevel: undefined as number | undefined,
  alarmLevel: undefined as string | number | undefined,
  reason: '',
  comment: ''
})

const stateOptions = computed(() => getAlarmStateOptions(t))
const reasonOptions = [ALARM_CLOSE_REASON]
const saving = reactive({ value: false })

const imageSource = computed(() => {
  const img = props.event?.strImg
  if (!img) return ''
  return img.startsWith('data:image') ? img : `data:image/jpeg;base64,${img}`
})

const close = () => {
  visible.value = false
}

const normalizeStateLevel = (event?: AlarmEventItem | null) => {
  if (typeof event?.stateLevel === 'number') return event.stateLevel
  const value = event?.stateName
  return getAlarmStateOptions(t).find(item => item.value === value)?.code
}

const fillForm = () => {
  const event = props.event
  dialogForm.uuid = event?.uuid || ''
  dialogForm.assigned = event?.assigned || event?.assignedTo || ''
  dialogForm.stateLevel = normalizeStateLevel(event)
  dialogForm.alarmLevel = event?.alarmLevel
  dialogForm.reason = event?.reason || ''
  dialogForm.comment = event?.comment || ''
}

watch(() => props.event, fillForm, { immediate: true, deep: true })
watch(() => props.modelValue, value => {
  if (value) fillForm()
})

const submitForm = async () => {
  if (!dialogForm.uuid) return
  if (dialogForm.stateLevel === 4 && !dialogForm.reason) {
    ElMessage.warning(t('AlarmConfig.ala_select_reason'))
    return
  }

  saving.value = true
  try {
    const res = await UpdateAlarmEventInfoApi({
      uuid: dialogForm.uuid,
      assignedTo: dialogForm.assigned,
      stateLevel: dialogForm.stateLevel,
      alarmLevel: dialogForm.alarmLevel,
      reason: dialogForm.reason,
      comment: dialogForm.comment
    })
    if (res.status === 200 && res.data.code === 0) {
      ElMessage.success(t('CommTableEdit.comm_edit_successfully'))
      emit('saved')
      visible.value = false
    } else {
      ElMessage.error(t('CommTableEdit.comm_edit_failed'))
    }
  } catch (error) {
    ElMessage.error(t('CommTableEdit.comm_edit_failed'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-dialog v-model="visible" :title="t('CommTableEdit.comm_operational')" width="50%" top="10vh">
    <div class="alarm-operation" v-if="props.event">
      <div class="dialog-body">
        <!-- 左列：表单字段 -->
        <el-form :model="dialogForm" label-position="right" label-width="140px" class="left-form">
          <el-form-item :label="t('AlarmConfig.ala_assign_to')">
            <el-select v-model="dialogForm.assigned" :placeholder="t('Common.comm_please_select')" clearable>
              <el-option v-for="item in props.alarmOwners" :key="item.uuid" :label="item.username" :value="item.uuid" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('Configuration.conf_iscsi_status')">
            <el-select v-model="dialogForm.stateLevel" :placeholder="t('Common.comm_please_select')">
              <el-option v-for="item in stateOptions" :key="item.code" :label="item.label" :value="item.code" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="dialogForm.stateLevel === 4" :label="t('AlarmConfig.ala_reason')">
            <el-select v-model="dialogForm.reason" :placeholder="t('Common.comm_please_select')">
              <el-option v-for="item in reasonOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('AlarmConfig.ala_level')">
            <el-select v-model="dialogForm.alarmLevel" :placeholder="t('Common.comm_please_select')">
              <el-option v-for="item in props.alarmLevels" :key="item.code" :label="item.level" :value="item.code" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('AlarmConfig.ala_time')">
            <span class="info-text">{{ props.event.strTime || props.event.time }}</span>
          </el-form-item>
          <el-form-item :label="t('AlarmConfig.ala_event_id')">
            <span class="info-text">{{ props.event.uuid }}</span>
          </el-form-item>
          <el-form-item :label="t('RulesAndEvent.rule_event_type')">
            <span class="info-text">{{ formatModuleType(props.event.moduleType, t) }}</span>
          </el-form-item>
          <el-form-item :label="t('AlarmConfig.ala_channel_id')">
            <span class="info-text">{{ props.event.channelToken }}</span>
          </el-form-item>
          <el-form-item :label="t('Analytics.ana_channel_name')">
            <span class="info-text">{{ props.event.channelName }}</span>
          </el-form-item>
        </el-form>
        <!-- 右列：图片 + 描述 -->
        <el-form label-position="left" label-width="80px" class="right-form">
          <el-form-item :label="t('Common.comm_picture')" v-if="imageSource">
            <el-image
              class="event-image"
              :src="imageSource"
              fit="fill"
            />
          </el-form-item>
          <el-form-item :label="t('Common.comm_description')">
            <el-input
              v-model="dialogForm.comment"
              type="textarea"
              :rows="1"
              :autosize="{ minRows: 1, maxRows: 6 }"
              class="comment-textarea"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer button_table">
        <el-button class="form_butt1" @click="close">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" :loading="saving.value" @click="submitForm">{{ t('CommTableEdit.comm_save') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.alarm-operation {
  .dialog-body {
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 0;
  }

  .left-form {
    width: 480px;
    flex-shrink: 0;

    .el-select {
      width: 260px;
    }

    .info-text {
      display: inline-block;
      word-break: break-all;
      white-space: normal;
      line-height: 1.5;
    }
  }

  .right-form {
    flex: 1;
    min-width: 0;

    .event-image {
      max-width: 400px;
      min-width: 250px;
      min-height: 200px;
    }

    :deep(.el-textarea__inner) {
      width: 250px;
      min-height: 60px;
    }

    .comment-textarea {
      width: 250px;
      :deep(.el-textarea__inner) {
        background-color: transparent !important;
        color: #fff !important;
        border: 1px solid rgb(74, 74, 74) !important;
        box-shadow: none !important;
        outline: none !important;
        resize: vertical !important;
      }
      :deep(.el-textarea__inner:hover),
      :deep(.el-textarea__inner:focus) {
        border: 1px solid rgb(74, 74, 74) !important;
        box-shadow: none !important;
        outline: none !important;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-start;
  margin-left: 120px;
  gap: 12px;
}
</style>
