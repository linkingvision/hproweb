<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AlarmEventItem } from '@/api/alarmEvent'
import type { AlarmLevelOption } from '@/utils/alarmOptions'
import {
  formatAlarmLevel,
  formatAlarmState,
  formatModuleType,
  getAlarmLevelColor
} from '@/utils/alarmOptions'

const props = withDefaults(defineProps<{
  data: AlarmEventItem[]
  alarmLevels: AlarmLevelOption[]
  height?: string | number
  showUuid?: boolean
  showChannelToken?: boolean
  showOperation?: boolean
  showIndex?: boolean
  showStatus?: boolean
  compact?: boolean
  currentUuid?: string
}>(), {
  data: () => [],
  alarmLevels: () => [],
  height: '100%',
  showUuid: true,
  showChannelToken: true,
  showOperation: true,
  showIndex: true,
  showStatus: true,
  compact: false,
  currentUuid: ''
})

const emit = defineEmits<{
  operate: [row: AlarmEventItem]
  rowClick: [row: AlarmEventItem]
}>()

const { t } = useI18n()

const tableHeight = computed(() => props.height)

const alarmLevelStyle = (row: AlarmEventItem) => {
  const color = getAlarmLevelColor(row.alarmLevel, props.alarmLevels)
  return color ? { backgroundColor: color } : {}
}

const getImageSource = (row: AlarmEventItem) => {
  if (!row.strImg) return ''
  return row.strImg.startsWith('data:image') ? row.strImg : `data:image/jpeg;base64,${row.strImg}`
}

const handleRowClick = (row: AlarmEventItem) => {
  emit('rowClick', row)
}

const handleImageClick = (row: AlarmEventItem) => {
  emit('rowClick', row)
}

const rowClassName = ({ row }: { row: AlarmEventItem }) => {
  return props.currentUuid && row.uuid === props.currentUuid ? 'alarm-current-row' : ''
}
</script>

<template>
  <el-table
    :data="props.data"
    :height="tableHeight"
    style="width: 100%"
    :empty-text="t('CommTable.comm_no_data_available')"
    :row-class-name="rowClassName"
    size="small"
    @row-click="handleRowClick">
    <el-table-column
      v-if="props.showIndex"
      type="index"
      :label="t('CommTable.comm_table_serial_number')"
      width="120"
      align="center"
      class-name="serial-number-column" />
    <el-table-column :label="t('AlarmConfig.ala_time')" prop="strTime" width="200">
      <template #default="{ row }">
        <span>{{ row.strTime || row.time || '' }}</span>
      </template>
    </el-table-column>
    <el-table-column :label="t('AlarmConfig.ala_level')" prop="alarmLevel" width="120">
      <template #default="{ row }">
        <span v-if="row.alarmLevel !== undefined && row.alarmLevel !== null" class="level-span" :style="alarmLevelStyle(row)">
          {{ formatAlarmLevel(row.alarmLevel, props.alarmLevels) }}
        </span>
      </template>
    </el-table-column>
    <el-table-column :label="t('RulesAndEvent.rule_event_type')" prop="moduleType" width="180">
      <template #default="{ row }">
        <span>{{ formatModuleType(row.moduleType, t) }}</span>
      </template>
    </el-table-column>
    <el-table-column :label="t('Analytics.ana_channel_name')" prop="channelName" width="160" />
    <el-table-column v-if="props.showStatus" :label="t('Configuration.conf_iscsi_status')" prop="stateName" width="100">
      <template #default="{ row }">
        <span>{{ formatAlarmState(row.stateName || row.stateLevel, t) }}</span>
      </template>
    </el-table-column>
    <el-table-column v-if="props.showUuid" :label="t('AlarmConfig.ala_event_id')" prop="uuid" show-overflow-tooltip />
    <el-table-column v-if="props.showChannelToken" :label="t('AlarmConfig.ala_channel_id')" prop="channelToken" show-overflow-tooltip />
    <el-table-column :label="t('Common.comm_picture')" width="100" align="center">
      <template #default="{ row }">
        <el-popover v-if="row.strImg" placement="right" trigger="hover" width="auto">
          <img class="popover-image" :src="getImageSource(row)" alt="" />
          <template #reference>
            <div class="image-preview" @click.stop="handleImageClick(row)">
              <img :src="getImageSource(row)" alt="" />
            </div>
          </template>
        </el-popover>
      </template>
    </el-table-column>
    <el-table-column v-if="props.showOperation" :label="t('CommTableEdit.comm_operational')" width="120" align="center">
      <template #default="{ row }">
        <span class="span-button" @click.stop="emit('operate', row)">{{ t('CommTableEdit.comm_operational') }}</span>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped lang="scss">
.level-span {
  display: block;
  width: 80px;
  height: 20px;
  line-height: 20px;
  border-radius: 2px;
  text-align: center;
}

.image-preview {
  display: inline-flex;
  width: 28px;
  height: 24px;
  margin: 0 auto;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  border-radius: 2px;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.popover-image {
  max-width: 420px;
  max-height: 33vh;
  object-fit: contain;
}

.span-button {
  color: #0399FE;
  cursor: pointer;
}

:deep(.el-table__cell) {
  font-size: 12px;
}

:deep(.el-table__header .cell) {
  font-size: 12px;
}

:deep(.el-table__inner-wrapper::before) {
  display: none;
}

:deep(.alarm-current-row .el-table__cell) {
  background-color: rgba(64, 145, 255, 0.2) !important;
}
</style>
