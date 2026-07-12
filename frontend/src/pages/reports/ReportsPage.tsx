import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { PageTransition } from '@/components/shared/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { motion } from 'framer-motion';
import { BarChart3, Download, TrendingUp, DollarSign, Fuel, Gauge, PieChart, Truck, ArrowUpDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function ReportsPage() {
  const { data: summary } = useQuery({ queryKey: ['reports-summary'], queryFn: async () => { const r = await api.get('/reports/summary'); return r.data; } });
  const { data: utilization } = useQuery({ queryKey: ['reports-utilization'], queryFn: async () => { const r = await api.get('/reports/fleet-utilization'); return r.data; } });
  const { data: fuelEfficiency } = useQuery({ queryKey: ['reports-fuel-efficiency'], queryFn: async () => { const r = await api.get('/reports/fuel-efficiency'); return r.data; } });
  const { data: operationalCost } = useQuery({ queryKey: ['reports-operational-cost'], queryFn: async () => { const r = await api.get('/reports/operational-cost'); return r.data; } });
  const { data: roi } = useQuery({ queryKey: ['reports-roi'], queryFn: async () => { const r = await api.get('/reports/vehicle-roi'); return r.data; } });

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const res = await api.get('/reports/summary');
      const data = res.data;
      const csv = Object.entries(data).map(([k, v]) => `${k},${v}`).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `transitops-report.${format}`; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const pieData = utilization ? [
    { name: 'On Trip', value: utilization.onTrip },
    { name: 'Available', value: utilization.available },
    { name: 'In Shop', value: utilization.inShop },
    { name: 'Retired', value: utilization.retired },
  ].filter(d => d.value > 0) : [];

  const costData = operationalCost?.map((v: any) => ({ name: v.vehicleName, Fuel: v.fuelCost, Maintenance: v.maintenanceCost })) || [];
  const roiData = roi?.map((v: any) => ({ name: v.vehicleName, roi: v.roi })) || [];
  const efficiencyData = fuelEfficiency?.map((v: any) => ({ name: v.vehicleName, efficiency: parseFloat(v.efficiency) })) || [];

  return (
    <PageTransition>
      <Breadcrumbs />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Operational insights, cost analysis, and fleet performance metrics.</p>
        </div>
        <div className="flex gap-2">
          <Select className="w-32"><option value="">This Month</option><option value="7d">Last 7 Days</option><option value="30d">Last 30 Days</option><option value="90d">Last Quarter</option></Select>
          <Button variant="outline" onClick={() => handleExport('csv')}><Download className="h-4 w-4 mr-2" /> CSV</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: 'Fuel Efficiency', value: summary ? `${(summary.totalFuelLiters > 0 ? (summary.totalTrips * 100 / summary.totalFuelLiters) : 0).toFixed(1)} km/L` : '-', icon: Fuel, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
          { label: 'Fleet Utilization', value: `${utilization?.utilizationRate ?? 0}%`, icon: PieChart, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
          { label: 'Operational Cost', value: summary ? `$${(summary.totalOperationalCost ?? 0).toLocaleString()}` : '-', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20' },
          { label: 'Vehicle ROI', value: roi?.length ? `${roi.reduce((s: number, v: any) => s + v.roi, 0) / roi.length}%` : '-', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${kpi.bg}`}><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
              <div><p className="text-xs text-muted-foreground">{kpi.label}</p><p className="text-lg font-bold">{kpi.value}</p></div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><PieChart className="h-4 w-4" /> Fleet Utilization</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="h-64 w-full">
                  <ResponsiveContainer><RPieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </RPieChart></ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />{d.name} ({d.value})</div>
                  ))}
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground py-8 text-center">No data</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4" /> Vehicle Operational Cost</CardTitle></CardHeader>
          <CardContent>
            {costData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer><BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Fuel" fill="#3b82f6" radius={[2, 2, 0, 0]} stackId="a" />
                  <Bar dataKey="Maintenance" fill="#f59e0b" radius={[2, 2, 0, 0]} stackId="a" />
                </BarChart></ResponsiveContainer>
              </div>
            ) : <p className="text-sm text-muted-foreground py-8 text-center">No cost data</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Vehicle ROI</CardTitle></CardHeader>
          <CardContent>
            {roiData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer><BarChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="roi" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart></ResponsiveContainer>
              </div>
            ) : <p className="text-sm text-muted-foreground py-8 text-center">No ROI data</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Fuel className="h-4 w-4" /> Fuel Efficiency (km/L)</CardTitle></CardHeader>
          <CardContent>
            {efficiencyData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer><BarChart data={efficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="efficiency" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart></ResponsiveContainer>
              </div>
            ) : <p className="text-sm text-muted-foreground py-8 text-center">No efficiency data</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2"><Truck className="h-4 w-4" /> Top Costliest Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          {roi?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Vehicle</th><th className="pb-2 font-medium">Revenue</th><th className="pb-2 font-medium">Fuel Cost</th><th className="pb-2 font-medium">Maintenance</th><th className="pb-2 font-medium">Acquisition</th><th className="pb-2 font-medium">ROI</th>
                </tr></thead>
                <tbody>
                  {[...roi].sort((a: any, b: any) => a.roi - b.roi).slice(0, 10).map((v: any) => (
                    <tr key={v.vehicleId} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 font-medium">{v.vehicleName}</td>
                      <td className="py-2">${v.totalRevenue.toLocaleString()}</td>
                      <td className="py-2">${v.totalFuelCost.toLocaleString()}</td>
                      <td className="py-2">${v.totalMaintenanceCost.toLocaleString()}</td>
                      <td className="py-2">${v.acquisitionCost.toLocaleString()}</td>
                      <td className="py-2"><span className={`font-semibold ${v.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>{v.roi.toFixed(1)}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-muted-foreground py-4 text-center">Complete trips to generate ROI data</p>}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
