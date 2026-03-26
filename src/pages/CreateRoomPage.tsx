/**
 * 创建房间页面
 * 三步式流程：选择预设 → 自定义规则 → 个人设置 + 确认
 * 步骤切换带有左右滑动动画
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

import { PageHeader, Button, Input, Slider, Select, Badge } from '@/components/common';
import type { SelectOption } from '@/components/common';
import StepIndicator from '@/components/lobby/StepIndicator';
import RulePresetCard from '@/components/lobby/RulePresetCard';

import { useGameActions } from '@/hooks/useGameActions';
import { useSettingsStore } from '@/stores/settingsStore';
import { useGameStore } from '@/stores/gameStore';
import { RULE_PRESETS } from '@/types/presets';
import { AVATAR_EMOJIS, formatChips } from '@/utils/helpers';
import type { RulesConfig, RulePreset } from '@/types';

/** 步骤标签 */
const STEP_LABELS = ['选择预设', '自定义规则', '确认创建'];

/** 最大玩家数选择选项 */
const MAX_PLAYER_OPTIONS: SelectOption[] = Array.from({ length: 8 }, (_, i) => ({
  label: `${i + 2} 人`,
  value: String(i + 2),
}));

/** 步骤切换动画方向变体 */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { createRoom } = useGameActions();
  const { isLoading } = useGameStore();
  const {
    nickname: savedNickname,
    avatar: savedAvatar,
    setNickname: saveNickname,
    setAvatar: saveAvatar,
  } = useSettingsStore();

  // ====== 步骤状态 ======
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);

  // ====== Step 1：选择预设 ======
  const [selectedPresetId, setSelectedPresetId] = useState<string>('casual');

  // ====== Step 2：自定义规则 ======
  const selectedPreset = useMemo(
    () => RULE_PRESETS.find((p) => p.id === selectedPresetId) ?? RULE_PRESETS[1],
    [selectedPresetId]
  );
  const [roomName, setRoomName] = useState('');
  const [rules, setRules] = useState<RulesConfig>(() => ({ ...selectedPreset.rules }));

  // 当选择预设变化时重置规则
  const handleSelectPreset = useCallback(
    (preset: RulePreset) => {
      setSelectedPresetId(preset.id);
      setRules({ ...preset.rules });
    },
    []
  );

  /** 更新单个规则字段 */
  const updateRule = useCallback(
    <K extends keyof RulesConfig>(key: K, value: RulesConfig[K]) => {
      setRules((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ====== Step 3：个人设置 ======
  const [nickname, setNickname] = useState(savedNickname || '');
  const [avatar, setAvatar] = useState(savedAvatar || '😎');

  // ====== 表单验证 ======
  const step2Errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (rules.startingChips <= 0) errs.startingChips = '初始筹码必须大于 0';
    if (rules.smallBlind <= 0) errs.smallBlind = '小盲注必须大于 0';
    if (rules.bigBlind <= 0) errs.bigBlind = '大盲注必须大于 0';
    if (rules.bigBlind < rules.smallBlind) errs.bigBlind = '大盲注不能小于小盲注';
    if (rules.startingChips < rules.bigBlind * 10)
      errs.startingChips = '初始筹码至少为大盲注的 10 倍';
    if (rules.useAnte && rules.anteAmount <= 0) errs.anteAmount = '前注金额必须大于 0';
    if (rules.blindIncrease && rules.blindIncreaseInterval <= 0)
      errs.blindIncreaseInterval = '递增间隔必须大于 0';
    if (rules.allowRebuy && rules.rebuyChips <= 0) errs.rebuyChips = '重新买入筹码必须大于 0';
    return errs;
  }, [rules]);

  const step3Errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!nickname.trim()) errs.nickname = '请输入昵称';
    if (nickname.trim().length > 12) errs.nickname = '昵称最多 12 个字符';
    return errs;
  }, [nickname]);

  const canProceedStep1 = !!selectedPresetId;
  const canProceedStep2 = Object.keys(step2Errors).length === 0;
  const canSubmit = Object.keys(step3Errors).length === 0 && nickname.trim().length > 0;

  // ====== 步骤导航 ======
  const goNext = useCallback(() => {
    if (currentStep < 3) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const goPrev = useCallback(() => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  // ====== 创建房间 ======
  const handleCreate = useCallback(async () => {
    if (!canSubmit) return;

    // 持久化昵称和头像
    saveNickname(nickname.trim());
    saveAvatar(avatar);

    const finalName = roomName.trim() || `${nickname.trim()} 的牌局`;
    const code = await createRoom(finalName, rules, nickname.trim(), avatar);

    if (code) {
      navigate(`/room/${code}`);
    }
  }, [canSubmit, saveNickname, saveAvatar, nickname, avatar, roomName, rules, createRoom, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <PageHeader
        title="创建房间"
        showBack
        onBack={() => {
          if (currentStep > 1) {
            goPrev();
          } else {
            navigate(-1);
          }
        }}
      />

      {/* 内容区域 */}
      <div className="pt-16 pb-28 px-4 max-w-lg mx-auto">
        {/* 步骤指示器 */}
        <div className="py-4">
          <StepIndicator
            currentStep={currentStep}
            totalSteps={3}
            labels={STEP_LABELS}
            onStepClick={(step) => {
              if (step < currentStep) {
                setDirection(-1);
                setCurrentStep(step);
              }
            }}
          />
        </div>

        {/* 步骤内容 - 带滑动动画 */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {currentStep === 1 && (
              <StepSelectPreset
                presets={RULE_PRESETS}
                selectedId={selectedPresetId}
                onSelect={handleSelectPreset}
              />
            )}
            {currentStep === 2 && (
              <StepCustomizeRules
                roomName={roomName}
                onRoomNameChange={setRoomName}
                rules={rules}
                onUpdateRule={updateRule}
                errors={step2Errors}
              />
            )}
            {currentStep === 3 && (
              <StepConfirm
                nickname={nickname}
                onNicknameChange={setNickname}
                avatar={avatar}
                onAvatarChange={setAvatar}
                rules={rules}
                roomName={roomName || `${nickname.trim() || '玩家'} 的牌局`}
                presetName={selectedPreset.name}
                errors={step3Errors}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 底部固定按钮栏 */}
      <div className="fixed bottom-0 left-0 right-0 safe-area-bottom glass z-30">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          {currentStep > 1 && (
            <Button
              variant="secondary"
              icon={<ChevronLeft className="w-5 h-5" />}
              onClick={goPrev}
            >
              上一步
            </Button>
          )}

          <div className="flex-1" />

          {currentStep < 3 ? (
            <Button
              variant="primary"
              icon={<ChevronRight className="w-5 h-5" />}
              iconPosition="right"
              onClick={goNext}
              disabled={currentStep === 1 ? !canProceedStep1 : !canProceedStep2}
            >
              下一步
            </Button>
          ) : (
            <Button
              variant="accent"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={!canSubmit}
              icon={<Sparkles className="w-5 h-5" />}
              onClick={handleCreate}
            >
              创建房间
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ====================================================
// Step 1：选择规则预设
// ====================================================

function StepSelectPreset({
  presets,
  selectedId,
  onSelect,
}: {
  presets: RulePreset[];
  selectedId: string;
  onSelect: (preset: RulePreset) => void;
}) {
  return (
    <motion.div
      className="flex flex-col gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <p className="text-sm text-foreground-muted text-center mb-1">
        选择一个规则预设开始，你可以在下一步微调
      </p>
      <div className="grid grid-cols-1 gap-3">
        {presets.map((preset) => (
          <RulePresetCard
            key={preset.id}
            preset={preset}
            selected={selectedId === preset.id}
            onClick={() => onSelect(preset)}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ====================================================
// Step 2：自定义规则
// ====================================================

function StepCustomizeRules({
  roomName,
  onRoomNameChange,
  rules,
  onUpdateRule,
  errors,
}: {
  roomName: string;
  onRoomNameChange: (v: string) => void;
  rules: RulesConfig;
  onUpdateRule: <K extends keyof RulesConfig>(key: K, value: RulesConfig[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* 房间名称 */}
      <Input
        label="房间名称（选填）"
        placeholder="留空则使用默认名称"
        value={roomName}
        onChange={(e) => onRoomNameChange(e.target.value)}
        maxLength={20}
      />

      {/* 分割线 */}
      <div className="h-px bg-white/10" />

      {/* 初始筹码 */}
      <Slider
        label="初始筹码"
        value={rules.startingChips}
        onChange={(v) => onUpdateRule('startingChips', v)}
        min={100}
        max={50000}
        step={100}
        formatValue={formatChips}
      />
      {errors.startingChips && (
        <p className="text-xs text-danger -mt-3">{errors.startingChips}</p>
      )}

      {/* 盲注 */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="小盲注"
          type="number"
          inputMode="numeric"
          value={String(rules.smallBlind)}
          onChange={(e) => {
            const v = Number(e.target.value) || 0;
            onUpdateRule('smallBlind', v);
            // 自动同步大盲注
            if (rules.bigBlind === rules.smallBlind * 2 || rules.bigBlind < v) {
              onUpdateRule('bigBlind', v * 2);
            }
          }}
          error={errors.smallBlind}
        />
        <Input
          label="大盲注"
          type="number"
          inputMode="numeric"
          value={String(rules.bigBlind)}
          onChange={(e) => onUpdateRule('bigBlind', Number(e.target.value) || 0)}
          error={errors.bigBlind}
        />
      </div>

      {/* 最大玩家数 */}
      <Select
        label="最大玩家数"
        options={MAX_PLAYER_OPTIONS}
        value={String(rules.maxPlayers)}
        onChange={(v) => onUpdateRule('maxPlayers', Number(v))}
      />

      {/* 前注开关 */}
      <ToggleRow
        label="前注（Ante）"
        checked={rules.useAnte}
        onChange={(v) => {
          onUpdateRule('useAnte', v);
          if (!v) onUpdateRule('anteAmount', 0);
        }}
      />
      {rules.useAnte && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
          <Input
            label="前注金额"
            type="number"
            inputMode="numeric"
            value={String(rules.anteAmount)}
            onChange={(e) => onUpdateRule('anteAmount', Number(e.target.value) || 0)}
            error={errors.anteAmount}
          />
        </motion.div>
      )}

      {/* 盲注递增开关 */}
      <ToggleRow
        label="盲注递增"
        checked={rules.blindIncrease}
        onChange={(v) => onUpdateRule('blindIncrease', v)}
      />
      {rules.blindIncrease && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-col gap-3">
          <Input
            label="递增间隔（分钟）"
            type="number"
            inputMode="numeric"
            value={String(rules.blindIncreaseInterval)}
            onChange={(e) => onUpdateRule('blindIncreaseInterval', Number(e.target.value) || 0)}
            error={errors.blindIncreaseInterval}
          />
        </motion.div>
      )}

      {/* 重新买入开关 */}
      <ToggleRow
        label="允许重新买入"
        checked={rules.allowRebuy}
        onChange={(v) => onUpdateRule('allowRebuy', v)}
      />
      {rules.allowRebuy && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
          <Input
            label="重新买入筹码数"
            type="number"
            inputMode="numeric"
            value={String(rules.rebuyChips)}
            onChange={(e) => onUpdateRule('rebuyChips', Number(e.target.value) || 0)}
            error={errors.rebuyChips}
          />
        </motion.div>
      )}
    </div>
  );
}

// ====================================================
// Step 3：个人设置 + 确认
// ====================================================

function StepConfirm({
  nickname,
  onNicknameChange,
  avatar,
  onAvatarChange,
  rules,
  roomName,
  presetName,
  errors,
}: {
  nickname: string;
  onNicknameChange: (v: string) => void;
  avatar: string;
  onAvatarChange: (v: string) => void;
  rules: RulesConfig;
  roomName: string;
  presetName: string;
  errors: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* 昵称 */}
      <Input
        label="你的昵称"
        placeholder="输入你的昵称"
        value={nickname}
        onChange={(e) => onNicknameChange(e.target.value)}
        maxLength={12}
        error={errors.nickname}
      />

      {/* 头像选择 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-foreground-muted">选择头像</span>
        <div className="grid grid-cols-8 gap-2">
          {AVATAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onAvatarChange(emoji)}
              className={[
                'flex items-center justify-center w-10 h-10 text-xl rounded-full transition-all duration-200',
                avatar === emoji
                  ? 'bg-primary/20 ring-2 ring-primary shadow-[0_0_8px_var(--color-primary-glow)]'
                  : 'bg-surface hover:bg-surface-lighter',
              ].join(' ')}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* 房间规则摘要 */}
      <div className="flex flex-col gap-3 p-4 rounded-[var(--radius-lg)] bg-surface/60 backdrop-blur-sm border border-white/10">
        <h3 className="text-sm font-semibold text-accent font-display">房间摘要</h3>
        <SummaryRow label="房间名" value={roomName} />
        <SummaryRow label="规则预设" value={presetName} />
        <SummaryRow label="初始筹码" value={formatChips(rules.startingChips)} highlight />
        <SummaryRow label="盲注" value={`${formatChips(rules.smallBlind)} / ${formatChips(rules.bigBlind)}`} highlight />
        <SummaryRow label="最大玩家" value={`${rules.maxPlayers} 人`} />
        {rules.useAnte && <SummaryRow label="前注" value={formatChips(rules.anteAmount)} />}
        {rules.blindIncrease && <SummaryRow label="盲注递增" value={`每 ${rules.blindIncreaseInterval} 分钟`} />}
        {rules.allowRebuy && <SummaryRow label="重新买入" value={formatChips(rules.rebuyChips)} />}
      </div>
    </div>
  );
}

// ====================================================
// 辅助组件
// ====================================================

/** 摘要单行 */
function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground-muted">{label}</span>
      <span className={highlight ? 'font-display text-accent' : 'text-foreground'}>
        {value}
      </span>
    </div>
  );
}

/** 开关切换行 */
function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground-muted">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer',
          checked
            ? 'bg-primary/30 border border-primary/50'
            : 'bg-surface-lighter border border-white/10',
        ].join(' ')}
      >
        <motion.div
          className={[
            'absolute top-0.5 w-5 h-5 rounded-full shadow-md',
            checked ? 'bg-primary' : 'bg-foreground-dim',
          ].join(' ')}
          animate={{ left: checked ? '1.25rem' : '0.125rem' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
