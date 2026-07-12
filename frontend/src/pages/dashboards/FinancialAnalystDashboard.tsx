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
  Fuel, Receipt, TrendingUp, DollarSign, Route, Download,
  PlusCircle, BarChart3
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/components/auth/PermissionGuard';
import { Permissions } from '@/utils/permissions';

interface FinancialData {
  totalFuelCost: number;
  totalFuelLiters: number;
  totalExpenses: number;
  totalRevenue: number;
  totalDistance: number;
  roi: number;
  monthlyFuel: Array<{ id: string; cost: number; liters: number; date: string }>;
  monthlyExpenses: Array<{ id: string; amount: number; date: string; type: string }>;
}

const COLORS = ['#f59e0b', '#3b82f6', '#22c55e'];

function groupByMonth(data: Array<{ date: string } & Record<string, any>>, valueKey: string): Record<string, number> {
  const groups: Record<string, number> = {};
  data.forEach(item => {
    const d = new Date(item.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    groups[key] = (groups[key] || 0) + item[valueKey];
  });
  return groups;
}

export default function FinancialAnalystDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermission();

  const { data, isLoading } = useQuery<FinancialData>({
    queryKey: ['financial-analyst-dashboard'],
    queryFn: async () => { const res = await api.get('/dashboard/financial-analyst'); return res.data; },
    refetchInterval: 30000,
  });

  if (isLoading) return <PageTransition><KPISkeleton /></PageTransition>;

  const fuelByMonth = data?.monthlyFuel ? groupByMonth(data.monthlyFuel, 'cost') : {};
  const expenseByMonth = data?.monthlyExpenses ? groupByMonth(data.monthlyExpenses, 'amount') : {};
  const allMonths = [...new Set([...Object.keys(fuelByMonth), ...Object.keys(expenseByMonth)])].sort();
  const lineData = allMonths.map(m => ({
    month: m,
    Fuel: fuelByMonth[m] || 0,
    Expenses: expenseByMonth[m] || 0,
  }));

  const pieData = [
    { name: 'Fuel Cost', value: data?.totalFuelCost ?? 0 },
    { name: 'Other Expenses', value: data?.totalExpenses ?? 0 },
    { name: 'Maintenance', value: Math.max(0, (data?.totalExpenses ?? 0) * 0.4) },
  ];

  const kpiCards = [
    { label: 'Total Revenue', value: `₹${data?.totalRevenue?.toLocaleString('en-IN') ?? 0}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20', href: '/reports' },
      { label: 'Fuel Cost', value: `₹${data?.totalFuelCost?.toLocaleString('en-IN') ?? 0}`, icon: Fuel, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20', href: '/fuel-expenses' },
      { label: 'Other Expenses', value: `₹${data?.totalExpenses?.toLocaleString('en-IN') ?? 0}`, icon: Receipt, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20', href: '/fuel-expenses' },
    { label: 'Total Distance', value: `${(data?.totalDistance ?? 0).toLocaleString('en-IN')} km`, icon: Route, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20', href: '/trips' },
    { label: 'ROI', value: `${data?.roi ?? 0}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20', href: '/analytics' },
  ];

  return (
    <PageTransition>
      <Breadcrumbs />
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financial Analyst Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back, {user?.name} · <Badge variant="secondary" className="text-[10px]">Financial Analyst</Badge>
            </p>
          </div>
          {can(Permissions.REPORTS_EXPORT_CSV) && (
            <Button variant="outline" onClick={() => navigate('/reports')}>
              <BarChart3 className="h-4 w-4 mr-2" /> View Reports
            </Button>
          )}
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
          <CardHeader><CardTitle className="text-lg">Monthly Spending</CardTitle></CardHeader>
          <CardContent>
            {lineData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Fuel" stroke="#f59e0b" strokeWidth={2} />
                    <Line type="monotone" dataKey="Expenses" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No monthly data available yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Cost Breakdown</CardTitle></CardHeader>
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {can(Permissions.EXPENSES_CREATE) && (
                <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/fuel-expenses')}>
                  <PlusCircle className="h-5 w-5" />
                  <span className="text-xs font-normal">Add Expense</span>
                </Button>
              )}
              {can(Permissions.FUEL_CREATE) && (
                <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/fuel-expenses')}>
                  <Fuel className="h-5 w-5" />
                  <span className="text-xs font-normal">Add Fuel</span>
                </Button>
              )}
              {can(Permissions.REPORTS_EXPORT_CSV) && (
                <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/reports')}>
                  <Download className="h-5 w-5" />
                  <span className="text-xs font-normal">Export Report</span>
                </Button>
              )}
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/reports')}>
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs font-normal">Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Financial Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Total Revenue</span>
                <span className="text-lg font-bold text-green-600">₹{data?.totalRevenue?.toLocaleString('en-IN') ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Total Costs</span>
                <span className="text-lg font-bold text-red-600">₹{((data?.totalFuelCost ?? 0) + (data?.totalExpenses ?? 0)).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Net Profit</span>
                <span className="text-lg font-bold">₹{((data?.totalRevenue ?? 0) - (data?.totalFuelCost ?? 0) - (data?.totalExpenses ?? 0)).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">ROI</span>
                <span className="text-lg font-bold">{data?.roi ?? 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
