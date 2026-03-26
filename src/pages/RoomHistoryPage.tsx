/**
 * 单个房间历史详情页面
 * 通过 URL 参数 roomId 获取历史数据，展示完整的游戏回顾
 */

import { useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router'
import { motion } from 'framer-motion'
import { Clock, RotateCcw, Coins, Frown } from 'lucide-react'
import { PageHeader } from '@/components/common'
import PlayerRanking from '@/components/poker/PlayerRanking'
import RoundTimeline from '@/components/poker/RoundTimeline'
import { getGameRecord } from '@/services/historyService'
import { formatDuration, formatChips } from '@/utils/helpers'

// ===== 动画配置 =====

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

export default function RoomHistoryPage() {
  const navigate = useNavigate()
  const { roomId } = useParams<{ roomId: string }>()

  /** 获取游戏记录 */
  const record = useMemo(() => {
    if (!roomId) return null
    return getGameRecord(roomId)
  }, [roomId])

  /** 返回历史列表 */
  const goBack = useCallback(() => navigate('/history'), [navigate])

  /** 计算最大底池 */
  const maxPot = useMemo(() => {
    if (!record || record.rounds.length === 0) return 0
    return Math.max(...record.rounds.map((r) => r.pot))
  }, [record])

  /** 游戏时长（分钟） */
  const durationMin = useMemo(() => {
    if (!record) return 0
    return Math.round(record.duration / 60_000)
  }, [record])

  // ===== 记录不存在 =====
  if (!record) {
    return (
      <div className="relative min-h-dvh">
        <PageHeader title="房间详情" showBack onBack={goBack} />
        <div className="max-w-lg mx-auto px-4 pt-18 pb-8">
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-20 h-20 rounded-full bg-surface-light/50 border border-white/5 flex items-center justify-center mb-5">
              <Frown className="w-8 h-8 text-foreground-dim" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              记录未找到
            </h3>
            <p className="text-sm text-foreground-dim mb-6">
              该记录可能已被删除或不存在
            </p>
            <motion.button
              onClick={goBack}
              className="px-5 py-2 rounded-full bg-primary/15 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/25 transition-colors touch-feedback"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              返回历史列表
            </motion.button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh">
      {/* 页面头部 */}
      <PageHeader title={record.roomName} showBack onBack={goBack} />

      {/* 主内容 */}
      <motion.div
        className="max-w-lg mx-auto px-4 pt-18 pb-8 safe-area-bottom"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ===== 顶部统计概要卡片 ===== */}
        <motion.div
          variants={sectionVariants}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {/* 总回合数 */}
          <div className="flex flex-col items-center p-3 rounded-[var(--radius-lg)] bg-surface-light/40 border border-white/5">
            <RotateCcw className="w-5 h-5 text-info mb-1.5" />
            <span className="font-display text-lg font-bold text-foreground">
              {record.totalRounds}
            </span>
            <span className="text-[10px] text-foreground-dim mt-0.5">总回合</span>
          </div>

          {/* 总时长 */}
          <div className="flex flex-col items-center p-3 rounded-[var(--radius-lg)] bg-surface-light/40 border border-white/5">
            <Clock className="w-5 h-5 text-primary mb-1.5" />
            <span className="font-display text-lg font-bold text-foreground">
              {durationMin < 60 ? `${durationMin}` : `${Math.floor(durationMin / 60)}h${durationMin % 60}m`}
            </span>
            <span className="text-[10px] text-foreground-dim mt-0.5">
              {durationMin < 60 ? '分钟' : '时长'}
            </span>
          </div>

          {/* 最大底池 */}
          <div className="flex flex-col items-center p-3 rounded-[var(--radius-lg)] bg-surface-light/40 border border-white/5">
            <Coins className="w-5 h-5 text-accent mb-1.5" />
            <span className="font-display text-lg font-bold text-accent neon-text-gold">
              {formatChips(maxPot)}
            </span>
            <span className="text-[10px] text-foreground-dim mt-0.5">最大底池</span>
          </div>
        </motion.div>

        {/* ===== 游戏信息摘要 ===== */}
        <motion.div
          variants={sectionVariants}
          className="flex items-center gap-3 px-3 py-2 mb-6 text-xs text-foreground-dim rounded-[var(--radius-md)] bg-surface/50 border border-white/5"
        >
          <span>房间码: <span className="font-display text-foreground-muted">{record.roomCode}</span></span>
          <span className="w-px h-3 bg-white/10" />
          <span>盲注: <span className="font-display text-foreground-muted">{formatChips(record.rules.smallBlind)}/{formatChips(record.rules.bigBlind)}</span></span>
          <span className="w-px h-3 bg-white/10" />
          <span>初始: <span className="font-display text-foreground-muted">{formatChips(record.rules.startingChips)}</span></span>
        </motion.div>

        {/* ===== 玩家排名 ===== */}
        <motion.section variants={sectionVariants} className="mb-8">
          <PlayerRanking players={record.players} />
        </motion.section>

        {/* ===== 回合时间线 ===== */}
        <motion.section variants={sectionVariants}>
          <RoundTimeline rounds={record.rounds} />
        </motion.section>
      </motion.div>
    </div>
  )
}
