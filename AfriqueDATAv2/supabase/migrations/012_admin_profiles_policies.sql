-- Smart Gestion - Politiques admin_profiles pour modification profil et gestion secrétaires
-- Permet : modifier son profil, lister tous les secrétaires, insérer un nouveau (via Edge Function)

-- Admin peut modifier son propre profil (nom_complet)
CREATE POLICY "Admin update own profile" ON admin_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin peut voir tous les profils admin (liste des secrétaires)
CREATE POLICY "Admin read all profiles" ON admin_profiles
  FOR SELECT USING (is_admin());

-- Admin peut insérer un nouveau profil (pour nouveau secrétaire créé via Edge Function)
-- L'insert se fait avec l'id du nouvel utilisateur auth
CREATE POLICY "Admin insert admin profile" ON admin_profiles
  FOR INSERT WITH CHECK (is_admin());
