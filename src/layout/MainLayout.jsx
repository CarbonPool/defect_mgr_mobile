import { TabBar } from 'antd-mobile'
import {
  AppOutline,
  UnorderedListOutline,
  SetOutline,
  UserOutline,
} from 'antd-mobile-icons'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'

const tabs = [
  { key: '/', titleKey: 'tab.home', icon: AppOutline },
  { key: '/defects', titleKey: 'tab.defects', icon: UnorderedListOutline },
  { key: '/machines', titleKey: 'tab.machines', icon: SetOutline },
  { key: '/mine', titleKey: 'tab.mine', icon: UserOutline },
]

const HIDE_HEADER_PATHS = ['/defects', '/machines']

export default function MainLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const activeKey = tabs.some((tab) => tab.key === pathname) ? pathname : '/'
  const hideAppHeader = HIDE_HEADER_PATHS.includes(pathname)

  return (
    <div className="main-shell">
      {!hideAppHeader ? <AppHeader /> : null}
      <main className="main-outlet">
        <Outlet />
      </main>
      <div className="tabbar-fixed">
        <TabBar activeKey={activeKey} safeArea onChange={(key) => navigate(key)}>
          {tabs.map((item) => {
            const Icon = item.icon
            return (
              <TabBar.Item
                key={item.key}
                icon={(active) => (
                  <Icon style={{ fontSize: 22, color: active ? '#1677ff' : '#999' }} />
                )}
                title={t(item.titleKey)}
              />
            )
          })}
        </TabBar>
      </div>
    </div>
  )
}
