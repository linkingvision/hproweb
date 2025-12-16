import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import i18n from '../static/i18n.ts'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import Vant from 'vant';
import 'vant/lib/index.css';
import CoreuiVue from '@coreui/vue'
import './assets/icon/iconfont.css'
import './assets/icon/iconfont.js'
import piniaPluginPersistedstate  from 'pinia-plugin-persistedstate'


const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)
app.use(pinia)

import { useStore } from './store/index.ts'
const store = useStore()
i18n.global.locale.value = store.lang;
app.use(i18n)

app.use(router)
app.use(ElementPlus)
app.use(Vant)
app.use(CoreuiVue)

app.mount('#app')
