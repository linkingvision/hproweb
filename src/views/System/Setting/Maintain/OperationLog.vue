<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import { GetLogApi } from '@/api/system';

const { t } = useI18n();

interface QueryFormType {
  pageSize: number,
  pageIndex: number,
  username: '',
  beginTime: Date,
  endTime: Date,
  moduleType?: string
}

const form = ref<QueryFormType>({
  pageIndex: 1,
  pageSize: 100000,
  username: '',
  beginTime: new Date(),
  endTime: new Date(),
  moduleType: ''
})

const tableData = ref<any>([])
const total = ref<number>(0);
const currentPage = ref<number>(1);
const pageSize = ref<number>(100)

const reset = () => {
  form.value.endTime = new Date();
  form.value.beginTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
  form.value.moduleType = '';
  form.value.username = '';
}
const search = async () => {
  const params: any = {
    username: form.value.username,
    beginTime: dayjs(form.value.beginTime).format('YYYY-MM-DDTHH:mm:ss+08:00'),
    endTime: dayjs(form.value.endTime).format('YYYY-MM-DDTHH:mm:ss+08:00'),
    pageSize: form.value.pageSize,
    pageIndex: form.value.pageIndex
  };
  if (form.value.moduleType) {
    params.moduleType = form.value.moduleType;
  }
  const res = await GetLogApi(params)
  if (res.status == 200 && res.data.code == 0) {
    const result = res.data.result;
    total.value = result.count;
    tableData.value = result.list;
  }
}

onMounted(() => {
  form.value.beginTime = new Date(Date.now() - 24 * 60 * 60 * 1000)
})
</script>

<template>
  <div class="opeartion-log">
    <div class="log-top">
      <el-form :inline="true" :module="form" class="query-form" style="display: flex; justify-content: space-between;">
        <el-form-item :label="t('Common.comm_time_start')">
          <el-date-picker
            v-model="form.beginTime"
            type="datetime"
            placeholder="Select date and time"
          />
        </el-form-item>
        <el-form-item :label="t('Common.comm_time_end')">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            placeholder="Select date and time"
          />
        </el-form-item>
        <el-form-item :label="t('System.sys_operate_function')">
          <el-input v-model="form.moduleType"></el-input>
        </el-form-item>
        <el-form-item :label="t('System.sys_operate_user')">
          <el-input v-model="form.username"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button size="small" @click="reset" style="width: 80px; height: 28px;">{{ t('CommTableEdit.comm_reset') }}</el-button>
          <el-button size="small" type="primary" @click="search" style="width: 80px; height: 28px;">{{ t('CommTableEdit.comm_search') }}</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="log-center">
      <el-table :data="tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)" style="width: 100%;" :height="780">
        <el-table-column type="index" :label="t('CommTableEdit.comm_table_serial_number')" width="120" align="center"></el-table-column>
        <el-table-column :label="t('Setting.set_user')" width="120" align="center" prop="username"></el-table-column>
        <el-table-column :label="t('System.sys_client_ip')" width="200" align="center" prop="clientIp"></el-table-column>
        <el-table-column :label="t('System.sys_log_level')" width="200" align="center" prop="logLevel"></el-table-column>
        <el-table-column :label="t('System.sys_time')" width="220" align="center" prop="time"></el-table-column>
        <el-table-column :label="t('System.sys_module_type')" width="160" align="center" prop="moduleType"></el-table-column>
        <el-table-column :label="t('CommTableEdit.comm_operational')" align="center" prop="operation"></el-table-column>
        <el-table-column :label="t('System.sys_operate_result')" width="140" align="center" prop="OperateResult"></el-table-column>
      </el-table>
    </div>
    <div class="pagination">
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
.opeartion-log {
  .log-top {
    padding: 10px;
    .el-form {
      margin: 0;
      padding: 0;
      .el-form-item {
        margin: 0;
      }
    }
  }
  .log-center {
    width: 100%;
  }
  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
}
</style>