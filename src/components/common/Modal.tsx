import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  /** 是否可见 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: string;
  /** 内容 */
  children: ReactNode;
  /** 额外类名 */
  className?: string;
  /** 点击遮罩是否关闭，默认 true */
  maskClosable?: boolean;
}

/** 遮罩层动画 */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

/** 内容面板动画 - 从底部滑入 */
const contentVariants = {
  hidden: { y: '100%', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' as const },
  },
};

/**
 * 模态框组件
 * - 从底部滑入，带弹性动画
 * - 毛玻璃背景遮罩
 * - 支持点击遮罩关闭
 * - 内容区可滚动，适配移动端
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  className = '',
  maskClosable = true,
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* 遮罩层 */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            variants={overlayVariants}
            onClick={maskClosable ? onClose : undefined}
          />

          {/* 内容面板 */}
          <motion.div
            className={[
              'glass relative z-10',
              'w-full sm:max-w-lg',
              'max-h-[85dvh]',
              'rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)]',
              'flex flex-col',
              className,
            ].join(' ')}
            variants={contentVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <h2 className="text-lg font-semibold text-foreground font-display">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="touch-feedback p-1.5 rounded-[var(--radius-sm)] text-foreground-muted hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* 无标题时的关闭按钮 */}
            {!title && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 touch-feedback p-1.5 rounded-[var(--radius-sm)] text-foreground-muted hover:text-foreground hover:bg-white/5 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* 内容区 - 可滚动 */}
            <div className="flex-1 overflow-y-auto p-5">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
