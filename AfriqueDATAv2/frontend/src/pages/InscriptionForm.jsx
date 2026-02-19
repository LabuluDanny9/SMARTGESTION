import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle } from 'lucide-react';

export default function InscriptionForm() {
  const { activityId } = useParams();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    nom_complet: '',
    montant: '',
    type_participant: 'etudiant',
  });

  useEffect(() => {
    loadData();
  }, [activityId]);

  useEffect(() => {
    if (activity?.prix_default != null && Number(activity.prix_default) >= 0) {
      setForm((f) => ({ ...f, montant: String(activity.prix_default) }));
    }
  }, [activity]);

  async function loadData() {
    const { data: act } = await supabase
      .from('activities')
      .select('*, activity_types(nom), promotions(faculty_id)')
      .eq('id', activityId)
      .eq('actif', true)
      .single();
    const countRes = act ? await supabase.from('participations').select('id', { count: 'exact', head: true }).eq('activity_id', activityId) : null;
    const count = countRes?.count ?? 0;
    setActivity(act ? { ...act, _participationCount: count } : null);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const capacite = activity?.capacite;
      const count = activity?._participationCount ?? 0;
      if (capacite != null && count >= capacite) {
        setSubmitting(false);
        alert('L\'activité a atteint sa capacité maximale. Inscription impossible.');
        return;
      }
      const nom = form.nom_complet.trim();
      const { data: existing } = await supabase
        .from('participations')
        .select('id')
        .eq('activity_id', activityId)
        .ilike('nom_complet', nom)
        .limit(1);
      if (existing?.length) {
        setSubmitting(false);
        alert(`Une inscription existe déjà pour "${nom}" sur cette activité.`);
        return;
      }
      const activityFacultyId = activity?.faculty_id || activity?.promotions?.faculty_id;
      const { error } = await supabase.from('participations').insert([
        {
          activity_id: activityId,
          nom_complet: nom,
          faculty_id: activityFacultyId || null,
          type_participant: form.type_participant || 'etudiant',
          montant: parseFloat(form.montant) || 0,
        },
      ]);
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      setSubmitting(false);
      alert(err.message || "Erreur lors de l'inscription");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-sm text-center">
          <h1 className="text-xl font-bold text-slate-800">Activité introuvable</h1>
          <p className="text-slate-500 mt-2 text-sm">Ce lien n'est plus valide ou l'activité a été désactivée.</p>
        </div>
      </div>
    );
  }

  const capacite = activity?.capacite;
  const partCount = activity?._participationCount ?? 0;
  const isFull = capacite != null && partCount >= capacite;

  /* Confirmation screen */
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Inscription enregistrée</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Vos informations ont été transmises au secrétariat.
          </p>
          <p className="text-slate-600 font-medium mt-4">{activity.nom}</p>
          <p className="text-slate-400 text-xs mt-1">
            {activity.activity_types?.nom} • {activity.date_debut}
          </p>
          <p className="text-slate-400 text-xs mt-6">SMART GESTION – Salle du Numérique UNILU</p>
        </div>
      </div>
    );
  }

  /* Registration form */
  return (
    <div className="min-h-screen bg-slate-50 pb-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo-salle-numerique.png" alt="Salle du Numérique" className="w-16 h-16 mx-auto mb-3 object-contain" />
          <h1 className="text-lg font-bold text-slate-800">SMART GESTION</h1>
          <p className="text-slate-500 text-sm mt-1">Salle du Numérique – UNILU</p>
          <div className={`mt-4 p-4 rounded-2xl border ${isFull ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Activité</p>
            <p className="font-semibold text-slate-800 mt-1">{activity.nom}</p>
            <p className="text-sm text-slate-500 mt-0.5">
              {activity.activity_types?.nom} • {activity.date_debut} {activity.heure_debut}
            </p>
            {capacite != null && (
              <p className={`text-sm mt-2 font-medium ${isFull ? 'text-amber-600' : 'text-slate-600'}`}>
                Places : {partCount} sur {capacite}
              </p>
            )}
          </div>
        </div>

        {/* Form - Nom complet, type, paiement */}
        {isFull ? (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center">
            <p className="font-medium text-amber-800">Inscriptions fermées</p>
            <p className="text-sm text-amber-700 mt-1">L'activité a atteint sa capacité maximale.</p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Type de participant</label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 has-[:checked]:text-primary-700 border-slate-200">
                <input
                  type="radio"
                  name="type"
                  value="etudiant"
                  checked={form.type_participant === 'etudiant'}
                  onChange={() => setForm({ ...form, type_participant: 'etudiant' })}
                  className="sr-only"
                />
                <span className="font-medium">Étudiant</span>
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 has-[:checked]:text-primary-700 border-slate-200">
                <input
                  type="radio"
                  name="type"
                  value="visiteur"
                  checked={form.type_participant === 'visiteur'}
                  onChange={() => setForm({ ...form, type_participant: 'visiteur' })}
                  className="sr-only"
                />
                <span className="font-medium">Visiteur</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet *</label>
            <input
              type="text"
              value={form.nom_complet}
              onChange={(e) => setForm({ ...form, nom_complet: e.target.value })}
              required
              placeholder="Prénom et nom"
              className="w-full px-4 py-4 text-base rounded-2xl border-2 border-slate-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Montant payé (FC) * {activity?.prix_default > 0 && (
                <span className="text-slate-400 font-normal">(suggéré : {Number(activity.prix_default).toLocaleString()} FC)</span>
              )}
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={form.montant}
              onChange={(e) => setForm({ ...form, montant: e.target.value })}
              required
              placeholder={activity?.prix_default > 0 ? String(activity.prix_default) : '0'}
              className="w-full px-4 py-4 text-base rounded-2xl border-2 border-slate-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              inputMode="numeric"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 text-base font-semibold bg-primary-600 text-white rounded-2xl hover:bg-primary-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/25 mt-2"
          >
            {submitting ? 'Envoi...' : "Envoyer"}
          </button>
        </form>
        )}

        <p className="text-center text-xs text-slate-400 mt-8">
          Les données sont envoyées directement au secrétariat.
        </p>
      </div>
    </div>
  );
}
