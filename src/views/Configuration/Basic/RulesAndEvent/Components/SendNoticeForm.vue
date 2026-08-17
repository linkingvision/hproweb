<template>
  <div class="notice-form">
    <div class="header">
      <el-button @click="back" type="text">{{ t('RulesAndEvent.rule_email_notice_config') }}</el-button>
      <span style="margin:0 8px;font-size:16px;">&gt;</span>
      <span>{{ modeTitle }}</span>
    </div>
    <p>{{ modeTitle }}</p>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="left" label-width="170px">
      <el-form-item :label="t('CommTable.comm_table_name')" prop="name"><el-input v-model="form.name" /></el-form-item>
      <el-form-item :label="t('RulesAndEvent.rule_recipient_email_address')" prop="emailRecipients"><el-input v-model="form.emailRecipients" /></el-form-item>
      <el-form-item :label="Theme.theme" prop="emailSubject"><el-input v-model="form.emailSubject" /></el-form-item>
      <el-form-item :label="t('RulesAndEvent.rule_message')" prop="emailMessage">
        <div class="message-box">
          <el-input v-model="form.emailMessage" type="textarea" :rows="6" />
          <div class="tips">
            <span>{{ t('RulesAndEvent.rule_add_system_information') }}:</span>
            <el-link type="primary" @click="insertVar('{{.ChannelName}}')">{{ t('SystemInfo.system_channel') }}</el-link>
            <el-link type="primary" @click="insertVar('{{.EventType}}')">{{ t('RulesAndEvent.rule_event_type') }}</el-link>
            <el-link type="primary" @click="insertVar('{{.Description}}')">{{ t('RulesAndEvent.rule_description') }}</el-link>
          </div>
        </div>
      </el-form-item>
      <el-form-item :label="t('Event.event_picture')"><el-switch v-model="form.includeImage" /></el-form-item>
      <el-form-item :label="t('RulesAndEvent.rule_description')"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
    </el-form>
    <div class="button_table">
      <el-button class="form_butt1" @click="back">{{ t('CommTableEdit.comm_cancel') }}</el-button>
      <el-button class="form_butt" type="primary" :loading="saving" @click="submit">{{ t('CommTableEdit.comm_save') }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { AddNotificationConfApi, NOTIFICATION_EMAIL, UpdateNotificationConfApi, type NotificationConf } from '@/api/configuration/rulesAndEvent'

const props = defineProps<{ mode: 'add' | 'edit'; initialData?: NotificationConf | null }>()
const emit = defineEmits<{ (e: 'back'): void; (e: 'saved'): void }>()
const { t } = useI18n()
const formRef = ref<FormInstance>()
const saving = ref(false)
const modeTitle = computed(() => props.mode === 'add' ? t('CommTableEdit.comm_add') : t('CommTableEdit.comm_edit'))
const Theme = { theme: t('Theme.theme') }

const form = reactive<NotificationConf>({
  notificationType: NOTIFICATION_EMAIL,
  name: '',
  emailRecipients: '',
  emailSubject: '',
  emailMessage: '',
  includeImage: true,
  description: ''
})

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('RulesAndEvent.rule_no_name'), trigger: 'blur' }],
  emailRecipients: [{ required: true, message: `${t('Common.comm_please_input')} ${t('RulesAndEvent.rule_recipient_email_address')}`, trigger: 'blur' }],
  emailSubject: [{ required: true, message: `${t('Common.comm_please_input')} ${t('Theme.theme')}`, trigger: 'blur' }],
  emailMessage: [{ required: true, message: `${t('Common.comm_please_input')} ${t('RulesAndEvent.rule_message')}`, trigger: 'blur' }]
}))

function fill() {
  Object.assign(form, {
    id: props.initialData?.id,
    uuid: props.initialData?.uuid,
    notificationType: NOTIFICATION_EMAIL,
    name: props.initialData?.name || '',
    emailRecipients: props.initialData?.emailRecipients || '',
    emailSubject: props.initialData?.emailSubject || '',
    emailMessage: props.initialData?.emailMessage || '',
    includeImage: props.initialData?.includeImage ?? true,
    description: props.initialData?.description || ''
  })
}

watch(() => props.initialData, fill, { immediate: true })

function insertVar(value: string) {
  form.emailMessage = `${form.emailMessage || ''}${value}`
}

function isSuccess(res: any) {
  return res?.data?.code === 0 || res?.data?.msg === 'Success'
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const res: any = props.mode === 'add' ? await AddNotificationConfApi(form) : await UpdateNotificationConfApi(form)
    if (isSuccess(res)) {
      ElMessage({ message: props.mode === 'add' ? t('CommTableEdit.comm_add_successfully') : t('CommTableEdit.comm_edit_successfully'), type: 'success', duration: 5000 })
      emit('saved')
    } else {
      ElMessage({ message: props.mode === 'add' ? t('CommTableEdit.comm_add_failed') : t('CommTableEdit.comm_edit_failed'), type: 'error', duration: 5000 })
    }
  } finally { saving.value = false }
}
function back() { emit('back') }
</script>

<style scoped lang="scss">
.notice-form { padding: 10px 20px; height: 100%; overflow: auto; .header { display:flex; align-items:center; } p { font-size:16px; font-weight:600; } :deep(.el-input), :deep(.el-textarea) { width: 420px; } .message-box { display:flex; flex-direction:column; gap:8px; } .tips { display:flex; gap:12px; align-items:center; } .button_table { display:flex; justify-content:flex-end; gap:8px; margin-top:20px; } }
</style>
