<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useUserStore } from '@/store/user';
import { useStore } from '@/store';
import { useI18n } from 'vue-i18n';
import { GetUpgradeStatusApi, UploadUrl, GetSystemInfo } from '@/api/system';
import { ElMessage } from 'element-plus';

const userStore = useUserStore();
const store = useStore()
const { t } = useI18n()

const currentVersion = ref<string>('')
const loadingShow = ref<boolean>(false);
const loadingTimer = ref<any>(null)
const imgIndex = ref<number>(1)
const upgradeTimer = ref<any>(null)

const GetVersion = async () => {
  const res = await GetSystemInfo();
  if (res.status == 200 && res.data.code == 0) {
    currentVersion.value = res.data.result.version;
    store.setVersion(res.data.result.version)
  }
}

const fileList = ref<any[]>([])

const beforeUpload = (file: File) => {
  // 允许的文件类型
  const allowedExtensions = ['.bin']
  // 获取文件拓展名
  const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  // 检验逻辑
  const isValidType = allowedExtensions.includes(fileExtension);
  if (!isValidType) {
    ElMessage({
      type: 'error',
      message: t('System.sys_file_bin'),
      duration: 2000
    })
    return false;
  }
  return true;
}
const handleSuccess = (response: any, file: File, fileList: any[]) => {
  console.log('版本导入成功! =>', response)
  if (response.code === 0) {
    ElMessage({
      type: 'success',
      message: t('System.sys_version_import_success'),
      duration: 2000
    })
    loadingShow.value = true;
  } else {
    ElMessage({
      type: 'error',
      message: t('System.sys_version_import_failed'),
      duration: 2000
    })
  }
}
const beforeRemove = () => {
  return true;
}

const moveImg = async () => {
  loadingTimer.value = setInterval(() => {
    imgIndex.value = imgIndex.value < 8 ? imgIndex.value + 1 : 1
  }, 500)
  upgradeTimer.value = setInterval(async () => {
    const res = await GetUpgradeStatusApi()
    if (res.status == 200 && res.data.code == 0) {
      clearInterval(upgradeTimer.value);
      upgradeTimer.value = null;
      loadingShow.value = false;
      if (res.data.result.status == 'completed') {
        GetVersion();
        ElMessage({
          message: t('System.sys_upgrade_over'),
          type: 'success',
          duration: 3000
        })
      } else if (res.data.result.status == 'failed') {
        ElMessage({
          message: t('System.sys_upgrade_failed'),
          type: 'error',
          duration: 2000
        })
      }
    }
  }, 5000)
}

watch(loadingShow, (newVal) => {
  if (newVal) {
    moveImg()
  } else {
    clearInterval(loadingTimer.value)
    loadingTimer.value = null;
  }
})
onMounted(() => {
  GetVersion()
})
onBeforeUnmount(() => {
  if (loadingTimer.value) {
    clearInterval(loadingTimer.value);
    loadingTimer.value = null;
  }
  if (upgradeTimer.value) {
    clearInterval(upgradeTimer.value);
    upgradeTimer.value = null;
  }
})
const uploadUrl = computed(() => userStore.IPPORT + UploadUrl + userStore.session)
const imgSrc = computed(() => {
  const file = store.darkMode === 'darkblue'
    ? `0${imgIndex.value}.png`
    : `${imgIndex.value}.png`;

  return new URL(`../imgs/${file}`, import.meta.url).href;
});
</script>

<template>
  <div class="system-upgrade">
    <div class="sys_upgrade">
      <div class="title">{{ t('System.sys_upgrade') }}</div>
      <div class="upgrade-detail">{{ t('System.sys_current_v') + '：' + currentVersion }}</div>
      <div class="import-version">
        <el-upload
          class="upload-demo"
          :action="uploadUrl"
          multiple
          :limit="1"
          accept=".bin"
          v-model:file-list="fileList"
          :before-upload="beforeUpload"
          :on-success="handleSuccess"
          :before-remove="beforeRemove"
        >
          <el-button size="small" type="primary" class="import-btn">{{ t('System.sys_import_v') }}</el-button>
        </el-upload>
      </div>
    </div>
    <div v-if="loadingShow" class="loading">
      <div class="center-loading">
        <img style="width: 40px;height: 40px; display: block;" :src="imgSrc" alt="">
        <div class="loading-title">{{ 'Service.sys_upgrading' }}</div>
        <div class="loading-detail">{{ 'Service.sys_upgrade_time' }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sys_upgrade {
  padding: 42px 27px;
  width: 500px;
  position: relative;
  .title {
    // font-weight: bold;
    font-size: 16px;
  }
  .upgrade-detail {
    margin-top: 20px;
    margin-left: 100px;
    padding-left: 6px;
  }
  .import-version {
    margin-left: 100px;
    margin-top: -10px;
    .upload-demo {
      position: relative;
      padding-bottom: 50px;
      .el-upload {
        margin: 0;
        padding: 0;
      }
      .import-btn {
        position: absolute;
        position: absolute;
        right: 0;
        bottom: 0;
      }
      :deep(.el-upload-list__item) {
        color: #fff;
        .el-icon-document {
          color: #fff;
        }
        .el-icon-close {
          color: #fff;
        }
      }
      :deep(.el-upload-list__item:hover) {
        background-color: initial !important;
      }
    }
  }
}

.loading {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba($color: #fff, $alpha: 0.1);
  .center-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    img {
      margin-bottom: 12px;
    }
    .loading-title {
      color: #0399FE;
      margin-bottom: 12px;
    }
  }
}
</style>