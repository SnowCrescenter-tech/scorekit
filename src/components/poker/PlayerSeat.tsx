// ===== 单个玩家座位组件 =====

import { motion } from 'framer-motion'
import { Coins } from 'lucide-react'
import { Avatar, Badge } from '@/components/common'
import { formatChips, getAvatarBgColor } from '@/utils/helpers'
import type { Player } from '@/types'

interface PlayerSeatProps {
  /** 玩家数据 */
  player: Player
  /** 是否是自己 */
  isMe: boolean
  /** 是否是庄家 */
  isDealer: boolean
  /** 是否是小盲 */
  isSmallBlind: boolean
  /** 是否是大盲 */
  isBigBlind: boolean
  /** 是否轮到该玩家操作 */
  isCurrentTurn: boolean
  /** 该玩家在本回合的下注总额 */
  betInRound: number
  /** 座位在容器中的位置坐标 */
  position: { x: number; y: number }
}

/**
 * 玩家座位组件
 * - 紧凑布局，适配 9 人桌
 * - 头像 + 名字 + 筹码 + 角色标记
 * - 当前操作者脉冲边框高亮
 * - 弃牌/离线时灰色半透明
 * - All-in 红色发光
 */
export default function PlayerSeat({
  player,
  isMe,
  isDealer,
  isSmallBlind,
  isBigBlind,
  isCurrentTurn,
  betInRound,
  position,
}: PlayerSeatProps) {
  /** 是否已弃牌 */
  const isFolded = !player.is_active
  /** 是否 All-in（筹码为 0 且仍活跃） */
  const isAllIn = player.is_active && player.chips === 0
  /** 是否离线 */
  const isOffline = !player.is_online

  /** 座位容器样式 */
  const seatOpacity = isFolded || isOffline ? 'opacity-40' : 'opacity-100'

  return (
    <motion.div
      className="absolute flex flex-col items-center"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {/* 当前回合下注金额（显示在座位上方） */}
      {betInRound > 0 && !isFolded && (
        <motion.div
          className="flex items-center gap-0.5 mb-1 px-1.5 py-0.5 rounded-full bg-surface/80 border border-accent/30"
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Coins className="w-3 h-3 text-accent" />
          <span className="text-[10px] font-display text-accent font-bold">
            {formatChips(betInRound)}
          </span>
        </motion.div>
      )}

      {/* 座位主体 */}
      <div
        className={[
          'relative flex flex-col items-center',
          'p-1.5 rounded-[var(--radius-lg)]',
          'transition-all duration-300',
          seatOpacity,
          // 当前操作者 - 脉冲发光边框
          isCurrentTurn
            ? 'bg-primary/10 border-2 border-primary/60 shadow-[0_0_16px_var(--color-primary-glow)]'
            : 'bg-surface/60 border border-white/8',
          // All-in 状态 - 红色发光
          isAllIn && !isCurrentTurn
            ? 'border-danger/60 shadow-[0_0_12px_var(--color-danger-glow)]'
            : '',
          // 自己高亮
          isMe && !isCurrentTurn && !isAllIn
            ? 'border-primary/30'
            : '',
        ].join(' ')}
      >
        {/* 脉冲动画层（仅当前操作者） */}
        {isCurrentTurn && (
          <motion.div
            className="absolute inset-0 rounded-[var(--radius-lg)] border-2 border-primary/40"
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* 头像 */}
        <div className="relative">
          <Avatar
            emoji={player.avatar}
            size="sm"
            bgColor={getAvatarBgColor(player.id)}
            online={player.is_online}
            glow={isCurrentTurn || isMe}
          />

          {/* 庄家标记 D */}
          {isDealer && (
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center text-[9px] font-bold shadow-md"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              D
            </motion.div>
          )}
        </div>

        {/* 玩家名 */}
        <p
          className={[
            'mt-0.5 text-[10px] leading-tight max-w-[56px] truncate text-center',
            isMe ? 'text-primary font-semibold' : 'text-foreground-muted',
          ].join(' ')}
        >
          {player.name}
        </p>

        {/* 筹码 */}
        <div className="flex items-center gap-0.5 mt-0.5">
          <Coins className="w-3 h-3 text-accent/70" />
          <span className={[
            'text-[11px] font-display font-bold',
            isAllIn ? 'text-danger' : 'text-accent',
          ].join(' ')}>
            {isAllIn ? 'ALL IN' : formatChips(player.chips)}
          </span>
        </div>

        {/* 角色标记 SB / BB */}
        <div className="flex gap-0.5 mt-0.5">
          {isSmallBlind && (
            <Badge variant="info" className="!text-[8px] !px-1.5 !py-0">
              SB
            </Badge>
          )}
          {isBigBlind && (
            <Badge variant="warning" className="!text-[8px] !px-1.5 !py-0">
              BB
            </Badge>
          )}
        </div>

        {/* 弃牌状态标签 */}
        {isFolded && (
          <span className="text-[9px] text-foreground-dim mt-0.5">
            弃牌
          </span>
        )}
      </div>
    </motion.div>
  )
}
