-- Shura (Forums) feature migration
-- Run this in Supabase SQL editor

-- ============================================================
-- shura table: represents a forum group
-- ============================================================
CREATE TABLE IF NOT EXISTS shura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- shura_members: links members to a shura
-- Each member can only belong to ONE shura (enforced by UNIQUE on member_id)
-- is_moderator designates the moderator of the shura
-- ============================================================
CREATE TABLE IF NOT EXISTS shura_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shura_id UUID NOT NULL REFERENCES shura(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  is_moderator BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shura_id, member_id),
  UNIQUE (member_id)  -- One shura per member
);

-- ============================================================
-- shura_meetings: one meeting per month, 10 months a year
-- ============================================================
CREATE TABLE IF NOT EXISTS shura_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shura_id UUID NOT NULL REFERENCES shura(id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- shura_meeting_attendance: tracks per-member attendance
-- ============================================================
CREATE TABLE IF NOT EXISTS shura_meeting_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES shura_meetings(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  attended BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (meeting_id, member_id)
);

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_shura_members_shura_id ON shura_members(shura_id);
CREATE INDEX IF NOT EXISTS idx_shura_members_member_id ON shura_members(member_id);
CREATE INDEX IF NOT EXISTS idx_shura_meetings_shura_id ON shura_meetings(shura_id);
CREATE INDEX IF NOT EXISTS idx_shura_meeting_attendance_meeting_id ON shura_meeting_attendance(meeting_id);
CREATE INDEX IF NOT EXISTS idx_shura_meeting_attendance_member_id ON shura_meeting_attendance(member_id);

-- ============================================================
-- Enable Row Level Security (adjust policies as needed)
-- ============================================================
ALTER TABLE shura ENABLE ROW LEVEL SECURITY;
ALTER TABLE shura_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shura_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shura_meeting_attendance ENABLE ROW LEVEL SECURITY;

-- Staff can read/write everything (adjust to your auth model)
CREATE POLICY "Staff full access to shura" ON shura FOR ALL USING (true);
CREATE POLICY "Staff full access to shura_members" ON shura_members FOR ALL USING (true);
CREATE POLICY "Staff full access to shura_meetings" ON shura_meetings FOR ALL USING (true);
CREATE POLICY "Staff full access to shura_meeting_attendance" ON shura_meeting_attendance FOR ALL USING (true);
