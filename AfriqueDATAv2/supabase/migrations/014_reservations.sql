-- Smart Gestion - Module Réservations
-- Gestion des réservations AVANT participation (workflow: pending → approved/rejected/expired → completed)

-- ============================================
-- 1. TABLE RÉSERVATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculties(id) ON DELETE SET NULL,
  promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
  matricule TEXT,
  telephone TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'completed')),
  desired_date DATE,
  desired_time_start TIME,
  desired_time_end TIME,
  duration_minutes INTEGER,
  notes TEXT,
  admin_note TEXT,
  rejection_reason TEXT,
  validated_by UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  participation_id UUID REFERENCES participations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reservations_activity ON reservations(activity_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created ON reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON reservations(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE reservations IS 'Réservations d''activités avant participation';
COMMENT ON COLUMN reservations.status IS 'pending|approved|rejected|expired|completed';
COMMENT ON COLUMN reservations.participation_id IS 'Lien vers participation une fois convertie';

-- ============================================
-- 2. RLS
-- ============================================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Public peut insérer (formulaire QR)
CREATE POLICY "Public insert reservations" ON reservations
  FOR INSERT WITH CHECK (true);

-- Admin peut tout faire (lecture, mise à jour, suppression, approbation)
CREATE POLICY "Admin all reservations" ON reservations
  FOR ALL USING (is_admin());

-- ============================================
-- 3. PARAMÈTRES RÉSERVATION (délai auto-expire)
-- ============================================
CREATE TABLE IF NOT EXISTS reservation_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'
);

INSERT INTO reservation_settings (key, value) VALUES
  ('auto_expire_minutes', '{"minutes": 30}'::jsonb),
  ('allow_double_booking', '{"allowed": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS reservation_settings (après création de la table)
ALTER TABLE reservation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin all reservation_settings" ON reservation_settings
  FOR ALL USING (is_admin());

-- ============================================
-- 4. FONCTION AUTO-EXPIRE
-- ============================================
CREATE OR REPLACE FUNCTION expire_old_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
  expire_min INTEGER;
BEGIN
  SELECT (value->>'minutes')::INTEGER INTO expire_min
  FROM reservation_settings WHERE key = 'auto_expire_minutes'
  LIMIT 1;
  IF expire_min IS NULL THEN expire_min := 30; END IF;

  WITH expired AS (
    UPDATE reservations
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending'
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO updated_count FROM expired;
  RETURN updated_count;
END;
$$;

-- Pour cron / appel externe (pg_cron, Edge Function)
GRANT EXECUTE ON FUNCTION expire_old_reservations() TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_reservations() TO service_role;

-- Trigger: set expires_at on insert for pending
CREATE OR REPLACE FUNCTION set_reservation_expires_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  exp_min INTEGER;
BEGIN
  IF NEW.status = 'pending' AND NEW.expires_at IS NULL THEN
    SELECT COALESCE((value->>'minutes')::INTEGER, 30) INTO exp_min
    FROM reservation_settings WHERE key = 'auto_expire_minutes' LIMIT 1;
    IF exp_min IS NULL THEN exp_min := 30; END IF;
    NEW.expires_at := NOW() + (exp_min || ' minutes')::INTERVAL;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservation_expires ON reservations;
CREATE TRIGGER trg_reservation_expires
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE PROCEDURE set_reservation_expires_at();
