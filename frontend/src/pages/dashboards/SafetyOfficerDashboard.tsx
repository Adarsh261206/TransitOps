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
import {
  Users, IdCard, Ban, Shield, Percent,
  ArrowUpRight, Search, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '@/hooks/useAuth';

interface DriverCompliance {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  safetyScore: number;
  status: string;
}

interface SafetyOfficerKPIs {
  totalDrivers: number;
  expiredLicenses: number;
  suspendedDrivers: number;
  avgSafetyScore: number;
  complianceRate: number;
  drivers: DriverCompliance[];
}

const SCORE_COLORS = ['#ef4444', '#f59e0b', '#22c55e'];

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'SUSPENDED': return 'destructive';
    case 'ON_TRIP': return 'secondary';
    case 'OFF_DUTY': return 'outline';
    default: return 'default';
  }
}

function getStatusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

export function SafetyOfficerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: kpis, isLoading } = useQuery<SafetyOfficerKPIs>({
    queryKey: ['safety-officer-dashboard'],
    queryFn: async () => { const res = await api.get('/dashboard/safety-officer'); return res.data; },
    refetchInterval: 30000,
  });

  if (isLoading) return <PageTransition><KPISkeleton /></PageTransition>;

  const kpiCards = [
    { label: 'Total Drivers', value: kpis?.totalDrivers ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20', href: '/drivers' },
    { label: 'Expired Licenses', value: kpis?.expiredLicenses ?? 0, icon: IdCard, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20', href: '/drivers?status=EXPIRED' },
    { label: 'Suspended', value: kpis?.suspendedDrivers ?? 0, icon: Ban, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20', href: '/drivers?status=SUSPENDED' },
    { label: 'Avg Safety Score', value: kpis?.avgSafetyScore?.toFixed(1) ?? '0.0', icon: Shield, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20', href: '/reports' },
    { label: 'Compliance %', value: `${kpis?.complianceRate ?? 0}%`, icon: Percent, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20', href: '/reports' },
  ];

  const scoreDistributionData = [
    { range: '0–40', count: kpis?.drivers?.filter(d => d.safetyScore < 40).length ?? 0, color: SCORE_COLORS[0] },
    { range: '40–70', count: kpis?.drivers?.filter(d => d.safetyScore >= 40 && d.safetyScore < 70).length ?? 0, color: SCORE_COLORS[1] },
    { range: '70–100', count: kpis?.drivers?.filter(d => d.safetyScore >= 70).length ?? 0, color: SCORE_COLORS[2] },
  ];

  const isExpired = (expiryDate: string) => new Date(expiryDate) < new Date();

  return (
    <PageTransition>
      <Breadcrumbs />

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Safety Officer Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back, {user?.name} · <Badge variant="secondary" className="text-[10px]">SAFETY OFFICER</Badge>
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
            <CardTitle className="text-lg">Safety Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {scoreDistributionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-1 text-xs">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SCORE_COLORS[0] }} />
                At Risk (0–40)
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SCORE_COLORS[1] }} />
                Moderate (40–70)
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SCORE_COLORS[2] }} />
                Good (70–100)
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Compliance Overview</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">License & status breakdown</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Valid Licenses</p>
                    <p className="text-xs text-muted-foreground">Drivers with up-to-date licenses</p>
                  </div>
                </div>
                <span className="text-xl font-bold">{(kpis?.totalDrivers ?? 0) - (kpis?.expiredLicenses ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Expired Licenses</p>
                    <p className="text-xs text-muted-foreground">Requires immediate action</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-red-500">{kpis?.expiredLicenses ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Ban className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">Suspended Drivers</p>
                    <p className="text-xs text-muted-foreground">Currently not authorized to drive</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-amber-500">{kpis?.suspendedDrivers ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Overall Compliance</p>
                    <p className="text-xs text-muted-foreground">Percentage of compliant drivers</p>
                  </div>
                </div>
                <span className="text-xl font-bold">{kpis?.complianceRate ?? 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Driver Compliance</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">All drivers and their license status</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/drivers')}>
              View All <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {kpis?.drivers && kpis.drivers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">License #</th>
                      <th className="pb-3 font-medium">Expiry Date</th>
                      <th className="pb-3 font-medium">Safety Score</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.drivers.map((driver) => {
                      const expired = isExpired(driver.licenseExpiryDate);
                      return (
                        <tr
                          key={driver.id}
                          className={`border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${expired ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                          onClick={() => navigate(`/drivers/${driver.id}`)}
                        >
                          <td className="py-3 text-xs font-medium">{driver.name}</td>
                          <td className="py-3 text-xs">{driver.licenseNumber}</td>
                          <td className={`py-3 text-xs ${expired ? 'text-red-600 font-semibold' : ''}`}>
                            {new Date(driver.licenseExpiryDate).toLocaleDateString()}
                            {expired && <span className="ml-1 text-[10px] text-red-600">(Expired)</span>}
                          </td>
                          <td className="py-3">
                            <span className={`text-xs font-medium ${
                              driver.safetyScore < 40 ? 'text-red-600' :
                              driver.safetyScore < 70 ? 'text-amber-600' :
                              'text-green-600'
                            }`}>
                              {driver.safetyScore}
                            </span>
                          </td>
                          <td className="py-3">
                            <Badge variant={getStatusBadgeVariant(driver.status)} className="text-[10px]">
                              {getStatusLabel(driver.status)}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">No driver data available.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/drivers?action=verify-license')}>
                <IdCard className="h-5 w-5" />
                <span className="text-xs font-normal">Verify License</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/drivers?action=suspend')}>
                <Ban className="h-5 w-5" />
                <span className="text-xs font-normal">Suspend Driver</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/reports?safety=true')}>
                <Shield className="h-5 w-5" />
                <span className="text-xs font-normal">Safety Report</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/drivers?action=add')}>
                <Users className="h-5 w-5" />
                <span className="text-xs font-normal">Add Driver</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">About Safety Officer Dashboard</h3>
          <p className="text-xs text-muted-foreground mt-1">
            This dashboard provides a real-time overview of driver compliance and safety metrics. All KPIs are updated live from the database.
            Click any KPI card to drill down into the relevant module. Rows highlighted in red indicate drivers with expired licenses requiring immediate action.
          </p>
        </div>
        <div className="p-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>💡 <strong>Tip:</strong> KPI cards are clickable — navigate directly to filtered views</span>
          <span>📋 <strong>Business Rule:</strong> Compliance % = (Valid Licenses / Total Drivers) × 100</span>
        </div>
      </div>
    </PageTransition>
  );
}
