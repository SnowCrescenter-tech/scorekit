# ErrorSkill — 本次 QA 中遇到的问题与经验

> 记录在代码审查 & 修复过程中踩的坑，供后续参考。

---

## 1. PowerShell 文件编码陷阱（严重）

### 问题

使用 PowerShell 5.1 的 `Get-Content` + `-replace` + `Set-Content -Encoding UTF8` 管线处理含中文（UTF-8 无 BOM）的 `.ts` 文件时，**所有中文字符被破坏为乱码（mojibake）**。

```powershell
# ❌ 危险操作 — 会破坏非 ASCII 字符
(Get-Content file.ts) -replace 'pattern', 'replacement' |
  Set-Content file.ts -Encoding UTF8
```

### 原因

- PowerShell 5.1 的 `Get-Content` 默认使用系统 ANSI 编码（Windows 中文系统下为 GBK/GB2312）读取文件
- UTF-8 编码的多字节中文被按 GBK 逐字节解读，产生乱码
- `Set-Content -Encoding UTF8` 写入的是 UTF-8 with BOM，但此时内容已损坏

### 正确做法

1. **不要用 PowerShell 处理含多字节字符的源文件**——改用编辑器工具（`replace_string_in_file` / `create_file`）
2. 如必须使用 PowerShell，需显式指定读取编码：
   ```powershell
   [System.IO.File]::ReadAllText('file.ts', [System.Text.Encoding]::UTF8)
   ```
3. 或升级到 PowerShell 7+（默认 UTF-8）

### 后果

`useGameActions.ts` 被完全破坏，需删除后重新创建。

---

## 2. 正则替换参数偏移（中等）

### 问题

用正则将 `showToast('error', message)` 替换为 `toast.error(message)` 时，分两步替换导致参数位置错乱：

```powershell
# 第一步：替换函数名 + 类型参数
-replace "showToast\('error',", "toast.error("
# 结果: showToast('error', msg) → toast.error( msg)  ← 多了前导空格

# 更严重的情况：
# showToast('error', error ?? '...') → toast.error(, error ?? '...')  ← 多了逗号
```

### 正确做法

应一次匹配完整调用模式，使用捕获组提取参数：

```regex
showToast\('error',\s*(.+?)\)  →  toast.error($1)
```

或更好的方式：**使用结构化编辑工具**（`replace_string_in_file`），逐个替换确保正确性，而非批量正则。

---

## 3. `useGameStore.getState()` 在 React 渲染中的陷阱

### 问题

`PlayerCircle.tsx` 在 JSX 中直接使用 `useGameStore.getState().currentRoom?.rules.smallBlind`。

### 为什么有问题

- `getState()` 返回快照，不建立订阅关系
- 当 store 中的 `rules` 发生变化时，组件不会重渲染
- 在事件处理器或 `useEffect` 中使用 `getState()` 是安全的，但在渲染路径中必须使用选择器

### 正确做法

```tsx
// ✅ 通过选择器订阅，rules 变化时触发重渲染
const roomRules = useGameStore((s) => s.currentRoom?.rules)
// JSX 中使用
smallBlind={roomRules?.smallBlind ?? 50}
```

---

## 4. `react-router` v7 导入路径变更

### 问题

`GameRoomPage.tsx` 使用 `import { useParams, useNavigate } from 'react-router-dom'`，其余页面均使用 `'react-router'`。

### 背景

react-router v7 将大部分 hook/组件统一导出到 `'react-router'` 包。`'react-router-dom'` 仍然导出 DOM 特定组件（如 `BrowserRouter`、`Link`），但 hook 如 `useParams`、`useNavigate` 应从 `'react-router'` 导入，以保持一致性和前向兼容。

---

## 5. 音效/震动绕过用户设置

### 问题

`BettingPanel.tsx` 和 `ActionButtons.tsx` 直接调用 `playSound()` / `vibrate()`，不检查 `soundEnabled` / `vibrationEnabled`。

### 影响

- 用户关闭音效/震动后，这两个高频交互组件仍会发出声音和震动
- `useGameActions` 正确封装了 `sound()` / `vib()` 函数，但组件层面遗漏了

### 修复模式

对于频繁调用 `playSound`/`vibrate` 的组件，统一使用包装函数：

```tsx
const { soundEnabled, vibrationEnabled } = useSettingsStore()

const sound = useCallback(
  (type: Parameters<typeof playSound>[0]) => {
    if (soundEnabled) playSound(type)
  },
  [soundEnabled]
)
```

---

## 总结

| 问题 | 严重程度 | 根因 | 预防方法 |
|---|---|---|---|
| PowerShell 编码破坏 | 🔴 严重 | PS 5.1 默认 ANSI 编码 | 不用 PS 处理多字节文件 |
| 正则参数偏移 | 🟠 中等 | 分步替换未考虑完整模式 | 使用结构化编辑工具 |
| getState() 渲染中 | 🟡 低 | 误用 Zustand API | 渲染路径始终用选择器 |
| react-router 导入 | 🟢 风格 | v7 导入路径变更 | 统一从 'react-router' 导入 |
| 绕过用户设置 | 🟠 中等 | 组件层遗漏检查 | 统一使用 sound/vib 包装 |

---

## 第二轮优化遇到的问题

### 1. TypeScript 6 ignoreDeprecations 值
- 问题：TS6 中 baseUrl 被弃用，需要 ignoreDeprecations 但值应该是 "6.0"（不是 "5.0"）
- 解决：添加 `"ignoreDeprecations": "6.0"` 到 tsconfig.json

### 2. Supabase 模块加载时 throw 导致 Mock 模式崩溃
- 问题：supabase.ts 在模块顶层检查环境变量，缺失直接 throw，导致整个应用无法启动
- 解决：改为 console.warn + 占位 URL fallback，让应用即使没有 .env 也能以 Mock 模式运行

### 3. Framer Motion 类型不兼容 transition.type
- 问题：`transition: { type: 'spring' }` 的 type 为 string，不满足 Framer Motion 严格 Variants 类型
- 解决：添加 `as const` 断言 → `type: 'spring' as const`

### 4. PlayerCircle 座位索引 vs 座位号混淆
- 问题：函数接收的是玩家座位号（如 1-5），但内部用数组索引（0-4）做计算
- 解决：改为传入数组索引而非座位号

### 5. autoPostBlinds 与 startNewRound 重复扣除盲注
- 问题：服务端 startNewRound 已扣除盲注，客户端 autoPostBlinds 再次扣除
- 解决：autoPostBlinds 改为直接调用 startRound

### 6. Vite 构建 chunk 过大警告
- 问题：单个 JS 文件 653KB，PWA 首次加载较慢
- 解决：配置 manualChunks 将 react/motion/supabase 分别打包，最大 chunk 降至 323KB
