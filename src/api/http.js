const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

/** 与 api.md 中「.(string): 登录token签名」一致；若后端实际键名不同可设 VITE_TOKEN_QUERY_KEY */
const TOKEN_QUERY_KEY = import.meta.env.VITE_TOKEN_QUERY_KEY ?? '.'

function getToken() {
  return localStorage.getItem('accessToken')
}

/**
 * GET 请求在 URL 上附带 token 签名（不放在 Header）
 */
function withTokenQuery(path, token) {
  if (!token) return path
  const qMark = path.indexOf('?')
  const pathname = qMark === -1 ? path : path.slice(0, qMark)
  const queryString = qMark === -1 ? '' : path.slice(qMark + 1)
  const params = new URLSearchParams(queryString)
  if (!params.has(TOKEN_QUERY_KEY)) {
    params.set(TOKEN_QUERY_KEY, token)
  }
  const next = params.toString()
  return next ? `${pathname}?${next}` : pathname
}

export async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const token = getToken()

  const headers = {
    ...options.headers,
  }

  if (method !== 'GET' && method !== 'HEAD') {
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json'
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const urlPath = method === 'GET' && token ? withTokenQuery(path, token) : path

  const res = await fetch(`${API_BASE}${urlPath}`, {
    ...options,
    method,
    headers,
  })

  const text = await res.text()
  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { msg: text }
    }
  }

  if (!res.ok) {
    const msg = data.msg || data.message || data.errorMessage || res.statusText
    throw new Error(msg || `HTTP ${res.status}`)
  }

  return data
}
