import { type ReactNode, type InputHTMLAttributes, useId } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** 标签文字 */
  label?: string;
  /** 错误提示 */
  error?: string;
  /** 左侧图标 */
  prefix?: ReactNode;
  /** 右侧图标 */
  suffix?: ReactNode;
  /** 额外容器类名 */
  wrapperClassName?: string;
}

/**
 * 深色风格输入框组件
 * - 支持 label, 前后缀图标, 错误提示
 * - 聚焦时主色发光边框
 * - 适配移动端字号
 */
export default function Input({
  label,
  error,
  prefix,
  suffix,
  wrapperClassName = '',
  className = '',
  id: propId,
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = propId ?? autoId;

  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
      {/* 标签 */}
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm text-foreground-muted pl-0.5"
        >
          {label}
        </label>
      )}

      {/* 输入框容器 */}
      <div
        className={[
          'group flex items-center gap-2',
          'bg-surface border border-white/10 rounded-[var(--radius-md)]',
          'px-3.5 py-2.5',
          'transition-all duration-200',
          'focus-within:border-primary/50 focus-within:shadow-[0_0_8px_var(--color-primary-glow)]',
          error ? 'border-danger/50 shadow-[0_0_8px_var(--color-danger-glow)]' : '',
        ].join(' ')}
      >
        {/* 前缀图标 */}
        {prefix && (
          <span className="text-foreground-dim shrink-0 w-5 h-5">
            {prefix}
          </span>
        )}

        <input
          id={inputId}
          className={[
            'flex-1 bg-transparent outline-none',
            'text-foreground placeholder:text-foreground-dim',
            'text-base',
            className,
          ].join(' ')}
          {...rest}
        />

        {/* 后缀图标 */}
        {suffix && (
          <span className="text-foreground-dim shrink-0 w-5 h-5">
            {suffix}
          </span>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <p className="text-xs text-danger pl-0.5">{error}</p>
      )}
    </div>
  );
}
