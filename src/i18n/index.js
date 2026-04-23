import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from './locales/zh.json'
import en from './locales/en.json'

export const I18N_STORAGE_KEY = 'i18n_lang'

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(I18N_STORAGE_KEY) : null
const initial = saved === 'en' || saved === 'zh' ? saved : 'zh'

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: initial,
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(I18N_STORAGE_KEY, lng)
  } catch {
    /* ignore */
  }
})

export default i18n
