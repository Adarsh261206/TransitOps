import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { DashboardKPIs } from '@/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageTransition } from '@/components/shared/PageTransition';
import { KPISkeleton } from '@/components/shared/Skeletons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Truck, Users, Route, Wrench, Fuel, Receipt, 
  Activity, CheckCircle, XCircle, Clock, AlertTriangle,
  BarChart3, Download, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';


export function DashboardPage() {
  const navigate = useNavigate();
  const { data: kpis, isLoading } = useQuery<DashboardKPIs>({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      const res = await api.get('/dashboard/kpis');
      return res.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) return <PageTransition><KPISkeleton /></PageTransition>;

  const kpiCards = [
    { label: 'Active Vehicles', value: kpis?.activeVehicles ?? 0, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
    { label: 'Available Vehicles', value: kpis?.availableVehicles ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
    { label: 'In Maintenance', value: kpis?.inShopVehicles ?? 0, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20' },
    { label: 'Active Trips', value: kpis?.activeTrips ?? 0, icon: Route, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' },
    { label: 'Pending Trips', value: kpis?.pendingTrips ?? 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20' },
    { label: 'Drivers On Duty', value: kpis?.onTripDrivers ?? 0, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/20' },
    { label: 'Fleet Utilization', value: `${kpis?.fleetUtilization ?? 0}%`, icon: Activity, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/20' },
  ];

  return (
    <PageTransition>
      <PageHeader 
        title="Dashboard" 
        description="Real-time overview of your transport operations"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="group hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight">{kpi.value}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${kpi.bg}`}>
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
            <CardTitle className="text-lg">Vehicle Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Available', value: kpis?.availableVehicles ?? 0, color: 'bg-green-500', total: kpis?.totalVehicles ?? 1 },
                { label: 'On Trip', value: kpis?.activeVehicles ?? 0, color: 'bg-blue-500', total: kpis?.totalVehicles ?? 1 },
                { label: 'In Shop', value: kpis?.inShopVehicles ?? 0, color: 'bg-amber-500', total: kpis?.totalVehicles ?? 1 },
                { label: 'Retired', value: kpis?.retiredVehicles ?? 0, color: 'bg-gray-500', total: kpis?.totalVehicles ?? 1 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${item.color}`} style={{ width: `${(item.value / item.total) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 dark:bg-blue-900/20 p-2"><Fuel className="h-4 w-4 text-blue-600" /></div>
                  <span className="text-sm">Fuel Cost</span>
                </div>
                <span className="font-semibold">${(kpis?.totalFuelCost ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-100 dark:bg-amber-900/20 p-2"><Wrench className="h-4 w-4 text-amber-600" /></div>
                  <span className="text-sm">Maintenance Cost</span>
                </div>
                <span className="font-semibold">${(kpis?.totalMaintenanceCost ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 dark:bg-purple-900/20 p-2"><Receipt className="h-4 w-4 text-purple-600" /></div>
                  <span className="text-sm">Other Expenses</span>
                </div>
                <span className="font-semibold">${(kpis?.totalOtherExpenses ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3 border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2"><BarChart3 className="h-4 w-4 text-primary" /></div>
                  <span className="text-sm font-medium">Total Operational Cost</span>
                </div>
                <span className="font-bold text-lg">${((kpis?.totalFuelCost ?? 0) + (kpis?.totalMaintenanceCost ?? 0) + (kpis?.totalOtherExpenses ?? 0)).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Trips</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Latest trip activities across your fleet</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/trips')}>
            View All
            <ArrowUpRight className="h-3 w-3 ml-1" />
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
                    <tr key={trip.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3">
                        <div className="font-medium">{trip.source}</div>
                        <div className="text-xs text-muted-foreground">→ {trip.destination}</div>
                      </td>
                      <td className="py-3">{trip.vehicle?.name || 'N/A'}</td>
                      <td className="py-3">{trip.driver?.name || 'N/A'}</td>
                      <td className="py-3">
                        <Badge variant={
                          trip.status === 'COMPLETED' ? 'default' :
                          trip.status === 'DISPATCHED' ? 'secondary' :
                          trip.status === 'DRAFT' ? 'outline' : 'destructive'
                        }>
                          {trip.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">{new Date(trip.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No trips recorded yet. Create your first trip to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
