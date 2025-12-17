<script setup lang="ts">
  import { onMounted, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useUserStore } from './store/user';

  const { t, locale } = useI18n();
  const updateDocementTitle = () => {
    document.title = t('HProTitle.hpro_title')
  }
  const userStore = useUserStore();
  
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
  onMounted(() => {
    console.log('length ==== >>>>>>', document.getElementsByTagName('*').length)
  })
</script>

<template>
  <router-view></router-view>
</template>

<style lang="scss">
@use '@/assets/scss/style.scss';
</style>
