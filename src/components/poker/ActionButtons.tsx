// ===== 操作按钮组 =====
// 弃牌 / 跟注(过牌) / 加注 三个核心操作按钮

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, TrendingUp, AlertTriangle } from 'lucide-react'
import { formatChips } from '@/utils/helpers'
import { playSound } from '@/utils/sound'
import { vibrate } from '@/utils/vibration'
import { useSettingsStore } from '@/stores/settingsStore'
import type { BetType } from '@/types'

interface ActionButtonsProps {
  /** 当前最大下注 */
  currentBet: number
  /** 我的筹码 */
  myChips: number
  /** 我在本轮已下注金额 */
  myBetInRound: number
  /** 加注金额（由 ChipAdjuster 控制） */
  raiseAmount: number
  /** 是否禁用 */
  disabled?: boolean
  /** 操作回调 */
  onAction: (type: BetType, amount?: number) => void
  /** 点击加注按钮时切换调整器显示 */
  onToggleRaise: () => void
  /** 加注调整器是否展开 */
  isRaiseOpen: boolean
}

/**
 * 操作按钮组
 * - 弃牌（红色）: 带确认提示防误触
 * - 跟注/过牌（次要色）: 自动判断跟注或过牌
 * - 加注（主色）: 点击展开 ChipAdjuster
 */
export default function ActionButtons({
  currentBet,
  myChips,
  myBetInRound,
  raiseAmount,
  disabled = false,
  onAction,
  onToggleRaise,
  isRaiseOpen,
}: ActionButtonsProps) {
  /** 弃牌确认状态 */
  const [confirmFold, setConfirmFold] = useState(false)
  /** 弃牌确认自动取消定时器 */
  const [foldTimer, setFoldTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const { soundEnabled, vibrationEnabled } = useSettingsStore()

  /** 播放音效（尊重设置） */
  const sound = useCallback(
    (type: Parameters<typeof playSound>[0]) => {
      if (soundEnabled) playSound(type)
    },
    [soundEnabled]
  )

  /** 触发震动（尊重设置） */
  const vib = useCallback(
    (pattern: Parameters<typeof vibrate>[0]) => {
      if (vibrationEnabled) vibrate(pattern)
    },
    [vibrationEnabled]
  )

  /** 清理弃牌确认定时器 */
  useEffect(() => {
    return () => {
      if (foldTimer) clearTimeout(foldTimer)
    }
  }, [foldTimer])

  // ===== 计算按钮状态 =====

  /** 需要跟注的差额 */
  const callAmount = Math.max(0, currentBet - myBetInRound)

  /** 是否显示为"过牌"（不需要补差额） */
  const isCheck = callAmount === 0

  /** 筹码不足跟注，显示 All-In */
  const isCallAllIn = callAmount > 0 && callAmount >= myChips

  /** 跟注/过牌/All-In 的实际金额 */
  const callActionAmount = isCallAllIn ? myChips : callAmount

  // ===== 弃牌逻辑 =====

  /** 点击弃牌 */
  const handleFold = useCallback(() => {
    if (confirmFold) {
      // 第二次点击 → 确认弃牌
      if (foldTimer) clearTimeout(foldTimer)
      setConfirmFold(false)
      sound('fold')
      vib('medium')
      onAction('fold')
    } else {
      // 第一次点击 → 显示确认
      setConfirmFold(true)
      sound('click')
      vib('light')
      // 3 秒后自动取消确认
      const timer = setTimeout(() => setConfirmFold(false), 3000)
      setFoldTimer(timer)
    }
  }, [confirmFold, foldTimer, onAction, sound, vib])

  // ===== 跟注/过牌逻辑 =====

  const handleCall = useCallback(() => {
    if (isCheck) {
      sound('click')
      vib('light')
      onAction('check')
    } else if (isCallAllIn) {
      sound('all_in')
      vib('heavy')
      onAction('all_in', myChips)
    } else {
      sound('chip_place')
      vib('medium')
      onAction('call', callActionAmount)
    }
  }, [isCheck, isCallAllIn, myChips, callActionAmount, onAction, sound, vib])

  // ===== 加注确认逻辑 =====

  const handleRaiseConfirm = useCallback(() => {
    if (raiseAmount >= myChips) {
      sound('all_in')
      vib('heavy')
      onAction('all_in', myChips)
    } else {
      sound('chip_place')
      vib('medium')
      onAction('raise', raiseAmount)
    }
  }, [raiseAmount, myChips, onAction, sound, vib])

  /** 点击加注按钮 */
  const handleRaiseClick = useCallback(() => {
    if (isRaiseOpen) {
      // 已经展开 → 确认加注
      handleRaiseConfirm()
    } else {
      // 展开调整器
      sound('click')
      vib('light')
      onToggleRaise()
    }
  }, [isRaiseOpen, handleRaiseConfirm, onToggleRaise, sound, vib])

  return (
    <div className="flex items-stretch gap-2 w-full">
      {/* ===== 弃牌按钮 ===== */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleFold}
        disabled={disabled}
        className={[
          'flex-1 flex flex-col items-center justify-center',
          'min-h-[52px] rounded-xl',
          'font-semibold text-sm',
          'transition-all duration-200 touch-feedback',
          'disabled:opacity-30 disabled:pointer-events-none',
          confirmFold
            ? 'bg-danger/30 border-2 border-danger text-danger animate-pulse'
            : 'bg-danger/10 border border-danger/40 text-danger hover:bg-danger/20',
        ].join(' ')}
      >
        <AnimatePresence mode="wait">
          {confirmFold ? (
            <motion.div
              key="confirm"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex items-center gap-1"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>确认弃牌?</span>
            </motion.div>
          ) : (
            <motion.div
              key="normal"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              <span>弃牌</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ===== 跟注/过牌/All-In 按钮 ===== */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleCall}
        disabled={disabled}
        className={[
          'flex-1 flex flex-col items-center justify-center',
          'min-h-[52px] rounded-xl',
          'font-semibold text-sm',
          'transition-all duration-200 touch-feedback',
          'disabled:opacity-30 disabled:pointer-events-none',
          isCallAllIn
            ? 'bg-amber-500/15 border border-amber-400/50 text-amber-400 hover:bg-amber-500/25'
            : 'bg-surface-light border border-white/10 text-foreground hover:bg-surface-lighter',
        ].join(' ')}
      >
        <Check className="w-4 h-4 mb-0.5" />
        {isCheck ? (
          <span>过牌</span>
        ) : isCallAllIn ? (
          <div className="flex flex-col items-center">
            <span>All-In</span>
            <span className="font-display text-xs text-amber-400/80">
              {formatChips(myChips)}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span>跟注</span>
            <span className="font-display text-xs text-accent">
              {formatChips(callActionAmount)}
            </span>
          </div>
        )}
      </motion.button>

      {/* ===== 加注按钮 ===== */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleRaiseClick}
        disabled={disabled || myChips <= callAmount}
        className={[
          'flex-1 flex flex-col items-center justify-center',
          'min-h-[52px] rounded-xl',
          'font-semibold text-sm',
          'transition-all duration-200 touch-feedback',
          'disabled:opacity-30 disabled:pointer-events-none',
          isRaiseOpen
            ? 'bg-primary/25 border-2 border-primary text-primary shadow-[0_0_12px_var(--color-primary-glow)]'
            : 'bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20',
        ].join(' ')}
      >
        <TrendingUp className="w-4 h-4 mb-0.5" />
        {isRaiseOpen ? (
          <div className="flex flex-col items-center">
            <span>确认加注</span>
            <span className="font-display text-xs">
              {raiseAmount >= myChips ? 'All-In' : formatChips(raiseAmount)}
            </span>
          </div>
        ) : (
          <span>加注</span>
        )}
      </motion.button>
    </div>
  )
}
