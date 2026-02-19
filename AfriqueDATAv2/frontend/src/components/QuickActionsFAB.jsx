import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, Button } from 'react-bootstrap';

const actions = [
  { icon: 'bi-calendar3', label: 'Nouvelle activité', path: '/activites' },
  { icon: 'bi-person-plus', label: 'Nouvel étudiant', path: '/etudiants' },
  { icon: 'bi-download', label: 'Exporter', path: '/exports' },
];

export default function QuickActionsFAB() {
  const [open, setOpen] = useState(false);

  return (
    <div className="position-fixed bottom-0 end-0 p-4" style={{ zIndex: 1050 }}>
      <Dropdown show={open} onToggle={(next) => setOpen(next)} drop="up" align="end">
        <Dropdown.Toggle variant="primary" size="lg" className="rounded-circle shadow-lg d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }} aria-label="Actions rapides">
          <i className={`bi ${open ? 'bi-x-lg' : 'bi-plus-lg'}`} />
        </Dropdown.Toggle>
        <Dropdown.Menu className="shadow-lg border-0 mb-2">
          {actions.map(({ icon, label, path }) => (
            <Dropdown.Item key={path} as={Link} to={path} onClick={() => setOpen(false)}>
              <i className={`bi ${icon} me-2`} />
              {label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}
