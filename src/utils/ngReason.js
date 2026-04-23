/** 与 api.md「缺陷原因 code 对照表」一致（无 i18n 时回退） */
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

function labelSingle(code, t) {
  const key = String(code).trim()
  if (!key) return ''
  if (t) {
    const tr = t(`ngReason.${key}`)
    if (tr && tr !== `ngReason.${key}`) return tr
  }
  if (Object.prototype.hasOwnProperty.call(NG_REASON_MAP, key)) {
    return NG_REASON_MAP[key]
  }
  return String(code)
}

/**
 * @param {string|number|null|undefined} ngReason 接口字段
 * @param {(key: string) => string} [t] i18n t
 * @returns {string}
 */
export function formatNgReason(ngReason, t) {
  return labelSingle(ngReason, t)
}

/** 组合值里可能出现的分隔（与接口示例 "0-1" 等一致） */
const NG_REASON_PART_SEP = /[-,]+/

/**
 * 界面展示用：组合 code 按段翻译后连接。
 * @param {string|number|null|undefined} ngReason
 * @param {(key: string) => string} [t]
 * @returns {string}
 */
export function formatNgReasonDisplay(ngReason, t) {
  if (ngReason === null || ngReason === undefined || ngReason === '') return ''
  const raw = String(ngReason).trim()
  if (!raw) return ''
  if (!NG_REASON_PART_SEP.test(raw)) {
    return formatNgReason(raw, t) || raw
  }
  const parts = raw.split(NG_REASON_PART_SEP).map((s) => s.trim()).filter(Boolean)
  if (parts.length === 0) return raw
  const joiner = t ? t('ngReason.joiner') : '、'
  return parts.map((p) => labelSingle(p, t) || p).join(joiner)
}

/**
 * @param {(key: string) => string} [t]
 */
export function getNgReasonFilterOptions(t) {
  const all = t ? t('defects.filterAllReasons') : '全部'
  return [
    { label: all, value: '' },
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((n) => ({
      label: labelSingle(String(n), t),
      value: String(n),
    })),
  ]
}

/**
 * 统计接口分项转饼图数据
 * @param {Array<{ ngReason?: string, count?: number }>} rows
 * @param {(key: string) => string} [t]
 */
export function buildNgPieSlicesFromStatisticalRows(rows, t) {
  if (!Array.isArray(rows)) return []
  return rows
    .map((r) => {
      const code = String(r?.ngReason ?? '').trim() || '—'
      const value = Number(r?.count) || 0
      const name = formatNgReasonDisplay(r?.ngReason, t) || code
      return { code, name, value }
    })
    .filter((x) => x.value > 0)
}
