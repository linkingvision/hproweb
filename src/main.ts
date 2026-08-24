import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import i18n from '../static/i18n.ts'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/icon/iconfont.css'
import './assets/icon/iconfont.js'
import piniaPluginPersistedstate  from 'pinia-plugin-persistedstate'


const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)
app.use(pinia)

import { useStore } from './store/index.ts'
const store = useStore()
// Use persisted language from localStorage, fallback to English
const savedLang = localStorage.getItem('lang') || 'en';
type SupportedLocale = 'zhcht' | 'en' | 'pt' | 'es';
const validLocales: SupportedLocale[] = ['zhcht', 'en', 'pt', 'es'];
i18n.global.locale.value = validLocales.includes(savedLang as SupportedLocale) ? savedLang as SupportedLocale : 'en';
app.use(i18n)

app.use(router)
app.use(ElementPlus)

app.mount('#app')
