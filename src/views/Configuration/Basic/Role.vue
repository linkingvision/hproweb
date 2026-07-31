<template>
  <div class="Device">
    <!-- 添加 -->
    <div v-if="dialogFormVisible && !editPopup && !RoleConfDialog && !IDPDialog" class="RoterNav">
      <div class="header">
        <el-button @click="back('add')" type="primary" link>{{ t('Configuration.conf_role') }}</el-button>
        <span style="margin:0 8px;font-size:16px;">></span>
        <span>{{ t('CommTableEdit.comm_add') }}</span>
      </div>
      <p>{{ t('CommTableEdit.comm_add') }}</p>
      <div>
        <el-form class="el_form" label-position="left" label-width="90px" :model="addForm">
          <el-form-item :label="t('Setting.set_role_name')" style="width:29.3%;">
            <el-input v-model="addForm.roleName"></el-input>
          </el-form-item>
          <el-form label-position="left" label-width="90px"
            style="display:flex;justify-content:flex-start;padding-left:0px;">
            <el-form-item :label="t('Setting.set_administrator')">
              <div class="tow_node">
                <div class="Root_node Root_node1">
                  <el-input class="elinput" prefix-icon="Search"
                    :placeholder="t('Common.comm_filtration')" v-model="filterText"></el-input>
                  <div style="margin-left:23px;line-height:0px;">
                    <el-checkbox size="small" :indeterminate="isIndeterminate" v-model="checkAll"
                      @change="handleCheckAllChange" class="CustomizeCheckAllBtn">
                      {{ t('Common.comm_check_all') }}
                    </el-checkbox>
                  </div>
                  <el-tree ref="treeRef" :data="treeData" node-key="id" :filter-node-method="filterNode"
                    :props="treeProps" show-checkbox @check-change="caseCheckChange"
                    :empty-text="t('CommTable.comm_no_data_available')">
                    <template #default="{ data }">
                      <span style="padding-left:4px;">{{ data.name }}</span>
                    </template>
                  </el-tree>
                </div>
              </div>
            </el-form-item>
            <el-form-item :label="t('Setting.set_usage_permissions')" style="margin-left:20px;">
              <div class="tow_node">
                <div class="Root_node Root_node1">
                  <el-input class="elinput" prefix-icon="Search"
                    :placeholder="t('Common.comm_filtration')" v-model="filterText1"></el-input>
                  <div style="margin-left:23px;line-height:0px;">
                    <el-checkbox size="small" :indeterminate="isIndeterminate1" v-model="checkAll1"
                      @change="handleCheckAllChange1" class="CustomizeCheckAllBtn">
                      {{ t('Common.comm_check_all') }}
                    </el-checkbox>
                  </div>
                  <el-tree ref="tree1Ref" :data="treeData2" node-key="id" :filter-node-method="filterNode1"
                    :props="treeProps" show-checkbox @check-change="caseCheckChange1"
                    :empty-text="t('CommTable.comm_no_data_available')">
                    <template #default="{ data }">
                      <span style="padding-left:4px;">{{ data.name }}</span>
                    </template>
                  </el-tree>
                </div>
              </div>
            </el-form-item>
            <el-form-item :label="t('Common.comm_device_partition')" style="margin-left:20px;">
              <div class="tow_node">
                <div class="Root_node Root_node1">
                  <el-input class="elinput" prefix-icon="Search"
                    :placeholder="t('Common.comm_filtration')" v-model="filterTextDevPartition"></el-input>
                  <el-tree ref="devPartitionTreeRef" :data="devPartitionData" node-key="devPartitionId"
                    :filter-node-method="filterNodeDevPartition" :props="devPartitionProps" show-checkbox
                    :empty-text="t('CommTable.comm_no_data_available')" :check-strictly="true"
                    @check-change="checkChange">
                    <template #default="{ data }">
                      <span style="padding-left:4px;">{{ data.devPartitionName }}</span>
                    </template>
                  </el-tree>
                </div>
              </div>
            </el-form-item>
          </el-form>
          <el-form-item :label="t('Common.comm_description')" class="description"
            style="width:30.6%;display:flex;flex-direction:row;margin-top:15px;">
            <el-input type="textarea" v-model="addForm.description"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <div class="dialog-footer button_table"
        style="padding:0px 20px 0px;width:55%;display:flex;justify-content:flex-end;">
        <el-button class="form_butt1" @click="dialogFormVisible = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="addRole">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </div>
    </div>
    <!-- 编辑 -->
    <div v-if="editPopup && !dialogFormVisible && !RoleConfDialog && !IDPDialog" class="RoterNav">
      <div class="header">
        <el-button @click="back('edit')" type="primary" link>{{ t('Configuration.conf_role') }}</el-button>
        <span style="margin:0 8px;font-size:16px;">></span>
        <span>{{ t('CommTableEdit.comm_edit') }}</span>
      </div>
      <p>{{ t('CommTableEdit.comm_edit') }}</p>
      <div>
        <el-form class="el_form" label-position="left" label-width="90px" :model="editForm">
          <el-form-item :label="t('Setting.set_role_name')" style="width:29.3%;">
            <el-input v-model="editForm.roleName"></el-input>
          </el-form-item>
          <el-form label-position="left" label-width="90px"
            style="display:flex;justify-content:flex-start;padding-left:0px;">
            <el-form-item :label="t('Setting.set_administrator')">
              <div class="tow_node">
                <div class="Root_node Root_node1">
                  <el-input class="elinput" prefix-icon="Search"
                    :placeholder="t('Common.comm_filtration')" v-model="filterText"></el-input>
                  <div style="margin-left:23px;line-height:0px;">
                    <el-checkbox size="small" :indeterminate="isIndeterminate" v-model="checkAll"
                      @change="handleCheckAllChange" class="CustomizeCheckAllBtn">
                      {{ t('Common.comm_check_all') }}
                    </el-checkbox>
                  </div>
                  <el-tree ref="treeRef" :data="treeData" node-key="id" :filter-node-method="filterNode"
                    :props="treeProps" show-checkbox @check-change="caseCheckChange"
                    :default-checked-keys="defaultList"
                    :empty-text="t('CommTable.comm_no_data_available')">
                    <template #default="{ data }">
                      <span style="padding-left:4px;">{{ data.name }}</span>
                    </template>
                  </el-tree>
                </div>
              </div>
            </el-form-item>
            <el-form-item :label="t('Setting.set_usage_permissions')" style="margin-left:20px;">
              <div class="tow_node">
                <div class="Root_node Root_node1">
                  <el-input class="elinput" prefix-icon="Search"
                    :placeholder="t('Common.comm_filtration')" v-model="filterText1"></el-input>
                  <div style="margin-left:23px;line-height:0px;">
                    <el-checkbox size="small" :indeterminate="isIndeterminate1" v-model="checkAll1"
                      @change="handleCheckAllChange1" class="CustomizeCheckAllBtn">
                      {{ t('Common.comm_check_all') }}
                    </el-checkbox>
                  </div>
                  <el-tree ref="tree1Ref" :data="treeData2" node-key="id" :filter-node-method="filterNode1"
                    :props="treeProps" show-checkbox @check-change="caseCheckChange1"
                    :default-checked-keys="defaultList2"
                    :empty-text="t('CommTable.comm_no_data_available')">
                    <template #default="{ data }">
                      <span style="padding-left:4px;">{{ data.name }}</span>
                    </template>
                  </el-tree>
                </div>
              </div>
            </el-form-item>
            <el-form-item :label="t('Common.comm_device_partition')" style="margin-left:20px;">
              <div class="tow_node">
                <div class="Root_node Root_node1">
                  <el-input class="elinput" prefix-icon="Search"
                    :placeholder="t('Common.comm_filtration')" v-model="filterTextDevPartition1"></el-input>
                  <el-tree ref="devPartitionTree1Ref" :data="devPartitionData" node-key="devPartitionId"
                    :filter-node-method="filterNodeDevPartition1" :props="devPartitionProps" show-checkbox
                    :default-checked-keys="devPartitionDefaultList"
                    :empty-text="t('CommTable.comm_no_data_available')" :check-strictly="true"
                    @check-change="checkChange1">
                    <template #default="{ data }">
                      <span style="padding-left:4px;">{{ data.devPartitionName }}</span>
                    </template>
                  </el-tree>
                </div>
              </div>
            </el-form-item>
          </el-form>
          <el-form-item :label="t('Common.comm_description')" class="description"
            style="width:30.6%;display:flex;flex-direction:row;margin-top:15px;">
            <el-input type="textarea" v-model="editForm.description"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <div class="dialog-footer button_table"
        style="padding:0px 20px 0px;width:55%;display:flex;justify-content:flex-end;">
        <el-button class="form_butt1" @click="editDialogClose">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="editRole">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </div>
    </div>
    <!-- 角色配置 -->
    <div v-if="RoleConfDialog && !editPopup && !dialogFormVisible && !IDPDialog" class="RoterNav">
      <div class="header">
        <el-button @click="back('config')" type="primary" link>{{ t('Configuration.conf_role') }}</el-button>
        <span style="margin:0 8px;font-size:16px;">></span>
        <span>{{ eltitle }}</span>
      </div>
      <p>{{ eltitle }}</p>
      <div>
        <el-form class="el_form" label-position="left" label-width="175px" size="small" :model="configForm">
          <el-form-item :label="t('Setting.set_minimum_password_length')">
            <el-input v-model="configForm.passwordLength" style="width:10%;margin-right:10px;"></el-input>
            <span>{{ t('Common.comm_bytes') }}</span>
          </el-form-item>
          <el-form-item :label="t('Setting.set_account_lockout_duration')">
            <el-input v-model="configForm.userLockTime" style="width:10%;margin-right:10px;"></el-input>
            <span>{{ t('Common.comm_second') }}</span>
          </el-form-item>
          <el-form-item :label="t('Setting.set_account_lock')">
            <el-input v-model="configForm.userLockLimit" style="width:10%;margin-right:10px;"></el-input>
            <span>{{ t('Common.comm_number_of_times') }}</span>
          </el-form-item>
          <el-form-item :label="t('Setting.set_account_relock_duration')">
            <el-input v-model="configForm.userLockTimeAgain" style="width:10%;margin-right:10px;"></el-input>
            <span>{{ t('Common.comm_minutes') }}</span>
          </el-form-item>
          <el-form-item :label="t('Setting.set_password_expiration_time')">
            <el-input v-model="configForm.passwordExpiryTime" style="width:10%;margin-right:10px;"></el-input>
            <span>{{ t('Common.comm_day') }}</span>
          </el-form-item>
          <el-form-item :label="t('Setting.set_password_expiration_alert_time')">
            <el-input v-model="configForm.passwordAlertTime" style="width:10%;margin-right:10px;"></el-input>
            <span>{{ t('Common.comm_day') }}</span>
          </el-form-item>
          <el-form-item :label="t('Setting.set_password_expiry_change')">
            <el-switch v-model="configForm.passwordExpiryChange"></el-switch>
          </el-form-item>
          <el-form-item :label="t('Setting.set_password_rule')">
            <el-switch v-model="configForm.passwordRule"></el-switch>
          </el-form-item>
          <el-form-item :label="t('Setting.set_password_first_change')">
            <el-switch v-model="configForm.passwordFirstChange"></el-switch>
          </el-form-item>
        </el-form>
      </div>
      <div class="dialog-footer button_table"
        style="padding:0px 20px 0px;width:45%;display:flex;justify-content:flex-end;">
        <el-button class="form_butt1" @click="RoleConfDialog = false">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="roleConfOK">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </div>
    </div>
    <!-- 外部IDP配置 -->
    <div v-if="IDPDialog && !dialogFormVisible && !editPopup && !RoleConfDialog" class="RoterNav">
      <div class="header">
        <el-button @click="back('IDPConfig')" type="primary" link>{{ t('Configuration.conf_role') }}</el-button>
        <span style="margin:0 8px;font-size:16px;">></span>
        <span>{{ t('ExternalIDP.ext_idp_config') }}</span>
      </div>
      <p style="font-weight:600;">{{ t('ExternalIDP.ext_idp_config') }}</p>
      <el-form label-position="right" label-width="auto" :model="IDPForm" style="position:relative;">
        <el-form-item label="External IDP">
          <el-select v-model="IDPForm.name" style="width:447px;height:32px;">
            <el-option v-for="(item, index) in IDPList" :key="index"
              :label="item.name" :value="item.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Claim name">
          <el-input v-model="IDPForm.claimName" class="fixed-width-input" disabled style="width:447px;"></el-input>
        </el-form-item>
        <el-form-item label="Claim value">
          <el-input v-model="IDPForm.claimValue" class="fixed-width-input" style="width:447px;"></el-input>
        </el-form-item>
        <el-form-item class="position-botton dialog-footer button_table">
          <el-button type="primary" plain @click="back('IDPConfig')" class="form_butt1">
            {{ t('CommTableEdit.comm_cancel') }}
          </el-button>
          <el-button type="primary" @click="idpSubmit" class="single_button">
            {{ t('CommTableEdit.comm_save') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    <!-- 列表 -->
    <div v-if="!dialogFormVisible && !editPopup && !RoleConfDialog && !IDPDialog" class="devices_topBtn">
      <el-button class="form_butt" @click="openAddForm" type="primary">{{ t('CommTableEdit.comm_add') }}</el-button>
      <el-button class="form_butt1" @click="deleteSelect">{{ t('CommTableEdit.comm_delete') }}</el-button>
    </div>
    <el-table v-if="!dialogFormVisible && !editPopup && !RoleConfDialog && !IDPDialog"
      :data="tableData.filter((d: any) => !search || d.roleName.toLowerCase().includes(search.toLowerCase()))
        .slice((currentPage - 1) * pageSize, currentPage * pageSize)"
      stripe @select="selectCall" @select-all="selectAllCall"
      height="100%" style="width:99.5%"
      :empty-text="t('CommTable.comm_no_data_available')">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="roleName" :label="t('Setting.set_role_name')" width="200"></el-table-column>
      <el-table-column prop="roleId" label="ID" min-width="180"></el-table-column>
      <el-table-column min-width="300" :label="t('CommTableEdit.comm_operational')">
        <template #default="scope">
          <el-button @click="handleClick(scope.$index, scope.row)" link size="small">
            {{ t('CommTableEdit.comm_edit') }}
          </el-button>
          <el-button @click="deleteRow(scope.$index, scope.row)" link size="small">
            {{ t('CommTableEdit.comm_delete') }}
          </el-button>
          <el-button @click="openConfiguration(scope.$index, scope.row)" link size="small">
            {{ t('CommTableEdit.comm_configuration') }}
          </el-button>
          <el-button @click="idpConfig(scope.$index, scope.row)" link size="small">
            {{ t('ExternalIDP.ext_idp_config') }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column width="180">
        <template #header>
          <el-input v-model="search" size="small" :placeholder="t('Common.comm_filtration')" />
        </template>
      </el-table-column>
      <el-table-column></el-table-column>
    </el-table>
    <div class="pagination" v-if="!dialogFormVisible && !editPopup && !RoleConfDialog && !IDPDialog">
      <el-pagination background layout="total, prev, pager, next, sizes, jumper"
        @size-change="handleSizeChange" @current-change="handleCurrentChange"
        :current-page="currentPage" :total="total">
      </el-pagination>
      <el-button class="GoTo" size="small">{{ t('CommTable.comm_jump') }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from '@/api/http'
import { GetDevPartitionApi } from '@/api/configuration/device'

const { t } = useI18n()

// ── 分页 ─────────────────────────────────────────────────
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const search = ref('')
const tableData = ref<any[]>([])
const selectop = ref<any[]>([])

// ── 视图状态 ──────────────────────────────────────────────
const dialogFormVisible = ref(false)
const editPopup = ref(false)
const RoleConfDialog = ref(false)
const IDPDialog = ref(false)
const eltitle = ref('')

// ── 树组件引用 ─────────────────────────────────────────────
const treeRef = ref<any>(null)
const tree1Ref = ref<any>(null)
const devPartitionTreeRef = ref<any>(null)
const devPartitionTree1Ref = ref<any>(null)

// ── 树数据 ─────────────────────────────────────────────────
const treeData = ref<any[]>([])        // 管理权限
const treeData2 = ref<any[]>([])       // 使用权限
const devPartitionData = ref<any[]>([]) // 设备分区

// ── 过滤文本 ───────────────────────────────────────────────
const filterText = ref('')
const filterText1 = ref('')
const filterTextDevPartition = ref('')
const filterTextDevPartition1 = ref('')

// ── 全选状态 ───────────────────────────────────────────────
const checkAll = ref(false)
const checkAll1 = ref(false)
const isIndeterminate = ref(false)
const isIndeterminate1 = ref(false)

// ── 编辑时默认选中键 ────────────────────────────────────────
const defaultList = ref<any[]>([])
const defaultList2 = ref<any[]>([])
const devPartitionDefaultList = ref<any[]>([])
const breadList = ref<any[]>([])

// ── 树 props ───────────────────────────────────────────────
const treeProps = { children: 'children', label: 'name' }
const devPartitionProps = { children: 'children', label: 'devPartitionName' }

// ── 新增表单 ───────────────────────────────────────────────
const addForm = reactive({
  roleName: 'Role1',
  description: '',
  funcGroupIds: [] as number[],
  devPartitionIds: [] as number[],
})

// ── 编辑表单 ───────────────────────────────────────────────
const editForm = reactive({
  roleId: '',
  roleName: '',
  description: '',
  devPartition: [] as any[],
})

// ── 角色配置表单 ───────────────────────────────────────────
const configForm = reactive({
  roleId: '',
  passwordLength: 5,
  userLockTime: 600,
  userLockLimit: 3,
  userLockTimeAgain: 20,
  passwordExpiryTime: 30,
  passwordAlertTime: 7,
  passwordExpiryChange: true,
  passwordRule: true,
  passwordFirstChange: true,
})

// ── 外部IDP ────────────────────────────────────────────────
const IDPList = ref<any[]>([])
const IDPForm = reactive({
  roleUUID: '',
  externalIDPId: 0,
  claimValue: '',
  claimName: '',
  name: '',
})

// ── 工具方法 ───────────────────────────────────────────────
function back(type: string) {
  if (type === 'add') dialogFormVisible.value = false
  else if (type === 'edit') editPopup.value = false
  else if (type === 'config') RoleConfDialog.value = false
  else if (type === 'IDPConfig') IDPDialog.value = false
}

function dleChangePage(size: number) {
  const totalPage = Math.ceil((total.value - size) / pageSize.value)
  const pagenum = currentPage.value > totalPage ? totalPage : currentPage.value
  currentPage.value = pagenum < 1 ? 1 : pagenum
}

// ── API：列表 ──────────────────────────────────────────────
async function roleList() {
  const res: any = await axios({ url: '/uapi/v1/Role/List?pageSize=100000', method: 'GET' })
  if (res.status === 200) {
    tableData.value = []
    for (const item of res.data.result.list) {
      tableData.value.push({
        roleName: item.name,
        roleId: item.roleId,
        description: item.description,
        passwordLength: item.passwordLength,
        userLockTime: item.userLockTime,
        userLockLimit: item.userLockLimit,
        userLockTimeAgain: item.userLockTimeAgain,
        passwordExpiryTime: item.passwordExpiryTime,
        passwordAlertTime: item.passwordAlertTime,
        passwordExpiryChange: item.passwordExpiryChange,
        passwordRule: item.passwordRule,
        passwordFirstChange: item.passwordFirstChange,
        funcGroup: item.funcGroup,
        devPartition: item.devPartition,
        uuid: item.uuid,
        externalIDPId: item.externalIDPId,
        claimValue: item.claimValue,
      })
    }
    total.value = tableData.value.length
  }
}

// ── API：获取权限树 ─────────────────────────────────────────
async function uscApi() {
  const res: any = await axios({ url: '/uapi/v1/UscApi/List', method: 'GET' })
  if (res.status === 200 && res.data.msg === 'Success') {
    const data = res.data.result
    const tree: any[] = [], tree2: any[] = []
    for (let i = 0; i < data.length; i++) {
      const g1: any = { name: data[i].name, id: data[i].id + String(i), children: [] }
      const g2: any = { name: data[i].name, id: data[i].id + String(i), children: [] }
      for (const item of data[i].userApi) {
        const node = { id: item.id, name: item.description, path: item.path }
        if (!item.usePermission) g1.children.push(node)
        else g2.children.push(node)
      }
      tree.push(g1); tree2.push(g2)
    }
    treeData.value = tree.filter(e => e.children.length > 0)
    treeData2.value = tree2.filter(e => e.children.length > 0)
  }
}

// ── API：设备分区树 ─────────────────────────────────────────
async function loadDevPartition() {
  const res: any = await GetDevPartitionApi()
  if (res.status === 200) devPartitionData.value = res.data.result ?? []
}

// ── API：单个角色详情 ───────────────────────────────────────
async function roleItem(roleId: string) {
  const res: any = await axios({ url: `/uapi/v1/Role/Item/${roleId}`, method: 'GET' })
  if (res.status !== 200) return
  const item = res.data.result
  editForm.devPartition = item.devPartition ?? []
  setTimeout(() => {
    // 管理权限
    for (const fg of item.funcGroup ?? []) {
      for (const g of treeData.value) {
        for (const c of g.children ?? []) {
          if (fg.path === c.path) {
            defaultList.value.push(c.id)
            nextTick(() => treeRef.value?.setCheckedKeys(defaultList.value))
          }
        }
      }
    }
    // 使用权限
    for (const fg of item.funcGroup ?? []) {
      for (const g of treeData2.value) {
        for (const c of g.children ?? []) {
          if (fg.path === c.path) {
            defaultList2.value.push(c.id)
            nextTick(() => tree1Ref.value?.setCheckedKeys(defaultList2.value))
          }
        }
      }
    }
    // 设备分区
    function matchPartition(nodes: any[], targets: any[]) {
      for (const node of nodes) {
        for (const t of targets) {
          if (node.devPartitionId === t.devPartitionId) {
            devPartitionDefaultList.value.push(node.devPartitionId)
            nextTick(() => devPartitionTree1Ref.value?.setCheckedKeys(devPartitionDefaultList.value))
          }
        }
        if (node.children?.length) matchPartition(node.children, targets)
      }
    }
    matchPartition(devPartitionData.value, item.devPartition ?? [])
  }, 500)
}

function openAddForm() {
  dialogFormVisible.value = true
  checkAll.value = false; isIndeterminate.value = false
  checkAll1.value = false; isIndeterminate1.value = false
}

// ── API：新增角色 ───────────────────────────────────────────
async function addRole() {
  const funcGroupIds: number[] = []
  const devPartitionIds: number[] = []
  for (const n of treeRef.value?.getCheckedNodes() ?? [])
    if (n.id && !n.children) funcGroupIds.push(n.id)
  for (const n of tree1Ref.value?.getCheckedNodes() ?? [])
    if (n.id && !n.children) funcGroupIds.push(n.id)
  for (const n of devPartitionTreeRef.value?.getCheckedNodes() ?? [])
    if (n.devPartitionId) devPartitionIds.push(n.devPartitionId)
  const res: any = await axios({
    url: '/uapi/v1/Role/Item', method: 'POST',
    data: { roleName: addForm.roleName, description: addForm.description, funcGroupIds, devPartitionIds },
  })
  if (res.status === 200 && res.data.msg === 'Success') {
    dialogFormVisible.value = false
    roleList()
    ElMessage({ message: t('CommTableEdit.comm_add_successfully'), type: 'success', duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_add_failed'), type: 'error', duration: 5000 })
  }
}

// ── 点击编辑 ───────────────────────────────────────────────
function handleClick(_index: number, row: any) {
  checkAll.value = false; checkAll1.value = false
  defaultList.value = []; defaultList2.value = []; devPartitionDefaultList.value = []
  editForm.roleId = row.roleId
  editForm.roleName = row.roleName
  editForm.description = row.description
  roleItem(row.roleId)
  editPopup.value = true
}

// ── API：编辑角色 ───────────────────────────────────────────
async function editRole() {
  const funcGroupIds: number[] = []
  const devPartitionIds: number[] = []
  for (const n of treeRef.value?.getCheckedNodes() ?? [])
    if (n.id && !n.children) funcGroupIds.push(n.id)
  for (const n of tree1Ref.value?.getCheckedNodes() ?? [])
    if (n.id && !n.children) funcGroupIds.push(n.id)
  for (const n of devPartitionTree1Ref.value?.getCheckedNodes() ?? [])
    if (n.devPartitionId) devPartitionIds.push(n.devPartitionId)
  editPopup.value = false
  const res: any = await axios({
    url: `/uapi/v1/Role/Item/${editForm.roleId}`, method: 'PUT',
    data: { roleName: editForm.roleName, description: editForm.description, funcGroupIds, devPartitionIds },
  })
  if (res.status === 200 && res.data.msg === 'Success') {
    roleList()
    ElMessage({ message: t('CommTableEdit.comm_edit_successfully'), type: 'success', duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_edit_failed'), type: 'error', duration: 5000 })
  }
}

function editDialogClose() {
  tree1Ref.value?.setCheckedKeys([])
  editPopup.value = false
}

// ── 角色配置 ────────────────────────────────────────────────
function openConfiguration(_index: number, row: any) {
  eltitle.value = t('CommTableEdit.comm_configuration')
  Object.assign(configForm, {
    roleId: row.roleId,
    passwordLength: row.passwordLength,
    userLockTime: row.userLockTime,
    userLockLimit: row.userLockLimit,
    userLockTimeAgain: row.userLockTimeAgain,
    passwordExpiryTime: row.passwordExpiryTime,
    passwordAlertTime: row.passwordAlertTime,
    passwordExpiryChange: row.passwordExpiryChange,
    passwordRule: row.passwordRule,
    passwordFirstChange: row.passwordFirstChange,
  })
  RoleConfDialog.value = true
}

async function roleConfOK() {
  const res: any = await axios({
    url: `/uapi/v1/Role/Config/${configForm.roleId}`, method: 'PUT',
    data: {
      passwordLength: Number(configForm.passwordLength),
      userLockTime: Number(configForm.userLockTime),
      userLockLimit: Number(configForm.userLockLimit),
      userLockTimeAgain: Number(configForm.userLockTimeAgain),
      passwordExpiryTime: Number(configForm.passwordExpiryTime),
      passwordAlertTime: Number(configForm.passwordAlertTime),
      passwordExpiryChange: configForm.passwordExpiryChange,
      passwordRule: configForm.passwordRule,
      passwordFirstChange: configForm.passwordFirstChange,
    },
  })
  if (res.status === 200 && res.data.msg === 'Success') {
    roleList()
    RoleConfDialog.value = false
    ElMessage({ message: t('CommTableEdit.comm_configuration_successfully'), type: 'success', duration: 5000 })
  }
}

// ── 外部 IDP ────────────────────────────────────────────────
async function getIDPList() {
  const res: any = await axios({ url: '/uapi/v1/ExternalIDP/List', method: 'GET' })
  if (res.status === 200 && res.data.code === 0) {
    IDPList.value = res.data.result.map((item: any) => ({
      id: item.id, name: item.name, claimName: item.claimName,
    }))
  }
}

function idpConfig(_index: number, row: any) {
  IDPForm.roleUUID = row.uuid
  IDPForm.claimValue = row.claimValue
  IDPForm.externalIDPId = row.externalIDPId
  const found = IDPList.value.find(i => i.id === row.externalIDPId)
  if (found) IDPForm.name = found.name
  IDPDialog.value = true
}

async function idpSubmit() {
  const res: any = await axios({
    url: '/uapi/v1/Role/ExternalIDP', method: 'PUT',
    data: { roleUUID: IDPForm.roleUUID, externalIDPId: IDPForm.externalIDPId, claimValue: IDPForm.claimValue },
  })
  if (res.status === 200 && res.data.code === 0) {
    ElMessage({ message: t('CommTableEdit.comm_configuration_successfully'), type: 'success', duration: 5000 })
    back('IDPConfig')
  }
}

// ── 删除（单行）───────────────────────────────────────────
async function deleteRow(index: number, row: any) {
  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
      confirmButtonText: t('CommTableEdit.comm_ok'),
      cancelButtonText: t('CommTableEdit.comm_cancel'),
    })
    const realIndex = (currentPage.value - 1) * pageSize.value + index
    const res: any = await axios({
      url: '/uapi/v1/Role/Item', method: 'DELETE',
      data: { ids: [row.roleId] },
    })
    if (res.status === 200 && res.data.msg === 'Success') {
      dleChangePage(1)
      tableData.value.splice(realIndex, 1)
      total.value = tableData.value.length
      ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success', duration: 5000 })
    } else {
      ElMessage({ message: t('CommTableEdit.comm_delete_failed'), type: 'error', duration: 5000 })
    }
  } catch { /* cancelled */ }
}

// ── 删除（批量）───────────────────────────────────────────
async function deleteSelect() {
  try {
    await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
      confirmButtonText: t('CommTableEdit.comm_ok'),
      cancelButtonText: t('CommTableEdit.comm_cancel'),
    })
    const ids = selectop.value.map((s: any) => s.roleId)
    const res: any = await axios({
      url: '/uapi/v1/Role/Item', method: 'DELETE',
      data: { ids },
    })
    if (res.status === 200 && res.data.msg === 'Success') {
      dleChangePage(selectop.value.length)
      roleList()
      ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success', duration: 5000 })
    } else {
      ElMessage({ message: t('CommTableEdit.comm_delete_failed'), type: 'error', duration: 5000 })
    }
  } catch { /* cancelled */ }
}

// ── 表格选中 ───────────────────────────────────────────────
function selectCall(rows: any[]) {
  selectop.value = rows.map((r: any, i: number) => ({ index: i, roleId: r.roleId }))
}
function selectAllCall(rows: any[]) {
  selectop.value = rows.map((r: any, i: number) => ({
    index: (currentPage.value - 1) * pageSize.value + i, roleId: r.roleId,
  }))
}

// ── 管理权限树 check-change ─────────────────────────────────
function caseCheckChange() {
  let checkedCount = 0, disabledCount = 0, halfFlag = false
  for (const node of treeData.value) {
    const n = treeRef.value?.getNode(node)
    if (!n) continue
    if (n.disabled) disabledCount++
    if (n.checked) checkedCount++
    if (n.indeterminate) halfFlag = true
  }
  const total = treeData.value.length
  if (checkedCount === 0) {
    checkAll.value = false
    isIndeterminate.value = halfFlag
  } else if (checkedCount + disabledCount >= total) {
    checkAll.value = true; isIndeterminate.value = false
  } else {
    checkAll.value = false; isIndeterminate.value = true
  }
}

function handleCheckAllChange() {
  isIndeterminate.value = false
  if (checkAll.value) {
    for (const node of treeData.value)
      if (!treeRef.value?.getNode(node)?.disabled)
        treeRef.value?.setChecked(node.id, true, true)
  } else {
    treeRef.value?.setCheckedKeys([])
  }
}

// ── 使用权限树 check-change ─────────────────────────────────
function caseCheckChange1() {
  let checkedCount = 0, disabledCount = 0, halfFlag = false
  for (const node of treeData2.value) {
    const n = tree1Ref.value?.getNode(node)
    if (!n) continue
    if (n.disabled) disabledCount++
    if (n.checked) checkedCount++
    if (n.indeterminate) halfFlag = true
  }
  const total = treeData2.value.length
  if (checkedCount === 0) {
    checkAll1.value = false; isIndeterminate1.value = halfFlag
  } else if (checkedCount + disabledCount >= total) {
    checkAll1.value = true; isIndeterminate1.value = false
  } else {
    checkAll1.value = false; isIndeterminate1.value = true
  }
}

function handleCheckAllChange1() {
  isIndeterminate1.value = false
  if (checkAll1.value) {
    for (const node of treeData2.value)
      if (!tree1Ref.value?.getNode(node)?.disabled)
        tree1Ref.value?.setChecked(node.id, true, true)
  } else {
    tree1Ref.value?.setCheckedKeys([])
  }
}

// ── 设备分区约束选择（添加） ────────────────────────────────
function getparentsNode(node: any) {
  if (!node.parent) return
  breadList.value.unshift(node)
}

function checkChange(node: any, checked: boolean) {
  function setChecked(arr: any[], val: boolean) {
    arr?.forEach(item => {
      devPartitionTreeRef.value?.setChecked(item.devPartitionId, val)
      if (item.children?.length) setChecked(item.children, val)
    })
  }
  breadList.value = []
  const selectNode = devPartitionTreeRef.value?.getNode(node)?.parent
  if (selectNode) getparentsNode(selectNode)
  else getparentsNode(devPartitionTreeRef.value?.getNode(node))
  if (!checked) {
    if (breadList.value[0]?.checked) {
      devPartitionTreeRef.value?.setChecked(node.devPartitionId, true)
    } else {
      setChecked(node?.children ?? [], false)
    }
  } else {
    if (node.parentId) setChecked(node?.children ?? [], true)
  }
}

// ── 设备分区约束选择（编辑） ────────────────────────────────
function checkChange1(node: any, checked: boolean) {
  function setChecked(arr: any[], val: boolean) {
    arr?.forEach(item => {
      devPartitionTree1Ref.value?.setChecked(item.devPartitionId, val)
      if (item.children?.length) setChecked(item.children, val)
    })
  }
  breadList.value = []
  const selectNode = devPartitionTree1Ref.value?.getNode(node)?.parent
  if (selectNode) getparentsNode(selectNode)
  else getparentsNode(devPartitionTree1Ref.value?.getNode(node))
  if (!checked) {
    if (breadList.value[0]?.checked) {
      devPartitionTree1Ref.value?.setChecked(node.devPartitionId, true)
    } else {
      setChecked(node?.children ?? [], false)
    }
  } else {
    if (node.parentId) setChecked(node?.children ?? [], true)
  }
}

// ── 过滤方法 ───────────────────────────────────────────────
function filterNode(value: string, data: any) {
  if (!value) return true
  return data.name?.indexOf(value) !== -1
}
function filterNode1(value: string, data: any) {
  if (!value) return true
  return data.name?.indexOf(value) !== -1
}
function filterNodeDevPartition(value: string, data: any) {
  if (!value) return true
  return data.devPartitionName?.indexOf(value) !== -1
}
function filterNodeDevPartition1(value: string, data: any) {
  if (!value) return true
  return data.devPartitionName?.indexOf(value) !== -1
}

// ── 分页 ───────────────────────────────────────────────────
function handleSizeChange(val: number) { currentPage.value = 1; pageSize.value = val }
function handleCurrentChange(val: number) { currentPage.value = val }

// ── Watch ─────────────────────────────────────────────────
watch(filterText, val => treeRef.value?.filter(val))
watch(filterText1, val => tree1Ref.value?.filter(val))
watch(filterTextDevPartition, val => devPartitionTreeRef.value?.filter(val))
watch(filterTextDevPartition1, val => devPartitionTree1Ref.value?.filter(val))
watch(() => IDPForm.name, val => {
  const item = IDPList.value.find(i => i.name === val)
  if (item) { IDPForm.externalIDPId = item.id; IDPForm.claimName = item.claimName }
})

// ── 初始化 ─────────────────────────────────────────────────
onMounted(() => {
  loadDevPartition()
  roleList()
  uscApi()
  getIDPList()
})
</script>

<style lang="scss" scoped>
.Device {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.devices_topBtn {
  padding: 10px 10px 6px;
  display: flex;
  gap: 8px;
}

.pagination {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  gap: 8px;
}

.RoterNav {
  padding: 10px 20px;
  flex: 1;
  overflow-y: auto;

  .header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 14px;
  }

  p {
    font-size: 16px;
    font-weight: 600;
    margin: 8px 0 16px;
  }

  .el-form {
    padding-left: 10px;

    .tow_node {
      width: 100%;
      display: flex;
      min-width: 400px;

      .Root_node {
        width: 100%;
        height: 400px;
        overflow: auto;
        padding: 10px;
        border: 1px solid rgba(218, 218, 218, 0.15);
        border-radius: 4px;

        .elinput { width: 100% !important; margin-bottom: 6px; }

        &::-webkit-scrollbar { width: 8px; height: 8px; }
        &::-webkit-scrollbar-thumb {
          border-radius: 5px;
          background: rgba(218, 218, 218, 0.2);
        }
        &::-webkit-scrollbar-track {
          background: rgba(218, 218, 218, 0.1);
        }
      }
    }
  }
}

.description :deep(.el-form-item__content) {
  margin-left: 0 !important;
  width: 78%;

  .el-textarea__inner { background-color: inherit !important; }
}

.button_table {
  margin-top: 16px;
}
</style>
