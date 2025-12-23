-- =====================================================
-- Migration: Add desired_positions to candidates
-- Changes position (single) to desired_positions (multiple)
-- =====================================================

-- Add new column for multiple position selection
ALTER TABLE candidates
ADD COLUMN desired_positions text[] DEFAULT '{}';

-- Migrate existing data (convert single position to array)
UPDATE candidates
SET desired_positions = ARRAY[position]
WHERE position IS NOT NULL AND position != '';

-- Note: We keep the old 'position' column for backwards compatibility
-- It can be removed in a future migration after all code is updated

-- Add comment for documentation
COMMENT ON COLUMN candidates.desired_positions IS 'Array of desired positions (multiple selection allowed)';
