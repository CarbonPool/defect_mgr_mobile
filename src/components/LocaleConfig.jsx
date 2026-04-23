import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfigProvider } from 'antd-mobile'
import zhCN from 'antd-mobile/es/locales/zh-CN'
import enUS from 'antd-mobile/es/locales/en-US'

const map = { zh: zhCN, en: enUS }

export default function LocaleConfig({ children }) {
  const { i18n } = useTranslation()
  const [lang, setLang] = useState(i18n.language || 'zh')

  useEffect(() => {
    const on = (lng) => setLang(lng)
    i18n.on('languageChanged', on)
    return () => {
      i18n.off('languageChanged', on)
    }
  }, [i18n])

  const locale = useMemo(() => {
    const base = lang?.split('-')[0] || 'zh'
    return map[base] || zhCN
  }, [lang])

  return <ConfigProvider locale={locale}>{children}</ConfigProvider>
}
