import { Button, Dialog, List, Toast } from 'antd-mobile'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const lang = i18n.language?.split('-')[0] || 'zh'

  const onLogout = () => {
    Dialog.confirm({
      content: t('profile.logoutConfirm'),
      onConfirm: () => {
        logout()
        Toast.show({ icon: 'success', content: t('profile.loggedOut') })
        navigate('/login', { replace: true })
      },
    })
  }

  if (!user) return null

  return (
    <div className="page profile-page">
      <div className="page-pad">
        <div className="profile-list-card">
          <List header={t('profile.account')}>
            <List.Item extra={user.username}>{t('profile.username')}</List.Item>
            <List.Item extra={user.realname || '—'}>{t('profile.realname')}</List.Item>
            <List.Item extra={user.mobile || '—'}>{t('profile.mobile')}</List.Item>
            <List.Item extra={user.email || '—'}>{t('profile.email')}</List.Item>
            <List.Item extra={user.lastLoginTime || '—'}>{t('profile.lastLogin')}</List.Item>
          </List>
        </div>
        <div className="profile-list-card" style={{ marginTop: 12 }}>
          <List header={t('profile.language')}>
            <List.Item
              clickable
              arrow={false}
              extra={lang === 'zh' ? '✓' : null}
              onClick={() => i18n.changeLanguage('zh')}
            >
              {t('profile.langZh')}
            </List.Item>
            <List.Item
              clickable
              arrow={false}
              extra={lang === 'en' ? '✓' : null}
              onClick={() => i18n.changeLanguage('en')}
            >
              {t('profile.langEn')}
            </List.Item>
          </List>
        </div>
        <div className="profile-list-card" style={{ marginTop: 12 }}>
          <List header={t('profile.roles')}>
            {user.roles && Object.keys(user.roles).length ? (
              Object.entries(user.roles).map(([code, name]) => (
                <List.Item key={code} extra={code}>
                  {name}
                </List.Item>
              ))
            ) : (
              <List.Item>—</List.Item>
            )}
          </List>
        </div>
        <Button
          className="profile-logout-btn"
          block
          color="danger"
          fill="solid"
          size="large"
          onClick={onLogout}
        >
          {t('profile.logout')}
        </Button>
      </div>
    </div>
  )
}
