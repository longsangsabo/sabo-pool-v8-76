-- Create storage bucket for club photos
INSERT INTO storage.buckets (id, name, public) VALUES ('club-photos', 'club-photos', true);

-- Create policies for club photos bucket
CREATE POLICY "Users can upload club photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'club-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view club photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'club-photos');

CREATE POLICY "Users can update their own club photos"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'club-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own club photos"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'club-photos' AND auth.uid()::text = (storage.foldername(name))[1]);