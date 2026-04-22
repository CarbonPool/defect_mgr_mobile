/** 毫秒时间戳（与 api.md 缺陷统计 startTime/endTime 示例一致，如 1776614400000） */
export function toEpochMs(date) {
  return Math.floor(date.getTime())
}

export function rangeToday() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return { start: toEpochMs(start), end: toEpochMs(now) }
}

/** 周一开始 00:00:00 至当前时刻 */
export function rangeThisWeek() {
  const now = new Date()
  const d = new Date(now)
  const dow = d.getDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + mondayOffset)
  d.setHours(0, 0, 0, 0)
  return { start: toEpochMs(d), end: toEpochMs(now) }
}

export function rangeThisMonth() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return { start: toEpochMs(start), end: toEpochMs(now) }
}
