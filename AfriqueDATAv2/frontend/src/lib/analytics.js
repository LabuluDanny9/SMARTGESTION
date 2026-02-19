/**
 * Smart Gestion - API Analytics
 * Récupère les données des vues analytics et les enrichit pour le BI
 */
import { supabase } from './supabase';

const JOURS_SEMAINE = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/** Revenus quotidiens des N derniers jours */
export async function fetchDailyRevenue(days = 90) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const { data, error } = await supabase
    .from('v_analytics_daily_revenue')
    .select('*')
    .gte('jour', from.toISOString().slice(0, 10))
    .order('jour', { ascending: true });
  if (error) throw error;
  return data || [];
}

/** Revenus mensuels */
export async function fetchMonthlyRevenue(months = 12) {
  const { data, error } = await supabase
    .from('v_analytics_monthly_revenue')
    .select('*')
    .order('mois', { ascending: false })
    .limit(months);
  if (error) throw error;
  return (data || []).reverse();
}

/** Participation par heure (peak detection) */
export async function fetchHourlyParticipation() {
  const { data, error } = await supabase
    .from('v_analytics_hourly_participation')
    .select('*');
  if (error) throw error;
  return data || [];
}

/** Participation par faculté */
export async function fetchFacultyParticipation() {
  const { data, error } = await supabase
    .from('v_analytics_faculty_participation')
    .select('*')
    .order('nb_participations', { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Performance par type d'activité */
export async function fetchActivityTypePerformance() {
  const { data, error } = await supabase
    .from('v_analytics_activity_type_performance')
    .select('*')
    .order('revenu', { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Rentabilité par activité */
export async function fetchActivityProfitability(limit = 20) {
  const { data, error } = await supabase
    .from('v_analytics_activity_profitability')
    .select('*')
    .order('revenu', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

/** Utilisateurs récurrents */
export async function fetchRecurrentUsers(limit = 50) {
  const { data, error } = await supabase
    .from('v_analytics_recurrent_users')
    .select('*')
    .limit(limit);
  if (error) throw error;
  return data || [];
}

/** Données brutes participations (pour heatmap, anomalies, etc.) */
export async function fetchParticipationsForAnalytics(limit = 5000) {
  const { data, error } = await supabase
    .from('participations')
    .select(`
      id, montant, type_participant, statut_paiement, created_at,
      activity_id,
      activities(nom, date_debut, heure_debut, duree_minutes, capacite, type_id),
      faculties(nom)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

/** Données brutes activités (pour corrélation durée/revenu) */
export async function fetchActivitiesForAnalytics() {
  const { data, error } = await supabase
    .from('activities')
    .select(`
      id, nom, date_debut, heure_debut, duree_minutes, capacite, prix_default,
      type_id,
      activity_types(nom)
    `)
    .eq('actif', true);
  if (error) throw error;
  return data || [];
}

/** Charge toutes les données analytics en une fois */
export async function fetchAllAnalyticsData() {
  const [
    dailyRevenue,
    monthlyRevenue,
    hourlyParticipation,
    facultyParticipation,
    activityTypePerf,
    activityProfitability,
    recurrentUsers,
    participations,
  ] = await Promise.all([
    fetchDailyRevenue(90),
    fetchMonthlyRevenue(12),
    fetchHourlyParticipation(),
    fetchFacultyParticipation(),
    fetchActivityTypePerformance(),
    fetchActivityProfitability(15),
    fetchRecurrentUsers(30),
    fetchParticipationsForAnalytics(3000),
  ]);

  return {
    dailyRevenue,
    monthlyRevenue,
    hourlyParticipation,
    facultyParticipation,
    activityTypePerf,
    activityProfitability,
    recurrentUsers,
    participations,
    JOURS_SEMAINE,
  };
}
