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
        :default-openeds="[]"
        class="basic-menu"
        :collapse="isCollapse"
        router
        :teleported="false">
        <el-menu-item index="/Configuration/Basic/DevicePartition">
          <i class="iconfont icon-shebeifenqu"></i>
          <span>{{ t('Router.router_device_partition') }}</span>
        </el-menu-item>
        <el-menu-item index="/Configuration/Basic/Role">
          <i class="iconfont icon-jiaose1"></i>
          <span>{{ t('Configuration.conf_role') }}</span>
        </el-menu-item>
        <el-menu-item index="/Configuration/Basic/Group">
          <i class="iconfont icon-zuzhi1"></i>
          <span>{{ t('Configuration.conf_group') }}</span>
        </el-menu-item>
        <el-menu-item index="/Configuration/Basic/View">
          <i class="iconfont icon-shitu2"></i>
          <span>{{ t('Configuration.conf_view') }}</span>
        </el-menu-item>
        <el-menu-item index="/Configuration/Basic/Map">
          <i class="iconfont icon-ditu"></i>
          <span>{{ t('Configuration.conf_map') }}</span>
        </el-menu-item>
        <el-menu-item index="/Configuration/Basic/TimeTemplate">
          <i class="iconfont icon-jihuamoban"></i>
          <span>{{ t('Configuration.conf_time_template') }}</span>
        </el-menu-item>
        <el-sub-menu index="/Configuration/Basic/StorageMode">
          <template #title>
            <i class="iconfont icon-cunchupeizhi"></i>
            <span>{{ t('Router.router_storage_setting') }}</span>
          </template>
          <el-menu-item index="/Configuration/Basic/RecordingTemplate">{{ t('Router.router_recording_plan') }}</el-menu-item>
          <el-menu-item index="/Configuration/Basic/SnapshotTemplate">{{ t('Router.router_snapshot_plan') }}</el-menu-item>
          <el-menu-item index="/Configuration/Basic/StorageMode">{{ t('Router.router_storage_mode') }}</el-menu-item>
          <el-menu-item index="/Configuration/Basic/RegularStorage">{{ t('Router.router_regular_storage') }}</el-menu-item>
          <el-menu-item index="/Configuration/Basic/ArchiveStorage">{{ t('Configuration.conf_archive_storage') }}</el-menu-item>
          <el-menu-item index="/Configuration/Basic/LocalObjectStorage">{{ t('Router.router_local_obj_storage') }}</el-menu-item>
          <el-menu-item index="/Configuration/Basic/MetaStorage">{{ t('Router.router_meta_storage') }}</el-menu-item>
          <el-menu-item index="/Configuration/Basic/S3Storage">{{ t('Router.router_s3_storage') }}</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="/Configuration/Basic/User/UserConfig">
          <template #title>
            <i class="iconfont icon-yonghu"></i>
            <span>{{ t('Router.router_user') }}</span>
          </template>
          <el-menu-item index="/Configuration/Basic/User/UserConfig">{{ t('Router.router_user_config') }}</el-menu-item>
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
    background-color: #181818;
    transition: 0.4s;
    .collapse-box {
      width: 100%;
      height: 48px;
      .collapse {
        width: 64px;
        height: 48px;
        line-height: 48px;
        text-align: center;
        cursor: pointer;
        i {
          font-size: 20px;
        }
      }
    }
    .el-menu-item, .el-sub-menu {
      i {
        font-size: 16px;
        margin-right: 10px;
      }
    }
  }
  .basic-right {
    flex: 1;
    height: calc(100vh - 30px);
    overflow-y: auto;
    background-color: #181818;
  }
}
</style>

<style lang="scss">
.basic-left {
  .el-menu {
    background-color: transparent;
    border: none;
  }
  .el-menu-item.is-active {
    color: #0399FE !important;
    background-color: rgba(3, 153, 254, 0.2) !important;
    border-right: 2px solid #0399FE !important;
    span, i { color: #0399FE; }
  }
  .el-sub-menu.is-active > .el-sub-menu__title {
    color: #0399FE !important;
    span, i { color: #0399FE; }
  }
  .el-menu-item:hover,
  .el-sub-menu__title:hover {
    background-color: rgba(3, 153, 254, 0.08) !important;
  }
  .el-popper {
    .el-menu {
      background-color: #181818;
      .el-menu-item { color: #fff; }
      .el-menu-item:hover { background-color: rgba(3, 153, 254, 0.08); }
      .is-active {
        color: #0399FE;
        border-right: 2px solid #0399FE;
        background-color: rgba(3, 153, 254, 0.2);
      }
    }
  }
}
</style>