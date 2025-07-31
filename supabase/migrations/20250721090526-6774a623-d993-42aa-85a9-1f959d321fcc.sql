-- Create storage buckets for the application
INSERT INTO storage.buckets (id, name, public) VALUES ('club-photos', 'club-photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('rank-evidence', 'rank-evidence', false) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for club-photos bucket
CREATE POLICY "Users can upload club photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'club-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view club photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'club-photos');

CREATE POLICY "Users can update their own club photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'club-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own club photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'club-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create RLS policies for avatars bucket
CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create RLS policies for evidence bucket (private)
CREATE POLICY "Users can upload evidence" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evidence' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own evidence" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidence' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all evidence" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidence' 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "Users can update their own evidence" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'evidence' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own evidence" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'evidence' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create RLS policies for rank-evidence bucket (private)
CREATE POLICY "Users can upload rank evidence" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'rank-evidence' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own rank evidence" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'rank-evidence' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Club owners can view rank evidence" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'rank-evidence' 
    AND EXISTS (
      SELECT 1 FROM public.club_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all rank evidence" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'rank-evidence' 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "Users can update their own rank evidence" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'rank-evidence' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own rank evidence" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'rank-evidence' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );