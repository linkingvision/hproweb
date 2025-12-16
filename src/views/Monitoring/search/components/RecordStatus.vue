<script lang="ts" setup>
import { RecordingStatus } from '@/utils/localRecordingStatus.js';
import { GetDeviceList, GetChannels, GetDeviceChannels, getSearchStorRecordByTimeApi } from '@/api/channel'
import { onMounted, ref, watch } from 'vue';
import { useStore } from '@/store';

const store = useStore()
interface Props {
  recordData: any
}
const props = defineProps<Props>()

const radio = ref<string>('month')
const activeTime = ref<Date>(new Date());
const startTime = ref<Date | undefined>(undefined);
const endTime = ref<Date | undefined>(undefined);
const recordingStatus: any = ref(null);
const currentPage = ref<number>(1);
const pageSize = ref<number>(30);
const total = ref<number>(0)
const backgroundColor = ref<string>('#FFFFFF');
const labelColor = ref<string>('');
const chRec = ref<any>([])

const handleChange = (value: any) => {
  let { startTime: start, endTime: end } = getRecordTime(value);
  startTime.value = start;
  endTime.value = end;
  recordingStatus.value.setMode(radio.value, {startTime:start, endTime: end})
}

const activeRadio = (value: string) => {
  radio.value = value;
  const { startTime: start, endTime: end } = getRecordTime(activeTime.value);
  startTime.value = start;
  endTime.value = end;
  recordingStatus.value.setMode(value, {startTime: startTime.value, endTime: endTime.value});
}

const renderPartition = (date: Date | null) => {
  if (date == null) {
    date = new Date;
    activeTime.value = new Date(date.getFullYear(), date.getMonth(), 1);
  } else {
    activeTime.value = date;
  }
  let { startTime: start, endTime: end } = getRecordTime(activeTime.value);
  startTime.value = start;
  endTime.value = end;
  const renderElement = document.querySelector('.render') as HTMLElement;
  const width = renderElement?.offsetWidth;
  const height = renderElement?.offsetHeight;
  recordingStatus.value = new RecordingStatus('#recording', {
    startTime,
    endTime,
    width,
    height,
    backgroundColor: backgroundColor.value,
    labelColor: labelColor.value,
    router: 'recordInfo'
  })
  recordingStatus.value.StartDrawing(chRec.value)
}

watch(() => store.darkMode, (data) => {
  if (!recordingStatus) {
    return
  }
  if (data == 'c-dark-theme') {
    backgroundColor.value = '#2B2B2B';
    labelColor.value = '#FFFFFF';
  } else if (data == 'darkblue') {
    backgroundColor.value = '#1B2A46';
    labelColor.value = '#06E8EA';
  } else {
    backgroundColor.value = '#f0f0f0';
    labelColor.value = '#000';
  }
  recordingStatus.value.setColors({ backgroundColor: backgroundColor.value, labelColor: labelColor.value });
})

const channels = ref<any[]>([])
const storRecords = ref<any[]>([])
watch(() => props.recordData, (newVal) => {
  console.log('watch recordData', newVal)
  switch(newVal.type) {
    case 'device':
      getDeviceChannels(newVal.token).then(async (res) => {
        channels.value = res;
        let storRecords1 = await getAllSearchStorRecords(res);
        if (!storRecords1) {
          return;
        }
        storRecords.value = storRecords1;
        total.value = storRecords1.length;
        chRec.value = storRecords.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
        recordingStatus.value.StartDrawing(chRec.value)
      })
  }
})
const getAllSearchStorRecords = async (channels: any, concurrency = 5) => {
  try {
    const results = await concurrentAll(
      channels.map((channel: any) => () => getSearchStorRecordByTime(channel)),
      concurrency
    )
    return results.filter(result => result != undefined)
  } catch (error) {
    console.error('请求发生错误：', error)
    return [];
  }
}
const getDeviceChannels = async (token: string) => {
  const res = await GetDeviceChannels(token);
  if (res.status == 200 && res.data.code == 0) {
    return res.data.result;
  }
}
const getSearchStorRecordByTime = async (channel: any) => {
  let { startTime: start, endTime: end } = getRecordTime(activeTime.value);
  const res = await getSearchStorRecordByTimeApi(channel.token, start.toISOString(), end.toISOString());
  if (res.data) {
    let data = res.data;
    data.devName = channel.name;
    data.token = channel.token;
    return data;
  }
}

const getRecordTime = (date: Date) => {
  let startTime, endTime;
  switch (radio.value) {
    case 'month':
      startTime = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
      endTime = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'week':
      const day = date.getDay();
      startTime = new Date(date);
      startTime.setDate(date.getDate() - day);
      startTime.setHours(0, 0, 0, 0);
      endTime = new Date(date);
      endTime.setDate(date.getDate() + (6 - day));
      endTime.setHours(23, 59, 59, 999);
      break;
    case 'date':
      startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      break;
    default:
      throw new Error('Invalid radio value')
  }
  return { startTime, endTime }
}
// 并发控制函数
const concurrentAll = async (tasks: any, concurrency = 5) => {
  const results = [];
  const executing: any = [];

  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);

    const e: any = p.then(() => executing.splice(executing.indexOf(e), 1));
    executing.push(e);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

onMounted(() => {
  switch (store.darkMode) {
    case 'c-dark-theme':
      backgroundColor.value = '#2B2B2B';
      labelColor.value = '#FFFFFF';
      break;
    case 'darkblue':
      backgroundColor.value = '#1B2A46';
      labelColor.value = '#06E8EA';
      break;

    default:
      backgroundColor.value = '#f0f0f0';
      labelColor.value = '#000';
      break;
  }
  renderPartition(null)
})
</script>

<template>
  <div class="record_status">
    <div class="DatePicker">
      <div class="block" v-show="radio == 'month'">
        <el-date-picker v-model="activeTime" type="month" placeholder="Pick a month" @change="handleChange"></el-date-picker>
      </div>
      <div class="block" v-show="radio == 'week'">
        <el-date-picker v-model="activeTime" type="week" format="[week] ww" placeholder="Pick a week" @change="handleChange"></el-date-picker>
      </div>
      <div class="block" v-show="radio == 'date'">
        <el-date-picker v-model="activeTime" type="date" placeholder="Pick a date" @change="handleChange"></el-date-picker>
      </div>
      <div class="radio-button">
        <el-button size="small" :class="{active_button: radio == 'month'}" @click="activeRadio('month')">月</el-button>
      </div>
      <div class="radio-button">
        <el-button size="small" :class="{active_button: radio == 'week'}" @click="activeRadio('week')">周</el-button>
      </div>
      <div class="radio-button">
        <el-button size="small" :class="{active_button: radio == 'date'}" @click="activeRadio('date')">天</el-button>
      </div>
    </div>
    <div class="render">
			<div id="recording"></div>
		</div>
    <div class="pagination-box">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 30, 50, 100]"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      ></el-pagination>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.record_status {
  width: 100%;
  height: 100%;
  // flex: 1;
  display: flex;
  flex-direction: column;
  .render {
    width: 100%;
    flex: 1;
    overflow: hidden;
  }
  .DatePicker{
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    margin-bottom: 2px;
    .block{
      margin-left: 10px;
    }
  }
  .statusInfo {
    height: 40px;
    line-height: 40px;
    // padding-left: 10px;
  }
  .pagination-box {
    width: 100%;
    padding: 10px 0;
  }
}
</style>
