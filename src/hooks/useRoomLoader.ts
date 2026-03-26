// ============================================
// ScoreKit - 房间数据初始加载 Hook
// 进入房间页面时，从 Supabase 拉取全量数据
// ============================================

import { useEffect, useState, useCallback, useRef } from 'react'
import { getSessionId } from '@/services/supabase'
import { getRoom, getRoomPlayers } from '@/services/roomService'
import { getCurrentRound, getRoundBets } from '@/services/roundService'
import { useGameStore } from '@/stores/gameStore'
import { toast } from '@/components/common/Toast'

// ============================================
// 类型定义
// ============================================

interface UseRoomLoaderReturn {
  /** 是否正在加载 */
  isLoading: boolean
  /** 加载错误信息 */
  error: string | null
  /** 手动重试 */
  retry: () => void
}

// ============================================
// Hook 实现
// ============================================

/**
 * 房间数据初始加载 Hook
 *
 * 当进入房间页面时，依次加载：
 * 1. 房间信息（通过 roomCode）
 * 2. 玩家列表
 * 3. 当前回合（如有）
 * 4. 当前回合下注记录（如有）
 * 5. 识别当前玩家（myPlayer）
 *
 * @param roomCode 6位房间码
 */
export const useRoomLoader = (roomCode: string): UseRoomLoaderReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** 避免竞态：如果 roomCode 变化或组件卸载，丢弃过期请求的结果 */
  const loadIdRef = useRef(0)

  // 从 gameStore 获取 actions
  const setRoom = useGameStore((s) => s.setRoom)
  const setPlayers = useGameStore((s) => s.setPlayers)
  const setMyPlayer = useGameStore((s) => s.setMyPlayer)
  const setCurrentRound = useGameStore((s) => s.setCurrentRound)
  const setBets = useGameStore((s) => s.setBets)
  const setLoading = useGameStore((s) => s.setLoading)

  /**
   * 执行数据加载流程
   */
  const load = useCallback(async () => {
    if (!roomCode) return

    const currentLoadId = ++loadIdRef.current
    setIsLoading(true)
    setLoading(true)
    setError(null)

    try {
      // 1. 获取房间信息
      const roomResult = await getRoom(roomCode)
      if (currentLoadId !== loadIdRef.current) return // 竞态保护

      if (roomResult.error || !roomResult.data) {
        throw new Error(roomResult.error ?? '获取房间失败')
      }
      const room = roomResult.data
      setRoom(room)

      // 2. 获取玩家列表
      const playersResult = await getRoomPlayers(room.id)
      if (currentLoadId !== loadIdRef.current) return

      if (playersResult.error || !playersResult.data) {
        throw new Error(playersResult.error ?? '获取玩家列表失败')
      }
      const players = playersResult.data
      setPlayers(players)

      // 3. 识别当前玩家（通过 session_id 匹配）
      const sessionId = getSessionId()
      const myPlayer = players.find((p) => p.session_id === sessionId) ?? null
      setMyPlayer(myPlayer)

      if (!myPlayer) {
        console.warn('[useRoomLoader] 未找到当前会话对应的玩家，可能是旁观者')
      }

      // 4. 获取当前进行中的回合
      const roundResult = await getCurrentRound(room.id)
      if (currentLoadId !== loadIdRef.current) return

      if (roundResult.error) {
        // 回合加载失败不阻断整体流程，仅记录警告
        console.warn('[useRoomLoader] 获取当前回合失败:', roundResult.error)
        setCurrentRound(null)
        setBets([])
      } else if (roundResult.data) {
        const round = roundResult.data
        setCurrentRound(round)

        // 5. 有当前回合时，加载下注记录
        const betsResult = await getRoundBets(round.id)
        if (currentLoadId !== loadIdRef.current) return

        if (betsResult.error) {
          console.warn('[useRoomLoader] 获取下注记录失败:', betsResult.error)
          setBets([])
        } else {
          setBets(betsResult.data ?? [])
        }
      } else {
        // 没有进行中的回合
        setCurrentRound(null)
        setBets([])
      }
    } catch (err) {
      if (currentLoadId !== loadIdRef.current) return
      const message = (err as Error).message || '加载房间数据失败'
      setError(message)
      toast.error(message)
    } finally {
      if (currentLoadId === loadIdRef.current) {
        setIsLoading(false)
        setLoading(false)
      }
    }
  }, [roomCode, setRoom, setPlayers, setMyPlayer, setCurrentRound, setBets, setLoading])

  /**
   * 手动重试
   */
  const retry = useCallback(() => {
    load()
  }, [load])

  // ===== 主 Effect：roomCode 变化时自动加载 =====
  useEffect(() => {
    load()

    return () => {
      // 组件卸载时递增 loadId，使进行中的请求失效
      loadIdRef.current += 1
    }
  }, [load])

  return {
    isLoading,
    error,
    retry,
  }
}
