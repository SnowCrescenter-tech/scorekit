import { type ReactNode } from 'react';

/** 徽章变体 */
type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  /** 额外类名 */
  className?: string;
}

/** 各变体对应的颜色样式 */
const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-primary/15 text-primary border-primary/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  info: 'bg-info/15 text-info border-info/30',
  neutral: 'bg-surface-lighter text-foreground-muted border-white/10',
};

/**
 * 徽章/标签组件
 * - pill 样式全圆角
 * - 多种颜色变体
 * - 适合显示状态标签
 */
export default function Badge({
  children,
  variant = 'neutral',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center justify-center',
        'px-2.5 py-0.5',
        'text-xs font-medium',
        'rounded-full border',
        'no-select',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
