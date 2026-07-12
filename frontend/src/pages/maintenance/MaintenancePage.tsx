import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { MaintenanceLog, Vehicle } from '@/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageTransition } from '@/components/shared/PageTransition';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import { Plus, Wrench, CheckCircle } from 'lucide-react';

export function MaintenancePage() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const res = await api.get('/maintenance?limit=100');
      return res.data as { data: MaintenanceLog[] };
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/maintenance/${id}`, { status: 'CLOSED' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] }),
  });

  const logs = data?.data || [];

  return (
    <PageTransition>
      <PageHeader
        title="Maintenance"
        description="Track vehicle maintenance records. Active maintenance automatically sets vehicle status to 'In Shop'."
        action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> New Record</Button>}
      />

      {showForm && (
        <MaintenanceForm onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['maintenance'] }); }} />
      )}

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : logs.length === 0 ? (
        <EmptyState title="No maintenance records" description="Create your first maintenance record." action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Record</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {logs.map((log, i) => (
            <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{log.description}</h3>
                      <p className="text-xs text-muted-foreground">{log.vehicle?.name} ({log.vehicle?.registrationNumber})</p>
                    </div>
                    <Badge variant={log.status === 'ACTIVE' ? 'destructive' : 'default'}>{log.status}</Badge>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground mb-3">
                    <span>Type: {log.type}</span>
                    <span>Cost: ${log.cost}</span>
                    <span>{new Date(log.date).toLocaleDateString()}</span>
                  </div>
                  {log.status === 'ACTIVE' && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => closeMutation.mutate(log.id)}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Close & Restore Vehicle
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}

function MaintenanceForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ vehicleId: '', description: '', type: 'Preventive', cost: 0, date: new Date().toISOString().split('T')[0] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-all'],
    queryFn: async () => { const res = await api.get('/vehicles?limit=100'); return res.data.data as Vehicle[]; },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/maintenance', form);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create maintenance record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-5">
        <h3 className="font-semibold mb-4">New Maintenance Record</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Creating an active maintenance record will automatically change the vehicle's status to "In Shop", removing it from dispatch selection.
        </p>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Vehicle *</label>
            <Select value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} required>
              <option value="">Select vehicle</option>
              {vehicles?.filter(v => v.status !== 'RETIRED').map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber}) - {v.status.replace('_', ' ')}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Description *</label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required placeholder="e.g., Oil Change & Filter Replacement" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Type *</label>
            <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="Preventive">Preventive</option>
              <option value="Corrective">Corrective</option>
              <option value="Inspection">Inspection</option>
              <option value="Tire">Tire</option>
              <option value="Brake">Brake</option>
              <option value="Engine">Engine</option>
              <option value="Other">Other</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Cost ($)</label>
            <Input type="number" value={form.cost || ''} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} min={0} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Date *</label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading}>{loading ? <Spinner /> : 'Create Record'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
