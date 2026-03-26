import { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

/** 选项类型 */
export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  /** 选项列表 */
  options: SelectOption[];
  /** 当前值 */
  value?: string;
  /** 值变化回调 */
  onChange?: (value: string) => void;
  /** 占位符 */
  placeholder?: string;
  /** 标签 */
  label?: string;
  /** 禁用 */
  disabled?: boolean;
  /** 额外类名 */
  className?: string;
}

/**
 * 自定义选择器组件（简洁版）
 * - 自定义下拉菜单
 * - 选中态高亮带勾选图标
 * - 点击外部关闭
 */
export default function Select({
  options,
  value,
  onChange,
  placeholder = '请选择',
  label,
  disabled = false,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectId = useId();

  /** 当前选中项 */
  const selectedOption = options.find((opt) => opt.value === value);

  /** 点击外部关闭下拉 */
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {/* 标签 */}
      {label && (
        <label htmlFor={selectId} className="text-sm text-foreground-muted pl-0.5">
          {label}
        </label>
      )}

      {/* 触发器 */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        className={[
          'flex items-center justify-between',
          'bg-surface border border-white/10 rounded-[var(--radius-md)]',
          'px-3.5 py-2.5',
          'text-base text-left',
          'transition-all duration-200',
          'touch-feedback',
          isOpen ? 'border-primary/50 shadow-[0_0_8px_var(--color-primary-glow)]' : '',
          disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer',
        ].join(' ')}
      >
        <span className={selectedOption ? 'text-foreground' : 'text-foreground-dim'}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-foreground-dim transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 下拉菜单 */}
      <div className="relative">
        <AnimatePresence>
          {isOpen && (
            <motion.ul
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className={[
                'absolute top-0 left-0 right-0 z-20',
                'glass',
                'rounded-[var(--radius-md)]',
                'py-1 max-h-60 overflow-y-auto',
                'shadow-xl',
              ].join(' ')}
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li
                    key={opt.value}
                    onClick={() => {
                      onChange?.(opt.value);
                      setIsOpen(false);
                    }}
                    className={[
                      'flex items-center justify-between',
                      'px-3.5 py-2.5 cursor-pointer',
                      'text-base transition-colors',
                      isSelected
                        ? 'text-primary bg-primary/10'
                        : 'text-foreground hover:bg-white/5',
                    ].join(' ')}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
