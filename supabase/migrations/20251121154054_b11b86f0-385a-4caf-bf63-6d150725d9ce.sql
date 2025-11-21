-- Add view_count column to community_posts table
ALTER TABLE public.community_posts 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;