<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowRight } from '@element-plus/icons-vue'
import { GetObjPartitionsApi, AddObjPartitionApi, DelObjPartitionApi, GetWorkServerListApi } from '@/api/configuration/storage'
import { ElMessage, ElMessageBox } from 'element-plus';
import StorageState from './components/StorageState.vue';

const { t } = useI18n();

const list = ref<any[]>([])
const diskData = ref<any[]>([])
const hasIndex = ref<number[]>([])
const loading = ref<boolean>(false)
const addVisiable = ref<boolean>(false)
const stateVisible = ref<boolean>(false)
const nIndex = ref<number>(0)
const indexDisabled = ref<boolean>(true)
const addData = ref<any>({})
const nodeList = ref<any[]>([])
const nodeId = ref<string>('')
const nodeName = ref<string>('')

const Node = async () => {
  const res = await GetWorkServerListApi();
  if (res.status == 200 && res.data.code == 0) {
    nodeList.value = res.data.result.list;
    if (res.data.result.list && res.data.result.list.length > 0) {
      nodeId.value = res.data.result.list[0].nodeId;
      nodeName.value = res.data.result.list[0].nodeName;
      GetObjPartitions();
    }
  }
}

const GetObjPartitions = async () => {
  loading.value = true;
  const res = await GetObjPartitionsApi(nodeId.value);
  let objList: any[] = [];
  hasIndex.value = [];
  if (res.status == 200 && res.data.code == 0) {
    diskData.value = res.data.result.partition;
    objList = res.data.result.partition.filter((item: any) => item.obj != null).map((item: any) => {
      return {
        ...item,
        nodeId: nodeId.value,
        nodeName: nodeName.value
      }
    });
    res.data.result.partition.forEach((item: any) => {
      if (item.obj && item.obj.length > 0) {
        item.obj.forEach((val: any) => {
          hasIndex.value.push(val.nIndex)
        })
      }
    })
  }
  list.value = objList;
  loading.value = false;
}

const nodeChange = () => {
  const info = nodeList.value.find(item => item.nodeId === nodeId.value);
  if (info) nodeName.value = info.nodeName;
  GetObjPartitions();
}

const crumb = ref<string>('')
const activeObjPartitions = ref<any>({})
const localState = (row: any) => {
  crumb.value = row.strDevice;
  if (row.obj && row.obj.length > 0) {
    activeObjPartitions.value = row.obj[0];
  }
  stateVisible.value = true;
}

const delRow = (row: any) => {
  ElMessageBox.prompt(t('CommTableEdit.comm_delete_confirm'), t('CommTableEdit.comm_prompt'), {
    confirmButtonText: t('CommTableEdit.comm_ok'),
    cancelButtonText: t('CommTableEdit.comm_cancel'),
    icon: h('i', { class: 'iconfont icon-tishi1 warn-tip' }),
    customClass: 'DeleteConfirm',
    cancelButtonClass: 'warn-cannel-btn',
    confirmButtonClass: 'warn-confirm-btn',
    inputPlaceholder: t('Configuration.conf_enter_index_del'),
    inputValidator: (value) => {
      return value === row.obj[0].nIndex.toString() ? true : t('Configuration.conf_not_match_index');
    }
  }).then(async () => {
    const res = await DelObjPartitionApi({
      nodeId: nodeId.value,
      nIndex: row.obj[0].nIndex,
      strMountpoint: row.strMountpoint
    });
    if (res.status === 200 && res.data.code === 0) {
      ElMessage({
        message: t('CommTableEdit.comm_delete_successfully'),
        type: 'success',
        duration: 2000
      });
      GetObjPartitions();
    } else {
      ElMessage({
        message: t('CommTableEdit.comm_delete_failed'),
        type: 'error',
        duration: 2000
      });
    }
  }).catch(() => {})
}

const add = () => {
  nIndex.value = findMissingNumber(hasIndex.value);
  addVisiable.value = true;
}

const highSetting = () => {
  indexDisabled.value = !indexDisabled.value;
}

const changeDisk = (partition: any) => {
  addData.value.strDevice = partition.strDevice;
  addData.value.strMountpoint = partition.strMountpoint;
}

const submit = async () => {
  const res = await AddObjPartitionApi({
    nodeId: nodeId.value,
    nIndex: nIndex.value,
    strDevice: addData.value.strDevice,
    strMountpoint: addData.value.strMountpoint
  });
  if (res.status === 200 && res.data.code === 0) {
    ElMessage({
      message: t('CommTableEdit.comm_add_successfully'),
      type: 'success',
      duration: 2000
    });
    goback('add');
    GetObjPartitions();
  } else {
    ElMessage({
      message: t('CommTableEdit.comm_add_failed'),
      type: 'error',
      duration: 2000
    });
  }
}

const findMissingNumber = (arr: number[]) => {
  if (arr.length == 0) return 1;
  const sortedUnique = [...new Set(arr)].sort((a, b) => a - b);
  for (let i = 1; i <= sortedUnique.length + 1; i++) {
    if (sortedUnique[i - 1] !== i) {
      return i;
    }
  }
  return sortedUnique.length + 1;
}

const CalculateCapacity = (value: any) => {
  if (value) {
    if ((value / 1024) < 1) {
      return (value / 1024).toFixed(1) + 'GB';
    } else if ((value / 1024) > 1000) {
      return (value / 1024 / 1024).toFixed(0) + 'TB';
    } else {
      return (value / 1024).toFixed(0) + 'GB';
    }
  }
}

const goback = (type: string) => {
  if (type === 'add') {
    addVisiable.value = false;
    indexDisabled.value = true;
  } else if (type === 'state') {
    stateVisible.value = false;
    crumb.value = '';
  }
}

onMounted(() => {
  Node()
})
</script>

<template>
  <div class="local-object-storage">
    <!-- Data list -->
    <div v-if="!addVisiable && !stateVisible" class="localobj-header">
      <div class="left">
        <el-button type="primary" size="small" @click="add">{{ t('CommTableEdit.comm_add') }}</el-button>
      </div>
      <div class="right">
        <span style="margin-right: 10px;">{{ t('SystemInfo.system_server') }}</span>
        <el-select v-model="nodeId" @change="nodeChange" style="width: 220px;">
          <el-option
            v-for="(item, index) in nodeList"
            :key="index"
            :label="item.nodeName"
            :value="item.nodeId"
          ></el-option>
        </el-select>
      </div>
    </div>
    <el-table
      v-if="!addVisiable && !stateVisible"
      :data="list"
      v-loading="loading"
      style="width: 100%;"
    >
      <el-table-column :label="t('Cluster.cluster_server_name')" prop="nodeName" width="200" align="center"></el-table-column>
      <el-table-column label="Index" width="120" align="center">
        <template #default="{ row }">
          <span>{{ row.obj[0].nIndex }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Partition" align="center">
        <template #default="{ row }">
          <div class="pregress-box">
            <span class="disk">{{ row.strDevice }}</span>
            <el-progress
              :percentage="Number((((row.nTotalInM - row.nFreeInM) / row.nTotalInM) * 100).toFixed(0))"
              :show-text="false"
            ></el-progress>
            <div class="count">
              <span class="used">{{ CalculateCapacity(row.nTotalInM - row.nFreeInM) }}</span>
              /
              <span>{{ CalculateCapacity(row.nTotalInM) }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('Configuration.conf_mount')" align="center" width="120">
        <template #default="{ row }">
          <span v-if="row.obj[0].bMount" style="color: #06D20B;">{{ t('CommTableEdit.comm_online') }}</span>
          <span v-else style="color: #FE1100;">{{ t('CommTableEdit.comm_offline') }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('CommTableEdit.comm_operational')" align="center">
        <template #default="{ row }">
          <el-button type="text" size="small" @click="localState(row)">{{ t('Configuration.conf_iscsi_status') }}</el-button>
          <el-button type="text" size="small" @click="delRow(row)">{{ t('CommTableEdit.comm_delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add -->
    <div v-if="addVisiable && !stateVisible" class="add-storage">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="goback('add')">{{ $t('Router.router_local_obj_storage') }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t('CommTableEdit.comm_add') }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="title" style="width: 500px; display: flex; justify-content: space-between; margin: 20px 0;">
        <span style="font-size: 18px;">{{ $t('CommTableEdit.comm_add') }}</span>
        <el-button size="small" class="normal" @click="highSetting">{{ t('Configuration.conf_advanced_features') }}</el-button>
      </div>
      <el-form :model="addData" label-width="140px" label-position="left" style="margin-left: 10px;">
        <el-form-item :label="t('Cluster.cluster_server_name')" style="width: 490px;">
          <el-input v-model="nodeName" disabled></el-input>
        </el-form-item>
        <el-form-item label="Index" style="width: 490px;">
          <el-input v-model="nIndex" :disabled="indexDisabled"></el-input>
        </el-form-item>
      </el-form>
      <div class="disk-list">
        <div
          class="disk-item"
          :class="item.strDevice === addData.strDevice ? 'active' : ''"
          v-for="(item, index) in diskData"
          :key="index"
          @click="changeDisk(item)"
        >
          <div class="top">
            <span>{{ item.strDevice }} {{ item.strFstype }}</span>
            <span>{{ $t('Configuration.conf_mount_point') }}：{{ item.strMountpoint }}</span>
          </div>
          <el-progress
            :percentage="Number((((item.nTotalInM - item.nFreeInM) / item.nTotalInM) * 100).toFixed(0))"
            :show-text="false"
          ></el-progress>
          <div class="bottom">
            {{ $t('Configuration.conf_used') }}/{{ $t('Configuration.conf_all') }}：
            <span style="color: #409EFF;">{{ CalculateCapacity(item.nTotalInM - item.nFreeInM) }}</span>
            /{{ CalculateCapacity(item.nTotalInM) }}
          </div>
        </div>
      </div>
      <el-button type="primary" size="small" @click="submit">{{ $t('CommTableEdit.comm_save') }}</el-button>
    </div>

    <!-- State detail -->
    <div v-if="!addVisiable && stateVisible" class="local-state">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="goback('state')">{{ $t('Router.router_local_obj_storage') }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ crumb }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <StorageState router="LocalObjStorage" :objPartitions="activeObjPartitions"></StorageState>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.local-object-storage {
  width: 100%;
  height: 100%;

  .local-state {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    .bread-header {
      width: 100%;
      height: 50px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #313131;

      .can-click {
        cursor: pointer;
      }
    }
  }

  .add-storage {
    padding: 20px 20px 0 20px;

    .bread-header {
      width: 100%;
      height: 50px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #313131;

      .can-click {
        cursor: pointer;
      }
    }

    :deep(.is-disabled) {
      .el-input__inner {
        opacity: 0.5;
      }
    }

    .disk-list {
      width: 100%;
      display: flex;
      flex-wrap: wrap;

      .disk-item {
        width: 32%;
        margin-right: 20px;
        margin-bottom: 20px;
        height: 120px;
        border-radius: 4px;
        padding: 16px;
        cursor: pointer;

        .top {
          display: flex;
          justify-content: space-between;
        }

        .el-progress {
          margin: 10px 0;
        }

        :deep(.el-progress-bar__outer) {
          height: 14px !important;
        }
      }
    }
  }

  .localobj-header {
    height: 40px;
    width: 100%;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .pregress-box {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    .disk {
      margin-right: 10px;
    }

    :deep(.el-progress) {
      width: 160px;
      margin-right: 10px;

      .el-progress-bar__outer {
        height: 8px !important;
      }
    }

    .used {
      color: #409EFF;
    }
  }
}
</style>
