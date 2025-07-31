
-- Tạo bảng ranks - Thông tin về các hạng
CREATE TABLE IF NOT EXISTS public.ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  rank_name TEXT NOT NULL,
  rank_order INTEGER NOT NULL,
  elo_requirement INTEGER NOT NULL,
  rank_color TEXT DEFAULT 'text-slate-600',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tạo bảng player_rankings - Xếp hạng người chơi
CREATE TABLE IF NOT EXISTS public.player_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  current_rank_id UUID REFERENCES public.ranks(id),
  current_rank TEXT,
  elo_points INTEGER DEFAULT 1000,
  spa_points INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  last_promotion_date TIMESTAMP WITH TIME ZONE,
  promotion_eligible BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Tạo bảng daily_challenge_stats - Thống kê thách đấu hàng ngày
CREATE TABLE IF NOT EXISTS public.daily_challenge_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  challenge_count INTEGER DEFAULT 0,
  spa_points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_date)
);

-- Tạo bảng spa_transactions - Giao dịch điểm SPA
CREATE TABLE IF NOT EXISTS public.spa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source_type TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Tạo bảng spa_points_log - Nhật ký điểm SPA
CREATE TABLE IF NOT EXISTS public.spa_points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tạo bảng memberships - Thành viên CLB
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'active',
  UNIQUE(user_id, club_id)
);

-- Tạo bảng user_chat_sessions - Phiên chat của người dùng
CREATE TABLE IF NOT EXISTS public.user_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  chat_type TEXT NOT NULL DEFAULT 'support',
  status TEXT DEFAULT 'active',
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE
);

-- Tạo bảng chat_messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.user_chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Thêm dữ liệu ban đầu cho bảng ranks
INSERT INTO public.ranks (code, rank_name, rank_order, elo_requirement, rank_color, description)
VALUES 
  ('K', 'Hạng K', 1, 1000, 'text-slate-600', 'Hạng thấp nhất'),
  ('K+', 'Hạng K+', 2, 1100, 'text-slate-500', 'Hạng K cải tiến'),
  ('I', 'Hạng I', 3, 1200, 'text-amber-600', 'Hạng trung bình thấp'),
  ('I+', 'Hạng I+', 4, 1300, 'text-amber-500', 'Hạng I cải tiến'),
  ('H', 'Hạng H', 5, 1400, 'text-green-600', 'Hạng trung bình'),
  ('H+', 'Hạng H+', 6, 1500, 'text-green-500', 'Hạng H cải tiến'),
  ('G', 'Hạng G', 7, 1600, 'text-blue-600', 'Hạng khá'),
  ('G+', 'Hạng G+', 8, 1700, 'text-blue-500', 'Hạng G cải tiến'),
  ('F', 'Hạng F', 9, 1800, 'text-purple-600', 'Hạng cao'),
  ('F+', 'Hạng F+', 10, 1900, 'text-purple-500', 'Hạng F cải tiến'),
  ('E', 'Hạng E', 11, 2000, 'text-red-600', 'Hạng rất cao'),
  ('E+', 'Hạng E+', 12, 2100, 'text-red-500', 'Hạng cao nhất')
ON CONFLICT (code) DO UPDATE SET
  rank_name = EXCLUDED.rank_name,
  rank_order = EXCLUDED.rank_order,
  elo_requirement = EXCLUDED.elo_requirement,
  rank_color = EXCLUDED.rank_color,
  description = EXCLUDED.description,
  updated_at = now();

-- Tạo trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Áp dụng trigger cho các bảng
DO $$
DECLARE
  table_names text[] := array['ranks', 'player_rankings', 'daily_challenge_stats', 'memberships', 'user_chat_sessions'];
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY table_names LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_timestamp ON public.%I', table_name);
    EXECUTE format('CREATE TRIGGER update_timestamp BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_timestamp()', table_name);
  END LOOP;
END;
$$;

-- Tạo function để tính điểm SPA cho challenge
CREATE OR REPLACE FUNCTION public.complete_challenge_match(
  p_match_id UUID,
  p_winner_id UUID,
  p_loser_id UUID,
  p_wager_points INTEGER DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_winner_points INTEGER;
  v_loser_points INTEGER;
  v_daily_count INTEGER;
  v_multiplier NUMERIC;
  v_result JSONB;
BEGIN
  -- Kiểm tra số lượng challenge trong ngày của người chơi
  SELECT COALESCE(COUNT(*), 0) INTO v_daily_count
  FROM spa_points_log
  WHERE user_id = p_winner_id 
  AND category = 'challenge'
  AND created_at >= CURRENT_DATE
  AND created_at < (CURRENT_DATE + INTERVAL '1 day');

  -- Áp dụng hệ số giảm dần cho các challenge sau 2 kèo mỗi ngày
  IF v_daily_count >= 2 THEN
    v_multiplier := 0.3;
  ELSE
    v_multiplier := 1.0;
  END IF;

  -- Tính điểm SPA cơ bản
  v_winner_points := ROUND(p_wager_points * v_multiplier);
  v_loser_points := ROUND(-p_wager_points * 0.5 * v_multiplier);

  -- Lưu log SPA cho người thắng
  INSERT INTO spa_points_log (user_id, points, category, description, reference_id, reference_type)
  VALUES (p_winner_id, v_winner_points, 'challenge', 'Thắng thách đấu', p_match_id, 'challenge');

  -- Lưu log SPA cho người thua
  INSERT INTO spa_points_log (user_id, points, category, description, reference_id, reference_type)
  VALUES (p_loser_id, v_loser_points, 'challenge', 'Thua thách đấu', p_match_id, 'challenge');

  -- Cập nhật điểm SPA trong bảng player_rankings
  UPDATE player_rankings
  SET spa_points = spa_points + v_winner_points,
      total_matches = total_matches + 1,
      wins = wins + 1,
      win_streak = win_streak + 1,
      updated_at = NOW()
  WHERE user_id = p_winner_id;

  UPDATE player_rankings
  SET spa_points = GREATEST(0, spa_points + v_loser_points),
      total_matches = total_matches + 1,
      losses = losses + 1,
      win_streak = 0,
      updated_at = NOW()
  WHERE user_id = p_loser_id;

  -- Cập nhật challenge statistics
  INSERT INTO daily_challenge_stats (user_id, challenge_date, challenge_count, spa_points_earned)
  VALUES 
    (p_winner_id, CURRENT_DATE, 1, v_winner_points),
    (p_loser_id, CURRENT_DATE, 1, v_loser_points)
  ON CONFLICT (user_id, challenge_date) 
  DO UPDATE SET 
    challenge_count = daily_challenge_stats.challenge_count + 1,
    spa_points_earned = daily_challenge_stats.spa_points_earned + EXCLUDED.spa_points_earned,
    updated_at = NOW();

  -- Kết quả trả về
  v_result := jsonb_build_object(
    'winner_points', v_winner_points,
    'loser_points', v_loser_points,
    'daily_count', v_daily_count,
    'multiplier', v_multiplier
  );

  RETURN v_result;
END;
$$;

-- Tạo function để tính điểm ELO cho giải đấu (không phải challenge)
CREATE OR REPLACE FUNCTION public.process_tournament_match_elo(
  p_match_id UUID,
  p_winner_id UUID,
  p_loser_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_winner_elo INTEGER;
  v_loser_elo INTEGER;
  v_k_factor INTEGER := 32; -- K cố định cho giải đấu
  v_expected_win_prob NUMERIC;
  v_elo_change INTEGER;
  v_result JSONB;
BEGIN
  -- Lấy ELO hiện tại của cả 2 người chơi
  SELECT elo_points INTO v_winner_elo FROM player_rankings WHERE user_id = p_winner_id;
  SELECT elo_points INTO v_loser_elo FROM player_rankings WHERE user_id = p_loser_id;
  
  IF v_winner_elo IS NULL THEN v_winner_elo := 1000; END IF;
  IF v_loser_elo IS NULL THEN v_loser_elo := 1000; END IF;
  
  -- Tính xác suất kỳ vọng
  v_expected_win_prob := 1.0 / (1.0 + POWER(10, (v_loser_elo - v_winner_elo) / 400.0));
  
  -- Tính thay đổi ELO
  v_elo_change := ROUND(v_k_factor * (1 - v_expected_win_prob));
  
  -- Cập nhật ELO cho người thắng
  UPDATE player_rankings
  SET elo_points = elo_points + v_elo_change,
      updated_at = NOW()
  WHERE user_id = p_winner_id;
  
  -- Cập nhật ELO cho người thua
  UPDATE player_rankings
  SET elo_points = GREATEST(1000, elo_points - v_elo_change),
      updated_at = NOW()
  WHERE user_id = p_loser_id;
  
  -- Kết quả trả về
  v_result := jsonb_build_object(
    'winner_id', p_winner_id,
    'loser_id', p_loser_id,
    'winner_new_elo', v_winner_elo + v_elo_change,
    'loser_new_elo', GREATEST(1000, v_loser_elo - v_elo_change),
    'elo_change', v_elo_change
  );
  
  RETURN v_result;
END;
$$;

-- Tạo function để kiểm tra và thăng hạng tự động
CREATE OR REPLACE FUNCTION public.check_rank_promotion(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_rank RECORD;
  v_next_rank RECORD;
  v_current_elo INTEGER;
  v_result JSONB;
  v_promoted BOOLEAN := false;
BEGIN
  -- Lấy thông tin hiện tại
  SELECT pr.elo_points, pr.current_rank, r.id as rank_id, r.rank_order, r.elo_requirement
  INTO v_current_rank
  FROM player_rankings pr
  LEFT JOIN ranks r ON pr.current_rank = r.code
  WHERE pr.user_id = p_user_id;
  
  IF v_current_rank IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;
  
  v_current_elo := COALESCE(v_current_rank.elo_points, 1000);
  
  -- Tìm rank tiếp theo nếu có
  SELECT * INTO v_next_rank
  FROM ranks
  WHERE rank_order = v_current_rank.rank_order + 1
  ORDER BY rank_order
  LIMIT 1;
  
  -- Nếu đủ điều kiện thăng hạng
  IF v_next_rank IS NOT NULL AND v_current_elo >= v_next_rank.elo_requirement THEN
    -- Cập nhật hạng mới
    UPDATE player_rankings
    SET current_rank = v_next_rank.code,
        current_rank_id = v_next_rank.id,
        last_promotion_date = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Tạo thông báo thăng hạng
    INSERT INTO notifications (
      user_id, 
      type, 
      title, 
      message
    ) VALUES (
      p_user_id, 
      'rank_promotion', 
      'Thăng hạng!', 
      'Bạn đã thăng lên hạng ' || v_next_rank.rank_name || ' với ' || v_current_elo || ' điểm ELO.'
    );
    
    v_promoted := true;
    
    v_result := jsonb_build_object(
      'promoted', true,
      'old_rank', v_current_rank.current_rank,
      'new_rank', v_next_rank.code,
      'elo', v_current_elo
    );
  ELSE
    v_result := jsonb_build_object(
      'promoted', false,
      'current_rank', v_current_rank.current_rank,
      'elo', v_current_elo
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Thêm RLS policies cho các bảng mới
-- Ranks table
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ranks" ON public.ranks FOR SELECT USING (true);
CREATE POLICY "Only admins can manage ranks" ON public.ranks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Player rankings
ALTER TABLE public.player_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view player rankings" ON public.player_rankings FOR SELECT USING (true);
CREATE POLICY "Users can update their own rankings" ON public.player_rankings 
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert player rankings" ON public.player_rankings
FOR INSERT WITH CHECK (auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Daily challenge stats
ALTER TABLE public.daily_challenge_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own challenge stats" ON public.daily_challenge_stats
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage challenge stats" ON public.daily_challenge_stats
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- SPA transactions
ALTER TABLE public.spa_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON public.spa_transactions
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert transactions" ON public.spa_transactions
FOR INSERT WITH CHECK (true);

-- SPA points log
ALTER TABLE public.spa_points_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own points log" ON public.spa_points_log
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert points log" ON public.spa_points_log
FOR INSERT WITH CHECK (true);

-- Memberships
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view memberships" ON public.memberships FOR SELECT USING (true);
CREATE POLICY "Club owners can manage memberships" ON public.memberships
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE c.id = club_id AND c.owner_id = auth.uid()
  )
);
CREATE POLICY "Users can join clubs" ON public.memberships
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User chat sessions
ALTER TABLE public.user_chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own chat sessions" ON public.user_chat_sessions
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create chat sessions" ON public.user_chat_sessions
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chat sessions" ON public.user_chat_sessions
FOR UPDATE USING (auth.uid() = user_id);

-- Chat messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own chat messages" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_chat_sessions
    WHERE id = session_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can send messages to their sessions" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_chat_sessions
    WHERE id = session_id AND user_id = auth.uid()
  )
);

-- Trigger để tự động tạo player_rankings khi profile được tạo
CREATE OR REPLACE FUNCTION public.create_player_ranking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.player_rankings (
    user_id,
    current_rank,
    current_rank_id,
    elo_points,
    spa_points
  ) VALUES (
    NEW.user_id,
    'K',
    (SELECT id FROM public.ranks WHERE code = 'K' LIMIT 1),
    1000,
    0
  ) ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_player_ranking_trigger ON public.profiles;
CREATE TRIGGER create_player_ranking_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_player_ranking();

-- Tạo function để tự động tạo column deleted_at trong bảng notifications nếu chưa có
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;
