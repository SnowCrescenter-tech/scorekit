import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins } from 'lucide-react';

/** 尺寸类型 */
type ChipSize = 'sm' | 'md' | 'lg';

interface ChipDisplayProps {
  /** 筹码数量 */
  value: number;
  /** 尺寸 */
  size?: ChipSize;
  /** 是否启用数字变化动画 */
  animated?: boolean;
  /** 是否显示筹码图标 */
  showIcon?: boolean;
  /** 是否显示正负号 */
  showSign?: boolean;
  /** 前缀文字（如 "$"） */
  prefix?: string;
  /** 额外类名 */
  className?: string;
}

/** 尺寸样式映射 */
const sizeStyles: Record<ChipSize, { text: string; icon: string; gap: string }> = {
  sm: { text: 'text-lg', icon: 'w-4 h-4', gap: 'gap-1' },
  md: { text: 'text-2xl', icon: 'w-5 h-5', gap: 'gap-1.5' },
  lg: { text: 'text-4xl', icon: 'w-7 h-7', gap: 'gap-2' },
};

/**
 * 格式化数字，添加千位分隔符
 */
function formatNumber(n: number): string {
  return Math.abs(n).toLocaleString('en-US');
}

/**
 * 筹码数量显示组件（核心组件）
 * - Orbitron 金色大字体
 * - 数字变化时弹跳/滚动动画
 * - 正数绿色 + 号，负数红色 - 号
 * - 可选筹码图标
 */
export default function ChipDisplay({
  value,
  size = 'md',
  animated = true,
  showIcon = false,
  showSign = false,
  prefix = '',
  className = '',
}: ChipDisplayProps) {
  const s = sizeStyles[size];
  const prevValue = useRef(value);
  const [displayValue, setDisplayValue] = useState(value);
  const [isChanging, setIsChanging] = useState(false);

  /** 数字颜色：正数绿色，负数红色，零为金色 */
  const colorClass =
    showSign && value > 0
      ? 'text-primary neon-text-green'
      : showSign && value < 0
        ? 'text-danger'
        : 'text-accent neon-text-gold';

  /** 正负号 */
  const sign = showSign ? (value > 0 ? '+' : value < 0 ? '-' : '') : '';

  /** 动画滚动数字 */
  useEffect(() => {
    if (!animated || prevValue.current === value) {
      setDisplayValue(value);
      prevValue.current = value;
      return;
    }

    setIsChanging(true);
    const from = prevValue.current;
    const to = value;
    const diff = to - from;
    const steps = 20;
    const stepDuration = 300 / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        setDisplayValue(to);
        setIsChanging(false);
        clearInterval(timer);
      } else {
        // 使用 easeOut 缓动
        const progress = 1 - Math.pow(1 - step / steps, 3);
        setDisplayValue(Math.round(from + diff * progress));
      }
    }, stepDuration);

    prevValue.current = value;
    return () => clearInterval(timer);
  }, [value, animated]);

  return (
    <div
      className={[
        'inline-flex items-center',
        s.gap,
        'no-select',
        className,
      ].join(' ')}
    >
      {/* 筹码图标 */}
      {showIcon && (
        <Coins className={`${s.icon} text-accent`} />
      )}

      {/* 数字显示 */}
      <AnimatePresence mode="popLayout">
        <motion.span
          key={animated ? `chip-${value}` : 'chip-static'}
          className={[
            'font-display font-bold tabular-nums',
            s.text,
            colorClass,
          ].join(' ')}
          initial={animated && isChanging ? { y: -8, opacity: 0.5 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {prefix}
          {sign}
          {formatNumber(displayValue)}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
