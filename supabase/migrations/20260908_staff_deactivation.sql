-- Staff deactivation feature migration
-- Run this in Supabase SQL editor

-- ============================================================
-- staff.is_active: whether a staff member's portal access is
-- currently live. Deactivating sets this to false (reversible);
-- it is independent of onboarding_completed.
-- ============================================================
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
