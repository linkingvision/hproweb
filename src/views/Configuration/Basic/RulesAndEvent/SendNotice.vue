<template>
  <div class="notice-page">
    <SendNoticeForm v-if="mode !== 'list'" :mode="mode" :initial-data="editRow" @back="backToList" @saved="backToList" />
    <template v-else>
      <div class="devices_topBtn">
        <el-button class="form_butt" type="primary" @click="openAdd">{{ t('CommTableEdit.comm_add') }}</el-button>
        <el-button class="form_butt1" @click="deleteSelected">{{ t('CommTableEdit.comm_delete') }}</el-button>
      </div>
      <el-table v-loading="loading" :data="pagedRows" height="calc(100% - 104px)" @selection-change="handleSelectionChange" :empty-text="t('CommTable.comm_no_data_available')">
        <el-table-column type="selection" width="48" />
        <el-table-column prop="name" :label="t('CommTable.comm_table_name')" min-width="140" show-overflow-tooltip />
        <el-table-column prop="uuid" :label="'UUID'" min-width="180" show-overflow-tooltip />
        <el-table-column prop="emailRecipients" :label="t('RulesAndEvent.rule_recipient_email_address')" min-width="180" show-overflow-tooltip />
        <el-table-column prop="emailSubject" :label="t('Theme.theme')" min-width="150" show-overflow-tooltip />
        <el-table-column :label="t('RulesAndEvent.rule_message')" min-width="260">
          <template #default="{ row }"><span v-html="highlightMessage(row.emailMessage)"></span></template>
        </el-table-column>
        <el-table-column :label="t('Event.event_picture')" width="120" align="center"><template #default="{ row }"><el-switch v-model="row.includeImage" disabled /></template></el-table-column>
        <el-table-column prop="description" :label="t('RulesAndEvent.rule_description')" min-width="180" show-overflow-tooltip />
        <el-table-column :label="t('CommTableEdit.comm_operational')" width="160">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">{{ t('CommTableEdit.comm_edit') }}</el-button>
            <el-button link type="danger" @click="deleteRows([row])">{{ t('CommTableEdit.comm_delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination"><el-pagination background layout="total, prev, pager, next" :current-page="currentPage" :page-size="pageSize" :total="rows.length" @current-change="handleCurrentChange" /></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import SendNoticeForm from './Components/SendNoticeForm.vue'
import { DeleteNotificationConfApi, GetNotificationConfListApi, NOTIFICATION_EMAIL, type NotificationConf } from '@/api/configuration/rulesAndEvent'
const { t } = useI18n()
const mode = ref<'list'|'add'|'edit'>('list')
const loading = ref(false)
const rows = ref<NotificationConf[]>([])
const selectedRows = ref<NotificationConf[]>([])
const editRow = ref<NotificationConf | null>(null)
const currentPage = ref(1)
const pageSize = ref(15)
const pagedRows = computed(() => rows.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
function responseResult(res: any) { return res?.data?.result ?? [] }
function isSuccess(res: any) { return res?.data?.code === 0 || res?.data?.msg === 'Success' }
async function loadRows() { loading.value = true; try { const res:any = await GetNotificationConfListApi(NOTIFICATION_EMAIL); const result = responseResult(res); rows.value = Array.isArray(result) ? result : [] } finally { loading.value = false } }
function openAdd() { editRow.value = null; mode.value = 'add' }
function openEdit(row: NotificationConf) { editRow.value = row; mode.value = 'edit' }
function handleSelectionChange(selection: NotificationConf[]) { selectedRows.value = selection }
function handleCurrentChange(page: number) { currentPage.value = page }
async function backToList() { mode.value = 'list'; editRow.value = null; await loadRows() }
function highlightMessage(value = '') { return String(value).replace(/(\{\{[^}]+\}\})/g, '<span style="color:#0399FE;font-weight:600;">$1</span>') }
async function deleteSelected() { await deleteRows(selectedRows.value) }
async function deleteRows(target: NotificationConf[]) { if (!target.length) { ElMessage.warning(t('Common.comm_please_select')); return } const ids = target.map(i => i.id).filter((id): id is number => typeof id === 'number'); if (!ids.length) { ElMessage.warning(t('Common.comm_please_select')); return } try { await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), { confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel') }); const res:any = await DeleteNotificationConfApi({ ids }); if (isSuccess(res)) { ElMessage.success(t('CommTableEdit.comm_delete_successfully')); await loadRows() } else { ElMessage.error(t('CommTableEdit.comm_delete_failed')) } } catch {} }
onMounted(loadRows)
</script>
<style scoped lang="scss">.notice-page{height:100%;padding:0 10px;.devices_topBtn{height:54px;display:flex;align-items:center;gap:8px}.pagination{height:50px;display:flex;align-items:center}}</style>
