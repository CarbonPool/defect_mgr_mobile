import md5 from 'js-md5'
import { request } from './http'

function normalizeLoginPayload(res) {
  if (res?.accessToken) return res
  if (res?.data?.accessToken) return res.data
  return res
}

export async function login(username, password) {
  const body = { username, password: md5(password) }
  const res = await request('/api/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const payload = normalizeLoginPayload(res)
  const { accessToken, refreshToken, user } = payload
  if (!accessToken) {
    throw new Error(res?.msg || '登录失败：未返回令牌')
  }
  localStorage.setItem('accessToken', accessToken)
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken)
  }
  return { accessToken, refreshToken, user }
}

export function logout() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

export async function fetchUserInfo() {
  const res = await request('/api/userInfo')
  if (res.code !== undefined && res.code !== 200) {
    throw new Error(res.msg || '获取用户信息失败')
  }
  return res.data ?? res
}
