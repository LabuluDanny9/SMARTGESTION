-- Smart Gestion - Schéma initial Supabase
-- Salle du Numérique UNILU

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ADMIN (Secrétaire) - Utilise Supabase Auth
-- ============================================
-- Les admins sont dans auth.users (email/password)
-- Cette table stocke les métadonnées admin
CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nom_complet TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GESTION ACADÉMIQUE
-- ============================================

-- Facultés
CREATE TABLE faculties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotions (par faculté)
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  annee INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(faculty_id, nom)
);

-- Étudiants (liste officielle par promotion)
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  matricule TEXT NOT NULL,
  nom_complet TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(promotion_id, matricule)
);

-- Visiteurs (non-étudiants)
CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom_complet TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  institution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TYPES D'ACTIVITÉS
-- ============================================
CREATE TABLE activity_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES activity_types(id) ON DELETE SET NULL,
  -- parent_id pour sous-types (ex: Pratiques > Informatique, Réseaux, IA)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Types initiaux (Cours en ligne, Pratiques, Recherche, Formation, Conférence, Réunion, Autres)
INSERT INTO activity_types (nom) VALUES 
  ('Cours en ligne'),
  ('Pratiques'),
  ('Recherche'),
  ('Formation'),
  ('Conférence'),
  ('Réunion'),
  ('Autres');

-- Sous-types pour Pratiques
INSERT INTO activity_types (nom, parent_id) 
SELECT 'Informatique', id FROM activity_types WHERE nom = 'Pratiques';
INSERT INTO activity_types (nom, parent_id) 
SELECT 'Réseaux', id FROM activity_types WHERE nom = 'Pratiques';
INSERT INTO activity_types (nom, parent_id) 
SELECT 'IA', id FROM activity_types WHERE nom = 'Pratiques';

-- ============================================
-- ACTIVITÉS
-- ============================================
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type_id UUID NOT NULL REFERENCES activity_types(id) ON DELETE RESTRICT,
  responsable_id UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
  nom TEXT NOT NULL,
  description TEXT,
  date_debut DATE NOT NULL,
  heure_debut TIME NOT NULL,
  duree_minutes INTEGER NOT NULL,
  lieu TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inscriptions aux activités (étudiants + visiteurs) - données du formulaire QR
CREATE TABLE participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
  nom_complet TEXT NOT NULL,
  faculty_id UUID REFERENCES faculties(id) ON DELETE SET NULL,
  promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
  matricule TEXT,
  type_participant TEXT NOT NULL CHECK (type_participant IN ('etudiant', 'visiteur')),
  cote TEXT,
  montant DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (montant >= 0),
  devise TEXT DEFAULT 'CDF',
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- FACULTÉS INITIALES UNILU
-- ============================================
-- Facultés UNILU (ESI contient PreESI et Bac1 avec 4 spécialités Génie)
INSERT INTO faculties (nom, code) VALUES 
  ('Médecine', 'MED'),
  ('Sciences sociales et politiques', 'SSP'),
  ('Polytechnique', 'POLY'),
  ('ESI', 'ESI'),
  ('Économie', 'ECO'),
  ('Agronomie', 'AGRO'),
  ('Lettres', 'LET'),
  ('Architecture', 'ARCH');

-- Promotions ESI : PreESI, Bac1 (4 spécialités)
INSERT INTO promotions (faculty_id, nom, annee) 
SELECT id, 'PreESI', EXTRACT(YEAR FROM CURRENT_DATE) FROM faculties WHERE code = 'ESI';
INSERT INTO promotions (faculty_id, nom, annee) 
SELECT id, 'Bac1 - Génie Informatique IA', EXTRACT(YEAR FROM CURRENT_DATE) FROM faculties WHERE code = 'ESI';
INSERT INTO promotions (faculty_id, nom, annee) 
SELECT id, 'Bac1 - Génie Civil', EXTRACT(YEAR FROM CURRENT_DATE) FROM faculties WHERE code = 'ESI';
INSERT INTO promotions (faculty_id, nom, annee) 
SELECT id, 'Bac1 - Génie de Procédés', EXTRACT(YEAR FROM CURRENT_DATE) FROM faculties WHERE code = 'ESI';
INSERT INTO promotions (faculty_id, nom, annee) 
SELECT id, 'Bac1 - Génie Électrique', EXTRACT(YEAR FROM CURRENT_DATE) FROM faculties WHERE code = 'ESI';

-- ============================================
-- RLS (Row Level Security) - Configuration Supabase
-- ============================================
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;

-- Fonction: vérifier si l'utilisateur connecté est admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER;

-- Policies: Admin
CREATE POLICY "Admin read own profile" ON admin_profiles FOR SELECT USING (auth.uid() = id);

-- Policies: accès public pour formulaire QR (lecture facultés, promotions, types, activités actives ; écriture participations, visiteurs)
CREATE POLICY "Public read faculties" ON faculties FOR SELECT USING (true);
CREATE POLICY "Public read promotions" ON promotions FOR SELECT USING (true);
CREATE POLICY "Public read activity_types" ON activity_types FOR SELECT USING (true);
CREATE POLICY "Public read activities actives" ON activities FOR SELECT USING (actif = true);
CREATE POLICY "Public insert participations" ON participations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert visitors" ON visitors FOR INSERT WITH CHECK (true);

-- Policies: Admin full access (lecture/écriture complète)
CREATE POLICY "Admin all faculties" ON faculties FOR ALL USING (is_admin());
CREATE POLICY "Admin all promotions" ON promotions FOR ALL USING (is_admin());
CREATE POLICY "Admin all students" ON students FOR ALL USING (is_admin());
CREATE POLICY "Admin all visitors" ON visitors FOR ALL USING (is_admin());
CREATE POLICY "Admin all activity_types" ON activity_types FOR ALL USING (is_admin());
CREATE POLICY "Admin all activities" ON activities FOR ALL USING (is_admin());
CREATE POLICY "Admin all participations" ON participations FOR ALL USING (is_admin());

-- Index pour performance
CREATE INDEX idx_promotions_faculty ON promotions(faculty_id);
CREATE INDEX idx_students_promotion ON students(promotion_id);
CREATE INDEX idx_participations_activity ON participations(activity_id);
CREATE INDEX idx_participations_student ON participations(student_id);
CREATE INDEX idx_participations_visitor ON participations(visitor_id);
CREATE INDEX idx_activities_date ON activities(date_debut);
CREATE INDEX idx_activities_type ON activities(type_id);
