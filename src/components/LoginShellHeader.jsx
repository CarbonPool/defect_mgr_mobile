import { useTranslation } from 'react-i18next'
import arcLogo from '../assets/arc_logo.png'

export default function LoginShellHeader() {
  const { t } = useTranslation()
  return (
    <header className="login-shell-header">
      <div className="login-shell-header-inner">
        <img className="login-shell-logo" src={arcLogo} alt="" width={36} height={36} decoding="async" />
        <div className="login-shell-titles">
          <h2>{t('app.name')}</h2>
          <p>{t('app.loginShellSub')}</p>
        </div>
      </div>
    </header>
  )
}
