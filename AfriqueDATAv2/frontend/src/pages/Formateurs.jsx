import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { createFormateurAccess } from '../lib/createFormateur';
import { Plus, Pencil, Trash2, Users, KeyRound, QrCode, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

const TYPE_FORMATEUR = { formateur: 'Formateur', enseignant: 'Enseignant', assistant: 'Assistant' };

export default function Formateurs() {
  const [formateurs, setFormateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [form, setForm] = useState({ nom_complet: '', email: '', telephone: '', type: 'formateur', specialite: '', password: '' });
  const [activateModal, setActivateModal] = useState({ open: false, item: null, password: '' });
  const [generatedLink, setGeneratedLink] = useState(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [formRes, profileRes] = await Promise.all([
        supabase.from('formateurs').select('*').eq('actif', true).order('nom_complet'),
        supabase.from('formateur_profiles').select('formateur_id'),
      ]);
      const formateursData = formRes.data || [];
      const hasAccessIds = new Set((profileRes.data || []).map((p) => p.formateur_id));
      setFormateurs(formateursData.map((f) => ({ ...f, hasAccess: hasAccessIds.has(f.id) })));
    } catch {
      setFormateurs([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        nom_complet: form.nom_complet.trim(),
        email: form.email?.trim() || null,
        telephone: form.telephone?.trim() || null,
        type: form.type || 'formateur',
        specialite: form.specialite?.trim() || null,
      };
      if (modal.item) {
        await supabase.from('formateurs').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', modal.item.id);
        toast.success('Formateur modifié');
      } else {
        await supabase.from('formateurs').insert([payload]);
        toast.success('Formateur ajouté');
      }
      setModal({ open: false, item: null });
      setForm({ nom_complet: '', email: '', telephone: '', type: 'formateur', specialite: '', password: '' });
      loadData();
    } catch (err) {
      toast.error(err?.message || 'Erreur');
    }
  }

  async function handleActivate(e) {
    e.preventDefault();
    const item = activateModal.item;
    if (!item?.email || !activateModal.password) {
      toast.error('Email et mot de passe requis.');
      return;
    }
    setActivating(true);
    try {
      const { loginUrl } = await createFormateurAccess(item.id, item.email, activateModal.password);
      setGeneratedLink(loginUrl);
      setActivateModal({ open: false, item: null, password: '' });
      toast.success('Accès activé ! Transmettez le lien et le mot de passe au formateur.');
      loadData();
    } catch (err) {
      toast.error(err?.message || 'Erreur');
    } finally {
      setActivating(false);
    }
  }

  async function handleDelete(formateurId) {
    if (!window.confirm('Désactiver ce formateur ?')) return;
    const { error } = await supabase.from('formateurs').update({ actif: false, updated_at: new Date().toISOString() }).eq('id', formateurId);
    if (error) toast.error(error.message);
    else {
      toast.success('Formateur désactivé');
      loadData();
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-5">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold">Formateurs / Enseignants</h1>
          <p className="text-muted small mb-0">Gestion des formateurs indépendants – non liés à une faculté</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm({ nom_complet: '', email: '', telephone: '', type: 'formateur', specialite: '' });
            setModal({ open: true, item: null });
          }}
          className="btn btn-primary d-flex align-items-center gap-2"
        >
          <Plus size={18} /> Nouveau formateur
        </button>
      </div>

      <div className="row g-3">
        {formateurs.length === 0 ? (
          <div className="col-12">
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <Users size={48} className="text-slate-300 mb-3" />
              <p className="text-slate-500 mb-0">Aucun formateur. Cliquez sur &quot;Nouveau formateur&quot; pour ajouter.</p>
            </div>
          </div>
        ) : (
          formateurs.map((f) => (
            <div key={f.id} className="col-12 col-md-6 col-lg-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm h-100">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="fw-semibold text-slate-800 mb-1">{f.nom_complet}</p>
                    <span className="badge bg-primary bg-opacity-10 text-primary">{TYPE_FORMATEUR[f.type] || f.type}</span>
                    {f.email && <p className="text-muted small mt-2 mb-0">{f.email}</p>}
                    {f.telephone && <p className="text-muted small mb-0">{f.telephone}</p>}
                    {f.specialite && <p className="text-slate-500 small mt-1 mb-0">{f.specialite}</p>}
                  </div>
                  <div className="d-flex gap-1 flex-wrap">
                    {!f.hasAccess && f.email && (
                      <button
                        type="button"
                        onClick={() => setActivateModal({ open: true, item: f, password: '' })}
                        className="btn btn-sm btn-success d-flex align-items-center gap-1"
                        title="Activer l'accès et générer lien/QR"
                      >
                        <KeyRound size={14} /> Activer
                      </button>
                    )}
                    {f.hasAccess && (
                      <span className="badge bg-success me-1">Accès activé</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setForm({
                          nom_complet: f.nom_complet,
                          email: f.email || '',
                          telephone: f.telephone || '',
                          type: f.type || 'formateur',
                          specialite: f.specialite || '',
                        });
                        setModal({ open: true, item: f });
                      }}
                      className="btn btn-sm btn-outline-secondary p-1"
                    >
                      <Pencil size={16} />
                    </button>
                    <button type="button" onClick={() => handleDelete(f.id)} className="btn btn-sm btn-outline-danger p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Activer */}
      {activateModal.open && (
        <div className="modal-overlay" onClick={() => setActivateModal({ open: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Activer l&apos;accès formateur</h2>
            <p className="text-muted small mb-3">
              Définissez un mot de passe pour <strong>{activateModal.item?.nom_complet}</strong> ({activateModal.item?.email}). Un lien de connexion sera généré.
            </p>
            <form onSubmit={handleActivate}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Mot de passe *</label>
                <input
                  type="password"
                  value={activateModal.password}
                  onChange={(e) => setActivateModal({ ...activateModal, password: e.target.value })}
                  required
                  minLength={6}
                  className="input-field"
                  placeholder="Minimum 6 caractères"
                />
              </div>
              <div className="d-flex gap-3 justify-content-end">
                <button type="button" onClick={() => setActivateModal({ open: false })} className="btn btn-outline-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={activating}>
                  {activating ? 'Activation...' : 'Activer et générer le lien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lien / QR généré */}
      {generatedLink && (
        <div className="modal-overlay" onClick={() => setGeneratedLink(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h2 className="text-lg font-semibold mb-4 d-flex align-items-center gap-2">
              <QrCode size={24} /> Lien et QR code générés
            </h2>
            <p className="text-muted small mb-3">Transmettez ce lien et le mot de passe au formateur. Il pourra se connecter.</p>
            <div className="d-flex gap-3 align-items-start mb-4">
              <div className="bg-white p-3 rounded border">
                <QRCodeSVG value={generatedLink} size={120} level="M" />
              </div>
              <div className="flex-grow-1">
                <input readOnly value={generatedLink} className="form-control form-control-sm mb-2" />
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(generatedLink); toast.success('Lien copié'); }}
                  className="btn btn-sm btn-outline-primary"
                >
                  <Copy size={14} className="me-1" /> Copier
                </button>
              </div>
            </div>
            <button type="button" onClick={() => setGeneratedLink(null)} className="btn btn-primary w-100">Fermer</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{modal.item ? 'Modifier le formateur' : 'Nouveau formateur'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom complet *</label>
                <input
                  type="text"
                  value={form.nom_complet}
                  onChange={(e) => setForm({ ...form, nom_complet: e.target.value })}
                  required
                  className="input-field"
                  placeholder="Prénom et nom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                  <option value="formateur">Formateur</option>
                  <option value="enseignant">Enseignant</option>
                  <option value="assistant">Assistant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="email@unilu.cd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  className="input-field"
                  placeholder="+243..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Spécialité</label>
                <input
                  type="text"
                  value={form.specialite}
                  onChange={(e) => setForm({ ...form, specialite: e.target.value })}
                  className="input-field"
                  placeholder="ex: Informatique, Réseaux"
                />
              </div>
              <div className="d-flex gap-3 justify-content-end">
                <button type="button" onClick={() => setModal({ open: false })} className="btn btn-outline-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
