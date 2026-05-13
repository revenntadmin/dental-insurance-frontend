import { forwardRef } from 'react';
import { band, band_label } from '@/lib/confidence';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { Label } from './ui/label';

const BORDER = {
  green: 'border-l-4 border-l-confidence-green',
  yellow: 'border-l-4 border-l-confidence-yellow',
  red: 'border-l-4 border-l-confidence-red',
};

export const ConfidenceField = forwardRef(function ConfidenceField(
  { label, value, confidence, onChange, name, type = 'text', placeholder, className },
  ref,
) {
  const b = band(confidence);
  const display_value = b === 'red' ? '' : value ?? '';

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <Label htmlFor={name}>{label}</Label>
          {b !== 'green' && (
            <span
              className={cn(
                'text-xs font-medium',
                b === 'yellow' ? 'text-confidence-yellow' : 'text-confidence-red',
              )}
            >
              {band_label(b)}
            </span>
          )}
        </div>
      )}
      <Input
        id={name}
        name={name}
        type={type}
        ref={ref}
        value={display_value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(BORDER[b], className)}
      />
    </div>
  );
});
