import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Upload } from 'lucide-react';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { usePatient } from '@/features/patients/usePatient';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { format_date } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { PageHeader } from '@/components/PageHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

export function PatientDetailPage() {
  const pid = useTenancyParam();
  const { patient_id } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: patient, isLoading } = usePatient(pid, patient_id);

  const claims = useQuery({
    enabled: !!pid && !!patient_id,
    queryKey: ['practice', pid, 'claims', { patient_id }],
    queryFn: () => api.get(`/api/practice/${pid}/claims`, { params: { patient_id } }).then((r) => r.data),
  });

  const pre_procs = useQuery({
    enabled: !!pid && !!patient_id,
    queryKey: ['practice', pid, 'patients', patient_id, 'pre_procedures'],
    queryFn: () =>
      api.get(`/api/practice/${pid}/patients/${patient_id}/pre_procedures`).then((r) => r.data),
  });

  const insurances = useQuery({
    enabled: !!pid && !!patient_id,
    queryKey: ['practice', pid, 'patients', patient_id, 'insurances'],
    queryFn: () =>
      api.get(`/api/practice/${pid}/patients/${patient_id}/insurances`).then((r) => r.data),
  });

  const documents = useQuery({
    enabled: !!pid && !!patient_id,
    queryKey: ['practice', pid, 'documents', { patient_id }],
    queryFn: () => api.get(`/api/practice/${pid}/documents`, { params: { patient_id } }).then((r) => r.data),
  });

  // — Insurances CRUD —
  const [ins_modal, set_ins_modal] = useState(null); // null | 'add' | insurance-object
  const [ins_form, set_ins_form] = useState({});
  const [deactivate_ins, set_deactivate_ins] = useState(null);

  const add_insurance = useMutation({
    mutationFn: (body) => api.post(`/api/practice/${pid}/patients/${patient_id}/insurances`, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['practice', pid, 'patients', patient_id, 'insurances'] });
      set_ins_modal(null);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  const edit_insurance = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/api/practice/${pid}/patient_insurances/${id}`, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['practice', pid, 'patients', patient_id, 'insurances'] });
      set_ins_modal(null);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  const deactivate_insurance = useMutation({
    mutationFn: (id) => api.delete(`/api/practice/${pid}/patient_insurances/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['practice', pid, 'patients', patient_id, 'insurances'] });
      set_deactivate_ins(null);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  function open_add_ins() {
    set_ins_form({});
    set_ins_modal('add');
  }

  function open_edit_ins(ins) {
    set_ins_form({ ...ins });
    set_ins_modal(ins);
  }

  function submit_ins() {
    if (ins_modal === 'add') add_insurance.mutate(ins_form);
    else edit_insurance.mutate({ id: ins_modal.id, ...ins_form });
  }

  // — Documents —
  const file_ref = useRef(null);
  const [delete_doc, set_delete_doc] = useState(null);

  const upload_doc = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append('patient_id', patient_id);
      fd.append('document_type', 'general');
      fd.append('file', file);
      return api.post(`/api/practice/${pid}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['practice', pid, 'documents', { patient_id }] });
      toast.success('Document uploaded');
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  const open_doc = useMutation({
    mutationFn: (id) => api.get(`/api/practice/${pid}/documents/${id}`).then((r) => r.data),
    onSuccess: (data) => window.open(data.signed_url, '_blank', 'noreferrer'),
    onError: (e) => toast.error(api_error_message(e)),
  });

  const delete_document = useMutation({
    mutationFn: (id) => api.delete(`/api/practice/${pid}/documents/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['practice', pid, 'documents', { patient_id }] });
      set_delete_doc(null);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!patient) return <EmptyState title="Patient not found" />;

  const ins_pending = add_insurance.isPending || edit_insurance.isPending;

  return (
    <div>
      <PageHeader
        title={`${patient.first_name} ${patient.last_name}`}
        description={`DOB ${format_date(patient.date_of_birth)} · Chart ${patient.chart_number || '—'}`}
        actions={
          <Link to={`/p/${pid}/patients/${patient_id}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          </Link>
        }
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="insurances">Insurances</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="pre">Pre-Procedures</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Demographics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Field label="First name" value={patient.first_name} />
              <Field label="Last name" value={patient.last_name} />
              <Field label="Date of birth" value={format_date(patient.date_of_birth)} />
              <Field label="Sex" value={patient.sex} />
              <Field label="Phone" value={patient.phone} />
              <Field label="Email" value={patient.email} />
              <Field label="Address" value={patient.address_line_1} />
              <Field label="City / State / Zip" value={`${patient.city || ''} ${patient.state || ''} ${patient.postal_code || ''}`} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurances">
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={open_add_ins}>Add insurance</Button>
          </div>
          {insurances.isLoading ? (
            <LoadingSpinner />
          ) : (insurances.data?.items?.length ?? 0) === 0 ? (
            <EmptyState title="No insurances on file" />
          ) : (
            <div className="space-y-3">
              {insurances.data.items.map((ins) => (
                <Card key={ins.id}>
                  <CardContent className="grid grid-cols-2 gap-4 p-4 text-sm">
                    <Field label="Payer" value={ins.payer_name} />
                    <Field label="Member ID" value={ins.subscriber_member_id} />
                    <Field label="Group" value={ins.group_number} />
                    <Field label="Subscriber" value={`${ins.subscriber_first_name || ''} ${ins.subscriber_last_name || ''}`} />
                    <Field label="Type" value={ins.insurance_type} />
                    <Field label="Effective" value={format_date(ins.effective_date)} />
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => open_edit_ins(ins)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => set_deactivate_ins(ins)}>Deactivate</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add/Edit insurance modal */}
          <Dialog open={!!ins_modal} onOpenChange={(open) => !open && set_ins_modal(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{ins_modal === 'add' ? 'Add insurance' : 'Edit insurance'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['insurance_plan_id', 'Insurance plan ID'],
                  ['insurance_type', 'Type (primary/secondary)'],
                  ['subscriber_first_name', 'Subscriber first name'],
                  ['subscriber_last_name', 'Subscriber last name'],
                  ['subscriber_date_of_birth', 'Subscriber DOB'],
                  ['subscriber_member_id', 'Member ID'],
                  ['group_number', 'Group number'],
                  ['group_name', 'Group name'],
                  ['relationship_to_subscriber', 'Relationship'],
                  ['effective_date', 'Effective date'],
                ].map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      value={ins_form[key] ?? ''}
                      onChange={(e) => set_ins_form((p) => ({ ...p, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => set_ins_modal(null)}>Cancel</Button>
                <Button onClick={submit_ins} disabled={ins_pending}>
                  {ins_pending ? 'Saving…' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Deactivate confirm modal */}
          <Dialog open={!!deactivate_ins} onOpenChange={(open) => !open && set_deactivate_ins(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deactivate insurance?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                This will deactivate the {deactivate_ins?.payer_name} record. Continue?
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => set_deactivate_ins(null)}>Cancel</Button>
                <Button
                  variant="destructive"
                  disabled={deactivate_insurance.isPending}
                  onClick={() => deactivate_insurance.mutate(deactivate_ins.id)}
                >
                  {deactivate_insurance.isPending ? 'Deactivating…' : 'Deactivate'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="claims">
          {claims.isLoading ? (
            <LoadingSpinner />
          ) : (claims.data?.items?.length ?? 0) === 0 ? (
            <EmptyState title="No claims yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service date</TableHead>
                  <TableHead>CDT codes</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.data.items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link to={`/p/${pid}/claims/${c.id}`} className="text-primary hover:underline">
                        {format_date(c.service_date)}
                      </Link>
                    </TableCell>
                    <TableCell>{(c.cdt_codes || []).join(', ')}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="pre">
          {pre_procs.isLoading ? (
            <LoadingSpinner />
          ) : (pre_procs.data?.items?.length ?? 0) === 0 ? (
            <EmptyState title="No pre-procedure checks" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pre_procs.data.items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link to={`/p/${pid}/pre-procedure/${p.id}`} className="text-primary hover:underline">
                        {format_date(p.service_date)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="docs">
          <div className="mb-3 flex justify-end">
            <input
              ref={file_ref}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { upload_doc.mutate(f); e.target.value = ''; }
              }}
            />
            <Button size="sm" onClick={() => file_ref.current?.click()} disabled={upload_doc.isPending}>
              <Upload className="mr-2 h-4 w-4" />
              {upload_doc.isPending ? 'Uploading…' : 'Upload document'}
            </Button>
          </div>
          {documents.isLoading ? (
            <LoadingSpinner />
          ) : (documents.data?.items?.length ?? 0) === 0 ? (
            <EmptyState title="No documents" />
          ) : (
            <ul className="divide-y rounded-md border bg-card">
              {documents.data.items.map((d) => (
                <li key={d.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>
                    {d.document_type} · {format_date(d.created_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="text-primary hover:underline"
                      onClick={() => open_doc.mutate(d.id)}
                    >
                      Open
                    </button>
                    <button
                      className="text-destructive hover:underline"
                      onClick={() => set_delete_doc(d)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Delete document confirm modal */}
          <Dialog open={!!delete_doc} onOpenChange={(open) => !open && set_delete_doc(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete document?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                This will permanently delete the document. This cannot be undone.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => set_delete_doc(null)}>Cancel</Button>
                <Button
                  variant="destructive"
                  disabled={delete_document.isPending}
                  onClick={() => delete_document.mutate(delete_doc.id)}
                >
                  {delete_document.isPending ? 'Deleting…' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
