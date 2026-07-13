import { defineStore } from "pinia";
import { ref, computed } from 'vue';

export const useStore = defineStore('main', () =>{
  // i18n locale
  const lang = ref<"en" | "zhchs" | "zhcht" | "pt" | "es">('en');
  function changeLang(newLang: "en" | "zhchs" | "zhcht" | "pt" | "es") {
    lang.value = newLang;
  }

  // UI theme
  type ThemeType = 'darkblue' | 'c-dark-theme' | false
  const darkMode = ref<ThemeType>('c-dark-theme')
  function setDarkMode(value: ThemeType) {
    darkMode.value = value;
  }

  // Sidebar visibility
  const sidebarShow = ref<boolean>(false)
  function setSidebarShow(flag: boolean) {
    sidebarShow.value = flag;
  }

  // App version
  const version = ref<string>('');
  function setVersion(value: string) {
    version.value = value;
  }

  const liveviewrtc = ref<string>('WS');
  function setLiveviewrtc(value: string) {
    liveviewrtc.value = value;
  }

  const liveviewrtc1 = ref<string>('RTC');
  function setLiveviewrtc1(value: string) {
    liveviewrtc1.value = value;
  }

  const RBufferTime = ref<number>(0);
  function setRBufferTime(value: number) {
    RBufferTime.value = value;
  }

  const H264CpuDecode = ref<string | boolean>('false');
  function setH264CpuDecode(value: string | boolean) {
    H264CpuDecode.value = value;
  }

  return {
    lang,
    changeLang,
    darkMode,
    setDarkMode,
    sidebarShow,
    setSidebarShow,
    version,
    setVersion,
    liveviewrtc,
    setLiveviewrtc,
    liveviewrtc1,
    setLiveviewrtc1,
    RBufferTime,
    setRBufferTime,
    H264CpuDecode,
    setH264CpuDecode
  }
}, {
  persist: true
})