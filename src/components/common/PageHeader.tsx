import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  /** 页面标题 */
  title: string;
  /** 是否显示返回按钮 */
  showBack?: boolean;
  /** 返回按钮点击回调 */
  onBack?: () => void;
  /** 右侧操作区域 */
  rightActions?: ReactNode;
  /** 额外类名 */
  className?: string;
}

/**
 * 页面头部组件
 * - fixed 定位 + 毛玻璃背景
 * - 返回按钮 + 标题 + 右侧操作
 * - 安全区域适配
 */
export default function PageHeader({
  title,
  showBack = true,
  onBack,
  rightActions,
  className = '',
}: PageHeaderProps) {
  return (
    <motion.header
      className={[
        'fixed top-0 left-0 right-0 z-40',
        'glass safe-area-top',
        className,
      ].join(' ')}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* 左侧：返回按钮 */}
        <div className="flex items-center gap-2 min-w-[48px]">
          {showBack && (
            <button
              onClick={onBack}
              className="touch-feedback p-2 -ml-2 rounded-[var(--radius-md)] text-foreground-muted hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 中间：标题 */}
        <h1 className="text-base font-semibold text-foreground font-display truncate">
          {title}
        </h1>

        {/* 右侧：操作区域 */}
        <div className="flex items-center gap-1 min-w-[48px] justify-end">
          {rightActions}
        </div>
      </div>
    </motion.header>
  );
}
