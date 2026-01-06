<script lang="ts" setup>
import { ref, onMounted, reactive, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { GetClassifierListApi, DeleteClassifierApi, AddClassifierApi, UpdateClassifierApi } from '@/api/Analytics/setting';;
import { ArrowRight } from '@element-plus/icons-vue'
import { ElMessage, type InputInstance, ElMessageBox } from 'element-plus'

const { t } = useI18n()

const visible = ref<boolean>(false);
const opeartion = ref<string>('')
const tableData = ref<any[]>([]);
const currentPage = ref<number>(1);
const pageSize = ref<number>(10);
const total = ref<number>(0);
const classifierForm = reactive<any>({
  name: 'classifier',
  txtList: [],
  alarmClassIndex: [],
  objClassList: ['person'],
  language: 'zh',
  generateAlarm: false
})

const GetClassifierList = async () => {
  const params = {
    pageIndex: currentPage.value,
    pageSize: pageSize.value
  }
  const res = await GetClassifierListApi(params);
  if (res.status == 200 && res.data.code == 0) {
    tableData.value = res.data.result.list;
    total.value = res.data.result.count;
  }
}

const checkedIds = ref<number[]>([])
const selectChange = (selection: any[]): void => {
  checkedIds.value = [];
  selection.forEach(item => {
    checkedIds.value.push(item.classifierId)
  })
};
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  currentPage.value = 1;
  GetClassifierList()
}
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  GetClassifierList()
}

const Opeartion = (type: 'add' | 'edit', row?: any) => {
  if (type === 'add') {
    visible.value = true;
    opeartion.value = 'add'
  } else if (type === 'edit') {
    visible.value = true;
    opeartion.value = 'edit';
    classifierForm.name = row.name;
    classifierForm.txtList = row.txtList;
    classifierForm.alarmClassIndex = row.alarmClassIndex;
    classifierForm.objClassList = row.objClassList;
    classifierForm.language = row.language;
    classifierForm.generateAlarm = row.generateAlarm;
    // classifierForm.classifierId = row.classifierId;
    classifierForm.uuid = row.uuid;
  }
}

const delRow = async (row: any) => {
  ElMessageBox.confirm(
    t('CommTableEdit.comm_delete_confirm'),
    t('CommTableEdit.comm_prompt'),
    {
      confirmButtonText: t('CommTableEdit.comm_ok'),
      cancelButtonText: t('CommTableEdit.comm_cancel'),
      type: 'warning'
    }
  ).then(async () => {
    const params = {
      ids: [row.classifierId]
    }
    const res = await DeleteClassifierApi(params);
    if (res.status == 200 && res.data.code == 0) {
      ElMessage({
        message: t('CommTableEdit.comm_delete_successfully'),
        type: 'success',
        duration: 2000
      })
      GetClassifierList();
    }
  }).catch(() => {

  })
}

const delAll = async () => {
  if (!checkedIds.value.length) return;
  ElMessageBox.confirm(
    t('CommTableEdit.comm_delete_confirm'),
    t('CommTableEdit.comm_prompt'),
    {
      confirmButtonText: t('CommTableEdit.comm_ok'),
      cancelButtonText: t('CommTableEdit.comm_cancel'),
      type: 'warning'
    }
  ).then(async () => {
    const params = {
      ids: checkedIds.value
    }
    const res = await DeleteClassifierApi(params);
    if (res.status == 200 && res.data.code == 0) {
      ElMessage({
        message: t('CommTableEdit.comm_delete_successfully'),
        type: 'success',
        duration: 2000
      })
      GetClassifierList();
    }
  }).catch(() => {

  })
}

const onSubmit = async () => {
  if (opeartion.value == 'add') {
    const res = await AddClassifierApi(classifierForm);
    if (res.status == 200 && res.data.code == 0) {
      ElMessage({
        message: t('CommTableEdit.comm_add_successfully'),
        type: 'success',
        duration: 2000
      })
      goback()
      GetClassifierList()
    }
  } else if (opeartion.value == 'edit') {
    const res = await UpdateClassifierApi(classifierForm);
    if (res.status == 200 && res.data.code == 0) {
      ElMessage({
        message: t('CommTableEdit.comm_modify_success'),
        type: 'success',
        duration: 2000
      })
      goback()
      GetClassifierList()
    }
  }
}

const goback = () => {
  visible.value = false;
  opeartion.value = '';
  classifierForm.name = 'classifier';
  classifierForm.txtList = [];
  classifierForm.alarmClassIndex = [];
  classifierForm.objClassList = ['person'];
  classifierForm.language = 'zh';
  classifierForm.generateAlarm = false;
}

const inputVisible = ref<boolean>(false);
const inputValue = ref<string>('');
  const InputRef = ref<InputInstance>()
const handleClose = (tag: string) => {
  classifierForm.txtList.splice(classifierForm.txtList.indexOf(tag), 1);
}
const handleInputConfirm = () => {
  if (inputValue.value) {
    classifierForm.txtList.push(inputValue.value)
  }
  inputVisible.value = false
  inputValue.value = ''
}
const showInput = () => {
  inputVisible.value = true;
  nextTick(() => {
    InputRef.value!.input!.focus()
  })
}

const objClassList = ['background', 'person', 'bicycle', 'car', 'motorcycle', 'bus', 'truck', 'dog', 'face']
const handleCheckedObjChange = () => {}

onMounted(() => {
  GetClassifierList()
})
</script>

<template>
  <div class="classifier">
    <div v-if="visible" class="classifier-opeartion">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="goback">{{ t('Analytics.ana_classifier') }}</el-breadcrumb-item>
          <el-breadcrumb-item v-if="opeartion == 'edit'">{{ $t("CommTableEdit.comm_edit") }}</el-breadcrumb-item>
          <el-breadcrumb-item v-if="opeartion == 'add'">{{ $t("CommTableEdit.comm_add") }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <el-form class="classifier-form" :model="classifierForm" label-width="auto" label-position="right" style="max-width: 600px;">
        <el-form-item :label="t('CommTableEdit.comm_table_name')">
          <el-input v-model="classifierForm.name" style="width: 300px;"></el-input>
        </el-form-item>
        <el-form-item :label="t('Analytics.ana_txt_list')">
          <el-tag type="info" v-for="tag in classifierForm.txtList" :key="tag" closable :disable-transitions="false"
            @close="handleClose(tag)">{{ tag }}</el-tag>
            <el-input
              v-if="inputVisible"
              ref="InputRef"
              v-model="inputValue"
              class="w-20"
              size="small"
              @keyup.enter="handleInputConfirm"
              @blur="handleInputConfirm"
              style="width: 100px;"
            />
            <el-button v-else class="button-new-tag" size="small" @click="showInput">{{ $t("CommTableEdit.comm_edit") }}</el-button>
        </el-form-item>
        <el-form-item :label="t('Analytics.ana_generate_alarm')">
          <el-switch v-model="classifierForm.generateAlarm"></el-switch>
        </el-form-item>
        <el-form-item :label="t('Analytics.ana_alarm_class_index')">
          <el-checkbox-group v-model="classifierForm.alarmClassIndex">
            <el-checkbox v-for="(item, index) in classifierForm.txtList" :key="index" :label="Number(index) + 1" name="type">{{ item }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item :label="t('Login.login_lang')">
          <el-select v-model="classifierForm.language" style="width: 300px;">
            <el-option :label="t('Login.login_chinese')" value="zh"></el-option>
            <el-option :label="t('Login.login_english')" value="en"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('Analytics.ana_obj_class_list')" prop="resource">
          <el-checkbox-group class="checkboxgroup" v-model="classifierForm.objClassList"
            @change="handleCheckedObjChange">
            <el-checkbox v-for="(value, i) in objClassList" :key="i" :label="value">
              <i :class="'iconfont icon-' + value" style="font-size: 20px;" :title="value"></i>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label=" ">
          <el-button size="small" style="width: 60px; height: 30px;" @click="goback">{{ t('CommTableEdit.comm_cancel') }}</el-button>
          <el-button size="small" type="primary" style="width: 60px; height: 30px;" @click="onSubmit">{{ t('CommTableEdit.comm_ok') }}</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div v-if="!visible" class="classifier-header">
      <el-button type="primary" size="small" @click="Opeartion('add')">{{ t('CommTableEdit.comm_add') }}</el-button>
      <el-button size="small" @click="delAll">{{ t('CommTableEdit.comm_delete') }}</el-button>
    </div>
    <el-table v-if="!visible" :data="tableData" height="760" @selection-change="selectChange" style="width: 100%;">
      <el-table-column type="selection" width="55" align="center"></el-table-column>
      <el-table-column :label="t('CommTableEdit.comm_table_serial_number')" type="index" width="120" align="center"></el-table-column>
      <el-table-column :label="t('CommTableEdit.comm_table_name')" prop="name" align="center"></el-table-column>
      <el-table-column :label="t('Analytics.ana_txt_list')" width="400" align="center">
        <template #default="{ row }">
          <el-tag v-for="(item, index) in row.txtList" :key="index" type="info" size="small">{{ item }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('Analytics.ana_generate_alarm')" width="120" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.generateAlarm" disabled></el-switch>
        </template>
      </el-table-column>
      <el-table-column :label="t('Analytics.ana_alarm_class_index')" align="center">
        <template #default="{ row }">
          <el-tag v-for="(item, index) in row.alarmClassIndex" :key="index" type="info">{{ item }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('Login.login_lang')" prop="language" width="100" align="center"></el-table-column>
      <el-table-column :label="t('Analytics.ana_obj_class_list')" width="200" align="center">
        <template #default="{ row }">
          <el-tag v-for="(item, index) in row.objClassList" :key="index" type="info">
            <i :class="'iconfont icon-' + item" style="font-size: 20;" :title="item"></i>
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('CommTableEdit.comm_operational')" width="200" align="center">
        <template #default="{ row }">
          <el-button type="text" @click="Opeartion('edit', row)">{{ t('CommTableEdit.comm_edit') }}</el-button>
          <el-button type="text" @click="delRow(row)">{{ t('CommTableEdit.comm_delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="!visible" class="Pagination">
      <el-pagination
        v-model:current-page="currentPage"
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

<style lang="scss" scoped>
.classifier {
  width: 100%;;
  height: 100%;
  .classifier-opeartion {
    width: 100%;
    height: 100%;
    padding: 10px 20px;
    display: flex;
    flex-direction: column;
    .bread-header {
      width: 100%;
      height: 50px;
      display: flex;
      align-items: center;
      // background-color: #aaa;
      border-bottom: 1px solid #313131;
      .can-click {
        cursor: pointer;
      }
    }
    .classifier-form {
      padding: 20px ;
    }
  }
  .classifier-header {
    width: 100%;
    height: 60px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 0 10px;
    .el-button {
      width: 70px;
      height: 30px;
    }
  }
  .Pagination {
    height: calc(100% - 60px - 760px);
  }
  .checkboxgroup {
    .el-checkbox {
      margin-right: 10px;
    }

    :deep(.el-checkbox .el-checkbox__input) {
      display: none !important;
    }

    .is-checked {
      .el-checkbox__label {
        color: #fff !important;
      }
    }
  }
}
</style>