<script setup lang="ts">
import $ from 'jquery'
import { ref, onMounted, nextTick } from 'vue';
import { GetNodeApi, GetEngineStatusApi } from '@/api/Analytics/setting';
import { useI18n } from 'vue-i18n';

const { t } = useI18n()

const tableData = ref<any[]>([])
const initialization = ref<boolean>(true);
const uaiOnline = ref<boolean>(false);
const uaiVersion = ref<boolean>(false);
const total = ref<number>(0)
const FirstLoad = ref<boolean>(true)
const firstNodeId = ref<string>('')

const tableData1 = ref<any[]>([])
const total1 = ref<number>(0)

const GetNode = async () => {
  const res = await GetNodeApi();
  if (res.status == 200 && res.data.code == 0 && res.data.result.list) {
    if (FirstLoad.value) firstNodeId.value = res.data.result.list[0].nodeId;
    res.data.result.list.forEach((item: any) => {
      GetEngineStatus(item.nodeId, item.nodeName)
    })
  }
}
const GetEngineStatus = async (nodeId: string, nodeName: string) => {
  const res = await GetEngineStatusApi(nodeId);
  if (res.status == 200 && res.data.code == 0) {
    tableData.value = [];
    const item = res.data.result.status;
    const tableRow = {
      status: item ? item : [],
      Device: item?.length ? item.length : 0,
      nodeId,
      nodeName
    }
    uaiOnline.value = res.data.result.bUaiSvcOnline;
    uaiVersion.value = res.data.result.strUaiSvcVersion;
    if (res.data.result.bBuildingEngine) {
      initialization.value = true;
    } else {
      initialization.value = false;
    }
    tableData.value.push(tableRow)
    total.value = tableData.value.length;
    if (firstNodeId.value == nodeId) {
      handleClick(0, tableRow)
    }
  }
}

const handleClick = (index: number, row: any) => {
  console.log(index, row)
  FirstLoad.value = false;
  firstNodeId.value = row.nodeId;
  tableData1.value = [];
  for(let i = 0; i < row.status.length; i++) {
    var TableRow = {
      nDevice: row.status[i].nDevice,
      strName: row.status[i].strName,
      nInferTimeInMs: row.status[i].nInferTimeInMs + '    ms',
      nQueueSize: row.status[i].nQueueSize,
      nFps: row.status[i].nFps,
    }
    tableData1.value.push(TableRow)
    total1.value = tableData1.value.length;
  }

  nextTick(() => {
    $(".particulars").css("background-color", "rgba(141,189,255,0.3)");
    $(".particulars").eq(index).css("background-color", "#0399FE");
    $('.InferServerStatus_Right').css('display', 'block');
  })
}

const Close = () => {
  $(".particulars").css("background-color", "rgba(141,189,255,0.3)");
  $('.InferServerStatus_Right').css('display', 'none');
}

onMounted(() => {
  GetNode();
})
</script>

<template>
  <div class="infer-server-status">
    <div class="InferServerStatus_Left">
      <el-table :data="tableData" height="100%" width="100%">
        <el-table-column prop="nodeName" :label="t('Analytics.ana_work_server')"></el-table-column>
        <el-table-column prop="Device" label="Device"></el-table-column>
        <el-table-column>
          <template #header>
            <span>{{ t('Analytics.ana_detail') }} <i class="iconfont icon-xiangqing"></i></span>
          </template>
          <template #default="scope">
            <el-button class="particulars" @click="handleClick(scope.$index, scope.row)" type="text" size="small">
              <i class="iconfont icon-xiangqing"></i>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div v-if="initialization" class="InferServerStatus_Right"></div>
    <div v-else class="InferServerStatus_Right">
      <div style="display: flex;justify-content: space-between;align-items: center;padding: 8px 10px 8px;">
        <span>
          <span style="margin: 0 10px;">UAI</span>
          <i class="iconfont icon-yuandian" :style="{marginRight: '10px', color: uaiOnline ? '#00FF06' : '#FA6400'}"></i>
          <span>{{ t('Analytics.ana_version_number') + '：' }}</span>
          <span>{{ uaiVersion }}</span>
        </span>
        <span style="font-size: 20px;cursor:pointer" @click="Close" class="iconfont icon-guanbixiaoanniu"></span>
      </div>
      <el-table :data="tableData1" width="100%">
        <el-table-column prop="nDevice" label="Token"></el-table-column>
        <el-table-column prop="strName" label="Name"></el-table-column>
        <el-table-column prop="nInferTimeInMs" label="Infer Time"></el-table-column>
        <el-table-column prop="nQueueSize" label="Queue Size"></el-table-column>
        <el-table-column prop="nFps" label="FPS"></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.infer-server-status {
  width: 100%;
  height: 100%;
  display: flex;
  padding: 10px;
  .InferServerStatus_Left {
    width: 35%;
    height: 100%;
    margin-right: 10px;
    background-color: #202020;
    :deep(.el-button--text) {
      padding: 0;
      width: 20px;
      height: 20px;
      background-color: rgba(141, 189, 255, 0.3);
      border-radius: 10px;
      span {
        color: #fff;
      }
    }
  }
  .InferServerStatus_Right {
    flex: 1;
    height: 100%;
    background-color: #202020;
    padding: 10px;
  }
}
</style>