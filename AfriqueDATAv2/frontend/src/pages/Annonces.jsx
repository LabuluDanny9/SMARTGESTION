import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Megaphone, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button, Card, Badge, Modal, Form } from 'react-bootstrap';
import toast from 'react-hot-toast';

export default function Annonces() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [form, setForm] = useState({ titre: '', contenu: '', publie: false });

  useEffect(() => {
    loadAnnonces();
  }, []);

  async function loadAnnonces() {
    try {
      const { data } = await supabase
        .from('annonces')
        .select('*')
        .order('created_at', { ascending: false })
        .then((r) => r)
        .catch(() => ({ data: [] }));
      setAnnonces(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (modal.item) {
        await supabase.from('annonces').update({
          titre: form.titre,
          contenu: form.contenu,
          publie: form.publie,
          updated_at: new Date().toISOString(),
        }).eq('id', modal.item.id);
        toast.success('Annonce modifiée');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('annonces').insert({
          titre: form.titre,
          contenu: form.contenu,
          publie: form.publie,
          created_by: user?.id,
        });
        toast.success('Annonce créée');
      }
      setModal({ open: false, item: null });
      setForm({ titre: '', contenu: '', publie: false });
      loadAnnonces();
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  }

  async function togglePublie(a) {
    try {
      await supabase.from('annonces').update({
        publie: !a.publie,
        updated_at: new Date().toISOString(),
      }).eq('id', a.id);
      toast.success(a.publie ? 'Annonce dépubliée' : 'Annonce publiée');
      loadAnnonces();
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette annonce ?')) return;
    try {
      await supabase.from('annonces').delete().eq('id', id);
      toast.success('Annonce supprimée');
      loadAnnonces();
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-5">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold">Annonces</h1>
          <p className="text-muted small mb-0">Publier et gérer les annonces</p>
        </div>
        <Button variant="primary" onClick={() => { setForm({ titre: '', contenu: '', publie: false }); setModal({ open: true, item: null }); }}>
          <Plus size={18} className="me-2" /> Nouvelle annonce
        </Button>
      </div>

      <div className="row g-3">
        {annonces.map((a) => (
          <div key={a.id} className="col-md-6 col-lg-4">
            <Card className="shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="mb-0">{a.titre}</h5>
                  <Badge bg={a.publie ? 'success' : 'secondary'}>{a.publie ? 'Publié' : 'Brouillon'}</Badge>
                </div>
                <p className="text-muted small mb-3" style={{ maxHeight: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {a.contenu || 'Aucun contenu'}
                </p>
                <div className="d-flex gap-2">
                  <Button variant="outline-primary" size="sm" onClick={() => { setForm(a); setModal({ open: true, item: a }); }}>
                    <Pencil size={14} />
                  </Button>
                  <Button variant={a.publie ? 'outline-warning' : 'outline-success'} size="sm" onClick={() => togglePublie(a)}>
                    {a.publie ? <EyeOff size={14} /> : <Eye size={14} />}
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => handleDelete(a.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      {annonces.length === 0 && (
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <Megaphone size={48} className="text-muted mb-3" />
            <p className="text-muted mb-0">Aucune annonce. Créez-en une.</p>
          </Card.Body>
        </Card>
      )}

      <Modal show={modal.open} onHide={() => setModal({ open: false, item: null })} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modal.item ? 'Modifier l\'annonce' : 'Nouvelle annonce'}</Modal.Title>
        </Modal.Header>
        <form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Titre *</Form.Label>
              <Form.Control value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required placeholder="Titre de l'annonce" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contenu</Form.Label>
              <Form.Control as="textarea" rows={6} value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} placeholder="Contenu de l'annonce..." />
            </Form.Group>
            <Form.Check type="switch" label="Publier" checked={form.publie} onChange={(e) => setForm({ ...form, publie: e.target.checked })} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setModal({ open: false, item: null })}>Annuler</Button>
            <Button variant="primary" type="submit">Enregistrer</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
}
