import { toast } from 'sonner';

export function useToast() {
  return {
    success: (m, opts) => toast.success(m, opts),
    error: (m, opts) => toast.error(m, opts),
    info: (m, opts) => toast(m, opts),
    warning: (m, opts) => toast.warning(m, opts),
  };
}
