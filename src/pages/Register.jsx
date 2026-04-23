import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Form, Input, Toast } from 'antd-mobile'
import { EyeInvisibleOutline, EyeOutline } from 'antd-mobile-icons'
import { register } from '../api/auth'
import LoginShellHeader from '../components/LoginShellHeader'
import { isValidRegisterPassword } from '../utils/registerPassword'
import arcLogo from '../assets/arc_logo.png'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [visible2, setVisible2] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const onFinish = async (values) => {
    setSubmitting(true)
    try {
      await register(values.username, values.password, values.password2)
      Toast.show({ icon: 'success', content: t('register.success') })
      navigate('/login', { replace: true, state: { username: values.username } })
    } catch (e) {
      Toast.show({ icon: 'fail', content: e.message || t('register.fail') })
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
          <p className="login-sub">{t('register.title')}</p>
        </div>

        <p className="register-rule-hint muted">{t('register.passwordRuleHint')}</p>

        <Form
          mode="card"
          layout="horizontal"
          onFinish={onFinish}
          footer={
            <Button block type="submit" color="primary" size="large" loading={submitting}>
              {t('register.submit')}
            </Button>
          }
        >
          <Form.Item name="username" rules={[{ required: true, message: t('register.usernameRequired') }]}>
            <Input placeholder={t('login.username')} clearable autoComplete="username" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: t('register.passwordRequired') },
              {
                validator: (_, v) => {
                  if (!v) return Promise.resolve()
                  if (!isValidRegisterPassword(v)) {
                    return Promise.reject(new Error(t('register.passwordRuleError')))
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <Input
              placeholder={t('login.password')}
              clearable
              autoComplete="new-password"
              type={visible ? 'text' : 'password'}
              extra={
                <div className="pwd-eye" onClick={() => setVisible((x) => !x)}>
                  {visible ? <EyeOutline /> : <EyeInvisibleOutline />}
                </div>
              }
            />
          </Form.Item>
          <Form.Item
            name="password2"
            dependencies={['password']}
            rules={[
              { required: true, message: t('register.passwordConfirmRequired') },
              ({ getFieldValue }) => ({
                validator(_, v) {
                  if (!v || getFieldValue('password') === v) return Promise.resolve()
                  return Promise.reject(new Error(t('register.passwordMismatch')))
                },
              }),
            ]}
          >
            <Input
              placeholder={t('register.passwordConfirm')}
              clearable
              autoComplete="new-password"
              type={visible2 ? 'text' : 'password'}
              extra={
                <div className="pwd-eye" onClick={() => setVisible2((x) => !x)}>
                  {visible2 ? <EyeOutline /> : <EyeInvisibleOutline />}
                </div>
              }
            />
          </Form.Item>
        </Form>

        <div className="login-extra">
          <Link to="/login" className="login-register" replace>
            {t('register.goLogin')}
          </Link>
        </div>
      </div>
    </>
  )
}
