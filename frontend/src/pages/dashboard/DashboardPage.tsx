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
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { 
  Truck, Users, Route, Wrench, Fuel, Receipt, 
  Activity, CheckCircle, Clock, 
  BarChart3, Plus, Search, ArrowUpRight, TrendingUp
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/useAuth';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#6b7280'];

export function DashboardPage() {
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
    { label: 'Vehicles in Maintenance', value: kpis?.inShopVehicles ?? 0, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20', href: '/vehicles?status=IN_SHOP' },
    { label: 'Active Trips', value: kpis?.activeTrips ?? 0, icon: Route, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20', href: '/trips?status=DISPATCHED' },
    { label: 'Pending Trips', value: kpis?.pendingTrips ?? 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20', href: '/trips?status=DRAFT' },
    { label: 'Drivers On Duty', value: kpis?.onTripDrivers ?? 0, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/20', href: '/drivers?status=ON_TRIP' },
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
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back, {user?.name} · <Badge variant="secondary" className="text-[10px]">{user?.role?.replace(/_/g, ' ')}</Badge>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 h-9" />
          </div>
          <Select defaultValue="" className="w-32 h-9">
            <option value="">All Types</option>
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
          </Select>
          <Select defaultValue="" className="w-32 h-9">
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
          </Select>
          <Select defaultValue="" className="w-32 h-9">
            <option value="">All Regions</option>
            <option value="North">North</option>
            <option value="South">South</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
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
          <CardHeader>
            <CardTitle className="text-lg">Vehicle Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
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
          <CardHeader>
            <CardTitle className="text-lg">Cost Breakdown</CardTitle>
          </CardHeader>
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

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Trips</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Latest trip activities</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/trips')}>
              View All <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {kpis?.recentTrips && kpis.recentTrips.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Route</th>
                      <th className="pb-3 font-medium">Vehicle</th>
                      <th className="pb-3 font-medium">Driver</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.recentTrips.map((trip) => (
                      <tr key={trip.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/trips/${trip.id}`)}>
                        <td className="py-3">
                          <div className="font-medium text-xs">{trip.source}</div>
                          <div className="text-xs text-muted-foreground">→ {trip.destination}</div>
                        </td>
                        <td className="py-3 text-xs">{trip.vehicle?.name || 'N/A'}</td>
                        <td className="py-3 text-xs">{trip.driver?.name || 'N/A'}</td>
                        <td className="py-3">
                          <Badge variant={trip.status === 'COMPLETED' ? 'default' : trip.status === 'DISPATCHED' ? 'secondary' : trip.status === 'DRAFT' ? 'outline' : 'destructive'} className="text-[10px]">
                            {trip.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">{new Date(trip.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">No trips recorded yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/vehicles?action=add')}>
                <Plus className="h-5 w-5" />
                <span className="text-xs font-normal">Add Vehicle</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/drivers?action=add')}>
                <Users className="h-5 w-5" />
                <span className="text-xs font-normal">Add Driver</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/trips?action=create')}>
                <Route className="h-5 w-5" />
                <span className="text-xs font-normal">Create Trip</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/fuel-expenses?action=fuel')}>
                <Fuel className="h-5 w-5" />
                <span className="text-xs font-normal">Log Fuel</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">How to use the Dashboard</h3>
          <p className="text-xs text-muted-foreground mt-1">
            This dashboard provides a real-time overview of your entire transport operations. All KPIs are updated live from the database.
            Click any KPI card to drill down into the relevant module. Use the filters above to narrow down the data.
          </p>
        </div>
        <div className="p-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>💡 <strong>Tip:</strong> KPI cards are clickable — navigate directly to filtered views</span>
          <span>📋 <strong>Business Rule:</strong> Fleet Utilization = (Active Vehicles / Total Vehicles) × 100</span>
        </div>
      </div>
    </PageTransition>
  );
}
