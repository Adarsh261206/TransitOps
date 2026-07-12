import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { PageTransition } from '@/components/shared/PageTransition';
import { KPISkeleton } from '@/components/shared/Skeletons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Truck, Wrench, Route, Activity, Users, Clock, PlusCircle, CalendarPlus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/components/auth/PermissionGuard';
import { Permissions } from '@/utils/permissions';

interface FleetManagerData {
  fleetUtilization: number;
  totalVehicles: number;
  availableVehicles: number;
  inShopVehicles: number;
  onTripVehicles: number;
  maintenanceDue: number;
  totalDrivers: number;
  activeTrips: number;
  recentMaintenance: Array<{
    id: string;
    description: string;
    type: string;
    status: string;
    date: string;
    vehicle: { name: string; registrationNumber: string };
  }>;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#6b7280'];

export default function FleetManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermission();

  const { data, isLoading } = useQuery<FleetManagerData>({
    queryKey: ['fleet-manager-dashboard'],
    queryFn: async () => { const res = await api.get('/dashboard/fleet-manager'); return res.data; },
    refetchInterval: 30000,
  });

  if (isLoading) return <PageTransition><KPISkeleton /></PageTransition>;

  const kpiCards = [
    { label: 'Total Vehicles', value: data?.totalVehicles ?? 0, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20', href: '/vehicles' },
    { label: 'Available', value: data?.availableVehicles ?? 0, icon: Activity, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20', href: '/vehicles?status=AVAILABLE' },
    { label: 'In Shop', value: data?.inShopVehicles ?? 0, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20', href: '/vehicles?status=IN_SHOP' },
    { label: 'On Trip', value: data?.onTripVehicles ?? 0, icon: Route, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20', href: '/vehicles?status=ON_TRIP' },
    { label: 'Maintenance Due', value: data?.maintenanceDue ?? 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20', href: '/maintenance' },
    { label: 'Fleet Utilization', value: `${data?.fleetUtilization ?? 0}%`, icon: Users, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/20', href: '/reports' },
  ];

  const pieData = [
    { name: 'Available', value: data?.availableVehicles ?? 0 },
    { name: 'On Trip', value: data?.onTripVehicles ?? 0 },
    { name: 'In Shop', value: data?.inShopVehicles ?? 0 },
    { name: 'Others', value: Math.max(0, (data?.totalVehicles ?? 0) - (data?.availableVehicles ?? 0) - (data?.onTripVehicles ?? 0) - (data?.inShopVehicles ?? 0)) },
  ];

  return (
    <PageTransition>
      <Breadcrumbs />
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fleet Manager Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back, {user?.name} · <Badge variant="secondary" className="text-[10px]">Fleet Manager</Badge>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 mb-8">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="cursor-pointer"
            onClick={() => navigate(kpi.href)}
          >
            <Card className="group hover:shadow-md hover:border-primary/20 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight">{kpi.value}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${kpi.bg} group-hover:scale-110 transition-transform`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader><CardTitle className="text-lg">Vehicle Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Maintenance</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Latest maintenance activities</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/maintenance')}>View All</Button>
          </CardHeader>
          <CardContent>
            {data?.recentMaintenance && data.recentMaintenance.length > 0 ? (
              <div className="space-y-3">
                {data.recentMaintenance.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{m.description}</p>
                      <p className="text-xs text-muted-foreground">{m.vehicle.name} · {m.vehicle.registrationNumber}</p>
                    </div>
                    <Badge variant={m.status === 'ACTIVE' ? 'destructive' : 'default'} className="text-[10px]">{m.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">No maintenance records.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {can(Permissions.FLEET_CREATE) && (
                <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/vehicles?action=create')}>
                  <PlusCircle className="h-5 w-5" />
                  <span className="text-xs font-normal">Add Vehicle</span>
                </Button>
              )}
              {can(Permissions.MAINTENANCE_CREATE) && (
                <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/maintenance?action=create')}>
                  <CalendarPlus className="h-5 w-5" />
                  <span className="text-xs font-normal">Schedule Maintenance</span>
                </Button>
              )}
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/vehicles')}>
                <Truck className="h-5 w-5" />
                <span className="text-xs font-normal">View Fleet</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/maintenance')}>
                <Wrench className="h-5 w-5" />
                <span className="text-xs font-normal">Maintenance</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Fleet Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Total Vehicles</span>
                <span className="text-lg font-bold">{data?.totalVehicles ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Active Drivers</span>
                <span className="text-lg font-bold">{data?.totalDrivers ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Active Trips</span>
                <span className="text-lg font-bold">{data?.activeTrips ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Fleet Utilization</span>
                <span className="text-lg font-bold">{data?.fleetUtilization ?? 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
