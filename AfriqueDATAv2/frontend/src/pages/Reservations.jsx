import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ListTodo,
  Search,
  LayoutGrid,
  List,
  MoreVertical,
  MessageSquare,
  UserPlus,
} from 'lucide-react';
import { Button, Card, Badge, Dropdown, Form, Modal, InputGroup } from 'react-bootstrap';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'warning', Icon: Clock },
  approved: { label: 'Approuvée', color: 'success', Icon: CheckCircle },
  rejected: { label: 'Refusée', color: 'danger', Icon: XCircle },
  expired: { label: 'Expirée', color: 'secondary', Icon: AlertCircle },
  completed: { label: 'Terminée', color: 'info', Icon: ListTodo },
};

export default function Reservations() {
  const { adminProfile } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // kanban | table
  const [filterStatus, setFilterStatus] = useState('');
  const [filterActivity, setFilterActivity] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');
  const [actionModal, setActionModal] = useState({ open: false, type: null, item: null });
  const [adminNote, setAdminNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [convertMontant, setConvertMontant] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await supabase.rpc('expire_old_reservations').catch(() => {});
      const [resRes, actRes] = await Promise.all([
        supabase.from('reservations').select('*, activities(id, nom, date_debut, heure_debut, prix_default, activity_types(nom))').order('created_at', { ascending: false }),
        supabase.from('activities').select('id, nom').eq('actif', true).order('nom'),
      ]);
      setReservations(resRes.data || []);
      setActivities(actRes.data || []);
    } catch (err) {
      toast.error(err?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const filtered = reservations.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterActivity && r.activity_id !== filterActivity) return false;
    if (filterDate && r.desired_date !== filterDate) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!(r.full_name?.toLowerCase().includes(q) || r.telephone?.includes(q) || r.matricule?.toLowerCase().includes(q) || r.activities?.nom?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const byStatus = {
    pending: filtered.filter((r) => r.status === 'pending'),
    approved: filtered.filter((r) => r.status === 'approved'),
    rejected: filtered.filter((r) => r.status === 'rejected'),
    expired: filtered.filter((r) => r.status === 'expired'),
    completed: filtered.filter((r) => r.status === 'completed'),
  };

  async function handleAction(type, item) {
    setActionModal({ open: true, type, item });
    setAdminNote(item?.admin_note || '');
    setRejectionReason(item?.rejection_reason || '');
    const prix = item?.activities?.prix_default ?? 0;
    setConvertMontant(String(Number(prix) || ''));
  }

  async function submitAction() {
    const { type, item } = actionModal;
    if (!item) return;
    setSubmitting(true);
    try {
      if (type === 'convert') {
        const montant = parseFloat(convertMontant) || 0;
        const typeParticipant = item.student_id ? 'etudiant' : 'visiteur';
        const { data: newPart, error: insErr } = await supabase
          .from('participations')
          .insert({
            activity_id: item.activity_id,
            nom_complet: item.full_name,
            faculty_id: item.faculty_id || null,
            promotion_id: item.promotion_id || null,
            matricule: item.matricule || null,
            student_id: item.student_id || null,
            visitor_id: item.visitor_id || null,
            type_participant: typeParticipant,
            montant,
            statut_paiement: 'en_attente',
          })
          .select('id')
          .single();
        if (insErr) throw insErr;
        const { error: updErr } = await supabase
          .from('reservations')
          .update({
            status: 'completed',
            participation_id: newPart.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);
        if (updErr) throw updErr;
        toast.success('Participation créée. Allez dans Paiements pour valider.');
        setActionModal({ open: false, type: null, item: null });
        loadData();
        return;
      }
      const payload = {
        updated_at: new Date().toISOString(),
        validated_by: adminProfile?.id || null,
        validated_at: new Date().toISOString(),
      };
      if (type === 'approve') {
        payload.status = 'approved';
      } else if (type === 'reject') {
        payload.status = 'rejected';
        payload.rejection_reason = rejectionReason || 'Refusé par le secrétaire';
      } else if (type === 'hold') {
        payload.admin_note = adminNote;
      } else if (type === 'note') {
        payload.admin_note = adminNote;
      }
      const { error } = await supabase.from('reservations').update(payload).eq('id', item.id);
      if (error) throw error;
      toast.success(type === 'approve' ? 'Réservation approuvée' : type === 'reject' ? 'Réservation refusée' : 'Note enregistrée');
      setActionModal({ open: false, type: null, item: null });
      loadData();
    } catch (err) {
      toast.error(err?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  const pendingCount = reservations.filter((r) => r.status === 'pending').length;

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
          <h1 className="h3 mb-1 fw-bold">Réservations</h1>
          <p className="text-muted small mb-0">Validez ou refusez les réservations d&apos;activités</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'primary' : 'outline-secondary'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid size={18} /> Kanban
          </Button>
          <Button
            variant={viewMode === 'table' ? 'primary' : 'outline-secondary'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List size={18} /> Tableau
          </Button>
        </div>
      </div>

      {/* Compteurs */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <Badge bg="warning" className="px-3 py-2 fs-6" pill>
          <Clock size={16} className="me-1" /> {pendingCount} en attente
        </Badge>
        <Badge bg="success" className="px-3 py-2 fs-6" pill>
          <CheckCircle size={16} className="me-1" /> {byStatus.approved.length} approuvées
        </Badge>
        <Badge bg="danger" className="px-3 py-2 fs-6" pill>
          <XCircle size={16} className="me-1" /> {byStatus.rejected.length} refusées
        </Badge>
        <Badge bg="secondary" className="px-3 py-2 fs-6" pill>
          <AlertCircle size={16} className="me-1" /> {byStatus.expired.length} expirées
        </Badge>
      </div>

      {/* Filtres */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <InputGroup style={{ maxWidth: 280 }}>
          <InputGroup.Text><Search size={18} /></InputGroup.Text>
          <Form.Control
            placeholder="Nom, tél., matricule, activité..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
        <Form.Select style={{ width: 160 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </Form.Select>
        <Form.Select style={{ width: 200 }} value={filterActivity} onChange={(e) => setFilterActivity(e.target.value)}>
          <option value="">Toutes activités</option>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>{a.nom}</option>
          ))}
        </Form.Select>
        <Form.Control type="date" style={{ width: 160 }} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
      </div>

      {viewMode === 'kanban' ? (
        <div className="row g-3">
          {['pending', 'approved', 'rejected'].map((status) => {
            const cfg = STATUS_CONFIG[status];
            const items = byStatus[status];
            return (
              <div key={status} className="col-md-4">
                <Card className="h-100">
                  <Card.Header className="d-flex align-items-center justify-content-between py-2">
                    <span className="fw-semibold d-flex align-items-center gap-1">
                      <cfg.Icon size={18} />
                      {cfg.label}
                    </span>
                    <Badge bg={cfg.color}>{items.length}</Badge>
                  </Card.Header>
                  <Card.Body className="p-2 overflow-auto" style={{ maxHeight: 420 }}>
                    {items.length === 0 ? (
                      <p className="text-muted small text-center py-4 mb-0">Aucune</p>
                    ) : (
                      items.map((r) => (
                        <ReservationCard
                          key={r.id}
                          item={r}
                          onAction={handleAction}
                        />
                      ))
                    )}
                  </Card.Body>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-secondary">
                  <tr>
                    <th>Nom</th>
                    <th>Activité</th>
                    <th>Tél.</th>
                    <th>Créneau</th>
                    <th>Statut</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td className="fw-medium">{r.full_name}</td>
                      <td>
                        <Link to={`/activites/${r.activity_id}`} className="text-decoration-none">
                          {r.activities?.nom || '-'}
                        </Link>
                      </td>
                      <td>{r.telephone || '-'}</td>
                      <td className="small">{r.desired_date} {r.desired_time_start || ''}</td>
                      <td>
                        <Badge bg={STATUS_CONFIG[r.status]?.color || 'secondary'}>
                          {STATUS_CONFIG[r.status]?.label || r.status}
                        </Badge>
                      </td>
                      <td className="text-end">
                        {r.status === 'pending' && (
                          <>
                            <Button variant="outline-success" size="sm" className="me-1" onClick={() => handleAction('approve', r)}>
                              <CheckCircle size={16} />
                            </Button>
                            <Button variant="outline-danger" size="sm" className="me-1" onClick={() => handleAction('reject', r)}>
                              <XCircle size={16} />
                            </Button>
                          </>
                        )}
                        {r.status === 'approved' && (
                          <Button variant="outline-primary" size="sm" onClick={() => handleAction('convert', r)} title="Convertir en participation">
                            <UserPlus size={16} className="me-1" /> Convertir
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <p className="text-center text-muted py-5 mb-0">Aucune réservation.</p>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Modal action */}
      <Modal show={actionModal.open} onHide={() => setActionModal({ open: false })} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {actionModal.type === 'approve' && 'Approuver'}
            {actionModal.type === 'reject' && 'Refuser'}
            {actionModal.type === 'hold' && 'Mettre en attente'}
            {actionModal.type === 'note' && 'Ajouter une note'}
            {actionModal.type === 'convert' && 'Convertir en participation'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {actionModal.item && (
            <p className="mb-3">
              <strong>{actionModal.item.full_name}</strong> – {actionModal.item.activities?.nom}
            </p>
          )}
          {actionModal.type === 'convert' && (
            <Form.Group className="mb-3">
              <Form.Label>Montant (FC) *</Form.Label>
              <Form.Control
                type="number"
                min={0}
                step={0.01}
                value={convertMontant}
                onChange={(e) => setConvertMontant(e.target.value)}
                placeholder="0"
              />
              <Form.Text className="text-muted">La participation sera créée en statut &quot;En attente&quot;. Validez le paiement dans Paiements.</Form.Text>
            </Form.Group>
          )}
          {(actionModal.type === 'reject' || actionModal.type === 'hold' || actionModal.type === 'note') && (
            <Form.Group className="mb-3">
              <Form.Label>{actionModal.type === 'reject' ? 'Raison du refus' : 'Note admin'}</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={actionModal.type === 'reject' ? rejectionReason : adminNote}
                onChange={(e) => actionModal.type === 'reject' ? setRejectionReason(e.target.value) : setAdminNote(e.target.value)}
                placeholder={actionModal.type === 'reject' ? 'Motif obligatoire' : 'Note interne'}
              />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setActionModal({ open: false })}>Annuler</Button>
          <Button variant="primary" onClick={submitAction} disabled={submitting || (actionModal.type === 'reject' && !rejectionReason.trim())}>
            {actionModal.type === 'approve' && 'Approuver'}
            {actionModal.type === 'reject' && 'Refuser'}
            {actionModal.type === 'hold' && 'Enregistrer'}
            {actionModal.type === 'note' && 'Enregistrer'}
            {actionModal.type === 'convert' && 'Créer la participation'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function ReservationCard({ item, onAction }) {
  return (
    <div className="border rounded-2 p-2 mb-2 bg-body">
      <div className="d-flex justify-content-between align-items-start">
        <div className="small">
          <strong>{item.full_name}</strong>
          <p className="mb-0 text-muted small">{item.activities?.nom}</p>
          <p className="mb-0 text-muted small">{item.telephone}</p>
          {item.desired_date && <p className="mb-0 text-muted small">{item.desired_date} {item.desired_time_start}</p>}
        </div>
        {item.status === 'pending' && (
          <Dropdown align="end">
            <Dropdown.Toggle variant="link" className="p-1 text-dark" size="sm">
              <MoreVertical size={18} />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => onAction('approve', item)}><CheckCircle size={14} className="me-2" />Approuver</Dropdown.Item>
              <Dropdown.Item onClick={() => onAction('reject', item)}><XCircle size={14} className="me-2" />Refuser</Dropdown.Item>
              <Dropdown.Item onClick={() => onAction('hold', item)}><Clock size={14} className="me-2" />Mettre en attente</Dropdown.Item>
              <Dropdown.Item onClick={() => onAction('note', item)}><MessageSquare size={14} className="me-2" />Ajouter note</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>
      {item.status === 'pending' && (
        <div className="d-flex gap-1 mt-2">
          <Button variant="success" size="sm" className="flex-grow-1" onClick={() => onAction('approve', item)}>
            <CheckCircle size={14} /> Approuver
          </Button>
          <Button variant="outline-danger" size="sm" onClick={() => onAction('reject', item)}>
            <XCircle size={14} />
          </Button>
        </div>
      )}
      {item.status === 'approved' && (
        <Button variant="primary" size="sm" className="w-100 mt-2" onClick={() => onAction('convert', item)}>
          <UserPlus size={14} className="me-2" /> Convertir en participation
        </Button>
      )}
    </div>
  );
}
