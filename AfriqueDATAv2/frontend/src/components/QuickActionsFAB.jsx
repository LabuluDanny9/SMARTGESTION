import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import { CalendarPlus, UserPlus, FileDown, Plus } from 'lucide-react';

const actions = [
  { Icon: CalendarPlus, label: 'Nouvelle activité', path: '/admin/activites' },
  { Icon: UserPlus, label: 'Nouvel étudiant', path: '/admin/etudiants' },
  { Icon: FileDown, label: 'Exporter', path: '/exports' },
];

export default function QuickActionsFAB() {
  const [open, setOpen] = useState(false);

  return (
    <div className="position-fixed bottom-0 end-0 p-4 quick-fab-wrapper" style={{ zIndex: 1050 }}>
      <Dropdown show={open} onToggle={(next) => setOpen(next)} drop="up" align="end">
        <Dropdown.Toggle
          variant="primary"
          size="lg"
          className="rounded-circle shadow-lg d-flex align-items-center justify-content-center quick-fab-toggle"
          style={{ width: 56, height: 56 }}
          aria-label="Actions rapides"
        >
          <Plus size={24} strokeWidth={2.5} className={open ? 'rotate-45' : ''} style={{ transition: 'transform 0.2s ease' }} />
        </Dropdown.Toggle>
        <Dropdown.Menu className="shadow-lg border-0 mb-2 quick-fab-menu">
          {actions.map(({ Icon, label, path }) => (
            <Dropdown.Item key={path} as={Link} to={path} onClick={() => setOpen(false)} className="d-flex align-items-center py-2">
              <Icon size={18} className="me-2 flex-shrink-0 text-primary" strokeWidth={2} />
              {label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}
