import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Trip, Vehicle, Driver } from '@/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageTransition } from '@/components/shared/PageTransition';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import { Plus, Route, ArrowRight, Send, CheckCircle, XCircle } from 'lucide-react';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'outline',
  DISPATCHED: 'secondary',
  COMPLETED: 'default',
  CANCELLED: 'destructive',
};

export function TripsPage() {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['trips', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '100');
      const res = await api.get(`/trips?${params}`);
      return res.data as { data: Trip[] };
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/trips/${id}/status`, { status: 'DISPATCHED' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/trips/${id}/status`, { status: 'COMPLETED', ...data }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trips'] }); setSelectedTrip(null); },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/trips/${id}/status`, { status: 'CANCELLED' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });

  const trips = data?.data || [];

  return (
    <PageTransition>
      <PageHeader
        title="Trip Management"
        description="Create, dispatch, complete, and monitor all trips with full validation and automatic status updates."
        action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> New Trip</Button>}
      />

      {showForm && (
        <TripForm onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['trips'] }); }} />
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-40">
          <option value="">All Trips</option>
          <option value="DRAFT">Draft</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : trips.length === 0 ? (
        <EmptyState title="No trips found" description="Create your first trip to begin operations." action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Create Trip</Button>} />
      ) : (
        <div className="space-y-3">
          {trips.map((trip, i) => (
            <motion.div key={trip.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <Card className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{trip.source}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm">{trip.destination}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{trip.vehicle?.name} ({trip.vehicle?.registrationNumber})</span>
                        <span>{trip.driver?.name}</span>
                        <span>{trip.cargoWeight} kg</span>
                        <span>{trip.plannedDistance} km planned</span>
                        {trip.revenue && <span>${trip.revenue}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusColors[trip.status]}>{trip.status}</Badge>
                      {trip.status === 'DRAFT' && (
                        <Button size="sm" variant="outline" onClick={() => dispatchMutation.mutate(trip.id)}>
                          <Send className="h-3 w-3 mr-1" /> Dispatch
                        </Button>
                      )}
                      {trip.status === 'DISPATCHED' && (
                        <>
                          <Button size="sm" variant="default" onClick={() => setSelectedTrip(trip)}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Complete
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => cancelMutation.mutate(trip.id)}>
                            <XCircle className="h-3 w-3 mr-1" /> Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {selectedTrip && selectedTrip.status === 'DISPATCHED' && (
        <CompleteTripDialog
          trip={selectedTrip}
          onSubmit={(data) => completeMutation.mutate({ id: selectedTrip.id, data })}
          onClose={() => setSelectedTrip(null)}
          loading={completeMutation.isPending}
        />
      )}
    </PageTransition>
  );
}

function TripForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    source: '', destination: '', vehicleId: '', driverId: '',
    cargoWeight: 0, plannedDistance: 0, revenue: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-available'],
    queryFn: async () => { const res = await api.get('/vehicles?status=AVAILABLE&limit=100'); return res.data.data as Vehicle[]; },
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers-available'],
    queryFn: async () => { const res = await api.get('/drivers?status=AVAILABLE'); return res.data as Driver[]; },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/trips', form);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-5">
        <h3 className="font-semibold mb-4">Create New Trip</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Select an available vehicle and driver. The system will validate cargo weight against vehicle capacity and driver license validity.
        </p>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Source *</label>
            <Input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} required placeholder="e.g., Warehouse A - NYC" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Destination *</label>
            <Input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Vehicle *</label>
            <Select value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} required>
              <option value="">Select vehicle</option>
              {vehicles?.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber}) - {v.maxLoadCapacity}kg max</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Driver *</label>
            <Select value={form.driverId} onChange={e => setForm(f => ({ ...f, driverId: e.target.value }))} required>
              <option value="">Select driver</option>
              {drivers?.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.licenseNumber})</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Cargo Weight (kg) *</label>
            <Input type="number" value={form.cargoWeight || ''} onChange={e => setForm(f => ({ ...f, cargoWeight: Number(e.target.value) }))} required min={1} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Planned Distance (km) *</label>
            <Input type="number" value={form.plannedDistance || ''} onChange={e => setForm(f => ({ ...f, plannedDistance: Number(e.target.value) }))} required min={1} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Revenue ($)</label>
            <Input type="number" value={form.revenue || ''} onChange={e => setForm(f => ({ ...f, revenue: Number(e.target.value) }))} min={0} />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading}>{loading ? <Spinner /> : 'Create Trip'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function CompleteTripDialog({ trip, onSubmit, onClose, loading }: { trip: Trip; onSubmit: (data: any) => void; onClose: () => void; loading: boolean }) {
  const [form, setForm] = useState({ actualDistance: 0, fuelConsumed: 0, finalOdometer: 0, revenue: trip.revenue || 0 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Complete Trip</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Trip from {trip.source} to {trip.destination}. Enter completion details.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Actual Distance (km) *</label>
              <Input type="number" value={form.actualDistance || ''} onChange={e => setForm(f => ({ ...f, actualDistance: Number(e.target.value) }))} required min={1} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Fuel Consumed (liters) *</label>
              <Input type="number" step="0.1" value={form.fuelConsumed || ''} onChange={e => setForm(f => ({ ...f, fuelConsumed: Number(e.target.value) }))} required min={0} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Final Odometer (km) *</label>
              <Input type="number" value={form.finalOdometer || ''} onChange={e => setForm(f => ({ ...f, finalOdometer: Number(e.target.value) }))} required min={0} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Revenue ($)</label>
              <Input type="number" value={form.revenue || ''} onChange={e => setForm(f => ({ ...f, revenue: Number(e.target.value) }))} min={0} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>{loading ? <Spinner /> : 'Complete Trip'}</Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
