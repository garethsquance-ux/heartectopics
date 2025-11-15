-- Add comments_enabled column to community_posts
ALTER TABLE community_posts ADD COLUMN comments_enabled BOOLEAN DEFAULT true;

-- Disable comments on the welcome post
UPDATE community_posts 
SET comments_enabled = false 
WHERE title = 'Welcome to Our Community';