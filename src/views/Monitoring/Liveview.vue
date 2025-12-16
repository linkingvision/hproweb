<template>
  <div class="live-view">
    <div class="liveview-left">
      <div class="search-container">
        <el-input class="liveview-search" :placeholder="t('Common.comm_filtration')" v-model="filterText">
          <template #suffix>
            <i class="iconfont icon-sousuo1"></i>
          </template>
        </el-input>
        <i class="iconfont icon-liebiao show-icon" @click="TreeFold"></i>
      </div>
      <el-collapse v-model="activeCollapse">
        <el-collapse-item name="device">
          <template #title>
            <div style="display: flex; justify-content: space-between; width: 90%; align-items: center; padding-left: 10px;">
              <div class="title-text" style="white-space: nowrap;">{{ t('Common.comm_device_partition') }}</div>
              <div class="liveview-colltitle" style="align-items: center;">
                <div @click.stop="refresh"><i class="iconfont icon-shuaxin"></i></div>
                <!-- <div><i class="iconfont icon-yulan"></i></div>
                <div><i class="iconfont icon-zhiding"></i></div> -->
              </div>
            </div>
          </template>
          <el-tree-v2
            style="max-width: 100%;"
            :data="channelData"
            :props="props"
            :default-expanded-keys="expandedKeys"
            node-key="id"
            :height="770"
          >
            <template #default="{ node, data }">
              <div
                draggable="true"
                @dragstart="handleDragStart(node)"
                style="display: flex; align-items: center;"
                :class="getNodeClass(data)">
                <i :class="`iconfont ${getNodeIcon(data)}`" 
                   :style="{
                     color: getNodeColor(data), 
                     marginRight: '8px', 
                     fontSize: data.type === 'device' && data.isLeaf ? '20px' : '16px'
                   }"></i>
                <span :style="{color: getNodeColor(data)}">{{ node.label }}</span>
              </div>
            </template>
          </el-tree-v2>
        </el-collapse-item>
      </el-collapse>
    </div>
    <div class="liveview-right">
      <div class="liveview_right_video_hed" id="video_hed" @dragover.prevent="dragOver($event)" @drop="dropTarget($event)">
        <!-- grid 布局单元格 -->
      </div>
      <div class="control_area" style="width: 100%;">
        <div class="timeline-box" style="width: 100%; height: 80px; padding: 0; box-sizing: border-box; border: none;">
          <svg id="timeline"></svg>
        </div>
        <div class="control_btns">
          <div class="caveat_butt">
            <div class="recodeType" v-if="showRecodeType" style="padding: 0 10px;">
              <button class="mr-0"></button>{{ t('CommTableEdit.comm_schedule') }}
              <button class="mr-1"></button>{{ t('CommTableEdit.comm_manual') }}
              <button class="mr-2"></button>{{ t('CommTableEdit.comm_alarm') }}
            </div>
            <div class="showRecodeType">
              <i class="iconfont" :class="showRecodeType ? 'icon-zuojiantou' : 'icon-youjiantou'"
                @click="showRecodeType = !showRecodeType;"></i>
            </div>
          </div>
          <div class="control-center">
            <el-date-picker class="fixed_input" v-model="xzvalue" size="small" @change="input_ch" @focus="isShow" @blur="isClose"
              :picker-options="pickerOptions" :append-to-body="false" :clearable="false" popper-class="date-picker">
            </el-date-picker>
            <el-select v-model="region" size="small" class="ele" popper-class='selectdrop' @change="timeSpeed(region)" @visible-change="timeInput" popper-style="border: 0;">
              <el-option v-for="(item, index) in regiondata" :key="index" :label="item.label" :value="item.value"></el-option>
            </el-select>
            <button class="resume-btn" @click="resume">
              <i class="iconfont" :class="isPlaying ? 'icon-zanting' : 'icon-bofang'"></i>
            </button>
          </div>
          <!-- 右侧 全部关闭、宫格切换、全屏功能 -->
          <div class="gongge-btns" style="height: 50px; padding-right: 20px; width: 17%; display: flex; justify-content: flex-end; align-items: center;">
            <el-button v-if="!isLiveview" class="goto-live" @click="gotoLive" round>{{ t('Monitoring.mon_gotolive') }}</el-button>
            <el-button class="iconfont icon-guanbi2 offAllVideo" @click="Alloffvideo"></el-button>
            <el-button class="iconfont icon-quanping1" @click="panelFullScreen($event)"></el-button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="IsTreeFold" class="TreeFold" @click="TreeFold">
      <i class="iconfont icon-liebiao"></i>
    </div>
  </div>
</template>

<script lang="ts" setup>
import $ from 'jquery'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
// import { useRoute } from 'vue-router';
import { GetDevPartitionApi } from '@/api/configuration/device';
import { GetDeviceChannels, GetDeviceList, RecEnableApi, GetRecordCalendar, setRecEnableApi } from '@/api/channel';
import { useUserStore } from '@/store/user';
import { UPlayerSDK as UPlayerSDKClass, UPlayerList as UPlayerListClass, GridLayoutManager } from '@/assets/js/uplayersdk.esm.js';
import uuid from '@/assets/js/uuid.js'
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';

interface TreeNode {
  id: string;
  label: string;
  type: 'partition' | 'device' | 'map' | 'view';
  children?: TreeNode[];
  online?: boolean;
  data: any;
  isLeaf?: boolean; // 标记是否为叶子节点
  loaded?: boolean; // 标记是否已加载过子节点
  isDeviceChannel?: boolean; // 标记是否为设备通道（展开设备后的子节点）
}

// const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()

let filterText = ref<string>('')
let activeCollapse = ref<string>('device')

let showRecodeType = ref<boolean>(false)
const channelData = ref<any>([])
const props = {
  value: 'id',
  label: 'label',
  children: 'children'
}
let expandedKeys = ref<any[]>([])  // 保持所有要默认展开的key

let IsTreeFold = ref(false) // 左侧树状容器 收起/展示

let GridManager = ref<any>(null)
let gridListener = reactive<gridListenerType>({
  closeCellHandler: null,
  changeMainSDKHandler: null,
  recEnableHandler: null,
  SnapshotHandler: null,
  InformationHandler: null,
  ShoutwheatHandler: null,
  PtzControlShowHandler: null
})
let UPlayerList = ref<any>(null)
let PlayingArr = ref<any[]>([])
let PlayBackArr = ref<any[]>([])
let isPlaying = ref<boolean>(false)

const initUPlayList = ():void => { // 初始化 UPlayerList
  UPlayerList.value = new UPlayerListClass('#timeline')
}
const initGridLayout = ():void => {
  GridManager.value = new GridLayoutManager('#video_hed', {
    padding: 20,
    aspectRatio:[16, 9],
    animationDuration: 500,
    createIcons: {
      recEnableIcon: true
    }
  })
  gridListener.closeCellHandler = (event: CustomEvent<any>) => {
    closePlayContainer(event.detail)
  }
  gridListener.recEnableHandler = (event: CustomEvent<any>) => {
    DoManualRecordStart(event.detail.id, event.detail.recEnable)
  }
  GridManager.value.addEventListener('closeCell', gridListener.closeCellHandler)
  GridManager.value.addEventListener('recEnableClick', gridListener.recEnableHandler)
}
// 开启 / 关闭手动录像
const DoManualRecordStart = async (id: string, recEnable: boolean) => {
  console.log('DoManualRecordStart =>', recEnable)
  const vid = id.slice(1);
  let manualRecEnable;
  if (recEnable) {
    manualRecEnable = false;
  } else {
    manualRecEnable = true;
  }
  const sdk = PlayingArr.value.find(item => item.conf.videoid === vid);
  if (!sdk) return;
  const res = await setRecEnableApi({
    // token: sdk.conf.token,
    // manualRecEnable
    devUUID: sdk.conf.resourceUUID,
    setting: {manualRecEnable}
  })
  if (res.status == 200 && res.data.code == 0) {
    if (manualRecEnable) {
      ElMessage({
        message: t('Monitoring.mon_start_recording'),
        type: 'success',
        duration: 2000
      })
    } else {
      ElMessage({
        message: t('Monitoring.mon_stop_recording'),
        type: 'success',
        duration: 2000
      })
    }
    GridManager.value.changeRecEnable(id, manualRecEnable)
  } else {
    if (manualRecEnable) {
      ElMessage({
        message: t('Monitoring.mon_start_recording_failed'),
        type: 'error',
        duration: 2000
      })
    } else {
      ElMessage({
        message: t('Monitoring.mon_stop_recording_failed'),
        type: 'error',
        duration: 2000
      })
    }
  }
}
// 关闭单个单元格
const closePlayContainer = (id: string) => {
  if (!UPlayerList.value) return;
  if (PlayingArr.value.length == 0) return;
  const vid = id.slice(1);
  const currentSDK = PlayingArr.value.find(sdk => sdk.conf.videoid == vid);
  if (currentSDK) {
    const SDKinPlayback = PlayBackArr.value.find(sdk => sdk.conf.videoid == vid);
    if (SDKinPlayback) {
      UPlayerList.value.removePlayer(vid);
    } else {
      currentSDK.destory()
    }
    PlayingArr.value = PlayingArr.value.filter(sdk => sdk.conf.videoid !== vid)
    PlayBackArr.value = PlayBackArr.value.filter(sdk => sdk.conf.videoid !== vid)
  }
}

const TreeFold = () => {
  IsTreeFold.value = !IsTreeFold.value;
  if (IsTreeFold.value) {
    $('.liveview-left').css('flex', '0 0 0%')
    $('.liveview-right').width('100%')
  } else {
    $('.liveview-left').css('flex', '0 0 15%')
    $('.liveview-right').width('calc(100% - 15%)')
  }
}

const getAllKeys = (data: any) => {
  const keys: any[] = [];
  data.forEach((item: any) => {
    keys.push(item.id)
    if (item.children && item.children.length) {
      keys.push(...getAllKeys(item.children))
    }
  })
  return keys;
}

const isDrag = ref<boolean>(false)
let drag = ref<any>({});
let isLiveview = ref(true)

// 设备树开始拖动设备
const handleDragStart = (node: any) => {
  console.log('handleDragStart =>', node.data.data)
  drag.value = {};
  isDrag.value = true;
  let conf = {}
  if (node.data.data.type == "H5_CH_DEV") {
    conf = {
      videoid: uuid(8),
      protocol: window.location.protocol,
      host: userStore.WSROOT,
      token: node.data.data.token,
      session: userStore.session,
      accessToken: userStore.Access_token,
      name: node.data.data.name,
      label: node.data.data.name,
      resourceUUID: node.data.data.uuid,
      liveVideoType: 'WS2',
      onPlaybackModeChange: (mode: string) => {
        console.log('onPlaybackModeChange =>', mode);
        if (mode == 'live') {
          isLiveview.value = true;
        } else {
          isLiveview.value = false;
        }
      },
      onError: (err: object) => {
        console.warn('Play Error =>', err)
      }
    }
    drag.value = conf;
    GridManager.value.showLines();
    GridManager.value.highlightCells([]);
  } else {
    return;
  }
  console.log('drag =>', drag.value)
}

// 正在拖动
const dragOver = (event: any) => {
  if (!isDrag.value || !drag.value.videoid) return;
  const container: Element | null = document.getElementById('video_hed');
  // const rect: any = container?.getBoundingClientRect();
  const eventX = event.pageX;
  const eventY = event.pageY;
  let cellsToHighlight = [];
  // 显示网格
  GridManager.value.showLines()
  let gridPosition = GridManager.value.findGridPositionByCoordinates(eventX, eventY);
  if (gridPosition !== false) {
    let gridDimensions = GridManager.value.getDimensionsForGridPosition(gridPosition[0], gridPosition[1]);
    cellsToHighlight.push(gridDimensions);
  }
  GridManager.value.highlightCells(cellsToHighlight, "rgba(141,189,255,0.3)");
}

// 拖动结束，放置到指定位置
const dropTarget = async (event: any) => {
  if (!isDrag.value || !drag.value.videoid) return;
  const container: Element | null = document.getElementById('video_hed');
  // const rect: any = container?.getBoundingClientRect();
  let eventX = event.pageX;
  let eventY = event.pageY;
  let recEnable = false;
  const res = await RecEnableApi(drag.value.token);
  console.log('record =>', res)
  if (res.status == 200 && res.data.code == 0) {
    recEnable = res.data.result.manualRecEnable;
  }
  let conf = {
    pageX: eventX,
    pageY: eventY,
    id: 'G' + drag.value.videoid,
    recording: false,
    recEnable,
    audio: false,
    camera: {
      id: 'G' + drag.value.videoid,
      token: drag.value.token,
      session: drag.value.session
    }
  }
  GridManager.value.claimCellByCoordinates(conf);
  isDrag.value = false;
  GridManager.value.hideLines()
  GridManager.value.highlightCells([]);

  const UPlayer = new UPlayerSDKClass(conf.id, drag.value)
  UPlayerList.value.addPlayer(UPlayer);
  PlayingArr.value.push(UPlayer)
  PlayBackArr.value.push(UPlayer)
  UPlayerList.value.playAll();
  isPlaying.value = true;
}

const transformToTreeData = (partitions: any[]): TreeNode[] => {
  const result: TreeNode[] = [];
  
  partitions.forEach(partition => {
    const hasChildren = (partition.children && partition.children.length > 0) ||
                       (partition.dev && partition.dev.length > 0) ||
                       (partition.map && partition.map.length > 0) ||
                       (partition.view && partition.view.length > 0);
    
    const partitionNode: TreeNode = {
      id: `partition_${partition.devPartitionId}`,
      label: partition.devPartitionName,
      type: 'partition',
      children: [],
      data: partition,
      isLeaf: false,
      loaded: false
    };
    
    // 如果有实际的子数据，则立即加载，按照优先级排序
    if (hasChildren) {
      // 1. 优先展示children（子分区）
      if (partition.children && partition.children.length > 0) {
        const childrenNodes = transformToTreeData(partition.children);
        partitionNode.children!.push(...childrenNodes);
      }
      
      // 2. 其次展示dev设备
      if (partition.dev && partition.dev.length > 0) {
        partition.dev.forEach((device: any) => {
          partitionNode.children!.push({
            id: `dev_${device.devId}`,
            label: device.name,
            type: 'device',
            online: device.online,
            data: device,
            children: [{ id: 'placeholder', label: '', type: 'device', data: null }], // 设备也可能有子数据
            isLeaf: false,
            loaded: false
          });
        });
      }
      
      // 3. 然后展示map地图
      if (partition.map && partition.map.length > 0) {
        partition.map.forEach((map: any) => {
          partitionNode.children!.push({
            id: `map_${map.mapId}`,
            label: map.mapName,
            type: 'map',
            data: map,
            children: [{ id: 'placeholder', label: '', type: 'map', data: null }],
            isLeaf: false,
            loaded: false
          });
        });
      }
      
      // 4. 最后展示view视图
      if (partition.view && partition.view.length > 0) {
        partition.view.forEach((view: any) => {
          partitionNode.children!.push({
            id: `view_${view.viewId}`,
            label: view.viewName,
            type: 'view',
            data: view,
            children: [{ id: 'placeholder', label: '', type: 'view', data: null }],
            isLeaf: false,
            loaded: false
          });
        });
      }
      
      partitionNode.loaded = true;
    } else {
      // 没有子数据时添加占位符
      partitionNode.children = [{ id: 'placeholder', label: '', type: 'partition', data: null }];
    }
    
    result.push(partitionNode);
  });
  return result;
}
// 扁平化根节点，直接展示其内容，按照优先级排序
const flattenRootNodes = (partitions: any[]): TreeNode[] => {
  const result: TreeNode[] = [];
  
  partitions.forEach(partition => {
    // 1. 优先展示children（子分区）
    if (partition.children && partition.children.length > 0) {
      const childrenNodes = transformToTreeData(partition.children);
      result.push(...childrenNodes);
    }
    
    // 2. 其次展示dev设备
    if (partition.dev && partition.dev.length > 0) {
      partition.dev.forEach((device: any) => {
        result.push({
          id: `dev_${device.devId}`,
          label: device.name,
          type: 'device',
          online: device.online,
          data: device,
          children: [{ id: 'placeholder', label: '', type: 'device', data: null }], // 添加占位符
          isLeaf: false,
          loaded: false
        });
      });
    }
    
    // 3. 然后展示map地图
    if (partition.map && partition.map.length > 0) {
      partition.map.forEach((map: any) => {
        result.push({
          id: `map_${map.mapId}`,
          label: map.mapName,
          type: 'map',
          data: map,
          children: [{ id: 'placeholder', label: '', type: 'map', data: null }],
          isLeaf: false,
          loaded: false
        });
      });
    }
    
    // 4. 最后展示view视图
    if (partition.view && partition.view.length > 0) {
      partition.view.forEach((view: any) => {
        result.push({
          id: `view_${view.viewId}`,
          label: view.viewName,
          type: 'view',
          data: view,
          children: [{ id: 'placeholder', label: '', type: 'view', data: null }],
          isLeaf: false,
          loaded: false
        });
      });
    }
  });
  
  return result;
};

const getDeviceList = async () => {
  channelData.value = [];
  const res = await GetDevPartitionApi();
  if (res.status == 200 && res.data.code == 0) {
    const result = res.data.result;
    // 使用扁平化函数，按照优先级排序
    const list = flattenRootNodes(result);
    
    // 为设备节点加载通道数据
    for(const item of list) {
      if (item.type === 'device' && item.data && item.data.token) {
        const ress = await GetDeviceChannels(item.data.token)
        if (ress.status == 200 && ress.data.code == 0 && ress.data.result.length > 0) {
          // 将通道数据转换为树节点格式，保持在线状态
          item.children = ress.data.result.map((channel: any, index: number) => ({
            id: `channel_${item.data.devId}_${index}`,
            label: channel.name || `通道 ${index + 1}`,
            name: channel.name || `通道 ${index + 1}`,
            token: channel.token,
            online: channel.online,
            type: 'device', // 通道也是device类型，但通过isDeviceChannel区分
            data: channel,
            isLeaf: true,
            isDeviceChannel: true // 标记为设备通道
          }));
          item.loaded = true;
        } else {
          // 设备没有通道时，清空children但不设置为叶子节点
          item.children = [];
          item.loaded = true;
          // 不设置 item.isLeaf = true，让设备保持为非叶子节点
        }
      }
    }
    
    channelData.value = list;
    console.log('设备树数据:', channelData.value);
  }
  // 默认展开所有节点
  expandedKeys.value = getAllKeys(channelData.value)
}

const xzvalue = ref<Date>(new Date())
const customDateArr = ref<any>([])    // 用于存放'已标记的日期数组'
let monthChangeHandler: null | undefined | Function;
const input_ch = () => {    // 时间选择器时间发生改变触发的函数
  if (!UPlayerList.value) return;
  UPlayerList.value.setAllPosition(xzvalue.value.getTime()).then(() => {
    UPlayerList.value.playAll();
  })
}
const isShow = async () => {    // 获取焦点，展示日期
  await nextTick();
  monthChangeHandler = () => {
    monthChange()
  }
}
const isClose = () => {   // 失去焦点，清除监听

}
const monthChange = async () => {   // 切换年月后重新调接口

}
const SearchRecordCalendar = async (token: string, year: string, month: string) => {    // 根据年月获取有录像的日期
  customDateArr.value = [];
  $('.available').removeClass('custom_date_class');
  let res = await GetRecordCalendar(token, year, month);

}
const pickerOptions = computed(() => {
  return {
    cellClassName(Date: Date) {
      
    }
  }
})

const gotoLive = async () => {  // 转到直播
  const now = new Date();
  UPlayerList.value.pauseAll();
  isLiveview.value = false;
  if (PlayingArr.value.length == PlayBackArr.value.length) {
    await UPlayerList.value.setAllPosition(now.getTime())
    UPlayerList.value.playAll()
    isLiveview.value = true;
  } else {
    const notPlaybackArr = PlayingArr.value.filter(item => !PlayBackArr.value.includes(item))
    // 
    await Promise.all(
      notPlaybackArr.map(item => {
        return new Promise<void>((resolve) => {
          UPlayerList.value.addPlayer(item);
          PlayBackArr.value.push(item);
          resolve()
        })
      })
    )
    // 再统一进入实时播放
    await UPlayerList.value.setAllPosition(now.getTime()).then(() => {
      UPlayerList.value.playAll();
    })
    isLiveview.value = true;
  }
}

let region = ref<string>('1.0')
const regiondata = reactive([{
  value: "16.0",
  label: "16x"
}, {
  value: "8.0",
  label: "8x"
}, {
  value: "4.0",
  label: "4x"
}, {
  value: "2.0",
  label: "2x"
}, {
  value: "1.0",
  label: "1x"
}, {
  value: "0.5",
  label: "1/2x"
}, {
  value: "0.25",
  label: "1/4x"
}])
const timeSpeed = (speed: string) => {
  console.log('选择的倍速 =>', speed);
  if (isLiveview.value) {
    region.value = '1.0';
    return;   // 直播状态下不处理
  }
  if (!UPlayerList.value.UPlayerSDKList.length) return;   // 没有播放器实例不处理
  UPlayerList.value.setAllPlaybackRate(speed)
}
const timeInput = (e: Event) => {
  if (e) {
    const doc: any = document;
    if (!doc.fullscreenElement && !doc.webkitIsFullScreen && !doc.mozFullScreen && !doc.msFullscreenElement) {
      $('.ele .selectdrop').css('left', '-19px');
    } else {
      $('.ele .selectdrop').css('left', '0px !important');
    }
  }
}

const resume = () => {
  if (!UPlayerList.value.UPlayerSDKList.length) return; // 没有播放器实例不处理
  if (isLiveview.value) return;   // 直播状态下不处理
  if (isPlaying.value) {
    UPlayerList.value.pauseAll()
  } else {
    UPlayerList.value.playAll()
  }
  isPlaying.value = !isPlaying.value;
}

const Alloffvideo = () => { // 关闭所有视频以及单元格
  if (!UPlayerList.value) return;
  if (PlayingArr.value.length == 0) return;
  PlayingArr.value = [];
  PlayBackArr.value = [];
  UPlayerList.value.destroyAll();
  isLiveview.value = true;
  isPlaying.value = false;
  const cellFactory = async (cell: any) => {
    console.log('关闭', cell)
  }
  GridManager.value.reloadStageConfiguration(cellFactory)
}

const panelFullScreen = (event: any) => { // 全屏展示 / 退出全屏
  const elem: any = document.getElementById("video_hed");
  const doc: any = document;
  if (doc.fullscreenEnabled || doc.webkitFullscreenEnabled || doc.mozFullScreenEnabled || doc.msFullscreenEnabled) {
    if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement) {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    } else {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    }
  } else {
    console.log("Fullscreen is not supported on your browser.");
  }
}

// 获取节点图标
const getNodeIcon = (node: TreeNode) => {
  switch (node.type) {
    case 'partition':
      // children节点使用icon-gen
      return 'icon-gen';
    case 'device':
      // 如果是设备通道（叶子节点），使用摄像机图标
      if (node.isLeaf || node.isDeviceChannel) {
        return 'icon-shexiangjizaixian';
      }
      // dev里的设备使用icon-Device
      return 'icon-Device';
    case 'map':
      // map里的使用icon-ditu
      return 'icon-ditu';
    case 'view':
      // view里的使用icon-shipin
      return 'icon-shitu2';
    default:
      return 'icon-gen';
  }
};

// 获取节点样式类
const getNodeClass = (node: TreeNode) => {
  const classes = ['tree-node'];
  if (node.type === 'device') {
    // 获取在线状态
    const isOnline = node.online !== undefined ? node.online : (node.data && node.data.online);
    
    if (isOnline) {
      classes.push('device-online');
    } else {
      classes.push('device-offline');
    }
  }
  return classes.join(' ');
};

// 获取节点颜色
const getNodeColor = (node: TreeNode) => {
  if (node.type === 'device') {
    // 获取在线状态
    const isOnline = node.online !== undefined ? node.online : (node.data && node.data.online);
    return isOnline ? '#fff' : '#999';
  }
  return '#fff';
};

const refresh = () => {
  getDeviceList();
}

onMounted(() => {
  getDeviceList();
  initUPlayList()
  initGridLayout()
})

onBeforeUnmount(() => {
  Alloffvideo()
  GridManager.value.removeEventListener('closeCell', gridListener.closeCellHandler)
  GridManager.value.removeEventListener('recEnableClick', gridListener.recEnableHandler)
})

// const 
interface gridListenerType {
  closeCellHandler: null | Function,
  changeMainSDKHandler: null | Function,
  recEnableHandler: null | Function,
  SnapshotHandler: null | Function,
  InformationHandler: null | Function,
  ShoutwheatHandler: null | Function,
  PtzControlShowHandler: null | Function
}
</script>

<style lang="scss" scoped>
.live-view {
  width: 100vw;
  height: calc(100vh - 30px);
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  position: relative;
  .liveview-left {
    flex: 0 0 15%;
    height: 100%;
    background-color: #252525;
    overflow: hidden;
    .search-container {
      width: 100%;
      height: 50px;
      background-color: #1B1B1B;
      display: flex;
      justify-content: space-evenly;
      align-items: center;
      .liveview-search {
        width: 230px;
        background-color: #232323;
        border-radius: 15px;
        :deep(.el-input__wrapper) {
          background-color: transparent;
          box-shadow: none;
          border: 0;
          .el-input__inner {
            color: #fff;
          }
        }
      }
      .show-icon {
        margin-left: 10px;
        font-size: 20px;
        cursor: pointer;
      }
    }
    :deep(.el-collapse) {
      // background-color: #424242;
      border: 0;
      .el-collapse-item__header {
        background-color: #303030;
        border: 0;
        color: #fff;
        height: 48px;
        .liveview-colltitle{
          display: flex;
          // width: ;
          div {
            margin-left: 12px;
            width: 26px;
            height: 26px;
            background-color: #232323;
            border-radius: 13px;
            text-align: center;
            line-height: 26px;
            i {
              font-size: 14px;
            }
          }
        }
      }
      .el-collapse-item__wrap {
        background-color: transparent;
        border: 0;
      }
      .el-tree {
        background-color: transparent;
        .el-tree-node:focus>.el-tree-node__content {
          background-color: transparent;
        }
        .el-tree-node__content:hover {
          background-color: rgba($color: #fff, $alpha: 0.2);
        }
      }
    }
  }
  .liveview-right {
    width: calc(100% - 15%);
    height: 100%;
    margin: 0 6px;
    // background-color: #252525;
    display: flex;
    flex-direction: column;
    .liveview_right_video_hed {
      background-color: #222222;
      position: relative;
      width: 100%;
      flex: 1;
      overflow: hidden;
      background-image: url('../../assets/imgs/GridLogo.png');
      background-size: 380px 380px;
      background-repeat: no-repeat;
      background-position: center center;
    }
    .control_area {
      width: 100%;
      height: 140px;
      display: flex;
      flex-direction: column;
      .control-center {
        display: flex;
        align-items: center;
        .resume-btn {
          i {
            font-size: 24px;
            cursor: pointer;
          }
        }
        :deep(.ele) {
          width: 45px;
          height: 24px;
          border-radius: 12px;
          background-color: #0399FE;
          margin: 0;
          padding: 0;
          margin-right: 10px;
          .el-select__wrapper {
            width: 100%;
            height: 100%;
            line-height: 24px;
            border: none;
            box-shadow: none;
            background-color: transparent;
            padding: 0;
            text-align: center;
          }
          .el-select__suffix {
            display: none;
          }
        }
        :deep(.fixed_input) {
          width: 120px;
          margin-right: 20px;
          .el-input__wrapper {
            background-color: #121212;
            border: 0;
            box-shadow: none;

          }
        }
      }
      .control_btns {
        flex: 1;
        width: 100%;
        background-color: #282828;
        display: flex;
        align-items: center;
        justify-content: space-between;
        .caveat_butt {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          width: 17%;
          .recodeType {
            font-size: 14px;
          }
          .showRecodeType {
            width: 24px;
            height: 32px;
            text-align: center;
            line-height: 32px;
            border-radius: 4px;
            margin-right: 10px;
            background-color: #2f2f2f;
            cursor: pointer;
          }

          .mr-1 {
            width: 15px;
            height: 15px;
            border-radius: 50px;
            border: 0;
            margin: 0 5px;
            vertical-align: middle;
            background-color: rgb(60, 196, 60);
          }

          .mr-2 {
            width: 15px;
            height: 15px;
            border-radius: 50px;
            border: 0;
            margin: 0 5px;
            vertical-align: middle;
            background-color: #ee1011;
          }

          .mr-0 {
            width: 15px;
            height: 15px;
            border-radius: 50px;
            border: 0;
            margin-right: 5px !important;
            vertical-align: middle;
            background-color: #31b1ff;
          }
        }
        button {
          padding: 0;
          border: none;
          background: none;
          font-size: 22px;
          margin-right: 10px;
          color: #fff;
        }
        :deep(.goto-live) {
          font-size: 14px;
          background-color: rgba(141,189,255,0.16);
          padding: 0 20px;

          span {
            color: #0399FE;
          }
        }
      }

    }
  }
  .TreeFold {
    position: absolute;
    left: 0;
    top: 0;
    background: rgba(124, 124, 124, 0.5);
    border-radius: 0px 2px 2px 0px;
    z-index: 50;
    text-align: center;
    line-height: 40px;
    width: 30px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    cursor: pointer;
    i {
      font-size: 18px;
    }
  }
}
</style>

<style lang="scss">
#timeline {
  .center-pointer line {
      stroke: #FEEF03;
      stroke-width: 2;
  }

  .label text {
    font-size: 14px;
  }
  .bar-name text {
      font-size: 12px;
  }

  .timeline-box {
      margin-top: 10px;
  }

  .x.axis line {
      stroke: #D8D8D8;
  }

  .x.axis text {
      fill: white;
  }

  .x.axis.minor line {
      stroke: #D8D8D8;
  }

  .x.axis.minor text {
      fill: #999999;
  }

  .domain {
      // stroke: #D8D8D8;
      display: none;
      visibility: hidden;
  }
}

.line-matrix {
  position: absolute;
  z-index: 40;
  top: 0;
  left: 0;
  line {
    shape-rendering: crispEdges;
    stroke: #585858;
  }
}
.cell-matrix {
  z-index: 42;
  position: absolute;
  top: 0;
  left: 0;
  div {
    overflow: hidden;
    position: absolute;
  }
  .grid_cell:hover  {
    .cell-i {
      bottom: 3px;
    }
    .float-layer {
      top: 0;
    }
  }
  // .grid_cell {
  //   transition: all 0.5s ease;
  // }
  .active {
    transform: scale(1.2);
    z-index: 100;
  }
  .float-layer {
    position: absolute;
    right: 0;
    top: -30px;
    z-index: 10;
    height: 30px;
    line-height: 30px;
    background: url('../../assets/imgs/liveview_buttback.png') no-repeat;
    background-size: 290px 30px;
    text-align: right;
    padding: 0 10px;
    transition: 0.2s;
    i {
      margin-left: 10px;
      cursor: pointer;
      color: #fff;
    }
  }
  .cell-i {
    font-style: normal;
    position: absolute;
    bottom: -30px;
    right: 5px;
    color: aliceblue;
    font-size: 20px;
    z-index: 10;
    cursor: nwse-resize;
    transition: 0.2s;
  }
  .cell-close {
    font-style: normal;
    position: absolute;
    top: 3px;
    right: 5px;
    color: aliceblue;
    font-size: 20px;
    z-index: 10;
    cursor: pointer;
    display: none;
  }
}
.cell-highlighter {
  z-index: 44;
  position: absolute;
  top: 0;
  left: 0;
  display: none;
}
// .selectdrop {
//   // color: red;
//   background-color: #2D2D2D;
//   .el-select-dropdown__item.is-hovering {
//     background-color: #181818;
//   }
// }
</style>