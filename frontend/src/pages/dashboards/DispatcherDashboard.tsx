import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/shared/PageTransition';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { Truck, Route, Users, Clock, PlayCircle, Plus, UserPlus, ArrowUpRight, Loader2 } from 'lucide-react';

interface DispatcherDashboardData {
  todayTrips: number;
  pendingDispatch: number;
  inProgress: number;
  availableVehicles: number;
  availableDrivers: number;
  recentTrips: Array<{
    id: string;
    source: string;
    destination: string;
    driver?: { id: string; name: string };
    vehicle?: { id: string; name: string; registrationNumber: string };
    status: 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
  }>;
  statusOverview: {
    DRAFT: number;
    DISPATCHED: number;
    COMPLETED: number;
    CANCELLED: number;
  };
}

export function DispatcherDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DispatcherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/dashboard/dispatcher');
        setData(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load dispatcher dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </PageTransition>
    );
  }

  if (!data) return null;

  const kpiCards = [
    { label: "Today's Trips", value: data.todayTrips, icon: Route, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
    { label: 'Pending Dispatch', value: data.pendingDispatch, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20' },
    { label: 'In Progress', value: data.inProgress, icon: PlayCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
    { label: 'Available Vehicles', value: data.availableVehicles, icon: Truck, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/20' },
    { label: 'Available Drivers', value: data.availableDrivers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' },
  ];

  const barData = [
    { name: 'Draft', count: data.statusOverview.DRAFT },
    { name: 'Dispatched', count: data.statusOverview.DISPATCHED },
    { name: 'Completed', count: data.statusOverview.COMPLETED },
    { name: 'Cancelled', count: data.statusOverview.CANCELLED },
  ];

  return (
    <PageTransition>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dispatcher Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Daily operations overview
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
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
            <CardTitle className="text-lg">Trips by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="text-sm">Draft</span>
                </div>
                <span className="text-lg font-bold">{data.statusOverview.DRAFT}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Dispatched</span>
                </div>
                <span className="text-lg font-bold">{data.statusOverview.DISPATCHED}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Completed</span>
                </div>
                <span className="text-lg font-bold">{data.statusOverview.COMPLETED}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-gray-400" />
                  <span className="text-sm">Cancelled</span>
                </div>
                <span className="text-lg font-bold">{data.statusOverview.CANCELLED}</span>
              </div>
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
            {data.recentTrips.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Route</th>
                      <th className="pb-3 font-medium">Driver</th>
                      <th className="pb-3 font-medium">Vehicle</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTrips.map((trip) => (
                      <tr key={trip.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/trips/${trip.id}`)}>
                        <td className="py-3">
                          <div className="font-medium text-xs">{trip.source}</div>
                          <div className="text-xs text-muted-foreground">→ {trip.destination}</div>
                        </td>
                        <td className="py-3 text-xs">{trip.driver?.name || 'N/A'}</td>
                        <td className="py-3 text-xs">{trip.vehicle?.name || 'N/A'}</td>
                        <td className="py-3">
                          <Badge variant={trip.status === 'COMPLETED' ? 'default' : trip.status === 'DISPATCHED' ? 'secondary' : trip.status === 'DRAFT' ? 'outline' : 'destructive'} className="text-[10px]">
                            {trip.status}
                          </Badge>
                        </td>
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
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/trips?action=create')}>
                <Plus className="h-5 w-5" />
                <span className="text-xs font-normal">Create Trip</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/trips?action=assign')}>
                <UserPlus className="h-5 w-5" />
                <span className="text-xs font-normal">Assign Driver</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/vehicles')}>
                <Truck className="h-5 w-5" />
                <span className="text-xs font-normal">View Vehicles</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/drivers')}>
                <Users className="h-5 w-5" />
                <span className="text-xs font-normal">View Drivers</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
