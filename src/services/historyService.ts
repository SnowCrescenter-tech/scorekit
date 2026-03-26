// ============================================
// ScoreKit - 历史数据管理服务
// 使用 localStorage 持久化游戏记录
// ============================================

import type { GameType, RulesConfig } from '@/types'

// ===== 历史记录专用类型 =====

/** 玩家记录 */
export interface PlayerRecord {
  id: string
  name: string
  avatar: string
  startingChips: number
  finalChips: number
  /** 盈亏 = finalChips - startingChips */
  profit: number
}

/** 下注记录 */
export interface BetRecord {
  playerName: string
  amount: number
  betType: string
}

/** 回合记录 */
export interface RoundRecord {
  roundNumber: number
  pot: number
  winnerNames: string[]
  phase: string
  bets: BetRecord[]
}

/** 单局游戏记录 */
export interface GameRecord {
  id: string
  roomId: string
  roomName: string
  roomCode: string
  gameType: GameType
  rules: RulesConfig
  players: PlayerRecord[]
  rounds: RoundRecord[]
  totalRounds: number
  /** 持续时长（毫秒） */
  duration: number
  startedAt: string
  endedAt: string
}

// ===== 常量 =====

/** localStorage 存储键 */
const STORAGE_KEY = 'scorekit-history'

/** 最多保存的记录数（FIFO 淘汰） */
const MAX_RECORDS = 50

// ===== 内部辅助函数 =====

/** 从 localStorage 读取全部记录 */
function _readAll(): GameRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** 将记录写入 localStorage */
function _writeAll(records: GameRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch (e) {
    console.error('[historyService] 写入 localStorage 失败:', e)
  }
}

// ===== 公开 API =====

/**
 * 保存一条游戏记录
 * 如果超出最大条数，移除最旧的记录（FIFO）
 */
export function saveGameRecord(record: GameRecord): void {
  const records = _readAll()
  // 检查是否已存在同 id 记录，避免重复
  const idx = records.findIndex((r) => r.id === record.id)
  if (idx !== -1) {
    records[idx] = record
  } else {
    // 新记录插入到数组头部（最新的在前）
    records.unshift(record)
  }
  // 限制最大条数
  const trimmed = records.slice(0, MAX_RECORDS)
  _writeAll(trimmed)
}

/**
 * 获取所有游戏记录（按时间倒序）
 */
export function getGameRecords(): GameRecord[] {
  return _readAll()
}

/**
 * 根据 id 获取单条游戏记录
 */
export function getGameRecord(id: string): GameRecord | null {
  const records = _readAll()
  return records.find((r) => r.id === id) ?? null
}

/**
 * 删除一条游戏记录
 */
export function deleteGameRecord(id: string): void {
  const records = _readAll()
  const filtered = records.filter((r) => r.id !== id)
  _writeAll(filtered)
}

/**
 * 清空所有记录
 */
export function clearAllRecords(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 获取最近 N 条记录
 */
export function getRecentRecords(limit: number): GameRecord[] {
  const records = _readAll()
  return records.slice(0, limit)
}
