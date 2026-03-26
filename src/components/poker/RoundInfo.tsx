// ===== 回合信息组件 =====

import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { Badge } from '@/components/common'
import { formatChips } from '@/utils/helpers'
import type { GamePhase } from '@/types'

interface RoundInfoProps {
  /** 当前游戏阶段 */
  phase: GamePhase
  /** 当前回合数 */
  roundNumber: number
  /** 小盲注 */
  smallBlind: number
  /** 大盲注 */
  bigBlind: number
  /** 盲注是否递增 */
  blindIncrease: boolean
  /** 下次递增倒计时（秒），undefined 表示不递增 */
  nextBlindIncreaseIn?: number
}

/** 游戏阶段中文名称映射 */
const PHASE_LABELS: Record<GamePhase, string> = {
  preflop: '翻牌前',
  flop: '翻牌',
  turn: '转牌',
  river: '河牌',
  showdown: '摊牌',
}

/** 游戏阶段 Badge 变体映射 */
const PHASE_VARIANTS: Record<GamePhase, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  preflop: 'neutral',
  flop: 'info',
  turn: 'warning',
  river: 'danger',
  showdown: 'success',
}

/**
 * 回合信息组件
 * - 显示当前阶段（翻牌前/翻牌/转牌/河牌/摊牌）
 * - 回合数 + 盲注级别
 * - 盲注递增倒计时
 */
export default function RoundInfo({
  phase,
  roundNumber,
  smallBlind,
  bigBlind,
  blindIncrease,
  nextBlindIncreaseIn,
}: RoundInfoProps) {
  /** 格式化倒计时 */
  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-1.5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
    >
      {/* 游戏阶段标签 */}
      <Badge variant={PHASE_VARIANTS[phase]} className="!text-[10px]">
        {PHASE_LABELS[phase]}
      </Badge>

      {/* 回合数 + 盲注 */}
      <div className="flex items-center gap-2 text-[10px] text-foreground-dim">
        <span>第 {roundNumber} 手</span>
        <span className="text-foreground-dim/50">|</span>
        <span className="font-display text-foreground-muted">
          {formatChips(smallBlind)}/{formatChips(bigBlind)}
        </span>
      </div>

      {/* 盲注递增倒计时 */}
      {blindIncrease && nextBlindIncreaseIn != null && (
        <motion.div
          className="flex items-center gap-1 text-[9px] text-warning"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <TrendingUp className="w-3 h-3" />
          <span>盲注递增 {formatCountdown(nextBlindIncreaseIn)}</span>
        </motion.div>
      )}
    </motion.div>
  )
}
