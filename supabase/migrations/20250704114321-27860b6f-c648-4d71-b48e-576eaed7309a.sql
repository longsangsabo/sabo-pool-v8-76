-- Create user_settings table for user preferences
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_challenges BOOLEAN DEFAULT true,
  notification_tournaments BOOLEAN DEFAULT true,
  notification_marketing BOOLEAN DEFAULT false,
  privacy_show_phone BOOLEAN DEFAULT false,
  privacy_show_stats BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'vi',
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create match_history table for tracking match actions
CREATE TABLE public.match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_data JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own settings
CREATE POLICY "Users can manage their own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Enable RLS on match_history  
ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view match history
CREATE POLICY "Anyone can view match history" ON public.match_history
  FOR SELECT USING (true);

-- Users can create match history for matches they participated in
CREATE POLICY "Users can create match history for their matches" ON public.match_history
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = match_history.match_id 
      AND (matches.player1_id = auth.uid() OR matches.player2_id = auth.uid())
    )
  );

-- Add trigger for updated_at on user_settings
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint on phone numbers in profiles table
ALTER TABLE public.profiles 
ADD CONSTRAINT unique_phone_number UNIQUE (phone);

-- Add check constraint for minimum age if birthdate is added later
-- (This can be added when birthdate field is implemented)

-- Create function to auto-create user settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger to create user settings when user signs up
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_settings();