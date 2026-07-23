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
      <!-- 视频区 + 事件面板横向并排（对照 uscweb liveview_right display:flex row） -->
      <div class="view-right-body">
        <div class="view-right-main">
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
            <i class="iconfont play-mode-toggle"
               :class="playModeShow ? 'icon-shouqi' : 'icon-zhankai'"
               @click.stop="togglePlayMode"></i>
            <span v-show="playModeShow" class="protocol-label">{{ playModeText }}</span>
            <!-- 2. 音量 -->
            <i class="iconfont"
               :class="(cellAudioSliders[cell.id] ?? 0) === 0 ? 'icon-wusheng' : 'icon-shengyinkai'"
               style="font-size: 24px;"
               title="Volume"
               @click.stop="toggleCellAudio(cell.id)"></i>
            <!-- 3. 码率信息 -->
            <i v-if="getCellCamera(cell.id)"
               class="iconfont icon-yibiao"
               style="margin-left: 0;"
               title="Stream Info"
               @click.stop="showCellInfo(cell.id)"></i>
            <!-- 4. 对讲 -->
            <i v-if="getCellCamera(cell.id)"
               class="iconfont"
               :class="audioingCellId === cell.id ? 'icon-yuyinkai audio-active' : 'icon-yuyinguan'"
               title="Intercom"
               @click.stop="doShoutwheat(cell.id)"></i>
            <!-- 5. 截图 -->
            <i v-if="getCellCamera(cell.id)"
               class="iconfont icon-zhuapai"
               title="Screenshot"
               @click.stop="doSnapshot(cell.id)"></i>
            <!-- 6. 手动录像 -->
            <i v-if="getCellCamera(cell.id)"
               class="iconfont"
               :class="getCellCamera(cell.id)?.recording ? 'icon-fuwuluxiangzhong rec-active' : 'icon-fuwuluxiang'"
               title="Record"
               @click.stop="doManualRec(cell.id)"></i>
            <!-- 7. PTZ（格数 ≤ 9 显示） -->
            <i v-if="getCellCamera(cell.id) && gridCells.length <= 9"
               class="iconfont icon-yuntai"
               :title="t('Liveview.live_ptz')"
               @click.stop="showPtz(cell.id)"></i>
            <!-- 8. 3D 框选放大 -->
            <i v-if="getCellCamera(cell.id)"
               class="iconfont icon-fangda6"
               :class="{ 'expend-active': cell3DZoomId === cell.id }"
               title="3D Zoom"
               @click.stop="toggle3DZoom(cell.id)"></i>
            <!-- 9. 电子放大 -->
            <i v-if="getCellCamera(cell.id)"
               class="iconfont"
               :class="cellEZoomId === cell.id ? 'icon-suoxiao' : 'icon-fangda1'"
               title="E-Zoom"
               @click.stop="toggleEZoom(cell.id)"></i>
            <!-- 10. 单格全屏 -->
            <i class="iconfont"
               :class="cellFullscreenId === cell.id ? 'icon-suoxiao' : 'icon-fangda'"
               title="Fullscreen"
               @click.stop="toggleCellFullscreen(cell.id)"></i>
            <!-- 11. 关闭 -->
            <i v-if="getCellCamera(cell.id)"
               class="iconfont icon-guanbi"
               title="Close"
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

          <!-- 电子放大画布 -->
          <canvas :id="'ezoom-h'+cell.id" class="cell-ezoom-canvas"
                  :class="{ active: cellEZoomId === cell.id }"></canvas>

          <!-- 3D 框选画布 -->
          <canvas :id="'3dzoom-h'+cell.id" class="cell-3dzoom-canvas"
                  :class="{ active: cell3DZoomId === cell.id }"
                  @mousedown.stop="on3DMouseDown(cell.id, $event)"
                  @mousemove.stop="on3DMouseMove(cell.id, $event)"
                  @mouseup.stop="on3DMouseUp(cell.id, $event)"
                  @mouseleave.stop="on3DMouseLeave(cell.id)"></canvas>

          <!-- PTZ 云台面板-->
          <div v-if="ptzShow && ptzToken === getCellCamera(cell.id)?.token" class="yuntai" @click.stop>
            <div class="flex_content">
              <div class="content_zoom">
                <div class="key_zoom">
                  <div class="key_flex">
                    <div class="key_but" @mousedown="ptzAction('upleft')"    @mouseup="ptzAction('stop')" @touchstart.prevent="ptzAction('upleft')"    @touchend="ptzAction('stop')"><div style="width:50%;height:50%;margin-top:8%;margin-left:20%;border-radius:2px;"><i class="iconfont icon-zuoshang"></i></div></div>
                    <div class="key_but" @mousedown="ptzAction('up')"        @mouseup="ptzAction('stop')" @touchstart.prevent="ptzAction('up')"        @touchend="ptzAction('stop')"><div style="width:50%;height:50%;margin-top:10%;margin-left:30%;"><i class="iconfont icon-shang"></i></div></div>
                    <div class="key_but" @mousedown="ptzAction('upright')"   @mouseup="ptzAction('stop')" @touchstart.prevent="ptzAction('upright')"   @touchend="ptzAction('stop')"><div style="width:50%;height:50%;margin-top:8%;margin-left:30%;border-radius:2px;"><i class="iconfont icon-youshang"></i></div></div>
                    <div class="key_but" @mousedown="ptzAction('left')"      @mouseup="ptzAction('stop')" @touchstart.prevent="ptzAction('left')"      @touchend="ptzAction('stop')"><div style="width:50%;height:50%;margin-top:10%;margin-left:20%;"><i class="iconfont icon-zuo"></i></div></div>
                    <div class="key_but"></div>
                    <div class="key_but" @mousedown="ptzAction('right')"     @mouseup="ptzAction('stop')" @touchstart.prevent="ptzAction('right')"     @touchend="ptzAction('stop')"><div style="width:50%;height:50%;margin-top:10%;margin-left:30%;"><i class="iconfont icon-you"></i></div></div>
                    <div class="key_but" @mousedown="ptzAction('downleft')"  @mouseup="ptzAction('stop')" @touchstart.prevent="ptzAction('downleft')"  @touchend="ptzAction('stop')"><div style="width:50%;height:50%;margin-top:15%;margin-left:20%;border-radius:2px;"><i class="iconfont icon-zuoxia"></i></div></div>
                    <div class="key_but" @mousedown="ptzAction('down')"      @mouseup="ptzAction('stop')" @touchstart.prevent="ptzAction('down')"      @touchend="ptzAction('stop')"><div style="width:50%;height:50%;margin-top:18%;margin-left:30%;"><i class="iconfont icon-xia"></i></div></div>
                    <div class="key_but" @mousedown="ptzAction('downright')" @mouseup="ptzAction('stop')" @touchstart.prevent="ptzAction('downright')" @touchend="ptzAction('stop')"><div style="width:50%;height:50%;margin-top:15%;margin-left:30%;border-radius:2px;"><i class="iconfont icon-youxia"></i></div></div>
                  </div>
                </div>
              </div>
              <div class="zoom_g">
                <button class="iconfont icon-jujiao2    zoom_add" @mousedown="ptzAction('focusin')"  @mouseup="ptzAction('stop')"></button>
                <button class="iconfont icon-jujiao1    zoom_add" @mousedown="ptzAction('focusout')" @mouseup="ptzAction('stop')"></button>
                <button class="iconfont icon-guangquanjia  zoom_add" @mousedown="ptzAction('irisin')"   @mouseup="ptzAction('stop')"></button>
                <button class="iconfont icon-guangquanjian zoom_add" @mousedown="ptzAction('irisout')"  @mouseup="ptzAction('stop')"></button>
                <button class="iconfont icon-light-open    zoom_add" @mousedown="ptzAction('lighton')"  @mouseup="ptzAction('stop')"></button>
                <button class="iconfont icon-light-close   zoom_add" @mousedown="ptzAction('lightoff')" @mouseup="ptzAction('stop')"></button>
                <button class="iconfont icon-kaiyushua     zoom_add" @mousedown="ptzAction('wiperon')"  @mouseup="ptzAction('stop')"></button>
                <button class="iconfont icon-guanyushua    zoom_add" @mousedown="ptzAction('wiperoff')" @mouseup="ptzAction('stop')"></button>
              </div>
              <div class="Preset">
                <div style="text-align:center;">
                  <el-slider v-model="ptzSpeed" :show-tooltip="false" :max="1" :min="0.1" :step="0.1" />
                  <span style="color:#fff;">{{ ptzSpeed }}</span>
                </div>
                <div class="block">
                  <el-timeline>
                    <el-timeline-item placement="top" v-for="pre in presetList" :key="pre.strToken">
                      <el-card>
                        <div class="preset_bgc">
                          <input type="text" class="preset_input" :value="pre.strName" />
                          <button class="iconfont icon-RectangleCopy1" @click="gotoPreset(pre.strToken)"></button>
                          <button class="iconfont icon-icon-test1"     @click="setPreset(pre.strToken,$event)"></button>
                        </div>
                      </el-card>
                    </el-timeline-item>
                  </el-timeline>
                </div>
              </div>
            </div>
          </div>
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
          <!-- 最左：中心存储 / 设备存储切换（对照 GridView storage_box） -->
          <div class="storage_box">
            <div v-if="store.PlaybackShowStorageMode" class="storage_mode">
              <div class="CentralStorage"
                :class="{ active: store.DefaultStorage === 'CentralStorage' }"
                @click="setStorageCentral">{{ t('Cascade.cascade_central_record') }}</div>
              <div class="DeviceStorage"
                :class="{ active: store.DefaultStorage === 'DeviceStorage' }"
                @click="setStorageDevice">{{ t('Playback.pb_device_record') }}</div>
            </div>
          </div>
          <!-- 中：导出 + 日期 + 速度 + 播放/暂停 + 音量 -->
          <div class="control-center">
            <button class="export-btn" @click="toggleCropping">
              <i class="iconfont icon-jiequ"></i>
            </button>
            <el-date-picker class="fixed_input" v-model="xzvalue" size="small" @change="onDateChange"
              @focus="onDateFocus" @blur="onDateBlur"
              :cell-class-name="pickerOptions.cellClassName"
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
          <!-- 最右：计划 / 手动 / 报警标识（对照 GridView caveat_butt） -->
          <div class="caveat_butt">
            <div class="showRecodeType" @click="showRecodeType = !showRecodeType">
              <i class="iconfont" :class="showRecodeType ? 'icon-youjiantou' : 'icon-zuojiantou'"></i>
            </div>
            <div class="recodeType" v-if="showRecodeType" style="padding:0 10px;">
              <button class="mr-0"></button>{{ t('CommTableEdit.comm_schedule') }}
              <button class="mr-1"></button>{{ t('CommTableEdit.comm_manual') }}
              <button class="mr-2"></button>{{ t('CommTableEdit.comm_alarm') }}
            </div>
          </div>
        </div>
      </div>

      </div><!-- /view-right-main -->

      <!-- ── Event 面板（对照 uscweb Liveview alarm_right_right） ── -->
      <div v-show="eventPanelShow" class="event-panel-right" style="width:22%;flex-shrink:0;">
        <div class="alarm_right_right">
          <div class="alarm_right_right_header">
            <div>{{ t('Analytics.ana_event') }}</div>
          </div>
          <div class="alarm_right_right_body">
            <div v-for="(item, index) in eventTableData.slice((eventCurrentPage-1)*eventPageSize, eventCurrentPage*eventPageSize)"
                 :key="index" class="alarm_right_right_content">
              <!-- 彩色 header：channel名 + 目标类型图标 -->
              <div class="content_header"
                   v-if="item.ruleType === 'USC_ANA_RULE_LPRE'"
                   :style="{ background: eventPriorityGradient1(Math.round((item.confidence??0)*100)) }">
                <span>{{ item.channelName }}</span>
                <span :class="'iconfont ' + (eventShapeObj[item.targetType] || '')" style="font-size:20px;"></span>
              </div>
              <div class="content_header"
                   v-else
                   :style="{ background: eventPriorityGradient(item.priority) }">
                <span>{{ item.channelName }}</span>
                <span :class="'iconfont ' + (eventShapeObj[item.targetType] || '')" style="font-size:20px;"></span>
              </div>
              <!-- body -->
              <div class="content_body">
                <div class="content_body_top">
                  <el-popover v-if="item.img" placement="right" trigger="hover">
                    <img :src="'data:image/jpeg;base64,'+item.img" style="max-height:300px;max-width:400px;" alt="" />
                    <template #reference>
                      <img :src="'data:image/jpeg;base64,'+item.img" alt=""
                           style="max-height:100%;max-width:100%;object-fit:contain;cursor:pointer;"
                           @click="clickEventImg(item)" />
                    </template>
                  </el-popover>
                </div>
                <div class="content_body_bottom">
                  <div>
                    <p class="label" v-if="item.ruleType==='USC_ANA_RULE_FARE'">Name:</p>
                    <p class="label" v-else-if="item.ruleType==='USC_ANA_RULE_LPRE'">{{ t('Analytics.ana_license_plate') }}:</p>
                    <p class="label" v-else>{{ t('Analytics.ana_event') }}:</p>
                    <p class="content"
                       v-if="item.ruleType==='USC_ANA_RULE_FARE'||item.ruleType==='USC_ANA_RULE_LPRE'"
                       :style="{ color: eventConfidenceColor(Math.round((item.confidence??0)*100)) }">{{ item.strEntity }}</p>
                    <p class="content" v-else>{{ item.anaEvent }}</p>
                    <p class="label">{{ t('CommTable.comm_table_time') }}:</p>
                    <p class="content">{{ item.time ? item.time.replace('T',' ').split('+')[0].split('.')[0] : '' }}</p>
                  </div>
                  <div style="margin-left:10px;flex:1;">
                    <p class="label">Confidence:</p>
                    <p :style="{ color: eventConfidenceColor(Math.round((item.confidence??0)*100)) }">
                      {{ Math.round((item.confidence??0)*100) }}%
                    </p>
                    <p class="label">{{ t('Analytics.ana_rule_type') }}:</p>
                    <p class="content">{{ eventRuleTypes[item.ruleType] || item.ruleType }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="alarm_right_right_footer">
            <el-pagination layout="prev, pager, next" :pager-count="5"
                           :page-size="eventPageSize" :total="eventTotal"
                           :current-page="eventCurrentPage"
                           @current-change="(v: number) => eventCurrentPage = v" />
          </div>
        </div>
      </div><!-- /event-panel-right -->
      </div><!-- /view-right-body -->

      <!-- 底部 footer（对照uscweb liveview_footer） -->
      <div class="liveview_footer">
        <div class="BlankPlaceholder"></div>
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
              <el-button class="iconfont icon-gongge" @click="loadCustomLayouts"></el-button>
            </template>
          </el-popover>
          <el-button class="iconfont icon-quanping1" @click="toggleFullscreen"></el-button>
          <el-button class="iconfont"
                     :class="eventPanelShow ? 'icon-youjiantou' : 'icon-zuojiantou'"
                     @click="toggleEventPanel"></el-button>
        </div>
      </div>
    </div>

    <div v-if="isTreeFold" class="unfold-btn" @click="toggleTreeFold">
      <i class="iconfont icon-liebiao"></i>
    </div>

    <!-- Add View Dialog -->
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
import { UPlayerSDK as UPlayerSDKClass, UPlayerList as UPlayerListClass, H5sPlayerWS2, Timeline } from '@/assets/js/uplayersdk.esm.js'
import { useUserStore } from '@/store/user'
import { useStore } from '@/store'
import { GetDevPartitionApi } from '@/api/configuration/device'
import { H5sPlayerAudBack } from '@/assets/js/h5splayer.js'
import {
  GetDeviceChannels, getSearchDeviceRecordByTimeApi, getSearchStorRecordByTimeApi, GetRecordCalendar,
  setRecEnableApi, GetInformationDataApi, GetPresetsApi, PresetJumpApi, SetPresetApi, PtzApi,
} from '@/api/channel'
import { UpdateUserConfigApi } from '@/api/system'
import { GetViewApi, CreateViewApi, UpdateViewApi, DeleteViewApi, GetLayoutListApi, CreateLayoutApi, DeleteLayoutApi } from '@/api/view'
import uuid from '@/assets/js/uuid.js'
import Gird1 from './Gird1.vue'
import { H5jsEvent } from '@/assets/js/h5jsevent.js'
import { GetAnaEventApi } from '@/api/Analytics/setting'
import http from '@/api/http'

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
const UPlayerList    = ref<any>(null)                        // 保留字段兼容旧调用（不再使用）
let   viewTimeline: any = null                               // Timeline 实例（仅回放模式）
const pbPlayerMap    = new Map<string, any>()               // cellId → { v1: H5sPlayerWS2, conf }
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
const customDateArr   = ref<number[]>([])

// ─── Float-layer state（对照 GridView）───────────────────────────────────
const audioingCellId  = ref('')           // 正在对讲的 cellId
let   audioback: any  = null              // H5sPlayerAudBack 实例
const infoShow        = ref(false)        // 码率信息面板显隐
const infoToken       = ref('')           // 当前显示码率信息的摄像头 token
const infoVideo       = ref<any[]>([])    // 码率信息-视频
const infoAudio       = ref<any[]>([])    // 码率信息-音频
let   timerRunInfo: any = null            // 码率轮询定时器（对照 GridView）
const ptzShow         = ref(false)        // PTZ 面板显隐
const ptzToken        = ref('')           // 当前 PTZ token
const ptzSpeed        = ref(0.5)          // PTZ 速度
const presetList      = ref<any[]>([])    // PTZ 预置位列表

const pickerOptions   = {
  cellClassName(date: Date) {
    return customDateArr.value.indexOf(date.getTime()) !== -1 ? 'custom_date_class' : ''
  }
}

const playModeText = computed(() => (isLiveview.value ? store.liveviewrtc : store.liveviewrtc1))
const playModeShow = ref(false)
const togglePlayMode = () => {
  playModeShow.value = !playModeShow.value
}

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

// ─── 回放模式下为单个格子构建 H5sPlayerWS2 回放播放器 ────────────────────
// placeCamera 始终创建实时播放器；拖入/点击后若处于回放模式，调此函数转换
const buildPbPlayer = async (cellId: string) => {
  const cam = cameraMap.value.get(cellId)
  if (!cam) return
  // 销毁刚创建的实时播放器
  const live = playerMap.get(cellId)
  if (live) { try { live.destroy?.() } catch {} ; playerMap.delete(cellId) }
  // 销毁该格旧的回放播放器（若有）
  const old = pbPlayerMap.get(cellId)
  if (old) { try { old.v1?.disconnect(); delete old.v1 } catch {} ; pbPlayerMap.delete(cellId) }

  await nextTick()
  const d = xzvalue.value instanceof Date ? xzvalue.value : new Date(xzvalue.value ?? Date.now())
  d.setHours(0, 0, 0, 0)
  const de = new Date(d); de.setHours(23, 59, 59, 999)
  const Adswitch = store.DefaultStorage === 'CentralStorage' ? 'true' : 'false'
  const baseUrl = new URL(userStore.IPPORT || window.location.origin)
  const vid = cam.videoid
  const conf: any = {
    videoid: vid,
    protocol: baseUrl.protocol, host: userStore.WSROOT,
    rootpath: '/', token: cam.token, serverpb: Adswitch,
    pbconf: {
      begintime: formatTime(d), endtime: formatTime(de),
      autoplay: 'true', showposter: 'false',
      callback: pbPlaybackCB, serverpb: Adswitch,
      userdata: { videoid: vid },
    },
    hlsver: 'v1', consolelog: 'false',
    session: userStore.session, resourceUUID: cam.resourceUUID,
    name: cam.name,
  }
  const container = document.getElementById('h' + cellId)
  if (container) {
    container.querySelectorAll('video, canvas').forEach(el => el.remove())
    const video = document.createElement('video')
    Object.assign(video.style, { position:'absolute', width:'100%', height:'100%', top:'0', left:'0', display:'block' })
    video.id = vid; video.controls = false; video.muted = true; video.autoplay = true
    container.appendChild(video)
  }
  const item = { v1: new H5sPlayerWS2(conf), conf }
  item.v1.connect()
  pbPlayerMap.set(cellId, item)
  isPlaying.value = true
  // 加载/刷新时间轴色块
  await getViewEventBar(cam.token, d)
}

const onNodeClick = async (data: TreeNode) => {
  if (data.type === 'view' && data.data?.viewId) {
    await loadViewIntoGrid(data.data.viewId, data.id)
  } else if ((data.isDeviceChannel || data.isLeaf) && data.data?.token) {
    const emptyCells = gridCells.value.filter(c => !getCellCamera(c.id))
    if (!emptyCells.length) return
    const cell = emptyCells[nextCellIndex.value % emptyCells.length]
    nextCellIndex.value++
    await placeCamera(cell.id, data.data, data.id)
    // 回放模式下自动将刚添加的格子转换为回放播放器
    if (!isLiveview.value) await buildPbPlayer(cell.id)
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
  // 销毁旧播放器
  if (playerMap.has(cellId)) {
    try { playerMap.get(cellId)?.destroy?.() } catch(e) {}
    playerMap.delete(cellId)
  }
  // 同步销毁旧回放播放器（若该格子已有）
  if (pbPlayerMap.has(cellId)) {
    try { pbPlayerMap.get(cellId)?.v1?.disconnect() } catch {}
    pbPlayerMap.delete(cellId)
  }
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
  liveviewViewadd.value = liveviewViewadd.value.filter(x => x.strIndex !== `h${cellId}`)
  liveviewViewadd.value.push({ strIndex: `h${cellId}`, token: ch.token, resourceUUID: conf.resourceUUID, profile: 'main' })
  if (nodeId) { if (!playingNodeIds.value.includes(nodeId)) playingNodeIds.value.push(nodeId) }
  await nextTick()
  const container = document.getElementById('h' + cellId)
  if (!container) { console.warn('[placeCamera] container h%s not found', cellId); return }
  try {
    // placeCamera 始终以实时模式创建 UPlayerSDKClass 播放器
    // 若需要回放，调用 setLiveMode(false) 统一重建所有格子的回放播放器
    const player = new UPlayerSDKClass('h' + cellId, conf)
    playerMap.set(cellId, player)
    player.play()
    savePlayingState()
  } catch(e) { console.error('[placeCamera] error', e) }
}

const clearCell = (cellId: string) => {
  const player = playerMap.get(cellId)
  if (player) {
    try { player.destroy?.() } catch(e) {}
    playerMap.delete(cellId)
  }
  // 同步清理回放播放器，并移除手动注入的 <video> DOM 元素
  const pbItem = pbPlayerMap.get(cellId)
  if (pbItem) {
    try { pbItem.v1?.disconnect(); delete pbItem.v1 } catch {}
    pbPlayerMap.delete(cellId)
  }
  // 无论实时还是回放，清除容器内残留的 video/canvas 元素
  const container = document.getElementById('h' + cellId)
  if (container) {
    container.querySelectorAll('video, canvas').forEach(el => el.remove())
  }
  const cam = cameraMap.value.get(cellId)
  if (cam) {
    liveviewViewadd.value = liveviewViewadd.value.filter(x => x.strIndex !== `h${cellId}`)
    const stillPlaying = [...cameraMap.value.entries()].some(([id, c]) => id !== cellId && c.token === cam.token)
    if (!stillPlaying && cam.nodeId) {
      playingNodeIds.value = playingNodeIds.value.filter(x => x !== cam.nodeId)
    }
    cameraMap.value.delete(cellId)
    savePlayingState()
  }
  // 最后一格关闭后：清除时间轴录像色块，重置播放状态（对照 GridView closePlayContainer）
  if (cameraMap.value.size === 0) {
    isPlaying.value = false
    if (viewTimeline) {
      viewTimeline.options.name = ''
      viewTimeline._initEventBarName?.()
      viewTimeline.updateMotionEvents?.([], null)
    }
  }
  if (selectedCellId.value === cellId) selectedCellId.value = ''
  if (expandedCellId.value === cellId) expandedCellId.value = ''
  // 清理悬浮按钮的额外状态
  stopCellExtra(cellId)
}

const clearAllPlayers = () => {
  playerMap.forEach(p => { try { p?.destroy?.() } catch(e){} })
  playerMap.clear()
  pbPlayerMap.forEach(item => { try { item.v1?.disconnect(); delete item.v1 } catch {} })
  pbPlayerMap.clear()
  cameraMap.value.clear(); liveviewViewadd.value = []; playingNodeIds.value = []
  selectedCellId.value = ''; expandedCellId.value = ''
  UPlayerList.value = null
  if (viewTimeline) {
    viewTimeline.removeEventListener?.('resume', () => {})
    viewTimeline.removeEventListener?.('timelineCurrentTime', () => {})
    viewTimeline.clearMotionBars?.()
    viewTimeline = null
  }
  isPlaying.value = false; isLiveview.value = true
  localStorage.removeItem('hpro-view-state')
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
  if (!raw) {
    // 无保存状态时应用用户配置的默认视图
    const defaultView = store.DefaultView
    if (defaultView && defaultView !== 1) {
      changeLayout(String(defaultView))
    }
    return
  }
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
    // 回放模式下自动将刚添加的格子转换为回放播放器
    if (!isLiveview.value) await buildPbPlayer(cellId)
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

// ─── Live / Playback toggle（对照 GridView setLiveMode + resetPlayMode）──
const setLiveMode = async (live: boolean) => {
  isLiveview.value = live

  if (live) {
    // ── 切回实时 ──
    // 销毁回放播放器
    pbPlayerMap.forEach(item => { try { item.v1?.disconnect(); delete item.v1 } catch {} })
    pbPlayerMap.clear()
    // 销毁旧的实时播放器（placeCamera 会重建）
    playerMap.forEach(p => { try { p?.destroy?.() } catch {} })
    playerMap.clear()
    // 用当前 cameraMap 重建所有实时播放器
    const entries = [...cameraMap.value.entries()]
    for (const [cellId, cam] of entries) {
      await placeCamera(cellId, {
        token: cam.token, name: cam.name,
        uuid: cam.resourceUUID, resourceUUID: cam.resourceUUID,
        recording: cam.recording,
      }, cam.nodeId)
    }
    // 有画面才设为播放中，无画面保持停止状态
    if (cameraMap.value.size > 0) isPlaying.value = true

  } else {
    // ── 切到回放（对照 GridView resetPlayMode）──
    await nextTick()
    // 初始化 Timeline（仅一次）
    if (!viewTimeline) initViewTimeline()

    const d = new Date(); d.setHours(0, 0, 0, 0)
    const de = new Date(d); de.setHours(23, 59, 59, 999)
    const st = d.getTime(), et = de.getTime()
    const Adswitch = store.DefaultStorage === 'CentralStorage' ? 'true' : 'false'
    xzvalue.value = d

    // 销毁已有实时播放器
    playerMap.forEach(p => { try { p?.destroy?.() } catch {} })
    playerMap.clear()
    // 销毁旧回放播放器
    pbPlayerMap.forEach(item => { try { item.v1?.disconnect(); delete item.v1 } catch {} })
    pbPlayerMap.clear()

    await nextTick()
    const baseUrl = new URL(userStore.IPPORT || window.location.origin)

    for (const [cellId, cam] of cameraMap.value.entries()) {
      const vid = cam.videoid
      const conf: any = {
        videoid: vid,
        protocol: baseUrl.protocol, host: userStore.WSROOT,
        rootpath: '/', token: cam.token, serverpb: Adswitch,
        pbconf: {
          begintime: formatTime(new Date(st)), endtime: formatTime(new Date(et)),
          autoplay: 'true', showposter: 'false',
          callback: pbPlaybackCB, serverpb: Adswitch,
          userdata: { videoid: vid },
        },
        hlsver: 'v1', consolelog: 'false',
        session: userStore.session, resourceUUID: cam.resourceUUID,
        name: cam.name,
      }

      // 清空容器旧内容，注入 <video> 供 H5sPlayerWS2 使用
      const container = document.getElementById('h' + cellId)
      if (container) {
        container.querySelectorAll('video, canvas').forEach(el => el.remove())
        const video = document.createElement('video')
        Object.assign(video.style, {
          position: 'absolute', width: '100%', height: '100%',
          top: '0', left: '0', display: 'block',
        })
        video.id = vid; video.controls = false; video.muted = true; video.autoplay = true
        container.appendChild(video)
      }

      const item = { v1: new H5sPlayerWS2(conf), conf }
      item.v1.connect()
      pbPlayerMap.set(cellId, item)
    }

    // 加载今天的录像色块
    const firstToken = [...cameraMap.value.values()][0]?.token
    if (firstToken) await getViewEventBar(firstToken, d)
    // 有画面才设为播放中，无画面保持停止状态
    if (pbPlayerMap.size > 0) isPlaying.value = true
  }
  savePlayingState()
}

// ─── Timeline 初始化（对照 GridView initTimeline）────────────────────────
const initViewTimeline = () => {
  viewTimeline = new Timeline('#view-timeline-svg', {
    timelineBackgroundColor: '#343434', singleEvent: true,
  })
  // 拖拽时间轴松手 → 所有回放播放器跳转
  viewTimeline.addEventListener('resume', (e: CustomEvent) => {
    if (!pbPlayerMap.size) return
    const t = e.detail ? new Date(e.detail) : new Date()
    xzvalue.value = t
    pbPlayerMap.forEach(item => { try { item.v1.moveto(formatTime(t)) } catch {} })
    const token = [...cameraMap.value.values()][0]?.token
    if (token) getViewEventBar(token, t)
    isPlaying.value = true
  })
  // 播放器内部时间更新 → 同步日期选择器
  viewTimeline.addEventListener('timelineCurrentTime', (e: CustomEvent) => {
    if (e.detail) xzvalue.value = new Date(e.detail)
  })
}

// ─── 回放 callback（对照 GridView playbackCB）────────────────────────────
const pbPlaybackCB = (event: string, userdata: any) => {
  const cellId = [...pbPlayerMap.entries()].find(([, v]) => v.conf.videoid === userdata?.videoid)?.[0]
  if (!cellId || cellId !== (selectedCellId.value || [...pbPlayerMap.keys()][0])) return
  try {
    const strTime = JSON.parse(event).strTime
    if (strTime && strTime !== 'none') {
      viewTimeline?.setCurrentTime(strTime)
      xzvalue.value = new Date(strTime)
    }
  } catch {}
}

// ─── 查录像时间段并更新时间轴色块（对照 GridView getEventBar）───────────
const getViewEventBar = async (token: string, date: Date) => {
  if (!viewTimeline || !token) return
  // 对照 GridView：start=前一天 00:00，end=当天 23:59（覆盖时间轴以"现在"为中心的完整可见范围）
  const end = new Date(date); end.setHours(23, 59, 59, 0)
  const start = new Date(date); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 1)
  try {
    const res = store.DefaultStorage === 'CentralStorage'
      ? await getSearchStorRecordByTimeApi(token, start.toISOString(), end.toISOString())
      : await getSearchDeviceRecordByTimeApi(token, start.toISOString(), end.toISOString())
    if (res.status === 200 && res.data?.record) {
      const name = [...cameraMap.value.values()][0]?.name ?? ''
      viewTimeline.options.name = name
      viewTimeline._initEventBarName?.()
      viewTimeline.updateMotionEvents?.(res.data.record, null)
    }
  } catch {}
}

// ─── 查录像时间段并更新时间轴色块 ────────────────────────────────────────
/** @deprecated 保留以兼容可能的外部引用，实际改用 getViewEventBar */
const loadRecordingBars = async (date: Date) => {
  const token = [...cameraMap.value.values()][0]?.token
  if (token) await getViewEventBar(token, date)
}

// ─── 日期选择器变更（对照 GridView onDateChange）────────────────────────
const onDateChange = async () => {
  if (!xzvalue.value || !pbPlayerMap.size) return
  const d = xzvalue.value instanceof Date ? xzvalue.value : new Date(xzvalue.value)
  const cellId = selectedCellId.value || [...pbPlayerMap.keys()][0]
  const item = pbPlayerMap.get(cellId)
  if (item) {
    item.v1.moveto(formatTime(d))
    const token = cameraMap.value.get(cellId)?.token
    if (token) await getViewEventBar(token, d)
  }
  isPlaying.value = true
}

// 日期选择器获焦 → 查询当月有录像的日期并高亮
const onDateFocus = async () => {
  await nextTick()
  const token = [...cameraMap.value.values()][0]?.token
  if (!token || !xzvalue.value) return
  const d = xzvalue.value instanceof Date ? xzvalue.value : new Date(xzvalue.value)
  SearchRecordCalendar(token, d.getFullYear(), d.getMonth() + 1)
}
const onDateBlur = () => {}

const SearchRecordCalendar = async (token: string, year: number, month: number) => {
  customDateArr.value = []
  try {
    const res = await GetRecordCalendar(token, year, month)
    res.data?.record?.forEach((key: any) => {
      if (key.bHasRec || key.bHasAlarmRec) {
        // 使用本地时区构造，避免固定 +08:00 偏移
        customDateArr.value.push(new Date(year, month - 1, key.nDay, 0, 0, 0, 0).getTime())
      }
    })
  } catch {}
}

const timeSpeed = (speed: string) => {
  if (isLiveview.value || !pbPlayerMap.size) return
  const cellId = selectedCellId.value || [...pbPlayerMap.keys()][0]
  pbPlayerMap.get(cellId)?.v1?.speed(speed)
}

const resumePlayback = () => {
  if (isLiveview.value || !pbPlayerMap.size) return
  const cellId = selectedCellId.value || [...pbPlayerMap.keys()][0]
  const item = pbPlayerMap.get(cellId)
  if (!item) return
  if (isPlaying.value) {
    item.v1.pause()
    isPlaying.value = false
  } else {
    item.v1.resume()
    isPlaying.value = true
  }
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

// ─── 悬浮按钮：音量（per-cell）─────────────────────────────────────────────
const cellAudioSliders  = reactive<Record<string, number>>({})
const cellAudioVisible  = ref('')

const toggleCellAudio = (cellId: string) => {
  if (cellAudioVisible.value === cellId) {
    cellAudioVisible.value = ''
  } else {
    if (!(cellId in cellAudioSliders)) cellAudioSliders[cellId] = 0
    cellAudioVisible.value = cellId
  }
}

const setCellVolume = (cellId: string, val: number) => {
  cellAudioSliders[cellId] = val
  try { playerMap.get(cellId)?.setVolume?.(val) } catch {}
}

// ─── 悬浮按钮：3D 框选放大 ──────────────────────────────────────────────────
const cell3DZoomId    = ref('')
interface ZoomRect { drawing: boolean; x0: number; y0: number; x1: number; y1: number }
const cell3DZoomState = reactive<Record<string, ZoomRect>>({})

const toggle3DZoom = (cellId: string) => {
  if (cell3DZoomId.value === cellId) {
    cell3DZoomId.value = ''
    _clear3DCanvas(cellId)
  } else {
    // 互斥：关电子放大
    if (cellEZoomId.value) toggleEZoom(cellEZoomId.value)
    cell3DZoomId.value = cellId
    cell3DZoomState[cellId] = { drawing: false, x0: 0, y0: 0, x1: 0, y1: 0 }
  }
}

const _clear3DCanvas = (cellId: string) => {
  const c = document.getElementById('3dzoom-h' + cellId) as HTMLCanvasElement | null
  if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height)
}

const _sync3DCanvasSize = (cellId: string) => {
  const container = document.getElementById('h' + cellId)
  const c = document.getElementById('3dzoom-h' + cellId) as HTMLCanvasElement | null
  if (container && c) { c.width = container.offsetWidth; c.height = container.offsetHeight }
}

const on3DMouseDown = (cellId: string, e: MouseEvent) => {
  if (cell3DZoomId.value !== cellId) return
  _sync3DCanvasSize(cellId)
  const c = document.getElementById('3dzoom-h' + cellId) as HTMLCanvasElement
  if (!c) return
  const rect = c.getBoundingClientRect()
  cell3DZoomState[cellId] = { drawing: true, x0: e.clientX - rect.left, y0: e.clientY - rect.top, x1: e.clientX - rect.left, y1: e.clientY - rect.top }
}

const on3DMouseMove = (cellId: string, e: MouseEvent) => {
  const st = cell3DZoomState[cellId]
  if (!st?.drawing) return
  const c = document.getElementById('3dzoom-h' + cellId) as HTMLCanvasElement
  if (!c) return
  const rect = c.getBoundingClientRect()
  st.x1 = e.clientX - rect.left; st.y1 = e.clientY - rect.top
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, c.width, c.height)
  ctx.strokeStyle = '#00FF00'; ctx.lineWidth = 1.5
  ctx.strokeRect(st.x0, st.y0, st.x1 - st.x0, st.y1 - st.y0)
}

const on3DMouseUp = (cellId: string, e: MouseEvent) => {
  const st = cell3DZoomState[cellId]
  if (!st?.drawing) return
  st.drawing = false
  const c = document.getElementById('3dzoom-h' + cellId) as HTMLCanvasElement
  if (!c || c.width === 0 || c.height === 0) return
  const x = Math.min(st.x0, st.x1) / c.width
  const y = Math.min(st.y0, st.y1) / c.height
  const w = Math.abs(st.x1 - st.x0) / c.width
  const h = Math.abs(st.y1 - st.y0) / c.height
  if (w < 0.02 || h < 0.02) { _clear3DCanvas(cellId); return }
  const cam = cameraMap.value.get(cellId)
  if (cam) {
    try { PtzApi(cam.token, 'selzoomin', ptzSpeed.value) } catch {}
  }
  _clear3DCanvas(cellId)
  // 框选完成后自动退出 3D 模式
  cell3DZoomId.value = ''
}

const on3DMouseLeave = (cellId: string) => {
  const st = cell3DZoomState[cellId]
  if (st?.drawing) { st.drawing = false; _clear3DCanvas(cellId) }
}

// ─── 悬浮按钮：电子放大（2× 中心裁剪）────────────────────────────────────
const cellEZoomId     = ref('')
const cellEZoomTimers = new Map<string, number>()

const toggleEZoom = (cellId: string) => {
  if (cellEZoomId.value === cellId) {
    cellEZoomId.value = ''
    const h = cellEZoomTimers.get(cellId)
    if (h !== undefined) { cancelAnimationFrame(h); cellEZoomTimers.delete(cellId) }
    const c = document.getElementById('ezoom-h' + cellId) as HTMLCanvasElement | null
    if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height)
  } else {
    // 互斥：关 3D 框选
    if (cell3DZoomId.value) toggle3DZoom(cell3DZoomId.value)
    const cam = cameraMap.value.get(cellId)
    if (!cam) return
    cellEZoomId.value = cellId
    nextTick(() => {
      const container = document.getElementById('h' + cellId)
      const c = document.getElementById('ezoom-h' + cellId) as HTMLCanvasElement | null
      if (!c || !container) return
      c.width = container.offsetWidth; c.height = container.offsetHeight
      const _loop = () => {
        if (cellEZoomId.value !== cellId) return
        const video = document.getElementById(cam.videoid) as HTMLVideoElement | null
        if (video && video.readyState >= 2 && video.videoWidth > 0) {
          const sw = video.videoWidth / 2
          const sh = video.videoHeight / 2
          const sx = sw / 2; const sy = sh / 2
          c.getContext('2d')?.drawImage(video, sx, sy, sw, sh, 0, 0, c.width, c.height)
        }
        cellEZoomTimers.set(cellId, requestAnimationFrame(_loop))
      }
      cellEZoomTimers.set(cellId, requestAnimationFrame(_loop))
    })
  }
}

// ─── 悬浮按钮：单格全屏 ───────────────────────────────────────────────────
const cellFullscreenId = ref('')

const toggleCellFullscreen = (cellId: string) => {
  const el = document.getElementById('h' + cellId) as any
  if (!el) return
  const doc = document as any
  if (doc.fullscreenElement || doc.webkitFullscreenElement) {
    ;(doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc)
  } else {
    ;(el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el)
    cellFullscreenId.value = cellId
  }
}

// fullscreenchange 监听：退出时重置
const _onFullscreenChange = () => {
  const doc = document as any
  if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
    cellFullscreenId.value = ''
  }
}

// ─── stopCellExtra：清理单格额外状态 ─────────────────────────────────────
const stopCellExtra = (cellId: string) => {
  if (cell3DZoomId.value === cellId) { cell3DZoomId.value = ''; _clear3DCanvas(cellId) }
  if (cellEZoomId.value === cellId) {
    cellEZoomId.value = ''
    const h = cellEZoomTimers.get(cellId)
    if (h !== undefined) { cancelAnimationFrame(h); cellEZoomTimers.delete(cellId) }
    const c = document.getElementById('ezoom-h' + cellId) as HTMLCanvasElement | null
    if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height)
  }
  if (cellAudioVisible.value === cellId) cellAudioVisible.value = ''
}

// ─── Event 面板状态 ────────────────────────────────────────────────────────
const eventPanelShow   = ref(localStorage.getItem('hpro-event-show') === 'true')
const eventTableData   = ref<any[]>([])
const eventCurrentPage = ref(1)
const eventPageSize    = 7
const eventTotal       = computed(() => eventTableData.value.length)
let   anaEventWS: any  = null
const faceList         = ref<any[]>([])

const eventRuleTypes: Record<string, string> = {
  'USC_ANA_RULE_MIAA': t('Analytics.ana_rule_miaa'),
  'USC_ANA_RULE_CRAL': t('Analytics.ana_rule_cral'),
  'USC_ANA_RULE_LOIT': t('Analytics.ana_rule_loit'),
  'USC_ANA_RULE_STVE': t('Analytics.ana_rule_stve'),
  'USC_ANA_RULE_VECT': t('Analytics.ana_rule_vect'),
  'USC_ANA_RULE_PECT': t('Analytics.ana_rule_pect'),
  'USC_ANA_RULE_PPE':  t('Analytics.ana_rule_ppe'),
  'USC_ANA_RULE_PEFA': t('Analytics.ana_rule_pefa'),
  'USC_ANA_RULE_FARE': t('Analytics.ana_face_recognition'),
  'USC_ANA_RULE_LPRE': t('Analytics.ana_lpre'),
  'USC_ANA_RULE_CROD': t('Analytics.ana_rule_crod'),
  'USC_ANA_RULE_FISM': 'Fire/Smoke Detection',
  'USC_ANA_RULE_FBLK': 'Fire Detection',
  'USC_ANA_RULE_FIGT': 'Fighting Detection',
}

// 目标类型图标（对照 uscweb shapeObj）
const eventShapeObj: Record<string, string> = {
  'person':     'icon-person',
  'vehicle':    'icon-vehicle',
  'motorcycle': 'icon-motorcycle',
  'bicycle':    'icon-bicycle',
  'car':        'icon-car',
  'truck':      'icon-truck',
  'bus':        'icon-bus',
  'face':       'icon-face',
}

// 优先级渐变色（对照 uscweb priorityLevelRight，固定 dark 主题背景 #1e1e1e）
const eventPriorityGradient = (priority: string): string => {
  const map: Record<string, string> = {
    Critical: 'linear-gradient(270deg, #7DDFDF 0%, #1e1e1e 100%)',
    High:     'linear-gradient(270deg, #D83D3D 0%, #1e1e1e 100%)',
    Low:      'linear-gradient(270deg, #00B75B 0%, #1e1e1e 100%)',
    Medium:   'linear-gradient(270deg, #F09C37 0%, #1e1e1e 100%)',
  }
  return map[priority] ?? 'linear-gradient(270deg, #555 0%, #1e1e1e 100%)'
}

// 置信度渐变色（车牌，对照 uscweb priorityLevelRight1）
const eventPriorityGradient1 = (confidence: number): string => {
  const colors = ['#6B84EE','#4F99E8','#33BA7F','#FF7C00','#FE5003']
  const idx = Math.min(Math.floor(confidence / 20), 4)
  return `linear-gradient(270deg, ${colors[idx]} 0%, rgba(0,0,0,0.1) 100%)`
}

// 置信度文字颜色
const eventConfidenceColor = (confidence: number): string => {
  const colors = ['#6B84EE','#4F99E8','#33BA7F','#FF7C00','#FE5003']
  return colors[Math.min(Math.floor(confidence / 20), 4)]
}

// ─── Event 面板数据方法 ───────────────────────────────────────────────────
const getFaceList = async () => {
  try {
    const res = await http({ url: '/uapi/v1/FaceLibrary/List', method: 'GET' })
    if (res.status === 200 && Array.isArray(res.data?.result)) {
      for (const lib of res.data.result) {
        try {
          const r2 = await http({
            url: `/uapi/v1/PersonLibrary/List?faceLibraryId=${lib.faceLibraryId}`,
            method: 'GET',
          })
          if (r2?.status === 200 && r2.data?.code === 0) {
            faceList.value.push(...(r2.data.result?.list ?? []))
          }
        } catch {}
      }
    }
  } catch {}
}

const getAnaEventList = async () => {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  try {
    const res = await GetAnaEventApi({
      pageIndex: 0,
      pageSize: 20,
      beginTime: formatTime(yesterday),
      endTime: formatTime(now),
      channelName: '',
      ruleTypes: [],
    })
    if (res.status === 200 && res.data.code === 0) {
      const raw: any[] = res.data.result.list ?? []
      eventTableData.value = raw.map((item: any) => {
        const row = { ...item, img: item.strJpeg || '' }
        if (item.ruleType === 'USC_ANA_RULE_FARE') {
          const person = faceList.value.find((p: any) => p.id === item.strEntity)
          row.strEntity = person ? person.personName : item.strEntity
        }
        return row
      })
    } else {
      console.warn('[getAnaEventList] unexpected response', res.data)
    }
  } catch(e) { console.warn('[getAnaEventList] error', e) }
}

const anaEventCB = (event: string) => {
  try {
    const msg = JSON.parse(event).msg
    const row: any = {
      anaName:      msg.strAnaName,
      channelName:  msg.strChannelName,
      targetType:   msg.strTargetType,
      anaEvent:     msg.strEvent,
      ruleType:     msg.strRuleType,
      time:         msg.strTime,
      priority:     msg.strPriority,
      confidence:   msg.nConfidence,
      img:          msg.strJpeg || '',
      channelToken: msg.strChannelToken,
      trackid:      msg.nTrackId,
      strEntity:    msg.strEntity,
    }
    if (row.ruleType === 'USC_ANA_RULE_FARE') {
      const person = faceList.value.find((p: any) => p.id === row.strEntity)
      row.strEntity = person ? person.personName : row.strEntity
    }
    if (eventTableData.value.length >= 70) eventTableData.value.pop()
    eventTableData.value.unshift(row)
  } catch {}
}

const setAnaEvent = () => {
  if (anaEventWS) return
  try {
    const baseUrl = new URL(userStore.IPPORT || window.location.origin)
    const conf = {
      protocol:   baseUrl.protocol,
      host:       userStore.WSROOT,
      rootpath:   '',
      apipath:    '/uapi/v1/ws/anaEvent',
      pbconf:     { callback: anaEventCB },
      userdata:   null,
      session:    userStore.session,
      consolelog: 'false',
    }
    anaEventWS = new H5jsEvent(conf)
    anaEventWS.connect()
  } catch(e) { console.warn('[setAnaEvent]', e) }
}

const closeAnaEvent = () => {
  if (anaEventWS) { anaEventWS.disconnect(); anaEventWS = null }
}

const toggleEventPanel = () => {
  eventPanelShow.value = !eventPanelShow.value
  localStorage.setItem('hpro-event-show', String(eventPanelShow.value))
}

const clickEventImg = async (row: any) => {
  if (!row.channelToken) return
  // 找当前选中格子，或找持有相同 token 的格子，或取第一格
  let targetCell = selectedCellId.value
  if (!targetCell || !cameraMap.value.has(targetCell)) {
    const entry = [...cameraMap.value.entries()].find(([, c]) => c.token === row.channelToken)
    targetCell = entry?.[0] ?? gridCells.value[0]?.id ?? ''
  }
  if (!targetCell) return
  try {
    const evtTime = new Date(row.time)
    const seekTime = new Date(evtTime.getTime() - 5000)
    xzvalue.value = seekTime
    if (isLiveview.value) await setLiveMode(false)
    const pbItem = pbPlayerMap.get(targetCell)
    if (pbItem) {
      pbItem.v1.moveto(formatTime(seekTime))
    } else {
      await buildPbPlayer(targetCell)
    }
    selectedCellId.value = targetCell
  } catch(e) { console.warn('[clickEventImg]', e) }
}

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
  // 直接复用 setLiveMode(true) 完成所有清理和重建逻辑
  await setLiveMode(true)
}

// ─── Storage type switch (CentralStorage / DeviceStorage) ────────────────
const rebuildPlaybackPlayers = () => {
  // 切换存储类型后，重新触发回放模式以使新的 serverpb 参数生效
  if (isLiveview.value) return
  setLiveMode(false)
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

// ─── Float-layer: 码率信息（对照 GridView showInfo / fetchInfo）──────────
const fetchCellInfo = async (token: string) => {
  if (!token) return
  try {
    const res = await GetInformationDataApi(token)
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
    // 再次点击同一格子 → 关闭并停止轮询
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

// ─── Float-layer: 对讲/喊话（对照 uscweb Shoutwheat）────────────────────
const doShoutwheat = (cellId: string) => {
  const cam = cameraMap.value.get(cellId)
  if (!cam) return
  if (audioingCellId.value === cellId) {
    // 关闭对讲
    audioback?.disconnect(); audioback = null
    audioingCellId.value = ''
  } else {
    audioback?.disconnect()
    // AudBack SDK 用旧式 navigator.getUserMedia(constraints, success) 仅传2个参数，
    // 但浏览器要求3个(constraints, success, error)，用 mediaDevices shim 修复。
    ;(navigator as any).getUserMedia = (
      constraints: MediaStreamConstraints,
      success: (s: MediaStream) => void,
      error?: (e: any) => void,
    ) => {
      navigator.mediaDevices.getUserMedia(constraints)
        .then(success)
        .catch(error ?? ((e: any) => console.warn('[doShoutwheat] getUserMedia error', e)))
    }
    audioback = new H5sPlayerAudBack({
      protocol: window.location.protocol, host: userStore.WSROOT, rootpath: '/',
      token: cam.token, session: userStore.session,
    })
    audioback.connect()
    audioingCellId.value = cellId
  }
}

// ─── Float-layer: 截图（对照 uscweb DoSnapshotWeb）───────────────────────
const doSnapshot = (cellId: string) => {
  const cam = cameraMap.value.get(cellId)
  if (!cam) return
  const video = document.getElementById(cam.videoid) as HTMLVideoElement | null
  if (!video) return
  const d = new Date()
  const fileName = `${cam.token}_${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth || 640
  canvas.height = video.videoHeight || 360
  canvas.getContext('2d')!.drawImage(video, 0, 0)
  const a = document.createElement('a')
  a.download = fileName + '.png'; a.href = canvas.toDataURL('image/png')
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}

// ─── Float-layer: 手动录像（对照 uscweb DoManualRecordStart）─────────────
const doManualRec = async (cellId: string) => {
  const cam = cameraMap.value.get(cellId)
  if (!cam) return
  const newState = !cam.recording
  try {
    const res = await setRecEnableApi({ devUUID: cam.resourceUUID, setting: { manualRecEnable: newState } })
    if (res.status === 200 && res.data.msg === 'Success') {
      cameraMap.value.set(cellId, { ...cam, recording: newState })
      ElMessage.success(newState ? t('Liveview.live_rec_start') : t('Liveview.live_rec_stop'))
    } else {
      ElMessage.error(t('CommTableEdit.comm_modify_failed'))
    }
  } catch {
    ElMessage.error(t('CommTableEdit.comm_modify_failed'))
  }
}

// ─── Float-layer: PTZ 云台（对照 uscweb PtzControlShow）─────────────────
const showPtz = async (cellId: string) => {
  const cam = cameraMap.value.get(cellId)
  if (!cam) return
  // 再次点击同一路云台则关闭
  if (ptzShow.value && ptzToken.value === cam.token) {
    ptzShow.value = false; ptzToken.value = ''; return
  }
  ptzToken.value = cam.token; presetList.value = []
  try {
    const res = await GetPresetsApi(ptzToken.value)
    if (res.status === 200) presetList.value = (res.data.preset ?? []).slice(0, 8)
  } catch {}
  ptzShow.value = true
}
const closePtz = () => { ptzShow.value = false; ptzToken.value = '' }
const ptzAction = (action: string) => {
  if (!ptzToken.value) return
  PtzApi(ptzToken.value, action, ptzSpeed.value)
}
const gotoPreset = (presetToken: string) => {
  PresetJumpApi(ptzToken.value, presetToken, ptzSpeed.value)
}
const setPreset = (presetToken: string, ev: MouseEvent) => {
  const inputVal = (ev.currentTarget as HTMLElement)
    ?.previousElementSibling?.previousElementSibling
    ?.querySelector('input')?.value ?? ''
  SetPresetApi(ptzToken.value, inputVal, presetToken)
}


// ─── Lifecycle ────────────────────────────────────────────────────────────
onMounted(async () => {
  loadTree()
  loadLayoutList()
  document.addEventListener('fullscreenchange', _onFullscreenChange)
  document.addEventListener('webkitfullscreenchange', _onFullscreenChange)
  // Event 面板：挂载时立即连接 WebSocket + 拉取初始数据（对照 uscweb setAnaEvent on mounted）
  getFaceList().catch(() => {}).then(() => getAnaEventList())
  setAnaEvent()
  await restorePlayingState()
})
onBeforeUnmount(() => {
  // 销毁所有播放器内存，不清 localStorage（下次挂载时 restorePlayingState 可以恢复）
  playerMap.forEach(p => { try { p?.destroy?.() } catch(e){} })
  playerMap.clear()
  pbPlayerMap.forEach(item => { try { item.v1?.disconnect(); delete item.v1 } catch {} })
  pbPlayerMap.clear()
  UPlayerList.value = null
  if (viewTimeline) {
    viewTimeline.clearMotionBars?.()
    viewTimeline = null
  }
  // 清理 float-layer 资源（对照 GridView closeAllVideo）
  clearInterval(timerRunInfo); timerRunInfo = null
  if (audioback) { audioback.disconnect(); audioback = null }
  // 清理悬浮按钮：电子放大 rAF + fullscreenchange 监听
  cellEZoomTimers.forEach((h) => cancelAnimationFrame(h))
  cellEZoomTimers.clear()
  document.removeEventListener('fullscreenchange', _onFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', _onFullscreenChange)
  // 清理 Event 面板 WebSocket
  closeAnaEvent()
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
.view-right-body {
  flex: 1; display: flex; flex-direction: row; overflow: hidden; min-height: 0;
}
.view-right-main {
  flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0;
}
// Event 面板右侧布局（对照 uscweb alarm_right_right）
.event-panel-right {
  height: 100%;
  border-left: 1px solid #333;
  background: #1b1b1b;
  .alarm_right_right {
    position: relative; width: 100%; height: 100%;
    display: flex; flex-direction: column; color: #ccc;
    .alarm_right_right_header {
      display: flex; justify-content: space-between; align-items: center;
      height: 37px; flex-shrink: 0; padding: 0 10px;
      font-size: 14px; font-weight: 500; border-bottom: 1px solid #2a2a2a;
    }
    .alarm_right_right_body {
      flex: 1; overflow-y: auto; padding: 4px 6px;
      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-thumb { border-radius: 3px; background: rgba(218,218,218,0.2); }
      &::-webkit-scrollbar-track { background: rgba(218,218,218,0.05); }
      .alarm_right_right_content {
        height: 338px; padding: 0 8px; margin: 4px 0;
        display: flex; flex-direction: column;
        border-radius: 6px; overflow: hidden;
        background: rgba(255,255,255,0.03);
        .content_header {
          height: 32px; display: flex; justify-content: space-between; align-items: center;
          padding: 0 8px; flex-shrink: 0;
          span { font-size: 13px; font-weight: 500; }
          .iconfont { font-size: 20px; }
        }
        .content_body {
          flex: 1; padding: 8px; display: flex; flex-direction: column;
          .content_body_top {
            height: 173px; display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.2); border-radius: 4px; overflow: hidden; flex-shrink: 0;
            img { cursor: pointer; max-height: 100%; max-width: 100%; object-fit: contain; }
          }
          .content_body_bottom {
            flex: 1; display: flex; padding-top: 10px; gap: 10px;
            > div { flex: 1; min-width: 0; }
            .label { font-size: 11px; color: #999; margin-bottom: 2px; }
            .content { font-size: 13px; font-weight: 500; margin-bottom: 6px; word-break: break-all; }
          }
        }
      }
    }
    .alarm_right_right_footer {
      flex-shrink: 0; padding: 4px 0;
      :deep(.el-pagination) {
        .btn-prev, .btn-next, .el-pager li { border: none !important; }
      }
    }
  }
}
.event-btn-active { color: #0399FE !important; }
.EventPosition { color: #0399FE !important; }
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
  // 码率信息浮层（对照 GridView .malv）
  .malv {
    position: absolute; bottom: 40px; left: 10px; z-index: 100;
    width: 420px; height: 150px; display: flex;
    .malv-close { position: absolute; top: 3px; right: 8px; font-size: 16px; cursor: pointer; }
    .malv-left, .malv-right {
      width: 50%; height: 100%; background-color: rgba(#333, 0.5);
      .information_title { width: 100%; height: 30px; line-height: 30px; background-color: rgba(0,0,0,0.7); padding: 0 10px; }
      .information_content { width: 100%; display: flex; justify-content: space-between; padding: 0 2px;
        .information_content_left  { width: 50%; color: #3ABBFE; }
        .information_content_right { width: 50%; color: #3ABBFE; }
      }
    }
  }
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
    // 最左：存储切换（对照 GridView storage_box）
    .storage_box { width: 17%; }
    .storage_mode {
      width: 240px; display: flex; height: 24px; margin-left: 10px; border-radius: 12px;
      .CentralStorage, .DeviceStorage {
        flex: 1; height: 100%; line-height: 24px; text-align: center;
        border-radius: 12px; cursor: pointer; white-space: nowrap;
      }
      .active { background-color: #0399FE; }
    }
    // 中：控制按钮组
    button { padding:0; border:none; background:none; font-size:22px; margin-right:10px; color:#fff; }
    .control-center {
      display: flex; align-items: center;
      .export-btn { font-size: 22px; cursor: pointer; margin-right: 12px; color: #fff;
        &:hover { color: #0399FE; }
      }
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
    // 最右：录像类型标识（对照 GridView caveat_butt）
    .caveat_butt {
      display: flex; align-items: center; justify-content: flex-end; width: 17%;
      .recodeType { font-size: 14px; }
      .showRecodeType {
        width: 24px; height: 30px; text-align: center; line-height: 30px;
        border-radius: 4px; cursor: pointer;
      }
      .mr-0 { width:15px; height:15px; border-radius:50px; border:0; margin-right:5px; vertical-align:middle; background-color:#31b1ff; }
      .mr-1 { width:15px; height:15px; border-radius:50px; border:0; margin:0 5px; vertical-align:middle; background-color:rgb(60,196,60); }
      .mr-2 { width:15px; height:15px; border-radius:50px; border:0; margin:0 5px; vertical-align:middle; background-color:#ee1011; }
    }
  }
}

// 时间轴容器背景
.timeline-box-view { background: #1a1a1a; }
.palace {
  position: relative; background: #111; cursor: pointer;
  video { display: block; width: 100%; height: 100%; object-fit: fill; }
  .cell-label {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: rgba(0,0,0,0.6); color: #fff; font-size: 12px; padding: 2px 6px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  // 悬浮按钮层：默认偏移到顶部以上，悬停时滑入（对照 GridView float-layer / uscweb liveplay_butt）
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
    .play-mode-toggle { flex-shrink: 0; margin-left: 20px; }
    .protocol-label { font-size: 12px; cursor: default;
      &:hover { color: #fff; }
    }
    .audio-active  { color: #0399FE !important; }
    .rec-active    { color: #f44336 !important; }
    .expend-active { color: #0399FE !important; }
  }
  // 音量滑块面板（对照 uscweb .Audio_slider）
  .cell-audio-slider {
    position: absolute; top: 30px; left: 50%; z-index: 20;
    width: 174px;
    background: rgba(0,0,0,0.7); padding: 4px 10px; border-radius: 4px;
    display: flex; align-items: center;
    i { font-size: 18px; flex-shrink: 0; }
    :deep(.el-slider) {
      .el-slider__runway { height: 4px; background: rgba(255,255,255,0.2); }
      .el-slider__bar    { height: 4px; }
      .el-slider__button { width: 10px; height: 10px; border: 2px solid #409EFF; }
    }
  }
  // 电子放大 / 3D 框选画布
  .cell-ezoom-canvas {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 8; display: none;
    &.active { display: block; }
  }
  .cell-3dzoom-canvas {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 9; display: none;
    &.active { display: block; pointer-events: auto; cursor: crosshair; }
  }
  .cell-close {
    position: absolute; top: 2px; right: 4px; background: rgba(0,0,0,0.5);
    border: none; color: #fff; font-size: 16px; cursor: pointer; line-height: 1;
    padding: 0 4px; border-radius: 2px; z-index: 5;
    &:hover { background: #f44336; }
  }
  &.palace-selected { outline: 2px solid #f44336; outline-offset: -2px; }
  // 双击展开：覆盖整个视频容器（对照 GridView expandedCellId 逻辑）
  &.palace-expanded {
    position: absolute !important; top: 0 !important; left: 0 !important;
    width: 100% !important; height: 100% !important; z-index: 20;
  }
}

// PTZ 云台面板（对照 uscweb liveplay_ptz）
.yuntai {
  position: absolute; left: 0; bottom: 0; width: 100%; height: 100%;
  z-index: 100; background: rgba(255,255,255,0); pointer-events: none;
  .flex_content {
    width: 100%; height: 100%; padding: 8% 0; position: relative; pointer-events: none;
    .content_zoom {
      width: 50%; height: 100%; display: flex; align-items: flex-end; pointer-events: auto;
      .key_zoom {
        width: 25%; margin: 0 4% 0 8%;
        .key_flex {
          width: 100px; height: 100px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          gap: 16px;
          margin-left: 5%;
          background: url('@/views/Monitoring/liveview/imgs/liveview_ptzbutton.png') no-repeat center;
          background-size: 100px 100px;
          .key_but {
            width: 100%; height: 100%;
            text-align: center; cursor: pointer; color: #fff;
            i { font-size: 12px; }
            &:hover i { color: #0399FE; }
          }
        }
      }
    }
    .zoom_g {
      width: 20px; height: 100%;
      position: absolute; left: 0; top: 0;
      background-color: rgba(0,0,0,0.6);
      display: flex; flex-wrap: wrap;
      justify-content: space-around; align-content: space-around; padding: 0 2px;
      pointer-events: auto;
      .zoom_add {
        width: 20px; height: 20px; text-align: center;
        background: none; border: 0; padding: 0; color: #fff; font-size: 14px; cursor: pointer;
        &:hover { color: #0399FE; }
      }
    }
    .Preset {
      width: 30%; position: absolute; bottom: 10%; right: 4%; pointer-events: auto;
      .block {
        width: 100%; height: 140px; overflow: auto; color: #fff;
        &::-webkit-scrollbar { display: none; }
      }
      :deep(.el-timeline) { padding: 0;
        .el-timeline-item__wrapper { padding-left: 16px; }
        .el-timeline-item__tail { left: 4px; }
        .el-timeline-item__node { left: 0; }
        .el-card {
          background: transparent; border: none; box-shadow: none;
          .el-card__body { padding: 0 0 4px 0; }
        }
        .preset_bgc {
          width: 100%; height: 24px; background: rgba(255,255,255,0.2);
          display: flex; align-items: center;
          .preset_input {
            width: 52%; background: none; border-radius: 12px;
            border: 0; padding: 0 0 0 10px; color: #fff !important;
          }
          button {
            width: 15%; background: none; border: 0;
            font-size: 15px; color: #fff; margin-left: 3px; cursor: pointer;
            &:hover { color: #0399FE; }
          }
        }
      }
    }
    .ptz-close-btn {
      position: absolute; top: 8px; right: 8px;
      color: #fff; cursor: pointer; font-size: 18px;
      pointer-events: auto;
      &:hover { color: #0399FE; }
    }
  }
}
.yuntai-hide { display: none; }
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

/* 日历中有录像的日期高亮（非 scoped，作用于 el-date-picker popper） */
.custom_date_class {
  color: #0399FE !important;
  font-weight: bold;
}
.custom_date_class .el-date-table-cell__text {
  background-color: rgba(3, 153, 254, 0.15);
  border-radius: 50%;
}
</style>
