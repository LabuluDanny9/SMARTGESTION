-- Smart Gestion - Demandes de réservation par formateurs
-- Formateur soumet une demande → Admin valide/refuse/propose alternative → Notification formateur

-- ============================================
-- 1. DEMANDES DE RÉSERVATION FORMATEUR
-- ============================================
CREATE TABLE IF NOT EXISTS formateur_reservation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formateur_id UUID NOT NULL REFERENCES formateurs(id) ON DELETE CASCADE,
  nom_formation TEXT NOT NULL,
  duree_minutes INTEGER NOT NULL DEFAULT 60,
  date_souhaitee DATE NOT NULL,
  heure_souhaitee TIME,
  nb_max_participants INTEGER,
  lieu TEXT,
  description TEXT,
  statut TEXT NOT NULL DEFAULT 'pending'
    CHECK (statut IN ('pending', 'approved', 'rejected', 'alternative_proposed')),
  date_alternative_proposee DATE,
  heure_alternative_proposee TIME,
  message_admin TEXT,
  validated_by UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_frr_formateur ON formateur_reservation_requests(formateur_id);
CREATE INDEX IF NOT EXISTS idx_frr_statut ON formateur_reservation_requests(statut);
CREATE INDEX IF NOT EXISTS idx_frr_date ON formateur_reservation_requests(date_souhaitee);

-- ============================================
-- 2. NOTIFICATIONS FORMATEUR
-- ============================================
CREATE TABLE IF NOT EXISTS formateur_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formateur_id UUID NOT NULL REFERENCES formateurs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  titre TEXT,
  message TEXT,
  reservation_request_id UUID REFERENCES formateur_reservation_requests(id) ON DELETE SET NULL,
  lu BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fn_formateur ON formateur_notifications(formateur_id);
CREATE INDEX IF NOT EXISTS idx_fn_lu ON formateur_notifications(lu);

-- ============================================
-- 3. RLS
-- ============================================
ALTER TABLE formateur_reservation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE formateur_notifications ENABLE ROW LEVEL SECURITY;

-- Admin: tout
CREATE POLICY "Admin all frr" ON formateur_reservation_requests FOR ALL USING (is_admin());
CREATE POLICY "Admin all fn" ON formateur_notifications FOR ALL USING (is_admin());

-- Formateur: ses propres demandes et notifications
CREATE POLICY "Formateur own frr" ON formateur_reservation_requests
  FOR ALL USING (
    formateur_id IN (SELECT formateur_id FROM formateur_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Formateur own fn" ON formateur_notifications
  FOR ALL USING (
    formateur_id IN (SELECT formateur_id FROM formateur_profiles WHERE id = auth.uid())
  );

-- Formateur peut lire les autres demandes (vue générale) - lecture seule
CREATE POLICY "Formateur read other frr" ON formateur_reservation_requests
  FOR SELECT USING (true);
