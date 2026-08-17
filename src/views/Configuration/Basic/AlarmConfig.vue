<template>
  <div id="rules_config">
    <AlarmConfigForm
      v-if="mode !== 'list'"
      :mode="mode"
      :initial-rule="editRule"
      :time-template-list="timeTemplateList"
      :alarm-owner-list="alarmOwnerList"
      :alarm-level-list="alarmLevelList"
      @back="backToList"
      @saved="backToList" />

    <template v-else>
      <div class="devices_topBtn">
        <el-button class="form_butt" @click="openAddForm" type="primary">{{ t('CommTableEdit.comm_add') }}</el-button>
        <el-button class="form_butt1" @click="deleteSelected">{{ t('CommTableEdit.comm_delete') }}</el-button>
      </div>
      <div class="InferServerStatus">
        <div class="InferServerStatus_Left">
          <el-table
            v-loading="loading"
            stripe
            :data="pagedRules"
            height="100%"
            :empty-text="t('CommTable.comm_no_data_available')"
            @select="onSelect"
            @select-all="onSelectAll">
            <el-table-column type="selection" width="40" align="center" />
            <el-table-column prop="alarmRuleName" :label="t('CommTable.comm_table_name')" width="150" />
            <el-table-column :label="t('CommTableEdit.comm_operational')">
              <template #default="scope">
                <el-button @click="openEdit(scope.row)" link size="small">{{ t('CommTableEdit.comm_edit') }}</el-button>
              </template>
            </el-table-column>
            <el-table-column>
              <template #header>
                <span>{{ t('CommTableEdit.comm_particulars') }}<i class="iconfont icon-xiangqing" style="margin-left:10px;"></i></span>
              </template>
              <template #default="scope">
                <el-button class="particulars" :class="{ active: activeRuleUuid === scope.row.uuid }" @click="selectDetail(scope.row)" link size="small">
                  <i class="iconfont icon-xiangqing"></i>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination">
            <el-pagination
              background
              layout="total, prev, pager, next"
              @current-change="handleCurrentChange"
              :current-page="currentPage"
              :page-size="pageSize"
              :total="total" />
          </div>
        </div>

        <div v-if="!detail" class="InferServerStatus_Right empty-detail"></div>
        <div v-else class="InferServerStatus_Right">
          <div class="title">{{ t('CommTableEdit.comm_particulars') }}</div>
          <el-form :inline="true" :model="detail" class="detail-form">
            <el-form-item :label="t('CommTable.comm_table_name')" label-width="150px">
              <el-input v-model="detail.alarmRuleName" disabled></el-input>
            </el-form-item>
            <el-form-item :label="t('RulesAndEvent.rule_time_template')" label-width="150px">
              <el-input v-model="detail.timeTemplateName" disabled></el-input>
            </el-form-item>
            <el-form-item :label="t('AlarmConfig.ala_belong')" label-width="150px">
              <el-input v-model="detail.alarmOwnerName" disabled></el-input>
            </el-form-item>
            <el-form-item :label="t('AlarmConfig.ala_level')" label-width="150px">
              <el-input v-model="detail.alarmLevelName" disabled></el-input>
            </el-form-item>
          </el-form>

          <el-form class="detail-form" :inline="true" label-position="right" :model="detail">
            <el-form-item :label="t('CommTable.comm_table_type')" label-width="150px">
              <div class="tow_node">
                <div class="Root_node Root_node1 left">
                  <div>
                    <p>{{ t('RulesAndEvent.rule_system_event_type') }}</p>
                    <div class="event-detail-text">
                      <span v-for="item in detail.systemEventType" :key="item.value">{{ item.label }};&emsp;</span>
                    </div>
                  </div>
                  <div>
                    <p>{{ t('RulesAndEvent.rule_ana_event_type') }}</p>
                    <div class="event-detail-text">
                      <span v-for="item in detail.analyseEventType" :key="item.value">{{ item.label }};&emsp;</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-form-item>
            <el-form-item :label="t('SystemInfo.system_channel')" label-width="150px">
              <div class="tow_node">
                <div class="Root_node Root_node1 right">
                  <span class="span-slide" v-for="item in detail.channels" :key="item.uuid">
                    <i class="iconfont icon-shexiangji-zaixian"></i>
                    <span>{{ item.name || item.label }};&emsp;</span>
                  </span>
                </div>
              </div>
            </el-form-item>
          </el-form>

          <el-form class="detail-form bottom-detail" label-position="right" :inline="true" :model="detail">
            <el-form-item :label="t('AlarmConfig.ala_coercive_popup')" label-width="180px">
              <el-switch v-model="detail.popup" disabled></el-switch>
            </el-form-item>
            <el-form-item :label="t('Common.comm_enable')">
              <el-switch v-model="detail.enabled" disabled></el-switch>
            </el-form-item>
            <el-form-item :label="t('RulesAndEvent.rule_description')" class="description">
              <el-input type="textarea" disabled v-model="detail.description"></el-input>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import AlarmConfigForm from './Components/AlarmConfigForm.vue'
import {
  DeleteAlarmRuleApi,
  GetAlarmLevelListApi,
  GetAlarmOwnerListApi,
  GetAlarmRuleListApi,
  GetChannelsByUuidApi,
  GetTimeTemplateListApi,
  type AlarmRule
} from '@/api/configuration/alarmConfig'
import {
  formatTimeTemplateName,
  getAnalyticsEventOptions,
  getSystemEventOptions,
  type AlarmEventOption,
  type AlarmLevelOption,
  type AlarmOwnerOption,
  type TimeTemplateOption
} from './alarmConfigOptions'

interface AlarmDetail extends AlarmRule {
  timeTemplateName: string
  alarmOwnerName: string
  alarmLevelName: string
  systemEventType: AlarmEventOption[]
  analyseEventType: AlarmEventOption[]
  channels: { name: string; label?: string; uuid: string; token?: string }[]
}

const { t } = useI18n()

const mode = ref<'list' | 'add' | 'edit'>('list')
const loading = ref(false)
const rules = ref<AlarmRule[]>([])
const selectedRows = ref<AlarmRule[]>([])
const editRule = ref<AlarmRule | null>(null)
const detail = ref<AlarmDetail | null>(null)
const activeRuleUuid = ref('')
const currentPage = ref(1)
const pageSize = ref(15)
const total = ref(0)
const timeTemplateList = ref<TimeTemplateOption[]>([])
const alarmOwnerList = ref<AlarmOwnerOption[]>([])
const alarmLevelList = ref<AlarmLevelOption[]>([])

const pagedRules = computed(() => rules.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
const systemEventOptions = computed(() => getSystemEventOptions(t))
const analyticsEventOptions = computed(() => getAnalyticsEventOptions(t))

function responseResult(res: any) {
  return res?.data?.result ?? []
}

function isSuccess(res: any) {
  return res?.data?.code === 0 || res?.data?.msg === 'Success'
}

async function loadAlarmOwners() {
  const res: any = await GetAlarmOwnerListApi()
  const result = responseResult(res)
  alarmOwnerList.value = Array.isArray(result?.list) ? result.list : Array.isArray(result) ? result : []
}

async function loadTimeTemplates() {
  const res: any = await GetTimeTemplateListApi()
  const result = responseResult(res)
  timeTemplateList.value = Array.isArray(result) ? result.map((item: any) => ({
    id: item.timeTemplateId,
    name: formatTimeTemplateName(item.timeTemplateName, t),
    uuid: item.uuid
  })) : []
}

async function loadAlarmLevels() {
  const res: any = await GetAlarmLevelListApi()
  const result = responseResult(res)
  alarmLevelList.value = Array.isArray(result) ? result : []
}

async function buildDetail(row: AlarmRule): Promise<AlarmDetail> {
  const eventValues = Array.isArray(row.triggerEventType) ? row.triggerEventType : []
  const systemEventType = systemEventOptions.value.filter(item => eventValues.includes(item.value))
  const analyseEventType = analyticsEventOptions.value.filter(item => eventValues.includes(item.value))
  const uuids = Array.isArray(row.channelUUID) ? row.channelUUID : []
  let channels: AlarmDetail['channels'] = []
  if (uuids.length) {
    const res: any = await GetChannelsByUuidApi({ uuids, all: true })
    const result = responseResult(res)
    channels = Array.isArray(result) ? result.map((item: any) => ({
      name: item.name,
      label: item.name,
      uuid: item.uuid,
      token: item.token
    })) : []
  }

  return {
    ...JSON.parse(JSON.stringify(row)),
    timeTemplateName: timeTemplateList.value.find(item => item.uuid === row.timeTemplate)?.name ?? row.timeTemplate,
    alarmOwnerName: alarmOwnerList.value.find(item => item.uuid === row.alarmOwner)?.username ?? row.alarmOwner,
    alarmLevelName: alarmLevelList.value.find(item => item.code === row.alarmLevel)?.level ?? String(row.alarmLevel ?? ''),
    systemEventType,
    analyseEventType,
    channels
  }
}

async function selectDetail(row: AlarmRule) {
  activeRuleUuid.value = row.uuid ?? String(row.alarmRuleId ?? '')
  detail.value = await buildDetail(row)
}

async function loadRules() {
  const res: any = await GetAlarmRuleListApi()
  const result = responseResult(res)
  rules.value = Array.isArray(result) ? result : []
  total.value = rules.value.length
  selectedRows.value = []
  if (!rules.value.length) {
    detail.value = null
    activeRuleUuid.value = ''
    return
  }
  if (currentPage.value > Math.ceil(total.value / pageSize.value)) currentPage.value = 1
  const firstRule = rules.value[0]
  if (firstRule) await selectDetail(firstRule)
}

async function loadAll() {
  loading.value = true
  try {
    await Promise.all([loadAlarmOwners(), loadTimeTemplates(), loadAlarmLevels()])
    await loadRules()
  } finally {
    loading.value = false
  }
}

function openAddForm() {
  editRule.value = null
  mode.value = 'add'
}

function openEdit(row: AlarmRule) {
  editRule.value = row
  mode.value = 'edit'
}

async function backToList() {
  mode.value = 'list'
  editRule.value = null
  await loadAll()
}

function onSelect(selection: AlarmRule[]) {
  selectedRows.value = selection
}

function onSelectAll(selection: AlarmRule[]) {
  selectedRows.value = selection
}

async function deleteSelected() {
  if (!selectedRows.value.length) {
    ElMessage({ message: t('Common.comm_please_select'), type: 'warning', duration: 3000 })
    return
  }

  const ids = selectedRows.value
    .map(item => item.alarmRuleId)
    .filter((id): id is number => typeof id === 'number')

  if (!ids.length) {
    ElMessage({ message: t('Common.comm_please_select'), type: 'warning', duration: 3000 })
    return
  }

  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
      confirmButtonText: t('CommTableEdit.comm_ok'),
      cancelButtonText: t('CommTableEdit.comm_cancel')
    })
    const res: any = await DeleteAlarmRuleApi({ ids })
    if (isSuccess(res)) {
      ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success', duration: 5000 })
      await loadRules()
    } else {
      ElMessage({ message: t('CommTableEdit.comm_delete_failed'), type: 'error', duration: 5000 })
    }
  } catch { }
}

function handleCurrentChange(page: number) {
  currentPage.value = page
}

onMounted(loadAll)
</script>

<style lang="scss" scoped>
#rules_config {
  width: 100%;
  height: calc(100% - 54px);

  .devices_topBtn {
    height: 54px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;

    :deep(.el-button) {
      min-width: 86px;
      flex-shrink: 0;
    }
  }

  .InferServerStatus {
    display: flex;
    width: 100%;
    height: calc(100% - 54px);
    overflow: hidden;

    .InferServerStatus_Left {
      width: 390px;
      min-width: 390px;
      height: 100%;

      .particulars {
        width: 24px;
        height: 24px;
        background-color: rgba(141, 189, 255, 0.3);
        border-radius: 50%;
        padding: 0;
        line-height: 24px;
        min-height: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;

        :deep(.el-icon) {
          display: none;
        }

        i {
          display: inline-block;
          color: #ffffff;
          font-size: 14px;
          line-height: 1;
        }

        &.active {
          background-color: #0399fe;
        }
      }
    }

    .InferServerStatus_Right {
      width: calc(100% - 410px);
      height: 100%;
      margin-left: 20px;
      font-size: 14px;

      &.empty-detail {
        background: transparent;
      }

      .title {
        width: 100%;
        height: 48px;
        line-height: 48px;
        padding-left: 20px;
        background-color: #2a2a2a;
      }

      .detail-form {
        width: 100%;
        margin: 24px 0 0 24px;

        :deep(.el-form-item) {
          margin-right: 30px;
        }
      }

      :deep(.el-input) {
        width: 447px;
      }

      .tow_node {
        min-width: 400px;

        .Root_node {
          width: 447px;
          min-height: 392px;
          height: auto;
          overflow: visible;
          border: 1px solid rgba(218, 218, 218, 0.2);
          border-radius: 4px;
          background-color: #1b1b1b;
          line-height: 22px;
        }

        .left {
          padding: 20px 11px;

          p {
            opacity: 0.7;
            line-height: 14px;
          }

          span {
            display: inline-block;
            white-space: nowrap;
            font-family: MicrosoftYaHei, MicrosoftYaHei;
            font-weight: bold;
          }
        }

        .right {
          padding: 10px;
        }

        .event-detail-text {
          padding: 10px 20px;
          line-height: 18px;
          margin-bottom: 10px;
        }

        .span-slide {
          display: inline-block;
          white-space: nowrap;
          line-height: 24px;

          .icon-shexiangji-zaixian {
            opacity: 0.4;
            color: inherit;
          }

          span {
            font-family: MicrosoftYaHei, MicrosoftYaHei;
            font-weight: bold;
          }
        }
      }

      .bottom-detail {
        display: flex;
        align-items: flex-start;
        flex-wrap: nowrap;

        :deep(.el-form-item) {
          margin-right: 30px;
        }

        .description {
          display: flex;
          align-items: flex-start;
          flex: 1;
          min-width: 420px;
        }

        :deep(.description .el-form-item__content) {
          flex: 1;
        }

        :deep(.el-textarea) {
          width: 447px;
        }

        :deep(.el-textarea__inner) {
          min-height: 32px !important;
          height: 64px;
          resize: vertical;
          background-color: inherit !important;
        }
      }
    }
  }

  .pagination {
    margin-top: 20px;
  }
}
</style>
