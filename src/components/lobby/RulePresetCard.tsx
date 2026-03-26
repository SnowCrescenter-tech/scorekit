/**
 * 规则预设卡片组件
 * - glass 卡片背景
 * - 选中时霓虹绿边框发光
 * - 显示预设 icon + name + description
 * - 难度 Badge
 * - 关键数据标签（起始筹码、盲注）
 */

import { motion } from 'framer-motion';
import { Badge } from '@/components/common';
import { formatChips } from '@/utils/helpers';
import type { RulePreset } from '@/types';

interface RulePresetCardProps {
  /** 规则预设 */
  preset: RulePreset;
  /** 是否选中 */
  selected: boolean;
  /** 点击回调 */
  onClick: () => void;
}

/** 难度标签对应的 Badge 变体与文案 */
const difficultyMap: Record<
  RulePreset['difficulty'],
  { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
  beginner: { label: '入门', variant: 'success' },
  intermediate: { label: '进阶', variant: 'warning' },
  advanced: { label: '高阶', variant: 'danger' },
};

export default function RulePresetCard({
  preset,
  selected,
  onClick,
}: RulePresetCardProps) {
  const diff = difficultyMap[preset.difficulty];
  const { rules } = preset;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={[
        'relative flex flex-col items-start gap-2.5 w-full p-4 rounded-[var(--radius-lg)] text-left',
        'bg-surface/60 backdrop-blur-sm border-2 transition-all duration-300',
        'touch-feedback cursor-pointer',
        selected
          ? 'border-primary/70 shadow-[0_0_16px_var(--color-primary-glow)]'
          : 'border-white/8 hover:border-white/20',
      ].join(' ')}
    >
      {/* 顶部行：图标 + 标题 + 难度 */}
      <div className="flex items-center gap-3 w-full">
        <span className="text-3xl leading-none">{preset.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground font-display truncate">
            {preset.name}
          </h3>
        </div>
        <Badge variant={diff.variant}>{diff.label}</Badge>
      </div>

      {/* 描述 */}
      <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2">
        {preset.description}
      </p>

      {/* 关键数据标签行 */}
      <div className="flex flex-wrap gap-1.5">
        <DataTag label="筹码" value={formatChips(rules.startingChips)} />
        <DataTag label="盲注" value={`${formatChips(rules.smallBlind)}/${formatChips(rules.bigBlind)}`} />
        {rules.useAnte && <DataTag label="前注" value={formatChips(rules.anteAmount)} />}
        <DataTag label="人数" value={`≤${rules.maxPlayers}`} />
      </div>

      {/* 选中指示条 */}
      {selected && (
        <motion.div
          layoutId="preset-indicator"
          className="absolute -bottom-px left-4 right-4 h-0.5 bg-primary rounded-full shadow-[0_0_8px_var(--color-primary-glow)]"
        />
      )}
    </motion.button>
  );
}

/** 数据小标签 */
function DataTag({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-[11px] text-foreground-muted">
      <span className="text-foreground-dim">{label}</span>
      <span className="font-display text-foreground">{value}</span>
    </span>
  );
}
