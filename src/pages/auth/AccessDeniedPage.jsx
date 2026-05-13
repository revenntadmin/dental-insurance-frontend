import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { logout } from '@/lib/auth';

export function AccessDeniedPage() {
  return (
    <div className="space-y-4 text-center">
      <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
      <h1 className="text-xl font-semibold">Access denied</h1>
      <p className="text-sm text-muted-foreground">
        Your account doesn&apos;t have permission to view that page.
      </p>
      <button
        onClick={async () => {
          await logout();
          window.location.href = '/auth/login';
        }}
        className="text-sm text-primary hover:underline"
      >
        Sign out and return
      </button>
      <div>
        <Link to="/auth/login" className="text-sm text-primary hover:underline">
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
