import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { format_datetime } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function SystemConfigPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'system_configs'],
    queryFn: () => api.get('/api/admin/system_configs').then((r) => r.data),
  });
  const update = useMutation({
    mutationFn: ({ key, value }) => api.put(`/api/admin/system_configs/${key}`, { value }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'system_configs'] }),
    onError: (e) => toast.error(api_error_message(e)),
  });

  return (
    <div>
      <PageHeader title="System configuration" />
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Current value</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items || []).map((row) => (
                  <Row key={row.key} row={row} on_save={(v) => update.mutate({ key: row.key, value: v })} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ row, on_save }) {
  const [edit, set_edit] = useState(false);
  const [value, set_value] = useState(row.value);
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{row.key}</TableCell>
      <TableCell>{edit ? <Input value={value} onChange={(e) => set_value(e.target.value)} /> : String(row.value ?? '—')}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{row.description}</TableCell>
      <TableCell className="text-xs">{format_datetime(row.updated_at)}</TableCell>
      <TableCell>
        {edit ? (
          <Button size="sm" onClick={() => { on_save(value); set_edit(false); }}>
            Save
          </Button>
        ) : (
          <Button size="icon" variant="ghost" onClick={() => set_edit(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
