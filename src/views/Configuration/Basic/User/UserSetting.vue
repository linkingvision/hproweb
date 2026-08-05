<template>
  <div class="UserSetting">
    <div class="UserSetting_title">{{ t('SetUser.set_basic_information') }}</div>

    <!-- 头像区域 -->
    <div class="avatar-wrap">
      <el-upload action="" :show-file-list="false" :before-upload="beforeUpload" :http-request="uploadAvatar" accept="image/*">
        <div class="avatar-box">
          <img v-if="avatar" :src="avatar" class="avatar-img" />
          <div v-else class="avatar-circle" :style="{ background }">
            {{ acronym }}
            <div class="avatar-camera-icon"><i class="iconfont icon-xiangji"></i></div>
          </div>
          <div v-if="avatar" class="avatar-camera-icon"><i class="iconfont icon-xiangji"></i></div>
        </div>
      </el-upload>
    </div>

    <el-form class="el_form" label-position="left" label-width="90px">
      <el-form-item :label="t('CommLogin.comm_login_username')">
        <el-input v-model="form.username" :disabled="form.username === 'admin'"></el-input>
      </el-form-item>
      <el-form-item :label="t('Configuration.conf_role')">
        <el-select v-model="form.roleId" :placeholder="t('Common.comm_please_select')"
          :disabled="form.username === 'admin'" style="width:100%;">
          <el-option v-for="item in roleList" :key="item.roleId" :label="item.roleName" :value="item.roleId"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="t('Configuration.conf_group')">
        <el-popover ref="groupPopoverRef" placement="bottom" :width="350" trigger="click">
          <el-input :placeholder="t('Common.comm_filtration')" v-model="filterText"
            style="margin-bottom:10px;">
            <template #prefix><i class="iconfont icon-sousuo1"></i></template>
          </el-input>
          <el-tree :data="groupTreeData" node-key="groupId" :filter-node-method="filterNode"
            ref="groupTreeRef" @node-click="handleGroupNodeClick"
            :props="groupTreeProps" :empty-text="t('CommTable.comm_no_data_available')">
            <template #default="{ data }">
              <i :class="data.iconclass" style="font-size:14px;"></i>
              <span style="padding-left:4px;">{{ data.groupName }}</span>
            </template>
          </el-tree>
          <template #reference>
            <el-input v-model="form.groupName" :placeholder="t('Common.comm_please_select')" readonly></el-input>
          </template>
        </el-popover>
      </el-form-item>
      <el-form-item label="Email">
        <el-input v-model="form.email"></el-input>
      </el-form-item>
      <el-form-item :label="t('Common.comm_description')">
        <el-input type="textarea" :rows="3" v-model="form.description"></el-input>
      </el-form-item>
      <el-form-item :label="t('Common.comm_enable')">
        <el-switch v-model="form.enabled" :disabled="form.username === 'admin'"></el-switch>
      </el-form-item>
    </el-form>

    <div class="devices_topBtn">
      <el-button class="form_butt1" @click="loadUserInfo">{{ t('CommTableEdit.comm_cancel') }}</el-button>
      <el-button class="form_butt" type="primary" @click="updateUser" style="margin-left:15px;">
        {{ t('CommTableEdit.comm_save') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import axios from '@/api/http'

const { t } = useI18n()
const userStore = useUserStore()

const avatar     = ref('')
const acronym    = ref('')
const background = ref('#222222')

const form = reactive({
  userId: 0, username: '', roleId: '' as any,
  groupId: '' as any, groupName: '', email: '',
  description: '', enabled: true, avatar: '',
})

const roleList       = ref<any[]>([])
const groupTreeData  = ref<any[]>([])
const groupTreeProps = { children: 'children', label: 'groupName' }
const filterText     = ref('')
const groupTreeRef   = ref<any>(null)
const groupPopoverRef = ref<any>(null)

watch(filterText, v => groupTreeRef.value?.filter(v))

function filterNode(value: string, data: any) {
  if (!value) return true
  return data.groupName?.includes(value)
}

function handleGroupNodeClick(data: any) {
  groupPopoverRef.value?.hide()
  form.groupId   = data.groupId
  form.groupName = data.groupName
}

async function loadGroupTree() {
  const res: any = await axios({ url: '/uapi/v1/Group/List?pageSize=100000', method: 'GET' })
  if (res.status === 200) {
    groupTreeData.value = res.data.result?.list ?? res.data.result ?? []
  }
}

async function loadRoles() {
  const res: any = await axios({ url: '/uapi/v1/Role/List?pageSize=100000', method: 'GET' })
  if (res.status === 200) {
    roleList.value = (res.data.result?.list ?? []).map((r: any) => ({ roleId: r.roleId, roleName: r.name ?? r.roleName }))
  }
}

async function loadUserInfo() {
  try {
    const res: any = await axios({ url: `/uapi/v1/User/Item?username=${userStore.username}`, method: 'GET' })
    if (res.status === 200 && res.data.msg === 'Success') {
      const item = res.data.result
      avatar.value     = item.avatar     || ''
      acronym.value    = item.acronym    || userStore.username.charAt(0).toUpperCase()
      background.value = item.background || '#222222'
      Object.assign(form, {
        userId: item.userId, username: item.username, roleId: item.roleId,
        groupId: item.groupId, email: item.email,
        description: item.description, enabled: item.enabled, avatar: item.avatar || '',
      })
      // resolve group name
      if (groupTreeData.value.length) {
        form.groupName = findGroupName(groupTreeData.value, item.groupId) || ''
      }
    }
  } catch (e) { console.warn('[UserSetting] loadUserInfo', e) }
}

function findGroupName(list: any[], id: any): string {
  for (const item of list) {
    if (item.groupId === id) return item.groupName
    if (item.children?.length) {
      const found = findGroupName(item.children, id)
      if (found) return found
    }
  }
  return ''
}

// 头像上传：读取为 base64 后直接保存
function beforeUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  if (!isImage) ElMessage({ message: t('SetUser.set_support_images'), type: 'warning' })
  return isImage
}

function uploadAvatar(opts: any) {
  const reader = new FileReader()
  reader.readAsDataURL(opts.file)
  reader.onload = () => {
    avatar.value      = reader.result as string
    form.avatar       = reader.result as string
  }
}

async function updateUser() {
  const res: any = await axios({
    url: `/uapi/v1/User/Item/${form.userId}`, method: 'PUT',
    data: {
      username: form.username, roleId: form.roleId, avatar: form.avatar,
      email: form.email, groupId: form.groupId,
      description: form.description, enabled: form.enabled,
    },
  })
  if (res.status === 200 && res.data.msg === 'Success') {
    await loadUserInfo()
    ElMessage({ message: t('CommTableEdit.comm_modify_successfully'), type: 'success', duration: 5000 })
  } else {
    ElMessage({ message: t('CommTableEdit.comm_modify_failed'), type: 'error', duration: 5000 })
  }
}

onMounted(async () => {
  await Promise.all([loadGroupTree(), loadRoles()])
  await loadUserInfo()
})
</script>

<style lang="scss" scoped>
.UserSetting {
  margin-left: 10px; padding: 20px; padding-left: 50px;
  width: 100%; height: 98%; margin-top: 14px; position: relative;

  .UserSetting_title { font-size: 16px; font-weight: bold; margin-bottom: 20px; }

  .avatar-wrap { margin-bottom: 20px;
    .avatar-box { position: relative; width: 70px; height: 70px; cursor: pointer;
      .avatar-img { width: 70px; height: 70px; border-radius: 50%; object-fit: cover; }
      .avatar-circle {
        width: 70px; height: 70px; border-radius: 50%; font-size: 30px;
        text-align: center; line-height: 70px; color: #fff; position: relative;
      }
      .avatar-camera-icon {
        width: 20px; height: 20px; background: #222; border-radius: 50%;
        position: absolute; right: 0; bottom: 0;
        box-shadow: 0 0 0 3px #222; display: flex; align-items: center; justify-content: center;
        i { font-size: 12px; color: #177DDC; }
      }
    }
  }

  .el_form { width: 26%; padding-bottom: 20px;
    .el-select { width: 100%; }
  }

  .devices_topBtn { width: 26%; display: flex; justify-content: flex-end; }
}

.form_butt  { height: 28px; padding: 0 14px; background: #019afd !important; color: #fff !important; border: none !important; }
.form_butt1 { height: 28px; padding: 0 14px; background: transparent !important; color: #fff !important; border: 1px solid #019afd !important; }
</style>
