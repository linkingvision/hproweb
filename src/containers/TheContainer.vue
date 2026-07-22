<script setup lang="ts">
import { useStore } from '../store';
import TheSidebar from './TheSidebar.vue';
import TheHeader from './TheHeader.vue';
import { onMounted, watch } from 'vue';

const store = useStore();

let prevClass: string | null = null;
const updateBodyTheme = (theme: string) => {
  console.log('updateBodyTheme =>', theme);
  const body = document.body;
  if (prevClass && body.classList.contains(prevClass)) {
    body.classList.remove(prevClass)
  }
  if (theme) {
    body.classList.add(theme);
    prevClass = theme;
  }
  // else {
  //   body.classList.add('c-light-theme');
  //   prevClass = 'c-light-theme'
  // }
}

watch(() => store.darkMode, (newVal: any) => {
  updateBodyTheme(newVal)
}, { immediate: true })
</script>

<template>
  <div class="c-app">
    <TheSidebar></TheSidebar>
    <div class="the-container">
      <TheHeader></TheHeader>
      <router-view></router-view>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.c-app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.the-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>