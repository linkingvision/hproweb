<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { GetSysConfigApi, UpdateSysConfigApi } from '@/api/system';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue'

const { t } = useI18n();

const tableData = ref<any[]>([])
const currentPage = ref<number>(1)
const pageSize = ref<number>(20);
const total = ref<number>(0);
const copyRow = ref<any>({})

const moduleName = ref<string>('all');
const options = [{
  value: 'all',
  label: t('System.sys_all')
}, {
  value: 'system',
  label: t('System.sys_configuration')
}]
const filterText = ref<string>('')

const GetSysConfig = async () => {
  tableData.value = [];
  const res = await GetSysConfigApi(moduleName.value);
  if (res.status == 200 && res.data.code == 0) {
    console.log('GetSysConfig =>', res.data)
    total.value = res.data.result.count;
    const list = res.data.result.list;
    for (let i = 0; i < list.length; i++) {
      let item = {
        ...list[i],
        index: list[i].id,
        visible: false
      }
      tableData.value.push(item);
    }
  }
}

const reset = () => {
  moduleName.value = 'all'
}

const editRow = (row: any) => {
  row.visible = true;
  copyRow.value = JSON.parse(JSON.stringify(row))
  // console.log(copyRow.value)
}
const cancel = (row: any) => {
  row.visible = false;
  row.value = copyRow.value.value;
  copyRow.value = {}
}
const onSubmit = async (row: any) => {
  console.log('onSubmit =>', row)
  const params = {
    key: row.key,
    value: row.value
  }
  // console.log(params)
  const res = await UpdateSysConfigApi(params);
  if (res.status == 200 && res.data.code == 0) {
    ElMessage({
      message: t('CommTableEdit.comm_modify_success'),
      type: 'success',
      duration: 2000
    })
    row.visible = false;
    copyRow.value = {};
  }
}

onMounted(() => {
  // GetSysConfig()
})
</script>

<template>
  <div class="system-config">
    <div class="config-top">
      <div class="module-select">
        <span>{{ t('System.sys_module_name') }}</span>
        <el-select v-model="moduleName" placeholder="Select" style="width: 240px;">
          <el-option
            v-for="(item, index) in options"
            :key="index"
            :label="item.label"
            :value="item.value"
          ></el-option>
        </el-select>
      </div>
      <div class="operation-btns">
        <el-button @click="reset">{{ t('CommTableEdit.comm_reset') }}</el-button>
        <el-button type="primary" @click="GetSysConfig">{{ t('CommTableEdit.comm_search') }}</el-button>
      </div>
    </div>
    <div class="config-table">
      <el-table :data="tableData.filter(item => !filterText || item.key.toLowerCase().includes(filterText.toLowerCase())).slice((currentPage - 1) * pageSize, currentPage * pageSize)" height="760" style="width: 100%;">
        <el-table-column type="index" :label="t('CommTableEdit.comm_table_serial_number')" width="120" align="center"></el-table-column>
        <el-table-column :label="t('System.sys_module_name')" width="140" prop="module" align="center"></el-table-column>
        <el-table-column :label="t('System.sys_service_restart')" width="160" prop="rebootServer" align="center"></el-table-column>
        <el-table-column :label="t('System.sys_name_parameter')" prop="key" align="center"></el-table-column>
        <el-table-column :label="t('System.sys_parameter_value')" width="100" prop="value" align="center">
          <template #default="{ row }">
            <div v-if="!row.visible">{{ row.value }}</div>
            <el-select v-else-if="row.visible && (row.value == 'true' || row.value == 'false')" v-model="row.value">
              <el-option label="true" value="true"></el-option>
              <el-option label="false" value="false"></el-option>
            </el-select>
            <el-input v-else v-model="row.value"></el-input>
          </template>
        </el-table-column>
        <el-table-column :label="t('System.sys_range_restriction')" prop="parameter_range" align="center"></el-table-column>
        <el-table-column :label="t('Configuration.conf_description')" prop="description" align="center"></el-table-column>
        <el-table-column :label="t('CommTableEdit.comm_operational')" width="120" prop="" align="center">
          <template #default="{row}">
            <el-button v-if="!row.visible" type="text" @click="editRow(row)">{{ t('CommTableEdit.comm_operational') }}</el-button>
            <el-button v-if="row.visible" type="text" @click="onSubmit(row)">{{ t('CommTableEdit.comm_save') }}</el-button>
            <el-button v-if="row.visible" type="text" @click="cancel(row)">{{ t('CommTableEdit.comm_cancel') }}</el-button>
          </template>
        </el-table-column>
        <el-table-column align="center">
          <template #header>
            <el-input v-model="filterText" :placeholder="t('Common.comm_filtration')" :prefix-icon="Search"></el-input>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="config-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      ></el-pagination>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.system-config {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .config-pagination {
    width: 100%;
    height: 50px;
    display: flex;
    justify-content: flex-end;
    background-color: #202020;
  }
  .config-table {
    width: 100%;
    flex: 1;
  }
  .config-top {
    width: 100%;
    height: 80px;
    padding: 0 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    // background-color: grey;
    .module-select {
      span {
        margin-right: 10px;
      }
    }
  }
}
</style>