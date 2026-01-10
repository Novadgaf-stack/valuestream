-- Enable realtime for detected_items only (value_snapshots already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.detected_items;
ALTER TABLE public.detected_items REPLICA IDENTITY FULL;