-- Smart Gestion - Module Annonces
-- Annonces publiées par l'admin (éditeur riche, publier/dépublier)

CREATE TABLE IF NOT EXISTS annonces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre TEXT NOT NULL,
  contenu TEXT,
  publie BOOLEAN DEFAULT false,
  created_by UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_annonces_publie ON annonces(publie);

ALTER TABLE annonces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin all annonces" ON annonces FOR ALL USING (is_admin());
