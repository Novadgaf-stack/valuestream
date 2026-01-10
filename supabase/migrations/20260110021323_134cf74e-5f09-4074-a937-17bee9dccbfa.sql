-- Add is_public column to audit_sessions for shareable links
ALTER TABLE public.audit_sessions ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- Create policy for public access to shared sessions
CREATE POLICY "Anyone can view public sessions"
ON public.audit_sessions
FOR SELECT
USING (is_public = true);

-- Allow anyone to view detected items from public sessions
CREATE POLICY "Anyone can view items from public sessions"
ON public.detected_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.audit_sessions
    WHERE audit_sessions.id = detected_items.session_id
    AND audit_sessions.is_public = true
  )
);

-- Allow anyone to view snapshots from public sessions
CREATE POLICY "Anyone can view snapshots from public sessions"
ON public.value_snapshots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.audit_sessions
    WHERE audit_sessions.id = value_snapshots.session_id
    AND audit_sessions.is_public = true
  )
);