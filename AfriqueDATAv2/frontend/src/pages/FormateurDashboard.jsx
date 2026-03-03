import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import AccessCodeModal, { setCrossAccessAdmin, getCrossAccessFormateur } from '../components/AccessCodeModal';
import toast from 'react-hot-toast';
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
  FileCheck,
  KeyRound,
  Bell,
  Send,
  LayoutGrid,
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
const REQUEST_STATUT = {
  pending: { label: 'En attente', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', Icon: Clock },
  approved: { label: 'Validée', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', Icon: CheckCircle },
  rejected: { label: 'Refusée', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', Icon: XCircle },
  alternative_proposed: { label: 'Alternative proposée', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', Icon: AlertCircle },
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
  const { user, formateurProfile, adminProfile, isAdmin, verifyCodeForAdminAccess, signOut } = useAuth();
  const navigate = useNavigate();
  const formateurData = formateurProfile?.formateurs || formateurProfile?.formateur;
  const formateurId = formateurProfile?.formateur_id || formateurData?.id;

  const [activities, setActivities] = useState([]);
  const [, setReservations] = useState([]);
  const [reservationRequests, setReservationRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestForm, setRequestForm] = useState({
    nom_formation: '',
    duree_minutes: 60,
    date_souhaitee: '',
    heure_souhaitee: '',
    nb_max_participants: '',
    lieu: '',
    description: '',
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [activeTab, setActiveTab] = useState('calendrier');
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showMyCodeModal, setShowMyCodeModal] = useState(false);
  const [myCode, setMyCode] = useState(null);

  const handleAccessAdminSuccess = () => {
    setCrossAccessAdmin();
    navigate('/admin');
  };

  const handleShowMyCode = async () => {
    const { data } = await supabase.from('formateur_profiles').select('code_acces_admin').eq('id', user?.id).single();
    setMyCode(data?.code_acces_admin);
    setShowMyCodeModal(true);
  };

  const loadData = useCallback(async () => {
    if (!formateurId) return;
    setLoading(true);
    try {
      const { year, month } = viewDate;
      const startOfMonth = new Date(year, month, 1).toISOString().slice(0, 10);
      const endOfMonth = new Date(year, month + 1, 0).toISOString().slice(0, 10);

      const [actRes, resRes, reqRes, allReqRes, notifRes] = await Promise.all([
        supabase
          .from('activities')
          .select('id, nom, date_debut, heure_debut, lieu, activity_types(nom)')
          .eq('formateur_id', formateurId)
          .eq('actif', true)
          .gte('date_debut', startOfMonth)
          .lte('date_debut', endOfMonth)
          .order('date_debut')
          .order('heure_debut'),
        supabase.from('reservations').select('*, activities(id, nom, date_debut, heure_debut, activity_types(nom))').order('created_at', { ascending: false }),
        supabase.from('formateur_reservation_requests').select('*').eq('formateur_id', formateurId).order('created_at', { ascending: false }).then((r) => r).catch(() => ({ data: [] })),
        supabase.from('formateur_reservation_requests').select('*, formateurs(nom_complet)').order('date_souhaitee').order('heure_souhaitee').then((r) => r).catch(() => ({ data: [] })),
        supabase.from('formateur_notifications').select('*').eq('formateur_id', formateurId).order('created_at', { ascending: false }).limit(20).then((r) => r).catch(() => ({ data: [] })),
      ]);

      const myActivityIds = new Set((actRes.data || []).map((a) => a.id));
      const myReservations = (resRes.data || []).filter((r) => myActivityIds.has(r.activity_id));

      setActivities(actRes.data || []);
      setReservations(myReservations);
      setReservationRequests(reqRes.data || []);
      setAllRequests(allReqRes.data || []);
      setNotifications(notifRes.data || []);
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
    pending: reservationRequests.filter((r) => r.statut === 'pending'),
    approved: reservationRequests.filter((r) => r.statut === 'approved'),
    rejected: reservationRequests.filter((r) => r.statut === 'rejected'),
    alternative_proposed: reservationRequests.filter((r) => r.statut === 'alternative_proposed'),
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/formateur/login');
  };

  async function handleSubmitRequest(e) {
    e.preventDefault();
    if (!formateurId) return;
    setSubmittingRequest(true);
    try {
      const { error } = await supabase.from('formateur_reservation_requests').insert({
        formateur_id: formateurId,
        nom_formation: requestForm.nom_formation.trim(),
        duree_minutes: Number(requestForm.duree_minutes) || 60,
        date_souhaitee: requestForm.date_souhaitee,
        heure_souhaitee: requestForm.heure_souhaitee || null,
        nb_max_participants: requestForm.nb_max_participants ? Number(requestForm.nb_max_participants) : null,
        lieu: requestForm.lieu?.trim() || null,
        description: requestForm.description?.trim() || null,
      });
      if (error) throw error;
      setRequestForm({ nom_formation: '', duree_minutes: 60, date_souhaitee: '', heure_souhaitee: '', nb_max_participants: '', lieu: '', description: '' });
      loadData();
      toast.success('Demande envoyée à l\'administrateur. Vous recevrez une notification.');
    } catch (err) {
      toast.error(err?.message || 'Erreur');
    } finally {
      setSubmittingRequest(false);
    }
  }

  async function markNotificationRead(id) {
    await supabase.from('formateur_notifications').update({ lu: true }).eq('id', id);
    loadData();
  }

  const nomComplet = formateurData?.nom_complet || adminProfile?.nom_complet || 'Formateur';
  const isAdminViewingFormateur = isAdmin && getCrossAccessFormateur();

  if (!formateurId && !isAdminViewingFormateur) {
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
      <AccessCodeModal
        show={showAccessModal}
        onHide={() => setShowAccessModal(false)}
        title="Accès dashboard Secrétaire"
        subtitle="Entrez votre code d'accès personnel (donné à l'inscription) pour accéder au tableau de bord administration."
        verify={verifyCodeForAdminAccess}
        onSuccess={handleAccessAdminSuccess}
        onError={(msg) => toast.error(msg)}
      />
      {showMyCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound size={24} className="text-indigo-600" />
              <h3 className="font-bold text-slate-800">Votre code d&apos;accès</h3>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              Ce code vous permet d&apos;accéder au dashboard Secrétaire depuis le menu.
            </p>
            <div className="text-center p-4 bg-indigo-50 rounded-xl mb-4">
              <p className="text-2xl font-bold text-indigo-700" style={{ letterSpacing: 6 }}>{myCode || '-'}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowMyCodeModal(false)}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center text-white font-bold">
              {nomComplet.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Espace Formateur</h1>
              <p className="text-sm text-slate-500">{nomComplet}{isAdminViewingFormateur ? ' (mode secrétaire)' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdminViewingFormateur ? (
              <button
                onClick={() => { sessionStorage.removeItem('crossAccessFormateur'); navigate('/admin'); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <FileCheck size={18} />
                Retour au dashboard Secrétaire
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShowMyCode}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm"
                  title="Voir mon code d'accès"
                >
                  <KeyRound size={16} />
                  Mon code
                </button>
                <button
                  onClick={() => setShowAccessModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <FileCheck size={18} />
                  Accéder au dashboard Secrétaire
                </button>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            >
              <LogOut size={18} />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {isAdminViewingFormateur && (
          <div className="mb-6 p-4 rounded-xl bg-primary-50 border border-primary-100 text-primary-800 text-sm">
            Vous consultez l&apos;interface formateur en mode secrétaire. Les réservations affichées sont vides car vous n&apos;êtes pas lié à un formateur.
          </div>
        )}
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {['pending', 'approved', 'rejected', 'alternative_proposed'].map((status) => {
            const cfg = REQUEST_STATUT[status] || STATUT_CONFIG[status] || REQUEST_STATUT.pending;
            const count = (byStatus[status] || []).length;
            return (
              <div
                key={status}
                className={`${cfg.bg} ${cfg.text} ${cfg.border || 'border-slate-100'} rounded-2xl p-4 border`}
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

        {/* Notifications */}
        {notifications.filter((n) => !n.lu).length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
            <h3 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
              <Bell size={20} /> Notifications ({notifications.filter((n) => !n.lu).length})
            </h3>
            <div className="space-y-2">
              {notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={`p-3 rounded-lg cursor-pointer ${n.lu ? 'bg-white' : 'bg-indigo-100/50'} border border-indigo-100`}
                >
                  <p className="font-medium text-slate-800">{n.titre || n.type}</p>
                  <p className="text-sm text-slate-600">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString('fr-FR')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('demande')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'demande' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Plus size={18} className="inline mr-2 -mt-0.5" />
            Nouvelle réservation
          </button>
          <button
            onClick={() => setActiveTab('calendrier')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'calendrier' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <CalendarIcon size={18} className="inline mr-2 -mt-0.5" />
            Calendrier
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'reservations' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <TrendingUp size={18} className="inline mr-2 -mt-0.5" />
            Mes demandes
          </button>
          <button
            onClick={() => setActiveTab('vue-generale')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'vue-generale' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <LayoutGrid size={18} className="inline mr-2 -mt-0.5" />
            Vue générale
          </button>
        </div>

        {activeTab === 'demande' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Formulaire de réservation</h2>
            <p className="text-slate-500 text-sm mb-6">Soumettez votre demande. L&apos;administrateur validera selon la disponibilité.</p>
            <form onSubmit={handleSubmitRequest} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nom de la formation *</label>
                <input
                  type="text"
                  value={requestForm.nom_formation}
                  onChange={(e) => setRequestForm({ ...requestForm, nom_formation: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="Ex: Pratiques Réseaux"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Durée (minutes) *</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={requestForm.duree_minutes}
                    onChange={(e) => setRequestForm({ ...requestForm, duree_minutes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nombre max participants</label>
                  <input
                    type="number"
                    min={1}
                    value={requestForm.nb_max_participants}
                    onChange={(e) => setRequestForm({ ...requestForm, nb_max_participants: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="Ex: 30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date souhaitée *</label>
                  <input
                    type="date"
                    value={requestForm.date_souhaitee}
                    onChange={(e) => setRequestForm({ ...requestForm, date_souhaitee: e.target.value })}
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Heure souhaitée</label>
                  <input
                    type="time"
                    value={requestForm.heure_souhaitee}
                    onChange={(e) => setRequestForm({ ...requestForm, heure_souhaitee: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lieu</label>
                <input
                  type="text"
                  value={requestForm.lieu}
                  onChange={(e) => setRequestForm({ ...requestForm, lieu: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="Ex: Salle du Numérique"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Autres informations</label>
                <textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="Précisions, matériel nécessaire..."
                />
              </div>
              <button
                type="submit"
                disabled={submittingRequest}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                <Send size={18} /> Envoyer à l&apos;administrateur
              </button>
            </form>
          </div>
        )}

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
            <h2 className="text-lg font-semibold text-slate-800">Mes demandes de réservation</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : reservationRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">Aucune demande. Utilisez l&apos;onglet &quot;Nouvelle réservation&quot;.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reservationRequests.map((r) => {
                  const cfg = REQUEST_STATUT[r.statut] || REQUEST_STATUT.pending;
                  return (
                    <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">{r.nom_formation}</p>
                          <p className="text-sm text-slate-500">{r.date_souhaitee} {r.heure_souhaitee ? String(r.heure_souhaitee).slice(0, 5) : ''} • {r.duree_minutes} min</p>
                          {r.nb_max_participants && <p className="text-xs text-slate-400">Max {r.nb_max_participants} participants</p>}
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${cfg.bg} ${cfg.text}`}>
                          <cfg.Icon size={16} />
                          <span className="text-sm font-medium">{cfg.label}</span>
                        </div>
                      </div>
                      {r.message_admin && <p className="mt-2 text-sm text-slate-600">{r.message_admin}</p>}
                      {r.statut === 'alternative_proposed' && r.date_alternative_proposee && (
                        <p className="mt-2 text-sm text-blue-600">Date proposée : {r.date_alternative_proposee} {r.heure_alternative_proposee ? String(r.heure_alternative_proposee).slice(0, 5) : ''}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'vue-generale' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Vue générale des réservations</h2>
            <p className="text-slate-500 text-sm">Toutes les demandes de réservation pour planifier vos créneaux.</p>
            {allRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <LayoutGrid size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">Aucune réservation enregistrée.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4">Formateur</th>
                      <th className="text-left py-3 px-4">Formation</th>
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Heure</th>
                      <th className="text-left py-3 px-4">Durée</th>
                      <th className="text-left py-3 px-4">Participants</th>
                      <th className="text-left py-3 px-4">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRequests.map((r) => {
                      const cfg = REQUEST_STATUT[r.statut] || REQUEST_STATUT.pending;
                      return (
                        <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium">{r.formateurs?.nom_complet || '-'}</td>
                          <td className="py-3 px-4">{r.nom_formation}</td>
                          <td className="py-3 px-4">{r.date_souhaitee}</td>
                          <td className="py-3 px-4">{r.heure_souhaitee ? String(r.heure_souhaitee).slice(0, 5) : '-'}</td>
                          <td className="py-3 px-4">{r.duree_minutes} min</td>
                          <td className="py-3 px-4">{r.nb_max_participants || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${cfg.bg} ${cfg.text}`}>
                              <cfg.Icon size={12} /> {cfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
