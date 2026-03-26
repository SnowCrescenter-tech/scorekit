// ===== 房间头部组件 =====

import { motion } from 'framer-motion'
import { ArrowLeft, MoreVertical, Wifi, WifiOff, Copy } from 'lucide-react'
import { Badge } from '@/components/common'
import { toast } from '@/components/common'
import { copyToClipboard } from '@/utils/helpers'
import type { Room } from '@/types'

interface RoomHeaderProps {
  /** 房间数据 */
  room: Room
  /** 当前回合数 */
  roundNumber: number
  /** 在线人数 */
  onlineCount: number
  /** 是否已连接 */
  isConnected: boolean
  /** 返回按钮点击 */
  onBack: () => void
  /** 菜单按钮点击 */
  onMenuClick: () => void
}

/**
 * 房间头部组件
 * - 固定在顶部
 * - 毛玻璃背景
 * - 左: 返回  中: 房间名+房间码  右: 菜单
 * - 显示回合数、在线人数
 */
export default function RoomHeader({
  room,
  roundNumber,
  onlineCount,
  isConnected,
  onBack,
  onMenuClick,
}: RoomHeaderProps) {
  /** 点击复制房间码 */
  const handleCopyCode = async () => {
    const ok = await copyToClipboard(room.code)
    if (ok) {
      toast.success(`已复制房间码 ${room.code}`)
    }
  }

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40 glass safe-area-top"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between h-14 px-3">
        {/* 左侧：返回按钮 */}
        <button
          onClick={onBack}
          className="touch-feedback p-2 -ml-1 rounded-[var(--radius-md)] text-foreground-muted hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* 中间：房间信息 */}
        <div className="flex flex-col items-center flex-1 min-w-0 mx-2">
          {/* 房间名 */}
          <h1 className="text-sm font-semibold text-foreground truncate max-w-[180px]">
            {room.name}
          </h1>

          {/* 房间码（可点击复制）+ 状态信息 */}
          <div className="flex items-center gap-2 mt-0.5">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-0.5 text-[10px] text-primary hover:text-primary-dim transition-colors"
            >
              <span className="font-display tracking-wider">{room.code}</span>
              <Copy className="w-2.5 h-2.5" />
            </button>

            <span className="text-foreground-dim/40 text-[10px]">|</span>

            {/* 回合数 */}
            <span className="text-[10px] text-foreground-dim">
              第{roundNumber}手
            </span>

            <span className="text-foreground-dim/40 text-[10px]">|</span>

            {/* 在线人数 */}
            <div className="flex items-center gap-0.5">
              {isConnected ? (
                <Wifi className="w-2.5 h-2.5 text-primary" />
              ) : (
                <WifiOff className="w-2.5 h-2.5 text-danger" />
              )}
              <span className="text-[10px] text-foreground-dim">
                {onlineCount}人
              </span>
            </div>
          </div>
        </div>

        {/* 右侧：菜单按钮 */}
        <button
          onClick={onMenuClick}
          className="touch-feedback p-2 -mr-1 rounded-[var(--radius-md)] text-foreground-muted hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </motion.header>
  )
}
