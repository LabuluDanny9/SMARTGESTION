import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  Plus,
  TrendingUp,
  MapPin,
  User,
} from 'lucide-react';

const JOURS_SEMAINE = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const STATUT_CONFIG = {
  pending: { label: 'En attente', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', Icon: Clock },
  approved: { label: 'Approuvée', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', Icon: CheckCircle },
  rejected: { label: 'Refusée', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', Icon: XCircle },
  expired: { label: 'Expirée', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', Icon: AlertCircle },
  completed: { label: 'Terminée', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', Icon: CheckCircle },
};

function getDaysInMonth(year, month) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const result = [];
  for (let i = 0; i < startPad; i++) result.push(null);
  for (let d = 1; d <= days; d++) result.push(d);
  return result;
}

function formatDateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function FormateurDashboard() {
  const { formateurProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const formateurData = formateurProfile?.formateurs || formateurProfile?.formateur;
  const formateurId = formateurProfile?.formateur_id || formateurData?.id;

  const [activities, setActivities] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [activeTab, setActiveTab] = useState('calendrier');

  const loadData = useCallback(async () => {
    if (!formateurId) return;
    setLoading(true);
    try {
      const { year, month } = viewDate;
      const startOfMonth = new Date(year, month, 1).toISOString().slice(0, 10);
      const endOfMonth = new Date(year, month + 1, 0).toISOString().slice(0, 10);

      const [actRes, resRes] = await Promise.all([
        supabase
          .from('activities')
          .select('id, nom, date_debut, heure_debut, lieu, activity_types(nom)')
          .eq('formateur_id', formateurId)
          .eq('actif', true)
          .gte('date_debut', startOfMonth)
          .lte('date_debut', endOfMonth)
          .order('date_debut')
          .order('heure_debut'),
        supabase
          .from('reservations')
          .select('*, activities(id, nom, date_debut, heure_debut, activity_types(nom))')
          .order('created_at', { ascending: false }),
      ]);

      const myActivityIds = new Set((actRes.data || []).map((a) => a.id));
      const myReservations = (resRes.data || []).filter((r) => myActivityIds.has(r.activity_id));

      setActivities(actRes.data || []);
      setReservations(myReservations);
    } catch (err) {
      console.error('FormateurDashboard loadData:', err);
    } finally {
      setLoading(false);
    }
  }, [formateurId, viewDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const byDate = {};
  activities.forEach((a) => {
    const key = a.date_debut ? String(a.date_debut).slice(0, 10) : null;
    if (key) {
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(a);
    }
  });

  const { year, month } = viewDate;
  const days = getDaysInMonth(year, month);
  const today = new Date();
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const byStatus = {
    pending: reservations.filter((r) => r.status === 'pending'),
    approved: reservations.filter((r) => r.status === 'approved'),
    rejected: reservations.filter((r) => r.status === 'rejected'),
    expired: reservations.filter((r) => r.status === 'expired'),
    completed: reservations.filter((r) => r.status === 'completed'),
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/formateur/login');
  };

  const nomComplet = formateurData?.nom_complet || 'Formateur';

  if (!formateurId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center">
          <p className="text-slate-600 mb-4">Profil formateur incomplet. Contactez le secrétariat.</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center text-white font-bold">
              {nomComplet.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Espace Formateur</h1>
              <p className="text-sm text-slate-500">{nomComplet}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {['pending', 'approved', 'rejected', 'expired', 'completed'].map((status) => {
            const cfg = STATUT_CONFIG[status];
            const count = byStatus[status].length;
            return (
              <div
                key={status}
                className={`${cfg.bg} ${cfg.text} ${cfg.border} rounded-2xl p-4 border`}
              >
                <div className="flex items-center gap-2">
                  <cfg.Icon size={20} />
                  <span className="text-sm font-medium">{cfg.label}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{count}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('calendrier')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'calendrier'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <CalendarIcon size={18} className="inline mr-2 -mt-0.5" />
            Calendrier
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'reservations'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <TrendingUp size={18} className="inline mr-2 -mt-0.5" />
            Mes réservations
          </button>
        </div>

        {activeTab === 'calendrier' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setViewDate((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }))}
                className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-lg font-semibold text-slate-800">{MOIS[month]} {year}</h2>
              <button
                type="button"
                onClick={() => setViewDate((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }))}
                className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
            <div className="grid grid-cols-7 border-b border-slate-100">
              {JOURS_SEMAINE.map((j) => (
                <div key={j} className="py-2 text-center text-xs font-medium text-slate-500">{j}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((d, i) => {
                if (d === null) return <div key={`pad-${i}`} className="min-h-[90px] bg-slate-50/30" />;
                const key = formatDateKey(year, month, d);
                const dayActivities = byDate[key] || [];
                const isToday = key === todayKey;
                return (
                  <div
                    key={key}
                    className={`min-h-[90px] p-2 border-b border-r border-slate-100 last:border-r-0 ${
                      isToday ? 'bg-indigo-50/50' : 'bg-white'
                    }`}
                  >
                    <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-medium ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                      {d}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayActivities.slice(0, 3).map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => navigate(`/reserve/${a.id}`)}
                          className="block w-full text-left px-2 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-medium truncate transition-colors"
                        >
                          {a.nom}
                        </button>
                      ))}
                      {dayActivities.length > 3 && <span className="text-xs text-slate-400">+{dayActivities.length - 3}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Évolution des réservations</h2>
              <button
                type="button"
                onClick={() => window.open('/reserve', '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus size={18} /> Nouvelle réservation
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : reservations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">Aucune réservation pour vos activités.</p>
                <button
                  type="button"
                  onClick={() => window.open('/reserve', '_blank')}
                  className="inline-block mt-4 text-indigo-600 font-medium hover:underline"
                >
                  Réserver une activité →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.map((r) => {
                  const cfg = STATUT_CONFIG[r.status] || STATUT_CONFIG.pending;
                  return (
                    <div
                      key={r.id}
                      className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">{r.full_name}</p>
                          <p className="text-sm text-slate-500">{r.activities?.nom}</p>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <CalendarIcon size={12} />
                              {r.desired_date || r.activities?.date_debut}
                            </span>
                            {r.telephone && (
                              <span className="flex items-center gap-1">
                                <User size={12} />
                                {r.telephone}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${cfg.bg} ${cfg.text}`}>
                          <cfg.Icon size={16} />
                          <span className="text-sm font-medium">{cfg.label}</span>
                        </div>
                      </div>
                      {r.rejection_reason && (
                        <p className="mt-2 text-sm text-rose-600">{r.rejection_reason}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Liste activités du mois */}
        {activeTab === 'calendrier' && activities.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Mes activités ce mois</h3>
            <div className="space-y-2">
              {activities.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => navigate(`/reserve/${a.id}`)}
                  className="w-full text-left p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 transition-all shadow-sm"
                >
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{a.nom}</p>
                      <p className="text-sm text-slate-500">{a.activity_types?.nom}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <CalendarIcon size={14} />
                        {a.date_debut}
                      </span>
                      {a.heure_debut && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {String(a.heure_debut).slice(0, 5)}
                        </span>
                      )}
                      {a.lieu && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {a.lieu}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
