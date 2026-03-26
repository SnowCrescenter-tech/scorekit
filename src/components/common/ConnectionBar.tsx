/**
 * 网络断连提示条
 * - 连接正常时隐藏
 * - 断开时显示红色提示 + 重连按钮
 * - 重连中显示加载动画
 * - 入场/出场动画
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, RefreshCw } from 'lucide-react'

interface ConnectionBarProps {
  /** 是否已连接 */
  isConnected: boolean
  /** 重新连接回调 */
  onReconnect?: () => void
}

export default function ConnectionBar({ isConnected, onReconnect }: ConnectionBarProps) {
  const [isReconnecting, setIsReconnecting] = useState(false)

  /** 处理重连点击 */
  const handleReconnect = async () => {
    if (isReconnecting || !onReconnect) return
    setIsReconnecting(true)
    try {
      onReconnect()
    } finally {
      // 模拟重连延迟后恢复按钮状态
      setTimeout(() => setIsReconnecting(false), 3000)
    }
  }

  return (
    <AnimatePresence>
      {!isConnected && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 bg-danger/90 backdrop-blur-sm text-white text-xs font-medium shadow-lg"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>网络连接已断开</span>

          {onReconnect && (
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="ml-2 px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-[11px] font-medium flex items-center gap-1 disabled:opacity-50"
            >
              {isReconnecting ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-flex"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </motion.span>
                  重连中...
                </>
              ) : (
                '重新连接'
              )}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
