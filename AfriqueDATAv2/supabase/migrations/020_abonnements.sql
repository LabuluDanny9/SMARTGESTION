-- Smart Gestion - Abonnements avec types et compte à rebours
-- Types: mensuel, 2 mois, 3 mois, 6 mois, annuel

-- Table des types d'abonnement (durée en jours)
CREATE TABLE subscription_types (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL UNIQUE,
  duree_jours INTEGER NOT NULL,
  ordre INTEGER DEFAULT 0
);

INSERT INTO subscription_types (id, nom, duree_jours, ordre) VALUES
  ('mensuel', 'Mensuel', 30, 1),
  ('2_mois', '2 mois', 60, 2),
  ('3_mois', '3 mois', 90, 3),
  ('6_mois', '6 mois', 180, 4),
  ('annuel', 'Annuel', 365, 5);

-- Table des abonnements
CREATE TABLE abonnements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
  type_abonne TEXT NOT NULL CHECK (type_abonne IN ('etudiant', 'visiteur')),
  type_abonnement TEXT NOT NULL REFERENCES subscription_types(id),
  date_activation TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_expiration TIMESTAMPTZ NOT NULL,
  statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'expire', 'suspendu')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT abonnement_has_subscriber CHECK (
    (type_abonne = 'etudiant' AND student_id IS NOT NULL AND visitor_id IS NULL) OR
    (type_abonne = 'visiteur' AND visitor_id IS NOT NULL AND student_id IS NULL)
  )
);

-- Index pour performance
CREATE INDEX idx_abonnements_student ON abonnements(student_id);
CREATE INDEX idx_abonnements_visitor ON abonnements(visitor_id);
CREATE INDEX idx_abonnements_date_expiration ON abonnements(date_expiration);
CREATE INDEX idx_abonnements_statut ON abonnements(statut);

-- RLS
ALTER TABLE subscription_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonnements ENABLE ROW LEVEL SECURITY;

-- Lecture publique des types
CREATE POLICY "Public read subscription_types" ON subscription_types FOR SELECT USING (true);

-- Admin full access
CREATE POLICY "Admin all subscription_types" ON subscription_types FOR ALL USING (is_admin());
CREATE POLICY "Admin all abonnements" ON abonnements FOR ALL USING (is_admin());

-- Trigger: calculer date_expiration à partir du type
CREATE OR REPLACE FUNCTION set_abonnement_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_jours INTEGER;
BEGIN
  SELECT duree_jours INTO v_jours FROM subscription_types WHERE id = NEW.type_abonnement;
  IF v_jours IS NULL THEN
    RAISE EXCEPTION 'Type d''abonnement invalide: %', NEW.type_abonnement;
  END IF;
  NEW.date_expiration := NEW.date_activation + (v_jours || ' days')::INTERVAL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_abonnement_expiration ON abonnements;
CREATE TRIGGER trg_abonnement_expiration
  BEFORE INSERT OR UPDATE OF date_activation, type_abonnement ON abonnements
  FOR EACH ROW EXECUTE PROCEDURE set_abonnement_expiration();

COMMENT ON TABLE abonnements IS 'Abonnements avec type (mensuel, annuel, etc.) et compte à rebours depuis date_activation';
