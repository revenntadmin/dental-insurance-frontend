import { Outlet } from 'react-router-dom';

export function AuthShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
            CC
          </div>
          <span className="text-xl font-semibold">ClearClaim</span>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
