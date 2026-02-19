import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TypesActivite() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [form, setForm] = useState({ nom: '', parent_id: '' });

  useEffect(() => {
    loadTypes();
  }, []);

  async function loadTypes() {
    const { data } = await supabase.from('activity_types').select('*').order('nom');
    setTypes(data || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = { nom: form.nom, parent_id: form.parent_id || null, updated_at: new Date().toISOString() };
      if (modal.item) {
        await supabase.from('activity_types').update(payload).eq('id', modal.item.id);
        toast.success('Type modifié');
      } else {
        await supabase.from('activity_types').insert([payload]);
        toast.success('Type ajouté');
      }
      setModal({ open: false });
      setForm({ nom: '', parent_id: '' });
      loadTypes();
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce type ?')) return;
    const { error } = await supabase.from('activity_types').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Type supprimé'); loadTypes(); }
  }

  const parents = types.filter((t) => !t.parent_id);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Types d'activité</h1>
          <p className="text-slate-500 text-sm mt-1">Catégories et sous-catégories des activités</p>
        </div>
        <button onClick={() => { setForm({ nom: '', parent_id: '' }); setModal({ open: true, item: null }); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>
      <div className="card-table overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/80 text-left text-sm text-slate-600">
              <tr>
                <th className="px-6 py-3 font-medium">Nom</th>
                <th className="px-6 py-3 font-medium">Sous-type de</th>
                <th className="px-6 py-3 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {types.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{t.nom}</td>
                  <td className="px-6 py-4 text-slate-600">{types.find((x) => x.id === t.parent_id)?.nom || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => { setForm({ nom: t.nom, parent_id: t.parent_id || '' }); setModal({ open: true, item: t }); }} className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Modifier"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {types.length === 0 && <p className="text-center py-12 text-slate-400 text-sm">Aucun type d'activité.</p>}
      </div>
      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">{modal.item ? 'Modifier le type' : 'Nouveau type'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-2">Nom</label><input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required className="input-field" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-2">Sous-type de</label><select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="input-field"><option value="">Aucun (type principal)</option>{parents.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}</select></div>
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
