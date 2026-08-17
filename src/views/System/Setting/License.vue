<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/store/user';
import {
  GetLicenseInfoApi,
  UpLoadLicUrl,
  ReqFreePersonalProvisionApi,
  GetReqProvisionStatusApi
} from '@/api/system';
import { ElMessage, ElMessageBox } from 'element-plus';
import { WarningFilled } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const userStore = useUserStore();

interface LicenseTableRow {
  authorizationItems: string
  AuthorizationValue: string | number | boolean
  Used?: string | number
}

type LicenseKey =
  | 'strType'
  | 'strHostId'
  | 'strEndTime'
  | 'nVideoChannel'
  | 'nVideoClient'
  | 'bCluster'
  | 'bDeviceSDK'
  | 'bDeviceSDKPb'
  | 'bGB28181'
  | 'bTranscoding'
  | 'bPlatForm'
  | 'bPlatform'
  | 'bAIBasic'
  | 'bAIAdvance'
  | 'nAnaMesg'
  | 'nAnaMiaa'
  | 'nAnaCral'
  | 'nAnaLoit'
  | 'nAnaStve'
  | 'nAnaVect'
  | 'nAnaPect'
  | 'nAnaPpe'
  | 'nAnaPefa';

const tableData = ref<LicenseTableRow[]>([]);
const total = ref<number>(0);
const pageSize = ref<number>(30);
const currentPage = ref<number>(1);
const fileList = ref<any[]>([]);
const licenseType = ref<string>('');
const provisionStatus = ref<string>('');
const serialNumber = ref<string>('');
const showActiveTip = ref<boolean>(false);
const licenseLoading = ref<boolean>(false);
const provisionLoading = ref<boolean>(false);
const refreshLoading = ref<boolean>(false);

const desiredOrder: LicenseKey[] = [
  'strType',
  'strHostId',
  'strEndTime',
  'nVideoChannel',
  'nVideoClient',
  'bCluster',
  'bDeviceSDK',
  'bDeviceSDKPb',
  'bGB28181',
  'bTranscoding',
  'bPlatForm',
  'bAIBasic',
  'bAIAdvance',
  'nAnaMesg',
  'nAnaMiaa',
  'nAnaCral',
  'nAnaLoit',
  'nAnaStve',
  'nAnaVect',
  'nAnaPect',
  'nAnaPpe',
  'nAnaPefa'
];

const booleanKeys = new Set<LicenseKey>([
  'bCluster',
  'bDeviceSDK',
  'bDeviceSDKPb',
  'bGB28181',
  'bTranscoding',
  'bPlatForm',
  'bPlatform',
  'bAIBasic',
  'bAIAdvance'
]);

const usedKeyMap: Partial<Record<LicenseKey, string>> = {
  nAnaCral: 'nAnalyticsCralUsed',
  nAnaLoit: 'nAnalyticsLoitUsed',
  nAnaMiaa: 'nAnalyticsMiaaUsed',
  nAnaPect: 'nAnalyticsPectUsed',
  nAnaPpe: 'nAnalyticsPpeUsed',
  nAnaStve: 'nAnalyticsStveUsed',
  nAnaVect: 'nAnalyticsVectUsed',
  nVideoChannel: 'nVideoChannelUsed',
  nAnaMesg: 'nAnalyticsMesgUsed',
  nAnaPefa: 'nAnalyticsPefaUsed'
};

const uploadUrl = computed(() => {
  return userStore.IPPORT + UpLoadLicUrl + userStore.session;
});

const dotColor = computed(() => {
  switch (provisionStatus.value) {
    case 'SLP_OP_REQ_STATUS_SUCCESS':
      return 'green';
    case 'SLP_OP_REQ_STATUS_NONE':
      return 'grey';
    case 'SLP_OP_REQ_STATUS_FAILED':
      return 'red';
    case 'SLP_OP_REQ_STATUS_ONGOING':
      return 'blue';
    default:
      return 'grey';
  }
});

const getLicenseInfokey = (key: string) => {
  let name;
  switch (key) {
    case 'strType':
      name = t('License.lic_type');
      break;
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
      name = t('License.lic_video_client');
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
    case 'bPlatForm':
    case 'bPlatform':
      name = t('License.lic_plat_form');
      break;
    case 'nAIBasic':
    case 'bAIBasic':
      name = t('License.lic_ai_basic');
      break;
    case 'nAIAdvance':
    case 'bAIAdvance':
      name = t('License.lic_ai_advance');
      break;
    case 'nAnaMiaa':
      name = t('Analytics.ana_rule_miaa');
      break;
    case 'nAnaCral':
      name = t('Analytics.ana_rule_cral');
      break;
    case 'nAnaLoit':
      name = t('Analytics.ana_rule_loit');
      break;
    case 'nAnaStve':
      name = t('Analytics.ana_rule_stve');
      break;
    case 'nAnaVect':
      name = t('Analytics.ana_rule_vect');
      break;
    case 'nAnaPect':
      name = t('Analytics.ana_rule_pect');
      break;
    case 'nAnaPpe':
      name = t('Analytics.ana_rule_ppe');
      break;
    case 'nAnaMesg':
      name = t('Analytics.ana_rule_mesg');
      break;
    case 'nAnaPefa':
      name = t('Analytics.ana_rule_pefa');
      break;
    default:
      name = key;
      break;
  }
  return name;
};

const GetLicenseInfo = async () => {
  licenseLoading.value = true;
  tableData.value = [];
  try {
    const res = await GetLicenseInfoApi();
    if (res.status == 200 && res.data.code == 0) {
      const info = res.data.result || {};
      const capacity = info.capacity || {};
      const used = info.used || {};
      licenseType.value = capacity.strType || '';

      desiredOrder.forEach(key => {
        let capacityKey = key;
        if (key === 'bPlatForm' && !Object.prototype.hasOwnProperty.call(capacity, key) && Object.prototype.hasOwnProperty.call(capacity, 'bPlatform')) {
          capacityKey = 'bPlatform';
        }
        if (!Object.prototype.hasOwnProperty.call(capacity, capacityKey)) return;

        const element = capacity[capacityKey];
        const authorizationItems = getLicenseInfokey(capacityKey);
        if (!authorizationItems) return;

        const object: LicenseTableRow = {
          authorizationItems,
          AuthorizationValue: booleanKeys.has(capacityKey) ? Boolean(element) : element
        };
        const usedKey = usedKeyMap[capacityKey];
        if (usedKey) {
          object.Used = used[usedKey];
        }
        tableData.value.push(object);
      });
      total.value = tableData.value.length;
      currentPage.value = 1;
    } else {
      total.value = 0;
    }
  } catch (err) {
    total.value = 0;
  } finally {
    licenseLoading.value = false;
  }
};

const getProvisionStatus = async () => {
  const res = await GetReqProvisionStatusApi();
  if (res.status === 200 && res.data.code === 0) {
    const result = res.data.result || {};
    provisionStatus.value = result.status || '';
    serialNumber.value = result.serialNumber || '';
    return result;
  }
  throw new Error('get status failed');
};

const getFreeLicense = async () => {
  if (provisionLoading.value) return;
  provisionLoading.value = true;
  try {
    const res = await ReqFreePersonalProvisionApi();
    if (res.status == 200 && res.data.code === 0) {
      ElMessage({
        message: t('Message.get_provision_success'),
        type: 'success',
        duration: 2000
      });
      showActiveTip.value = true;
      await getProvisionStatus();
    } else {
      ElMessage({
        message: t('Message.get_provision_failed'),
        type: 'error',
        duration: 2000
      });
    }
  } catch (err) {
    ElMessage({
      message: t('Message.get_provision_failed'),
      type: 'error',
      duration: 2000
    });
  } finally {
    provisionLoading.value = false;
  }
};

const freshProvisionStatus = async () => {
  refreshLoading.value = true;
  try {
    await getProvisionStatus();
    ElMessage({
      message: t('Message.fresh_success'),
      type: 'success',
      duration: 2000
    });
  } catch (err) {
    ElMessage({
      message: t('Message.fresh_failed'),
      type: 'error',
      duration: 2000
    });
  } finally {
    refreshLoading.value = false;
  }
};

const beforeUpload = (file: any) => {
  const allowedExtensions = ['.lic'];
  const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const isValidType = allowedExtensions.includes(fileExtension);
  if (!isValidType) {
    ElMessage({
      message: t('System.sys_upgrade_lic'),
      type: 'error',
      duration: 2000
    });
    return false;
  }
  return true;
};

const handleSuccess = async (response: any) => {
  if (response.code === 0) {
    ElMessage({
      message: t('System.sys_file_import_success'),
      type: 'success',
      duration: 2000
    });
    fileList.value = [];
    await GetLicenseInfo();
    getProvisionStatus().catch(() => undefined);
  } else {
    ElMessage({
      message: response?.msg || t('System.sys_version_import_failed'),
      type: 'error',
      duration: 2000
    });
    fileList.value = [];
  }
};

const beforeRemove = (file: any) => {
  return ElMessageBox.confirm(`${t('System.sys_confirm_remove')}${file.name}?`, t('Common.comm_prompt'), {
    type: 'warning'
  }).then(() => true).catch(() => false);
};

const copylink = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    ElMessage({
      message: t('System.sys_copysuccessful'),
      type: 'success',
      duration: 1500
    });
  } catch(err) {
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
};

onMounted(() => {
  GetLicenseInfo();
  getProvisionStatus().catch(() => {
    provisionStatus.value = '';
  });
});
</script>

<template>
  <div class="license">
    <div class="upload-license devices_topBtn">
      <el-upload
        class="upload-demo"
        :action="uploadUrl"
        multiple
        :limit="1"
        accept=".lic"
        v-model:file-list="fileList"
        :before-upload="beforeUpload"
        :on-success="handleSuccess"
        :before-remove="beforeRemove"
      >
        <el-button type="primary" class="form_butt1">{{ t('System.sys_upload_license') }}</el-button>
      </el-upload>
      <el-button type="primary" class="form_butt1" :disabled="provisionLoading" @click="getFreeLicense">
        {{ t('System.get_free_license') }}
      </el-button>
      <div class="provision-dot" :style="{ backgroundColor: dotColor }"></div>
      <el-button type="primary" class="form_butt1" :loading="refreshLoading" @click="freshProvisionStatus">
        {{ t('CommTableEdit.comm_refresh') }}
      </el-button>
      <div v-if="licenseType === 'None' && showActiveTip" class="active-tip">
        <el-icon class="warning-icon"><WarningFilled /></el-icon>
        {{ t('System.active_new_provision') }}
      </div>
    </div>
    <el-table
      v-loading="licenseLoading"
      :data="tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)"
      stripe
      height="100%"
      :empty-text="t('CommTable.comm_no_data_available')"
    >
      <el-table-column width="53"></el-table-column>
      <el-table-column prop="authorizationItems" :label="t('System.sys_authorized_item')"></el-table-column>
      <el-table-column prop="AuthorizationValue" :label="t('System.sys_authorized_value')">
        <template #default="{ row }">
          <el-switch v-if="typeof (row.AuthorizationValue) == 'boolean'" v-model="row.AuthorizationValue" disabled></el-switch>
          <span v-else-if="row.authorizationItems == t('License.lic_host_id')" class="HostId">
            {{ row.AuthorizationValue }}
          </span>
          <span v-else>{{ row.AuthorizationValue }}</span>
          <i
            v-if="row.authorizationItems == t('License.lic_host_id')"
            class="iconfont icon-fuzhi copy-icon"
            @click="copylink(String(row.AuthorizationValue ?? ''))"
          ></i>
        </template>
      </el-table-column>
      <el-table-column prop="Used" :label="t('System.sys_used')"></el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 30, 50, 100]"
        :background="true"
        layout="total, prev, pager, next, sizes, jumper"
        :total="total"
      ></el-pagination>
      <el-button class="GoTo" size="small">{{ t('CommTable.comm_jump') }}</el-button>
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
    height: 54px;
    padding: 10px 25px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    flex-shrink: 0;
    flex-wrap: nowrap;
    margin-bottom: 0;
    text-align: left;

    :deep(.el-upload) {
      display: flex;
      align-items: center;
    }

    :deep(.form_butt1) {
      width: unset;
      min-width: 78px;
      height: 29px;
      padding: 0 12px;
      border-radius: 4px;
      white-space: nowrap;
    }

    :deep(.el-upload-list) {
      margin: 0;
    }
  }

  .provision-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .active-tip {
    display: flex;
    align-items: center;
    margin-left: 15px;
    white-space: nowrap;
  }

  .warning-icon {
    color: #FAAD14;
    margin-right: 4px;
  }

  .HostId {
    width: 76%;

    :deep(.el-input__inner) {
      padding: 0;
    }
  }

  .copy-icon {
    margin-left: 10px;
    font-size: 16px;
    cursor: pointer;
  }

  :deep(.el-table) {
    flex: 1;
    width: 99.5%;
    .el-table__body-wrapper {
      background-color: #181818;
    }
  }

  .pagination {
    height: 50px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-shrink: 0;
    margin-right: 5%;

    .GoTo {
      margin-left: 10px;
      height: 28px;
      font-size: 13px;
      background: transparent;
      border: 1px solid #868686;
      color: #FFFFFF;
    }
  }
}
</style>
