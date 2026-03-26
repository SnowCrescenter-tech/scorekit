// ===== 环形玩家布局组件（核心） =====

import { useRef, useEffect, useState, useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'
import PlayerSeat from './PlayerSeat'
import PotDisplay from './PotDisplay'
import RoundInfo from './RoundInfo'
import type { Player, Round } from '@/types'

interface PlayerCircleProps {
  /** 玩家列表 */
  players: Player[]
  /** 自己的玩家数据 */
  myPlayer: Player
  /** 当前回合 */
  round: Round | null
}

/**
 * 椭圆座位位置计算（手机竖屏优化）
 * - 椭圆形：宽 > 高
 * - 自己固定在底部中央
 * - 其他玩家顺时针环绕
 */
function getEllipseSeatPositions(
  totalSeats: number,
  containerWidth: number,
  containerHeight: number,
  mySeat: number,
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = []
  const cx = containerWidth / 2
  const cy = containerHeight / 2

  // 椭圆半径：水平略大，垂直留空给底池和底部操作区
  const rx = containerWidth * 0.40
  const ry = containerHeight * 0.38

  for (let i = 0; i < totalSeats; i++) {
    // 因为自己需要在底部（角度 π/2 即 90°），
    // 计算相对于自己座位的偏移来确定角度
    const seatOffset = (i - mySeat + totalSeats) % totalSeats
    // 从底部开始（π/2），顺时针排列
    const angle = (Math.PI / 2) + (2 * Math.PI * seatOffset) / totalSeats

    positions.push({
      x: Math.round(cx + rx * Math.cos(angle)),
      y: Math.round(cy + ry * Math.sin(angle)),
    })
  }

  return positions
}

/**
 * 环形玩家布局
 * - 椭圆形排列所有玩家
 * - 中央放置底池和回合信息
 * - 自适应容器大小
 */
export default function PlayerCircle({
  players,
  myPlayer,
  round,
}: PlayerCircleProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const getPlayerBetInRound = useGameStore((s) => s.getPlayerBetInRound)
  const getPotTotal = useGameStore((s) => s.getPotTotal)
  const roomRules = useGameStore((s) => s.currentRoom?.rules)

  /** 监听容器尺寸变化 */
  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current
      setContainerSize({ w: offsetWidth, h: offsetHeight })
    }
  }, [])

  useEffect(() => {
    updateSize()
    const observer = new ResizeObserver(updateSize)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [updateSize])

  /** 按座位号排序玩家 */
  const sortedPlayers = [...players].sort((a, b) => a.seat - b.seat)

  /** 计算自己在排序后数组中的索引 */
  const myIndex = sortedPlayers.findIndex(p => p.id === myPlayer.id)

  /** 计算座位位置 */
  const positions = containerSize.w > 0
    ? getEllipseSeatPositions(
        sortedPlayers.length,
        containerSize.w,
        containerSize.h,
        myIndex >= 0 ? myIndex : 0,
      )
    : []

  /** 获取底池 */
  const pot = getPotTotal()

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full no-select"
    >
      {/* 玩家座位 */}
      {positions.length > 0 &&
        sortedPlayers.map((player, idx) => (
          <PlayerSeat
            key={player.id}
            player={player}
            isMe={player.id === myPlayer.id}
            isDealer={round?.dealer_seat === player.seat}
            isSmallBlind={round?.small_blind_seat === player.seat}
            isBigBlind={round?.big_blind_seat === player.seat}
            isCurrentTurn={false} // 后续由服务端控制
            betInRound={getPlayerBetInRound(player.id)}
            position={positions[idx]}
          />
        ))}

      {/* 中央区域：底池 + 回合信息 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <PotDisplay pot={pot} />
        {round && (
          <div className="mt-2">
            <RoundInfo
              phase={round.phase}
              roundNumber={round.round_number}
              smallBlind={roomRules?.smallBlind ?? 50}
              bigBlind={roomRules?.bigBlind ?? 100}
              blindIncrease={roomRules?.blindIncrease ?? false}
            />
          </div>
        )}
      </div>
    </div>
  )
}
