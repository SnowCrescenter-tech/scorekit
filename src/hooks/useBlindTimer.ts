// ============================================
// ScoreKit - 盲注计时器 Hook
// 管理盲注递增倒计时和级别变化
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { toast } from '@/components/common/Toast'
import { playSound } from '@/utils/sound'
import { vibrate } from '@/utils/vibration'

// ============================================
// 类型定义
// ============================================

interface UseBlindTimerReturn {
  /** 当前盲注级别（从 1 开始） */
  currentLevel: number
  /** 当前小盲注金额 */
  currentSmallBlind: number
  /** 当前大盲注金额 */
  currentBigBlind: number
  /** 距下一级别的剩余秒数 */
  nextLevelIn: number
  /** 计时器是否激活 */
  isActive: boolean
}

// ============================================
// Hook 实现
// ============================================

/**
 * 盲注计时器 Hook
 *
 * 根据房间规则中的盲注递增配置，管理：
 * - 当前盲注级别和金额
 * - 距下一级别的倒计时
 * - 升级时的音效、震动和 toast 提示
 *
 * 计算逻辑：
 * - 级别 1：初始小盲/大盲
 * - 级别 N：小盲 = floor(初始小盲 × 倍数^(N-1))，大盲 = 小盲 × 2
 * - 每隔 blindIncreaseInterval 分钟升一级
 * - 以游戏开始时间（第一回合创建时间）为基准
 */
export const useBlindTimer = (): UseBlindTimerReturn => {
  const currentRoom = useGameStore((s) => s.currentRoom)
  const currentRound = useGameStore((s) => s.currentRound)

  const [currentLevel, setCurrentLevel] = useState(1)
  const [currentSmallBlind, setCurrentSmallBlind] = useState(0)
  const [currentBigBlind, setCurrentBigBlind] = useState(0)
  const [nextLevelIn, setNextLevelIn] = useState(0)
  const [isActive, setIsActive] = useState(false)

  /** 上一次通知的级别，避免重复提示 */
  const lastNotifiedLevelRef = useRef(1)
  /** 计时器 ID */
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  /** 游戏开始时间戳（毫秒） */
  const gameStartTimeRef = useRef<number | null>(null)

  // 提取规则配置
  const rules = currentRoom?.rules ?? null
  const blindIncrease = rules?.blindIncrease ?? false
  const baseSmallBlind = rules?.smallBlind ?? 0
  const baseBigBlind = rules?.bigBlind ?? 0
  const intervalMinutes = rules?.blindIncreaseInterval ?? 10
  const multiplier = rules?.blindIncreaseMultiplier ?? 2

  /**
   * 根据已过时间计算当前盲注级别和金额
   */
  const calculateBlindState = useCallback(() => {
    if (!blindIncrease || !gameStartTimeRef.current) {
      return {
        level: 1,
        smallBlind: baseSmallBlind,
        bigBlind: baseBigBlind,
        remaining: 0,
      }
    }

    const now = Date.now()
    const elapsed = now - gameStartTimeRef.current
    const intervalMs = intervalMinutes * 60 * 1000

    // 当前级别（从 1 开始）
    const level = Math.floor(elapsed / intervalMs) + 1

    // 盲注金额 = 初始值 × 倍数^(level-1)
    const smallBlind = Math.floor(
      baseSmallBlind * Math.pow(multiplier, level - 1)
    )
    const bigBlind = Math.floor(
      baseBigBlind * Math.pow(multiplier, level - 1)
    )

    // 距下一级别的剩余秒数
    const nextLevelTime = level * intervalMs + gameStartTimeRef.current
    const remaining = Math.max(0, Math.ceil((nextLevelTime - now) / 1000))

    return { level, smallBlind, bigBlind, remaining }
  }, [blindIncrease, baseSmallBlind, baseBigBlind, intervalMinutes, multiplier])

  /**
   * 更新状态并检查是否需要通知
   */
  const tick = useCallback(() => {
    const state = calculateBlindState()

    setCurrentLevel(state.level)
    setCurrentSmallBlind(state.smallBlind)
    setCurrentBigBlind(state.bigBlind)
    setNextLevelIn(state.remaining)

    // 级别升级时发出提示（仅在非首次时通知）
    if (
      state.level > 1 &&
      state.level > lastNotifiedLevelRef.current
    ) {
      lastNotifiedLevelRef.current = state.level
      toast.warning(
        `盲注升级！小盲 ${state.smallBlind} / 大盲 ${state.bigBlind}`
      )
      playSound('bell')
      vibrate('medium')
    }
  }, [calculateBlindState])

  // ===== 主 Effect：管理计时器生命周期 =====
  useEffect(() => {
    // 判断是否应该激活计时器
    const shouldActivate =
      blindIncrease &&
      currentRoom?.status === 'playing' &&
      currentRound != null

    if (!shouldActivate) {
      setIsActive(false)
      setCurrentLevel(1)
      setCurrentSmallBlind(baseSmallBlind)
      setCurrentBigBlind(baseBigBlind)
      setNextLevelIn(0)
      lastNotifiedLevelRef.current = 1
      gameStartTimeRef.current = null

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // 确定游戏开始时间
    // 优先使用房间 updated_at（状态变为 playing 的时间），
    // 否则使用当前回合的 created_at
    if (!gameStartTimeRef.current) {
      const startTimeStr = currentRoom?.updated_at ?? currentRound?.created_at
      if (startTimeStr) {
        gameStartTimeRef.current = new Date(startTimeStr).getTime()
      } else {
        gameStartTimeRef.current = Date.now()
      }
    }

    setIsActive(true)

    // 立即计算一次
    tick()

    // 启动每秒更新
    timerRef.current = setInterval(tick, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [
    blindIncrease,
    currentRoom?.status,
    currentRoom?.updated_at,
    currentRound,
    baseSmallBlind,
    baseBigBlind,
    tick,
  ])

  return {
    currentLevel,
    currentSmallBlind,
    currentBigBlind,
    nextLevelIn,
    isActive,
  }
}
