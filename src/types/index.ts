// ============================================
// ScoreKit - 德州扑克计分工具箱 类型定义
// ============================================

/** 游戏类型枚举 */
export type GameType = 'texas_holdem' | 'blackjack' | 'mahjong' | 'custom'

/** 房间状态 */
export type RoomStatus = 'waiting' | 'playing' | 'finished'

/** 回合状态 */
export type RoundStatus = 'betting' | 'settled' | 'cancelled'

/** 下注类型 */
export type BetType =
  | 'blind_small'
  | 'blind_big'
  | 'ante'
  | 'call'
  | 'raise'
  | 'fold'
  | 'all_in'
  | 'check'

/** 游戏阶段 */
export type GamePhase = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'

/** 游戏变体 */
export type GameVariant = 'no_limit' | 'pot_limit' | 'fixed_limit'

/** 规则配置 */
export interface RulesConfig {
  /** 初始筹码 */
  startingChips: number
  /** 小盲注 */
  smallBlind: number
  /** 大盲注 */
  bigBlind: number
  /** 前注金额 */
  anteAmount: number
  /** 是否使用前注 */
  useAnte: boolean
  /** 盲注是否递增 */
  blindIncrease: boolean
  /** 盲注递增间隔（分钟） */
  blindIncreaseInterval: number
  /** 盲注递增倍数 */
  blindIncreaseMultiplier: number
  /** 最大玩家数 */
  maxPlayers: number
  /** 最小玩家数 */
  minPlayers: number
  /** 允许重新买入 */
  allowRebuy: boolean
  /** 重新买入筹码数 */
  rebuyChips: number
  /** 游戏变体 */
  gameVariant: GameVariant
  /** 时间银行（秒） */
  timeBankSeconds: number
}

/** 默认规则预设 */
export interface RulePreset {
  id: string
  name: string
  description: string
  icon: string
  rules: RulesConfig
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

/** 房间 */
export interface Room {
  id: string
  /** 6位房间码 */
  code: string
  name: string
  game_type: GameType
  rules: RulesConfig
  status: RoomStatus
  host_id: string
  current_round_id: string | null
  created_at: string
  updated_at: string
}

/** 玩家 */
export interface Player {
  id: string
  room_id: string
  name: string
  /** emoji 头像 */
  avatar: string
  chips: number
  seat: number
  is_active: boolean
  is_host: boolean
  is_online: boolean
  session_id: string
  created_at: string
}

/** 回合 */
export interface Round {
  id: string
  room_id: string
  round_number: number
  pot: number
  status: RoundStatus
  phase: GamePhase
  winner_ids: string[]
  dealer_seat: number
  small_blind_seat: number
  big_blind_seat: number
  /** 当前最大下注 */
  current_bet: number
  /** 最小加注 */
  min_raise: number
  created_at: string
  settled_at: string | null
}

/** 下注记录 */
export interface Bet {
  id: string
  round_id: string
  player_id: string
  amount: number
  bet_type: BetType
  phase: GamePhase
  created_at: string
}

/** 结算记录 */
export interface Settlement {
  id: string
  round_id: string
  player_id: string
  /** 正数=赢，负数=输 */
  amount: number
  created_at: string
}

/** 游戏历史摘要 */
export interface GameHistory {
  id: string
  room: Room
  players: Player[]
  rounds: Round[]
  totalRounds: number
  /** 游戏时长（分钟） */
  duration: number
  created_at: string
}

/** 玩家单局统计 */
export interface PlayerStats {
  playerId: string
  playerName: string
  avatar: string
  startingChips: number
  finalChips: number
  /** 盈亏 */
  profit: number
  handsPlayed: number
  handsWon: number
  biggestWin: number
  biggestLoss: number
  totalBet: number
  /** 弃牌率 */
  foldRate: number
}

/** Toast 通知类型 */
export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
}

/** 音效类型 */
export type SoundType =
  | 'chip_place'
  | 'chip_collect'
  | 'card_flip'
  | 'bell'
  | 'fold'
  | 'all_in'
  | 'win'
  | 'lose'
  | 'tick'
  | 'click'
  | 'notification'

/** 震动模式 */
export type VibrationPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'double'

/** 服务层统一返回结果类型 */
export interface ServiceResult<T> {
  data: T | null
  error: string | null
}
