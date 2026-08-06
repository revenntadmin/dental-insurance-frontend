import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { logout } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { useTenancyGuard } from '../hooks/useTenancyGuard';
import { displayName, isPracticeAdmin, practiceBasePath } from '../lib/authNavigation';

export default function PracticeShell({ children }) {
  const navigate = useNavigate();
  const { pid } = useParams();
  const { profile } = useAuth();
  const { loading } = useTenancyGuard();
  const base = practiceBasePath(pid || profile?.practice_id);
  const canManageUsers = isPracticeAdmin(profile);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  return (
    <div className="practice-shell">
      <aside className="practice-shell__sidebar">
        <div className="practice-shell__brand">
          <span className="practice-shell__brand-name">ClearClaim</span>
          {profile?.practice_name && (
            <span className="practice-shell__practice-name">{profile.practice_name}</span>
          )}
        </div>

        <nav className="practice-shell__nav">
          <NavLink
            to={`${base}/dashboard`}
            className={({ isActive }) =>
              `practice-shell__nav-link${isActive ? ' practice-shell__nav-link--active' : ''}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to={`${base}/patients`}
            className={({ isActive }) =>
              `practice-shell__nav-link${isActive ? ' practice-shell__nav-link--active' : ''}`
            }
          >
            Patients
          </NavLink>
          <NavLink
            to={`${base}/appointments`}
            className={({ isActive }) =>
              `practice-shell__nav-link${isActive ? ' practice-shell__nav-link--active' : ''}`
            }
          >
            Appointments
          </NavLink>
        </nav>

        <div className="practice-shell__account" ref={menuRef}>
          <button
            type="button"
            className="practice-shell__account-btn"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="practice-shell__account-name">{displayName(profile)}</span>
            <span className="practice-shell__account-email">{profile?.email}</span>
          </button>

          {menuOpen && (
            <div className="practice-shell__account-menu" role="menu">
              <NavLink
                to={`${base}/account/profile`}
                className="practice-shell__account-menu-item"
                role="menuitem"
                onClick={closeMenu}
              >
                Profile
              </NavLink>
              {canManageUsers && (
                <NavLink
                  to={`${base}/account/users`}
                  className="practice-shell__account-menu-item"
                  role="menuitem"
                  onClick={closeMenu}
                >
                  User Management
                </NavLink>
              )}
              <NavLink
                to={`${base}/account/settings`}
                className="practice-shell__account-menu-item"
                role="menuitem"
                onClick={closeMenu}
              >
                Practice Settings
              </NavLink>
              <button
                type="button"
                className="practice-shell__account-menu-item practice-shell__account-menu-item--danger"
                role="menuitem"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="practice-shell__main">
        <header className="practice-shell__header">
          <div className="practice-shell__header-user">
            <span className="practice-shell__header-name">{displayName(profile)}</span>
            <span className="practice-shell__header-email">{profile?.email}</span>
          </div>
        </header>
        <main className="practice-shell__content">{children}</main>
      </div>
    </div>
  );
}
