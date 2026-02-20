import { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { KeyRound } from 'lucide-react';

const CROSS_ACCESS_FORMATEUR = 'crossAccessFormateur';
const CROSS_ACCESS_ADMIN = 'crossAccessAdmin';

export function getCrossAccessFormateur() {
  return sessionStorage.getItem(CROSS_ACCESS_FORMATEUR) === '1';
}

export function setCrossAccessFormateur() {
  sessionStorage.setItem(CROSS_ACCESS_FORMATEUR, '1');
}

export function getCrossAccessAdmin() {
  return sessionStorage.getItem(CROSS_ACCESS_ADMIN) === '1';
}

export function setCrossAccessAdmin() {
  sessionStorage.setItem(CROSS_ACCESS_ADMIN, '1');
}

export function clearCrossAccess() {
  sessionStorage.removeItem(CROSS_ACCESS_FORMATEUR);
  sessionStorage.removeItem(CROSS_ACCESS_ADMIN);
}

export default function AccessCodeModal({ show, onHide, title, subtitle, onSuccess, onError, verify }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const c = code?.trim();
    if (!c) return;
    setLoading(true);
    try {
      const ok = await verify(c);
      if (ok) {
        onSuccess?.();
        setCode('');
        onHide();
      } else {
        onError?.('Code incorrect.');
      }
    } catch (err) {
      onError?.(err?.message || 'Erreur de vérification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <KeyRound size={24} />
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small mb-3">{subtitle}</p>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Code à 6 caractères"
              maxLength={6}
              className="text-center text-uppercase fw-bold"
              style={{ letterSpacing: 4, fontSize: '1.2rem' }}
              autoFocus
            />
          </Form.Group>
          <div className="d-flex gap-2 justify-content-end">
            <Button variant="outline-secondary" onClick={onHide}>Annuler</Button>
            <Button variant="primary" type="submit" disabled={loading || !code?.trim()}>
              {loading ? 'Vérification...' : 'Valider'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
