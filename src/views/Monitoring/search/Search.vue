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
    $('.search-left').width('64px')
  } else {
    $('.search-left').width('11%')
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
  <div class="monitoring-search">
    <div class="search-left">
      <div class="collapse-box">
        <div class="collapse" @click="changeCollapse">
          <i class="iconfont icon-liebiao"></i>
        </div>
      </div>
      <el-menu
        :default-active="activeIndex"
        class="search-menu"
        :collapse="isCollapse"
        router
        :teleported="false">
          <el-menu-item index="/Monitoring/Search/RecordInfo">
            <i class="iconfont icon-luxianggailan" style="margin-right: 10px;"></i>
            <template #title>{{ t('Monitoring.mon_rec_info') }}</template>
          </el-menu-item>
      </el-menu>
    </div>
    <div class="search-right">
      <router-view></router-view>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.monitoring-search {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  .search-left {
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
  .search-right {
    // width: 88.5%;
    flex: 1;
    height: calc(100vh - 30px);
    overflow-y: auto;
    background-color: #181818;
  }
}
</style>