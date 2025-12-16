<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useI18n } from 'vue-i18n';
import { DBUploadUrl, ResetServiceApi, ConfigExportUrl, SqlExportApi, SetDBStatus, DBDownloadUrl } from '@/api/system'
import { KeepAlive } from '@/api/userApi';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';

const userStore = useUserStore()
const router = useRouter()
const { t } = useI18n()

const isExportEvent = ref<boolean>(false);
const isExport = ref<boolean>(false);
const percentage = ref<number>(0);
const customColor = ref<string>('#409eff');
const timer = ref<any>(null)
const fileList = ref<any>([]);
const tips = ref<string>('');

const resetService = () => {
  ElMessageBox.confirm(
    t('System.sys_confirm_restart'),
    t('CommTableEdit.comm_prompt'),
    {
      confirmButtonText: t('CommTableEdit.comm_ok'),
      cancelButtonText: t('CommTableEdit.comm_cancel'),
      type: 'warning'
    }
  ).then(async () => {
    const res = await ResetServiceApi();
    if (res.status == 200 && res.data.code == 0) {
      console.log('开始重启')
      const loading = ElLoading.service({
        lock: true,
        text: t('System.sys_restart_long_time'),
        background: 'rgba(255, 255, 255, 0.3)'
      })
      let timer: any = setInterval(async () => {
        const ress = await KeepAlive();
        if (ress.status == 200 && ress.data.code == 0) {
          loading.close()
          clearInterval(timer)
          timer = null;
          console.log('重启完毕!')
          router.push('/Login')
        }
      }, 2000)
    }
  }).catch(() => {})
}
const configExport = () => {
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'), // 月份补零
    String(now.getDate()).padStart(2, '0'),      // 日期补零
    String(now.getHours()).padStart(2, '0'),     // 小时补零
    String(now.getMinutes()).padStart(2, '0'),   // 分钟补零
    String(now.getSeconds()).padStart(2, '0')    // 秒数补零
  ].join(''); // 输出示例：20250625141324
  const url = userStore.IPPORT + ConfigExportUrl + userStore.session;
  const a = document.createElement('a');
  a.href = url;
  a.download = `hproconf-export-${timestamp}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
const sqlExport = async () => {
  if (isExport.value) return
  const res = await SqlExportApi(isExportEvent.value);
  if (res.status == 200 && res.data.code == 0) {
    const key = res.data.result.key;
    timer.value = setInterval(() => getDbStatus(key), 1000);
    isExport.value = true;
  }
}
const getDbStatus = async (key: string) => {
  const res = await SetDBStatus(key);
  if (res.status == 200 && res.data.code === 0) {
    percentage.value = Math.round(res.data.result.Progress);
    if (res.data.result.Progress == 100) {
      clearInterval(timer.value);
      timer.value = null;
      isExport.value = false;
      console.log('导出完毕');
      
      // 获取当前时间并格式化为 YYYYMMDDHHmmss
      const now = new Date();
      const timestamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'), // 月份补零
        String(now.getDate()).padStart(2, '0'),      // 日期补零
        String(now.getHours()).padStart(2, '0'),     // 小时补零
        String(now.getMinutes()).padStart(2, '0'),   // 分钟补零
        String(now.getSeconds()).padStart(2, '0')    // 秒数补零
      ].join(''); // 输出示例：20250625141324

      const dbDownloadURL = userStore.IPPORT + DBDownloadUrl + userStore.session;
      console.log(dbDownloadURL)
      const a = document.createElement('a');
      a.href = dbDownloadURL;
      a.download = `hprodb-export-${timestamp}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } else {
    clearInterval(timer.value);
    timer.value = null;
    console.log(res.data)
  }
}
const handlePreview = () => {}
const handleRemove = () => {}
const handleExceed = () => {}
const beforeUpload = () => {}
const handleSuccess = (response: any, file: File, fileList: any[]) => {
  console.log('文件上传成功 =>', response);
  if (response.code === 0) {
    ElMessage({
      message: t('System.sys_data_import_success'),
      type: 'success',
      duration: 2000
    })
  } else {
    ElMessage({
      message: t('System.sys_data_import_failed'),
      type: 'error',
      duration: 2000
    })
  }
}

const UploadUrl = computed(() => userStore.IPPORT + DBUploadUrl + userStore.session);
</script>

<template>
  <div class="system-maintenance">
    <div class="reset-plate">
      <div class="title">{{ t('System.sys_restart') }}</div>
      <div class="reset-detail">
        {{ t('System.sys_restart_service') }}
        <el-button class="reset-btn" size="small" @click="resetService">{{ t('System.sys_restart') }}</el-button>
      </div>
    </div>
    <div class="config-export">
      <div class="title">{{ t('System.sys_conf_export') }}</div>
      <div class="export-detail">
        <div class="export-btn">
          <el-button type="primary" size="small" @click="configExport">{{ t('System.sys_export') }}</el-button>
        </div>
      </div>
    </div>
    <div class="sql-export">
      <div class="title">{{ t('System.sys_data_export') }}</div>
      <div class="export-detail">
        <div class="export-row">
          <div class="label">{{ t('System.sys_export_event') }}</div>
          <el-switch class="switch" v-model="isExportEvent" :disabled="isExport">
          </el-switch>
        </div>
        <div class="export-row">
          <div class="label">{{ t('System.sys_export_progress') + ':' }}</div>
          <el-progress :percentage="percentage" :color="customColor"></el-progress>
        </div>
        <div class="export-btn">
          <el-button type="primary" size="small" @click="sqlExport">{{ t('System.sys_export') }}</el-button>
        </div>
      </div>
    </div>
    <div class="sql-import">
      <div class="title">{{ t('System.sys_data_import') }}</div>
      <el-upload class="upload-demo" :action="UploadUrl" :on-preview="handlePreview" :on-remove="handleRemove"
        multiple :limit="1" accept=".db" :on-exceed="handleExceed" :before-upload="beforeUpload"
        :on-success="handleSuccess" :file-list="fileList">
        <el-button size="small" type="primary">{{ t('System.sys_import') }}</el-button>
        <div slot="tip" class="el-upload__tip">{{ tips }}</div>
      </el-upload>
    </div>
  </div>
</template>

<style scoped lang="scss">
.system-maintenance {
  padding: 40px 27px;

  .title {
    // font-weight: bold;
    font-size: 16px;
  }

  .reset-plate {
    .reset-detail {
      width: 420px;
      height: 100px;
      line-height: 100px;
      // text-align: center;
      margin-left: 45px;
      position: relative;
      padding-left: 100px;

      .reset-btn {
        width: 60px;
        height: 26px;
        line-height: 26px;
        background-color: transparent;
        border-radius: 5px;
        position: absolute;
        // left: 50%;
        right: 20px;
        top: 50%;
        transform: translate(0, -50%);
      }
    }
  }

  .sql-export {
    padding: 20px 0;

    .export-detail {
      width: 420px;
      margin-top: 37px;
      margin-left: 45px;

      .export-row {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        width: 100%;
        margin-bottom: 20px;
        position: relative;

        .label {
          width: 200px;
          text-align: right;
          margin-right: 10px;
        }

        .switch {
          position: absolute;
          right: 20px;
        }

        :deep(.el-progress) {
          width: 200px;
        }

        :deep(.el-progress-bar) {
          .el-progress-bar__outer {
            background-color: rgba($color: #fff, $alpha: 0.18) !important;
          }
        }
      }

      .export-btn {
        display: flex;
        justify-content: flex-end;

        .el-button {
          margin-right: 20px;
        }
      }
    }
  }

  .sql-import {
    padding: 20px 0;

    .upload-demo {
      width: 420px;
      margin-top: 37px;
      margin-left: 45px;
      position: relative;

      .el-button {
        position: absolute;
        top: 0;
        right: 20px;
      }

      .el-upload__tip {
        position: absolute;
        right: 20px;
      }

      :deep(.el-upload-list) {
        margin-top: 20px;
      }

      :deep(.el-upload-list__item:hover) {
        background-color: initial !important;
      }
    }
  }

  .config-export {
    .export-detail {
      width: 420px;
      margin-top: 37px;
      margin-left: 45px;
    }

    .export-btn {
      display: flex;
      justify-content: flex-end;

      .el-button {
        margin-right: 20px;
      }
    }
  }
}
</style>