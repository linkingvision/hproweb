import { defineStore } from "pinia";
import { ref, computed } from 'vue';

export const useStore = defineStore('main', () =>{
  // 多语言
  const lang = ref<"en" | "zhchs" | "zhcht" | "pt" | "es">('en');
  function changeLang(newLang: "en" | "zhchs" | "zhcht" | "pt" | "es") {
    lang.value = newLang;
  }

  // 主题
  const darkMode = ref<string | boolean>('c-dark-theme')
  function setDarkMode(value: string | boolean) {
    darkMode.value = value;
  }

  // 侧边栏导航显示/隐藏
  const sidebarShow = ref<boolean>(false)
  function setSidebarShow(flag: boolean) {
    sidebarShow.value = flag;
  }

  // 版本号
  const version = ref<string>('');
  function setVersion(value: string) {
    version.value = value;
  }

  return {
    lang,
    changeLang,
    darkMode,
    setDarkMode,
    sidebarShow,
    setSidebarShow,
    version,
    setVersion
  }
}, {
  persist: true
})