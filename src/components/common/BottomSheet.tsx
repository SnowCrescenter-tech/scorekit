import { type ReactNode, useCallback } from 'react';
import {
  motion,
  AnimatePresence,
  useDragControls,
  type PanInfo,
} from 'framer-motion';

interface BottomSheetProps {
  /** 是否可见 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 内容 */
  children: ReactNode;
  /** 标题 */
  title?: string;
  /** 锚点高度列表(百分比), 如 [0.4, 0.8] */
  snapPoints?: number[];
  /** 额外类名 */
  className?: string;
}

/** 遮罩层动画 */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

/**
 * 底部弹出面板组件（类似 iOS 风格）
 * - 拖拽手柄支持下拉关闭
 * - 弹性动画从底部弹出
 * - 高度可配置
 * - 适配安全区域
 */
export default function BottomSheet({
  open,
  onClose,
  children,
  title,
  snapPoints = [0.5],
  className = '',
}: BottomSheetProps) {
  const dragControls = useDragControls();

  /** 计算默认高度(取最后一个 snapPoint) */
  const sheetHeight = `${(snapPoints[snapPoints.length - 1] ?? 0.5) * 100}dvh`;

  /** 拖拽结束处理 - 向下拖拽超过阈值则关闭 */
  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.y > 100 || info.velocity.y > 500) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* 遮罩层 */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* 面板 */}
          <motion.div
            className={[
              'glass relative z-10 w-full',
              'rounded-t-[var(--radius-xl)]',
              'flex flex-col',
              'safe-area-bottom',
              className,
            ].join(' ')}
            style={{ maxHeight: sheetHeight }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
          >
            {/* 拖拽手柄 */}
            <div
              className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 rounded-full bg-foreground-dim/50" />
            </div>

            {/* 标题栏 */}
            {title && (
              <div className="px-5 pb-3 border-b border-white/8">
                <h2 className="text-lg font-semibold text-foreground font-display text-center">
                  {title}
                </h2>
              </div>
            )}

            {/* 内容区 - 可滚动 */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
