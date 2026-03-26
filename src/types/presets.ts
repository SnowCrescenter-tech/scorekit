// ============================================
// ScoreKit - 规则预设数据
// ============================================

import type { RulePreset } from './index'

/** 所有可用的规则预设 */
export const RULE_PRESETS: RulePreset[] = [
  {
    id: 'beginner',
    name: '新手入门',
    description: '低盲注、多筹码、无前注，适合初次接触德州扑克的玩家',
    icon: '🌱',
    difficulty: 'beginner',
    rules: {
      startingChips: 10000,
      smallBlind: 25,
      bigBlind: 50,
      anteAmount: 0,
      useAnte: false,
      blindIncrease: false,
      blindIncreaseInterval: 0,
      blindIncreaseMultiplier: 1,
      maxPlayers: 9,
      minPlayers: 2,
      allowRebuy: true,
      rebuyChips: 10000,
      gameVariant: 'no_limit',
      timeBankSeconds: 60,
    },
  },
  {
    id: 'casual',
    name: '休闲娱乐',
    description: '中等盲注、适中筹码，朋友聚会轻松玩一局',
    icon: '🎉',
    difficulty: 'beginner',
    rules: {
      startingChips: 5000,
      smallBlind: 50,
      bigBlind: 100,
      anteAmount: 0,
      useAnte: false,
      blindIncrease: false,
      blindIncreaseInterval: 0,
      blindIncreaseMultiplier: 1,
      maxPlayers: 8,
      minPlayers: 2,
      allowRebuy: true,
      rebuyChips: 5000,
      gameVariant: 'no_limit',
      timeBankSeconds: 45,
    },
  },
  {
    id: 'tournament',
    name: '标准锦标赛',
    description: '标准锦标赛规则，盲注定时递增，考验耐心与策略',
    icon: '🏆',
    difficulty: 'intermediate',
    rules: {
      startingChips: 3000,
      smallBlind: 25,
      bigBlind: 50,
      anteAmount: 0,
      useAnte: false,
      blindIncrease: true,
      blindIncreaseInterval: 15,
      blindIncreaseMultiplier: 2,
      maxPlayers: 9,
      minPlayers: 3,
      allowRebuy: false,
      rebuyChips: 0,
      gameVariant: 'no_limit',
      timeBankSeconds: 30,
    },
  },
  {
    id: 'pro',
    name: '高手对决',
    description: '高盲注、少筹码、含前注，每一手都至关重要',
    icon: '🔥',
    difficulty: 'advanced',
    rules: {
      startingChips: 2000,
      smallBlind: 100,
      bigBlind: 200,
      anteAmount: 25,
      useAnte: true,
      blindIncrease: true,
      blindIncreaseInterval: 10,
      blindIncreaseMultiplier: 1.5,
      maxPlayers: 6,
      minPlayers: 2,
      allowRebuy: false,
      rebuyChips: 0,
      gameVariant: 'no_limit',
      timeBankSeconds: 20,
    },
  },
  {
    id: 'turbo',
    name: '短牌速战',
    description: '大盲注、极少筹码，快速决斗，适合时间有限的玩家',
    icon: '⚡',
    difficulty: 'advanced',
    rules: {
      startingChips: 1000,
      smallBlind: 100,
      bigBlind: 200,
      anteAmount: 50,
      useAnte: true,
      blindIncrease: true,
      blindIncreaseInterval: 5,
      blindIncreaseMultiplier: 2,
      maxPlayers: 6,
      minPlayers: 2,
      allowRebuy: false,
      rebuyChips: 0,
      gameVariant: 'no_limit',
      timeBankSeconds: 15,
    },
  },
  {
    id: 'custom',
    name: '自定义模式',
    description: '自由配置所有规则参数，打造专属牌局',
    icon: '⚙️',
    difficulty: 'intermediate',
    rules: {
      startingChips: 5000,
      smallBlind: 50,
      bigBlind: 100,
      anteAmount: 0,
      useAnte: false,
      blindIncrease: false,
      blindIncreaseInterval: 15,
      blindIncreaseMultiplier: 2,
      maxPlayers: 9,
      minPlayers: 2,
      allowRebuy: true,
      rebuyChips: 5000,
      gameVariant: 'no_limit',
      timeBankSeconds: 30,
    },
  },
]

/**
 * 根据预设 ID 获取规则预设
 * @param presetId 预设 ID
 * @returns 匹配的规则预设，未找到则返回自定义模式
 */
export function getPresetById(presetId: string): RulePreset {
  return RULE_PRESETS.find((p) => p.id === presetId) ?? RULE_PRESETS[RULE_PRESETS.length - 1]
}

/**
 * 获取默认规则配置（休闲娱乐）
 */
export function getDefaultRules(): RulePreset {
  return getPresetById('casual')
}
