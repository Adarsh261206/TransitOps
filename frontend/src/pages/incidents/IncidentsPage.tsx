import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Vehicle, Driver } from '@/types';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { PageTransition } from '@/components/shared/PageTransition';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Plus, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/shared/Toast';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { usePermission } from '@/components/auth/PermissionGuard';
import { Permissions } from '@/utils/permissions';
import { validateRequired, type FieldError } from '../../utils/validation';

const severityColors: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  CRITICAL: 'destructive', HIGH: 'destructive', MEDIUM: 'default', LOW: 'secondary',
};

const statusColors: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  REPORTED: 'destructive', INVESTIGATING: 'secondary', RESOLVED: 'default', CLOSED: 'outline',
};

interface Incident {
  id: string; title: string; description?: string; date: string; severity: string; status: string;
  location?: string; resolvedAt?: string; resolution?: string;
  vehicle?: { id: string; name: string; registrationNumber: string };
  driver?: { id: string; name: string; licenseNumber: string };
  reportedBy?: { id: string; name: string };
}

export function IncidentsPage() {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { can } = usePermission();

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', statusFilter, severityFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      params.append('page', String(page));
      params.append('limit', '20');
      const r = await api.get(`/incidents?${params}`);
      return r.data as { data: Incident[]; total: number; page: number; totalPages: number };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/incidents/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incidents'] }); toast('Incident deleted', 'success'); },
    onError: (err: any) => toast(err.response?.data?.error || 'Failed', 'error'),
  });

  const incidents = data?.data || [];

  const columns = [
    { key: 'date', header: 'Date', render: (i: Incident) => new Date(i.date).toLocaleDateString() },
    { key: 'title', header: 'Title', render: (i: Incident) => <span className="font-medium">{i.title}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (i: Incident) => i.vehicle?.name || '-' },
    { key: 'driver', header: 'Driver', render: (i: Incident) => i.driver?.name || '-' },
    { key: 'severity', header: 'Severity', render: (i: Incident) => <Badge variant={severityColors[i.severity]}>{i.severity}</Badge> },
    { key: 'status', header: 'Status', render: (i: Incident) => <Badge variant={statusColors[i.status]}>{i.status}</Badge> },
    { key: 'actions', header: 'Actions', render: (i: Incident) => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        {can(Permissions.INCIDENTS_CREATE) && i.status !== 'CLOSED' && (
          <Select value="" onChange={e => {
            if (!e.target.value) return;
            api.patch(`/incidents/${i.id}`, { status: e.target.value }).then(() => {
              queryClient.invalidateQueries({ queryKey: ['incidents'] });
              toast(`Status changed to ${e.target.value}`, 'success');
            }).catch((err: any) => toast(err.response?.data?.error || 'Failed', 'error'));
          }} className="w-32 h-7 text-xs">
            <option value="">Update</option>
            <option value="INVESTIGATING">Investigate</option>
            <option value="RESOLVED">Resolve</option>
            <option value="CLOSED">Close</option>
          </Select>
        )}
        {can(Permissions.INCIDENTS_CREATE) && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(i.id)}><AlertTriangle className="h-3.5 w-3.5" /></Button>
        )}
      </div>
    )},
  ];

  return (
    <PageTransition>
      <Breadcrumbs />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>
          <p className="mt-1 text-sm text-muted-foreground">Report and track accidents, violations, and safety incidents.</p>
        </div>
        {can(Permissions.INCIDENTS_CREATE) && <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Report Incident</Button>}
      </div>

      {showForm && <IncidentForm onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['incidents'] }); toast('Incident reported', 'success'); }} />}

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="w-36">
          <option value="">All Status</option>
          <option value="REPORTED">Reported</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </Select>
        <Select value={severityFilter} onChange={e => { setSeverityFilter(e.target.value); setPage(1); }} className="w-36">
          <option value="">All Severity</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </Select>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={6} /> : incidents.length === 0 ? (
        <EmptyState title="No incidents reported" description="Report your first incident."
          action={can(Permissions.INCIDENTS_CREATE) ? <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Report Incident</Button> : undefined} />
      ) : (
        <>
          <DataTable columns={columns} data={incidents} />
          <Pagination page={data?.page || 1} totalPages={data?.totalPages || 1} total={data?.total || 0} onPageChange={setPage} />
        </>
      )}
    </PageTransition>
  );
}

function IncidentForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', severity: 'MEDIUM', date: new Date().toISOString().split('T')[0], location: '', vehicleId: '', driverId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const { data: vehicles } = useQuery({ queryKey: ['vehicles-all'], queryFn: async () => { const r = await api.get('/vehicles?limit=100'); return r.data.data as Vehicle[]; } });
  const { data: drivers } = useQuery({ queryKey: ['drivers-all'], queryFn: async () => { const r = await api.get('/drivers?limit=100'); return r.data as Driver[]; } });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast('Title is required', 'error'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/incidents', form);
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to report incident';
      toast(msg, 'error');
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-5">
        <h3 className="font-semibold mb-4">Report Incident</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Title *</label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g., Side mirror collision at Warehouse B" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed description of the incident" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Severity</label>
            <Select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Date</label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Location</label>
            <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g., Highway 101, Mile 42" />
          </div>
          <div className="space-y-1">
            <SearchableSelect label="Vehicle" placeholder="Select vehicle" options={vehicles?.map(v => ({ value: v.id, label: v.name, sublabel: v.registrationNumber })) || []} value={form.vehicleId} onChange={v => setForm(f => ({ ...f, vehicleId: v }))} />
          </div>
          <div className="space-y-1">
            <SearchableSelect label="Driver" placeholder="Select driver" options={drivers?.map(d => ({ value: d.id, label: d.name, sublabel: d.licenseNumber })) || []} value={form.driverId} onChange={v => setForm(f => ({ ...f, driverId: v }))} />
          </div>
          {error && <p className="text-sm text-destructive col-span-2">{error}</p>}
          <div className="flex gap-2 col-span-2">
            <Button type="submit" disabled={loading}>{loading ? <Spinner /> : 'Report Incident'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
