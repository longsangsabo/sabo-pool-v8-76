-- Tạo bảng chi tiết giải thưởng theo hạng
CREATE TABLE public.tournament_prize_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- 1, 2, 3, etc hoặc 99 cho participation
  position_name TEXT NOT NULL, -- "Vô địch", "Á quân", "Hạng 3", "Tham gia"
  cash_amount NUMERIC DEFAULT 0,
  spa_points INTEGER DEFAULT 0,
  elo_points INTEGER DEFAULT 0,
  physical_items TEXT[], -- Mảng các phần thưởng vật chất
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint để tránh duplicate position trong cùng tournament
  UNIQUE(tournament_id, position)
);

-- Tạo bảng giải thưởng đặc biệt
CREATE TABLE public.tournament_special_awards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  award_name TEXT NOT NULL,
  award_description TEXT,
  criteria TEXT, -- Điều kiện để được giải
  cash_amount NUMERIC DEFAULT 0,
  spa_points INTEGER DEFAULT 0,
  elo_points INTEGER DEFAULT 0,
  physical_items TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tạo bảng cấu hình điểm chi tiết
CREATE TABLE public.tournament_point_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  point_type TEXT NOT NULL CHECK (point_type IN ('spa', 'elo')),
  position_range TEXT NOT NULL, -- "1", "2", "3", "4-8", "9-16", "participation"
  base_points INTEGER NOT NULL DEFAULT 0,
  rank_multiplier JSONB DEFAULT '{}', -- Multiplier theo rank: {"K": 1.0, "I": 1.1, ...}
  tier_bonus INTEGER DEFAULT 0, -- Bonus theo tier giải đấu
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint cho position_range và point_type trong cùng tournament
  UNIQUE(tournament_id, point_type, position_range)
);

-- Tạo bảng phần thưởng vật chất chi tiết
CREATE TABLE public.tournament_physical_prizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- Hạng được nhận
  item_name TEXT NOT NULL,
  item_description TEXT,
  quantity INTEGER DEFAULT 1,
  estimated_value NUMERIC DEFAULT 0,
  sponsor_name TEXT, -- Nhà tài trợ
  image_url TEXT, -- Hình ảnh phần thưởng
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tạo indexes cho performance
CREATE INDEX idx_tournament_prize_tiers_tournament_id ON tournament_prize_tiers(tournament_id);
CREATE INDEX idx_tournament_prize_tiers_position ON tournament_prize_tiers(position);

CREATE INDEX idx_tournament_special_awards_tournament_id ON tournament_special_awards(tournament_id);
CREATE INDEX idx_tournament_special_awards_active ON tournament_special_awards(is_active);

CREATE INDEX idx_tournament_point_configs_tournament_id ON tournament_point_configs(tournament_id);
CREATE INDEX idx_tournament_point_configs_type ON tournament_point_configs(point_type);

CREATE INDEX idx_tournament_physical_prizes_tournament_id ON tournament_physical_prizes(tournament_id);
CREATE INDEX idx_tournament_physical_prizes_position ON tournament_physical_prizes(position);

-- Tạo RLS policies
ALTER TABLE public.tournament_prize_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_special_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_point_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_physical_prizes ENABLE ROW LEVEL SECURITY;

-- RLS cho tournament_prize_tiers
CREATE POLICY "Anyone can view tournament prize tiers" 
ON public.tournament_prize_tiers 
FOR SELECT 
USING (true);

CREATE POLICY "Tournament creators can manage prize tiers" 
ON public.tournament_prize_tiers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t 
    WHERE t.id = tournament_id 
    AND t.created_by = auth.uid()
  )
);

-- RLS cho tournament_special_awards
CREATE POLICY "Anyone can view tournament special awards" 
ON public.tournament_special_awards 
FOR SELECT 
USING (true);

CREATE POLICY "Tournament creators can manage special awards" 
ON public.tournament_special_awards 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t 
    WHERE t.id = tournament_id 
    AND t.created_by = auth.uid()
  )
);

-- RLS cho tournament_point_configs
CREATE POLICY "Anyone can view tournament point configs" 
ON public.tournament_point_configs 
FOR SELECT 
USING (true);

CREATE POLICY "Tournament creators can manage point configs" 
ON public.tournament_point_configs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t 
    WHERE t.id = tournament_id 
    AND t.created_by = auth.uid()
  )
);

-- RLS cho tournament_physical_prizes
CREATE POLICY "Anyone can view tournament physical prizes" 
ON public.tournament_physical_prizes 
FOR SELECT 
USING (true);

CREATE POLICY "Tournament creators can manage physical prizes" 
ON public.tournament_physical_prizes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t 
    WHERE t.id = tournament_id 
    AND t.created_by = auth.uid()
  )
);

-- Tạo triggers để tự động update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tournament_prize_tiers_updated_at
  BEFORE UPDATE ON public.tournament_prize_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournament_special_awards_updated_at
  BEFORE UPDATE ON public.tournament_special_awards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournament_point_configs_updated_at
  BEFORE UPDATE ON public.tournament_point_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournament_physical_prizes_updated_at
  BEFORE UPDATE ON public.tournament_physical_prizes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();