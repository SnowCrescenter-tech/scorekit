import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
} from 'lucide-react';

/* =============================================
   Toast 轻提示组件
   - 全局事件系统，支持 toast.success / error / info / warning
   - 顶部弹出 + 自动消失
   ============================================= */

/** Toast 类型 */
type ToastType = 'success' | 'error' | 'info' | 'warning';

/** 单条 Toast 数据 */
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

/** 事件回调类型 */
type ToastListener = (item: ToastItem) => void;

/* ---------- 全局事件总线 ---------- */
let toastId = 0;
const listeners: Set<ToastListener> = new Set();

function emit(item: ToastItem) {
  listeners.forEach((fn) => fn(item));
}

function subscribe(fn: ToastListener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** 创建一条 toast 消息 */
function createToast(type: ToastType, message: string, duration = 3000) {
  emit({ id: ++toastId, type, message, duration });
}

/**
 * 全局 toast 触发函数
 * @example
 * toast.success('操作成功');
 * toast.error('网络异常');
 */
export const toast = {
  success: (msg: string, duration?: number) => createToast('success', msg, duration),
  error: (msg: string, duration?: number) => createToast('error', msg, duration),
  info: (msg: string, duration?: number) => createToast('info', msg, duration),
  warning: (msg: string, duration?: number) => createToast('warning', msg, duration),
};

/* ---------- 样式 & 图标映射 ---------- */

const typeConfig: Record<
  ToastType,
  { icon: typeof CheckCircle; color: string; bg: string; border: string }
> = {
  success: {
    icon: CheckCircle,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
  },
  error: {
    icon: XCircle,
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/30',
  },
  info: {
    icon: Info,
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/30',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
  },
};

/** 单条 Toast 组件 */
function ToastCard({ item, onRemove }: { item: ToastItem; onRemove: (id: number) => void }) {
  const cfg = typeConfig[item.type];
  const Icon = cfg.icon;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(item.id), item.duration);
    return () => clearTimeout(timer);
  }, [item, onRemove]);

  return (
    <motion.div
      layout
      initial={{ y: -40, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -20, opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 22, stiffness: 350 }}
      className={[
        'flex items-center gap-3',
        'px-4 py-3',
        'rounded-[var(--radius-md)]',
        'border',
        cfg.bg,
        cfg.border,
        'backdrop-blur-md',
        'shadow-lg',
        'pointer-events-auto',
        'max-w-[90vw] sm:max-w-sm',
      ].join(' ')}
    >
      <Icon className={`w-5 h-5 shrink-0 ${cfg.color}`} />
      <span className="text-sm text-foreground leading-snug">{item.message}</span>
    </motion.div>
  );
}

/**
 * Toast 容器组件 — 放在应用根节点内即可
 * @example
 * <Toaster />
 */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsub = subscribe((item) =>
      setItems((prev) => [...prev, item]),
    );
    return () => { unsub(); };
  }, []);

  const remove = useCallback(
    (id: number) => setItems((prev) => prev.filter((t) => t.id !== id)),
    [],
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center gap-2 py-3 safe-area-top pointer-events-none">
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onRemove={remove} />
        ))}
      </AnimatePresence>
    </div>
  );
}
