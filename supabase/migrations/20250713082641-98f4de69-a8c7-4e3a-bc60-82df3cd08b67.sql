-- Create table for challenge messages/chat
CREATE TABLE IF NOT EXISTS public.challenge_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.challenge_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view messages in their challenges" ON public.challenge_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.challenges c 
    WHERE c.id = challenge_id 
    AND (c.challenger_id = auth.uid() OR c.opponent_id = auth.uid())
  )
);

CREATE POLICY "Users can insert messages in their challenges" ON public.challenge_messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.challenges c 
    WHERE c.id = challenge_id 
    AND (c.challenger_id = auth.uid() OR c.opponent_id = auth.uid())
    AND c.status = 'accepted'
  )
);

-- Enable realtime
ALTER TABLE public.challenge_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_messages;