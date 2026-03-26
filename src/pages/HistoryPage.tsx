/**
 * 游戏历史记录主页面
 * 显示所有已结束的游戏会话列表，支持按游戏类型筛选
 * 数据来源：localStorage
 */

import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Users, RotateCcw, Filter, Trash2, Dices } from 'lucide-react'
import { PageHeader, ChipDisplay, Badge, Button } from '@/components/common'
import { getGameRecords, deleteGameRecord, clearAllRecords } from '@/services/historyService'
import type { GameRecord } from '@/services/historyService'
import type { GameType } from '@/types'
import { formatDate, formatDuration } from '@/utils/helpers'

// ===== 游戏类型配置 =====

const GAME_TYPE_CONFIG: Record<GameType, { icon: string; label: string }> = {
  texas_holdem: { icon: '🃏', label: '德州扑克' },
  blackjack: { icon: '🎰', label: '21点' },
  mahjong: { icon: '🀄', label: '麻将' },
  custom: { icon: '🎲', label: '自定义' },
}

// ===== 筛选选项 =====

type FilterType = 'all' | GameType

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'texas_holdem', label: '德州扑克' },
  { value: 'blackjack', label: '21点' },
  { value: 'mahjong', label: '麻将' },
  { value: 'custom', label: '自定义' },
]

// ===== 动画配置 =====

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: {
    opacity: 0,
    x: -60,
    transition: { duration: 0.25 },
  },
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterType>('all')
  const [records, setRecords] = useState<GameRecord[]>(() => getGameRecords())

  /** 筛选后的记录 */
  const filtered = useMemo(() => {
    if (filter === 'all') return records
    return records.filter((r) => r.gameType === filter)
  }, [records, filter])

  /** 返回首页 */
  const goHome = useCallback(() => navigate('/'), [navigate])

  /** 进入房间历史详情 */
  const goToDetail = useCallback(
    (record: GameRecord) => navigate(`/history/${record.id}`),
    [navigate],
  )

  /** 删除单条记录 */
  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      deleteGameRecord(id)
      setRecords(getGameRecords())
    },
    [],
  )

  /** 清空全部 */
  const handleClearAll = useCallback(() => {
    if (records.length === 0) return
    clearAllRecords()
    setRecords([])
  }, [records.length])

  /** 计算我的盈亏（取第一个玩家作为"我"，或取 profit 最大的） */
  const getMyProfit = useCallback((record: GameRecord): number => {
    // 如果只有一个人，直接返回
    if (record.players.length === 0) return 0
    // 简易策略：取第一位玩家（创建者通常是第一个）
    return record.players[0]?.profit ?? 0
  }, [])

  return (
    <div className="relative min-h-dvh">
      {/* 顶部导航 */}
      <PageHeader
        title="游戏历史"
        showBack
        onBack={goHome}
        rightActions={
          records.length > 0 ? (
            <button
              onClick={handleClearAll}
              className="p-2 rounded-[var(--radius-md)] text-foreground-dim hover:text-danger hover:bg-danger/10 transition-colors"
              title="清空所有记录"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          ) : null
        }
      />

      {/* 主内容 */}
      <div className="max-w-lg mx-auto px-4 pt-18 pb-8 safe-area-bottom">
        {/* 筛选栏 */}
        {records.length > 0 && (
          <motion.div
            className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Filter className="w-4 h-4 text-foreground-dim shrink-0" />
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={[
                  'px-3 py-1.5 text-xs font-medium rounded-full border',
                  'transition-all duration-200 whitespace-nowrap',
                  'touch-feedback',
                  filter === opt.value
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-surface-light/50 text-foreground-muted border-white/5 hover:border-white/10',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}

        {/* 记录列表 */}
        {filtered.length > 0 ? (
          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((record) => {
                const config = GAME_TYPE_CONFIG[record.gameType]
                const myProfit = getMyProfit(record)
                const durationMin = Math.round(record.duration / 60_000)

                return (
                  <motion.div
                    key={record.id}
                    variants={itemVariants}
                    exit="exit"
                    layout
                    onClick={() => goToDetail(record)}
                    className={[
                      'relative p-4 rounded-[var(--radius-lg)]',
                      'bg-surface-light/40 border border-white/5',
                      'hover:border-primary/20 hover:bg-surface-light/60',
                      'transition-all duration-200 cursor-pointer',
                      'touch-feedback',
                    ].join(' ')}
                  >
                    {/* 第一行：游戏类型 + 房间名 + 时间 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{config.icon}</span>
                        <span className="font-medium text-sm text-foreground truncate max-w-[140px]">
                          {record.roomName}
                        </span>
                        <Badge variant="neutral">{config.label}</Badge>
                      </div>
                      <span className="text-xs text-foreground-dim shrink-0">
                        {formatDate(record.endedAt)}
                      </span>
                    </div>

                    {/* 第二行：统计指标 */}
                    <div className="flex items-center gap-4 text-xs text-foreground-dim mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDuration(durationMin)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{record.players.length}人</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{record.totalRounds}回合</span>
                      </div>
                    </div>

                    {/* 第三行：我的盈亏 + 操作 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground-dim">盈亏</span>
                        <ChipDisplay
                          value={myProfit}
                          size="sm"
                          showSign
                          animated={false}
                        />
                      </div>

                      {/* 删除按钮 */}
                      <button
                        onClick={(e) => handleDelete(e, record.id)}
                        className="p-1.5 rounded-[var(--radius-sm)] text-foreground-dim hover:text-danger hover:bg-danger/10 transition-colors"
                        title="删除此记录"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* ===== 空状态 ===== */
          <motion.div
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* 空状态图标 */}
            <motion.div
              className="w-24 h-24 rounded-full bg-surface-light/50 border border-white/5 flex items-center justify-center mb-6"
              animate={{
                boxShadow: [
                  '0 0 0px rgba(0,255,136,0)',
                  '0 0 20px rgba(0,255,136,0.1)',
                  '0 0 0px rgba(0,255,136,0)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Dices className="w-10 h-10 text-foreground-dim" />
            </motion.div>

            <h3 className="text-lg font-semibold text-foreground mb-2">
              暂无游戏记录
            </h3>
            <p className="text-sm text-foreground-dim mb-6 leading-relaxed">
              游戏结束后历史记录会自动保存在这里
            </p>

            <Button
              variant="primary"
              onClick={() => navigate('/create')}
              icon={<Dices className="w-5 h-5" />}
            >
              🃏 快去开一局吧！
            </Button>
          </motion.div>
        )}

        {/* 总计信息 */}
        {records.length > 0 && (
          <motion.div
            className="text-center text-xs text-foreground-dim mt-6 pb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            共 <span className="font-display">{records.length}</span> 条记录
            {filter !== 'all' && (
              <span>，筛选显示 <span className="font-display">{filtered.length}</span> 条</span>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
