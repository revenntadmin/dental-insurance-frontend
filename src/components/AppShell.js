import { useNavigate } from 'react-router-dom';
import { logout } from '../lib/auth';
import { useAuth } from '../context/AuthContext';

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
