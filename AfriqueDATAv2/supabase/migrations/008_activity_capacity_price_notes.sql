-- Smart Gestion: capacité, prix par défaut, notes pour activités
ALTER TABLE activities ADD COLUMN IF NOT EXISTS capacite INTEGER;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS prix_default DECIMAL(10,2) DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS notes TEXT;
COMMENT ON COLUMN activities.capacite IS 'Nombre max de participants (null = illimité)';
COMMENT ON COLUMN activities.prix_default IS 'Prix par défaut en FC pour cette activité';
COMMENT ON COLUMN activities.notes IS 'Notes internes pour le secrétaire';
