import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getRegistrationUrl } from '../lib/registrationUrl';
import { Plus, FileSpreadsheet, FileText, ChevronRight, Copy, Pencil, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

export default function Activites() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [participationCounts, setParticipationCounts] = useState({});
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'form', item: null });
  const COTATIONS_PRESETS = [
    { label: 'Aucune', value: [] },
    { label: '0 à 20', value: Array.from({ length: 21 }, (_, i) => String(i)) },
    { label: '0 à 10', value: Array.from({ length: 11 }, (_, i) => String(i)) },
    { label: 'A, B, C, D, E', value: ['A', 'B', 'C', 'D', 'E'] },
    { label: 'Réussi, Échec', value: ['Réussi', 'Échec'] },
    { label: 'Satisfaisant, Non satisfaisant', value: ['Satisfaisant', 'Non satisfaisant'] },
    { label: 'Personnalisé', value: null },
  ];

  const [form, setForm] = useState({
    type_id: '',
    nom: '',
    date_debut: '',
    heure_debut: '09:00',
    duree_minutes: 60,
    capacite: '',
    prix_default: '',
    notes: '',
    cotations_preset: '',
    cotations_personnalise: '',
    faculty_id: '',
    department_id: '',
    promotion_id: '',
    formateur_id: '',
  });
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [formateurs, setFormateurs] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const editId = location.state?.editId;
    if (editId && activities.length > 0 && !modal.open) {
      const a = activities.find((x) => x.id === editId);
      if (a) {
        openEdit(a);
        navigate('/activites', { replace: true, state: {} });
      }
    }
  }, [location.state?.editId, activities]);

  async function loadData() {
    let deptData = [];
    try {
      const { data, error } = await supabase.from('departments').select('id, faculty_id, nom').order('nom');
      deptData = error ? [] : (data || []);
    } catch {
      deptData = [];
    }
    const [actRes, typeRes, partRes, facRes, promRes, formRes] = await Promise.all([
      supabase.from('activities').select('*, activity_types(nom), promotions(id, nom, department_id, faculty_id, departments(nom), faculties(nom))').order('date_debut', { ascending: false }),
      supabase.from('activity_types').select('id, nom, parent_id').order('nom'),
      supabase.from('participations').select('activity_id'),
      supabase.from('faculties').select('id, nom').order('nom'),
      supabase.from('promotions').select('id, department_id, faculty_id, nom').order('nom'),
      (async () => {
        try {
          const { data, error } = await supabase.from('formateurs').select('id, faculty_id, nom_complet, type').eq('actif', true).order('nom_complet');
          return error ? [] : (data || []);
        } catch {
          return [];
        }
      })(),
    ]);
    setActivities(actRes.data || []);
    setTypes(typeRes.data || []);
    setFaculties(facRes.data || []);
    setDepartments(deptData);
    setPromotions(promRes.data || []);
    setFormateurs(Array.isArray(formRes) ? formRes : (formRes?.data || []));

    const counts = {};
    (partRes.data || []).forEach((p) => {
      counts[p.activity_id] = (counts[p.activity_id] || 0) + 1;
    });
    setParticipationCounts(counts);
    setLoading(false);
  }

  const deptsByFaculty = departments.filter((d) => d.faculty_id === form.faculty_id);
  const promosByDept = promotions.filter((p) => p.department_id === form.department_id);
  const formateursByFaculty = formateurs.filter((f) => f.faculty_id === form.faculty_id);

  const typeOptions = types;

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const facultyId = form.promotion_id
        ? promotions.find((p) => p.id === form.promotion_id)?.faculty_id || form.faculty_id
        : form.faculty_id;
      let cotations = [];
      if (form.cotations_preset === 'Personnalisé' && form.cotations_personnalise?.trim()) {
        cotations = form.cotations_personnalise.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      } else if (form.cotations_preset) {
        const preset = COTATIONS_PRESETS.find((p) => p.label === form.cotations_preset);
        if (preset && Array.isArray(preset.value)) cotations = preset.value;
      }
      const payload = {
        type_id: form.type_id,
        nom: form.nom,
        date_debut: form.date_debut,
        heure_debut: form.heure_debut,
        duree_minutes: parseInt(form.duree_minutes) || 60,
        capacite: form.capacite ? parseInt(form.capacite) : null,
        prix_default: form.prix_default ? parseFloat(form.prix_default) : 0,
        notes: form.notes?.trim() || null,
        cotations: cotations,
        promotion_id: form.promotion_id || null,
        description: null,
        lieu: null,
        actif: true,
      };
      if (facultyId) payload.faculty_id = facultyId;
      if (form.formateur_id) payload.formateur_id = form.formateur_id;
      if (modal.item) {
        const { error } = await supabase.from('activities').update(payload).eq('id', modal.item.id);
        if (error) throw error;
        toast.success('Activité modifiée.');
        setModal({ open: false, mode: 'form', item: null });
      } else {
        const { data, error } = await supabase.from('activities').insert([payload]).select().single();
        if (error) throw error;
        toast.success('Activité créée ! QR Code généré.');
        setModal({ open: true, mode: 'qr', item: data });
      }
      setForm({ type_id: '', nom: '', date_debut: '', heure_debut: '09:00', duree_minutes: 60, capacite: '', prix_default: '', notes: '', cotations_preset: '', cotations_personnalise: '', faculty_id: '', department_id: '', promotion_id: '', formateur_id: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  }

  function openCreate() {
    setForm({
      type_id: typeOptions[0]?.id || '',
      nom: '',
      date_debut: new Date().toISOString().slice(0, 10),
      heure_debut: '09:00',
      duree_minutes: 60,
      capacite: '',
      prix_default: '',
      notes: '',
      cotations_preset: '',
      cotations_personnalise: '',
      faculty_id: faculties[0]?.id || '',
      department_id: '',
      promotion_id: '',
      formateur_id: '',
    });
    setModal({ open: true, mode: 'form', item: null });
  }

  function openEdit(a) {
    const promos = a.promotions || promotions.find((p) => p.id === a.promotion_id);
    const deptId = promos?.department_id || '';
    const facId = promos?.faculty_id || a.faculty_id || faculties[0]?.id || '';
    let cotationsPreset = '';
    let cotationsPersonnalise = '';
    if (Array.isArray(a.cotations) && a.cotations.length) {
      const preset = COTATIONS_PRESETS.find((p) => p.value && JSON.stringify(p.value) === JSON.stringify(a.cotations));
      cotationsPreset = preset ? preset.label : 'Personnalisé';
      if (cotationsPreset === 'Personnalisé') cotationsPersonnalise = a.cotations.join(', ');
    }
    setForm({
      type_id: a.type_id,
      nom: a.nom,
      date_debut: a.date_debut || '',
      heure_debut: a.heure_debut || '09:00',
      duree_minutes: a.duree_minutes || 60,
      capacite: a.capacite ? String(a.capacite) : '',
      prix_default: a.prix_default ? String(a.prix_default) : '',
      notes: a.notes || '',
      cotations_preset: cotationsPreset,
      cotations_personnalise: cotationsPersonnalise,
      faculty_id: facId,
      department_id: deptId,
      promotion_id: a.promotion_id || '',
      formateur_id: a.formateur_id || '',
    });
    setModal({ open: true, mode: 'form', item: a });
  }

  async function handleDelete(a, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Supprimer l'activité « ${a.nom} » ?\nLes inscriptions associées seront aussi supprimées.`)) return;
    try {
      const { error } = await supabase.from('activities').delete().eq('id', a.id);
      if (error) throw error;
      toast.success('Activité supprimée.');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  }

  const qrUrl = modal.item ? getRegistrationUrl(modal.item.id) : '';

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Activités</h1>
          <p className="text-slate-500 text-sm mt-1">Programmer et gérer les activités de la Salle du Numérique</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Nouvelle activité
        </button>
      </div>

      {/* Activity cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((a) => (
          <div
            key={a.id}
            className="group relative bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-primary-100 transition-all duration-200"
          >
            <Link to={`/activites/${a.id}`} className="block">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1 pr-8">
                  <h3 className="font-semibold text-slate-800 truncate">{a.nom}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{a.activity_types?.nom || '-'}{a.promotions && ` • ${a.promotions.nom}`}</p>
                  <p className="text-sm text-slate-600 mt-2">{a.date_debut} • {a.heure_debut}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 flex-shrink-0 absolute top-5 right-5" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                  {participationCounts[a.id] || 0} participant{(participationCounts[a.id] || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </Link>
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(a); }}
                className="p-2 rounded-lg text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                title="Modifier"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleDelete(a, e)}
                className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-400 text-sm">Aucune activité.</p>
          <button onClick={openCreate} className="mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm">
            Créer une activité →
          </button>
        </div>
      )}

      {/* Create / Edit modal */}
      {modal.open && modal.mode === 'form' && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, mode: 'form', item: null })}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              {modal.item ? 'Modifier l\'activité' : 'Nouvelle activité'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Titre</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  required
                  className="input-field"
                  placeholder="ex: Pratiques Informatique L3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Faculté</label>
                <div className="space-y-2">
                  <select
                    value={form.faculty_id}
                    onChange={(e) => setForm({ ...form, faculty_id: e.target.value, department_id: '', promotion_id: '', formateur_id: '' })}
                    className="input-field"
                    required
                  >
                    <option value="">-- Sélectionner une faculté --</option>
                    {faculties.map((f) => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                  {form.faculty_id && (
                    <select
                      value={form.department_id}
                      onChange={(e) => setForm({ ...form, department_id: e.target.value, promotion_id: '' })}
                      className="input-field"
                    >
                      <option value="">-- Département --</option>
                      {deptsByFaculty.map((d) => (
                        <option key={d.id} value={d.id}>{d.nom}</option>
                      ))}
                    </select>
                  )}
                  {form.department_id && (
                    <select
                      value={form.promotion_id}
                      onChange={(e) => setForm({ ...form, promotion_id: e.target.value })}
                      className="input-field"
                    >
                      <option value="">-- Promotion --</option>
                      {promosByDept.map((p) => (
                        <option key={p.id} value={p.id}>{p.nom}</option>
                      ))}
                    </select>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">Optionnel : cibler une promotion pour afficher la liste officielle</p>
              </div>
              {form.faculty_id && formateursByFaculty.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Formateur superviseur</label>
                  <select
                    value={form.formateur_id}
                    onChange={(e) => setForm({ ...form, formateur_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">-- Aucun --</option>
                    {formateursByFaculty.map((f) => (
                      <option key={f.id} value={f.id}>{f.nom_complet} ({f.type})</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Enseignant/formateur qui supervise cette pratique</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                <select
                  value={form.type_id}
                  onChange={(e) => setForm({ ...form, type_id: e.target.value })}
                  required
                  className="input-field"
                >
                  {typeOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                <input
                  type="date"
                  value={form.date_debut}
                  onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                  required
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Heure</label>
                  <input
                    type="time"
                    value={form.heure_debut}
                    onChange={(e) => setForm({ ...form, heure_debut: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Durée (min)</label>
                  <input
                    type="number"
                    value={form.duree_minutes}
                    onChange={(e) => setForm({ ...form, duree_minutes: e.target.value })}
                    min={1}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Capacité max</label>
                  <input
                    type="number"
                    value={form.capacite}
                    onChange={(e) => setForm({ ...form, capacite: e.target.value })}
                    min={1}
                    placeholder="Illimité"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Prix (FC)</label>
                  <input
                    type="number"
                    value={form.prix_default}
                    onChange={(e) => setForm({ ...form, prix_default: e.target.value })}
                    min={0}
                    step={100}
                    placeholder="0"
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Liste des cotations</label>
                <p className="text-xs text-slate-500 mb-2">Définir les notes possibles pour cette activité (avant génération de la liste)</p>
                <select
                  value={form.cotations_preset}
                  onChange={(e) => setForm({ ...form, cotations_preset: e.target.value })}
                  className="input-field"
                >
                  <option value="">-- Choisir ou personnaliser --</option>
                  {COTATIONS_PRESETS.map((p) => (
                    <option key={p.label} value={p.label}>{p.label}</option>
                  ))}
                </select>
                {form.cotations_preset === 'Personnalisé' && (
                  <input
                    type="text"
                    value={form.cotations_personnalise}
                    onChange={(e) => setForm({ ...form, cotations_personnalise: e.target.value })}
                    placeholder="Ex: 0, 1, 2, 3, ... 20 ou A, B, C"
                    className="input-field mt-2"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes internes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notes pour le secrétaire..."
                  rows={2}
                  className="input-field resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModal({ open: false, mode: 'form', item: null })}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  {modal.item ? 'Enregistrer les modifications' : 'Créer et générer QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR preview modal - after creation */}
      {modal.open && modal.mode === 'qr' && modal.item && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, mode: 'qr', item: null })}>
          <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-slate-800 mb-1">QR Code généré</h2>
              <p className="text-sm text-slate-500 mb-4">{modal.item.nom}</p>
              <div className="bg-white rounded-2xl border-2 border-slate-100 p-6 inline-block">
                <QRCodeSVG value={qrUrl} size={220} />
              </div>
              <p className="text-xs text-slate-400 mt-4 break-all px-2">{qrUrl}</p>
              <p className="text-sm text-slate-500 mt-2">Scannez pour ouvrir le formulaire d'enregistrement</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(qrUrl);
                  toast.success('Lien copié !');
                }}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg"
              >
                <Copy className="w-4 h-4" /> Copier le lien
              </button>
              <Link
                to={`/activites/${modal.item.id}`}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                Voir l'activité <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setModal({ open: false, mode: 'qr', item: null })}
                className="block w-full mt-3 text-sm text-slate-500 hover:text-slate-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
