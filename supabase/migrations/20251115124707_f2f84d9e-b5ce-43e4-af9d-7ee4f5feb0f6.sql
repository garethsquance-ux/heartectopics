-- Add display_order column to community_posts for manual ordering
ALTER TABLE community_posts ADD COLUMN display_order INTEGER;

-- Set initial order based on created_at
UPDATE community_posts 
SET display_order = row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_number 
  FROM community_posts
) as numbered
WHERE community_posts.id = numbered.id;

-- Add default for new posts
ALTER TABLE community_posts ALTER COLUMN display_order SET DEFAULT 999;

-- Add index for better sorting performance
CREATE INDEX idx_community_posts_display_order ON community_posts(display_order);

-- Add admin delete policy for comments
CREATE POLICY "Admins can delete comments"
ON community_comments
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add user delete own comment policy
CREATE POLICY "Users can delete own comments"
ON community_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Add admin delete policy for posts
CREATE POLICY "Admins can delete posts"
ON community_posts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));