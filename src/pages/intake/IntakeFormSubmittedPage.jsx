import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function IntakeFormSubmittedPage() {
  return (
    <Card>
      <CardContent className="space-y-3 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
        <h1 className="text-lg font-semibold">Thank you!</h1>
        <p className="text-sm text-muted-foreground">
          The front desk will review your information and call you if anything is missing.
        </p>
      </CardContent>
    </Card>
  );
}
