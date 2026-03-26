// ===== 游戏房间主页面（完整集成版） =====
// 支持在线模式（Supabase）和 Mock 模式（离线 / 开发 / 演示）

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, RefreshCw, Home } from 'lucide-react'
import { useGameStore } from '@/stores/gameStore'
import { Loading, Button } from '@/components/common'
import { toast } from '@/components/common'
import RoomHeader from '@/components/poker/RoomHeader'
import PlayerCircle from '@/components/poker/PlayerCircle'
import RoomMenu from '@/components/poker/RoomMenu'
import BettingPanel from '@/components/poker/BettingPanel'
import GameControls from '@/components/poker/GameControls'
import SettlementModal from '@/components/poker/SettlementModal'
import GameOverScreen from '@/components/poker/GameOverScreen'
import PhaseIndicator from '@/components/poker/PhaseIndicator'
import { useRoomLoader } from '@/hooks/useRoomLoader'
import { useRealtimeRoom } from '@/hooks/useRealtimeRoom'
import { usePresence } from '@/hooks/usePresence'
import { useBlindTimer } from '@/hooks/useBlindTimer'
import { useGameActions } from '@/hooks/useGameActions'
import { initMockData } from '@/utils/mockData'
import { advancePhase as advancePhaseService } from '@/services/roundService'
import type { BetType, GamePhase } from '@/types'

// ===== 是否为在线模式（检测 Supabase 环境变量） =====
const isOnlineMode = !!import.meta.env.VITE_SUPABASE_URL

/**
 * 游戏房间主页面
 *
 * ┌─────────────────────────┐
 * │   RoomHeader            │  ← 固定顶部（含断连提示条）
 * ├─────────────────────────┤
 * │     PhaseIndicator      │  ← 阶段指示器
 * │     PlayerCircle        │  ← 环形玩家布局 + 中央底池
 * ├─────────────────────────┤
 * │   GameControls          │  ← 房主控制按钮
 * │   BettingPanel          │  ← 固定底部操作面板
 * └─────────────────────────┘
 *
 * 双模式：在线（Supabase）/ Mock（离线开发）
 */
export default function GameRoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()

  // ===== 全局状态 =====
  const room = useGameStore((s) => s.currentRoom)
  const players = useGameStore((s) => s.players)
  const myPlayer = useGameStore((s) => s.myPlayer)
  const currentRound = useGameStore((s) => s.currentRound)
  const storeIsLoading = useGameStore((s) => s.isLoading)
  const storeIsConnected = useGameStore((s) => s.isConnected)
  const getPotTotal = useGameStore((s) => s.getPotTotal)
  const isMyTurn = useGameStore((s) => s.isMyTurn)
  const setCurrentRound = useGameStore((s) => s.setCurrentRound)
  const reset = useGameStore((s) => s.reset)

  // ===== 本地状态 =====
  const [menuOpen, setMenuOpen] = useState(false)
  const [settlementOpen, setSettlementOpen] = useState(false)

  // ===== 在线模式：加载房间数据 =====
  const {
    isLoading: isRoomLoading,
    error: loadError,
    retry,
  } = useRoomLoader(isOnlineMode ? (roomCode ?? '') : '')

  // ===== 在线模式：实时同步 =====
  const { isConnected: realtimeConnected, connectionError, reconnect } = useRealtimeRoom({
    roomId: room?.id ?? null,
    enabled: !!room && isOnlineMode,
  })

  // ===== 在线模式：在线状态同步 =====
  usePresence({
    roomId: room?.id ?? null,
    playerId: myPlayer?.id ?? null,
    enabled: !!room && isOnlineMode,
  })

  // ===== 盲注计时器 =====
  const blindTimer = useBlindTimer()

  // ===== 游戏操作 =====
  const gameActions = useGameActions()

  // ===== Mock 模式初始化 =====
  useEffect(() => {
    if (!isOnlineMode) {
      initMockData(useGameStore.getState())
    }
    // 页面卸载时重置状态
    return () => {
      reset()
    }
  }, [roomCode, reset])

  // ===== 房间不存在时跳转到加入页 =====
  useEffect(() => {
    if (isOnlineMode && !isRoomLoading && !loadError && !room && roomCode) {
      // 数据加载完成但房间不存在，延迟跳转避免竞态
      const timer = setTimeout(() => {
        if (!useGameStore.getState().currentRoom) {
          toast.error('房间不存在或已关闭')
          navigate('/join')
        }
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isOnlineMode, isRoomLoading, loadError, room, roomCode, navigate])

  // ===== 综合连接状态 =====
  const isConnected = isOnlineMode ? realtimeConnected : storeIsConnected
  const isLoading = isOnlineMode ? isRoomLoading || storeIsLoading : storeIsLoading

  // ===== 在线人数 =====
  const onlineCount = players.filter((p) => p.is_online).length

  // ===== 回合数 =====
  const roundNumber = currentRound?.round_number ?? 0

  // ===== 是否处于回合中 =====
  const isInRound = !!currentRound && currentRound.status === 'betting'

  // ===== 操作：返回大厅 =====
  const handleBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  // ===== 操作：离开房间 =====
  const handleLeaveRoom = useCallback(async () => {
    await gameActions.leaveRoom()
    navigate('/')
  }, [gameActions, navigate])

  // ===== 操作：结束游戏 =====
  const handleEndGame = useCallback(async () => {
    await gameActions.endGame()
  }, [gameActions])

  // ===== 操作：重新买入 =====
  const handleRebuy = useCallback(async () => {
    if (myPlayer) {
      await gameActions.rebuy(myPlayer.id)
    }
  }, [gameActions, myPlayer])

  // ===== 操作：查看历史详情 =====
  const handleViewHistory = useCallback(() => {
    navigate(`/history/${room?.id ?? ''}`)
  }, [navigate, room?.id])

  // ===== 操作：下注 =====
  const handleBetAction = useCallback(
    async (type: BetType, amount?: number) => {
      await gameActions.placeBet(amount ?? 0, type)
    },
    [gameActions],
  )

  // ===== 操作：推进阶段 =====
  const handleAdvancePhase = useCallback(
    async (nextPhase: GamePhase) => {
      if (!currentRound) return
      if (isOnlineMode) {
        // 在线模式：调用服务端推进阶段
        const { data, error } = await advancePhaseService(currentRound.id, nextPhase)
        if (error) {
          toast.error(error)
          return
        }
        if (data) {
          setCurrentRound(data)
        }
      } else {
        // Mock 模式：直接更新 store
        setCurrentRound({
          ...currentRound,
          phase: nextPhase,
          current_bet: 0,
          min_raise: 0,
        })
      }
    },
    [currentRound, setCurrentRound],
  )

  // ===== 操作：打开结算弹窗 =====
  const handleOpenSettlement = useCallback(() => {
    setSettlementOpen(true)
  }, [])

  // ===== 操作：确认结算 =====
  const handleSettlementConfirm = useCallback(
    async (winnerIds: string[], settlements: { player_id: string; amount: number }[]) => {
      const success = await gameActions.settleRound(winnerIds, settlements)
      if (success) {
        setSettlementOpen(false)
      }
    },
    [gameActions],
  )

  // ===== 渲染：错误页面（加载失败 + 重试） =====
  if (loadError) {
    return (
      <div className="fixed inset-0 poker-table-bg flex flex-col items-center justify-center gap-6 p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="text-5xl">😵</div>
          <h2 className="text-lg font-semibold text-foreground">加载失败</h2>
          <p className="text-sm text-foreground-muted max-w-xs">{loadError}</p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="secondary" size="md" onClick={handleBack} icon={<Home className="w-4 h-4" />}>
              返回大厅
            </Button>
            <Button variant="primary" size="md" onClick={retry} icon={<RefreshCw className="w-4 h-4" />}>
              重试
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ===== 渲染：加载中 =====
  if (isLoading || !room || !myPlayer) {
    return (
      <div className="fixed inset-0 poker-table-bg flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  // ===== 渲染：游戏结束界面 =====
  if (room.status === 'finished') {
    return (
      <GameOverScreen
        room={room}
        players={players}
        onBackToLobby={handleBack}
        onViewHistory={handleViewHistory}
      />
    )
  }

  return (
    <div className="fixed inset-0 poker-table-bg overflow-hidden no-select flex flex-col">
      {/* ===== 断连提示条 ===== */}
      <AnimatePresence>
        {connectionError && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 safe-area-top"
          >
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-danger/90 text-white text-xs font-medium backdrop-blur-sm">
              <WifiOff className="w-3.5 h-3.5" />
              <span>连接已断开：{connectionError}</span>
              <button
                onClick={reconnect}
                className="ml-2 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 transition-colors"
              >
                重连
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== 顶部：房间信息 ===== */}
      <RoomHeader
        room={room}
        roundNumber={roundNumber}
        onlineCount={onlineCount}
        isConnected={isConnected}
        onBack={handleBack}
        onMenuClick={() => setMenuOpen(true)}
      />

      {/* ===== 中间：玩家区域（自适应填充） ===== */}
      <div className="flex-1 pt-14 pb-48 flex flex-col">
        {/* 阶段指示器（回合进行中显示） */}
        {isInRound && currentRound && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-2 pb-1"
          >
            <PhaseIndicator currentPhase={currentRound.phase} />
          </motion.div>
        )}

        {/* 盲注计时器信息（激活时显示） */}
        {blindTimer.isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-[10px] text-foreground-muted/60 py-1"
          >
            <span>盲注 Lv.{blindTimer.currentLevel}</span>
            <span className="text-accent font-display">
              {blindTimer.currentSmallBlind}/{blindTimer.currentBigBlind}
            </span>
            {blindTimer.nextLevelIn > 0 && (
              <span>
                下级 {Math.floor(blindTimer.nextLevelIn / 60)}:
                {String(blindTimer.nextLevelIn % 60).padStart(2, '0')}
              </span>
            )}
          </motion.div>
        )}

        {/* 玩家环形布局 */}
        <div className="flex-1">
          <PlayerCircle
            players={players}
            myPlayer={myPlayer}
            round={currentRound}
          />
        </div>
      </div>

      {/* ===== 底部：GameControls + BettingPanel ===== */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-30"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
      >
        {/* 房主游戏控制按钮 */}
        {myPlayer.is_host && (
          <GameControls
            isInRound={isInRound}
            currentPhase={currentRound?.phase ?? 'preflop'}
            onAdvancePhase={handleAdvancePhase}
            onOpenSettlement={handleOpenSettlement}
          />
        )}

        {/* 下注操作面板 */}
        <BettingPanel
          currentBet={currentRound?.current_bet ?? 0}
          myChips={myPlayer.chips}
          minRaise={currentRound?.min_raise ?? (room.rules.bigBlind ?? 100)}
          pot={getPotTotal()}
          phase={currentRound?.phase ?? 'preflop'}
          isMyTurn={isMyTurn()}
          onAction={handleBetAction}
        />
      </motion.div>

      {/* ===== 结算弹窗 ===== */}
      <SettlementModal
        open={settlementOpen}
        onClose={() => setSettlementOpen(false)}
        onConfirm={handleSettlementConfirm}
      />

      {/* ===== 房间菜单 ===== */}
      <RoomMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLeaveRoom={handleLeaveRoom}
        onEndGame={handleEndGame}
        onRebuy={handleRebuy}
      />
    </div>
  )
}
