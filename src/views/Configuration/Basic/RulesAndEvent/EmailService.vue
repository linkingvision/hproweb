<template>
  <div id="email_service">
    <div class="title">{{ t('RulesAndEvent.rule_email_service_config') }}</div>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="left" label-width="170px" v-loading="loading">
      <el-form-item :label="t('RulesAndEvent.rule_sender_email_address')" prop="senderEmailAddress"><el-input v-model="form.senderEmailAddress" /></el-form-item>
      <el-form-item :label="t('RulesAndEvent.rule_smtp_address')" prop="smtpHost"><el-input v-model="form.smtpHost" /></el-form-item>
      <el-form-item :label="t('RulesAndEvent.rule_smtp_port')" prop="smtpPort"><el-input v-model="form.smtpPort" /></el-form-item>
      <el-form-item :label="t('RulesAndEvent.rule_auth_code')"><el-input v-model="form.password" show-password /></el-form-item>
      <el-form-item label="SSL"><el-switch v-model="form.ssl" /></el-form-item>
    </el-form>
    <div class="button_table"><el-button class="form_butt" type="primary" :loading="saving" @click="submit">{{ t('CommTableEdit.comm_save') }}</el-button></div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { GetEmailServerApi, UpdateEmailServerApi, type EmailServerConfig } from '@/api/configuration/rulesAndEvent'
const { t } = useI18n(); const loading = ref(false); const saving = ref(false); const formRef = ref<FormInstance>()
const form = reactive<EmailServerConfig>({ form: '', senderEmailAddress: '', smtpHost: '', smtpPort: '', password: '', ssl: false })
const rules: FormRules = { senderEmailAddress: [{ required: true, message: `${t('Common.comm_please_input')} ${t('RulesAndEvent.rule_sender_email_address')}`, trigger: 'blur' }], smtpHost: [{ required: true, message: `${t('Common.comm_please_input')} ${t('RulesAndEvent.rule_smtp_address')}`, trigger: 'blur' }], smtpPort: [{ required: true, message: `${t('Common.comm_please_input')} ${t('RulesAndEvent.rule_smtp_port')}`, trigger: 'blur' }] }
function responseResult(res:any){return res?.data?.result ?? {}} function isSuccess(res:any){return res?.data?.code===0||res?.data?.msg==='Success'}
async function loadData(){loading.value=true; try{const res:any=await GetEmailServerApi(); const result=responseResult(res); Object.assign(form,{ form: result.form || '', senderEmailAddress: result.senderEmailAddress || '', smtpHost: result.smtpHost || '', smtpPort: Number(result.smtpPort || 25), password: result.password || '', ssl: result.ssl ?? false })}finally{loading.value=false}}
async function submit(){const valid=await formRef.value?.validate().catch(()=>false); if(!valid)return; saving.value=true; try{const res:any=await UpdateEmailServerApi({...form, smtpPort: Number(form.smtpPort)}); if(isSuccess(res)) ElMessage.success(t('CommTableEdit.comm_save_successfully')); else ElMessage.error(t('CommTableEdit.comm_save_failed'))}finally{saving.value=false}}
onMounted(loadData)
</script>
<style scoped lang="scss">#email_service{padding:20px;.title{height:48px;line-height:48px;padding-left:20px;background:#2a2a2a;margin-bottom:24px}:deep(.el-input){width:420px}.button_table{display:flex;justify-content:flex-end;width:590px;margin-top:20px}}</style>
