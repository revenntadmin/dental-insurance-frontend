import { Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { api } from '@/lib/api_client';
import { useDebounce } from '@/hooks/useDebounce';
import { useState } from 'react';

export function ProcedureRow({ pid, value, onChange, onRemove }) {
  const [search, set_search] = useState(value?.cdt_code || '');
  const debounced = useDebounce(search, 200);

  const { data: codes = [] } = useQuery({
    enabled: !!pid && debounced.length >= 2,
    queryKey: ['practice', pid, 'cdt_codes', debounced],
    queryFn: () => api.get(`/api/practice/${pid}/cdt_codes`, { params: { search: debounced } }).then((r) => r.data),
  });

  const matched = codes.find((c) => c.code === value?.cdt_code);
  const requires_tooth = matched?.requires_tooth ?? false;
  const requires_surface = matched?.requires_surface ?? false;

  return (
    <div className="grid grid-cols-12 gap-2 rounded-md border p-3">
      <div className="col-span-3">
        <Input
          placeholder="CDT code"
          value={search}
          list="cdt-list"
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            set_search(v);
            onChange?.({ ...value, cdt_code: v });
          }}
        />
        <datalist id="cdt-list">
          {codes.map((c) => (
            <option key={c.code} value={c.code}>
              {c.description}
            </option>
          ))}
        </datalist>
      </div>
      <div className="col-span-4">
        <Input
          placeholder="Description"
          value={matched?.description || value?.description || ''}
          onChange={(e) => onChange?.({ ...value, description: e.target.value })}
        />
      </div>
      <div className="col-span-1">
        <Input
          placeholder="Tooth"
          disabled={!requires_tooth}
          value={value?.tooth || ''}
          onChange={(e) => onChange?.({ ...value, tooth: e.target.value.toUpperCase() })}
        />
      </div>
      <div className="col-span-2">
        <Input
          placeholder="Surfaces"
          disabled={!requires_surface}
          value={value?.surfaces || ''}
          onChange={(e) => onChange?.({ ...value, surfaces: e.target.value.toUpperCase() })}
        />
      </div>
      <div className="col-span-1">
        <Input
          placeholder="Fee"
          type="number"
          step="0.01"
          value={value?.fee ?? ''}
          onChange={(e) => onChange?.({ ...value, fee: e.target.value })}
        />
      </div>
      <div className="col-span-1 flex justify-end">
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
