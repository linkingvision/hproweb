<template>
  <div class="view-page">

    <!-- ── 左侧设备树 ── -->
    <div class="view-left" :class="{ 'folded': isTreeFold }">
      <div class="search-bar">
        <el-input class="tree-search" :placeholder="t('Common.comm_filtration')" v-model="filterText">
          <template #suffix><i class="iconfont icon-sousuo1"></i></template>
        </el-input>
        <i class="iconfont icon-liebiao fold-btn" @click="toggleTreeFold"></i>
      </div>
      <el-collapse v-model="activeCollapse">
        <el-collapse-item name="device">
          <template #title>
            <div class="collapse-title">
              <span>{{ t('Common.comm_device_partition') }}</span>
              <div @click.stop="refreshTree"><i class="iconfont icon-shuaxin"></i></div>
            </div>
          </template>
          <el-tree ref="treeRef" :data="treeData" :props="treeProps"
            :default-expanded-keys="expandedKeys" node-key="id"
            :filter-node-method="filterTreeNode"
            style="overflow:auto;height:calc(100% - 10px);">
            <template #default="{ node, data }">
              <div draggable="true" @dragstart="onDragStart(node)" @click="onNodeClick(data)"
                class="tree-node" :class="getNodeClass(data)">
                <span :class="isNodePlaying(data) ? 'node-playing-label' : ''"
                  style="display:flex;align-items:center;flex:1;overflow:hidden;">
                  <i :class="`iconfont ${getNodeIcon(data)}`" style="margin-right:6px;font-size:19px;flex-shrink:0;"></i>
                  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ node.label }}</span>
                  <span v-if="data.totalCount !== undefined" style="padding-left:4px;flex-shrink:0;">
                    {{ data.onlineCount }}/{{ data.totalCount }}
                  </span>
                </span>
                <span v-if="isNodePlaying(data)" class="node-playing">
                  <span class="dot">●</span>
                  {{ data.isDeviceChannel ? t('Liveview.live_playing') : t('Liveview.live_displaying') }}
                </span>
              </div>
            </template>
          </el-tree>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- ── 右侧 ── -->
    <div class="view-right">
      <!-- 视频网格（无顶部工具栏，对照uscweb Liveview） -->
      <div class="liveview_right_video_hed" id="video_hed" v-if="LiveplayShow">
        <div v-for="cell in gridCells" :key="cell.id"
          class="palace" :id="'h'+cell.id"
          :class="{ 'palace-selected': selectedCellId===cell.id, 'palace-expanded': expandedCellId===cell.id }"
          :style="computeCellStyle(cell)"
          @click="selectCell(cell.id)"
          @dblclick="toggleExpand(cell.id)"
          @drop.prevent="dropOnCell($event, cell.id)"
          @dragover.prevent>
          <!-- UPlayerSDK injects <video> here dynamically, name label is rendered by SDK -->
          <button v-if="getCellCamera(cell.id)" class="cell-close" @click.stop="clearCell(cell.id)">×</button>
        </div>
      </div>
      <div v-else class="video-empty-hint">{{ t('Liveview.live_view') }}</div>

      <!-- 时间轴 + 回放控制区（仅回放模式显示） -->
      <div class="control_area" style="width:100%;" v-show="!isLiveview">
        <!-- 片段导出面板 -->
        <div v-show="croppingEnabled" class="Cropping">
          <div class="Cropping_title">
            <span>{{ t('Playback.pb_export') }}</span>
            <i class="iconfont icon-guanbixiaoanniu" @click="croppingEnabled = false"></i>
          </div>
          <div class="Cropping_content">
            <el-form label-position="right" label-width="80px" :model="croppingForm">
              <el-form-item :label="t('CommTable.comm_table_name')">
                <el-input v-model="croppingForm.label" style="width:250px;" disabled />
              </el-form-item>
              <el-form-item :label="t('CommTime.comm_time_start')">
                <el-date-picker v-model="croppingForm.startTime" type="datetime" size="small"
                  :clearable="false" :append-to-body="false" style="width:220px;" />
              </el-form-item>
              <el-form-item :label="t('CommTime.comm_time_end')">
                <el-date-picker v-model="croppingForm.endTime" type="datetime" size="small"
                  :clearable="false" :append-to-body="false" style="width:220px;" />
              </el-form-item>
            </el-form>
          </div>
          <div style="padding:0 0 10px 45%;display:flex;gap:8px;">
            <button type="button" style="padding:6px 12px;cursor:pointer;" @click="croppingEnabled = false">{{ t('CommTableEdit.comm_cancel') }}</button>
            <button type="button" style="padding:6px 12px;background:#0399FE;color:#fff;border:none;cursor:pointer;position:relative;z-index:9999;" @click="() => { console.log('btn clicked'); doExport(); }">{{ t('Playback.pb_export') }}</button>
          </div>
        </div>
        <div class="timeline-box" style="width:100%;height:80px;padding:0;box-sizing:border-box;border:none;">
          <svg id="view-timeline-svg"></svg>
        </div>
        <div class="control_btns">
          <div class="caveat_butt">
            <!-- 按钮在左，点击后指示项向右展开 -->
            <div class="showRecodeType" @click="showRecodeType = !showRecodeType">
              <i class="iconfont" :class="showRecodeType ? 'icon-zuojiantou' : 'icon-youjiantou'"></i>
            </div>
            <div class="recodeType" v-if="showRecodeType" style="padding:0 10px;">
              <button class="mr-0"></button>{{ t('CommTableEdit.comm_schedule') }}
              <button class="mr-1"></button>{{ t('CommTableEdit.comm_manual') }}
              <button class="mr-2"></button>{{ t('CommTableEdit.comm_alarm') }}
            </div>
          </div>
          <!-- 中心存储 / 设备存储 切换（仅在系统配置开启时显示） -->
          <div v-if="store.PlaybackShowStorageMode" class="storage-switch">
            <span
              :class="store.DefaultStorage === 'CentralStorage' ? 'active' : ''"
              @click="setStorageCentral">{{ t('Cascade.cascade_central_record') }}</span>
            <span
              :class="store.DefaultStorage === 'DeviceStorage' ? 'active' : ''"
              @click="setStorageDevice">{{ t('Playback.pb_device_record') }}</span>
          </div>
          <div class="control-center">
            <el-date-picker class="fixed_input" v-model="xzvalue" size="small" @change="onDateChange"
              :clearable="false" :append-to-body="false" popper-class="date-picker"
              :default-time="new Date(2000, 0, 1, 0, 0, 0)">
            </el-date-picker>
            <el-select v-model="region" size="small" class="ele" popper-class="selectdrop"
              @change="timeSpeed(region)" popper-style="border:0;">
              <el-option v-for="item in regiondata" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <button class="resume-btn" @click="resumePlayback">
              <i class="iconfont" :class="isPlaying ? 'icon-zanting' : 'icon-bofang'"></i>
            </button>
            <div id="view-audio-slider" class="Audio_slider-bottom">
              <div style="margin-right:10px;">
                <i class="iconfont" :class="Audioslider === 0 ? 'icon-shengyinguan' : 'icon-shengyinkai'"
                  style="font-size:22px;"></i>
              </div>
              <el-slider :step="0.1" :show-tooltip="false" :max="1" v-model="Audioslider"
                style="width:60%;margin-right:10px;"></el-slider>
            </div>
          </div>
          <div class="gongge-btns" style="height:50px;padding-right:20px;width:20%;display:flex;justify-content:flex-end;align-items:center;gap:8px;">
            <button v-if="!isLiveview" @click="toggleCropping" style="padding:0;border:none;background:none;font-size:22px;color:#fff;cursor:pointer;">
              <i class="iconfont icon-jiequ"></i>
            </button>
            <el-button v-if="!isLiveview" class="goto-live" @click="gotoLive" round>{{ t('Monitoring.mon_gotolive') }}</el-button>
          </div>
        </div>
      </div>

      <!-- 底部 footer（对照uscweb liveview_footer） -->
      <div class="liveview_footer">
        <div class="BlankPlaceholder"></div>
        <!-- 实时/回放切换（对照uscweb show-play-replay） -->
        <div class="show-play-replay">
          <div class="changeLiveReplay" @click="setLiveMode(true)"
            :class="isLiveview ? 'live' : 'replay'">{{ t('Monitoring.mon_live') }}</div>
          <div class="changeLiveReplay" @click="setLiveMode(false)"
            :class="!isLiveview ? 'live' : 'replay'">{{ t('Monitoring.mon_playback') }}</div>
        </div>
        <div class="footer-right" style="padding-right:30px;">
          <el-button class="iconfont icon-guanbi2" @click="clearAllPlayers"></el-button>
          <el-popover placement="top" :width="510" trigger="click" popper-class="GongGePopover" v-model:visible="layoutPopoverVisible">
            <div class="LayoutSearch">
              <div class="SearchIcon" v-if="layoutFilter" @click="layoutFilter = false">
                <i class="iconfont icon-sousuo1"></i>
              </div>
              <el-input v-else class="snap_zuo_input" :placeholder="t('Common.comm_filtration')"
                v-model="layoutFilterText" prefix-icon="iconfont icon-sousuo1" style="width:50%">
                <template #suffix>
                  <i class="iconfont icon-guanbi" @click="layoutFilter = true; layoutFilterText = ''"></i>
                </template>
              </el-input>
              <div class="OpenLayoutDialog" @click="() => { openLayoutMgmtDialog(); layoutPopoverVisible=false }">
                {{ t('Liveview.live_view_layout') }}
              </div>
            </div>
            <div style="display:flex;">
              <div class="liveview_group blocks" style="width:40%">
                <div v-for="group in layoutGroups" :key="group.label" style="margin-bottom:10px">
                  <p>{{ group.label }}</p>
                  <div class="PanelBtns">
                    <el-button v-for="k in group.keys" :key="k"
                      :class="`iconfont icon-${layoutIconMap[k]}`"
                      :title="`${k}画面`"
                      @click="changeLayout(k); layoutPopoverVisible=false">
                    </el-button>
                  </div>
                </div>
              </div>
              <div class="ViewLayout" style="width:60%">
                <p>{{ t('Liveview.live_customization') }}</p>
                <div style="display:flex;flex-wrap:wrap;">
                  <template v-for="(item, index) in filteredLayoutList" :key="item.layoutId">
                    <div class="LayoutCanvas"
                      @click="applyCustomLayout(item); layoutPopoverVisible=false">
                      <canvas :id="'viewCanvas' + index" width="25px" height="25px"
                        style="margin:15px 20px;" :title="item.layoutName" class="title"></canvas>
                      <span>{{ item.layoutName }}</span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
            <template #reference>
              <el-button class="iconfont icon-gongge" style="margin-top:4px;" @click="loadCustomLayouts"></el-button>
            </template>
          </el-popover>
          <el-button class="iconfont icon-quanping1" @click="toggleFullscreen"></el-button>
        </div>
      </div>
    </div>

    <div v-if="isTreeFold" class="unfold-btn" @click="toggleTreeFold">
      <i class="iconfont icon-liebiao"></i>
    </div>

    <!-- 新增视图对话框 -->
    <el-dialog v-model="addDialogVisible" :title="t('Setting.set_adding_views')" width="420px">
      <el-form :model="viewForm" label-width="90px">
        <el-form-item :label="t('Liveview.live_view_name')"><el-input v-model="viewForm.viewName" /></el-form-item>
        <el-form-item :label="t('Setting.set_view_type')">
          <el-select v-model="viewForm.viewType" style="width:100%">
            <el-option label="Public" value="USC_VIEW_PUBLIC" />
            <el-option label="Private" value="USC_VIEW_PRIVATE" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('Common.comm_device_partition')">
          <el-select v-model="viewForm.devPartitionId" style="width:100%"
            @change="v => viewForm.devPartitionName = partitionList.find(p=>p.id===v)?.name??''">
            <el-option v-for="p in partitionList" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('Liveview.live_view_layout')">
          <el-select v-model="viewForm.layoutId" style="width:100%">
            <el-option v-for="l in layoutList" :key="l.layoutId" :label="l.layoutName" :value="l.layoutId" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible=false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button type="primary" @click="submitAddView">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>

    <!-- 编辑视图对话框 -->
    <el-dialog v-model="editDialogVisible" :title="t('CommTableEdit.comm_edit')" width="420px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item :label="t('Setting.set_view_id')"><el-input :model-value="String(editForm.viewId)" disabled /></el-form-item>
        <el-form-item :label="t('Liveview.live_view_name')"><el-input v-model="editForm.viewName" /></el-form-item>
        <el-form-item :label="t('Setting.set_view_type')">
          <el-select v-model="editForm.viewType" style="width:100%">
            <el-option label="Public" value="USC_VIEW_PUBLIC" />
            <el-option label="Private" value="USC_VIEW_PRIVATE" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('Common.comm_device_partition')">
          <el-select v-model="editForm.devPartitionId" style="width:100%"
            @change="v => editForm.devPartitionName = partitionList.find(p=>p.id===v)?.name??''">
            <el-option v-for="p in partitionList" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible=false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button type="primary" @click="submitEditView">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>

    <!-- 布局管理对话框 -->
    <el-dialog v-model="layoutMgmtVisible" :title="t('Liveview.live_view_layout')" width="500px">
      <div class="layout-mgmt-bar">
        <div>
          <el-button size="small" type="primary" @click="showGird1=true">{{ t('Liveview.live_new_view_layout') }}</el-button>
          <el-button size="small" @click="deleteCustomLayout" :disabled="!selectedLayoutId">🗑</el-button>
        </div>
        <el-button size="small" @click="restoreDefaultLayouts">{{ t('Liveview.live_restore_defaults') }}</el-button>
      </div>
      <div class="custom-layout-list">
        <template v-for="(item, index) in layoutList" :key="item.layoutId">
          <div class="custom-layout-item"
            :class="{ selected: selectedLayoutId===item.layoutId }"
            @click="selectedLayoutId=item.layoutId; applyCustomLayout(item)">
            {{ item.layoutName }}
          </div>
        </template>
      </div>
      <template v-if="showGird1">
        <el-input v-model="customLayoutForm.layoutName" :placeholder="t('Liveview.live_view_name')" style="margin:8px 0;" />
        <Gird1 ref="gird1Ref" @get-layout-data="onLayoutData" />
      </template>
      <template #footer>
        <el-button @click="layoutMgmtVisible=false; showGird1=false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button v-if="showGird1" type="primary" @click="submitCustomLayout">{{ t('CommTableEdit.comm_save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UPlayerSDK as UPlayerSDKClass, UPlayerList as UPlayerListClass, H5sPlayerWS2 } from '@/assets/js/uplayersdk.esm.js'
import { useUserStore } from '@/store/user'
import { useStore } from '@/store'
import { GetDevPartitionApi } from '@/api/configuration/device'
import { GetDeviceChannels, getSearchDeviceRecordByTimeApi, getSearchStorRecordByTimeApi } from '@/api/channel'
import { UpdateUserConfigApi } from '@/api/system'
import { GetViewApi, CreateViewApi, UpdateViewApi, DeleteViewApi, GetLayoutListApi, CreateLayoutApi, DeleteLayoutApi } from '@/api/view'
import uuid from '@/assets/js/uuid.js'
import Gird1 from './Gird1.vue'

const { t } = useI18n()
const userStore = useUserStore()
const store = useStore()

// ─── Types ────────────────────────────────────────────────────────────────
interface GridCell { id: string; rowStart: number; rowEnd: number; colStart: number; colEnd: number; merged: boolean }
interface CameraConf { token: string; name: string; resourceUUID: string; videoid: string; layoutPosition: string; recording: boolean; nodeId?: string }
interface TreeNode { id: string; label: string; type: string; data: any; children?: TreeNode[]; isLeaf?: boolean; isDeviceChannel?: boolean; online?: boolean; onlineCount?: number; totalCount?: number }

// ─── Grid state ────────────────────────────────────────────────────────────
const LiveplayShow   = ref(true)
const isLiveview     = ref(true)   // true=live, false=playback
const gridCells      = ref<GridCell[]>([
  { id:'1-1', rowStart:1, rowEnd:2, colStart:1, colEnd:2, merged:false },
  { id:'1-2', rowStart:1, rowEnd:2, colStart:2, colEnd:3, merged:false },
  { id:'2-1', rowStart:2, rowEnd:3, colStart:1, colEnd:2, merged:false },
  { id:'2-2', rowStart:2, rowEnd:3, colStart:2, colEnd:3, merged:false },
])
const layoutType     = ref('2|2')
const selectedCellId = ref('')
const expandedCellId = ref('')
const cameraMap      = ref(new Map<string, CameraConf>())   // cellId → camera
const playerMap      = new Map<string, any>()               // cellId → UPlayerSDK
const UPlayerList    = ref<any>(null)                        // timeline / sync playback
const isPlaying      = ref(false)
const xzvalue        = ref<Date>(new Date())
const region         = ref('1.0')
const regiondata     = [
  { value:'16.0', label:'16x' }, { value:'8.0', label:'8x' }, { value:'4.0', label:'4x' },
  { value:'2.0', label:'2x' },   { value:'1.0', label:'1x' }, { value:'0.5', label:'1/2x' },
  { value:'0.25', label:'1/4x' }
]
const liveviewViewadd = ref<Array<{strIndex:string; token:string; resourceUUID:string; profile:string}>>([])
const playingNodeIds  = ref<string[]>([])
const showRecodeType  = ref(false)
const Audioslider     = ref(0)

// 音量变化时应用到所有播放器
watch(Audioslider, (val) => {
  playerMap.forEach(player => {
    try { player?.setVolume?.(val) } catch(e) {}
  })
})

// ─── Tree state ────────────────────────────────────────────────────────────
const treeRef        = ref<any>(null)
const treeData       = ref<TreeNode[]>([])
const expandedKeys   = ref<string[]>([])
const filterText     = ref('')
const activeCollapse = ref('device')
const isTreeFold     = ref(false)
const deviceCache    = new Map<string, TreeNode[]>()
const treeProps      = { value: 'id', label: 'label', children: 'children' }

// ─── View CRUD state ───────────────────────────────────────────────────────
const currentView          = ref<any>(null)
const addDialogVisible     = ref(false)
const editDialogVisible    = ref(false)
const layoutPopoverVisible = ref(false)
const layoutMgmtVisible    = ref(false)
const layoutFilter         = ref(true)    // true=显示搜索图标, false=显示输入框
const layoutFilterText     = ref('')
const layoutList           = ref<any[]>([])   // 全量布局（前10条为预设，10条后为自定义）
const filteredLayoutList   = computed(() =>
  layoutFilterText.value
    ? layoutList.value.filter(i => i.layoutName?.includes(layoutFilterText.value))
    : layoutList.value
)
const selectedLayoutId     = ref<number | null>(null)
const partitionList        = ref<Array<{id:number; name:string}>>([{ id:10000, name:'Root' }])
const showGird1            = ref(false)
const gird1Ref             = ref<any>(null)
const viewForm  = reactive({ viewName:'', viewType:'USC_VIEW_PUBLIC', layoutId:0, devPartitionId:10000, devPartitionName:'' })
const editForm  = reactive({ viewId:0, viewName:'', viewType:'USC_VIEW_PUBLIC', layoutId:0, devPartitionId:10000, devPartitionName:'' })
const customLayoutForm = reactive({ layoutName:'' })

// ─── Layout groups (for popover, mirroring uscweb grouping) ────────────────
const layoutGroups = [
  { label: '13 · 16 · 25', keys: ['13','16','25'] },
  { label: '6 · 7 · 9',    keys: ['6','7','9']    },
  { label: '4 · 4Alt',     keys: ['4','4Alt']      },
  { label: '1 · 3',        keys: ['1','3']         },
]

// Icon class mapping for layout picker (matches uscweb's icon names)
const layoutIconMap: Record<string, string> = {
  '1':    'a-1gongge',
  '3':    'a-3gongge',
  '4':    'a-4gongge',
  '4Alt': 'sigongge',
  '6':    'a-6gongge',
  '7':    'a-7gongge',
  '9':    'a-9gongge',
  '13':   'a-13gongge',
  '16':   'a-16gongge',
  '25':   'a-25gongge',
}

interface CellDef { rowStart:number; rowEnd:number; colStart:number; colEnd:number }
const layoutDefs: Record<string, { layout:string; cells:CellDef[] }> = {
  '1':   { layout:'1|1', cells:[{rowStart:1,rowEnd:2,colStart:1,colEnd:2}] },
  '3':   { layout:'1|3', cells:[{rowStart:1,rowEnd:2,colStart:1,colEnd:2},{rowStart:1,rowEnd:2,colStart:2,colEnd:3},{rowStart:1,rowEnd:2,colStart:3,colEnd:4}] },
  '4':   { layout:'2|2', cells:[{rowStart:1,rowEnd:2,colStart:1,colEnd:2},{rowStart:1,rowEnd:2,colStart:2,colEnd:3},{rowStart:2,rowEnd:3,colStart:1,colEnd:2},{rowStart:2,rowEnd:3,colStart:2,colEnd:3}] },
  '4Alt':{ layout:'3|3', cells:[{rowStart:1,rowEnd:3,colStart:1,colEnd:4},{rowStart:3,rowEnd:4,colStart:1,colEnd:2},{rowStart:3,rowEnd:4,colStart:2,colEnd:3},{rowStart:3,rowEnd:4,colStart:3,colEnd:4}] },
  '6':   { layout:'3|3', cells:[{rowStart:1,rowEnd:3,colStart:1,colEnd:3},{rowStart:1,rowEnd:2,colStart:3,colEnd:4},{rowStart:2,rowEnd:3,colStart:3,colEnd:4},{rowStart:3,rowEnd:4,colStart:1,colEnd:2},{rowStart:3,rowEnd:4,colStart:2,colEnd:3},{rowStart:3,rowEnd:4,colStart:3,colEnd:4}] },
  '7':   { layout:'3|3', cells:[{rowStart:1,rowEnd:4,colStart:1,colEnd:2},{rowStart:1,rowEnd:2,colStart:2,colEnd:3},{rowStart:1,rowEnd:2,colStart:3,colEnd:4},{rowStart:2,rowEnd:3,colStart:2,colEnd:3},{rowStart:2,rowEnd:3,colStart:3,colEnd:4},{rowStart:3,rowEnd:4,colStart:2,colEnd:3},{rowStart:3,rowEnd:4,colStart:3,colEnd:4}] },
  '9':   { layout:'3|3', cells:Array.from({length:9},(_,i)=>({rowStart:Math.floor(i/3)+1,rowEnd:Math.floor(i/3)+2,colStart:(i%3)+1,colEnd:(i%3)+2})) },
  '13':  { layout:'4|4', cells:[{rowStart:1,rowEnd:2,colStart:1,colEnd:2},{rowStart:1,rowEnd:2,colStart:2,colEnd:3},{rowStart:1,rowEnd:2,colStart:3,colEnd:4},{rowStart:1,rowEnd:2,colStart:4,colEnd:5},{rowStart:2,rowEnd:3,colStart:1,colEnd:2},{rowStart:2,rowEnd:4,colStart:2,colEnd:4},{rowStart:2,rowEnd:3,colStart:4,colEnd:5},{rowStart:3,rowEnd:4,colStart:1,colEnd:2},{rowStart:3,rowEnd:4,colStart:4,colEnd:5},{rowStart:4,rowEnd:5,colStart:1,colEnd:2},{rowStart:4,rowEnd:5,colStart:2,colEnd:3},{rowStart:4,rowEnd:5,colStart:3,colEnd:4},{rowStart:4,rowEnd:5,colStart:4,colEnd:5}] },
  '16':  { layout:'4|4', cells:Array.from({length:16},(_,i)=>({rowStart:Math.floor(i/4)+1,rowEnd:Math.floor(i/4)+2,colStart:(i%4)+1,colEnd:(i%4)+2})) },
  '25':  { layout:'5|5', cells:Array.from({length:25},(_,i)=>({rowStart:Math.floor(i/5)+1,rowEnd:Math.floor(i/5)+2,colStart:(i%5)+1,colEnd:(i%5)+2})) },
}

// ─── computeCellStyle ─────────────────────────────────────────────────────
const computeCellStyle = (cell: GridCell) => {
  if (expandedCellId.value === cell.id)
    return { position:'absolute', top:'0', left:'0', width:'100%', height:'100%', zIndex:'10' }
  const [rows, cols] = layoutType.value.split('|').map(Number)
  const rH = 100 / rows, cW = 100 / cols
  const rSpan = cell.rowEnd - cell.rowStart, cSpan = cell.colEnd - cell.colStart
  return {
    position: 'absolute',
    top:    `${(cell.rowStart-1)*rH}%`,
    left:   `${(cell.colStart-1)*cW}%`,
    width:  `calc(${cW*cSpan}% - 1px)`,
    height: `calc(${rH*rSpan}% - 1px)`,
    boxSizing: 'border-box',
    border: selectedCellId.value === cell.id ? '2px solid #f44336' : '1px solid #2a2a2a',
    overflow: 'hidden',
  }
}

// ─── changeLayout ─────────────────────────────────────────────────────────
const changeLayout = (key: string | number) => {
  const def = layoutDefs[String(key)]
  if (!def) return

  const newCells = def.cells.map(d => ({
    id: `${d.rowStart}-${d.colStart}`,
    rowStart: d.rowStart, rowEnd: d.rowEnd,
    colStart: d.colStart, colEnd: d.colEnd,
    merged: (d.rowEnd - d.rowStart > 1) || (d.colEnd - d.colStart > 1)
  }))
  const newCellIds = new Set(newCells.map(c => c.id))

  // 销毁新布局里不存在的格子的播放器（其余格子因 :key="cell.id" 由 Vue 保留 DOM）
  ;[...cameraMap.value.keys()].forEach(cellId => {
    if (!newCellIds.has(cellId)) clearCell(cellId)
  })

  layoutType.value = def.layout
  gridCells.value = newCells
  LiveplayShow.value = true
  savePlayingState()
}
const applyCustomLayout = (item: any) => {
  if (!item?.setting?.layoutView) return
  const cells: GridCell[] = item.setting.layoutView
    .filter((c: any) => !(c.spannedUpon))
    .map((c: any) => ({
      id: `${c.rowStart}-${c.colStart}`,
      rowStart: c.rowStart, rowEnd: c.rowEnd, colStart: c.colStart, colEnd: c.colEnd,
      merged: (c.rowEnd - c.rowStart > 1) || (c.colEnd - c.colStart > 1)
    }))
  clearAllPlayers()
  layoutType.value = item.layoutType ?? '3|3'
  gridCells.value = cells
  LiveplayShow.value = true
}

// ─── Tree loading ─────────────────────────────────────────────────────────
const flattenRoot = (parts: any[]): TreeNode[] => {
  const out: TreeNode[] = []
  parts.forEach(p => {
    if (p.children?.length) out.push(...flattenRoot(p.children))
    p.dev?.forEach((d: any) => out.push({
      id: `dev_${d.devId}`, label: d.name, type: 'device', online: d.online, data: d,
      children: [{ id: 'placeholder', label: '', type: 'device', data: null }], isLeaf: false
    }))
    p.view?.forEach((v: any) => out.push({
      id: `view_${v.viewId}`, label: v.viewName, type: 'view', data: v, isLeaf: true
    }))
  })
  return out
}

const loadTree = async () => {
  const res = await GetDevPartitionApi()
  if (res.status !== 200 || res.data.code !== 0) return
  const list = flattenRoot(res.data.result)
  const devices = list.filter(n => n.type === 'device' && n.data?.token)
  for (let i = 0; i < devices.length; i += 3) {
    await Promise.allSettled(devices.slice(i, i + 3).map(async item => {
      if (deviceCache.has(item.data.token)) {
        const c = deviceCache.get(item.data.token)!
        item.children = c.length ? c : undefined; item.isLeaf = !c.length; return
      }
      const r = await GetDeviceChannels(item.data.token)
      if (r.status === 200 && r.data.code === 0 && r.data.result.length) {
        const chs = r.data.result.map((ch: any, i: number) => ({
          id: `ch_${item.data.devId}_${i}`, label: ch.name || `ch ${i+1}`,
          type: 'device', data: ch, isLeaf: true, isDeviceChannel: true, online: ch.online
        }))
        deviceCache.set(item.data.token, chs); item.children = chs; item.isLeaf = false
        item.totalCount = chs.length
        item.onlineCount = chs.filter((c: any) => c.online).length
      } else { deviceCache.set(item.data.token, []); item.children = undefined; item.isLeaf = true }
    }))
  }
  const keys = list.filter(n => n.type === 'device' && !n.isDeviceChannel).map(n => n.id)
  expandedKeys.value = keys
  treeData.value = list
}

const refreshTree = () => { deviceCache.clear(); loadTree() }
const toggleTreeFold = () => {
  isTreeFold.value = !isTreeFold.value
  const left  = document.querySelector('.view-left')  as HTMLElement | null
  const right = document.querySelector('.view-right') as HTMLElement | null
  if (left && right) {
    left.style.flex   = isTreeFold.value ? '0 0 0%'  : '0 0 15%'
    right.style.width = isTreeFold.value ? '100%'     : 'calc(100% - 15%)'
  }
}
const filterTreeNode = (query: string, data: TreeNode) => !query || (data.label?.includes(query) ?? false)
watch(filterText, v => treeRef.value?.filter(v))
const getNodeIcon = (n: TreeNode) => {
  if (n.type === 'view') return 'icon-shitu2'
  if (n.isDeviceChannel || n.isLeaf) return 'icon-shexiangjizaixian'
  if (n.type === 'device') return 'icon-Device'
  return 'icon-gen'
}
const getNodeClass = (n: TreeNode) => {
  if (n.type !== 'device') return ''
  return (n.online ?? n.data?.online) ? 'device-online' : 'device-offline'
}
const isNodePlaying = (n: TreeNode) => playingNodeIds.value.includes(n.id)

// Next-empty-cell cursor for click-to-place (mirrors uscweb selectedCellId cycling)
const nextCellIndex = ref(0)
const onNodeClick = async (data: TreeNode) => {
  if (data.type === 'view' && data.data?.viewId) {
    await loadViewIntoGrid(data.data.viewId, data.id)
  } else if ((data.isDeviceChannel || data.isLeaf) && data.data?.token) {
    const emptyCells = gridCells.value.filter(c => !getCellCamera(c.id))
    if (!emptyCells.length) return
    const cell = emptyCells[nextCellIndex.value % emptyCells.length]
    nextCellIndex.value++
    await placeCamera(cell.id, data.data, data.id)
  }
}
const onDragStart = (node: any) => {
  const d = node.data
  if (d?.type === 'view') {
    window._viewDrag = { viewId: d.data?.viewId, nodeId: d.id }
  } else if (d?.data?.token) {
    window._viewDrag = { channel: d.data, nodeId: d.id }
  }
}


// ─── Player management ────────────────────────────────────────────────────
const getCellCamera = (cellId: string): CameraConf | undefined => cameraMap.value.get(cellId)

const placeCamera = async (cellId: string, ch: any, nodeId?: string) => {
  if (!LiveplayShow.value) { changeLayout('4') }
  await nextTick()
  // Destroy existing player in this cell
  if (playerMap.has(cellId)) { try { playerMap.get(cellId)?.destroy?.() } catch(e){} ; playerMap.delete(cellId) }
  const vidId = uuid(8)
  const apiProtocol = userStore.IPPORT?.startsWith('https') ? 'https:' : window.location.protocol
  const conf = {
    videoid: vidId, protocol: apiProtocol, host: userStore.WSROOT,
    token: ch.token, session: userStore.session, accessToken: userStore.Access_token,
    name: ch.name ?? ch.label, label: ch.name ?? ch.label,
    resourceUUID: ch.uuid ?? ch.resourceUUID,
    liveVideoType: store.liveviewrtc, recording: ch.recording ?? false,
    meta: false,
    serverpb: store.DefaultStorage === 'CentralStorage' ? 'true' : 'false',
  }
  cameraMap.value.set(cellId, { token: ch.token, name: conf.name, resourceUUID: conf.resourceUUID, videoid: vidId, layoutPosition: `h${cellId}`, recording: conf.recording, nodeId })
  // Update liveviewViewadd (mirrors uscweb)
  liveviewViewadd.value = liveviewViewadd.value.filter(x => x.strIndex !== `h${cellId}`)
  liveviewViewadd.value.push({ strIndex: `h${cellId}`, token: ch.token, resourceUUID: conf.resourceUUID, profile: 'main' })
  if (nodeId) { if (!playingNodeIds.value.includes(nodeId)) playingNodeIds.value.push(nodeId) }
  await nextTick()
  const container = document.getElementById('h' + cellId)
  if (!container) { console.warn('[placeCamera] container h%s not found', cellId); return }
  try {
    const player = new UPlayerSDKClass('h' + cellId, conf)
    playerMap.set(cellId, player)
    player.play()
    // 回放模式下拖入新摄像头：立刻调 moveto 同步到当前回放时间
    if (!isLiveview.value) {
      try { player.livePlayer?.moveto(xzvalue.value) } catch(e) {}
    }
    savePlayingState()
  } catch(e) { console.error('[placeCamera] error', e) }
}

const clearCell = (cellId: string) => {
  if (playerMap.has(cellId)) { try { playerMap.get(cellId)?.destroy?.() } catch(e){} ; playerMap.delete(cellId) }
  const cam = cameraMap.value.get(cellId)
  if (cam) {
    liveviewViewadd.value = liveviewViewadd.value.filter(x => x.strIndex !== `h${cellId}`)
    // 只移除这一格对应的 nodeId（如果同一个 token 在其他格还在播，则保留）
    const stillPlaying = [...cameraMap.value.entries()].some(([id, c]) => id !== cellId && c.token === cam.token)
    if (!stillPlaying && cam.nodeId) {
      playingNodeIds.value = playingNodeIds.value.filter(x => x !== cam.nodeId)
    }
    cameraMap.value.delete(cellId)
    savePlayingState()
  }
  if (selectedCellId.value === cellId) selectedCellId.value = ''
  if (expandedCellId.value === cellId) expandedCellId.value = ''
}

const clearAllPlayers = () => {
  playerMap.forEach(p => { try { p?.destroy?.() } catch(e){} })
  playerMap.clear(); cameraMap.value.clear(); liveviewViewadd.value = []; playingNodeIds.value = []
  selectedCellId.value = ''; expandedCellId.value = ''
  UPlayerList.value = null   // 丢弃引用，不 destroyAll（player 已在上面 destroy）
  isPlaying.value = false; isLiveview.value = true
  localStorage.removeItem('hpro-view-state')  // 显式清除（用户点 × 时需要）
}

// ─── Playing state persistence ────────────────────────────────────────────
const savePlayingState = () => {
  const cameras: any[] = []
  cameraMap.value.forEach((cam, cellId) => {
    cameras.push({ cellId, token: cam.token, name: cam.name, resourceUUID: cam.resourceUUID, recording: cam.recording, nodeId: cam.nodeId })
  })
  if (!cameras.length) {
    // 没有摄像头时：实时模式才清除key；回放模式保留key以便刷新后恢复
    if (isLiveview.value) { localStorage.removeItem('hpro-view-state'); return }
    localStorage.setItem('hpro-view-state', JSON.stringify({
      layoutType: layoutType.value, gridCells: gridCells.value, isLiveview: false, cameras: [],
    }))
    return
  }
  localStorage.setItem('hpro-view-state', JSON.stringify({
    layoutType: layoutType.value,
    gridCells: gridCells.value,
    isLiveview: isLiveview.value,
    cameras,
  }))
}

const restorePlayingState = async () => {
  const raw = localStorage.getItem('hpro-view-state')
  if (!raw) return
  try {
    const state = JSON.parse(raw)
    if (state.layoutType) layoutType.value = state.layoutType
    if (state.gridCells?.length) gridCells.value = state.gridCells
    // 有摄像头时才恢复画面
    if (state.cameras?.length) {
      await nextTick()
      for (const cam of state.cameras) {
        await placeCamera(cam.cellId, {
          token: cam.token, name: cam.name,
          uuid: cam.resourceUUID, resourceUUID: cam.resourceUUID,
          recording: cam.recording ?? false,
        }, cam.nodeId)
      }
    }
    // 恢复播放模式（刷新后保持回放/实时状态）
    if (state.isLiveview === false) {
      await setLiveMode(false)
    }
  } catch(e) { console.warn('restorePlayingState error', e) }
}

// ─── Cell interaction ─────────────────────────────────────────────────────
const selectCell = (cellId: string) => { selectedCellId.value = cellId }
const toggleExpand = (cellId: string) => {
  expandedCellId.value = expandedCellId.value === cellId ? '' : cellId
}

// ─── Drag & Drop ──────────────────────────────────────────────────────────
const dropOnCell = async (e: DragEvent, cellId: string) => {
  const drag = (window as any)._viewDrag
  if (!drag) return
  ;(window as any)._viewDrag = null
  if (drag.channel) {
    await placeCamera(cellId, drag.channel, drag.nodeId)
  } else if (drag.viewId) {
    await loadViewIntoGrid(drag.viewId, drag.nodeId)
  }
}


// ─── Load view into grid ──────────────────────────────────────────────────
const loadViewIntoGrid = async (viewId: string | number, nodeId?: string) => {
  const res = await GetViewApi(viewId)
  if (res.status !== 200 || res.data.code !== 0) return
  const result = res.data.result
  currentView.value = result

  // 加载新视图前先清空当前所有播放器
  clearAllPlayers()

  // Determine layout key from layoutType string (e.g. "3|3" → 9 cells)
  const ltStr = result.layout?.setting?.layoutView ? result.layout.layoutType : '2|2'
  const defKey = Object.keys(layoutDefs).find(k => layoutDefs[k].layout === ltStr) ?? '4'
  changeLayout(defKey)
  layoutType.value = ltStr
  // Rebuild cells from server layout
  if (result.layout?.setting?.layoutView) {
    const serverCells: GridCell[] = result.layout.setting.layoutView
      .filter((c: any) => !c.spannedUpon)
      .map((c: any) => ({ id: `${c.rowStart}-${c.colStart}`, rowStart: c.rowStart, rowEnd: c.rowEnd, colStart: c.colStart, colEnd: c.colEnd, merged: c.merged ?? false }))
    gridCells.value = serverCells
  }
  LiveplayShow.value = true
  if (nodeId) playingNodeIds.value = [nodeId]

  // Place cameras from viewEntity
  await nextTick()
  console.log('[loadView] viewEntity:', result.viewEntity)
  if (result.viewEntity?.length) {
    for (const entity of result.viewEntity) {
      console.log('[loadView] entity:', entity.entityType, 'Channel:', entity.Channel, 'pos:', entity.layoutPosition)
      if (entity.entityType !== 'USC_VIEW_CAMERA' || !entity.Channel?.token) continue
      // Convert layoutPosition "h1-1" → cellId "1-1"
      const cellId = entity.layoutPosition?.replace(/^h/, '') ?? ''
      const cellExists = gridCells.value.find(c => c.id === cellId)
      console.log('[loadView] cellId:', cellId, 'exists:', !!cellExists, 'container:', document.getElementById('h' + cellId))
      if (!cellId || !cellExists) continue
      await placeCamera(cellId, {
        token: entity.Channel.token, name: entity.Channel.name,
        uuid: entity.resourceUUID, recording: entity.Channel.recording ?? false
      })
    }
  }
}

// ─── Save view ────────────────────────────────────────────────────────────
const saveView = async () => {
  if (!currentView.value) return
  const viewEntity = liveviewViewadd.value.map(item => ({
    entityType: 'USC_VIEW_CAMERA',
    layoutPosition: item.strIndex,
    resourceUUID: item.resourceUUID,
    profile: item.profile ?? 'main'
  }))
  const res = await UpdateViewApi({ ...currentView.value, viewEntity })
  if (res.status === 200 && res.data.code === 0) {
    currentView.value.viewEntity = viewEntity
    ElMessage.success(t('CommTableEdit.comm_modify_success'))
  } else ElMessage.error(t('CommTableEdit.comm_modify_failed'))
}

// ─── Partition loader ─────────────────────────────────────────────────────
const loadPartitionList = async () => {
  if (partitionList.value.length > 1) return
  const res = await GetDevPartitionApi()
  if (res.status !== 200 || res.data.code !== 0) return
  const flat: Array<{id:number; name:string}> = []
  const walk = (nodes: any[]) => nodes.forEach(n => {
    if (n.devPartitionId) flat.push({ id: n.devPartitionId, name: n.devPartitionName ?? n.name ?? 'Partition' })
    if (n.children?.length) walk(n.children)
  })
  walk(res.data.result)
  if (flat.length) partitionList.value = flat
}
const loadLayoutList = async () => {
  const res = await GetLayoutListApi()
  if (res.status === 200 && res.data.code === 0) {
    layoutList.value = res.data.result ?? []
    console.log('[View] layoutList loaded:', layoutList.value.length, 'items', layoutList.value)
    drawCanvas()
  }
}

// ─── Add / Edit / Delete view ─────────────────────────────────────────────
const openAddDialog = async () => {
  await Promise.all([loadPartitionList(), loadLayoutList()])
  Object.assign(viewForm, { viewName:'', viewType:'USC_VIEW_PUBLIC', layoutId: layoutList.value[0]?.layoutId ?? 0, devPartitionId: partitionList.value[0]?.id ?? 10000, devPartitionName: partitionList.value[0]?.name ?? '' })
  addDialogVisible.value = true
}
const submitAddView = async () => {
  if (!viewForm.viewName.trim()) { ElMessage.warning(t('Liveview.live_view_name')); return }
  const res = await CreateViewApi({ viewName: viewForm.viewName, viewType: viewForm.viewType, layoutId: viewForm.layoutId, devPartitionId: viewForm.devPartitionId, devPartitionName: viewForm.devPartitionName, viewEntity: [] })
  if (res.status === 200 && res.data.code === 0) {
    ElMessage.success(t('CommTableEdit.comm_add_successfully'))
    addDialogVisible.value = false; deviceCache.clear(); loadTree()
  } else ElMessage.error(t('CommTableEdit.comm_add_failed'))
}
const openEditDialog = async () => {
  if (!currentView.value) return
  await loadPartitionList()
  Object.assign(editForm, { viewId: currentView.value.viewId, viewName: currentView.value.viewName, viewType: currentView.value.viewType, layoutId: currentView.value.layoutId, devPartitionId: currentView.value.devPartitionId ?? 10000, devPartitionName: currentView.value.devPartitionName ?? '' })
  editDialogVisible.value = true
}
const submitEditView = async () => {
  const res = await UpdateViewApi({ ...editForm, viewEntity: currentView.value?.viewEntity ?? [] })
  if (res.status === 200 && res.data.code === 0) {
    ElMessage.success(t('CommTableEdit.comm_modify_success'))
    editDialogVisible.value = false
    if (currentView.value) { currentView.value.viewName = editForm.viewName; currentView.value.viewType = editForm.viewType }
    deviceCache.clear(); loadTree()
  } else ElMessage.error(t('CommTableEdit.comm_modify_failed'))
}
const deleteCurrentView = async () => {
  if (!currentView.value) { ElMessage.warning(t('CommTableEdit.comm_prompt')); return }
  try {
    await ElMessageBox.confirm(t('CommTableEdit.comm_delete_confirm'), t('CommTableEdit.comm_prompt'), { type:'warning' })
    const res = await DeleteViewApi([currentView.value.viewId])
    if (res.status === 200 && res.data.code === 0) {
      ElMessage.success(t('CommTableEdit.comm_delete_successfully'))
      currentView.value = null; clearAllPlayers(); LiveplayShow.value = false
      deviceCache.clear(); loadTree()
    } else ElMessage.error(t('CommTableEdit.comm_delete_failed'))
  } catch { /* cancelled */ }
}

// ─── Layout management dialog ─────────────────────────────────────────────
// ─── Canvas thumbnail (mirrors uscweb Canvas()) ───────────────────────────
const drawCanvas = () => {
  layoutList.value.forEach((item: any, index: number) => {
    nextTick(() => {
      const canvas = document.getElementById('viewCanvas' + index) as HTMLCanvasElement | null
      if (!canvas?.getContext) return
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const [rows, cols] = (item.layoutType ?? '3|3').split('|').map(Number)
      const cellW = canvas.width / cols
      const cellH = canvas.height / rows
      ;(item.setting?.layoutView ?? []).forEach((cell: any) => {
        const x = (cell.colStart - 1) * cellW
        const y = (cell.rowStart - 1) * cellH
        const w  = (cell.colEnd  - cell.colStart) * cellW
        const h  = (cell.rowEnd  - cell.rowStart) * cellH
        ctx.fillStyle   = '#999999'
        ctx.fillRect(x, y, w, h)
        ctx.strokeStyle = 'rgb(35,35,35)'
        ctx.lineWidth   = 1
        ctx.strokeRect(x, y, w, h)
      })
    })
  })
}

const loadCustomLayouts = async () => { await loadLayoutList() }
const openLayoutMgmtDialog = async () => {
  await loadLayoutList(); selectedLayoutId.value = null; showGird1.value = false
  layoutMgmtVisible.value = true
}
const deleteCustomLayout = async () => {
  if (!selectedLayoutId.value) return
  const res = await DeleteLayoutApi([selectedLayoutId.value])
  if (res.status === 200 && res.data.code === 0) { await loadLayoutList(); selectedLayoutId.value = null }
}
const restoreDefaultLayouts = async () => { await loadLayoutList() }
const onLayoutData = async (data: { layoutType:string; rows:number; cols:number; grid:any[] }) => {
  if (!customLayoutForm.layoutName.trim()) { ElMessage.warning(t('Liveview.live_view_name')); return }
  const setting = { layoutView: data.grid.map((c:any) => ({ position:`${c.rowStart}-${c.colStart}`, rowStart:c.rowStart, rowEnd:c.rowEnd, colStart:c.colStart, colEnd:c.colEnd, merged:c.merged })) }
  const res = await CreateLayoutApi({ layoutName: customLayoutForm.layoutName, layoutType: data.layoutType, setting })
  if (res.status === 200 && res.data.code === 0) {
    ElMessage.success(t('CommTableEdit.comm_add_successfully'))
    showGird1.value = false; gird1Ref.value?.resetToDefault?.()
    await loadLayoutList()
  } else ElMessage.error(t('CommTableEdit.comm_add_failed'))
}
const submitCustomLayout = () => { gird1Ref.value?.getLayoutData() }

// ─── Live / Playback toggle ───────────────────────────────────────────────
const setLiveMode = async (live: boolean) => {
  isLiveview.value = live
  if (live) {
    // 切回实时：先断开 livePlayer 当前连接再重连，确保从回放态正确切回直播
    playerMap.forEach(player => {
      try {
        player.livePlayer?.disconnect?.()
        player.play()
      } catch(e) {}
    })
    isPlaying.value = true
  } else {
    // 切到回放：初始化 UPlayerList（仅用于时间轴显示），定位到今天零点
    await nextTick()
    try {
      if (!UPlayerList.value) {
        UPlayerList.value = new UPlayerListClass('#view-timeline-svg')

        // 屏蔽 UPlayerList 内部的 SegmentPlayer 路径（SearchObjRecordByTime 不适用）
        UPlayerList.value.setAllPosition = async () => {}
        UPlayerList.value.playAll      = () => {}

        // 时间轴拖拽结束 → moveto（对照 uscweb Advancepb.vue mouseup → v1.moveto(timevalue)）
        UPlayerList.value.timeline?.addEventListener('resume', async (e: CustomEvent) => {
          const t: Date = e.detail instanceof Date ? e.detail : new Date(e.detail)
          xzvalue.value = t
          if (UPlayerList.value?.timeline) {
            UPlayerList.value.timeline.currentTime = t
            UPlayerList.value.timeline.updateTimelineView?.()
          }
          // 传 ISO 字符串（strMovetoTime 字段名的 str 前缀表示服务端期望字符串格式）
          const iso = t.toISOString()
          playerMap.forEach(player => {
            try { player.livePlayer?.moveto(iso) } catch(err) {}
          })
          isPlaying.value = true
          // 查录像色块
          await loadRecordingBars(t)
        })

        // 时间轴拖拽开始 → pause
        UPlayerList.value.timeline?.addEventListener('pause', () => {
          isPlaying.value = false
        })
      }

      const midnight = new Date()
      midnight.setHours(0, 0, 0, 0)
      xzvalue.value = midnight
      if (UPlayerList.value?.timeline) {
        UPlayerList.value.timeline.currentTime = midnight
        UPlayerList.value.timeline.updateTimelineView?.()
      }
      // 初始化时加载今天的录像色块
      await loadRecordingBars(midnight)
    } catch(e) {
      console.error('[setLiveMode] playback init error', e)
    }
    isPlaying.value = false
  }
  savePlayingState()
}

// ─── 查录像时间段并更新时间轴色块 ────────────────────────────────────────
const loadRecordingBars = async (date: Date) => {
  const token = [...cameraMap.value.values()][0]?.token
  if (!token || !UPlayerList.value?.timeline) return
  // 查该日 00:00:00 ~ 23:59:59 的录像段（对照 uscweb：start=前一天, end=后一天）
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
  const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999)
  try {
    const api = store.DefaultStorage === 'CentralStorage'
      ? getSearchStorRecordByTimeApi(token, dayStart.toISOString(), dayEnd.toISOString())
      : getSearchDeviceRecordByTimeApi(token, dayStart.toISOString(), dayEnd.toISOString())
    const res = await api
    if (res.status === 200 && res.data?.record?.length) {
      const bars = res.data.record.map((item: any) => ({
        start: new Date(item.strStartTime ?? item.startTime ?? item.StartTime),
        end:   new Date(item.strEndTime   ?? item.endTime   ?? item.EndTime),
      }))
      UPlayerList.value?.timeline?.setEventBar?.(bars)
    }
  } catch(e) { /* 查录像失败不影响播放 */ }
}

// ─── 日期选择器变更 → moveto（对照 uscweb Advancepb.vue mouseup）─────────
const onDateChange = async () => {
  const t = xzvalue.value
  if (!t) return
  if (UPlayerList.value?.timeline) {
    UPlayerList.value.timeline.currentTime = t
    UPlayerList.value.timeline.updateTimelineView?.()
  }
  const iso = t.toISOString()
  playerMap.forEach(player => {
    try { player.livePlayer?.moveto(iso) } catch(e) {}
  })
  isPlaying.value = true
  await loadRecordingBars(t)
}

const timeSpeed = (speed: string) => {
  if (isLiveview.value || !UPlayerList.value?.UPlayerSDKList?.length) return
  UPlayerList.value.setAllPlaybackRate(speed)
}

const resumePlayback = () => {
  if (isLiveview.value) return
  if (isPlaying.value) {
    // 暂停：对照 uscweb pauseAll
    playerMap.forEach(player => { try { player.livePlayer?.pause?.() } catch(e) {} })
  } else {
    // 继续：对照 uscweb resume
    playerMap.forEach(player => { try { player.livePlayer?.resume?.() } catch(e) {} })
  }
  isPlaying.value = !isPlaying.value
}

// ─── Segment export (片段导出) ───────────────────────────────────────────
const croppingEnabled = ref(false)
const croppingForm = reactive({
  label: '',
  token: '',
  startTime: new Date(new Date().setHours(0, 0, 0, 0)),
  endTime: new Date(new Date().setHours(0, 30, 0, 0)),
})
const croppingWS2List: any[] = []

const toggleCropping = () => {
  const cellId = selectedCellId.value || [...cameraMap.value.keys()][0]
  if (!cellId) return
  const cam = cameraMap.value.get(cellId)
  if (!cam) return
  croppingEnabled.value = !croppingEnabled.value
  if (croppingEnabled.value) {
    croppingForm.label = cam.name
    croppingForm.token = cam.token
    // 默认截取当前时间前后30分钟
    const base = xzvalue.value ? new Date(xzvalue.value) : new Date()
    croppingForm.startTime = new Date(base.getTime() - 30 * 60 * 1000)
    croppingForm.endTime = new Date(base.getTime())
  }
}

const formatTime = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  const tz = -d.getTimezoneOffset()
  const sign = tz >= 0 ? '+' : '-'
  const tzH = pad(Math.floor(Math.abs(tz) / 60))
  const tzM = pad(Math.abs(tz) % 60)
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${tzH}:${tzM}`
}

const doExport = () => {
  console.log('[doExport] token=%s start=%s end=%s', croppingForm.token, croppingForm.startTime, croppingForm.endTime)
  if (!croppingForm.token) { console.warn('[doExport] no token'); return }
  if (croppingForm.endTime <= croppingForm.startTime) {
    ElMessage.warning('结束时间不能早于开始时间')
    return
  }
  croppingEnabled.value = false
  const begin = formatTime(new Date(croppingForm.startTime))
  const end   = formatTime(new Date(croppingForm.endTime))
  const apiProtocol = userStore.IPPORT?.startsWith('https') ? 'https:' : window.location.protocol
  const mp4writerconf = {
    callback: (data: string) => {
      try {
        const msg = JSON.parse(data)
        if (msg.type === 'H5S_MP4_WRITER_CLOSE') ElMessage.success('导出完成')
        if (msg.type === 'H5S_MP4_WRITER_FAIL') ElMessage.error('导出失败')
      } catch(e) {}
    },
    begintime: begin,
    endtime: end,
    mp4writer: 'true',
    mp4name: `${croppingForm.token}-${begin.replace(/[:\+]/g, '-')}.mp4`,
    serverpb: store.DefaultStorage === 'CentralStorage' ? 'true' : 'false',
  }
  const ws2: any = new H5sPlayerWS2({
    protocol: apiProtocol,
    host: userStore.WSROOT,
    rootpath: '/',
    token: croppingForm.token,
    streamprofile: 'main',
    session: userStore.session,
    meta: 'false',
    buffersize: '0',
    h264cpumode: 'true',
    consolelog: 'false',
    mp4writerconf,
  })
  ws2.connect()
  setTimeout(() => { try { ws2.speed('4.0') } catch(e){} }, 1000)
  croppingWS2List.push(ws2)
  ElMessage.info('开始导出片段，请稍候…')
}


const gotoLive = async () => {
  // 对照 uscweb：player.play() 重连直播流
  playerMap.forEach(player => { try { player.play() } catch(e) {} })
  isLiveview.value = true; isPlaying.value = true
}

// ─── Storage type switch (CentralStorage / DeviceStorage) ────────────────
const rebuildPlaybackPlayers = () => {
  // 切换存储类型后，重建所有格子的播放器（以新的 serverpb 参数生效）
  if (isLiveview.value) return
  const entries = [...cameraMap.value.entries()]
  entries.forEach(([cellId, cam]) => {
    placeCamera(cellId, {
      token: cam.token, name: cam.name,
      uuid: cam.resourceUUID, resourceUUID: cam.resourceUUID,
      recording: cam.recording,
    }, cam.nodeId)
  })
}

const setStorageCentral = async () => {
  if (store.DefaultStorage === 'CentralStorage') return
  store.setDefaultStorage('CentralStorage')
  try { await UpdateUserConfigApi({ key: 'DefaultStorage', value: 'CentralStorage' }) } catch(e) {}
  rebuildPlaybackPlayers()
}

const setStorageDevice = async () => {
  if (store.DefaultStorage === 'DeviceStorage') return
  store.setDefaultStorage('DeviceStorage')
  try { await UpdateUserConfigApi({ key: 'DefaultStorage', value: 'DeviceStorage' }) } catch(e) {}
  rebuildPlaybackPlayers()
}

// ─── Fullscreen ───────────────────────────────────────────────────────────
const toggleFullscreen = () => {
  // 只全屏视频网格区域（对照GridCloudView panelFullScreen）
  const el: any = document.getElementById('video_hed')
  const doc: any = document
  if (!el) return
  if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement) {
    ;(doc.exitFullscreen ?? doc.webkitExitFullscreen ?? doc.mozCancelFullScreen)?.call(doc)
  } else {
    ;(el.requestFullscreen ?? el.webkitRequestFullscreen ?? el.mozRequestFullScreen)?.call(el)
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────
onMounted(async () => {
  loadTree()
  loadLayoutList()
  await restorePlayingState()
})
onBeforeUnmount(() => {
  // 只销毁播放器内存，不清 localStorage（下次挂载时 restorePlayingState 可以恢复）
  playerMap.forEach(p => { try { p?.destroy?.() } catch(e){} })
  playerMap.clear()
  UPlayerList.value = null
})
</script>

<style lang="scss" scoped>
.view-page {
  width: 100vw; height: calc(100vh - 30px); display: flex; overflow: hidden; position: relative;
}
.view-left {
  flex: 0 0 15%; height: 100%; background: #252525; overflow: hidden; transition: flex 0.2s;
  &.folded { flex: 0 0 0%; }
  .search-bar {
    height: 50px; background: #1B1B1B; display: flex; align-items: center; padding: 0 8px; gap: 8px;
    .tree-search { flex: 1; :deep(.el-input__wrapper) { background: #232323; box-shadow: none; .el-input__inner { color: #fff; } } }
    .fold-btn { font-size: 18px; cursor: pointer; }
  }
  .collapse-title { display: flex; justify-content: space-between; width: 90%; align-items: center; padding-left: 10px; }
  .tree-node { width: 100%; display: flex; align-items: center; justify-content: space-between; }
  .node-playing-label { color: #30d158; }
  .node-playing {
    display: flex; align-items: center;
    font-size: 12px; color: #30d158;
    padding-left: 4px; padding-right: 8px; flex-shrink: 0;
    .dot { font-size: 12px; padding-right: 4px; }
  }
  .device-offline { opacity: 0.6; }
  :deep(.el-collapse) { border: 0;
    .el-collapse-item__header { background: #303030; border: 0; color: #fff; font-size: 14px; height: 36px; line-height: 36px; }
    .el-collapse-item__wrap { background: transparent; border: 0;
      .el-collapse-item__content { padding: 0 10px; }
    }
    .el-tree { background: transparent; font-size: 13px;
      .el-tree-node__content {
        min-height: 26px; height: auto;
        &:hover { background: rgba(255,255,255,0.1); }
      }
    }
  }
}
.view-right {
  flex: 1; display: flex; flex-direction: column; overflow: hidden;
}
.liveview_footer {
  height: 42px; background: #252525; display: flex; align-items: center;
  flex-shrink: 0;
  .BlankPlaceholder { flex: 1; }   // 左侧占满剩余空间
  // 实时/回放切换居中
  .show-play-replay {
    display: flex; align-items: center;
    .changeLiveReplay {
      width: 60px; height: 22px; border-radius: 4px; text-align: center;
      line-height: 22px; cursor: pointer; font-size: 13px;
      &.live   { color: #0399FE; background: rgba(3,153,254,0.15); }
      &.replay { color: #888;   background: transparent; }
    }
  }
  .footer-right {
    flex: 1; display: flex; align-items: center; justify-content: flex-end;
    padding-right: 30px; gap: 4px;
    button {
      padding: 0; border: none; background: none; box-shadow: none;
      font-size: 22px; color: #fff; cursor: pointer;
      &:hover { color: #0399FE; }
    }
  }
  .view-name-badge { color: #0399FE; font-size: 12px; margin-right: 6px; }
}
.liveview_right_video_hed {
  flex: 1; position: relative; background: #1a1a1a; overflow: hidden;
}
.video-empty-hint {
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: #555; font-size: 14px;
}
// 时间轴控制区 — 完全对照 GridCloudView.vue
.control_area {
  width: 100%; display: flex; flex-direction: column; flex-shrink: 0;
  .Cropping {
    background: #282828; padding: 12px 16px; border-bottom: 1px solid #3a3a3a;
    .Cropping_title {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 10px; font-size: 14px; color: #fff;
      i { cursor: pointer; font-size: 18px; &:hover { color: #0399FE; } }
    }
    .Cropping_content { :deep(.el-form-item) { margin-bottom: 8px; } }
    :deep(.el-input__wrapper), :deep(.el-input__inner) { background: #1e1e1e; color: #fff; }
    :deep(.fixed_input .el-input__wrapper) { background: #1e1e1e; border: 0; box-shadow: none; }
  }
  .control_btns {
    flex: 1; width: 100%; background-color: #282828;
    display: flex; align-items: center; justify-content: space-between;
    .caveat_butt {
      display: flex; align-items: center; justify-content: flex-start; width: 20%;
      .recodeType { font-size: 14px; }
      .showRecodeType {
        width: 24px; height: 32px; text-align: center; line-height: 32px;
        border-radius: 4px; margin-right: 10px; background-color: #2f2f2f; cursor: pointer;
      }
      .mr-0 { width:15px; height:15px; border-radius:50px; border:0; margin-right:5px !important; vertical-align:middle; background-color:#31b1ff; }
      .mr-1 { width:15px; height:15px; border-radius:50px; border:0; margin:0 5px; vertical-align:middle; background-color:rgb(60,196,60); }
      .mr-2 { width:15px; height:15px; border-radius:50px; border:0; margin:0 5px; vertical-align:middle; background-color:#ee1011; }
    }
    .storage-switch {
      display: flex; align-items: center; font-size: 13px; color: #ccc;
      span {
        padding: 3px 12px; cursor: pointer; border: 1px solid #555;
        transition: background 0.2s, color 0.2s;
        &:first-child { border-radius: 12px 0 0 12px; border-right: none; }
        &:last-child  { border-radius: 0 12px 12px 0; }
        &.active { background: #0399FE; color: #fff; border-color: #0399FE; }
        &:not(.active):hover { background: #3a3a3a; }
      }
    }
    button { padding:0; border:none; background:none; font-size:22px; margin-right:10px; color:#fff; }
    .control-center {
      display: flex; align-items: center;
      .resume-btn i { font-size: 24px; cursor: pointer; }
      :deep(.ele) {
        width:45px; height:24px; border-radius:12px; background-color:#0399FE; margin:0; padding:0; margin-right:10px;
        .el-select__wrapper { width:100%; height:100%; line-height:24px; border:none; box-shadow:none; background-color:transparent; padding:0; text-align:center; }
        .el-select__suffix { display:none; }
      }
      :deep(.fixed_input) {
        width:120px; margin-right:20px;
        .el-input__wrapper { background-color:#121212; border:0; box-shadow:none; }
      }
    }
    .gongge-btns {
      height:50px; padding-right:20px; width:20%; display:flex; justify-content:flex-end; align-items:center;
      :deep(.goto-live) {
        font-size:14px; background-color:rgba(141,189,255,0.16); padding:0 20px;
        span { color:#0399FE; }
      }
    }
  }
}

// 时间轴容器背景
.timeline-box-view { background: #1a1a1a; }
.palace {
  background: #111; cursor: pointer;
  video { display: block; width: 100%; height: 100%; object-fit: fill; }
  .cell-label {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: rgba(0,0,0,0.6); color: #fff; font-size: 12px; padding: 2px 6px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cell-close {
    position: absolute; top: 2px; right: 4px; background: rgba(0,0,0,0.5);
    border: none; color: #fff; font-size: 16px; cursor: pointer; line-height: 1;
    padding: 0 4px; border-radius: 2px; z-index: 5;
    &:hover { background: #f44336; }
  }
  &.palace-selected { outline: 2px solid #f44336; outline-offset: -2px; }
}
.unfold-btn {
  position: absolute; left: 0; top: 0; width: 30px; height: 30px; line-height: 30px;
  text-align: center; background: rgba(124,124,124,0.5); border-radius: 0 2px 2px 0; cursor: pointer; z-index: 50;
}
.layout-picker-groups {
  padding: 8px;
  .layout-group { margin-bottom: 8px;
    .group-label { font-size: 11px; color: #888; display: block; margin-bottom: 4px; }
    .layout-btns {
      display: flex; gap: 0;
      // Mirror uscweb PanelBtns button style
      :deep(.el-button) {
        padding: 0; border: none; background: none; box-shadow: none;
        font-size: 24px; margin: 0 15px 0 0; color: inherit;
        &:hover { color: #0399FE; }
      }
    }
  }
  .layout-custom-link { border-top: 1px solid #444; padding-top: 8px; text-align: center; }
}
.layout-mgmt-bar { display: flex; justify-content: space-between; margin-bottom: 12px; }
.custom-layout-list {
  display: flex; flex-wrap: wrap; gap: 8px; min-height: 40px;
  .custom-layout-item {
    padding: 4px 10px; border: 1px solid #444; border-radius: 4px; cursor: pointer; font-size: 13px;
    &:hover { border-color: #0399FE; }
    &.selected { border-color: #0399FE; background: rgba(3,153,254,0.15); }
  }
}

// 音量控制器（完全对照 GridCloudView.vue，保证一致）
.Audio_slider-bottom {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  width: 210px;
  i { font-size: 20px; }
  :deep(.el-slider__runway) {
    height: 3px;
    background-color: rgba(73, 74, 76, 0.5) !important;
    .el-slider__bar { height: 3px; }
    .el-slider__button-wrapper {
      height: 34px; width: 36px;
      .el-slider__button {
        width: 4px; border: 1px solid #409EFF;
        height: 12px; background-color: #409eff; border-radius: 0;
      }
    }
  }
}
</style>

<style lang="scss">
/* ── GongGePopover（对照uscweb，非scoped才能命中popper-class） ── */
.GongGePopover {
  .LayoutSearch {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .SearchIcon {
      width: 32px;
      height: 32px;
      border-radius: 16px;
      line-height: 32px;
      text-align: center;
      cursor: pointer;
      &:hover { background: rgba(255,255,255,0.1); }
    }

    .snap_zuo_input {
      :deep(.el-input__wrapper) {
        background: transparent;
        box-shadow: none;
        border-bottom: 1px solid #444;
      }
    }

    .OpenLayoutDialog {
      text-align: right;
      cursor: pointer;
      color: #0399FE;
      font-size: 13px;
      white-space: nowrap;
      &:hover { text-decoration: underline; }
    }
  }

  .liveview_group.blocks {
    p {
      margin-bottom: 0 !important;
      font-size: 12px;
      padding-left: 10px;
      height: 18px;
      line-height: 18px;
    }
    .PanelBtns {
      height: 45px;
      padding-left: 12px;
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }
  }

  .ViewLayout {
    width: 60%;
    overflow-y: auto;
    padding-left: 15px;

    p { font-size: 12px; margin-bottom: 5px; }

    .LayoutCanvas {
      display: flex;
      flex-wrap: wrap;
      flex-direction: column;
      align-items: center;
      position: relative;
      cursor: pointer;
      border-radius: 4px;
      &:hover { background: #0e0e0e; }

      span {
        color: #06e8ea;
        font-size: 12px;
        max-width: 60px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: center;
      }
    }
  }
}

// 单独设置el-popover中button按钮间距（对照uscweb全局）
.liveview_group {
  button {
    padding: 0 !important;
    border: none !important;
    background: none !important;
    box-shadow: none !important;
    font-size: 24px;
    margin: 0 15px 0 0;
    color: inherit;
    &:hover { color: #0399FE; }
  }
}

/* 时间轴 SVG 全局样式（非scoped，SDK 动态注入内容需全局才能命中） */
#view-timeline-svg {
  .center-pointer line { stroke: #FEEF03; stroke-width: 2; }
  .label text { font-size: 14px; }
  .bar-name text { font-size: 12px; }
  .timeline-box { margin-top: 10px; }
  .x.axis line { stroke: #D8D8D8; }
  .x.axis text { fill: white; }
  .x.axis.minor line { stroke: #D8D8D8; }
  .x.axis.minor text { fill: #999999; }
  .domain { display: none; visibility: hidden; }
}
</style>
