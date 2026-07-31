<template>
  <div class="liveview Camera">
    <!-- 左侧：组织树 -->
    <div class="liveview_left">
      <el-collapse v-model="activeNames">
        <el-collapse-item name="1">
          <template #title>
            <div style="display:flex;justify-content:space-between;width:85%;align-items:center;">
              <div>{{ t('CommDev.comm_dev_root') }}</div>
              <div><i class="iconfont icon-shuaxin1" style="cursor:pointer;" @click.stop="refreshTree"></i></div>
            </div>
          </template>
          <el-input :placeholder="t('Common.comm_filtration')" v-model="filterText" style="margin:10px 0;"></el-input>
          <el-tree ref="treeRef" :data="treeData" node-key="uuid"
            :filter-node-method="filterNode" :props="treeProps"
            :default-expanded-keys="defaultExpandIds"
            :empty-text="t('CommTable.comm_no_data_available')"
            @node-click="handleNodeClick">
            <template #default="{ data }">
              <i :class="data.iconclass || 'iconfont icon-gen'" style="font-size:14px;"></i>
              <span style="padding-left:4px;">{{ data.groupName }}</span>
            </template>
          </el-tree>
        </el-collapse-item>
      </el-collapse>
    </div>
    <!-- 右侧：列表 -->
    <div class="liveview_right">
      <div class="devices_topBtn">
        <el-button class="form_butt" @click="openAdd" type="primary">{{ t('CommTableEdit.comm_add') }}</el-button>
        <el-button class="form_butt1" @click="deleteSelect">{{ t('CommTableEdit.comm_delete') }}</el-button>
      </div>
      <div class="table-wrap">
        <el-table :data="filteredTable" stripe height="100%" style="width:100%"
          @select="selectCall" @select-all="selectAllCall"
          :empty-text="t('CommTable.comm_no_data_available')">
          <el-table-column type="selection" width="55" align="center"></el-table-column>
          <el-table-column prop="groupName" :label="t('Setting.set_group_name')" min-width="140" align="center"></el-table-column>
          <el-table-column prop="roleName" :label="t('Configuration.conf_role')" min-width="120" align="center"></el-table-column>
          <el-table-column prop="groupParentName" :label="t('Setting.set_parentGroup')" min-width="140" align="center"></el-table-column>
          <el-table-column prop="description" :label="t('Common.comm_description')" min-width="150" align="center"></el-table-column>
          <el-table-column width="140" :label="t('CommTableEdit.comm_operational')" align="center">
            <template #default="scope">
              <el-button @click="handleEdit(scope.$index, scope.row)" link size="small">
                {{ t('CommTableEdit.comm_edit') }}
              </el-button>
              <el-button @click="deleteRow(scope.$index, scope.row)" link size="small">
                {{ t('CommTableEdit.comm_delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next, sizes, jumper"
          @size-change="handleSizeChange" @current-change="handleCurrentChange"
          :current-page="currentPage" :total="total">
        </el-pagination>
        <el-button class="GoTo" size="small">{{ t('CommTable.comm_jump') }}</el-button>
      </div>
    </div>
    <!-- 添加弹窗 -->
    <el-dialog v-model="dialogFormVisible" :title="t('CommTableEdit.comm_add')" width="420px">
      <el-form label-position="left" label-width="120px" size="small" :model="addForm">
        <el-form-item :label="t('Setting.set_group_name')">
          <el-input v-model="addForm.groupName"></el-input>
        </el-form-item>
        <el-form-item :label="t('Configuration.conf_role')">
          <el-select v-model="addForm.roleId" :placeholder="t('Common.comm_please_select')" style="width:100%;">
            <el-option v-for="item in roleList" :key="item.roleId"
              :label="item.roleName" :value="item.roleId"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('Setting.set_parentGroup')">
          <el-input v-model="addForm.parentName" readonly></el-input>
        </el-form-item>
        <el-form-item :label="t('Common.comm_description')">
          <el-input type="textarea" :rows="3" v-model="addForm.description"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="form_butt1" @click="dialogFormVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="addGroup">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>
    <!-- 编辑弹窗 -->
    <el-dialog v-model="editPopup" :title="t('CommTableEdit.comm_edit')" width="420px">
      <el-form label-position="left" label-width="120px" size="small" :model="editForm">
        <el-form-item :label="t('Setting.set_group_name')">
          <el-input v-model="editForm.groupName"></el-input>
        </el-form-item>
        <el-form-item :label="t('Configuration.conf_role')">
          <el-select v-model="editForm.roleId" :placeholder="t('Common.comm_please_select')" style="width:100%;">
            <el-option v-for="item in roleList" :key="item.roleId"
              :label="item.roleName" :value="item.roleId"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('Setting.set_parentGroup')">
          <el-popover ref="editGroupPopoverRef" placement="bottom" :width="292" trigger="click">
            <el-input :placeholder="t('Common.comm_filtration')" v-model="filterText1"
              style="margin-bottom:10px;"></el-input>
            <el-tree ref="tree1Ref" :data="treeData" node-key="uuid"
              :filter-node-method="filterNode1" :props="treeProps"
              :empty-text="t('CommTable.comm_no_data_available')"
              @node-click="handleNodeClick1">
              <template #default="{ data }">
                <i :class="data.iconclass || 'iconfont icon-gen'" style="font-size:14px;"></i>
                <span style="padding-left:4px;">{{ data.groupName }}</span>
              </template>
            </el-tree>
            <template #reference>
              <el-input v-model="editForm.parentName" :placeholder="t('Common.comm_please_select')"></el-input>
            </template>
          </el-popover>
        </el-form-item>
        <el-form-item :label="t('Common.comm_description')">
          <el-input type="textarea" :rows="3" v-model="editForm.description"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="form_butt1" @click="editPopup = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="editGroup">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from '@/api/http'

const { t } = useI18n()

// ── 树 ────────────────────────────────────────────────────
const treeRef = ref<any>(null)
const tree1Ref = ref<any>(null)
const editGroupPopoverRef = ref<any>(null)
const treeData = ref<any[]>([])
const defaultExpandIds = ref<any[]>([])
const filterText = ref('')
const filterText1 = ref('')
const activeNames = ref(['1'])
const treeProps = { children: 'children', label: 'groupName' }

// ── 表格 ──────────────────────────────────────────────────
const tableData = ref<any[]>([])
const search = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectop = ref<any[]>([])

// ── 上下文 ────────────────────────────────────────────────
const addTreeData = ref<any>({})
const editTreeData = ref<any>({})
const editGroupId = ref<string | number>('')
const breadList = ref<any[]>([])
const roleList = ref<any[]>([])

// ── 表单 ─────────────────────────────────────────────────
const addForm = reactive({ groupName: 'Group1', description: '', roleId: '' as any, parentId: '' as any, parentName: '' })
const editForm = reactive({ groupName: '', description: '', roleId: '' as any, parentId: '' as any, parentName: '' })
const dialogFormVisible = ref(false)
const editPopup = ref(false)

// ── 过滤+分页后的数据 ─────────────────────────────────────
const filteredTable = computed(() =>
  tableData.value
    .filter(d => !search.value ||
      d.groupName?.toLowerCase().includes(search.value.toLowerCase()) ||
      (d.token ?? '').toLowerCase().includes(search.value.toLowerCase()))
    .slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
)

// ── API：加载组织树 ─────────────────────────────────────────
async function loadGroupTree() {
  const res: any = await axios({ url: '/uapi/v1/Group/List?pageSize=100000', method: 'GET' })
  if (res.status === 200) {
    const list = res.data.result?.list ?? res.data.result ?? []
    treeData.value = list
    if (list.length > 0) defaultExpandIds.value = [list[0].uuid]
  }
}

// ── API：加载角色列表 ───────────────────────────────────────
async function loadRoles() {
  const res: any = await axios({ url: '/uapi/v1/Role/List?pageSize=100000', method: 'GET' })
  if (res.status === 200) {
    roleList.value = (res.data.result?.list ?? []).map((r: any) => ({ roleId: r.roleId, roleName: r.name }))
    if (roleList.value.length > 0) addForm.roleId = roleList.value[0].roleId
  }
}

function refreshTree() { loadGroupTree() }

// ── 树节点点击 ─────────────────────────────────────────────
function getparentsNode(node: any) {
  if (!node.parent) return
  breadList.value.unshift(node)
  getparentsNode(node.parent)
}

function handleNodeClick(data: any, node: any) {
  breadList.value = []
  const n = treeRef.value?.getNode(node)
  if (n) getparentsNode(n)
  currentPage.value = 1
  tableData.value = []
  addTreeData.value = { groupName: data.groupName, groupId: data.groupId }
  const children: any[] = data.children ?? []
  if (children.length > 0) {
    children.forEach((c: any, i: number) => {
      const row: any = {
        index: i + 1, parentId: c.parentId, groupId: c.groupId, groupName: c.groupName,
        description: c.description, iconclass: c.iconclass, uuid: c.uuid, roleId: c.roleId,
        groupParentName: data.groupName,
      }
      const role = roleList.value.find(r => r.roleId === c.roleId)
      if (role) row.roleName = role.roleName
      tableData.value.push(row)
    })
    editTreeData.value = { groupName: data.groupName, groupId: data.groupId }
  } else {
    const row: any = {
      index: 1, parentId: data.parentId, groupId: data.groupId, groupName: data.groupName,
      description: data.description, iconclass: data.iconclass, uuid: data.uuid, roleId: data.roleId,
    }
    const role = roleList.value.find(r => r.roleId === data.roleId)
    if (role) row.roleName = role.roleName
    tableData.value.push(row)
    if (breadList.value.length >= 2) {
      const p = breadList.value[breadList.value.length - 2]
      editTreeData.value = { groupName: p.data.groupName, groupId: p.data.groupId }
    }
    row.groupParentName = editTreeData.value.groupName
  }
  total.value = tableData.value.length
}

// ── 打开添加弹窗 ────────────────────────────────────────────
function openAdd() {
  dialogFormVisible.value = true
  if (addTreeData.value.groupId === undefined) {
    addForm.parentName = treeData.value[0]?.groupName ?? ''
    addForm.parentId = treeData.value[0]?.groupId ?? ''
  } else {
    addForm.parentName = addTreeData.value.groupName
    addForm.parentId = addTreeData.value.groupId
  }
}

// ── API：新增组织 ───────────────────────────────────────────
async function addGroup() {
  dialogFormVisible.value = false
  const res: any = await axios({
    url: '/uapi/v1/Group/Item', method: 'POST',
    data: { parentId: Number(addForm.parentId), roleId: Number(addForm.roleId), description: addForm.description, groupName: addForm.groupName },
  })
  if (res.status === 200 && res.data.msg === 'Success') {
    tableData.value = []
    await loadGroupTree()
    ElMessage({ message: t('CommTableEdit.comm_add_successfully'), type: 'success', duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_add_failed'), type: 'error', duration: 5000 })
  }
}

// ── 打开编辑弹窗 ────────────────────────────────────────────
function handleEdit(_index: number, row: any) {
  editForm.groupName = row.groupName
  editForm.description = row.description
  editForm.roleId = row.roleId
  editForm.parentName = editTreeData.value.groupName ?? ''
  editForm.parentId = editTreeData.value.groupId ?? ''
  editGroupId.value = row.groupId
  editPopup.value = true
}

// 编辑弹窗内树节点点击（选择上级组织）
function handleNodeClick1(data: any) {
  editGroupPopoverRef.value?.hide()
  editForm.parentName = data.groupName
  editForm.parentId = data.groupId
}

// ── API：编辑组织 ───────────────────────────────────────────
async function editGroup() {
  editPopup.value = false
  const res: any = await axios({
    url: `/uapi/v1/Group/Item/${editGroupId.value}`, method: 'PUT',
    data: { parentId: Number(editForm.parentId), roleId: Number(editForm.roleId), description: editForm.description, groupName: editForm.groupName },
  })
  if (res.status === 200 && res.data.msg === 'Success') {
    tableData.value = []
    await loadGroupTree()
    ElMessage({ message: t('CommTableEdit.comm_edit_successfully'), type: 'success', duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_edit_failed'), type: 'error', duration: 5000 })
  }
}

// ── 删除（单行）────────────────────────────────────────────
function dleChangePage(size: number) {
  const p = Math.ceil((total.value - size) / pageSize.value)
  const page = currentPage.value > p ? p : currentPage.value
  currentPage.value = page < 1 ? 1 : page
}

async function deleteRow(index: number, row: any) {
  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
      confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel'),
    })
    const realIdx = (currentPage.value - 1) * pageSize.value + index
    const res: any = await axios({ url: '/uapi/v1/Group/Item', method: 'DELETE', data: { ids: [row.groupId] } })
    if (res.status === 200 && res.data.msg === 'Success') {
      if (row.groupId === addTreeData.value.groupId) addTreeData.value = {}
      dleChangePage(1)
      tableData.value.splice(realIdx, 1)
      total.value = tableData.value.length
      treeRef.value?.remove(row.uuid)
      ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success', duration: 5000 })
    } else {
      ElMessage({ message: t('CommTableEdit.comm_delete_failed'), type: 'error', duration: 5000 })
    }
  } catch { }
}

// ── 删除（批量）────────────────────────────────────────────
async function deleteSelect() {
  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
      confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel'),
    })
    const ids = selectop.value.map((s: any) => s.groupId)
    const res: any = await axios({ url: '/uapi/v1/Group/Item', method: 'DELETE', data: { ids } })
    if (res.status === 200 && res.data.msg === 'Success') {
      for (let i = selectop.value.length - 1; i >= 0; i--) {
        tableData.value.splice(selectop.value[i].index, 1)
        treeRef.value?.remove(selectop.value[i].uuid)
        if (selectop.value[i].groupId === addTreeData.value.groupId) addTreeData.value = {}
      }
      dleChangePage(selectop.value.length)
      total.value = tableData.value.length
      ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success', duration: 5000 })
    } else {
      ElMessage({ message: t('CommTableEdit.comm_delete_failed'), type: 'error', duration: 5000 })
    }
  } catch { }
}

// ── 表格选中 ───────────────────────────────────────────────
function selectCall(rows: any[]) {
  selectop.value = rows.map((r: any, i: number) => ({ groupId: r.groupId, index: i, uuid: r.uuid }))
}
function selectAllCall(rows: any[]) {
  selectop.value = rows.map((r: any, i: number) => ({
    groupId: r.groupId, index: (currentPage.value - 1) * pageSize.value + i, uuid: r.uuid,
  }))
}

// ── 过滤 / 分页 ────────────────────────────────────────────
function filterNode(value: string, data: any) { return !value || data.groupName?.indexOf(value) !== -1 }
function filterNode1(value: string, data: any) { return !value || data.groupName?.indexOf(value) !== -1 }
function handleSizeChange(val: number) { currentPage.value = 1; pageSize.value = val }
function handleCurrentChange(val: number) { currentPage.value = val }

// ── Watch / 初始化 ─────────────────────────────────────────
watch(filterText, val => treeRef.value?.filter(val))
watch(filterText1, val => tree1Ref.value?.filter(val))

onMounted(() => { loadGroupTree(); loadRoles() })
</script>

<style scoped lang="scss">
.liveview {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;

  .liveview_left {
    width: 16%;
    min-width: 260px;
    overflow-y: auto;
    &::-webkit-scrollbar { display: none; }

    :deep(.el-collapse-item__content) {
      height: calc(100vh - 120px);
      padding: 0 10px;
      overflow: auto;
      &::-webkit-scrollbar { width: 8px; }
      &::-webkit-scrollbar-thumb { border-radius: 5px; background: rgba(218,218,218,0.2); }
      &::-webkit-scrollbar-track { background: rgba(218,218,218,0.1); }
    }
  }

  .liveview_right {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;

    .devices_topBtn {
      padding: 10px 10px 6px;
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .table-wrap {
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .pagination {
      display: flex;
      align-items: center;
      padding: 8px 10px;
      gap: 8px;
      flex-shrink: 0;
    }
  }
}

/* 弹窗内 textarea 继承背景色（修复白色问题）*/
:deep(.el-textarea__inner) {
  background-color: inherit !important;
  color: inherit;
}

/* readonly input 与普通 input 外观一致 */
:deep(.el-input__inner[readonly]) {
  background-color: inherit !important;
  cursor: default;
}
</style>