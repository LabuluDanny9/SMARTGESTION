-- Smart Gestion - Vérification des codes d'accès et génération automatique

-- Backfill: codes pour les profils existants sans code
UPDATE admin_profiles SET code_acces_formateur = upper(substring(md5(random()::text) from 1 for 6))
WHERE code_acces_formateur IS NULL OR code_acces_formateur = '';

UPDATE formateur_profiles SET code_acces_admin = upper(substring(md5(random()::text) from 1 for 6))
WHERE code_acces_admin IS NULL OR code_acces_admin = '';

-- Trigger: générer code_acces_formateur à l'insert admin
CREATE OR REPLACE FUNCTION set_admin_access_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.code_acces_formateur IS NULL OR NEW.code_acces_formateur = '' THEN
    NEW.code_acces_formateur := upper(substring(md5(random()::text) from 1 for 6));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_access_code ON admin_profiles;
CREATE TRIGGER trg_admin_access_code
  BEFORE INSERT ON admin_profiles
  FOR EACH ROW EXECUTE PROCEDURE set_admin_access_code();

-- Trigger: générer code_acces_admin à l'insert formateur_profile
CREATE OR REPLACE FUNCTION set_formateur_access_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.code_acces_admin IS NULL OR NEW.code_acces_admin = '' THEN
    NEW.code_acces_admin := upper(substring(md5(random()::text) from 1 for 6));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_formateur_access_code ON formateur_profiles;
CREATE TRIGGER trg_formateur_access_code
  BEFORE INSERT ON formateur_profiles
  FOR EACH ROW EXECUTE PROCEDURE set_formateur_access_code();

-- RPC: vérifier le code pour accéder au dashboard formateur (utilisé par un admin)
CREATE OR REPLACE FUNCTION verify_admin_to_formateur_access(code_entered TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match BOOLEAN;
BEGIN
  SELECT (code_acces_formateur = upper(trim(code_entered)))
  INTO v_match
  FROM admin_profiles
  WHERE id = auth.uid();
  RETURN COALESCE(v_match, false);
END;
$$;

-- RPC: vérifier le code pour accéder au dashboard admin (utilisé par un formateur)
CREATE OR REPLACE FUNCTION verify_formateur_to_admin_access(code_entered TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match BOOLEAN;
BEGIN
  SELECT (code_acces_admin = upper(trim(code_entered)))
  INTO v_match
  FROM formateur_profiles
  WHERE id = auth.uid();
  RETURN COALESCE(v_match, false);
END;
$$;
