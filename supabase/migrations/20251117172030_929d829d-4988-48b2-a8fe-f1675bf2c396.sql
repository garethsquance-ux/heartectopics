-- Drop the existing restrictive policy for viewing posts
DROP POLICY IF EXISTS "Subscribers can view published posts only" ON public.community_posts;

-- Create new public access policy for published posts
CREATE POLICY "Anyone can view published posts"
ON public.community_posts
FOR SELECT
TO public
USING (is_published = true);

-- Keep admin access policy (already exists but let's ensure it)
-- Admins can still see drafts and manage everything
CREATE POLICY "Admins can view all posts including drafts"
ON public.community_posts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));