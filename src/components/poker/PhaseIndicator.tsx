// ===== 阶段指示器 =====
// 显示当前游戏阶段：翻牌前 → 翻牌 → 转牌 → 河牌 → 摊牌

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { GamePhase } from '@/types'

/** 阶段定义 */
const PHASES: { key: GamePhase; label: string }[] = [
  { key: 'preflop', label: '翻牌前' },
  { key: 'flop', label: '翻牌' },
  { key: 'turn', label: '转牌' },
  { key: 'river', label: '河牌' },
  { key: 'showdown', label: '摊牌' },
]

interface PhaseIndicatorProps {
  /** 当前阶段 */
  currentPhase: GamePhase
  /** 额外类名 */
  className?: string
}

/**
 * 阶段指示器
 * - 五个圆点/标签代表五个阶段
 * - 当前阶段高亮 + 脉冲动画
 * - 已过阶段打勾 + 暗化
 * - 未到阶段灰色
 */
export default function PhaseIndicator({
  currentPhase,
  className = '',
}: PhaseIndicatorProps) {
  /** 获取当前阶段索引 */
  const currentIndex = useMemo(
    () => PHASES.findIndex((p) => p.key === currentPhase),
    [currentPhase],
  )

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {PHASES.map((phase, index) => {
        const isPast = index < currentIndex
        const isCurrent = index === currentIndex
        const isFuture = index > currentIndex

        return (
          <div key={phase.key} className="flex items-center">
            {/* 阶段圆点 + 标签 */}
            <motion.div
              className="flex flex-col items-center gap-1"
              animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
              transition={
                isCurrent
                  ? { repeat: Infinity, duration: 2, ease: 'easeInOut' }
                  : {}
              }
            >
              {/* 圆点 */}
              <div
                className={[
                  'w-6 h-6 rounded-full flex items-center justify-center',
                  'transition-all duration-300',
                  'text-[10px] font-bold',
                  isCurrent &&
                    'bg-primary text-background shadow-[0_0_10px_var(--color-primary-glow)] ring-2 ring-primary/30',
                  isPast &&
                    'bg-primary/20 text-primary/70 border border-primary/30',
                  isFuture &&
                    'bg-white/5 text-foreground-muted/40 border border-white/10',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {isPast ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* 标签文字 */}
              <span
                className={[
                  'text-[10px] leading-none whitespace-nowrap transition-colors duration-300',
                  isCurrent && 'text-primary font-semibold',
                  isPast && 'text-primary/50',
                  isFuture && 'text-foreground-muted/30',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {phase.label}
              </span>
            </motion.div>

            {/* 连接线（最后一个不显示） */}
            {index < PHASES.length - 1 && (
              <div
                className={[
                  'w-4 h-px mx-0.5 mt-[-12px]',
                  'transition-colors duration-300',
                  index < currentIndex
                    ? 'bg-primary/40'
                    : 'bg-white/8',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
