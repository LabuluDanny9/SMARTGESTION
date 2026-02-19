-- Smart Gestion: liste des cotations par activité (grades/notes possibles)
-- Stockée en JSONB: ["0","1",...,"20"] ou ["A","B","C"] ou ["Réussi","Échec"]
ALTER TABLE activities ADD COLUMN IF NOT EXISTS cotations JSONB DEFAULT '[]';
COMMENT ON COLUMN activities.cotations IS 'Liste des cotations possibles pour cette activité (ex: ["0"-"20"], ["A","B","C"])';
