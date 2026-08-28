<template>
  <el-dialog v-model="aboutVisiable" width="25%" class="about-dialog" center>
    <div class="about_flex">
      <div v-if="store.darkMode === 'c-dark-theme'">
        <img src="../assets/imgs/logo_black_en.svg" alt="">
      </div>
      <div v-else>
        <img src="../assets/imgs/logo_white_en.svg" alt="">
      </div>
      <div class="version">
        <div>{{ t('Common.comm_version') + '：' + information }}</div>
      </div>
    </div>
  </el-dialog>
  <div class="header-com" :class="store.darkMode">
    <div class="header-left">
      <i class="iconfont icon-hanbaobao" @click="openSidebar"></i>
      <img v-if="store.lang === 'en' && store.darkMode" src="../assets/imgs/HPro_Logo_black_en.svg" alt="">
      <img v-if="store.lang === 'en' && !store.darkMode" src="../assets/imgs/HPro_Logo_white_en.svg" alt="">
    </div>
    <div class="header-center">
      <div class="header-title">{{ title }}</div>
      <div class="header-nav">
        <el-menu
          :default-active="activeRouter"
          class="haeder-nav-menu"
          mode="horizontal"
          @select="handleSelect">
          <el-menu-item :index="item.title" v-for="(item, index) in RouterList" :key="index">
            <i :class="item.iconfont"></i>
            <span>{{ item.label }}</span>
          </el-menu-item>
        </el-menu>
      </div>
    </div>
    <div class="header-right">
      <div class="alarm-entry" @click="openAlarmPopup">
        <el-badge :value="alarmStore.newCount" :hidden="alarmStore.newCount === 0" :max="999">
          <i style="color: #fff; font-size: 16px;" class="iconfont icon-lingdang"></i>
        </el-badge>
      </div>
      <div v-if="avatar">
        <img :src="avatar" alt="" width="24px" height="24px">
      </div>
      <div v-else class="avatar"
        :style="{ background: background, color: avatarColor, width: '24px', height: '24px', borderRadius: '50%', fontSize: '14px', textAlign: 'center', lineHeight: '24px', position: 'relative', }">
        {{ acronym }}
        <div
          style="width: 6px;height: 6px;background: #5CFF00;border-radius: 50%;position: absolute;right: -10px;bottom: 0px;">
        </div>
      </div>
      <div class="more">
        <el-dropdown trigger="click" popper-style="background-color: transparent; border: 0; box-shadow: none;">
          <i style="font-size: 16px;" class="iconfont icon-androidgengduo"></i>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="router.push('/Configuration/Basic/User/UserConfig')">{{ t('SetUser.set_user_config') }}</el-dropdown-item>
              <el-dropdown-item @click="aboutVisiable = true">{{ t('Header.header_about') }}</el-dropdown-item>
              <el-dropdown-item @click="logout">{{ t('Login.login_out') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStore } from '@/store';
import { useRouter, useRoute } from 'vue-router';
import { onMounted, ref, nextTick, onBeforeMount, watch, computed } from 'vue';
import { KeepAlive } from '@/api/userApi';
import { GetSystemInfo, GetSysConfigApi, GetUserConfigApi } from '@/api/system';
import { useUserStore } from '@/store/user';
import { useAlarmStore } from '@/store/alarm';
import { GetAlarmEventStateCountApi } from '@/api/alarmEvent';
import { useI18n } from 'vue-i18n';
import getOppositeColor from '@/views/public/OppositeColor';

const store = useStore()
const userStore = useUserStore()
const alarmStore = useAlarmStore()
const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n();

const RouterList = ref<any>([])

const activeRouter = ref('Liveview')

const acronym = ref('')
acronym.value = userStore.username.charAt(0).toUpperCase();

const avatar = ref('')
const background = ref('#70CFC9')
const avatarColor = ref('#8F3036')

const title = ref<string>('')

const aboutVisiable = ref<boolean>(false);
const information = ref<string>('')

const handleSelect= (key: string) => {
  router.push(key)
}

const openSidebar = () => {
  store.setSidebarShow(true);
}

const logout = () => {
  router.push('/Logout');
}

const openAlarmPopup = () => {
  alarmStore.openPopup(1)
}

const loadAlarmCount = async () => {
  if (!userStore.username) return
  try {
    const res = await GetAlarmEventStateCountApi(userStore.username)
    if (res.status === 200 && res.data.code === 0) {
      alarmStore.setStateCounts(res.data.result || {})
    }
  } catch (error) {
    console.warn('[TheHeader] load alarm count failed', error)
  }
}

const routes = () => {
  const matchedRoutes: any = route.matched
  if (!matchedRoutes || matchedRoutes.length < 2) return []

  // matchedRoutes[1] is the top-level navigation route (e.g. Monitoring, Configuration)
  const parentRoute = matchedRoutes[1]
  if (parentRoute?.meta?.name) {
    title.value = t(parentRoute.meta.name)
  }
  return parentRoute?.children || []
}

const getRouterList = () => {
  RouterList.value = [];
  let routelist = routes();
  for (const k in routelist) {
    if (routelist[k].meta?.hidden) continue;
    var data = {
      label: t(routelist[k].meta.name),
      name: routelist[k].meta.name,
      title: routelist[k].meta.title,
      value: routelist[k].path,
      index: k,
      iconfont: routelist[k].meta.icon,
    }
    RouterList.value.push(data);
  }
}
const  KeepSession = async () => {
  let res:any = await KeepAlive();
  if (res.status == 200 && res.data.code == 0) {
  }
}

const getAtciveRouter = (path: string) => {
  const parts = path.split('/').filter(Boolean);
  if (parts.length > 2) {
    activeRouter.value = '/' + parts[0] + '/' + parts[1]
  } else {
    activeRouter.value = path
  }
}

const SystemInfo = async () => {
  let res = await GetSystemInfo();
  if (res.status == 200 && res.data.code == 0) {
    information.value = res.data.result.version;
    store.setVersion(res.data.result.version)
  }
}

// Fetch storage config from server (UserConfig: DefaultStorage / DefaultView; SysConfig: PlaybackShowStorageMode)
const initStorageConfig = async () => {
  try {
    const [userRes, sysRes] = await Promise.all([
      GetUserConfigApi(),
      GetSysConfigApi('all'),
    ])
    if (userRes.status === 200 && userRes.data.code === 0) {
      const list: any[] = userRes.data.result?.list ?? userRes.data.result ?? []
      const storageItem = list.find((i: any) => i.key === 'DefaultStorage')
      if (storageItem) store.setDefaultStorage(storageItem.value)
      const viewItem = list.find((i: any) => i.key === 'DefaultView')
      if (viewItem) store.setDefaultView(viewItem.value)
    }
    if (sysRes.status === 200 && sysRes.data.code === 0) {
      const list: any[] = sysRes.data.result?.list ?? sysRes.data.result ?? []
      const item = list.find((i: any) => i.key === 'PlaybackShowStorageMode')
      if (item) store.setPlaybackShowStorageMode(JSON.parse(item.value))
    }
  } catch(e) {
    console.warn('[initStorageConfig] error', e)
  }
}

const path = computed(() => route.fullPath);

watch(path, (newVal) => {
  getRouterList()
  getAtciveRouter(newVal)
})

const getUserAvatar = async () => {
  try {
    const root = userStore.IPPORT
    const url = root + "/uapi/v1/User/List?pageSize=100"
    const res = await fetch(url, { credentials: 'include' })
    if (res.ok) {
      const result = await res.json()
      if (result.msg === "Success") {
        const data = result.result.list
        const currentUser = data.find((element: any) => element.username === userStore.username)
        if (currentUser) {
          acronym.value = currentUser.acronym
          background.value = currentUser.background
          avatar.value = currentUser.avatar
          avatarColor.value = getOppositeColor(currentUser.background)
        }
      }
    }
  } catch (error) {
    console.warn('[TheHeader] get user avatar failed', error)
  }
}

onMounted(() => {
  userStore.setSetIntervalKeepAlive(setInterval(() => KeepSession(), 60 * 1000))
  getRouterList();
  getAtciveRouter(route.fullPath);
  SystemInfo()
  initStorageConfig()
  loadAlarmCount()
  getUserAvatar()
})
onBeforeMount(() => {
  userStore.setSetIntervalKeepAlive(null);
  store.setSidebarShow(false);
})
</script>

<style lang="scss" scoped>
.header-com {
  width: 100%;
  height: 30px;
  display: flex;
  background-color: #F2F1F1;
  color: #000;
  .header-title { color: #000; border-right-color: #D0D0D0; }

  &.c-dark-theme {
    background-color: #2C2C2C;
    color: #fff;
    .header-title { color: #fff; border-right-color: #4A4A4A; }
  }
  &.darkblue {
    background-color: #061E2E;
    color: #fff;
    .header-title { color: #fff; border-right-color: #1A3A4A; }
  }
  .header-left {
    width: 256px;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 10px;
    i {
      font-size: 24px;
      cursor: pointer;
      margin-right: 20px;
    }
    img {
      height: 18px;
    }
  }
  .header-center {
    flex: 1;
    height: 100%;
    display: flex;
    .header-title {
      padding-right: 20px;
      font-size: 14px;
      line-height: 20px;
      height: 20px;
      border-right: 2px solid #4A4A4A;  // color is inherited from the parent theme rules above
      margin-right: 20px;
      margin-top: 5px;
    }
    .header-nav {
      flex: 1;
      height: 100%;
      padding: 3px 0;
      .haeder-nav-menu {
        height: 100%;
        border: none;
        background-color: transparent;
        
        :deep(.el-menu-item) {
          color: #fff;
          i {
            font-size: 16px;
          }
          span {
            line-height: 20px;
          }
        }
        :deep(.el-menu-item:hover) {
          background-color: rgba($color: #fff, $alpha: 0.2);
          color: #fff;
        }
        :deep(.el-menu-item.is-active) {
          color: #0399FE !important;
          i, span {
            color: #0399FE !important;
          }
        }
      }
    }
  }
  .header-right {
    width: 256px;
    height: 100%;
    display: flex;
    justify-content: right;
    align-items: center;
    div {
      margin-right: 10px;
      width: 30px;
      cursor: pointer;
    }
    .alarm-entry {
      width: 30px;
      height: 30px;
      line-height: 30px;
      text-align: center;
      margin-right: 30px !important;
      i {
        font-size: 18px;
      }
      :deep(.el-badge__content) {
        top: 5px;
        right: 15px;
        border: none;
      }
    }
    .more {
      .example-showcase .el-dropdown-link {
        cursor: pointer;
        color: var(--el-color-primary);
        display: flex;
        align-items: center;
      }
      .el-dropdown {
        width: 30px;
        height: 30px;
        text-align: center;
        line-height: 30px;
        display: block;
      }
    }
  }
}
.el-dropdown-menu {
  background-color: #2C2C2C;
  border-radius: 0;
  :deep(.el-dropdown-menu__item) {
    color: #fff;
  }
  :deep(.el-dropdown-menu__item:hover) {
    background-color: rgba($color: #fff, $alpha: 0.2);
    color: #ccc;
  }
  :deep(.el-dropdown-menu__item:focus) {
    background-color: rgba($color: #fff, $alpha: 0.2);
    color: #ccc;
  }
}
</style>

<style lang="scss">
.about-dialog {
  background-color: #222 !important;
  padding: 0 !important;
  height: 320px;
  background-image: url('../assets/imgs/Header_on.png') !important;
  background-size: 100% 100% !important;
  .el-dialog__body {
    .about_flex {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;

      img {
        margin-top: 100px;
        margin-left: 80px;
        height: 40px;
      }
      .version {
        color: #fff;
        margin-top: 80px;
      }
    }
  }
}
</style>