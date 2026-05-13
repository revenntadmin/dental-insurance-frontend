import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { build_intake_url } from '@/lib/qr';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusBadge } from '@/components/StatusBadge';

export function PracticeDetailPage() {
  const { pid } = useParams();
  const qc = useQueryClient();
  const toast = useToast();

  const practice = useQuery({
    enabled: !!pid,
    queryKey: ['admin', 'practices', pid],
    queryFn: () => api.get(`/api/admin/practices/${pid}`).then((r) => r.data),
  });

  const configs = useQuery({
    enabled: !!pid,
    queryKey: ['admin', 'practices', pid, 'configs'],
    queryFn: () => api.get(`/api/admin/practices/${pid}/configs`).then((r) => r.data),
  });

  const set_config = useMutation({
    mutationFn: ({ key, value }) => api.put(`/api/admin/practices/${pid}/configs/${key}`, { value }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'practices', pid, 'configs'] }),
  });

  const clear_config = useMutation({
    mutationFn: ({ key }) => api.delete(`/api/admin/practices/${pid}/configs/${key}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'practices', pid, 'configs'] }),
  });

  const regen = useMutation({
    mutationFn: () => api.post(`/api/admin/practices/${pid}/regenerate_intake_token`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Intake token regenerated');
      qc.invalidateQueries({ queryKey: ['admin', 'practices', pid] });
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  const suspend = useMutation({
    mutationFn: () => api.post(`/api/admin/practices/${pid}/suspend`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'practices', pid] }),
  });

  const activate = useMutation({
    mutationFn: () => api.post(`/api/admin/practices/${pid}/activate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'practices', pid] }),
  });

  const [editing, set_editing] = useState(false);
  const [edit_form, set_edit_form] = useState({});

  const save_practice = useMutation({
    mutationFn: (values) => api.put(`/api/admin/practices/${pid}`, values).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'practices', pid] });
      set_editing(false);
      toast.success('Practice saved');
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  if (practice.isLoading || !practice.data) return <LoadingSpinner />;
  const data = practice.data;

  function start_edit() {
    set_edit_form({
      name: data.name || '',
      npi: data.npi || '',
      address_line_1: data.address_line_1 || '',
      address_line_2: data.address_line_2 || '',
      city: data.city || '',
      state: data.state || '',
      zip: data.postal_code || '',
      phone: data.phone || '',
      email: data.email || '',
      timezone: data.timezone || '',
    });
    set_editing(true);
  }

  return (
    <div>
      <PageHeader
        title={data.name}
        description={`${data.city}, ${data.state} · NPI ${data.npi}`}
        actions={
          <>
            <StatusBadge status={data.status} />
            {data.status === 'active' ? (
              <Button variant="outline" onClick={() => suspend.mutate()}>Suspend</Button>
            ) : (
              <Button onClick={() => activate.mutate()}>Activate</Button>
            )}
          </>
        }
      />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="config">Config overrides</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="qr">Intake QR</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Practice info</CardTitle>
              {!editing && (
                <Button size="sm" variant="outline" onClick={start_edit}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
              )}
            </CardHeader>
            {editing ? (
              <CardContent className="space-y-3 p-6">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['name', 'Name'],
                    ['npi', 'NPI'],
                    ['address_line_1', 'Address line 1'],
                    ['address_line_2', 'Address line 2'],
                    ['city', 'City'],
                    ['state', 'State'],
                    ['zip', 'Zip'],
                    ['phone', 'Phone'],
                    ['email', 'Email'],
                    ['timezone', 'Timezone'],
                  ].map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        value={edit_form[key] ?? ''}
                        onChange={(e) => set_edit_form((p) => ({ ...p, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => set_editing(false)}>Cancel</Button>
                  <Button onClick={() => save_practice.mutate(edit_form)} disabled={save_practice.isPending}>
                    {save_practice.isPending ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            ) : (
              <CardContent className="grid grid-cols-2 gap-4 p-6 text-sm">
                <Field label="Tax ID" value={data.tax_id} />
                <Field label="NPI" value={data.npi} />
                <Field label="Email" value={data.email} />
                <Field label="Phone" value={data.phone} />
                <Field label="Address" value={`${data.address_line_1}, ${data.city}, ${data.state} ${data.postal_code}`} />
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>MFA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.users || []).map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>{u.mfa_enrolled ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Practice overrides</CardTitle>
            </CardHeader>
            <CardContent>
              {configs.isLoading ? (
                <LoadingSpinner />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Override</TableHead>
                      <TableHead>System default</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(configs.data || []).map((row) => (
                      <ConfigRow key={row.key} row={row} on_save={(v) => set_config.mutate({ key: row.key, value: v })} on_clear={() => clear_config.mutate({ key: row.key })} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardContent className="p-6 text-sm">
              <p>Stedi enrolled: {data.stedi_enrolled ? 'Yes' : 'No'}</p>
              <p>GCS bucket: {data.gcs_bucket || '—'}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr">
          {data.intake_token ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <QRCodeDisplay
                url={build_intake_url(data.intake_token)}
                caption={`${data.name} — scan to fill out your new-patient forms`}
                size={300}
              />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Manage intake token</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Regenerating invalidates the old QR.</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="mt-3">
                        Regenerate token
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Regenerate intake token?</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground">
                        Any printed QR codes using the current token will stop working.
                      </p>
                      <DialogFooter>
                        <Button onClick={() => regen.mutate()}>Regenerate</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No intake token. Use the regenerate button to create one.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value || '—'}</p>
    </div>
  );
}

function ConfigRow({ row, on_save, on_clear }) {
  const [editing, set_editing] = useState(false);
  const [value, set_value] = useState(row.override_value ?? '');

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{row.key}</TableCell>
      <TableCell>
        {editing ? (
          <Input value={value} onChange={(e) => set_value(e.target.value)} />
        ) : (
          row.override_value ?? <span className="text-muted-foreground">— uses default —</span>
        )}
      </TableCell>
      <TableCell className="font-mono text-xs">{row.system_default}</TableCell>
      <TableCell className="text-right">
        {editing ? (
          <>
            <Button size="sm" onClick={() => { on_save(value); set_editing(false); }}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => set_editing(false)}>Cancel</Button>
          </>
        ) : (
          <>
            <Button size="icon" variant="ghost" onClick={() => set_editing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            {row.override_value != null && (
              <Button size="icon" variant="ghost" onClick={on_clear}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </>
        )}
      </TableCell>
    </TableRow>
  );
}

