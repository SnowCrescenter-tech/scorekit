/**
 * 游戏大厅主页 - 用户打开 app 看到的第一个页面
 *
 * 布局从上到下：
 * 1. 顶部 Logo 区域（霓虹发光标题 + 粒子背景）
 * 2. 快速操作按钮（创建房间 / 加入房间）
 * 3. 游戏类型选择网格
 * 4. 底部功能入口（历史记录 / 设置）
 * 5. 设置面板（BottomSheet）
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Plus, LogIn, History, Settings } from 'lucide-react';
import { Button } from '@/components/common';
import GameTypeCard from '@/components/lobby/GameTypeCard';
import SettingsPanel from '@/components/lobby/SettingsPanel';

/** 游戏列表数据 */
const GAME_LIST = [
  {
    icon: '🃏',
    name: '德州扑克',
    description: '筹码对决，智慧博弈',
    available: true,
    playerCount: 1284,
    route: '/create',
  },
  {
    icon: '🀄',
    name: '麻将计分',
    description: '国粹经典，精准记录',
    available: false,
    playerCount: undefined,
    route: '',
  },
  {
    icon: '🎰',
    name: '21点',
    description: '点数之争，运筹帷幄',
    available: false,
    playerCount: undefined,
    route: '',
  },
  {
    icon: '🎲',
    name: '骰子游戏',
    description: '骰出精彩，一掷千金',
    available: false,
    playerCount: undefined,
    route: '',
  },
  {
    icon: '🏆',
    name: '通用计分',
    description: '万能计分，百搭工具',
    available: false,
    playerCount: undefined,
    route: '',
  },
];

/** 容器入场动画配置 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

/** 子元素入场动画 - 自下往上渐入 */
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export default function LobbyPage() {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  /** 关闭设置面板 */
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  /** 伪在线人数 - 每次渲染保持稳定 */
  const gameList = useMemo(
    () =>
      GAME_LIST.map((g) => ({
        ...g,
        playerCount: g.playerCount
          ? g.playerCount + Math.floor(Math.random() * 200 - 100)
          : undefined,
      })),
    [],
  );

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* ===== 背景装饰粒子/光晕 ===== */}
      <BackgroundGlow />

      {/* ===== 主内容区域 ===== */}
      <motion.div
        className="relative z-10 max-w-lg mx-auto px-5 py-8 safe-area-top safe-area-bottom flex flex-col gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ---------- 1. Logo 区域 ---------- */}
        <motion.header variants={itemVariants} className="flex flex-col items-center gap-2 pt-4">
          <motion.h1
            className="font-display text-4xl sm:text-5xl font-bold text-primary neon-text-green tracking-wider"
            animate={{
              textShadow: [
                '0 0 10px rgba(0,255,136,0.3), 0 0 20px rgba(0,255,136,0.2)',
                '0 0 15px rgba(0,255,136,0.5), 0 0 40px rgba(0,255,136,0.3)',
                '0 0 10px rgba(0,255,136,0.3), 0 0 20px rgba(0,255,136,0.2)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            ScoreKit
          </motion.h1>
          <p className="text-foreground-muted text-sm tracking-widest">
            计分工具箱
          </p>
        </motion.header>

        {/* ---------- 2. 快速操作按钮 ---------- */}
        <motion.div variants={itemVariants} className="flex gap-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={<Plus className="w-5 h-5" />}
            onClick={() => navigate('/create')}
          >
            创建房间
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            icon={<LogIn className="w-5 h-5" />}
            onClick={() => navigate('/join')}
          >
            加入房间
          </Button>
        </motion.div>

        {/* ---------- 3. 游戏类型选择 ---------- */}
        <motion.section variants={itemVariants} className="flex flex-col gap-4">
          <h2 className="font-display text-lg text-foreground tracking-wide">
            选择游戏
          </h2>

          {/* 游戏卡片网格 - 2 列 */}
          <div className="grid grid-cols-2 gap-3">
            {gameList.map((game, idx) => (
              <GameTypeCard
                key={game.name}
                icon={game.icon}
                name={game.name}
                description={game.description}
                available={game.available}
                playerCount={game.playerCount}
                index={idx}
                onClick={() => {
                  if (game.route) navigate(game.route);
                }}
              />
            ))}
          </div>
        </motion.section>

        {/* ---------- 4. 底部功能入口 ---------- */}
        <motion.div variants={itemVariants} className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            size="md"
            fullWidth
            icon={<History className="w-5 h-5" />}
            onClick={() => navigate('/history')}
          >
            历史记录
          </Button>
          <Button
            variant="ghost"
            size="md"
            fullWidth
            icon={<Settings className="w-5 h-5" />}
            onClick={() => setSettingsOpen(true)}
          >
            设置
          </Button>
        </motion.div>
      </motion.div>

      {/* ---------- 5. 设置面板 ---------- */}
      <SettingsPanel open={settingsOpen} onClose={closeSettings} />
    </div>
  );
}


// ====================================================================
//  背景装饰组件 - 多层发光光晕 + 浮动粒子
// ====================================================================

function BackgroundGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* 中心主光晕 - 霓虹绿 */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          top: '-10%',
          left: '50%',
          x: '-50%',
          background: 'radial-gradient(circle, rgba(0,255,136,0.08) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* 右下角金色光晕 */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          bottom: '-15%',
          right: '-10%',
          background: 'radial-gradient(circle, rgba(255,215,0,0.05) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* 左下角蓝色光晕 */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full"
        style={{
          bottom: '10%',
          left: '-10%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* 浮动小粒子 */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute block rounded-full"
          style={{
            width: 2 + (i % 3) * 2,
            height: 2 + (i % 3) * 2,
            left: `${8 + (i * 7.5) % 84}%`,
            top: `${10 + (i * 13) % 75}%`,
            background:
              i % 3 === 0
                ? 'var(--color-primary)'
                : i % 3 === 1
                  ? 'var(--color-accent)'
                  : 'var(--color-info)',
            opacity: 0.25,
          }}
          animate={{
            y: [0, -20 - i * 3, 0],
            opacity: [0.15, 0.4, 0.15],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}
