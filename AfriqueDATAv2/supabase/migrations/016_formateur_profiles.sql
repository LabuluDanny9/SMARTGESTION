-- Smart Gestion - Profils formateurs pour authentification
-- Lie auth.users aux formateurs pour permettre la connexion formateur/enseignant

-- ============================================
-- 1. TABLE FORMATEUR_PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS formateur_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  formateur_id UUID NOT NULL REFERENCES formateurs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(formateur_id)
);

CREATE INDEX IF NOT EXISTS idx_formateur_profiles_formateur ON formateur_profiles(formateur_id);

COMMENT ON TABLE formateur_profiles IS 'Lien auth.users <-> formateurs pour connexion formateur/enseignant';

-- ============================================
-- 2. RLS
-- ============================================
ALTER TABLE formateur_profiles ENABLE ROW LEVEL SECURITY;

-- Un formateur ne voit que son propre profil
CREATE POLICY "Formateur own profile" ON formateur_profiles
  FOR ALL USING (auth.uid() = id);

-- Admin peut tout voir (pour gestion)
CREATE POLICY "Admin all formateur_profiles" ON formateur_profiles
  FOR ALL USING (is_admin());

-- ============================================
-- 3. FONCTION : vérifier si formateur
-- ============================================
CREATE OR REPLACE FUNCTION is_formateur()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM formateur_profiles WHERE id = auth.uid());
$$;

-- ============================================
-- 4. RLS RÉSERVATIONS : formateurs voient leurs activités
-- ============================================
CREATE POLICY "Formateur read own activity reservations" ON reservations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN formateur_profiles fp ON fp.formateur_id = a.formateur_id
      WHERE a.id = reservations.activity_id AND fp.id = auth.uid()
    )
  );
