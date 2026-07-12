import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { usePermission } from '../../components/auth/PermissionGuard';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { PageTransition } from '@/components/shared/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { motion } from 'framer-motion';
import { BarChart3, Download, TrendingUp, DollarSign, Fuel, PieChart, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell } from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function ReportsPage() {
  const { can } = usePermission();
  const [period, setPeriod] = useState('all');
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const periodParam = period !== 'all' ? `?period=${period}` : '';

  const { data: summary } = useQuery({ queryKey: ['reports-summary', period], queryFn: async () => { const r = await api.get(`/reports/summary${periodParam}`); return r.data; } });
  const { data: utilization } = useQuery({ queryKey: ['reports-utilization', period], queryFn: async () => { const r = await api.get(`/reports/fleet-utilization${periodParam}`); return r.data; } });
  const { data: fuelEfficiency } = useQuery({ queryKey: ['reports-fuel-efficiency', period], queryFn: async () => { const r = await api.get(`/reports/fuel-efficiency${periodParam}`); return r.data; } });
  const { data: operationalCost } = useQuery({ queryKey: ['reports-operational-cost', period], queryFn: async () => { const r = await api.get(`/reports/operational-cost${periodParam}`); return r.data; } });
  const { data: roi } = useQuery({ queryKey: ['reports-roi', period], queryFn: async () => { const r = await api.get(`/reports/vehicle-roi${periodParam}`); return r.data; } });

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(format);
    try {
      const [summaryRes, utilizationRes, fuelRes, costRes, roiRes] = await Promise.all([
        api.get(`/reports/summary${periodParam}`), api.get(`/reports/fleet-utilization${periodParam}`),
        api.get(`/reports/fuel-efficiency${periodParam}`), api.get(`/reports/operational-cost${periodParam}`), api.get(`/reports/vehicle-roi${periodParam}`),
      ]);
      const s = summaryRes.data;
      const u = utilizationRes.data;
      const f = fuelRes.data || [];
      const c = costRes.data;
      const r = roiRes.data || [];

      if (format === 'csv') {
        const rows: string[][] = [['Metric', 'Value']];
        const addRow = (k: string, v: any) => rows.push([k, String(v ?? '')]);
        addRow('Total Vehicles', s.totalVehicles); addRow('Total Drivers', s.totalDrivers);
        addRow('Total Trips', s.totalTrips); addRow('Total Revenue', s.totalRevenue);
        addRow('Total Operational Cost', s.totalOperationalCost);
        addRow('Fuel Efficiency (avg)', f.length ? (f.reduce((a: number, x: any) => a + Number(x.efficiency), 0) / f.length).toFixed(1) : '0');
        addRow('Fleet Utilization', `${u?.utilizationRate ?? 0}%`);
        addRow('Vehicle ROI (avg)', r.length ? `${(r.reduce((a: number, x: any) => a + x.roi, 0) / r.length).toFixed(2)}%` : '0%');
        addRow('', ''); addRow('--- Vehicle ROI ---', '');
        r.forEach((v: any) => addRow(v.vehicleName, `${v.roi.toFixed(2)}%`));
        addRow('', ''); addRow('--- Operational Cost ---', '');
        (c?.vehicleCosts || []).forEach((v: any) => addRow(v.vehicleName, `$${v.fuelCost} Fuel / $${v.maintenanceCost} Maint / $${v.otherExpenses} Other`));
        const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'transitops-report.csv'; a.click();
        URL.revokeObjectURL(url);
      } else {
        const { default: jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;
        const doc = new jsPDF('landscape');
        doc.setFontSize(18); doc.text('TransitOps Operational Report', 14, 20);
        doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleDateString()} · Period: ${period === 'all' ? 'All Time' : period}`, 14, 28);

        doc.setFontSize(12); doc.text('Summary', 14, 38);
        autoTable(doc, {
          startY: 42, head: [['Metric', 'Value']],
          body: [
            ['Total Vehicles', String(s.totalVehicles ?? 0)], ['Total Drivers', String(s.totalDrivers ?? 0)],
            ['Total Trips', String(s.totalTrips ?? 0)], ['Total Revenue', `$${(s.totalRevenue ?? 0).toLocaleString()}`],
            ['Total Cost', `$${(s.totalOperationalCost ?? 0).toLocaleString()}`],
            ['Fleet Utilization', `${u?.utilizationRate ?? 0}%`],
          ], styles: { fontSize: 9 },
        });

        if (r.length) {
          autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10, head: [['Vehicle', 'Revenue', 'Fuel Cost', 'Maintenance', 'Acquisition', 'ROI']],
            body: r.map((v: any) => [v.vehicleName, `$${(v.totalRevenue ?? 0).toLocaleString()}`, `$${(v.totalFuelCost ?? 0).toLocaleString()}`, `$${(v.totalMaintenanceCost ?? 0).toLocaleString()}`, `$${(v.acquisitionCost ?? 0).toLocaleString()}`, `${v.roi.toFixed(2)}%`]),
            styles: { fontSize: 8 },
          });
        }

        if (c?.vehicleCosts?.length) {
          autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10, head: [['Vehicle', 'Fuel Cost', 'Maintenance', 'Other Expenses']],
            body: c.vehicleCosts.map((v: any) => [v.vehicleName, `$${(v.fuelCost ?? 0).toLocaleString()}`, `$${(v.maintenanceCost ?? 0).toLocaleString()}`, `$${(v.otherExpenses ?? 0).toLocaleString()}`]),
            styles: { fontSize: 8 },
          });
        }

        if (f.length) {
          autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10, head: [['Vehicle', 'Efficiency']],
            body: f.map((v: any) => [v.vehicleName, `${Number(v.efficiency).toFixed(1)} km/L`]),
            styles: { fontSize: 8 },
          });
        }

        doc.save('transitops-report.pdf');
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(null);
    }
  };

  const pieData = utilization ? [
    { name: 'On Trip', value: utilization.onTrip },
    { name: 'Available', value: utilization.available },
    { name: 'In Shop', value: utilization.inShop },
    { name: 'Retired', value: utilization.retired },
  ].filter(d => d.value > 0) : [];

  const costData = operationalCost?.vehicleCosts?.map((v: any) => ({ name: v.vehicleName, Fuel: v.fuelCost, Expenses: v.maintenanceCost + v.otherExpenses })) || [];
  const roiData = roi?.map((v: any) => ({ name: v.vehicleName, roi: parseFloat(v.roi.toFixed(2)) })) || [];
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
          <Select value={period} onChange={e => setPeriod(e.target.value)} className="w-32">
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last Quarter</option>
            <option value="1y">This Year</option>
          </Select>
          {can('reports:export:csv') && <Button variant="outline" onClick={() => handleExport('csv')} disabled={exporting !== null}>{exporting === 'csv' ? <Spinner /> : <><Download className="h-4 w-4 mr-2" /> CSV</>}</Button>}
          {can('reports:export:pdf') && <Button variant="outline" onClick={() => handleExport('pdf')} disabled={exporting !== null}>{exporting === 'pdf' ? <Spinner /> : <><Download className="h-4 w-4 mr-2" /> PDF</>}</Button>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: 'Fuel Efficiency', value: summary ? `${(summary.totalFuelLiters > 0 ? (summary.totalTrips * 100 / summary.totalFuelLiters) : 0).toFixed(1)} km/L` : '-', icon: Fuel, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
          { label: 'Fleet Utilization', value: `${utilization?.utilizationRate ?? 0}%`, icon: PieChart, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
          { label: 'Operational Cost', value: summary ? `$${(summary.totalOperationalCost ?? 0).toLocaleString()}` : '-', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20' },
          { label: 'Vehicle ROI', value: roi?.length ? `${(roi.reduce((s: number, v: any) => s + v.roi, 0) / roi.length).toFixed(2)}%` : '-', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' },
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
                  <Bar dataKey="Expenses" fill="#f59e0b" radius={[2, 2, 0, 0]} stackId="a" />
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
                  <Tooltip formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'ROI']} />
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
                  <th className="pb-2 font-medium">Vehicle</th><th className="pb-2 font-medium">Revenue</th><th className="pb-2 font-medium">Fuel</th><th className="pb-2 font-medium">Expenses</th><th className="pb-2 font-medium">Acquisition</th><th className="pb-2 font-medium">ROI</th>
                </tr></thead>
                <tbody>
                  {[...roi].sort((a: any, b: any) => a.roi - b.roi).slice(0, 10).map((v: any) => (
                    <tr key={v.vehicleId} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 font-medium">{v.vehicleName}</td>
                      <td className="py-2">${v.totalRevenue.toLocaleString()}</td>
                      <td className="py-2">${v.totalFuelCost.toLocaleString()}</td>
                      <td className="py-2">${v.totalMaintenanceCost.toLocaleString()}</td>
                      <td className="py-2">${v.acquisitionCost.toLocaleString()}</td>
                      <td className="py-2"><span className={`font-semibold ${v.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>{v.roi.toFixed(2)}%</span></td>
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
