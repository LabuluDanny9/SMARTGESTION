-- FIX: Ajouter labuludanny1@gmail.com comme administrateur
-- Exécuter dans Supabase > SQL Editor

-- Étape 1: Vérifier l'UUID de votre utilisateur
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'labuludanny1@gmail.com';

-- Étape 2: Insérer dans admin_profiles (remplacez l'UUID si différent de l'étape 1)
INSERT INTO admin_profiles (id, email, nom_complet)
SELECT id, email, 'Secrétaire'
FROM auth.users
WHERE email = 'labuludanny1@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  nom_complet = EXCLUDED.nom_complet,
  updated_at = NOW();
