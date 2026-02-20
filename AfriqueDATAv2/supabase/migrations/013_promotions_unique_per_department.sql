-- Smart Gestion - Unicité des promotions par département
-- Chaque département peut avoir ses propres BAC1, BAC2, L3, M1, M2, MASTER 1, MASTER 2
-- Ancienne contrainte: UNIQUE(faculty_id, nom) => une seule "BAC1" par faculté
-- Nouvelle contrainte: UNIQUE(faculty_id, department_id, nom) => une "BAC1" par département

-- Supprimer l'ancienne contrainte (nom par défaut PostgreSQL)
ALTER TABLE promotions DROP CONSTRAINT IF EXISTS promotions_faculty_id_nom_key;

-- Nouvelle contrainte: unicité par (faculté, département, nom)
-- COALESCE sur department_id pour gérer les promotions sans département (NULL = un seul "pool" par faculté)
DROP INDEX IF EXISTS promotions_faculty_dept_nom_unique;
CREATE UNIQUE INDEX promotions_faculty_dept_nom_unique
  ON promotions (faculty_id, COALESCE(department_id, '00000000-0000-0000-0000-000000000000'::uuid), nom);
