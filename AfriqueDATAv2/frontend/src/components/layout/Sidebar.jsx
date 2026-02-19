import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Nav, Button } from 'react-bootstrap';
import { supabase } from '../../lib/supabase';

const sectionsConfig = [
  { label: null, items: [
    { path: '/', icon: 'bi-grid-1x2', label: 'Tableau de bord', badgeKey: null },
    { path: '/analytics', icon: 'bi-graph-up', label: 'Analytics', badgeKey: null },
  ] },
  { label: 'ACADÉMIQUE', items: [
    { path: '/facultes', icon: 'bi-mortarboard', label: 'Facultés', badgeKey: 'facultes' },
    { path: '/promotions', icon: 'bi-layers', label: 'Promotions', badgeKey: 'promotions' },
    { path: '/etudiants', icon: 'bi-people', label: 'Étudiants', badgeKey: 'etudiants' },
    { path: '/visiteurs', icon: 'bi-person-check', label: 'Visiteurs', badgeKey: 'visiteurs' },
  ] },
  { label: 'ACTIVITÉS', items: [
    { path: '/types-activite', icon: 'bi-tags', label: "Types d'activité", badgeKey: 'types' },
    { path: '/activites', icon: 'bi-calendar3', label: 'Activités', badgeKey: 'activites' },
  ] },
  { label: 'FINANCE', items: [
    { path: '/paiements', icon: 'bi-currency-dollar', label: 'Paiements', badgeKey: 'enAttente' },
    { path: '/exports', icon: 'bi-download', label: 'Exports', badgeKey: null },
  ] },
  { label: 'ADMINISTRATION', items: [{ path: '/parametres', icon: 'bi-gear', label: 'Paramètres', badgeKey: null }] },
];

export default function Sidebar({ collapsed, onToggle, onNavigate, mobile }) {
  const [badges, setBadges] = useState({});

  useEffect(() => {
    async function loadBadges() {
      try {
        const [act, part, etu, vis] = await Promise.all([
          supabase.from('activities').select('id', { count: 'exact', head: true }),
          supabase.from('participations').select('id').eq('statut_paiement', 'en_attente'),
          supabase.from('students').select('id', { count: 'exact', head: true }),
          supabase.from('visitors').select('id', { count: 'exact', head: true }),
        ]);
        setBadges({
          activites: act.count || 0,
          enAttente: part.data?.length || 0,
          etudiants: etu.count || 0,
          visiteurs: vis.count || 0,
        });
      } catch {
        setBadges({});
      }
    }
    loadBadges();
  }, []);

  const handleNavClick = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <>
      <div className="p-3 border-bottom">
        <div className={`d-flex align-items-center ${collapsed ? 'justify-content-center' : 'gap-2'}`}>
          <img src="/logo-salle-numerique.png" alt="Salle du Numérique" className="rounded flex-shrink-0" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          {!collapsed && (
            <div className="min-w-0 flex-grow-1 sidebar-brand">
              <h6 className="mb-0 fw-bold text-truncate">SMART GESTION</h6>
              <small className="text-truncate d-block">Salle du Numérique</small>
            </div>
          )}
        </div>
      </div>

      <Nav className="flex-column flex-grow-1 p-2 overflow-auto sidebar-nav">
        {sectionsConfig.map((section) => (
          <div key={section.label || 'main'} className="mb-3">
            {section.label && !collapsed && (
              <div className="px-3 mb-1 small text-uppercase sidebar-section-label">{section.label}</div>
            )}
            {section.items.map(({ path, icon, label, badgeKey }) => {
              const count = badgeKey ? badges[badgeKey] : null;
              return (
                <Nav.Link
                  key={path}
                  as={NavLink}
                  to={path}
                  onClick={handleNavClick}
                  end={path === '/'}
                  title={collapsed ? label : undefined}
                  className={`d-flex align-items-center rounded-3 px-3 py-2 mb-1 ${collapsed ? 'justify-content-center' : ''}`}
                >
                  <i className={`bi ${icon} me-2 flex-shrink-0`} style={{ fontSize: '1.1rem' }} />
                  {!collapsed && (
                    <>
                      <span className="flex-grow-1 text-truncate">{label}</span>
                      {count != null && count > 0 && badgeKey === 'enAttente' && (
                        <span className="badge bg-warning text-dark ms-1">{count}</span>
                      )}
                    </>
                  )}
                </Nav.Link>
              );
            })}
          </div>
        ))}
      </Nav>

      {!mobile && (
        <div className="p-2 border-top">
          <Button variant="link" size="sm" className="w-100 d-flex align-items-center justify-content-center gap-2 text-dark text-decoration-none p-2" onClick={onToggle}>
            <i className={`bi bi-chevron-${collapsed ? 'right' : 'left'}`} />
            {!collapsed && <span className="small">Réduire</span>}
          </Button>
        </div>
      )}
    </>
  );
}
