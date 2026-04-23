import { request } from './http'

export async function fetchDefectStatistics({ snCode, startTime, endTime }) {
  const q = new URLSearchParams({
    snCode,
    startTime: String(startTime),
    endTime: String(endTime),
  })
  const res = await request(`/api/dyj/equipment/statistics/defect?${q}`)
  if (res.errorCode !== undefined && res.errorCode !== 0) {
    throw new Error(res.errorMessage || '缺陷统计失败')
  }
  return res.data
}

export async function fetchNgRecords({ equipmentId, page, size = 20, key, startTime, endTime }) {
  const q = new URLSearchParams({
    equipmentId,
    page: String(page),
    size: String(size),
  })
  if (key !== undefined && key !== null && String(key).trim() !== '') {
    q.set('key', String(key).trim())
  }
  if (startTime != null) {
    q.set('startTime', String(startTime))
  }
  if (endTime != null) {
    q.set('endTime', String(endTime))
  }
  const res = await request(`/api/dyj/data/ng?${q}`)
  if (res.errorCode !== undefined && res.errorCode !== 0) {
    throw new Error(res.errorMessage || '获取缺陷记录失败')
  }
  return res.data
}

/** GET /api/dyj/data/statistical — 今日/本周/本月各 ngReason 数量 */
export async function fetchNgReasonStatistical({ equipmentId }) {
  const q = new URLSearchParams({ equipmentId })
  const res = await request(`/api/dyj/data/statistical?${q}`)
  if (res.errorCode !== undefined && res.errorCode !== 0) {
    throw new Error(res.errorMessage || '缺陷原因统计失败')
  }
  return res.data
}
