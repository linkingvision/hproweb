<template>
  <div class="sidebar-com" :class="store.sidebarShow ? '' : 'sidebar-hide'" ref="sidebarRef">
    <div class="sidebar-logo" v-if="store.darkMode">
      <img :src="store.lang === 'en' ? LogoBlackEN : ''" alt="">
    </div>
    <div class="sidebar-logo" v-else>
      <img :src="store.lang === 'en' ? LogoWhiteEN : ''" alt="">
    </div>
    <el-menu
      :default-active="activeIndex"
      class="el-menu-vertical-demo"
    >
      <el-menu-item index="/Monitoring" @click="gotoPage('/Monitoring')">
        <i class="iconfont icon-chakan"></i>
        <span>{{ t('Router.router_monitoring') }}</span>
      </el-menu-item>
      <el-menu-item index="/Configuration" @click="gotoPage('/Configuration')">
        <i class="iconfont icon-peizhi"></i>
        <span>{{ t('Router.router_configuration') }}</span>
      </el-menu-item>
      <!-- <el-menu-item index="/Analytics" @click="gotoPage('/Analytics')">
        <i class="iconfont icon-fenxipeizhi"></i>
        <span>{{ '分析' }}</span>
      </el-menu-item> -->
      <el-menu-item index="/System" @click="gotoPage('/System')">
        <i class="iconfont icon-xitong"></i>
        <span>{{ t('System.sys_system') }}</span>
      </el-menu-item>
      <el-menu-item @click="gotoPage('/Logout')">
        <i class="iconfont icon-tuichu"></i>
        <span>{{ t('Login.login_logout') }}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch,  onMounted, onBeforeUnmount } from 'vue';
import { useStore } from '../store/index';
import { useRoute, useRouter } from 'vue-router';
import LogoBlackEN from '../assets/imgs/HPro_Logo_black_en.svg'
import LogoWhiteEN from '../assets/imgs/HPro_Logo_white_en.svg'
import { useI18n } from 'vue-i18n';

const store = useStore();
const router = useRouter();
const route = useRoute()
const { t } = useI18n();

const activeIndex = ref<string>('/Monitoring');

// 用 ref 绑定 sidebar 节点
const sidebarRef = ref<HTMLElement | null>(null)

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (sidebarRef.value && !sidebarRef.value.contains(target)) {
    store.setSidebarShow(false) // 隐藏侧边栏
  }
}

const getCurrentRouter = () => {
  const fullPath = route.fullPath;
  const parts = fullPath.split('/').filter(Boolean);
  activeIndex.value = '/' + (parts[0] || '')
}

const gotoPage = (page: string) => {
  router.push(page)
}

const show = computed(() => store.sidebarShow);

watch(show, (newVal) => {
  // console.log('sidebarShow change =>', newVal)
  if (newVal) {
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 100)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

onMounted(() => {
  getCurrentRouter();
})
</script>

<style scoped lang="scss">
.sidebar-com {
  width: 256px;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  transition: 0.3s;
  z-index: 100;
  .sidebar-logo {
    width: 100%;
    height: 56px;
    display: flex;
    justify-content: center;
    align-items: center;
    img {
      height: 20px;
    }
  }
  .el-menu {
    background-color: transparent;
    border: none;
  }
}
.sidebar-hide {
  left: -256px;
}
</style>
