// ============================================
// ScoreKit - 在线状态管理 Hook
// 使用 Supabase Presence 跟踪玩家在线/离线
// ============================================

import { useEffect, useRef, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/services/supabase'
import { useGameStore } from '@/stores/gameStore'
import { setPlayerOnline } from '@/services/roomService'

// ============================================
// 类型定义
// ============================================

interface UsePresenceOptions {
  /** 当前房间 ID */
  roomId: string | null
  /** 当前玩家 ID */
  playerId: string | null
  /** 是否启用 */
  enabled: boolean
}

/** Presence 状态载荷 */
interface PresenceState {
  playerId: string
  /** 最后活跃时间戳 */
  lastSeen: string
}

// ============================================
// 常量
// ============================================

/** Presence 心跳间隔（毫秒） */
const HEARTBEAT_INTERVAL = 30_000

// ============================================
// Hook 实现
// ============================================

/**
 * 在线状态管理 Hook
 *
 * 功能：
 * - 进入房间时发送 presence 心跳
 * - 定期更新存在状态（30秒间隔）
 * - 监听其他玩家的 presence 变化
 * - 玩家离线时更新 gameStore 中对应玩家的 is_online 状态
 * - 页面关闭/切换时通过 beforeunload + visibilitychange 处理离线
 */
export const usePresence = (options: UsePresenceOptions): void => {
  const { roomId, playerId, enabled } = options

  const channelRef = useRef<RealtimeChannel | null>(null)
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const unmountedRef = useRef(false)

  const updatePlayer = useGameStore((s) => s.updatePlayer)

  /**
   * 发送 presence 状态（track）
   */
  const sendPresence = useCallback(() => {
    if (!channelRef.current || !playerId) return

    channelRef.current.track({
      playerId,
      lastSeen: new Date().toISOString(),
    } satisfies PresenceState)
  }, [playerId])

  /**
   * 处理玩家离线（页面关闭/切换到后台）
   * 直接调用 API 更新数据库中的在线状态
   */
  const handleOffline = useCallback(() => {
    if (!playerId) return

    // 使用 sendBeacon 或同步请求确保页面关闭时数据送达
    // Supabase presence 会自动处理断开，但需要主动更新数据库
    setPlayerOnline(playerId, false).catch(() => {
      // 页面关闭时忽略错误
    })

    // 取消 presence track
    if (channelRef.current) {
      channelRef.current.untrack()
    }
  }, [playerId])

  /**
   * 处理页面可见性变化
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      // 页面切到后台，标记离线
      handleOffline()
    } else if (document.visibilityState === 'visible') {
      // 页面切回前台，重新发送 presence 并更新数据库
      if (playerId) {
        setPlayerOnline(playerId, true).catch(() => {})
        sendPresence()
      }
    }
  }, [playerId, handleOffline, sendPresence])

  /**
   * 同步 presence 状态到 gameStore
   * 将当前在线的玩家 ID 集合与 store 中的 players 对比，更新 is_online
   */
  const syncPresenceToStore = useCallback(
    (presenceState: Record<string, PresenceState[]>) => {
      // 收集所有当前在线的 playerId
      const onlinePlayerIds = new Set<string>()
      for (const presences of Object.values(presenceState)) {
        for (const p of presences) {
          if (p.playerId) {
            onlinePlayerIds.add(p.playerId)
          }
        }
      }

      // 遍历所有玩家，更新在线状态
      const players = useGameStore.getState().players
      for (const player of players) {
        const shouldBeOnline = onlinePlayerIds.has(player.id)
        if (player.is_online !== shouldBeOnline) {
          updatePlayer(player.id, { is_online: shouldBeOnline })
        }
      }
    },
    [updatePlayer]
  )

  // ===== 主 Effect：建立 Presence Channel =====
  useEffect(() => {
    unmountedRef.current = false

    if (!enabled || !roomId || !playerId) return

    const channelName = `presence:${roomId}`

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: playerId,
        },
      },
    })

    // 监听 presence 同步事件
    channel
      .on('presence', { event: 'sync' }, () => {
        if (unmountedRef.current) return
        const state = channel.presenceState<PresenceState>()
        syncPresenceToStore(state)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        if (unmountedRef.current) return
        // 新玩家上线
        for (const presence of newPresences as unknown as PresenceState[]) {
          if (presence.playerId) {
            updatePlayer(presence.playerId, { is_online: true })
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        if (unmountedRef.current) return
        // 玩家离线
        for (const presence of leftPresences as unknown as PresenceState[]) {
          if (presence.playerId) {
            updatePlayer(presence.playerId, { is_online: false })
          }
        }
      })

    channel.subscribe((status) => {
      if (unmountedRef.current) return

      if (status === 'SUBSCRIBED') {
        // 订阅成功后立即发送 presence
        sendPresence()

        // 启动心跳定时器
        heartbeatTimerRef.current = setInterval(() => {
          sendPresence()
        }, HEARTBEAT_INTERVAL)
      }
    })

    channelRef.current = channel

    // 注册页面生命周期事件
    window.addEventListener('beforeunload', handleOffline)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      unmountedRef.current = true

      // 清理心跳定时器
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current)
        heartbeatTimerRef.current = null
      }

      // 取消订阅并移除 channel
      if (channelRef.current) {
        channelRef.current.untrack()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      // 移除事件监听
      window.removeEventListener('beforeunload', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [
    enabled,
    roomId,
    playerId,
    sendPresence,
    handleOffline,
    handleVisibilityChange,
    syncPresenceToStore,
    updatePlayer,
  ])
}
