import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { FuelLog, Expense, Vehicle } from '@/types';
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
import { Plus, Fuel, Receipt, DollarSign, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/shared/Toast';
import { useSearchParams } from 'react-router-dom';

export function FuelExpensesPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'fuel' | 'expense'>('fuel');
  const [showFuelForm, setShowFuelForm] = useState(searchParams.get('action') === 'fuel');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: fuelData, isLoading: fuelLoading } = useQuery({
    queryKey: ['fuel-logs', vehicleFilter],
    queryFn: async () => { const params = new URLSearchParams(); if (vehicleFilter) params.append('vehicleId', vehicleFilter); params.append('limit', '100'); const r = await api.get(`/fuel-logs?${params}`); return r.data as { data: FuelLog[] }; },
  });

  const { data: expenseData, isLoading: expenseLoading } = useQuery({
    queryKey: ['expenses', vehicleFilter],
    queryFn: async () => { const params = new URLSearchParams(); if (vehicleFilter) params.append('vehicleId', vehicleFilter); params.append('limit', '100'); const r = await api.get(`/expenses?${params}`); return r.data as { data: Expense[] }; },
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-all'],
    queryFn: async () => { const r = await api.get('/vehicles?limit=100'); return r.data.data as Vehicle[]; },
  });

  const fuelLogs = fuelData?.data || [];
  const expenses = expenseData?.data || [];
  const totalFuel = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <PageTransition>
      <Breadcrumbs />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fuel & Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track fuel consumption, costs, and all operational expenses per vehicle.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFuelForm(true)}><Fuel className="h-4 w-4 mr-2" /> Add Fuel</Button>
          <Button onClick={() => setShowExpenseForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Expense</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="rounded-lg bg-blue-100 dark:bg-blue-900/20 p-2.5"><Fuel className="h-5 w-5 text-blue-600" /></div><div><p className="text-xs text-muted-foreground">Total Fuel Cost</p><p className="text-xl font-bold">${totalFuel.toLocaleString()}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="rounded-lg bg-purple-100 dark:bg-purple-900/20 p-2.5"><Receipt className="h-5 w-5 text-purple-600" /></div><div><p className="text-xs text-muted-foreground">Total Expenses</p><p className="text-xl font-bold">${totalExpenses.toLocaleString()}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="rounded-lg bg-primary/10 p-2.5"><DollarSign className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Combined Total</p><p className="text-xl font-bold">${(totalFuel + totalExpenses).toLocaleString()}</p></div></CardContent></Card>
      </div>

      {showFuelForm && <FuelForm onClose={() => setShowFuelForm(false)} onSuccess={() => { setShowFuelForm(false); queryClient.invalidateQueries({ queryKey: ['fuel-logs'] }); toast('Fuel log added', 'success'); }} />}
      {showExpenseForm && <ExpenseForm onClose={() => setShowExpenseForm(false)} onSuccess={() => { setShowExpenseForm(false); queryClient.invalidateQueries({ queryKey: ['expenses'] }); toast('Expense added', 'success'); }} />}

      <div className="flex gap-1 mb-4 border-b">
        <button onClick={() => setActiveTab('fuel')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'fuel' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>Fuel Logs</button>
        <button onClick={() => setActiveTab('expense')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'expense' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>Expenses</button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} className="w-56">
          <option value="">All Vehicles</option>
          {vehicles?.map(v => <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>)}
        </Select>
      </div>

      {activeTab === 'fuel' && (
        fuelLoading ? <TableSkeleton rows={4} cols={4} /> : fuelLogs.length === 0 ? (
          <EmptyState title="No fuel logs" description="Record your first fuel entry." action={<Button onClick={() => setShowFuelForm(true)}><Fuel className="h-4 w-4 mr-2" /> Add Fuel</Button>} />
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Vehicle</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Liters</th><th className="px-4 py-3 font-medium">Cost</th><th className="px-4 py-3 font-medium">Rate</th>
              </tr></thead>
              <tbody>
                {fuelLogs.map(f => (
                  <tr key={f.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{f.vehicle?.name} <span className="text-muted-foreground">({f.vehicle?.registrationNumber})</span></td>
                    <td className="px-4 py-3">{new Date(f.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{f.liters} L</td>
                    <td className="px-4 py-3">${f.cost}</td>
                    <td className="px-4 py-3">${(f.cost / f.liters).toFixed(2)}/L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === 'expense' && (
        expenseLoading ? <TableSkeleton rows={4} cols={5} /> : expenses.length === 0 ? (
          <EmptyState title="No expenses" description="Add your first expense entry." action={<Button onClick={() => setShowExpenseForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Expense</Button>} />
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Vehicle</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Description</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Amount</th>
              </tr></thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{e.vehicle?.name} <span className="text-muted-foreground">({e.vehicle?.registrationNumber})</span></td>
                    <td className="px-4 py-3"><Badge variant="secondary">{e.type}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{e.description || '-'}</td>
                    <td className="px-4 py-3">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium">${e.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <div className="mt-6 rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold mb-2">📋 Business Rules</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Total Operational Cost = Fuel Cost + Maintenance Cost (auto-calculated).</li>
          <li>• Fuel efficiency is computed as Distance / Fuel consumed per vehicle.</li>
          <li>• All costs are tracked per vehicle for accurate reporting.</li>
        </ul>
      </div>
    </PageTransition>
  );
}

function FuelForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ vehicleId: '', liters: 0, cost: 0, date: new Date().toISOString().split('T')[0] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: vehicles } = useQuery({ queryKey: ['vehicles-all'], queryFn: async () => { const r = await api.get('/vehicles?limit=100'); return r.data.data as Vehicle[]; } });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await api.post('/fuel-logs', form); onSuccess(); } catch (err: any) { setError(err.response?.data?.error || 'Failed'); } finally { setLoading(false); }
  };

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-5">
        <h3 className="font-semibold mb-4">Record Fuel Purchase</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2"><label className="text-sm font-medium">Vehicle *</label>
            <Select value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} required>
              <option value="">Select vehicle</option>
              {vehicles?.map(v => <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>)}
            </Select>
          </div>
          <div className="space-y-1"><label className="text-sm font-medium">Liters *</label><Input type="number" step="0.1" value={form.liters || ''} onChange={e => setForm(f => ({ ...f, liters: Number(e.target.value) }))} required min={0} /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Cost ($) *</label><Input type="number" step="0.01" value={form.cost || ''} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} required min={0} /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Date *</label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></div>
          {error && <p className="text-sm text-destructive col-span-2">{error}</p>}
          <div className="flex gap-2 col-span-2"><Button type="submit" disabled={loading}>{loading ? <Spinner /> : 'Add Fuel Record'}</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

function ExpenseForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ vehicleId: '', type: 'TOLL' as const, amount: 0, date: new Date().toISOString().split('T')[0], description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: vehicles } = useQuery({ queryKey: ['vehicles-all'], queryFn: async () => { const r = await api.get('/vehicles?limit=100'); return r.data.data as Vehicle[]; } });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await api.post('/expenses', form); onSuccess(); } catch (err: any) { setError(err.response?.data?.error || 'Failed'); } finally { setLoading(false); }
  };

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-5">
        <h3 className="font-semibold mb-4">Record Expense</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2"><label className="text-sm font-medium">Vehicle *</label>
            <Select value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} required>
              <option value="">Select vehicle</option>
              {vehicles?.map(v => <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>)}
            </Select>
          </div>
          <div className="space-y-1"><label className="text-sm font-medium">Type *</label>
            <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
              <option value="TOLL">Toll</option><option value="MAINTENANCE">Maintenance</option><option value="FUEL">Fuel</option><option value="OTHER">Other</option>
            </Select>
          </div>
          <div className="space-y-1"><label className="text-sm font-medium">Amount ($) *</label><Input type="number" step="0.01" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} required min={0} /></div>
          <div className="space-y-1"><label className="text-sm font-medium">Date *</label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></div>
          <div className="space-y-1 sm:col-span-2"><label className="text-sm font-medium">Description</label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g., Highway toll" /></div>
          {error && <p className="text-sm text-destructive col-span-2">{error}</p>}
          <div className="flex gap-2 col-span-2"><Button type="submit" disabled={loading}>{loading ? <Spinner /> : 'Add Expense'}</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
