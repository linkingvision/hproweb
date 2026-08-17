<template>
  <div id="add_rules">
    <div class="header">
      <el-button @click="back" type="text">{{ t('AlarmConfig.ala_config') }}</el-button>
      <span style="margin:0 8px;font-size:16px;">></span>
      <span>{{ modeTitle }}</span>
    </div>
    <p style="font-weight:600;">{{ modeTitle }}</p>

    <div class="form-content">
      <el-form ref="formRef" :model="form" :rules="rules" :inline="true" class="demo-form-inline">
        <el-form-item :label="t('CommTable.comm_table_name')" prop="alarmRuleName">
          <el-input v-model="form.alarmRuleName"></el-input>
        </el-form-item>
        <el-form-item :label="t('RulesAndEvent.rule_time_template')" prop="timeTemplate">
          <el-select v-model="form.timeTemplate" :placeholder="t('Common.comm_please_select')">
            <el-option v-for="item in timeTemplateList" :key="item.uuid" :label="item.name" :value="item.uuid"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('AlarmConfig.ala_belong')" prop="alarmOwner">
          <el-select v-model="form.alarmOwner" :placeholder="t('Common.comm_please_select')">
            <el-option v-for="item in alarmOwnerList" :key="item.uuid" :label="item.username" :value="item.uuid"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('AlarmConfig.ala_level')" prop="alarmLevel">
          <el-select v-model="form.alarmLevel" :placeholder="t('Common.comm_please_select')">
            <el-option v-for="item in alarmLevelList" :key="item.code" :label="item.level" :value="item.code"></el-option>
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
              <el-checkbox-group v-model="checkedSystemEvents" @change="handleSystemChange" class="event-grid">
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
              <el-checkbox-group v-model="checkedAnalyticsEvents" @change="handleAnalyticsChange" class="event-grid">
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
        <el-form-item :label="t('AlarmConfig.ala_coercive_popup')">
          <el-switch v-model="form.popup"></el-switch>
        </el-form-item>
        <el-form-item :label="t('Common.comm_enable')">
          <el-switch v-model="form.enabled"></el-switch>
        </el-form-item>
        <el-form-item :label="t('RulesAndEvent.rule_description')" class="description">
          <el-input type="textarea" v-model="form.description"></el-input>
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
import AlarmChannelTransfer from './AlarmChannelTransfer.vue'
import {
  AddAlarmRuleApi,
  GetChannelsByUuidApi,
  UpdateAlarmRuleApi,
  type AlarmRule,
  type AlarmRuleAddPayload,
  type AlarmRuleUpdatePayload
} from '@/api/configuration/alarmConfig'
import {
  getAnalyticsEventOptions,
  getSystemEventOptions,
  type AlarmLevelOption,
  type AlarmOwnerOption,
  type TimeTemplateOption
} from '../alarmConfigOptions'
import { normalizeSelectedChannel, type DeviceTreeNode } from '@/utils/devicesTree'

const props = defineProps<{
  mode: 'add' | 'edit'
  initialRule?: AlarmRule | null
  timeTemplateList: TimeTemplateOption[]
  alarmOwnerList: AlarmOwnerOption[]
  alarmLevelList: AlarmLevelOption[]
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

const form = reactive<AlarmRule>({
  alarmRuleName: '',
  description: '',
  enabled: true,
  channelUUID: [],
  triggerEventType: [],
  timeTemplate: '',
  alarmOwner: '',
  alarmLevel: 1,
  popup: true,
  assigned: ''
})

const rules = computed<FormRules>(() => ({
  alarmRuleName: [{ required: true, message: `${t('Common.comm_please_input')} ${t('CommTable.comm_table_name')}`, trigger: 'blur' }],
  timeTemplate: [{ required: true, message: `${t('Common.comm_please_select')} ${t('RulesAndEvent.rule_time_template')}`, trigger: 'change' }],
  alarmOwner: [{ required: true, message: `${t('Common.comm_please_select')} ${t('AlarmConfig.ala_belong')}`, trigger: 'change' }],
  alarmLevel: [{ required: true, message: `${t('Common.comm_please_select')} ${t('AlarmConfig.ala_level')}`, trigger: 'change' }]
}))

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

function handleSystemChange() {
  resetChecks()
}

function handleAnalyticsChange() {
  resetChecks()
}

function handleSystemCheckAll(value: any) {
  checkedSystemEvents.value = value ? systemEventOptions.value.map(item => item.value) : []
  systemIndeterminate.value = false
}

function handleAnalyticsCheckAll(value: any) {
  checkedAnalyticsEvents.value = value ? analyticsEventOptions.value.map(item => item.value) : []
  analyticsIndeterminate.value = false
}

function applyDefaults() {
  const defaultTemplate = props.timeTemplateList[1] ?? props.timeTemplateList[0]
  const defaultOwner = props.alarmOwnerList[0]
  const defaultLevel = props.alarmLevelList[0]
  if (defaultTemplate && !form.timeTemplate) form.timeTemplate = defaultTemplate.uuid
  if (defaultOwner && !form.alarmOwner) form.alarmOwner = defaultOwner.uuid
  if (defaultLevel && !form.alarmLevel) form.alarmLevel = defaultLevel.code
}

async function resolveSelectedChannels(uuids: string[]) {
  selectedChannels.value = []
  if (!uuids.length) return
  try {
    const res: any = await GetChannelsByUuidApi({ uuids, all: true })
    const result = Array.isArray(res?.data?.result) ? res.data.result : []
    selectedChannels.value = result.map((item: any) => normalizeSelectedChannel({
      uuid: item.uuid,
      token: item.token,
      label: item.name,
      name: item.name,
      online: item.online,
      iconclass: 'iconfont icon-shexiangji-zaixian',
      DifferentType: 'devChannel'
    }))
  } catch {
    selectedChannels.value = []
  }
}

function resetFormValues() {
  Object.assign(form, {
    alarmRuleName: '',
    description: '',
    enabled: true,
    channelUUID: [],
    triggerEventType: [],
    timeTemplate: '',
    alarmOwner: '',
    alarmLevel: 1,
    popup: true,
    assigned: ''
  })
}

async function initForm() {
  const source = props.initialRule
  if (props.mode === 'edit' && source) {
    Object.assign(form, JSON.parse(JSON.stringify(source)))
    const eventValues = Array.isArray(source.triggerEventType) ? source.triggerEventType : []
    const systemValues = new Set(systemEventOptions.value.map(item => item.value))
    const analyticsValues = new Set(analyticsEventOptions.value.map(item => item.value))
    checkedSystemEvents.value = eventValues.filter(item => systemValues.has(item))
    checkedAnalyticsEvents.value = eventValues.filter(item => analyticsValues.has(item))
    await resolveSelectedChannels(Array.isArray(source.channelUUID) ? source.channelUUID : [])
  } else {
    resetFormValues()
    applyDefaults()
    selectedChannels.value = []
    checkedSystemEvents.value = []
    checkedAnalyticsEvents.value = []
  }
  resetChecks()
}

watch(() => [props.initialRule, props.timeTemplateList, props.alarmOwnerList, props.alarmLevelList], () => {
  initForm()
}, { immediate: true, deep: true })

function back() {
  emit('back')
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const triggerEventType = [...checkedSystemEvents.value, ...checkedAnalyticsEvents.value]
  if (!triggerEventType.length) {
    ElMessage({ message: t('RulesAndEvent.rule_no_event_type'), type: 'warning', duration: 3000 })
    return
  }
  if (!selectedChannels.value.length) {
    ElMessage({ message: t('RulesAndEvent.rule_no_channel'), type: 'warning', duration: 3000 })
    return
  }

  const basePayload: AlarmRuleAddPayload = {
    alarmRuleName: form.alarmRuleName,
    description: form.description,
    enabled: form.enabled,
    channelUUID: selectedChannels.value.map(item => item.uuid),
    triggerEventType,
    timeTemplate: form.timeTemplate,
    alarmOwner: form.alarmOwner,
    alarmLevel: form.alarmLevel,
    popup: form.popup,
    assigned: form.assigned ?? ''
  }

  saving.value = true
  try {
    const res: any = props.mode === 'edit'
      ? await UpdateAlarmRuleApi({ ...basePayload, uuid: form.uuid } as AlarmRuleUpdatePayload)
      : await AddAlarmRuleApi(basePayload)
    if (isSuccess(res)) {
      ElMessage({ message: props.mode === 'edit' ? t('CommTableEdit.comm_edit_successfully') : t('CommTableEdit.comm_add_successfully'), type: 'success', duration: 5000 })
      emit('saved')
    } else {
      ElMessage({ message: props.mode === 'edit' ? t('CommTableEdit.comm_edit_failed') : t('CommTableEdit.comm_add_failed'), type: 'error', duration: 5000 })
    }
  } catch {
    ElMessage({ message: props.mode === 'edit' ? t('CommTableEdit.comm_edit_failed') : t('CommTableEdit.comm_add_failed'), type: 'error', duration: 5000 })
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
#add_rules {
  width: 100%;
  min-height: 100%;
  padding: 0 10px;

  .header {
    height: 48px;
    line-height: 48px;
    display: flex;
    align-items: center;
  }

  .form-content {
    padding: 0 40px;
  }

  .demo-form-inline {
    width: 100%;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;

    :deep(.el-form-item) {
      margin-right: 0;
    }

    :deep(.el-select), :deep(.el-input) {
      width: 280px;
    }
  }

  .el_form {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: nowrap;
  }

  .type-form-item {
    margin-right: 0;
    flex-shrink: 0;
  }

  .event-node {
    width: 100%;
    min-width: 400px;
  }

  .Root_node {
    width: 460px;
    min-height: 496px;
    height: auto;
    padding: 20px;
    border: 1px solid rgba(218, 218, 218, 0.2);
    border-radius: 4px;
    background-color: #1b1b1b;
    overflow: visible;
  }

  .event-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .ana-title {
    margin-top: 20px;
  }

  .event-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 12px;
    width: 100%;

    :deep(.el-checkbox) {
      margin-right: 0;
      height: auto;
      min-height: 30px;
      line-height: 20px;
      align-items: flex-start;
      white-space: normal;
      overflow: visible;
    }

    :deep(.el-checkbox__label) {
      max-width: 165px;
      overflow: visible;
      white-space: normal;
      word-break: normal;
      line-height: 20px;
      vertical-align: middle;
    }
  }

  .channel-form-item {
    width: 1050px;
    margin-right: 0;
  }

  .bottom-form {
    margin-top: 20px;
    display: flex;
    align-items: flex-start;
    flex-wrap: nowrap;

    :deep(.el-form-item) {
      margin-right: 30px;
    }

    .description {
      display: flex;
      align-items: flex-start;
    }

    :deep(.description .el-form-item__content) {
      margin-left: 0 !important;
      width: 78%;
    }

    :deep(.el-textarea) {
      width: 336px;
    }

    :deep(.el-textarea__inner) {
      min-height: 32px !important;
      background-color: inherit !important;
    }
  }

  .button_table {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 0 20px;
  }
}
</style>
