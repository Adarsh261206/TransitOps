import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Trip, Vehicle, Driver } from '@/types';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
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
import { Plus, Route, ArrowRight, Send, CheckCircle, XCircle, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { useToast } from '@/components/shared/Toast';
import { useSearchParams } from 'react-router-dom';
import { SearchableSelect } from '@/components/shared/SearchableSelect';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'outline', DISPATCHED: 'secondary', COMPLETED: 'default', CANCELLED: 'destructive',
};

export function TripsPage() {
  const [searchParams] = useSearchParams();
  const [showWizard, setShowWizard] = useState(searchParams.get('action') === 'create');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['trips', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');
      const res = await api.get(`/trips?${params}`);
      return res.data as { data: Trip[] };
    },
  });

  const mutateStatus = useMutation({
    mutationFn: ({ id, status, data: extra }: { id: string; status: string; data?: any }) =>
      api.patch(`/trips/${id}/status`, { status, ...extra }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast(`Trip ${res.data.status.toLowerCase()} successfully`, 'success');
      setSelectedTrip(null);
    },
    onError: (err: any) => toast(err.response?.data?.error || 'Operation failed', 'error'),
  });

  const trips = data?.data || [];
  const activeTrips = trips.filter(t => t.status === 'DISPATCHED');
  const draftTrips = trips.filter(t => t.status === 'DRAFT');
  const completedTrips = trips.filter(t => t.status === 'COMPLETED');
  const cancelledTrips = trips.filter(t => t.status === 'CANCELLED');

  return (
    <PageTransition>
      <Breadcrumbs />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trips</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, dispatch, complete, and monitor all trips with full validation.</p>
        </div>
        <Button onClick={() => setShowWizard(true)}><Plus className="h-4 w-4 mr-2" /> Create Trip</Button>
      </div>

      {showWizard && <TripWizard onClose={() => setShowWizard(false)} onSuccess={() => { setShowWizard(false); queryClient.invalidateQueries({ queryKey: ['trips'] }); toast('Trip created! Dispatch it from the list.', 'success'); }} />}

      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-40">
          <option value="">All Trips</option>
          <option value="DRAFT">Draft</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { label: 'Draft', count: draftTrips.length, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
          { label: 'Active', count: activeTrips.length, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
          { label: 'Completed', count: completedTrips.length, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
          { label: 'Cancelled', count: cancelledTrips.length, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20' },
        ].map((item, i) => (
          <Card key={item.label} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setStatusFilter(item.label.toUpperCase())}>
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium">{item.label}</span>
              <span className={`text-xl font-bold ${item.color}`}>{item.count}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={5} /> : trips.length === 0 ? (
        <EmptyState title="No trips found" description="Create your first trip to begin operations." action={<Button onClick={() => setShowWizard(true)}><Plus className="h-4 w-4 mr-2" /> Create Trip</Button>} />
      ) : (
        <div className="space-y-2">
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
                        <span>{trip.cargoWeight} kg · {trip.plannedDistance} km</span>
                        {trip.revenue && <span>${trip.revenue}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusColors[trip.status]}>{trip.status}</Badge>
                      {trip.status === 'DRAFT' && (
                        <Button size="sm" variant="outline" onClick={() => mutateStatus.mutate({ id: trip.id, status: 'DISPATCHED' })}>
                          <Send className="h-3 w-3 mr-1" /> Dispatch
                        </Button>
                      )}
                      {trip.status === 'DISPATCHED' && (
                        <>
                          <Button size="sm" variant="default" onClick={() => setSelectedTrip(trip)}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Complete
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => mutateStatus.mutate({ id: trip.id, status: 'CANCELLED' })}>
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
        <CompleteTripDialog trip={selectedTrip} onSubmit={(data) => mutateStatus.mutate({ id: selectedTrip.id, status: 'COMPLETED', data })} onClose={() => setSelectedTrip(null)} loading={mutateStatus.isPending} />
      )}

      <div className="mt-6 rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold mb-2">📋 Business Rules</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Cargo weight must not exceed vehicle's max load capacity.</li>
          <li>• Only Available vehicles and drivers can be assigned.</li>
          <li>• Dispatching a trip changes vehicle & driver status to On Trip.</li>
          <li>• Completing a trip restores both to Available. Cancelling also restores.</li>
        </ul>
      </div>
    </PageTransition>
  );
}

function TripWizard({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: 0, plannedDistance: 0, revenue: 0, goodsType: '', priority: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: vehicles } = useQuery({ queryKey: ['vehicles-available'], queryFn: async () => { const r = await api.get('/vehicles?status=AVAILABLE&limit=100'); return r.data.data as Vehicle[]; } });
  const { data: drivers } = useQuery({ queryKey: ['drivers-available'], queryFn: async () => { const r = await api.get('/drivers?status=AVAILABLE'); return r.data as Driver[]; } });

  const goodsTypeOptions = [
    { value: 'Fragile', label: 'Fragile' },
    { value: 'Hazardous', label: 'Hazardous' },
    { value: 'Perishable', label: 'Perishable' },
    { value: 'Normal', label: 'Normal' },
  ];

  const priorityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' },
  ];

  const steps = [
    { title: 'Source', field: 'source', placeholder: 'e.g., Warehouse A - NYC', type: 'text' },
    { title: 'Destination', field: 'destination', placeholder: 'e.g., Distribution Center - Boston', type: 'text' },
    { title: 'Vehicle', field: 'vehicleId', type: 'select', options: vehicles?.map(v => ({ value: v.id, label: `${v.name} (${v.registrationNumber}) - ${v.maxLoadCapacity}kg max` })) || [] },
    { title: 'Driver', field: 'driverId', type: 'select', options: drivers?.map(d => ({ value: d.id, label: `${d.name} (${d.licenseNumber})` })) || [] },
    { title: 'Cargo Weight', field: 'cargoWeight', placeholder: 'Weight in kg', type: 'number' },
    { title: 'Distance', field: 'plannedDistance', placeholder: 'Distance in km', type: 'number' },
    { title: 'Goods Type', field: 'goodsType', type: 'searchable-select' },
    { title: 'Priority', field: 'priority', type: 'searchable-select' },
    { title: 'Review & Dispatch', field: '', type: 'review' },
  ];

  const selectedVehicle = vehicles?.find(v => v.id === form.vehicleId);
  const capacityUsed = selectedVehicle && form.cargoWeight > 0 ? Math.round((form.cargoWeight / selectedVehicle.maxLoadCapacity) * 100) : 0;
  const estimatedFuel = form.plannedDistance * 0.3;
  const estimatedCost = form.plannedDistance * 1.5;

  const warnings: string[] = [];
  if (selectedVehicle && form.cargoWeight > selectedVehicle.maxLoadCapacity) {
    warnings.push(`Cargo weight (${form.cargoWeight}kg) exceeds vehicle max load (${selectedVehicle.maxLoadCapacity}kg).`);
  }
  if (!form.goodsType) warnings.push('Goods type not specified.');
  if (!form.priority) warnings.push('Priority not specified.');
  if (!form.source || !form.destination) warnings.push('Route incomplete.');
  if (!form.vehicleId) warnings.push('No vehicle assigned.');
  if (!form.driverId) warnings.push('No driver assigned.');
  if (!form.plannedDistance || form.plannedDistance <= 0) warnings.push('Planned distance not set.');

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const createRes = await api.post('/trips', form);
      const tripId = createRes.data.data?.id || createRes.data.id;
      await api.patch(`/trips/${tripId}/status`, { status: 'DISPATCHED' });
      onSuccess();
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to create trip'); } finally { setLoading(false); }
  };

  const current = steps[step];

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Trip Creation Wizard</h3>
          <span className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}</span>
        </div>

        <div className="flex gap-1 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">{current.title}</h4>
          {current.type === 'select' ? (
            <Select value={form[current.field as keyof typeof form] as string} onChange={e => setForm(f => ({ ...f, [current.field]: e.target.value }))} className="w-full" required>
              <option value="">Select {current.title}</option>
              {current.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          ) : current.type === 'searchable-select' ? (
            <SearchableSelect
              options={current.field === 'goodsType' ? goodsTypeOptions : priorityOptions}
              value={form[current.field as keyof typeof form] as string}
              onChange={v => setForm(f => ({ ...f, [current.field]: v }))}
              placeholder={`Select ${current.title}`}
            />
          ) : current.type === 'review' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Vehicle</p>
                  <p className="text-sm font-medium">{selectedVehicle?.name || 'Not selected'}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Driver</p>
                  <p className="text-sm font-medium">{form.driverId ? drivers?.find(d => d.id === form.driverId)?.name : 'Not selected'}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Estimated Fuel</p>
                  <p className="text-sm font-medium">{estimatedFuel.toFixed(1)} L</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Estimated Cost</p>
                  <p className="text-sm font-medium">${estimatedCost.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Capacity Used</p>
                  <p className="text-sm font-medium">{capacityUsed}%</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Goods Type</p>
                  <p className="text-sm font-medium">{form.goodsType || 'Not specified'}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Priority</p>
                  <p className="text-sm font-medium">{form.priority || 'Not specified'}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="text-sm font-medium">{form.plannedDistance || 0} km</p>
                </div>
              </div>
              {warnings.length > 0 && (
                <div className="rounded-lg bg-destructive/10 p-3">
                  <p className="text-xs font-semibold text-destructive mb-1">Warnings</p>
                  <ul className="text-xs text-destructive/80 space-y-0.5">
                    {warnings.map((w, i) => <li key={i}>• {w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <Input type={current.type} placeholder={current.placeholder} value={(form[current.field as keyof typeof form] as number || '') as any} onChange={e => setForm(f => ({ ...f, [current.field]: current.type === 'number' ? Number(e.target.value) : e.target.value }))} required min={0} />
          )}
        </div>

        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground mb-4">
          <strong>Review:</strong> {form.source || '?'} → {form.destination || '?'} · Vehicle: {form.vehicleId ? vehicles?.find(v => v.id === form.vehicleId)?.name : '?'} · Driver: {form.driverId ? drivers?.find(d => d.id === form.driverId)?.name : '?'} · {form.cargoWeight || '?'}kg · {form.plannedDistance || '?'}km · {form.goodsType || '?'} · {form.priority || '?'}
        </div>

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        <div className="flex justify-between">
          <Button variant="outline" onClick={step === 0 ? onClose : () => setStep(s => s - 1)} disabled={loading}>
            {step === 0 ? 'Cancel' : <><ChevronLeft className="h-4 w-4 mr-1" /> Back</>}
          </Button>
          <Button onClick={handleNext} disabled={loading}>
            {loading ? <Spinner /> : step < steps.length - 1 ? <><>Next</> <ChevronRight className="h-4 w-4 ml-1" /></> : 'Create & Dispatch'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CompleteTripDialog({ trip, onSubmit, onClose, loading }: { trip: Trip; onSubmit: (data: any) => void; onClose: () => void; loading: boolean }) {
  const [form, setForm] = useState({ actualDistance: 0, fuelConsumed: 0, finalOdometer: 0, revenue: trip.revenue || 0, toll: 0, remarks: '' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader><CardTitle>Complete Trip</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{trip.source} → {trip.destination}. Enter completion details.</p>
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
            <div className="space-y-1"><label className="text-sm font-medium">Actual Distance (km)</label><Input type="number" value={form.actualDistance || ''} onChange={e => setForm(f => ({ ...f, actualDistance: Number(e.target.value) }))} required min={1} /></div>
            <div className="space-y-1"><label className="text-sm font-medium">Fuel Consumed (L)</label><Input type="number" step="0.1" value={form.fuelConsumed || ''} onChange={e => setForm(f => ({ ...f, fuelConsumed: Number(e.target.value) }))} required min={0} /></div>
            <div className="space-y-1"><label className="text-sm font-medium">Final Odometer (km)</label><Input type="number" value={form.finalOdometer || ''} onChange={e => setForm(f => ({ ...f, finalOdometer: Number(e.target.value) }))} required min={0} /></div>
            <div className="space-y-1"><label className="text-sm font-medium">Revenue ($)</label><Input type="number" value={form.revenue || ''} onChange={e => setForm(f => ({ ...f, revenue: Number(e.target.value) }))} min={0} /></div>
            <div className="space-y-1"><label className="text-sm font-medium">Toll ($)</label><Input type="number" value={form.toll || ''} onChange={e => setForm(f => ({ ...f, toll: Number(e.target.value) }))} min={0} /></div>
            <div className="space-y-1"><label className="text-sm font-medium">Remarks</label><Input type="text" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Any remarks..." /></div>
            <div className="flex gap-2 pt-2"><Button type="submit" disabled={loading}>{loading ? <Spinner /> : 'Complete Trip'}</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
