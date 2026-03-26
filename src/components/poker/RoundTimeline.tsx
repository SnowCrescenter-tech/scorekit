/**
 * 回合时间线组件
 * 纵向时间线布局，展示每个回合的摘要信息
 * 可点击展开查看详细下注记录
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Trophy, Coins } from 'lucide-react'
import { formatChips } from '@/utils/helpers'
import type { RoundRecord } from '@/services/historyService'

interface RoundTimelineProps {
  rounds: RoundRecord[]
}

/** 阶段标签映射 */
const PHASE_LABELS: Record<string, string> = {
  preflop: '翻牌前',
  flop: '翻牌',
  turn: '转牌',
  river: '河牌',
  showdown: '摊牌',
}

/** 下注类型标签映射 */
const BET_TYPE_LABELS: Record<string, string> = {
  blind_small: '小盲',
  blind_big: '大盲',
  ante: '前注',
  call: '跟注',
  raise: '加注',
  fold: '弃牌',
  all_in: 'All In',
  check: '过牌',
}

/** 列表入场动画 */
const timelineVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const nodeVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

/** 展开面板动画 */
const expandVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

export default function RoundTimeline({ rounds }: RoundTimelineProps) {
  const [expandedRound, setExpandedRound] = useState<number | null>(null)

  /** 切换展开/收起 */
  const toggleRound = useCallback((roundNumber: number) => {
    setExpandedRound((prev) => (prev === roundNumber ? null : roundNumber))
  }, [])

  if (rounds.length === 0) {
    return (
      <div className="text-center py-8 text-foreground-dim text-sm">
        暂无回合记录
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* 标题 */}
      <h3 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-3">
        📜 回合详情
      </h3>

      {/* 时间线 */}
      <motion.div
        className="relative"
        variants={timelineVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 纵向时间线轴 */}
        <div className="absolute left-4 top-2 bottom-2 w-px bg-white/10" />

        {rounds.map((round) => {
          const isExpanded = expandedRound === round.roundNumber
          const phaseLabel = PHASE_LABELS[round.phase] ?? round.phase

          return (
            <motion.div
              key={round.roundNumber}
              variants={nodeVariants}
              className="relative pl-10 pb-4 last:pb-0"
            >
              {/* 时间线节点圆点 */}
              <div
                className={[
                  'absolute left-2.5 top-3 w-3 h-3 rounded-full border-2',
                  'transition-colors duration-200',
                  isExpanded
                    ? 'bg-primary border-primary shadow-[0_0_8px_var(--color-primary-glow)]'
                    : 'bg-surface-light border-foreground-dim',
                ].join(' ')}
              />

              {/* 回合卡片 */}
              <button
                onClick={() => toggleRound(round.roundNumber)}
                className={[
                  'w-full text-left p-3 rounded-[var(--radius-md)]',
                  'border transition-all duration-200',
                  'touch-feedback',
                  isExpanded
                    ? 'bg-surface-light border-primary/20'
                    : 'bg-surface/50 border-white/5 hover:border-white/10',
                ].join(' ')}
              >
                {/* 回合摘要 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm text-foreground font-semibold">
                      R{round.roundNumber}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-info/10 text-info border border-info/20">
                      {phaseLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* 底池 */}
                    <div className="flex items-center gap-1 text-xs text-foreground-muted">
                      <Coins className="w-3.5 h-3.5 text-accent" />
                      <span className="font-display">{formatChips(round.pot)}</span>
                    </div>

                    {/* 展开箭头 */}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-foreground-dim" />
                    </motion.div>
                  </div>
                </div>

                {/* 赢家 */}
                {round.winnerNames.length > 0 && (
                  <div className="flex items-center gap-1 mt-1.5 text-xs">
                    <Trophy className="w-3.5 h-3.5 text-accent" />
                    <span className="text-accent font-medium">
                      {round.winnerNames.join(', ')}
                    </span>
                  </div>
                )}
              </button>

              {/* 展开的下注详情 */}
              <AnimatePresence>
                {isExpanded && round.bets.length > 0 && (
                  <motion.div
                    variants={expandVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="overflow-hidden"
                  >
                    <div className="mt-2 ml-1 space-y-1">
                      {round.bets.map((bet, i) => {
                        const betLabel = BET_TYPE_LABELS[bet.betType] ?? bet.betType
                        const isFold = bet.betType === 'fold'
                        const isAllIn = bet.betType === 'all_in'

                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.25 }}
                            className={[
                              'flex items-center justify-between',
                              'px-3 py-1.5 rounded-[var(--radius-sm)]',
                              'text-xs',
                              isFold
                                ? 'bg-danger/5 text-foreground-dim'
                                : isAllIn
                                  ? 'bg-accent/5'
                                  : 'bg-white/[0.02]',
                            ].join(' ')}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-foreground-muted">{bet.playerName}</span>
                              <span
                                className={[
                                  'px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                                  isFold
                                    ? 'bg-danger/10 text-danger'
                                    : isAllIn
                                      ? 'bg-accent/10 text-accent'
                                      : 'bg-primary/10 text-primary',
                                ].join(' ')}
                              >
                                {betLabel}
                              </span>
                            </div>
                            {!isFold && bet.amount > 0 && (
                              <span className="font-display text-foreground-muted">
                                {formatChips(bet.amount)}
                              </span>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 展开但没有下注记录 */}
              <AnimatePresence>
                {isExpanded && round.bets.length === 0 && (
                  <motion.div
                    variants={expandVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="overflow-hidden"
                  >
                    <div className="mt-2 px-3 py-2 text-xs text-foreground-dim text-center">
                      暂无下注记录
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
