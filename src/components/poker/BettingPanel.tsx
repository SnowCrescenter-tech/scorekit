// ===== 下注操作面板（核心组件） =====
// 固定在游戏房间底部的操作面板，玩家最频繁交互的区域

import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QuickBetChips from './QuickBetChips'
import ChipAdjuster from './ChipAdjuster'
import ActionButtons from './ActionButtons'
import { useGameStore } from '@/stores/gameStore'
import { playSound } from '@/utils/sound'
import { vibrate } from '@/utils/vibration'
import { useSettingsStore } from '@/stores/settingsStore'
import type { BetType, GamePhase } from '@/types'

interface BettingPanelProps {
  /** 当前最大下注 */
  currentBet: number
  /** 我的筹码 */
  myChips: number
  /** 最小加注额 */
  minRaise: number
  /** 底池 */
  pot: number
  /** 当前阶段 */
  phase: GamePhase
  /** 是否轮到我 */
  isMyTurn: boolean
  /** 操作回调 */
  onAction: (type: BetType, amount?: number) => void
}

/** 面板弹出动画 */
const panelVariants = {
  inactive: {
    y: 8,
    opacity: 0.5,
    scale: 0.98,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
  active: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
}

/**
 * 下注操作面板
 * - 非我的回合时半透明且不可操作
 * - 轮到操作时弹起 + 震动提醒
 * - 包含快速下注、筹码调整器、操作按钮三个区域
 */
export default function BettingPanel({
  currentBet,
  myChips,
  minRaise,
  pot,
  phase,
  isMyTurn,
  onAction,
}: BettingPanelProps) {
  /** 是否展开加注调整器 */
  const [isRaiseOpen, setIsRaiseOpen] = useState(false)
  /** 加注金额（默认为最小加注额） */
  const [raiseAmount, setRaiseAmount] = useState(minRaise)

  /** 从 store 获取我在当前回合的下注 */
  const myPlayer = useGameStore((s) => s.myPlayer)
  const getPlayerBetInRound = useGameStore((s) => s.getPlayerBetInRound)
  const { soundEnabled, vibrationEnabled } = useSettingsStore()
  const myBetInRound = useMemo(
    () => (myPlayer ? getPlayerBetInRound(myPlayer.id) : 0),
    [myPlayer, getPlayerBetInRound],
  )

  /** 步进值（取大盲注的 1/10 或 1，至少为 1） */
  const adjustStep = useMemo(() => Math.max(1, Math.round(minRaise / 10)), [minRaise])

  // ===== 轮到我时的提醒效果 =====
  useEffect(() => {
    if (isMyTurn) {
      if (soundEnabled) playSound('bell')
      if (vibrationEnabled) vibrate('double')
    }
  }, [isMyTurn, soundEnabled, vibrationEnabled])

  // ===== 最小加注额变化时重置加注额 =====
  useEffect(() => {
    setRaiseAmount(minRaise)
    setIsRaiseOpen(false)
  }, [minRaise, phase])

  /** 切换加注调整器 */
  const toggleRaise = useCallback(() => {
    setIsRaiseOpen((prev) => !prev)
  }, [])

  /** 快速下注选择 */
  const handleQuickSelect = useCallback(
    (amount: number) => {
      setRaiseAmount(amount)
      setIsRaiseOpen(true)
      if (soundEnabled) playSound('click')
      if (vibrationEnabled) vibrate('light')
    },
    [soundEnabled, vibrationEnabled],
  )

  /** 操作分发（关闭调整器 + 回调） */
  const handleAction = useCallback(
    (type: BetType, amount?: number) => {
      setIsRaiseOpen(false)
      onAction(type, amount)
    },
    [onAction],
  )

  return (
    <motion.div
      variants={panelVariants}
      animate={isMyTurn ? 'active' : 'inactive'}
      className={[
        'w-full',
        'bg-gradient-to-t from-[#0a0f1c] via-[#111827]/95 to-transparent',
        'backdrop-blur-md',
        'border-t border-white/5',
        'px-4 pt-3 pb-safe safe-area-bottom',
        // 不可操作时的样式
        !isMyTurn && 'pointer-events-none select-none',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* 当前回合提示 */}
      {isMyTurn && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center mb-2"
        >
          <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/30">
            轮到你操作
          </span>
        </motion.div>
      )}

      {/* ===== 加注调整区域（展开时显示） ===== */}
      <AnimatePresence>
        {isRaiseOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="pb-3 space-y-3">
              {/* 快速下注筹码 */}
              <QuickBetChips
                currentBet={currentBet}
                myChips={myChips}
                minRaise={minRaise}
                pot={pot}
                onSelect={handleQuickSelect}
                selectedAmount={raiseAmount}
              />

              {/* 筹码调整器 */}
              <ChipAdjuster
                value={raiseAmount}
                onChange={setRaiseAmount}
                min={minRaise}
                max={myChips}
                step={adjustStep}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== 当加注未展开时显示快速下注筹码 ===== */}
      {!isRaiseOpen && (
        <div className="mb-3">
          <QuickBetChips
            currentBet={currentBet}
            myChips={myChips}
            minRaise={minRaise}
            pot={pot}
            onSelect={handleQuickSelect}
            selectedAmount={raiseAmount}
          />
        </div>
      )}

      {/* ===== 操作按钮区 ===== */}
      <div className="pb-3">
        <ActionButtons
          currentBet={currentBet}
          myChips={myChips}
          myBetInRound={myBetInRound}
          raiseAmount={raiseAmount}
          disabled={!isMyTurn}
          onAction={handleAction}
          onToggleRaise={toggleRaise}
          isRaiseOpen={isRaiseOpen}
        />
      </div>
    </motion.div>
  )
}
