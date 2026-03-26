// ===== 游戏全局状态管理 =====

import { create } from 'zustand'
import type { Room, Player, Round, Bet } from '@/types'

/** 游戏状态接口 */
interface GameState {
  /** 当前房间 */
  currentRoom: Room | null
  /** 当前玩家列表 */
  players: Player[]
  /** 当前玩家自己 */
  myPlayer: Player | null
  /** 当前回合 */
  currentRound: Round | null
  /** 当前回合的下注记录 */
  bets: Bet[]
  /** 加载状态 */
  isLoading: boolean
  /** 连接状态 */
  isConnected: boolean

  // ===== Actions =====

  /** 设置房间 */
  setRoom: (room: Room | null) => void
  /** 设置玩家列表 */
  setPlayers: (players: Player[]) => void
  /** 更新单个玩家 */
  updatePlayer: (playerId: string, updates: Partial<Player>) => void
  /** 设置当前玩家自己 */
  setMyPlayer: (player: Player | null) => void
  /** 设置当前回合 */
  setCurrentRound: (round: Round | null) => void
  /** 设置下注记录列表 */
  setBets: (bets: Bet[]) => void
  /** 添加单条下注记录 */
  addBet: (bet: Bet) => void
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void
  /** 设置连接状态 */
  setConnected: (connected: boolean) => void
  /** 重置所有状态 */
  reset: () => void

  // ===== 计算属性方法 =====

  /** 获取活跃玩家（未离线且 is_active 的玩家） */
  getActivePlayers: () => Player[]
  /** 计算底池总额 */
  getPotTotal: () => number
  /** 获取玩家在当前回合的总下注 */
  getPlayerBetInRound: (playerId: string) => number
  /** 是否轮到我操作 */
  isMyTurn: () => boolean
}

/** 初始状态 */
const initialState = {
  currentRoom: null as Room | null,
  players: [] as Player[],
  myPlayer: null as Player | null,
  currentRound: null as Round | null,
  bets: [] as Bet[],
  isLoading: false,
  isConnected: false,
}

export const useGameStore = create<GameState>()((set, get) => ({
  ...initialState,

  // ===== Actions =====

  setRoom: (room) => set({ currentRoom: room }),

  setPlayers: (players) => set({ players }),

  updatePlayer: (playerId, updates) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, ...updates } : p
      ),
      // 如果更新的是自己，也同步更新 myPlayer
      myPlayer:
        state.myPlayer?.id === playerId
          ? { ...state.myPlayer, ...updates }
          : state.myPlayer,
    })),

  setMyPlayer: (player) => set({ myPlayer: player }),

  setCurrentRound: (round) => set({ currentRound: round }),

  setBets: (bets) => set({ bets }),

  addBet: (bet) => set((state) => ({ bets: [...state.bets, bet] })),

  setLoading: (loading) => set({ isLoading: loading }),

  setConnected: (connected) => set({ isConnected: connected }),

  reset: () => set(initialState),

  // ===== 计算属性方法 =====

  getActivePlayers: () => {
    const { players } = get()
    return players.filter((p) => p.is_active && p.is_online)
  },

  getPotTotal: () => {
    const { bets, currentRound } = get()
    // 如果回合自身有 pot 值则直接使用
    if (currentRound?.pot != null && currentRound.pot > 0) {
      return currentRound.pot
    }
    // 否则从下注记录汇总（不计算 fold 和 check）
    return bets
      .filter((b) => b.bet_type !== 'fold' && b.bet_type !== 'check')
      .reduce((sum, b) => sum + b.amount, 0)
  },

  getPlayerBetInRound: (playerId: string) => {
    const { bets } = get()
    return bets
      .filter(
        (b) =>
          b.player_id === playerId &&
          b.bet_type !== 'fold' &&
          b.bet_type !== 'check'
      )
      .reduce((sum, b) => sum + b.amount, 0)
  },

  isMyTurn: () => {
    const state = get()
    const { myPlayer, currentRoom, currentRound } = state
    if (!myPlayer || !currentRoom || !currentRound) return false
    // 线下计分器：房间在游戏中、回合在进行、我是活跃玩家
    // 线下打牌由人控制轮转，软件不强制限制操作权
    return currentRoom.status === 'playing'
      && currentRound.status === 'betting'
      && myPlayer.is_active
  },
}))
