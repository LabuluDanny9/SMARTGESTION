import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Search } from 'lucide-react';
import { Card, Form, InputGroup } from 'react-bootstrap';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('*, admin_profiles(nom_complet)')
        .order('created_at', { ascending: false })
        .limit(200);
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = logs.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (l.action || '').toLowerCase().includes(q) ||
      (l.entity_type || '').toLowerCase().includes(q) ||
      (l.admin_profiles?.nom_complet || '').toLowerCase().includes(q)
    );
  });

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
          <h1 className="h3 mb-1 fw-bold">Journal des actions (Audit)</h1>
          <p className="text-muted small mb-0">Traçabilité complète des actions administrateur</p>
        </div>
        <InputGroup style={{ maxWidth: 300 }}>
          <InputGroup.Text><Search size={18} /></InputGroup.Text>
          <Form.Control placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </InputGroup>
      </div>

      <Card className="shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Entité</th>
                  <th>Date</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td className="fw-medium">{log.admin_profiles?.nom_complet || '-'}</td>
                    <td><span className="badge bg-secondary">{log.action}</span></td>
                    <td className="small">{log.entity_type || '-'} {log.entity_id ? `#${String(log.entity_id).slice(0, 8)}` : ''}</td>
                    <td className="small text-muted">{new Date(log.created_at).toLocaleString('fr-FR')}</td>
                    <td className="small text-muted">{Object.keys(log.metadata || {}).length ? JSON.stringify(log.metadata) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted py-5 mb-0">Aucune action enregistrée.</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
