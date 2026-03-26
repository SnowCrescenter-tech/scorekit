// ===== 结算弹窗 =====
// 回合结束时选择赢家并计算盈亏

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, CheckCircle, AlertCircle } from 'lucide-react'
import { Modal, Avatar, Button, ChipDisplay } from '@/components/common'
import { useGameStore } from '@/stores/gameStore'
import { formatChips } from '@/utils/helpers'
import { playSound } from '@/utils/sound'
import { vibrate } from '@/utils/vibration'

interface SettlementModalProps {
  /** 是否显示 */
  open: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 确认结算回调 */
  onConfirm: (winnerIds: string[], settlements: { player_id: string; amount: number }[]) => void
}

/** 单个玩家的结算信息 */
interface PlayerSettlementInfo {
  id: string
  name: string
  avatar: string
  /** 本轮总下注 */
  totalBet: number
  /** 盈亏金额（结算后计算） */
  profit: number
  /** 是否已弃牌 */
  folded: boolean
}

/**
 * 结算弹窗
 * - 显示所有未弃牌玩家，可多选赢家
 * - 自动计算各玩家盈亏
 * - 确认后播放赢/输音效
 */
export default function SettlementModal({
  open,
  onClose,
  onConfirm,
}: SettlementModalProps) {
  /** 选中的赢家 ID 列表 */
  const [selectedWinners, setSelectedWinners] = useState<string[]>([])
  /** 是否正在提交 */
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 从 store 获取数据
  const players = useGameStore((s) => s.players)
  const bets = useGameStore((s) => s.bets)
  const currentRound = useGameStore((s) => s.currentRound)
  const getPlayerBetInRound = useGameStore((s) => s.getPlayerBetInRound)

  /** 获取底池总额 */
  const potTotal = useGameStore((s) => s.getPotTotal)()

  /** 构建玩家结算信息列表 */
  const playerInfos = useMemo<PlayerSettlementInfo[]>(() => {
    if (!players.length) return []

    return players
      .filter((p) => p.is_active)
      .map((p) => {
        const totalBet = getPlayerBetInRound(p.id)
        // 检查是否弃牌
        const folded = bets.some(
          (b) => b.player_id === p.id && b.bet_type === 'fold',
        )
        return {
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          totalBet,
          profit: 0, // 稍后根据赢家选择计算
          folded,
        }
      })
  }, [players, bets, getPlayerBetInRound])

  /** 可选择的玩家（未弃牌的） */
  const selectablePlayers = useMemo(
    () => playerInfos.filter((p) => !p.folded),
    [playerInfos],
  )

  /** 已弃牌的玩家 */
  const foldedPlayers = useMemo(
    () => playerInfos.filter((p) => p.folded),
    [playerInfos],
  )

  /** 计算结算金额 */
  const settlements = useMemo(() => {
    if (selectedWinners.length === 0) return []

    // 平分底池给赢家
    const winShare = Math.floor(potTotal / selectedWinners.length)
    // 余数给第一位赢家
    const remainder = potTotal - winShare * selectedWinners.length

    return playerInfos.map((p) => {
      let profit: number
      if (selectedWinners.includes(p.id)) {
        // 赢家：获得份额 - 自己下注的
        const extra = p.id === selectedWinners[0] ? remainder : 0
        profit = winShare + extra - p.totalBet
      } else {
        // 输家：失去下注
        profit = -p.totalBet
      }
      return {
        player_id: p.id,
        amount: profit,
        name: p.name,
        avatar: p.avatar,
        totalBet: p.totalBet,
      }
    })
  }, [selectedWinners, potTotal, playerInfos])

  /** 切换赢家选中状态 */
  const toggleWinner = useCallback(
    (playerId: string) => {
      setSelectedWinners((prev) =>
        prev.includes(playerId)
          ? prev.filter((id) => id !== playerId)
          : [...prev, playerId],
      )
      playSound('click')
      vibrate('light')
    },
    [],
  )

  /** 确认结算 */
  const handleConfirm = useCallback(async () => {
    if (selectedWinners.length === 0) return

    setIsSubmitting(true)
    try {
      const settlementData = settlements.map((s) => ({
        player_id: s.player_id,
        amount: s.amount,
      }))
      await onConfirm(selectedWinners, settlementData)

      // 重置
      setSelectedWinners([])
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedWinners, settlements, onConfirm])

  /** 弹窗关闭时重置 */
  const handleClose = useCallback(() => {
    setSelectedWinners([])
    onClose()
  }, [onClose])

  return (
    <Modal open={open} onClose={handleClose} title="回合结算" maskClosable={false}>
      <div className="space-y-5">
        {/* 底池信息 */}
        <div className="flex items-center justify-center gap-3 py-3 rounded-xl bg-accent/5 border border-accent/20">
          <Trophy className="w-5 h-5 text-accent" />
          <span className="text-foreground-muted text-sm">底池总额</span>
          <ChipDisplay value={potTotal} size="md" showIcon />
        </div>

        {/* 选择赢家提示 */}
        <div className="text-sm text-foreground-muted">
          <span>选择赢家（可多选用于分池）:</span>
        </div>

        {/* 未弃牌玩家列表 */}
        <div className="space-y-2">
          {selectablePlayers.map((player) => {
            const isSelected = selectedWinners.includes(player.id)
            const settlement = settlements.find((s) => s.player_id === player.id)
            return (
              <motion.button
                key={player.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleWinner(player.id)}
                className={[
                  'w-full flex items-center gap-3 p-3 rounded-xl',
                  'transition-all duration-200 touch-feedback',
                  isSelected
                    ? 'bg-primary/15 border-2 border-primary/50 shadow-[0_0_8px_var(--color-primary-glow)]'
                    : 'bg-surface-light/50 border border-white/8 hover:bg-surface-light',
                ].join(' ')}
              >
                {/* 头像 */}
                <Avatar emoji={player.avatar} size="sm" glow={isSelected} />

                {/* 玩家信息 */}
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-foreground">
                    {player.name}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    本轮下注: <span className="font-display text-accent">{formatChips(player.totalBet)}</span>
                  </div>
                </div>

                {/* 选中状态 / 盈亏预览 */}
                <div className="flex items-center gap-2">
                  {isSelected && settlement && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <ChipDisplay
                        value={settlement.amount}
                        size="sm"
                        showSign
                        animated
                      />
                    </motion.div>
                  )}
                  <div
                    className={[
                      'w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors',
                      isSelected
                        ? 'bg-primary border-primary text-background'
                        : 'border-white/20 text-transparent',
                    ].join(' ')}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* 已弃牌玩家 */}
        {foldedPlayers.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-foreground-muted/60 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              已弃牌
            </div>
            {foldedPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-light/20 border border-white/5 opacity-50"
              >
                <Avatar emoji={player.avatar} size="sm" />
                <div className="flex-1">
                  <div className="text-sm text-foreground-muted">{player.name}</div>
                  <div className="text-xs text-foreground-muted/60">
                    下注: <span className="font-display">{formatChips(player.totalBet)}</span>
                  </div>
                </div>
                <ChipDisplay value={-player.totalBet} size="sm" showSign />
              </div>
            ))}
          </div>
        )}

        {/* 结算预览 */}
        <AnimatePresence>
          {selectedWinners.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-xl bg-white/3 border border-white/5 space-y-2">
                <div className="text-xs text-foreground-muted font-medium">结算预览</div>
                {settlements.map((s) => (
                  <div key={s.player_id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground-muted">{s.name}</span>
                    <ChipDisplay value={s.amount} size="sm" showSign animated />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 确认按钮 */}
        <Button
          variant="accent"
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={selectedWinners.length === 0}
          onClick={handleConfirm}
          icon={<Trophy className="w-5 h-5" />}
        >
          {selectedWinners.length === 0
            ? '请选择赢家'
            : `确认结算 (${selectedWinners.length} 位赢家)`}
        </Button>
      </div>
    </Modal>
  )
}
