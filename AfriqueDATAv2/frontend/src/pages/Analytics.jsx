import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import {
  Brain,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  Lightbulb,
  Activity,
  ChevronRight,
  Zap,
  BarChart3,
  Target,
} from 'lucide-react';
import { fetchAllAnalyticsData } from '../lib/analytics';
import { runInsightEngine, simpleForecast } from '../lib/insightEngine';

const CHART_COLORS = ['#dc2626', '#ef4444', '#b91c1c', '#991b1b', '#f87171', '#7f1d1d'];
const SENTIMENT_STYLES = {
  positive: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
  negative: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
  warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  neutral: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
};

/** Fallback : charge depuis participations si les vues n'existent pas */
async function loadWithFallback() {
  try {
    return await fetchAllAnalyticsData();
  } catch (e) {
    console.warn('Analytics views may not exist, using fallback:', e);
    const { data: parts } = await supabase
      .from('participations')
      .select('*, activities(nom,date_debut,heure_debut,duree_minutes,capacite,type_id), faculties(nom)')
      .order('created_at', { ascending: false })
      .limit(2000);
    const participations = parts || [];
    const byDay = {};
    const byMonth = {};
    const byHour = {};
    const byFaculty = {};
    const byType = {};
    const recurrentMap = {};
    participations.forEach((p) => {
      const d = new Date(p.created_at);
      const key = (p.nom_complet || '').toLowerCase().trim();
      if (key) {
        recurrentMap[key] = recurrentMap[key] || { nb_participations: 0, activityIds: new Set(), total_depense: 0 };
        recurrentMap[key].nb_participations += 1;
        recurrentMap[key].activityIds.add(p.activity_id);
        recurrentMap[key].total_depense += Number(p.montant ?? 0);
      }
      const dayKey = d.toISOString().slice(0, 10);
      byDay[dayKey] = byDay[dayKey] || { jour: dayKey, revenu_valide: 0, nb_participations: 0 };
      byDay[dayKey].revenu_valide += Number(p.montant ?? 0);
      byDay[dayKey].nb_participations += 1;

      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[monthKey] = byMonth[monthKey] || { mois: monthKey, revenu: 0, nb_paiements: 0 };
      byMonth[monthKey].revenu += Number(p.montant ?? 0);
      byMonth[monthKey].nb_paiements += 1;

      const h = d.getHours();
      byHour[h] = byHour[h] || { heure: h, nb_participations: 0, revenu: 0 };
      byHour[h].nb_participations += 1;
      byHour[h].revenu += Number(p.montant ?? 0);

      const fid = p.faculty_id || 'unknown';
      byFaculty[fid] = byFaculty[fid] || { faculte: p.faculties?.nom || 'Non renseignée', nb_participations: 0, revenu: 0, nb_etudiants: 0, nb_visiteurs: 0 };
      byFaculty[fid].nb_participations += 1;
      byFaculty[fid].revenu += Number(p.montant ?? 0);
      if (p.type_participant === 'etudiant') byFaculty[fid].nb_etudiants += 1;
      else byFaculty[fid].nb_visiteurs += 1;

      const tid = p.activities?.type_id || 'unknown';
      byType[tid] = byType[tid] || { type_activite: 'Autre', revenu: 0, nb_participations: 0 };
      byType[tid].revenu += Number(p.montant ?? 0);
      byType[tid].nb_participations += 1;
    });
    return {
      dailyRevenue: Object.values(byDay).sort((a, b) => a.jour.localeCompare(b.jour)).slice(-90),
      monthlyRevenue: Object.values(byMonth).sort((a, b) => a.mois.localeCompare(b.mois)).slice(-12),
      hourlyParticipation: Object.entries(byHour).map(([h, v]) => ({ heure: parseInt(h, 10), ...v, jour_semaine: 0 })),
      facultyParticipation: Object.values(byFaculty).sort((a, b) => b.nb_participations - a.nb_participations),
      activityTypePerf: Object.values(byType).sort((a, b) => b.revenu - a.revenu),
      activityProfitability: [],
      recurrentUsers: Object.entries(recurrentMap)
        .filter(([, v]) => v.nb_participations > 1)
        .map(([nom, v]) => ({
          nom_normalise: nom,
          nb_participations: v.nb_participations,
          nb_activites_distinctes: v.activityIds.size,
          total_depense: v.total_depense,
        }))
        .sort((a, b) => b.nb_participations - a.nb_participations),
      participations,
      JOURS_SEMAINE: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    };
  }
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const raw = await loadWithFallback();
        setData(raw);
        setInsights(runInsightEngine(raw));
      } catch (err) {
        setError(err?.message || 'Erreur chargement analytics');
        setData(null);
        setInsights(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const heatmapData = useMemo(() => {
    if (!data?.participations?.length) return { rows: [], max: 0 };
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const rows = days.map((label, i) => ({ label, values: Array(12).fill(0) }));
    let max = 0;
    const now = new Date();
    data.participations.forEach((p) => {
      const d = new Date(p.created_at);
      const dayIdx = (d.getDay() + 6) % 7;
      const weekDiff = Math.floor((now - d) / (7 * 24 * 60 * 60 * 1000));
      const weekIdx = 11 - Math.min(weekDiff, 11);
      if (weekIdx >= 0) {
        rows[dayIdx].values[weekIdx] = (rows[dayIdx].values[weekIdx] || 0) + 1;
        max = Math.max(max, rows[dayIdx].values[weekIdx]);
      }
    });
    return { rows, max };
  }, [data?.participations]);

  const forecastData = useMemo(() => {
    if (!data?.monthlyRevenue?.length) return [];
    const hist = data.monthlyRevenue.map((m) => ({ value: Number(m.revenu ?? 0) }));
    return simpleForecast(hist, 3);
  }, [data?.monthlyRevenue]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent" />
        <p className="text-slate-500">Chargement des analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-6">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Erreur
        </h2>
        <p className="text-red-700 dark:text-red-300 mt-2">{error}</p>
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
          Assurez-vous que la migration 011_analytics_views.sql a été exécutée.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Brain },
    { id: 'financial', label: 'Finances', icon: DollarSign },
    { id: 'participation', label: 'Participation', icon: Users },
    { id: 'activity', label: 'Activités', icon: Activity },
    { id: 'behavior', label: 'Comportements', icon: Target },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary-600" />
            Intelligence Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Analyses avancées et insights actionnables pour la Salle du Numérique
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
                activeTab === id
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Panneau Admin Insights - Résumés en langage naturel */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-primary-50/50 to-purple-50/30 dark:from-slate-800/50 dark:to-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Insights Admin
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {insights?.financial?.slice(0, 3).map((i, k) => (
            <div key={k} className={`p-4 rounded-xl border ${SENTIMENT_STYLES[i.sentiment] || SENTIMENT_STYLES.neutral}`}>
              <p className="text-sm font-medium">{i.text}</p>
              {i.value && <p className="text-xs mt-1 opacity-80">{i.value}</p>}
            </div>
          ))}
          {insights?.participation?.slice(0, 2).map((i, k) => (
            <div key={`p-${k}`} className={`p-4 rounded-xl border ${SENTIMENT_STYLES[i.sentiment] || SENTIMENT_STYLES.neutral}`}>
              <p className="text-sm font-medium">{i.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommandations */}
      {insights?.recommendations?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-500" />
            Recommandations
          </h2>
          <ul className="space-y-2">
            {insights.recommendations.map((r, k) => (
              <li key={k} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <ChevronRight className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                {r.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alertes Anomalies */}
      {(insights?.anomalies?.duplicates?.length > 0 || insights?.anomalies?.paymentOutliers?.length > 0) && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20 p-6">
          <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" />
            Alertes
          </h2>
          <div className="space-y-3 text-sm">
            {insights.anomalies.duplicates.length > 0 && (
              <p>
                <strong>{insights.anomalies.duplicates.length} doublon(s) potentiel(s)</strong> (même nom, même activité, dates proches)
              </p>
            )}
            {insights.anomalies.paymentOutliers.length > 0 && (
              <p>
                <strong>{insights.anomalies.paymentOutliers.length} paiement(s) atypique(s)</strong> (montants très élevés)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Onglets de contenu */}
      {(activeTab === 'overview' || activeTab === 'financial') && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Tendance mensuelle
              </h3>
              {data?.monthlyRevenue?.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="mois" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip formatter={(v) => [Number(v).toLocaleString('fr-FR') + ' FC', 'Revenu']} />
                      <Bar dataKey="revenu" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-slate-400 text-sm py-8 text-center">Aucune donnée</p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Prévision revenus
              </h3>
              {forecastData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="period" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip formatter={(v) => [Number(v).toLocaleString('fr-FR') + ' FC', 'Prévision']} />
                      <Area type="monotone" dataKey="forecast" fill="#dc2626" fillOpacity={0.4} stroke="#dc2626" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-slate-400 text-sm py-8 text-center">Données insuffisantes pour prévoir</p>
              )}
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'overview' || activeTab === 'participation') && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Heatmap participation (12 semaines)</h3>
              <div className="overflow-x-auto">
                <div className="inline-flex flex-col gap-1 min-w-0">
                  <div className="flex gap-0.5 mb-1">
                    <span className="w-8 text-xs text-slate-500 shrink-0" />
                    {Array.from({ length: 12 }, (_, i) => (
                      <span key={i} className="w-4 h-4 text-[9px] text-slate-400 text-center shrink-0">S-{11 - i}</span>
                    ))}
                  </div>
                  {heatmapData.rows.map((row, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="w-8 text-xs text-slate-600 shrink-0">{row.label}</span>
                      <div className="flex gap-0.5">
                        {row.values.map((v, j) => (
                          <div
                            key={j}
                            className="w-4 h-4 rounded-sm transition-colors"
                            style={{
                              backgroundColor: heatmapData.max > 0
                                ? `rgba(220, 38, 38, ${0.15 + (v / Math.max(heatmapData.max, 1)) * 0.85})`
                                : '#f1f5f9',
                            }}
                            title={`${row.label} S-${11 - j}: ${v}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Participation par faculté</h3>
              {data?.facultyParticipation?.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.facultyParticipation.slice(0, 8).map((f) => ({ name: f.faculte?.slice(0, 12) || 'N/A', participants: f.nb_participations }))}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={55} fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="participants" fill="#dc2626" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-slate-400 text-sm py-8 text-center">Aucune donnée</p>
              )}
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'overview' || activeTab === 'activity') && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Performance par type d'activité</h3>
          {data?.activityTypePerf?.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.activityTypePerf} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type_activite" angle={-25} textAnchor="end" height={60} fontSize={10} />
                  <YAxis yAxisId="left" stroke="#64748b" />
                  <YAxis yAxisId="right" orientation="right" stroke="#dc2626" />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'Revenu' ? Number(value).toLocaleString('fr-FR') + ' FC' : value,
                      name === 'Revenu' ? 'Revenu' : 'Participants',
                    ]}
                  />
                  <Bar yAxisId="left" dataKey="nb_participations" fill="#dc2626" radius={[4, 4, 0, 0]} name="Participants" />
                  <Line yAxisId="right" type="monotone" dataKey="revenu" stroke="#dc2626" strokeWidth={2} dot={false} name="Revenu" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-400 text-sm py-8 text-center">Aucune donnée</p>
          )}
        </div>
      )}

      {(activeTab === 'overview' || activeTab === 'participation') && data?.hourlyParticipation?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Heures de pointe (participations)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={Array.from({ length: 24 }, (_, h) => {
                  const row = data.hourlyParticipation.find((r) => r.heure === h);
                  return {
                    heure: `${h}h`,
                    participations: row?.nb_participations ?? 0,
                    revenu: row?.revenu ?? 0,
                  };
                })}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="heure" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="participations" stroke="#dc2626" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {(activeTab === 'overview' || activeTab === 'financial') && data?.dailyRevenue?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Revenus quotidiens (90 jours)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.dailyRevenue.slice(-60).map((d) => ({ ...d, revenu: Number(d.revenu_valide ?? d.revenu_total ?? 0) }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="jour" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip formatter={(v) => [Number(v).toLocaleString('fr-FR') + ' FC', 'Revenu']} />
                <Area type="monotone" dataKey="revenu" fill="#dc2626" fillOpacity={0.3} stroke="#dc2626" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {(activeTab === 'behavior' || activeTab === 'overview') && data?.recurrentUsers?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 overflow-hidden">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Utilisateurs récurrents (top 10)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 font-medium text-slate-500">Participations</th>
                  <th className="text-left py-2 font-medium text-slate-500">Activités distinctes</th>
                  <th className="text-left py-2 font-medium text-slate-500">Total dépensé</th>
                </tr>
              </thead>
              <tbody>
                {data.recurrentUsers.slice(0, 10).map((u, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="py-3 font-medium">{u.nb_participations}</td>
                    <td className="py-3">{u.nb_activites_distinctes}</td>
                    <td className="py-3">{Number(u.total_depense ?? 0).toLocaleString('fr-FR')} FC</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'activity' && data?.activityProfitability?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 overflow-hidden">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Rentabilité par activité</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 font-medium text-slate-500">Activité</th>
                  <th className="text-left py-2 font-medium text-slate-500">Type</th>
                  <th className="text-right py-2 font-medium text-slate-500">Participants</th>
                  <th className="text-right py-2 font-medium text-slate-500">Revenu</th>
                  <th className="text-right py-2 font-medium text-slate-500">Remplissage</th>
                </tr>
              </thead>
              <tbody>
                {data.activityProfitability.slice(0, 15).map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="py-3 font-medium">{a.nom}</td>
                    <td className="py-3">{a.type_activite}</td>
                    <td className="py-3 text-right">{a.nb_participants}</td>
                    <td className="py-3 text-right">{Number(a.revenu ?? 0).toLocaleString('fr-FR')} FC</td>
                    <td className="py-3 text-right">{a.taux_remplissage_pct != null ? `${a.taux_remplissage_pct}%` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
