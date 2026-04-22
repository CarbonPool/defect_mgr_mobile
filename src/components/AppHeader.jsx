import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UserOutline } from 'antd-mobile-icons'
import { useAuthStore } from '../stores/authStore'
import { useHeaderStore } from '../stores/headerStore'

const PAGE_META = {
  '/': { title: '主页', desc: '设备总览 · 缺陷监控' },
  '/defects': { title: '缺陷记录', desc: '检测记录查询与追溯' },
  '/machines': { title: '机器管理', desc: '设备台账与运行状态' },
  '/mine': { title: '个人中心', desc: '账号信息与权限' },
}

export default function AppHeader() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const headerRight = useHeaderStore((s) => s.headerRight)

  const meta = useMemo(() => PAGE_META[pathname] ?? PAGE_META['/'], [pathname])

  const displayName = user?.realname || user?.username || '用户'

  return (
    <header className="app-header" role="banner">
      <div className="app-header-surface">
        <div className="app-header-main">
          <div className="app-header-brand">
            <div className="app-header-logo" aria-hidden />
            <div className="app-header-titles">
              <h1>大圆机管理平台</h1>
              <div className="app-header-tagline">智能制造 · 圆机设备与缺陷一体化管理</div>
            </div>
          </div>
          <div className="app-header-actions">
            {headerRight ?? (
              <button
                type="button"
                className="app-header-user"
                onClick={() => navigate('/mine')}
                aria-label="进入个人中心"
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
          <span className="app-header-current-label">当前</span>
          <strong>{meta.title}</strong>
          <span className="app-header-current-dot">·</span>
          <span className="app-header-current-desc">{meta.desc}</span>
        </div>
      </div>
    </header>
  )
}
