-- Fix RLS policies to explicitly deny anonymous access and prevent data leaks

-- 1. Drop and recreate profiles policies to be more explicit
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- 2. Drop and recreate heart_episodes policies to be more explicit  
DROP POLICY IF EXISTS "Users can view own episodes" ON public.heart_episodes;

CREATE POLICY "Authenticated users can view own episodes"
ON public.heart_episodes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Improve community_posts policy to ensure only published posts are visible to subscribers
-- and only admins/authors can see drafts
DROP POLICY IF EXISTS "Subscribers can view published posts" ON public.community_posts;

CREATE POLICY "Subscribers can view published posts only"
ON public.community_posts
FOR SELECT
TO authenticated
USING (
  (is_published = true AND (has_role(auth.uid(), 'subscriber'::app_role) OR has_role(auth.uid(), 'admin'::app_role)))
  OR (has_role(auth.uid(), 'admin'::app_role))
);

-- 4. Add explicit denial policies for anonymous users on sensitive tables
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

CREATE POLICY "Deny anonymous access to heart_episodes"  
ON public.heart_episodes
FOR ALL
TO anon
USING (false);

CREATE POLICY "Deny anonymous access to episode_documents"
ON public.episode_documents  
FOR ALL
TO anon
USING (false);