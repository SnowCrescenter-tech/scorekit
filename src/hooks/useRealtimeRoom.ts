// ============================================
// ScoreKit - 房间实时同步 Hook
// 负责监听 Supabase Realtime 变化并同步到 gameStore
// ============================================

import { useEffect, useRef, useState, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/services/supabase'
import { useGameStore } from '@/stores/gameStore'
import { toast } from '@/components/common/Toast'
import { playSound } from '@/utils/sound'
import type { Room, Player, Round, Bet } from '@/types'

// ============================================
// 类型定义
// ============================================

interface UseRealtimeRoomOptions {
  /** 当前房间 ID */
  roomId: string | null
  /** 是否启用实时监听 */
  enabled: boolean
}

interface UseRealtimeRoomReturn {
  /** 是否已连接 */
  isConnected: boolean
  /** 连接错误信息 */
  connectionError: string | null
  /** 手动重连 */
  reconnect: () => void
}

/** Supabase Realtime postgres_changes 事件载荷类型 */
interface PostgresChangePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: Partial<T>
}

// ============================================
// 重连配置常量
// ============================================

/** 最大重连次数 */
const MAX_RECONNECT_ATTEMPTS = 5
/** 重连基础延迟（毫秒） */
const RECONNECT_BASE_DELAY = 1000

// ============================================
// Hook 实现
// ============================================

export const useRealtimeRoom = (
  options: UseRealtimeRoomOptions
): UseRealtimeRoomReturn => {
  const { roomId, enabled } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  /** channel 引用，用于清理 */
  const channelRef = useRef<RealtimeChannel | null>(null)
  /** 重连次数 */
  const reconnectAttemptsRef = useRef(0)
  /** 重连定时器 */
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** 标记组件是否已卸载 */
  const unmountedRef = useRef(false)

  // 从 gameStore 获取 actions
  const setRoom = useGameStore((s) => s.setRoom)
  const setPlayers = useGameStore((s) => s.setPlayers)
  const updatePlayer = useGameStore((s) => s.updatePlayer)
  const setCurrentRound = useGameStore((s) => s.setCurrentRound)
  const setBets = useGameStore((s) => s.setBets)
  const addBet = useGameStore((s) => s.addBet)
  const setConnected = useGameStore((s) => s.setConnected)

  /**
   * 清理当前 channel 订阅
   */
  const cleanup = useCallback(() => {
    // 清除重连定时器
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }

    // 取消订阅并移除 channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    setIsConnected(false)
    setConnected(false)
  }, [setConnected])

  /**
   * 处理房间表变化（UPDATE）
   */
  const handleRoomChange = useCallback(
    (payload: PostgresChangePayload<Room>) => {
      if (payload.eventType === 'UPDATE' && payload.new) {
        const updatedRoom = payload.new as Room
        setRoom(updatedRoom)

        // 房间状态变化提示
        if (payload.old?.status && payload.old.status !== updatedRoom.status) {
          if (updatedRoom.status === 'playing') {
            toast.info('游戏已开始')
            playSound('bell')
          } else if (updatedRoom.status === 'finished') {
            toast.info('游戏已结束')
          }
        }
      }
    },
    [setRoom]
  )

  /**
   * 处理玩家表变化（INSERT / UPDATE / DELETE）
   */
  const handlePlayerChange = useCallback(
    (payload: PostgresChangePayload<Player>) => {
      const { eventType } = payload

      if (eventType === 'INSERT' && payload.new) {
        const newPlayer = payload.new as Player
        // 获取当前玩家列表，追加新玩家
        const currentPlayers = useGameStore.getState().players
        // 防止重复添加
        if (!currentPlayers.some((p) => p.id === newPlayer.id)) {
          setPlayers([...currentPlayers, newPlayer])
          toast.info(`${newPlayer.name} 加入了房间`)
          playSound('notification')
        }
      }

      if (eventType === 'UPDATE' && payload.new) {
        const updatedPlayer = payload.new as Player
        updatePlayer(updatedPlayer.id, updatedPlayer)
      }

      if (eventType === 'DELETE' && payload.old) {
        const removedPlayer = payload.old as Partial<Player>
        if (removedPlayer.id) {
          const currentPlayers = useGameStore.getState().players
          const player = currentPlayers.find((p) => p.id === removedPlayer.id)
          setPlayers(currentPlayers.filter((p) => p.id !== removedPlayer.id))
          if (player) {
            toast.info(`${player.name} 离开了房间`)
          }
        }
      }
    },
    [setPlayers, updatePlayer]
  )

  /**
   * 处理回合表变化（INSERT / UPDATE）
   */
  const handleRoundChange = useCallback(
    (payload: PostgresChangePayload<Round>) => {
      const { eventType } = payload

      if (eventType === 'INSERT' && payload.new) {
        const newRound = payload.new as Round
        setCurrentRound(newRound)
        // 新回合开始，清空下注记录
        setBets([])
        playSound('card_flip')
        toast.info(`第 ${newRound.round_number} 局开始`)
      }

      if (eventType === 'UPDATE' && payload.new) {
        const updatedRound = payload.new as Round
        const prevRound = useGameStore.getState().currentRound

        setCurrentRound(updatedRound)

        // 阶段变化时播放音效
        if (prevRound && prevRound.phase !== updatedRound.phase) {
          playSound('card_flip')
        }

        // 回合结算通知
        if (prevRound?.status === 'betting' && updatedRound.status === 'settled') {
          playSound('chip_collect')
          toast.success('本局已结算')
        }
      }
    },
    [setCurrentRound, setBets]
  )

  /**
   * 处理下注表变化（INSERT）
   */
  const handleBetChange = useCallback(
    (payload: PostgresChangePayload<Bet>) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const newBet = payload.new as Bet
        // 防止重复添加
        const currentBets = useGameStore.getState().bets
        if (!currentBets.some((b) => b.id === newBet.id)) {
          addBet(newBet)
          playSound('chip_place')
        }
      }
    },
    [addBet]
  )

  /**
   * 带指数退避的重连逻辑
   */
  const scheduleReconnect = useCallback(() => {
    if (unmountedRef.current) return
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setConnectionError('实时连接失败，已达最大重试次数。请刷新页面重试。')
      toast.error('实时连接断开，请刷新页面')
      return
    }

    const delay =
      RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttemptsRef.current)
    reconnectAttemptsRef.current += 1

    reconnectTimerRef.current = setTimeout(() => {
      if (!unmountedRef.current) {
        subscribe()
      }
    }, delay)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * 建立 Realtime 订阅
   */
  const subscribe = useCallback(() => {
    if (!roomId || unmountedRef.current) return

    // 先清理旧的 channel
    cleanup()

    const channelName = `room:${roomId}`

    const channel = supabase
      .channel(channelName)
      // 监听 rooms 表变化 —— 当前房间的 UPDATE
      .on<Room>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          handleRoomChange(payload as unknown as PostgresChangePayload<Room>)
        }
      )
      // 监听 players 表变化 —— 当前房间的 INSERT
      .on<Player>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          handlePlayerChange({
            ...payload,
            eventType: 'INSERT',
          } as unknown as PostgresChangePayload<Player>)
        }
      )
      // 监听 players 表变化 —— 当前房间的 UPDATE
      .on<Player>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          handlePlayerChange({
            ...payload,
            eventType: 'UPDATE',
          } as unknown as PostgresChangePayload<Player>)
        }
      )
      // 监听 players 表变化 —— 当前房间的 DELETE
      .on<Player>(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          handlePlayerChange({
            ...payload,
            eventType: 'DELETE',
          } as unknown as PostgresChangePayload<Player>)
        }
      )
      // 监听 rounds 表变化 —— 当前房间的 INSERT
      .on<Round>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rounds',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          handleRoundChange({
            ...payload,
            eventType: 'INSERT',
          } as unknown as PostgresChangePayload<Round>)
        }
      )
      // 监听 rounds 表变化 —— 当前房间的 UPDATE
      .on<Round>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rounds',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          handleRoundChange({
            ...payload,
            eventType: 'UPDATE',
          } as unknown as PostgresChangePayload<Round>)
        }
      )
      // 监听 bets 表变化 —— INSERT（通过 round 关联到房间）
      .on<Bet>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bets',
        },
        (payload) => {
          // 仅处理属于当前回合的下注
          const currentRound = useGameStore.getState().currentRound
          const newBet = payload.new as Bet | undefined
          if (currentRound && newBet && newBet.round_id === currentRound.id) {
            handleBetChange({
              ...payload,
              eventType: 'INSERT',
            } as unknown as PostgresChangePayload<Bet>)
          }
        }
      )

    // 订阅 channel 并监听状态变化
    channel.subscribe((status, err) => {
      if (unmountedRef.current) return

      switch (status) {
        case 'SUBSCRIBED':
          setIsConnected(true)
          setConnected(true)
          setConnectionError(null)
          reconnectAttemptsRef.current = 0
          break

        case 'TIMED_OUT':
          setIsConnected(false)
          setConnected(false)
          setConnectionError('连接超时，正在重连...')
          scheduleReconnect()
          break

        case 'CLOSED':
          setIsConnected(false)
          setConnected(false)
          // 非主动关闭时尝试重连
          if (!unmountedRef.current) {
            scheduleReconnect()
          }
          break

        case 'CHANNEL_ERROR':
          setIsConnected(false)
          setConnected(false)
          setConnectionError(
            `实时连接错误: ${err?.message ?? '未知错误'}`
          )
          scheduleReconnect()
          break
      }
    })

    channelRef.current = channel
  }, [
    roomId,
    cleanup,
    handleRoomChange,
    handlePlayerChange,
    handleRoundChange,
    handleBetChange,
    setConnected,
    scheduleReconnect,
  ])

  /**
   * 手动重连
   */
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    setConnectionError(null)
    subscribe()
  }, [subscribe])

  // ===== 主 Effect：建立/拆除订阅 =====
  useEffect(() => {
    unmountedRef.current = false

    if (enabled && roomId) {
      subscribe()
    }

    return () => {
      unmountedRef.current = true
      cleanup()
    }
  }, [roomId, enabled, subscribe, cleanup])

  return {
    isConnected,
    connectionError,
    reconnect,
  }
}
