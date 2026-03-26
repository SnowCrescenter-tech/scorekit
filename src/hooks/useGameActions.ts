// ===== 游戏操作 Hook =====

import { useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { playSound } from '@/utils/sound'
import { vibrate } from '@/utils/vibration'
import { toast } from '@/components/common/Toast'
import type { RulesConfig, BetType } from '@/types'

// ===== 外部服务导入 =====
import * as roomService from '@/services/roomService'
import * as roundService from '@/services/roundService'
import { saveGameRecord } from '@/services/historyService'
import type { GameRecord } from '@/services/historyService'
import { generateId } from '@/utils/helpers'

/**
 * 封装游戏操作的 React Hook
 * 每个操作包含：调用 service → 更新 store → 播放音效 → 触发震动 → 显示 toast
 *
 * TODO: 性能优化 —— 当前一次性解构所有状态会导致组件订阅全部状态变化，
 * 应该将 actions 与 state 分离：actions 使用稳定引用，state 在回调内用
 * useGameStore.getState() 读取最新值，避免不必要的重渲染。
 */
export const useGameActions = () => {
  const {
    currentRoom,
    myPlayer,
    players,
    currentRound,
    setRoom,
    setPlayers,
    setMyPlayer,
    setCurrentRound,
    setBets,
    addBet,
    updatePlayer,
    setLoading,
    reset,
  } = useGameStore()

  const { soundEnabled, vibrationEnabled } = useSettingsStore()

  /** 播放音效的包装函数（尊重设置） */
  const sound = useCallback(
    (type: Parameters<typeof playSound>[0]) => {
      if (soundEnabled) playSound(type)
    },
    [soundEnabled]
  )

  /** 触发震动的包装函数（尊重设置） */
  const vib = useCallback(
    (pattern: Parameters<typeof vibrate>[0]) => {
      if (vibrationEnabled) vibrate(pattern)
    },
    [vibrationEnabled]
  )

  // ===== 创建房间 =====
  const createRoom = useCallback(
    async (
      name: string,
      rules: RulesConfig,
      hostName: string,
      hostAvatar: string
    ): Promise<string | null> => {
      setLoading(true)
      try {
        const { data, error } = await roomService.createRoom(
          name,
          'texas_holdem',
          rules,
          hostName,
          hostAvatar
        )
        if (error || !data) {
          toast.error(error ?? '创建房间失败')
          vib('error')
          return null
        }

        setRoom(data.room)
        setMyPlayer(data.player)
        setPlayers([data.player])

        sound('notification')
        vib('success')
        toast.success(`房间 ${data.room.code} 创建成功`)

        return data.room.code
      } catch (err) {
        const message = err instanceof Error ? err.message : '创建房间时发生错误'
        toast.error(message)
        vib('error')
        return null
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setRoom, setMyPlayer, setPlayers, sound, vib]
  )

  // ===== 加入房间 =====
  const joinRoom = useCallback(
    async (
      roomCode: string,
      playerName: string,
      playerAvatar: string
    ): Promise<boolean> => {
      setLoading(true)
      try {
        const { data, error } = await roomService.joinRoom(
          roomCode,
          playerName,
          playerAvatar
        )
        if (error || !data) {
          toast.error(error ?? '加入房间失败')
          vib('error')
          return false
        }

        setRoom(data.room)
        setMyPlayer(data.player)

        // 获取房间内所有玩家
        const playersResult = await roomService.getRoomPlayers(data.room.id)
        if (playersResult.data) {
          setPlayers(playersResult.data)
        }

        sound('notification')
        vib('success')
        toast.success(`已加入房间 ${roomCode}`)

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : '加入房间时发生错误'
        toast.error(message)
        vib('error')
        return false
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setRoom, setMyPlayer, setPlayers, sound, vib]
  )

  // ===== 开始新回合 =====
  const startRound = useCallback(async (): Promise<boolean> => {
    if (!currentRoom) {
      toast.error('当前不在任何房间中')
      return false
    }
    setLoading(true)
    try {
      // 计算庄家座位（简单轮转）
      const dealerSeat = currentRound
        ? (currentRound.dealer_seat % players.length) + 1
        : 1

      const { data: round, error } = await roundService.startNewRound(
        currentRoom.id,
        dealerSeat,
        players,
        currentRoom.rules
      )
      if (error || !round) {
        toast.error(error ?? '开始回合失败')
        vib('error')
        return false
      }

      setCurrentRound(round)
      setBets([])

      sound('bell')
      vib('medium')
      toast.info(`第 ${round.round_number} 回合开始`)

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '开始回合时发生错误'
      toast.error(message)
      vib('error')
      return false
    } finally {
      setLoading(false)
    }
  }, [currentRoom, currentRound, players, setLoading, setCurrentRound, setBets, sound, vib])

  // ===== 下注 =====
  const placeBet = useCallback(
    async (amount: number, betType: BetType): Promise<boolean> => {
      if (!currentRound || !myPlayer) {
        toast.error('无法下注：未在回合中')
        return false
      }
      setLoading(true)
      try {
        const { data: bet, error } = await roundService.placeBet(
          currentRound.id,
          myPlayer.id,
          amount,
          betType,
          currentRound.phase
        )
        if (error || !bet) {
          toast.error(error ?? '下注失败')
          vib('error')
          return false
        }

        addBet(bet)

        // 更新玩家筹码（扣除下注金额）
        if (betType !== 'fold' && betType !== 'check') {
          updatePlayer(myPlayer.id, {
            chips: myPlayer.chips - amount,
          })
        }

        // 不同下注类型使用不同音效和震动
        switch (betType) {
          case 'fold':
            sound('fold')
            vib('light')
            break
          case 'all_in':
            sound('all_in')
            vib('heavy')
            toast.info('🔥 All In!')
            break
          case 'check':
            sound('click')
            vib('light')
            break
          default:
            sound('chip_place')
            vib('medium')
        }

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : '下注时发生错误'
        toast.error(message)
        vib('error')
        return false
      } finally {
        setLoading(false)
      }
    },
    [currentRound, myPlayer, setLoading, addBet, updatePlayer, sound, vib]
  )

  // ===== 结算回合 =====
  const settleRound = useCallback(
    async (
      winnerIds: string[],
      settlements: { player_id: string; amount: number }[]
    ): Promise<boolean> => {
      if (!currentRound) {
        toast.error('没有进行中的回合')
        return false
      }
      setLoading(true)
      try {
        const { error } = await roundService.settleRound(
          currentRound.id,
          winnerIds,
          settlements
        )
        if (error) {
          toast.error(error)
          vib('error')
          return false
        }

        // 更新每个玩家的筹码
        for (const s of settlements) {
          const player = players.find((p) => p.id === s.player_id)
          if (player) {
            updatePlayer(s.player_id, {
              chips: player.chips + s.amount,
            })
          }
        }

        // 标记回合已结算
        setCurrentRound({
          ...currentRound,
          status: 'settled',
          winner_ids: winnerIds,
          settled_at: new Date().toISOString(),
        })

        // 赢家/输家音效
        if (myPlayer && winnerIds.includes(myPlayer.id)) {
          sound('win')
          vib('success')
          toast.success('🎉 恭喜，你赢了!')
        } else {
          sound('chip_collect')
          vib('light')
          toast.info('回合已结算')
        }

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : '结算时发生错误'
        toast.error(message)
        vib('error')
        return false
      } finally {
        setLoading(false)
      }
    },
    [currentRound, myPlayer, players, setLoading, setCurrentRound, updatePlayer, sound, vib]
  )

  // ===== 一键补注（自动开始新回合并扣除盲注/前注） =====
  // 修复：startNewRound 内部已自动处理盲注扣除，不再手动调用 placeBet 避免双倍扣除
  const autoPostBlinds = useCallback(async (): Promise<boolean> => {
    // 一键补注 = 开始新回合（startNewRound 内部已自动处理盲注扣除）
    return await startRound()
  }, [startRound])

  // ===== 重新买入 =====
  const rebuy = useCallback(
    async (playerId: string): Promise<boolean> => {
      if (!currentRoom) {
        toast.error('当前不在任何房间中')
        return false
      }
      if (!currentRoom.rules.allowRebuy) {
        toast.error('当前房间不允许重新买入')
        return false
      }
      setLoading(true)
      try {
        const rebuyAmount = currentRoom.rules.rebuyChips
        const player = players.find((p) => p.id === playerId)
        if (!player) {
          toast.error('找不到该玩家')
          return false
        }

        const newChips = player.chips + rebuyAmount
        const { data: updatedPlayer, error } =
          await roomService.updatePlayerChips(playerId, newChips)
        if (error || !updatedPlayer) {
          toast.error(error ?? '重新买入失败')
          vib('error')
          return false
        }

        updatePlayer(playerId, { chips: newChips })

        sound('chip_collect')
        vib('success')
        toast.success(`${player.name} 重新买入 ${rebuyAmount} 筹码`)

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : '重新买入时发生错误'
        toast.error(message)
        vib('error')
        return false
      } finally {
        setLoading(false)
      }
    },
    [currentRoom, players, setLoading, updatePlayer, sound, vib]
  )

  // ===== 结束游戏 =====
  const endGame = useCallback(async (): Promise<boolean> => {
    const { currentRoom, players, currentRound } = useGameStore.getState()
    if (!currentRoom) return false

    try {
      // 1. 更新房间状态为 finished
      await roomService.updateRoomStatus(currentRoom.id, 'finished')

      // 2. 生成历史记录并保存到 localStorage
      const gameRecord: GameRecord = {
        id: generateId(),
        roomId: currentRoom.id,
        roomName: currentRoom.name,
        roomCode: currentRoom.code,
        gameType: currentRoom.game_type,
        rules: currentRoom.rules,
        players: players.map((p) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          startingChips: currentRoom.rules.startingChips,
          finalChips: p.chips,
          profit: p.chips - currentRoom.rules.startingChips,
        })),
        rounds: [], // 回合详情可以后续从 bets 中整理
        totalRounds: currentRound?.round_number ?? 0,
        duration: Date.now() - new Date(currentRoom.created_at).getTime(),
        startedAt: currentRoom.created_at,
        endedAt: new Date().toISOString(),
      }

      saveGameRecord(gameRecord)

      // 3. 更新 store
      setRoom({ ...currentRoom, status: 'finished' })

      sound('win')
      vib('success')
      toast.success('🏆 游戏已结束，记录已保存')

      return true
    } catch (err) {
      toast.error('结束游戏失败')
      vib('error')
      return false
    }
  }, [setRoom, sound, vib])

  // ===== 离开房间 =====
  const leaveRoom = useCallback(async (): Promise<void> => {
    try {
      if (myPlayer) {
        await roomService.removePlayer(myPlayer.id)
      }
      sound('click')
      vib('light')
      toast.info('已离开房间')
    } catch (err) {
      console.warn('离开房间时发生错误', err)
    } finally {
      reset()
    }
  }, [myPlayer, reset, sound, vib])

  return {
    createRoom,
    joinRoom,
    startRound,
    placeBet,
    settleRound,
    autoPostBlinds,
    rebuy,
    leaveRoom,
    endGame,
  }
}
