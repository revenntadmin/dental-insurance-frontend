import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  PlugZap,
  ScrollText,
  Activity,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { logout } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/practices', label: 'Practices', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/system-config', label: 'System Config', icon: Settings },
  { to: '/admin/integrations', label: 'Integrations', icon: PlugZap },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/admin/health', label: 'Health', icon: Activity },
];

export function AdminShell() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  async function on_logout() {
    await logout();
    navigate('/auth/login', { replace: true });
  }

  return (
    <div className="admin-theme flex min-h-screen bg-slate-50">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-slate-900 text-slate-100">
        <div className="flex h-14 items-center px-4 border-b border-slate-800">
          <div className="h-8 w-8 rounded-md bg-red-600 text-white flex items-center justify-center font-bold">
            CC
          </div>
          <div className="ml-2">
            <div className="text-xs uppercase tracking-wide text-amber-400">Admin Portal</div>
            <div className="text-sm font-semibold">ClearClaim</div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                  isActive ? 'bg-red-600 text-white' : 'text-slate-200 hover:bg-slate-800',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-2">
          <div className="px-3 py-2 text-xs text-slate-400">{profile?.email}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={on_logout}
            className="w-full justify-start text-slate-200 hover:bg-slate-800"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="app-header sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-white px-4">
          <div className="flex items-center gap-2 text-sm font-medium text-red-700">
            <Activity className="h-4 w-4" /> ClearClaim Admin
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            {profile?.email}
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
