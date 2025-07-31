-- Create storage bucket for club photos if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('club-photos', 'club-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for club photos
CREATE POLICY "Club owners can upload photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'club-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view club photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'club-photos');

CREATE POLICY "Club owners can update their photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'club-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Club owners can delete their photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'club-photos' AND auth.uid()::text = (storage.foldername(name))[1]);