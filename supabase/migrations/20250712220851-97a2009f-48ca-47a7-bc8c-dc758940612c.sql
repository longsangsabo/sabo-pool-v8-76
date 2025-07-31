-- Add evidence_files column to rank_requests table
ALTER TABLE public.rank_requests ADD COLUMN IF NOT EXISTS evidence_files JSONB DEFAULT '[]'::jsonb;

-- Create storage bucket for rank evidence
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rank-evidence',
  'rank-evidence',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for rank evidence
CREATE POLICY "Users can upload their rank evidence"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'rank-evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own rank evidence"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'rank-evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Club owners can view evidence for their rank requests"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'rank-evidence' AND
  EXISTS (
    SELECT 1 FROM public.rank_requests rr
    JOIN public.club_profiles cp ON rr.club_id = cp.id
    WHERE cp.user_id = auth.uid()
    AND (storage.foldername(name))[1] = rr.user_id::text
  )
);

CREATE POLICY "Users can delete their own rank evidence"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'rank-evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);