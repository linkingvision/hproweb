<script setup lang="ts">
import { ref, computed, onMounted, nextTick, h } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowRight } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import $ from 'jquery';
import {
  GetWorkServerListApi,
  GetDiskPartitionApi,
  AddRecordPartitionApi,
  FormatRecordPartitionApi,
  DelRecordPartitionApi
} from '@/api/configuration/storage';

const { t } = useI18n();

// ─── List ────────────────────────────────────────────────
const tableData = ref<any[]>([]);
const header = ref<string[]>([]);
const search = ref<string>('');
const currentPage = ref<number>(1);
const pageSize = ref<number>(10);

// computed: filter + paginate, avoid recalculation on every render
const filteredData = computed(() =>
  tableData.value
    .filter(d => !search.value || d.nodeName.toLowerCase().includes(search.value.toLowerCase()))
    .slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
);
const total = computed(() =>
  tableData.value.filter(d => !search.value || d.nodeName.toLowerCase().includes(search.value.toLowerCase())).length
);

// ─── Edit ────────────────────────────────────────────────
const editPopup = ref<boolean>(false);
const editform = ref<any>({});
const form = ref<any>({});
const color = ref<string>('#00FFD6');

// Each disk card has its own ResizeObserver to avoid conflicts when adding multiple cards
const resizeObservers = new Map<number, ResizeObserver>();
// Tracks the new partition size (MB) for each card independently
const addMaxSizeMap = new Map<number, number>();

// ─── Utilities ─────────────────────────────────────────────
const course = (data: string, index: number) => `${data}${index}`;

const formatTime = (value: string) => {
  if (!value) return 'Loading...';
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const CalculateCapacity = (value: number) => {
  if (!value) return '0GB';
  if (value / 1024 < 1) return (value / 1024).toFixed(1) + 'GB';
  if (value / 1024 > 1000) return (value / 1024 / 1024).toFixed(0) + 'TB';
  return (value / 1024).toFixed(0) + 'GB';
};

const getRandomColor = () =>
  `rgb(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)})`;

const extractRGBValues = (rgbString: string) => {
  const m = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  return m ? `${m[1]},${m[2]},${m[3]}` : null;
};

// ─── Data Loading ─────────────────────────────────────────
const Node = async () => {
  const res = await GetWorkServerListApi();
  if (res.status !== 200 || res.data.code !== 0) return;
  const list: any[] = res.data.result.list;
  tableData.value = [];
  header.value = [];
  // Fetch all nodes in parallel for better performance
  await Promise.all(list.map(item => DiskPartitions(item.nodeId, item.nodeName)));
};

const DiskPartitions = async (nodeId: string, nodeName: string) => {
  const res = await GetDiskPartitionApi(nodeId);
  if (res.status !== 200 || res.data.code !== 0) return;

  const items: any[] = res.data.result.partition;

  // Build column headers from the first node (all nodes share the same disk layout)
  if (header.value.length === 0) {
    header.value = items.map((item: any) => item.strDevice);
  }

  // Restore colors: keep user-selected color for the node being edited, use API color for others
  items.forEach((disk: any, i: number) => {
    if (!disk.record) return;
    disk.record.forEach((rec: any) => {
      if (form.value.nodeId === nodeId) {
        const saved = form.value.strDevice?.[i]?.record?.find((r: any) => r.nIndex === rec.nIndex);
        if (saved) { rec.backgroundColor = saved.backgroundColor; return; }
      }
      rec.backgroundColor = `rgb(${rec.strColor})`;
    });
  });

  const entry = { strDevice: items, nodeId, nodeName };
  // Deduplicate before appending to avoid duplicates on refresh
  tableData.value = [...tableData.value.filter((d: any) => d.nodeId !== nodeId), entry];

  // Sync refresh in the edit view
  if (form.value.nodeId === nodeId) {
    editform.value = entry;
  }
};

// ─── Edit Interactions ──────────────────────────────────
const handleEdit = (row: any) => {
  // Also set form.value so DiskPartitions can refresh the edit view after FormatRecord/DeleteRecord
  form.value = row;
  editform.value = row;
  editPopup.value = true;
};

const back = () => {
  // 清理所有卡片的 ResizeObserver
  resizeObservers.forEach(obs => obs.disconnect());
  resizeObservers.clear();
  addMaxSizeMap.clear();
  editPopup.value = false;
};

// 展开 / 折叠分区详情
const IsRecordName = (_item: any, index: number) => {
  const $bottom = $(`#IsShowBottom${index}`);
  const $content = $(`#RecordContent${index}`);
  const $icon = $(`#fold${index}`);
  if ($bottom.is(':hidden')) {
    $content.css('height', '400px');
    $content.find('.RecordTop').css('border-bottom', '2px dashed #979797');
    $icon.removeClass('icon-xia').addClass('icon-shang');
    $bottom.show();
  } else {
    $content.css('height', '161px');
    $content.find('.RecordTop').css('border-bottom', '0');
    $icon.removeClass('icon-shang').addClass('icon-xia');
    $bottom.hide();
  }
};

// 高亮点击行
const handleClick = (index: number, index2: number) => {
  $('.RecordBottom_Container').eq(index).find('.record_name').removeClass('active');
  $('.RecordBottom_Container').eq(index).find('.record_name').eq(index2).addClass('active');
};

// 改变颜色
const ChangeColor = (_item: any, index: number, val: string) => {
  if (val) $(`#RecordContent${index}`).find('.progress-bar-inner1').css('background-color', val);
};

// 添加录像分区（拖拽块）
const AddRecord = (item: any, index: number) => {
  if ($(`#RecordContent${index}`).find('.progress-bar-inner1').length > 0) {
    // 已有未保存的分区，提示先保存
    ElMessage({ message: t('Configuration.conf_save_record_first'), type: 'warning', duration: 3000 });
    return;
  }

  const nIndex = item.record ? item.record[item.record.length - 1].nIndex + 1 : 1;
  let width: number;
  if (item.record) {
    const used = item.record.reduce((acc: number, r: any) => acc + r.nMaxSizeInM, 0);
    width = used >= item.nFreeInM
      ? (10240 / item.nFreeInM) * 100
      : ((item.nFreeInM - used) / item.nFreeInM) * 100;
  } else {
    width = 100;
  }

  $(`#RecordContent${index}`).find('.progress-bar').append(
    `<div data-value="0" title="Record:10" class="progress-bar-inner progress-bar-inner1 ManualAdd"` +
    ` style="width:${width}%;background-color:${getRandomColor()};overflow-y:auto;resize:horizontal;"></div>`
  );

  nextTick(() => {
    const el = $(`#RecordContent${index}`).find('.progress-bar-inner1').get(0);
    if (!el) return;
    // 每张卡片独立 Observer，互不干扰
    resizeObservers.get(index)?.disconnect();
    const obs = new ResizeObserver(() => {
      const barWidth = $(`#RecordContent${index}`).find('.progress-bar').width() || 1;
      const pct = (el.offsetWidth / barWidth) * 100;
      const sizeInM = Math.round(item.nFreeInM * pct / 100);
      addMaxSizeMap.set(index, sizeInM);
      $(`#RecordContent${index}`).find('.progress-bar-inner1')
        .attr('title', `Record${nIndex}:${(sizeInM / 1024).toFixed(1)}`);
    });
    obs.observe(el);
    resizeObservers.set(index, obs);
  });
};

// 保存分区
const SaveRecord = async (item: any, index: number) => {
  if ($(`#RecordContent${index}`).find('.progress-bar-inner1').length < 1) return;

  const bgColor = $(`#RecordContent${index}`).find('.progress-bar-inner1').css('background-color');
  const nIndex = item.record ? item.record[item.record.length - 1].nIndex + 1 : 1;
  // Use the per-card recorded size; default to 10240 MB
  const sizeInM = addMaxSizeMap.get(index) ?? 10240;

  const data = {
    nodeId: editform.value.nodeId,
    nIndex,
    nMaxSizeInM: sizeInM,
    strDevice: `Record${nIndex}`,
    strMountPoint: item.strMountpoint,
    strColor: extractRGBValues(bgColor) || '',
  };

  // Update local editform first to preserve color info
  if (editform.value.nodeId) {
    if (!Array.isArray(editform.value.strDevice[index].record)) {
      editform.value.strDevice[index].record = [];
    }
    editform.value.strDevice[index].record.push({
      backgroundColor: bgColor,
      nIndex,
      nMaxSizeInM: sizeInM,
      strDevice: `Record${nIndex}`,
      strMountPoint: item.strMountpoint,
    });
  }

  try {
    const res = await AddRecordPartitionApi(data);
    if (res.status === 200 && res.data.code === 0) {
      ElMessage({ message: t('CommTableEdit.comm_add_successfully'), type: 'success', duration: 2000 });
      form.value = editform.value;
      $(`#RecordContent${index}`).find('.ManualAdd').remove();
      await Node();
    } else {
      ElMessage({ message: t('CommTableEdit.comm_add_failed'), type: 'error', duration: 3000 });
    }
  } catch {
    ElMessage({ message: t('CommTableEdit.comm_add_failed'), type: 'error', duration: 3000 });
  }
};

// 重置进度条宽度
const Reset = (item: any, index: number) => {
  if ($(`#RecordContent${index}`).find('.progress-bar-inner1').length < 1) return;
  const used = item.record?.reduce((acc: number, r: any) => acc + r.nMaxSizeInM, 0) ?? 0;
  const isFull = used >= item.nFreeInM;
  const w = isFull ? (10240 / item.nFreeInM) * 100 : ((item.nFreeInM - used) / item.nFreeInM) * 100;
  $(`#RecordContent${index}`).find('.progress-bar-inner1').css('width', `${w}%`);
};

// 格式化分区
const FormatRecord = async (item: any, index: number) => {
  try {
    await ElMessageBox.confirm(
      t('Configuration.conf_format_confirm'), t('CommTableEdit.comm_prompt'),
      { confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel'), customClass: 'DeleteConfirm', icon: h('i', { class: 'iconfont icon-tishi1 warn-tip' }) }
    );
    const res = await FormatRecordPartitionApi({
      nodeId: editform.value.nodeId,
      strMountPoint: item.strMountpoint,
      nIndex: item.nIndex,
    });
    if (res.status === 200 && res.data.code === 0) {
      if (res.data.result?.bRet === false) {
        // Backend returned code=0 but bRet=false: the operation itself failed; stay silent (matches uscweb behavior)
        return;
      }
      ElMessage({ message: t('CommTableEdit.comm_modify_successfully'), type: 'success', duration: 2000 });
      form.value = editform.value; // ensure DiskPartitions can refresh the edit view
      await Node();
    } else {
      ElMessage({ message: t('CommTableEdit.comm_modify_failed'), type: 'error', duration: 3000 });
    }
  } catch { /* 取消 */ }
};

// 卸载分区
const DeleteRecord = async (item: any, index: number) => {
  try {
    await ElMessageBox.confirm(
      t('Configuration.conf_unmount_confirm'), t('CommTableEdit.comm_prompt'),
      { confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel'), customClass: 'DeleteConfirm', icon: h('i', { class: 'iconfont icon-tishi1 warn-tip' }) }
    );
    const res = await DelRecordPartitionApi({
      nodeId: editform.value.nodeId,
      strMountPoint: item.strMountpoint,
      nIndex: item.nIndex,
    });
    if (res.status === 200 && res.data.code === 0) {
      ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success', duration: 2000 });
      form.value = editform.value;
      await Node();
    } else {
      ElMessage({ message: t('CommTableEdit.comm_delete_failed'), type: 'error', duration: 3000 });
    }
  } catch { /* 取消 */ }
};

// ─── Pagination ─────────────────────────────────────────
const handleSizeChange = (val: number) => { currentPage.value = 1; pageSize.value = val; };
const handleCurrentChange = (val: number) => { currentPage.value = val; };

onMounted(() => { Node(); });
</script>

<template>
  <div class="regular-storage">

    <!-- ── Edit Panel ─────────────────────────────────── -->
    <div v-if="editPopup" class="edit-regular" style="padding: 20px;">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="back">
            {{ $t('Configuration.conf_regular_storage') }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t('CommTableEdit.comm_edit') }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <div style="width:100%;display:flex;flex-wrap:wrap;margin-top:10px;">
        <div
          class="RecordContent"
          :id="course('RecordContent', index)"
          v-for="(item, index) in editform.strDevice"
          :key="index"
        >
          <!-- Top: disk info + progress bar -->
          <div class="RecordTop">
            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;">
              <span>{{ item.strDevice }}&nbsp;&nbsp;{{ item.strFstype }}</span>
              <span>{{ $t('Configuration.conf_mount_point') }}:{{ item.strMountpoint }}</span>
              <span>
                {{ $t('Configuration.conf_used') }}/{{ $t('Configuration.conf_all') }}：
                {{ CalculateCapacity(item.nTotalInM - item.nFreeInM) }}/{{ CalculateCapacity(item.nTotalInM) }}
              </span>
            </div>
            <div style="margin:20px 0;">
              <div class="progress-bar">
                <div
                  class="progress-bar-inner"
                  v-for="(item1, index1) in item.record"
                  :key="index1"
                  :style="{ width: `${(item1.nMaxSizeInM / item.nTotalInM) * 100}%`, backgroundColor: item1.backgroundColor }"
                  :title="`${item1.strDevice}:${(item1.nMaxSizeInM / 1024).toFixed(1)}`"
                ></div>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div class="FoldBtn" @click="IsRecordName(item, index)">
                <i class="iconfont icon-xia" :id="course('fold', index)"></i>
              </div>
              <div style="display:flex;align-items:center;">
                <el-color-picker
                  popper-class="ColorPicker"
                  v-model="color"
                  size="small"
                  style="margin-right:5px;"
                  @change="(val: string) => ChangeColor(item, index, val)"
                ></el-color-picker>
                <span class="FunBtn" @click="AddRecord(item, index)">+</span>
              </div>
            </div>
          </div>

          <!-- Bottom: partition list (collapsible) -->
          <div class="RecordBottom" :id="course('IsShowBottom', index)">
            <div class="RecordBottom_Container">
              <div
                v-for="(item2, index2) in item.record"
                :key="index2"
                style="display:flex;flex-direction:column;"
              >
                <div class="RecordBottom_Container_Top">
                  <div
                    style="width:16px;height:16px;border-radius:8px;flex-shrink:0;"
                    :style="{ backgroundColor: item2.backgroundColor }"
                  ></div>
                  <div class="record_name" @click="handleClick(index, index2)">
                    <span>{{ item2.strDevice }}</span>
                    <span style="font-size:12px;">
                      {{ $t('Configuration.conf_max_capacity') }}：{{ (item2.nMaxSizeInM / 1024).toFixed(1) }} GB
                    </span>
                  </div>
                  <div style="display:flex;align-items:center;">
                    <span class="format" @click="FormatRecord(item2, index2)">{{ $t('Configuration.conf_formatting') }}</span>
                    <span class="unmountedPartition" @click="DeleteRecord(item2, index2)">{{ $t('Configuration.conf_unmount') }}</span>
                  </div>
                </div>
                <div class="record_content">
                  <div class="record_container">
                    <div>
                      {{ $t('Configuration.conf_mount') }}：
                      <span :class="item2.bMount ? 'mount' : 'unmount'">
                        {{ item2.bMount ? $t('CommTableEdit.comm_online') : $t('CommTableEdit.comm_offline') }}
                      </span>
                    </div>
                    <div>{{ $t('Configuration.conf_usage_rate') }}：{{ item2.nUsage }}%</div>
                  </div>
                  <div class="record_container">
                    <div>{{ $t('CommTime.comm_time_start') }}：{{ formatTime(item2.strStartTime) }}</div>
                    <div>{{ $t('CommTime.comm_time_end') }}：{{ formatTime(item2.strEndTime) }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div style="padding:20px;display:flex;flex-direction:column;align-items:center;">
              <div style="display:flex;gap:10px;">
                <el-button @click="Reset(item, index)">{{ $t('CommTableEdit.comm_reset') }}</el-button>
                <el-button type="primary" @click="SaveRecord(item, index)">{{ $t('CommTableEdit.comm_save') }}</el-button>
              </div>
              <div style="margin-top:10px;font-size:12px;opacity:0.7;">
                ({{ $t('Configuration.conf_cannot_be_modified') }})
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Data Table ─────────────────────────────────── -->
    <template v-else>
      <el-table :data="filteredData" stripe height="85vh" style="width:100%;">
        <el-table-column type="selection" width="40" align="center"></el-table-column>
        <el-table-column prop="nodeName" :label="$t('Configuration.conf_work_server')" align="center"></el-table-column>

        <el-table-column
          v-for="(diskName, colIdx) in header.slice(0, 4)"
          :key="diskName"
          :label="String(colIdx + 1)"
          align="center"
          width="330"
        >
          <template #default="scope">
            <template v-if="scope.row.strDevice && scope.row.strDevice[colIdx]">
              <div>{{ diskName }}</div>
              <div style="display:flex;justify-content:center;align-items:center;">
                {{ CalculateCapacity(scope.row.strDevice[colIdx].nFreeInM) }}
                {{ $t('Configuration.conf_usable') }}
                <el-progress
                  :percentage="Number((((scope.row.strDevice[colIdx].nTotalInM - scope.row.strDevice[colIdx].nFreeInM) / scope.row.strDevice[colIdx].nTotalInM) * 100).toFixed(0))"
                  color="#0399FE"
                  :show-text="false"
                  style="width:90px;margin:0 10px;"
                ></el-progress>
                {{ $t('SystemInfo.system_total') }}{{ CalculateCapacity(scope.row.strDevice[colIdx].nTotalInM) }}
              </div>
            </template>
          </template>
        </el-table-column>

        <el-table-column align="center">
          <template #default>
            <span>{{ $t('SystemInfo.system_total') }} {{ header.length }} {{ $t('SystemInfo.system_units') }}</span>
          </template>
        </el-table-column>

        <el-table-column width="180">
          <template #header>
            <el-input
              v-model="search"
              size="small"
              class="header-search"
              :placeholder="$t('Common.comm_filtration')"
            >
              <template #prefix>
                <i class="iconfont icon-sousuo1"></i>
              </template>
            </el-input>
          </template>
          <template #default="scope">
            <el-button type="text" size="small" @click="handleEdit(scope.row)">
              {{ $t('CommTableEdit.comm_edit') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes, jumper"
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </template>

  </div>
</template>

<style lang="scss" scoped>
.regular-storage {
  .bread-header {
    width: 100%;
    height: 50px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #313131;
    .can-click { cursor: pointer; }
  }
  .pagination {
    margin-top: 20px;
    padding: 0 20px;
  }

  :deep(.header-search) {
    .el-input__inner {
      font-size: 12px;
    }
  }
}

.RecordContent {
  width: 510px;
  height: 161px;
  border-radius: 4px;
  margin: 5px 20px;
  padding: 20px;

  .RecordTop {
    width: 100%;
    height: 35%;

    .progress-bar {
      width: 100%;
      height: 15px;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      justify-content: flex-start;
    }

    .progress-bar-inner {
      height: 100%;
      transition: width 0.1s linear;
      cursor: pointer;
    }

    .FoldBtn {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      text-align: center;
      cursor: pointer;
    }

    .FunBtn {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      display: inline-block;
      margin: 0 5px;
      text-align: center;
      font-size: 24px;
      line-height: 24px;
      cursor: pointer;
    }

    :deep(.el-color-picker) {
      .el-color-picker__trigger {
        height: 24px !important;
        width: 24px !important;
        border: 0;
        background: linear-gradient(225deg, #FF0000 0%, #FF7600 14%, #FFDB00 31%, #92FF00 48%, #00FFD6 64%, #1200FF 83%, #B600FF 100%);
        border-radius: 4px;
        .el-color-picker__color { border: none; }
        .el-color-picker__color-inner { background-color: transparent !important; }
        .el-color-picker__icon, .el-color-picker__empty { display: none; }
      }
    }
  }

  .RecordBottom {
    display: none;

    .RecordBottom_Container {
      height: 135px;
      overflow-y: auto;
      margin-top: 15px;

      &::-webkit-scrollbar { width: 8px; height: 8px; }
      &::-webkit-scrollbar-thumb { border-radius: 5px; background: rgba(218,218,218,0.2); }
      &::-webkit-scrollbar-track { background: rgba(218,218,218,0.1); }

      .RecordBottom_Container_Top {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .record_name {
        width: 325px;
        height: 32px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 7px 5px;
        border-radius: 4px;
        padding: 0 10px;
        cursor: pointer;
        &.active { border: 2px solid #0399FE; }
      }

      .format {
        width: 72px;
        border-radius: 12px;
        display: inline-block;
        margin: 0 10px;
        text-align: center;
        line-height: 24px;
        cursor: pointer;
        background: #FF4F01;
        color: #fff;
        font-size: 13px;
      }

      .unmountedPartition {
        width: 60px;
        height: 24px;
        border-radius: 12px;
        display: inline-block;
        margin: 0 5px;
        text-align: center;
        line-height: 24px;
        cursor: pointer;
        background: #FF781D;
        color: #fff;
        font-size: 13px;
      }

      .record_content {
        width: 94%;
        border-radius: 4px;
        margin-left: 4%;
        padding: 10px;

        .record_container {
          display: flex;
          margin: 5px 0;
          div { width: 50%; font-size: 12px; }
          .mount { color: #06D20B; }
          .unmount { color: #FA6400; }
        }
      }
    }
  }
}
</style>
