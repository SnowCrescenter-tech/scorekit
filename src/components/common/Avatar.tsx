/** 头像尺寸类型 */
type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  /** emoji 字符作为头像 */
  emoji: string;
  /** 尺寸 */
  size?: AvatarSize;
  /** 背景色（Tailwind 类名或 CSS 颜色，默认使用 surface-light） */
  bgColor?: string;
  /** 是否显示在线状态小绿点 */
  online?: boolean;
  /** 是否显示发光边框 */
  glow?: boolean;
  /** 额外类名 */
  className?: string;
}

/** 尺寸样式映射 */
const sizeStyles: Record<AvatarSize, { container: string; emoji: string; dot: string }> = {
  sm: { container: 'w-8 h-8', emoji: 'text-base', dot: 'w-2 h-2 -bottom-0.5 -right-0.5' },
  md: { container: 'w-12 h-12', emoji: 'text-2xl', dot: 'w-3 h-3 bottom-0 right-0' },
  lg: { container: 'w-16 h-16', emoji: 'text-4xl', dot: 'w-3.5 h-3.5 bottom-0 right-0' },
};

/**
 * 头像组件
 * - 使用 emoji 作为头像内容
 * - 圆形背景 + 可选发光边框
 * - 在线状态小绿点指示器
 */
export default function Avatar({
  emoji,
  size = 'md',
  bgColor,
  online,
  glow = false,
  className = '',
}: AvatarProps) {
  const s = sizeStyles[size];

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {/* 头像主体 */}
      <div
        className={[
          s.container,
          'rounded-full flex items-center justify-center',
          'no-select',
          glow
            ? 'border-2 border-primary/50 shadow-[0_0_10px_var(--color-primary-glow)]'
            : 'border border-white/10',
        ].join(' ')}
        style={{
          background: bgColor ?? 'var(--color-surface-light)',
        }}
      >
        <span className={s.emoji} role="img">
          {emoji}
        </span>
      </div>

      {/* 在线状态绿点 */}
      {online !== undefined && (
        <span
          className={[
            'absolute rounded-full border-2 border-background',
            s.dot,
            online ? 'bg-primary' : 'bg-foreground-dim',
          ].join(' ')}
        />
      )}
    </div>
  );
}
