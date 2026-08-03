import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../lib/auth';
import { useAuth } from '../context/AuthContext';

/** The admin sections, in the order a super admin works through them. */
const NAV_LINKS = [
  { to: '/', label: 'Practices', end: true },
  { to: '/admin/payer', label: 'Payers' },
  { to: '/admin/clearinghouse', label: 'Clearinghouses' },
];

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const { profile } = useAuth();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <span className="app-shell__brand">ClearClaim</span>
        <nav className="app-shell__nav">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `app-shell__nav-link${isActive ? ' app-shell__nav-link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="app-shell__actions">
          {profile?.email && <span className="app-shell__user">{profile.email}</span>}
          <button type="button" className="app-shell__logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
