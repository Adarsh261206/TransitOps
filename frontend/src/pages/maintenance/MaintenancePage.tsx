import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { MaintenanceLog, Vehicle } from '@/types';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { PageTransition } from '@/components/shared/PageTransition';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { DataTable } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import { Plus, Wrench, CheckCircle, Building2 } from 'lucide-react';
import { useToast } from '@/components/shared/Toast';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { usePermission } from '../../components/auth/PermissionGuard';
import { validateRequired, validateNumber, validateDateString, type FieldError, getFieldError } from '../../utils/validation';

export function MaintenancePage() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { can } = usePermission();

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => { const res = await api.get('/maintenance?limit=100'); return res.data as { data: MaintenanceLog[] }; },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/maintenance/${id}`, { status: 'CLOSED' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['maintenance'] }); toast('Maintenance closed. Vehicle restored to Available.', 'success'); },
    onError: (err: any) => toast(err.response?.data?.error || 'Failed', 'error'),
  });

  const logs = data?.data || [];

  const columns = [
    { key: 'vehicle', header: 'Vehicle', render: (l: MaintenanceLog) => <span className="font-medium">{l.vehicle?.name} <span className="text-muted-foreground">({l.vehicle?.registrationNumber})</span></span> },
    { key: 'description', header: 'Service' },
    { key: 'type', header: 'Type' },
    { key: 'priority', header: 'Priority', render: (l: MaintenanceLog) => l.priority ? <Badge variant={l.priority === 'Critical' ? 'destructive' : 'default'}>{l.priority}</Badge> : '-' },
    { key: 'expectedCompletion', header: 'Expected Completion', render: (l: MaintenanceLog) => l.expectedCompletion ? new Date(l.expectedCompletion).toLocaleDateString() : '-' },
    { key: 'cost', header: 'Cost', render: (l: MaintenanceLog) => `$${l.cost}` },
    { key: 'date', header: 'Date', render: (l: MaintenanceLog) => new Date(l.date).toLocaleDateString() },
    { key: 'status', header: 'Status', render: (l: MaintenanceLog) => (
      <div className="flex items-center gap-2">
        <Badge variant={l.status === 'ACTIVE' ? 'destructive' : 'default'}>{l.status}</Badge>
        {l.status === 'ACTIVE' && can('maintenance:close') && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => closeMutation.mutate(l.id)}><CheckCircle className="h-3 w-3 mr-1" /> Close</Button>}
      </div>
    )},
  ];

  return (
    <PageTransition>
      <Breadcrumbs />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track vehicle maintenance. Active records automatically set vehicles to 'In Shop'.</p>
        </div>
        {can('maintenance:create') && <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Log Maintenance</Button>}
      </div>

      {showForm && <MaintenanceForm onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['maintenance'] }); toast('Maintenance logged. Vehicle set to In Shop.', 'success'); }} />}

      {isLoading ? <TableSkeleton rows={5} cols={6} /> : logs.length === 0 ? (
        <EmptyState title="No maintenance records" description="Log your first maintenance record."         action={can('maintenance:create') ? <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Log Maintenance</Button> : undefined} />
      ) : <DataTable columns={columns} data={logs} />}

      <div className="mt-6 rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold mb-2">📋 Business Rules</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Creating an active maintenance record changes vehicle status <strong>Available → In Shop</strong>.</li>
          <li>• Closing maintenance restores vehicle <strong>In Shop → Available</strong> (unless Retired).</li>
          <li>• Vehicles in maintenance are excluded from trip dispatch selection.</li>
        </ul>
      </div>
    </PageTransition>
  );
}

function MaintenanceForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ vehicleId: '', description: '', type: 'Oil Change', cost: 0, date: new Date().toISOString().split('T')[0], vendor: '', priority: '', expectedCompletion: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const { toast } = useToast();

  const { data: vehicles } = useQuery({ queryKey: ['vehicles-all'], queryFn: async () => { const r = await api.get('/vehicles?limit=100'); return r.data.data as Vehicle[]; } });

  function validate() {
    const errs: FieldError[] = [];
    const ve = validateRequired(form.vehicleId, 'Vehicle');
    if (ve) errs.push({ field: 'vehicleId', message: ve });
    const de = validateRequired(form.description, 'Service Description');
    if (de) errs.push({ field: 'description', message: de });
    const ce = validateNumber(form.cost, 'Cost', 1);
    if (ce) errs.push({ field: 'cost', message: ce });
    const dte = validateDateString(form.date, 'Date');
    if (dte) errs.push({ field: 'date', message: dte });
    if (form.expectedCompletion) {
      const ece = validateDateString(form.expectedCompletion, 'Expected Completion');
      if (ece) errs.push({ field: 'expectedCompletion', message: ece });
    }
    return errs;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) {
      toast('Please fix errors', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/maintenance', form);
      toast('Maintenance logged successfully', 'success');
      onSuccess();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed', 'error');
      setError(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-5">
        <h3 className="font-semibold mb-1">Log Maintenance</h3>
        <p className="text-xs text-muted-foreground mb-4">Vehicle status will automatically change to In Shop.</p>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <SearchableSelect
              label="Vehicle *"
              placeholder="Select vehicle"
              options={vehicles?.filter(v => v.status !== 'RETIRED').map(v => ({
                value: v.id,
                label: v.name,
                sublabel: `${v.registrationNumber} - ${v.status.replace('_', ' ')}`
              })) || []}
              value={form.vehicleId}
              onChange={v => { setForm(f => ({ ...f, vehicleId: v })); setErrors(errs => errs.filter(e => e.field !== 'vehicleId')); }}
            />
            {getFieldError(errors, 'vehicleId') && <p className="text-sm text-destructive">{getFieldError(errors, 'vehicleId')}</p>}
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Service Description *</label>
            <Input className={getFieldError(errors, 'description') ? 'border-destructive' : ''} value={form.description} onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(errs => errs.filter(e => e.field !== 'description')); }} required placeholder="e.g., Oil Change & Filter Replacement" />
            {getFieldError(errors, 'description') && <p className="text-sm text-destructive">{getFieldError(errors, 'description')}</p>}
          </div>
          <div className="space-y-1">
            <SearchableSelect
              label="Service Type *"
              placeholder="Select type"
              options={[
                { value: 'Oil Change', label: 'Oil Change' },
                { value: 'Tyre', label: 'Tyre' },
                { value: 'Engine', label: 'Engine' },
                { value: 'Brake', label: 'Brake' },
                { value: 'Insurance', label: 'Insurance' },
                { value: 'Repair', label: 'Repair' },
                { value: 'Inspection', label: 'Inspection' },
                { value: 'Other', label: 'Other' },
              ]}
              value={form.type}
              onChange={v => setForm(f => ({ ...f, type: v }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Cost ($) *</label>
            <Input className={getFieldError(errors, 'cost') ? 'border-destructive' : ''} type="number" value={form.cost || ''} onChange={e => { setForm(f => ({ ...f, cost: Number(e.target.value) })); setErrors(errs => errs.filter(e => e.field !== 'cost')); }} required min={0} />
            {getFieldError(errors, 'cost') && <p className="text-sm text-destructive">{getFieldError(errors, 'cost')}</p>}
          </div>
          <div className="space-y-1">
            <SearchableSelect
              label="Priority"
              placeholder="Select priority"
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Critical', label: 'Critical' },
              ]}
              value={form.priority}
              onChange={v => setForm(f => ({ ...f, priority: v }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Date *</label>
            <Input className={getFieldError(errors, 'date') ? 'border-destructive' : ''} type="date" value={form.date} onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setErrors(errs => errs.filter(e => e.field !== 'date')); }} required />
            {getFieldError(errors, 'date') && <p className="text-sm text-destructive">{getFieldError(errors, 'date')}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Expected Completion</label>
            <Input className={getFieldError(errors, 'expectedCompletion') ? 'border-destructive' : ''} type="date" value={form.expectedCompletion} onChange={e => { setForm(f => ({ ...f, expectedCompletion: e.target.value })); setErrors(errs => errs.filter(e => e.field !== 'expectedCompletion')); }} />
            {getFieldError(errors, 'expectedCompletion') && <p className="text-sm text-destructive">{getFieldError(errors, 'expectedCompletion')}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Vendor</label>
            <Input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="e.g., AutoPro Services" />
          </div>
          {error && <p className="text-sm text-destructive col-span-2">{error}</p>}
          <div className="flex gap-2 col-span-2"><Button type="submit" disabled={loading}>{loading ? <Spinner /> : 'Log Maintenance'}</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
