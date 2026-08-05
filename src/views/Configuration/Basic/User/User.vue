<template>
  <div class="dasboard_global Device">
    <!-- ── 添加用户面板 ── -->
    <div v-if="!editPopup && dialogFormVisible && !dialogVisible" class="RoterNav">
      <div class="header">
        <el-button @click="back('add')" type="text">{{ t('Configuration.conf_user') }}</el-button>
        <span style="margin:0 8px;font-size:16px;">></span>
        <span>{{ t('CommTableEdit.comm_add') }}</span>
      </div>
      <p>{{ t('CommTableEdit.comm_add') }}</p>
      <div style="display:flex;justify-content:flex-start;">
        <!-- 左侧：用户名 + 组织树 -->
        <el-form class="el_form" label-position="left" label-width="90px">
          <el-form-item :label="t('Login.login_username')">
            <el-input v-model="addForm.strUser" @input="onAddUsernameInput"></el-input>
          </el-form-item>
          <el-form-item :label="t('Configuration.conf_role')">
            <el-select v-model="addForm.roleId" :placeholder="t('Common.comm_please_select')">
              <el-option v-for="item in roleList" :key="item.roleId" :label="item.roleName" :value="item.roleId"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="t('Configuration.conf_group')" style="margin-bottom:15px;">
            <el-input v-model="addForm.groupName" disabled :placeholder="t('Common.comm_please_select')" style="margin-bottom:15px;"></el-input>
            <div class="tow_node">
              <div class="Root_node">
                <el-input :placeholder="t('Common.comm_filtration')" v-model="addFilterText">
                  <template #prefix><i class="iconfont icon-sousuo1"></i></template>
                </el-input>
                <el-tree ref="addGroupTreeRef" :data="groupTreeData" :filter-node-method="filterGroupNode"
                  :props="groupTreeProps" node-key="groupId" show-checkbox :check-strictly="true"
                  :empty-text="t('CommTable.comm_no_data_available')" @check="onAddGroupCheck"
                  :default-checked-keys="addDefaultChecked">
                  <template #default="{ data }">
                    <i :class="data.iconclass" style="font-size:14px;"></i>
                    <span style="padding-left:4px;">{{ data.groupName }}</span>
                  </template>
                </el-tree>
              </div>
            </div>
          </el-form-item>
        </el-form>
        <!-- 右侧：密码 + email + 描述 + 启用 -->
        <el-form class="el_form1" label-position="left" label-width="90px" style="width:46%;margin-left:20px;">
          <div style="display:flex;justify-content:flex-start;align-items:flex-start;">
            <el-form-item :label="t('Login.login_new_pwd')" style="word-break:normal;">
              <el-input type="password" v-model.trim="addForm.strPasswd" show-password @input="onAddPwInput"></el-input>
            </el-form-item>
            <span v-if="addPwStatus !== 'pending'" class="pw-status" :class="addPwStatus === 'pass' ? 'right' : 'error'" style="line-height:34px;">
              <i :class="addPwStatus === 'pass' ? 'el-icon-circle-check' : 'el-icon-circle-close'"></i>
              <span v-if="addPwStatus === 'fail'">{{ t('Setting.set_pw_security_low') }}</span>
            </span>
          </div>
          <span class="updateHelp">{{ t('Setting.set_pw_title') }}</span>
          <ul class="rule" style="padding-left:60px;">
            <li v-for="rule in addPwRuleList" :key="rule.key">
              <span class="rulechildren" :style="{ background: ruleColor(rule.state) }"></span>
              <span :style="{ color: ruleColor(rule.state) }">{{ rule.text }}</span>
            </li>
          </ul>
          <div style="display:flex;justify-content:flex-start;align-items:center;">
            <el-form-item :label="t('Setting.set_confirm_password')" style="word-break:normal;">
              <el-input type="password" v-model="addForm.strPasswd1" show-password @input="onAddConfirmPwInput"></el-input>
            </el-form-item>
            <span v-if="addPwConfirmOk !== null" class="pw-status" :class="addPwConfirmOk ? 'right' : 'error'" style="margin-bottom:12px;">
              <i :class="addPwConfirmOk ? 'el-icon-circle-check' : 'el-icon-circle-close'"></i>
            </span>
          </div>
          <el-form-item label="Email">
            <el-input v-model="addForm.email"></el-input>
          </el-form-item>
          <el-form-item :label="t('Common.comm_description')">
            <el-input type="textarea" v-model="addForm.description"></el-input>
          </el-form-item>
          <el-form-item :label="t('Common.comm_enable')">
            <el-switch v-model="addForm.enabled"></el-switch>
          </el-form-item>
        </el-form>
      </div>
      <div class="dialog-footer button_table" style="padding:0 20px;width:55%;display:flex;justify-content:flex-end;">
        <el-button class="form_butt1" @click="back('add')">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="addUser">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </div>
    </div>

    <!-- ── 编辑用户面板 ── -->
    <div v-if="editPopup && !dialogFormVisible && !dialogVisible" class="RoterNav">
      <div class="header">
        <el-button @click="back('edit')" type="text">{{ t('Configuration.conf_user') }}</el-button>
        <span style="margin:0 8px;font-size:16px;">></span>
        <span>{{ t('CommTableEdit.comm_edit') }}</span>
      </div>
      <p>{{ t('CommTableEdit.comm_edit') }}</p>
      <div style="display:flex;justify-content:flex-start;">
        <el-form class="el_form" label-position="left" label-width="90px">
          <el-form-item :label="t('Login.login_username')">
            <el-input v-model="editForm.strUser" disabled></el-input>
          </el-form-item>
          <el-form-item :label="t('Configuration.conf_group')" style="margin-bottom:15px;">
            <el-input v-model="editForm.groupName" disabled :placeholder="t('Common.comm_please_select')" style="margin-bottom:15px;"></el-input>
            <div class="tow_node">
              <div class="Root_node">
                <el-input :placeholder="t('Common.comm_filtration')" v-model="editFilterText">
                  <template #prefix><i class="iconfont icon-sousuo1"></i></template>
                </el-input>
                <el-tree ref="editGroupTreeRef" :data="groupTreeData" :filter-node-method="filterGroupNode1"
                  :props="groupTreeProps" node-key="groupId" show-checkbox :check-strictly="true"
                  :empty-text="t('CommTable.comm_no_data_available')" @check="onEditGroupCheck"
                  :default-checked-keys="editDefaultChecked">
                  <template #default="{ data }">
                    <i :class="data.iconclass" style="font-size:14px;"></i>
                    <span style="padding-left:4px;">{{ data.groupName }}</span>
                  </template>
                </el-tree>
              </div>
            </div>
          </el-form-item>
        </el-form>
        <el-form label-position="left" label-width="90px" style="width:29.5%;margin-left:20px;">
          <el-form-item :label="t('Configuration.conf_role')">
            <el-select :disabled="editForm.external" v-model="editForm.roleId" :placeholder="t('Common.comm_please_select')" style="width:100%;">
              <el-option v-for="item in roleList" :key="item.roleId" :label="item.roleName" :value="item.roleId"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Email">
            <el-input v-model="editForm.email" :disabled="editForm.external"></el-input>
          </el-form-item>
          <el-form-item :label="t('Common.comm_description')">
            <el-input type="textarea" v-model="editForm.description" :disabled="editForm.external"></el-input>
          </el-form-item>
          <el-form-item :label="t('Common.comm_enable')">
            <el-switch v-model="editForm.enabled" :disabled="editForm.strUser === 'admin'"></el-switch>
          </el-form-item>
        </el-form>
      </div>
      <div class="dialog-footer button_table" style="padding:0 20px;width:55%;display:flex;justify-content:flex-end;">
        <el-button class="form_butt1" @click="back('edit')">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="editUser">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </div>
    </div>

    <!-- ── 修改密码面板 ── -->
    <div v-if="dialogVisible && !editPopup && !dialogFormVisible" class="RoterNav">
      <div class="header">
        <el-button @click="back('changePw')" type="text">{{ t('Configuration.conf_user') }}</el-button>
        <span style="margin:0 8px;font-size:16px;">></span>
        <span>{{ t('Login.login_change_pwd') }}</span>
      </div>
      <p>{{ t('Login.login_change_pwd') }}</p>
      <el-form class="el_form1" label-position="left" label-width="90px" style="width:46%;">
        <el-form-item :label="t('Login.login_username')">
          <el-input disabled v-model="editForm.strUser"></el-input>
        </el-form-item>
        <div style="display:flex;justify-content:flex-start;align-items:flex-start;">
          <el-form-item :label="t('Login.login_old_pwd')" style="word-break:normal;">
            <el-input type="password" v-model="editForm.strPasswd" show-password></el-input>
          </el-form-item>
          <span v-if="oldPwError" class="error" style="margin-left:5%;line-height:40px;">{{ t('Login.login_old_pwd_err') }}</span>
        </div>
        <div style="display:flex;justify-content:flex-start;align-items:flex-start;">
          <el-form-item :label="t('Login.login_new_pwd')" style="word-break:normal;">
            <el-input type="password" v-model.trim="editForm.Newpassword" show-password @input="onChangePwInput"></el-input>
          </el-form-item>
          <span v-if="changePwStatus !== 'pending'" class="pw-status" :class="changePwStatus === 'pass' ? 'right' : 'error'" style="margin-left:5%;line-height:40px;">
            <i :class="changePwStatus === 'pass' ? 'el-icon-circle-check' : 'el-icon-circle-close'"></i>
            <span v-if="changePwStatus === 'fail'">{{ t('Setting.set_pw_security_low') }}</span>
          </span>
        </div>
        <span class="updateHelp" style="margin-left:90px;">{{ t('Setting.set_pw_title') }}</span>
        <ul class="rule" style="padding-left:40px;">
          <li v-for="rule in changePwRuleList" :key="rule.key">
            <span class="rulechildren" :style="{ background: ruleColor(rule.state) }"></span>
            <span :style="{ color: ruleColor(rule.state) }">{{ rule.text }}</span>
          </li>
        </ul>
        <div style="display:flex;justify-content:flex-start;align-items:center;">
          <el-form-item :label="t('Setting.set_confirm_password')" style="word-break:normal;">
            <el-input type="password" v-model="editForm.Newpassword1" show-password @input="onChangePwConfirmInput"></el-input>
          </el-form-item>
          <span v-if="changePwConfirmOk !== null" class="pw-status" :class="changePwConfirmOk ? 'right' : 'error'" style="margin-bottom:12px;">
            <i :class="changePwConfirmOk ? 'el-icon-circle-check' : 'el-icon-circle-close'"></i>
          </span>
        </div>
      </el-form>
      <div class="dialog-footer button_table" style="padding:0 20px;width:55%;display:flex;justify-content:flex-end;">
        <el-button class="form_butt1" @click="back('changePw')">{{ t('CommTableEdit.comm_cancel') }}</el-button>
        <el-button class="form_butt" type="primary" @click="changePassword">{{ t('CommTableEdit.comm_ok') }}</el-button>
      </div>
    </div>

    <!-- ── 用户列表 ── -->
    <div class="list-wrap" v-if="!dialogFormVisible && !editPopup && !dialogVisible">
      <div class="devices_topBtn">
        <el-button class="form_butt" @click="openAddForm" type="primary">{{ t('SetUser.set_add_user') }}</el-button>
        <el-button class="form_butt1" @click="deleteUsers">{{ t('SetUser.set_del_user') }}</el-button>
      </div>
      <div class="table-wrap">
        <el-table :data="filteredTableData" stripe @select="selectCall" @select-all="selectAllCall"
          height="100%" style="width:99.5%" :empty-text="t('CommTable.comm_no_data_available')">
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="username" :label="t('Login.login_username')" width="280"></el-table-column>
          <el-table-column prop="role" :label="t('Configuration.conf_role')" min-width="50"></el-table-column>
          <el-table-column prop="groupName" :label="t('Configuration.conf_group')" min-width="50"></el-table-column>
          <el-table-column min-width="100" :label="t('CommTableEdit.comm_operational')">
            <template #default="scope">
              <el-button v-if="!scope.row.external" @click="openChangePw(scope.row)" link size="small">{{ t('Login.login_change_pwd') }}</el-button>
              <el-button @click="openEdit(scope.row)" link size="small">{{ t('CommTableEdit.comm_edit') }}</el-button>
              <el-button @click="deleteRow(scope.row)" link size="small">{{ t('CommTableEdit.comm_delete') }}</el-button>
            </template>
          </el-table-column>
          <el-table-column width="180">
            <template #header>
              <el-input v-model="search" size="small" :placeholder="t('Common.comm_filtration')" />
            </template>
          </el-table-column>
          <el-table-column></el-table-column>
        </el-table>
      </div>
      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next, sizes, jumper"
          @size-change="handleSizeChange" @current-change="handleCurrentChange"
          :current-page="currentPage" :total="total">
        </el-pagination>
        <el-button class="GoTo" size="small">{{ t('CommTable.comm_jump') }}</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from '@/api/http'

const { t } = useI18n()

// ── 面板状态 ─────────────────────────────────────────────────
const dialogFormVisible = ref(false)
const editPopup        = ref(false)
const dialogVisible    = ref(false)
const oldPwError       = ref(false)

// ── 表格 ────────────────────────────────────────────────────
const tableData   = ref<any[]>([])
const search      = ref('')
const currentPage = ref(1)
const pageSize    = ref(10)
const total       = ref(0)
const selectop    = ref<any[]>([])

const filteredTableData = computed(() =>
  tableData.value
    .filter(d => !search.value || d.username?.toLowerCase().includes(search.value.toLowerCase()))
    .slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
)

// ── 组织树 + 角色 ────────────────────────────────────────────
const groupTreeData  = ref<any[]>([])
const roleList       = ref<any[]>([])
const groupTreeProps = { children: 'children', label: 'groupName' }

// ── 添加表单 ─────────────────────────────────────────────────
const addForm = reactive({
  strUser: 'User1', strPasswd: '', strPasswd1: '',
  roleId: '' as any, groupId: '' as any, groupName: '',
  email: 'user@example.com', description: '', enabled: true,
})
const addGroupTreeRef    = ref<any>(null)
const addFilterText      = ref('')
const addDefaultChecked  = ref<any[]>([])

// ── 编辑表单 ─────────────────────────────────────────────────
const editForm = reactive({
  strUser: '', strPasswd: '', Newpassword: '', Newpassword1: '',
  userId: 0, roleId: '' as any, groupId: '' as any, groupName: '',
  email: '', description: '', enabled: true, external: false,
})
const editGroupTreeRef   = ref<any>(null)
const editFilterText     = ref('')
const editDefaultChecked = ref<any[]>([])

// ── 密码规则状态 ─────────────────────────────────────────────
type RuleState = 'pending' | 'pass' | 'fail'

const ruleColor = (s: RuleState) => s === 'pass' ? '#80C269' : s === 'fail' ? 'red' : 'grey'

function checkPwRules(pw: string, username: string, isChangePw = false) {
  const reg1 = /(?=.*[A-Z])/
  const reg2 = /(?=.*[a-z])/
  const reg3 = /(?=.*[0-9])/
  const reg4 = /(?=(?:.*?[!@#$%*()_+^&}{:;?.]){1})/
  const reg5 = /((?:0(?=1)|1(?=2)|2(?=3)|3(?=4)|4(?=5)|5(?=6)|6(?=7)|7(?=8)|8(?=9)|9(?=0)){1,2}\d)/
  const reg6 = /((?:9(?=8)|8(?=7)|7(?=6)|6(?=5)|5(?=4)|4(?=3)|3(?=2)|2(?=1)|1(?=0)){1,2}\d)/
  const minLen = 8
  return {
    length:     (pw.length >= minLen)                               ? 'pass' : 'fail' as RuleState,
    uppercase:  reg1.test(pw)                                       ? 'pass' : 'fail' as RuleState,
    lowercase:  reg2.test(pw)                                       ? 'pass' : 'fail' as RuleState,
    number:     reg3.test(pw)                                       ? 'pass' : 'fail' as RuleState,
    special:    reg4.test(pw)                                       ? 'pass' : 'fail' as RuleState,
    sequential: (!reg5.test(pw) && !reg6.test(pw))                  ? 'pass' : 'fail' as RuleState,
    noUsername: (!username || !pw.includes(username))               ? 'pass' : 'fail' as RuleState,
    notDefault: !isChangePw ? undefined : (pw !== 'Admin12345' ? 'pass' : 'fail') as RuleState | undefined,
  }
}

function isAllPwRulesPass(rules: ReturnType<typeof checkPwRules>) {
  return Object.values(rules).every(v => v === undefined || v === 'pass')
}

// 添加用户密码状态
const addPwStatus    = ref<RuleState | 'pending'>('pending')
const addPwConfirmOk = ref<boolean | null>(null)
const addPwRuleList  = computed(() => {
  if (!addForm.strPasswd) return buildRuleList(null, false)
  return buildRuleList(checkPwRules(addForm.strPasswd, addForm.strUser), false)
})

// 修改密码状态
const changePwStatus    = ref<RuleState | 'pending'>('pending')
const changePwConfirmOk = ref<boolean | null>(null)
const changePwRuleList  = computed(() => {
  if (!editForm.Newpassword) return buildRuleList(null, true)
  return buildRuleList(checkPwRules(editForm.Newpassword, editForm.strUser, true), true)
})

function buildRuleList(rules: ReturnType<typeof checkPwRules> | null, isChangePw: boolean) {
  const base = [
    { key: 'length',     text: t('Setting.set_minimum_password_length') + '8' + t('Setting.set_characters'), state: (rules?.length     ?? 'pending') as RuleState },
    { key: 'uppercase',  text: t('Setting.set_pw_uppercase'),           state: (rules?.uppercase  ?? 'pending') as RuleState },
    { key: 'lowercase',  text: t('Setting.set_pw_lowercase'),           state: (rules?.lowercase  ?? 'pending') as RuleState },
    { key: 'number',     text: t('Setting.set_pw_number'),              state: (rules?.number     ?? 'pending') as RuleState },
    { key: 'special',    text: t('Setting.set_pw_special_character'),   state: (rules?.special    ?? 'pending') as RuleState },
    { key: 'sequential', text: t('Setting.set_pw_lnc_dec'),             state: (rules?.sequential ?? 'pending') as RuleState },
    { key: 'noUsername', text: t('Setting.set_pw_user'),                state: (rules?.noUsername ?? 'pending') as RuleState },
  ]
  if (isChangePw) base.push({ key: 'notDefault', text: t('Setting.set_not_default_pw'), state: (rules?.notDefault ?? 'pending') as RuleState })
  return base
}

// ── 输入事件处理 ──────────────────────────────────────────────
function onAddUsernameInput() {
  if (addForm.strPasswd) onAddPwInput()
}
function onAddPwInput() {
  if (!addForm.strPasswd) { addPwStatus.value = 'pending'; return }
  const rules = checkPwRules(addForm.strPasswd, addForm.strUser)
  addPwStatus.value = isAllPwRulesPass(rules) ? 'pass' : 'fail'
  if (addForm.strPasswd1) addPwConfirmOk.value = addForm.strPasswd1 === addForm.strPasswd
}
function onAddConfirmPwInput() {
  addPwConfirmOk.value = addForm.strPasswd1 === addForm.strPasswd
}
function onChangePwInput() {
  if (!editForm.Newpassword) { changePwStatus.value = 'pending'; return }
  const rules = checkPwRules(editForm.Newpassword, editForm.strUser, true)
  changePwStatus.value = isAllPwRulesPass(rules) ? 'pass' : 'fail'
  if (editForm.Newpassword1) changePwConfirmOk.value = editForm.Newpassword1 === editForm.Newpassword
}
function onChangePwConfirmInput() {
  changePwConfirmOk.value = editForm.Newpassword1 === editForm.Newpassword
}

// ── 组织树过滤 + 选中 ─────────────────────────────────────────
function filterGroupNode(value: string, data: any) {
  if (!value) return true
  return data.groupName?.includes(value)
}
function filterGroupNode1(value: string, data: any) {
  if (!value) return true
  return data.groupName?.includes(value)
}
function onAddGroupCheck(node: any, list: any) {
  if (list.checkedKeys.length >= 2) addGroupTreeRef.value?.setCheckedKeys([node.groupId])
  addForm.groupId   = node.groupId
  addForm.groupName = node.groupName
}
function onEditGroupCheck(node: any, list: any) {
  if (list.checkedKeys.length >= 2) editGroupTreeRef.value?.setCheckedKeys([node.groupId])
  editForm.groupId   = node.groupId
  editForm.groupName = node.groupName
}

watch(addFilterText,  v => addGroupTreeRef.value?.filter(v))
watch(editFilterText, v => editGroupTreeRef.value?.filter(v))

// ── 辅助：根据 id 从树中查找名称 ──────────────────────────────
function findName(list: any[], id: any, idKey: string, nameKey: string): string {
  for (const item of list) {
    if (item[idKey] === id) return item[nameKey]
    if (item.children?.length) {
      const found = findName(item.children, id, idKey, nameKey)
      if (found) return found
    }
  }
  return ''
}

// ── API：加载数据 ─────────────────────────────────────────────
async function loadUsers() {
  const res: any = await axios({ url: '/uapi/v1/User/List?pageSize=100000', method: 'GET' })
  if (res.status === 200) {
    const list = res.data.result?.list ?? []
    tableData.value = list.map((item: any, i: number) => ({
      index:       i,
      username:    item.username,
      userId:      item.userId,
      roleId:      item.roleId,
      role:        findName(roleList.value, item.roleId, 'roleId', 'roleName'),
      groupId:     item.groupId,
      groupName:   findName(groupTreeData.value, item.groupId, 'groupId', 'groupName'),
      email:       item.email,
      description: item.description,
      enabled:     item.enabled,
      external:    item.external,
    }))
    total.value = res.data.result?.count ?? tableData.value.length
  }
}

async function loadGroupTree() {
  const res: any = await axios({ url: '/uapi/v1/Group/List?pageSize=100000', method: 'GET' })
  if (res.status === 200) {
    groupTreeData.value = res.data.result?.list ?? res.data.result ?? []
    if (groupTreeData.value.length) {
      addForm.groupId   = groupTreeData.value[0].groupId
      addForm.groupName = groupTreeData.value[0].groupName
      addDefaultChecked.value = [groupTreeData.value[0].groupId]
    }
  }
}

async function loadRoles() {
  const res: any = await axios({ url: '/uapi/v1/Role/List?pageSize=100000', method: 'GET' })
  if (res.status === 200) {
    roleList.value = (res.data.result?.list ?? []).map((r: any) => ({ roleId: r.roleId, roleName: r.name ?? r.roleName }))
    if (roleList.value.length) addForm.roleId = roleList.value[0].roleId
  }
}

// ── 面板控制 ─────────────────────────────────────────────────
function back(type: 'add' | 'edit' | 'changePw') {
  if (type === 'add')      { dialogFormVisible.value = false; addDefaultChecked.value = [groupTreeData.value[0]?.groupId] }
  else if (type === 'edit')    editPopup.value = false
  else                         dialogVisible.value = false
}

function openAddForm() {
  addForm.strUser = 'User1'; addForm.strPasswd = ''; addForm.strPasswd1 = ''
  addForm.email = 'user@example.com'; addForm.description = ''; addForm.enabled = true
  addPwStatus.value = 'pending'; addPwConfirmOk.value = null
  if (roleList.value.length)       addForm.roleId = roleList.value[0].roleId
  if (groupTreeData.value.length) {
    addForm.groupId = groupTreeData.value[0].groupId
    addForm.groupName = groupTreeData.value[0].groupName
    addDefaultChecked.value = [groupTreeData.value[0].groupId]
  }
  dialogFormVisible.value = true
}

function openEdit(row: any) {
  editDefaultChecked.value = [row.groupId]
  Object.assign(editForm, {
    strUser: row.username, userId: row.userId, roleId: row.roleId,
    groupId: row.groupId, groupName: row.groupName, email: row.email,
    description: row.description, enabled: row.enabled, external: row.external,
    strPasswd: '', Newpassword: '', Newpassword1: '',
  })
  editPopup.value = true
}

function openChangePw(row: any) {
  Object.assign(editForm, { strUser: row.username, userId: row.userId, strPasswd: '', Newpassword: '', Newpassword1: '' })
  oldPwError.value = false; changePwStatus.value = 'pending'; changePwConfirmOk.value = null
  dialogVisible.value = true
}

// ── CRUD 操作 ────────────────────────────────────────────────
async function addUser() {
  const pw = addForm.strPasswd
  if (!pw) return
  if (addForm.strPasswd1 !== pw) { ElMessage(t('Setting.set_two_passwords_error')); return }
  const rules = checkPwRules(pw, addForm.strUser)
  if (!isAllPwRulesPass(rules)) return
  const res: any = await axios({
    url: '/uapi/v1/User/Item', method: 'POST',
    data: {
      username: addForm.strUser, password: encodeURIComponent(pw),
      roleId: Number(addForm.roleId), groupId: Number(addForm.groupId),
      email: addForm.email, description: addForm.description, enabled: addForm.enabled,
    },
  })
  if (res.status === 200 && res.data.msg === 'Success') {
    dialogFormVisible.value = false
    await loadUsers()
    ElMessage({ message: t('CommTableEdit.comm_add_successfully'), type: 'success', duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_add_failed'), type: 'error', duration: 5000 })
  }
}

async function editUser() {
  const res: any = await axios({
    url: `/uapi/v1/User/Item/${editForm.userId}`, method: 'PUT',
    data: {
      username: editForm.strUser, roleId: editForm.roleId,
      email: editForm.email, groupId: editForm.groupId,
      description: editForm.description, enabled: editForm.enabled,
    },
  })
  if (res.status === 200 && res.data.msg === 'Success') {
    editPopup.value = false; await loadUsers()
    ElMessage({ message: t('CommTableEdit.comm_modify_successfully'), type: 'success', duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_modify_failed'), type: 'error', duration: 5000 })
  }
}

async function changePassword() {
  const { strPasswd, Newpassword, Newpassword1, strUser } = editForm
  if (!Newpassword) return
  if (strPasswd === Newpassword) { ElMessage(t('Setting.set_pw_new_cannot_old')); return }
  if (Newpassword !== Newpassword1) { ElMessage(t('Setting.set_two_passwords_error')); return }
  const rules = checkPwRules(Newpassword, strUser, true)
  if (!isAllPwRulesPass(rules)) return
  const res: any = await axios({
    url: '/uapi/v1/User/Password/Set', method: 'PUT',
    data: { username: strUser, oldPassword: encodeURIComponent(strPasswd), newPassword: encodeURIComponent(Newpassword) },
  })
  if (res.status === 200 && res.data.msg === 'Success') {
    dialogVisible.value = false
    ElMessage({ message: t('Login.login_again_modify_success'), duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_modify_failed'), type: 'error', duration: 5000 })
  }
}

async function deleteRow(row: any) {
  await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
    confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel'),
  })
  const res: any = await axios({
    url: '/uapi/v1/User/Item', method: 'DELETE',
    data: { ids: [row.userId] },
  })
  if (res.status === 200 && res.data.msg === 'Success') {
    await loadUsers()
    ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success', duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_delete_failed'), type: 'error', duration: 5000 })
  }
}

async function deleteUsers() {
  if (!selectop.value.length) return
  await ElMessageBox.confirm(t('Common.comm_delete_confirm'), t('Common.comm_prompt'), {
    confirmButtonText: t('CommTableEdit.comm_ok'), cancelButtonText: t('CommTableEdit.comm_cancel'),
  })
  const ids = selectop.value.map(s => s.userId)
  const res: any = await axios({ url: '/uapi/v1/User/Item', method: 'DELETE', data: { ids } })
  if (res.status === 200 && res.data.msg === 'Success') {
    await loadUsers()
    ElMessage({ message: t('CommTableEdit.comm_delete_successfully'), type: 'success', duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_delete_failed'), type: 'error', duration: 5000 })
  }
}

// ── 分页 + 选中 ───────────────────────────────────────────────
function handleSizeChange(val: number) { pageSize.value = val; currentPage.value = 1 }
function handleCurrentChange(val: number) { currentPage.value = val }
function selectCall(rows: any[])    { selectop.value = rows }
function selectAllCall(rows: any[]) { selectop.value = rows }

// ── 初始化 ────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadGroupTree(), loadRoles()])
  await loadUsers()
})
</script>

<style lang="scss" scoped>
.RoterNav {
  flex: 1;
  overflow-y: auto;
  padding: 10px 20px;

  .header {
    padding: 10px 10px 0;
    .el-button { font-size: 14px; padding: 0; }
  }
  p { padding-left: 20px; font-size: 14px; font-weight: bold; margin-bottom: 10px; }

  .el_form { padding-left: 10px; width: 30%;
    .el-select { width: 100%; }
    .tow_node { width: 100%; min-width: 300px;
      .Root_node { height: 400px; overflow: auto; padding: 10px; border: 1px solid #444;
        .el-input { width: 100% !important; }
        &::-webkit-scrollbar { width: 8px; height: 8px; }
        &::-webkit-scrollbar-thumb { border-radius: 5px; background: rgba(218,218,218,0.2); }
      }
    }
  }
  .el_form1 {
    .updateHelp { margin-left: 90px; color: grey; display: block; margin-bottom: 4px; }
    .rule { list-style: none; padding-left: 60px; margin-top: 4px; margin-bottom: 12px;
      li { margin-bottom: 2px; list-style: none; display: flex; align-items: center;
        .rulechildren { height: 10px; width: 10px; border-radius: 5px; background: grey; display: inline-block; margin-right: 10px; }
      }
    }
  }
}

.dasboard_global.Device {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-wrap {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.devices_topBtn { padding: 8px 10px; display: flex; gap: 8px; flex-shrink: 0; }
.pagination { display: flex; align-items: center; padding: 8px 10px; gap: 8px; flex-shrink: 0; }

.pw-status { display: inline-flex; align-items: center; gap: 4px; margin-left: 8px; }
.right { color: #80C269; }
.error { color: #EB3700; }

.form_butt  { height: 28px; padding: 0 14px; background: #019afd; color: #fff; border: none; }
.form_butt1 { height: 28px; padding: 0 14px; background: transparent; color: #fff; border: 1px solid #019afd; }
</style>
