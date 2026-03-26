// ===== 通用工具函数 =====

/**
 * 生成随机 ID（16 位十六进制字符串）
 */
export const generateId = (): string => {
  const array = new Uint8Array(8)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 格式化筹码数字显示
 * 1000 -> 1K, 1000000 -> 1M, 小数保留一位
 */
export const formatChips = (chips: number): string => {
  if (chips < 0) return `-${formatChips(-chips)}`
  if (chips >= 1_000_000_000) return `${(chips / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
  if (chips >= 1_000_000) return `${(chips / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (chips >= 10_000) return `${(chips / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  if (chips >= 1_000) return `${(chips / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return chips.toString()
}

/**
 * 格式化时间（用于游戏时长等）
 * @param minutes 分钟数
 * @returns 如 "1小时23分" 或 "45分"
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 1) return '不到1分钟'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m}分钟`
  if (m === 0) return `${h}小时`
  return `${h}小时${m}分钟`
}

/**
 * 格式化日期
 * @param date ISO 日期字符串
 * @returns 友好的日期显示
 */
export const formatDate = (date: string): string => {
  try {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60_000)
    const diffHours = Math.floor(diffMs / 3_600_000)
    const diffDays = Math.floor(diffMs / 86_400_000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`

    // 超过 7 天显示具体日期
    return d.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return date
  }
}

/**
 * 根据种子字符串生成固定的头像背景色
 * @param seed 种子字符串（如玩家 ID）
 * @returns HSL 颜色字符串
 */
export const getAvatarBgColor = (seed: string): string => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash // 转换为 32 位整数
  }
  const hue = ((hash % 360) + 360) % 360
  return `hsl(${hue}, 65%, 45%)`
}

/** 可用的 emoji 头像列表 */
export const AVATAR_EMOJIS: string[] = [
  '😎', '🤠', '🦊', '🐯', '🦁', '🐺', '🦅', '🐲',
  '👑', '💎', '🎯', '🔥', '⚡', '🌟', '🎪', '🎭',
  '🃏', '♠️', '♥️', '♦️', '♣️', '🎰', '🎲', '🏆',
]

/**
 * 座位位置计算（环形布局）
 * @param totalSeats 总座位数
 * @param containerSize 容器尺寸（px）
 * @returns 每个座位的 {x, y} 坐标数组
 */
export const getSeatPositions = (
  totalSeats: number,
  containerSize: number
): { x: number; y: number }[] => {
  const positions: { x: number; y: number }[] = []
  const cx = containerSize / 2
  const cy = containerSize / 2
  const radius = containerSize * 0.38 // 留出边距

  for (let i = 0; i < totalSeats; i++) {
    // 从正上方开始，顺时针排列
    const angle = (2 * Math.PI * i) / totalSeats - Math.PI / 2
    positions.push({
      x: Math.round(cx + radius * Math.cos(angle)),
      y: Math.round(cy + radius * Math.sin(angle)),
    })
  }
  return positions
}

/**
 * 延迟函数
 * @param ms 毫秒数
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 安全的 JSON 解析
 * @param json JSON 字符串
 * @param fallback 解析失败时的默认值
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns 是否成功
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    // 降级方案：使用 textarea
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  } catch {
    console.warn('[Clipboard] 复制到剪贴板失败')
    return false
  }
}
