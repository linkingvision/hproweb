<template>
  <div id="rules_config">
    <RuleEventForm
      v-if="mode !== 'list'"
      :mode="mode"
      :initial-rule="editRule"
      :time-template-list="timeTemplateList"
      :config-list="configList"
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
            <el-table-column prop="ruleEventName" :label="t('CommTable.comm_table_name')" width="160" />
            <el-table-column :label="t('CommTableEdit.comm_operational')" width="120" align="center">
              <template #default="scope">
                <el-button @click="openEdit(scope.row)" link size="small">{{ t('CommTableEdit.comm_edit') }}</el-button>
              </template>
            </el-table-column>
            <el-table-column :label="t('CommTableEdit.comm_particulars')" width="110" align="center">
              <template #header>
                <span>{{ t('CommTableEdit.comm_particulars') }}<i class="iconfont icon-xiangqing" style="margin-left:6px;"></i></span>
              </template>
              <template #default="scope">
                <el-button class="particulars" :class="{ active: activeRuleUuid === rowKey(scope.row) }" @click="selectDetail(scope.row)" link size="small">
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

        <div class="InferServerStatus_Right">
          <div class="title">{{ t('CommTableEdit.comm_particulars') }}</div>
          <div class="detail-grid">
            <div class="grid-row">
              <el-form :inline="false" :model="viewDetail" class="detail-form">
                <el-form-item :label="t('CommTable.comm_table_name')" label-width="150px">
                  <el-input v-model="viewDetail.ruleEventName" disabled />
                </el-form-item>
                <el-form-item :label="t('RulesAndEvent.rule_time_template')" label-width="150px">
                  <el-input v-model="viewDetail.timeTemplateName" disabled />
                </el-form-item>
              </el-form>
              <el-form :inline="false" :model="viewDetail" class="detail-form">
                <el-form-item :label="t('RulesAndEvent.rule_operation_type')" label-width="150px">
                  <el-input v-model="viewDetail.actionTypeName" disabled />
                </el-form-item>
                <el-form-item :label="t('RulesAndEvent.rule_config_list')" label-width="150px">
                  <el-input v-model="viewDetail.configName" disabled />
                </el-form-item>
              </el-form>
            </div>

            <div class="grid-row">
              <el-form :inline="false" :model="viewDetail" class="detail-form">
                <el-form-item :label="t('CommTable.comm_table_type')" label-width="150px">
                  <div class="tow_node">
                    <div class="Root_node Root_node1 left">
                      <div v-if="viewDetail.systemEventType?.length">
                        <p class="detail-event-title">{{ t('RulesAndEvent.rule_system_event_type') }}</p>
                        <div class="event-detail-text">
                          <span v-for="item in viewDetail.systemEventType" :key="item.value">{{ item.label }};&emsp;</span>
                        </div>
                      </div>
                      <div v-if="viewDetail.analyseEventType?.length">
                        <p class="detail-event-title">{{ t('RulesAndEvent.rule_ana_event_type') }}</p>
                        <div class="event-detail-text">
                          <span v-for="item in viewDetail.analyseEventType" :key="item.value">{{ item.label }};&emsp;</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-form-item>
              </el-form>
              <el-form :inline="false" :model="viewDetail" class="detail-form">
                <el-form-item :label="t('SystemInfo.system_channel')" label-width="150px">
                  <div class="tow_node">
                    <div class="Root_node Root_node1 right">
                      <span class="span-slide" v-if="detail" v-for="item in viewDetail.channels" :key="item.uuid">
                        <i class="iconfont icon-shexiangji-zaixian"></i>
                        <span>{{ item.name || item.label }};&emsp;</span>
                      </span>
                    </div>
                  </div>
                </el-form-item>
              </el-form>
            </div>

            <div class="grid-row">
              <el-form :inline="false" :model="viewDetail" class="detail-form">
                <el-form-item :label="t('Common.comm_enable')" label-width="150px">
                  <el-switch v-model="viewDetail.enabled" disabled />
                </el-form-item>
              </el-form>
              <el-form :inline="false" :model="viewDetail" class="detail-form">
                <el-form-item :label="t('RulesAndEvent.rule_description')" label-width="150px">
                  <el-input type="textarea" disabled v-model="viewDetail.description" />
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import RuleEventForm from './Components/RuleEventForm.vue'
import { GetChannelsByUuidApi, GetTimeTemplateListApi } from '@/api/configuration/alarmConfig'
import {
  DeleteRuleEventApi,
  GetNotificationConfListApi,
  GetRuleEventListApi,
  NOTIFICATION_EMAIL,
  NOTIFICATION_HTTP,
  NOTIFICATION_MQTT,
  normalizeNotificationType,
  type NotificationConf,
  type RuleEventRow,
} from '@/api/configuration/rulesAndEvent'
import {
  formatTimeTemplateName,
  getAnalyticsEventOptions,
  getSystemEventOptions,
  type AlarmEventOption,
  type TimeTemplateOption,
} from '../alarmConfigOptions'

interface RuleEventDetail extends RuleEventRow {
  timeTemplateName: string
  actionTypeName: string
  configName: string
  systemEventType: AlarmEventOption[]
  analyseEventType: AlarmEventOption[]
  channels: { name: string; label?: string; uuid: string; token?: string }[]
}

const { t } = useI18n()
const mode = ref<'list' | 'add' | 'edit'>('list')
const loading = ref(false)
const rules = ref<RuleEventRow[]>([])
const selectedRows = ref<RuleEventRow[]>([])
const editRule = ref<RuleEventRow | null>(null)
const detail = ref<RuleEventDetail | null>(null)
const activeRuleUuid = ref('')
const currentPage = ref(1)
const pageSize = ref(15)
const total = ref(0)
const timeTemplateList = ref<TimeTemplateOption[]>([])
const configList = ref<NotificationConf[]>([])

const pagedRules = computed(() => rules.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
const systemEventOptions = computed(() => getSystemEventOptions(t))
const analyticsEventOptions = computed(() => getAnalyticsEventOptions(t))

const EMPTY_DETAIL: RuleEventDetail = {
  ruleEventId: 0,
  ruleEventName: '',
  description: '',
  enabled: false,
  setting: {
    eventType: [],
    channelUUID: [],
    timeTemplate: '',
    actionType: '',
    Action: { Notification: '' }
  },
  timeTemplateName: '',
  actionTypeName: '',
  configName: '',
  systemEventType: [],
  analyseEventType: [],
  channels: []
}

const viewDetail = computed<RuleEventDetail>(() => detail.value ?? EMPTY_DETAIL)

function responseResult(res: any) {
  return res?.data?.result ?? []
}

function isSuccess(res: any) {
  return res?.data?.code === 0 || res?.data?.msg === 'Success'
}

function rowKey(row: RuleEventRow) {
  return row.uuid || String(row.ruleEventId ?? row.id ?? '')
}

async function loadTimeTemplates() {
  const res: any = await GetTimeTemplateListApi()
  const result = responseResult(res)
  const list = Array.isArray(result?.list) ? result.list : Array.isArray(result) ? result : []
  timeTemplateList.value = list.map((item: any) => ({ id: item.timeTemplateId, name: formatTimeTemplateName(item.timeTemplateName, t), uuid: item.uuid }))
}

async function loadConfigList() {
  const res: any = await GetNotificationConfListApi()
  const result = responseResult(res)
  configList.value = Array.isArray(result?.list) ? result.list : Array.isArray(result) ? result : []
}

function actionTypeName(type: string) {
  const normalized = normalizeNotificationType(type)
  if (normalized === NOTIFICATION_EMAIL) return t('RulesAndEvent.rule_email_notice_config')
  if (normalized === NOTIFICATION_HTTP) return t('RulesAndEvent.rule_http_conf')
  if (normalized === NOTIFICATION_MQTT) return t('RulesAndEvent.rule_mqtt_conf')
  return type
}

async function buildDetail(row: RuleEventRow): Promise<RuleEventDetail> {
  const eventValues = Array.isArray(row.setting?.eventType) ? row.setting.eventType : []
  const systemEventType = systemEventOptions.value.filter(item => eventValues.includes(item.value))
  const analyseEventType = analyticsEventOptions.value.filter(item => eventValues.includes(item.value))
  const uuids = Array.isArray(row.setting?.channelUUID) ? row.setting.channelUUID : []

  let channels: RuleEventDetail['channels'] = []
  if (uuids.length) {
    channels = uuids.map(uuid => ({ name: uuid, label: uuid, uuid }))
    try {
      const res: any = await GetChannelsByUuidApi({ uuids, all: true })
      const result = responseResult(res)
      const list = Array.isArray(result?.list) ? result.list : Array.isArray(result) ? result : []
      if (list.length) {
        const channelMap = new Map<string, RuleEventDetail['channels'][number]>(list.map((item: any) => [item.uuid, {
          name: item.name || item.label || item.uuid,
          label: item.label || item.name || item.uuid,
          uuid: item.uuid,
          token: item.token
        }]))
        channels = uuids.map(uuid => channelMap.get(uuid) ?? { name: uuid, label: uuid, uuid })
      }
    } catch { }
  }

  const notificationUuid = row.setting?.Action?.Notification
  const timeTemplate = timeTemplateList.value.find(item => item.uuid === row.setting?.timeTemplate)
  const notificationConfig = configList.value.find(item => item.uuid === notificationUuid)

  return {
    ...JSON.parse(JSON.stringify(row)),
    timeTemplateName: timeTemplate?.name ?? row.setting?.timeTemplate ?? '',
    actionTypeName: actionTypeName(row.setting?.actionType || ''),
    configName: notificationConfig?.name ?? notificationUuid ?? '',
    systemEventType,
    analyseEventType,
    channels,
  }
}

async function selectDetail(row: RuleEventRow) {
  activeRuleUuid.value = rowKey(row)
  try {
    detail.value = await buildDetail(row)
  } catch {
    detail.value = {
      ...JSON.parse(JSON.stringify(row)),
      timeTemplateName: row.setting?.timeTemplate ?? '',
      actionTypeName: actionTypeName(row.setting?.actionType || ''),
      configName: row.setting?.Action?.Notification ?? '',
      systemEventType: [],
      analyseEventType: [],
      channels: []
    }
  }
}

async function loadRules() {
  const res: any = await GetRuleEventListApi()
  const result = responseResult(res)
  const list = Array.isArray(result?.list) ? result.list : Array.isArray(result) ? result : []
  rules.value = list
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
    await Promise.all([loadTimeTemplates(), loadConfigList()])
    await loadRules()
  } finally {
    loading.value = false
  }
}

function openAddForm() {
  editRule.value = null
  mode.value = 'add'
}

function openEdit(row: RuleEventRow) {
  editRule.value = row
  mode.value = 'edit'
}

async function backToList() {
  mode.value = 'list'
  editRule.value = null
  await loadAll()
}

function onSelect(selection: RuleEventRow[]) {
  selectedRows.value = selection
}

function onSelectAll(selection: RuleEventRow[]) {
  selectedRows.value = selection
}

async function deleteSelected() {
  if (!selectedRows.value.length) {
    ElMessage({ message: t('Common.comm_please_select'), type: 'warning', duration: 3000 })
    return
  }
  const ids = selectedRows.value.map(item => item.ruleEventId ?? item.id).filter((id): id is number => typeof id === 'number')
  if (!ids.length) {
    ElMessage({ message: t('Common.comm_please_select'), type: 'warning', duration: 3000 })
    return
  }
  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
      confirmButtonText: t('CommTableEdit.comm_ok'),
      cancelButtonText: t('CommTableEdit.comm_cancel')
    })
    const res: any = await DeleteRuleEventApi({ ids })
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

    .form_butt {
      background-color: var(--el-color-primary);
    }

    .form_butt1 {
      border: 1px solid var(--el-color-primary);
      color: var(--el-color-primary);
      background: transparent;
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
        background-color: var(--rules-detail-btn-bg, rgba(141, 189, 255, 0.3));
        border-radius: 50%;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--rules-detail-btn-color, #fff);
        &.active {
          background-color: var(--rules-detail-btn-active-bg, #0399fe);
          color: #fff;
        }
      }
    }

    .InferServerStatus_Right {
      width: calc(100% - 410px);
      height: 100%;
      margin-left: 20px;
      font-size: 14px;
      overflow: auto;
      background-color: var(--rules-right-bg, transparent);

      .title {
        width: 100%;
        height: 48px;
        line-height: 48px;
        padding-left: 20px;
        background-color: var(--rules-title-bg, #2a2a2a);
        color: var(--rules-title-color, inherit);
        font-weight: 600;
      }

      .detail-grid {
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .grid-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        align-items: stretch;

        > .detail-form {
          display: flex;
          flex-direction: column;

          .el-form-item {
            flex: 1;

            .el-form-item__content {
              flex: 1;
              display: flex;
              flex-direction: column;
            }
          }
        }
      }

      .detail-form {
        width: 100%;
        margin: 0;

        :deep(.el-form-item) {
          margin-right: 0;
          margin-bottom: 18px;
        }

        :deep(.el-form-item:last-child) {
          margin-bottom: 0;
        }

        :deep(.el-form-item__content) {
          width: calc(100% - 150px);
        }

        :deep(.el-input__wrapper) {
          width: 100%;
        }

        :deep(.el-input.is-disabled .el-input__wrapper) {
          background-color: var(--rules-input-bg, transparent) !important;
        }

        :deep(.el-input.is-disabled .el-input__inner) {
          -webkit-text-fill-color: var(--rules-text-color, inherit) !important;
          color: var(--rules-text-color, inherit) !important;
        }

        :deep(.el-textarea) {
          width: 100%;
          .el-textarea__inner {
            min-height: 64px;
            resize: vertical;
          }
          &.is-disabled .el-textarea__inner {
            background-color: var(--rules-textarea-bg, transparent) !important;
            color: var(--rules-text-color, inherit) !important;
            -webkit-text-fill-color: var(--rules-text-color, inherit) !important;
            opacity: 1;
          }
        }
      }

      :deep(.el-input) { width: 100%; }
      :deep(.el-input.is-disabled) { opacity: 1; }

      .tow_node {
        width: 100%;
        flex: 1;
        display: flex;
        flex-direction: column;

        .Root_node {
          width: 100%;
          flex: 1;
          min-height: 300px;
          overflow: auto;
          border: 1px solid var(--rules-root-border, rgba(218, 218, 218, 0.2));
          border-radius: 4px;
          background-color: var(--rules-root-bg, #1b1b1b);
          color: var(--rules-text-color, inherit);
          line-height: 22px;
          box-sizing: border-box;
        }
        .left { padding: 20px 11px; }
        .right { padding: 10px; }

        .detail-event-title {
          font-weight: 600;
          margin: 0;
          padding-left: 10px;
          line-height: 1.4;
        }

        .event-detail-text { padding: 10px 20px; line-height: 18px; margin-bottom: 10px; }
        .span-slide { display: inline-block; white-space: nowrap; line-height: 24px; }
      }
    }
  }

  .pagination { margin-top: 20px; }
}
</style>