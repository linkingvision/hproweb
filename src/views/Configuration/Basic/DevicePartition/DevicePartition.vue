<script lang="ts" setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  GetDevPartitionApi,
  AddDevPartitionApi,
  EditDevPartitionApi,
  DelDevPartitionApi,
  MoveDevPartitionApi,
} from '@/api/configuration/device'

const { t } = useI18n()

// Types
interface PartitionNode {
  devPartitionId: number
  devPartitionName: string
  parentId: number
  description: string
  uuid?: string
  iconclass?: string
  isFirst?: boolean
  isLast?: boolean
  orderShow?: boolean
  children?: PartitionNode[]
}

// State 
const loading        = ref(false)
const treeRef        = ref()
const treeData       = ref<PartitionNode[]>([])
const tableData      = ref<PartitionNode[]>([])
const expandedKeys   = ref<number[]>([])
const currentNode    = ref<PartitionNode | null>(null)
const collapseActive = ref<string[]>(['partition'])
const filterText     = ref('')
const selectedRows   = ref<PartitionNode[]>([])

// Pagination 
const currentPage = ref(1)
const pageSize    = ref(10)
const total       = ref(0)

const pagedData = () => {
  const start = (currentPage.value - 1) * pageSize.value
  return tableData.value.slice(start, start + pageSize.value)
}

// Dialog 
const addDialogVisible  = ref(false)
const editDialogVisible = ref(false)
const formRef           = ref()
const editFormRef       = ref()
const editTreeRef       = ref()
const editPopoverRef    = ref()
const filterText1       = ref('')

interface AddForm { devPartitionName: string; parentName: string; description: string }
interface EditForm { devPartitionId: number; devPartitionName: string; parentId: number; parentName: string; description: string }

const addForm  = ref<AddForm>({ devPartitionName: 'DevicePartition1', parentName: '', description: 'DevicePartition1 Description' })
const editForm = ref<EditForm>({ devPartitionId: 0, devPartitionName: '', parentId: 10000, parentName: '', description: '' })

const treeProps = { label: 'devPartitionName', children: 'children' }


// Tree helpers
function collectIds(nodes: PartitionNode[]): number[] {
  return nodes.flatMap(n => [n.devPartitionId, ...collectIds(n.children ?? [])])
}

// Walk up the ancestor chain to check if any ancestor matches the filter
function checkBelongToChooseNode(value: string, node: any): boolean {
  if (node.level === 1) return false
  let parent = node.parent
  let index = 0
  while (index < node.level - 1) {
    if ((parent.data?.devPartitionName ?? '').toLowerCase().includes(value.toLowerCase())) return true
    parent = parent.parent
    index++
  }
  return false
}

function filterNode(value: string, data: PartitionNode, node: any) {
  if (!value) return true
  if ((data.devPartitionName ?? '').toLowerCase().includes(value.toLowerCase())) return true
  return checkBelongToChooseNode(value, node)
}

watch(filterText, val => {
  treeRef.value?.filter(val)
})

// Load 
async function loadTree() {
  loading.value = true
  try {
    const res = await GetDevPartitionApi()
    if (res.status !== 200 || !res.data?.result) return
    const root: PartitionNode[] = res.data.result ?? []
    treeData.value = root
    // Only set default expanded keys on first load; preserve existing expanded state on subsequent refreshes
    if (expandedKeys.value.length === 0 && root.length > 0 && root[0]) {
      expandedKeys.value = [root[0].devPartitionId]
    }
    if (root.length > 0 && root[0]) {
      showRootInTable(root[0])
    }
  } catch (e) {
    console.warn('[DevicePartition] load error', e)
  } finally {
    loading.value = false
  }
}

function showRootInTable(node: PartitionNode) {
  currentNode.value = node
  tableData.value = node.children ?? []
  total.value = tableData.value.length
  currentPage.value = 1
}

function handleNodeClick(node: PartitionNode) {
  currentNode.value = node
  if (node.children && node.children.length > 0) {
    tableData.value = node.children
  } else {
    tableData.value = [node]
  }
  total.value = tableData.value.length
  currentPage.value = 1
}

// Navigate home: return to root without re-fetching
function handleHome() {
  if (treeData.value.length > 0) {
    const root = treeData.value[0]
    if (root) {
      showRootInTable(root)
      treeRef.value?.setCurrentKey(root.devPartitionId)
    }
  }
}

// Tree node hover sort
function handleNodeExpand(_: any, data: PartitionNode) {
  if (!expandedKeys.value.includes(data.devPartitionId)) {
    expandedKeys.value.push(data.devPartitionId)
  }
}

function removeChildIds(node: PartitionNode) {
  ;(node.children ?? []).forEach(child => {
    expandedKeys.value = expandedKeys.value.filter(id => id !== child.devPartitionId)
    removeChildIds(child)
  })
}

function handleNodeCollapse(_: any, data: PartitionNode) {
  expandedKeys.value = expandedKeys.value.filter(id => id !== data.devPartitionId)
  removeChildIds(data)
}

function handleMouseover(node: any, data: PartitionNode) {
  if (!node.parent) return
  const siblings: PartitionNode[] = node.parent.childNodes
  const idx = siblings.findIndex((c: any) => c.data === data)
  data.isFirst  = idx === 0
  data.isLast   = idx === siblings.length - 1
  data.orderShow = true
}

function handleMouseout(data: PartitionNode) {
  data.orderShow = false
}

async function handleTreeOrder(type: 'moveUp' | 'moveDown', node: any, data: PartitionNode) {
  const siblings: any[] = node.parent.childNodes
  const idx = siblings.findIndex((c: any) => c.data === data)
  const target = type === 'moveUp' ? siblings[idx - 1]?.data : siblings[idx + 1]?.data
  if (!target) return

  // Optimistic update: swap immediately in local array so the UI responds instantly
  const parentData = node.parent.data
  const childrenArr: PartitionNode[] = parentData?.children ?? treeData.value
  const dataIdx   = childrenArr.findIndex(c => c.devPartitionId === data.devPartitionId)
  const targetIdx = childrenArr.findIndex(c => c.devPartitionId === target.devPartitionId)
  if (dataIdx !== -1 && targetIdx !== -1 && childrenArr[dataIdx] && childrenArr[targetIdx]) {
    const tmp = childrenArr[dataIdx]!
    childrenArr[dataIdx]   = childrenArr[targetIdx]!
    childrenArr[targetIdx] = tmp
  }

  try {
    await MoveDevPartitionApi(data.devPartitionId, target.devPartitionId)
    ElMessage.success(t('CommTableEdit.comm_modify_successfully'))
  } catch {
    ElMessage.error(t('CommTableEdit.comm_modify_failed'))
    loadTree()  // Roll back the optimistic swap on API failure
  }
}

// Table selection 
function handleSelect(rows: PartitionNode[]) {
  selectedRows.value = rows
}

// Pagination 
function handleSizeChange(val: number) {
  pageSize.value = val
  currentPage.value = 1
}
function handleCurrentChange(val: number) {
  currentPage.value = val
}

// Add 
function handleAdd() {
  addForm.value.parentName = currentNode.value?.devPartitionName ?? ''
  addDialogVisible.value = true
}

async function submitAdd() {
  try {
    await AddDevPartitionApi({
      parentId: currentNode.value?.devPartitionId ?? 10000,
      devPartitionName: addForm.value.devPartitionName,
      description: addForm.value.description,
    })
    ElMessage.success(t('CommTableEdit.comm_add_successfully'))
    addDialogVisible.value = false
    loadTree()
  } catch {
    ElMessage.error(t('CommTableEdit.comm_add_failed'))
  }
}

// Edit
function handleEdit(row: PartitionNode) {
  const parent = findNodeById(treeData.value, row.parentId)
  editForm.value = {
    devPartitionId:   row.devPartitionId,
    devPartitionName: row.devPartitionName,
    parentId:         row.parentId,
    parentName:       parent?.devPartitionName ?? '',
    description:      row.description ?? '',
  }
  filterText1.value = ''
  editDialogVisible.value = true
}

function handleEditParentClick(data: PartitionNode) {
  editForm.value.parentId   = data.devPartitionId
  editForm.value.parentName = data.devPartitionName
  editPopoverRef.value?.hide()
}

watch(filterText1, val => {
  editTreeRef.value?.filter(val)
})

async function submitEdit() {
  try {
    await EditDevPartitionApi({
      devPartitionId:   editForm.value.devPartitionId,
      parentId:         editForm.value.parentId,
      devPartitionName: editForm.value.devPartitionName,
      description:      editForm.value.description,
    })
    ElMessage.success(t('CommTableEdit.comm_edit_successfully'))
    editDialogVisible.value = false
    loadTree()
  } catch {
    ElMessage.error(t('CommTableEdit.comm_edit_failed'))
  }
}

// Delete single
async function deleteRow(row: PartitionNode) {
  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), { type: 'warning' })
    const res = await DelDevPartitionApi({ ids: [row.devPartitionId] })
    if (res.data?.code === 0) {
      ElMessage.success(t('CommTableEdit.comm_delete_successfully'))
      loadTree()
    } else {
      if (res.data?.code === 12006) {
        ElMessage.error(t('CommTableEdit.comm_delete_secondary_region_first'))
      } else if (res.data?.code === 12007) {
        ElMessage.error(t('CommTableEdit.comm_delete_resources'))
      } else {
        ElMessage.error(t('CommTableEdit.comm_delete_failed'))
      }
    }
  } catch (err: any) {
    if (err !== 'cancel') ElMessage.error(t('CommTableEdit.comm_delete_failed'))
  }
}

// Batch delete 
async function deleteSelect() {
  if (!selectedRows.value.length) {
    ElMessage.warning(t('Common.comm_please_select'))
    return
  }
  const ids = selectedRows.value
    .filter(r => r.devPartitionId !== 10000)
    .map(r => r.devPartitionId)
  if (!ids.length) return
  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), { type: 'warning' })
    const res = await DelDevPartitionApi({ ids })
    if (res.data?.code === 0) {
      ElMessage.success(t('CommTableEdit.comm_delete_successfully'))
      selectedRows.value = []
      loadTree()
    } else {
      if (res.data?.code === 12006) {
        ElMessage.error(t('CommTableEdit.comm_delete_secondary_region_first'))
      } else if (res.data?.code === 12007) {
        ElMessage.error(t('CommTableEdit.comm_delete_resources'))
      } else {
        ElMessage.error(t('CommTableEdit.comm_delete_failed'))
      }
    }
  } catch (err: any) {
    if (err !== 'cancel') ElMessage.error(t('CommTableEdit.comm_delete_failed'))
  }
}

// Helpers 
function findNodeById(nodes: PartitionNode[], id: number): PartitionNode | null {
  for (const n of nodes) {
    if (n.devPartitionId === id) return n
    if (n.children) {
      const found = findNodeById(n.children, id)
      if (found) return found
    }
  }
  return null
}

onMounted(loadTree)
</script>

<template>
  <div class="device-partition">
    <!-- Left tree panel -->
    <div class="liveview_left">
      <el-collapse v-model="collapseActive">
        <el-collapse-item name="partition">
          <template #title>
            <div class="tree-header">
              <span>{{ t('CommDev.comm_dev_root') }}</span>
              <div class="liveview_colltitle">
                <div class="liveview_titleicon1 iconfont icon-Home" @click.stop="handleHome"></div>
                <div class="liveview_titleicon1 iconfont icon-shuaxin1" @click.stop="loadTree"></div>
              </div>
            </div>
          </template>

          <el-input
            v-model="filterText"
            :placeholder="t('Common.comm_filtration')"
            class="tree-search"
          >
            <template #prefix><i class="iconfont icon-sousuo1"></i></template>
          </el-input>

          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="treeProps"
            node-key="devPartitionId"
            :default-expanded-keys="expandedKeys"
            :highlight-current="true"
            :filter-node-method="filterNode"
            @node-click="handleNodeClick"
            @node-expand="handleNodeExpand"
            @node-collapse="handleNodeCollapse"
          >
            <template #default="{ node, data }">
              <span
                class="tree-node"
                style="width:100%"
                @mouseover="handleMouseover(node, data)"
                @mouseleave="handleMouseout(data)"
              >
                <div class="tree-node-left">
                  <i :class="data.iconclass || 'iconfont icon-gen'" style="font-size:13px;"></i>
                  <span style="padding-left:4px;">{{ data.devPartitionName }}</span>
                  <span v-show="!data.orderShow" style="display:inline-block;width:65px;"></span>
                </div>
                <div v-show="data.orderShow" class="order-btns">
                  <i v-if="!data.isFirst" class="iconfont icon-shunxushang" @click.stop="handleTreeOrder('moveUp', node, data)"></i>
                  <i v-if="!data.isLast"  class="iconfont icon-shunxuxia"  @click.stop="handleTreeOrder('moveDown', node, data)"></i>
                </div>
              </span>
            </template>
          </el-tree>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- Right content panel -->
    <div class="liveview_right">
      <div class="sdk_button1">
        <div class="button_edi">
          <el-button class="form_butt" type="primary" @click="handleAdd">
            {{ t('CommTableEdit.comm_add') }}
          </el-button>
          <el-button class="form_butt1" @click="deleteSelect">
            {{ t('CommTableEdit.comm_delete') }}
          </el-button>
        </div>
      </div>

      <div class="table-wrap">
        <el-table
          v-loading="loading"
          :data="pagedData()"
          height="100%"
          style="width:100%"
          :stripe="false"
          :empty-text="t('CommTable.comm_no_data_available')"
          @selection-change="handleSelect"
        >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="devPartitionName" :label="t('Partition.part_name')" align="center" />
        <el-table-column prop="devPartitionId"   :label="t('Partition.part_id')" align="center" />
        <el-table-column :label="t('CommTableEdit.comm_operational')" align="center">
          <template #default="{ row }">
            <el-button type="text" size="small" class="operatingButton" @click="handleEdit(row)">
              {{ t('CommTableEdit.comm_edit') }}
            </el-button>
            <el-button
              v-if="row.devPartitionId !== 10000"
              type="text" size="small" class="operatingButton"
              @click="deleteRow(row)"
            >
              {{ t('CommTableEdit.comm_delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      </div><!-- /table-wrap -->

      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes, jumper"
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- Add dialog -->
    <el-dialog
      v-model="addDialogVisible"
      :title="t('CommTableEdit.comm_configuration')"
      width="35%"
      class="AddPartition"
      destroy-on-close
    >
      <el-form ref="formRef" :model="addForm" label-position="left" label-width="auto">
        <el-form-item :label="t('Partition.part_name')">
          <el-input v-model="addForm.devPartitionName" />
        </el-form-item>
        <el-form-item :label="t('Partition.part_parent')">
          <el-input v-model="addForm.parentName" readonly />
        </el-form-item>
        <el-form-item :label="t('Common.comm_description')">
          <el-input v-model="addForm.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="form_butt1" @click="addDialogVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="submitAdd">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>

    <!-- Edit dialog -->
    <el-dialog
      v-model="editDialogVisible"
      :title="t('CommTableEdit.comm_edit')"
      width="35%"
      class="AddPartition"
      destroy-on-close
    >
      <el-form ref="editFormRef" :model="editForm" label-position="left" label-width="auto">
        <el-form-item :label="t('Partition.part_name')" prop="devPartitionName">
          <el-input v-model="editForm.devPartitionName" />
        </el-form-item>
        <!-- Parent partition field: clicking the input opens a tree picker -->
        <el-form-item v-if="editForm.devPartitionId !== 10000" :label="t('Partition.part_parent')">
          <el-popover ref="editPopoverRef" placement="bottom" width="400" trigger="click">
            <template #reference>
              <el-input v-model="editForm.parentName" :placeholder="t('Common.comm_please_select')" readonly class="focusInput" />
            </template>
            <el-input
              v-model="filterText1"
              :placeholder="t('Common.comm_filtration')"
              style="margin-bottom:10px;"
            >
              <template #prefix><i class="iconfont icon-sousuo1"></i></template>
            </el-input>
            <el-tree
              ref="editTreeRef"
              :data="treeData"
              :props="treeProps"
              node-key="devPartitionId"
              :filter-node-method="filterNode"
              :default-expanded-keys="expandedKeys"
              @node-click="handleEditParentClick"
            >
              <template #default="{ data }">
                <span>
                  <i :class="data.iconclass || 'iconfont icon-gen'" style="font-size:13px;" />
                  <span style="padding-left:4px;">{{ data.devPartitionName }}</span>
                </span>
              </template>
            </el-tree>
          </el-popover>
        </el-form-item>
        <el-form-item :label="t('Common.comm_description')">
          <el-input v-model="editForm.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="form_butt1" @click="editDialogVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="submitEdit">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.device-partition {
  display: flex;
  height: 100%;
  background-color: #181818;

  .liveview_left {
    width: 16%;
    min-width: 200px;
    background-color: #212121;
    border-right: 1px solid #313131;
    display: flex;
    flex-direction: column;
    overflow-y: auto;

    .tree-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      font-size: 14px;
      font-weight: 600;
    }

    .liveview_colltitle {
      display: flex;

      .liveview_titleicon1 {
        width: 35px;
        height: 35px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        font-size: 18px;
        cursor: pointer;
        color: #ccc;

        &:hover {
          background: #232323;
          color: #fff;
        }
      }
    }

    :deep(.el-collapse-item__header) {
      display: flex;
      align-items: center;
    }
    :deep(.el-collapse-item__header > span:first-child) {
      flex: 1;
      min-width: 0;
    }

    .tree-search {
      padding: 6px 8px;
    }

    .tree-node {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      font-size: 13px;

      .tree-node-left {
        display: flex;
        align-items: center;
      }

      .order-btns {
        display: flex;
        gap: 6px;
        i {
          font-size: 13px;
          cursor: pointer;
          color: #ccc;
          &:hover { color: #0399FE; }
        }
      }
    }

    :deep(.el-collapse) { border: none; --el-collapse-border-color: transparent; }
    :deep(.el-collapse-item__header) {
      background-color: #212121;
      color: #fff;
      border-bottom: 1px solid #313131;
      padding: 0 12px;
      height: 40px;
    }
    :deep(.el-collapse-item__content) { background-color: #212121; padding: 0; }
    :deep(.el-collapse-item__wrap)    { border-bottom: none; }
    :deep(.el-tree) { background: transparent; color: #ccc; }
    :deep(.el-tree-node__content) {
      height: 32px;
      &:hover { background-color: #2a2a2a; }
    }
    :deep(.el-tree-node.is-current > .el-tree-node__content) {
      background-color: rgba(3, 153, 254, 0.2);
      color: #0399FE;
    }
  }

  .liveview_right {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .sdk_button1 {
      padding: 10px;
      border-bottom: 1px solid #313131;
      .button_edi {
        display: flex;
        gap: 8px;
        .form_butt  { height: 28px; }
        .form_butt1 {
          height: 28px;
          background-color: transparent;
          border: 1px solid #0399FE;
          span { color: #0399FE; }
        }
      }
    }

    .table-wrap {
      flex: 1;
      overflow: hidden;
      min-height: 0;
    }

    :deep(.el-table) {
      background: transparent;
      .el-table__header th { background-color: #2A2A2A !important; }
      .el-table__body-wrapper { background-color: #202020; }
    }

    .operatingButton { color: #0399FE; }

    .pagination {
      padding: 8px 10px;
      display: flex;
      justify-content: flex-end;
    }
  }
}

.form_butt1 {
  background-color: transparent;
  border: 1px solid #0399FE;
  span { color: #0399FE; }
}
.focusInput { cursor: pointer; }

:global(.el-dialog.AddPartition) {
  min-height: 65%;
  padding: 20px;
}

// Dark background overrides for inputs/textareas inside the dialog
:global(.AddPartition .el-input__wrapper),
:global(.AddPartition .el-textarea__inner) {
  background-color: #2b2b2b !important;
  border: 1px solid #4A4A4A !important;
  box-shadow: none !important;
  color: #fff !important;
}

:global(.AddPartition .el-input.is-disabled .el-input__wrapper) {
  background-color: #2b2b2b !important;
  opacity: 0.6;
}

:global(.AddPartition .el-form-item__label) {
  color: #fff;
  word-break: normal;
}

:global(.AddPartition .el-textarea__inner::placeholder),
:global(.AddPartition .el-input__inner::placeholder) {
  color: #888;
}

</style>
