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
  <div class="header-com">
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
      <div class="avatar"
        :style="{ background: '#222', width: '24px', height: '24px', borderRadius: '50%', fontSize: '14px', textAlign: 'center', lineHeight: '24px', position: 'relative', }">
        {{ acronym }}
        <div
          style="width: 6px;height: 6px;background: #5CFF00;border-radius: 50%;position: absolute;right:2px;top:17px;">
        </div>
      </div>
      <div class="more">
        <el-dropdown trigger="click" popper-style="background-color: transparent; border: 0; box-shadow: none;">
          <i class="iconfont icon-androidgengduo"></i>
          <template #dropdown>
            <el-dropdown-menu>
              <!-- <el-dropdown-item>主题</el-dropdown-item> -->
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
import { GetSystemInfo } from '@/api/system';
import { useUserStore } from '@/store/user';
import { useI18n } from 'vue-i18n';

const store = useStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n();

// const Router = ref('');
const RouterList = ref<any>([])

const activeRouter = ref('Liveview')

const acronym = ref('')
acronym.value = userStore.username.charAt(0).toUpperCase();

const title = ref<string>('')

const aboutVisiable = ref<boolean>(false);  // 关于界面弹窗显示 / 隐藏
const information = ref<string>('') // 版本号

const handleSelect= (key: string) => {
  router.push(key)
}

const openSidebar = () => {
  store.setSidebarShow(true);
}

const logout = () => {
  router.push('/Logout');
}

const routes = () => {
  let routes: any = {
    children: router.options.routes
  }

  const matchedRoutes: any = route.matched
  title.value = t(matchedRoutes[1].meta.name);
  for (let i = 0; i < matchedRoutes.length; i++) {
    for (let k = 0; k < routes.children.length; k++) {
      if (matchedRoutes[i].name === routes.children[k].name) {
        const HomeChildren = routes.children[k].children
        if (HomeChildren) {
          for (let n = 0; n < HomeChildren.length; n++) {
            if (matchedRoutes[1]?.name === HomeChildren[n].name) {
              routes.children = HomeChildren[n].children
            }
          }
        }
      }
    }
  }
  return routes.children
}

const getRouterList = () => {
  RouterList.value = [];
  let routelist = routes();
  for (const k in routelist) {
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
  // const 
  let res:any = await KeepAlive();
  if (res.status == 200 && res.data.code == 0) {
    console.log('keepSession =>', res)
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

const path = computed(() => route.fullPath);

watch(path, (newVal) => {
  getRouterList()
  // activeRouter.value = newVal;
  getAtciveRouter(newVal)
})

onMounted(() => {
  userStore.setSetIntervalKeepAlive(setInterval(() => KeepSession(), 60 * 1000))
  getRouterList();
  getAtciveRouter(route.fullPath);
  SystemInfo()
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
  background-color: #2C2C2C;
  .header-left {
    width: 256px;
    height: 100%;
    // background-color: grey;
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
      border-right: 2px solid #4A4A4A;
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
        
        .el-menu-item {
          color: #fff;
          span {
            line-height: 20px;
            margin-left: 5px;
          }
        }
        .el-menu-item:hover, .el-menu-item:focus {
          background-color: rgba($color: #fff, $alpha: 0.2);
          color: #fff;
        }
        .is-active {
          span, i {
            color: #0399FE;
          }
        }
      }
    }
  }
  .header-right {
    width: 256px;
    height: 100%;
    // background-color: skyblue;
    display: flex;
    justify-content: right;
    align-items: center;
    div {
      margin-right: 10px;
      width: 30px;
      cursor: pointer;
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
  // .el-dialog__header {

  // }
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