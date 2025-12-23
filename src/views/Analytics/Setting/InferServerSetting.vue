<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { GetNodeApi, GetEngineApi, PutEngineApi } from '@/api/Analytics/setting';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue'

const { t } = useI18n();

let nodeInfo: any = {}
const tableData = ref<any[]>([])
const total = ref<number>(0)
const filterText = ref<string>('')
const dialogVisible = ref<boolean>(false);
const editVisible = ref<boolean>(false)
const editForm = ref<any>({})
const checkedCities = ref<any[]>([])

const selectData = [{
  value: 'USC_ANALYTICS_CUDA',
  label: 'USC_ANALYTICS_CUDA'
}, {
  value: 'USC_ANALYTICS_CPU',
  label: 'USC_ANALYTICS_CPU'
// }, {
//   value: 'H5_ANALYTICS_CANN',
//   label: 'H5_ANALYTICS_CANN'
// }, {
//   value: 'H5_ANALYTICS_RKNN',
//   label: 'H5_ANALYTICS_RKNN'
}, {
  value: 'USC_ANALYTICS_CANN_310',
  label: 'USC_ANALYTICS_CANN_310'
}, {
  value: 'USC_ANALYTICS_BM1864X_PCIE',
  label: 'USC_ANALYTICS_BM1864X_PCIE'
}, {
  value: 'USC_ANALYTICS_HAILO8',
  label: 'USC_ANALYTICS_HAILO8'
}
// {
//   value: 'H5_ANALYTICS_HAILO',
//   label: 'H5_ANALYTICS_HAILO'
// }
]
const selectData1 = [{
  value: 'USC_ANA_MODEL_NORMAL',
  label: 'USC_ANA_MODEL_NORMAL'
}, {
  value: "USC_ANA_MODEL_MIDDLE",
  label: "USC_ANA_MODEL_MIDDLE"
}, {
  value: 'USC_ANA_MODEL_HIGH',
  label: 'USC_ANA_MODEL_HIGH'
}]
const cities = ["Object Detection", "PPE Detection", "LPR Detection", "Face Recognition", "LPR Recognition", "Crowd Detection", "Fire smoke Detection"]

const GetNode = async () => {
  const res = await GetNodeApi();
  // console.log('Node =>', res)
  if (res.status == 200 && res.data.code == 0 && res.data.result.list) {
    nodeInfo = res.data.result.list[0]
  }
  // console.log(nodeInfo)
}

const GetEngine = async () => {
  const res = await GetEngineApi(nodeInfo.nodeId)
  if (res.status == 200 && res.data.code == 0) {
    const result = res.data.result;
    tableData.value = [];
    const item = {
      Engine: result.Engine,
      ModelAccuracy: result.ModelAccuracy,
      strCudaDriverVersion: result.Engine == "USC_ANALYTICS_CPU" ? 0 : result.strCudaDriverVersion,
      strCudaRuntimeVersion: result.Engine == "USC_ANALYTICS_CPU" ? 0 : result.strCudaRuntimeVersion,
      cuda: result.cuda,
      CudaDevice: result.cuda ? result.cuda.length : 0,
      nodeId: nodeInfo.nodeId,
      nodeName: nodeInfo.nodeName,
      loadedModel: result.loadedModel,
    }
    tableData.value.push(item);
    total.value = tableData.value.length;
    console.log('GetEngine =>', tableData.value)
  }
}

const particulars = ref<any>({})
const handleClick = (row: any) => {
  if (!row.cuda) return
  particulars.value = row.cuda[0]
  dialogVisible.value = true;
}

const handleEdit = (row: any) => {
  editForm.value = {
    nodeId: row.nodeId,
    Engine: row.Engine,
    ModelAccuracy: row.ModelAccuracy
  }
  checkedCities.value = [];
  for (const key in row.loadedModel) {
    if (row.loadedModel[key]) {
      checkedCities.value.push(getLoadedModelName(key))
    }
  }
  editVisible.value = true;
}

const onSubmit = async () => {
  const loadedModel: any = {}
  checkedCities.value.forEach((element) => {
    loadedModel[getLoadedModelValue(element)] = true;
  });
  const params = {
    nodeId: editForm.value.nodeId,
    engine: editForm.value.Engine,
    modelAccuracy: editForm.value.ModelAccuracy,
    loadedModel
  }
  // console.log(params)
  const res = await PutEngineApi(params);
  if (res.status == 200 && res.data.code == 0) {
    ElMessage({
      message: t('CommTableEdit.comm_modify_success'),
      type: 'success',
      duration: 2000
    })
    editVisible.value = false;
    GetEngine()
  } else {
    ElMessage({
      message: t('CommTableEdit.comm_modify_failed'),
      type: 'error',
      duration: 2000
    })
  }
}

const getLoadedModelName = (item: string) => {
  switch (item) {
    case "bEnableObjDet":
      return "Object Detection"

    case "bEnablePpeDet":
      return "PPE Detection"

    case "bEnableLprDet":
      return "LPR Detection"

    case "bEnableFaceRecog":
      return "Face Recognition"

    case "bEnableLprRecog":
      return "LPR Recognition"

    case "bEnableFirSmoDet":
      return "Fire smoke Detection"

    case "bEnableCrowdDet":
      return "Crowd Detection"

    default:
      return item;
  }
}
const getLoadedModelValue = (item: string) => {
  switch (item) {
    case "Object Detection":
      return "bEnableObjDet"

    case "PPE Detection":
      return "bEnablePpeDet"

    case "LPR Detection":
      return "bEnableLprDet"

    case "Face Recognition":
      return "bEnableFaceRecog"

    case "LPR Recognition":
      return "bEnableLprRecog"

    case "Fire smoke Detection":
      return "bEnableFirSmoDet"

    case "Crowd Detection":
      return "bEnableCrowdDet"

    default:
      return item;
  }
}

onMounted(async () => {
  await GetNode()
  GetEngine()
})
</script>

<template>
  <div class="infer-server-setting">
    <el-dialog
      v-model="dialogVisible"
      :title="t('Analytics.ana_detail')"
      width="400"
    >
      <p>nDevice: {{ particulars.nDevice }}</p>
      <p>Name: {{ particulars.strName }}</p>
      <template #footer>
        <el-button type="primary" size="small" @click="dialogVisible = false">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="editVisible" width="500">
      <el-form label-position="left" label-width="120px" :model="editForm">
        <el-form-item :label="t('Analytics.ana_enfine')">
          <el-select v-model="editForm.Engine" style="width:100%">
            <el-option v-for="(value, index) in selectData" :key="index" :label="value.label" :value="value.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('Analytics.ana_model_accuracy')">
          <el-select v-model="editForm.ModelAccuracy" style="width:100%">
            <el-option v-for="(value, index) in selectData1" :key="index" :label="value.label" :value="value.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('Analytics.ana_load_model')">
          <el-checkbox-group v-model="checkedCities">
            <el-checkbox v-for="city in cities" :label="city" :value="city"></el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="editVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button size="small" type="primary" @click="onSubmit">{{ t('CommTableEdit.comm_save') }}</el-button>
      </template>
    </el-dialog>
    <el-table :data="tableData.filter(data => !filterText || data.nodeName.toLowerCase().includes(filterText.toLowerCase()))" style="width: 100%;">
      <el-table-column prop="nodeName" :label="t('Analytics.ana_work_server')"></el-table-column>
      <el-table-column prop="Engine" :label="t('Analytics.ana_enfine')"></el-table-column>
      <el-table-column prop="ModelAccuracy" :label="t('Analytics.ana_model_accuracy')"></el-table-column>
      <el-table-column prop="strCudaDriverVersion" :label="t('Analytics.ana_driver_version')"></el-table-column>
      <el-table-column prop="strCudaRuntimeVersion" :label="t('Analytics.ana_runtime_version')"></el-table-column>
      <el-table-column prop="CudaDevice" :label="t('Device.device_dev')"></el-table-column>
      <el-table-column>
        <template #header>
          <el-input v-model="filterText" :placeholder="t('Common.comm_filtration')" :prefix-icon="Search"></el-input>
        </template>
        <template #default="{row}">
          <el-button type="text" @click="handleClick(row)">{{ t('Analytics.ana_detail') }}</el-button>
          <el-button type="text" @click="handleEdit(row)">{{ t('CommTableEdit.comm_edit') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="scss" scoped>
.infer-server-setting {
  padding: 10px;

}
</style>