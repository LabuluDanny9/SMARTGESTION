-- Smart Gestion - Formateurs indépendants des facultés/institutions
-- Les formateurs ne sont plus liés à une faculté spécifique

-- ============================================
-- 1. RENDRE FACULTY_ID OPTIONNEL
-- ============================================
ALTER TABLE formateurs
  ALTER COLUMN faculty_id DROP NOT NULL,
  ALTER COLUMN faculty_id DROP DEFAULT;

-- Mettre à jour les formateurs existants : garder faculty_id pour compatibilité
-- mais les nouveaux formateurs peuvent être créés sans faculté

COMMENT ON COLUMN formateurs.faculty_id IS 'Optionnel - faculté d''affiliation si applicable (formateurs indépendants)';
