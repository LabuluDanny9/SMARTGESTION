-- Smart Gestion - Codes d'accès pour bascule entre dashboards
-- Chaque utilisateur reçoit un code à l'inscription pour accéder à l'autre tableau de bord

-- Secrétaire : code pour accéder au dashboard formateur
ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS code_acces_formateur TEXT;

-- Formateur : code pour accéder au dashboard secrétaire
ALTER TABLE formateur_profiles ADD COLUMN IF NOT EXISTS code_acces_admin TEXT;

-- Génère un code aléatoire 6 caractères
CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT upper(substring(md5(random()::text) from 1 for 6));
$$;

COMMENT ON COLUMN admin_profiles.code_acces_formateur IS 'Code personnel pour accéder au dashboard formateur';
COMMENT ON COLUMN formateur_profiles.code_acces_admin IS 'Code personnel pour accéder au dashboard secrétaire';
