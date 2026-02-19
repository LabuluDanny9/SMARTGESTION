import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Visiteurs() {
  const [visiteurs, setVisiteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [form, setForm] = useState({ nom_complet: '', email: '', telephone: '', institution: '' });

  useEffect(() => {
    loadVisiteurs();
  }, []);

  async function loadVisiteurs() {
    const { data } = await supabase.from('visitors').select('*').order('nom_complet');
    setVisiteurs(data || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (modal.item) {
        await supabase.from('visitors').update({
          ...form,
          updated_at: new Date().toISOString(),
        }).eq('id', modal.item.id);
        toast.success('Visiteur modifié');
      } else {
        await supabase.from('visitors').insert([form]);
        toast.success('Visiteur ajouté');
      }
      setModal({ open: false, item: null });
      setForm({ nom_complet: '', email: '', telephone: '', institution: '' });
      loadVisiteurs();
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce visiteur ?')) return;
    const { error } = await supabase.from('visitors').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Visiteur supprimé');
      loadVisiteurs();
    }
  }

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
          <h1 className="text-2xl font-bold text-slate-800">Visiteurs</h1>
          <p className="text-slate-500 text-sm mt-1">Visiteurs externes pré-enregistrés</p>
        </div>
        <button
          onClick={() => {
            setForm({ nom_complet: '', email: '', telephone: '', institution: '' });
            setModal({ open: true, item: null });
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>
      <div className="card-table overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/80 text-left text-sm text-slate-600">
              <tr>
                <th className="px-6 py-3 font-medium">Nom</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Téléphone</th>
                <th className="px-6 py-3 font-medium">Institution</th>
                <th className="px-6 py-3 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visiteurs.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{v.nom_complet}</td>
                  <td className="px-6 py-4 text-slate-600">{v.email || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{v.telephone || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{v.institution || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => { setForm(v); setModal({ open: true, item: v }); }} className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Modifier"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visiteurs.length === 0 && (
          <p className="text-center py-12 text-slate-400 text-sm">Aucun visiteur pré-enregistré.</p>
        )}
      </div>

      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, item: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">{modal.item ? 'Modifier le visiteur' : 'Nouveau visiteur'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-2">Nom complet</label><input type="text" value={form.nom_complet} onChange={(e) => setForm({ ...form, nom_complet: e.target.value })} required className="input-field" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-2">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label><input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-2">Institution</label><input type="text" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="Université, entreprise..." className="input-field" /></div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setModal({ open: false })} className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
