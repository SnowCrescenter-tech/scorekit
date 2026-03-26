/**
 * 步骤指示器组件
 * - 水平排列的步骤点/数字
 * - 当前步骤高亮霓虹绿
 * - 已完成步骤显示勾号
 * - 步骤间有连接线
 */

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  /** 当前步骤（从 1 开始） */
  currentStep: number;
  /** 总步骤数 */
  totalSteps: number;
  /** 每一步的标签（可选） */
  labels?: string[];
  /** 点击步骤回调（仅已完成步骤可点击） */
  onStepClick?: (step: number) => void;
}

export default function StepIndicator({
  currentStep,
  totalSteps,
  labels,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center w-full px-4 py-3">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <div key={step} className="flex items-center">
            {/* 步骤圆点 */}
            <div className="flex flex-col items-center gap-1">
              <motion.div
                className={[
                  'relative flex items-center justify-center w-9 h-9 rounded-full border-2 text-sm font-display font-bold transition-colors duration-300',
                  isCurrent
                    ? 'border-primary bg-primary/15 text-primary shadow-[0_0_12px_var(--color-primary-glow)]'
                    : isCompleted
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-white/20 bg-surface text-foreground-dim',
                  isCompleted && onStepClick ? 'cursor-pointer hover:scale-110' : '',
                ].join(' ')}
                initial={false}
                animate={
                  isCurrent
                    ? { scale: [1, 1.1, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.3 }}
                onClick={() => {
                  if (isCompleted && onStepClick) {
                    onStepClick(step);
                  }
                }}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{step}</span>
                )}
              </motion.div>

              {/* 标签文字 */}
              {labels?.[i] && (
                <span
                  className={[
                    'text-[10px] whitespace-nowrap transition-colors duration-300',
                    isCurrent
                      ? 'text-primary font-medium'
                      : isCompleted
                        ? 'text-primary/70'
                        : 'text-foreground-dim',
                  ].join(' ')}
                >
                  {labels[i]}
                </span>
              )}
            </div>

            {/* 连接线（最后一步不显示） */}
            {step < totalSteps && (
              <div className="relative w-12 h-0.5 mx-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary rounded-full"
                  initial={false}
                  animate={{
                    width: isCompleted ? '100%' : isCurrent ? '50%' : '0%',
                  }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
