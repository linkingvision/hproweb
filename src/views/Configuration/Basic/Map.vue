<template>
  <div class="liveview Camera">
    <!-- 左侧设备树 -->
    <div class="liveview_left">
      <el-collapse v-model="activeNames">
        <el-collapse-item name="1">
          <template #title>
            <div style="display:flex;justify-content:space-between;width:85%;align-items:center;">
              <div>{{ t('CommDev.comm_dev_root') }}</div>
              <div>
                <i class="iconfont icon-shuaxin1 liveview_titleicon1" style="cursor:pointer;" @click.stop="refreshTree"></i>
              </div>
            </div>
          </template>
          <el-input :placeholder="t('Common.comm_filtration')" v-model="filterText" style="margin:8px 0;" />
          <el-tree
            ref="treeRef"
            :data="treeData"
            node-key="id"
            :props="treeProps"
            :filter-node-method="filterNode"
            :default-expanded-keys="defaultExpandIds"
            :empty-text="t('CommTable.comm_no_data_available')"
            @node-click="handleNodeClick"
          >
            <template #default="{ data }">
              <span draggable="true" @dragstart="dragStart($event, data)" @dragend="dragEnd"
                style="display:flex;align-items:center;width:100%;">
                <i :class="getNodeIcon(data)" style="font-size:16px;margin-right:4px;" />
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ data.label }}</span>
              </span>
            </template>
          </el-tree>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 右侧地图区 -->
    <div class="liveview_right">
      <div class="devices_topBtn_special">
        <div class="button_edi">
          <el-button class="form_butt" @click="openAddMap">
            <i class="iconfont icon-xinjian" style="margin-right:4px;" />
            {{ t('Setting.set_adding_a_map') }}
          </el-button>
          <el-button class="form_butt1" @click="deleteCurrentMap">
            {{ t('CommTableEdit.comm_delete') }}
          </el-button>
        </div>
        <div style="display:flex;align-items:center;">
          <i class="iconfont icon-tishi" style="color:#FAAD14;margin-right:4px;" />
          <span>{{ t('Setting.set_right_click_delete_resource_map') }}</span>
        </div>
        <div class="sdk_setting">
          <el-button class="editmap" @click="openEditMap">{{ t('Setting.set_editing_a_map') }}</el-button>
          <el-button class="clearmap" @click="clearMap">{{ t('Setting.set_clear_the_map') }}</el-button>
        </div>
      </div>
      <div class="MapSetting">
        <div class="SettingColor">
          <div style="margin-right:14px;">{{ t('Setting.set_color') }}:</div>
          <div style="width:105px;display:flex;justify-content:space-between;align-items:center;">
            <div class="DefaultColor" @click="updateCamera('USC_MAP_CAM_COLOR_BLUE')"   style="background:rgba(7,201,255,1)" />
            <div class="DefaultColor" @click="updateCamera('USC_MAP_CAM_COLOR_GREEN')"  style="background:rgba(105,226,66,1)" />
            <div class="DefaultColor" @click="updateCamera('USC_MAP_CAM_COLOR_YELLOW')" style="background:rgba(243,179,64,1)" />
          </div>
        </div>
        <div class="CameraData"><div>{{ t('Setting.set_outside') }}:</div><input class="CameraInput" v-model="callbackData.radius" /></div>
        <div class="CameraData"><div>{{ t('Setting.set_angle') }}:</div><input class="CameraInput" v-model="callbackData.angle" /></div>
        <div class="CameraData"><div>{{ t('Setting.set_level') }}:</div><span class="ZoomValue">{{ currentZoom }}</span></div>
      </div>
      <div id="map" class="map" @drop="dropTarget($event)" @dragover.prevent @contextmenu.prevent></div>
    </div>

    <!-- ─── 添加地图弹窗 ─────────────────────────────────────────── -->
    <el-dialog v-model="dialogFormVisible" :title="t('Setting.set_create_a_map')" width="500px">
      <el-form label-position="left" label-width="160px" size="small" :model="form">
        <el-form-item :label="t('Setting.set_map_name')">
          <el-input v-model="form.mapName" />
        </el-form-item>
        <el-form-item :label="t('Common.comm_device_partition')">
          <el-popover placement="bottom" width="360" trigger="click">
            <template #reference>
              <el-input v-model="form.devPartitionName" :placeholder="t('Common.comm_please_select')" readonly />
            </template>
            <el-input v-model="filterText1" :placeholder="t('Common.comm_filtration')" style="margin-bottom:8px;" />
            <el-tree ref="addPartitionTreeRef" :data="partitionTree" node-key="devPartitionId"
              :props="partitionTreeProps" show-checkbox check-strictly
              :filter-node-method="filterPartitionNode" :default-checked-keys="addDefaultChecked"
              @check="handleAddPartitionCheck" />
          </el-popover>
        </el-form-item>
        <el-form-item :label="t('Setting.set_map_type')">
          <el-select v-model="form.mapType" @change="mapTypeChange" style="width:100%;">
            <el-option v-for="opt in mapTypes" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('Setting.set_projection')">
          <el-select v-model="form.mapProjection" style="width:100%;">
            <el-option v-for="opt in mapProjections" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.mapType === 'USC_MAP_TILE'" :label="t('Setting.set_online_tile')">
          <el-switch v-model="form.onlineTile" @change="mapTypeChange" />
        </el-form-item>
        <el-form-item v-if="form.mapType === 'USC_MAP_STATIC'">
          <el-upload action="#" ref="uploadRef" class="avatar-uploader" drag
            :on-remove="handleRemove" :on-change="handleFileChange"
            :before-upload="beforeUpload" :file-list="fileList" :limit="2" :auto-upload="false">
            <template v-if="imgBase64"><img :src="imgBase64" class="image-preview" /></template>
            <template v-else>
              <div class="upload-content">
                <i class="iconfont icon-xinjian" style="font-size:28px;" />
                <div class="el-upload__text">{{ t('Setting.set_upload_base_map') }}</div>
                <div class="el-upload__tip">{{ t('Setting.set_only_jpg_png') }}<br/>{{ t('Setting.set_maximum_image_size') }}; {{ t('Setting.set_minimum_pixels') }}</div>
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item v-if="form.mapType !== 'USC_MAP_STATIC'" label="URL">
          <el-input v-model="form.mapurl" />
        </el-form-item>
        <el-form-item v-if="form.mapType === 'USC_MAP_TIAN'" label="URL2">
          <el-input v-model="form.mapUrl2" />
        </el-form-item>
        <el-form-item v-if="form.mapType === 'USC_MAP_TILE'" :label="t('Setting.set_central_point')">
          <el-select v-model="form.centerCord" style="width:100%;">
            <el-option :label="t('Setting.set_longitude_latitude')" :value="false" />
            <el-option :label="t('Setting.set_tile_coordinates')" :value="true" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.mapType === 'USC_MAP_TILE' && form.centerCord" :label="t('Setting.set_tile_row')">
          <el-input v-model="form.tileX" />
        </el-form-item>
        <el-form-item v-if="form.mapType === 'USC_MAP_TILE' && form.centerCord" :label="t('Setting.set_tile_column')">
          <el-input v-model="form.tileY" />
        </el-form-item>
        <el-form-item v-if="form.mapType !== 'USC_MAP_STATIC' && !(form.mapType === 'USC_MAP_TILE' && form.centerCord)" :label="t('Setting.set_longitude')">
          <el-input v-model="form.XCoordinate" />
        </el-form-item>
        <el-form-item v-if="form.mapType !== 'USC_MAP_STATIC' && !(form.mapType === 'USC_MAP_TILE' && form.centerCord)" :label="t('Setting.set_latitude')">
          <el-input v-model="form.YCoordinate" />
        </el-form-item>
        <el-form-item :label="t('Setting.set_layer_scaling')"><el-input v-model="form.zoom" /></el-form-item>
        <el-form-item :label="t('Setting.set_maximum_layer')"><el-input v-model="form.maxZoom" /></el-form-item>
        <el-form-item :label="t('Setting.set_minimum_layer')"><el-input v-model="form.minZoom" /></el-form-item>
        <el-form-item :label="t('Setting.set_system_default_map')"><el-switch v-model="form.systemDefaultMap" /></el-form-item>
        <el-form-item :label="t('Common.comm_description')"><el-input v-model="form.description" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button class="form_butt1" @click="dialogFormVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="createMap">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>

    <!-- ─── 编辑地图弹窗 ─────────────────────────────────────────── -->
    <el-dialog v-model="editDialogVisible" :title="t('Setting.set_editing_a_map')" width="500px">
      <el-form label-position="left" label-width="160px" size="small" :model="editForm">
        <el-form-item :label="t('Setting.set_map_name')"><el-input v-model="editForm.mapName" /></el-form-item>
        <el-form-item :label="t('Common.comm_device_partition')">
          <el-popover placement="bottom" width="360" trigger="click">
            <template #reference>
              <el-input v-model="editForm.devPartitionName" :placeholder="t('Common.comm_please_select')" readonly />
            </template>
            <el-input v-model="filterText2" :placeholder="t('Common.comm_filtration')" style="margin-bottom:8px;" />
            <el-tree ref="editPartitionTreeRef" :data="partitionTree" node-key="devPartitionId"
              :props="partitionTreeProps" show-checkbox check-strictly
              :filter-node-method="filterPartitionNode2" :default-checked-keys="editDefaultChecked"
              @check="handleEditPartitionCheck" />
          </el-popover>
        </el-form-item>
        <el-form-item :label="t('Setting.set_map_type')"><el-input v-model="editForm.mapType" disabled /></el-form-item>
        <el-form-item :label="t('Setting.set_projection')">
          <el-select v-model="editForm.mapProjection" style="width:100%;">
            <el-option v-for="opt in mapProjections" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="editForm.mapType === 'USC_MAP_TILE'" :label="t('Setting.set_online_tile')">
          <el-switch v-model="editForm.onlineTile" disabled />
        </el-form-item>
        <el-form-item v-if="editForm.mapType === 'USC_MAP_STATIC'">
          <el-upload action="#" ref="editUploadRef" class="avatar-uploader" drag
            :on-remove="handleRemove" :on-change="handleFileChange"
            :before-upload="beforeUpload" :file-list="fileList" :limit="2" :auto-upload="false">
            <template v-if="imgBase64"><img :src="imgBase64" class="image-preview" /></template>
            <template v-else>
              <div class="upload-content"><i class="iconfont icon-xinjian" style="font-size:28px;" /><div class="el-upload__text">{{ t('Setting.set_upload_base_map') }}</div></div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item v-if="editForm.mapType !== 'USC_MAP_STATIC'" label="URL"><el-input v-model="editForm.mapurl" /></el-form-item>
        <el-form-item v-if="editForm.mapType === 'USC_MAP_TIAN'" label="URL2"><el-input v-model="editForm.mapUrl2" /></el-form-item>
        <el-form-item v-if="editForm.mapType === 'USC_MAP_TILE'" :label="t('Setting.set_central_point')">
          <el-select v-model="editForm.centerCord" style="width:100%;">
            <el-option :label="t('Setting.set_longitude_latitude')" :value="false" />
            <el-option :label="t('Setting.set_tile_coordinates')" :value="true" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="editForm.mapType === 'USC_MAP_TILE' && editForm.centerCord" :label="t('Setting.set_tile_row')"><el-input v-model="editForm.tileX" /></el-form-item>
        <el-form-item v-if="editForm.mapType === 'USC_MAP_TILE' && editForm.centerCord" :label="t('Setting.set_tile_column')"><el-input v-model="editForm.tileY" /></el-form-item>
        <el-form-item v-if="editForm.mapType !== 'USC_MAP_STATIC' && !(editForm.mapType === 'USC_MAP_TILE' && editForm.centerCord)" :label="t('Setting.set_longitude')"><el-input v-model="editForm.XCoordinate" /></el-form-item>
        <el-form-item v-if="editForm.mapType !== 'USC_MAP_STATIC' && !(editForm.mapType === 'USC_MAP_TILE' && editForm.centerCord)" :label="t('Setting.set_latitude')"><el-input v-model="editForm.YCoordinate" /></el-form-item>
        <el-form-item :label="t('Setting.set_layer_scaling')"><el-input v-model="editForm.zoom" /></el-form-item>
        <el-form-item :label="t('Setting.set_maximum_layer')"><el-input v-model="editForm.maxZoom" /></el-form-item>
        <el-form-item :label="t('Setting.set_minimum_layer')"><el-input v-model="editForm.minZoom" /></el-form-item>
        <el-form-item :label="t('Setting.set_system_default_map')"><el-switch v-model="editForm.systemDefaultMap" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button class="form_butt1" @click="editDialogVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="submitEdit">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import 'ol/ol.css'
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Map as OLMap, View } from 'ol'
import ImageLayer from 'ol/layer/Image'
import ImageStatic from 'ol/source/ImageStatic'
import TileLayer from 'ol/layer/Tile'
import { WMTS, XYZ } from 'ol/source'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import { ScaleLine } from 'ol/control'
import { fromLonLat, toLonLat, get } from 'ol/proj'
import { getWidth, getTopLeft } from 'ol/extent'
import LinearRing from 'ol/geom/LinearRing'
import Polygon from 'ol/geom/Polygon'
import service from '@/api/http'
import { GetDevPartitionApi } from '@/api/configuration/device'
import { GetDeviceChannels } from '@/api/channel'
import { GetViewListApi } from '@/api/view'
import { useUserStore } from '@/store/user'
// @ts-ignore
import H5smap from '@/assets/js/h5mapjs.js'

const { t } = useI18n()
const userStore = useUserStore()
const IPPORT = () => userStore.IPPORT

// ─── CustomScaleLine ─────────────────────────────────────────────────────────
class CustomScaleLine extends ScaleLine {
  scaleBar: HTMLElement
  constructor(opts?: any) {
    super(opts || {})
    this.element = document.createElement('div')
    this.element.className = (opts?.className) || 'custom-scale-line-container'
    this.scaleBar = document.createElement('div')
    this.scaleBar.className = 'custom-scale-line'
    this.scaleBar.innerHTML = `<div class="scale-value">0</div><div class="h-letter"><div class="vertical vertical-left"></div><div class="horizontal"></div><div class="vertical vertical-right"></div></div>`
    this.element.appendChild(this.scaleBar)
    this.on('change', () => this.updateHTML())
  }
  updateHTML() {
    // 直接读自身的 renderedHTML_（CustomScaleLine 继承 ScaleLine，自身已计算好比例尺文字）
    const el = this.scaleBar.querySelector('.scale-value')
    if (el) el.textContent = (this as any).renderedHTML_ || '0'
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface TreeNode {
  id: string; label: string; type: 'partition'|'device'|'channel'|'map'|'view'
  data?: any; children?: TreeNode[]; isLeaf?: boolean; isDeviceChannel?: boolean; isView?: boolean
}
interface PartitionNode {
  devPartitionId: number; devPartitionName: string; children?: PartitionNode[]
}

// ─── Tree state ───────────────────────────────────────────────────────────────
const treeRef          = ref()
const treeData         = ref<TreeNode[]>([])
const partitionTree    = ref<PartitionNode[]>([])
const filterText       = ref('')
const activeNames      = ref(['1'])
const defaultExpandIds = ref<string[]>([])
const treeProps        = { label: 'label', children: 'children' }
const partitionTreeProps = { label: 'devPartitionName', children: 'children' }
const deviceCache      = new Map<string, TreeNode[]>()

watch(filterText, v => treeRef.value?.filter(v))

function filterNode(v: string, d: TreeNode) {
  if (!v) return true
  return d.label.toLowerCase().includes(v.toLowerCase())
}

function getNodeIcon(d: TreeNode) {
  if (d.type === 'map')            return 'iconfont icon-ditu'
  if (d.type === 'view')           return 'iconfont icon-shitu2'
  if (d.isDeviceChannel)           return 'iconfont icon-shexiangjizaixian'
  if (d.type === 'device')         return 'iconfont icon-Device'
  return 'iconfont icon-gen'
}

function buildTree(parts: any[], mapsByPartition: Record<number, any[]>, viewsByPartition: Record<number, any[]> = {}): TreeNode[] {
  return parts.map(p => {
    const children: TreeNode[] = []
    if (p.children?.length) children.push(...buildTree(p.children, mapsByPartition, viewsByPartition))
    p.dev?.forEach((d: any) => children.push({
      id: `dev_${d.devId}`, label: d.name, type: 'device', data: d, children: [], isLeaf: false,
    }))
    p.accessDev?.forEach((d: any) => children.push({
      id: `acc_${d.accessDevId ?? d.uuid}`,
      label: d.name, type: 'device',
      data: { ...d, isAccessDev: true }, children: [], isLeaf: false,
    }))
    // 地图节点
    p.map?.forEach((m: any) => children.push({
      id: `map_${m.mapId}`, label: m.mapName, type: 'map', data: m, isLeaf: true,
    }))
    mapsByPartition[p.devPartitionId]?.forEach((m: any) => {
      if (!children.some(c => c.id === `map_${m.mapId}`))
        children.push({ id: `map_${m.mapId}`, label: m.mapName, type: 'map', data: m, isLeaf: true })
    })
    // 视图节点（对照 View.vue，同一棵树显示 View 和 Map）
    const seenViewIds = new Set<number>()
    p.view?.forEach((v: any) => {
      seenViewIds.add(v.viewId)
      children.push({ id: `view_${v.viewId}`, label: v.viewName, type: 'view', data: v, isLeaf: true, isView: true })
    })
    viewsByPartition[p.devPartitionId]?.forEach((v: any) => {
      if (!seenViewIds.has(v.viewId))
        children.push({ id: `view_${v.viewId}`, label: v.viewName, type: 'view', data: v, isLeaf: true, isView: true })
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

async function loadTree() {
  try {
    // 三路并发：设备分区、地图分区、视图列表
    const [devRes, mapRes, viewRes] = await Promise.allSettled([
      GetDevPartitionApi(),
      service.get('/uapi/v1/DevPartition/List?pageSize=100000&type=USC_MAP'),
      GetViewListApi(),
    ])

    if (devRes.status !== 'fulfilled') return
    const res: any = devRes.value
    if (res?.status !== 200 || !res?.data?.result?.length) return
    const root = res.data.result[0]
    partitionTree.value = res.data.result

    // 从地图专用分区树中提取 mapId → mapNode 映射（按 devPartitionId 归组）
    const mapsByPartition: Record<number, any[]> = {}
    if (mapRes.status === 'fulfilled') {
      const collectMaps = (nodes: any[]) => {
        nodes.forEach(n => {
          n.map?.forEach((m: any) => {
            const pid = n.devPartitionId
            if (!mapsByPartition[pid]) mapsByPartition[pid] = []
            if (!mapsByPartition[pid].some((x: any) => x.mapId === m.mapId))
              mapsByPartition[pid].push(m)
          })
          if (n.children?.length) collectMaps(n.children)
        })
      }
      const mapTreeResult: any[] = (mapRes.value as any)?.data?.result ?? []
      collectMaps(mapTreeResult)
    }

    // 从视图列表构建 viewsByPartition
    const viewsByPartition: Record<number, any[]> = {}
    if (viewRes.status === 'fulfilled') {
      const views: any[] = (viewRes.value as any)?.data?.result ?? []
      views.forEach((v: any) => {
        const pid = v.devPartitionId ?? 10000
        if (!viewsByPartition[pid]) viewsByPartition[pid] = []
        viewsByPartition[pid].push(v)
      })
    }

    const tree: TreeNode[] = []
    // 构建 Root 子节点（分区子节点 + 设备 + 地图 + 视图）
    const rootChildren: TreeNode[] = []
    if (root.children?.length) rootChildren.push(...buildTree(root.children, mapsByPartition, viewsByPartition))
    root.dev?.forEach((d: any) => rootChildren.push({ id: `dev_${d.devId}`, label: d.name, type: 'device', data: d, children: [], isLeaf: false }))
    root.accessDev?.forEach((d: any) => rootChildren.push({ id: `acc_${d.accessDevId ?? d.uuid}`, label: d.name, type: 'device', data: { ...d, isAccessDev: true }, children: [], isLeaf: false }))
    root.map?.forEach((m: any) => rootChildren.push({ id: `map_${m.mapId}`, label: m.mapName, type: 'map', data: m, isLeaf: true }))
    mapsByPartition[root.devPartitionId]?.forEach((m: any) => {
      if (!rootChildren.some(n => n.id === `map_${m.mapId}`))
        rootChildren.push({ id: `map_${m.mapId}`, label: m.mapName, type: 'map', data: m, isLeaf: true })
    })
    // 视图节点（根分区）
    const seenRootViews = new Set<number>()
    root.view?.forEach((v: any) => {
      seenRootViews.add(v.viewId)
      rootChildren.push({ id: `view_${v.viewId}`, label: v.viewName, type: 'view', data: v, isLeaf: true, isView: true })
    })
    viewsByPartition[root.devPartitionId]?.forEach((v: any) => {
      if (!seenRootViews.has(v.viewId))
        rootChildren.push({ id: `view_${v.viewId}`, label: v.viewName, type: 'view', data: v, isLeaf: true, isView: true })
    })
    // Root 节点本身（对照 uscweb comm_dev_root）
    tree.push({
      id: `part_${root.devPartitionId}`,
      label: root.devPartitionName || t('CommDev.comm_dev_root'),
      type: 'partition',
      data: root,
      isLeaf: false,
      children: rootChildren,
    })

    const devNodes = extractDevices(tree)
    for (let i = 0; i < devNodes.length; i += 3) {
      await Promise.allSettled(devNodes.slice(i, i + 3).map(async item => {
        if (deviceCache.has(item.data.token)) { const c = deviceCache.get(item.data.token)!; item.children = c.length ? c : undefined; item.isLeaf = !c.length; return }
        try {
          const r: any = await GetDeviceChannels(item.data.token)
          if (r?.status === 200 && r?.data?.code === 0 && r?.data?.result?.length) {
            const chs: TreeNode[] = r.data.result.map((ch: any, idx: number) => ({ id: `ch_${item.data.devId}_${idx}`, label: ch.name || `ch ${idx+1}`, type: 'device' as const, data: ch, isLeaf: true, isDeviceChannel: true }))
            deviceCache.set(item.data.token, chs); item.children = chs; item.isLeaf = false
          } else { deviceCache.set(item.data.token, []); item.isLeaf = true }
        } catch { item.isLeaf = true }
      }))
    }
    treeData.value = tree
    if (tree.length) defaultExpandIds.value = [tree[0].id]
  } catch (e) { console.warn('[Map] loadTree error', e) }
}

async function refreshTree() { deviceCache.clear(); await loadTree() }

// ─── Map state ───────────────────────────────────────────────────────────────
const mapInstance  = ref<any>(null)   // ol/Map instance
const DrawMap      = ref<any>(null)   // H5smap instance
const mapID        = ref<number | null>(null)
const OperateData  = ref<any>({})
const currentZoom  = ref(0)
const callbackData = ref<any>({})
const drags        = ref(true)
const dragtype     = ref<any>(null)
const DeivesExist  = ref<any[]>([])
const putChannelId = ref<{key:string;value:any}[]>([])
const putViewId    = ref<{key:string;value:any}[]>([])
const putLinkId    = ref<{key:string;value:any}[]>([])

// URL presets (same as uscweb)
const urlTest = {
  GaoDe: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}',
  Google: 'https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
  TianDiTu: ['http://t{0-6}.tianditu.gov.cn/vec_c/wmts?tk=52c8ce2d4d1701548ee57db026b301ea','http://t{0-6}.tianditu.gov.cn/cva_c/wmts?tk=52c8ce2d4d1701548ee57db026b301ea'],
  onlineTile: ['http://t1.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=52c8ce2d4d1701548ee57db026b301ea','/mediastore/map/'],
}

// ─── Tree node click ──────────────────────────────────────────────────────────
function handleNodeClick(data: TreeNode) {
  if (data.type !== 'map') return
  DeivesExist.value = []
  mapID.value = data.data?.mapId ?? null
  const url = IPPORT() + '/uapi/v1/Map/' + mapID.value
  service.get(url).then((res: any) => {
    const mapdata = res.data.result
    OperateData.value = mapdata
    const allowed = ['USC_MAP_STATIC','USC_MAP_CAD','USC_MAP_GOOGLE','USC_MAP_GAO_DE','USC_MAP_TIAN','USC_MAP_TILE']
    if (!allowed.includes(mapdata.type)) return
    if (mapInstance.value) { mapInstance.value.getLayers().clear() }
    else { mapInstance.value = new OLMap({ target: 'map' }) }
    switch (mapdata.type) {
      case 'USC_MAP_STATIC': staticMap(mapdata, mapInstance.value); break
      default: gisMap(mapdata, mapInstance.value)
    }
    mapInstance.value.on('moveend', () => {
      currentZoom.value = Math.trunc(mapInstance.value.getView().getProperties().zoom)
    })
    setTimeout(() => {
      if (mapdata.mapElementChannel?.length) renderChannels(mapdata.mapElementChannel)
      if (mapdata.mapView?.length)           renderViews(mapdata.mapView)
      if (mapdata.mapElementLink?.length)    renderLinks(mapdata.mapElementLink)
    }, 500)
  }).catch(() => {})
}

// ─── Map rendering ────────────────────────────────────────────────────────────
function tileToLatLng(x: number, y: number, z: number) {
  const n = Math.pow(2, z)
  return { lon: x / n * 360 - 180, lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI }
}

function addScaleLine(map: any) {
  const ctrl = new CustomScaleLine({ className: 'custom-scale-line-container', units: 'metric' })
  if (!map.getControls().getArray().find((c: any) => c instanceof CustomScaleLine)) map.addControl(ctrl)
  map.on('postrender', () => ctrl.updateHTML())
  map.getView().on('change:resolution', () => ctrl.updateHTML())
}

function gisMap(data: any, map: any) {
  const proj = data.projection || 'EPSG:4326'
  if (data.type === 'USC_MAP_TIAN') {
    const p = get('EPSG:4326')!
    const ext = p.getExtent()
    const size = getWidth(ext) / 256
    const res = Array.from({length:18}, (_,z) => size / Math.pow(2,z))
    const ids = Array.from({length:18}, (_,z) => z)
    map.setView(new View({ projection: proj, center: data.center, zoom: data.zoom||7, minZoom: data.minZoom, maxZoom: data.maxZoom||8 }))
    map.addLayer(new TileLayer({ source: new WMTS({ url: data.mapUrl, layer:'vec', matrixSet:'c', format:'tiles', style:'default', crossOrigin:'anonymous', tileGrid: new WMTSTileGrid({ origin: getTopLeft(ext), resolutions: res, matrixIds: ids }) }) }))
    if (data.mapUrl2) map.addLayer(new TileLayer({ source: new WMTS({ url: data.mapUrl2, layer:'cva', matrixSet:'c', format:'tiles', style:'default', crossOrigin:'anonymous', tileGrid: new WMTSTileGrid({ origin: getTopLeft(ext), resolutions: res, matrixIds: ids }) }) }))
  } else if (data.type === 'USC_MAP_TILE') {
    if (data.centerCord) { const {lon,lat} = tileToLatLng(data.tileX,data.tileY,data.zoom); data.center = [+lon.toFixed(6),+lat.toFixed(6)] }
    const center = proj === 'EPSG:3857' ? fromLonLat(data.center) : data.center
    let mapUrl = data.mapUrl
    if (!data.onlineTile) mapUrl = IPPORT() + mapUrl + '/{z}/{x}/{y}.png'
    map.setView(new View({ center, zoom: data.zoom||7, minZoom: data.minZoom, maxZoom: data.maxZoom||8, projection: proj }))
    map.addLayer(new TileLayer({ source: new XYZ({ url: mapUrl, projection: proj }) }))
  } else {
    map.setView(new View({ center: fromLonLat(data.center), zoom: data.zoom||7, minZoom: data.minZoom, maxZoom: data.maxZoom||8, projection: proj }))
    map.addLayer(new TileLayer({ source: new XYZ({ url: data.mapUrl, projection: proj }) }))
  }
  addScaleLine(map)
}

function staticMap(data: any, map: any) {
  map.setView(new View({ center: fromLonLat([0,0]), zoom: data.zoom||7, minZoom: data.minZoom, maxZoom: data.maxZoom||8 }))
  const img = new Image()
  img.src = IPPORT() + '/' + data.mapUrl + '?session=' + userStore.session;
  img.onload = () => {
    const w = img.width, h = img.height
    const ext = [-w*1000,-h*1000,w*1000,h*1000]
    map.addLayer(new ImageLayer({ source: new ImageStatic({ url: img.src, imageExtent: ext }) }))
  }
  addScaleLine(map)
}

function clearMap() {
  if (mapInstance.value) { mapInstance.value.getLayers().clear(); currentZoom.value = 0 }
  else mapInstance.value = new OLMap({ target: 'map' })
}

function updateCamera(color: string) { DrawMap.value?.updateCamera(color, []) }

// ─── Render existing map elements ─────────────────────────────────────────────
function ensureDrawMap() {
  if (!DrawMap.value) DrawMap.value = new H5smap(mapInstance.value)
}
function coordFix(item: any) {
  const proj = mapInstance.value?.getView().getProjection()
  if (proj?.getCode() === 'EPSG:3857') {
    const c = fromLonLat([item.longitude, item.latitude])
    item.longitude = c[0]; item.latitude = c[1]
  }
}
function renderChannels(data: any[]) {
  data.forEach(item => {
    coordFix(item); DeivesExist.value.push(item.channel)
    ensureDrawMap(); DrawMap.value.addLayer({ map: mapInstance.value, cameraName: item.channelName, cameraToken: item.channelUUID, radius: item.Radius, angle: item.angle, rotationAngle: item.rotationAngle, cameraType: item.fillColor, coordinate: [item.longitude, item.latitude], id: item.id, type: 'camera', callback: EventCB1 })
  })
}
function renderViews(data: any[]) {
  data.forEach(item => {
    coordFix(item)
    ensureDrawMap(); DrawMap.value.addLayer({ map: mapInstance.value, cameraName: item.viewName, cameraToken: item.viewUUID, cameraType: item.fillColor, coordinate: [item.longitude, item.latitude], drawIcon: true, id: item.id, type: 'view', callback: EventCB1 })
  })
}
function renderLinks(data: any[]) {
  data.forEach(item => {
    coordFix(item)
    ensureDrawMap(); DrawMap.value.addLayer({ map: mapInstance.value, cameraName: item.resName, cameraToken: item.id, cameraType: item.fillColor, coordinate: [item.longitude, item.latitude], drawIcon: true, id: item.mapLinkId, type: 'link', callback: EventCB1 })
  })
}

// ─── MapChannel: reload existing elements ────────────────────────────────────
function loadMapChannel(label?: string, value?: string) {
  if (!mapID.value) return
  service.get(IPPORT() + '/uapi/v1/Map/' + mapID.value).then((res: any) => {
    if (res.data.msg !== 'Success') return
    DeivesExist.value = []
    const r = res.data.result
    r.mapElementChannel?.forEach((item: any) => { DeivesExist.value.push(item.channel); if (label==='camera'&&value===item.channelUUID) putChannelId.value.push({key:item.channelUUID,value:item.id}) })
    r.mapView?.forEach((item: any) => { DeivesExist.value.push(item.view); if (label==='view'&&value===item.viewUUID) putViewId.value.push({key:item.viewUUID,value:item.id}) })
    r.mapElementLink?.forEach((item: any) => { DeivesExist.value.push(item); if (label==='link'&&value===item.mapLinkId) putLinkId.value.push({key:item.mapLinkId,value:item.id}) })
  })
}

// ─── Drag / Drop ──────────────────────────────────────────────────────────────
function dragStart(ev: DragEvent, data: TreeNode) {
  drags.value = false; dragtype.value = data
  ev.dataTransfer?.setData('Text', (ev.target as HTMLElement).id)
  loadMapChannel()
}
function dragEnd() {}

function dropTarget(ev: DragEvent) {
  if (drags.value || !mapInstance.value) return
  drags.value = true
  const proj = mapInstance.value.getView().getProjection()
  let coords = mapInstance.value.getEventCoordinate(ev)
  if (proj.getCode() !== 'EPSG:4326') coords = fromLonLat(toLonLat(coords))
  const dt = dragtype.value
  if (!dt) return
  ensureDrawMap()
  if (dt.type === 'map') {
    if (DeivesExist.value.some((i: any) => i.mapLinkId === dt.data?.mapId)) return
    DrawMap.value.addLayer({ map: mapInstance.value, cameraName: dt.label, cameraToken: dt.data?.mapId, cameraType: 'USC_MAP_CAM_COLOR_BLUE', coordinate: coords, drawIcon: true, type: 'link', id: dt.data?.mapId, callback: EventCB })
  } else if (dt.type === 'device' && dt.isDeviceChannel) {
    if (DeivesExist.value.some((i: any) => i.token === dt.data?.token)) return
    DrawMap.value.addLayer({ map: mapInstance.value, cameraName: dt.label, cameraToken: dt.data?.uuid || dt.data?.token, cameraType: 'USC_MAP_CAM_COLOR_BLUE', coordinate: coords, type: 'camera', callback: EventCB })
  }
}

// ─── EventCB: drag-add new element ───────────────────────────────────────────
function EventCB(data: any) {
  const proj = mapInstance.value?.getView().getProjection()
  if (proj?.getCode() === 'EPSG:3857') data.center = toLonLat(data.center)
  if (data.type === 'camera' && data.callbackType === 'Add') {
    service.post(IPPORT()+'/uapi/v1/Map/Cam/Channel', { mapId: mapID.value, channelUUID: dragtype.value?.data?.uuid, longitude: data.center[0], latitude: data.center[1], radius: data.radius, angle: data.angle, rotationAngle: data.rotationAngle, fillColor: data.cameraType }).then(() => loadMapChannel('camera', dragtype.value?.data?.uuid))
  } else if (data.type === 'link' && data.callbackType === 'Add') {
    service.post(IPPORT()+'/uapi/v1/Map/ElementLink', { mapId: mapID.value, resName: dragtype.value?.label, mapLinkId: dragtype.value?.data?.mapId, longitude: data.center[0], latitude: data.center[1], fillColor: 'USC_MAP_CAM_COLOR_BLUE' }).then(() => loadMapChannel('link', String(dragtype.value?.data?.mapId)))
  }
}

// ─── EventCB1: update/delete existing element ────────────────────────────────
function EventCB1(data: any) {
  callbackData.value = data
  const proj = mapInstance.value?.getView().getProjection()
  if (proj?.getCode() === 'EPSG:3857') data.center = toLonLat(data.center)
  if (data.type === 'camera') {
    const url = IPPORT()+'/uapi/v1/Map/Cam/Channel'
    if (data.callbackType === 'Update') {
      service.put(url, { id: data.id, channelUUID: data.cameraToken, longitude: data.center[0], latitude: data.center[1], radius: data.radius, angle: data.angle, rotationAngle: data.rotationAngle, fillColor: data.cameraType })
    } else if (data.callbackType === 'Delete') {
      ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('CommTableEdit.comm_prompt'), { confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel') }).then(() => {
        DrawMap.value?.removeLayer(data.cameraToken)
        service.delete(url, { data: { ids: [Number(data.id)] } })
      }).catch(() => {})
    }
  } else if (data.type === 'view') {
    const url = IPPORT()+'/uapi/v1/Map/View'
    if (data.callbackType === 'Update') service.put(url, { id: data.id, viewUUID: data.cameraToken, longitude: data.center[0], latitude: data.center[1], fillColor: data.cameraType })
    else if (data.callbackType === 'Delete') ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('CommTableEdit.comm_prompt'), { confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel') }).then(() => { DrawMap.value?.removeLayer(data.cameraToken); service.delete(url, { data: { ids: [Number(data.id)] } }) }).catch(() => {})
  } else if (data.type === 'link') {
    const url = IPPORT()+'/uapi/v1/Map/ElementLink'
    if (data.callbackType === 'Update') service.put(url, { id: data.cameraToken, resName: data.cameraName, mapLinkId: data.id, longitude: data.center[0], latitude: data.center[1], fillColor: data.cameraType })
    else if (data.callbackType === 'Delete') ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('CommTableEdit.comm_prompt'), { confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel') }).then(() => { DrawMap.value?.removeLayer(data.cameraToken); service.delete(url, { data: { ids: [Number(data.cameraToken)] } }) }).catch(() => {})
  }
}

// ─── Dialog state ─────────────────────────────────────────────────────────────
const dialogFormVisible = ref(false)
const editDialogVisible = ref(false)
const imgBase64   = ref('')
const fileList    = ref<any[]>([])
const uploadRef       = ref()
const editUploadRef   = ref()
const addPartitionTreeRef  = ref()
const editPartitionTreeRef = ref()
const filterText1 = ref('')
const filterText2 = ref('')
const addDefaultChecked  = ref<number[]>([10000])
const editDefaultChecked = ref<number[]>([])

const mapTypes = [
  { label:'USC_MAP_STATIC', value:'USC_MAP_STATIC' },
  { label:'USC_MAP_GOOGLE', value:'USC_MAP_GOOGLE' },
  { label:'USC_MAP_GAO_DE', value:'USC_MAP_GAO_DE' },
  { label:'USC_MAP_TIAN',   value:'USC_MAP_TIAN'   },
  { label:'USC_MAP_TILE',   value:'USC_MAP_TILE'   },
]
const mapProjections = [
  { label:'EPSG:4326', value:'EPSG:4326' },
  { label:'EPSG:3857', value:'EPSG:3857' },
  { label:'EPSG:4490', value:'EPSG:4490' },
  { label:'EPSG:4214', value:'EPSG:4214' },
  { label:'EPSG:4610', value:'EPSG:4610' },
]

const defaultForm = () => ({
  mapType:'USC_MAP_STATIC', mapProjection:'EPSG:4326',
  devPartitionId: 10000, devPartitionName: '',
  XCoordinate: 121.0, YCoordinate: 31.0,
  zoom: 14, minZoom: 7, maxZoom: 18,
  mapName: 'Map1', description: 'Map1 Description',
  imgBase64: '', mapurl: '', mapUrl2: '',
  onlineTile: false, centerCord: false,
  tileX: '13730', tileY: '6710', systemDefaultMap: false,
})
const form     = reactive(defaultForm())
const editForm = reactive({ ...defaultForm(), mapId: 0 as any })

function mapTypeChange() {
  switch (form.mapType) {
    case 'USC_MAP_GOOGLE':  form.mapurl = urlTest.Google;          form.mapProjection = 'EPSG:3857'; break
    case 'USC_MAP_GAO_DE':  form.mapurl = urlTest.GaoDe;           form.mapProjection = 'EPSG:3857'; break
    case 'USC_MAP_TIAN':    form.mapurl = urlTest.TianDiTu[0]; form.mapUrl2 = urlTest.TianDiTu[1]; form.mapProjection = 'EPSG:4326'; break
    case 'USC_MAP_TILE':    form.mapurl = form.onlineTile ? urlTest.onlineTile[0] : urlTest.onlineTile[1]; form.mapProjection = 'EPSG:4326'; break
    default: form.mapurl = ''; form.mapUrl2 = ''
  }
}

watch(filterText1, v => addPartitionTreeRef.value?.filter(v))
watch(filterText2, v => editPartitionTreeRef.value?.filter(v))
function filterPartitionNode(v: string, d: PartitionNode) { if (!v) return true; return d.devPartitionName.toLowerCase().includes(v.toLowerCase()) }
function filterPartitionNode2(v: string, d: PartitionNode) { return filterPartitionNode(v, d) }

function handleAddPartitionCheck(node: PartitionNode, state: any) {
  if (state.checkedKeys.length === 2) {
    addPartitionTreeRef.value?.setCheckedKeys([node.devPartitionId])
    form.devPartitionName = node.devPartitionName; form.devPartitionId = node.devPartitionId
    addDefaultChecked.value = [node.devPartitionId]
  }
}
function handleEditPartitionCheck(node: PartitionNode, state: any) {
  if (state.checkedKeys.length === 2) {
    editPartitionTreeRef.value?.setCheckedKeys([node.devPartitionId])
    editForm.devPartitionName = node.devPartitionName; editForm.devPartitionId = node.devPartitionId
    editDefaultChecked.value = [node.devPartitionId]
  }
}

// ─── File upload ─────────────────────────────────────────────────────────────
function handleFileChange(file: any, list: any[]) {
  fileList.value = list.slice(-1)
  if (!fileList.value.length) { imgBase64.value = ''; return }
  const f = fileList.value[0]
  if (!['image/jpeg','image/png'].includes(f.raw.type)) { ElMessage.error(t('Setting.set_only_jpg_png')); fileList.value = []; return }
  if (f.raw.size / 1024 / 1024 > 10) { ElMessage.error(t('Setting.set_maximum_image_size')); fileList.value = []; return }
  const reader = new FileReader()
  reader.onload = (e: any) => {
    const img = new Image()
    img.src = e.target.result
    img.onload = () => {
      if (img.width < 500 || img.height < 500) { ElMessage.error(t('Setting.set_minimum_pixels')); fileList.value = []; imgBase64.value = ''; return }
      imgBase64.value = e.target.result
      if (dialogFormVisible.value) form.imgBase64 = e.target.result
      else editForm.imgBase64 = e.target.result
    }
  }
  reader.readAsDataURL(f.raw)
}
function handleRemove() { imgBase64.value = ''; if (dialogFormVisible.value) form.imgBase64 = ''; else editForm.imgBase64 = '' }
function beforeUpload(file: File) {
  if (!['image/jpeg','image/png'].includes(file.type)) { ElMessage.error(t('Setting.set_only_jpg_png')); return false }
  if (file.size / 1024 / 1024 > 10) { ElMessage.error(t('Setting.set_maximum_image_size')); return false }
  return true
}

// ─── Add dialog ───────────────────────────────────────────────────────────────
function openAddMap() {
  Object.assign(form, defaultForm())
  if (partitionTree.value.length) { form.devPartitionName = partitionTree.value[0].devPartitionName; form.devPartitionId = partitionTree.value[0].devPartitionId }
  addDefaultChecked.value = [form.devPartitionId]; imgBase64.value = ''; fileList.value = []
  dialogFormVisible.value = true
}

async function createMap() {
  let url = '', requestData: any
  const p = partitionTree.value
  if (form.mapType === 'USC_MAP_STATIC') {
    if (!form.mapName || !form.imgBase64) return
    url = IPPORT() + '/uapi/v1/Map/Static'
    requestData = { type:'USC_MAP_STATIC', devPartitionId: form.devPartitionId, zoom: +form.zoom, minZoom: +form.minZoom, maxZoom: +form.maxZoom, mapName: form.mapName, description: form.description, imgBase64: form.imgBase64, projection: form.mapProjection, systemDefaultMap: form.systemDefaultMap }
  } else if (form.mapType === 'USC_MAP_TILE') {
    url = IPPORT() + '/uapi/v1/Map/Tile'
    requestData = { type:'USC_MAP_TILE', devPartitionId: form.devPartitionId, center: [+form.XCoordinate, +form.YCoordinate], zoom: +form.zoom, minZoom: +form.minZoom, maxZoom: +form.maxZoom, mapName: form.mapName, description: form.description, mapUrl: form.mapurl, projection: form.mapProjection, onlineTile: form.onlineTile, systemDefaultMap: form.systemDefaultMap }
    if (form.centerCord) { requestData.centerCord = true; requestData.tileX = +form.tileX; requestData.tileY = +form.tileY }
  } else {
    url = IPPORT() + '/uapi/v1/Map/GIS'
    requestData = { type: form.mapType, devPartitionId: form.devPartitionId, center: [+form.XCoordinate, +form.YCoordinate], zoom: +form.zoom, minZoom: +form.minZoom, maxZoom: +form.maxZoom, mapName: form.mapName, description: form.description, mapUrl: form.mapurl, projection: form.mapProjection, systemDefaultMap: form.systemDefaultMap }
    if (form.mapType === 'USC_MAP_TIAN') requestData.mapUrl2 = form.mapUrl2
  }
  try {
    const res: any = await service.post(url, requestData)
    if (res?.data?.msg === 'Success') {
      ElMessage({ type:'success', message: t('CommTableEdit.comm_add_successfully') })
      dialogFormVisible.value = false; await loadTree()
    } else { ElMessage({ type:'error', message: t('CommTableEdit.comm_add_failed') }) }
  } catch { ElMessage({ type:'error', message: t('CommTableEdit.comm_add_failed') }) }
}

// ─── Edit dialog ──────────────────────────────────────────────────────────────
function openEditMap() {
  if (!OperateData.value?.mapId) return
  const d = OperateData.value
  Object.assign(editForm, { mapId: d.mapId, mapName: d.mapName, devPartitionId: d.devPartitionId, devPartitionName: '', zoom: d.zoom, minZoom: d.minZoom, maxZoom: d.maxZoom, mapType: d.type, mapProjection: d.projection, onlineTile: d.onlineTile||false, mapurl: d.mapUrl||'', mapUrl2: d.mapUrl2||'', XCoordinate: d.center?.[0]||121, YCoordinate: d.center?.[1]||31, centerCord: d.centerCord||false, tileX: d.tileX||'', tileY: d.tileY||'', systemDefaultMap: d.systemDefaultMap||false })
  editDefaultChecked.value = [d.devPartitionId]; imgBase64.value = ''; fileList.value = []; editDialogVisible.value = true
}

async function submitEdit() {
  const d = editForm
  const url = d.mapType === 'USC_MAP_STATIC' ? IPPORT()+'/uapi/v1/Map/Static' : IPPORT()+'/uapi/v1/Map'
  const body: any = { mapId: +d.mapId, devPartitionId: +d.devPartitionId, mapName: d.mapName, zoom: +d.zoom, minZoom: +d.minZoom, maxZoom: +d.maxZoom, projection: d.mapProjection, systemDefaultMap: d.systemDefaultMap }
  if (d.mapType === 'USC_MAP_STATIC') { if (d.imgBase64) body.imgBase64 = d.imgBase64 }
  else { body.mapUrl = d.mapurl; body.center = [+d.XCoordinate, +d.YCoordinate] }
  if (d.mapType === 'USC_MAP_TIAN') body.mapUrl2 = d.mapUrl2
  if (d.mapType === 'USC_MAP_TILE') { body.onlineTile = d.onlineTile; if (d.centerCord) { body.centerCord = true; body.tileX = +d.tileX; body.tileY = +d.tileY } }
  try {
    const res: any = await service.put(url, body)
    if (res?.data?.msg === 'Success') {
      ElMessage({ type:'success', message: t('CommTableEdit.comm_edit_successfully') })
      editDialogVisible.value = false; OperateData.value = res.data.result; await loadTree()
    } else { ElMessage({ type:'error', message: t('CommTableEdit.comm_edit_failed') }) }
  } catch { ElMessage({ type:'error', message: t('CommTableEdit.comm_edit_failed') }) }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
async function deleteCurrentMap() {
  if (!OperateData.value?.mapId) return
  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('CommTableEdit.comm_prompt'), { confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel') })
    const res: any = await service.delete(IPPORT()+'/uapi/v1/Map', { data: { ids: [+OperateData.value.mapId] }, headers: {'Content-Type':'application/json'} })
    if (res?.data?.msg === 'Success') {
      ElMessage({ type:'success', message: t('CommTableEdit.comm_delete_successfully') })
      clearMap(); OperateData.value = {}; await loadTree()
    } else { ElMessage({ type:'error', message: t('CommTableEdit.comm_delete_failed') }) }
  } catch {}
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(() => {
  loadTree()
  document.addEventListener('contextmenu', (e) => e.preventDefault())
})
onBeforeUnmount(() => {
  document.removeEventListener('contextmenu', (e) => e.preventDefault())
})
</script>

<style scoped lang="scss">
.liveview {
  display: flex;
  width: 100%;
  height: 100%;

  .liveview_left {
    width: 16%;
    min-width: 240px;
    max-width: 300px;
    height: calc(100vh - 30px);
    background-color: #181818;
    overflow-y: auto;
    padding: 0 8px;

    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-thumb { border-radius: 3px; background: rgba(218,218,218,0.2); }

    :deep(.el-tree) {
      background: transparent; color: #fff;
      .el-tree-node__content:hover { background-color: rgba(3,153,254,0.08); }
      .el-tree-node.is-current > .el-tree-node__content { color: #0399FE; background-color: rgba(3,153,254,0.2); border-right: 2px solid #0399FE; }
    }
  }

  .liveview_right {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: calc(100vh - 30px);
    background-color: #181818;
    overflow: hidden;
    position: relative;   /* MapSetting 绝对定位的锚点 */
  }
}

.devices_topBtn_special {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
  .button_edi { display: flex; gap: 8px; align-items: center; }
  .sdk_setting { display: flex; gap: 8px; }
  .editmap, .clearmap { height: 29px; padding: 0 12px; border-radius: 4px; }
  .editmap { background: #0399FE; border: none; color: #fff; }
  .clearmap { background: #252525; border: 1px solid #0399FE; color: #fff; }
}

.MapSetting {
  position: absolute;
  top: 7%;
  right: 2%;
  z-index: 1;
  width: 200px;
  height: 180px;
  border-radius: 4px;
  padding-top: 10px;
  background: #383838;
  box-shadow: 0 2px 20px 0 rgba(0,0,0,0.4);
  color: #fff;

  .SettingColor {
    display: flex;
    align-items: center;
    margin: 0 20px 0 10px;
    justify-content: space-between;
    .DefaultColor { width: 24px; height: 24px; border-radius: 4px; border: 1px solid #fff; cursor: pointer; }
  }

  .CameraData {
    display: flex;
    align-items: center;
    margin: 10px;
    margin-right: 20px;
    justify-content: space-between;
    div {
      white-space: nowrap;
    }
    .el-input {
      width: 105px;
      height: 32px;
      flex-shrink: 0;
      :deep(.el-input__wrapper) {
        width: 100%;
        height: 32px;
        background: #444 !important;
        border: 1px solid #979797 !important;
        box-shadow: none !important;
        padding: 0 15px;
        box-sizing: border-box;
        border-radius: 4px;
      }
      :deep(.el-input__inner) {
        color: #fff !important;
        height: 30px;
        line-height: 30px;
        padding: 0;
      }
    }
    .ZoomValue, .CameraInput {
      width: 105px;
      height: 32px;
      flex-shrink: 0;
      border-radius: 4px;
      line-height: 32px;
      padding: 0 15px;
      box-sizing: border-box;
    }
    .ZoomValue {
      background: #555;
    }
    .CameraInput {
      background: #444;
      border: 1px solid #979797;
      color: #fff;
      outline: none;
      font-size: 12px;
    }
  }
}

.map {
  flex: 1;
  width: 100%;
}

.liveview_titleicon1 { font-size: 14px; }

.image-preview { max-width: 200px; max-height: 120px; object-fit: contain; }

.upload-content {
  display: flex; flex-direction: column; align-items: center; padding: 16px;
  .el-upload__text { margin: 8px 0 4px; font-size: 13px; }
  .el-upload__tip { font-size: 11px; color: #888; text-align: center; line-height: 1.5; }
}

.avatar-uploader {
  :deep(.el-upload-dragger) {
    background-color: transparent !important;
    border-color: #4a4a4a !important;
    color: #fff;
  }
  :deep(.el-upload__text), :deep(.el-upload__tip) {
    color: #ccc;
  }
}
</style>

<style lang="scss">
/* 把放大缩小按钮移到右下角（对照uscweb） */
.ol-zoom {
  bottom: 10px !important;
  right: 10px !important;
  top: auto !important;
  left: auto !important;
}

/* 刻度尺样式（对照uscweb style.scss） */
.custom-scale-line-container {
  .custom-scale-line {
    background: #DCE3E9;
    border-radius: 2px;
    bottom: 8px;
    left: 8px;
    padding: 2px;
    position: absolute;
    opacity: 0.7;
    width: 88px;
    height: 23px;

    .scale-value {
      color: #000;
      font-size: 10px;
      text-align: center;
      will-change: contents, width;
      transition: all 0.25s;
    }

    .h-letter {
      position: relative;
      height: 6px;
    }

    .vertical {
      position: absolute;
      width: 1px;
      height: 6px;
      background: #000;
    }

    .vertical-left { left: 0; }
    .vertical-right { right: 0; }

    .horizontal {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: #000;
    }
  }
}
</style>




