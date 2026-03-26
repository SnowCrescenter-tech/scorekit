// ===== 房间菜单组件（BottomSheet） =====

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Copy,
  BookOpen,
  Users,
  RefreshCw,
  Volume2,
  VolumeX,
  Smartphone,
  LogOut,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { BottomSheet, Modal, Button } from '@/components/common'
import { useGameStore } from '@/stores/gameStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { copyToClipboard, formatChips } from '@/utils/helpers'
import { toast } from '@/components/common'
import type { Player } from '@/types'

interface RoomMenuProps {
  /** 是否打开 */
  open: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 离开房间回调 */
  onLeaveRoom: () => void
  /** 结束游戏回调（仅房主） */
  onEndGame: () => void
  /** 重新买入回调 */
  onRebuy?: () => void
}

/** 单个菜单项 */
function MenuItem({
  icon,
  label,
  subtitle,
  danger = false,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  subtitle?: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      className={[
        'w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)]',
        'touch-feedback transition-colors',
        danger
          ? 'text-danger hover:bg-danger/10'
          : 'text-foreground hover:bg-white/5',
      ].join(' ')}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
    >
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 text-left">
        <p className="text-sm">{label}</p>
        {subtitle && (
          <p className="text-[11px] text-foreground-dim mt-0.5">{subtitle}</p>
        )}
      </div>
    </motion.button>
  )
}

/**
 * 房间菜单
 * - 复制房间码、查看规则、玩家列表
 * - 重新买入、音效/震动开关
 * - 离开房间、结束游戏
 */
export default function RoomMenu({
  open,
  onClose,
  onLeaveRoom,
  onEndGame,
  onRebuy,
}: RoomMenuProps) {
  const room = useGameStore((s) => s.currentRoom)
  const players = useGameStore((s) => s.players)
  const myPlayer = useGameStore((s) => s.myPlayer)

  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const vibrationEnabled = useSettingsStore((s) => s.vibrationEnabled)
  const toggleSound = useSettingsStore((s) => s.toggleSound)
  const toggleVibration = useSettingsStore((s) => s.toggleVibration)

  /** 是否为房主 */
  const isHost = myPlayer?.is_host ?? false

  /** 规则面板展开状态 */
  const [rulesExpanded, setRulesExpanded] = useState(false)

  /** 重新买入确认弹窗 */
  const [rebuyConfirmOpen, setRebuyConfirmOpen] = useState(false)

  /** 复制房间码 */
  const handleCopyCode = async () => {
    if (!room) return
    const ok = await copyToClipboard(room.code)
    if (ok) {
      toast.success(`已复制房间码 ${room.code}`)
    } else {
      toast.error('复制失败')
    }
    onClose()
  }

  /** 玩家列表（按筹码排序） */
  const sortedPlayers = [...players].sort((a, b) => b.chips - a.chips)

  return (
    <BottomSheet open={open} onClose={onClose} title="房间菜单" snapPoints={[0.65]}>
      <div className="space-y-1">
        {/* 复制房间码 */}
        <MenuItem
          icon={<Copy className="w-5 h-5 text-primary" />}
          label="复制房间码"
          subtitle={room?.code}
          onClick={handleCopyCode}
        />

        {/* 查看规则 */}
        <MenuItem
          icon={<BookOpen className="w-5 h-5 text-info" />}
          label="游戏规则"
          subtitle={room ? `${formatChips(room.rules.smallBlind)}/${formatChips(room.rules.bigBlind)} · ${room.rules.gameVariant === 'no_limit' ? '无限注' : room.rules.gameVariant === 'pot_limit' ? '底池限注' : '固定限注'}` : ''}
          onClick={() => setRulesExpanded((prev) => !prev)}
        />

        {/* 规则详情可折叠面板 */}
        <AnimatePresence>
          {rulesExpanded && room && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mx-4 mb-2 p-3 rounded-[var(--radius-md)] bg-white/3 border border-white/5 space-y-2">
                <RuleRow label="游戏变体" value={
                  room.rules.gameVariant === 'no_limit' ? '无限制' :
                  room.rules.gameVariant === 'pot_limit' ? '彩池限注' : '限注'
                } />
                <RuleRow label="初始筹码" value={formatChips(room.rules.startingChips)} />
                <RuleRow label="小盲注" value={formatChips(room.rules.smallBlind)} />
                <RuleRow label="大盲注" value={formatChips(room.rules.bigBlind)} />
                <RuleRow label="前注" value={
                  room.rules.useAnte
                    ? `已启用 · ${formatChips(room.rules.anteAmount)}`
                    : '未启用'
                } />
                <RuleRow label="盲注递增" value={
                  room.rules.blindIncrease
                    ? `每 ${room.rules.blindIncreaseInterval} 分钟 × ${room.rules.blindIncreaseMultiplier}`
                    : '未启用'
                } />
                <RuleRow label="最大玩家数" value={`${room.rules.maxPlayers} 人`} />
                <RuleRow label="重新买入" value={
                  room.rules.allowRebuy
                    ? `允许 · ${formatChips(room.rules.rebuyChips)}`
                    : '不允许'
                } />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 玩家列表 */}
        <div className="mt-2 mb-1 px-4">
          <div className="flex items-center gap-2 text-foreground-muted text-xs mb-2">
            <Users className="w-4 h-4" />
            <span>玩家列表 ({players.length}人)</span>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {sortedPlayers.map((p, idx) => (
              <div
                key={p.id}
                className={[
                  'flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)]',
                  p.id === myPlayer?.id ? 'bg-primary/5' : 'bg-white/3',
                ].join(' ')}
              >
                <span className="text-xs text-foreground-dim w-4">
                  {idx + 1}.
                </span>
                <span className="text-base">{p.avatar}</span>
                <span className="text-sm flex-1 truncate">
                  {p.name}
                  {p.is_host && (
                    <span className="ml-1 text-[10px] text-accent">👑</span>
                  )}
                </span>
                <span className="font-display text-xs text-accent">
                  {formatChips(p.chips)}
                </span>
                {!p.is_online && (
                  <span className="text-[9px] text-foreground-dim">离线</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="border-t border-white/8 my-2" />

        {/* 重新买入 */}
        {room?.rules.allowRebuy && (
          <MenuItem
            icon={<RefreshCw className="w-5 h-5 text-accent" />}
            label="重新买入"
            subtitle={`+${formatChips(room.rules.rebuyChips)} 筹码`}
            onClick={() => setRebuyConfirmOpen(true)}
          />
        )}

        {/* 音效开关 */}
        <MenuItem
          icon={soundEnabled
            ? <Volume2 className="w-5 h-5 text-foreground-muted" />
            : <VolumeX className="w-5 h-5 text-foreground-dim" />
          }
          label={soundEnabled ? '音效已开启' : '音效已关闭'}
          onClick={toggleSound}
        />

        {/* 震动开关 */}
        <MenuItem
          icon={<Smartphone className="w-5 h-5 text-foreground-muted" />}
          label={vibrationEnabled ? '震动已开启' : '震动已关闭'}
          onClick={toggleVibration}
        />

        {/* 分隔线 */}
        <div className="border-t border-white/8 my-2" />

        {/* 离开房间 */}
        <MenuItem
          icon={<LogOut className="w-5 h-5 text-danger" />}
          label="离开房间"
          danger
          onClick={() => {
            onLeaveRoom()
            onClose()
          }}
        />

        {/* 结束游戏（仅房主） */}
        {isHost && (
          <MenuItem
            icon={<XCircle className="w-5 h-5 text-danger" />}
            label="结束游戏"
            subtitle="将结算所有玩家筹码"
            danger
            onClick={() => {
              onEndGame()
              onClose()
            }}
          />
        )}
      </div>

      {/* 重新买入确认弹窗 */}
      <Modal
        open={rebuyConfirmOpen}
        onClose={() => setRebuyConfirmOpen(false)}
        title="确认重新买入"
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
            <RefreshCw className="w-7 h-7 text-accent" />
          </div>
          <p className="text-sm text-foreground-muted text-center">
            你将获得 <span className="text-accent font-display font-bold">{formatChips(room?.rules.rebuyChips ?? 0)}</span> 筹码
          </p>
          <div className="flex gap-3 w-full mt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setRebuyConfirmOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="accent"
              fullWidth
              onClick={() => {
                onRebuy?.()
                setRebuyConfirmOpen(false)
                onClose()
                toast.success('重新买入成功！')
              }}
            >
              确认买入
            </Button>
          </div>
        </div>
      </Modal>
    </BottomSheet>
  )
}

/** 规则详情单行 */
function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-foreground-dim">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  )
}
