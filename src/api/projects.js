import { request } from './http'

export async function fetchProjects(page = 1, size = 999) {
  const q = new URLSearchParams({ page: String(page), size: String(size) })
  const res = await request(`/api/projects?${q}`)
  if (res.code !== undefined && res.code !== 200) {
    throw new Error(res.msg || '获取项目失败')
  }
  return res.data
}
