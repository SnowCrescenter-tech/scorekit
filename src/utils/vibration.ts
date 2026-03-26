// ===== 震动反馈工具 - 使用 Navigator.vibrate API =====

import type { VibrationPattern } from '@/types'

/**
 * 震动模式映射表
 * 数组中的数字表示 [震动ms, 暂停ms, 震动ms, ...]
 */
const VIBRATION_PATTERNS: Record<VibrationPattern, number[]> = {
  /** 轻触 */
  light: [10],
  /** 中等 */
  medium: [30],
  /** 重击 */
  heavy: [50],
  /** 成功：短-停-中 */
  success: [10, 50, 20],
  /** 错误：连续短震 */
  error: [30, 30, 30, 30, 30],
  /** 双击 */
  double: [15, 40, 15],
}

/**
 * 检测是否为 iOS 设备（iOS 不支持 Vibration API）
 */
const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/**
 * 检测设备是否支持震动
 * iOS 设备即使有 vibrate 属性也不支持，需要特殊处理
 */
export const canVibrate = (): boolean => {
  if (typeof navigator === 'undefined') return false
  if (isIOS()) return false
  return 'vibrate' in navigator
}

/**
 * 触发震动反馈
 * @param pattern 震动模式
 */
export const vibrate = (pattern: VibrationPattern): void => {
  if (!canVibrate()) return

  try {
    const vibrationArray = VIBRATION_PATTERNS[pattern]
    if (vibrationArray) {
      navigator.vibrate(vibrationArray)
    }
  } catch {
    // 部分浏览器可能在非用户交互上下文中限制 vibrate
    console.warn('[Vibration] 震动调用失败')
  }
}

/**
 * 停止震动
 */
export const stopVibration = (): void => {
  if (!canVibrate()) return
  try {
    navigator.vibrate(0)
  } catch {
    // 忽略
  }
}
