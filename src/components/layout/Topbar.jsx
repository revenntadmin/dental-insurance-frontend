import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { useCurrentPractice } from '../../hooks/use_practice.js';

export default function Topbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { data: practice } = useCurrentPractice();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="text-sm text-slate-600">
        {practice?.practice_name || ''}
      </div>
      <button onClick={handleLogout} className="btn-secondary text-sm">
        Log out
      </button>
    </header>
  );
}
