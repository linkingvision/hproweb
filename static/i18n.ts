import { createI18n } from "vue-i18n";
import LangEn from './lang/en.json';
import LangZhCHT from './lang/zh-tw.json'
import LangPT from './lang/pt.json'
import LangES from './lang/es.json'

const i18n = createI18n({
  legacy: false,  // you must set `false`, to use Composition API
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    'en': LangEn,
    'zhcht': LangZhCHT,
    'pt': LangPT,
    'es': LangES,
  },
  runtimeOnly: false
})

export default i18n;