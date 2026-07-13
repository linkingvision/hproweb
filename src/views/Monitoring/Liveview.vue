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
            ref="treeRef"
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
                style="width: 100%; display: flex; align-items: center; position: relative;"
                :class="getNodeClass(data)">
                <svg v-if="data.data && data.data.recording" class="icon" aria-hidden="true" :style="{
                  marginRight: '8px'
                }">
                  <use :xlink:href="getRecordingIcon(data)"></use>
                </svg>
                <i v-else :class="`iconfont ${getNodeIcon(data)}`" 
                   :style="{
                     opacity: getNodeColor(data),
                     marginRight: '8px',
                     fontSize: data.type === 'device' && data.isLeaf ? '16px' : '16px',
                     color: isChannelPlaying(data) ? '#00ff00' : 'inherit'
                   }"></i>
                <span :style="{
                  opacity: getNodeColor(data),
                  color: isChannelPlaying(data) ? '#00ff00' : 'inherit'
                }">{{ node.label }}</span>
                <span v-if="isChannelPlaying(data)" style="color: #00ff00; font-size: 12px; position: absolute; right: 10px;">
                  Playing...
                </span>
              </div>
            </template>
          </el-tree-v2>
        </el-collapse-item>
      </el-collapse>
    </div>
    <div class="liveview-right">
      <div class="liveview_right_video_hed" id="video_hed" @dragover.prevent="dragOver($event)" @drop="dropTarget($event)">
        
        <div class="malv" :class="informationshow ? '' : 'malv-hide'" style="position: absolute;">
          <div class="malv-close" @click="closeInformation">×</div>
          <div class="malv-left">
            <div class="information_title">{{ 'Video' }}</div>
            <div class="information_content" v-for="(a, index) in informationVideo" :key="index">
              <div class="information_content_left">{{ a.name }}</div>
              <div class="information_content_right">{{ a.data }}</div>
            </div>
          </div>
          <div class="malv-right">
            <div class="information_title">{{ 'Audio' }}</div>
            <div class="information_content" v-for="(a, index) in informationAudio" :key="index">
              <div class="information_content_left">{{ a.name }}</div>
              <div class="information_content_right">{{ a.data }}</div>
            </div>
          </div>
        </div>
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
            <div class="showRecodeType"
                @click="showRecodeType = !showRecodeType;">
              <i class="iconfont" :class="showRecodeType ? 'icon-zuojiantou' : 'icon-youjiantou'"></i>
            </div>
          </div>
          <div class="control-center">
            <el-date-picker class="fixed_input" v-model="xzvalue" size="small" @change="input_ch" @focus="isShow" @panel-change="monthChange" @blur="closePicker"
              :append-to-body="false" :clearable="false" popper-class="date-picker">
            </el-date-picker>
            <el-select v-model="region" size="small" class="ele" popper-class='selectdrop' @change="timeSpeed(region)" @visible-change="timeInput" popper-style="border: 0;">
              <el-option v-for="(item, index) in regiondata" :key="index" :label="item.label" :value="item.value"></el-option>
            </el-select>
            <button class="resume-btn" @click="resume">
              <i class="iconfont" :class="isPlaying ? 'icon-zanting' : 'icon-bofang'"></i>
            </button>
            <div id="Audio_slider-bottom" class="Audio_slider-bottom">
              <div style="margin-right: 10px;">
                <i class="iconfont" :class="(Audioslider == 0) ? 'icon-shengyinguan' : 'icon-shengyinkai'"
                  style="font-size:22px;"></i>
              </div>
              <el-slider :step='0.1' :show-tooltip="false" :max='1' v-model="Audioslider"
                style="width:60%;margin-right: 10px;"></el-slider>
            </div>
          </div>
          
          <div class="gongge-btns" style="height: 50px; padding-right: 20px; width: 20%; display: flex; justify-content: flex-end; align-items: center;">
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
    <div class="yuntai" :class="ptzShow ? '' : 'yuntai-hide'">
      <div class="header">
        <span>PTZ</span>
        <i class="iconfont icon-zhankai2" @click="closePtz"></i>
      </div>
      <div class="controls">
        <div class="left">
          <i class="iconfont icon-jujiao2" @mousedown="PtzAction('focusin')" @mouseup="PtzAction('stop')"></i>
          <i class="iconfont icon-jujiao1" @mousedown="PtzAction('focusout')" @mouseup="PtzAction('stop')"></i>
          <i class="iconfont icon-guangquanjia" @mousedown="PtzAction('irisin')" @mouseup="PtzAction('stop')"></i>
          <i class="iconfont icon-guangquanjian" @mousedown="PtzAction('irisout')" @mouseup="PtzAction('stop')"></i>
          <i class="iconfont icon-light-open" @mousedown="PtzAction('lighton')" @mouseup="PtzAction('stop')"></i>
          <i class="iconfont icon-light-close" @mousedown="PtzAction('lightoff')" @mouseup="PtzAction('stop')"></i>
          <i class="iconfont icon-kaiyushua" @mousedown="PtzAction('wiperon')" @mouseup="PtzAction('stop')"></i>
          <i class="iconfont icon-guanyushua" @mousedown="PtzAction('wiperoff')" @mouseup="PtzAction('stop')"></i>
        </div>
        <div class="right">
          <div class="ptz-item corner"><div class="zs" @mousedown="PtzAction('upleft')" @mouseup="PtzAction('stop')">
            <i class="iconfont icon-zuoshang"></i>
          </div></div>
          <div class="ptz-item shang" @mousedown="PtzAction('up')" @mouseup="PtzAction('stop')"><i class="iconfont icon-shang"></i></div>
          <div class="ptz-item corner"><div class="ys" @mousedown="PtzAction('upright')" @mouseup="PtzAction('stop')">
            <i class="iconfont icon-youshang"></i>
          </div></div>
          <div class="ptz-item zuo" @mousedown="PtzAction('left')" @mouseup="PtzAction('stop')"><i class="iconfont icon-zuo"></i></div>
          <div class="ptz-item center"></div>
          <div class="ptz-item you" @mousedown="PtzAction('right')" @mouseup="PtzAction('stop')"><i class="iconfont icon-you"></i></div>
          <div class="ptz-item corner"><div class="zx" @mousedown="PtzAction('downleft')" @mouseup="PtzAction('stop')">
            <i class="iconfont icon-zuoxia"></i>
          </div></div>
          <div class="ptz-item xia" @mousedown="PtzAction('down')" @mouseup="PtzAction('stop')"><i class="iconfont icon-xia"></i></div>
          <div class="ptz-item corner" ><div class="yx" @mousedown="PtzAction('downright')" @mouseup="PtzAction('stop')">
            <i class="iconfont icon-youxia"></i>
          </div></div>
        </div>
      </div>
      <div class="ptz-slider">
        <span>{{ ptzvalue }}</span>
        <el-slider v-model="ptzvalue" :show-tooltip="false" :max="1" :min="0.1" :step="0.1"></el-slider>
      </div>
      <el-timeline>
        <el-timeline-item placement="top" v-for="Pre in PresetData" :key="Pre.strName">
          <el-card>
            <div class="preset_bgc">
              <input type="text" class="preset_input" :value="Pre.strName" />
              <button type="button" class="iconfont icon-RectangleCopy1"
                @click="preset_jump(Pre.strToken)"></button>
              <button type="button" class="iconfont icon-icon-test1"
                @click="preset_set(Pre.strToken, $event)"></button>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script lang="ts" setup>
import $ from 'jquery'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { H5sPlayerAudBack } from '@/assets/js/h5splayer.js'
// import { useRoute } from 'vue-router';
import { GetDevPartitionApi } from '@/api/configuration/device';
import { GetDeviceChannels, RecEnableApi, GetRecordCalendar, setRecEnableApi, GetInformationDataApi, GetPresetsApi, PresetJumpApi, SetPresetApi, PtzApi, GetViewApi } from '@/api/channel';
import { useStore } from '@/store';
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
  isLeaf?: boolean; // flag: is leaf node
  loaded?: boolean; // flag: children already loaded
  isDeviceChannel?: boolean; // flag: is device channel (child of expanded device)
}
interface gridListenerType {
  closeCellHandler: null | Function,
  changeMainSDKHandler: null | Function,
  recEnableHandler: null | Function,
  SnapshotHandler: null | Function,
  InformationHandler: null | Function,
  ShoutwheatHandler: null | Function,
  PtzControlShowHandler: null | Function,
  layoutLoadedFromCacheHandler: null | Function
}

// const route = useRoute()
const userStore = useUserStore()
const store = useStore()
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
let expandedKeys = ref<any[]>([])  // keys to expand by default
let treeRef = ref<any>(null)  // tree component ref

let IsTreeFold = ref(false) // left tree panel state

let GridManager = ref<any>(null)
let gridListener = reactive<gridListenerType>({
  closeCellHandler: null,
  changeMainSDKHandler: null,
  recEnableHandler: null,
  SnapshotHandler: null,
  InformationHandler: null,
  ShoutwheatHandler: null,
  PtzControlShowHandler: null,
  layoutLoadedFromCacheHandler: null
})
let UPlayerList = ref<any>(null)
let PlayingArr = ref<any[]>([])
let PlayBackArr = ref<any[]>([])
let isPlaying = ref<boolean>(false)
let informationshow = ref<boolean>(false)
let timerRunInfo = ref<any>(null)
const informationAudio = ref<any[]>([])
const informationVideo = ref<any[]>([])
const selectCellId = ref<string>('')
const mainSDKId = ref<string>('')
const Audioslider = ref<number>(0)

const initUPlayList = ():void => { // initialise UPlayerList
  UPlayerList.value = new UPlayerListClass('#timeline');
  GridManager.value.initialize()
}
const initGridLayout = ():void => {
  GridManager.value = new GridLayoutManager('#video_hed', {
    cacheKey: 'hpro-view-layout',
    padding: 20,
    aspectRatio: [16, 9],
    animationDuration: 500,
    createIcons: {
      playModeIcon: true,
      playModeText: store.liveviewrtc,
      informationIcon: true,
      shouwhearIcon: true,
      snapshotIcon: true,
      recEnableIcon: true,
      ptzcontrolIcon: true
    }
  })
  gridListener.closeCellHandler = (event: CustomEvent<any>) => {
    closePlayContainer(event.detail)
  }
  gridListener.recEnableHandler = (event: CustomEvent<any>) => {
    DoManualRecordStart(event.detail.id, event.detail.recEnable)
  }
  gridListener.changeMainSDKHandler = (event: CustomEvent<any>) => {
    changeMainSDK(event.detail)
  }
  gridListener.InformationHandler = (event: CustomEvent<any>) => {
    Information(event.detail.id)
  }
  gridListener.SnapshotHandler = (event: CustomEvent<any>) => {
    DoSnapshotWeb(event.detail.id)
  }
  gridListener.ShoutwheatHandler = (event: CustomEvent<any>) => {
    Shoutwheat(event.detail.id, event.detail.audio)
  }
  gridListener.PtzControlShowHandler = (event: CustomEvent<any>) => {
    PtzControlShow(event.detail.id)
  }
  gridListener.layoutLoadedFromCacheHandler = async (event: CustomEvent<any>) => {
    console.log('layoutLoadedFromCacheHandler =>', event.detail)
    await nextTick()
    
    // Helper: wait for device tree data to load
    const waitForDeviceData = async (maxRetries = 10, delay = 500) => {
      for (let i = 0; i < maxRetries; i++) {
        if (channelData.value && channelData.value.length > 0) {
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return false;
    };
    
    // Wait for device tree to finish loading
    const deviceDataReady = await waitForDeviceData();
    if (!deviceDataReady) {
      console.warn('Device tree data not ready, skipping playing status update');
    }
    
    event.detail.forEach((item: any) => {
      item.forEach((row: any) => {
        if (row && row.camera) {
          // Find device tree node ID by token
          const nodeId = deviceDataReady ? findNodeIdByToken(row.camera.token) : null;
          
          const conf = {
            videoid: row.camera.videoid,
            protocol: window.location.protocol,
            host: userStore.WSROOT,
            token: row.camera.token,
            session: userStore.session,
            accessToken: userStore.Access_token,
            resourceUUID: row.camera.resourceUUID,
            name: row.camera.name,
            label: row.camera.label,
            liveVideoType: store.liveviewrtc,
            recording: row.camera.recording,
            playingId: nodeId, // playingId used to update device tree on close
            onPlaybackModeChange: (mode: string) => {
              console.log('onPlaybackModeChange =>', mode);
              if (mode == 'live') {
                isLiveview.value = true;
                GridManager.value.changePlayModeText(store.liveviewrtc)
              } else {
                isLiveview.value = false;
                GridManager.value.changePlayModeText(store.liveviewrtc1)
              }
            },
            onError: (err: object) => {
              console.warn('Play Error =>', err)
            }
          }

          // console.log('G' + conf.videoid, document.getElementById('G' + conf.videoid))
          const UPlayer = new UPlayerSDKClass('G' + conf.videoid, conf);
          UPlayerList.value.addPlayer(UPlayer);
          PlayingArr.value.push(UPlayer);
          PlayBackArr.value.push(UPlayer);
          isPlaying.value = true;
          
          // Update playback state
          if (nodeId) {
            updatePlayingStatus('add', nodeId);
            console.log('Auto-play: Updated playing status for node:', nodeId, 'token:', row.camera.token);
          } else {
            console.warn('Auto-play: Could not find node for token:', row.camera.token);
          }
        }
      })
    })
    UPlayerList.value.playAll();
  }

  GridManager.value.addEventListener('closeCell', gridListener.closeCellHandler)
  GridManager.value.addEventListener('recEnableClick', gridListener.recEnableHandler)
  GridManager.value.addEventListener('cellClick', gridListener.changeMainSDKHandler)
  GridManager.value.addEventListener('Information', gridListener.InformationHandler)
  GridManager.value.addEventListener('Snapshot', gridListener.SnapshotHandler)
  GridManager.value.addEventListener('Shoutwheat', gridListener.ShoutwheatHandler)
  GridManager.value.addEventListener('PtzControlShow', gridListener.PtzControlShowHandler)
  GridManager.value.addEventListener('layoutLoadedFromCache', gridListener.layoutLoadedFromCacheHandler)
  // console.log(GridManager.value)
}
// Open stats overlay
const Information = (id: string) => {
  const vid = id.slice(1);
  const sdk = PlayingArr.value.find(item => item.conf.videoid == vid);
  if (informationshow.value) {
    informationshow.value = false;
    clearInterval(timerRunInfo.value);
    timerRunInfo.value = null;
  } else {
    informationshow.value = true;
    Informationdata(vid, sdk.conf.token);
    timerRunInfo.value = setInterval(() => {
      Informationdata(vid, sdk.conf.token);
    }, 8000)
  }
}
// Fetch stream info
const Informationdata = async (id: string, token: string) => {
  const res = await GetInformationDataApi(token);
  if (res.status == 200) {
    const item = res.data;
    informationAudio.value = [{
      name: 'Codec',
      data: item.strAudioType
    }, {
      name: 'Sample Rate',
      data: item.nAudioSampleRate
    }, {
      name: 'Sample Bit',
      data: item.nAudioSampleBit
    }, {
      name: 'Channels',
      data: item.nAudioChannels
    }, {
      name: 'Bitrate',
      data: (item.nAudioBitrate / 1024).toFixed(1) + 'kpbs'
    }];
    informationVideo.value = [{
      name: 'Codec',
      data: item.strVideoType
    }, {
      name: 'Width',
      data: item.nVideoWidth
    }, {
      name: 'Height',
      data: item.nVideoHeight
    }, {
      name: 'FPS',
      data: item.nVideoFPS
    }, {
      name: 'Bitrate',
      data: (item.nVideoBitrate / 1024).toFixed(1) + 'kpbs'
    }]
  }
}
// Close stats overlay
const closeInformation = (): void => {
  informationshow.value = false;
  if (timerRunInfo.value) {
    clearInterval(timerRunInfo.value)
    timerRunInfo.value = null;
  }
}
// Local snapshot
const DoSnapshotWeb = (id: string) => {
  const vid = id.slice(1);
  const sdk = PlayingArr.value.find(item => item.conf.videoid == vid);
  if (!sdk) return;

  const date = new Date();
  const fileName = `${sdk.conf.token}_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
  let video: any;
  if (isLiveview.value) {
    video = $('#' + sdk.conf.videoid).get(0);
  } else {
    video = $('#playback' + vid).find('video[pos="0"]').get(0);
  }
  if (video) video.crossOrigin = 'anonymous';
  const canvas = document.createElement('canvas');
  const ctx: any = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  var imgURL = canvas.toDataURL("image/png");

  var dlLink = document.createElement('a');
  dlLink.download = fileName;
  dlLink.href = imgURL;
  document.body.appendChild(dlLink);
  dlLink.click();
  document.body.removeChild(dlLink);
}

// Audio toggle handler
let audioback = ref<any>(null)
const Shoutwheat = (id: string, audio: boolean) => {
  const vid = id.slice(1)
  const sdk = PlayingArr.value.find(item => item.conf.videoid == vid);
  if (!sdk) return;
  const conf = {
    protocol: window.location.protocol,
    host: window.location.host,
    rootpath: '/',
    token: sdk.conf.token,
    session: userStore.session
  }
  if (audio) {
    audioback.value.disconnect();
    delete audioback.value;
    audioback.value = null
  } else {
    if (audioback.value) {
      audioback.value.disconnect();
      delete audioback.value;
      audioback.value = null
    }
    audioback.value = new H5sPlayerAudBack(conf);
    audioback.value.connect();
  }
  GridManager.value.changeAudio(id, !audio)
}
// PTZ control
const ptzShow = ref<boolean>(false);
const ptzToken = ref<string>('');
const PresetData = reactive<any[]>([])
const ptzvalue = ref<number>(0.5)
const PtzControlShow = async (id: string) => {
  const vid = id.slice(1)
  const sdk = PlayingArr.value.find(item => item.conf.videoid == vid);
  if (!sdk) return;
  ptzShow.value = true;
  ptzToken.value = sdk.conf.token;
  PresetData.splice(0);
  const res = await GetPresetsApi(ptzToken.value);
  if (res.status == 200) {
    if (res.data && res.data.preset.length > 0) {
      const preset = res.data.preset;
      for(let i = 0; i < preset.length; i++) {
        const newItem = {
          strName: preset[i].strName,
          strToken: preset[i].strToken
        }
        if (i >= 8) break;
        PresetData.push(newItem);
      }
    }
  }
}
const PtzAction = async (action: string, speed?: number) => {
  const speedValue = speed || ptzvalue.value;
  if (!ptzToken.value) return;
  const res = await PtzApi(ptzToken.value, action, speedValue)
  if (res.status == 200 && res.data.code == 0) {}
}
const preset_jump = async (token: string) => {
  const res = await PresetJumpApi(ptzToken.value, token, ptzvalue.value)
  if (res.status == 200 && res.data.code == 0) {}
}
const preset_set = async (token: string, event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  const input = target.previousElementSibling?.previousElementSibling as HTMLInputElement
  var input_val = input?.value;
  const res = await SetPresetApi(ptzToken.value, input_val, token)
  if (res.status == 200 && res.data.code == 0) {}
}
const closePtz = () => {
  ptzShow.value = false;
  ptzToken.value = '';
  PresetData.splice(0);
}
// Switch main player
const changeMainSDK = (id: string) => {
  const vid = id.slice(1);
  // In playback: clicking active cell toggles it in/out of playback group
  if (!isLiveview.value && mainSDKId.value === id) {
    const playSDK = PlayingArr.value.find(item => item.conf.videoid === vid);
    if (playSDK) {  // clicked cell has an active player
      const playbackSDK = PlayBackArr.value.find(item => item.conf.videoid === vid);
      const target = document.getElementById(id)
      if (playbackSDK) {
        if (PlayBackArr.value.length > 1) {
          UPlayerList.value.getOutPlayer(vid);
          PlayBackArr.value = PlayBackArr.value.filter(item => item.conf.videoid != vid)
          target?.classList.remove('playback_check_border')
          target?.classList.remove('blue_dashed')
          target?.classList.add('red_border')
        }
      } else {
        UPlayerList.value.addPlayer(playSDK);
        PlayBackArr.value.push(playSDK)
        target?.classList.remove('red_border')
        target?.classList.add('playback_check_border')
      }
    }
  } else {
    if (UPlayerList.value && UPlayerList.value.UPlayerSDKList.length > 0) {
      UPlayerList.value.changeMainSDK(vid)
    }
  }

  selectCellId.value = vid;
  mainSDKId.value = id;

  if (isLiveview.value) {
    document.querySelectorAll('.grid_cell.red_border')
      .forEach(el => el.classList.remove('red_border'))
    const target = document.getElementById(id);
      if (target) target.classList.add('red_border')
  } else {
    document.querySelectorAll('.grid_cell.red_border').forEach(el => el.classList.remove('red_border'))
    document.querySelectorAll('.grid_cell.playback_check_border').forEach(el => el.classList.remove('playback_check_border'))
    const item = PlayBackArr.value.find(item => item.conf.videoid == vid)
    const target = document.getElementById(id);
    if (target) {
      if (item) {
        target.classList.add('blue_dashed')
        target.classList.add('playback_check_border')
      } else {
        target.classList.add('red_border')
      }
    }
  }
}
// Toggle manual recording
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
// Close individual grid cell
const closePlayContainer = (id: string) => {
  console.log('closePlayContainer id =>', id)
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
    if (currentSDK.conf.token === ptzToken.value) {
      closePtz()
    }
    PlayingArr.value = PlayingArr.value.filter(sdk => sdk.conf.videoid !== vid)
    PlayBackArr.value = PlayBackArr.value.filter(sdk => sdk.conf.videoid !== vid)
    if (!PlayingArr.value.length) {
      isLiveview.value = true;
      isPlaying.value = false;
    }
    // Update state: use playingId first, fall back to token lookup
    let nodeIdToRemove = currentSDK.conf.playingId;
    if (!nodeIdToRemove && currentSDK.conf.token) {
      nodeIdToRemove = findNodeIdByToken(currentSDK.conf.token);
      console.log('closePlayContainer: playingId not found, using token to find nodeId:', nodeIdToRemove);
    }
    
    if (nodeIdToRemove) {
      updatePlayingStatus('del', nodeIdToRemove);
    } else {
      console.warn('closePlayContainer: Could not find nodeId to remove playing status for token:', currentSDK.conf.token);
    }
    // Trigger tree re-render to reflect playback state
    nextTick(() => {
      if (treeRef.value) {
        treeRef.value.$forceUpdate?.();
      }
    });
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
  const stack = [...data]; // use stack to avoid deep recursion
  
  while (stack.length > 0) {
    const item = stack.pop();
    if (item && item.id !== 'placeholder') {
      keys.push(item.id);
      if (item.children && item.children.length > 0) {
        // Only non-leaf nodes need child processing
        if (!item.isLeaf) {
          stack.push(...item.children);
        }
      }
    }
  }
  
  return keys;
}

const isDrag = ref<boolean>(false)
let drag = ref<any>({});
let isLiveview = ref(true)

// Device tree drag start
const handleDragStart = (node: any) => {
  // console.log('handleDragStart =>', node.data.data)
  drag.value = {};
  isDrag.value = true;
  let conf = {}
  if (node.data.data.type == "H5_CH_DEV" || node.data.data.type == "H5_FILE") {
    console.log('handleDragStart channel =>', node.data)
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
      liveVideoType: store.liveviewrtc,
      recording: node.data.data.recording,
      playingId: node.data.id,  // used for device tree display state only
      onPlaybackModeChange: (mode: string) => {
        console.log('onPlaybackModeChange view =>', mode);
        if (mode == 'live') {
          isLiveview.value = true;
          GridManager.value.changePlayModeText(store.liveviewrtc)
        } else {
          isLiveview.value = false;
          GridManager.value.changePlayModeText(store.liveviewrtc1)
        }
      },
      onError: (err: object) => {
        console.warn('Play Error =>', err)
      }
    }
    drag.value = conf;
  } else {
    if (node.data.type == 'view') {
      console.log('handleDragStart view =>', node.data)
      drag.value.viewId = node.data.data.viewId;
      drag.value.playingId = node.data.id;
    } else if (node.data.type == 'map') {
      console.log('handleDragStart map =>', node.data)
      // Set playingId on map; playback not yet implemented
      drag.value.mapId = node.data.data.mapId;
      drag.value.playingId = node.data.id;
    }
  }
  GridManager.value.showLines();
  GridManager.value.highlightCells([]);
  console.log('drag =>', drag.value)
}

// Dragging
const dragOver = (event: any) => {
  if (!isDrag.value && !drag.value.viewId || !isDrag.value && !drag.value.videoid) return;
  // const container: Element | null = document.getElementById('video_hed');
  // const rect: any = container?.getBoundingClientRect();
  const eventX = event.pageX;
  const eventY = event.pageY;
  let cellsToHighlight = [];
  // Show grid
  GridManager.value.showLines()
  let gridPosition = GridManager.value.findGridPositionByCoordinates(eventX, eventY);
  if (gridPosition !== false) {
    let gridDimensions = GridManager.value.getDimensionsForGridPosition(gridPosition[0], gridPosition[1]);
    cellsToHighlight.push(gridDimensions);
  }
  GridManager.value.highlightCells(cellsToHighlight, "rgba(141,189,255,0.3)");
}

// Drag end — drop on target cell
const dropTarget = async (event: any) => {
  if (!isDrag.value && !drag.value.viewId || !isDrag.value && !drag.value.videoid) {
    GridManager.value.hideLines()
    GridManager.value.highlightCells([]);
    isDrag.value = false;
    return;
  };
  // const container: Element | null = document.getElementById('video_hed');
  // const rect: any = container?.getBoundingClientRect();
  if (drag.value.videoid) {
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
        videoid: drag.value.videoid,
        token: drag.value.token,
        session: drag.value.session,
        name: drag.value.name,
        label: drag.value.name,
        resourceUUID: drag.value.resourceUUID,
        recording: drag.value.recording
      }
    }
    GridManager.value.claimCellByCoordinates(conf);
    isDrag.value = false;

    const UPlayer = new UPlayerSDKClass(conf.id, drag.value)
    UPlayerList.value.addPlayer(UPlayer);
    PlayingArr.value.push(UPlayer)
    PlayBackArr.value.push(UPlayer)
    UPlayerList.value.playAll();
    isPlaying.value = true;
    gridListener.changeMainSDKHandler?.({detail: conf.id})
    updatePlayingStatus('add', drag.value.playingId)
  } else if (drag.value.viewId) {
    srcView(drag.value.viewId);
    // GridManager.value.claimCellByCoordinates(conf);
    isDrag.value = false;
    updatePlayingStatus('add', drag.value.playingId)
  } else if (drag.value.mapId) {
    // Map playback not implemented; update state for display only
    console.log('Map dropped, but playback not implemented yet');
    isDrag.value = false;
    updatePlayingStatus('add', drag.value.playingId)
  }

  GridManager.value.hideLines()
  GridManager.value.highlightCells([]);
  
  // Trigger tree re-render to reflect playback state
  nextTick(() => {
    // Force tree component update
    if (treeRef.value) {
      treeRef.value.$forceUpdate?.();
    }
  });
}

const srcView = async (viewId: string) => {
  // Stop all playing videos first
  Alloffvideo();
  const res = await GetViewApi(viewId)
  if (res.status == 200 && res.data.code == 0) {
    const result = res.data.result;
    const layoutData = transformViewToGrid(result.layout, result.viewEntity)
    console.log('srcView =>', layoutData);
    localStorage.setItem('hpro-view-layout', JSON.stringify(layoutData));
    GridManager.value.initialize()
    await nextTick();
  }
}

const transformViewToGrid = (layoutData: any, viewEntities: any) => {
  // Fetch layout info
  const layout = layoutData.setting.layoutView
  // Build position map from viewEntities

  // Create position-to-entity map
  const positionMap: any = {};
  viewEntities.forEach((entity: any) => {
    const pos = entity.layoutPosition;
    if (pos) {
      positionMap[pos] = {
        token: entity.Channel.token,
        name: entity.Channel.name,
        resourceUUID: entity.resourceUUID,
        recording: entity.Channel.recording
      }
    }
  });

  // Determine grid size from max row/col in layout
  const maxRow = Math.max(...layout.map((cell: any) => cell.rowEnd)) - 1;
  const maxCol = Math.max(...layout.map((cell: any) => cell.colEnd)) - 1;
  // Initialise 4x4 result grid
  const result: any[] = Array.from({ length: maxRow }, () => 
    Array.from({ length: maxCol }, () => ({}))
  )

  // Track processed cells
  const processedCells = new Set();
  // Process merged cells first
  const sortedLayout = [...layout].sort((a: any, b: any) => {
    if (a.merged && !b.merged) return -1;
    if (!a.merged && b.merged) return 1;
    return 0;
  });

  // Convert each layout cell
  sortedLayout.forEach((cell: any) => {
    const row = cell.rowStart - 1;
    const col = cell.colStart - 1;
    const cellKey = `${row}-${col}`;
    
    // Skip cells already covered by a merged cell
    if (processedCells.has(cellKey)) return;
    
    // Build position key e.g. "h1-1"
    const posKey = `h${cell.rowStart}-${cell.colStart}`;
    
    // Check if a video entity exists at this position
    const hasCamera = positionMap[posKey];
    
    // Merged cell
    if (cell.merged) {
      const rowSpan = cell.rowEnd - cell.rowStart;
      const colSpan = cell.colEnd - cell.colStart;
      
      // Only video-bearing merged cells need special handling
      if (hasCamera) {
        const videoId = uuid(8);
        
        // Main cell (merge origin)
        result[row][col] = {
          row: row,
          column: col,
          rowSpan: rowSpan,
          columnSpan: colSpan,
          forceLbm: false,
          claimed: true,
          spannedUpon: false,
          camera: {
            videoid: videoId,
            token: hasCamera.token,
            session: userStore.session,
            name: hasCamera.name,
            label: hasCamera.name,
            resourceUUID: hasCamera.resourceUUID,
            recording: hasCamera.recording
          },
          id: `G${videoId}`
        };
        
        processedCells.add(cellKey);
        
        // Handle cells covered by the merge
        for (let r = row; r < row + rowSpan; r++) {
          for (let c = col; c < col + colSpan; c++) {
            const subCellKey = `${r}-${c}`;
            if (r === row && c === col) continue; // skip main (origin) cell
            
            if (r < maxRow && c < maxCol) {
              result[r][c] = {
                row: r,
                column: c,
                rowSpan: 1,
                columnSpan: 1,
                forceLbm: false,
                claimed: false,
                spannedUpon: true,
                camera: null,
                id: null
              };
              processedCells.add(subCellKey);
            }
          }
        }
      }
      // Merged cell without video: set main cell to {}
      else {
        result[row][col] = {};
        processedCells.add(cellKey);
        
        // Covered cells stay as {} — no action needed
        for (let r = row; r < row + rowSpan; r++) {
          for (let c = col; c < col + colSpan; c++) {
            const subCellKey = `${r}-${c}`;
            if (r !== row || c !== col) {
              processedCells.add(subCellKey);
            }
          }
        }
      }
    } 
    // Single cell
    else {
      // Check if covered by a merged cell
      if (!processedCells.has(cellKey)) {
        if (hasCamera) {
          const videoId = uuid(8);
          
          result[row][col] = {
            row: row,
            column: col,
            rowSpan: 1,
            columnSpan: 1,
            forceLbm: false,
            claimed: true,
            spannedUpon: false,
            camera: {
              videoid: videoId,
              token: hasCamera.token,
              session: userStore.session,
              name: hasCamera.name,
              label: hasCamera.name,
              resourceUUID: hasCamera.resourceUUID,
              recording: hasCamera.recording
            },
            id: `G${videoId}`
          };
        } else {
          result[row][col] = {};
        }
        
        processedCells.add(cellKey);
      }
    }
  })

  // Convert each layout cell
  // layout.forEach((cell: any) => {
  //   const row = cell.rowStart - 1;
  //   const col = cell.colStart - 1;
  //   const posKey = `h${cell.rowStart}-${cell.colStart}`;
    
  //   const hasCamera = positionMap[posKey];

  //   if (hasCamera) {
  //     const videoId = uuid(8);
  //     result[row][col] = {
  //       row: row,
  //       column: col,
  //       rowSpan: cell.merged ? (cell.rowEnd - cell.rowStart) : 1,
  //       columnSpan: cell.merged ? (cell.colEnd - cell.colStart) : 1,
  //       forceLbm: false,
  //       claimed: true,
  //       camera: {
  //         videoid: videoId,
  //         token: hasCamera.token,
  //         name: hasCamera.name,
  //         label: hasCamera.name,
  //         resourceUUID: hasCamera.resourceUUID,
  //         recording: hasCamera.recording
  //       },
  //       id: `G${videoId}`
  //     };
      
  //     if (cell.merged) {
  //       for (let r = row; r < cell.rowEnd - 1; r++) {
  //         for (let c = col; c < cell.colEnd - 1; c++) {
  //           if (r !== row || c !== col) {
  //             result[r][c] = null;
  //           }
  //         }
  //       }
  //     }
  //   }
  //   else if (result[row][col] === undefined || result[row][col] !== null) {
  //     result[row][col] = {};
  //   }
  // })

  // Clear positions occupied by merged cells
  // for (let i = 0; i < result.length; i++) {
  //   for (let j = 0; j < result[i].length; j++) {
  //     if (result[i][j] === null) {
  //       result[i][j] = {};
  //     }
  //   }
  // }
  return result;
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
      data: partition,
      isLeaf: !hasChildren,
      loaded: false
    };
    
    // Only set children when sub-data exists
    if (hasChildren) {
      partitionNode.children = [];
      
      // 1. Sub-partitions first
      if (partition.children && partition.children.length > 0) {
        const childrenNodes = transformToTreeData(partition.children);
        partitionNode.children.push(...childrenNodes);
      }
      
      // 2. Devices second
      if (partition.dev && partition.dev.length > 0) {
        partition.dev.forEach((device: any) => {
          partitionNode.children!.push({
            id: `dev_${device.devId}`,
            label: device.name,
            type: 'device',
            online: device.online,
            data: device,
            children: [{ id: 'placeholder', label: '', type: 'device', data: null }], // device channels are lazy-loaded
            isLeaf: false,
            loaded: false
          });
        });
      }
      
      // 3. Maps — leaf nodes, no expand icon
      if (partition.map && partition.map.length > 0) {
        partition.map.forEach((map: any) => {
          partitionNode.children!.push({
            id: `map_${map.mapId}`,
            label: map.mapName,
            type: 'map',
            data: map,
            isLeaf: true, // map is a leaf node
            loaded: true
          });
        });
      }
      
      // 4. Views — leaf nodes, no expand icon
      if (partition.view && partition.view.length > 0) {
        partition.view.forEach((view: any) => {
          partitionNode.children!.push({
            id: `view_${view.viewId}`,
            label: view.viewName,
            type: 'view',
            data: view,
            isLeaf: true, // view is a leaf node
            loaded: true
          });
        });
      }
      
      partitionNode.loaded = true;
    }
    // No children set when empty — hides tree expand icon
    
    result.push(partitionNode);
  });
  return result;
}
// Flatten root node, display contents sorted by priority
const flattenRootNodes = (partitions: any[]): TreeNode[] => {
  const result: TreeNode[] = [];
  
  partitions.forEach(partition => {
    // 1. Sub-partitions first
    if (partition.children && partition.children.length > 0) {
      const childrenNodes = transformToTreeData(partition.children);
      result.push(...childrenNodes);
    }
    
    // 2. Devices second
    if (partition.dev && partition.dev.length > 0) {
      partition.dev.forEach((device: any) => {
        result.push({
          id: `dev_${device.devId}`,
          label: device.name,
          type: 'device',
          online: device.online,
          data: device,
          children: [{ id: 'placeholder', label: '', type: 'device', data: null }], // device channels are lazy-loaded
          isLeaf: false,
          loaded: false
        });
      });
    }
    
    // 3. Maps — leaf nodes, no expand icon
    if (partition.map && partition.map.length > 0) {
      partition.map.forEach((map: any) => {
        result.push({
          id: `map_${map.mapId}`,
          label: map.mapName,
          type: 'map',
          data: map,
          isLeaf: true, // map is a leaf node
          loaded: true
        });
      });
    }
    
    // 4. Views — leaf nodes, no expand icon
    if (partition.view && partition.view.length > 0) {
      partition.view.forEach((view: any) => {
        result.push({
          id: `view_${view.viewId}`,
          label: view.viewName,
          type: 'view',
          data: view,
          isLeaf: true, // view is a leaf node
          loaded: true
        });
      });
    }
  });
  
  return result;
};

// Loading state and cache
let isLoading = ref(false);
let deviceCache = new Map(); // cache device channel data

const getDeviceList = async () => {
  if (isLoading.value) {
    return;
  }
  
  isLoading.value = true;
  try {
    channelData.value = [];
    const res = await GetDevPartitionApi();
    if (res.status == 200 && res.data.code == 0) {
      const result = res.data.result;
      // Flatten helper, sorted by priority
      const list = flattenRootNodes(result);
      
      const deviceItems = list.filter(item => item.type === 'device' && item.data && item.data.token);
      
      const batchSize = 3;
      for (let i = 0; i < deviceItems.length; i += batchSize) {
        const batch = deviceItems.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (item) => {
            try {
              // Check cache
              const cacheKey = item.data.token;
              if (deviceCache.has(cacheKey)) {
                const cachedData = deviceCache.get(cacheKey);
                if (cachedData.length > 0) {
                  item.children = cachedData;
                  item.loaded = true;
                  item.isLeaf = false;
                } else {
                  delete item.children;
                  item.loaded = true;
                  item.isLeaf = true;
                }
                return;
              }
              
              const ress = await GetDeviceChannels(item.data.token);
              if (ress.status == 200 && ress.data.code == 0 && ress.data.result.length > 0) {
                // Convert channel data to tree nodes, preserving online status
                const channels = ress.data.result.map((channel: any, index: number) => ({
                  id: `channel_${item.data.devId}_${index}`,
                  label: channel.name || `channel ${index + 1}`,
                  name: channel.name || `channel ${index + 1}`,
                  token: channel.token,
                  online: channel.online,
                  type: 'device', // channels share type=device, differentiated by isDeviceChannel
                  data: channel,
                  isLeaf: true,
                  isDeviceChannel: true // mark as device channel
                }));
                
                // Cache data
                deviceCache.set(cacheKey, channels);
                
                item.children = channels;
                item.loaded = true;
                item.isLeaf = false;
              } else {
                // Cache empty result
                deviceCache.set(cacheKey, []);
                
                delete item.children;
                item.loaded = true;
                item.isLeaf = false; // mark as leaf
              }
            } catch (error) {
              delete item.children;
              item.loaded = true;
              item.isLeaf = false;
            }
          })
        );
        
        if (i + batchSize < deviceItems.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      channelData.value = list;
    }
    expandedKeys.value = getAllKeys(channelData.value);
  } finally {
    isLoading.value = false;
  }
}

const xzvalue = ref<Date>(new Date())
const customDateArr = ref<any>([])    // stores marked date array
// let monthChangeHandler: EventListener | null = null;
const input_ch = () => {    // triggered when date-picker value changes
  if (!UPlayerList.value) return;
  UPlayerList.value.setAllPosition(xzvalue.value.getTime()).then(() => {
    UPlayerList.value.playAll(xzvalue.value.getTime());
  })
}
const isShow = async () => {    // on focus: show date panel
  await nextTick();
  customDateArr.value = [];
  const year = xzvalue.value.getFullYear();
  const month = xzvalue.value.getMonth() + 1;

  if (!selectCellId.value) return;
  const sdk = PlayingArr.value.find(item => item.conf.videoid == selectCellId.value);
  if (sdk && sdk.conf.token) {
    await SearchRecordCalendar(sdk.conf.token, year, month);
    markRecordDates(year, month)
  }
}
const closePicker = () => {
    document
      .querySelectorAll('.date-picker td.available')
      .forEach(td => {
          td.classList.remove('custom_date_class')
      })
}
const monthChange = async (panelDate: Date, type: 'month' | 'year') => {   // reload on month/year change
  const year = panelDate.getFullYear()
  const month = panelDate.getMonth() + 1 // 0-based
  // console.log(type, year, month)
  const sdk = PlayingArr.value.find(item => item.conf.videoid === selectCellId.value);
  if (sdk && sdk.conf.token) {
    await SearchRecordCalendar(sdk.conf.token, year, month)
    markRecordDates(year, month)
  }
}
const SearchRecordCalendar = async (token: string, year: number, month: number) => {    // fetch recording dates for given year/month
  customDateArr.value = [];
  // $('.available').removeClass('custom_date_class');
  let res = await GetRecordCalendar(token, year, month);
  if (res.status == 200 && res.data.record) {
    res.data.record.forEach((key: any) => {
      if (key.bHasRec || key.bHasAlarmRec) {
        const m = String(month).padStart(2, '0')
        const d = String(key.nDay).padStart(2, '0')
        const dateStr = `${year}-${m}-${d}T00:00:00+08:00`
        customDateArr.value.push(new Date(dateStr).getTime())
      }
    })
  }
}
const markRecordDates = (year: number, month: number) => {
  nextTick(() => {
    document
      .querySelectorAll('.date-picker td.available')
      .forEach(td => {
        const span = td.querySelector('span')
        if (!span) return

        const day = span.textContent?.padStart(2, '0')
        if (!day) return

        const m = String(month).padStart(2, '0')
        const dateStr = `${year}-${m}-${day}T00:00:00+08:00`
        const time = new Date(dateStr).getTime()

        if (customDateArr.value.includes(time)) {
          td.classList.add('custom_date_class')
        } else {
          td.classList.remove('custom_date_class')
        }
      })
  })
}

const gotoLive = async () => {  // switch to live view
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
  if (isLiveview.value) {
    region.value = '1.0';
    return;   // no-op in live mode
  }
  if (!UPlayerList.value.UPlayerSDKList.length) return;   // no-op when no player instance
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
  if (!UPlayerList.value.UPlayerSDKList.length) return; // no-op when no player instance
  if (isLiveview.value) return;   // no-op in live mode
  if (isPlaying.value) {
    UPlayerList.value.pauseAll()
  } else {
    UPlayerList.value.playAll()
  }
  isPlaying.value = !isPlaying.value;
}

const Alloffvideo = () => { // close all videos and cells
  if (!UPlayerList.value) return;
  if (PlayingArr.value.length == 0) return;
  const notPlaybackArr = PlayingArr.value.filter(item => !PlayBackArr.value.includes(item));
  if (notPlaybackArr && notPlaybackArr.length > 0) {
    notPlaybackArr.forEach(item => {
      item.destroy();
    })
  }
  PlayingArr.value = [];
  PlayBackArr.value = [];
  UPlayerList.value.destroyAll();
  isLiveview.value = true;
  isPlaying.value = false;
  mainSDKId.value = '';
  playingIdArr.value = [];
  // localStorage.setItem('view-playing', JSON.stringify([]))
  const cellFactory = async (cell: any) => {
  }
  GridManager.value.reloadStageConfiguration(cellFactory)
}

const panelFullScreen = (event: any) => { // enter/exit fullscreen
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

const getRecordingIcon = (node: TreeNode) => {
  if (isChannelPlaying(node)) {
    return '#icon-lvshexiangji';
  }
  return getNodeIcon(node);
};

const playingIdArr = ref<string[]>([])

// Find device tree node ID by token
const findNodeIdByToken = (token: string): string | null => {
  const findInNodes = (nodes: TreeNode[]): string | null => {
    for (const node of nodes) {
      if (node.data && node.data.token === token) {
        return node.id;
      }
      if (node.children && node.children.length > 0) {
        const found = findInNodes(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  
  return findInNodes(channelData.value);
};

const updatePlayingStatus = (type: string, id: string) => {
  if (!id) return;
  
  if (type == 'add') {
    // Add playback state, checking for duplicates
    if (!playingIdArr.value.includes(id)) {
      playingIdArr.value.push(id);
    }
  } else if (type == 'del') {
    // Remove playback state
    playingIdArr.value = playingIdArr.value.filter(item => item !== id);
  }
  
  // console.log('playingIdArr after update =>', playingIdArr.value);
}

// Check if channel is playing
const isChannelPlaying = (node: TreeNode) => {
  if (!node.data) return false;
  
  // Check playback state on leaf/channel nodes and view nodes only
  // Prevent parent device nodes from showing playback state
  if (!node.isLeaf && !node.isDeviceChannel && node.type !== 'view') return false;
  
  // Check if node is in playing list
  const isPlaying = playingIdArr.value.includes(node.id);
  if (isPlaying) {
    console.log('isChannelPlaying', node.id, node.label);
  }
  return isPlaying;
};

// Get node icon
const getNodeIcon = (node: TreeNode) => {
  // console.log('getNodeIcon', node)
  switch (node.type) {
    case 'partition':
      // Sub-partition nodes use icon-gen
      return 'icon-gen';
    case 'device':
      // Channel leaf nodes use camera icon
      if (node.isLeaf || node.isDeviceChannel) {
        if (node.data.recording) {
          if (store.darkMode) {
            return '#icon-baishexiangji'
          } else {
            return '#icon-heishexiangji'
          }
        }
        return 'icon-shexiangjizaixian';
      }
      // Devices in dev use icon-Device
      return 'icon-Device';
    case 'map':
      // Map nodes use icon-ditu
      return 'icon-ditu';
    case 'view':
      // View nodes use icon-shipin
      return 'icon-shitu2';
    default:
      return 'icon-gen';
  }
};

// Get node CSS class
const getNodeClass = (node: TreeNode) => {
  const classes = ['tree-node'];
  if (node.type === 'device') {
    // Get online status
    const isOnline = node.online !== undefined ? node.online : (node.data && node.data.online);
    
    if (isOnline) {
      classes.push('device-online');
    } else {
      classes.push('device-offline');
    }
  }
  return classes.join(' ');
};

// Get node colour
const getNodeColor = (node: TreeNode) => {
  if (node.type === 'device') {
    // Get online status
    const isOnline = node.online !== undefined ? node.online : (node.data && node.data.online);
    return isOnline ? '1' : '0.6';
  }
  return '1';
};

// Debounced refresh
let refreshTimer: any = null;
const refresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  refreshTimer = setTimeout(() => {
    // Clear cache and force reload
    deviceCache.clear();
    getDeviceList();
  }, 300);
}

watch(isLiveview, (newVal) => {
  if (newVal) {
    console.log('isLivevie watch =>', newVal);
    // Remove playback-group borders and active selection styles
    document.querySelectorAll('.grid_cell.blue_dashed').forEach(el => el.classList.remove('blue_dashed'))
    document.querySelectorAll('.grid_cell.playback_check_border').forEach(el => el.classList.remove('playback_check_border'))
    // Apply selection highlight in live mode
    const target = document.getElementById(mainSDKId.value);
    if (target) target.classList.add('red_border')
  } else {
    console.log('isLiveview watch >', newVal)
    document.querySelectorAll('.grid_cell.red_border')
      .forEach(el => el.classList.remove('red_border'))
    PlayBackArr.value.forEach(item => {
      const target = document.getElementById('G' + item.conf.videoid);
      if (target) target.classList.add('blue_dashed')
    })
    const currentTargetarget = document.getElementById(mainSDKId.value);
    if (currentTargetarget) {
      currentTargetarget.classList.add('playback_check_border')
    }
  }
})

onMounted(() => {
  getDeviceList();
  initGridLayout();
  initUPlayList();
})

onBeforeUnmount(() => {
  // Alloffvideo()
  if (UPlayerList.value) {
    UPlayerList.value.destroyAll();
    // const arr = PlayingArr.value.map(item => item.conf)
    // localStorage.setItem('view-playing', JSON.stringify(arr));
    PlayingArr.value = [];
    PlayBackArr.value = [];
    UPlayerList.value.destroyAll();
    isLiveview.value = true;
    isPlaying.value = false;
    mainSDKId.value = '';
  }
  GridManager.value.removeEventListener('closeCell', gridListener.closeCellHandler)
  GridManager.value.removeEventListener('recEnableClick', gridListener.recEnableHandler)
  GridManager.value.removeEventListener('cellClick', gridListener.changeMainSDKHandler)
  GridManager.value.removeEventListener('Information', gridListener.InformationHandler)
  GridManager.value.removeEventListener('Snapshot', gridListener.SnapshotHandler)
  GridManager.value.removeEventListener('Shoutwheat', gridListener.ShoutwheatHandler)
  GridManager.value.removeEventListener('PtzControlShow', gridListener.PtzControlShowHandler)
  GridManager.value.removeEventListener('layoutLoadedFromCache', gridListener.layoutLoadedFromCacheHandler)
  GridManager.value.destroy();
  GridManager.value = null;
})

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
    .icon {
      width: 16px;
      height: 16px;
      // vertical-align: 15px;
      fill: currentColor;
      overflow: hidden;
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
          width: 20%;
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
  .red_border {
    border: #f44336 2px solid;
  }
  .blue_dashed {
    border: #0399FE 2px dashed;
  }
  .playback_check_border {
    border: #CDFF00 2px solid;
  }
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
    i, span {
      margin-left: 10px;
      font-size: 16px;
      cursor: pointer;
      color: #fff;
    }
    span {
      font-size: 14px;
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
.malv {
  position: absolute;
  top: 20px;
  right: 16px;
  z-index: 100;
  width: 336px;
  height: 150px;
  // background-color: grey;
  display: flex;
  transition: 0.2s;
  .malv-close {
    position: absolute;
    top: 3px;
    right: 8px;
    font-size: 16px;
    cursor: pointer;
  }
  .malv-left, .malv-right {
    width: 50%;
    height: 100%;
    background-color: rgba($color: #333, $alpha: 0.5);
    .information_title {
      width: 100%;
      height: 30px;
      line-height: 30px;
      background-color: rgba(0, 0, 0, 0.7);
      padding: 0 10px;
    }
    .information_content {
      width: 100%;
      display: flex;
      justify-content: space-between;
      padding: 0 2px;

      .information_content_left {
        width: 50%;
        color: #3ABBFE;
        text-align: left;
      }

      .information_content_right {
        width: 50%;
        color: #3ABBFE;
        text-align: left;
      }

    }
  }
}
.malv-hide {
  right: -336px;
}
.yuntai {
  position: absolute;
  left: 5px;
  bottom: 0;
  width: calc(15% - 6px);
  height: 550px;
  transition: 0.3s;
  background-color: rgba($color: #323232, $alpha: 1);
  .header {
    width: 100%;
    height: 32px;
    padding: 0 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba($color: #2A2A2A, $alpha: 1);
    i {
      display: block;
      width: 20px;
      height: 20px;
      line-height: 20px;
      text-align: center;
      border-radius: 50%;
      cursor: pointer;
      font-size: 10px;
      background-color: #232323;
    }
  }
  .el-timeline {
    padding: 0 20px;
    margin-top: 10px;
    .el-timeline-item {
      padding: 0;
    }
    .el-timeline-item__wrapper {
      .el-timeline-item__timestamp {
        margin: 0;
        padding: 0;
      }
      .el-card {
        background-color: transparent;
        border: none;
      }
      .el-card__body {
        height: 26px;
        margin-bottom: 4px;
        padding: 0;
        background-color: rgba($color: #E5E7EB, $alpha: 0.12) !important;
      }
      .preset_bgc {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: transparent;
        padding: 0 10px;
        .preset_input{
          width: 150px;
          background-color: transparent;
          border: none;
          box-shadow: none;
          padding-left: 10px;
          color: #fff !important;
        }
        button {
          background-color: transparent;
          border: none;
          color: #fff !important;
          font-size: 16px;
          cursor: pointer;
        }
      }
    }
  }
  .ptz-slider {
    width: 100%;
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    .el-slider {
      width: 100%;
    }
  }
  .controls {
    width: 100%;
    height: 144px;
    display: flex;
    justify-content: space-between;
    padding: 0 20px;
    margin: 20px 0;
    .left {
      width: 70px;
      height: 100%;
      display: grid;
      grid-template-columns: repeat(2, 32px);
      grid-template-rows: repeat(4, 32px);
      grid-column-gap: 5px;
      grid-row-gap: 5px;
      i {
        display: flex;           // flex layout to centre text
        align-items: center;
        justify-content: center;
        background-color: rgba($color: #E5E7EB, $alpha: 0.12);
        border-radius: 4px;
        width: 32px;
        height: 32px;
        font-size: 20px;
        cursor: pointer;
      }
      i:active {
        color: #0399FE;
      }
    }
    .right {
      width: 144px;
      height: 100%;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      grid-column-gap: 0px;
      grid-row-gap: 0px;
      .ptz-item {
        background-color: rgba($color: #E5E7EB, $alpha: 0.12);
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;

        i {
          font-size: 22px;
        }
      }
      .shang {border-radius: 4px 4px 0 0; cursor: pointer;}
      .zuo {border-radius: 4px 0 0 4px; cursor: pointer;}
      .you {border-radius: 0 4px 4px 0; cursor: pointer;}
      .xia {border-radius: 0 0 4px 4px; cursor: pointer;}
      .corner {
        background-color: transparent;
        .zs, .ys, .zx, .yx {
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 4px;
          background-color: rgba($color: #E5E7EB, $alpha: 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          i {
            font-size: 20px;
          }
        }
        .zs {
          top: 0;
          left: 0;
        }
        .ys {
          top: 0;
          right: 0;
        }
        .zx {
          left: 0;
          bottom: 0;
        }
        .yx {
          right: 0;
          bottom: 0;
        }
      }
      .ptz-item:active {
        i {
          color: #0399FE;
        }
      }
    }
  }
}
.yuntai-hide {
  bottom: -550px;

}
.Audio_slider-bottom {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  width: 210px;

  i {
    // color: #999999;
    font-size: 20px;
  }

  .el-slider__runway {
    height: 3px;
    background-color: rgba(73, 74, 76, 0.5) !important;

    .el-slider__bar {
      height: 3px;
    }

    .el-slider__button-wrapper {
      height: 34px;
      width: 36px;

      .el-slider__button {
        width: 4px;
        border: 1px solid #409EFF;
        height: 12px;
        background-color: #409eff;
        border-radius: 0px;
      }
    }
  }
}
</style>