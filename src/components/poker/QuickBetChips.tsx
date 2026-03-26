// ===== 快速下注筹码组件 =====
// 一行预设的快速下注按钮，支持水平滚动

import { useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { formatChips } from '@/utils/helpers'

interface QuickBetOption {
  /** 显示标签 */
  label: string
  /** 实际金额 */
  amount: number
  /** 筹码颜色（Tailwind 文本色 + 边框色） */
  color: string
  /** 背景色 */
  bg: string
}

interface QuickBetChipsProps {
  /** 当前最大下注 */
  currentBet: number
  /** 我的筹码 */
  myChips: number
  /** 最小加注额 */
  minRaise: number
  /** 底池 */
  pot: number
  /** 选择后的回调 */
  onSelect: (amount: number) => void
  /** 当前选中金额 */
  selectedAmount?: number
}

/**
 * 快速下注筹码选择条
 * - 赌场筹码币样式（圆形）
 * - 不同面额不同颜色
 * - 水平滚动
 */
export default function QuickBetChips({
  currentBet,
  myChips,
  minRaise,
  pot,
  onSelect,
  selectedAmount,
}: QuickBetChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  /** 计算快速下注选项 */
  const options = useMemo<QuickBetOption[]>(() => {
    const opts: QuickBetOption[] = []

    // 2x 当前下注
    const x2 = currentBet * 2
    if (x2 > 0 && x2 >= minRaise && x2 <= myChips) {
      opts.push({
        label: `2x`,
        amount: x2,
        color: 'text-blue-400 border-blue-400/60',
        bg: 'bg-blue-500/15',
      })
    }

    // 3x 当前下注
    const x3 = currentBet * 3
    if (x3 > 0 && x3 >= minRaise && x3 <= myChips) {
      opts.push({
        label: `3x`,
        amount: x3,
        color: 'text-blue-300 border-blue-300/60',
        bg: 'bg-blue-400/15',
      })
    }

    // 1/2 底池
    const halfPot = Math.round(pot / 2)
    if (halfPot > 0 && halfPot >= minRaise && halfPot <= myChips) {
      opts.push({
        label: `½ Pot`,
        amount: halfPot,
        color: 'text-emerald-400 border-emerald-400/60',
        bg: 'bg-emerald-500/15',
      })
    }

    // 底池
    if (pot > 0 && pot >= minRaise && pot <= myChips) {
      opts.push({
        label: `Pot`,
        amount: pot,
        color: 'text-red-400 border-red-400/60',
        bg: 'bg-red-500/15',
      })
    }

    // All-In（只要筹码大于最小加注）
    if (myChips > 0) {
      opts.push({
        label: `All-In`,
        amount: myChips,
        color: 'text-amber-400 border-amber-400/60',
        bg: 'bg-amber-500/15',
      })
    }

    return opts
  }, [currentBet, myChips, minRaise, pot])

  if (options.length === 0) return null

  return (
    <div className="w-full">
      {/* 滚动容器 */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {options.map((opt) => {
          const isSelected = selectedAmount === opt.amount
          return (
            <motion.button
              key={opt.label}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => onSelect(opt.amount)}
              className={[
                'shrink-0 flex flex-col items-center justify-center',
                'w-16 h-16 rounded-full',
                'border-2',
                opt.color,
                opt.bg,
                'transition-all duration-200',
                isSelected
                  ? 'ring-2 ring-white/40 scale-110 shadow-lg'
                  : 'hover:brightness-125',
              ].join(' ')}
            >
              {/* 标签 */}
              <span className="text-xs font-bold leading-none">
                {opt.label}
              </span>
              {/* 金额 */}
              <span className="text-[10px] font-display mt-0.5 opacity-80">
                {formatChips(opt.amount)}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
