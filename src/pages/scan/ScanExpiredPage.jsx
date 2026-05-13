import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function ScanExpiredPage() {
  return (
    <Card>
      <CardContent className="space-y-3 p-6 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-600" />
        <h1 className="text-lg font-semibold">This link has expired</h1>
        <p className="text-sm text-muted-foreground">
          Please ask the front desk to generate a new QR code.
        </p>
      </CardContent>
    </Card>
  );
}
