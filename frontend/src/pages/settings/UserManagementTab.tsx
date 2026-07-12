import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/shared/Toast';
import api from '@/services/api';
import { Users, Plus, UserX, UserCheck, ShieldCheck, Trash2, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ManagedUser {
  id: string; name: string; email: string;
  role: string; status: string; isVerified: boolean; createdAt: string;
}

const ROLES = [
  { value: 'FLEET_MANAGER', label: 'Fleet Manager' },
  { value: 'DISPATCHER', label: 'Dispatcher' },
  { value: 'SAFETY_OFFICER', label: 'Safety Officer' },
  { value: 'FINANCIAL_ANALYST', label: 'Financial Analyst' },
  { value: 'DRIVER', label: 'Driver' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleBadge(role: string) {
  const colors: Record<string, string> = {
    FLEET_MANAGER: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    DISPATCHER: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    SAFETY_OFFICER: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    FINANCIAL_ANALYST: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    DRIVER: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  const label = role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[role] ?? 'bg-muted text-muted-foreground'}`}>{label}</span>;
}

function statusBadge(status: string, isVerified: boolean) {
  if (!isVerified) return <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">Unverified</span>;
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
    DISABLED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    SUSPENDED: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  };
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-muted text-muted-foreground'}`}>{status}</span>;
}

// ─── Create User Modal ────────────────────────────────────────────────────────

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', role: 'FLEET_MANAGER' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/users', form);
      toast(`User ${form.name} created — credentials sent to ${form.email}`, 'success');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg">Create New User</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input placeholder="John Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label>Email Address</Label>
            <Input type="email" placeholder="john@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <select className="w-full h-9 rounded-md border bg-background px-3 text-sm" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-700 dark:text-blue-300">
            A temporary password will be generated and sent to the user's email. The account is created as verified and active.
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <Spinner /> : 'Create & Send Email'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function UserManagementTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const { data: users = [], isLoading } = useQuery<ManagedUser[]>({
    queryKey: ['users', search, roleFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      return api.get(`/users?${params}`).then(r => r.data);
    },
  });

  const handleStatusChange = async (user: ManagedUser, newStatus: string) => {
    setActionLoading(`${user.id}-status`);
    try {
      await api.patch(`/users/${user.id}/status`, { status: newStatus });
      toast(`${user.name} is now ${newStatus.toLowerCase()}`, newStatus === 'ACTIVE' ? 'success' : 'warning');
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to update status', 'error');
    } finally {
      setActionLoading('');
    }
  };

  const handleRoleChange = async (user: ManagedUser, newRole: string) => {
    setActionLoading(`${user.id}-role`);
    try {
      await api.patch(`/users/${user.id}/role`, { role: newRole });
      toast(`${user.name}'s role updated`, 'success');
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to update role', 'error');
    } finally {
      setActionLoading('');
    }
  };

  const handleDelete = async (user: ManagedUser) => {
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    setActionLoading(`${user.id}-delete`);
    try {
      await api.delete(`/users/${user.id}`);
      toast(`${user.name} deleted`, 'success');
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to delete', 'error');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Search by name or email…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="h-8 w-56 text-sm"
          />
          <select
            className="h-8 rounded-md border bg-background px-2 text-sm"
            value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 h-8">
          <Plus className="h-3.5 w-3.5" />Create User
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Change Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-12 text-center"><Spinner className="mx-auto" /></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">No users found</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">{roleBadge(user.role)}</td>
                    <td className="px-4 py-3">{statusBadge(user.status, user.isVerified)}</td>
                    <td className="px-4 py-3">
                      <select
                        className="h-7 rounded border bg-background px-2 text-xs"
                        value={user.role}
                        onChange={e => handleRoleChange(user, e.target.value)}
                        disabled={actionLoading === `${user.id}-role`}
                      >
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {user.status !== 'ACTIVE' ? (
                          <button
                            title="Enable account"
                            onClick={() => handleStatusChange(user, 'ACTIVE')}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-950 text-green-600 transition-colors"
                          >
                            {actionLoading === `${user.id}-status` ? <Spinner /> : <UserCheck className="h-4 w-4" />}
                          </button>
                        ) : (
                          <button
                            title="Disable account"
                            onClick={() => handleStatusChange(user, 'DISABLED')}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-600 transition-colors"
                          >
                            {actionLoading === `${user.id}-status` ? <Spinner /> : <UserX className="h-4 w-4" />}
                          </button>
                        )}
                        <button
                          title="Suspend account"
                          onClick={() => handleStatusChange(user, 'SUSPENDED')}
                          disabled={!!actionLoading || user.status === 'SUSPENDED'}
                          className="p-1.5 rounded hover:bg-amber-100 dark:hover:bg-amber-950 text-amber-600 transition-colors disabled:opacity-40"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete user"
                          onClick={() => handleDelete(user)}
                          disabled={!!actionLoading}
                          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-500 transition-colors"
                        >
                          {actionLoading === `${user.id}-delete` ? <Spinner /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['users'] })}
        />
      )}
    </div>
  );
}
