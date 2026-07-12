import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Vehicle } from '@/types';
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
import { Plus, Search, Truck, Pencil, Trash2, Gauge, Weight, DollarSign, MapPin } from 'lucide-react';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  AVAILABLE: 'default',
  ON_TRIP: 'secondary',
  IN_SHOP: 'destructive',
  RETIRED: 'outline',
};

export function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', search, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      params.append('limit', '100');
      const res = await api.get(`/vehicles?${params}`);
      return res.data as { data: Vehicle[]; total: number };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
  });

  const vehicles = data?.data || [];

  return (
    <PageTransition>
      <PageHeader
        title="Vehicle Registry"
        description="Maintain your master fleet list with registration details, capacities, and real-time status tracking."
        action={
          <Button onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Vehicle
          </Button>
        }
      />

      {showForm && (
        <VehicleForm
          vehicle={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSuccess={() => { setShowForm(false); setEditing(null); queryClient.invalidateQueries({ queryKey: ['vehicles'] }); }}
        />
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or registration..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36">
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="IN_SHOP">In Shop</option>
          <option value="RETIRED">Retired</option>
        </Select>
        <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-36">
          <option value="">All Types</option>
          <option value="Truck">Truck</option>
          <option value="Van">Van</option>
          <option value="Trailer">Trailer</option>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : vehicles.length === 0 ? (
        <EmptyState
          title="No vehicles registered"
          description="Add your first vehicle to start managing your fleet."
          action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Vehicle</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle, i) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="group hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{vehicle.name}</h3>
                      <p className="text-xs text-muted-foreground">{vehicle.registrationNumber}</p>
                    </div>
                    <Badge variant={statusColors[vehicle.status] || 'outline'}>{vehicle.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> {vehicle.type}</span>
                    <span className="flex items-center gap-1"><Weight className="h-3 w-3" /> {vehicle.maxLoadCapacity} kg</span>
                    <span className="flex items-center gap-1"><Gauge className="h-3 w-3" /> {vehicle.odometer.toLocaleString()} km</span>
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> ${vehicle.acquisitionCost.toLocaleString()}</span>
                    {vehicle.region && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {vehicle.region}</span>}
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setEditing(vehicle); setShowForm(true); }}>
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => deleteMutation.mutate(vehicle.id)}>
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
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

function VehicleForm({ vehicle, onClose, onSuccess }: { vehicle: Vehicle | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    registrationNumber: vehicle?.registrationNumber || '',
    name: vehicle?.name || '',
    type: vehicle?.type || 'Truck',
    maxLoadCapacity: vehicle?.maxLoadCapacity || 0,
    odometer: vehicle?.odometer || 0,
    acquisitionCost: vehicle?.acquisitionCost || 0,
    region: vehicle?.region || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (vehicle) {
        await api.put(`/vehicles/${vehicle.id}`, form);
      } else {
        await api.post('/vehicles', form);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-5">
        <h3 className="font-semibold mb-4">{vehicle ? 'Edit Vehicle' : 'Register New Vehicle'}</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Registration Number *</label>
            <Input value={form.registrationNumber} onChange={e => setForm(f => ({ ...f, registrationNumber: e.target.value }))} required placeholder="e.g., TRK-001" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Vehicle Name *</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g., Volvo FH16" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Type *</label>
            <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Trailer">Trailer</option>
              <option value="Bus">Bus</option>
              <option value="Other">Other</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Max Load Capacity (kg) *</label>
            <Input type="number" value={form.maxLoadCapacity} onChange={e => setForm(f => ({ ...f, maxLoadCapacity: Number(e.target.value) }))} required min={1} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Odometer (km)</label>
            <Input type="number" value={form.odometer} onChange={e => setForm(f => ({ ...f, odometer: Number(e.target.value) }))} min={0} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Acquisition Cost ($)</label>
            <Input type="number" value={form.acquisitionCost} onChange={e => setForm(f => ({ ...f, acquisitionCost: Number(e.target.value) }))} min={0} />
          </div>
          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
            <label className="text-sm font-medium">Region</label>
            <Input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} placeholder="e.g., North, South, East, West" />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2 lg:col-span-3">{error}</p>}
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={loading}>{loading ? <Spinner /> : vehicle ? 'Update' : 'Register'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
