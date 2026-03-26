/**
 * 房间码输入组件
 * - 6 个独立短输入框（类似验证码输入）
 * - 自动聚焦下一格、退格回退
 * - 粘贴文本自动填充
 * - 只接受字母和数字，自动大写
 * - 错误态：红色边框 + 抖动动画
 */

import { useRef, useCallback, type KeyboardEvent, type ClipboardEvent } from 'react';
import { motion } from 'framer-motion';

interface RoomCodeInputProps {
  /** 当前值 */
  value: string;
  /** 值变化回调 */
  onChange: (code: string) => void;
  /** 是否显示错误状态 */
  error?: boolean;
  /** 输入框数量（默认 6） */
  length?: number;
}

/** 抖动动画定义 */
const shakeAnimation = {
  x: [0, -8, 8, -6, 6, -3, 3, 0],
};

export default function RoomCodeInput({
  value,
  onChange,
  error = false,
  length = 6,
}: RoomCodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /** 将 value 拆分为每个格子的字符数组 */
  const chars = value.toUpperCase().split('').slice(0, length);
  while (chars.length < length) chars.push('');

  /** 过滤只保留字母和数字 */
  const sanitize = (str: string) => str.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  /** 聚焦指定位置的输入框 */
  const focusAt = useCallback(
    (index: number) => {
      if (index >= 0 && index < length) {
        inputRefs.current[index]?.focus();
      }
    },
    [length]
  );

  /** 构造新的 code 并触发 onChange */
  const updateValue = useCallback(
    (newChars: string[]) => {
      onChange(newChars.join('').slice(0, length));
    },
    [onChange, length]
  );

  /** 处理单个格子输入 */
  const handleInput = useCallback(
    (index: number, inputVal: string) => {
      const cleaned = sanitize(inputVal);
      if (!cleaned) return;

      const newChars = [...chars];
      // 如果输入了多个字符（如粘贴），依次填充后续格子
      for (let i = 0; i < cleaned.length && index + i < length; i++) {
        newChars[index + i] = cleaned[i];
      }
      updateValue(newChars);

      // 聚焦到下一个空位
      const nextIndex = Math.min(index + cleaned.length, length - 1);
      focusAt(nextIndex);
    },
    [chars, length, focusAt, updateValue]
  );

  /** 处理键盘退格 */
  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        const newChars = [...chars];
        if (newChars[index]) {
          // 当前格有值，先清除当前格
          newChars[index] = '';
          updateValue(newChars);
        } else if (index > 0) {
          // 当前格为空，清除上一格并回退焦点
          newChars[index - 1] = '';
          updateValue(newChars);
          focusAt(index - 1);
        }
      }
      // 左箭头回退
      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        focusAt(index - 1);
      }
      // 右箭头前进
      if (e.key === 'ArrowRight' && index < length - 1) {
        e.preventDefault();
        focusAt(index + 1);
      }
    },
    [chars, length, focusAt, updateValue]
  );

  /** 处理粘贴 */
  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = sanitize(e.clipboardData.getData('text'));
      if (!pasted) return;

      const newChars = pasted.slice(0, length).split('');
      while (newChars.length < length) newChars.push('');
      updateValue(newChars);

      // 聚焦到最后一个填充位
      const lastFilled = Math.min(pasted.length, length) - 1;
      focusAt(lastFilled);
    },
    [length, focusAt, updateValue]
  );

  return (
    <motion.div
      className="flex items-center justify-center gap-2.5"
      animate={error ? shakeAnimation : {}}
      transition={{ duration: 0.4 }}
    >
      {chars.map((char, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          maxLength={1}
          value={char}
          onChange={(e) => {
            const val = e.target.value;
            // 避免重复触发（浏览器可能会返回相同值）
            if (val === char) return;
            handleInput(i, val);
          }}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={[
            'w-12 h-14 sm:w-14 sm:h-16',
            'text-center text-2xl font-display font-bold uppercase',
            'bg-surface rounded-[var(--radius-md)]',
            'border-2 outline-none transition-all duration-200',
            'text-foreground placeholder:text-foreground-dim',
            error
              ? 'border-danger/70 shadow-[0_0_10px_var(--color-danger-glow)]'
              : 'border-white/15 focus:border-primary/60 focus:shadow-[0_0_10px_var(--color-primary-glow)]',
          ].join(' ')}
          aria-label={`房间码第 ${i + 1} 位`}
        />
      ))}
    </motion.div>
  );
}
