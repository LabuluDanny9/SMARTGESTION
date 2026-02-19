-- Smart Gestion - Vues Analytics pour Business Intelligence
-- Données agrégées pour Financial, Participation, Activity Performance, Behavioral analytics

-- ============================================
-- 1. REVENUS QUOTIDIENS (Financial Intelligence)
-- ============================================
CREATE OR REPLACE VIEW v_analytics_daily_revenue AS
SELECT
  date_trunc('day', p.created_at)::date AS jour,
  COALESCE(SUM(p.montant) FILTER (WHERE p.statut_paiement IN ('paye', 'valide')), 0) AS revenu_valide,
  COALESCE(SUM(p.montant), 0) AS revenu_total,
  COUNT(*) FILTER (WHERE p.statut_paiement IN ('paye', 'valide')) AS nb_paiements_valides,
  COUNT(*) AS nb_participations
FROM participations p
GROUP BY date_trunc('day', p.created_at)::date
ORDER BY jour DESC;

-- ============================================
-- 2. REVENUS MENSUELS + TENDANCES
-- ============================================
CREATE OR REPLACE VIEW v_analytics_monthly_revenue AS
SELECT
  date_trunc('month', p.created_at)::date AS mois,
  EXTRACT(YEAR FROM p.created_at)::int AS annee,
  EXTRACT(MONTH FROM p.created_at)::int AS mois_num,
  COALESCE(SUM(p.montant) FILTER (WHERE p.statut_paiement IN ('paye', 'valide')), 0) AS revenu,
  COUNT(*) FILTER (WHERE p.statut_paiement IN ('paye', 'valide')) AS nb_paiements,
  COUNT(DISTINCT p.activity_id) AS nb_activites
FROM participations p
GROUP BY date_trunc('month', p.created_at)::date, EXTRACT(YEAR FROM p.created_at), EXTRACT(MONTH FROM p.created_at)
ORDER BY mois DESC;

-- ============================================
-- 3. HEURES DE PEAK (Participation Intelligence)
-- ============================================
CREATE OR REPLACE VIEW v_analytics_hourly_participation AS
SELECT
  EXTRACT(HOUR FROM p.created_at)::int AS heure,
  EXTRACT(DOW FROM p.created_at)::int AS jour_semaine,
  COUNT(*) AS nb_participations,
  COALESCE(SUM(p.montant) FILTER (WHERE p.statut_paiement IN ('paye', 'valide')), 0) AS revenu
FROM participations p
GROUP BY EXTRACT(HOUR FROM p.created_at), EXTRACT(DOW FROM p.created_at);

-- ============================================
-- 4. PARTICIPATION PAR FACULTÉ
-- ============================================
CREATE OR REPLACE VIEW v_analytics_faculty_participation AS
SELECT
  COALESCE(f.nom, 'Non renseignée') AS faculte,
  p.faculty_id,
  COUNT(*) AS nb_participations,
  COALESCE(SUM(p.montant) FILTER (WHERE p.statut_paiement IN ('paye', 'valide')), 0) AS revenu,
  COUNT(*) FILTER (WHERE p.type_participant = 'etudiant') AS nb_etudiants,
  COUNT(*) FILTER (WHERE p.type_participant = 'visiteur') AS nb_visiteurs
FROM participations p
LEFT JOIN faculties f ON f.id = p.faculty_id
GROUP BY p.faculty_id, f.nom
ORDER BY nb_participations DESC;

-- ============================================
-- 5. PERFORMANCE PAR TYPE D'ACTIVITÉ
-- ============================================
CREATE OR REPLACE VIEW v_analytics_activity_type_performance AS
SELECT
  t.nom AS type_activite,
  t.id AS type_id,
  COUNT(DISTINCT a.id) AS nb_activites,
  COUNT(p.id) AS nb_participations,
  COALESCE(SUM(p.montant) FILTER (WHERE p.statut_paiement IN ('paye', 'valide')), 0) AS revenu,
  ROUND(COUNT(p.id)::numeric / NULLIF(COUNT(DISTINCT a.id), 0), 1) AS participants_par_activite
FROM activity_types t
LEFT JOIN activities a ON a.type_id = t.id
LEFT JOIN participations p ON p.activity_id = a.id
WHERE t.parent_id IS NULL
GROUP BY t.id, t.nom
ORDER BY revenu DESC;

-- ============================================
-- 6. RENTABILITÉ PAR ACTIVITÉ
-- ============================================
CREATE OR REPLACE VIEW v_analytics_activity_profitability AS
SELECT
  a.id,
  a.nom,
  a.date_debut,
  a.heure_debut,
  a.duree_minutes,
  a.capacite,
  at.nom AS type_activite,
  COUNT(p.id) AS nb_participants,
  COALESCE(SUM(p.montant) FILTER (WHERE p.statut_paiement IN ('paye', 'valide')), 0) AS revenu,
  ROUND(
    COALESCE(SUM(p.montant) FILTER (WHERE p.statut_paiement IN ('paye', 'valide')), 0)::numeric
    / NULLIF(COUNT(p.id), 0),
    2
  ) AS revenu_moyen_par_participant,
  ROUND(
    (COUNT(p.id)::numeric / NULLIF(a.capacite, 0) * 100)::numeric,
    1
  ) AS taux_remplissage_pct
FROM activities a
LEFT JOIN activity_types at ON at.id = a.type_id
LEFT JOIN participations p ON p.activity_id = a.id
WHERE a.actif = true OR EXISTS (SELECT 1 FROM participations p2 WHERE p2.activity_id = a.id)
GROUP BY a.id, a.nom, a.date_debut, a.heure_debut, a.duree_minutes, a.capacite, at.nom
ORDER BY revenu DESC;

-- ============================================
-- 7. UTILISATEURS RÉCURRENTS (Behavioral)
-- ============================================
CREATE OR REPLACE VIEW v_analytics_recurrent_users AS
SELECT
  LOWER(TRIM(p.nom_complet)) AS nom_normalise,
  COUNT(*) AS nb_participations,
  COUNT(DISTINCT p.activity_id) AS nb_activites_distinctes,
  MIN(p.created_at) AS premiere_participation,
  MAX(p.created_at) AS derniere_participation,
  COALESCE(SUM(p.montant) FILTER (WHERE p.statut_paiement IN ('paye', 'valide')), 0) AS total_depense
FROM participations p
GROUP BY LOWER(TRIM(p.nom_complet))
HAVING COUNT(*) > 1
ORDER BY nb_participations DESC;

-- ============================================
-- 8. PERMISSIONS - Vue accessible aux rôles Supabase
-- ============================================
-- Les vues utilisent les RLS des tables sous-jacentes (participations, etc.)
-- Grant pour permettre à l'API PostgREST de les exposer
GRANT SELECT ON v_analytics_daily_revenue TO authenticated;
GRANT SELECT ON v_analytics_monthly_revenue TO authenticated;
GRANT SELECT ON v_analytics_hourly_participation TO authenticated;
GRANT SELECT ON v_analytics_faculty_participation TO authenticated;
GRANT SELECT ON v_analytics_activity_type_performance TO authenticated;
GRANT SELECT ON v_analytics_activity_profitability TO authenticated;
GRANT SELECT ON v_analytics_recurrent_users TO authenticated;

COMMENT ON VIEW v_analytics_daily_revenue IS 'Revenus quotidiens pour Financial Intelligence';
COMMENT ON VIEW v_analytics_monthly_revenue IS 'Revenus mensuels et tendances';
COMMENT ON VIEW v_analytics_hourly_participation IS 'Participation par heure/jour pour peak detection';
COMMENT ON VIEW v_analytics_faculty_participation IS 'Participation et revenus par faculté';
COMMENT ON VIEW v_analytics_activity_type_performance IS 'Performance par type d''activité';
COMMENT ON VIEW v_analytics_activity_profitability IS 'Rentabilité par activité';
COMMENT ON VIEW v_analytics_recurrent_users IS 'Utilisateurs avec plus d''une participation';
