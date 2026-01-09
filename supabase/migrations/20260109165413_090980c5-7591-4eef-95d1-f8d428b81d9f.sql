-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create audit_sessions table
CREATE TABLE public.audit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Session',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_value NUMERIC NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.audit_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
ON public.audit_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
ON public.audit_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.audit_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.audit_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Create detected_items table with bounding boxes
CREATE TABLE public.detected_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.audit_sessions(id) ON DELETE CASCADE,
  object_name TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  confidence NUMERIC NOT NULL DEFAULT 0,
  bbox_x NUMERIC NOT NULL DEFAULT 0,
  bbox_y NUMERIC NOT NULL DEFAULT 0,
  bbox_w NUMERIC NOT NULL DEFAULT 10,
  bbox_h NUMERIC NOT NULL DEFAULT 10,
  is_damaged BOOLEAN NOT NULL DEFAULT false,
  snapshot_data TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.detected_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items in their sessions"
ON public.detected_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.audit_sessions
  WHERE audit_sessions.id = detected_items.session_id
  AND audit_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can insert items in their sessions"
ON public.detected_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.audit_sessions
  WHERE audit_sessions.id = detected_items.session_id
  AND audit_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can delete items in their sessions"
ON public.detected_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.audit_sessions
  WHERE audit_sessions.id = detected_items.session_id
  AND audit_sessions.user_id = auth.uid()
));

-- Create value_snapshots for session replay chart
CREATE TABLE public.value_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.audit_sessions(id) ON DELETE CASCADE,
  total_value NUMERIC NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 0,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.value_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view snapshots in their sessions"
ON public.value_snapshots FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.audit_sessions
  WHERE audit_sessions.id = value_snapshots.session_id
  AND audit_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can insert snapshots in their sessions"
ON public.value_snapshots FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.audit_sessions
  WHERE audit_sessions.id = value_snapshots.session_id
  AND audit_sessions.user_id = auth.uid()
));

-- Update function for timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for session replay
ALTER PUBLICATION supabase_realtime ADD TABLE public.value_snapshots;