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

/**
 * 用户注册（与 api.md POST /api/register 一致）
 * - password、passwordYes 与登录相同：对用户输入的登录密码做 MD5 后传递
 * @param {string} passwordYes 确认密码（明文，内部与 password 同样做 md5）
 * @returns {{ uid: string, createdTime: string }}
 */
export async function register(username, password, passwordYes) {
  const res = await request('/api/register', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password: md5(password),
      passwordYes: md5(passwordYes),
    }),
  })
  if (res.code !== undefined && res.code !== 200) {
    throw new Error(res.msg || '注册失败')
  }
  return res.data
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
