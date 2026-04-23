/**
 * 是否「在线」：与列表排序第一关键字一致，兼容 boolean / 0|1 / "true"|"false" 等
 */
function isMachineOnline(e) {
  if (e == null) {
    return false
  }
  const v = e.online
  if (v === true || v === 1) {
    return true
  }
  if (v === false || v === 0) {
    return false
  }
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (s === 'true' || s === '1' || s === 'yes' || s === 'on') {
      return true
    }
    if (s === 'false' || s === '0' || s === 'no' || s === 'off' || s === '') {
      return false
    }
  }
  if (v == null) {
    return false
  }
  return Boolean(v)
}

/**
 * 归一化 others.status：大小写、「检测中」文案、常见别名，避免误判为「一般在线」
 * 约定：idle / err(d) / detect(ion) / 检测中
 */
function normalizeOthersStatus(e) {
  const raw = e?.others?.status
  if (raw == null || raw === '') {
    return ''
  }
  const s = String(raw).trim()
  const low = s.toLowerCase()
  if (low === 'err' || low === 'error') {
    return 'err'
  }
  if (low === 'idle') {
    return 'idle'
  }
  if (low === 'detect' || low === 'detection' || s === '检测中') {
    return 'detect'
  }
  return low
}

/**
 * 机器管理卡片状态（与接口 others.status、online 约定一致）
 */
export function getMachineCardVariant(e) {
  if (!isMachineOnline(e)) {
    return 'offline'
  }
  const st = normalizeOthersStatus(e)
  if (st === 'err') {
    return 'error'
  }
  if (st === 'idle') {
    return 'idle'
  }
  if (st === 'detect') {
    return 'detect'
  }
  return 'default'
}

/**
 * @param {object} e 设备
 * @param {(key: string, o?: object) => string} [t] i18n t
 */
export function getMachineStatusTitle(e, t) {
  const v = getMachineCardVariant(e)
  if (v === 'error') {
    const others = e.others || {}
    if (isMachineOnline(e) && normalizeOthersStatus(e) === 'err' && !('cameras' in others)) {
      return t ? t('machines.status.cameraError') : '摄像头异常'
    }
    return t ? t('machines.status.error') : '异常'
  }
  if (v === 'offline') return t ? t('machines.status.offline') : '离线'
  if (v === 'idle') return t ? t('machines.status.idle') : '空闲'
  if (v === 'detect') return t ? t('machines.status.detect') : '检测中'
  return t ? t('machines.status.online') : '在线'
}

/** 空闲、检测中且在线时展示 WiFi 条形信号 */
export function shouldShowWifiBars(e) {
  if (!isMachineOnline(e)) {
    return false
  }
  const st = normalizeOthersStatus(e)
  return st === 'idle' || st === 'detect'
}

/** 将 others.network 映射为 0～4 格 */
export function getNetworkBarLevel(network) {
  if (network == null || Number.isNaN(Number(network))) return 0
  const n = Number(network)
  if (n <= 0) return 0
  if (n <= 20) return 1
  if (n <= 45) return 2
  if (n <= 70) return 3
  return 4
}

/**
 * 在线设备状态排序：错误/异常 < 检测中 < 空闲 < 其他在线
 * 离线仅在线比较之后，与在线分组一致按标题再排
 */
function listStatusRank(e) {
  if (!isMachineOnline(e)) {
    return 0
  }
  const v = getMachineCardVariant(e)
  if (v === 'error') {
    return 0
  }
  if (v === 'detect') {
    return 1
  }
  if (v === 'idle') {
    return 2
  }
  if (v === 'default') {
    return 3
  }
  return 4
}

/** 自然序/中文标题比较（如 A100 在 A101 前，混合中英文亦可） */
const machineTitleCollator = new Intl.Collator('zh-Hans-CN', {
  numeric: true,
  sensitivity: 'base',
  usage: 'sort',
})

function sortKeyTitle(e) {
  return String((e && (e.name || e.snCode)) || '').trim()
}

/**
 * 机器管理列表：① 在线优先
 * ② 状态：错误/异常 → 检测中 → 空闲 → 一般在线（同在线内检测中整段在空闲前，不被名称顶到前头）
 * ③ 同状态再按标题/名称自然序（A100、A101 等）
 * ④ uid
 * 离线整段在在线之后，离线间只按标题与 uid
 */
export function sortMachinesForDisplay(a, b) {
  const onA = isMachineOnline(a)
  const onB = isMachineOnline(b)
  if (onA !== onB) {
    if (onA) {
      return -1
    }
    return 1
  }
  const r = listStatusRank(a) - listStatusRank(b)
  if (r !== 0) {
    return r
  }
  const t = machineTitleCollator.compare(sortKeyTitle(a), sortKeyTitle(b))
  if (t !== 0) {
    return t
  }
  return String(a.uid || '').localeCompare(String(b.uid || ''), 'zh', { numeric: true })
}
