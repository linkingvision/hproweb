<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { GetAnaEventApi } from '@/api/Analytics/setting';

const { t } = useI18n();

</script>

<template>
  <div class="event-search">
    {{ t('Analytics.ana_event_search') }}
  </div>
</template>

<style scoped lang="scss">

</style>