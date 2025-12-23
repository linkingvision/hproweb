
<script setup lang="ts">
import $ from 'jquery';
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const $route = useRoute();
const $router = useRouter();
const { t } = useI18n()

const isCollapse = ref<boolean>(false)
const activeIndex = ref<string>('')
const changeCollapse = () => {
  isCollapse.value = !isCollapse.value
  if (isCollapse.value) {
    $('.setting-left').width('64px')
  } else {
    $('.setting-left').width('11%')
  }
}

watch(activeIndex, (newVal) => {
  console.log('activeIndex', newVal)
  $router.push(newVal)
})

onMounted(() => {
  activeIndex.value = $route.path;
})
</script>

<template>
  <div class="setting-all">
    <div class="setting-left">
      <div class="collapse-box">
        <div class="collapse" @click="changeCollapse">
          <i class="iconfont icon-liebiao"></i>
        </div>
      </div>
      <el-menu
        :default-active="activeIndex"
        class="setting-menu"
        :collapse="isCollapse"
        router
        :teleported="false">
        <el-sub-menu index="/System/Setting/OperationLog">
          <template #title>
            <i class="iconfont icon-weihu"></i>
            <span>{{ t('System.sys_maintenance') }}</span>
          </template>
          <el-menu-item index="/System/Setting/OperationLog">{{ t('System.sys_operation_log') }}</el-menu-item>
          <el-menu-item index="/System/Setting/SystemMaintenance">{{ t('System.sys_maintenance') }}</el-menu-item>
          <el-menu-item index="/System/Setting/SystemUpgrade">{{ t('System.sys_upgrade') }}</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/System/Setting/License">
          <i class="iconfont icon-shouquanguanli"></i>
          <span>{{ t('System.sys_license') }}</span>
        </el-menu-item>
        <el-menu-item index="/System/Setting/SystemConfig">
          <i class="iconfont icon-xitongpeizhi"></i>
          <span>{{ t('System.sys_configuration') }}</span>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="setting-right">
      <router-view></router-view>
    </div>
  </div>
</template>

<style scoped lang="scss">
.setting-all {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  .setting-left {
    width: 11%;
    max-width: 278px;
    height: calc(100vh - 30px);
    background-color: #212121;
    transition: 0.4s;
    .collapse-box {
      width: 100%;
      height: 48px;
      .collapse {
        width: 64px;
        height: 48px;
        line-height: 48px;
        text-align: center;
        // background-color: #666;
        cursor: pointer;
        i {
          font-size: 20px;
        }
      }
    }
    .el-menu-item, .el-sub-menu {
      i {
        font-size: 16px;
      }
    }
  }
  .setting-right {
    // width: 88.5%;
    flex: 1;
    height: calc(100vh - 30px);
    overflow-y: auto;
    background-color: #181818;
    position: relative;
  }
}
</style>

<style lang="scss">
.el-popper {
  // background-color: #212121 !important;
  // border: none !important;
  .el-menu {
    background-color: #212121;
    .el-menu-item {
      color: #fff;
    }
    .el-menu-item:hover {
      background-color: #181818;
    }
    .is-active {
      color: #0399FE;
      border-right: #0399FE 3px solid;
      background-color: #282D33;
    }
  }
}
</style>