import {
  type ChangeEvent,
  useCallback,
  useMemo,
} from 'react';

interface SliderProps {
  /** 当前值 */
  value: number;
  /** 值变化回调 */
  onChange: (value: number) => void;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 步进值 */
  step?: number;
  /** 标签 */
  label?: string;
  /** 是否显示当前值 */
  showValue?: boolean;
  /** 值的格式化函数 */
  formatValue?: (val: number) => string;
  /** 禁用 */
  disabled?: boolean;
  /** 额外类名 */
  className?: string;
}

/**
 * 滑块组件
 * - 渐变色轨道
 * - 较大的拖拽手柄，方便触摸操作
 * - 显示当前值（Orbitron 字体）
 */
export default function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  formatValue,
  disabled = false,
  className = '',
}: SliderProps) {
  /** 计算进度百分比 */
  const progress = useMemo(
    () => ((value - min) / (max - min)) * 100,
    [value, min, max],
  );

  /** 格式化显示值 */
  const displayValue = useMemo(
    () => (formatValue ? formatValue(value) : String(value)),
    [value, formatValue],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange],
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* 标签行 */}
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-sm text-foreground-muted">{label}</span>
          )}
          {showValue && (
            <span className="text-sm font-display text-accent tabular-nums">
              {displayValue}
            </span>
          )}
        </div>
      )}

      {/* 滑块 */}
      <div className="relative h-10 flex items-center">
        {/* 自定义轨道（背景层） */}
        <div className="absolute left-0 right-0 h-2 rounded-full bg-surface-lighter overflow-hidden">
          {/* 进度条 - 渐变色 */}
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--color-primary-dim), var(--color-primary))',
              boxShadow: '0 0 8px var(--color-primary-glow)',
            }}
          />
        </div>

        {/* 原生 range 输入（透明，覆盖在上层获取交互） */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={[
            'slider-input',
            'absolute left-0 right-0 w-full h-10',
            'appearance-none bg-transparent cursor-pointer',
            'outline-none',
            disabled ? 'opacity-40 pointer-events-none' : '',
          ].join(' ')}
          style={
            {
              /* 用 CSS 变量传递进度给 thumb 定位 */
              '--slider-progress': `${progress}%`,
            } as React.CSSProperties
          }
        />
      </div>

      {/* min / max 标注 */}
      <div className="flex justify-between">
        <span className="text-xs text-foreground-dim">{min}</span>
        <span className="text-xs text-foreground-dim">{max}</span>
      </div>

      {/* 滑块自定义样式 */}
      <style>{`
        .slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--color-primary);
          border: 3px solid var(--color-background);
          box-shadow: 0 0 10px var(--color-primary-glow), 0 2px 6px rgba(0,0,0,0.4);
          cursor: pointer;
        }
        .slider-input::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--color-primary);
          border: 3px solid var(--color-background);
          box-shadow: 0 0 10px var(--color-primary-glow), 0 2px 6px rgba(0,0,0,0.4);
          cursor: pointer;
        }
        .slider-input::-webkit-slider-runnable-track {
          height: 8px;
          background: transparent;
        }
        .slider-input::-moz-range-track {
          height: 8px;
          background: transparent;
        }
      `}</style>
    </div>
  );
}
