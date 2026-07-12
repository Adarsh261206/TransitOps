import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import type { DashboardKPIs } from '@/types';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { PageTransition } from '@/components/shared/PageTransition';
import { KPISkeleton } from '@/components/shared/Skeletons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Truck, Wrench, Route, CheckCircle, Clock, Activity, BarChart3
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/useAuth';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#6b7280'];

export default function FleetManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: kpis, isLoading } = useQuery<DashboardKPIs>({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => { const res = await api.get('/dashboard/kpis'); return res.data; },
    refetchInterval: 30000,
  });

  if (isLoading) return <PageTransition><KPISkeleton /></PageTransition>;

  const kpiCards = [
    { label: 'Active Vehicles', value: kpis?.activeVehicles ?? 0, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20', href: '/vehicles?status=ON_TRIP' },
    { label: 'Available Vehicles', value: kpis?.availableVehicles ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20', href: '/vehicles?status=AVAILABLE' },
    { label: 'In Maintenance', value: kpis?.inShopVehicles ?? 0, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20', href: '/vehicles?status=IN_SHOP' },
    { label: 'Active Trips', value: kpis?.activeTrips ?? 0, icon: Route, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20', href: '/trips?status=DISPATCHED' },
    { label: 'Pending Trips', value: kpis?.pendingTrips ?? 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20', href: '/trips?status=DRAFT' },
    { label: 'Fleet Utilization', value: `${kpis?.fleetUtilization ?? 0}%`, icon: Activity, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/20', href: '/reports' },
  ];

  const pieData = [
    { name: 'Available', value: kpis?.availableVehicles ?? 0 },
    { name: 'On Trip', value: kpis?.activeVehicles ?? 0 },
    { name: 'In Shop', value: kpis?.inShopVehicles ?? 0 },
    { name: 'Retired', value: kpis?.retiredVehicles ?? 0 },
  ];

  const barData = [
    { name: 'Fuel', cost: kpis?.totalFuelCost ?? 0 },
    { name: 'Maintenance', cost: kpis?.totalMaintenanceCost ?? 0 },
    { name: 'Other', cost: kpis?.totalOtherExpenses ?? 0 },
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Cost Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
