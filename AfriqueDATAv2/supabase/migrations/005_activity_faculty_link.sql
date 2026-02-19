-- Smart Gestion - Lier les activités à une faculté
-- Les enregistrements des étudiants se font à base de nom complet et paiement

ALTER TABLE activities ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES faculties(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activities_faculty ON activities(faculty_id);

-- Remplir faculty_id à partir de promotion_id pour les activités existantes
UPDATE activities a
SET faculty_id = p.faculty_id
FROM promotions p
WHERE a.promotion_id = p.id AND a.faculty_id IS NULL;
