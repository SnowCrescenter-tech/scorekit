// ===== 筹码数字调整器 =====
// 精确调整下注金额：+/- 按钮、滑块、点击输入

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { Slider } from '@/components/common'
import { formatChips } from '@/utils/helpers'
import { playSound } from '@/utils/sound'
import { vibrate } from '@/utils/vibration'

interface ChipAdjusterProps {
  /** 当前金额 */
  value: number
  /** 金额变化回调 */
  onChange: (value: number) => void
  /** 最小值（最小加注额） */
  min: number
  /** 最大值（我的筹码） */
  max: number
  /** 步进值（默认为大盲注额） */
  step?: number
  /** 是否禁用 */
  disabled?: boolean
}

/**
 * 筹码数字调整器
 * - 中间大号 Orbitron 金色数字
 * - 左右 +/- 按钮（支持长按连续调整）
 * - 下方滑块
 * - 支持点击数字直接输入
 */
export default function ChipAdjuster({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
}: ChipAdjusterProps) {
  /** 是否正在编辑模式（直接输入数字） */
  const [isEditing, setIsEditing] = useState(false)
  /** 输入框临时值 */
  const [inputValue, setInputValue] = useState('')
  /** 长按定时器引用 */
  const longPressTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  /** 输入框引用 */
  const inputRef = useRef<HTMLInputElement>(null)
  /** 数字变化动画方向 */
  const [direction, setDirection] = useState<'up' | 'down'>('up')

  /** 安全设置值（保证在范围内） */
  const safeSet = useCallback(
    (v: number) => {
      const clamped = Math.max(min, Math.min(max, v))
      onChange(clamped)
    },
    [min, max, onChange],
  )

  /** 单次增加 */
  const increment = useCallback(() => {
    setDirection('up')
    safeSet(value + step)
    playSound('tick')
    vibrate('light')
  }, [value, step, safeSet])

  /** 单次减少 */
  const decrement = useCallback(() => {
    setDirection('down')
    safeSet(value - step)
    playSound('tick')
    vibrate('light')
  }, [value, step, safeSet])

  /** 开始长按（连续调整） */
  const startLongPress = useCallback(
    (fn: () => void) => {
      if (disabled) return
      fn() // 先执行一次
      let speed = 150
      longPressTimer.current = setInterval(() => {
        fn()
        // 加速
        if (speed > 30) {
          speed -= 10
          if (longPressTimer.current) {
            clearInterval(longPressTimer.current)
            longPressTimer.current = setInterval(fn, speed)
          }
        }
      }, speed)
    },
    [disabled],
  )

  /** 结束长按 */
  const stopLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearInterval(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  /** 清理定时器 */
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearInterval(longPressTimer.current)
    }
  }, [])

  /** 开始编辑模式 */
  const startEditing = useCallback(() => {
    if (disabled) return
    setInputValue(value.toString())
    setIsEditing(true)
    // 延迟 focus 让输入框渲染完成
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [disabled, value])

  /** 确认输入 */
  const confirmInput = useCallback(() => {
    const parsed = parseInt(inputValue, 10)
    if (!isNaN(parsed)) {
      safeSet(parsed)
    }
    setIsEditing(false)
  }, [inputValue, safeSet])

  /** 处理输入框键盘事件 */
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') confirmInput()
      if (e.key === 'Escape') setIsEditing(false)
    },
    [confirmInput],
  )

  /** 滑块变化处理 */
  const handleSliderChange = useCallback(
    (v: number) => {
      setDirection(v > value ? 'up' : 'down')
      onChange(v)
    },
    [value, onChange],
  )

  return (
    <div className={`flex flex-col gap-3 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      {/* 数字调整区域 */}
      <div className="flex items-center justify-center gap-4">
        {/* 减少按钮 */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onPointerDown={() => startLongPress(decrement)}
          onPointerUp={stopLongPress}
          onPointerLeave={stopLongPress}
          disabled={disabled || value <= min}
          className={[
            'flex items-center justify-center',
            'w-11 h-11 rounded-full',
            'bg-white/5 border border-white/10',
            'text-foreground-muted hover:text-foreground',
            'hover:bg-white/10 active:bg-white/15',
            'transition-colors touch-feedback',
            'disabled:opacity-30 disabled:pointer-events-none',
          ].join(' ')}
        >
          <Minus className="w-5 h-5" />
        </motion.button>

        {/* 中间金额显示 / 输入 */}
        <div className="flex-1 flex items-center justify-center min-w-[120px]">
          <AnimatePresence mode="popLayout">
            {isEditing ? (
              <motion.input
                ref={inputRef}
                key="input"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={confirmInput}
                onKeyDown={handleInputKeyDown}
                className={[
                  'w-full text-center text-2xl font-display text-accent',
                  'bg-white/5 border border-accent/30 rounded-lg',
                  'px-3 py-2 outline-none',
                  'focus:border-accent/60 focus:ring-1 focus:ring-accent/30',
                ].join(' ')}
                min={min}
                max={max}
              />
            ) : (
              <motion.button
                key="display"
                initial={{ y: direction === 'up' ? 10 : -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: direction === 'up' ? -10 : 10, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={startEditing}
                className="text-3xl font-display text-accent tabular-nums cursor-pointer hover:text-accent/80 transition-colors"
              >
                {value.toLocaleString('en-US')}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* 增加按钮 */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onPointerDown={() => startLongPress(increment)}
          onPointerUp={stopLongPress}
          onPointerLeave={stopLongPress}
          disabled={disabled || value >= max}
          className={[
            'flex items-center justify-center',
            'w-11 h-11 rounded-full',
            'bg-white/5 border border-white/10',
            'text-foreground-muted hover:text-foreground',
            'hover:bg-white/10 active:bg-white/15',
            'transition-colors touch-feedback',
            'disabled:opacity-30 disabled:pointer-events-none',
          ].join(' ')}
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* 滑块 */}
      <Slider
        value={value}
        onChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        showValue={false}
        disabled={disabled}
      />

      {/* 范围提示 */}
      <div className="flex justify-between text-xs text-foreground-muted/60 px-1">
        <span className="font-display">{formatChips(min)}</span>
        <span className="font-display">{formatChips(max)}</span>
      </div>
    </div>
  )
}
