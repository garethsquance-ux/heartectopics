-- Add moderator role to the enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'moderator';