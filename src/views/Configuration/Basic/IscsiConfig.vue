<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import { GetWorkServerListApi } from '@/api/configuration/storage'
import {
  AddIscsiPortalApi,
  DeleteIscsiPortalApi,
  FormatIscsiLunApi,
  GetIscsiLunApi,
  GetIscsiLunStatusApi,
  GetIscsiPortalApi,
  UpdateIscsiLunApi,
  UpdateIscsiPortalApi,
  type IscsiPortalParam
} from '@/api/configuration/iscsi'

interface WorkServer {
  nodeId: string
  nodeType: string | number
  nodeName: string
}

interface IscsiPortal {
  index: number
  iscsiPortalId: number
  uuid?: string
  username: string
  password: string
  ip: string
  port: string
  online: boolean
}

interface IscsiLunStatus {
  bMount: boolean
  nUsage: number
  strStartTime: string
  strEndTime: string
}

interface IscsiLun {
  index: number
  iscsiLunId: number
  iscsiPortalId: number
  nodeId: string
  nodeName?: string
  target: string
  lun: string | number
  size: string | number
  LunStatus?: IscsiLunStatus
}

const { t } = useI18n()

const portalTableRef = ref<any>()
const lunTableRef = ref<any>()
const addFormRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()
const lunFormRef = ref<FormInstance>()

const loading = ref(false)
const lunLoading = ref(false)
const portalList = ref<IscsiPortal[]>([])
const selectedPortals = ref<IscsiPortal[]>([])
const search = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const addVisible = ref(false)
const editVisible = ref(false)
const lunVisible = ref(false)
const editLunVisible = ref(false)
const activePortal = ref<IscsiPortal | null>(null)
const lunList = ref<IscsiLun[]>([])
const currentLunPage = ref(1)
const lunPageSize = ref(10)
const nodeList = ref<WorkServer[]>([])

const defaultPortalForm = (): IscsiPortalParam => ({
  username: 'isuser',
  password: '12345',
  ip: '192.168.100.210',
  port: '3260'
})

const addForm = reactive<IscsiPortalParam>(defaultPortalForm())
const editForm = reactive<IscsiPortalParam>(defaultPortalForm())
const lunForm = reactive({
  iscsiPortalId: 0,
  iscsiLunId: 0,
  nodeId: ''
})

const isSuccess = (res: any) => {
  return res?.status === 200 && (res?.data?.code === 0 || res?.data?.msg === 'Success')
}

const resetPortalForm = (form: IscsiPortalParam) => {
  Object.assign(form, defaultPortalForm())
}

const rules = computed<FormRules>(() => ({
  username: [{ required: true, message: `${t('Common.comm_please_input')} ${t('CommLogin.comm_login_username')}`, trigger: 'blur' }],
  password: [{ required: true, message: `${t('Common.comm_please_input')} ${t('CommLogin.comm_login_password')}`, trigger: 'blur' }],
  ip: [{ required: true, message: `${t('Common.comm_please_input')} ${t('CommTable.comm_table_ip')}`, trigger: 'blur' }],
  port: [{
    required: true,
    validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
      const port = Number(value)
      if (value === '' || value === undefined || value === null) {
        callback(new Error(`${t('Common.comm_please_input')} ${t('CommTable.comm_table_port')}`))
      } else if (!Number.isInteger(port) || port < 1 || port > 65535) {
        callback(new Error('1-65535'))
      } else {
        callback()
      }
    },
    trigger: 'blur'
  }]
}))

const lunRules = computed<FormRules>(() => ({
  nodeId: [{ required: true, message: `${t('Common.comm_please_select')} ${t('Setting.set_work_server')}`, trigger: 'change' }]
}))

const filteredPortals = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) return portalList.value
  return portalList.value.filter(item => item.username?.toLowerCase().includes(keyword))
})

const pagedPortals = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredPortals.value.slice(start, start + pageSize.value)
})

const pagedLuns = computed(() => {
  const start = (currentLunPage.value - 1) * lunPageSize.value
  return lunList.value.slice(start, start + lunPageSize.value)
})

const normalizePortalPage = (deleteCount = 0) => {
  const totalPage = Math.ceil((filteredPortals.value.length - deleteCount) / pageSize.value)
  const nextPage = currentPage.value > totalPage ? totalPage : currentPage.value
  currentPage.value = nextPage < 1 ? 1 : nextPage
}

const loadWorkServers = async () => {
  const res = await GetWorkServerListApi()
  if (isSuccess(res)) {
    nodeList.value = res.data.result?.list ?? []
  }
}

const loadPortals = async () => {
  loading.value = true
  try {
    const res = await GetIscsiPortalApi()
    if (isSuccess(res)) {
      portalList.value = (res.data.result ?? []).map((item: any, index: number) => ({
        index: index + 1,
        iscsiPortalId: item.iscsiPortalId,
        uuid: item.uuid,
        username: item.username,
        password: item.password,
        ip: item.ip,
        port: item.port,
        online: item.online
      }))
      normalizePortalPage()
    } else {
      portalList.value = []
    }
  } finally {
    loading.value = false
  }
}

const loadLuns = async (iscsiPortalId: number) => {
  lunLoading.value = true
  try {
    const res = await GetIscsiLunApi(iscsiPortalId)
    if (isSuccess(res)) {
      lunList.value = (res.data.result ?? []).map((item: any, index: number) => {
        const node = nodeList.value.find(node => node.nodeId === item.nodeId)
        return {
          index: index + 1,
          iscsiLunId: item.iscsiLunId,
          iscsiPortalId: item.iscsiPortalId,
          nodeId: item.nodeId,
          nodeName: node?.nodeName ?? '',
          target: item.target,
          lun: item.lun,
          size: item.size
        }
      })
    } else {
      lunList.value = []
    }
  } finally {
    lunLoading.value = false
  }
}

const openAdd = () => {
  resetPortalForm(addForm)
  addVisible.value = true
  nextTick(() => addFormRef.value?.clearValidate())
}

const submitAdd = async () => {
  await addFormRef.value?.validate()
  const res = await AddIscsiPortalApi({ ...addForm })
  if (isSuccess(res)) {
    ElMessage({ message: t('CommTableEdit.comm_add_successfully'), type: 'success', duration: 2000 })
    addVisible.value = false
    loadPortals()
  } else {
    ElMessage({ message: t('CommTableEdit.comm_add_failed'), type: 'error', duration: 2000 })
  }
}

const openEdit = (row: IscsiPortal) => {
  Object.assign(editForm, {
    iscsiPortalId: row.iscsiPortalId,
    username: row.username,
    password: row.password,
    ip: row.ip,
    port: row.port
  })
  editVisible.value = true
  nextTick(() => editFormRef.value?.clearValidate())
}

const submitEdit = async () => {
  await editFormRef.value?.validate()
  const res = await UpdateIscsiPortalApi({ ...editForm })
  if (isSuccess(res)) {
    ElMessage({ message: t('CommTableEdit.comm_edit_successfully'), type: 'success', duration: 2000 })
    editVisible.value = false
    loadPortals()
  } else {
    ElMessage({ message: t('CommTableEdit.comm_edit_failed'), type: 'error', duration: 2000 })
  }
}

const deletePortals = async (rows: IscsiPortal[]) => {
  if (!rows.length) {
    ElMessage({ message: t('Common.comm_please_select'), type: 'warning', duration: 2000 })
    return
  }
  ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
    confirmButtonText: t('CommTableEdit.comm_ok'),
    cancelButtonText: t('CommTableEdit.comm_cancel'),
    customClass: 'DeleteConfirm'
  }).then(async () => {
    const res = await DeleteIscsiPortalApi({ ids: rows.map(item => item.iscsiPortalId) })
    if (isSuccess(res)) {
      ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success', duration: 2000 })
      normalizePortalPage(rows.length)
      selectedPortals.value = []
      portalTableRef.value?.clearSelection()
      loadPortals()
    } else {
      ElMessage({ message: t('CommTableEdit.comm_delete_failed'), type: 'error', duration: 2000 })
    }
  }).catch(() => { })
}

const openLunConfig = async (row: IscsiPortal) => {
  activePortal.value = row
  lunVisible.value = true
  currentLunPage.value = 1
  await loadLuns(row.iscsiPortalId)
}

const backToPortal = () => {
  lunVisible.value = false
  activePortal.value = null
  lunList.value = []
}

const openLunEdit = (row: IscsiLun) => {
  Object.assign(lunForm, {
    iscsiPortalId: row.iscsiPortalId,
    iscsiLunId: row.iscsiLunId,
    nodeId: row.nodeId
  })
  editLunVisible.value = true
  nextTick(() => lunFormRef.value?.clearValidate())
}

const submitLunEdit = async () => {
  await lunFormRef.value?.validate()
  const res = await UpdateIscsiLunApi({
    iscsiLunId: lunForm.iscsiLunId,
    nodeId: lunForm.nodeId
  })
  if (isSuccess(res)) {
    ElMessage({ message: t('CommTableEdit.comm_edit_successfully'), type: 'success', duration: 2000 })
    editLunVisible.value = false
    loadLuns(lunForm.iscsiPortalId)
  } else {
    ElMessage({ message: t('CommTableEdit.comm_edit_failed'), type: 'error', duration: 2000 })
  }
}

const formatLun = (row: IscsiLun) => {
  ElMessageBox.confirm(t('Message.msg_going_format'), t('Common.comm_prompt'), {
    confirmButtonText: t('CommTableEdit.comm_ok'),
    cancelButtonText: t('CommTableEdit.comm_cancel'),
    customClass: 'DeleteConfirm'
  }).then(async () => {
    const res = await FormatIscsiLunApi({ iscsiLunId: row.iscsiLunId })
    if (isSuccess(res)) {
      ElMessage({ message: t('Message.msg_format_success'), type: 'success', duration: 2000 })
    } else {
      ElMessage({ message: t('Message.msg_format_failed'), type: 'error', duration: 2000 })
    }
  }).catch(() => { })
}

const getLunStatus = async (row: IscsiLun) => {
  lunTableRef.value?.toggleRowExpansion(row, false)
  delete row.LunStatus
  const res = await GetIscsiLunStatusApi({ iscsiLunId: row.iscsiLunId })
  if (isSuccess(res)) {
    row.LunStatus = res.data.result
    await nextTick()
    lunTableRef.value?.toggleRowExpansion(row, true)
  } else {
    ElMessage({ message: t('CommTableEdit.comm_get_failed'), type: 'error', duration: 2000 })
  }
}

onMounted(async () => {
  await loadWorkServers()
  loadPortals()
})
</script>

<template>
  <div class="iscsi-config">
    <div v-if="!lunVisible" class="portal-view">
      <div class="iscsi-header">
        <div class="left">
          <el-button type="primary" size="small" @click="openAdd">{{ t('CommTableEdit.comm_add') }}</el-button>
          <el-button size="small" class="normal" @click="deletePortals(selectedPortals)">{{ t('CommTableEdit.comm_delete') }}</el-button>
        </div>
      </div>

      <el-table
        ref="portalTableRef"
        :data="pagedPortals"
        v-loading="loading"
        stripe
        height="calc(100% - 92px)"
        style="width: 100%;"
        :empty-text="t('CommTable.comm_no_data_available')"
        @selection-change="selectedPortals = $event"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="index" :label="t('CommTable.comm_table_serial_number')" width="130" align="center" />
        <el-table-column prop="username" :label="t('CommLogin.comm_login_username')" min-width="140" align="center" show-overflow-tooltip />
        <el-table-column prop="ip" :label="t('CommTable.comm_table_ip')" min-width="150" align="center" />
        <el-table-column prop="port" :label="t('CommTable.comm_table_port')" width="110" align="center" />
        <el-table-column prop="password" :label="t('CommLogin.comm_login_password')" min-width="140" align="center" show-overflow-tooltip />
        <el-table-column :label="t('CommTable.comm_table_online')" width="120" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.online" disabled />
          </template>
        </el-table-column>
        <el-table-column :label="t('CommTableEdit.comm_operational')" min-width="240" align="center">
          <template #default="{ row }">
            <el-button type="text" size="small" @click="openLunConfig(row)">{{ t('Setting.set_lun_config') }}</el-button>
            <el-button type="text" size="small" @click="openEdit(row)">{{ t('CommTableEdit.comm_edit') }}</el-button>
            <el-button type="text" size="small" @click="deletePortals([row])">{{ t('CommTableEdit.comm_delete') }}</el-button>
          </template>
        </el-table-column>
        <el-table-column width="220" align="center">
          <template #header>
            <el-input v-model="search" clearable size="small" :placeholder="t('Common.comm_filtration')" />
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          background
          layout="total, prev, pager, next, sizes, jumper"
          :total="filteredPortals.length"
        />
      </div>
    </div>

    <div v-else class="lun-view">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="backToPortal">{{ t('Configuration.conf_iscsi_portal') }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ t('Setting.set_lun_config') }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <el-table
        ref="lunTableRef"
        :data="pagedLuns"
        v-loading="lunLoading"
        stripe
        height="calc(100% - 92px)"
        style="width: 100%;"
        :empty-text="t('CommTable.comm_no_data_available')"
      >
        <el-table-column type="expand" width="40">
          <template #default="{ row }">
            <div v-if="row.LunStatus" class="lun-status">
              <span>{{ t('Configuration.conf_iscsi_mount') }}:</span>
              <span v-if="row.LunStatus.bMount" class="online">{{ t('CommTableEdit.comm_online') }}</span>
              <span v-else class="offline">{{ t('CommTableEdit.comm_offline') }}</span>
              <span>{{ t('Configuration.conf_iscsi_usage') }}: {{ row.LunStatus.nUsage }}%</span>
              <span>{{ t('Configuration.conf_iscsi_start_time') }}: {{ row.LunStatus.strStartTime }}</span>
              <span>{{ t('Configuration.conf_iscsi_end_time') }}: {{ row.LunStatus.strEndTime }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="index" :label="t('CommTable.comm_table_serial_number')" width="130" align="center" />
        <el-table-column prop="nodeName" :label="t('Setting.set_work_server')" min-width="150" align="center" show-overflow-tooltip />
        <el-table-column prop="target" label="TARGET" min-width="260" align="center" show-overflow-tooltip />
        <el-table-column prop="lun" :label="t('Setting.set_lun_number')" width="130" align="center" />
        <el-table-column prop="size" :label="t('Setting.set_size')" width="130" align="center" />
        <el-table-column :label="t('CommTableEdit.comm_operational')" min-width="240" align="center">
          <template #default="{ row }">
            <el-button type="text" size="small" @click="openLunEdit(row)">{{ t('CommTableEdit.comm_configuration') }}</el-button>
            <el-button type="text" size="small" @click="formatLun(row)">{{ t('Setting.set_formatting') }}</el-button>
            <el-button type="text" size="small" @click="getLunStatus(row)">{{ t('Configuration.conf_iscsi_status') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentLunPage"
          v-model:page-size="lunPageSize"
          background
          layout="total, prev, pager, next, sizes, jumper"
          :total="lunList.length"
        />
      </div>
    </div>

    <el-dialog v-model="addVisible" width="420px" :title="t('CommTableEdit.comm_add')" class="dialog">
      <el-form ref="addFormRef" :model="addForm" :rules="rules" label-position="left" label-width="100px" size="small">
        <el-form-item :label="t('CommLogin.comm_login_username')" prop="username">
          <el-input v-model="addForm.username" />
        </el-form-item>
        <el-form-item :label="t('CommLogin.comm_login_password')" prop="password">
          <el-input v-model="addForm.password" />
        </el-form-item>
        <el-form-item :label="t('CommTable.comm_table_ip')" prop="ip">
          <el-input v-model="addForm.ip" />
        </el-form-item>
        <el-form-item :label="t('CommTable.comm_table_port')" prop="port">
          <el-input v-model="addForm.port" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="form_butt1" @click="addVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="submitAdd">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" width="420px" :title="t('CommTableEdit.comm_edit')" class="dialog">
      <el-form ref="editFormRef" :model="editForm" :rules="rules" label-position="left" label-width="100px" size="small">
        <el-form-item :label="t('CommLogin.comm_login_username')" prop="username">
          <el-input v-model="editForm.username" />
        </el-form-item>
        <el-form-item :label="t('CommLogin.comm_login_password')" prop="password">
          <el-input v-model="editForm.password" />
        </el-form-item>
        <el-form-item :label="t('CommTable.comm_table_ip')" prop="ip">
          <el-input v-model="editForm.ip" />
        </el-form-item>
        <el-form-item :label="t('CommTable.comm_table_port')" prop="port">
          <el-input v-model="editForm.port" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="form_butt1" @click="editVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="submitEdit">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editLunVisible" width="420px" :title="t('CommTableEdit.comm_configuration')" class="dialog">
      <el-form ref="lunFormRef" :model="lunForm" :rules="lunRules" label-position="left" label-width="120px" size="small">
        <el-form-item :label="t('Setting.set_work_server')" prop="nodeId">
          <el-select v-model="lunForm.nodeId" style="width: 100%;" :placeholder="t('Common.comm_please_select')">
            <el-option v-for="item in nodeList" :key="item.nodeId" :label="item.nodeName" :value="item.nodeId" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="form_butt1" @click="editLunVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="submitLunEdit">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.iscsi-config {
  width: 100%;
  height: 100%;
  padding: 0 20px 10px;

  .portal-view,
  .lun-view {
    width: 100%;
    height: 100%;
  }

  .iscsi-header {
    height: 40px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .bread-header {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #313131;

    .can-click {
      cursor: pointer;
    }
  }

  .pagination {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .lun-status {
    display: flex;
    justify-content: flex-end;
    gap: 18px;
    padding-right: 20px;

    .online {
      color: #06d20b;
    }

    .offline {
      color: #fe5003;
    }
  }
}
</style>
