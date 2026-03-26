// ===== 模拟数据 - 用于开发和预览 =====

import type { Room, Player, Round, Bet } from '@/types'
import { generateId } from '@/utils/helpers'

/** 模拟房间 ID */
const MOCK_ROOM_ID = 'mock-room-001'

/** 模拟回合 ID */
const MOCK_ROUND_ID = 'mock-round-001'

/** 我的玩家 ID（座位 0） */
export const MY_PLAYER_ID = 'player-me-001'

/** 模拟房间 */
export const mockRoom: Room = {
  id: MOCK_ROOM_ID,
  code: 'A8K3F2',
  name: '欢乐德扑之夜',
  game_type: 'texas_holdem',
  rules: {
    startingChips: 10000,
    smallBlind: 50,
    bigBlind: 100,
    anteAmount: 0,
    useAnte: false,
    blindIncrease: true,
    blindIncreaseInterval: 15,
    blindIncreaseMultiplier: 2,
    maxPlayers: 9,
    minPlayers: 2,
    allowRebuy: true,
    rebuyChips: 10000,
    gameVariant: 'no_limit',
    timeBankSeconds: 30,
  },
  status: 'playing',
  host_id: MY_PLAYER_ID,
  current_round_id: MOCK_ROUND_ID,
  created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
}

/** 模拟玩家列表 */
export const mockPlayers: Player[] = [
  {
    id: MY_PLAYER_ID,
    room_id: MOCK_ROOM_ID,
    name: '我自己',
    avatar: '😎',
    chips: 12500,
    seat: 1,
    is_active: true,
    is_host: true,
    is_online: true,
    session_id: 'sess-001',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'player-002',
    room_id: MOCK_ROOM_ID,
    name: '小明',
    avatar: '🤠',
    chips: 8300,
    seat: 2,
    is_active: true,
    is_host: false,
    is_online: true,
    session_id: 'sess-002',
    created_at: new Date(Date.now() - 43 * 60 * 1000).toISOString(),
  },
  {
    id: 'player-003',
    room_id: MOCK_ROOM_ID,
    name: '大王',
    avatar: '🦊',
    chips: 15200,
    seat: 3,
    is_active: true,
    is_host: false,
    is_online: true,
    session_id: 'sess-003',
    created_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
  },
  {
    id: 'player-004',
    room_id: MOCK_ROOM_ID,
    name: '扑克达人Alice',
    avatar: '🐯',
    chips: 4800,
    seat: 4,
    is_active: false, // 已弃牌
    is_host: false,
    is_online: true,
    session_id: 'sess-004',
    created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
  {
    id: 'player-005',
    room_id: MOCK_ROOM_ID,
    name: '小红',
    avatar: '👑',
    chips: 9200,
    seat: 5,
    is_active: true,
    is_host: false,
    is_online: false, // 离线
    session_id: 'sess-005',
    created_at: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
  },
]

/** 模拟当前回合 */
export const mockRound: Round = {
  id: MOCK_ROUND_ID,
  room_id: MOCK_ROOM_ID,
  round_number: 7,
  pot: 1350,
  status: 'betting',
  phase: 'flop',
  winner_ids: [],
  dealer_seat: 1,
  small_blind_seat: 2,
  big_blind_seat: 3,
  current_bet: 300,
  min_raise: 200,
  created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  settled_at: null,
}

/** 模拟下注记录 */
export const mockBets: Bet[] = [
  // 翻牌前盲注
  {
    id: generateId(),
    round_id: MOCK_ROUND_ID,
    player_id: 'player-002',
    amount: 50,
    bet_type: 'blind_small',
    phase: 'preflop',
    created_at: new Date(Date.now() - 120 * 1000).toISOString(),
  },
  {
    id: generateId(),
    round_id: MOCK_ROUND_ID,
    player_id: 'player-003',
    amount: 100,
    bet_type: 'blind_big',
    phase: 'preflop',
    created_at: new Date(Date.now() - 119 * 1000).toISOString(),
  },
  // 翻牌前跟注 / 弃牌
  {
    id: generateId(),
    round_id: MOCK_ROUND_ID,
    player_id: 'player-004',
    amount: 0,
    bet_type: 'fold',
    phase: 'preflop',
    created_at: new Date(Date.now() - 110 * 1000).toISOString(),
  },
  {
    id: generateId(),
    round_id: MOCK_ROUND_ID,
    player_id: 'player-005',
    amount: 100,
    bet_type: 'call',
    phase: 'preflop',
    created_at: new Date(Date.now() - 105 * 1000).toISOString(),
  },
  {
    id: generateId(),
    round_id: MOCK_ROUND_ID,
    player_id: MY_PLAYER_ID,
    amount: 100,
    bet_type: 'call',
    phase: 'preflop',
    created_at: new Date(Date.now() - 100 * 1000).toISOString(),
  },
  {
    id: generateId(),
    round_id: MOCK_ROUND_ID,
    player_id: 'player-002',
    amount: 50,
    bet_type: 'call',
    phase: 'preflop',
    created_at: new Date(Date.now() - 95 * 1000).toISOString(),
  },
  // 翻牌阶段
  {
    id: generateId(),
    round_id: MOCK_ROUND_ID,
    player_id: 'player-002',
    amount: 200,
    bet_type: 'raise',
    phase: 'flop',
    created_at: new Date(Date.now() - 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    round_id: MOCK_ROUND_ID,
    player_id: 'player-003',
    amount: 300,
    bet_type: 'raise',
    phase: 'flop',
    created_at: new Date(Date.now() - 45 * 1000).toISOString(),
  },
  {
    id: generateId(),
    round_id: MOCK_ROUND_ID,
    player_id: 'player-005',
    amount: 300,
    bet_type: 'call',
    phase: 'flop',
    created_at: new Date(Date.now() - 30 * 1000).toISOString(),
  },
]

/**
 * 初始化 mock 数据到 gameStore
 */
export const initMockData = (store: {
  setRoom: (room: Room) => void
  setPlayers: (players: Player[]) => void
  setMyPlayer: (player: Player) => void
  setCurrentRound: (round: Round) => void
  setBets: (bets: Bet[]) => void
  setConnected: (connected: boolean) => void
  setLoading: (loading: boolean) => void
}) => {
  store.setLoading(true)

  // 模拟网络延迟
  setTimeout(() => {
    store.setRoom(mockRoom)
    store.setPlayers(mockPlayers)
    store.setMyPlayer(mockPlayers[0]) // 座位 1 是自己
    store.setCurrentRound(mockRound)
    store.setBets(mockBets)
    store.setConnected(true)
    store.setLoading(false)
  }, 600)
}
