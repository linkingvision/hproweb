<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { GetArchiveVolumeConfApi, SetArchiveVolumeConfApi, GetDiskPartitionApi, GetWorkServerListApi } from '@/api/configuration/storage';
import { ElMessage } from 'element-plus';

const { t } = useI18n();

const editVisible = ref<boolean>(false)
const tableData = ref<any[]>([])
const editForm = ref<any>({})
const loading = ref<boolean>(false)

const getArchiveStorageList = async () => {
  loading.value = true;
  tableData.value = [];
  try {
    const nodeRes = await GetWorkServerListApi();
    if (nodeRes.status === 200 && nodeRes.data.code === 0 && nodeRes.data.result.list?.length > 0) {
      const nodes = nodeRes.data.result.list;
      const list: any[] = nodes.map((item: any) => ({ ...item }));

      await Promise.all(nodes.map(async (item: any, index: number) => {
        // Each node is fetched independently; a failure on one node does not block others
        const [archiveRes, partitionRes] = await Promise.all([
          GetArchiveVolumeConfApi(item.nodeId).catch((e: any) => {
            console.warn(`GetArchiveVolumeConf failed for node ${item.nodeId}:`, e);
            return null;
          }),
          GetDiskPartitionApi(item.nodeId).catch((e: any) => {
            console.warn(`GetDiskPartitions failed for node ${item.nodeId}:`, e);
            return null;
          })
        ]);

        if (archiveRes?.status === 200 && archiveRes.data.code === 0) {
          const archiveData = archiveRes.data.result;
          const decodedPath = archiveData.strStorPath ?? '';
          list[index] = {
            ...list[index],
            nMaxFileLength: archiveData.nMaxFileLength,
            nAutoDelPercent: archiveData.nAutoDelPercent,
            strStorPath: decodedPath,
            strArchivePartitionMountpoint: decodedPath,
          };
        }

        if (partitionRes?.status === 200 && partitionRes.data.code === 0) {
          const partitions = partitionRes.data.result.partition;
          list[index] = { ...list[index], partition: partitions };

          const storPath: string = list[index].strStorPath ?? '';
          let checkedDisk: any = null;
          if (storPath && partitions?.length > 0) {
            if (storPath.includes('www')) {
              checkedDisk = partitions.find((p: any) =>
                new RegExp(`^${p.strMountpoint}`).test(archiveRes?.data.result.strStorPath ?? '')
              );
            } else {
              checkedDisk = partitions.find((p: any) => p.strMountpoint === storPath);
            }
          }

          if (checkedDisk) {
            list[index] = {
              ...list[index],
              checkedDisk,
              strArchivePartitionDevice: checkedDisk.strDevice,
            };
          }
        }
      }));

      tableData.value = list;
    }
  } catch (error) {
    console.error('Failed to fetch archive storage data:', error);
  } finally {
    loading.value = false;
  }
}

const editMeta = (row: any) => {
  editForm.value = JSON.parse(JSON.stringify(row));
  editVisible.value = true;
}

const submit = async () => {
  const params = {
    nodeId: editForm.value.nodeId,
    storpath: editForm.value.strArchivePartitionMountpoint ?? '',
    autodelpercent: Number(editForm.value.nAutoDelPercent) || 80,
    maxFileLength: Number(editForm.value.nMaxFileLength) || 30
  };

  try {
    const res = await SetArchiveVolumeConfApi(params);
    if (res.status === 200 && res.data.code === 0) {
      ElMessage({
        message: t('CommTableEdit.comm_save_successfully'),
        type: 'success',
        duration: 2000
      });
      goback();
      getArchiveStorageList();
    } else {
      ElMessage({
        message: res.data?.msg || t('CommTableEdit.comm_save_failed'),
        type: 'error',
        duration: 2000
      });
    }
  } catch (err) {
    console.error('Save archive storage failed:', err);
    ElMessage({
      message: t('CommTableEdit.comm_save_failed'),
      type: 'error',
      duration: 2000
    });
  }
}

const goback = () => {
  editVisible.value = false;
}

const formatPercent = (val: number) => val + '%';

const calculateCapacity = (value: number): string => {
  if (!value) return '0GB';
  if ((value / 1024) < 1) return (value / 1024).toFixed(1) + 'GB';
  if ((value / 1024) > 1000) return (value / 1024 / 1024).toFixed(0) + 'TB';
  return (value / 1024).toFixed(0) + 'GB';
}

onMounted(() => {
  getArchiveStorageList();
})
</script>

<template>
  <div class="archive-storage">
    <!-- Data list -->
    <el-table v-if="!editVisible" :data="tableData" v-loading="loading" style="width: 100%;">
      <el-table-column prop="nodeName" :label="$t('Cluster.cluster_server_name')" align="center"></el-table-column>
      <el-table-column :label="$t('Archive.arch_storage_videotime')" align="center">
        <template #default="{ row }">
          <span>{{ row.nMaxFileLength }} {{ $t('Common.comm_minutes') }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('Archive.arch_storage_retentionpercent')" align="center">
        <template #default="{ row }">
          <span>{{ row.nAutoDelPercent }}%</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('Archive.arch_storage_archivepartition')" align="center">
        <template #default="{ row }">
          <div class="progress-box" v-if="row.checkedDisk">
            <span class="disk">{{ row.checkedDisk.strDevice }}</span>
            <el-progress
              :percentage="Number((((row.checkedDisk.nTotalInM - row.checkedDisk.nFreeInM) / row.checkedDisk.nTotalInM) * 100).toFixed(0))"
              :show-text="false"
            ></el-progress>
            <div class="count">
              <span class="used">{{ calculateCapacity(row.checkedDisk.nTotalInM - row.checkedDisk.nFreeInM) }}</span>
              /
              <span>{{ calculateCapacity(row.checkedDisk.nTotalInM) }}</span>
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
    <div v-else class="edit-archive">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="goback">{{ $t('Configuration.conf_archive_storage') }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t('CommTableEdit.comm_edit') }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="title">{{ $t('CommTableEdit.comm_edit') }}</div>
      <el-form :model="editForm" label-width="200px" label-position="left" style="margin-left: 10px;">
        <el-form-item :label="$t('Cluster.cluster_server_name')" style="width: 600px;">
          <el-input v-model="editForm.nodeName" disabled></el-input>
        </el-form-item>
        <el-form-item :label="$t('Archive.arch_storage_videotime')" style="width: 600px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <el-input v-model="editForm.nMaxFileLength" type="number" style="width: 150px;"></el-input>
            <span>{{ $t('Common.comm_minutes') }}</span>
          </div>
        </el-form-item>
        <el-form-item :label="$t('Archive.arch_storage_retentionpercent')" style="width: 600px;">
          <div style="display: flex; align-items: center; gap: 15px; width: 100%;">
            <el-slider
              v-model="editForm.nAutoDelPercent"
              :min="1"
              :max="92"
              :step="1"
              :show-tooltip="true"
              :format-tooltip="formatPercent"
              style="flex: 1;"
            ></el-slider>
            <span style="min-width: 45px; color: #409EFF;">{{ editForm.nAutoDelPercent }}%</span>
          </div>
        </el-form-item>
      </el-form>
      <el-button type="primary" size="small" style="margin-top: 20px; margin-left: 10px;" @click="submit">
        {{ $t('CommTableEdit.comm_save') }}
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.archive-storage {
  .nowrap {
    white-space: nowrap;
  }

  .progress-box {
    width: 100%;
    display: flex;
    align-items: center;

    .disk {
      margin-right: 10px;
      white-space: nowrap;
    }

    :deep(.el-progress) {
      flex: 1;
      margin-right: 10px;

      .el-progress-bar__outer {
        height: 8px !important;
      }
    }

    .count {
      white-space: nowrap;
    }

    .used {
      color: #409EFF;
    }
  }

  .edit-archive {
    padding: 20px;

    .title {
      font-size: 18px;
      font-weight: 600;
      margin: 10px 0;
    }

    :deep(.el-slider) {
      .el-slider__runway {
        background-color: #404040;
      }
      .el-slider__bar {
        background-color: #409EFF;
      }
      .el-slider__button {
        border-color: #409EFF;
        background-color: #409EFF;
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

  :deep(.edit-btn) {
    span {
      color: #409EFF;
    }
  }
}
</style>
