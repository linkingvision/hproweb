<template>
  <div id="add_rules">
    <div class="header">
      <el-button @click="back" type="text">{{ t('RulesAndEvent.rule_config') }}</el-button>
      <span style="margin:0 8px;font-size:16px;">></span>
      <span>{{ modeTitle }}</span>
    </div>
    <p style="font-weight:600;">{{ modeTitle }}</p>

    <div class="form-content">
      <el-form ref="formRef" :model="form" :rules="rules" :inline="true" class="demo-form-inline">
        <el-form-item :label="t('CommTable.comm_table_name')" prop="ruleEventName">
          <el-input v-model="form.ruleEventName" />
        </el-form-item>
        <el-form-item :label="t('RulesAndEvent.rule_time_template')" prop="setting.timeTemplate">
          <el-select v-model="form.setting.timeTemplate" :placeholder="t('Common.comm_please_select')">
            <el-option v-for="item in timeTemplateList" :key="item.uuid" :label="item.name" :value="item.uuid" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('RulesAndEvent.rule_operation_type')" prop="setting.actionType">
          <el-select v-model="form.setting.actionType" :placeholder="t('Common.comm_please_select')" @change="handleActionTypeChange">
            <el-option :label="t('RulesAndEvent.rule_email_notice_config')" :value="NOTIFICATION_EMAIL" />
            <el-option :label="t('RulesAndEvent.rule_http_conf')" :value="NOTIFICATION_HTTP" />
            <el-option :label="t('RulesAndEvent.rule_mqtt_conf')" :value="NOTIFICATION_MQTT" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('RulesAndEvent.rule_config_list')" prop="setting.Action.Notification">
          <el-select v-model="form.setting.Action.Notification"
                     :placeholder="t('Common.comm_please_select')"
                     :no-data-text="t('Common.comm_no_data')">
            <el-option v-for="item in filteredConfigList" :key="item.uuid || item.id" :label="item.name" :value="item.uuid || ''" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-form class="el_form" :inline="true" label-position="left" :model="form">
        <el-form-item :label="t('CommTable.comm_table_type')" class="type-form-item">
          <div class="tow_node event-node">
            <div class="Root_node Root_node1">
              <div class="event-title">
                <span>{{ t('RulesAndEvent.rule_system_event_type') }}</span>
                <el-checkbox :indeterminate="systemIndeterminate" v-model="systemCheckAll" @change="handleSystemCheckAll">
                  {{ t('Common.comm_check_all') }}
                </el-checkbox>
              </div>
              <el-checkbox-group v-model="checkedSystemEvents" @change="resetChecks" class="system-event event-grid">
                <el-checkbox v-for="item in systemEventOptions" :key="item.value" :label="item.value">
                  {{ item.label }}
                </el-checkbox>
              </el-checkbox-group>

              <div class="event-title ana-title">
                <span>{{ t('RulesAndEvent.rule_ana_event_type') }}</span>
                <el-checkbox :indeterminate="analyticsIndeterminate" v-model="analyticsCheckAll" @change="handleAnalyticsCheckAll">
                  {{ t('Common.comm_check_all') }}
                </el-checkbox>
              </div>
              <el-checkbox-group v-model="checkedAnalyticsEvents" @change="resetChecks" class="analyse-event event-grid">
                <el-checkbox v-for="item in analyticsEventOptions" :key="item.value" :label="item.value">
                  {{ item.label }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
        </el-form-item>

        <el-form-item :label="t('SystemInfo.system_channel')" class="channel-form-item">
          <AlarmChannelTransfer v-model="selectedChannels" />
        </el-form-item>
      </el-form>

      <el-form class="bottom-form" :inline="true" label-position="left" :model="form">
        <el-form-item :label="t('Common.comm_enable')" class="enable-item">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item :label="t('RulesAndEvent.rule_description')" class="description">
          <el-input type="textarea" v-model="form.description" />
        </el-form-item>
      </el-form>

      <div class="dialog-footer button_table">
        <el-button class="form_butt1" @click="back">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" :loading="saving" @click="submitForm">{{ t('CommTableEdit.comm_save') }}</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import AlarmChannelTransfer from '../../Components/AlarmChannelTransfer.vue'
import { GetChannelsByUuidApi } from '@/api/configuration/alarmConfig'
import { normalizeSelectedChannel, type DeviceTreeNode } from '@/utils/devicesTree'
import {
  AddRuleEventApi,
  NOTIFICATION_EMAIL,
  NOTIFICATION_HTTP,
  NOTIFICATION_MQTT,
  UpdateRuleEventApi,
  normalizeNotificationType,
  type NotificationConf,
  type RuleEventPayload,
  type RuleEventRow,
} from '@/api/configuration/rulesAndEvent'
import {
  getAnalyticsEventOptions,
  getSystemEventOptions,
  type TimeTemplateOption,
} from '../../alarmConfigOptions'

const props = defineProps<{
  mode: 'add' | 'edit'
  initialRule?: RuleEventRow | null
  timeTemplateList: TimeTemplateOption[]
  configList: NotificationConf[]
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'saved'): void
}>()

const { t } = useI18n()
const formRef = ref<FormInstance>()
const saving = ref(false)
const systemCheckAll = ref(false)
const analyticsCheckAll = ref(false)
const systemIndeterminate = ref(false)
const analyticsIndeterminate = ref(false)
const selectedChannels = ref<DeviceTreeNode[]>([])
const checkedSystemEvents = ref<string[]>([])
const checkedAnalyticsEvents = ref<string[]>([])

const systemEventOptions = computed(() => getSystemEventOptions(t))
const analyticsEventOptions = computed(() => getAnalyticsEventOptions(t))
const modeTitle = computed(() => props.mode === 'add' ? t('CommTableEdit.comm_add') : t('CommTableEdit.comm_edit'))
const filteredConfigList = computed(() => props.configList.filter(item => normalizeNotificationType(item.notificationType) === form.setting.actionType))

const form = reactive<RuleEventPayload>({
  ruleEventName: '',
  description: '',
  enabled: true,
  setting: {
    eventType: [],
    channelUUID: [],
    timeTemplate: '',
    actionType: NOTIFICATION_EMAIL,
    Action: { Notification: '' }
  }
})

const rules = computed<FormRules>(() => ({
  ruleEventName: [{ required: true, message: t('RulesAndEvent.rule_no_name'), trigger: 'blur' }],
  'setting.timeTemplate': [{ required: true, message: `${t('Common.comm_please_select')} ${t('RulesAndEvent.rule_time_template')}`, trigger: 'change' }],
  'setting.actionType': [{ required: true, message: `${t('Common.comm_please_select')} ${t('RulesAndEvent.rule_operation_type')}`, trigger: 'change' }],
  'setting.Action.Notification': [{ required: true, message: t('RulesAndEvent.rule_no_config_list'), trigger: 'change' }]
}))

function responseResult(res: any) {
  return res?.data?.result ?? []
}

function isSuccess(res: any) {
  return res?.data?.code === 0 || res?.data?.msg === 'Success'
}

function resetChecks() {
  const systemCount = checkedSystemEvents.value.length
  const analyticsCount = checkedAnalyticsEvents.value.length
  systemCheckAll.value = systemCount === systemEventOptions.value.length
  systemIndeterminate.value = systemCount > 0 && systemCount < systemEventOptions.value.length
  analyticsCheckAll.value = analyticsCount === analyticsEventOptions.value.length
  analyticsIndeterminate.value = analyticsCount > 0 && analyticsCount < analyticsEventOptions.value.length
}

function handleSystemCheckAll(value: any) {
  checkedSystemEvents.value = value ? systemEventOptions.value.map(item => item.value) : []
  resetChecks()
}

function handleAnalyticsCheckAll(value: any) {
  checkedAnalyticsEvents.value = value ? analyticsEventOptions.value.map(item => item.value) : []
  resetChecks()
}

function syncNotification(defaultOnly = false) {
  const current = form.setting.Action.Notification
  const currentExists = filteredConfigList.value.some(item => item.uuid === current)
  if (!defaultOnly || !currentExists) {
    form.setting.Action.Notification = filteredConfigList.value[0]?.uuid || ''
  }
}

function handleActionTypeChange() {
  syncNotification()
}

async function resolveSelectedChannels(uuids: string[]) {
  selectedChannels.value = []
  if (!uuids.length) return
  selectedChannels.value = uuids.map(uuid => normalizeSelectedChannel({ uuid, label: uuid, name: uuid, DifferentType: 'devChannel' }))
  try {
    const res: any = await GetChannelsByUuidApi({ uuids, all: true })
    const result = responseResult(res)
    const list = Array.isArray(result?.list) ? result.list : Array.isArray(result) ? result : []
    if (list.length) {
      const channelMap = new Map<string, DeviceTreeNode>(list.map((item: any) => [item.uuid, normalizeSelectedChannel({
        uuid: item.uuid,
        token: item.token,
        label: item.name || item.label || item.uuid,
        name: item.name || item.label || item.uuid,
        online: item.online,
        iconclass: 'iconfont icon-shexiangji-zaixian',
        DifferentType: 'devChannel'
      })]))
      selectedChannels.value = uuids.map(uuid => channelMap.get(uuid) ?? normalizeSelectedChannel({ uuid, label: uuid, name: uuid, DifferentType: 'devChannel' }))
    }
  } catch { }
}

function resetFormValues() {
  form.uuid = undefined
  form.ruleEventId = undefined
  form.ruleEventName = ''
  form.description = ''
  form.enabled = true
  form.setting.eventType = []
  form.setting.channelUUID = []
  form.setting.timeTemplate = (props.timeTemplateList[1] ?? props.timeTemplateList[0])?.uuid || ''
  form.setting.actionType = NOTIFICATION_EMAIL
  form.setting.Action.Notification = ''
}

async function fillForm() {
  const rule = props.initialRule
  if (props.mode === 'edit' && rule) {
    form.uuid = rule.uuid
    form.ruleEventId = rule.ruleEventId ?? rule.id
    form.ruleEventName = rule.ruleEventName || ''
    form.description = rule.description || ''
    form.enabled = rule.enabled ?? true
    form.setting.eventType = Array.isArray(rule.setting?.eventType) ? [...rule.setting.eventType] : []
    form.setting.channelUUID = Array.isArray(rule.setting?.channelUUID) ? [...rule.setting.channelUUID] : []
    form.setting.timeTemplate = rule.setting?.timeTemplate || (props.timeTemplateList[1] ?? props.timeTemplateList[0])?.uuid || ''
    form.setting.actionType = normalizeNotificationType(rule.setting?.actionType || NOTIFICATION_EMAIL)
    form.setting.Action.Notification = rule.setting?.Action?.Notification || ''
    syncNotification(true)
  } else {
    resetFormValues()
    syncNotification(true)
  }

  checkedSystemEvents.value = form.setting.eventType.filter(value => systemEventOptions.value.some(item => item.value === value))
  checkedAnalyticsEvents.value = form.setting.eventType.filter(value => analyticsEventOptions.value.some(item => item.value === value))
  resetChecks()
  await resolveSelectedChannels(form.setting.channelUUID)
}

watch(() => [props.mode, props.initialRule, props.timeTemplateList, props.configList], fillForm, { immediate: true, deep: true })

function validateSelection() {
  if (!checkedSystemEvents.value.length && !checkedAnalyticsEvents.value.length) {
    ElMessage({ message: t('RulesAndEvent.rule_no_event_type'), type: 'warning', duration: 3000 })
    return false
  }
  if (!selectedChannels.value.length) {
    ElMessage({ message: t('RulesAndEvent.rule_no_channel'), type: 'warning', duration: 3000 })
    return false
  }
  return true
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || !validateSelection()) return
  saving.value = true
  try {
    const payload: RuleEventPayload = {
      uuid: form.uuid,
      ruleEventId: form.ruleEventId,
      ruleEventName: form.ruleEventName,
      description: form.description,
      enabled: form.enabled,
      setting: {
        eventType: [...checkedSystemEvents.value, ...checkedAnalyticsEvents.value],
        channelUUID: selectedChannels.value.map(item => item.uuid).filter(Boolean),
        timeTemplate: form.setting.timeTemplate,
        actionType: form.setting.actionType,
        Action: { Notification: form.setting.Action.Notification }
      }
    }
    const res: any = props.mode === 'add' ? await AddRuleEventApi(payload) : await UpdateRuleEventApi(payload)
    if (isSuccess(res)) {
      ElMessage({ message: props.mode === 'add' ? t('CommTableEdit.comm_add_successfully') : t('CommTableEdit.comm_edit_successfully'), type: 'success', duration: 5000 })
      emit('saved')
    } else {
      ElMessage({ message: props.mode === 'add' ? t('CommTableEdit.comm_add_failed') : t('CommTableEdit.comm_edit_failed'), type: 'error', duration: 5000 })
    }
  } finally {
    saving.value = false
  }
}

function back() {
  emit('back')
}
</script>

<style lang="scss" scoped>
#add_rules {
  padding: 10px 20px;
  height: 100%;
  overflow: auto;

  .header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  .form-content {
    padding: 0 40px;
  }

  :deep(.demo-form-inline) {
    width: 100%;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  :deep(.demo-form-inline .el-form-item) {
    margin-right: 30px;
    margin-bottom: 18px;
  }

  :deep(.el-input),
  :deep(.el-select) {
    width: 312px;
    height: 32px;
  }

  :deep(.el_form) {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  :deep(.el_form .type-form-item) {
    .el-form-item__content {
      width: 400px;
    }
  }

  :deep(.el_form .channel-form-item) {
    width: auto;
    margin-left: 20px;
    .el-form-item__content {
      width: auto;
    }
  }

  .tow_node {
    display: flex;
  }

  .Root_node {
    width: 100%;
    min-height: 496px;
    padding: 16px;
    border: 1px solid rgba(218, 218, 218, 0.2);
    border-radius: 4px;
    background-color: var(--rules-root-bg, #1b1b1b);
    color: var(--rules-text-color, inherit);
    box-sizing: border-box;
    overflow: auto;
  }

  .Root_node1 {
    min-height: 496px;
  }

  .event-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    line-height: 1.2;
  }

  .event-title > span {
    font-weight: 600;
  }

  :deep(.event-title .el-checkbox) {
    margin-right: 0;
  }

  .ana-title {
    margin-top: 20px;
  }

  .event-grid.system-event,
  .event-grid.analyse-event {
    display: grid;
    grid-template-columns: 34% 1fr 30%;
    gap: 6px 8px;
  }

  :deep(.event-grid .el-checkbox) {
    margin-right: 0;
  }

  .bottom-form {
    margin-top: 20px;
  }

  .enable-item {
    width: 100px;
  }

  .description {
    :deep(.el-textarea) {
      width: 336px;
    }
    :deep(.el-textarea__inner) {
      min-height: 64px;
    }
  }

  .button_table {
    margin-left: 40px;
    margin-top: 20px;
    display: flex;
    justify-content: flex-start;
    gap: 8px;

    .form_butt1 {
      border: 1px solid var(--el-color-primary);
      color: var(--el-color-primary);
      background: transparent;
    }

    .form_butt {
      background-color: var(--el-color-primary);
    }
  }

  :deep(.bottom-form .el-form-item) {
    margin-bottom: 10px;
  }
}
</style>