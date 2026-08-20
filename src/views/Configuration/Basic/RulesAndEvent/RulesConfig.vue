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
            <el-table-column prop="ruleEventName" :label="t('CommTable.comm_table_name')" width="150" />
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

        <div class="InferServerStatus_Right" :class="{ 'empty-detail': !detail }">
          <div class="title">{{ t('CommTableEdit.comm_particulars') }}</div>
          <template v-if="detail">
          <el-form :inline="true" :model="detail" class="detail-form">
            <el-form-item :label="t('CommTable.comm_table_name')" label-width="150px">
              <el-input v-model="detail.ruleEventName" disabled />
            </el-form-item>
            <el-form-item :label="t('RulesAndEvent.rule_time_template')" label-width="150px">
              <el-input v-model="detail.timeTemplateName" disabled />
            </el-form-item>
            <el-form-item :label="t('RulesAndEvent.rule_operation_type')" label-width="150px">
              <el-input v-model="detail.actionTypeName" disabled />
            </el-form-item>
            <el-form-item :label="t('RulesAndEvent.rule_config_list')" label-width="150px">
              <el-input v-model="detail.configName" disabled />
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
            <el-form-item :label="t('Common.comm_enable')">
              <el-switch v-model="detail.enabled" disabled />
            </el-form-item>
            <el-form-item :label="t('RulesAndEvent.rule_description')" class="description">
              <el-input type="textarea" disabled v-model="detail.description" />
            </el-form-item>
          </el-form>
          </template>
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

function responseResult(res: any) {
  const result = res?.data?.result ?? res?.result ?? []
  return Array.isArray(result?.list) ? result.list : result
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
  timeTemplateList.value = Array.isArray(result) ? result.map((item: any) => ({ id: item.timeTemplateId, name: formatTimeTemplateName(item.timeTemplateName, t), uuid: item.uuid })) : []
}

async function loadConfigList() {
  const res: any = await GetNotificationConfListApi()
  const result = responseResult(res)
  configList.value = Array.isArray(result) ? result : []
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
      if (Array.isArray(result)) {
        const channelMap = new Map(result.map((item: any) => [item.uuid, {
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
  return {
    ...JSON.parse(JSON.stringify(row)),
    timeTemplateName: timeTemplateList.value.find(item => item.uuid === row.setting?.timeTemplate)?.name ?? row.setting?.timeTemplate ?? '',
    actionTypeName: actionTypeName(row.setting?.actionType || ''),
    configName: configList.value.find(item => item.uuid === notificationUuid)?.name ?? notificationUuid ?? '',
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
  rules.value = Array.isArray(result) ? result : []
  total.value = rules.value.length
  selectedRows.value = []
  if (!rules.value.length) {
    detail.value = null
    activeRuleUuid.value = ''
    return
  }
  const maxPage = Math.ceil(total.value / pageSize.value)
  if (currentPage.value > maxPage) currentPage.value = maxPage
  const firstRule = pagedRules.value[0] ?? rules.value[0]
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

async function handleCurrentChange(page: number) {
  currentPage.value = page
  const firstRule = pagedRules.value[0]
  if (firstRule) {
    await selectDetail(firstRule)
  } else {
    detail.value = null
    activeRuleUuid.value = ''
  }
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
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        &.active { background-color: #0399fe; }
      }
    }

    .InferServerStatus_Right {
      width: calc(100% - 410px);
      height: 100%;
      margin-left: 20px;
      font-size: 14px;
      overflow: auto;

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
        :deep(.el-form-item) { margin-right: 30px; }
      }

      :deep(.el-input) { width: 447px; }

      .tow_node {
        min-width: 400px;
        .Root_node {
          width: 447px;
          min-height: 260px;
          height: auto;
          overflow: visible;
          border: 1px solid rgba(218, 218, 218, 0.2);
          border-radius: 4px;
          background-color: #1b1b1b;
          line-height: 22px;
        }
        .left { padding: 20px 11px; }
        .right { padding: 10px; }
        .event-detail-text { padding: 10px 20px; line-height: 18px; margin-bottom: 10px; }
        .span-slide { display: inline-block; white-space: nowrap; line-height: 24px; }
      }

      .bottom-detail {
        display: flex;
        align-items: flex-start;
        flex-wrap: nowrap;
        .description { display: flex; align-items: flex-start; flex: 1; min-width: 420px; }
        :deep(.el-textarea) { width: 447px; }
        :deep(.el-textarea__inner) { min-height: 64px; resize: vertical; }
      }
    }
  }

  .pagination { margin-top: 20px; }
}
</style>
