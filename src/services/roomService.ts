// ============================================
// ScoreKit - 房间服务（CRUD 操作）
// ============================================

import { supabase, getSessionId } from '@/services/supabase'
import type {
  Room,
  Player,
  RoomStatus,
  GameType,
  RulesConfig,
  ServiceResult,
} from '@/types'

// ============================================
// 房间码生成
// ============================================

/** 房间码字符集（去掉容易混淆的字符 0/O、1/I/L） */
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/**
 * 生成 6 位字母数字房间码
 * 内部会查询数据库确保不重复
 */
async function generateRoomCode(): Promise<string> {
  const maxAttempts = 10

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    }

    // 检查是否已存在（仅检查未结束的房间）
    const { data } = await supabase
      .from('rooms')
      .select('id')
      .eq('code', code)
      .neq('status', 'finished')
      .maybeSingle()

    if (!data) {
      return code
    }
  }

  // 极端情况：多次重试仍重复，使用时间戳辅助
  const ts = Date.now().toString(36).toUpperCase().slice(-4)
  const rand = Array.from({ length: 2 }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join('')
  return `${rand}${ts}`
}

// ============================================
// 房间操作
// ============================================

/**
 * 创建房间
 * 同时创建房主为第一个玩家（座位号 1）
 *
 * @param name 房间名称
 * @param gameType 游戏类型
 * @param rules 规则配置
 * @param hostName 房主名称
 * @param hostAvatar 房主头像（emoji）
 * @returns 房间信息和房主玩家信息
 */
export async function createRoom(
  name: string,
  gameType: GameType,
  rules: RulesConfig,
  hostName: string,
  hostAvatar: string
): Promise<ServiceResult<{ room: Room; player: Player }>> {
  try {
    const sessionId = getSessionId()
    const code = await generateRoomCode()

    // 1. 创建房间
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        code,
        name,
        game_type: gameType,
        rules,
        status: 'waiting' as RoomStatus,
        host_id: sessionId,
      })
      .select()
      .single()

    if (roomError || !room) {
      return { data: null, error: roomError?.message ?? '创建房间失败' }
    }

    // 2. 创建房主玩家
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        room_id: room.id,
        name: hostName,
        avatar: hostAvatar,
        chips: rules.startingChips,
        seat: 1,
        is_active: true,
        is_host: true,
        is_online: true,
        session_id: sessionId,
      })
      .select()
      .single()

    if (playerError || !player) {
      // 回滚：删除刚创建的房间
      await supabase.from('rooms').delete().eq('id', room.id)
      return { data: null, error: playerError?.message ?? '创建房主玩家失败' }
    }

    return { data: { room: room as Room, player: player as Player }, error: null }
  } catch (err) {
    return { data: null, error: `创建房间异常: ${(err as Error).message}` }
  }
}

/**
 * 通过房间码加入房间
 *
 * @param roomCode 6位房间码
 * @param playerName 玩家名称
 * @param playerAvatar 玩家头像（emoji）
 * @returns 房间信息和新加入的玩家信息
 */
export async function joinRoom(
  roomCode: string,
  playerName: string,
  playerAvatar: string
): Promise<ServiceResult<{ room: Room; player: Player }>> {
  try {
    const sessionId = getSessionId()
    const normalizedCode = roomCode.toUpperCase().trim()

    // 1. 查找房间
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', normalizedCode)
      .neq('status', 'finished')
      .maybeSingle()

    if (roomError) {
      return { data: null, error: roomError.message }
    }
    if (!room) {
      return { data: null, error: '房间不存在或已结束' }
    }

    // 2. 检查玩家是否已在房间中（断线重连）
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', room.id)
      .eq('session_id', sessionId)
      .maybeSingle()

    if (existingPlayer) {
      // 断线重连：更新在线状态
      const { data: updatedPlayer, error: updateError } = await supabase
        .from('players')
        .update({ is_online: true, name: playerName, avatar: playerAvatar })
        .eq('id', existingPlayer.id)
        .select()
        .single()

      if (updateError) {
        return { data: null, error: updateError.message }
      }

      return {
        data: { room: room as Room, player: updatedPlayer as Player },
        error: null,
      }
    }

    // 3. 检查房间是否已满
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('seat')
      .eq('room_id', room.id)
      .eq('is_active', true)

    if (playersError) {
      return { data: null, error: playersError.message }
    }

    const currentCount = players?.length ?? 0
    const maxPlayers = (room.rules as RulesConfig).maxPlayers

    if (currentCount >= maxPlayers) {
      return { data: null, error: `房间已满（最多 ${maxPlayers} 人）` }
    }

    // 4. 分配座位号（找到第一个空座位）
    const occupiedSeats = new Set(players?.map((p) => p.seat) ?? [])
    let assignedSeat = 1
    while (occupiedSeats.has(assignedSeat)) {
      assignedSeat++
    }

    // 5. 创建玩家
    const { data: newPlayer, error: playerError } = await supabase
      .from('players')
      .insert({
        room_id: room.id,
        name: playerName,
        avatar: playerAvatar,
        chips: (room.rules as RulesConfig).startingChips,
        seat: assignedSeat,
        is_active: true,
        is_host: false,
        is_online: true,
        session_id: sessionId,
      })
      .select()
      .single()

    if (playerError || !newPlayer) {
      return { data: null, error: playerError?.message ?? '加入房间失败' }
    }

    return {
      data: { room: room as Room, player: newPlayer as Player },
      error: null,
    }
  } catch (err) {
    return { data: null, error: `加入房间异常: ${(err as Error).message}` }
  }
}

/**
 * 通过房间码获取房间信息
 */
export async function getRoom(roomCode: string): Promise<ServiceResult<Room>> {
  try {
    const normalizedCode = roomCode.toUpperCase().trim()

    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle()

    if (error) {
      return { data: null, error: error.message }
    }
    if (!data) {
      return { data: null, error: '房间不存在' }
    }

    return { data: data as Room, error: null }
  } catch (err) {
    return { data: null, error: `获取房间异常: ${(err as Error).message}` }
  }
}

/**
 * 获取房间内的所有玩家列表
 * 按座位号排序
 */
export async function getRoomPlayers(roomId: string): Promise<ServiceResult<Player[]>> {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_active', true)
      .order('seat', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: (data ?? []) as Player[], error: null }
  } catch (err) {
    return { data: null, error: `获取玩家列表异常: ${(err as Error).message}` }
  }
}

/**
 * 更新玩家筹码
 */
export async function updatePlayerChips(
  playerId: string,
  chips: number
): Promise<ServiceResult<Player>> {
  try {
    const { data, error } = await supabase
      .from('players')
      .update({ chips })
      .eq('id', playerId)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as Player, error: null }
  } catch (err) {
    return { data: null, error: `更新筹码异常: ${(err as Error).message}` }
  }
}

/**
 * 移除玩家（软删除，将 is_active 设为 false）
 */
export async function removePlayer(playerId: string): Promise<ServiceResult<Player>> {
  try {
    const { data, error } = await supabase
      .from('players')
      .update({ is_active: false, is_online: false })
      .eq('id', playerId)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as Player, error: null }
  } catch (err) {
    return { data: null, error: `移除玩家异常: ${(err as Error).message}` }
  }
}

/**
 * 更新房间状态
 */
export async function updateRoomStatus(
  roomId: string,
  status: RoomStatus
): Promise<ServiceResult<Room>> {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', roomId)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as Room, error: null }
  } catch (err) {
    return { data: null, error: `更新房间状态异常: ${(err as Error).message}` }
  }
}

/**
 * 设置玩家在线状态
 */
export async function setPlayerOnline(
  playerId: string,
  isOnline: boolean
): Promise<ServiceResult<Player>> {
  try {
    const { data, error } = await supabase
      .from('players')
      .update({ is_online: isOnline })
      .eq('id', playerId)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as Player, error: null }
  } catch (err) {
    return { data: null, error: `更新在线状态异常: ${(err as Error).message}` }
  }
}
