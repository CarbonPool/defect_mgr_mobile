/** 与 api.md 注册：字母+数字+特殊符号，不少于8位 */
export function isValidRegisterPassword(p) {
  if (typeof p !== 'string' || p.length < 8) return false
  const hasLetter = /[a-zA-Z]/.test(p)
  const hasDigit = /\d/.test(p)
  const hasSpecial = /[^a-zA-Z0-9]/.test(p)
  return hasLetter && hasDigit && hasSpecial
}
