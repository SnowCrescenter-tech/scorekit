/**
 * 加入房间页面
 * - 房间码输入（6 位验证码风格）
 * - 个人设置（昵称 + 头像）
 * - 加入房间按钮
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { LogIn, User } from 'lucide-react';

import { PageHeader, Button, Input } from '@/components/common';
import { toast } from '@/components/common';
import RoomCodeInput from '@/components/lobby/RoomCodeInput';

import { useGameActions } from '@/hooks/useGameActions';
import { useSettingsStore } from '@/stores/settingsStore';
import { useGameStore } from '@/stores/gameStore';
import { AVATAR_EMOJIS } from '@/utils/helpers';

export default function JoinRoomPage() {
  const navigate = useNavigate();
  const { joinRoom } = useGameActions();
  const { isLoading } = useGameStore();
  const {
    nickname: savedNickname,
    avatar: savedAvatar,
    setNickname: saveNickname,
    setAvatar: saveAvatar,
  } = useSettingsStore();

  // ====== 状态 ======
  const [roomCode, setRoomCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [nickname, setNickname] = useState(savedNickname || '');
  const [avatar, setAvatar] = useState(savedAvatar || '😎');
  const [nicknameError, setNicknameError] = useState('');

  // ====== 验证 ======
  const validate = useCallback(() => {
    let valid = true;

    if (roomCode.length !== 6) {
      setCodeError(true);
      valid = false;
    } else {
      setCodeError(false);
    }

    if (!nickname.trim()) {
      setNicknameError('请输入昵称');
      valid = false;
    } else if (nickname.trim().length > 12) {
      setNicknameError('昵称最多 12 个字符');
      valid = false;
    } else {
      setNicknameError('');
    }

    return valid;
  }, [roomCode, nickname]);

  // ====== 加入房间 ======
  const handleJoin = useCallback(async () => {
    if (!validate()) return;

    // 持久化昵称和头像
    saveNickname(nickname.trim());
    saveAvatar(avatar);

    const success = await joinRoom(roomCode, nickname.trim(), avatar);

    if (success) {
      navigate(`/room/${roomCode}`);
    } else {
      setCodeError(true);
      toast.error('加入失败，请检查房间码是否正确');
    }
  }, [validate, saveNickname, saveAvatar, nickname, avatar, joinRoom, roomCode, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <PageHeader title="加入房间" showBack onBack={() => navigate(-1)} />

      {/* 内容区域 */}
      <div className="pt-20 pb-28 px-4 max-w-lg mx-auto flex flex-col gap-8">
        {/* ====== 房间码输入区 ====== */}
        <motion.section
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-display text-foreground font-semibold">
            输入房间码
          </h2>
          <p className="text-sm text-foreground-muted text-center">
            输入 6 位房间码加入朋友的牌局
          </p>

          <div className="mt-2">
            <RoomCodeInput
              value={roomCode}
              onChange={(code) => {
                setRoomCode(code);
                if (codeError) setCodeError(false);
              }}
              error={codeError}
              length={6}
            />
          </div>

          {codeError && (
            <motion.p
              className="text-xs text-danger"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              请输入 6 位有效房间码
            </motion.p>
          )}
        </motion.section>

        {/* 分割线 */}
        <div className="h-px bg-white/10" />

        {/* ====== 个人设置区 ====== */}
        <motion.section
          className="flex flex-col gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-display text-foreground font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            个人设置
          </h2>

          {/* 昵称 */}
          <Input
            label="你的昵称"
            placeholder="输入你的昵称"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              if (nicknameError) setNicknameError('');
            }}
            maxLength={12}
            error={nicknameError}
          />

          {!nickname.trim() && (
            <p className="text-xs text-warning -mt-2">
              请先设置昵称才能加入房间
            </p>
          )}

          {/* 头像选择 */}
          <div className="flex flex-col gap-2">
            <span className="text-sm text-foreground-muted">选择头像</span>
            <div className="grid grid-cols-8 gap-2">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
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
        </motion.section>
      </div>

      {/* 底部固定按钮 */}
      <div className="fixed bottom-0 left-0 right-0 safe-area-bottom glass z-30">
        <div className="px-4 py-3 max-w-lg mx-auto">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={roomCode.length !== 6 || !nickname.trim()}
            icon={<LogIn className="w-5 h-5" />}
            onClick={handleJoin}
          >
            加入房间
          </Button>
        </div>
      </div>
    </div>
  );
}
