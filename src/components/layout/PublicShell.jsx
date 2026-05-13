import { Outlet } from 'react-router-dom';

export function PublicShell() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
      <footer className="border-t bg-white px-4 py-3 text-center text-xs text-muted-foreground">
        ClearClaim ·{' '}
        <a href="/help/public" className="underline">
          Why am I seeing this?
        </a>
      </footer>
    </div>
  );
}
