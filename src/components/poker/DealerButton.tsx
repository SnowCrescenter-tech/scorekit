// ===== 庄家按钮（Dealer Button） =====

import { motion } from 'framer-motion'

interface DealerButtonProps {
  /** 位置坐标 */
  position: { x: number; y: number }
}

/**
 * 庄家按钮
 * - 白色圆形，黑色 D 字母
 * - 阴影发光效果
 * - 回合切换时移动动画（layoutId 或 position 动画）
 */
export default function DealerButton({ position }: DealerButtonProps) {
  return (
    <motion.div
      className="absolute z-20 pointer-events-none"
      animate={{
        x: position.x,
        y: position.y,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
        mass: 0.8,
      }}
      style={{
        // 以中心定位
        marginLeft: -14,
        marginTop: -14,
      }}
    >
      <div
        className={[
          'w-7 h-7 rounded-full',
          'bg-white',
          'flex items-center justify-center',
          'shadow-[0_0_8px_rgba(255,255,255,0.4),0_2px_6px_rgba(0,0,0,0.5)]',
          'border border-gray-200',
        ].join(' ')}
      >
        <span className="text-xs font-bold text-gray-900 font-display leading-none select-none">
          D
        </span>
      </div>
    </motion.div>
  )
}
