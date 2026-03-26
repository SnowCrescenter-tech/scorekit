-- ============================================
-- ScoreKit - 数据库建表脚本
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- ============================================
-- 1. 启用必要的扩展
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. 建表
-- ============================================

-- 房间表
CREATE TABLE IF NOT EXISTS rooms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR(6) NOT NULL,                          -- 6位房间码
  name        VARCHAR(100) NOT NULL,                        -- 房间名称
  game_type   VARCHAR(20) NOT NULL DEFAULT 'texas_holdem',  -- 游戏类型
  rules       JSONB NOT NULL DEFAULT '{}',                  -- 规则配置（JSON）
  status      VARCHAR(20) NOT NULL DEFAULT 'waiting',       -- 房间状态: waiting / playing / finished
  host_id     VARCHAR(100) NOT NULL,                        -- 房主的 session_id
  current_round_id UUID,                                    -- 当前回合 ID（外键延迟设置）
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 玩家表
CREATE TABLE IF NOT EXISTS players (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name        VARCHAR(50) NOT NULL,                         -- 玩家名称
  avatar      VARCHAR(10) NOT NULL DEFAULT '😀',            -- emoji 头像
  chips       INTEGER NOT NULL DEFAULT 0,                   -- 当前筹码
  seat        INTEGER NOT NULL,                             -- 座位号（从1开始）
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,                -- 是否在游戏中（被移除则为 false）
  is_host     BOOLEAN NOT NULL DEFAULT FALSE,               -- 是否为房主
  is_online   BOOLEAN NOT NULL DEFAULT TRUE,                -- 是否在线
  session_id  VARCHAR(100) NOT NULL,                        -- 匿名用户会话 ID
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 回合表
CREATE TABLE IF NOT EXISTS rounds (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id           UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  round_number      INTEGER NOT NULL,                       -- 回合编号（从1开始递增）
  pot               INTEGER NOT NULL DEFAULT 0,             -- 底池总额
  status            VARCHAR(20) NOT NULL DEFAULT 'betting', -- 回合状态: betting / settled / cancelled
  phase             VARCHAR(20) NOT NULL DEFAULT 'preflop', -- 游戏阶段
  winner_ids        UUID[] NOT NULL DEFAULT '{}',           -- 赢家 ID 数组
  dealer_seat       INTEGER NOT NULL,                       -- 庄家座位号
  small_blind_seat  INTEGER NOT NULL,                       -- 小盲位座位号
  big_blind_seat    INTEGER NOT NULL,                       -- 大盲位座位号
  current_bet       INTEGER NOT NULL DEFAULT 0,             -- 当前最大下注
  min_raise         INTEGER NOT NULL DEFAULT 0,             -- 最小加注额
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at        TIMESTAMPTZ                             -- 结算时间
);

-- 下注记录表
CREATE TABLE IF NOT EXISTS bets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id    UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL DEFAULT 0,                   -- 下注金额
  bet_type    VARCHAR(20) NOT NULL,                         -- 下注类型
  phase       VARCHAR(20) NOT NULL,                         -- 下注时的游戏阶段
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 结算记录表
CREATE TABLE IF NOT EXISTS settlements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id    UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL DEFAULT 0,                   -- 结算金额（正=赢，负=输）
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 添加 rooms.current_round_id 的外键约束（延迟，因为 rounds 表后创建）
ALTER TABLE rooms
  ADD CONSTRAINT fk_rooms_current_round
  FOREIGN KEY (current_round_id)
  REFERENCES rounds(id)
  ON DELETE SET NULL;

-- ============================================
-- 3. 索引
-- ============================================

-- 房间码查询（高频操作：加入房间时通过房间码查找）
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);

-- 房间状态筛选
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- 玩家所属房间（高频操作：获取房间玩家列表）
CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);

-- 玩家会话 ID（用于断线重连识别）
CREATE INDEX IF NOT EXISTS idx_players_session_id ON players(session_id);

-- 回合所属房间
CREATE INDEX IF NOT EXISTS idx_rounds_room_id ON rounds(room_id);

-- 回合状态
CREATE INDEX IF NOT EXISTS idx_rounds_status ON rounds(status);

-- 下注所属回合
CREATE INDEX IF NOT EXISTS idx_bets_round_id ON bets(round_id);

-- 下注玩家
CREATE INDEX IF NOT EXISTS idx_bets_player_id ON bets(player_id);

-- 结算所属回合
CREATE INDEX IF NOT EXISTS idx_settlements_round_id ON settlements(round_id);

-- ============================================
-- 4. 自动更新 updated_at 触发器
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. 行级安全策略 (RLS)
-- ============================================

-- 启用 RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- 房间表策略：允许匿名用户读取和创建
-- 所有人可读取房间信息（通过房间码加入时需要查询）
CREATE POLICY "rooms_select_all" ON rooms
  FOR SELECT USING (true);

-- 所有人可创建房间
CREATE POLICY "rooms_insert_all" ON rooms
  FOR INSERT WITH CHECK (true);

-- 房主可更新自己的房间（通过 host_id = session_id 验证）
CREATE POLICY "rooms_update_host" ON rooms
  FOR UPDATE USING (true);

-- 房主可删除自己的房间
CREATE POLICY "rooms_delete_host" ON rooms
  FOR DELETE USING (true);

-- 玩家表策略
CREATE POLICY "players_select_all" ON players
  FOR SELECT USING (true);

CREATE POLICY "players_insert_all" ON players
  FOR INSERT WITH CHECK (true);

-- 玩家可更新自己的信息，房主可更新所有玩家
CREATE POLICY "players_update_all" ON players
  FOR UPDATE USING (true);

CREATE POLICY "players_delete_all" ON players
  FOR DELETE USING (true);

-- 回合表策略
CREATE POLICY "rounds_select_all" ON rounds
  FOR SELECT USING (true);

CREATE POLICY "rounds_insert_all" ON rounds
  FOR INSERT WITH CHECK (true);

CREATE POLICY "rounds_update_all" ON rounds
  FOR UPDATE USING (true);

-- 下注表策略
CREATE POLICY "bets_select_all" ON bets
  FOR SELECT USING (true);

CREATE POLICY "bets_insert_all" ON bets
  FOR INSERT WITH CHECK (true);

-- 结算表策略
CREATE POLICY "settlements_select_all" ON settlements
  FOR SELECT USING (true);

CREATE POLICY "settlements_insert_all" ON settlements
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 6. 实时监听配置 (Realtime Publication)
-- ============================================

-- 启用表的实时监听（Supabase Realtime）
-- 允许客户端订阅这些表的变更事件
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE bets;
ALTER PUBLICATION supabase_realtime ADD TABLE settlements;

-- ============================================
-- 完成！
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本
-- ============================================
