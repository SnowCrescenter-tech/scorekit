# ScoreKit 编辑日志

> 全面 QA 审查 & 修复记录  
> 日期：2025-07

---

## 项目概览

| 项 | 值 |
|---|---|
| 项目名称 | ScoreKit — 德州扑克记分工具 |
| 技术栈 | Vite 7 + React 19 + TypeScript 6 + Tailwind CSS 4 + Framer Motion 12 |
| 后端 | Supabase（实时数据库） |
| 状态管理 | Zustand 5（gameStore / settingsStore） |
| 路由 | react-router-dom 7 |
| 图标 | Lucide React |
| PWA | vite-plugin-pwa |
| 路径别名 | `@/*` → `src/*` |

---

## 修复清单

### 1. `ServiceResult<T>` 类型缺失
- **文件**: `src/types/index.ts`
- **问题**: `roomService.ts` 和 `roundService.ts` 均从 `@/types` 导入 `ServiceResult`，但该类型未定义
- **修复**: 在 `types/index.ts` 末尾添加 `ServiceResult<T>` 接口

```ts
export interface ServiceResult<T> {
  data: T | null
  error: string | null
}
```

### 2. import 路径不一致（services）
- **文件**: `src/services/roomService.ts`, `src/services/roundService.ts`
- **问题**: 使用相对路径 `'../types'` / `'./supabase'`，项目其他文件统一使用 `@/` 别名
- **修复**: 
  - `'../types'` → `'@/types'`
  - `'./supabase'` → `'@/services/supabase'`

### 3. `useGameActions.ts` — `showToast` 替换为全局 `toast`
- **文件**: `src/hooks/useGameActions.ts`
- **问题**: 内部定义了局部函数 `showToast(type, msg)`，而项目全局 toast 系统是 `toast.success/error/info/warning` (来自 `@/components/common/Toast`)
- **修复**: 
  - 删除 `showToast` 函数定义 + 无用的 `generateId` 导入
  - 添加 `import { toast } from '@/components/common/Toast'`
  - 所有 `showToast('error', msg)` → `toast.error(msg)` 等

### 4. `BettingPanel.tsx` — 音效/震动绕过用户设置
- **文件**: `src/components/poker/BettingPanel.tsx`
- **问题**: `useEffect` 中直接调用 `playSound('bell')` / `vibrate('double')`，未检查 `soundEnabled` / `vibrationEnabled`
- **修复**: 
  - 添加 `useSettingsStore` 导入
  - 用 `if (soundEnabled)` / `if (vibrationEnabled)` 包裹调用
  - 同样修复 `handleQuickSelect` 回调

### 5. `ActionButtons.tsx` — 音效/震动绕过设置 + 定时器泄漏
- **文件**: `src/components/poker/ActionButtons.tsx`
- **问题**:
  1. 所有回调直接调用 `playSound()`/`vibrate()`，不检查设置
  2. `foldTimer` 存在 `useState` 中，组件卸载时无清理
- **修复**: 
  - 添加 `useEffect`、`useSettingsStore` 导入
  - 创建 `sound()` 和 `vib()` 包装函数（同 `useGameActions` 模式）
  - 所有 `playSound(X)` → `sound(X)`，`vibrate(X)` → `vib(X)`
  - 添加 `useEffect` 清理 `foldTimer`
  - 补全所有 `useCallback` 依赖数组

### 6. `PlayerCircle.tsx` — render 内使用 `getState()` 非响应式
- **文件**: `src/components/poker/PlayerCircle.tsx`
- **问题**: JSX 中 `useGameStore.getState().currentRoom?.rules.*` 直接读取 store 快照，规则变化时组件不会重渲染
- **修复**: 
  - 添加选择器 `const roomRules = useGameStore((s) => s.currentRoom?.rules)`
  - JSX 改为 `roomRules?.smallBlind ?? 50` 等

### 7. `HistoryPage.tsx` — 未使用的导入
- **文件**: `src/pages/HistoryPage.tsx`
- **问题**: `formatChips` 已导入但未使用（界面用 `<ChipDisplay>` 组件显示筹码）
- **修复**: 从 import 中移除 `formatChips`

### 8. `GameRoomPage.tsx` — `react-router-dom` 导入路径
- **文件**: `src/pages/GameRoomPage.tsx`
- **问题**: `import { useParams, useNavigate } from 'react-router-dom'`，而 react-router v7 中这些 hook 应从 `'react-router'` 导入（项目其他页面均使用 `'react-router'`）
- **修复**: `'react-router-dom'` → `'react-router'`

---

## 审查但无需修改的文件

| 文件 | 备注 |
|---|---|
| `stores/gameStore.ts` | 结构良好，选择器模式正确 |
| `stores/settingsStore.ts` | localStorage 持久化正常 |
| `hooks/useRealtimeRoom.ts` | 已正确使用 `toast`，重连逻辑完善 |
| `hooks/useRoomLoader.ts` | loadIdRef 竞态保护正确 |
| `hooks/usePresence.ts` | 卸载清理完备 |
| `hooks/useBlindTimer.ts` | 音效/震动已检查设置，interval 清理正常 |
| `services/historyService.ts` | 纯 localStorage 操作，类型自洽 |
| `services/supabase.ts` | 客户端初始化正常 |
| `utils/helpers.ts` | 工具函数无副作用 |
| `utils/sound.ts` / `vibration.ts` | API 封装正确 |
| `components/common/*` | 组件接口一致、无类型问题 |
| `components/lobby/*` | 表单组件正常 |
| `components/poker/QuickBetChips.tsx` | 无直接 playSound/vibrate |
| `components/poker/ChipAdjuster.tsx` | 无直接 playSound/vibrate |
| `App.tsx` | 路由配置正确 |
| `main.tsx` | StrictMode 包裹正常 |

---

## 编译验证

```
npx tsc --noEmit  →  0 errors
```

---

## 2026-03-26 第二轮：全面优化与集成

### 编译/配置修复
- 修复 tsconfig.json 的 ignoreDeprecations 配置（TS6 需要 "6.0"）
- 移除 types/index.ts 重复的 ServiceResult 定义
- supabase.ts 改为延迟警告模式，不再模块加载时 throw（支持 Mock 模式运行）

### GameRoomPage 全面升级
- 集成 useRoomLoader（Supabase 数据加载）
- 集成 useRealtimeRoom（实时数据同步）
- 集成 usePresence（在线状态追踪）
- 集成 useBlindTimer（盲注递增计时）
- 底部占位按钮替换为完整 BettingPanel 组件
- 集成 GameControls（开始回合、补盲、推进阶段、结算）
- 集成 SettlementModal（回合结算弹窗）
- 实现双模式切换（在线模式 / Mock 离线模式）
- 完善加载错误/网络断连状态处理

### 逻辑修复
- PlayerCircle 座位计算改为数组索引，修复自己不在底部的 bug
- mockData.ts 座位号从 0 改为从 1 开始，与 roomService 一致
- autoPostBlinds 改为调用 startRound，修复盲注双倍扣除
- isMyTurn 增加房间/回合状态判断（线下计分器模式）

### 游戏结束流程
- useGameActions 新增 endGame 方法（保存历史到 localStorage）
- 新建 GameOverScreen 组件（金色结算画面 + 排名 + 导航）
- RoomMenu "结束游戏" 功能完整实现

### 移动端适配
- 5档响应式字体断点（320px ~ 768px+）
- 横屏/高分辨率屏幕特殊处理
- safe-area 安全区全面覆盖（BettingPanel 等固定底部元素）
- 全局 touch-action: manipulation 防双击缩放
- .no-select 增加 -webkit-touch-callout: none
- Google Fonts 异步加载 + 中文字体 fallback 链
- iOS 震动 API 不可用时设置面板显示禁用提示

### PWA 优化
- 改进 PWA 图标设计（扑克筹码风格 SVG）
- manifest icons 类型修正为 image/svg+xml
- apple-touch-icon 路径修正

### 构建优化
- Vite manualChunks 代码分割：react / framer-motion / supabase 独立打包
- 最大 chunk 从 653KB 降至 323KB (gzip 97KB)

### UI/UX 完善
- HistoryPage 空状态增加"快去开一局"引导按钮
- StepIndicator 支持点击跳转已完成步骤
- RoomMenu "查看规则" 展开详情面板
- RoomMenu "重新买入" 确认弹窗
- 新建 ConnectionBar 网络断连提示条组件
- Loading 组件增加 variant（fullscreen/inline）+ 文字提示
