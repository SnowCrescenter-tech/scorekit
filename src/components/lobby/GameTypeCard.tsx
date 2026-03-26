/**
 * 游戏类型卡片组件
 * - 展示游戏图标、名称、描述和在线人数
 * - 支持可用/即将开放两种状态
 * - 可用时带有 hover 缩放与发光效果
 * - 入场时有 stagger 延迟渐入动画
 */

import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface GameTypeCardProps {
  /** 游戏图标 (emoji) */
  icon: string;
  /** 游戏名称 */
  name: string;
  /** 简短描述 */
  description: string;
  /** 是否可用 */
  available: boolean;
  /** 在线人数（伪数据） */
  playerCount?: number;
  /** 点击回调 */
  onClick: () => void;
  /** stagger 动画延迟索引 */
  index?: number;
}

export default function GameTypeCard({
  icon,
  name,
  description,
  available,
  playerCount,
  onClick,
  index = 0,
}: GameTypeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.15 + index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={available ? { scale: 1.04 } : undefined}
      whileTap={available ? { scale: 0.97 } : undefined}
      onClick={available ? onClick : undefined}
      className={[
        'relative overflow-hidden rounded-[var(--radius-lg)]',
        'glass p-4 flex flex-col gap-2',
        'transition-shadow duration-300',
        available
          ? 'cursor-pointer hover:shadow-[0_0_20px_var(--color-primary-glow)] hover:border-primary/40'
          : 'opacity-50 cursor-not-allowed',
      ].join(' ')}
    >
      {/* 不可用遮罩 */}
      {!available && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-[var(--radius-lg)]">
          <span className="text-xs font-medium text-foreground-muted bg-surface-lighter/80 px-3 py-1.5 rounded-full border border-white/10">
            即将开放
          </span>
        </div>
      )}

      {/* 图标 */}
      <span className="text-3xl leading-none no-select" role="img">
        {icon}
      </span>

      {/* 名称 */}
      <h3 className="font-display text-sm font-semibold text-foreground tracking-wide">
        {name}
      </h3>

      {/* 描述 */}
      <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2">
        {description}
      </p>

      {/* 在线人数 */}
      {playerCount !== undefined && available && (
        <div className="flex items-center gap-1 mt-auto pt-1">
          <Users className="w-3 h-3 text-primary" />
          <span className="text-xs text-primary font-display">
            {playerCount}
          </span>
          <span className="text-xs text-foreground-dim">在线</span>
        </div>
      )}
    </motion.div>
  );
}
