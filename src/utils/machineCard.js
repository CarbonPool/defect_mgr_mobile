/**
 * 机器管理卡片状态（与接口 others.status、online 约定一致）
 */
export function getMachineCardVariant(e) {
  if (!e?.online) return 'offline'
  const st = e.others?.status
  if (st === 'err') return 'error'
  if (st === 'idle') return 'idle'
  if (st === 'detect') return 'detect'
  return 'default'
}

/** 卡片角标 / 说明用主文案 */
export function getMachineStatusTitle(e) {
  const v = getMachineCardVariant(e)
  if (v === 'error') {
    const others = e.others || {}
    if (e.online && others.status === 'err' && !('cameras' in others)) {
      return '摄像头异常'
    }
    return '异常'
  }
  if (v === 'offline') return '离线'
  if (v === 'idle') return '空闲'
  if (v === 'detect') return '检测中'
  return '在线'
}

/** 空闲、检测中且在线时展示 WiFi 条形信号 */
export function shouldShowWifiBars(e) {
  if (!e?.online) return false
  const st = e.others?.status
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
