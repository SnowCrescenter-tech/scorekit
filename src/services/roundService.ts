// ============================================
// ScoreKit - 回合服务（CRUD 操作）
// ============================================

import { supabase } from '@/services/supabase'
import type {
  Round,
  Bet,
  Settlement,
  Player,
  BetType,
  GamePhase,
  RulesConfig,
  ServiceResult,
} from '@/types'

// ============================================
// 回合操作
// ============================================

/**
 * 开始新回合
 * 自动计算盲注位置（庄家下一位为小盲，再下一位为大盲）
 * 自动从盲注玩家和前注玩家扣除筹码
 *
 * @param roomId 房间 ID
 * @param dealerSeat 庄家座位号
 * @param players 当前活跃玩家列表（需已按座位号排序）
 * @param rules 当前房间规则配置
 * @returns 新创建的回合信息
 */
export async function startNewRound(
  roomId: string,
  dealerSeat: number,
  players: Player[],
  rules: RulesConfig
): Promise<ServiceResult<Round>> {
  try {
    if (players.length < 2) {
      return { data: null, error: '至少需要 2 名玩家才能开始回合' }
    }

    // 获取当前房间最新回合号
    const { data: lastRound } = await supabase
      .from('rounds')
      .select('round_number')
      .eq('room_id', roomId)
      .order('round_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const roundNumber = (lastRound?.round_number ?? 0) + 1

    // 计算盲注位置
    // 按座位号排序的活跃玩家
    const sortedSeats = players
      .filter((p) => p.is_active && p.chips > 0)
      .map((p) => p.seat)
      .sort((a, b) => a - b)

    if (sortedSeats.length < 2) {
      return { data: null, error: '有效玩家不足（至少需要 2 名有筹码的玩家）' }
    }

    // 找到庄家在排序座位中的索引
    const dealerIndex = sortedSeats.indexOf(dealerSeat)
    const effectiveDealerIndex = dealerIndex >= 0 ? dealerIndex : 0

    // 小盲 = 庄家的下一位，大盲 = 小盲的下一位
    // 当只有 2 人时，庄家 = 小盲
    let smallBlindSeat: number
    let bigBlindSeat: number

    if (sortedSeats.length === 2) {
      // 两人对局：庄家即小盲
      smallBlindSeat = sortedSeats[effectiveDealerIndex]
      bigBlindSeat = sortedSeats[(effectiveDealerIndex + 1) % sortedSeats.length]
    } else {
      smallBlindSeat = sortedSeats[(effectiveDealerIndex + 1) % sortedSeats.length]
      bigBlindSeat = sortedSeats[(effectiveDealerIndex + 2) % sortedSeats.length]
    }

    // 初始底池 = 小盲 + 大盲 + 所有前注
    let initialPot = 0
    const blindBets: Array<{ player_id: string; amount: number; bet_type: BetType }> = []

    // 找到小盲玩家
    const sbPlayer = players.find((p) => p.seat === smallBlindSeat)
    if (sbPlayer) {
      const sbAmount = Math.min(rules.smallBlind, sbPlayer.chips)
      initialPot += sbAmount
      blindBets.push({
        player_id: sbPlayer.id,
        amount: sbAmount,
        bet_type: 'blind_small',
      })
    }

    // 找到大盲玩家
    const bbPlayer = players.find((p) => p.seat === bigBlindSeat)
    if (bbPlayer) {
      const bbAmount = Math.min(rules.bigBlind, bbPlayer.chips)
      initialPot += bbAmount
      blindBets.push({
        player_id: bbPlayer.id,
        amount: bbAmount,
        bet_type: 'blind_big',
      })
    }

    // 处理前注
    if (rules.useAnte && rules.anteAmount > 0) {
      for (const player of players) {
        if (player.is_active && player.chips > 0) {
          const anteAmount = Math.min(rules.anteAmount, player.chips)
          initialPot += anteAmount
          blindBets.push({
            player_id: player.id,
            amount: anteAmount,
            bet_type: 'ante',
          })
        }
      }
    }

    // 1. 创建回合
    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .insert({
        room_id: roomId,
        round_number: roundNumber,
        pot: initialPot,
        status: 'betting',
        phase: 'preflop' as GamePhase,
        winner_ids: [],
        dealer_seat: dealerSeat,
        small_blind_seat: smallBlindSeat,
        big_blind_seat: bigBlindSeat,
        current_bet: rules.bigBlind,
        min_raise: rules.bigBlind,
      })
      .select()
      .single()

    if (roundError || !round) {
      return { data: null, error: roundError?.message ?? '创建回合失败' }
    }

    // 2. 批量插入盲注下注记录
    if (blindBets.length > 0) {
      const betRecords = blindBets.map((b) => ({
        round_id: round.id,
        player_id: b.player_id,
        amount: b.amount,
        bet_type: b.bet_type,
        phase: 'preflop' as GamePhase,
      }))

      const { error: betsError } = await supabase.from('bets').insert(betRecords)

      if (betsError) {
        console.error('插入盲注记录失败:', betsError.message)
        // 不回滚回合，但记录错误
      }
    }

    // 3. 扣除玩家筹码
    for (const bet of blindBets) {
      const player = players.find((p) => p.id === bet.player_id)
      if (player) {
        await supabase
          .from('players')
          .update({ chips: player.chips - bet.amount })
          .eq('id', bet.player_id)
      }
    }

    // 4. 更新房间当前回合 ID
    await supabase
      .from('rooms')
      .update({ current_round_id: round.id, status: 'playing' })
      .eq('id', roomId)

    return { data: round as Round, error: null }
  } catch (err) {
    return { data: null, error: `开始回合异常: ${(err as Error).message}` }
  }
}

/**
 * 下注
 *
 * @param roundId 回合 ID
 * @param playerId 玩家 ID
 * @param amount 下注金额
 * @param betType 下注类型
 * @param phase 当前游戏阶段
 * @returns 下注记录
 */
export async function placeBet(
  roundId: string,
  playerId: string,
  amount: number,
  betType: BetType,
  phase: GamePhase
): Promise<ServiceResult<Bet>> {
  try {
    // 1. 插入下注记录
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        round_id: roundId,
        player_id: playerId,
        amount,
        bet_type: betType,
        phase,
      })
      .select()
      .single()

    if (betError || !bet) {
      return { data: null, error: betError?.message ?? '下注失败' }
    }

    // 2. 扣减玩家筹码（fold 和 check 不扣筹码）
    if (betType !== 'fold' && betType !== 'check' && amount > 0) {
      const { data: player } = await supabase
        .from('players')
        .select('chips')
        .eq('id', playerId)
        .single()

      if (player) {
        await supabase
          .from('players')
          .update({ chips: player.chips - amount })
          .eq('id', playerId)
      }

      // 3. 更新回合底池和当前最大下注
      const { data: round } = await supabase
        .from('rounds')
        .select('pot, current_bet, min_raise')
        .eq('id', roundId)
        .single()

      if (round) {
        const updateData: Record<string, number> = {
          pot: round.pot + amount,
        }

        // 如果是加注，更新当前最大下注和最小加注
        if (betType === 'raise' || betType === 'all_in') {
          if (amount > round.current_bet) {
            updateData.current_bet = amount
            updateData.min_raise = amount - round.current_bet + amount
          }
        }

        await supabase.from('rounds').update(updateData).eq('id', roundId)
      }
    }

    return { data: bet as Bet, error: null }
  } catch (err) {
    return { data: null, error: `下注异常: ${(err as Error).message}` }
  }
}

/**
 * 结算回合
 * 将底池分配给赢家，记录结算详情
 *
 * @param roundId 回合 ID
 * @param winnerIds 赢家玩家 ID 数组（可多个，分池情况）
 * @param settlements 结算详情数组
 * @returns 更新后的回合信息
 */
export async function settleRound(
  roundId: string,
  winnerIds: string[],
  settlements: Array<{ player_id: string; amount: number }>
): Promise<ServiceResult<Round>> {
  try {
    if (winnerIds.length === 0) {
      return { data: null, error: '至少需要指定一个赢家' }
    }

    // 1. 插入结算记录
    const settlementRecords = settlements.map((s) => ({
      round_id: roundId,
      player_id: s.player_id,
      amount: s.amount,
    }))

    const { error: settleError } = await supabase
      .from('settlements')
      .insert(settlementRecords)

    if (settleError) {
      return { data: null, error: `记录结算失败: ${settleError.message}` }
    }

    // 2. 更新每个玩家的筹码
    for (const settlement of settlements) {
      const { data: player } = await supabase
        .from('players')
        .select('chips')
        .eq('id', settlement.player_id)
        .single()

      if (player) {
        await supabase
          .from('players')
          .update({ chips: player.chips + settlement.amount })
          .eq('id', settlement.player_id)
      }
    }

    // 3. 更新回合状态为已结算
    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .update({
        status: 'settled',
        winner_ids: winnerIds,
        settled_at: new Date().toISOString(),
      })
      .eq('id', roundId)
      .select()
      .single()

    if (roundError || !round) {
      return { data: null, error: roundError?.message ?? '更新回合状态失败' }
    }

    // 4. 清除房间当前回合引用
    await supabase
      .from('rooms')
      .update({ current_round_id: null })
      .eq('id', round.room_id)

    return { data: round as Round, error: null }
  } catch (err) {
    return { data: null, error: `结算回合异常: ${(err as Error).message}` }
  }
}

/**
 * 获取回合的所有下注记录
 * 按创建时间排序
 */
export async function getRoundBets(roundId: string): Promise<ServiceResult<Bet[]>> {
  try {
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('round_id', roundId)
      .order('created_at', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: (data ?? []) as Bet[], error: null }
  } catch (err) {
    return { data: null, error: `获取下注记录异常: ${(err as Error).message}` }
  }
}

/**
 * 获取房间当前进行中的回合
 */
export async function getCurrentRound(roomId: string): Promise<ServiceResult<Round | null>> {
  try {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'betting')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: (data as Round) ?? null, error: null }
  } catch (err) {
    return { data: null, error: `获取当前回合异常: ${(err as Error).message}` }
  }
}

/**
 * 推进游戏阶段
 * 同时重置当前最大下注（新阶段从 0 开始）
 *
 * @param roundId 回合 ID
 * @param newPhase 新的游戏阶段
 * @returns 更新后的回合信息
 */
export async function advancePhase(
  roundId: string,
  newPhase: GamePhase
): Promise<ServiceResult<Round>> {
  try {
    const { data, error } = await supabase
      .from('rounds')
      .update({
        phase: newPhase,
        current_bet: 0,
        min_raise: 0,
      })
      .eq('id', roundId)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as Round, error: null }
  } catch (err) {
    return { data: null, error: `推进阶段异常: ${(err as Error).message}` }
  }
}

/**
 * 获取房间所有历史回合
 * 按回合号降序排列
 */
export async function getRoomRounds(roomId: string): Promise<ServiceResult<Round[]>> {
  try {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('room_id', roomId)
      .order('round_number', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: (data ?? []) as Round[], error: null }
  } catch (err) {
    return { data: null, error: `获取回合历史异常: ${(err as Error).message}` }
  }
}

/**
 * 获取回合的结算记录
 */
export async function getRoundSettlements(
  roundId: string
): Promise<ServiceResult<Settlement[]>> {
  try {
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('round_id', roundId)
      .order('created_at', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: (data ?? []) as Settlement[], error: null }
  } catch (err) {
    return { data: null, error: `获取结算记录异常: ${(err as Error).message}` }
  }
}
