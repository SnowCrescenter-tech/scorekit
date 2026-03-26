import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/** 按钮变体类型 */
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';

/** 按钮尺寸 */
type ButtonSize = 'sm' | 'md' | 'lg';

/** 图标位置 */
type IconPosition = 'left' | 'right';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: IconPosition;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

/** 各变体对应的样式映射 */
const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-primary/10 text-primary border border-primary/50',
    'hover:bg-primary/20',
    'shadow-[0_0_10px_var(--color-primary-glow),0_0_30px_var(--color-primary-glow)]',
  ].join(' '),
  secondary: [
    'bg-surface-light text-foreground border border-white/10',
    'hover:bg-surface-lighter',
  ].join(' '),
  danger: [
    'bg-danger/10 text-danger border border-danger/50',
    'hover:bg-danger/20',
  ].join(' '),
  ghost: [
    'bg-transparent text-foreground-muted border border-transparent',
    'hover:bg-white/5 hover:text-foreground',
  ].join(' '),
  accent: [
    'bg-accent/10 text-accent border border-accent/50',
    'hover:bg-accent/20',
    'shadow-[0_0_10px_var(--color-accent-glow),0_0_30px_var(--color-accent-glow)]',
  ].join(' '),
};

/** 各尺寸对应的样式映射 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-[var(--radius-sm)]',
  md: 'px-5 py-2.5 text-base gap-2 rounded-[var(--radius-md)]',
  lg: 'px-7 py-3.5 text-lg gap-2.5 rounded-[var(--radius-lg)]',
};

/** 图标尺寸映射 */
const iconSizeStyles: Record<ButtonSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

/**
 * 通用按钮组件
 * - 支持多种变体和尺寸
 * - 主色/强调色变体带有霓虹发光边框
 * - 点击时有缩放动画
 * - 支持 loading 和 disabled 状态
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  onClick,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      className={[
        'touch-feedback no-select',
        'inline-flex items-center justify-center',
        'font-medium transition-colors duration-200',
        'cursor-pointer',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-40 pointer-events-none' : '',
        className,
      ].join(' ')}
      onClick={onClick}
      disabled={isDisabled}
      whileTap={isDisabled ? undefined : { scale: 0.95 }}
      whileHover={isDisabled ? undefined : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {/* 加载旋转图标 */}
      {loading && (
        <Loader2
          className={`${iconSizeStyles[size]} animate-spin`}
        />
      )}

      {/* 左侧图标 */}
      {!loading && icon && iconPosition === 'left' && (
        <span className={iconSizeStyles[size]}>{icon}</span>
      )}

      {children}

      {/* 右侧图标 */}
      {!loading && icon && iconPosition === 'right' && (
        <span className={iconSizeStyles[size]}>{icon}</span>
      )}
    </motion.button>
  );
}
