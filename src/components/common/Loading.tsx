import { motion } from 'framer-motion';

/** 加载组件显示模式 */
type LoadingVariant = 'fullscreen' | 'inline';

interface LoadingProps {
  /** 加载提示文字（如 "加载中..."、"连接中..."） */
  text?: string;
  /** 显示模式：fullscreen 全屏遮罩 / inline 行内嵌入（默认 fullscreen） */
  variant?: LoadingVariant;
  /** @deprecated 请使用 variant 代替 */
  fullscreen?: boolean;
  /** 额外类名 */
  className?: string;
}

/** 筹码堆叠颜色 */
const chipColors = [
  'var(--color-primary)',
  'var(--color-accent)',
  'var(--color-info)',
  'var(--color-danger)',
];

/**
 * 加载组件
 * - 全屏遮罩 + 毛玻璃背景
 * - 筹码堆叠旋转动画
 * - 可选加载文字
 */
export default function Loading({
  text,
  variant,
  fullscreen = true,
  className = '',
}: LoadingProps) {
  // 兼容旧 fullscreen prop，优先使用 variant
  const isFullscreen = variant ? variant === 'fullscreen' : fullscreen;

  const content = (
    <div className={`flex flex-col items-center justify-center gap-5 ${className}`}>
      {/* 筹码堆叠动画 */}
      <div className="relative w-16 h-16">
        {chipColors.map((color, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: color,
              boxShadow: `0 0 12px ${color}40`,
            }}
            animate={{
              rotate: 360,
              scale: [1, 0.9, 1],
            }}
            transition={{
              rotate: {
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.15,
              },
              scale: {
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.15,
              },
            }}
          />
        ))}

        {/* 中心点 */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* 加载文字 */}
      {text && (
        <motion.p
          className="text-sm text-foreground-muted"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (!isFullscreen) return content;

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {content}
    </motion.div>
  );
}
