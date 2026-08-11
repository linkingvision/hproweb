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
              <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
                <span
                  draggable="true"
                  @dragstart.stop="handleDragStart($event, data)"
                  @dragend.stop="handleDragEnd"
                  style="display:flex;align-items:center;"
                  :style="data.isDeviceChannel ? 'cursor:grab;' : ''"
                >
                  <i
                    :class="[getNodeIcon(data),
                      (data.isView && currentView?.viewId === data.viewData?.viewId) ||
                      (data.isMap  && Object.values(cellAssignments).some(a => a.entityType === 'USC_VIEW_MAP' && a.uuid === String(data.data?.mapId)))
                        ? 'el-tree-camera-play' : '']"
                    style="font-size:14px;margin-right:4px;"
                  ></i>
                  <span
                    :class="(data.isView && currentView?.viewId === data.viewData?.viewId) ||
                      (data.isMap  && Object.values(cellAssignments).some(a => a.entityType === 'USC_VIEW_MAP' && a.uuid === String(data.data?.mapId)))
                        ? 'el-tree-camera-play' : ''"
                  >{{ data.label }}</span>
                </span>
                <!-- 视图正在显示指示器（对照 uscweb view_iconclass3） -->
                <span v-if="data.isView && currentView?.viewId === data.viewData?.viewId" class="nowplay">
                  <span class="dot">●</span>
                  <span class="nowplayText">{{ t('Liveview.live_displaying') }}</span>
                </span>
              </div>
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
                  <p>4-4</p>
                  <div class="PanelBtns">
                    <el-button class="iconfont icon-a-4gongge" @click="applyPresetLayout(4)" />
                    <!-- 4Alt：1大+3小竖排，对照 uscweb icon-sigongge -->
                    <el-button class="iconfont icon-sigongge" @click="applyPresetLayout('4Alt')" />
                  </div>
                </div>
                <div>
                  <p>1-1-3</p>
                  <div class="PanelBtns">
                    <!-- 全屏按钮，对照 uscweb panelFullScreen -->
                    <el-button class="iconfont icon-quanping1" @click="panelFullScreen" />
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

      <!-- 布局预览区：对照uscweb，点击视图节点后才显示（LiveplayShow 控制） -->
      <div v-if="LiveplayShow" class="layout-preview-area" id="layoutPreviewPanel">
        <div
          v-for="cell in previewGrid"
          :key="cell.id"
          :id="'h' + cell.id"
          class="palace videoColor"
          :class="{ 'cell-selected': selectedCellId === cell.id }"
          :style="computeCellStyle(cell)"
          @click="selectedCellId = cell.id"
          @drop.stop.prevent="dropOnCell($event, cell.id)"
          @dragover.stop.prevent
          @dragenter.stop.prevent
        >
          <!-- 码率信息浮层 -->
          <div v-if="infoShow && infoToken === getCellCamera(cell.id)?.token" class="malv" @click.stop>
            <div class="malv-close" @click="closeInfo">×</div>
            <div class="malv-left">
              <div class="information_title">{{ t('Liveview.live_video') }}</div>
              <div class="information_content" v-for="(a,i) in infoVideo" :key="i">
                <div class="information_content_left">{{ a.name }}</div>
                <div class="information_content_right">{{ a.data }}</div>
              </div>
            </div>
            <div class="malv-right">
              <div class="information_title">{{ t('CommDev.comm_dev_audio') }}</div>
              <div class="information_content" v-for="(a,i) in infoAudio" :key="i">
                <div class="information_content_left">{{ a.name }}</div>
                <div class="information_content_right">{{ a.data }}</div>
              </div>
            </div>
          </div>

          <!-- 悬浮按钮层 -->
          <div v-if="getCellCamera(cell.id)" class="float-layer" @click.stop>
            <!-- 1. 音量 -->
            <i class="iconfont"
               :class="(cellAudioSliders[cell.id] ?? 0) === 0 ? 'icon-wusheng' : 'icon-shengyinkai'"
               style="font-size:24px;" title="Volume"
               @click.stop="toggleCellAudio(cell.id)"></i>
            <!-- 2. 码率信息 -->
            <i class="iconfont icon-yibiao" title="Stream Info"
               @click.stop="showCellInfo(cell.id)"></i>
            <!-- 3. 对讲 -->
            <i class="iconfont"
               :class="audioingCellId === cell.id ? 'icon-yuyinkai audio-active' : 'icon-yuyinguan'"
               title="Intercom"
               @click.stop="doShoutwheat(cell.id)"></i>
            <!-- 4. 截图 -->
            <i class="iconfont icon-zhuapai" title="Screenshot"
               @click.stop="doSnapshot(cell.id)"></i>
            <!-- 5. 手动录像 -->
            <i class="iconfont"
               :class="getCellCamera(cell.id)?.recording ? 'icon-fuwuluxiangzhong rec-active' : 'icon-fuwuluxiang'"
               title="Record"
               @click.stop="doManualRec(cell.id)"></i>
            <!-- 6. PTZ（格数 ≤ 9 显示） -->
            <i v-if="previewGrid.length <= 9"
               class="iconfont icon-yuntai"
               :title="t('Liveview.live_ptz')"
               @click.stop="showPtz(cell.id)"></i>
            <!-- 7. 3D 框选放大 -->
            <i class="iconfont icon-fangda6"
               :class="{ 'expend-active': cell3DZoomId === cell.id }"
               :title="t('Liveview.live_expendarea')"
               @click.stop="toggle3DZoom(cell.id)"></i>
            <!-- 8. 电子放大 -->
            <i class="iconfont"
               :class="cellEZoomId === cell.id ? 'icon-suoxiao' : 'icon-fangda1'"
               title="E-Zoom"
               @click.stop="toggleEZoom(cell.id)"></i>
            <!-- 9. 单格全屏 -->
            <i class="iconfont"
               :class="cellFullscreenId === cell.id ? 'icon-suoxiao' : 'icon-fangda'"
               title="Fullscreen"
               @click.stop="toggleCellFullscreen(cell.id)"></i>
            <!-- 10. 关闭 -->
            <i class="iconfont icon-guanbi" title="Close"
               @click.stop="clearCell(cell.id)"></i>
          </div>

          <!-- 音量滑块面板 -->
          <div v-if="cellAudioVisible === cell.id" class="cell-audio-slider" @click.stop>
            <i class="iconfont"
               :class="(cellAudioSliders[cell.id] ?? 0) === 0 ? 'icon-shengyinguan' : 'icon-shengyinkai'"
               :style="{ color: (cellAudioSliders[cell.id] ?? 0) === 0 ? 'grey' : '#409EFF' }"></i>
            <el-slider :step="0.1" :show-tooltip="false" :max="1"
                       :model-value="cellAudioSliders[cell.id] ?? 0"
                       @update:model-value="(v: number) => setCellVolume(cell.id, v)"
                       style="flex:1;margin-left:10px;" />
          </div>

          <!-- 电子放大主画布 -->
          <canvas :id="'ezoom-h'+cell.id" class="cell-ezoom-canvas" :class="{ active: cellEZoomId === cell.id }"></canvas>
          <canvas :id="'ezoom-mini-h'+cell.id" class="cell-ezoom-mini-canvas" :class="{ active: cellEZoomId === cell.id }"></canvas>
          <canvas :id="'ezoom-sel-h'+cell.id" class="cell-ezoom-sel-canvas" :class="{ active: cellEZoomId === cell.id }"></canvas>

          <!-- 3D 框选画布 -->
          <canvas :id="'3dzoom-h'+cell.id" class="cell-3dzoom-canvas"
                  :class="{ active: cell3DZoomId === cell.id }"
                  @mousedown.stop="on3DMouseDown(cell.id, $event)"
                  @mousemove.stop="on3DMouseMove(cell.id, $event)"
                  @mouseup.stop="on3DMouseUp(cell.id, $event)"
                  @mouseleave.stop="on3DMouseLeave(cell.id)"></canvas>

          <!-- PTZ 云台面板 -->
          <div v-if="ptzShow && ptzToken === getCellCamera(cell.id)?.token" class="yuntai" @click.stop>
            <div class="flex_content">
              <div class="content_zoom">
                <div class="key_zoom">
                  <div class="key_flex">
                    <div class="key_but" @mousedown="ptzAction('upleft')"    @mouseup="ptzAction('stop')"><div style="width:50%;height:50%;margin-top:8%;margin-left:20%;border-radius:2px;"><i class="iconfont icon-zuoshang"></i></div></div>
                    <div class="key_but" @mousedown="ptzAction('up')"        @mouseup="ptzAction('stop')"><div style="width:50%;height:50%;margin-top:10%;margin-left:30%;"><i class="iconfont icon-shang"></i></div></div>
                    <div class="key_but" @mousedown="ptzAction('upright')"   @mouseup="ptzAction('stop')"><div style="width:50%;height:50%;margin-top:8%;margin-left:30%;border-radius:2px;"><i class="iconfont icon-youshang"></i></div></div>
                    <div class="key_but" @mousedown="ptzAction('left')"      @mouseup="ptzAction('stop')"><div style="width:50%;height:50%;margin-top:10%;margin-left:20%;"><i class="iconfont icon-zuo"></i></div></div>
                    <div class="key_but"></div>
                    <div class="key_but" @mousedown="ptzAction('right')"     @mouseup="ptzAction('stop')"><div style="width:50%;height:50%;margin-top:10%;margin-left:30%;"><i class="iconfont icon-you"></i></div></div>
                    <div class="key_but" @mousedown="ptzAction('downleft')"  @mouseup="ptzAction('stop')"><div style="width:50%;height:50%;margin-top:15%;margin-left:20%;border-radius:2px;"><i class="iconfont icon-zuoxia"></i></div></div>
                    <div class="key_but" @mousedown="ptzAction('down')"      @mouseup="ptzAction('stop')"><div style="width:50%;height:50%;margin-top:18%;margin-left:30%;"><i class="iconfont icon-xia"></i></div></div>
                    <div class="key_but" @mousedown="ptzAction('downright')" @mouseup="ptzAction('stop')"><div style="width:50%;height:50%;margin-top:15%;margin-left:30%;border-radius:2px;"><i class="iconfont icon-youxia"></i></div></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="ptz_bottom">
              <span>{{ t('Liveview.live_ptz_speed') }}</span>
              <el-slider v-model="ptzSpeed" :min="0.1" :max="1" :step="0.1" :show-tooltip="false" style="width:80px;margin:0 8px;" />
              <el-button size="small" @click="closePtz">{{ t('CommTableEdit.comm_cancel') }}</el-button>
            </div>
          </div>

          <!-- 摄像头名称标签（左上角） -->
          <div v-if="cellAssignments[cell.id]" class="cell-label-overlay">
            {{ cellAssignments[cell.id].name }}
          </div>
        </div>
      </div>
      <!-- 未选中视图时显示提示（对照 uscweb 初始黑屏区域） -->
      <div v-else class="layout-empty">
        {{ t('Liveview.live_view') }}
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
import { ref, reactive, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  GetViewListApi,
  GetViewApi,
  CreateViewApi,
  UpdateViewApi,
  DeleteViewApi,
  GetLayoutListApi,
  CreateLayoutApi,
  DeleteLayoutApi,
} from '@/api/view'
import { GetDevPartitionApi } from '@/api/configuration/device'
import { GetDeviceChannels, GetInformationDataApi, GetPresetsApi, PresetJumpApi, SetPresetApi, PtzApi, setRecEnableApi } from '@/api/channel'
import { UPlayerSDK as UPlayerSDKClass } from '@/assets/js/uplayersdk.esm.js'
import { H5sPlayerAudBack } from '@/assets/js/h5splayer.js'
import { useUserStore } from '@/store/user'
import { useStore } from '@/store'
import uuid from '@/assets/js/uuid.js'
import http from '@/api/http'
import 'ol/ol.css'
import { Map as OLMap, View as OLView } from 'ol'
import ImageLayer from 'ol/layer/Image'
import ImageStatic from 'ol/source/ImageStatic'
import TileLayer from 'ol/layer/Tile'
import { WMTS, XYZ } from 'ol/source'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import { fromLonLat, get } from 'ol/proj'
import { getWidth, getTopLeft } from 'ol/extent'
// @ts-ignore
import H5smap from '@/assets/js/h5mapjs.js'

const { t } = useI18n()
const userStore = useUserStore()
const store     = useStore()

// cellId → UPlayerSDKClass 实例
const playerMap = new Map<string, any>()
// cellId → OL Map 实例（地图格子）
const cellMapInstances = new Map<string, any>()

// ─── Float-layer state ────────────────────
const audioingCellId   = ref('')
let   audioback: any   = null
const infoShow         = ref(false)
const infoToken        = ref('')
const infoVideo        = ref<any[]>([])
const infoAudio        = ref<any[]>([])
let   timerRunInfo: any = null
const ptzShow          = ref(false)
const ptzToken         = ref('')
const ptzSpeed         = ref(0.5)
const presetList       = ref<any[]>([])
const cellAudioSliders = reactive<Record<string, number>>({})
const cellAudioVisible = ref('')
const cell3DZoomId     = ref('')
interface ZoomRect { drawing: boolean; x0: number; y0: number; x1: number; y1: number }
const cell3DZoomState  = reactive<Record<string, ZoomRect>>({})
const cellEZoomId      = ref('')
const cellEZoomTimers  = new Map<string, { interval: ReturnType<typeof setInterval>; cleanup: () => void }>()
const cellFullscreenId = ref('')

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
  id: string; label: string; type: 'partition' | 'device' | 'channel' | 'view' | 'map'
  isLeaf?: boolean; isDeviceChannel?: boolean
  online?: boolean; totalCount?: number; onlineCount?: number
  data?: any; isView?: boolean; viewData?: ViewRow; isMap?: boolean
  children?: TreeNode[]
}

// ─── Device partition tree（含设备+通道+视图+地图）────────────────────────────

const partitionTree    = ref<PartitionNode[]>([])
const treeWithViews    = ref<TreeNode[]>([])
const treeRef          = ref()
const filterText       = ref('')
const defaultExpandIds = ref<string[]>([])
const collapseActive   = ref<string[]>(['1'])
const deviceCache      = new Map<string, TreeNode[]>()

const treeProps          = { label: 'label', children: 'children' }
const partitionTreeProps = { label: 'devPartitionName', children: 'children' }

function filterNode(value: string, data: TreeNode) {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
}
watch(filterText, val => treeRef.value?.filter(val))

// buildTree：同时注入视图节点和地图节点（对照 Map.vue buildTree）
function buildTree(
  parts: any[],
  viewsByPartition: Record<number, ViewRow[]> = {},
  mapsByPartition:  Record<number, any[]>     = {},
): TreeNode[] {
  return parts.map(p => {
    const children: TreeNode[] = []
    if (p.children?.length) children.push(...buildTree(p.children, viewsByPartition, mapsByPartition))
    p.dev?.forEach((d: any) => children.push({
      id: `dev_${d.devId}`, label: d.name, type: 'device',
      online: d.online, data: d, children: [], isLeaf: false,
    }))
    // 视图节点（API 嵌入 + allViews 补充，去重）
    const seenViewIds = new Set<number>()
    p.view?.forEach((v: any) => {
      seenViewIds.add(v.viewId)
      children.push({ id: `view_${v.viewId}`, label: v.viewName, type: 'view', isLeaf: true, isView: true, viewData: v, data: v })
    })
    viewsByPartition[p.devPartitionId]?.forEach((v: any) => {
      if (!seenViewIds.has(v.viewId))
        children.push({ id: `view_${v.viewId}`, label: v.viewName, type: 'view', isLeaf: true, isView: true, viewData: v, data: v })
    })
    // 地图节点（API 嵌入 + mapsByPartition 补充，去重）
    const seenMapIds = new Set<number>()
    p.map?.forEach((m: any) => {
      seenMapIds.add(m.mapId)
      children.push({ id: `map_${m.mapId}`, label: m.mapName, type: 'map', isLeaf: true, isMap: true, data: m })
    })
    mapsByPartition[p.devPartitionId]?.forEach((m: any) => {
      if (!seenMapIds.has(m.mapId))
        children.push({ id: `map_${m.mapId}`, label: m.mapName, type: 'map', isLeaf: true, isMap: true, data: m })
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

  // 加载地图数据（对照 Map.vue loadTree 的 mapsByPartition）
  const mapsByPartition: Record<number, any[]> = {}
  try {
    const mapRes: any = await http.get('/uapi/v1/DevPartition/List?pageSize=100000&type=USC_MAP')
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
    collectMaps(mapRes?.data?.result ?? [])
  } catch (e) {
    console.warn('[View] loadMaps error', e)
  }

  // 加载分区树+设备通道
  try {
    const res: any = await GetDevPartitionApi()
    if (res?.status !== 200 || !res?.data?.result?.length) return
    const root = res.data.result[0]

    partitionTree.value = res.data.result

    // 按 devPartitionId 将 allViews 分组
    const viewsByPartition: Record<number, ViewRow[]> = {}
    allViews.forEach(v => {
      const pid = v.devPartitionId ?? 10000
      if (!viewsByPartition[pid]) viewsByPartition[pid] = []
      viewsByPartition[pid].push(v)
    })

    const rootChildren: TreeNode[] = []
    if (root.children?.length) rootChildren.push(...buildTree(root.children, viewsByPartition, mapsByPartition))
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
    // 地图节点（API 嵌入 + mapsByPartition 补充）
    const seenRootMaps = new Set<number>()
    root.map?.forEach((m: any) => {
      seenRootMaps.add(m.mapId)
      rootChildren.push({ id: `map_${m.mapId}`, label: m.mapName, type: 'map', isLeaf: true, isMap: true, data: m })
    })
    mapsByPartition[root.devPartitionId]?.forEach((m: any) => {
      if (!seenRootMaps.has(m.mapId))
        rootChildren.push({ id: `map_${m.mapId}`, label: m.mapName, type: 'map', isLeaf: true, isMap: true, data: m })
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
  if (data.type === 'map')       return 'iconfont icon-ditu'
  if (data.isDeviceChannel)      return 'iconfont icon-shexiangjizaixian'
  if (data.type === 'device')    return 'iconfont icon-Device'
  return 'iconfont icon-gen'
}

// 对照 uscweb srcview：服务端用 1-10 存预设布局，映射到 PRESET_LAYOUTS key
const LAYOUT_ID_MAP: Record<number, number | string> = {
  1: 1, 2: 3, 3: 13, 4: 16, 5: 25,
  6: 7, 7: 4, 8: '4Alt', 9: 6, 10: 9,
}

// ─── Selected view & layout preview ──────────────────────────────────────────

const currentView     = ref<ViewRow | null>(null)
const LiveplayShow    = ref(false)   // 对照 uscweb：点击视图节点后才显示格子区域
const previewGrid     = ref<LayoutCell[]>([])
const layoutType      = ref('3|3')
const selectedCellId  = ref<string>('')
// cellId → { name, token, uuid, profile }
const cellAssignments = ref<Record<string, { name: string; token?: string; uuid?: string; profile: string; entityType: string }>>({})

// ─── Drag-and-drop ────────────────────────────────────────────────────────────

function handleDragStart(ev: DragEvent, data: TreeNode) {
  if (!data.isDeviceChannel) return
  // 与 Monitoring/View.vue 保持一致，用 window._viewDrag 传递拖拽对象
  ;(window as any)._viewDrag = { channel: data.data, nodeId: data.id }
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'move'
    ev.dataTransfer.setData('text/plain', data.id)
  }
}

function handleDragEnd() {
  // 若拖拽未落在格子上则清除
  ;(window as any)._viewDrag = null
}

async function dropOnCell(ev: DragEvent, cellId: string) {
  const drag = (window as any)._viewDrag
  ;(window as any)._viewDrag = null
  if (!drag?.channel) return
  await placeCamera(cellId, drag.channel)
}

// ─── Player management（对照 Monitoring/View.vue）────────────────────────────

// cellId → { token, name, resourceUUID, videoid, recording } —— float-layer 函数需要
const cameraMap = ref(new Map<string, { token: string; name: string; resourceUUID: string; videoid: string; recording: boolean }>())

const getCellCamera = (cellId: string) => cameraMap.value.get(cellId)

async function placeCamera(cellId: string, ch: any) {
  // 销毁该格子旧播放器（若有）
  if (playerMap.has(cellId)) {
    try { playerMap.get(cellId)?.destroy?.() } catch (e) {}
    playerMap.delete(cellId)
  }
  stopCellExtra(cellId)

  const vidId       = uuid(8)
  const apiProtocol = userStore.IPPORT?.startsWith('https') ? 'https:' : window.location.protocol
  const conf = {
    videoid:      vidId,
    protocol:     apiProtocol,
    host:         userStore.WSROOT,
    token:        ch.token,
    session:      userStore.session,
    accessToken:  userStore.Access_token,
    name:         ch.name ?? ch.label ?? '',
    label:        ch.name ?? ch.label ?? '',
    resourceUUID: ch.uuid ?? ch.resourceUUID ?? '',
    liveVideoType: store.liveviewrtc,
    recording:    ch.recording ?? false,
    meta:         false,
    serverpb:     store.DefaultStorage === 'CentralStorage' ? 'true' : 'false',
  }

  // 同步更新 cameraMap（供 float-layer 函数使用）
  cameraMap.value.set(cellId, {
    token: ch.token, name: conf.name, resourceUUID: conf.resourceUUID,
    videoid: vidId, recording: conf.recording,
  })

  // 更新 cellAssignments（名称标签 + 保存时用）
  cellAssignments.value = {
    ...cellAssignments.value,
    [cellId]: { name: conf.name, token: ch.token, uuid: conf.resourceUUID, profile: 'main', entityType: 'USC_VIEW_CAMERA' },
  }
  await nextTick()
  const container = document.getElementById('h' + cellId)
  if (!container) { console.warn('[placeCamera] container h%s not found', cellId); return }
  try {
    const player = new UPlayerSDKClass('h' + cellId, conf)
    playerMap.set(cellId, player)
    player.play()
  } catch (e) { console.error('[placeCamera] error', e) }

  // 自动跳到下一格
  const idx  = previewGrid.value.findIndex(c => c.id === cellId)
  const next = previewGrid.value[idx + 1] ?? previewGrid.value[0]
  if (next) selectedCellId.value = next.id
}

function clearCell(cellId: string) {
  stopCellExtra(cellId)
  const player = playerMap.get(cellId)
  if (player) { try { player.destroy?.() } catch (e) {} ; playerMap.delete(cellId) }
  // 销毁该格子的 OL 地图实例
  const olMap = cellMapInstances.get(cellId)
  if (olMap) { try { olMap.setTarget(undefined) } catch {} ; cellMapInstances.delete(cellId) }
  const container = document.getElementById('h' + cellId)
  if (container) container.querySelectorAll('video, canvas, .ol-viewport').forEach(el => el.remove())
  cameraMap.value.delete(cellId)
  const next = { ...cellAssignments.value }
  delete next[cellId]
  cellAssignments.value = next
  if (selectedCellId.value === cellId) selectedCellId.value = ''
}

function clearAllPlayers() {
  cameraMap.value.forEach((_, cellId) => stopCellExtra(cellId))
  playerMap.forEach(p => { try { p?.destroy?.() } catch (e) {} })
  playerMap.clear()
  cameraMap.value.clear()
  // 销毁所有 OL 地图实例
  cellMapInstances.forEach(m => { try { m.setTarget(undefined) } catch {} })
  cellMapInstances.clear()
}

// ─── Float-layer handlers（直接对照 Monitoring/View.vue）─────────────────────

function stopCellExtra(cellId: string) {
  if (cell3DZoomId.value === cellId) { cell3DZoomId.value = ''; _clear3DCanvas(cellId) }
  if (cellEZoomId.value === cellId) _stopEZoom(cellId)
  if (cellAudioVisible.value === cellId) cellAudioVisible.value = ''
}

// 音量
const toggleCellAudio = (cellId: string) => {
  cellAudioVisible.value = cellAudioVisible.value === cellId ? '' : cellId
  if (!(cellId in cellAudioSliders)) cellAudioSliders[cellId] = 0
}
const setCellVolume = (cellId: string, val: number) => {
  cellAudioSliders[cellId] = val
  try { playerMap.get(cellId)?.setVolume?.(val) } catch {}
}

// 码率信息
const fetchCellInfo = async (token: string) => {
  try {
    const res: any = await GetInformationDataApi(token)
    if (res.status !== 200) return
    const d = res.data
    infoVideo.value = [
      { name: t('Liveview.live_codec'),      data: d.strVideoType },
      { name: t('Common.comm_width'),        data: d.nVideoWidth },
      { name: t('Common.comm_height'),       data: d.nVideoHeight },
      { name: t('Common.comm_fps'),          data: d.nVideoFPS },
      { name: t('CommDev.comm_dev_bitrate'), data: (d.nVideoBitrate / 1024).toFixed(1) + 'kbps' },
    ]
    infoAudio.value = [
      { name: t('Liveview.live_codec'),      data: d.strAudioType },
      { name: t('Liveview.live_sampleRate'), data: d.nAudioSampleRate },
      { name: t('Liveview.live_sampleBit'),  data: d.nAudioSampleBit },
      { name: t('Liveview.live_channels'),   data: d.nAudioChannels },
      { name: t('CommDev.comm_dev_bitrate'), data: (d.nAudioBitrate / 1024).toFixed(1) + 'kbps' },
    ]
  } catch {}
}
const showCellInfo = (cellId: string) => {
  const cam = cameraMap.value.get(cellId)
  if (!cam) return
  if (infoShow.value && infoToken.value === cam.token) {
    infoShow.value = false; infoToken.value = ''; clearInterval(timerRunInfo); timerRunInfo = null
  } else {
    infoShow.value = true; infoToken.value = cam.token
    fetchCellInfo(cam.token)
    timerRunInfo = setInterval(() => fetchCellInfo(cam.token), 8000)
  }
}
const closeInfo = () => {
  infoShow.value = false; infoToken.value = ''; clearInterval(timerRunInfo); timerRunInfo = null
}

// 对讲
const doShoutwheat = (cellId: string) => {
  const cam = cameraMap.value.get(cellId)
  if (!cam) return
  if (audioingCellId.value === cellId) {
    audioback?.disconnect(); audioback = null; audioingCellId.value = ''
  } else {
    audioback?.disconnect()
    ;(navigator as any).getUserMedia = (constraints: MediaStreamConstraints, success: (s: MediaStream) => void, error?: (e: any) => void) => {
      navigator.mediaDevices.getUserMedia(constraints).then(success).catch(error ?? (() => {}))
    }
    audioback = new H5sPlayerAudBack({ protocol: window.location.protocol, host: window.location.host, rootpath: '/', token: cam.token, session: userStore.session })
    audioback.connect(); audioingCellId.value = cellId
  }
}

// 截图
const doSnapshot = (cellId: string) => {
  const cam = cameraMap.value.get(cellId)
  if (!cam) return
  const video = document.getElementById(cam.videoid) as HTMLVideoElement | null
  if (!video) return
  const d = new Date()
  const fileName = `${cam.token}_${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 360
  canvas.getContext('2d')!.drawImage(video, 0, 0)
  const a = document.createElement('a')
  a.download = fileName + '.png'; a.href = canvas.toDataURL('image/png')
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}

// 手动录像
const doManualRec = async (cellId: string) => {
  const cam = cameraMap.value.get(cellId)
  if (!cam) return
  const newState = !cam.recording
  try {
    const res: any = await setRecEnableApi({ devUUID: cam.resourceUUID, setting: { manualRecEnable: newState } })
    if (res.status === 200 && res.data.msg === 'Success') {
      cameraMap.value.set(cellId, { ...cam, recording: newState })
      ElMessage.success(newState ? t('Liveview.live_rec_start') : t('Liveview.live_rec_stop'))
    } else { ElMessage.error(t('CommTableEdit.comm_modify_failed')) }
  } catch { ElMessage.error(t('CommTableEdit.comm_modify_failed')) }
}

// PTZ
const showPtz = async (cellId: string) => {
  const cam = cameraMap.value.get(cellId)
  if (!cam) return
  if (ptzShow.value && ptzToken.value === cam.token) { ptzShow.value = false; ptzToken.value = ''; return }
  ptzToken.value = cam.token; presetList.value = []
  try {
    const res: any = await GetPresetsApi(ptzToken.value)
    if (res.status === 200) presetList.value = (res.data.preset ?? []).slice(0, 8)
  } catch {}
  ptzShow.value = true
}
const closePtz = () => { ptzShow.value = false; ptzToken.value = '' }
const ptzAction = (action: string) => { if (ptzToken.value) PtzApi(ptzToken.value, action, ptzSpeed.value) }

// 3D 框选放大
const _clear3DCanvas = (cellId: string) => {
  const c = document.getElementById('3dzoom-h' + cellId) as HTMLCanvasElement | null
  if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height)
}
const toggle3DZoom = (cellId: string) => {
  if (cell3DZoomId.value === cellId) {
    cell3DZoomId.value = ''; _clear3DCanvas(cellId)
    ElMessage({ message: t('Liveview.live_expendarea_exit'), type: 'info', duration: 2000 })
  } else {
    if (cellEZoomId.value) _stopEZoom(cellEZoomId.value)
    cell3DZoomId.value = cellId
    cell3DZoomState[cellId] = { drawing: false, x0: 0, y0: 0, x1: 0, y1: 0 }
    ElMessage({ message: t('Liveview.live_expendarea_enter'), type: 'info', duration: 3000 })
  }
}
const on3DMouseDown = (cellId: string, e: MouseEvent) => {
  if (cell3DZoomId.value !== cellId) return
  const c = document.getElementById('3dzoom-h' + cellId) as HTMLCanvasElement
  if (!c) return
  c.width = (document.getElementById('h' + cellId)?.offsetWidth ?? c.width)
  c.height = (document.getElementById('h' + cellId)?.offsetHeight ?? c.height)
  const rect = c.getBoundingClientRect()
  cell3DZoomState[cellId] = { drawing: true, x0: e.clientX - rect.left, y0: e.clientY - rect.top, x1: e.clientX - rect.left, y1: e.clientY - rect.top }
}
const on3DMouseMove = (cellId: string, e: MouseEvent) => {
  const st = cell3DZoomState[cellId]; if (!st?.drawing) return
  const c = document.getElementById('3dzoom-h' + cellId) as HTMLCanvasElement; if (!c) return
  const rect = c.getBoundingClientRect(); st.x1 = e.clientX - rect.left; st.y1 = e.clientY - rect.top
  const ctx = c.getContext('2d')!; ctx.clearRect(0, 0, c.width, c.height)
  ctx.strokeStyle = '#00FF00'; ctx.lineWidth = 1.5; ctx.strokeRect(st.x0, st.y0, st.x1 - st.x0, st.y1 - st.y0)
}
const on3DMouseUp = (cellId: string) => {
  const st = cell3DZoomState[cellId]; if (!st?.drawing) return; st.drawing = false
  const cam = cameraMap.value.get(cellId)
  if (cam) { try { PtzApi(cam.token, 'selzoomin', ptzSpeed.value) } catch {} }
  _clear3DCanvas(cellId)
}
const on3DMouseLeave = (cellId: string) => {
  const st = cell3DZoomState[cellId]; if (st?.drawing) { st.drawing = false; _clear3DCanvas(cellId) }
}

// 电子放大
const _stopEZoom = (cellId: string) => {
  cellEZoomId.value = ''
  const entry = cellEZoomTimers.get(cellId)
  if (entry) { clearInterval(entry.interval); entry.cleanup(); cellEZoomTimers.delete(cellId) }
  ;['ezoom-h', 'ezoom-mini-h', 'ezoom-sel-h'].forEach(pfx => {
    const c = document.getElementById(pfx + cellId) as HTMLCanvasElement | null
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height)
  })
}
const toggleEZoom = (cellId: string) => {
  if (cellEZoomId.value === cellId) { _stopEZoom(cellId); return }
  if (cell3DZoomId.value) toggle3DZoom(cell3DZoomId.value)
  const cam = cameraMap.value.get(cellId); if (!cam) return
  cellEZoomId.value = cellId
  nextTick(() => {
    const container = document.getElementById('h' + cellId)
    const video = document.getElementById(cam.videoid) as HTMLVideoElement | null
    const canvas2 = document.getElementById('ezoom-h' + cellId) as HTMLCanvasElement | null
    const canvas3 = document.getElementById('ezoom-mini-h' + cellId) as HTMLCanvasElement | null
    const canvas  = document.getElementById('ezoom-sel-h' + cellId) as HTMLCanvasElement | null
    if (!canvas2 || !canvas3 || !canvas || !container) return
    const vw = container.offsetWidth, vh = container.offsetHeight
    const tw = Math.floor(vw / 4), th = Math.floor(vh / 4)
    canvas2.width = vw; canvas2.height = vh; canvas3.width = tw; canvas3.height = th; canvas.width = tw; canvas.height = th
    const ctx2 = canvas2.getContext('2d')!, ctx3 = canvas3.getContext('2d')!, ctx = canvas.getContext('2d')!
    let x = 0, y = 0, disX = 0, disY = 0, disW = tw, disH = th
    const _draw = (cx: CanvasRenderingContext2D, px: number, py: number, pw: number, ph: number) => {
      cx.clearRect(0, 0, cx.canvas.width, cx.canvas.height)
      cx.fillStyle = 'rgba(120,120,120,0.30)'; cx.fillRect(px, py, pw, ph)
      cx.strokeStyle = 'rgba(200,200,200,0.85)'; cx.lineWidth = 1.5; cx.strokeRect(px+.5, py+.5, pw-1, ph-1)
    }
    const intervalId = setInterval(() => {
      if (!video || video.paused || !video.videoWidth) return
      const rw = video.videoWidth, rh = video.videoHeight
      if (rw * disW / tw > rw - disX) disX = rw - rw * disW / tw
      if (rh * disH / th > rh - disY) disY = rh - rh * disH / th
      ctx2.clearRect(0, 0, vw, vh); ctx2.drawImage(video, disX, disY, rw*disW/tw, rh*disH/th, 0, 0, vw, vh)
      ctx3.clearRect(0, 0, tw, th); ctx3.drawImage(video, 0, 0, tw, th)
    }, 40)
    const onDown = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect(); let mx = e.clientX - r.left, my = e.clientY - r.top
      x = mx <= disW/2 ? 0 : mx < tw - disW/2 ? mx - disW/2 : tw - disW
      y = my <= disH/2 ? 0 : my < th - disH/2 ? my - disH/2 : th - disH
      disX = (video?.videoWidth??0)/disW*x; disY = (video?.videoHeight??0)/disH*y; _draw(ctx, x, y, disW, disH)
      canvas.onmousemove = (ev: MouseEvent) => {
        const r2 = canvas.getBoundingClientRect(); mx = ev.clientX - r2.left; my = ev.clientY - r2.top
        x = mx <= disW/2 ? 0 : mx < tw - disW/2 ? mx - disW/2 : tw - disW
        y = my <= disH/2 ? 0 : my < th - disH/2 ? my - disH/2 : th - disH
        disX = (video?.videoWidth??0)/tw*x; disY = (video?.videoHeight??0)/th*y; _draw(ctx, x, y, disW, disH)
      }
      canvas.onmouseup = () => { canvas.onmousemove = null; canvas.onmouseup = null }
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); const sw = tw/4, sh = th/4
      if (e.deltaY < 0) { disW = Math.min(tw, disW+sw); disH = Math.min(th, disH+sh) }
      else { disW = Math.max(tw/4, disW-sw); disH = Math.max(th/4, disH-sh) }
      if (tw - x < disW) x = tw - disW; if (th - y < disH) y = th - disH; _draw(ctx, x, y, disW, disH)
    }
    canvas.addEventListener('mousedown', onDown)
    canvas2.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('wheel', onWheel, { passive: false })
    cellEZoomTimers.set(cellId, { interval: intervalId, cleanup: () => {
      canvas.removeEventListener('mousedown', onDown)
      canvas2.removeEventListener('wheel', onWheel); canvas.removeEventListener('wheel', onWheel)
      canvas.onmousemove = null; canvas.onmouseup = null
    }})
  })
}

// 单格全屏
const toggleCellFullscreen = (cellId: string) => {
  const el = document.getElementById('h' + cellId) as any; if (!el) return
  const doc = document as any
  if (doc.fullscreenElement || doc.webkitFullscreenElement) {
    ;(doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc)
  } else {
    ;(el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el)
    cellFullscreenId.value = cellId
  }
}
const _onFullscreenChange = () => {
  const doc = document as any
  if (!doc.fullscreenElement && !doc.webkitFullscreenElement) cellFullscreenId.value = ''
}

async function handleNodeClick(data: TreeNode) {
  // 点击视图节点 → 对照 uscweb srcview，单独请求完整视图数据再渲染
  if (data.isView && data.viewData) {
    try {
      const res: any = await GetViewApi(data.viewData.viewId)
      if (res?.data?.msg === 'Success' && res?.data?.result) {
        const fullView = res.data.result
        currentView.value = fullView
        LiveplayShow.value = true
        loadViewPreview(fullView)
      }
    } catch (e) {
      console.warn('[handleNodeClick] GetViewApi error', e)
    }
    return
  }

  // 点击地图节点 → 放入当前选中格子并渲染 OL 地图
  if (data.isMap && LiveplayShow.value && previewGrid.value.length) {
    if (!selectedCellId.value) selectedCellId.value = previewGrid.value[0].id
    const cellId = selectedCellId.value
    const mapData = data.data
    // 先销毁旧内容（可能是视频或另一张地图）
    clearCell(cellId)
    // 更新 cellAssignments
    cellAssignments.value = {
      ...cellAssignments.value,
      [cellId]: {
        name:       mapData.mapName ?? data.label,
        uuid:       String(mapData.mapId ?? ''),
        profile:    '',
        entityType: 'USC_VIEW_MAP',
      },
    }
    // 从服务端获取完整地图数据，然后渲染
    try {
      const res: any = await http.get(userStore.IPPORT + '/uapi/v1/Map/' + mapData.mapId)
      if (res?.data?.msg === 'Success' && res?.data?.result) {
        await nextTick()
        placeCellMap(cellId, res.data.result)
      }
    } catch (e) {
      console.warn('[handleNodeClick] Map API error', e)
    }
    // 自动跳到下一格
    const idx  = previewGrid.value.findIndex(c => c.id === cellId)
    const next = previewGrid.value[idx + 1] ?? previewGrid.value[0]
    if (next) selectedCellId.value = next.id
    return
  }

  // 点击摄像头通道 → 放入当前选中格子并起播（仅在已选中视图后生效）
  if (data.isDeviceChannel && LiveplayShow.value && previewGrid.value.length) {
    if (!selectedCellId.value) selectedCellId.value = previewGrid.value[0].id
    const cellId = selectedCellId.value
    placeCamera(cellId, data.data)
  }
}

// ─── 格子内渲染 OL 地图（对照 uscweb Liveplay.ViewPlayMap）─────────────────────

function placeCellMap(cellId: string, mapdata: any) {
  const container = document.getElementById('h' + cellId)
  if (!container) return
  // 清理旧的 OL 实例
  const old = cellMapInstances.get(cellId)
  if (old) { try { old.setTarget(undefined) } catch {} ; cellMapInstances.delete(cellId) }
  container.querySelectorAll('.ol-viewport').forEach(el => el.remove())

  const allowed = ['USC_MAP_STATIC','USC_MAP_CAD','USC_MAP_GOOGLE','USC_MAP_GAO_DE','USC_MAP_TIAN','USC_MAP_TILE']
  if (!allowed.includes(mapdata.type)) return

  const olMap = new OLMap({ target: container })
  cellMapInstances.set(cellId, olMap)

  if (mapdata.type === 'USC_MAP_STATIC') {
    _cellStaticMap(olMap, mapdata)
  } else {
    _cellGisMap(olMap, mapdata)
  }
  setTimeout(() => {
    if (mapdata.mapElementChannel?.length) _cellRenderChannels(olMap, mapdata.mapElementChannel)
    if (mapdata.mapView?.length)           _cellRenderViews(olMap, mapdata.mapView)
    if (mapdata.mapElementLink?.length)    _cellRenderLinks(olMap, mapdata.mapElementLink)
  }, 500)
}

function _cellGisMap(olMap: any, data: any) {
  const proj = data.projection || 'EPSG:4326'
  if (data.type === 'USC_MAP_TIAN') {
    const p = get('EPSG:4326')!
    const ext = p.getExtent()
    const size = getWidth(ext) / 256
    const res: number[] = Array.from({length:18}, (_,z) => size / Math.pow(2, z))
    const ids: string[] = Array.from({length:18}, (_,z) => String(z))
    olMap.setView(new OLView({ projection: proj, center: data.center, zoom: data.zoom||7, minZoom: data.minZoom, maxZoom: data.maxZoom||8 }))
    olMap.addLayer(new TileLayer({ source: new WMTS({ url: data.mapUrl, layer:'vec', matrixSet:'c', format:'tiles', style:'default', crossOrigin:'anonymous', tileGrid: new WMTSTileGrid({ origin: getTopLeft(ext), resolutions: res, matrixIds: ids }) }) }))
    if (data.mapUrl2) olMap.addLayer(new TileLayer({ source: new WMTS({ url: data.mapUrl2, layer:'cva', matrixSet:'c', format:'tiles', style:'default', crossOrigin:'anonymous', tileGrid: new WMTSTileGrid({ origin: getTopLeft(ext), resolutions: res, matrixIds: ids }) }) }))
  } else {
    const center = proj === 'EPSG:3857' ? fromLonLat(data.center) : (data.center || fromLonLat([0, 0]))
    olMap.setView(new OLView({ center, zoom: data.zoom||7, minZoom: data.minZoom, maxZoom: data.maxZoom||8, projection: proj }))
    olMap.addLayer(new TileLayer({ source: new XYZ({ url: data.mapUrl, projection: proj }) }))
  }
}

function _cellStaticMap(olMap: any, data: any) {
  olMap.setView(new OLView({ center: fromLonLat([0,0]), zoom: data.zoom||7, minZoom: data.minZoom, maxZoom: data.maxZoom||8 }))
  const img = new Image()
  img.src = userStore.IPPORT + '/' + data.mapUrl + '?session=' + userStore.session
  img.onload = () => {
    const ext = [-img.width*1000, -img.height*1000, img.width*1000, img.height*1000]
    olMap.addLayer(new ImageLayer({ source: new ImageStatic({ url: img.src, imageExtent: ext }) }))
  }
}

function _cellCoordFix(olMap: any, item: any) {
  const proj = olMap.getView().getProjection()
  if (proj?.getCode() === 'EPSG:3857') {
    const c = fromLonLat([item.longitude, item.latitude])
    item.longitude = c[0]; item.latitude = c[1]
  }
}
function _cellRenderChannels(olMap: any, data: any[]) {
  const dm = new H5smap(olMap)
  data.forEach(item => {
    _cellCoordFix(olMap, item)
    dm.addLayer({ map: olMap, cameraName: item.channelName, cameraToken: item.channelUUID, radius: item.Radius, angle: item.angle, rotationAngle: item.rotationAngle, cameraType: item.fillColor, coordinate: [item.longitude, item.latitude], id: item.id, type: 'camera', callback: () => {} })
  })
}
function _cellRenderViews(olMap: any, data: any[]) {
  const dm = new H5smap(olMap)
  data.forEach(item => {
    _cellCoordFix(olMap, item)
    dm.addLayer({ map: olMap, cameraName: item.viewName, cameraToken: item.viewUUID, cameraType: item.fillColor, coordinate: [item.longitude, item.latitude], drawIcon: true, id: item.id, type: 'view', callback: () => {} })
  })
}
function _cellRenderLinks(olMap: any, data: any[]) {
  const dm = new H5smap(olMap)
  data.forEach(item => {
    _cellCoordFix(olMap, item)
    dm.addLayer({ map: olMap, cameraName: item.resName, cameraToken: item.id, cameraType: item.fillColor, coordinate: [item.longitude, item.latitude], drawIcon: true, id: item.mapLinkId, type: 'link', callback: () => {} })
  })
}

function loadViewPreview(view: ViewRow) {
  // 切换视图前销毁所有旧播放器
  clearAllPlayers()
  cellAssignments.value = {}

  // 对照 uscweb srcview：layoutId 1-10 为预设，11+ 为自定义
  if (view.layoutId <= 10) {
    const presetKey = LAYOUT_ID_MAP[view.layoutId]
    const preset    = presetKey !== undefined ? PRESET_LAYOUTS[presetKey] : undefined
    if (preset) {
      previewGrid.value = preset.cells
      layoutType.value  = preset.layout
    } else {
      previewGrid.value = []
    }
  } else {
    // 自定义布局：从 view.layout 解析格子
    if (view.layout) {
      layoutType.value  = view.layout.layoutType ?? '3|3'
      previewGrid.value = (view.layout.setting?.layoutView ?? []).map((c: any) => ({
        id: c.position, rowStart: c.rowStart, rowEnd: c.rowEnd,
        colStart: c.colStart, colEnd: c.colEnd, merged: c.merged,
      }))
    } else {
      previewGrid.value = []
    }
  }

  // 回填已保存的摄像头并起播（对照 uscweb srcview viewEntity 循环）
  nextTick(() => {
    view.viewEntity?.forEach((ve: any) => {
      const rawPos = ve.layoutPosition ?? ''
      // layoutPosition 可能是 "h1-1" 或 "1-1"
      const cellId = rawPos.startsWith('h') ? rawPos.slice(1) : rawPos
      if (!cellId || !ve.Channel?.token) return
      placeCamera(cellId, {
        token:        ve.Channel.token,
        name:         ve.Channel.name ?? cellId,
        uuid:         ve.resourceUUID,
        resourceUUID: ve.resourceUUID,
      })
    })
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
    border: '1px solid #444',   // 比 #333 更亮，空格子清晰可见
  }
}

// ─── Preset layouts (mirrors uscweb) ─────────────────────────────────────────

const PRESET_LAYOUTS: Record<number | string, { cells: LayoutCell[]; layout: string }> = {
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
  // 4Alt：1大格（顶部横跨3列2行）+ 底部3小格，对照 uscweb icon-sigongge
  '4Alt': { layout: '3|3', cells: [
    { id:'1-1', rowStart:1,rowEnd:3,colStart:1,colEnd:4,merged:true  },
    { id:'3-1', rowStart:3,rowEnd:4,colStart:1,colEnd:2,merged:false },
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
function applyPresetLayout(n: number | string) {
  const preset = PRESET_LAYOUTS[n]
  if (!preset) return
  clearAllPlayers()
  cellAssignments.value = {}
  previewGrid.value = preset.cells
  layoutType.value  = preset.layout
  layoutPopoverVisible.value = false
  // 仅 number 类型才回写 layoutId（'4Alt' 等字符串布局不更新 layoutId）
  if (currentView.value && typeof n === 'number') {
    currentView.value = { ...currentView.value, layoutId: n }
  }
}

// ─── 全屏：将布局预览区切换为全屏（对照 uscweb panelFullScreen）──────────────

function panelFullScreen() {
  const elem = document.getElementById('layoutPreviewPanel')
  if (!elem) return
  if (document.fullscreenElement) {
    document.exitFullscreen?.()
  } else {
    elem.requestFullscreen?.()
  }
}

function applyCustomLayout(item: CanvasItem) {
  clearAllPlayers()
  cellAssignments.value = {}
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
      clearAllPlayers()
      currentView.value = null; previewGrid.value = []; cellAssignments.value = {}
      LiveplayShow.value = false   // 对照 uscweb：删除后回到黑屏状态
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
      layoutPosition: 'h' + cellId,    // 对照 uscweb：存 "h1-1" 格式
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
  // 对照uscweb：初始为黑屏，不预设网格；点击视图节点后才显示
  document.addEventListener('fullscreenchange', _onFullscreenChange)
  document.addEventListener('webkitfullscreenchange', _onFullscreenChange)
  await loadAll()
  await loadLayouts()
})

onBeforeUnmount(() => {
  clearAllPlayers()
  if (audioback) { audioback.disconnect(); audioback = null }
  clearInterval(timerRunInfo)
  document.removeEventListener('fullscreenchange', _onFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', _onFullscreenChange)
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

    // 视图"正在显示"指示器（对照 uscweb .nowplay）
    .nowplay {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #30d158;
      padding-left: 4px;
      white-space: nowrap;

      .dot {
        font-size: 12px;
        padding-right: 3px;
      }

      .nowplayText {
        font-size: 12px;
      }
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
  position: absolute;
  cursor: pointer;        // 去掉 crosshair，对照 Monitoring/View
  overflow: hidden;
  background: #111;

  video { display: block; width: 100%; height: 100%; object-fit: fill; }

  // 悬浮按钮层：默认藏在顶部上方，hover 时滑入（对照 Monitoring/View）
  &:hover .float-layer { top: 0; }
  .float-layer {
    position: absolute; right: 0; top: -30px; z-index: 10;
    width: 290px; height: 30px; line-height: 30px;
    background: url('@/views/Monitoring/liveview/imgs/liveview_buttback.png') no-repeat;
    background-size: 290px 30px; text-align: right; padding: 0 10px; transition: 0.2s;
    display: flex; align-items: center; justify-content: flex-end;
    i, span { margin-left: 8px; cursor: pointer; color: #fff; font-size: 16px;
      &:hover { color: #0399FE; }
    }
    .audio-active  { color: #0399FE !important; }
    .rec-active    { color: #f44336 !important; }
    .expend-active { color: #0399FE !important; }
  }

  // 音量滑块面板
  .cell-audio-slider {
    position: absolute; top: 30px; left: 50%; z-index: 20;
    width: 174px; background: rgba(0,0,0,0.7); padding: 4px 10px; border-radius: 4px;
    display: flex; align-items: center;
    i { font-size: 18px; flex-shrink: 0; }
    :deep(.el-slider) {
      .el-slider__runway { height: 4px; background: rgba(255,255,255,0.2); }
      .el-slider__bar    { height: 4px; }
      .el-slider__button { width: 10px; height: 10px; border: 2px solid #409EFF; }
    }
  }

  // 电子放大画布
  .cell-ezoom-canvas {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 8; display: none;
    &.active { display: block; pointer-events: auto; cursor: zoom-in; }
  }
  .cell-ezoom-mini-canvas {
    position: absolute; bottom: 2px; right: 2px; z-index: 9;
    display: none; pointer-events: none; box-shadow: 0 0 4px rgba(0,0,0,0.8);
    &.active { display: block; }
  }
  .cell-ezoom-sel-canvas {
    position: absolute; bottom: 2px; right: 2px; z-index: 10;
    display: none; cursor: crosshair;
    &.active { display: block; pointer-events: auto; }
  }

  // 3D 框选画布
  .cell-3dzoom-canvas {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 9; display: none;
    &.active { display: block; pointer-events: auto; cursor: crosshair; }
  }

  // 摄像头名称标签（左下角，对照 Monitoring/View .cell-label）
  .cell-label-overlay {
    position: absolute; bottom: 0; left: 0; right: 0; z-index: 5;
    background: rgba(0,0,0,0.55); color: #fff; font-size: 11px; padding: 2px 6px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    user-select: none; pointer-events: none;
  }

  &.cell-selected { outline: 2px solid #f44336; outline-offset: -2px; }
}

.videoColor { background-color: #111; }

// 码率信息浮层（对照 Monitoring/View .malv）
.layout-preview-area {
  .malv {
    position: absolute; bottom: 40px; left: 10px; z-index: 100;
    width: 420px; height: 150px; display: flex;
    .malv-close { position: absolute; top: 3px; right: 8px; font-size: 16px; cursor: pointer; color: #fff; }
    .malv-left, .malv-right {
      width: 50%; height: 100%; background: rgba(51,51,51,0.5);
      .information_title { width: 100%; height: 30px; line-height: 30px; background: rgba(0,0,0,0.7); padding: 0 10px; color: #fff; }
      .information_content { width: 100%; display: flex; justify-content: space-between; padding: 0 2px;
        .information_content_left, .information_content_right { width: 50%; color: #3ABBFE; font-size: 12px; }
      }
    }
  }
}

// PTZ 云台面板（对照 Monitoring/View .yuntai）
.yuntai {
  position: absolute; left: 0; bottom: 0; width: 100%; height: 100%;
  z-index: 100; background: rgba(0,0,0,0); pointer-events: none;
  .flex_content { width: 100%; height: 100%; padding: 8% 0; position: relative; pointer-events: none;
    .content_zoom { width: 50%; height: 100%; display: flex; align-items: flex-end; pointer-events: auto;
      .key_zoom { width: 25%; margin: 0 4% 0 8%;
        .key_flex {
          width: 100px; height: 100px; display: grid;
          grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); gap: 16px;
          margin-left: 5%;
          background: url('@/views/Monitoring/liveview/imgs/liveview_ptzbutton.png') no-repeat center;
          background-size: 100px 100px;
          .key_but { width: 100%; height: 100%; text-align: center; cursor: pointer; color: #fff;
            i { font-size: 12px; } &:hover i { color: #0399FE; }
          }
        }
      }
    }
  }
  .ptz_bottom {
    position: absolute; bottom: 10px; left: 10px;
    display: flex; align-items: center; gap: 8px; pointer-events: auto;
    color: #fff; font-size: 13px;
  }
}

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
