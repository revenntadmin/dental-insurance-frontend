import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { usePatient } from '@/features/patients/usePatient';
import { api } from '@/lib/api_client';
import { format_date } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { PageHeader } from '@/components/PageHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

export function PatientDetailPage() {
  const pid = useTenancyParam();
  const { patient_id } = useParams();
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

  const documents = useQuery({
    enabled: !!pid && !!patient_id,
    queryKey: ['practice', pid, 'documents', { patient_id }],
    queryFn: () => api.get(`/api/practice/${pid}/documents`, { params: { patient_id } }).then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!patient) return <EmptyState title="Patient not found" />;

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
          {(patient.insurances?.length ?? 0) === 0 ? (
            <EmptyState title="No insurances on file" />
          ) : (
            <div className="space-y-3">
              {patient.insurances.map((ins) => (
                <Card key={ins.id}>
                  <CardContent className="grid grid-cols-2 gap-4 p-4 text-sm">
                    <Field label="Payer" value={ins.payer_name} />
                    <Field label="Member ID" value={ins.member_id} />
                    <Field label="Plan / Group" value={ins.group_number} />
                    <Field label="Subscriber" value={ins.subscriber_name} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
                  <a href={d.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    Open
                  </a>
                </li>
              ))}
            </ul>
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
