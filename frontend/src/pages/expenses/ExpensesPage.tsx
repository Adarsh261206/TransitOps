import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { Expense, Vehicle } from '@/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageTransition } from '@/components/shared/PageTransition';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Plus, DollarSign, Receipt, Pencil, Trash2 } from 'lucide-react';

export function ExpensesPage() {
  const [showForm, setShowForm] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', vehicleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (vehicleFilter) params.append('vehicleId', vehicleFilter);
      params.append('limit', '100');
      const res = await api.get(`/expenses?${params}`);
      return res.data as { data: Expense[] };
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-all'],
    queryFn: async () => { const res = await api.get('/vehicles?limit=100'); return res.data.data as Vehicle[]; },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const expenses = data?.data || [];
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <PageTransition>
      <PageHeader
        title="Expenses"
        description="Track tolls, maintenance costs, and other operational expenses per vehicle."
        action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Expense</Button>}
      />

      {showForm && (
        <ExpenseForm onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['expenses'] }); }} />
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} className="w-56">
          <option value="">All Vehicles</option>
          {vehicles?.map(v => <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>)}
        </Select>
        <div className="ml-auto text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">${totalExpenses.toLocaleString()}</span>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : expenses.length === 0 ? (
        <EmptyState title="No expenses recorded" description="Add your first expense entry." action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Expense</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {expenses.map((expense, i) => (
            <motion.div key={expense.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{expense.vehicle?.name}</h3>
                      <p className="text-xs text-muted-foreground">{expense.vehicle?.registrationNumber}</p>
                    </div>
                    <Badge variant={expense.type === 'TOLL' ? 'secondary' : expense.type === 'MAINTENANCE' ? 'destructive' : 'outline'}>{expense.type}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      <span>{expense.description || expense.type}</span>
                      <span className="ml-2">{new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                    <span className="font-semibold">${expense.amount}</span>
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

function ExpenseForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ vehicleId: '', type: 'TOLL' as const, amount: 0, date: new Date().toISOString().split('T')[0], description: '' });
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
      await api.post('/expenses', form);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-primary/20">
      <CardContent className="p-5">
        <h3 className="font-semibold mb-4">Record Expense</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Vehicle *</label>
            <Select value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} required>
              <option value="">Select vehicle</option>
              {vehicles?.map(v => <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Type *</label>
            <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
              <option value="TOLL">Toll</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="FUEL">Fuel</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Amount ($) *</label>
            <Input type="number" step="0.01" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} required min={0} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Date *</label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g., Highway toll NYC-Boston" />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading}>{loading ? <Spinner /> : 'Add Expense'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
