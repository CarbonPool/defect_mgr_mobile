import { Button, Dialog, List, Toast } from 'antd-mobile'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const onLogout = () => {
    Dialog.confirm({
      content: '确定退出登录？',
      onConfirm: () => {
        logout()
        Toast.show({ icon: 'success', content: '已退出' })
        navigate('/login', { replace: true })
      },
    })
  }

  if (!user) return null

  return (
    <div className="page profile-page">
      <div className="page-pad">
        <div className="profile-list-card">
          <List header="账号信息">
            <List.Item extra={user.username}>登录名</List.Item>
            <List.Item extra={user.realname || '—'}>姓名</List.Item>
            <List.Item extra={user.mobile || '—'}>手机</List.Item>
            <List.Item extra={user.email || '—'}>邮箱</List.Item>
            <List.Item extra={user.lastLoginTime || '—'}>上次登录</List.Item>
          </List>
        </div>
        <div className="profile-list-card" style={{ marginTop: 12 }}>
          <List header="角色">
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
          退出登录
        </Button>
      </div>
    </div>
  )
}
