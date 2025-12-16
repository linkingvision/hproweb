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
const addVisiable = ref<boolean>(false)
const stateVisible = ref<boolean>(false)
const nIndex = ref<number>(0)
const indexDisabled = ref<boolean>(true)
const addData = ref<any>({})
const nodeId = ref<string>('')

const Node = async () => {
  const res = await GetWorkServerListApi();
  if (res.status == 200 && res.data.code == 0) {
    if (res.data.result.list && res.data.result.list.length > 0) {
      nodeId.value = res.data.result.list[0].nodeId;
      GetObjPartitions()
    }
  }
}

const GetObjPartitions = async () => {
  const res = await GetObjPartitionsApi(nodeId.value);
  let objList = [];
  hasIndex.value = [];
  if (res.status == 200 && res.data.code == 0) {
    // objList = res.data.result.partition;
    diskData.value = res.data.result.partition;
    objList = res.data.result.partition.filter((item: any) => item.obj != null).map((item: any) => {
      return {
        ...item,
        nodeId: nodeId.value
      }
    })
    res.data.result.partition.forEach((item: any) => {
      if (item.obj && item.obj.length > 0) {
        item.obj.forEach((val: any) => {
          hasIndex.value.push(val.nIndex)
        })
      }
    })
  }
  // const result = await GetDiskPartitionApi(nodeId.value);
  // if (result.status == 200 && result.data.code == 0) {
  //   diskData.value = result.data.result.partition;
  //   objList.forEach((item: any) => {
  //     hasIndex.value.push(item.nIndex);
  //     const checkedDisk = result.data.result.partition.find((value: any) => value.strDevice === item.strDevice + '\\')
  //     if (checkedDisk) {
  //       item.checkedDisk = checkedDisk;
  //     }
  //   })
  // }
  crumb.value = objList[0].strDevice;
  activeObjPartitions.value = objList[0];
  list.value = objList;
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
  // return;
  ElMessageBox.prompt(t('CommTableEdit.comm_delete_confirm'), t('CommTableEdit.comm_prompt'), {
    confirmButtonText: t('CommTableEdit.comm_ok'),
    cancelButtonText: t("CommTableEdit.comm_cancel"),
    icon: h('i', {class: 'iconfont icon-tishi1 warn-tip'}),
    customClass: 'DeleteConfirm',
    cancelButtonClass: 'warn-cannel-btn',
    confirmButtonClass: 'warn-confirm-btn',
    inputPlaceholder: t('Configuration.conf_enter_index_del'),
    inputValidator: (value) => {
      return value === row.nIndex.toString() ? true : t('Configuration.conf_not_match_index');
    }
  }).then(async () => {
    const res = await DelObjPartitionApi({
      nodeId: nodeId.value,
      nIndex: row.obj[0].nIndex,
      strMountpoint: row.strMountpoint
    })
    if (res.status && res.data.code == 0) {
      ElMessage({
        message: t('CommTableEdit.comm_delete_successfully'),
        type: 'success',
        duration: 2000
      })
      GetObjPartitions();
    }
  }).catch(() => {})
  
}

const add = () => {
  nIndex.value = findMissingNumber(hasIndex.value)
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
    // part: {
    //   nIndex: nIndex.value,
    //   strDevice: addData.value.strDevice,
    //   strMountpoint: addData.value.strMountpoint
    // },
    // update: false
    nodeId: nodeId.value,
    nIndex: nIndex.value,
    strDevice: addData.value.strDevice,
    strMountpoint: addData.value.strMountpoint
  })
  if (res.status === 200 && res.data.code === 0) {
    ElMessage({
      message: t('CommTableEdit.comm_add_successfully'),
      type: 'success',
      duration: 2000
    })
    goback('add')
    GetObjPartitions();
  }
}

const findMissingNumber = (arr: number[]) => {
  if (arr.length == 0) return 1;  // 如果数组为空，返回1
  const sortedUnique = [...new Set(arr)].sort((a, b) => a-b); // 对数组排序并去重
  for (let i = 1; i <= sortedUnique.length + 1; i++) {  // 从1开始查找第一个缺失的数字
    if (sortedUnique[i - 1] !== i) {
      return i;
    }
  }
  return sortedUnique.length + 1;
}
const CalculateCapacity = (value: any) => {
  if (value) {
    // 是不是小于1GB, 
    if ((value / 1024) < 1) {
      return (value / 1024).toFixed(1) + "GB";
    } else if ((value / 1024) > 1000) {
      // 是不是大于1000GB, 
      return (value / 1024 / 1024).toFixed(0) + "TB";
    } else {
      return (value / 1024).toFixed(0) + "GB";
    }
  }
}
const goback = (type: string) => {
  if (type === 'add') {
    addVisiable.value = false;
  } else if (type === 'state') {
    stateVisible.value = false;
    crumb.value = '';
  }
}

onMounted(() => {
  // GetObjPartitions()
  Node()
})
</script>

<template>
  <div class="local-object-storage">
    <div v-if="!addVisiable && !stateVisible" class="localobj-header">
      <el-button type="primary" size="small" @click="add">{{ t('CommTableEdit.comm_add') }}</el-button>
    </div>
    <el-table :data="list" style="width: 100%;" v-if="!addVisiable && !stateVisible">
      <el-table-column label="Index" width="200" align="center">
        <template #default="{row}">
          <span>{{ row.obj[0].nIndex }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Partition" align="center" width="300">
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
      <el-table-column :label="t('Configuration.conf_mount')" align="center" width="200">
        <template #default="{ row }">
          <span v-if="row.obj[0].bMount" class="iconfont icon-yuandian" style="color: #06D20B;"></span>
          <span v-else class="iconfont icon-yuandian" style="color: #FE1100;"></span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('CommTableEdit.comm_operational')">
        <template #default="{row}">
          <el-button @click="localState(row)" type="text" size="small">{{ t('Configuration.conf_iscsi_status') }}</el-button>
          <el-button @click="delRow(row)" type="text" size="small">{{ $t("CommTableEdit.comm_delete") }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="addVisiable && !stateVisible" class="add-storage">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="goback('add')">{{ $t('Router.router_local_obj_storage') }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t("CommTableEdit.comm_add") }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="title" style="width: 500px; display: flex; justify-content: space-between;">
        <span>{{ $t("CommTableEdit.comm_add") }}</span>
        <el-button size="small" class="normal" @click="highSetting">{{ t('Configuration.conf_advanced_features') }}</el-button>
      </div>
      <el-form :model="addData" label-width="140px" label-position="left" style="margin-left: 10px;">
        <el-form-item label="Index" style="width: 490px;">
					<el-input v-model="nIndex" :disabled="indexDisabled"></el-input>
				</el-form-item>
      </el-form>
      <div class="disk-list">
				<div class="disk-item" :class="item.strDevice === addData.strDevice + '\\' ? 'active' : ''"
					v-for="(item, index) in diskData" :key="index" @click="changeDisk(item)">
					<div class="top">
						<span>{{ item.strDevice }} {{ item.strFstype }}</span>
						<span>{{ $t('Configuration.conf_mount_point') }}：{{ item.strMountpoint }}</span>
					</div>
					<el-progress
						:percentage="Number((((item.nTotalInM - item.nFreeInM) / item.nTotalInM) * 100).toFixed(0))"
						:show-text="false"></el-progress>
					<div class="bottom">
            {{ $t('Configuration.conf_used') }}/{{ $t('Configuration.conf_all') }}：
            <span style="color: #409EFF;">{{ CalculateCapacity(item.nTotalInM - item.nFreeInM) }}</span>
            /{{ CalculateCapacity(item.nTotalInM) }}
          </div>
				</div>
			</div>
      <el-button type="primary" size="small" @click="submit">{{ $t('CommTableEdit.comm_save') }}</el-button>
    </div>

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
    padding:10px 20px;
    display: flex;
    flex-direction: column;
    .bread-header {
      width: 100%;
      height: 50px;
      display: flex;
      align-items: center;
      // background-color: #aaa;
      border-bottom: 1px solid #313131;
      .can-click {
        cursor: pointer;
      }
    }
  }
  .add-storage {
    padding: 20px 30px;
    .bread-header {
      width: 100%;
      height: 50px;
      display: flex;
      align-items: center;
      // background-color: #aaa;
      border-bottom: 1px solid #313131;
      .can-click {
        cursor: pointer;
      }
    }
    .title {
      margin-bottom: 20px;
      margin: 20px 0;
      span {
        font-size: 18px;
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
          // background-color: rgba($color: #fff, $alpha: 0.2) !important;
        }
      }
    }
  }
  
  .localobj-header {
    padding: 10px;
  }
  .pregress-box {
    width: 100%;
    display: flex;
    align-items: center;
    .disk {
      margin-right: 10px;
    }
    :deep(.el-progress) {
      flex: 1;
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