const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE ?? '').replace(/\/$/, '')

/**
 * 缺陷图等静态资源：接口返回相对路径时，实际访问为「/s/」+ 图片路径（见后端约定）
 */
export function resolveImageUrl(imageUrl) {
  if (!imageUrl) return ''
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl

  let p = String(imageUrl).replace(/^\/+/, '')
  // 若接口已带 s/ 前缀，避免拼成 /s/s/...
  if (p.startsWith('s/')) {
    p = p.slice(2).replace(/^\/+/, '')
  }
  const withS = `/s/${p}`
  if (!ASSET_BASE) return withS
  return `${ASSET_BASE}${withS}`
}
