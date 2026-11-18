import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const guestLinks = [
  { to: '/about', label: 'Despre noi' },
  { to: '/services', label: 'Servicii' },
  { to: '/prices', label: 'Lista de prețuri' },
  { to: '/gallery', label: 'Galerie' },
  { to: '/contact', label: 'Contact' }
];

function getNavLinks(user) {
  if (!user) return guestLinks;

  if (user.role === 'client') {
    return [
      { to: '/about', label: 'Despre noi' },
      { to: '/services', label: 'Servicii' },
      { to: '/prices', label: 'Lista de prețuri' },
      { to: '/gallery', label: 'Galerie' },
      { to: '/booking', label: 'Programare' },
      { to: '/contact', label: 'Contact' }
    ];
  }

  if (user.role === 'employee') {
    return [
      { to: '/about', label: 'Despre noi' },
      { to: '/gallery', label: 'Galerie' },
      { to: '/contact', label: 'Contact' }
    ];
  }

  return [
    { to: '/about', label: 'Despre noi' },
    { to: '/services', label: 'Servicii' },
    { to: '/prices', label: 'Lista de prețuri' },
    { to: '/gallery', label: 'Galerie' },
    { to: '/contact', label: 'Contact' }
  ];
}

function dashboardLink(user) {
  if (!user) return null;
  if (user.role === 'client') return '/client';
  if (user.role === 'employee') return '/employee';
  return '/admin';
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navLinks = getNavLinks(user);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="container topbar-content">
          <div className="topbar-left">
            <span>@rose.studio</span>
            <span>contact@rosestudio.ro</span>
          </div>
          <div className="topbar-right">
            <span>Luni - Sâmbătă: 09:00 - 20:00</span>
            <span>Duminică: Închis</span>
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="container nav-wrapper">
          <Link to="/" className="logo-block">
            <div className="logo-mark">RS</div>
            <div>
              <span className="logo-title">Rose Studio</span>
              <span className="logo-subtitle">beauty booking platform</span>
            </div>
          </Link>
          <nav className="main-nav">
            {navLinks.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            {user ? (
              <>
                <Link className="button button-light" to={dashboardLink(user)}>Contul meu</Link>
                <button className="button button-primary" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link className="button button-light" to="/login">Login</Link>
                <Link className="button button-primary" to="/register">Creează cont</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <h4>Rose Studio</h4>
            <p>Platformă pentru programări online, istoric client și administrarea activității salonului.</p>
          </div>
          <div>
            <h4>Program</h4>
            <p>Luni - Sâmbătă: 09:00 - 20:00</p>
            <p>Duminică: Închis</p>
          </div>
          <div>
            <h4>Contact</h4>
            <p>Telefon: 0712 345 678</p>
            <p>Email: contact@rosestudio.ro</p>
            <p>București, România</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
