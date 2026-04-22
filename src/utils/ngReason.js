/** 与 api.md「缺陷原因 code 对照表」一致 */
const NG_REASON_MAP = {
  0: '坏针',
  1: '破洞',
  2: '横条',
  3: '漏针',
  4: '飞花',
  5: '下布线',
  6: '油针',
  7: '褶皱',
}

/** 筛选器选项：全部 + 各 code（与接口 `key` 参数一致） */
export const NG_REASON_FILTER_OPTIONS = [
  { label: '全部', value: '' },
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((n) => ({
    label: NG_REASON_MAP[n],
    value: String(n),
  })),
]

/**
 * @param {string|number|null|undefined} ngReason 接口字段
 * @returns {string} 中文说明；未知 code 则原样返回字符串
 */
export function formatNgReason(ngReason) {
  if (ngReason === null || ngReason === undefined || ngReason === '') return ''
  const key = String(ngReason).trim()
  if (Object.prototype.hasOwnProperty.call(NG_REASON_MAP, key)) {
    return NG_REASON_MAP[key]
  }
  return String(ngReason)
}

/** 组合值里可能出现的分隔（与接口示例 "0-1" 等一致） */
const NG_REASON_PART_SEP = /[-,]+/

/**
 * 界面展示用：组合 code（如 "1-0-2-3"）按段拆开，每段翻译为中文名，顿号连接。
 * 单段时与 {@link formatNgReason} 一致。
 * @param {string|number|null|undefined} ngReason
 * @returns {string}
 */
export function formatNgReasonDisplay(ngReason) {
  if (ngReason === null || ngReason === undefined || ngReason === '') return ''
  const raw = String(ngReason).trim()
  if (!raw) return ''
  if (!NG_REASON_PART_SEP.test(raw)) {
    return formatNgReason(raw) || raw
  }
  const parts = raw.split(NG_REASON_PART_SEP).map((s) => s.trim()).filter(Boolean)
  if (parts.length === 0) return raw
  return parts.map((p) => formatNgReason(p) || p).join('、')
}

/**
 * 统计接口返回的分项转饼图数据（与 api.md `*NgReasonStatistical` 一致）。
 * @param {Array<{ ngReason?: string, count?: number }>} rows
 * @returns {Array<{ code: string, name: string, value: number }>}
 */
export function buildNgPieSlicesFromStatisticalRows(rows) {
  if (!Array.isArray(rows)) return []
  return rows
    .map((r) => {
      const code = String(r?.ngReason ?? '').trim() || '—'
      const value = Number(r?.count) || 0
      const name = formatNgReasonDisplay(r?.ngReason) || code
      return { code, name, value }
    })
    .filter((x) => x.value > 0)
}
