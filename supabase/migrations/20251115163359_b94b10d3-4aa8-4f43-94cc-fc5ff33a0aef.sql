-- Update community_comments policies to allow moderators
CREATE POLICY "Moderators can manage flagged comments"
ON community_comments
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'moderator'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'moderator'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Update moderation_actions to allow moderators
DROP POLICY IF EXISTS "Admins can create moderation actions" ON moderation_actions;
DROP POLICY IF EXISTS "Admins can view moderation actions" ON moderation_actions;

CREATE POLICY "Admins and moderators can create moderation actions"
ON moderation_actions
FOR INSERT
TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  AND auth.uid() = moderator_id
);

CREATE POLICY "Admins and moderators can view moderation actions"
ON moderation_actions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
);