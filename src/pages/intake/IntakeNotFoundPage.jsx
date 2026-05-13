import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function IntakeNotFoundPage() {
  return (
    <Card>
      <CardContent className="space-y-3 p-6 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-600" />
        <h1 className="text-lg font-semibold">This link is no longer active</h1>
        <p className="text-sm text-muted-foreground">
          The practice may have generated a new code. Please ask the front desk for the latest QR code.
        </p>
      </CardContent>
    </Card>
  );
}
