import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Vehicle } from '@/types';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { PageTransition } from '@/components/shared/PageTransition';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { motion } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, Eye, ArrowLeft, Gauge, Weight, DollarSign, MapPin, Calendar, Fuel, Wrench, Receipt, Route, User, AlertTriangle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/shared/Toast';
import { usePermission } from '../../components/auth/PermissionGuard';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  AVAILABLE: 'default', ON_TRIP: 'secondary', IN_SHOP: 'destructive', RETIRED: 'outline',
};

const vehicleTypeOptions = [
  { value: 'Truck', label: 'Truck' },
  { value: 'Van', label: 'Van' },
  { value: 'Mini Truck', label: 'Mini Truck' },
  { value: 'Container', label: 'Container' },
  { value: 'Pickup', label: 'Pickup' },
  { value: 'Bus', label: 'Bus' },
  { value: 'Other', label: 'Other' },
];

const fuelTypeOptions = [
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Petrol', label: 'Petrol' },
  { value: 'Electric', label: 'Electric' },
  { value: 'CNG', label: 'CNG' },
  { value: 'Hybrid', label: 'Hybrid' },
];

const ownerOptions = [
  { value: 'Company', label: 'Company' },
  { value: 'Lease', label: 'Lease' },
  { value: 'Vendor', label: 'Vendor' },
];

function isExpired(date?: string) {
  return date ? new Date(date) < new Date() : false;
}

export function VehiclesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [page, setPage] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showForm, setShowForm] = useState(searchParams.get('action') === 'add');
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { can } = usePermission();

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', search, statusFilter, typeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      params.append('page', String(page));
      params.append('limit', '10');
      const res = await api.get(`/vehicles?${params}`);
      return res.data as { data: Vehicle[]; total: number; page: number; totalPages: number };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vehicles'] }); toast('Vehicle deleted successfully', 'success'); setDeleteConfirm(null); },
    onError: (err: any) => { toast(err.response?.data?.error || 'Failed to delete', 'error'); },
  });

  if (selectedVehicle) {
    return <VehicleDetailPage vehicle={selectedVehicle} onBack={() => setSelectedVehicle(null)} />;
  }

  const vehicles = data?.data || [];

  const columns = [
    { key: 'registrationNumber', header: 'Reg. Number', render: (v: Vehicle) => <span className="font-medium">{v.registrationNumber}</span> },
    { key: 'name', header: 'Vehicle Name' },
    { key: 'type', header: 'Type' },
    { key: 'maxLoadCapacity', header: 'Capacity', render: (v: Vehicle) => `${v.maxLoadCapacity} kg` },
    { key: 'odometer', header: 'Odometer', render: (v: Vehicle) => `${v.odometer.toLocaleString()} km` },
    { key: 'acquisitionCost', header: 'Cost', render: (v: Vehicle) => `$${v.acquisitionCost.toLocaleString()}` },
    { key: 'status', header: 'Status', render: (v: Vehicle) => <Badge variant={statusColors[v.status]}>{v.status.replace('_', ' ')}</Badge> },
    { key: 'actions', header: 'Actions', render: (v: Vehicle) => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedVehicle(v)}><Eye className="h-3.5 w-3.5" /></Button>
        {can('fleet:edit') && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(v); setShowForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>}
        {can('fleet:delete') && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm(v.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
      </div>
    ) },
  ];

  return (
    <PageTransition>
      <Breadcrumbs />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fleet / Vehicle Registry</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your fleet vehicles, track status, and view complete lifecycle history.</p>
        </div>
        {can('fleet:create') && <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Vehicle
        </Button>}
      </div>

      {showForm && (
        <VehicleForm vehicle={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSuccess={() => { setShowForm(false); setEditing(null); queryClient.invalidateQueries({ queryKey: ['vehicles'] }); toast(editing ? 'Vehicle updated' : 'Vehicle registered', 'success'); }} />
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or registration..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="w-36">
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="IN_SHOP">In Shop</option>
          <option value="RETIRED">Retired</option>
        </Select>
        <Select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="w-36">
          <option value="">All Types</option>
          <option value="Truck">Truck</option>
          <option value="Van">Van</option>
          <option value="Trailer">Trailer</option>
        </Select>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={8} /> : vehicles.length === 0 ? (
        <EmptyState title="No vehicles registered" description="Add your first vehicle to start managing your fleet."         action={can('fleet:create') ? <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Vehicle</Button> : undefined} />
      ) : (
        <>
          <DataTable columns={columns} data={vehicles} onRowClick={(v) => setSelectedVehicle(v)} />
          <Pagination page={data?.page || 1} totalPages={data?.totalPages || 1} total={data?.total || 0} onPageChange={setPage} />
        </>
      )}

      <div className="mt-6 rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold mb-2">📋 Business Rules</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Registration Number must be unique across the fleet.</li>
          <li>• Vehicles marked as <strong>Retired</strong> or <strong>In Shop</strong> cannot be assigned to trips.</li>
          <li>• Creating a maintenance record automatically changes vehicle status to <strong>In Shop</strong>.</li>
          <li>• Completing/Cancelling a trip restores vehicle status to <strong>Available</strong>.</li>
        </ul>
      </div>

      <ConfirmDialog open={!!deleteConfirm} title="Delete Vehicle" message="Are you sure you want to delete this vehicle? This action cannot be undone." confirmLabel="Delete" onConfirm={() => deleteMutation.mutate(deleteConfirm!)} onCancel={() => setDeleteConfirm(null)} loading={deleteMutation.isPending} />
    </PageTransition>
  );
}

function VehicleDetailPage({ vehicle, onBack }: { vehicle: Vehicle; onBack: () => void }) {
  const { data: fullVehicle } = useQuery({
    queryKey: ['vehicle', vehicle.id],
    queryFn: async () => { const res = await api.get(`/vehicles/${vehicle.id}`); return res.data as Vehicle; },
    initialData: vehicle,
  });

  const currentTrip = fullVehicle.trips?.find(t => t.status === 'DISPATCHED');

  return (
    <PageTransition>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1"><ArrowLeft className="h-4 w-4" /> Back to Fleet</Button>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">{fullVehicle.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{fullVehicle.registrationNumber}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Type</span><p className="font-medium">{fullVehicle.type}</p></div>
              <div><span className="text-muted-foreground">Status</span><p><Badge variant={statusColors[fullVehicle.status]}>{fullVehicle.status.replace('_', ' ')}</Badge></p></div>
              <div><span className="text-muted-foreground">Max Load</span><p className="font-medium">{fullVehicle.maxLoadCapacity} kg</p></div>
              <div><span className="text-muted-foreground">Odometer</span><p className="font-medium">{fullVehicle.odometer.toLocaleString()} km</p></div>
              <div><span className="text-muted-foreground">Acquisition Cost</span><p className="font-medium">${fullVehicle.acquisitionCost.toLocaleString()}</p></div>
              {fullVehicle.manufacturer && <div><span className="text-muted-foreground">Manufacturer</span><p className="font-medium">{fullVehicle.manufacturer}</p></div>}
              {fullVehicle.model && <div><span className="text-muted-foreground">Model</span><p className="font-medium">{fullVehicle.model}</p></div>}
              {fullVehicle.fuelType && <div><span className="text-muted-foreground">Fuel Type</span><p className="font-medium">{fullVehicle.fuelType}</p></div>}
              {fullVehicle.owner && <div><span className="text-muted-foreground">Owner</span><p className="font-medium">{fullVehicle.owner}</p></div>}
              {fullVehicle.acquisitionDate && <div><span className="text-muted-foreground">Acquisition Date</span><p className="font-medium">{new Date(fullVehicle.acquisitionDate).toLocaleDateString()}</p></div>}
              {fullVehicle.region && <div><span className="text-muted-foreground">Region</span><p className="font-medium">{fullVehicle.region}</p></div>}
              <div><span className="text-muted-foreground">Insurance Expiry</span><p className="font-medium flex items-center gap-1">{fullVehicle.insuranceExpiry ? new Date(fullVehicle.insuranceExpiry).toLocaleDateString() : 'N/A'} {isExpired(fullVehicle.insuranceExpiry) && <Badge variant="destructive" className="text-[10px] h-4 px-1">Expired</Badge>}</p></div>
              <div><span className="text-muted-foreground">PUC Expiry</span><p className="font-medium flex items-center gap-1">{fullVehicle.pucExpiry ? new Date(fullVehicle.pucExpiry).toLocaleDateString() : 'N/A'} {isExpired(fullVehicle.pucExpiry) && <Badge variant="destructive" className="text-[10px] h-4 px-1">Expired</Badge>}</p></div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {currentTrip && (
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Route className="h-4 w-4" /> Current Trip</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
                  <div className="space-y-1">
                    <span className="font-medium">{currentTrip.source} → {currentTrip.destination}</span>
                    {currentTrip.driver && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>{currentTrip.driver.name}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary">In Progress</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Route className="h-4 w-4" /> Trip History</CardTitle></CardHeader>
            <CardContent>
              {fullVehicle.trips?.length ? (
                <div className="space-y-2">
                  {fullVehicle.trips.filter(t => t.status !== 'DISPATCHED').map(t => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
                      <span>{t.source} → {t.destination}</span>
                      <Badge variant={t.status === 'COMPLETED' ? 'default' : 'outline'}>{t.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No trips recorded</p>}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Wrench className="h-4 w-4" /> Maintenance</CardTitle></CardHeader>
              <CardContent>
                {fullVehicle.maintenanceLogs?.length ? fullVehicle.maintenanceLogs.map(m => (
                  <div key={m.id} className="flex justify-between text-sm py-1"><span>{m.description}</span><span className="text-muted-foreground">${m.cost}</span></div>
                )) : <p className="text-sm text-muted-foreground">No maintenance records</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Fuel className="h-4 w-4" /> Fuel History</CardTitle></CardHeader>
              <CardContent>
                {fullVehicle.fuelLogs?.length ? fullVehicle.fuelLogs.map(f => (
                  <div key={f.id} className="flex justify-between text-sm py-1"><span>{f.liters} L</span><span className="text-muted-foreground">${f.cost}</span></div>
                )) : <p className="text-sm text-muted-foreground">No fuel logs</p>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Receipt className="h-4 w-4" /> Expenses</CardTitle></CardHeader>
            <CardContent>
              {fullVehicle.expenses?.length ? fullVehicle.expenses.map(e => (
                <div key={e.id} className="flex justify-between text-sm py-1"><span>{e.description || e.type}</span><span className="text-muted-foreground">${e.amount}</span></div>
              )) : <p className="text-sm text-muted-foreground">No expenses</p>}
            </CardContent>
          </Card>
        </div>
      </div>
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
    fuelType: vehicle?.fuelType || '',
    owner: vehicle?.owner || '',
    acquisitionDate: vehicle?.acquisitionDate || '',
    manufacturer: vehicle?.manufacturer || '',
    model: vehicle?.model || '',
    insuranceExpiry: vehicle?.insuranceExpiry || '',
    pucExpiry: vehicle?.pucExpiry || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      vehicle ? await api.put(`/vehicles/${vehicle.id}`, form) : await api.post('/vehicles', form);
      onSuccess();
    } catch (err: any) { setError(err.response?.data?.error || 'Operation failed'); } finally { setLoading(false); }
  };

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-5">
        <h3 className="font-semibold mb-1">{vehicle ? 'Edit Vehicle' : 'Register New Vehicle'}</h3>
        <p className="text-xs text-muted-foreground mb-4">Fill in the vehicle details. Registration number must be unique across the fleet.</p>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1"><label className="text-sm font-medium">Registration Number *</label><Input value={form.registrationNumber} onChange={e => setForm(f => ({ ...f, registrationNumber: e.target.value }))} required placeholder="e.g., TRK-001" /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Vehicle Name *</label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g., Volvo FH16" /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Type *</label>
            <SearchableSelect options={vehicleTypeOptions} value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} placeholder="Select type" />
          </div>
          <div className="space-y-1"><label className="text-sm font-medium">Manufacturer</label><Input value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} placeholder="e.g., Volvo" /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Model</label><Input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="e.g., FH16" /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Max Load Capacity (kg) *</label><Input type="number" value={form.maxLoadCapacity || ''} onChange={e => setForm(f => ({ ...f, maxLoadCapacity: Number(e.target.value) }))} required min={1} /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Odometer (km)</label><Input type="number" value={form.odometer || ''} onChange={e => setForm(f => ({ ...f, odometer: Number(e.target.value) }))} min={0} /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Acquisition Cost ($)</label><Input type="number" value={form.acquisitionCost || ''} onChange={e => setForm(f => ({ ...f, acquisitionCost: Number(e.target.value) }))} min={0} /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Acquisition Date</label><Input type="date" value={form.acquisitionDate} onChange={e => setForm(f => ({ ...f, acquisitionDate: e.target.value }))} /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Fuel Type</label>
            <SearchableSelect options={fuelTypeOptions} value={form.fuelType} onChange={v => setForm(f => ({ ...f, fuelType: v }))} placeholder="Select fuel type" />
          </div>
          <div className="space-y-1"><label className="text-sm font-medium">Owner</label>
            <SearchableSelect options={ownerOptions} value={form.owner} onChange={v => setForm(f => ({ ...f, owner: v }))} placeholder="Select owner" />
          </div>
          <div className="space-y-1"><label className="text-sm font-medium">Insurance Expiry</label><Input type="date" value={form.insuranceExpiry} onChange={e => setForm(f => ({ ...f, insuranceExpiry: e.target.value }))} /></div>
          <div className="space-y-1"><label className="text-sm font-medium">PUC Expiry</label><Input type="date" value={form.pucExpiry} onChange={e => setForm(f => ({ ...f, pucExpiry: e.target.value }))} /></div>
          <div className="space-y-1 sm:col-span-2 lg:col-span-3"><label className="text-sm font-medium">Region</label><Input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} placeholder="e.g., North, South" /></div>
          {error && <p className="text-sm text-destructive col-span-full">{error}</p>}
          <div className="flex gap-2 col-span-full"><Button type="submit" disabled={loading}>{loading ? <Spinner /> : vehicle ? 'Update Vehicle' : 'Register Vehicle'}</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
