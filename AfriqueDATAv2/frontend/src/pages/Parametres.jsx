import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { createSecretary } from '../lib/createSecretary';
import { Button, Card, Form, Modal, Table, Spinner } from 'react-bootstrap';
import { Pencil, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Parametres() {
  const { adminProfile, user, refreshProfile } = useAuth();
  const [secretaries, setSecretaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [editForm, setEditForm] = useState({ nom_complet: '' });
  const [addForm, setAddForm] = useState({ email: '', password: '', nom_complet: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSecretaries();
  }, []);

  async function loadSecretaries() {
    const { data } = await supabase.from('admin_profiles').select('id, email, nom_complet, created_at').order('nom_complet');
    setSecretaries(data || []);
    setLoading(false);
  }

  function openEdit() {
    setEditForm({ nom_complet: adminProfile?.nom_complet || '' });
    setEditModal(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('admin_profiles')
        .update({ nom_complet: editForm.nom_complet.trim(), updated_at: new Date().toISOString() })
        .eq('id', user?.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Profil mis à jour');
      setEditModal(false);
    } catch (err) {
      toast.error(err?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    if (!addForm.email?.trim() || !addForm.password || !addForm.nom_complet?.trim()) {
      toast.error('Remplissez tous les champs');
      return;
    }
    if (addForm.password.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    setSubmitting(true);
    try {
      await createSecretary(addForm.email.trim(), addForm.password, addForm.nom_complet.trim());
      toast.success('Secrétaire ajouté. Il peut se connecter avec son email et mot de passe.');
      setAddForm({ email: '', password: '', nom_complet: '' });
      setAddModal(false);
      loadSecretaries();
    } catch (err) {
      toast.error(err?.message || 'Erreur lors de l\'ajout');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in pb-5">
      <h1 className="h3 mb-1 fw-bold">Paramètres</h1>
      <p className="text-muted small mb-4">Configuration de la plateforme et gestion des secrétaires</p>

      {/* Mon profil */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="d-flex align-items-center justify-content-between">
          <span className="fw-semibold">Mon profil</span>
          <Button variant="outline-primary" size="sm" onClick={openEdit} className="d-flex align-items-center gap-1">
            <Pencil size={16} />
            Modifier
          </Button>
        </Card.Header>
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="text-muted small">Nom complet</label>
              <p className="mb-0 fw-medium">{adminProfile?.nom_complet || '-'}</p>
            </div>
            <div className="col-md-6">
              <label className="text-muted small">Email</label>
              <p className="mb-0 fw-medium">{adminProfile?.email || user?.email || '-'}</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Liste des secrétaires */}
      <Card className="shadow-sm">
        <Card.Header className="d-flex align-items-center justify-content-between">
          <span className="fw-semibold">Secrétaires</span>
          <Button variant="primary" size="sm" onClick={() => setAddModal(true)} className="d-flex align-items-center gap-1">
            <UserPlus size={16} />
            Ajouter un secrétaire
          </Button>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" size="sm" />
            </div>
          ) : secretaries.length === 0 ? (
            <p className="text-muted mb-0">Aucun secrétaire.</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Ajouté le</th>
                </tr>
              </thead>
              <tbody>
                {secretaries.map((s) => (
                  <tr key={s.id}>
                    <td className="fw-medium">{s.nom_complet}</td>
                    <td>{s.email}</td>
                    <td className="text-muted small">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal Modifier profil */}
      <Modal show={editModal} onHide={() => setEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Modifier mon profil</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nom complet</Form.Label>
              <Form.Control
                type="text"
                value={editForm.nom_complet}
                onChange={(e) => setEditForm({ ...editForm, nom_complet: e.target.value })}
                placeholder="Votre nom"
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={adminProfile?.email || ''} disabled className="bg-light" />
              <Form.Text className="text-muted">L'email ne peut pas être modifié ici.</Form.Text>
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={() => setEditModal(false)}>Annuler</Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? <Spinner animation="border" size="sm" /> : 'Enregistrer'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal Ajouter secrétaire */}
      <Modal show={addModal} onHide={() => setAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un secrétaire</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">
            Le nouveau secrétaire pourra se connecter avec l'email et le mot de passe. Si la confirmation par email est activée sur Supabase, il devra d'abord confirmer son email.
          </p>
          <Form onSubmit={handleAddSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="secretaire@exemple.com"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mot de passe <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="Min. 6 caractères"
                minLength={6}
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Nom complet <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={addForm.nom_complet}
                onChange={(e) => setAddForm({ ...addForm, nom_complet: e.target.value })}
                placeholder="Nom du secrétaire"
                required
              />
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={() => setAddModal(false)}>Annuler</Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? <Spinner animation="border" size="sm" /> : 'Ajouter'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* À propos */}
      <Card className="mt-4 border-0 bg-light">
        <Card.Body className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white fw-bold"
            style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
          >
            SG
          </div>
          <div>
            <h6 className="mb-1 fw-semibold">Smart Gestion</h6>
            <p className="text-muted small mb-0">
              Salle du Numérique – UNILU. Gestion des activités, facultés, promotions, étudiants et paiements.
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
