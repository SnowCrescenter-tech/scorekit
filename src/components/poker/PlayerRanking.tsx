/**
 * 玩家排名组件
 * 显示按盈亏降序排列的玩家列表，含奖台效果
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Crown, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { Avatar, ChipDisplay } from '@/components/common'
import { formatChips } from '@/utils/helpers'
import type { PlayerRecord } from '@/services/historyService'

interface PlayerRankingProps {
  players: PlayerRecord[]
}

/** 列表入场动画 */
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

/** 排名奖牌配置 */
const RANK_BADGES: Record<number, { icon: string; color: string; glow: string; label: string }> = {
  1: {
    icon: '👑',
    color: 'text-accent',
    glow: 'shadow-[0_0_12px_var(--color-accent-glow)]',
    label: '冠军',
  },
  2: {
    icon: '🥈',
    color: 'text-gray-300',
    glow: 'shadow-[0_0_8px_rgba(192,192,192,0.3)]',
    label: '亚军',
  },
  3: {
    icon: '🥉',
    color: 'text-amber-600',
    glow: 'shadow-[0_0_8px_rgba(205,127,50,0.3)]',
    label: '季军',
  },
}

export default function PlayerRanking({ players }: PlayerRankingProps) {
  /** 按盈亏降序排列 */
  const sorted = useMemo(
    () => [...players].sort((a, b) => b.profit - a.profit),
    [players],
  )

  if (sorted.length === 0) return null

  return (
    <motion.div
      className="space-y-2"
      variants={listVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 标题 */}
      <h3 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-3">
        🏆 玩家排名
      </h3>

      {sorted.map((player, index) => {
        const rank = index + 1
        const badge = RANK_BADGES[rank]
        const isPositive = player.profit > 0
        const isNegative = player.profit < 0
        const isChampion = rank === 1

        return (
          <motion.div
            key={player.id}
            variants={itemVariants}
            className={[
              'flex items-center gap-3 p-3 rounded-[var(--radius-lg)]',
              'border transition-colors',
              isChampion
                ? 'bg-accent/5 border-accent/20'
                : 'bg-surface-light/50 border-white/5 hover:border-white/10',
            ].join(' ')}
          >
            {/* 排名序号 / 奖牌 */}
            <div className="flex items-center justify-center w-8 shrink-0">
              {badge ? (
                <span className="text-xl">{badge.icon}</span>
              ) : (
                <span className="font-display text-sm text-foreground-dim">
                  {rank}
                </span>
              )}
            </div>

            {/* 头像 */}
            <Avatar
              emoji={player.avatar}
              size="sm"
              glow={isChampion}
            />

            {/* 名字 + 筹码变化 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={[
                  'font-medium text-sm truncate',
                  isChampion ? 'text-accent neon-text-gold' : 'text-foreground',
                ].join(' ')}>
                  {player.name}
                </span>
                {isChampion && (
                  <Crown className="w-3.5 h-3.5 text-accent shrink-0" />
                )}
              </div>

              {/* 起始 → 结束筹码 */}
              <div className="flex items-center gap-1 text-xs text-foreground-dim mt-0.5">
                <span className="font-display">{formatChips(player.startingChips)}</span>
                <ArrowRight className="w-3 h-3" />
                <span className="font-display">{formatChips(player.finalChips)}</span>
              </div>
            </div>

            {/* 盈亏数字 */}
            <div className="flex items-center gap-1 shrink-0">
              {isPositive && <TrendingUp className="w-4 h-4 text-primary" />}
              {isNegative && <TrendingDown className="w-4 h-4 text-danger" />}
              <ChipDisplay
                value={player.profit}
                size="sm"
                showSign
                animated={false}
              />
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
