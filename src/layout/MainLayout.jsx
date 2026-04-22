import { TabBar } from 'antd-mobile'
import {
  AppOutline,
  UnorderedListOutline,
  SetOutline,
  UserOutline,
} from 'antd-mobile-icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'

const tabs = [
  { key: '/', title: '主页', icon: AppOutline },
  { key: '/defects', title: '缺陷记录', icon: UnorderedListOutline },
  { key: '/machines', title: '机器管理', icon: SetOutline },
  { key: '/mine', title: '个人中心', icon: UserOutline },
]

const HIDE_HEADER_PATHS = ['/defects', '/machines']

export default function MainLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const activeKey = tabs.some((t) => t.key === pathname) ? pathname : '/'
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
                title={item.title}
              />
            )
          })}
        </TabBar>
      </div>
    </div>
  )
}
