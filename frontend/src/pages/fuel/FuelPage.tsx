import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { FuelLog, Vehicle } from '@/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageTransition } from '@/components/shared/PageTransition';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import { Plus, Fuel, DollarSign } from 'lucide-react';

export function FuelPage() {
  const [showForm, setShowForm] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['fuel-logs', vehicleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (vehicleFilter) params.append('vehicleId', vehicleFilter);
      params.append('limit', '100');
      const res = await api.get(`/fuel-logs?${params}`);
      return res.data as { data: FuelLog[] };
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-all'],
    queryFn: async () => { const res = await api.get('/vehicles?limit=100'); return res.data.data as Vehicle[]; },
  });

  const logs = data?.data || [];

  return (
    <PageTransition>
      <PageHeader
        title="Fuel Logs"
        description="Record fuel purchases and track consumption across your fleet."
        action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Fuel Log</Button>}
      />

      {showForm && (
        <FuelForm onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['fuel-logs'] }); }} />
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} className="w-56">
          <option value="">All Vehicles</option>
          {vehicles?.map(v => <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>)}
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : logs.length === 0 ? (
        <EmptyState title="No fuel logs recorded" description="Record your first fuel entry." action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Fuel Log</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {logs.map((log, i) => (
            <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{log.vehicle?.name}</h3>
                      <p className="text-xs text-muted-foreground">{log.vehicle?.registrationNumber}</p>
                    </div>
                    <span className="text-sm font-semibold">${log.cost}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Fuel className="h-3 w-3" /> {log.liters} L</span>
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> ${(log.cost / log.liters).toFixed(2)}/L</span>
                    <span>{new Date(log.date).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}

function FuelForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ vehicleId: '', liters: 0, cost: 0, date: new Date().toISOString().split('T')[0] });
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
      await api.post('/fuel-logs', form);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add fuel log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-5">
        <h3 className="font-semibold mb-4">Record Fuel Purchase</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Vehicle *</label>
            <Select value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} required>
              <option value="">Select vehicle</option>
              {vehicles?.map(v => <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Liters *</label>
            <Input type="number" step="0.1" value={form.liters || ''} onChange={e => setForm(f => ({ ...f, liters: Number(e.target.value) }))} required min={0} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Cost ($) *</label>
            <Input type="number" step="0.01" value={form.cost || ''} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} required min={0} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Date *</label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading}>{loading ? <Spinner /> : 'Add Record'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
