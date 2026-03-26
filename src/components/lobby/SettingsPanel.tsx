/**
 * 设置面板组件
 * - 使用 BottomSheet 包裹
 * - 个人信息：头像 + 昵称修改
 * - 头像网格选择（3x8 emoji 网格）
 * - 音效开关 + 音量滑块
 * - 震动开关
 */

import { motion } from 'framer-motion';
import { Volume2, VolumeX, Smartphone, Info } from 'lucide-react';
import { BottomSheet, Avatar, Input, Slider } from '@/components/common';
import { useSettingsStore } from '@/stores/settingsStore';
import { AVATAR_EMOJIS } from '@/utils/helpers';
import { canVibrate } from '@/utils/vibration';

interface SettingsPanelProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

/** 行级开关组件 */
function SettingsRow({
  label,
  icon,
  checked,
  onToggle,
}: {
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <span className="text-foreground-muted w-5 h-5">{icon}</span>
        <span className="text-sm text-foreground">{label}</span>
      </div>
      {/* 切换开关 */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={[
          'relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer',
          checked ? 'bg-primary/30 border border-primary/50' : 'bg-surface-lighter border border-white/10',
        ].join(' ')}
      >
        <motion.span
          className={[
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full',
            checked ? 'bg-primary shadow-[0_0_6px_var(--color-primary-glow)]' : 'bg-foreground-dim',
          ].join(' ')}
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const {
    nickname,
    avatar,
    soundEnabled,
    vibrationEnabled,
    volume,
    setNickname,
    setAvatar,
    toggleSound,
    toggleVibration,
    setVolume,
  } = useSettingsStore();

  return (
    <BottomSheet open={open} onClose={onClose} title="设置" snapPoints={[0.85]}>
      <div className="flex flex-col gap-6">
        {/* ===== 个人信息区域 ===== */}
        <section className="flex flex-col items-center gap-3">
          <Avatar emoji={avatar} size="lg" glow />
          <span className="text-foreground-muted text-xs">点击下方 emoji 更换头像</span>
        </section>

        {/* 昵称修改 */}
        <Input
          label="昵称"
          placeholder="输入你的昵称"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={12}
        />

        {/* ===== 头像选择网格 ===== */}
        <section>
          <p className="text-sm text-foreground-muted mb-2">选择头像</p>
          <div className="grid grid-cols-8 gap-2">
            {AVATAR_EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                type="button"
                whileTap={{ scale: 0.85 }}
                onClick={() => setAvatar(emoji)}
                className={[
                  'w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center',
                  'text-xl cursor-pointer transition-all duration-200',
                  avatar === emoji
                    ? 'bg-primary/20 border-2 border-primary shadow-[0_0_8px_var(--color-primary-glow)]'
                    : 'bg-surface-light border border-white/8 hover:bg-surface-lighter',
                ].join(' ')}
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </section>

        {/* ===== 音效设置 ===== */}
        <section className="flex flex-col gap-1 border-t border-white/8 pt-4">
          <SettingsRow
            label="游戏音效"
            icon={soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            checked={soundEnabled}
            onToggle={toggleSound}
          />

          {/* 音量滑块 - 仅音效开启时显示 */}
          {soundEnabled && (
            <Slider
              value={Math.round(volume * 100)}
              onChange={(v) => setVolume(v / 100)}
              min={0}
              max={100}
              step={5}
              label="音量"
              formatValue={(v) => `${v}%`}
            />
          )}
        </section>

        {/* ===== 震动设置 ===== */}
        <section className="border-t border-white/8 pt-4">
          {canVibrate() ? (
            <SettingsRow
              label="触感反馈"
              icon={<Smartphone className="w-5 h-5" />}
              checked={vibrationEnabled}
              onToggle={toggleVibration}
            />
          ) : (
            <div className="flex items-center justify-between py-3 opacity-50">
              <div className="flex items-center gap-3">
                <span className="text-foreground-muted w-5 h-5">
                  <Smartphone className="w-5 h-5" />
                </span>
                <span className="text-sm text-foreground">触感反馈</span>
                <span className="text-xs text-foreground-dim">(此设备不支持)</span>
              </div>
            </div>
          )}
        </section>

        {/* ===== 关于 ===== */}
        <section className="border-t border-white/8 pt-4 pb-2">
          <button
            type="button"
            className="flex items-center gap-3 py-3 w-full text-left cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Info className="w-5 h-5 text-foreground-muted" />
            <span className="text-sm text-foreground">关于 ScoreKit</span>
            <span className="ml-auto text-xs text-foreground-dim">v1.0.0</span>
          </button>
        </section>
      </div>
    </BottomSheet>
  );
}
