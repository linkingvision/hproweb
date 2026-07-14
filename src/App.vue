<script setup lang="ts">
  import { computed, onMounted, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useUserStore } from './store/user';
  import en from 'element-plus/es/locale/lang/en'
  import zhTw from 'element-plus/es/locale/lang/zh-tw'

  const { t, locale } = useI18n();
  const updateDocementTitle = () => {
    document.title = t('HProTitle.hpro_title')
  }
  const userStore = useUserStore();

  const elLocale = computed(() => locale.value === 'zhcht' ? zhTw : en)

  onMounted(() => {
    updateDocementTitle()
    let root = import.meta.env.VITE_APP_URL;
    if (!root) {
      root = window.location.protocol + '//' + window.location.host + window.location.pathname
    }
    userStore.setIPPORT(root);

    let wsroot = import.meta.env.VITE_APP_PORT;
    if (!wsroot) {
      wsroot = window.location.host;
    }
    userStore.setWSROOT(wsroot);
    })
  watch(locale, () => {
    updateDocementTitle()
  })
</script>

<template>
  <el-config-provider :locale="elLocale">
    <router-view></router-view>
  </el-config-provider>
</template>

<style lang="scss">
@use '@/assets/scss/style.scss';
</style>
