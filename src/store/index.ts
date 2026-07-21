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

  const liveviewrtc = ref<string>('WS2');
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

  // 存储类型：'DeviceStorage' | 'CentralStorage'
  const DefaultStorage = ref<string>('DeviceStorage');
  function setDefaultStorage(value: string) {
    DefaultStorage.value = value;
  }

  // 是否显示存储切换 UI（由服务端系统配置控制）
  const PlaybackShowStorageMode = ref<boolean>(false);
  function setPlaybackShowStorageMode(value: boolean) {
    PlaybackShowStorageMode.value = value;
  }

  // ─── User config extra fields ─────────────────────────────────────────────
  const watermarkstring = ref<string>('');
  function setWatermarkstring(v: string) { watermarkstring.value = v; }

  const watermarktoggle = ref<string>('false');
  function setWatermarktoggle(v: string) { watermarktoggle.value = v; }

  const devicemarktoggle = ref<string>('true');
  function setDevicemarktoggle(v: string) { devicemarktoggle.value = v; }

  const elqualitytoggle = ref<string>('true');
  function setElqualitytoggle(v: string) { elqualitytoggle.value = v; }

  const VideoBackgroundBlack = ref<string>('#222222');
  function setVideoBackgroundBlack(v: string) { VideoBackgroundBlack.value = v; }

  const VideoBackgroundWhite = ref<string>('#494A4B');
  function setVideoBackgroundWhite(v: string) { VideoBackgroundWhite.value = v; }

  const VideoBackgroundDarkblue = ref<string>('#202731');
  function setVideoBackgroundDarkblue(v: string) { VideoBackgroundDarkblue.value = v; }

  const keepAspectRatio = ref<string>('true');
  function setKeepAspectRatio(v: string) { keepAspectRatio.value = v; }

  const WebclientAutoLogoutTime = ref<string>('180');
  function setWebclientAutoLogoutTime(v: string) { WebclientAutoLogoutTime.value = v; }

  const WebclientAutoLogoutTimeEnable = ref<string>('false');
  function setWebclientAutoLogoutTimeEnable(v: string) { WebclientAutoLogoutTimeEnable.value = v; }

  const mapCluster = ref<boolean>(false);
  function setMapCluster(v: boolean) { mapCluster.value = v; }

  const CascadeLoadingLevel = ref<number>(3);
  function setCascadeLoadingLevel(v: number) { CascadeLoadingLevel.value = v; }

  const DefaultView = ref<string | number>(1);
  function setDefaultView(v: string | number) { DefaultView.value = v; }

  const H5sRtcengine = ref<string>('v1');
  function setH5sRtcengine(v: string) { H5sRtcengine.value = v; }

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
    setH264CpuDecode,
    DefaultStorage,
    setDefaultStorage,
    PlaybackShowStorageMode,
    setPlaybackShowStorageMode,
    watermarkstring, setWatermarkstring,
    watermarktoggle, setWatermarktoggle,
    devicemarktoggle, setDevicemarktoggle,
    elqualitytoggle, setElqualitytoggle,
    VideoBackgroundBlack, setVideoBackgroundBlack,
    VideoBackgroundWhite, setVideoBackgroundWhite,
    VideoBackgroundDarkblue, setVideoBackgroundDarkblue,
    keepAspectRatio, setKeepAspectRatio,
    WebclientAutoLogoutTime, setWebclientAutoLogoutTime,
    WebclientAutoLogoutTimeEnable, setWebclientAutoLogoutTimeEnable,
    mapCluster, setMapCluster,
    CascadeLoadingLevel, setCascadeLoadingLevel,
    DefaultView, setDefaultView,
    H5sRtcengine, setH5sRtcengine,
  }
}, {
  persist: true
})