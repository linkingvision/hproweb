<template>
  <div class="notice-page">
    <template v-if="mode === 'list'">
      <div class="devices_topBtn">
        <el-button class="form_butt" type="primary" @click="openAdd">{{ t('CommTableEdit.comm_add') }}</el-button>
        <el-button class="form_butt1" @click="deleteRows(selectedRows)">{{ t('CommTableEdit.comm_delete') }}</el-button>
      </div>
      <el-table v-loading="loading" :data="pagedRows" height="calc(100% - 104px)" @selection-change="handleSelectionChange" :empty-text="t('CommTable.comm_no_data_available')">
        <el-table-column type="selection" width="48" />
        <el-table-column prop="name" :label="t('CommTable.comm_table_name')" min-width="140" show-overflow-tooltip />
        <el-table-column prop="server" :label="t('SystemInfo.system_server')" min-width="180" show-overflow-tooltip />
        <el-table-column prop="topic" label="Topic" min-width="160" show-overflow-tooltip />
        <el-table-column prop="username" :label="t('CommLogin.comm_login_username')" min-width="150" show-overflow-tooltip />
        <el-table-column :label="t('CommLogin.comm_login_password')" min-width="150">
          <template #default="{ row }"><span>{{ row.showPassword ? row.password : mask(row.password) }}</span><i class="iconfont icon-chakan" style="margin-left:8px;cursor:pointer;" @click="row.showPassword = !row.showPassword"></i></template>
        </el-table-column>
        <el-table-column prop="description" :label="t('RulesAndEvent.rule_description')" min-width="180" show-overflow-tooltip />
        <el-table-column :label="t('CommTableEdit.comm_operational')" width="160"><template #default="{ row }"><el-button link type="primary" @click="openEdit(row)">{{ t('CommTableEdit.comm_edit') }}</el-button><el-button link type="danger" @click="deleteRows([row])">{{ t('CommTableEdit.comm_delete') }}</el-button></template></el-table-column>
      </el-table>
      <div class="pagination"><el-pagination background layout="total, prev, pager, next" :current-page="currentPage" :page-size="pageSize" :total="rows.length" @current-change="handleCurrentChange" /></div>
    </template>
    <template v-else>
      <div class="form-page">
        <div class="header"><el-button type="text" @click="backToList">{{ t('RulesAndEvent.rule_mqtt_conf') }}</el-button><span style="margin:0 8px;font-size:16px;">&gt;</span><span>{{ modeTitle }}</span></div>
        <p>{{ modeTitle }}</p>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="left" label-width="120px">
          <el-form-item :label="t('CommTable.comm_table_name')" prop="name"><el-input v-model="form.name" /></el-form-item>
          <el-form-item :label="t('SystemInfo.system_server')" prop="server"><el-input v-model="form.server" /></el-form-item>
          <el-form-item label="Topic" prop="topic"><el-input v-model="form.topic" /></el-form-item>
          <el-form-item :label="t('CommLogin.comm_login_username')"><el-input v-model="form.username" /></el-form-item>
          <el-form-item :label="t('CommLogin.comm_login_password')"><el-input v-model="form.password" show-password /></el-form-item>
          <el-form-item :label="t('RulesAndEvent.rule_description')"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        </el-form>
        <div class="button_table"><el-button class="form_butt1" @click="backToList">{{ t('CommTableEdit.comm_cancel') }}</el-button><el-button class="form_butt" type="primary" :loading="saving" @click="submit">{{ t('CommTableEdit.comm_save') }}</el-button></div>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { AddNotificationConfApi, DeleteNotificationConfApi, GetNotificationConfListApi, NOTIFICATION_MQTT, UpdateNotificationConfApi, type NotificationConf } from '@/api/configuration/rulesAndEvent'
const { t } = useI18n(); const mode = ref<'list'|'add'|'edit'>('list'); const loading = ref(false); const saving = ref(false); const rows = ref<NotificationConf[]>([]); const selectedRows = ref<NotificationConf[]>([]); const currentPage = ref(1); const pageSize = ref(15); const formRef = ref<FormInstance>()
const form = reactive<NotificationConf>({ notificationType: NOTIFICATION_MQTT, name: '', server: '', topic: '', username: '', password: '', description: '' })
const modeTitle = computed(() => mode.value === 'add' ? t('CommTableEdit.comm_add') : t('CommTableEdit.comm_edit')); const pagedRows = computed(() => rows.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)); const rules = computed<FormRules>(() => ({ name: [{ required: true, message: t('RulesAndEvent.rule_no_name'), trigger: 'blur' }], server: [{ required: true, message: `${t('Common.comm_please_input')} ${t('SystemInfo.system_server')}`, trigger: 'blur' }], topic: [{ required: true, message: `${t('Common.comm_please_input')} Topic`, trigger: 'blur' }] }))
function responseResult(res:any){return res?.data?.result ?? []} function isSuccess(res:any){return res?.data?.code===0||res?.data?.msg==='Success'} function mask(v=''){return v ? '******' : ''}
async function loadRows(){loading.value=true; try{const res:any=await GetNotificationConfListApi(NOTIFICATION_MQTT); const result=responseResult(res); rows.value=Array.isArray(result)?result.map(i=>({...i, showPassword:false})):[]}finally{loading.value=false}} function openAdd(){Object.assign(form,{id:undefined,uuid:undefined,notificationType:NOTIFICATION_MQTT,name:'',server:'',topic:'',username:'',password:'',description:''});mode.value='add'} function openEdit(row:NotificationConf){Object.assign(form,{...row, notificationType:NOTIFICATION_MQTT});mode.value='edit'} function handleSelectionChange(selection: NotificationConf[]){selectedRows.value=selection} function handleCurrentChange(page: number){currentPage.value=page} async function backToList(){mode.value='list'; await loadRows()}
async function submit(){const valid=await formRef.value?.validate().catch(()=>false); if(!valid)return; saving.value=true; try{const res:any=mode.value==='add'?await AddNotificationConfApi(form):await UpdateNotificationConfApi(form); if(isSuccess(res)){ElMessage.success(mode.value==='add'?t('CommTableEdit.comm_add_successfully'):t('CommTableEdit.comm_edit_successfully')); await backToList()}else ElMessage.error(mode.value==='add'?t('CommTableEdit.comm_add_failed'):t('CommTableEdit.comm_edit_failed'))}finally{saving.value=false}}
async function deleteRows(target:NotificationConf[]){if(!target.length){ElMessage.warning(t('Common.comm_please_select'));return} const ids=target.map(i=>i.id).filter((id):id is number=>typeof id==='number'); if(!ids.length){ElMessage.warning(t('Common.comm_please_select'));return} try{await ElMessageBox.confirm(t('Common.comm_delete_confirm'),t('Common.comm_prompt'),{confirmButtonText:t('CommTableEdit.comm_ok'),cancelButtonText:t('CommTableEdit.comm_cancel')}); const res:any=await DeleteNotificationConfApi({ids}); if(isSuccess(res)){ElMessage.success(t('CommTableEdit.comm_delete_successfully')); await loadRows()}else ElMessage.error(t('CommTableEdit.comm_delete_failed'))}catch{}}
onMounted(loadRows)
</script>
<style scoped lang="scss">.notice-page{height:100%;padding:0 10px}.devices_topBtn{height:54px;display:flex;align-items:center;gap:8px}.pagination{height:50px;display:flex;align-items:center}.form-page{padding:10px 20px;.header{display:flex;align-items:center}p{font-weight:600}:deep(.el-input),:deep(.el-textarea){width:420px}.button_table{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}}</style>
