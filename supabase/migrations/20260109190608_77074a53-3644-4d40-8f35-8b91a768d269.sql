-- Create storage bucket for audit reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-reports', 'audit-reports', true);

-- Allow authenticated users to upload their own reports
CREATE POLICY "Users can upload their own reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audit-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own reports
CREATE POLICY "Users can view their own reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audit-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to read reports (for sharing)
CREATE POLICY "Public can view audit reports"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audit-reports');

-- Add report_url column to detected_items for linking PDFs
ALTER TABLE public.detected_items
ADD COLUMN report_url TEXT DEFAULT NULL;

-- Add volatility_score column to detected_items
ALTER TABLE public.detected_items
ADD COLUMN volatility_score INTEGER DEFAULT 0;