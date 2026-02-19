-- Permettre la création du premier administrateur depuis l'application

-- Fonction pour vérifier s'il existe au moins un admin
CREATE OR REPLACE FUNCTION public.has_any_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM admin_profiles LIMIT 1);
$$ LANGUAGE sql SECURITY DEFINER;

-- RPC accessible sans authentification
GRANT EXECUTE ON FUNCTION public.has_any_admin() TO anon;

-- Policy : le premier utilisateur peut s'ajouter comme admin
CREATE POLICY "First admin self-insert" ON admin_profiles FOR INSERT
WITH CHECK (
  auth.uid() = id
  AND (SELECT COUNT(*) FROM admin_profiles) = 0
);
