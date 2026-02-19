import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';

const PAGE_SIZE = 10;

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [facultes, setFacultes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [form, setForm] = useState({ faculty_id: '', department_id: '', nom: '', annee: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    let deptData = [];
    try {
      const { data, error } = await supabase.from('departments').select('id, faculty_id, nom').order('nom');
      deptData = error ? [] : (data || []);
    } catch {
      deptData = [];
    }
    const [promRes, facRes] = await Promise.all([
      supabase.from('promotions').select('*, faculties(nom), departments(nom)').order('nom'),
      supabase.from('faculties').select('id, nom').order('nom'),
    ]);
    setPromotions(promRes.data || []);
    setFacultes(facRes.data || []);
    setDepartments(deptData);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return promotions;
    const q = search.toLowerCase();
    return promotions.filter(
      (p) =>
        (p.nom || '').toLowerCase().includes(q) ||
        (p.faculties?.nom || '').toLowerCase().includes(q) ||
        String(p.annee || '').includes(q)
    );
  }, [promotions, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        faculty_id: form.faculty_id,
        department_id: form.department_id || null,
        nom: form.nom,
        annee: form.annee ? parseInt(form.annee) : null,
        updated_at: new Date().toISOString(),
      };
      if (modal.item) {
        await supabase.from('promotions').update(payload).eq('id', modal.item.id);
        toast.success('Promotion modifiée');
      } else {
        await supabase.from('promotions').insert([payload]);
        toast.success('Promotion ajoutée');
      }
      setModal({ open: false, item: null });
      setForm({ faculty_id: facultes[0]?.id || '', department_id: '', nom: '', annee: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette promotion ?')) return;
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Promotion supprimée');
      loadData();
    }
  }

  const deptsByFaculty = departments.filter((d) => d.faculty_id === form.faculty_id);

  const columns = [
    { key: 'nom', label: 'Nom', render: (p) => <span className="font-medium text-slate-800">{p.nom}</span> },
    { key: 'faculty', label: 'Faculté', render: (p) => p.faculties?.nom || '-' },
    { key: 'department', label: 'Département', render: (p) => p.departments?.nom || '-' },
    { key: 'annee', label: 'Année', render: (p) => p.annee || '-' },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
                setForm({ faculty_id: p.faculty_id, department_id: p.department_id || '', nom: p.nom, annee: p.annee || '' });
              setModal({ open: true, item: p });
            }}
            className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(p.id)}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Promotions</h1>
        <p className="text-slate-500 text-sm mt-1">Classes et niveaux par faculté</p>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        searchPlaceholder="Rechercher par nom, faculté ou année..."
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        page={page}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={setPage}
        emptyMessage="Aucune promotion."
      />

      <button
        onClick={() => {
          setForm({ faculty_id: facultes[0]?.id || '', department_id: '', nom: '', annee: new Date().getFullYear() });
          setModal({ open: true, item: null });
        }}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all flex items-center justify-center z-40"
        title="Ajouter une promotion"
      >
        <Plus className="w-6 h-6" />
      </button>

      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, item: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">{modal.item ? 'Modifier la promotion' : 'Nouvelle promotion'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Faculté</label>
                <select
                  value={form.faculty_id}
                  onChange={(e) => setForm({ ...form, faculty_id: e.target.value, department_id: '' })}
                  required
                  className="input-field"
                >
                  {facultes.map((f) => (
                    <option key={f.id} value={f.id}>{f.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Département</label>
                <select
                  value={form.department_id}
                  onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">-- Sélectionner --</option>
                  {deptsByFaculty.map((d) => (
                    <option key={d.id} value={d.id}>{d.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nom</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  required
                  placeholder="ex: L3 Informatique"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Année</label>
                <input
                  type="number"
                  value={form.annee}
                  onChange={(e) => setForm({ ...form, annee: e.target.value })}
                  placeholder="2024"
                  className="input-field"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setModal({ open: false, item: null })} className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  {modal.item ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
