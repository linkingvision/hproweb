<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { GetMetaStorageApi, GetDiskPartitionApi, SetMetaStorageApi, GetWorkServerListApi } from '@/api/configuration/storage';
import { ElMessage } from 'element-plus';

const { t } = useI18n();

const editVisiable = ref<boolean>(false)
const tableData = ref<any[]>([])
const editData = ref<any>({})
const loading = ref<boolean>(false)

const getMetaStorageList = async () => {
  loading.value = true;
  tableData.value = [];
  try {
    const nodeRes = await GetWorkServerListApi();
    if (nodeRes.status === 200 && nodeRes.data.code === 0 && nodeRes.data.result.list?.length > 0) {
      const nodes = nodeRes.data.result.list;
      const list: any[] = nodes.map((item: any) => ({ ...item }));

      await Promise.all(nodes.map(async (item: any, index: number) => {
        const [metaRes, partitionRes] = await Promise.all([
          GetMetaStorageApi(item.nodeId),
          GetDiskPartitionApi(item.nodeId)
        ]);

        if (metaRes.status === 200 && metaRes.data.code === 0) {
          list[index] = { ...list[index], ...metaRes.data.result };
        }
        if (partitionRes.status === 200 && partitionRes.data.code === 0) {
          const partitions = partitionRes.data.result.partition;
          list[index] = { ...list[index], partition: partitions };
          const checkedDisk = partitions.find(
            (p: any) => p.strDevice === metaRes.data.result.strMetaPartitionDevice
          );
          if (checkedDisk) {
            list[index] = { ...list[index], checkedDisk };
          }
        }
      }));

      tableData.value = list;
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    loading.value = false;
  }
}

const editMeta = (row: any) => {
  editData.value = JSON.parse(JSON.stringify(row));
  editVisiable.value = true;
}

const changeDisk = (device: string, point: string) => {
  editData.value.strMetaPartitionDevice = device;
  editData.value.strMetaPartitionMountpoint = point;
}

const submit = async () => {
  const params = {
    nodeId: editData.value.nodeId,
    bEnableMetaStorage: editData.value.bEnableMetaStorage,
    strMetaPartitionDevice: editData.value.strMetaPartitionDevice,
    strMetaPartitionMountpoint: editData.value.strMetaPartitionMountpoint,
    nMetaRetentionInDay: Number(editData.value.nMetaRetentionInDay)
  }
  try {
    const res = await SetMetaStorageApi(params);
    if (res.status === 200 && res.data.code === 0) {
      ElMessage({
        message: t('CommTableEdit.comm_modify_success'),
        type: 'success',
        duration: 2000
      });
      goback();
      getMetaStorageList();
    } else {
      ElMessage({
        message: t('CommTableEdit.comm_save_failed'),
        type: 'error',
        duration: 2000
      });
    }
  } catch (err) {
    console.error('Save failed:', err);
    ElMessage({
      message: t('CommTableEdit.comm_save_failed'),
      type: 'error',
      duration: 2000
    });
  }
}

const goback = () => {
  editVisiable.value = false;
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

onMounted(() => {
  getMetaStorageList();
})
</script>

<template>
  <div class="meta-storage">
    <!-- Data list -->
    <el-table v-if="!editVisiable" :data="tableData" v-loading="loading" style="width: 100%;">
      <el-table-column prop="nodeName" :label="$t('Cluster.cluster_server_name')" width="200" align="center"></el-table-column>
      <el-table-column :label="$t('Configuration.conf_enable_meta')" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.bEnableMetaStorage" disabled></el-switch>
        </template>
      </el-table-column>
      <!-- <el-table-column prop="nMetaRetentionInDay" :label="$t('Configuration.conf_meta_days')" align="center"></el-table-column> -->
      <el-table-column :label="$t('Configuration.conf_meta_partition')" align="center" width="300">
        <template #default="{ row }">
          <div class="pregress-box" v-if="row.checkedDisk">
            <span class="disk">{{ row.strMetaPartitionDevice }}</span>
            <el-progress
              :percentage="Number((((row.checkedDisk.nTotalInM - row.checkedDisk.nFreeInM) / row.checkedDisk.nTotalInM) * 100).toFixed(0))"
              :show-text="false"
            ></el-progress>
            <div class="count">
              <span class="used">{{ CalculateCapacity(row.checkedDisk.nTotalInM - row.checkedDisk.nFreeInM) }}</span>
              /
              <span>{{ CalculateCapacity(row.checkedDisk.nTotalInM) }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('CommTableEdit.comm_operational')" align="center">
        <template #default="{ row }">
          <el-button @click="editMeta(row)" type="text" size="small" class="edit-btn">{{ $t('CommTableEdit.comm_edit') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Edit panel -->
    <div v-else class="edit-meta">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="goback">{{ $t('Router.router_meta_storage') }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t('CommTableEdit.comm_edit') }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="title">{{ $t('CommTableEdit.comm_edit') }}</div>
      <el-form :model="editData" label-width="200px" label-position="left" style="margin-left: 10px;">
        <el-form-item :label="$t('Cluster.cluster_server_name')" style="width: 600px;">
          <el-input v-model="editData.nodeName" disabled></el-input>
        </el-form-item>
        <el-form-item :label="$t('Configuration.conf_enable_meta')">
          <el-switch v-model="editData.bEnableMetaStorage"></el-switch>
        </el-form-item>
        <!-- <el-form-item :label="$t('Configuration.conf_meta_days')" style="width: 600px;">
          <el-input v-model="editData.nMetaRetentionInDay" type="number"></el-input>
        </el-form-item> -->
      </el-form>
      <div class="disk-list">
        <div
          class="disk-item"
          :class="item.strDevice === editData.strMetaPartitionDevice ? 'active' : ''"
          v-for="(item, index) in editData.partition"
          :key="index"
          @click="changeDisk(item.strDevice, item.strMountpoint)"
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
            <span class="used">{{ CalculateCapacity(item.nTotalInM - item.nFreeInM) }}</span>
            /{{ CalculateCapacity(item.nTotalInM) }}
          </div>
        </div>
      </div>
      <el-button type="primary" size="small" @click="submit">{{ $t('CommTableEdit.comm_save') }}</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.meta-storage {
  .edit-meta {
    padding: 20px;

    .title {
      font-size: 18px;
      font-weight: 600;
      margin: 10px 0;
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

  :deep(.edit-btn) {
    span {
      color: #409EFF;
    }
  }
}
</style>
