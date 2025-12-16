<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { GetStorageModeApi, SetStorageModeApi, GetWorkServerListApi } from '@/api/configuration/storage';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';

const {t} = useI18n()

const form = ref({
  nodeId: '',
  mode: ''
})
const storageModeList = [
  // {
  //   value: 'HPRO_STORAGE_MODE_BLOCK',
  //   label: t('Router.router_regular_storage')
  // },
  {
    value: 'USC_STORAGE_MODE_OBJECT',
    label: t('Router.router_local_obj_storage')
  },
  {
    value: 'USC_STORAGE_MODE_S3',
    label: t('Router.router_s3_storage')
  }
]

const Node = async () => {
  const res = await GetWorkServerListApi();
  if (res.status == 200 && res.data.code == 0) {
    if (res.data.result.list && res.data.result.list.length > 0) {
      form.value.nodeId = res.data.result.list[0].nodeId;
      GetStorageMode(form.value.nodeId)
    }
  }
}

const GetStorageMode = async (nodeId: string) => {
  const res = await GetStorageModeApi(nodeId)
  if (res.status == 200 && res.data.code == 0) {
    form.value.mode = res.data.result.mode;
  }
}
const onSubmit = async () => {
  const res = await SetStorageModeApi(form.value);
  // console.log(res)
  if (res.status == 200 && res.data.code == 0) {
    ElMessage({
      message: t('CommTableEdit.comm_modify_success'),
      type: 'success',
      duration: 2000
    })
  } else {
    ElMessage({
      message: t('CommTableEdit.comm_modify_failed'),
      type: 'error',
      duration: 2000
    })
  }
}

onMounted(() => {
  // GetStorageMode()
  Node()
})
</script>

<template>
  <div class="storage-mode">
    <div class="title">{{ t('Router.router_storage_mode') }}</div>
    <el-form label-width="120px" label-position="left" :model="form" style="width: 520px;">
      <el-form-item :label="t('Router.router_storage_mode')">
        <el-select v-model="form.mode" style="width: 400px;">
          <el-option v-for="(item, index) in storageModeList" :key="index" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item class="submit">
        <el-button size="default" class="cannel">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button type="primary" size="default" @click="onSubmit">{{ t('CommTableEdit.comm_save') }}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
.storage-mode {
  padding: 20px 30px;
  .title {
    font-size: 18px;
    // font-family: PingFang-SC, PingFang-SC;
    // font-weight: bold;
    margin-bottom: 20px;
  }
  .cannel {
    border: #0399FE 1px solid;
    background-color: transparent;
    span {
      color: #0399FE;
    }
  }
  .el-button {
    font-size: 12px;
    width: 60px;
    height: 26px;
  }
}
</style>