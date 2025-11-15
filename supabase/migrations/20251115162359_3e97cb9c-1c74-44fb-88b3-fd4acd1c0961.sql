-- Update the category check constraint to include 'general'
ALTER TABLE community_posts 
DROP CONSTRAINT IF EXISTS community_posts_category_check;

ALTER TABLE community_posts 
ADD CONSTRAINT community_posts_category_check 
CHECK (category IN ('general', 'guide', 'research', 'medical_advances', 'studies', 'personal_stories'));