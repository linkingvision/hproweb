<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  GetSystemEventListApi,
  type SystemEventItem
} from '@/api/system'
import { getSystemEventOptions } from '@/utils/alarmOptions'

const { t } = useI18n()

const queryForm = reactive({
  beginTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
  endTime: new Date(),
  name: '',
  moduleType: [] as string[],
  pageSize: 1000
})

const currentPage = ref(1)
const displayPageSize = ref(100)
const loading = ref(false)
const tableData = ref<SystemEventItem[]>([])
const total = ref(0)
const imageDialogVisible = ref(false)
const previewImage = ref('')

const eventOptions = computed(() => getSystemEventOptions(t))
const pagedTableData = computed(() => {
  const start = (currentPage.value - 1) * displayPageSize.value
  return tableData.value.slice(start, start + displayPageSize.value)
})
const selectAll = computed(() => eventOptions.value.length > 0 && queryForm.moduleType.length === eventOptions.value.length)
const indeterminate = computed(() => queryForm.moduleType.length > 0 && queryForm.moduleType.length < eventOptions.value.length)

const formatEventTime = (date: Date) => dayjs(date).format('YYYY-MM-DDTHH:mm:ss+08:00')

const normalizeModuleTypes = (moduleTypes: string[]) => {
  const result = [...moduleTypes]

  if (result.includes('H5S_EVENT_ONLINE') && !result.includes('H5S_EVENT_DEV_ONLINE')) {
    result.push('H5S_EVENT_DEV_ONLINE')
  }

  if (result.includes('H5S_EVENT_OFFLINE') && !result.includes('H5S_EVENT_DEV_OFFLINE')) {
    result.push('H5S_EVENT_DEV_OFFLINE')
  }

  return Array.from(new Set(result))
}

const reset = () => {
  queryForm.endTime = new Date()
  queryForm.beginTime = new Date(Date.now() - 24 * 60 * 60 * 1000)
  queryForm.name = ''
  queryForm.moduleType = []
  queryForm.pageSize = 1000
  currentPage.value = 1
  displayPageSize.value = 100
}

const handleSelectAllChange = (checked: string | number | boolean) => {
  queryForm.moduleType = checked ? eventOptions.value.map(item => item.value) : []
}

const openPreview = (strImg: string) => {
  previewImage.value = `data:image/jpeg;base64,${strImg}`
  imageDialogVisible.value = true
}

const getEventList = async () => {
  loading.value = true
  try {
    const payload: {
      beginTime: string
      endTime: string
      pageSize: number
      name?: string
      moduleType?: string[]
    } = {
      beginTime: formatEventTime(queryForm.beginTime),
      endTime: formatEventTime(queryForm.endTime),
      pageSize: Number(queryForm.pageSize) || 1000
    }

    const trimmedName = queryForm.name.trim()
    if (trimmedName) {
      payload.name = trimmedName
    }

    const moduleTypes = normalizeModuleTypes(queryForm.moduleType)
    if (moduleTypes.length) {
      payload.moduleType = moduleTypes
    }

    const result = await GetSystemEventListApi(payload)
    const success = result.status === 200 && (result.data?.code === 0 || result.data?.msg === 'Success')

    if (success) {
      const rows = Array.isArray(result.data?.result)
        ? result.data.result
        : result.data?.result?.list || []
      tableData.value = rows
      total.value = rows.length
      currentPage.value = 1
      return
    }

    tableData.value = []
    total.value = 0
    ElMessage.error(t('CommTableEdit.comm_edit_failed'))
  } catch (error) {
    tableData.value = []
    total.value = 0
    ElMessage.error(t('CommTableEdit.comm_edit_failed'))
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val: number) => {
  displayPageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

onMounted(() => {
  reset()
})
</script>

<template>
  <div class="event-search">
    <div class="search-info">
      <el-form :inline="true" :model="queryForm" class="query-form" label-position="right">
        <el-form-item :label="t('CommTime.comm_time_start')">
          <el-date-picker
            v-model="queryForm.beginTime"
            type="datetime"
            :placeholder="t('Common.comm_select_date_time')"
            class="date-picker"
          />
        </el-form-item>
        <el-form-item :label="t('CommTime.comm_time_end')">
          <el-date-picker
            v-model="queryForm.endTime"
            type="datetime"
            :placeholder="t('Common.comm_select_date_time')"
            class="date-picker"
          />
        </el-form-item>
        <el-form-item :label="t('CommTable.comm_table_name')">
          <el-input v-model="queryForm.name" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item :label="t('System.sys_module_type')">
          <el-select
            v-model="queryForm.moduleType"
            multiple
            collapse-tags
            clearable
            :placeholder="t('Common.comm_please_select')"
            class="module-type-select"
            popper-class="event-module-select-popper"
          >
            <template #header>
              <div class="module-select-header">
                <el-checkbox
                  :model-value="selectAll"
                  :indeterminate="indeterminate"
                  @change="handleSelectAllChange"
                >
                  {{ t('Common.comm_check_all') }}
                </el-checkbox>
              </div>
            </template>
            <el-option
              v-for="item in eventOptions"
              :key="item.value"
              :value="item.value"
              :label="item.label"
            >
              <el-checkbox
                :model-value="queryForm.moduleType.includes(item.value)"
                class="module-option-checkbox"
              >
                {{ item.label }}
              </el-checkbox>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('Event.event_search_quantity')" class="page-size-item">
          <el-input-number v-model="queryForm.pageSize" :min="1" :controls="false" class="page-size-input" />
        </el-form-item>
        <el-form-item class="button-item">
          <el-button size="small" @click="reset">{{ t('CommTableEdit.comm_reset') }}</el-button>
          <el-button size="small" type="primary" @click="getEventList">{{ t('CommTableEdit.comm_search') }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container" v-loading="loading">
      <el-table :data="pagedTableData" height="100%" style="width: 100%" size="small" :empty-text="t('CommTable.comm_no_data_available')">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column :label="t('CommTable.comm_table_serial_number')" width="60" class-name="serial-number-column" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * displayPageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column :label="t('CommTable.comm_table_name')" prop="name" min-width="160" />
        <el-table-column label="UUID" prop="uuid" min-width="220" />
        <el-table-column :label="t('System.sys_module_type')" prop="moduleType" min-width="180" />
        <el-table-column :label="t('System.sys_time')" prop="strTime" min-width="180" />
        <el-table-column :label="t('Common.comm_picture')" min-width="120" align="center">
          <template #default="{ row }">
            <img
              v-if="row.strImg"
              :src="`data:image/jpeg;base64,${row.strImg}`"
              height="30"
              style="cursor: pointer"
              @click="openPreview(row.strImg)"
            >
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-box">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="displayPageSize"
        :background="true"
        :page-sizes="[10, 30, 50, 100, 500, 1000]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog v-model="imageDialogVisible" width="50%" center>
      <img :src="previewImage" alt="" style="width: 100%; display: block;">
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.event-search {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .search-info {
    padding: 16px 20px;

    .query-form {
      display: flex;
      align-items: flex-start;
      column-gap: 10px;
      row-gap: 12px;
      flex-wrap: wrap;

      .el-form-item {
        margin: 0;
      }

      :deep(.el-form-item__label) {
        min-width: 80px;
        justify-content: flex-end;
      }

      .button-item {
        margin-left: auto;
      }

      .el-button {
        width: 80px;
        height: 28px;
      }
    }
  }

  .date-picker {
    width: 190px;
  }

  .module-type-select {
    width: 240px;
  }

  .page-size-input {
    width: 110px;
  }

  .table-container {
    flex: 1;
    min-height: 0;
    padding: 0 10px;

    :deep(.el-table__cell) {
      font-size: 12px;
    }

    :deep(.el-table__header .cell) {
      font-size: 12px;
    }

    :deep(.serial-number-column .cell) {
      white-space: nowrap;
    }
  }

  .pagination-box {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 12px;
  }
}
</style>

<style lang="scss">
.event-module-select-popper {
  .el-select-dropdown__header {
    padding: 0;
  }

  .module-select-header {
    height: 34px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .el-select-dropdown__item {
    padding: 0 20px;
  }

  .module-option-checkbox {
    width: 100%;
    height: 34px;
    display: flex;
    align-items: center;
    pointer-events: none;

    .el-checkbox__label {
      color: inherit;
      font-weight: normal;
    }
  }
}
</style>
