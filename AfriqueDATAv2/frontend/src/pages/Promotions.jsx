import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Button, Modal, Form, Spinner, Table } from 'react-bootstrap';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import TableSkeleton from '../components/ui/TableSkeleton';

const PAGE_SIZE = 10;

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [facultes, setFacultes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [form, setForm] = useState({ faculty_id: '', department_id: '', nom: '', annee: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    try {
      const [promRes, facRes, deptRes] = await Promise.all([
        supabase.from('promotions').select('id, faculty_id, department_id, nom, annee, faculties(nom), departments(nom)').order('nom'),
        supabase.from('faculties').select('id, nom').order('nom'),
        supabase.from('departments').select('id, faculty_id, nom').order('nom'),
      ]);
      if (promRes.error) throw promRes.error;
      if (facRes.error) throw facRes.error;
      setPromotions(promRes.data || []);
      setFacultes(facRes.data || []);
      setDepartments(deptRes.error ? [] : (deptRes.data || []));
    } catch (err) {
      toast.error(err?.message || 'Erreur de chargement');
      setPromotions([]);
      setFacultes([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, filtered.length);

  function openAdd() {
    setForm({
      faculty_id: facultes[0]?.id || '',
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
    const nom = form.nom?.trim();
    const facultyId = (form.faculty_id || '').trim();
    if (!facultyId) {
      toast.error('Sélectionnez une faculté');
      return;
    }
    if (!nom) {
      toast.error('Le nom est requis');
      return;
    }
    const rawDept = form.department_id;
    const deptId = (typeof rawDept === 'string' ? rawDept.trim() : rawDept) || null;
    const anneeRaw = form.annee ? String(form.annee).trim() : '';
    const annee = anneeRaw ? (parseInt(anneeRaw, 10) || null) : null;

    setSubmitting(true);
    try {
      const payload = {
        faculty_id: facultyId,
        nom,
        ...(annee != null && { annee }),
      };
      if (deptId) payload.department_id = deptId;
      if (modal.item) payload.updated_at = new Date().toISOString();

      if (modal.item) {
        const { data, error } = await supabase
          .from('promotions')
          .update(payload)
          .eq('id', modal.item.id)
          .select()
          .single();
        if (error) throw error;
        const enriched = {
          ...data,
          faculties: { nom: facultes.find((f) => f.id === data.faculty_id)?.nom },
          departments: data.department_id ? { nom: departments.find((d) => d.id === data.department_id)?.nom } : null,
        };
        setPromotions((prev) => prev.map((p) => (p.id === modal.item.id ? enriched : p)));
        toast.success('Promotion modifiée');
      } else {
        const { data, error } = await supabase
          .from('promotions')
          .insert([payload])
          .select()
          .single();
        if (error) {
          if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
            throw new Error('Une promotion avec ce nom existe déjà dans ce département.');
          }
          if (error.code === '42501' || error.message?.toLowerCase().includes('policy') || error.message?.toLowerCase().includes('row level')) {
            throw new Error('Accès refusé. Vérifiez que vous êtes connecté en tant qu\'administrateur.');
          }
          throw error;
        }
        const enriched = {
          ...data,
          faculties: { nom: facultes.find((f) => f.id === data.faculty_id)?.nom },
          departments: data.department_id ? { nom: departments.find((d) => d.id === data.department_id)?.nom } : null,
        };
        setPromotions((prev) => [enriched, ...prev]);
        toast.success('Promotion ajoutée');
      }
      setModal({ open: false, item: null });
      setForm({ faculty_id: '', department_id: '', nom: '', annee: '' });
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('duplicate') || msg.includes('unique')) {
        toast.error('Une promotion avec ce nom existe déjà dans ce département.');
      } else {
        toast.error(msg || 'Erreur lors de l\'enregistrement');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette promotion ? Les étudiants liés seront également supprimés.')) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw error;
      setPromotions((prev) => prev.filter((p) => p.id !== id));
      toast.success('Promotion supprimée');
    } catch (err) {
      toast.error(err?.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  }

  const deptsByFaculty = useMemo(
    () => departments.filter((d) => d.faculty_id === form.faculty_id),
    [departments, form.faculty_id]
  );

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
          disabled={loading || facultes.length === 0}
          className="d-flex align-items-center gap-2"
        >
          <Plus size={20} />
          Ajouter une promotion
        </Button>
      </div>

      {facultes.length === 0 && !loading && (
        <div className="alert alert-warning mb-4">
          <strong>Aucune faculté.</strong> Créez d'abord une faculté dans le menu Facultés.
        </div>
      )}

      <div className="mb-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher par nom, faculté ou année..."
          className="form-control"
          style={{ maxWidth: 320 }}
        />
      </div>

      <div className="card shadow-sm overflow-hidden bg-body">
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={8} cols={5} />
          </div>
        ) : (
          <>
            <Table responsive hover className="mb-0">
              <thead className="table-secondary">
                <tr>
                  <th>Nom</th>
                  <th>Faculté</th>
                  <th>Département</th>
                  <th>Année</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-5">
                      Aucune promotion. Cliquez sur « Ajouter une promotion » pour en créer.
                    </td>
                  </tr>
                ) : (
                  paginated.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-semibold">{p.nom}</td>
                      <td>{p.faculties?.nom || '-'}</td>
                      <td>{p.departments?.nom || '-'}</td>
                      <td>{p.annee || '-'}</td>
                      <td className="text-end">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => openEdit(p)}
                          title="Modifier"
                          className="me-1"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(p.id)}
                          title="Supprimer"
                          disabled={deletingId === p.id}
                        >
                          {deletingId === p.id ? <Spinner animation="border" size="sm" /> : <Trash2 size={14} />}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
            {filtered.length > PAGE_SIZE && (
              <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top bg-body-secondary">
                <span className="text-muted small">
                  {from}–{to} sur {filtered.length}
                </span>
                <div className="d-flex gap-2 align-items-center">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setPage((x) => Math.max(1, x - 1))}
                    disabled={page <= 1}
                  >
                    Précédent
                  </Button>
                  <span className="small">
                    Page {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setPage((x) => Math.min(totalPages, x + 1))}
                    disabled={page >= totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
                onChange={(e) => setForm((f) => ({ ...f, faculty_id: e.target.value, department_id: '' }))}
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
                onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
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
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                placeholder="ex: L3 Informatique"
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Année</Form.Label>
              <Form.Control
                type="number"
                value={form.annee}
                onChange={(e) => setForm((f) => ({ ...f, annee: e.target.value }))}
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
