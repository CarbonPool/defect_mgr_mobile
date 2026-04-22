import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button, DotLoading, Form, Input, Toast } from 'antd-mobile'
import { EyeInvisibleOutline, EyeOutline } from 'antd-mobile-icons'
import { useAuthStore } from '../stores/authStore'
import arcLogo from '../assets/arc_logo.png'

function LoginShellHeader() {
  return (
    <header className="login-shell-header">
      <div className="login-shell-header-inner">
        <img className="login-shell-logo" src={arcLogo} alt="" width={36} height={36} decoding="async" />
        <div className="login-shell-titles">
          <h2>大圆机管理平台</h2>
          <p>企业登录 · 安全访问</p>
        </div>
      </div>
    </header>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const [visible, setVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const from = location.state?.from || '/'

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true })
    }
  }, [loading, user, from, navigate])

  if (loading) {
    return (
      <>
        <LoginShellHeader />
        <div className="page-loading login-page">
          <DotLoading color="primary" />
        </div>
      </>
    )
  }

  const onFinish = async (values) => {
    setSubmitting(true)
    try {
      await login(values.username, values.password)
      Toast.show({ icon: 'success', content: '登录成功' })
      navigate(from, { replace: true })
    } catch (e) {
      Toast.show({ icon: 'fail', content: e.message || '登录失败' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <LoginShellHeader />
      <div className="login-page">
        <div className="login-brand">
          <img className="login-logo" src={arcLogo} alt="" width={56} height={56} decoding="async" />
          <h1>大圆机管理平台</h1>
          <p className="login-sub">登录</p>
        </div>

        <Form
          layout="horizontal"
          onFinish={onFinish}
          footer={
            <Button block type="submit" color="primary" size="large" loading={submitting}>
              登录
            </Button>
          }
        >
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="用户名" clearable />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input
              placeholder="密码"
              clearable
              type={visible ? 'text' : 'password'}
              extra={
                <div className="pwd-eye" onClick={() => setVisible((v) => !v)}>
                  {visible ? <EyeOutline /> : <EyeInvisibleOutline />}
                </div>
              }
            />
          </Form.Item>
        </Form>

        <div className="login-extra">
          <a
            className="login-register"
            onClick={(e) => {
              e.preventDefault()
              Toast.show({ content: '请联系管理员开通账号' })
            }}
          >
            还没有账户?马上注册
          </a>
        </div>
      </div>
    </>
  )
}
