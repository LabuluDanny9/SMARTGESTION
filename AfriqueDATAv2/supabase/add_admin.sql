-- Ajouter labuludanny1@gmail.com comme administrateur
-- À exécuter dans Supabase SQL Editor

INSERT INTO admin_profiles (id, email, nom_complet)
VALUES (
  '6e919a53-fd49-4f55-8110-692fc2b1bb57',
  'labuludanny1@gmail.com',
  'Secrétaire'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  nom_complet = EXCLUDED.nom_complet,
  updated_at = NOW();
