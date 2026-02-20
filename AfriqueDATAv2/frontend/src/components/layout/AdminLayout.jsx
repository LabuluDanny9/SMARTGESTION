import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Offcanvas, Navbar, Container, Button, Dropdown } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from './Sidebar';
import GlobalSearch from '../GlobalSearch';
import QuickActionsFAB from '../QuickActionsFAB';
import BreadcrumbNav from './BreadcrumbNav';
import AccessCodeModal, { setCrossAccessFormateur } from '../AccessCodeModal';
import { Menu, Search, Sun, Moon, ChevronDown, LogOut, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLayout() {
  const { adminProfile, formateurProfile, isAdmin, isFormateur, verifyCodeForFormateurAccess, signOut } = useAuth();
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
    navigate('/login?mode=admin');
  };

  const handleCloseOffcanvas = () => setShowOffcanvas(false);

  const displayProfile = adminProfile || (formateurProfile && {
    nom_complet: formateurProfile.formateurs?.nom_complet || formateurProfile.formateur?.nom_complet || 'Chargé réservation',
    email: formateurProfile.formateurs?.email || formateurProfile.formateur?.email || '',
  });
  const initials = (displayProfile?.nom_complet || 'SG')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const [showAccessModal, setShowAccessModal] = useState(false);
  const handleAccessFormateurSuccess = () => {
    setCrossAccessFormateur();
    navigate('/formateur');
  };

  return (
    <div className="d-flex min-vh-100 bg-body-secondary">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="d-none d-lg-flex flex-column border-end bg-body shadow-sm" style={{ width: sidebarCollapsed ? 72 : 260, transition: 'width 0.3s ease' }}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} onNavigate={handleCloseOffcanvas} />
      </div>

      {/* Mobile Offcanvas Sidebar */}
      <Offcanvas show={showOffcanvas} onHide={handleCloseOffcanvas} placement="start" className="d-lg-none" style={{ width: 280 }} data-bs-theme="light">
        <Offcanvas.Header closeButton className="bg-primary text-white">
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <Sidebar collapsed={false} onToggle={() => {}} onNavigate={handleCloseOffcanvas} mobile />
        </Offcanvas.Body>
      </Offcanvas>

      <main className="flex-grow-1 d-flex flex-column min-vw-0">
        {/* Top Navbar */}
        <Navbar expand="lg" className="bg-body border-bottom shadow-sm py-2 px-3 sticky-top">
          <Container fluid className="px-3">
            <Button
              variant="outline-secondary"
              className="d-lg-none p-2 me-2"
              onClick={() => setShowOffcanvas(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} strokeWidth={2} />
            </Button>

            <div className="d-flex flex-grow-1 align-items-center gap-2 min-w-0">
              <Button
                variant="outline-secondary"
                size="sm"
                className="d-none d-sm-flex align-items-center gap-2"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={16} />
                <span className="text-muted">Recherche...</span>
                <kbd className="ms-1 px-1 py-0 bg-secondary rounded small">Ctrl+K</kbd>
              </Button>
              <Navbar.Text className="text-truncate ms-2 ms-sm-0">
                Administration Smart Gestion
              </Navbar.Text>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button variant="outline-secondary" size="sm" className="p-2" onClick={toggleTheme} aria-label={dark ? 'Mode clair' : 'Mode sombre'} title={dark ? 'Mode clair' : 'Mode sombre'}>
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </Button>

              <Dropdown align="end" className="d-none d-sm-block">
                <Dropdown.Toggle variant="outline-primary" className="d-flex align-items-center gap-2 rounded-pill px-3 py-2" id="profile-dropdown">
                  <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-semibold small" style={{ width: 32, height: 32 }}>
                    {initials}
                  </div>
                  <div className="text-start d-none d-md-block">
                    <div className="small fw-medium text-body text-truncate" style={{ maxWidth: 120 }}>{displayProfile?.nom_complet || 'Secrétaire'}</div>
                    <div className="small text-muted text-truncate" style={{ maxWidth: 120 }}>{displayProfile?.email}</div>
                  </div>
                  <ChevronDown size={16} />
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow border-0 mt-2">
                  <Dropdown.Header>Mon compte</Dropdown.Header>
                  {isAdmin && (
                    <Dropdown.Item onClick={() => setShowAccessModal(true)} className="d-flex align-items-center">
                      <Users size={16} className="me-2" />Accéder au dashboard Formateur
                    </Dropdown.Item>
                  )}
                  {isFormateur && (
                    <Dropdown.Item onClick={() => { sessionStorage.removeItem('crossAccessAdmin'); navigate('/formateur'); }} className="d-flex align-items-center">
                      <Users size={16} className="me-2" />Retour au dashboard Formateur
                    </Dropdown.Item>
                  )}
                  <Dropdown.Item onClick={handleSignOut} className="d-flex align-items-center">
                    <LogOut size={16} className="me-2" />Déconnexion
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              <Button variant="outline-danger" size="sm" className="d-flex align-items-center gap-2 d-lg-none" onClick={handleSignOut}>
                <LogOut size={18} />
              </Button>
            </div>
          </Container>
        </Navbar>

        <div className="flex-grow-1 p-3 p-md-4 overflow-auto">
          <div className="container-fluid">
            <BreadcrumbNav />
            <Outlet />
          </div>
        </div>
      </main>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <QuickActionsFAB />
      <AccessCodeModal
        show={showAccessModal}
        onHide={() => setShowAccessModal(false)}
        title="Accès dashboard Formateur"
        subtitle="Entrez votre code d'accès personnel (donné à l'inscription) pour accéder au tableau de bord des formateurs."
        verify={verifyCodeForFormateurAccess}
        onSuccess={handleAccessFormateurSuccess}
        onError={(msg) => toast.error(msg)}
      />
    </div>
  );
}
