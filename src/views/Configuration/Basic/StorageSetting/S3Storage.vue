<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowRight } from '@element-plus/icons-vue'
import { GetS3BucketsApi, AddS3BucketApi, EditS3BucketApi, DeleteS3BucketApi, GetWorkServerListApi } from '@/api/configuration/storage';
import { useI18n } from 'vue-i18n';
import StorageState from './components/StorageState.vue'

const { t } = useI18n();

const tableData = ref<any[]>([]);
const addVisiable = ref<boolean>(false)
const editVisiable = ref<boolean>(false)
const stateVisible = ref<boolean>(false)
const addForm = ref<any>({
  // part: {
  //   nIndex: 0,
  //   strAccessKey: 'bMoLv2fz1sGtmeNgwyCY',
  //   strSecretKey: 'xvfpS6Ps6Cni0ab8so0obgpn2r0Ryycc7Ye2uy1I',
  //   strRegionName: 'region-a',
  //   strBucketName: 'bucket-a',
  //   strEndpoint: 'http://192.168.100.100:9000/'
  // },
  // update: false
  nIndex: 0,
  strAccessKey: 'bMoLv2fz1sGtmeNgwyCY',
  strSecretKey: 'xvfpS6Ps6Cni0ab8so0obgpn2r0Ryycc7Ye2uy1I',
  strRegionName: 'region-a',
  strBucketName: 'bucket-a',
  strEndpoint: 'http://192.168.100.100:9000/'
});
const editForm = ref<any>({});
const hasIndex = ref<number[]>([])
const nodeId = ref<string>('')

const Node = async () => {
  const res = await GetWorkServerListApi();
  if (res.status == 200 && res.data.code == 0) {
    nodeId.value = res.data.result.list[0].nodeId;
    GetS3Buckets();
  }
}

const GetS3Buckets = async () => {
  const res = await GetS3BucketsApi(nodeId.value);
  hasIndex.value = [];
  if (res.status === 200 && res.data.code === 0) {
    console.log('S3Buckets =>', res.data.result.bucket)
    tableData.value = res.data.result.bucket.map((item: any) => {
      hasIndex.value.push(item.nIndex)
      return {
        ...item,
        nodeId: nodeId.value
      }
    })
  }
}

const indexDisabled = ref<boolean>(true)
const add = () => {
  addForm.value.nIndex = findMissingNumber(hasIndex.value)
  addVisiable.value = true;
}
const addSubmit = async () => {
  addForm.value.nIndex = Number(addForm.value.nIndex)
  addForm.value.nodeId = nodeId.value;
  const res = await AddS3BucketApi(addForm.value)
  if (res.status == 200 && res.data.code == 0) {
    ElMessage({
      message: t('CommTableEdit.comm_add_successfully'),
      type: 'success',
      duration: 2000
    })
    goback('add');
    GetS3Buckets()
    addForm.value = {
      nIndex: 0,
      strAccessKey: 'bMoLv2fz1sGtmeNgwyCY',
      strSecretKey: 'xvfpS6Ps6Cni0ab8so0obgpn2r0Ryycc7Ye2uy1I',
      strRegionName: 'region-a',
      strBucketName: 'bucket-a',
      strEndpoint: 'http://192.168.100.100:9000/'
    }
  } else {
    ElMessage({
      message: t('CommTableEdit.comm_add_failed'),
      type: 'error',
      duration: 2000
    })
  }
}

const edit = (row: any) => {
  // editForm.value = {
  //   part: {
  //     nIndex: row.nIndex,
  //     strAccessKey: row.strAccessKey,
  //     strSecretKey: row.strSecretKey,
  //     strRegionName: row.strRegionName,
  //     strBucketName: row.strBucketName,
  //     strEndpoint: row.strEndpoint
  //   },
  //   update: true
  // }
  editForm.value = JSON.parse(JSON.stringify(row))
  editVisiable.value = true;
}
const editSubmit = async () => {
  editForm.value.nIndex = Number(editForm.value.nIndex)
  const res = await EditS3BucketApi(editForm.value)
  if (res.status == 200 && res.data.code == 0) {
    ElMessage({
      message: t('CommTableEdit.comm_modify_success'),
      type: 'success',
      duration: 2000
    })
    goback('edit');
    GetS3Buckets()
  } else {
    ElMessage({
      message: t('CommTableEdit.comm_modify_failed'),
      type: 'error',
      duration: 2000
    })
  }
}

const delRow = (row: any) => {
  const params = {
    nodeId: nodeId.value,
    nIndex: Number(row.nIndex),
    strBucketName: row.strBucketName,
    strEndpoint: row.strEndpoint
  }
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
    const res = await DeleteS3BucketApi(params);
    if (res.status == 200 && res.data.code == 0) {
      ElMessage({
        message: t('CommTableEdit.comm_delete_successfully'),
        type: 'success',
        duration: 2000
      })
      GetS3Buckets()
    } else {
      ElMessage({
        message: t('CommTableEdit.comm_delete_failed'),
        type: 'error',
        duration: 2000
      })
    }
  })
}

const highSetting = () => {
  indexDisabled.value = !indexDisabled.value;
}

const crumb = ref<string>('')
const activeObjPartitions = ref<any>()
const openState = (row: any) => {
  crumb.value = row.strBucketName;
  activeObjPartitions.value = row;
  stateVisible.value = true;
}

const goback = (type: string) => {
  if (type == 'add') {
    addVisiable.value = false;
    indexDisabled.value = true;
  } else if (type == 'edit') {
    editVisiable.value = false;
    indexDisabled.value = true;
  } else if (type == 'state') {
    stateVisible.value = false;
    crumb.value = '';
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
onMounted(() => {
  Node()
})
</script>

<template>
  <div class="s3-storage">
    <!-- 新增 -->
    <div v-if="addVisiable && !editVisiable && !stateVisible" class="add-s3">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="goback('add')">{{ t('Router.router_s3_storage') }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t("CommTableEdit.comm_add") }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="title" style="width: 510px; margin: 20px 0; display: flex; justify-content: space-between;">
        <span style="font-size: 18px;">{{ $t("CommTableEdit.comm_add") }}</span>
        <el-button size="small" class="normal" @click="highSetting">{{ t('Configuration.conf_advanced_features') }}</el-button>
      </div>
      <el-form :model="addForm" label-width="120px" label-position="left" style="margin-left: 10px;">
        <el-form-item label="AccessKey" style="width: 500px;">
          <el-input v-model="addForm.strAccessKey"></el-input>
        </el-form-item>
        <el-form-item label="SecretKey" style="width: 500px;">
          <el-input v-model="addForm.strSecretKey"></el-input>
        </el-form-item>
        <el-form-item label="RegionName" style="width: 500px;">
          <el-input v-model="addForm.strRegionName"></el-input>
        </el-form-item>
        <el-form-item label="BucketName" style="width: 500px;">
          <el-input v-model="addForm.strBucketName"></el-input>
        </el-form-item>
        <el-form-item label="Endpoint" style="width: 500px;">
          <el-input v-model="addForm.strEndpoint"></el-input>
        </el-form-item>
        <el-form-item label="Index" style="width: 500px;">
          <el-input v-model="addForm.nIndex" :disabled="indexDisabled"></el-input>
        </el-form-item>
        <el-form-item style="width: 500px;">
          <el-button type="primary" size="small" @click="addSubmit">{{ $t('CommTableEdit.comm_save') }}</el-button>
        </el-form-item>
      </el-form>
    </div>
    <!-- 编辑 -->
    <div v-if="editVisiable && !addVisiable && !stateVisible" class="edit-s3">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="goback('edit')">{{ t('Router.router_s3_storage') }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t("CommTableEdit.comm_edit") }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="title" style="width: 510px; margin: 20px 0; display: flex; justify-content: space-between;">
        <span style="font-size: 18px;">{{ $t("CommTableEdit.comm_edit") }}</span>
        <!-- <el-button size="small" class="normal" @click="highSetting">{{ t('Configuration.conf_advanced_features') }}</el-button> -->
      </div>
      <el-form :model="editForm" label-width="120px" label-position="left" style="margin-left: 10px;">
        <el-form-item label="AccessKey" style="width: 500px;">
          <el-input v-model="editForm.strAccessKey"></el-input>
        </el-form-item>
        <el-form-item label="SecretKey" style="width: 500px;">
          <el-input v-model="editForm.strSecretKey"></el-input>
        </el-form-item>
        <el-form-item label="RegionName" style="width: 500px;">
          <el-input v-model="editForm.strRegionName"></el-input>
        </el-form-item>
        <el-form-item label="BucketName" style="width: 500px;">
          <el-input v-model="editForm.strBucketName"></el-input>
        </el-form-item>
        <el-form-item label="Endpoint" style="width: 500px;">
          <el-input v-model="editForm.strEndpoint"></el-input>
        </el-form-item>
        <!-- <el-form-item label="Index" style="width: 500px;">
          <el-input v-model="editForm.nIndex" :disabled="indexDisabled"></el-input>
        </el-form-item> -->
        <el-form-item style="width: 500px;">
          <el-button type="primary" size="small" @click="editSubmit">{{ $t('CommTableEdit.comm_save') }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="stateVisible && !addVisiable && !editVisiable" class="s3-state">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="goback('state')">{{ $t('Router.router_s3_storage') }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ crumb }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <StorageState router="S3Storage" :objPartitions="activeObjPartitions"></StorageState>
    </div>

    <!-- 主页 -->
    <div v-if="!addVisiable && !editVisiable && !stateVisible" class="s3-header">
      <el-button type="primary" size="small" @click="add">{{ t('CommTableEdit.comm_add') }}</el-button>
    </div>
    <el-table v-if="!addVisiable && !editVisiable && !stateVisible" :data="tableData" style="width: 100%;">
      <el-table-column label="nIndex" prop="nIndex" width="100" align="center"></el-table-column>
      <el-table-column label="AccessKey" prop="strAccessKey" show-overflow-tooltip width="140" align="center"></el-table-column>
      <el-table-column label="SecretKey" prop="strSecretKey" show-overflow-tooltip width="140" align="center"></el-table-column>
      <el-table-column label="RegionName" prop="strRegionName" width="140" align="center"></el-table-column>
      <el-table-column label="BucketName" prop="strBucketName" width="140" align="center"></el-table-column>
      <el-table-column label="Endpoint" prop="strEndpoint" align="center"></el-table-column>
      <el-table-column :label="t('Configuration.conf_mount')" width="120" align="center">
        <template #default="{ row }">
          <!-- <el-switch v-model="row.bMount" disabled></el-switch> -->
           <span v-if="row.bMount" style="color: #06D20B;">{{ t('CommTableEdit.comm_online') }}</span>
           <span v-else style="color: #FE1100;">{{ t('CommTableEdit.comm_offline') }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('Common.comm_time_start')" prop="strStartTime" align="center"></el-table-column>
      <el-table-column :label="t('Common.comm_time_end')" prop="strEndTime" align="center"></el-table-column>
      <el-table-column :label="t('CommTableEdit.comm_operational')" align="center">
        <template #default="{ row }">
          <el-button type="text" size="small" @click="openState(row)">{{ t('Configuration.conf_iscsi_status') }}</el-button>
          <el-button type="text" size="small" @click="edit(row)">{{ t('CommTableEdit.comm_edit') }}</el-button>
          <el-button type="text" size="small" @click="delRow(row)">{{ t('CommTableEdit.comm_delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="scss" scoped>
.s3-storage {
  width: 100%;
  height: 100%;
  .s3-state {
    width: 100%;
    height: 100%;
    padding: 10px 20px;
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
  .s3-header {
    padding: 10px;
  }
  .add-s3, .edit-s3 {
    padding: 20px;
    .bread-header {
      width: 100%;
      height: 40px;
      display: flex;
      align-items: center;
      // background-color: #aaa;
      border-bottom: 1px solid #313131;
      .can-click {
        cursor: pointer;
      }
    }
  }
}
</style>