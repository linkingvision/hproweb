<template>
  <div class="Device">
    <template v-if="mode === 'list'">
      <div class="devices_topBtn">
        <el-button class="form_butt" @click="openAdd" type="primary">
          {{ t('CommTableEdit.comm_add') }}
        </el-button>
        <el-button class="form_butt1" @click="deleteSelectedPatrols">
          {{ t('CommTableEdit.comm_delete') }}
        </el-button>
      </div>

      <div class="patrol-list">
        <el-table
          v-loading="loading"
          :data="pagedPatrols"
          height="100%"
          @selection-change="handlePatrolSelectionChange"
        >
          <el-table-column type="selection" width="48" />
          <el-table-column prop="index" :label="t('CommTableEdit.comm_table_serial_number')" width="130" />
          <el-table-column prop="patrolName" :label="t('Setting.set_patrol_name')" min-width="200" show-overflow-tooltip />
          <el-table-column prop="patrolId" :label="t('Setting.set_patrol_id')" min-width="150" show-overflow-tooltip />
          <el-table-column min-width="160" :label="t('CommTableEdit.comm_operational')">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">{{ t('CommTableEdit.comm_edit') }}</el-button>
              <el-button link type="danger" @click="deletePatrol(row)">{{ t('CommTableEdit.comm_delete') }}</el-button>
            </template>
          </el-table-column>
          <el-table-column min-width="180">
            <template #header>
              <el-input v-model="filterText" size="small" :placeholder="t('Common.comm_filtration')" />
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes, jumper"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 15, 20, 50]"
          :total="filteredPatrols.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
        <el-button class="GoTo" size="small">{{ t('CommTable.comm_jump') }}</el-button>
      </div>
    </template>

    <div v-else class="RoterNav">
      <div class="header">
        <el-button link type="primary" @click="cancelEdit">{{ t('Configuration.conf_patrol_config') }}</el-button>
        <span style="margin:0 8px;font-size:16px;">&gt;</span>
        <span>{{ mode === 'add' ? t('CommTableEdit.comm_add') : t('CommTableEdit.comm_edit') }}</span>
      </div>
      <p>{{ mode === 'add' ? t('CommTableEdit.comm_add') : t('CommTableEdit.comm_edit') }}</p>

      <el-form label-position="left" label-width="110px" @submit.prevent>
        <el-form-item :label="t('Setting.set_patrol_name')">
          <el-input v-model="form.patrolName" class="patrol-name-input" :placeholder="`${t('Common.comm_please_input')} ${t('Setting.set_patrol_name')}`" />
        </el-form-item>
        <el-form-item :label="t('Configuration.conf_view')">
          <div class="tow_node">
            <div class="Root_node Root_node1">
              <el-input class="elinput" v-model="sourceFilterText" :placeholder="t('Common.comm_filtration')" clearable />
              <div class="tree-box">
                <el-tree
                  ref="sourceTreeRef"
                  v-loading="treeLoading"
                  :data="viewTree"
                  node-key="uuid"
                  show-checkbox
                  check-strictly
                  :props="treeProps"
                  :filter-node-method="filterTreeNode"
                  :default-expanded-keys="defaultExpandIds"
                  :empty-text="t('CommTable.comm_no_data_available')"
                  @check="handleSourceCheck"
                  @node-expand="handleNodeExpand"
                >
                  <template #default="{ data }">
                    <span class="tree-node-label">
                      <i :class="data.iconclass || (data.DifferentType === 'view' ? 'iconfont icon-shitu2' : 'iconfont icon-gen')" />
                      <span>{{ data.label || data.name }}</span>
                    </span>
                  </template>
                </el-tree>
              </div>
            </div>

            <div class="Root_node_butt">
              <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;">
                <el-button class="form_butt transfer-btn" @click="addCheckedViews">
                  <i class="iconfont icon-youjiantou" />
                </el-button>
                <el-button class="form_butt1 transfer-btn" @click="removeCheckedSelectedViews">
                  <i class="iconfont icon-zuojiantou" />
                </el-button>
              </div>
            </div>

            <div class="Root_node">
              <el-input class="elinput" v-model="selectedFilterText" :placeholder="t('Common.comm_filtration')" clearable />
              <div class="tree-box">
                <el-tree
                  ref="selectedTreeRef"
                  :data="selectedViews"
                  node-key="instanceId"
                  show-checkbox
                  :props="{ label: 'viewName', children: 'children' }"
                  :filter-node-method="filterSelectedNode"
                  :empty-text="t('CommTable.comm_no_data_available')"
                  class="selected-view-tree"
                >
                <template #default="{ node, data: item }">
                  <div class="selected-view-row"
                    @mouseover="item._hover = true"
                    @mouseleave="item._hover = false"
                  >
                    <div class="sv-name">
                      <i class="iconfont icon-shitu2" style="font-size:14px;margin-right:4px;" />
                      <span>{{ item.viewName }}</span>
                    </div>
                    <div class="sv-right">
                      <div class="dwell-wrap"
                        @mouseover.stop="item._dwellShow = true"
                        @mouseleave.stop="item._dwellShow = false"
                      >
                        <template v-if="!item._dwellShow">
                          <span class="dwell-label">{{ item.dwellTime }}{{ t('Common.comm_s') }}</span>
                        </template>
                        <template v-else>
                          <span>{{ t('Analytics.ana_dwell_time') }}</span>
                          <el-input
                            v-model.number="item.dwellTime"
                            size="small"
                            class="DwellTime"
                            style="margin:0 4px;width:60px;"
                          />
                          <span>{{ t('Common.comm_s') }}</span>
                        </template>
                      </div>
                      <div v-show="item._hover" class="order">
                        <div
                          v-if="selectedViews.indexOf(item) > 0"
                          class="orderBtn"
                          style="margin-right:10px;"
                          @click.stop="moveSelectedView(selectedViews.indexOf(item), -1)"
                        >
                          <i class="iconfont icon-shunxushang" />
                        </div>
                        <div
                          v-if="selectedViews.indexOf(item) < selectedViews.length - 1"
                          class="orderBtn"
                          @click.stop="moveSelectedView(selectedViews.indexOf(item), 1)"
                        >
                          <i class="iconfont icon-shunxuxia" />
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                </el-tree>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <div class="button_table">
        <el-button class="form_butt1" @click="cancelEdit">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="submitPatrol">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  AddPatrolApi,
  DeletePatrolApi,
  GetPatrolListApi,
  UpdatePatrolApi,
  type PatrolElementView,
  type PatrolRow,
} from '@/api/configuration/patrol'
import {
  loadChildrenForNode,
  loadDevicePartitionTree,
  type DeviceTreeNode,
} from '@/utils/devicesTree'

const { t } = useI18n()

type Mode = 'list' | 'add' | 'edit'

type ViewTreeNode = DeviceTreeNode

interface SelectedPatrolView {
  instanceId: string
  viewId: number | string
  viewName: string
  dwellTime: number
}

const mode = ref<Mode>('list')
const loading = ref(false)
const treeLoading = ref(false)
const patrols = ref<PatrolRow[]>([])
const selectedPatrolRows = ref<PatrolRow[]>([])
const currentPage = ref(1)
const pageSize = ref(15)
const filterText = ref('')
const form = reactive({ uuid: '', patrolName: 'patrol1' })
const editingRow = ref<PatrolRow | null>(null)

const viewTree = ref<ViewTreeNode[]>([])
const sourceTreeRef = ref()
const sourceFilterText = ref('')
const selectedTreeRef = ref()
const selectedFilterText = ref('')
const defaultExpandIds = ref<string[]>([])
const viewNameMap = ref(new Map<string, string>())
const selectedViews = ref<SelectedPatrolView[]>([])
const treeProps = { label: 'label', children: 'children', disabled: 'disabled' }

const filteredPatrols = computed(() => {
  const keyword = filterText.value.trim().toLowerCase()
  if (!keyword) return patrols.value
  return patrols.value.filter(item =>
    String(item.patrolName ?? '').toLowerCase().includes(keyword) ||
    String(item.patrolId ?? '').toLowerCase().includes(keyword),
  )
})

const pagedPatrols = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredPatrols.value.slice(start, start + pageSize.value)
})

watch(filterText, () => { currentPage.value = 1 })
watch(sourceFilterText, val => sourceTreeRef.value?.filter(val))
watch(selectedFilterText, val => selectedTreeRef.value?.filter(val))

function responseResult(res: any) {
  return res?.data?.result ?? []
}

function isSuccess(res: any) {
  return res?.data?.msg === 'Success' || res?.data?.code === 0 || res?.status === 200
}

function isViewNode(node: ViewTreeNode) {
  return node.DifferentType === 'view'
}

function filterTreeNode(value: string, data: ViewTreeNode, node?: any) {
  if (!value) return true
  const label = String(data.label ?? data.name ?? '')
  if (label.toLowerCase().includes(value.toLowerCase())) return true
  let parent = node?.parent
  while (parent?.data) {
    const parentLabel = String(parent.data.label ?? parent.data.name ?? '')
    if (parentLabel.toLowerCase().includes(value.toLowerCase())) return true
    parent = parent.parent
  }
  return false
}

function filterSelectedNode(value: string, data: SelectedPatrolView) {
  if (!value) return true
  return String(data.viewName ?? '').toLowerCase().includes(value.toLowerCase())
}

function normalizeElementView(item: any): PatrolElementView {
  return {
    viewId: item.viewId ?? item.token ?? item.id,
    dwellTime: Number(item.dwellTime ?? 20),
  }
}

function normalizePatrol(item: any, index: number): PatrolRow {
  return {
    index: index + 1,
    patrolId: item.patrolId ?? item.id,
    uuid: item.uuid ?? '',
    patrolName: item.patrolName ?? item.name ?? '',
    elementView: Array.isArray(item.elementView) ? item.elementView.map(normalizeElementView) : [],
  }
}

async function loadPatrols() {
  loading.value = true
  try {
    const res: any = await GetPatrolListApi()
    patrols.value = responseResult(res).map(normalizePatrol)
    selectedPatrolRows.value = []
    clampCurrentPage()
  } catch (e) {
    patrols.value = []
  } finally {
    loading.value = false
  }
}

function clampCurrentPage() {
  const totalPage = Math.max(1, Math.ceil(filteredPatrols.value.length / pageSize.value))
  if (currentPage.value > totalPage) currentPage.value = totalPage
}

async function loadViewTree() {
  treeLoading.value = true
  try {
    const tree = await loadDevicePartitionTree()
    viewTree.value = tree
    defaultExpandIds.value = tree[0]?.uuid ? [tree[0].uuid] : []
    rebuildViewNameMap()
  } catch {
    viewTree.value = []
    defaultExpandIds.value = []
    viewNameMap.value = new Map()
  } finally {
    treeLoading.value = false
  }
}

function rebuildViewNameMap() {
  const nextNameMap = new Map<string, string>()
  const collect = (nodes: ViewTreeNode[] = []) => {
    nodes.forEach(node => {
      if (isViewNode(node) && node.token != null) {
        nextNameMap.set(String(node.token), String(node.label ?? node.name ?? node.token))
      }
      if (node.children?.length) collect(node.children)
    })
  }
  collect(viewTree.value)
  viewNameMap.value = nextNameMap
}

function hasEmptyChild(data: ViewTreeNode) {
  return !!data.children?.[0]?.EmptyItem
}

async function ensureNodeChildren(data: ViewTreeNode) {
  if (!hasEmptyChild(data)) return
  data.children = []
  try {
    data.children = await loadChildrenForNode(data)
    rebuildViewNameMap()
  } catch {
    data.children = []
  }
}

async function handleSourceCheck(data: ViewTreeNode) {
  await ensureNodeChildren(data)
}

async function handleNodeExpand(data: ViewTreeNode) {
  await ensureNodeChildren(data)
}

function handleSizeChange(val: number) {
  currentPage.value = 1
  pageSize.value = val
}

function handleCurrentChange(val: number) {
  currentPage.value = val
}

function handlePatrolSelectionChange(rows: PatrolRow[]) {
  selectedPatrolRows.value = rows
}

function resetForm(defaultName = 'patrol1') {
  form.uuid = ''
  form.patrolName = defaultName
  editingRow.value = null
  selectedViews.value = []
  sourceTreeRef.value?.setCheckedKeys?.([])
  selectedTreeRef.value?.setCheckedKeys?.([])
}

async function openAdd() {
  resetForm()
  mode.value = 'add'
  if (!viewTree.value.length) await loadViewTree()
}

async function openEdit(row: PatrolRow) {
  resetForm()
  mode.value = 'edit'
  editingRow.value = row
  form.uuid = row.uuid
  form.patrolName = row.patrolName
  if (!viewTree.value.length) await loadViewTree()
  selectedViews.value = row.elementView.map(item => {
    const viewId = item.viewId
    return {
      instanceId: createInstanceId(viewId),
      viewId,
      viewName: viewNameMap.value.get(String(viewId)) ?? `View ${viewId}`,
      dwellTime: Number(item.dwellTime ?? 20),
    }
  })
}

function cancelEdit() {
  resetForm()
  mode.value = 'list'
}

function addCheckedViews() {
  const nodes: ViewTreeNode[] = sourceTreeRef.value?.getCheckedNodes?.(false, false) ?? []
  const views = nodes.filter(isViewNode)
  views.forEach(node => {
    const viewId = node.token
    if (viewId == null) return
    selectedViews.value.push({
      instanceId: createInstanceId(viewId),
      viewId,
      viewName: String(node.label ?? node.name ?? viewId),
      dwellTime: 20,
    })
  })
  sourceTreeRef.value?.setCheckedKeys?.([])
}

function removeCheckedSelectedViews() {
  // 对照 uscweb cancelcam：删除右侧树中被勾选的视图
  const checked: SelectedPatrolView[] = selectedTreeRef.value?.getCheckedNodes?.(false, false) ?? []
  if (!checked.length) return
  const removeIds = new Set(checked.map(item => item.instanceId))
  selectedViews.value = selectedViews.value.filter(item => !removeIds.has(item.instanceId))
  selectedTreeRef.value?.setCheckedKeys?.([])
}

function moveSelectedView(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= selectedViews.value.length) return
  const rows = [...selectedViews.value]
  const current = rows[index]
  const next = rows[target]
  if (!current || !next) return
  rows[index] = next
  rows[target] = current
  selectedViews.value = rows
}

function createInstanceId(viewId: number | string) {
  return `${viewId}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function buildElementViewPayload(): PatrolElementView[] {
  return selectedViews.value.map(item => ({
    viewId: item.viewId,
    dwellTime: Math.max(1, Number(item.dwellTime) || 1),
  }))
}

function validateForm() {
  if (!form.patrolName.trim()) {
    ElMessage.warning(`${t('Common.comm_please_input')} ${t('Setting.set_patrol_name')}`)
    return false
  }
  if (!selectedViews.value.length) {
    ElMessage.warning(`${t('Common.comm_please_select')} ${t('Configuration.conf_view')}`)
    return false
  }
  return true
}

async function submitPatrol() {
  if (!validateForm()) return
  const elementView = buildElementViewPayload()
  try {
    const res: any = mode.value === 'add'
      ? await AddPatrolApi({ patrolName: form.patrolName.trim(), elementView })
      : await UpdatePatrolApi({ uuid: form.uuid, patrolName: form.patrolName.trim(), elementView })
    if (isSuccess(res)) {
      ElMessage({ type: 'success', message: mode.value === 'add' ? t('CommTableEdit.comm_add_successfully') : t('CommTableEdit.comm_edit_successfully') })
      cancelEdit()
      await loadPatrols()
    } else {
      ElMessage({ type: 'error', message: mode.value === 'add' ? t('CommTableEdit.comm_add_failed') : t('CommTableEdit.comm_edit_failed') })
    }
  } catch (e) {
    ElMessage({ type: 'error', message: mode.value === 'add' ? t('CommTableEdit.comm_add_failed') : t('CommTableEdit.comm_edit_failed') })
  }
}

async function deletePatrol(row: PatrolRow) {
  if (row.patrolId == null) return
  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
      confirmButtonText: t('CommTableEdit.comm_ok'),
      cancelButtonText: t('CommTableEdit.comm_cancel'),
      type: 'warning',
    })
    const res: any = await DeletePatrolApi([Number(row.patrolId)])
    if (isSuccess(res)) {
      ElMessage({ type: 'success', message: t('CommTableEdit.comm_delete_successfully') })
      await loadPatrols()
    } else {
      ElMessage({ type: 'error', message: t('CommTableEdit.comm_delete_failed') })
    }
  } catch {}
}

async function deleteSelectedPatrols() {
  const ids = selectedPatrolRows.value.map(row => row.patrolId).filter(id => id != null).map(id => Number(id))
  if (!ids.length) {
    ElMessage.warning(t('Common.comm_please_select'))
    return
  }
  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
      confirmButtonText: t('CommTableEdit.comm_ok'),
      cancelButtonText: t('CommTableEdit.comm_cancel'),
      type: 'warning',
    })
    const res: any = await DeletePatrolApi(ids)
    if (isSuccess(res)) {
      ElMessage({ type: 'success', message: t('CommTableEdit.comm_delete_successfully') })
      await loadPatrols()
    } else {
      ElMessage({ type: 'error', message: t('CommTableEdit.comm_delete_failed') })
    }
  } catch {}
}

onMounted(async () => {
  await Promise.all([loadPatrols(), loadViewTree()])
})
</script>

<style lang="scss" scoped>
.Device {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.devices_topBtn {
  padding: 10px 10px 6px;
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.patrol-list {
  flex: 1;
  min-height: 0;
}

.pagination {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  gap: 8px;
  flex-shrink: 0;
}

.RoterNav {
  padding: 10px 20px;
  flex: 1;
  overflow-y: auto;

  .header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 14px;
  }

  p {
    font-size: 16px;
    font-weight: 600;
    margin: 8px 0 16px;
  }

  .el-form {
    padding-left: 10px;

    :deep(.el-form-item__label) {
      white-space: nowrap;
    }

    .patrol-name-input {
      width: calc(25% - 20px);
      margin-left: 10px;
    }

    .tow_node {
      width: 100%;
      display: flex;
      min-width: 800px;

      .Root_node {
        width: 25%;
        height: 550px;
        padding: 10px;
        overflow: hidden;

        .elinput {
          width: 100% !important;
          margin-bottom: 6px;
        }

        :deep(.el-tree) {
          background: transparent;
          color: #fff;
        }

        .tree-box {
          height: calc(100% - 34px);
          border: 1px solid rgba(218, 218, 218, 0.2);
          border-radius: 2px;
          overflow: auto;

          :deep(.el-tree) {
            background: transparent;
            color: #fff;
            min-width: 300px;
          }

          :deep(.el-tree-node__content:hover) {
            background-color: rgba(3, 153, 254, 0.08);
          }
        }
      }

      .Root_node_butt {
        width: 10%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        text-align: center;

        > div {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .transfer-btn {
          width: 40px;
          min-width: 40px;
          height: 40px;
          padding: 0 8px;
          margin: 0 0 24px;
          background-image: none;
          display: flex;
          align-items: center;
          justify-content: center;

          i {
            font-size: 24px;
            width: 24px;
            height: 24px;
            line-height: 1;
          }
        }
      }
    }
  }
}

.tree-node-label {
  display: flex;
  align-items: center;
  gap: 4px;

  i { font-size: 14px; }
}

/* 右侧已选视图树的行样式 */
.selected-view-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .sv-name {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sv-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .dwell-wrap {
    display: flex;
    align-items: center;
    gap: 4px;

    .dwell-label {
      color: #66b1ff;
      cursor: pointer;
      min-width: 36px;
      text-align: right;
    }

    :deep(.DwellTime .el-input__inner) {
      height: 24px;
    }
  }

  .order {
    display: flex;
    align-items: center;

    .orderBtn {
      cursor: pointer;
      color: #fff;
      font-size: 14px;

      &:hover { color: #0399FE; }
    }
  }
}

.button_table {
  padding: 0 20px;
  width: 55%;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

:deep(.selected-view-tree) {
  background: transparent;
  color: #fff;

  .el-tree-node__content {
    height: 32px;
  }

  .el-tree-node__content:hover {
    background-color: rgba(3, 153, 254, 0.08);
  }
}

:deep(.el-table) {
  background: transparent;
  height: 100%;
}
</style>
