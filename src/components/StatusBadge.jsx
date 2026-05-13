import { status_color, status_label } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        status_color(status),
        className,
      )}
    >
      {status_label(status)}
    </span>
  );
}
