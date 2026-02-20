import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Button, Modal, Form, Spinner } from 'react-bootstrap';
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
  const [submitting, setSubmitting] = useState(false);
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
        (p.departments?.nom || '').toLowerCase().includes(q) ||
        String(p.annee || '').includes(q)
    );
  }, [promotions, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  function openAdd() {
    const firstFacultyId = facultes[0]?.id || '';
    setForm({
      faculty_id: firstFacultyId,
      department_id: '',
      nom: '',
      annee: String(new Date().getFullYear()),
    });
    setModal({ open: true, item: null });
  }

  function openEdit(p) {
    setForm({
      faculty_id: p.faculty_id,
      department_id: p.department_id || '',
      nom: p.nom || '',
      annee: p.annee ? String(p.annee) : '',
    });
    setModal({ open: true, item: p });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.faculty_id?.trim()) {
      toast.error('Sélectionnez une faculté');
      return;
    }
    if (!form.nom?.trim()) {
      toast.error('Le nom est requis');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        faculty_id: form.faculty_id,
        department_id: form.department_id || null,
        nom: form.nom.trim(),
        annee: form.annee ? parseInt(form.annee, 10) : null,
        updated_at: new Date().toISOString(),
      };
      if (modal.item) {
        const { error } = await supabase.from('promotions').update(payload).eq('id', modal.item.id);
        if (error) throw error;
        toast.success('Promotion modifiée');
      } else {
        const { error } = await supabase.from('promotions').insert([payload]);
        if (error) throw error;
        toast.success('Promotion ajoutée');
      }
      setModal({ open: false, item: null });
      setForm({ faculty_id: '', department_id: '', nom: '', annee: '' });
      await loadData();
    } catch (err) {
      toast.error(err?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette promotion ? Les étudiants liés seront également supprimés.')) return;
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Promotion supprimée');
      loadData();
    }
  }

  const deptsByFaculty = departments.filter((d) => d.faculty_id === form.faculty_id);

  const columns = [
    { key: 'nom', label: 'Nom', render: (p) => <span className="fw-semibold">{p.nom}</span> },
    { key: 'faculty', label: 'Faculté', render: (p) => p.faculties?.nom || '-' },
    { key: 'department', label: 'Département', render: (p) => p.departments?.nom || '-' },
    { key: 'annee', label: 'Année', render: (p) => p.annee || '-' },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="d-flex gap-1 justify-content-end">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => openEdit(p)}
            title="Modifier"
            className="d-flex align-items-center justify-content-center"
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => handleDelete(p.id)}
            title="Supprimer"
            className="d-flex align-items-center justify-content-center"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-5">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold">Promotions</h1>
          <p className="text-muted small mb-0">Classes et niveaux par faculté</p>
        </div>
        <Button
          variant="primary"
          onClick={openAdd}
          disabled={facultes.length === 0}
          className="d-flex align-items-center gap-2"
        >
          <Plus size={20} />
          Ajouter une promotion
        </Button>
      </div>

      {facultes.length === 0 && (
        <div className="alert alert-warning mb-4">
          <strong>Aucune faculté.</strong> Créez d'abord une faculté dans le menu Facultés.
        </div>
      )}

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
        emptyMessage="Aucune promotion. Cliquez sur « Ajouter une promotion » pour en créer."
      />

      <Modal show={modal.open} onHide={() => setModal({ open: false, item: null })} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modal.item ? 'Modifier la promotion' : 'Nouvelle promotion'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Faculté <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={form.faculty_id}
                onChange={(e) => setForm({ ...form, faculty_id: e.target.value, department_id: '' })}
                required
              >
                <option value="">-- Sélectionner une faculté --</option>
                {facultes.map((f) => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Département</Form.Label>
              <Form.Select
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
              >
                <option value="">-- Sélectionner (optionnel) --</option>
                {deptsByFaculty.map((d) => (
                  <option key={d.id} value={d.id}>{d.nom}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nom <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="ex: L3 Informatique"
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Année</Form.Label>
              <Form.Control
                type="number"
                value={form.annee}
                onChange={(e) => setForm({ ...form, annee: e.target.value })}
                placeholder="2025"
                min="2000"
                max="2030"
              />
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={() => setModal({ open: false, item: null })}>
                Annuler
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? <Spinner animation="border" size="sm" /> : (modal.item ? 'Enregistrer' : 'Ajouter')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
