import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Offcanvas, Navbar, Container, Button, Dropdown, Form, InputGroup } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from './Sidebar';
import GlobalSearch from '../GlobalSearch';
import QuickActionsFAB from '../QuickActionsFAB';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function AdminLayout() {
  const { adminProfile, signOut } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleCloseOffcanvas = () => setShowOffcanvas(false);

  const initials = (adminProfile?.nom_complet || 'SG')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="d-none d-lg-flex flex-column border-end bg-white shadow-sm" style={{ width: sidebarCollapsed ? 72 : 260, transition: 'width 0.3s ease' }}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} onNavigate={handleCloseOffcanvas} />
      </div>

      {/* Mobile Offcanvas Sidebar */}
      <Offcanvas show={showOffcanvas} onHide={handleCloseOffcanvas} placement="start" className="d-lg-none" style={{ width: 280 }}>
        <Offcanvas.Header closeButton className="bg-primary text-white">
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <Sidebar collapsed={false} onToggle={() => {}} onNavigate={handleCloseOffcanvas} mobile />
        </Offcanvas.Body>
      </Offcanvas>

      <main className="flex-grow-1 d-flex flex-column min-vw-0">
        {/* Top Navbar */}
        <Navbar expand="lg" className="bg-white border-bottom shadow-sm py-2 px-3 sticky-top">
          <Container fluid className="px-3">
            <Button
              variant="link"
              className="d-lg-none p-2 text-secondary text-decoration-none me-2"
              onClick={() => setShowOffcanvas(true)}
              aria-label="Ouvrir le menu"
            >
              <i className="bi bi-list fs-4" />
            </Button>

            <div className="d-flex flex-grow-1 align-items-center gap-2 min-w-0">
              <Button
                variant="light"
                size="sm"
                className="d-none d-sm-flex align-items-center gap-2 border"
                onClick={() => setSearchOpen(true)}
              >
                <i className="bi bi-search" />
                <span className="text-muted">Recherche...</span>
                <kbd className="ms-1 px-1 py-0 bg-secondary rounded small">Ctrl+K</kbd>
              </Button>
              <Navbar.Text className="text-truncate ms-2 ms-sm-0">
                Administration Smart Gestion
              </Navbar.Text>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button variant="link" className="p-2 text-secondary text-decoration-none" onClick={toggleTheme} aria-label={dark ? 'Mode clair' : 'Mode sombre'}>
                <i className={dark ? 'bi bi-sun' : 'bi bi-moon'} />
              </Button>

              <Dropdown align="end" className="d-none d-sm-block">
                <Dropdown.Toggle variant="light" className="d-flex align-items-center gap-2 border rounded-pill px-3 py-2" id="profile-dropdown">
                  <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-semibold small" style={{ width: 32, height: 32 }}>
                    {initials}
                  </div>
                  <div className="text-start d-none d-md-block">
                    <div className="small fw-medium text-dark text-truncate" style={{ maxWidth: 120 }}>{adminProfile?.nom_complet || 'Secrétaire'}</div>
                    <div className="small text-muted text-truncate" style={{ maxWidth: 120 }}>{adminProfile?.email}</div>
                  </div>
                  <i className="bi bi-chevron-down" />
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow border-0 mt-2">
                  <Dropdown.Header>Mon compte</Dropdown.Header>
                  <Dropdown.Item onClick={handleSignOut}>
                    <i className="bi bi-box-arrow-right me-2" />Déconnexion
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              <Button variant="outline-secondary" size="sm" className="d-flex align-items-center gap-2 d-lg-none" onClick={handleSignOut}>
                <i className="bi bi-box-arrow-right" />
              </Button>
            </div>
          </Container>
        </Navbar>

        <div className="flex-grow-1 p-3 p-md-4 overflow-auto">
          <div className="container-fluid">
            <Outlet />
          </div>
        </div>
      </main>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <QuickActionsFAB />
    </div>
  );
}
