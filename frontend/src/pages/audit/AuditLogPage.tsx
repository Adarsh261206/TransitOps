import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { AuditLog } from '@/types';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { PageTransition } from '@/components/shared/PageTransition';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, History } from 'lucide-react';

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', entityFilter, actionFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (entityFilter) params.append('entity', entityFilter);
      if (actionFilter) params.append('action', actionFilter);
      params.append('page', String(page));
      params.append('limit', '20');
      const res = await api.get(`/audit-logs?${params}`);
      return res.data as { data: AuditLog[]; total: number; page: number; totalPages: number };
    },
  });

  const columns = [
    { key: 'createdAt', header: 'Time', render: (l: AuditLog) => <span className="text-sm">{new Date(l.createdAt).toLocaleString()}</span> },
    { key: 'action', header: 'Action', render: (l: AuditLog) => <Badge variant="outline">{l.action}</Badge> },
    { key: 'entity', header: 'Entity', render: (l: AuditLog) => <span className="text-sm font-medium">{l.entity}</span> },
    { key: 'description', header: 'Description', render: (l: AuditLog) => <span className="text-sm text-muted-foreground">{l.description || '-'}</span> },
    { key: 'user', header: 'User', render: (l: AuditLog) => <span className="text-sm">{l.user?.name || 'System'}</span> },
  ];

  return (
    <PageTransition>
      <Breadcrumbs />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track every action performed across the system.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }} className="w-36">
          <option value="">All Entities</option>
          <option value="User">User</option>
          <option value="Vehicle">Vehicle</option>
          <option value="Driver">Driver</option>
          <option value="Trip">Trip</option>
          <option value="MaintenanceLog">Maintenance</option>
          <option value="FuelLog">Fuel</option>
          <option value="Expense">Expense</option>
        </Select>
        <Select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} className="w-40">
          <option value="">All Actions</option>
          <option value="Created">Created</option>
          <option value="Updated">Updated</option>
          <option value="Deleted">Deleted</option>
          <option value="Trip ASSIGNED">Trip Assigned</option>
          <option value="Trip DISPATCHED">Trip Dispatched</option>
          <option value="Trip COMPLETED">Trip Completed</option>
          <option value="Trip CANCELLED">Trip Cancelled</option>
          <option value="Status Changed">Status Changed</option>
        </Select>
      </div>

      {isLoading ? <TableSkeleton rows={8} cols={5} /> : !data?.data?.length ? (
        <EmptyState title="No audit logs" description="Actions performed in the system will appear here." />
      ) : (
        <>
          <DataTable columns={columns} data={data.data} />
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
        </>
      )}
    </PageTransition>
  );
}
