-- Smart Gestion - Départements, cible promotion activité, statut paiement
-- Hiérarchie: Faculté → Départements → Promotions
-- Activités ciblant une promotion + validation paiement par secrétaire

-- ============================================
-- 1. TABLE DÉPARTEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(faculty_id, nom)
);

CREATE INDEX IF NOT EXISTS idx_departments_faculty ON departments(faculty_id);

-- ============================================
-- 2. LIER PROMOTIONS AUX DÉPARTEMENTS
-- ============================================
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE CASCADE;

-- Créer département "Principal" par faculté et lier les promotions existantes
INSERT INTO departments (faculty_id, nom, code)
SELECT DISTINCT faculty_id, 'Principal', 'PRIN'
FROM promotions p
WHERE NOT EXISTS (SELECT 1 FROM departments d WHERE d.faculty_id = p.faculty_id AND d.nom = 'Principal');

UPDATE promotions SET department_id = (
  SELECT id FROM departments d WHERE d.faculty_id = promotions.faculty_id AND d.nom = 'Principal'
) WHERE department_id IS NULL;

-- ============================================
-- 3. ACTIVITÉS CIBLANT UNE PROMOTION
-- ============================================
ALTER TABLE activities ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activities_promotion ON activities(promotion_id);

-- ============================================
-- 4. STATUT PAIEMENT DANS PARTICIPATIONS
-- ============================================
ALTER TABLE participations ADD COLUMN IF NOT EXISTS statut_paiement TEXT DEFAULT 'en_attente'
  CHECK (statut_paiement IN ('en_attente', 'paye', 'valide'));
ALTER TABLE participations ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;
ALTER TABLE participations ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES admin_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_participations_statut ON participations(statut_paiement);

-- ============================================
-- 5. RLS DÉPARTEMENTS
-- ============================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Admin all departments" ON departments FOR ALL USING (is_admin());
