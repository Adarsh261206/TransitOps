import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Driver } from '@/types';
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
import { Plus, Search, Users, Pencil, Trash2, Phone, Award, CalendarDays, IdCard } from 'lucide-react';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  AVAILABLE: 'default',
  ON_TRIP: 'secondary',
  OFF_DUTY: 'outline',
  SUSPENDED: 'destructive',
};

export function DriversPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const queryClient = useQueryClient();

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  });

  return (
    <PageTransition>
      <PageHeader
        title="Driver Management"
        description="Manage driver profiles, licenses, safety scores, and availability status."
        action={
          <Button onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Driver
          </Button>
        }
      />

      {showForm && (
        <DriverForm
          driver={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSuccess={() => { setShowForm(false); setEditing(null); queryClient.invalidateQueries({ queryKey: ['drivers'] }); }}
        />
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
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

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : !drivers?.length ? (
        <EmptyState title="No drivers registered" description="Add your first driver to get started." action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Driver</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver, i) => {
            const isExpired = new Date(driver.licenseExpiryDate) < new Date();
            return (
              <motion.div key={driver.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="group hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{driver.name}</h3>
                        <p className="text-xs text-muted-foreground">{driver.licenseNumber}</p>
                      </div>
                      <Badge variant={statusColors[driver.status] || 'outline'}>{driver.status.replace('_', ' ')}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><IdCard className="h-3 w-3" /> {driver.licenseCategory}</span>
                      <span className="flex items-center gap-1"><Award className="h-3 w-3" /> Score: {driver.safetyScore}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {driver.contactNumber}</span>
                      <span className={`flex items-center gap-1 ${isExpired ? 'text-destructive' : ''}`}>
                        <CalendarDays className="h-3 w-3" />
                        {isExpired ? 'EXPIRED' : new Date(driver.licenseExpiryDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setEditing(driver); setShowForm(true); }}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => deleteMutation.mutate(driver.id)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}

function DriverForm({ driver, onClose, onSuccess }: { driver: Driver | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: driver?.name || '',
    licenseNumber: driver?.licenseNumber || '',
    licenseCategory: driver?.licenseCategory || 'Class B',
    licenseExpiryDate: driver?.licenseExpiryDate?.split('T')[0] || '',
    contactNumber: driver?.contactNumber || '',
    safetyScore: driver?.safetyScore || 5,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (driver) {
        await api.put(`/drivers/${driver.id}`, form);
      } else {
        await api.post('/drivers', form);
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
        <h3 className="font-semibold mb-4">{driver ? 'Edit Driver' : 'Register New Driver'}</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Full Name *</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">License Number *</label>
            <Input value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">License Category *</label>
            <Select value={form.licenseCategory} onChange={e => setForm(f => ({ ...f, licenseCategory: e.target.value }))}>
              <option value="Class A">Class A</option>
              <option value="Class B">Class B</option>
              <option value="Class C">Class C</option>
              <option value="Class D">Class D</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">License Expiry Date *</label>
            <Input type="date" value={form.licenseExpiryDate} onChange={e => setForm(f => ({ ...f, licenseExpiryDate: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Contact Number *</label>
            <Input value={form.contactNumber} onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Safety Score (0-10)</label>
            <Input type="number" step="0.1" min="0" max="10" value={form.safetyScore} onChange={e => setForm(f => ({ ...f, safetyScore: Number(e.target.value) }))} />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading}>{loading ? <Spinner /> : driver ? 'Update' : 'Register'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
