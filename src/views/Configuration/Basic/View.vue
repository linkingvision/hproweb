<template>
  <div class="view-page">
    <!-- 左侧：设备分区树（含视图节点） -->
    <div class="view-left">
      <el-collapse v-model="collapseActive">
        <el-collapse-item name="1">
          <template #title>
            <div style="display:flex;justify-content:space-between;width:85%;align-items:center;">
              <span>{{ t('CommDev.comm_dev_root') }}</span>
              <i class="iconfont icon-shuaxin1" style="cursor:pointer;" @click.stop="refresh"></i>
            </div>
          </template>
          <el-input v-model="filterText" :placeholder="t('Common.comm_filtration')" style="margin:8px 0;" />
          <el-tree
            ref="treeRef"
            :data="treeWithViews"
            node-key="id"
            highlight-current
            :props="treeProps"
            :filter-node-method="filterNode"
            :default-expanded-keys="defaultExpandIds"
            :empty-text="t('CommTable.comm_no_data_available')"
            @node-click="handleNodeClick"
          >
            <template #default="{ data }">
              <span
                draggable="true"
                @dragstart.stop="handleDragStart($event, data)"
                @dragend.stop="handleDragEnd"
                style="display:flex;align-items:center;width:100%;"
                :style="data.isDeviceChannel ? 'cursor:grab;' : ''"
              >
                <i :class="getNodeIcon(data)" style="font-size:14px;margin-right:4px;"></i>
                <span>{{ data.label }}</span>
              </span>
            </template>
          </el-tree>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 右侧：布局预览 + 操作栏 -->
    <div class="view-right">
      <!-- 顶部工具栏，两端分布 -->
      <div class="sdk_button1">
        <div class="button_edi">
          <el-button class="form_butt" @click="openAdd">
            {{ t('Setting.set_adding_views') }}
          </el-button>
          <el-button class="form_butt1" @click="deleteCurrentView">
            {{ t('Setting.set_deleting_views') }}
          </el-button>
          <!-- View Layout 弹出选择器 -->
          <el-popover
            placement="top"
            width="480"
            trigger="manual"
            v-model:visible="layoutPopoverVisible"
            popper-class="GongGePopover"
          >
            <div class="LayoutSearch">
              <div class="OpenLayoutDialog" @click="openLayoutDialog">
                {{ t('Liveview.live_view_layout') }}
              </div>
            </div>
            <div style="display:flex;">
              <!-- 预设布局 -->
              <div class="liveview_group blocks" style="width:40%">
                <div style="margin-bottom:10px">
                  <p>13-16-25</p>
                  <div class="PanelBtns">
                    <el-button class="iconfont icon-a-13gongge" @click="applyPresetLayout(13)" />
                    <el-button class="iconfont icon-a-16gongge" @click="applyPresetLayout(16)" />
                    <el-button class="iconfont icon-a-25gongge" @click="applyPresetLayout(25)" />
                  </div>
                </div>
                <div style="margin-bottom:10px">
                  <p>6-7-9</p>
                  <div class="PanelBtns">
                    <el-button class="iconfont icon-a-6gongge" @click="applyPresetLayout(6)" />
                    <el-button class="iconfont icon-a-7gongge" @click="applyPresetLayout(7)" />
                    <el-button class="iconfont icon-a-9gongge" @click="applyPresetLayout(9)" />
                  </div>
                </div>
                <div style="margin-bottom:10px">
                  <p>4</p>
                  <div class="PanelBtns">
                    <el-button class="iconfont icon-a-4gongge" @click="applyPresetLayout(4)" />
                  </div>
                </div>
                <div>
                  <p>1-3</p>
                  <div class="PanelBtns">
                    <el-button class="iconfont icon-a-1gongge" @click="applyPresetLayout(1)" />
                    <el-button class="iconfont icon-a-3gongge" @click="applyPresetLayout(3)" />
                  </div>
                </div>
              </div>
              <!-- 自定义布局 canvas 图标 -->
              <div class="ViewLayout">
                <p>{{ t('Liveview.live_customization') }}</p>
                <div style="display:flex;flex-wrap:wrap;">
                  <div
                    v-for="(item, index) in canvasItems"
                    :key="item.layoutId"
                    class="LayoutCanvas"
                  >
                    <canvas
                      :id="'viewCanvas1' + index"
                      width="25" height="25"
                      style="margin:15px 20px;"
                      :title="item.strName"
                      @click="applyCustomLayout(item)"
                    />
                    <span>{{ item.strName }}</span>
                  </div>
                </div>
              </div>
            </div>
            <template #reference>
              <el-button
                class="single_button"
                style="margin-left:10px;"
                @click="layoutPopoverVisible = !layoutPopoverVisible; loadLayouts()"
              >
                {{ t('Liveview.live_view_layout') }}
              </el-button>
            </template>
          </el-popover>
        </div>

        <!-- 右侧 Edit / Save -->
        <div class="button_edi">
          <el-button class="form_butt1" @click="openEdit" style="margin-right:10px;">
            {{ t('CommTableEdit.comm_edit') }}
          </el-button>
          <el-button class="form_butt" @click="saveCurrentView">
            {{ t('CommTableEdit.comm_save') }}
          </el-button>
        </div>
      </div>

      <!-- 布局预览区：对照uscweb始终显示格子，点击视图节点后加载对应布局和摄像头 -->
      <div class="layout-preview-area" id="layoutPreviewPanel">
        <div
          v-for="cell in previewGrid"
          :key="cell.id"
          class="palace videoColor"
          :class="{ 'cell-selected': selectedCellId === cell.id, 'cell-assigned': !!cellAssignments[cell.id] }"
          :style="computeCellStyle(cell)"
          @click="selectedCellId = cell.id"
          @drop.stop.prevent="dropOnCell($event, cell.id)"
          @dragover.stop.prevent
          @dragenter.stop.prevent
        >
          <div class="cell-label">
            {{ cellAssignments[cell.id]?.name || '' }}
          </div>
        </div>
      </div>
    </div>

    <!-- ─── 添加视图弹窗 ─────────────────────────────────────────── -->
    <el-dialog v-model="addDialogVisible" :title="t('Setting.set_adding_views')" width="480px">
      <el-form label-position="left" label-width="120px" size="small" :model="addForm">
        <el-form-item :label="t('Liveview.live_view_name')">
          <el-input v-model="addForm.viewName" />
        </el-form-item>
        <el-form-item :label="t('Setting.set_view_type')">
          <el-select v-model="addForm.viewType" style="width:100%;">
            <el-option v-for="opt in viewTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('Common.comm_device_partition')">
          <el-popover placement="bottom" width="360" trigger="click">
            <template #reference>
              <el-input v-model="addForm.devPartitionName" :placeholder="t('Common.comm_please_select')" readonly />
            </template>
            <el-input v-model="addPartitionFilter" :placeholder="t('Common.comm_filtration')" style="margin-bottom:8px;" />
            <el-tree
              ref="addTreeRef"
              :data="partitionTree"
              node-key="devPartitionId"
              :props="partitionTreeProps"
              show-checkbox
              check-strictly
              :filter-node-method="filterPartitionNode"
              :default-checked-keys="addDefaultChecked"
              @check="handleAddPartitionCheck"
            />
          </el-popover>
        </el-form-item>
        <el-form-item :label="t('Liveview.live_view_layout')">
          <div class="layout-picker">
            <div
              v-for="(item, index) in canvasItems"
              :key="item.layoutId"
              class="layout-canvas-item"
              @click="selectAddLayout(item)"
            >
              <canvas :id="'addCanvas' + index" width="36" height="36" :title="item.strName" />
              <span>{{ item.strName }}</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button type="primary" @click="confirmAdd">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>

    <!-- ─── 编辑视图弹窗 ─────────────────────────────────────────── -->
    <el-dialog v-model="editDialogVisible" :title="t('CommTableEdit.comm_edit')" width="480px">
      <el-form label-position="left" label-width="120px" size="small" :model="editForm">
        <el-form-item :label="t('Setting.set_view_id')">
          <el-input v-model="editForm.viewId" disabled />
        </el-form-item>
        <el-form-item :label="t('Liveview.live_view_name')">
          <el-input v-model="editForm.viewName" />
        </el-form-item>
        <el-form-item :label="t('Setting.set_view_type')">
          <el-select v-model="editForm.viewType" style="width:100%;">
            <el-option v-for="opt in viewTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('Common.comm_device_partition')">
          <el-popover placement="bottom" width="360" trigger="click">
            <template #reference>
              <el-input v-model="editForm.devPartitionName" :placeholder="t('Common.comm_please_select')" readonly />
            </template>
            <el-input v-model="editPartitionFilter" :placeholder="t('Common.comm_filtration')" style="margin-bottom:8px;" />
            <el-tree
              ref="editTreeRef"
              :data="partitionTree"
              node-key="devPartitionId"
              :props="partitionTreeProps"
              show-checkbox
              check-strictly
              :filter-node-method="filterPartitionNode"
              :default-checked-keys="editDefaultChecked"
              @check="handleEditPartitionCheck"
            />
          </el-popover>
        </el-form-item>
        <el-form-item :label="t('Liveview.live_view_layout')">
          <div class="layout-picker">
            <div
              v-for="(item, index) in canvasItems"
              :key="item.layoutId"
              class="layout-canvas-item"
              @click="selectEditLayout(item)"
            >
              <canvas :id="'editCanvas' + index" width="36" height="36" :title="item.strName" />
              <span>{{ item.strName }}</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button type="primary" @click="confirmEdit">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>

    <!-- ─── 视图布局管理弹窗 ──────────────────────────────────────── -->
    <el-dialog v-model="layoutDialogVisible" :title="t('Liveview.live_view_layout')" width="520px" class="ViewLayoutDialog">
      <div class="layout_topBtn">
        <div class="button_edi">
          <el-button class="form_butt" @click="addNewCustomLayout">
            <i class="iconfont icon-xinjian" />
            {{ t('Liveview.live_new_view_layout') }}
          </el-button>
          <el-button class="form_butt1 iconfont icon-lajitong" @click="deleteSelectedLayout" />
        </div>
        <div class="button_default">
          <el-button @click="resetDefaultLayouts">
            <i class="iconfont icon-huifu" />
            {{ t('Liveview.live_restore_defaults') }}
          </el-button>
        </div>
      </div>
      <div class="LayoutIcon">
        <div class="customIcon">
          <p>{{ t('Liveview.live_customization') }}</p>
          <div class="DialogLayout">
            <div
              v-for="(item, index) in canvasItems"
              :key="item.layoutId"
              @click="selectLayoutForDelete(item.layoutId)"
            >
              <canvas :id="'dialogCanvas' + index" width="25" height="25" :title="item.strName" />
            </div>
          </div>
        </div>
      </div>
      <!-- 新建布局输入 -->
      <div v-if="newLayoutVisible" style="margin-top:12px;display:flex;gap:8px;align-items:center;">
        <span>{{ t('Liveview.live_row') }}</span>
        <el-input-number v-model="newLayoutRows" :min="1" :max="10" size="small" style="width:80px;" />
        <span>{{ t('Liveview.live_column') }}</span>
        <el-input-number v-model="newLayoutCols" :min="1" :max="10" size="small" style="width:80px;" />
        <el-button size="small" type="primary" @click="confirmNewLayout">{{ t('CommTableEdit.comm_ok') }}</el-button>
        <el-button size="small" @click="newLayoutVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
      </div>
      <template #footer>
        <el-button @click="layoutDialogVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button type="primary" @click="layoutDialogVisible = false">{{ t('CommTableEdit.comm_save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, onMounted, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  GetViewListApi,
  CreateViewApi,
  UpdateViewApi,
  DeleteViewApi,
  GetLayoutListApi,
  CreateLayoutApi,
  DeleteLayoutApi,
} from '@/api/view'
import { GetDevPartitionApi } from '@/api/configuration/device'
import { GetDeviceChannels } from '@/api/channel'

const { t } = useI18n()

// ─── Types ────────────────────────────────────────────────────────────────────

interface LayoutCell {
  id: string
  rowStart: number; rowEnd: number
  colStart: number; colEnd: number
  merged: boolean
}
interface LayoutData { cols: number; rows: number; grid: LayoutCell[] }
interface CanvasItem { layoutId: number; strName: string; layoutData: LayoutData }
interface ViewEntity { entityType: string; layoutPosition: string; resourceUUID: string; profile: string }
interface ViewRow {
  viewId: number; viewName: string; viewType: string
  layoutId: number; devPartitionId: number; devPartitionName?: string
  viewEntity?: ViewEntity[]
  layout?: any
}
interface PartitionNode {
  devPartitionId: number; devPartitionName: string
  parentId?: number; children?: PartitionNode[]
}
interface TreeNode {
  id: string; label: string; type: 'partition' | 'device' | 'channel' | 'view'
  isLeaf?: boolean; isDeviceChannel?: boolean
  online?: boolean; totalCount?: number; onlineCount?: number
  data?: any; isView?: boolean; viewData?: ViewRow
  children?: TreeNode[]
}

// ─── Device partition tree（含设备+通道+视图，对照 Monitoring/View.vue）──────

const partitionTree    = ref<PartitionNode[]>([])   // 纯分区树（用于弹窗分区选择）
const treeWithViews    = ref<TreeNode[]>([])
const treeRef          = ref()
const filterText       = ref('')
const defaultExpandIds = ref<string[]>([])
const collapseActive   = ref<string[]>(['1'])
const deviceCache      = new Map<string, TreeNode[]>()

const treeProps        = { label: 'label', children: 'children' }
const partitionTreeProps = { label: 'devPartitionName', children: 'children' }

function filterNode(value: string, data: TreeNode) {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
}
watch(filterText, val => treeRef.value?.filter(val))

// 对照 Monitoring/View.vue buildTree：递归构建分区，含设备节点和视图节点
function buildTree(parts: any[], viewsByPartition: Record<number, ViewRow[]> = {}): TreeNode[] {
  return parts.map(p => {
    const children: TreeNode[] = []
    if (p.children?.length) children.push(...buildTree(p.children, viewsByPartition))
    p.dev?.forEach((d: any) => children.push({
      id: `dev_${d.devId}`, label: d.name, type: 'device',
      online: d.online, data: d, children: [], isLeaf: false,
    }))
    // 优先用 API 嵌入的 p.view，再用单独获取的 allViews（按 devPartitionId 匹配）
    const seenViewIds = new Set<number>()
    p.view?.forEach((v: any) => {
      seenViewIds.add(v.viewId)
      children.push({ id: `view_${v.viewId}`, label: v.viewName, type: 'view', isLeaf: true, isView: true, viewData: v, data: v })
    })
    viewsByPartition[p.devPartitionId]?.forEach((v: any) => {
      if (!seenViewIds.has(v.viewId))
        children.push({ id: `view_${v.viewId}`, label: v.viewName, type: 'view', isLeaf: true, isView: true, viewData: v, data: v })
    })
    return { id: `part_${p.devPartitionId}`, label: p.devPartitionName, type: 'partition', data: p, isLeaf: false, children } as TreeNode
  })
}

function extractDevices(nodes: TreeNode[]): TreeNode[] {
  const out: TreeNode[] = []
  nodes.forEach(n => {
    if (n.type === 'device' && !n.isDeviceChannel) out.push(n)
    if (n.children?.length) out.push(...extractDevices(n.children))
  })
  return out
}

let allViews: ViewRow[] = []

async function loadAll() {
  // 加载视图列表（失败不阻断树加载）
  try {
    const viewRes: any = await GetViewListApi()
    if (viewRes?.data?.result) {
      allViews = Array.isArray(viewRes.data.result) ? viewRes.data.result : []
    }
  } catch (e) {
    console.warn('[View] loadViews error', e)
  }

  // 加载分区树+设备通道（对照 Monitoring/View.vue loadTree）
  try {
    const res: any = await GetDevPartitionApi()
    if (res?.status !== 200 || !res?.data?.result?.length) return
    const root = res.data.result[0]

    // 纯分区树（用于弹窗选择）
    partitionTree.value = res.data.result

    // 按 devPartitionId 将 allViews 分组，注入 buildTree
    const viewsByPartition: Record<number, ViewRow[]> = {}
    allViews.forEach(v => {
      const pid = v.devPartitionId ?? 10000
      if (!viewsByPartition[pid]) viewsByPartition[pid] = []
      viewsByPartition[pid].push(v)
    })

    const rootChildren: TreeNode[] = []
    if (root.children?.length) rootChildren.push(...buildTree(root.children, viewsByPartition))
    root.dev?.forEach((d: any) => rootChildren.push({
      id: `dev_${d.devId}`, label: d.name, type: 'device',
      online: d.online, data: d, children: [], isLeaf: false,
    }))
    // 视图节点（API 嵌入 + allViews 补充）
    const seenRoot = new Set<number>()
    root.view?.forEach((v: any) => {
      seenRoot.add(v.viewId)
      rootChildren.push({ id: `view_${v.viewId}`, label: v.viewName, type: 'view', isLeaf: true, isView: true, viewData: v, data: v })
    })
    viewsByPartition[root.devPartitionId]?.forEach((v: any) => {
      if (!seenRoot.has(v.viewId))
        rootChildren.push({ id: `view_${v.viewId}`, label: v.viewName, type: 'view', isLeaf: true, isView: true, viewData: v, data: v })
    })

    // Root 节点本身，与 uscweb comm_dev_root 对应
    const tree: TreeNode[] = [{
      id: `part_${root.devPartitionId}`,
      label: root.devPartitionName || t('CommDev.comm_dev_root'),
      type: 'partition',
      data: root,
      isLeaf: false,
      children: rootChildren,
    }]

    // 批量加载设备通道（每批3个并发）
    const deviceNodes = extractDevices(tree)
    for (let i = 0; i < deviceNodes.length; i += 3) {
      await Promise.allSettled(deviceNodes.slice(i, i + 3).map(async item => {
        if (deviceCache.has(item.data.token)) {
          const cached = deviceCache.get(item.data.token)!
          item.children = cached.length ? cached : undefined
          item.isLeaf   = !cached.length
          return
        }
        try {
          const r: any = await GetDeviceChannels(item.data.token)
          if (r?.status === 200 && r?.data?.code === 0 && r?.data?.result?.length) {
            const chs: TreeNode[] = r.data.result.map((ch: any, idx: number) => ({
              id: `ch_${item.data.devId}_${idx}`, label: ch.name || `ch ${idx + 1}`,
              type: 'device' as const, data: ch, isLeaf: true, isDeviceChannel: true,
              online: ch.online,
            }))
            deviceCache.set(item.data.token, chs)
            item.children    = chs
            item.isLeaf      = false
            item.totalCount  = chs.length
            item.onlineCount = chs.filter(c => c.online).length
          } else {
            deviceCache.set(item.data.token, [])
            item.isLeaf = true
          }
        } catch { item.isLeaf = true }
      }))
    }

    treeWithViews.value = tree
    if (tree.length) defaultExpandIds.value = [tree[0].id]
  } catch (e) {
    console.warn('[View] loadTree error', e)
  }
}

function rebuildTree() {
  // 重新加载时清空缓存
  deviceCache.clear()
  loadAll()
}

async function refresh() {
  await rebuildTree()
}

function getNodeIcon(data: TreeNode): string {
  if (data.type === 'view')      return 'iconfont icon-shitu2'
  if (data.isDeviceChannel)      return 'iconfont icon-shexiangjizaixian'
  if (data.type === 'device')    return 'iconfont icon-Device'
  return 'iconfont icon-gen'
}

// ─── Selected view & layout preview ──────────────────────────────────────────

const currentView     = ref<ViewRow | null>(null)
const previewGrid     = ref<LayoutCell[]>([])
const layoutType      = ref('3|3')
const selectedCellId  = ref<string>('')
// cellId → { name, token, uuid, profile }
const cellAssignments = ref<Record<string, { name: string; token?: string; uuid?: string; profile: string; entityType: string }>>({})

// ─── Drag-and-drop ────────────────────────────────────────────────────────────
const dragData = ref<TreeNode | null>(null)

function handleDragStart(ev: DragEvent, data: TreeNode) {
  dragData.value = data.isDeviceChannel ? data : null
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = data.isDeviceChannel ? 'move' : 'none'
    ev.dataTransfer.setData('text/plain', data.id)
  }
}

function handleDragEnd() {}

function dropOnCell(ev: DragEvent, cellId: string) {
  const d = dragData.value
  dragData.value = null
  if (!d?.isDeviceChannel) return
  const ch = d.data
  cellAssignments.value = {
    ...cellAssignments.value,
    [cellId]: {
      name:       d.label,
      token:      ch?.token,
      uuid:       ch?.uuid ?? ch?.token,
      profile:    'main',
      entityType: 'USC_VIEW_CAMERA',
    },
  }
  selectedCellId.value = cellId
}

function handleNodeClick(data: TreeNode) {
  // 点击视图节点 → 加载该视图布局（对照uscweb DifferentType=='view'）
  if (data.isView && data.viewData) {
    currentView.value = data.viewData
    loadViewPreview(data.viewData)
    return
  }

  // 点击摄像头通道 → 赋值到当前选中格子（对照uscweb handleNodeClick）
  if (data.isDeviceChannel && previewGrid.value.length) {
    if (!selectedCellId.value) selectedCellId.value = previewGrid.value[0].id
    const cellId = selectedCellId.value
    const ch = data.data
    cellAssignments.value = {
      ...cellAssignments.value,
      [cellId]: {
        name:       data.label,
        token:      ch?.token,
        uuid:       ch?.uuid ?? ch?.token,
        profile:    'main',
        entityType: 'USC_VIEW_CAMERA',
      },
    }
    // 自动移到下一格
    const idx = previewGrid.value.findIndex(c => c.id === cellId)
    const next = previewGrid.value[idx + 1] ?? previewGrid.value[0]
    selectedCellId.value = next.id
  }
}

function loadViewPreview(view: ViewRow) {
  // 重置格子分配
  cellAssignments.value = {}

  if (!view.layout) {
    const preset = PRESET_LAYOUTS[view.layoutId as keyof typeof PRESET_LAYOUTS]
    if (preset) {
      previewGrid.value = preset.cells
      layoutType.value  = preset.layout
    } else {
      previewGrid.value = []
    }
  } else {
    layoutType.value  = view.layout.layoutType ?? '3|3'
    previewGrid.value = (view.layout.setting?.layoutView ?? []).map((c: any) => ({
      id: c.position, rowStart: c.rowStart, rowEnd: c.rowEnd,
      colStart: c.colStart, colEnd: c.colEnd, merged: c.merged,
    }))
  }

  // 回填已保存的摄像头分配（对照 uscweb srcview）
  view.viewEntity?.forEach((ve: any) => {
    const cellId = ve.layoutPosition?.startsWith('h')
      ? ve.layoutPosition.slice(1)
      : ve.layoutPosition
    if (!cellId) return
    cellAssignments.value[cellId] = {
      name:       ve.Channel?.name ?? ve.resourceUUID ?? cellId,
      token:      ve.Channel?.token,
      uuid:       ve.resourceUUID,
      profile:    ve.profile ?? 'main',
      entityType: ve.entityType ?? 'USC_VIEW_CAMERA',
    }
  })
}

function computeCellStyle(cell: LayoutCell) {
  const [rows, cols] = layoutType.value.split('|').map(Number)
  const cellW = 100 / cols
  const cellH = 100 / rows
  return {
    position: 'absolute',
    top:    `${(cell.rowStart - 1) * cellH}%`,
    left:   `${(cell.colStart - 1) * cellW}%`,
    width:  `${cellW * (cell.colEnd  - cell.colStart)}%`,
    height: `${cellH * (cell.rowEnd  - cell.rowStart)}%`,
    boxSizing: 'border-box',
    border: '1px solid #333',
  }
}

// ─── Preset layouts (mirrors uscweb) ─────────────────────────────────────────

const PRESET_LAYOUTS: Record<number, { cells: LayoutCell[]; layout: string }> = {
  1: { layout: '1|1', cells: [{ id:'1-1', rowStart:1,rowEnd:2,colStart:1,colEnd:2,merged:true }] },
  3: { layout: '1|3', cells: [
    { id:'1-1', rowStart:1,rowEnd:4,colStart:1,colEnd:2,merged:true },
    { id:'1-2', rowStart:1,rowEnd:4,colStart:2,colEnd:3,merged:true },
    { id:'1-3', rowStart:1,rowEnd:4,colStart:3,colEnd:4,merged:true },
  ]},
  4: { layout: '2|2', cells: Array.from({length:4}, (_,i) => ({
    id:`${Math.floor(i/2)+1}-${i%2+1}`, rowStart:Math.floor(i/2)+1, rowEnd:Math.floor(i/2)+2,
    colStart:i%2+1, colEnd:i%2+2, merged:false,
  }))},
  9: { layout: '3|3', cells: Array.from({length:9}, (_,i) => ({
    id:`${Math.floor(i/3)+1}-${i%3+1}`, rowStart:Math.floor(i/3)+1, rowEnd:Math.floor(i/3)+2,
    colStart:i%3+1, colEnd:i%3+2, merged:false,
  }))},
  16: { layout: '4|4', cells: Array.from({length:16}, (_,i) => ({
    id:`${Math.floor(i/4)+1}-${i%4+1}`, rowStart:Math.floor(i/4)+1, rowEnd:Math.floor(i/4)+2,
    colStart:i%4+1, colEnd:i%4+2, merged:false,
  }))},
  25: { layout: '5|5', cells: Array.from({length:25}, (_,i) => ({
    id:`${Math.floor(i/5)+1}-${i%5+1}`, rowStart:Math.floor(i/5)+1, rowEnd:Math.floor(i/5)+2,
    colStart:i%5+1, colEnd:i%5+2, merged:false,
  }))},
  6: { layout: '3|3', cells: [
    { id:'1-1', rowStart:1,rowEnd:3,colStart:1,colEnd:3,merged:true },
    { id:'1-3', rowStart:1,rowEnd:2,colStart:3,colEnd:4,merged:false },
    { id:'2-3', rowStart:2,rowEnd:3,colStart:3,colEnd:4,merged:false },
    { id:'3-1', rowStart:3,rowEnd:4,colStart:1,colEnd:2,merged:false },
    { id:'3-2', rowStart:3,rowEnd:4,colStart:2,colEnd:3,merged:false },
    { id:'3-3', rowStart:3,rowEnd:4,colStart:3,colEnd:4,merged:false },
  ]},
  7: { layout: '3|3', cells: [
    { id:'1-1', rowStart:1,rowEnd:4,colStart:1,colEnd:2,merged:true },
    { id:'1-2', rowStart:1,rowEnd:2,colStart:2,colEnd:3,merged:false },
    { id:'1-3', rowStart:1,rowEnd:2,colStart:3,colEnd:4,merged:false },
    { id:'2-2', rowStart:2,rowEnd:3,colStart:2,colEnd:3,merged:false },
    { id:'2-3', rowStart:2,rowEnd:3,colStart:3,colEnd:4,merged:false },
    { id:'3-2', rowStart:3,rowEnd:4,colStart:2,colEnd:3,merged:false },
    { id:'3-3', rowStart:3,rowEnd:4,colStart:3,colEnd:4,merged:false },
  ]},
  13: { layout: '4|4', cells: [
    { id:'1-1', rowStart:1,rowEnd:2,colStart:1,colEnd:2,merged:false },
    { id:'1-2', rowStart:1,rowEnd:2,colStart:2,colEnd:3,merged:false },
    { id:'1-3', rowStart:1,rowEnd:2,colStart:3,colEnd:4,merged:false },
    { id:'1-4', rowStart:1,rowEnd:2,colStart:4,colEnd:5,merged:false },
    { id:'2-1', rowStart:2,rowEnd:3,colStart:1,colEnd:2,merged:false },
    { id:'2-2', rowStart:2,rowEnd:4,colStart:2,colEnd:4,merged:true  },
    { id:'2-4', rowStart:2,rowEnd:3,colStart:4,colEnd:5,merged:false },
    { id:'3-1', rowStart:3,rowEnd:4,colStart:1,colEnd:2,merged:false },
    { id:'3-4', rowStart:3,rowEnd:4,colStart:4,colEnd:5,merged:false },
    { id:'4-1', rowStart:4,rowEnd:5,colStart:1,colEnd:2,merged:false },
    { id:'4-2', rowStart:4,rowEnd:5,colStart:2,colEnd:3,merged:false },
    { id:'4-3', rowStart:4,rowEnd:5,colStart:3,colEnd:4,merged:false },
    { id:'4-4', rowStart:4,rowEnd:5,colStart:4,colEnd:5,merged:false },
  ]},
}

// ─── Layout canvas items ──────────────────────────────────────────────────────

const canvasItems = ref<CanvasItem[]>([])

async function loadLayouts() {
  try {
    const res: any = await GetLayoutListApi()
    if (res?.data?.result?.length) {
      canvasItems.value = res.data.result.map((item: any) => ({
        layoutId:   item.layoutId,
        strName:    item.layoutName,
        layoutData: {
          cols: parseInt(item.layoutType.split('|')[1]),
          rows: parseInt(item.layoutType.split('|')[0]),
          grid: (item.setting?.layoutView ?? []).map((c: any) => ({
            id: c.position, rowStart: c.rowStart, rowEnd: c.rowEnd,
            colStart: c.colStart, colEnd: c.colEnd, merged: c.merged,
          })),
        },
      }))
      nextTick(() => drawCanvases('viewCanvas1'))
    }
  } catch {}
}

function drawCanvases(prefix: string) {
  canvasItems.value.forEach((item, index) => {
    nextTick(() => {
      ;['viewCanvas1', 'addCanvas', 'editCanvas', 'dialogCanvas'].forEach(pfx => {
        const canvas = document.getElementById(pfx + index) as HTMLCanvasElement | null
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const { cols, rows, grid } = item.layoutData
        const cw = canvas.width / cols, ch = canvas.height / rows
        grid.forEach(cell => {
          const x = (cell.colStart - 1) * cw, y = (cell.rowStart - 1) * ch
          const w = (cell.colEnd - cell.colStart) * cw, h = (cell.rowEnd - cell.rowStart) * ch
          ctx.fillStyle = '#999'; ctx.fillRect(x, y, w, h)
          ctx.strokeStyle = 'rgb(35,35,35)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h)
        })
      })
    })
  })
}

// Apply preset layout to current view's preview (for View Layout popover)
function applyPresetLayout(n: number) {
  const preset = PRESET_LAYOUTS[n]
  if (!preset) return
  previewGrid.value = preset.cells
  layoutType.value  = preset.layout
  layoutPopoverVisible.value = false
  if (currentView.value) currentView.value = { ...currentView.value, layoutId: n }
}

function applyCustomLayout(item: CanvasItem) {
  layoutType.value  = `${item.layoutData.rows}|${item.layoutData.cols}`
  previewGrid.value = item.layoutData.grid
  layoutPopoverVisible.value = false
  if (currentView.value) currentView.value = { ...currentView.value, layoutId: item.layoutId }
}

const layoutPopoverVisible = ref(false)

// ─── Delete current view ──────────────────────────────────────────────────────

async function deleteCurrentView() {
  if (!currentView.value) return
  try {
    await ElMessageBox.confirm(
      t('Common.comm_delete_confirm'), t('CommTableEdit.comm_prompt'),
      { confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel') }
    )
    const res: any = await DeleteViewApi([currentView.value.viewId])
    if (res?.data?.msg === 'Success') {
      ElMessage({ type: 'success', message: t('CommTableEdit.comm_delete_successfully') })
      currentView.value = null; previewGrid.value = []
      await loadAll()
    } else {
      ElMessage({ type: 'error', message: t('CommTableEdit.comm_delete_failed') })
    }
  } catch {}
}

// ─── Save current view ────────────────────────────────────────────────────────

async function saveCurrentView() {
  if (!currentView.value) return
  try {
    // 从 cellAssignments 构建 viewEntity（对照 uscweb viewadd）
    const viewEntity = Object.entries(cellAssignments.value).map(([cellId, assign]) => ({
      entityType:     assign.entityType,
      layoutPosition: cellId,          // "1-1" → 服务端存为 "h1-1" 或 "1-1"
      resourceUUID:   assign.uuid ?? assign.token ?? '',
      profile:        assign.profile,
    }))
    const res: any = await UpdateViewApi({
      viewId:         currentView.value.viewId,
      viewName:       currentView.value.viewName,
      viewType:       currentView.value.viewType,
      layoutId:       currentView.value.layoutId,
      devPartitionId: currentView.value.devPartitionId,
      viewEntity,
    })
    if (res?.data?.msg === 'Success') {
      ElMessage({ type: 'success', message: t('CommTableEdit.comm_save_successfully') })
      await loadAll()
    } else {
      ElMessage({ type: 'error', message: t('CommTableEdit.comm_save_failed') })
    }
  } catch {}
}

// ─── Add dialog ───────────────────────────────────────────────────────────────

const addDialogVisible  = ref(false)
const addForm = reactive({
  viewName: 'view1', viewType: 'USC_VIEW_PUBLIC',
  layoutId: 0, devPartitionId: 10000, devPartitionName: '',
})
const addDefaultChecked  = ref<number[]>([10000])
const addPartitionFilter = ref('')
const addTreeRef         = ref()

const viewTypeOptions = [
  { label: 'USC_VIEW_PUBLIC',  value: 'USC_VIEW_PUBLIC' },
  { label: 'USC_VIEW_PRIVATE', value: 'USC_VIEW_PRIVATE' },
]

watch(addPartitionFilter, val => addTreeRef.value?.filter(val))
function filterPartitionNode(v: string, d: PartitionNode) {
  if (!v) return true
  return d.devPartitionName.toLowerCase().includes(v.toLowerCase())
}
function handleAddPartitionCheck(node: PartitionNode, state: any) {
  if (state.checkedKeys.length === 2) {
    addTreeRef.value?.setCheckedKeys([node.devPartitionId])
    addForm.devPartitionName = node.devPartitionName
    addForm.devPartitionId   = node.devPartitionId
    addDefaultChecked.value  = [node.devPartitionId]
  }
}
function selectAddLayout(item: CanvasItem) {
  addForm.layoutId = item.layoutId
  highlightCanvas('addCanvas', item.layoutId)
}
function openAdd() {
  addForm.viewName = 'view1'; addForm.viewType = 'USC_VIEW_PUBLIC'
  addForm.layoutId = 0; addForm.devPartitionId = 10000
  addForm.devPartitionName = partitionTree.value[0]?.devPartitionName ?? ''
  addDefaultChecked.value = [10000]
  addDialogVisible.value = true
  nextTick(() => { loadLayouts(); nextTick(() => drawCanvases('addCanvas')) })
}
async function confirmAdd() {
  try {
    const res: any = await CreateViewApi({
      viewName: addForm.viewName, viewType: addForm.viewType,
      layoutId: addForm.layoutId, devPartitionId: addForm.devPartitionId, viewEntity: [],
    })
    if (res?.data?.msg === 'Success') {
      ElMessage({ type: 'success', message: t('CommTableEdit.comm_add_successfully') })
      addDialogVisible.value = false
      await loadAll()
    } else {
      ElMessage({ type: 'error', message: t('CommTableEdit.comm_add_failed') })
    }
  } catch {}
}

// ─── Edit dialog ──────────────────────────────────────────────────────────────

const editDialogVisible  = ref(false)
const editForm = reactive({
  viewId: 0, viewName: '', viewType: '',
  layoutId: 0, devPartitionId: 0, devPartitionName: '',
  viewEntity: [] as ViewEntity[],
})
const editDefaultChecked  = ref<number[]>([])
const editPartitionFilter = ref('')
const editTreeRef         = ref()

watch(editPartitionFilter, val => editTreeRef.value?.filter(val))
function handleEditPartitionCheck(node: PartitionNode, state: any) {
  if (state.checkedKeys.length === 2) {
    editTreeRef.value?.setCheckedKeys([node.devPartitionId])
    editForm.devPartitionName = node.devPartitionName
    editForm.devPartitionId   = node.devPartitionId
    editDefaultChecked.value  = [node.devPartitionId]
  }
}
function selectEditLayout(item: CanvasItem) {
  editForm.layoutId = item.layoutId
  highlightCanvas('editCanvas', item.layoutId)
}
function openEdit() {
  if (!currentView.value) return
  const v = currentView.value
  editForm.viewId = v.viewId; editForm.viewName = v.viewName
  editForm.viewType = v.viewType; editForm.layoutId = v.layoutId
  editForm.devPartitionId = v.devPartitionId
  editForm.devPartitionName = v.devPartitionName ?? ''
  editForm.viewEntity = v.viewEntity ?? []
  editDefaultChecked.value = [v.devPartitionId]
  editDialogVisible.value = true
  nextTick(() => { loadLayouts(); nextTick(() => {
    drawCanvases('editCanvas')
    highlightCanvas('editCanvas', v.layoutId)
  })})
}
async function confirmEdit() {
  try {
    const res: any = await UpdateViewApi({
      viewId: editForm.viewId, viewName: editForm.viewName,
      viewType: editForm.viewType, layoutId: editForm.layoutId,
      devPartitionId: editForm.devPartitionId, viewEntity: editForm.viewEntity,
    })
    if (res?.data?.msg === 'Success') {
      ElMessage({ type: 'success', message: t('CommTableEdit.comm_edit_successfully') })
      editDialogVisible.value = false
      if (currentView.value?.viewId === editForm.viewId) {
        currentView.value = { ...currentView.value, ...editForm }
      }
      await loadAll()
    } else {
      ElMessage({ type: 'error', message: t('CommTableEdit.comm_edit_failed') })
    }
  } catch {}
}

// ─── Layout management dialog ─────────────────────────────────────────────────

const layoutDialogVisible = ref(false)
const newLayoutVisible     = ref(false)
const newLayoutRows        = ref(3)
const newLayoutCols        = ref(3)
const selectedLayoutId     = ref<number | null>(null)

function openLayoutDialog() {
  layoutPopoverVisible.value = false
  layoutDialogVisible.value  = true
  nextTick(() => drawCanvases('dialogCanvas'))
}
function selectLayoutForDelete(id: number) {
  selectedLayoutId.value = id
  highlightCanvas('dialogCanvas', id)
}
function addNewCustomLayout() { newLayoutVisible.value = true }
async function confirmNewLayout() {
  const r = newLayoutRows.value, c = newLayoutCols.value
  const cells = Array.from({length: r * c}, (_, i) => ({
    position: `${Math.floor(i/c)+1}-${i%c+1}`,
    rowStart: Math.floor(i/c)+1, rowEnd: Math.floor(i/c)+2,
    colStart: i%c+1, colEnd: i%c+2, merged: false,
  }))
  try {
    const res: any = await CreateLayoutApi({
      layoutName: `${r}x${c}_${Date.now()}`, layoutType: `${r}|${c}`,
      setting: { layoutView: cells },
    })
    if (res?.data?.msg === 'Success') {
      ElMessage({ type: 'success', message: t('CommTableEdit.comm_save_successfully') })
      newLayoutVisible.value = false
      await loadLayouts()
      nextTick(() => drawCanvases('dialogCanvas'))
    }
  } catch {}
}
async function deleteSelectedLayout() {
  if (selectedLayoutId.value == null) return
  try {
    const res: any = await DeleteLayoutApi([selectedLayoutId.value])
    if (res?.data?.msg === 'Success') {
      ElMessage({ type: 'success', message: t('CommTableEdit.comm_delete_successfully') })
      selectedLayoutId.value = null
      await loadLayouts()
      nextTick(() => drawCanvases('dialogCanvas'))
    }
  } catch {}
}
async function resetDefaultLayouts() {
  // Re-fetch layouts to restore to server state
  await loadLayouts()
  nextTick(() => drawCanvases('dialogCanvas'))
}

// ─── Canvas highlight helper ──────────────────────────────────────────────────

function highlightCanvas(prefix: string, targetLayoutId: number) {
  canvasItems.value.forEach((item, index) => {
    const cv = document.getElementById(prefix + index) as HTMLCanvasElement | null
    cv?.classList.toggle('canvasIconHighlighted', item.layoutId === targetLayoutId)
  })
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(async () => {
  // 默认显示9宫格（对照uscweb初始状态），让用户进来就能拖拽
  const defaultPreset = PRESET_LAYOUTS[9]
  if (defaultPreset) {
    previewGrid.value = defaultPreset.cells
    layoutType.value  = defaultPreset.layout
  }
  await loadAll()
  await loadLayouts()
})
</script>

<style lang="scss" scoped>
.view-page {
  display: flex;
  width: 100%;
  height: 100%;

  .view-left {
    width: 16%;
    min-width: 240px;
    max-width: 300px;
    height: calc(100vh - 30px);
    background-color: #181818;
    overflow-y: auto;
    padding: 0 8px;

    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-thumb {
      border-radius: 3px;
      background: rgba(218,218,218,0.2);
    }

    :deep(.el-tree) {
      background: transparent;
      color: #fff;

      .el-tree-node__content:hover {
        background-color: rgba(3, 153, 254, 0.08);
      }

      .el-tree-node.is-current > .el-tree-node__content {
        color: #0399FE;
        background-color: rgba(3, 153, 254, 0.2);
        border-right: 2px solid #0399FE;

        i, span { color: #0399FE; }
      }
    }
  }

  .view-right {
    flex: 1;
    height: calc(100vh - 30px);
    overflow: hidden;
    background-color: #181818;
    display: flex;
    flex-direction: column;
    padding: 0 0 12px;
  }
}

// ── Toolbar ──────────────────────────────────────────────────────────────────
.sdk_button1 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  width: 100%;
  box-sizing: border-box;

  .button_edi {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

// ── Layout preview area ───────────────────────────────────────────────────────
.layout-preview-area {
  position: relative;
  flex: 1;
  margin: 0 10px 0 10px;
  background: #1e1e1e;
  border: 1px solid #333;
  overflow: hidden;
}

.palace {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: crosshair;

  .cell-label {
    color: #888;
    font-size: 11px;
    user-select: none;
    text-align: center;
    padding: 2px 4px;
    word-break: break-all;
  }

  &.cell-selected {
    border: 2px solid #f44336 !important;
  }

  &.cell-assigned {
    .cell-label { color: #0399FE; }
  }

  &:hover { background-color: #2a2a2a; }
}

.videoColor { background-color: #222; }

.layout-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  font-size: 14px;
}

// ── Layout picker (in dialogs) ────────────────────────────────────────────────
.layout-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 8px;
  border: 1px solid #4a4a4a;
  border-radius: 4px;
  min-height: 54px;
  max-height: 140px;
  overflow-y: auto;
}

.layout-canvas-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 3px;
  border-radius: 3px;
  gap: 3px;

  span {
    font-size: 11px;
    color: #aaa;
    max-width: 50px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover { background: rgba(3,153,254,0.15); }
}
</style>

<style lang="scss">
// ── Popover ───────────────────────────────────────────────────────────────────
.GongGePopover {
  .LayoutSearch {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 10px;
    .OpenLayoutDialog { cursor: pointer; color: #0399fe; }
  }
  .liveview_group {
    p { margin: 0 0 4px; font-size: 12px; padding-left: 10px; }
    .PanelBtns {
      display: flex;
      padding-left: 12px;
      button { padding:0; border:none; background:none; font-size:22px; margin-right:12px; }
    }
  }
  .ViewLayout {
    flex: 1;
    padding-left: 12px;
    overflow-y: auto;
    p { margin: 0 0 6px; font-size: 12px; }
    .LayoutCanvas {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      margin: 0 12px 6px 0;
      span { font-size: 10px; color: #aaa; }
    }
  }
}

// ── Layout management dialog ──────────────────────────────────────────────────
.ViewLayoutDialog {
  .layout_topBtn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    .button_edi { display: flex; gap: 8px; }
    .button_default button { color: #0399fe; }
  }
  .LayoutIcon {
    .customIcon {
      p { margin-bottom: 6px; font-size: 12px; }
      .DialogLayout {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 8px;
        border: 1px solid #444;
        border-radius: 4px;
        min-height: 50px;
        div { cursor: pointer; }
      }
    }
  }
}

// ── Canvas highlight ──────────────────────────────────────────────────────────
.canvasIconHighlighted {
  box-shadow: 0 0 0 2px #fff100;
  transform: scale(1.1);
  transition: transform 0.2s ease;
}
</style>
