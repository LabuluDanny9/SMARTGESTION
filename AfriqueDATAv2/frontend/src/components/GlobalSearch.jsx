import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Form, Spinner } from 'react-bootstrap';
import { supabase } from '../lib/supabase';

export default function GlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ activities: [], students: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const search = useCallback(async () => {
    const q = query?.trim();
    if (!q || q.length < 2) {
      setResults({ activities: [], students: [] });
      return;
    }
    setLoading(true);
    try {
      const [actRes, partRes] = await Promise.all([
        supabase.from('activities').select('id, nom, date_debut, activity_types(nom)').ilike('nom', `%${q}%`).limit(8),
        supabase.from('participations').select('id, nom_complet, activity_id, activities(nom)').ilike('nom_complet', `%${q}%`).limit(8),
      ]);
      setResults({ activities: actRes.data || [], students: partRes.data || [] });
    } catch {
      setResults({ activities: [], students: [] });
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  const total = results.activities.length + results.students.length;

  return (
    <Modal show={open} onHide={onClose} centered className="fade" size="lg">
      <Modal.Body className="p-0 rounded-3 overflow-hidden">
        <div className="d-flex align-items-center gap-2 px-4 py-3 border-bottom">
          <i className="bi bi-search text-muted" />
          <Form.Control
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher activité, étudiant... (Ctrl+K)"
            className="border-0 shadow-none"
            autoFocus
          />
          <kbd className="px-2 py-1 small bg-light rounded text-muted">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-auto">
          {loading ? (
            <div className="p-5 text-center text-muted"><Spinner size="sm" /> Recherche...</div>
          ) : total === 0 && query.trim().length >= 2 ? (
            <div className="p-5 text-center text-muted">Aucun résultat</div>
          ) : total === 0 ? (
            <div className="p-5 text-center text-muted">Tapez 2 caractères ou plus</div>
          ) : (
            <div className="py-2">
              {results.activities.length > 0 && (
                <div className="px-3 py-1">
                  <p className="small text-uppercase text-muted fw-semibold mb-2">Activités</p>
                  {results.activities.map((a) => (
                    <button key={a.id} onClick={() => handleSelect(`/activites/${a.id}`)} className="w-100 d-flex align-items-center justify-content-between px-3 py-2 rounded border-0 bg-transparent hover-bg-light text-start text-dark">
                      <span className="fw-medium text-truncate">{a.nom}</span>
                      <i className="bi bi-chevron-right text-muted" />
                    </button>
                  ))}
                </div>
              )}
              {results.students.length > 0 && (
                <div className="px-3 py-1">
                  <p className="small text-uppercase text-muted fw-semibold mb-2">Participants</p>
                  {results.students.map((p) => (
                    <button key={p.id} onClick={() => handleSelect(`/activites/${p.activity_id}`)} className="w-100 d-flex align-items-center justify-content-between px-3 py-2 rounded border-0 bg-transparent hover-bg-light text-start text-dark">
                      <span className="fw-medium text-truncate">{p.nom_complet}</span>
                      <span className="small text-muted text-truncate ms-2" style={{ maxWidth: 120 }}>{p.activities?.nom}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
}
