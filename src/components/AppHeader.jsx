import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UserOutline } from 'antd-mobile-icons'
import { useAuthStore } from '../stores/authStore'
import { useHeaderStore } from '../stores/headerStore'
import arcLogo from '../assets/arc_logo.png'

function pageNsFromPath(pathname) {
  if (pathname === '/' || pathname === '') return 'home'
  if (pathname.startsWith('/defects')) return 'defects'
  if (pathname.startsWith('/machines')) return 'machines'
  return 'mine'
}

export default function AppHeader() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const headerRight = useHeaderStore((s) => s.headerRight)

  const ns = useMemo(() => pageNsFromPath(pathname), [pathname])
  const meta = useMemo(
    () => ({
      title: t(`header.page.${ns}.title`),
      desc: t(`header.page.${ns}.desc`),
    }),
    [ns, t],
  )

  const displayName = user?.realname || user?.username || t('header.user')

  return (
    <header className="app-header" role="banner">
      <div className="app-header-surface">
        <div className="app-header-main">
          <div className="app-header-brand">
            <img className="app-header-logo" src={arcLogo} alt="" width={40} height={40} decoding="async" />
            <div className="app-header-titles">
              <h1>{t('app.name')}</h1>
              <div className="app-header-tagline">{t('app.tagline')}</div>
            </div>
          </div>
          <div className="app-header-actions">
            {headerRight ?? (
              <button
                type="button"
                className="app-header-user"
                onClick={() => navigate('/mine')}
                aria-label={t('header.goProfile')}
              >
                <span className="app-header-user-avatar" aria-hidden>
                  <UserOutline className="app-header-user-icon" />
                </span>
                <span className="app-header-user-name">{displayName}</span>
              </button>
            )}
          </div>
        </div>
        <div className="app-header-current">
          <span className="app-header-current-label">{t('header.current')}</span>
          <strong>{meta.title}</strong>
          <span className="app-header-current-dot">·</span>
          <span className="app-header-current-desc">{meta.desc}</span>
        </div>
      </div>
    </header>
  )
}
