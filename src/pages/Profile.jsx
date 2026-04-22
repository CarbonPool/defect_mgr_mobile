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
    <div className="page">
      <div className="page-pad">
        <List header="账号信息">
          <List.Item extra={user.username}>登录名</List.Item>
          <List.Item extra={user.realname || '—'}>姓名</List.Item>
          <List.Item extra={user.mobile || '—'}>手机</List.Item>
          <List.Item extra={user.email || '—'}>邮箱</List.Item>
          <List.Item extra={user.lastLoginTime || '—'}>上次登录</List.Item>
        </List>
        <List header="角色" style={{ marginTop: 12 }}>
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
        <Button block color="danger" fill="outline" style={{ marginTop: 24 }} onClick={onLogout}>
          退出登录
        </Button>
      </div>
    </div>
  )
}
