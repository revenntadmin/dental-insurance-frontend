import { NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext.jsx';

const nav = [
  { to: '/', label: 'Dashboard', exact: true },
  { to: '/patients', label: 'Patients' },
  { to: '/patients/intake-submissions', label: 'Intake Submissions' },
  { to: '/pre-procedure', label: 'Pre-Procedure' },
  { to: '/claims', label: 'Claims' },
  { to: '/providers', label: 'Providers' },
];

const adminNav = [
  { to: '/admin/practices', label: 'Practices' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/integrations', label: 'Integrations' },
  { to: '/admin/system-config', label: 'System Config' },
  { to: '/admin/audit-logs', label: 'Audit Logs' },
];

export default function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="text-xl font-bold text-brand-600">ClearClaim</div>
        <div className="text-xs text-slate-500 mt-0.5">RCM Platform</div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        <div className="px-3 mb-1 text-xs uppercase tracking-wide text-slate-400">Workspace</div>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `block px-5 py-2 text-sm ${isActive ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
        <div className="px-3 mt-4 mb-1 text-xs uppercase tracking-wide text-slate-400">Admin</div>
        {adminNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-5 py-2 text-sm ${isActive ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-3 border-t border-slate-200 text-xs text-slate-500 truncate">
        {user?.email}
      </div>
    </aside>
  );
}
