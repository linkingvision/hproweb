<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { GetAnaEventApi } from '@/api/Analytics/setting';
import { formatISOToSlash, formatISOWithOffset } from '@/utils/formatTime'

const { t } = useI18n();

const searchInfo = ref<any>({
  beginTime: null,
  endTime: null,
  channelName: '',
  ruleTypes: []
})
const RuleTypeData = [  
    { label: t('Analytics.ana_rule_ppe'), value: 'USC_ANA_RULE_PPE', icon: 'icon-a-Safetyhat' },
    { label: t('Analytics.ana_rule_miaa'), value: 'USC_ANA_RULE_MIAA', icon: 'icon-quyuruqin' },
    { label: t('Analytics.ana_rule_pefa'), value: 'USC_ANA_RULE_PEFA', icon: 'icon-diedaojiance' },
    { label: t('Analytics.ana_rule_cral'), value: 'USC_ANA_RULE_CRAL', icon: 'icon-banxianjiance' },
    { label: t('Analytics.ana_rule_loit'), value: 'USC_ANA_RULE_LOIT', icon: 'icon-renyuandouliu' },
    { label: t('Analytics.ana_rule_stve'), value: 'USC_ANA_RULE_STVE', icon: 'icon-weifatingche' },
    { label: t('Analytics.ana_face_recognition'), value: 'USC_ANA_RULE_FARE', icon: 'icon-renlianshibie1' },
    { label: t('Analytics.ana_lpre'), value: 'USC_ANA_RULE_LPRE', icon: 'icon-chepaishibie' },
    { label: t('Analytics.ana_rule_crod'), value: 'USC_ANA_RULE_CROD', icon: 'icon-renyuanjishu' },
]
const shapeObj: any = {
    "person": "icon-person",
    "vehicle": "icon-vehicle",
    "motorcycle": "icon-motorcycle",
    "bicycle": "icon-bicycle",
    "car": "icon-car",
    "truck": "icon-truck",
    "bus": "icon-bus",
    "face": "icon-face",
}
const pageIndex = ref<number>(1);
const pageSize = ref<number>(20);
const total = ref<number>(0);
const tableData = ref<any[]>([])

const GetAnaEvent = async () => {
  const params = {
    pageIndex: pageIndex.value,
    pageSize: pageSize.value,
    beginTime: formatISOWithOffset(searchInfo.value.beginTime),
    endTime: formatISOWithOffset(searchInfo.value.endTime),
    channelName: searchInfo.value.channelName,
    ruleTypes: searchInfo.value.ruleTypes
  }
  const res = await GetAnaEventApi(params);
  if (res.status == 200 && res.data.code == 0) {
    tableData.value = res.data.result.list;
    total.value = res.data.result.count;
  }
}
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  pageIndex.value = 1;
  GetAnaEvent()
}
const handleCurrentChange = (val: number) => {
  pageIndex.value = val;
  GetAnaEvent();
}

const reset = () => {
  const now = new Date();
  searchInfo.value.endTime = now;
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  searchInfo.value.beginTime = yesterday;
  searchInfo.value.channelName = '';
  searchInfo.value.ruleTypes = [];
  pageIndex.value = 1;
  pageSize.value = 20;
}

onMounted(() => {
  reset()
})

function getPriorityColor(priority: 'Critical' | 'High' | 'Low' | 'Medium') {
  const priorityLevel = {
    Critical: "#7DDFDF",
    High: "#D83D3D",
    Low: "#00B75B",
    Medium: "#F09C37",
  }
  return priorityLevel[priority]
}
</script>

<template>
  <div class="event-search">
    <!-- {{ t('Analytics.ana_event_search') }} -->
    <div class="search-info">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item :label="t('Common.comm_time_start')">
          <el-date-picker
            v-model="searchInfo.beginTime"
            type="datetime"
            placeholder="Select date and time"
          />
        </el-form-item>
        <el-form-item :label="t('Common.comm_time_end')">
          <el-date-picker
            v-model="searchInfo.endTime"
            type="datetime"
            placeholder="Select date and time"
          />
        </el-form-item>
        <el-form-item :label="t('Common.comm_channel_name')">
          <el-input v-model="searchInfo.channelName" style="width: 240px"/>
        </el-form-item>
        <el-form-item :label="t('Analytics.ana_rule_type')">
          <el-select
            v-model="searchInfo.ruleTypes"
            multiple
            collapse-tags
            placeholder="Select"
            style="width: 240px"
          >
          <el-option v-for="item in RuleTypeData" :key="item.value" :value="item.value" :label="item.label"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button size="small" @click="reset">{{ t('CommTableEdit.comm_reset') }}</el-button>
          <el-button size="small" type="primary" @click="GetAnaEvent">{{ t('CommTableEdit.comm_search') }}</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="tableContainer">
      <el-table :data="tableData" height="760" style="width: 100%;">
        <el-table-column :label="t('CommTableEdit.comm_table_serial_number')" type="index" width="140" align="center"></el-table-column>
        <el-table-column :label="t('Common.comm_channel_name')" prop="channelName" width="140" align="center"></el-table-column>
        <el-table-column :label="t('Analytics.ana_priority')" prop="priority" width="120" align="center">
          <template #default="{ row }">
            <span :style="{ backgroundColor: getPriorityColor(row.priority) }" style="padding: 3px; border-radius: 2px; font-size: 14px;">{{ row.priority }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('Analytics.ana_rule_type')" prop="ruleType" align="center">
          <template #default="{ row }">
            <span>{{ RuleTypeData.find(item => item.value == row.ruleType)?.label }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('Analytics.ana_goal')" prop="targetType" align="center">
          <template #default="{ row }">
            <i class="iconfont" :class="shapeObj[row.targetType]" style="font-size: 16px;"></i>
          </template>
        </el-table-column>
        <el-table-column :label="t('System.sys_time')" align="center">
          <template #default="{ row }">
            <span>{{ formatISOToSlash(row.time) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('Analytics.ana_event')" prop="anaEvent" align="center"></el-table-column>
        <el-table-column :label="t('Common.comm_picture')" align="center">
          <template #default="{ row }">
            <img v-if="row.strJpeg" :src="'data:image/jpeg;base64,' + row.strJpeg" height="30" style="cursor: pointer;">
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="pagination-box">
      <el-pagination
        v-model:current-page="pageIndex"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 30, 50, 100]"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>
  </div>
</template>

<style scoped lang="scss">
.event-search {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .search-info {
    width: 100%;
    // height: ;
    padding: 20px 10px;
    .el-form {
      display: flex;
      justify-content: space-between;
      padding:  0 20px;
      .el-button {
        width: 70px;
        height: 28px;
      }
    }
    .el-form-item {
      margin: 0;
      padding: 0;
      // margin-right: 30px;
    }
  }
  .tableContainer {
    width: 100%;
    flex: 1;
    // background-color: #444;
  }
  .pagination-box {
    width: 100%;
    height: 50px;
    // background-color: #333;
  }
}
</style>