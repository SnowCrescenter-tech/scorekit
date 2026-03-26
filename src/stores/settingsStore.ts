// ===== 设置状态管理（持久化到 localStorage） =====

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** 设置状态接口 */
interface SettingsState {
  /** 音效开关 */
  soundEnabled: boolean
  /** 震动开关 */
  vibrationEnabled: boolean
  /** 音量 0-1 */
  volume: number
  /** 玩家昵称 */
  nickname: string
  /** 头像 (emoji) */
  avatar: string

  // ===== Actions =====

  /** 切换音效开关 */
  toggleSound: () => void
  /** 切换震动开关 */
  toggleVibration: () => void
  /** 设置音量 */
  setVolume: (v: number) => void
  /** 设置昵称 */
  setNickname: (name: string) => void
  /** 设置头像 */
  setAvatar: (avatar: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      vibrationEnabled: true,
      volume: 0.7,
      nickname: '',
      avatar: '😎',

      toggleSound: () =>
        set((state) => ({ soundEnabled: !state.soundEnabled })),

      toggleVibration: () =>
        set((state) => ({ vibrationEnabled: !state.vibrationEnabled })),

      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),

      setNickname: (name) => set({ nickname: name.trim() }),

      setAvatar: (avatar) => set({ avatar }),
    }),
    {
      name: 'scorekit-settings', // localStorage key
    }
  )
)
