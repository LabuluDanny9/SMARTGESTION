-- Smart Gestion - Abonnements : statut en_attente et activation différée
-- Permet de créer un abonnement sans l'activer, puis cliquer sur "Activer" pour démarrer le compte à rebours

-- Ajouter 'en_attente' au statut
ALTER TABLE abonnements DROP CONSTRAINT IF EXISTS abonnements_statut_check;
ALTER TABLE abonnements ADD CONSTRAINT abonnements_statut_check 
  CHECK (statut IN ('actif', 'expire', 'suspendu', 'en_attente'));

-- Rendre date_activation et date_expiration nullable (pour en_attente)
ALTER TABLE abonnements ALTER COLUMN date_activation DROP NOT NULL;
ALTER TABLE abonnements ALTER COLUMN date_expiration DROP NOT NULL;

-- Mettre à jour le trigger pour gérer date_activation NULL
CREATE OR REPLACE FUNCTION set_abonnement_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_jours INTEGER;
BEGIN
  IF NEW.date_activation IS NOT NULL THEN
    SELECT duree_jours INTO v_jours FROM subscription_types WHERE id = NEW.type_abonnement;
    IF v_jours IS NULL THEN
      RAISE EXCEPTION 'Type d''abonnement invalide: %', NEW.type_abonnement;
    END IF;
    NEW.date_expiration := NEW.date_activation + (v_jours || ' days')::INTERVAL;
  ELSE
    NEW.date_expiration := NULL;
  END IF;
  RETURN NEW;
END;
$$;
