import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Users,
  ShieldCheck,
  Receipt,
  MessageSquareWarning,
  Building2,
  Stethoscope,
  Menu,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { logout } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

const NAV = [
  { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: 'claims', label: 'Claims', icon: FileText },
  { to: 'pre-procedure/new', label: 'Pre-Procedure', icon: ClipboardCheck },
  { to: 'patients', label: 'Patients', icon: Users },
  { to: 'eligibility/check', label: 'Eligibility', icon: ShieldCheck },
  { to: 'era-receipts', label: 'ERAs', icon: Receipt },
  { to: 'appeals', label: 'Appeals', icon: MessageSquareWarning },
  { to: 'insurance-plans', label: 'Insurance Plans', icon: Building2 },
  { to: 'providers', label: 'Providers', icon: Stethoscope },
];

export function AppShell() {
  const { pid } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [open, set_open] = useState(false);

  async function on_logout() {
    await logout();
    navigate('/auth/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside
        className={cn(
          'flex w-60 shrink-0 flex-col border-r bg-background',
          'fixed inset-y-0 z-30 -translate-x-full transition-transform md:static md:translate-x-0',
          open && 'translate-x-0',
        )}
      >
        <div className="flex h-14 items-center px-4 border-b">
          <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold">
            CC
          </div>
          <span className="ml-2 font-semibold">ClearClaim</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={`/p/${pid}/${item.to}`}
              onClick={() => set_open(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="app-header sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => set_open((v) => !v)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {profile?.practice_name || 'Practice'}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <User className="mr-2 h-4 w-4" />
                {profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email : 'Account'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{profile?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate(`/p/${pid}/account/profile`)}>
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate(`/p/${pid}/account/security`)}>
                <ShieldCheck className="mr-2 h-4 w-4" /> Security
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={on_logout}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
