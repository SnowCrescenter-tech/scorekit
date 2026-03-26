// ===== 游戏结束结算画面 =====

import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, ArrowLeft, FileText } from 'lucide-react'
import { Button } from '@/components/common'
import PlayerRanking from '@/components/poker/PlayerRanking'
import type { Room, Player } from '@/types'
import type { PlayerRecord } from '@/services/historyService'

interface GameOverScreenProps {
  /** 当前房间 */
  room: Room
  /** 玩家列表 */
  players: Player[]
  /** 返回大厅回调 */
  onBackToLobby: () => void
  /** 查看历史详情回调 */
  onViewHistory: () => void
}

/** 背景叠加层动画 */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
}

/** 卡片弹出动画（从中心放大） */
const cardVariants = {
  hidden: { opacity: 0, scale: 0.6, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 22,
      delay: 0.15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    transition: { duration: 0.25 },
  },
}

/**
 * 游戏结束结算画面
 * 全屏覆盖在牌桌上，带毛玻璃背景
 * 展示排名列表和操作按钮
 */
export default function GameOverScreen({
  room,
  players,
  onBackToLobby,
  onViewHistory,
}: GameOverScreenProps) {
  /** 将 Player[] 转为 PlayerRecord[]，供 PlayerRanking 使用 */
  const playerRecords: PlayerRecord[] = players.map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    startingChips: room.rules.startingChips,
    finalChips: p.chips,
    profit: p.chips - room.rules.startingChips,
  }))

  return (
    <AnimatePresence>
      {/* 毛玻璃全屏叠加层 */}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* 半透明背景 */}
        <div className="absolute inset-0 bg-surface/80" />

        {/* 内容卡片 */}
        <motion.div
          className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-[var(--radius-xl)] border border-accent/20 bg-surface-light/90 shadow-2xl"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* ===== 顶部标题区域 ===== */}
          <div className="text-center pt-8 pb-4 px-6">
            {/* 奖杯图标 */}
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 border border-accent/30 mb-4"
              initial={{ rotate: -15, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', delay: 0.4, stiffness: 300 }}
            >
              <Trophy className="w-8 h-8 text-accent" />
            </motion.div>

            {/* 标题 */}
            <h1 className="font-display text-2xl text-accent neon-text-gold tracking-wide mb-1">
              🏆 游戏结束
            </h1>

            {/* 房间信息 */}
            <p className="text-sm text-foreground-muted">
              {room.name}
              <span className="mx-2 text-foreground-dim">·</span>
              <span className="font-display text-foreground-dim">
                {room.code}
              </span>
            </p>
          </div>

          {/* ===== 排名列表 ===== */}
          <div className="px-5 pb-4">
            <PlayerRanking players={playerRecords} />
          </div>

          {/* ===== 底部操作按钮 ===== */}
          <div className="sticky bottom-0 px-5 pb-6 pt-3 bg-gradient-to-t from-surface-light/90 via-surface-light/90 to-transparent">
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={onBackToLobby}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                返回大厅
              </Button>
              <Button
                className="flex-1"
                variant="secondary"
                onClick={onViewHistory}
              >
                <FileText className="w-4 h-4 mr-1.5" />
                查看详情
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
