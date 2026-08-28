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
    $('.device-left').width('64px')
  } else {
    $('.device-left').width('11%')
  }
}

watch(activeIndex, (newVal) => {
  console.log('activeIndex', newVal)
  $router.push(newVal)
})

watch(() => $route.path, (newPath) => {
  activeIndex.value = newPath
}, { immediate: true })
</script>

<template>
  <div class="device-all">
    <div class="device-left">
      <div class="collapse-box">
        <div class="collapse" @click="changeCollapse">
          <i class="iconfont icon-liebiao"></i>
        </div>
      </div>
      <el-menu
        :default-active="activeIndex"
        class="device-menu"
        :collapse="isCollapse"
        router
        :teleported="false">
        <el-sub-menu index="/Configuration/Device/DeviceSDK">
          <template #title>
            <i class="iconfont icon-shebeiguanli"></i>
            <span>{{ t('Device.device_management') }}</span>
          </template>
          <el-menu-item index="/Configuration/Device/DeviceSDK">{{ t('Device.device_video_device') }}</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
    <div class="device-right">
      <router-view></router-view>
    </div>
  </div>
</template>

<style scoped lang="scss">
.device-all {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  .device-left {
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
  .device-right {
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
.device-left.device-left {
  .el-menu {
    background-color: transparent;
    border: none;
    --el-menu-text-color: #FFFFFF !important;
  }
  .el-menu-item,
  .el-sub-menu__title {
    color: #FFFFFF !important;
    span { color: #FFFFFF !important; }
    i { color: #B7B7B7 !important; }
  }
  .el-menu-item.is-active,
  .el-menu--vertical .el-menu-item.is-active {
    color: #0399FE !important;
    background-color: rgba(3, 153, 254, 0.2) !important;
    border-right: 2px solid #0399FE !important;
    span { color: #0399FE !important; }
    i { color: #0399FE !important; }
  }
  .el-sub-menu.is-active > .el-sub-menu__title {
    color: #0399FE !important;
    span { color: #0399FE !important; }
    i { color: #0399FE !important; }
  }
  .el-menu-item:hover,
  .el-sub-menu__title:hover {
    background-color: rgba(3, 153, 254, 0.08) !important;
    color: #0399FE !important;
    span { color: #0399FE !important; }
    i { color: #0399FE !important; }
  }
}
.el-popper {
  .el-menu {
    background-color: #212121;
    .el-menu-item { color: #FFFFFF; }
    .el-menu-item:hover { background-color: rgba(3, 153, 254, 0.08); }
    .is-active {
      color: #0399FE;
      border-right: 2px solid #0399FE;
      background-color: rgba(3, 153, 254, 0.2);
    }
  }
}
</style>