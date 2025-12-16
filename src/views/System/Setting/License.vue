
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/store/user';
import { GetLicenseInfoApi, UpLoadLicUrl } from '@/api/system';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const userStore = useUserStore();

const tableData = ref<any[]>([]);
const total = ref<number>(0);
const pageSize = ref<number>(30);
const currentPage = ref<number>(1);
const fileList = ref<any[]>([]);

const headers = {'Content-Type': 'application/octet-stream'}
const uploadUrl = computed(() => {
  return userStore.IPPORT + UpLoadLicUrl + userStore.session;
})

const GetLicenseInfo = async () => {
  const res = await GetLicenseInfoApi();
  tableData.value = [];
  if (res.status == 200 && res.data.code == 0) {
    console.log('GetLicenseInfo =>', res)
    const info = res.data.result;
    const desiredOrder = [
      'strType',
      'strHostId',
      'strEndTime',
      'nVideoChannel',
      "nVideoClient",
      "bCluster",
      'bDeviceSDK',
      'bDeviceSDKPb',
      "bGB28181",
      "bTranscoding",
      "bPlatform",
      "bAIBasic",
      "bAIAdvance",
      "nAnaMesg",
      "nAnaMiaa",
      "nAnaCral",
      "nAnaLoit",
      "nAnaStve",
      "nAnaVect",
      "nAnaPect",
      "nAnaPpe",
      "nAnaPefa"
    ]
    desiredOrder.forEach(key => {
      if (info.capacity.hasOwnProperty(key)) {
        const element = info.capacity[key];
        const authorizationItems = getLicenseInfokey(key);
        if (!authorizationItems) return;
        const object: any = {
          authorizationItems: authorizationItems,
          AuthorizationValue: (key == "nAIBasic") || (key == "nAIAdvance") ? element > 1 ? true : false : element,
        }

        switch (key) {
          case "nAnaCral":
            object.Used = info.used.nAnalyticsCralUsed;
            break;
          case "nAnaLoit":
            object.Used = info.used.nAnalyticsLoitUsed;
            break;
          case "nAnaMiaa":
            object.Used = info.used.nAnalyticsMiaaUsed;
            break;
          case "nAnaPect":
            object.Used = info.used.nAnalyticsPectUsed;
            break;
          case "nAnaPpe":
            object.Used = info.used.nAnalyticsPpeUsed;
            break;
          case "nAnaStve":
            object.Used = info.used.nAnalyticsStveUsed;
            break;
          case "nAnaVect":
            object.Used = info.used.nAnalyticsVectUsed;
            break;
          case "nVideoChannel":
            object.Used = info.used.nVideoChannelUsed;
            break;
          case "nAnaMesg":
            object.Used = info.used.nAnalyticsMesgUsed;
            break;
          case "nAnaPefa":
            object.Used = info.used.nAnalyticsPefaUsed;
            break;
        }

        tableData.value.push(object)
      }
    })
    console.log(tableData.value)
    total.value = tableData.value.length;
  }
}

const getLicenseInfokey = (key: string) => {
  let name;
  switch (key) {
    case 'strType':
      name = t('License.lic_type');
      break;
      // t('License.')
    case 'strHostId':
      name = t('License.lic_host_id');
      break;
    case 'strEndTime':
      name = t('License.lic_end_time');
      break;
    case 'nVideoChannel':
      name = t('License.lic_channel');
      break;
    case 'nVideoClient':
      name = t('License.lic_video_client')
      break;
    case 'bCluster':
      name = t('License.lic_cluster');
      break;
    case 'bDeviceSDK':
      name = t('License.lic_device_sdk');
      break;
    case 'bDeviceSDKPb':
      name = t('License.lic_device_sdk_pb');
      break;
    case 'bGB28181':
      name = 'GB28181';
      break;
    case 'bTranscoding':
      name = t('License.lic_transcoding');
      break;
    case 'bPlatform':
      name = t('License.lic_plat_form');
      break;
    case "nAIBasic":
      name = t("License.lic_ai_basic");
      break;
    case "nAIAdvance":
      name = t("License.lic_ai_advance");;
      break;
    case "bAIBasic":
      name = t("License.lic_ai_basic");
      break;
    case "bAIAdvance":
      name = t("License.lic_ai_advance");;
      break;
    case "nAnaMiaa":
      name = t("Analytics.ana_rule_miaa");
      break;
    case "nAnaCral":
      name = t("Analytics.ana_rule_cral");
      break;
    case "nAnaLoit":
      name = t("Analytics.ana_rule_loit");
      break;
    case "nAnaStve":
      name = t("Analytics.ana_rule_stve");
      break;
    case "nAnaVect":
      name = t("Analytics.ana_rule_vect");
      break;
    case "nAnaPect":
      name = t("Analytics.ana_rule_pect");
      break;
    case "nAnaPpe":
      name = t("Analytics.ana_rule_ppe");
      break;
    case "nAnaMesg":
      name = t("Analytics.ana_rule_mesg");
      break;
    case "nAnaPefa":
      name = t("Analytics.ana_rule_pefa");
      break;
    default:
      name = key;
      break;
  }
  return name;
}

const beforeUpload = (file: any) => {
  const allowedExtensions = ['.lic']
  const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const isValidType = allowedExtensions.includes(fileExtension);
  if (!isValidType) {
    ElMessage({
      message: t('System.sys_upgrade_lic'),
      type: 'error',
      duration: 2000
    })
    return false;
  }
  return true;
}
const handleSuccess = (response: any, file: any, fileList: any) => {
  // console.log('版本文件成功 =>', response);
  if (response.code === 'HPRO_CODE_OK') {
    ElMessage({
      message: t('System.sys_file_import_success'),
      type: 'success',
      duration: 2000
    })
  } else {
    ElMessage({
      message: 'Upload Failed',
      type: 'error',
      duration: 2000
    })
    console.log(file, fileList)
    fileList.pop();
  }
}
const beforeRemove = (file: any) => {

}

const copylink = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    ElMessage({
      message: t('System.sys_copysuccessful'),
      type: 'success',
      duration: 1500
    })
  } catch(err) {
    console.error('复制失败:', err);
    // 兼容旧浏览器（使用 execCommand）
    const input = document.createElement('input');
    input.value = value;
    document.body.appendChild(input);
    input.select();
    const result = document.execCommand('copy');
    document.body.removeChild(input);
    if (result) {
      ElMessage({
        message: t('System.sys_copysuccessful'),
        type: 'success',
        duration: 1500
      });
    }
    
  }
}
onMounted(() => {
  GetLicenseInfo()
})
</script>

<template>
  <div class="license">
    <div class="upload-license">
      <!-- <el-button class="normal">导入授权</el-button> -->
      <el-upload
        class="upload-demo"
        :action="uploadUrl"
        multiple
        :limit="1"
        accept=".lic"
        :file-list="fileList"
        :before-upload="beforeUpload"
        :on-success="handleSuccess"
        :before-remove="beforeRemove"
        :headers="headers"
      >
        <el-button type="primary">{{ t('System.sys_upload_license') }}</el-button>
      </el-upload>
    </div>
    <el-table :data="tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)" stripe>
      <el-table-column prop="authorizationItems" :label="t('System.sys_authorized_item')" align="center"></el-table-column>
      <el-table-column prop="AuthorizationValue" :label="t('System.sys_authorized_value')" align="center">
        <template #default="{ row }">
          <el-switch v-if="typeof (row.AuthorizationValue) == 'boolean'" v-model="row.AuthorizationValue" disabled></el-switch>
          <span v-else>{{ row.AuthorizationValue }}</span>
          <i v-if="row.authorizationItems == t('License.lic_host_id')" class="iconfont icon-fuzhi" @click="copylink(row.AuthorizationValue)" style="margin-left: 20px; font-size: 16px; cursor: pointer;"></i>
        </template>
      </el-table-column>
      <el-table-column prop="Used" :label="t('System.sys_used')" align="center"></el-table-column>
    </el-table>
    <div class="pagination-box">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 30, 50, 100]"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      ></el-pagination>
    </div>
  </div>
</template>

<style scoped lang="scss">
.license {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  .upload-license {
    width: 300px;
  }
  :deep(.el-table) {
    flex: 1;
    .el-table__body-wrapper {
      background-color: #181818;
    }
  }
  // .pagination-box {
  //   padding: 10px;
  // }
}
</style>