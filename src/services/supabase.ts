// ============================================
// ScoreKit - Supabase 客户端配置
// ============================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://placeholder.supabase.co'
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder-key'

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    '[ScoreKit] 缺少 Supabase 环境变量，将使用 Mock 模式。\n' +
    '请在 .env 文件中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY'
  )
}

/** Supabase 客户端实例 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// 匿名用户会话管理
// ============================================

const SESSION_KEY = 'scorekit_session_id'

/**
 * 获取当前用户的会话 ID
 * 用于匿名用户身份识别，持久化存储在 localStorage 中
 * 如果不存在则自动生成一个 UUID v4
 */
export function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY)

  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sessionId)
  }

  return sessionId
}

/**
 * 清除当前会话（用于调试或重置身份）
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
