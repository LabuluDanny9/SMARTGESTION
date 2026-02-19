import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';

const PAGE_SIZE = 10;

export default function Facultes() {
  const [facultes, setFacultes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [form, setForm] = useState({ nom: '', code: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadFacultes();
  }, []);

  async function loadFacultes() {
    const { data, error } = await supabase
      .from('faculties')
      .select('*')
      .order('nom');
    if (!error) setFacultes(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return facultes;
    const q = search.toLowerCase();
    return facultes.filter(
      (f) =>
        (f.nom || '').toLowerCase().includes(q) ||
        (f.code || '').toLowerCase().includes(q)
    );
  }, [facultes, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (modal.item) {
        await supabase
          .from('faculties')
          .update({ nom: form.nom, code: form.code || null, updated_at: new Date().toISOString() })
          .eq('id', modal.item.id);
        toast.success('Faculté modifiée');
      } else {
        await supabase.from('faculties').insert([form]);
        toast.success('Faculté ajoutée');
      }
      setModal({ open: false, item: null });
      setForm({ nom: '', code: '' });
      loadFacultes();
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette faculté ?')) return;
    const { error } = await supabase.from('faculties').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Faculté supprimée');
      loadFacultes();
    }
  }

  function openEdit(item) {
    setForm({ nom: item.nom, code: item.code || '' });
    setModal({ open: true, item });
  }

  const columns = [
    { key: 'nom', label: 'Nom', render: (f) => <span className="font-medium text-slate-800">{f.nom}</span> },
    { key: 'code', label: 'Code', render: (f) => f.code || '-' },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (f) => (
        <div className="flex gap-2 justify-end items-center">
          <Link to={`/facultes/${f.id}`} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Départements et promotions">
            <ChevronRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => openEdit(f)}
            className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(f.id)}
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
        <h1 className="text-2xl font-bold text-slate-800">Facultés</h1>
        <p className="text-slate-500 text-sm mt-1">Gérer les facultés de l'université</p>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        searchPlaceholder="Rechercher par nom ou code..."
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        page={page}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={setPage}
        emptyMessage="Aucune faculté. Cliquez sur le bouton + pour ajouter."
      />

      <button
        onClick={() => {
          setForm({ nom: '', code: '' });
          setModal({ open: true, item: null });
        }}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all flex items-center justify-center z-40"
        title="Ajouter une faculté"
      >
        <Plus className="w-6 h-6" />
      </button>

      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, item: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">{modal.item ? 'Modifier la faculté' : 'Nouvelle faculté'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nom</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  required
                  className="input-field"
                  placeholder="Ex: École Supérieure d'Informatique"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="ex: ESI"
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
