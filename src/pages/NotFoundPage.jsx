import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">We couldn&apos;t find that page.</p>
        <Link to="/" className="mt-4 inline-block">
          <Button>Go home</Button>
        </Link>
      </div>
    </div>
  );
}
