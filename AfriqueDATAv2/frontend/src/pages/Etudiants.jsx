import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';

const PAGE_SIZE = 10;

export default function Etudiants() {
  const [students, setStudents] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [facultes, setFacultes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [form, setForm] = useState({
    faculty_id: '',
    promotion_id: '',
    matricule: '',
    nom_complet: '',
    telephone: '',
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [stuRes, promRes, facRes] = await Promise.all([
      supabase.from('students').select('*, promotions(nom, faculty_id, faculties(nom))').order('nom_complet'),
      supabase.from('promotions').select('id, nom, faculty_id, faculties(nom)').order('nom'),
      supabase.from('faculties').select('id, nom').order('nom'),
    ]);
    setStudents(stuRes.data || []);
    setPromotions(promRes.data || []);
    setFacultes(facRes.data || []);
    setLoading(false);
  }

  const promotionsByFaculty = useMemo(() => {
    if (!form.faculty_id) return promotions;
    return promotions.filter((p) => p.faculty_id === form.faculty_id);
  }, [promotions, form.faculty_id]);

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        (s.nom_complet || '').toLowerCase().includes(q) ||
        (s.matricule || '').toLowerCase().includes(q) ||
        (s.promotions?.nom || '').toLowerCase().includes(q) ||
        (s.promotions?.faculties?.nom || '').toLowerCase().includes(q) ||
        (s.telephone || '').includes(q)
    );
  }, [students, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        promotion_id: form.promotion_id,
        matricule: form.matricule,
        nom_complet: form.nom_complet,
        telephone: form.telephone || null,
        email: null,
        updated_at: new Date().toISOString(),
      };
      if (modal.item) {
        await supabase.from('students').update(payload).eq('id', modal.item.id);
        toast.success('Étudiant modifié');
      } else {
        await supabase.from('students').insert([payload]);
        toast.success('Étudiant ajouté');
      }
      setModal({ open: false, item: null });
      setForm({ faculty_id: '', promotion_id: '', matricule: '', nom_complet: '', telephone: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cet étudiant ?')) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Étudiant supprimé');
      loadData();
    }
  }

  function openEdit(s) {
    setForm({
      faculty_id: s.promotions?.faculty_id || '',
      promotion_id: s.promotion_id,
      matricule: s.matricule,
      nom_complet: s.nom_complet,
      telephone: s.telephone || '',
    });
    setModal({ open: true, item: s });
  }

  function openAdd() {
    const fid = facultes[0]?.id || '';
    const pid = promotions.find((p) => p.faculty_id === fid)?.id || '';
    setForm({
      faculty_id: fid,
      promotion_id: pid,
      matricule: '',
      nom_complet: '',
      telephone: '',
    });
    setModal({ open: true, item: null });
  }

  useEffect(() => {
    if (modal.open && form.faculty_id) {
      const valid = promotionsByFaculty.some((p) => p.id === form.promotion_id);
      if (!valid && promotionsByFaculty.length > 0) {
        setForm((f) => ({ ...f, promotion_id: promotionsByFaculty[0].id }));
      }
    }
  }, [form.faculty_id, form.promotion_id, modal.open, promotionsByFaculty]);

  const columns = [
    { key: 'nom_complet', label: 'Nom', render: (s) => <span className="font-medium text-slate-800">{s.nom_complet}</span> },
    { key: 'faculty', label: 'Faculté', render: (s) => s.promotions?.faculties?.nom || '-' },
    { key: 'promotion', label: 'Promotion', render: (s) => s.promotions?.nom || '-' },
    { key: 'telephone', label: 'Téléphone', render: (s) => s.telephone || '-' },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => openEdit(s)}
            className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(s.id)}
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
        <h1 className="text-2xl font-bold text-slate-800">Étudiants</h1>
        <p className="text-slate-500 text-sm mt-1">Inscrits par faculté et promotion</p>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        searchPlaceholder="Rechercher par nom, matricule, faculté, promotion ou téléphone..."
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        page={page}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={setPage}
        emptyMessage="Aucun étudiant."
      />

      <button
        onClick={openAdd}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all flex items-center justify-center z-40"
        title="Ajouter un étudiant"
      >
        <Plus className="w-6 h-6" />
      </button>

      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, item: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">{modal.item ? 'Modifier l\'étudiant' : 'Nouvel étudiant'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet</label>
                <input
                  type="text"
                  value={form.nom_complet}
                  onChange={(e) => setForm({ ...form, nom_complet: e.target.value })}
                  required
                  className="input-field"
                  placeholder="Prénom Nom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Matricule</label>
                <input
                  type="text"
                  value={form.matricule}
                  onChange={(e) => setForm({ ...form, matricule: e.target.value })}
                  required
                  className="input-field"
                  placeholder="ex: UNI12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Faculté</label>
                <select
                  value={form.faculty_id}
                  onChange={(e) => {
                    const fid = e.target.value;
                    const first = promotions.find((p) => p.faculty_id === fid);
                    setForm({ ...form, faculty_id: fid, promotion_id: first?.id || '' });
                  }}
                  required
                  className="input-field"
                >
                  <option value="">-- Sélectionner --</option>
                  {facultes.map((f) => (
                    <option key={f.id} value={f.id}>{f.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Promotion</label>
                <select
                  value={form.promotion_id}
                  onChange={(e) => setForm({ ...form, promotion_id: e.target.value })}
                  required
                  className="input-field"
                >
                  <option value="">-- Sélectionner --</option>
                  {promotionsByFaculty.map((p) => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  className="input-field"
                  placeholder="+243 XXX XXX XXX"
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
