import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Driver } from '@/types';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { PageTransition } from '@/components/shared/PageTransition';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Plus, Search, Pencil, Trash2, Eye, ArrowLeft, Phone, Award, CalendarDays, IdCard, AlertTriangle, Route } from 'lucide-react';
import { useToast } from '@/components/shared/Toast';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  AVAILABLE: 'default', ON_TRIP: 'secondary', OFF_DUTY: 'outline', SUSPENDED: 'destructive',
};

export function DriversPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['drivers', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/drivers?${params}`);
      return res.data as Driver[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/drivers/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['drivers'] }); toast('Driver deleted', 'success'); setDeleteConfirm(null); },
    onError: (err: any) => toast(err.response?.data?.error || 'Failed to delete', 'error'),
  });

  if (selectedDriver) return <DriverProfilePage driver={selectedDriver} onBack={() => setSelectedDriver(null)} />;

  const columns = [
    { key: 'name', header: 'Driver Name', render: (d: Driver) => <span className="font-medium">{d.name}</span> },
    { key: 'licenseNumber', header: 'License No' },
    { key: 'licenseCategory', header: 'Category' },
    { key: 'licenseExpiryDate', header: 'License Expiry', render: (d: Driver) => {
      const expired = new Date(d.licenseExpiryDate) < new Date();
      return <span className={expired ? 'text-destructive font-medium flex items-center gap-1' : ''}>{expired && <AlertTriangle className="h-3 w-3" />}{new Date(d.licenseExpiryDate).toLocaleDateString()}</span>;
    }},
    { key: 'contactNumber', header: 'Contact' },
    { key: 'safetyScore', header: 'Safety Score', render: (d: Driver) => (
      <span className={d.safetyScore >= 8 ? 'text-green-600' : d.safetyScore >= 5 ? 'text-amber-600' : 'text-red-600'}>{d.safetyScore}/10</span>
    )},
    { key: 'status', header: 'Status', render: (d: Driver) => <Badge variant={statusColors[d.status]}>{d.status.replace('_', ' ')}</Badge> },
    { key: 'actions', header: 'Actions', render: (d: Driver) => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedDriver(d)}><Eye className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(d); setShowForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm(d.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ];

  return (
    <PageTransition>
      <Breadcrumbs />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Drivers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage driver profiles, license validity, safety scores, and compliance status.</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus className="h-4 w-4 mr-2" /> Add Driver</Button>
      </div>

      {showForm && (
        <DriverForm driver={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSuccess={() => { setShowForm(false); setEditing(null); queryClient.invalidateQueries({ queryKey: ['drivers'] }); toast(editing ? 'Driver updated' : 'Driver registered', 'success'); }} />
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or license..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36">
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="OFF_DUTY">Off Duty</option>
          <option value="SUSPENDED">Suspended</option>
        </Select>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={8} /> : !drivers?.length ? (
        <EmptyState title="No drivers registered" description="Add your first driver to get started." action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Driver</Button>} />
      ) : (
        <DataTable columns={columns} data={drivers} onRowClick={(d) => setSelectedDriver(d)} />
      )}

      <div className="mt-6 rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold mb-2">📋 Business Rules</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Drivers with <strong>expired licenses</strong> cannot be assigned to trips.</li>
          <li>• Drivers with <strong>Suspended</strong> status cannot be assigned to trips.</li>
          <li>• Drivers already <strong>On Trip</strong> cannot be assigned to another trip.</li>
        </ul>
      </div>

      <ConfirmDialog open={!!deleteConfirm} title="Delete Driver" message="Are you sure you want to delete this driver?" confirmLabel="Delete" onConfirm={() => deleteMutation.mutate(deleteConfirm!)} onCancel={() => setDeleteConfirm(null)} loading={deleteMutation.isPending} />
    </PageTransition>
  );
}

function DriverProfilePage({ driver, onBack }: { driver: Driver; onBack: () => void }) {
  const { data: fullDriver } = useQuery({
    queryKey: ['driver', driver.id],
    queryFn: async () => { const res = await api.get(`/drivers/${driver.id}`); return res.data as Driver; },
    initialData: driver,
  });

  const expired = new Date(fullDriver.licenseExpiryDate) < new Date();

  return (
    <PageTransition>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1"><ArrowLeft className="h-4 w-4" /> Back to Drivers</Button>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold">{fullDriver.name.charAt(0)}</div>
              <div>
                <CardTitle className="text-lg">{fullDriver.name}</CardTitle>
                <Badge variant={statusColors[fullDriver.status]}>{fullDriver.status.replace('_', ' ')}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-muted-foreground">License No</span><p className="font-medium">{fullDriver.licenseNumber}</p></div>
              <div><span className="text-muted-foreground">Category</span><p className="font-medium">{fullDriver.licenseCategory}</p></div>
              <div><span className="text-muted-foreground">Expiry</span><p className={`font-medium ${expired ? 'text-destructive' : ''}`}>{expired ? '⚠ EXPIRED' : new Date(fullDriver.licenseExpiryDate).toLocaleDateString()}</p></div>
              <div><span className="text-muted-foreground">Contact</span><p className="font-medium">{fullDriver.contactNumber}</p></div>
              <div><span className="text-muted-foreground">Safety Score</span><p className="font-medium text-lg">{fullDriver.safetyScore}/10</p></div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Route className="h-4 w-4" /> Trip History</CardTitle></CardHeader>
            <CardContent>
              {fullDriver.trips?.length ? fullDriver.trips.map(t => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm mb-2">
                  <span>{t.source} → {t.destination}</span>
                  <Badge variant={t.status === 'COMPLETED' ? 'default' : 'outline'}>{t.status}</Badge>
                </div>
              )) : <p className="text-sm text-muted-foreground">No trips recorded</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Award className="h-4 w-4" /> Safety History</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1"><span>Safety Score</span><span className="font-medium">{fullDriver.safetyScore}/10</span></div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500" style={{ width: `${(fullDriver.safetyScore / 10) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="rounded-lg bg-muted/50 p-3"><span className="block text-2xl font-bold text-green-600">{fullDriver.safetyScore >= 8 ? 'Good' : fullDriver.safetyScore >= 5 ? 'Average' : 'Needs Improvement'}</span>Rating</div>
                <div className="rounded-lg bg-muted/50 p-3"><span className="block text-2xl font-bold">{fullDriver.trips?.length || 0}</span>Completed Trips</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}

function DriverForm({ driver, onClose, onSuccess }: { driver: Driver | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: driver?.name || '', licenseNumber: driver?.licenseNumber || '', licenseCategory: driver?.licenseCategory || 'Class B',
    licenseExpiryDate: driver?.licenseExpiryDate?.split('T')[0] || '', contactNumber: driver?.contactNumber || '', safetyScore: driver?.safetyScore || 5,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      driver ? await api.put(`/drivers/${driver.id}`, form) : await api.post('/drivers', form);
      onSuccess();
    } catch (err: any) { setError(err.response?.data?.error || 'Operation failed'); } finally { setLoading(false); }
  };

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-5">
        <h3 className="font-semibold mb-1">{driver ? 'Edit Driver' : 'Register New Driver'}</h3>
        <p className="text-xs text-muted-foreground mb-4">Enter driver details. License number must be unique.</p>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1"><label className="text-sm font-medium">Full Name *</label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
          <div className="space-y-1"><label className="text-sm font-medium">License Number *</label><Input value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} required /></div>
          <div className="space-y-1"><label className="text-sm font-medium">License Category *</label>
            <Select value={form.licenseCategory} onChange={e => setForm(f => ({ ...f, licenseCategory: e.target.value }))}>
              <option value="Class A">Class A</option><option value="Class B">Class B</option><option value="Class C">Class C</option><option value="Class D">Class D</option>
            </Select>
          </div>
          <div className="space-y-1"><label className="text-sm font-medium">License Expiry Date *</label><Input type="date" value={form.licenseExpiryDate} onChange={e => setForm(f => ({ ...f, licenseExpiryDate: e.target.value }))} required /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Contact Number *</label><Input value={form.contactNumber} onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))} required /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Safety Score (0-10)</label><Input type="number" step="0.1" min="0" max="10" value={form.safetyScore} onChange={e => setForm(f => ({ ...f, safetyScore: Number(e.target.value) }))} /></div>
          {error && <p className="text-sm text-destructive col-span-2">{error}</p>}
          <div className="flex gap-2 col-span-2"><Button type="submit" disabled={loading}>{loading ? <Spinner /> : driver ? 'Update' : 'Register'}</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
