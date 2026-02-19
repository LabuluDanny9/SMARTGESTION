-- Smart Gestion - Formateurs/Enseignants par faculté
-- Chaque faculté a ses formateurs qui supervisent les pratiques/manipulations

-- ============================================
-- 1. TABLE FORMATEURS (par faculté)
-- ============================================
CREATE TABLE IF NOT EXISTS formateurs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  nom_complet TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  type TEXT DEFAULT 'formateur' CHECK (type IN ('formateur', 'enseignant', 'assistant')),
  specialite TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formateurs_faculty ON formateurs(faculty_id);

-- ============================================
-- 2. LIER ACTIVITÉS AU FORMATEUR SUPERVISEUR
-- ============================================
ALTER TABLE activities ADD COLUMN IF NOT EXISTS formateur_id UUID REFERENCES formateurs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activities_formateur ON activities(formateur_id);

-- ============================================
-- 3. RLS FORMATEURS
-- ============================================
ALTER TABLE formateurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read formateurs" ON formateurs FOR SELECT USING (true);
CREATE POLICY "Admin all formateurs" ON formateurs FOR ALL USING (is_admin());
