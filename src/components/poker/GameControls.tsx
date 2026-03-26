// ===== 游戏控制按钮 =====
// 房主和通用的游戏流程控制按钮

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  SkipForward,
  Trophy,
  Coins,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/common'
import { useGameStore } from '@/stores/gameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { playSound } from '@/utils/sound'
import { vibrate } from '@/utils/vibration'
import type { GamePhase } from '@/types'

/** 阶段推进映射 */
const NEXT_PHASE: Record<GamePhase, GamePhase | null> = {
  preflop: 'flop',
  flop: 'turn',
  turn: 'river',
  river: 'showdown',
  showdown: null,
}

/** 阶段中文名 */
const PHASE_LABEL: Record<GamePhase, string> = {
  preflop: '翻牌前',
  flop: '翻牌',
  turn: '转牌',
  river: '河牌',
  showdown: '摊牌',
}

interface GameControlsProps {
  /** 是否正在游戏回合中 */
  isInRound: boolean
  /** 当前阶段 */
  currentPhase: GamePhase
  /** 推进阶段回调 */
  onAdvancePhase: (nextPhase: GamePhase) => void
  /** 打开结算弹窗回调 */
  onOpenSettlement: () => void
  /** 额外类名 */
  className?: string
}

/**
 * 游戏控制按钮组
 * - 开始新回合（非游戏中时显示）
 * - 一键补盲（快速收取盲注）
 * - 推进阶段（翻牌→转牌→河牌→摊牌）
 * - 结算（打开 SettlementModal）
 */
export default function GameControls({
  isInRound,
  currentPhase,
  onAdvancePhase,
  onOpenSettlement,
  className = '',
}: GameControlsProps) {
  /** 操作面板展开/收起 */
  const [isExpanded, setIsExpanded] = useState(true)

  // 游戏操作 Hook
  const { startRound, autoPostBlinds } = useGameActions()
  const isLoading = useGameStore((s) => s.isLoading)

  /** 下一阶段 */
  const nextPhase = useMemo(() => NEXT_PHASE[currentPhase], [currentPhase])

  // ===== 开始新回合 =====
  const handleStartRound = useCallback(async () => {
    playSound('click')
    vibrate('medium')
    await startRound()
  }, [startRound])

  // ===== 一键补盲 =====
  const handleAutoPostBlinds = useCallback(async () => {
    playSound('click')
    vibrate('light')
    await autoPostBlinds()
  }, [autoPostBlinds])

  // ===== 推进阶段 =====
  const handleAdvancePhase = useCallback(() => {
    if (!nextPhase) return
    playSound('card_flip')
    vibrate('medium')
    onAdvancePhase(nextPhase)
  }, [nextPhase, onAdvancePhase])

  // ===== 结算 =====
  const handleSettle = useCallback(() => {
    playSound('bell')
    vibrate('medium')
    onOpenSettlement()
  }, [onOpenSettlement])

  /** 切换展开/收起 */
  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev)
    playSound('click')
  }, [])

  return (
    <div className={`w-full ${className}`}>
      {/* 展开/收起切换栏 */}
      <button
        onClick={toggleExpand}
        className="w-full flex items-center justify-center gap-1 py-1.5 text-foreground-muted/50 hover:text-foreground-muted transition-colors"
      >
        <span className="text-[10px]">控制面板</span>
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronUp className="w-3 h-3" />
        )}
      </button>

      {/* 控制按钮区域 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {/* ===== 非游戏中：显示开始回合按钮 ===== */}
              {!isInRound && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    onClick={handleStartRound}
                    icon={<Play className="w-5 h-5" />}
                  >
                    开始新回合
                  </Button>
                </motion.div>
              )}

              {/* ===== 游戏中：显示操作按钮 ===== */}
              {isInRound && (
                <>
                  {/* 一键补盲 */}
                  {currentPhase === 'preflop' && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex-1 min-w-[120px]"
                    >
                      <Button
                        variant="accent"
                        size="md"
                        fullWidth
                        loading={isLoading}
                        onClick={handleAutoPostBlinds}
                        icon={<Coins className="w-4 h-4" />}
                      >
                        一键补盲
                      </Button>
                    </motion.div>
                  )}

                  {/* 推进阶段 */}
                  {nextPhase && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex-1 min-w-[120px]"
                    >
                      <Button
                        variant="secondary"
                        size="md"
                        fullWidth
                        loading={isLoading}
                        onClick={handleAdvancePhase}
                        icon={<SkipForward className="w-4 h-4" />}
                      >
                        进入{PHASE_LABEL[nextPhase]}
                      </Button>
                    </motion.div>
                  )}

                  {/* 结算按钮 */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex-1 min-w-[120px]"
                  >
                    <Button
                      variant="accent"
                      size="md"
                      fullWidth
                      loading={isLoading}
                      onClick={handleSettle}
                      icon={<Trophy className="w-4 h-4" />}
                    >
                      结算
                    </Button>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
