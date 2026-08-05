<template>
  <div class="Device">
    <!-- 添加弹窗 -->
    <el-dialog v-model="dialogFormVisible" :title="t('CommTableEdit.comm_configuration')" width="420px">
      <el-form label-position="left" label-width="100px" size="small">
        <el-form-item :label="t('CommTable.comm_table_type')">
          <el-select v-model="addForm.type" :placeholder="t('Common.comm_please_select')" @change="onAddTypeChange" style="width:250px;">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('Configuration.conf_playcode')" style="width:380px;">
          <el-input v-model="addForm.code"></el-input>
        </el-form-item>
        <el-form-item :label="t('Configuration.conf_role')">
          <el-select v-model="addForm.roleId" :placeholder="t('Common.comm_please_select')" style="width:250px;">
            <el-option v-for="item in roleList" :key="item.roleId" :label="item.roleName" :value="item.roleId"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="form_butt1" @click="dialogFormVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="addPlayCode">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editPopup" :title="t('CommTableEdit.comm_edit')" width="420px">
      <el-form label-position="left" label-width="100px" size="small">
        <el-form-item :label="t('CommTable.comm_table_type')">
          <el-select v-model="editForm.type" :placeholder="t('Common.comm_please_select')" @change="onEditTypeChange" style="width:250px;">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('Configuration.conf_playcode')" style="width:380px;">
          <el-input v-model="editForm.code"></el-input>
        </el-form-item>
        <el-form-item :label="t('Configuration.conf_role')">
          <el-select v-model="editForm.roleId" :placeholder="t('Common.comm_please_select')" style="width:250px;">
            <el-option v-for="item in roleList" :key="item.roleId" :label="item.roleName" :value="item.roleId"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="form_butt1" @click="editPopup = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="updatePlayCode">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>

    <!-- 工具栏 -->
    <div class="button_edi">
      <el-button class="form_butt" @click="openAdd" type="primary">{{ t('CommTableEdit.comm_add') }}</el-button>
      <el-button class="form_butt1" @click="deleteSelected">{{ t('CommTableEdit.comm_delete') }}</el-button>
    </div>

    <!-- 表格 -->
    <div class="table-wrap">
      <el-table :data="filteredTableData" stripe @select="selectCall" @select-all="selectAllCall"
        height="100%" style="width:100%" :empty-text="t('CommTable.comm_no_data_available')">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="index" :label="t('CommTableEdit.comm_table_serial_number')" width="150"></el-table-column>
        <el-table-column prop="code" :label="t('Configuration.conf_playcode')"></el-table-column>
        <el-table-column prop="roleName" :label="t('Configuration.conf_role')"></el-table-column>
        <el-table-column width="200">
          <template #header>
            <el-input v-model="search" size="small" :placeholder="t('Common.comm_filtration')" />
          </template>
          <template #default="scope">
            <el-button @click="openEdit(scope.row)" link size="small">{{ t('CommTableEdit.comm_edit') }}</el-button>
            <el-button @click="deleteRow(scope.row)" link size="small">{{ t('CommTableEdit.comm_delete') }}</el-button>
          </template>
        </el-table-column>
        <el-table-column></el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination background layout="total, prev, pager, next, sizes, jumper"
        @size-change="handleSizeChange" @current-change="handleCurrentChange"
        :current-page="currentPage" :total="total">
      </el-pagination>
      <el-button class="GoTo" size="small">{{ t('CommTable.comm_jump') }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from '@/api/http'

const { t } = useI18n()

// ── 表格 ────────────────────────────────────────────────────
const tableData   = ref<any[]>([])
const search      = ref('')
const currentPage = ref(1)
const pageSize    = ref(10)
const total       = ref(0)
const selectop    = ref<any[]>([])

const filteredTableData = computed(() =>
  tableData.value
    .filter(d => !search.value || d.code?.toLowerCase().includes(search.value.toLowerCase()))
    .slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
)

// ── 角色 ────────────────────────────────────────────────────
const roleList = ref<any[]>([])

// ── 类型选项 ─────────────────────────────────────────────────
const typeOptions = computed(() => [
  { value: '4',  label: `4 ${t('Common.comm_bytes')}`  },
  { value: '36', label: `36 ${t('Common.comm_bytes')}` },
])

// ── 表单 ─────────────────────────────────────────────────────
const dialogFormVisible = ref(false)
const editPopup         = ref(false)

const addForm = reactive({ type: '36', code: '', roleId: '' as any })
const editForm = reactive({ id: 0, uuid: '', type: '36', code: '', roleId: '' as any, roleName: '' })

// ── UUID 生成 ─────────────────────────────────────────────────
function genUUID(len?: number): string {
  const full = crypto.randomUUID().replace(/-/g, '')
  return len === 4 ? full.slice(0, 4) : crypto.randomUUID()
}

// ── 面板控制 ─────────────────────────────────────────────────
function openAdd() {
  addForm.type   = '36'
  addForm.code   = genUUID()
  addForm.roleId = roleList.value[0]?.roleId ?? ''
  dialogFormVisible.value = true
}

function openEdit(row: any) {
  editForm.id       = row.id
  editForm.uuid     = row.uuid
  editForm.code     = row.code
  editForm.roleId   = row.roleId
  editForm.roleName = row.roleName
  editForm.type     = row.code.length <= 4 ? '4' : '36'
  editPopup.value   = true
}

function onAddTypeChange(val: string) {
  addForm.code = genUUID(val === '4' ? 4 : undefined)
}
function onEditTypeChange(val: string) {
  editForm.code = genUUID(val === '4' ? 4 : undefined)
}

// ── API ──────────────────────────────────────────────────────
async function loadPlayCodes() {
  const res: any = await axios({ url: '/uapi/v1/PlayCode', method: 'GET' })
  if (res.status === 200) {
    const list = res.data.result ?? []
    tableData.value = list.map((item: any, i: number) => ({
      index: i + 1, id: item.id, uuid: item.uuid,
      code: item.code, roleId: item.roleId, roleName: item.roleName,
    }))
    total.value = tableData.value.length
  }
}

async function loadRoles() {
  const res: any = await axios({ url: '/uapi/v1/Role/List?pageSize=100000', method: 'GET' })
  if (res.status === 200) {
    roleList.value = (res.data.result?.list ?? []).map((r: any) => ({ roleId: r.roleId, roleName: r.name ?? r.roleName }))
  }
}

async function addPlayCode() {
  const res: any = await axios({
    url: '/uapi/v1/PlayCode', method: 'POST',
    data: { code: addForm.code, roleId: addForm.roleId },
  })
  if (res.status === 200 && res.data.msg === 'Success') {
    dialogFormVisible.value = false; await loadPlayCodes()
    ElMessage({ message: t('CommTableEdit.comm_add_successfully'), type: 'success', duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_add_failed'), type: 'error', duration: 5000 })
  }
}

async function updatePlayCode() {
  const res: any = await axios({
    url: '/uapi/v1/PlayCode', method: 'PUT',
    data: { uuid: editForm.uuid, code: editForm.code, roleId: editForm.roleId },
  })
  if (res.status === 200 && res.data.msg === 'Success') {
    editPopup.value = false; await loadPlayCodes()
    ElMessage({ message: t('CommTableEdit.comm_edit_successfully'), type: 'success', duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_edit_failed'), type: 'error', duration: 5000 })
  }
}

async function deleteRow(row: any) {
  await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
    confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel'),
  })
  const res: any = await axios({ url: '/uapi/v1/PlayCode', method: 'DELETE', data: { ids: [row.id] } })
  if (res.status === 200 && res.data.msg === 'Success') {
    await loadPlayCodes()
    ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success', duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_delete_failed'), type: 'error', duration: 5000 })
  }
}

async function deleteSelected() {
  if (!selectop.value.length) return
  await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
    confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel'),
  })
  const ids = selectop.value.map((s: any) => s.id)
  const res: any = await axios({ url: '/uapi/v1/PlayCode', method: 'DELETE', data: { ids } })
  if (res.status === 200 && res.data.msg === 'Success') {
    await loadPlayCodes()
    ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success', duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_delete_failed'), type: 'error', duration: 5000 })
  }
}

function handleSizeChange(val: number) { pageSize.value = val; currentPage.value = 1 }
function handleCurrentChange(val: number) { currentPage.value = val }
function selectCall(rows: any[])    { selectop.value = rows }
function selectAllCall(rows: any[]) { selectop.value = rows }

onMounted(async () => {
  await Promise.all([loadRoles(), loadPlayCodes()])
})
</script>

<style lang="scss" scoped>
.Device {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.button_edi {
  padding: 10px 10px 6px;
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.table-wrap {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.pagination {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  gap: 8px;
  flex-shrink: 0;
}

.form_butt  { height: 28px; padding: 0 14px; background: #019afd !important; color: #fff !important; border: none !important; }
.form_butt1 { height: 28px; padding: 0 14px; background: transparent !important; color: #fff !important; border: 1px solid #019afd !important; }
</style>
