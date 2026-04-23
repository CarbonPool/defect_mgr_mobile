import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, DotLoading, Form, Input, Toast } from 'antd-mobile'
import { EyeInvisibleOutline, EyeOutline } from 'antd-mobile-icons'
import { useAuthStore } from '../stores/authStore'
import LoginShellHeader from '../components/LoginShellHeader'
import arcLogo from '../assets/arc_logo.png'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const [visible, setVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const from = location.state?.from || '/'
  const presetUsername = location.state?.username

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
      Toast.show({ icon: 'success', content: t('login.success') })
      navigate(from, { replace: true })
    } catch (e) {
      Toast.show({ icon: 'fail', content: e.message || t('login.fail') })
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
          <h1>{t('app.name')}</h1>
          <p className="login-sub">{t('login.title')}</p>
        </div>

        <Form
          mode="card"
          layout="horizontal"
          onFinish={onFinish}
          initialValues={presetUsername ? { username: presetUsername } : undefined}
          footer={
            <Button block type="submit" color="primary" size="large" loading={submitting}>
              {t('login.submit')}
            </Button>
          }
        >
          <Form.Item name="username" rules={[{ required: true, message: t('login.usernameRequired') }]}>
            <Input placeholder={t('login.username')} clearable autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: t('login.passwordRequired') }]}>
            <Input
              placeholder={t('login.password')}
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
          <Link to="/register" className="login-register" replace={false}>
            {t('login.registerHint')}
          </Link>
        </div>
      </div>
    </>
  )
}
