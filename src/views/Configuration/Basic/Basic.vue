<script lang="ts" setup>
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
    $('.basic-left').width('64px')
  } else {
    $('.basic-left').width('11%')
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
  <div class="basic-all">
    <div class="basic-left">
      <div class="collapse-box">
        <div class="collapse" @click="changeCollapse">
          <i class="iconfont icon-liebiao"></i>
        </div>
      </div>
      <el-menu
        :default-active="activeIndex"
        class="basic-menu"
        :collapse="isCollapse"
        router
        :teleported="false">
        <el-sub-menu index="/Configuration/Basic/StorageMode">
          <template #title>
            <i class="iconfont icon-cunchupeizhi"></i>
            <span>{{ t('Router.router_storage_setting') }}</span>
          </template>
          <el-menu-item index="/Configuration/Basic/StorageMode">{{ t('Router.router_storage_mode') }}</el-menu-item>
          <el-menu-item index="/Configuration/Basic/MetaStorage">{{ t('Router.router_meta_storage') }}</el-menu-item>
          <el-menu-item index="/Configuration/Basic/LocalObjectStorage">{{ t('Router.router_local_obj_storage') }}</el-menu-item>
          <el-menu-item index="/Configuration/Basic/S3Storage">{{ t('Router.router_s3_storage') }}</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
    <div class="basic-right">
      <router-view></router-view>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.basic-all {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  .basic-left {
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
  }
  .basic-right {
    // width: 88.5%;
    flex: 1;
    height: calc(100vh - 30px);
    overflow-y: auto;
    background-color: #181818;
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