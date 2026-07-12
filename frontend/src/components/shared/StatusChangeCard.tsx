import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToast } from '@/components/shared/Toast';

interface StatusChangeCardProps {
  entity: 'vehicle' | 'driver';
  id: string;
  currentStatus: string;
}

const vehicleStatusOptions = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RESERVED', 'INACTIVE', 'RETIRED'];
const driverStatusOptions = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'LEAVE', 'SUSPENDED', 'INACTIVE', 'EXPIRED_LICENSE'];

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  AVAILABLE: 'default', ON_TRIP: 'secondary', IN_SHOP: 'destructive', RESERVED: 'secondary',
  INACTIVE: 'outline', RETIRED: 'outline', OFF_DUTY: 'outline', LEAVE: 'outline',
  SUSPENDED: 'destructive', EXPIRED_LICENSE: 'destructive',
};

export function StatusChangeCard({ entity, id, currentStatus }: StatusChangeCardProps) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const options = entity === 'vehicle' ? vehicleStatusOptions : driverStatusOptions;

  const mutation = useMutation({
    mutationFn: async () => {
      const endpoint = entity === 'vehicle' ? `/vehicles/${id}/status` : `/drivers/${id}/status`;
      const res = await api.patch(endpoint, { status: newStatus });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entity === 'vehicle' ? 'vehicles' : 'drivers'] });
      queryClient.invalidateQueries({ queryKey: [entity === 'vehicle' ? 'vehicle' : 'driver', id] });
      toast(`${entity === 'vehicle' ? 'Vehicle' : 'Driver'} status changed to ${newStatus.replace('_', ' ')}`, 'success');
      setShowConfirm(false);
    },
    onError: (err: any) => {
      toast(err.response?.data?.error || 'Failed to change status', 'error');
      setShowConfirm(false);
    },
  });

  const changed = newStatus !== currentStatus;

  return (
    <>
      <Card className="border-amber-200 dark:border-amber-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={statusBadgeVariant[currentStatus] || 'outline'}>{currentStatus.replace('_', ' ')}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-40">
                {options.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </Select>
              {changed && (
                <Button size="sm" onClick={() => setShowConfirm(true)} disabled={mutation.isPending}>
                  {mutation.isPending ? <Spinner /> : 'Update'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={showConfirm}
        title={`Change ${entity === 'vehicle' ? 'Vehicle' : 'Driver'} Status`}
        message={`Are you sure you want to change status from "${currentStatus.replace('_', ' ')}" to "${newStatus.replace('_', ' ')}"? This may affect trip assignments, dispatch, and analytics.`}
        confirmLabel="Confirm Change"
        onConfirm={() => mutation.mutate()}
        onCancel={() => setShowConfirm(false)}
        loading={mutation.isPending}
      />
    </>
  );
}
