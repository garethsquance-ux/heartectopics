-- Add 'guide' as a valid category for community posts
ALTER TABLE community_posts DROP CONSTRAINT IF EXISTS community_posts_category_check;
ALTER TABLE community_posts ADD CONSTRAINT community_posts_category_check 
  CHECK (category IN ('research', 'medical_advances', 'studies', 'personal_stories', 'guide'));

-- Update the existing post to use 'guide' category
UPDATE community_posts 
SET category = 'guide' 
WHERE id = '0dbb7377-d7c5-4d9b-9cff-7bb47ebe3f05';