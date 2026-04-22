import { request } from './http'

export async function fetchEquipments({ projectId, page = 1, size = 999 } = {}) {
  const q = new URLSearchParams({ page: String(page), size: String(size) })
  if (projectId) q.set('projectId', projectId)
  const res = await request(`/api/projects/equipments?${q}`)
  if (res.code !== undefined && res.code !== 200) {
    throw new Error(res.msg || '获取设备失败')
  }
  return res.data
}
