// ===== 底池显示组件 =====

import { motion } from 'framer-motion'
import { Coins } from 'lucide-react'
import { ChipDisplay } from '@/components/common'

interface PotDisplayProps {
  /** 底池金额 */
  pot: number
}

/**
 * 底池显示组件
 * - 放在玩家圈中央
 * - 大号金色 Orbitron 字体
 * - 筹码图标 + 数字滚动动画
 * - 柔和的光晕效果
 */
export default function PotDisplay({ pot }: PotDisplayProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.2 }}
    >
      {/* 光晕背景 */}
      <div className="absolute w-32 h-32 rounded-full bg-accent/5 blur-2xl pointer-events-none" />

      {/* 底池标签 */}
      <div className="flex items-center gap-1 text-foreground-muted">
        <Coins className="w-4 h-4 text-accent/70" />
        <span className="text-xs tracking-wide">底池</span>
      </div>

      {/* 金额数字 */}
      <ChipDisplay
        value={pot}
        size="lg"
        animated
        showIcon={false}
        className="neon-text-gold"
      />
    </motion.div>
  )
}
