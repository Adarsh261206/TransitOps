import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageTransition } from '@/components/shared/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { motion } from 'framer-motion';
import { BarChart3, Download, TrendingUp, DollarSign, Fuel, Gauge, PieChart } from 'lucide-react';

export function ReportsPage() {
  const { data: summary } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async () => { const res = await api.get('/reports/summary'); return res.data; },
  });

  const { data: utilization } = useQuery({
    queryKey: ['reports-utilization'],
    queryFn: async () => { const res = await api.get('/reports/fleet-utilization'); return res.data; },
  });

  const { data: fuelEfficiency } = useQuery({
    queryKey: ['reports-fuel-efficiency'],
    queryFn: async () => { const res = await api.get('/reports/fuel-efficiency'); return res.data; },
  });

  const { data: operationalCost } = useQuery({
    queryKey: ['reports-operational-cost'],
    queryFn: async () => { const res = await api.get('/reports/operational-cost'); return res.data; },
  });

  const { data: roi } = useQuery({
    queryKey: ['reports-roi'],
    queryFn: async () => { const res = await api.get('/reports/vehicle-roi'); return res.data; },
  });

  const handleExport = async () => {
    try {
      const res = await api.get('/reports/summary');
      const data = res.data;
      const csv = Object.entries(data).map(([key, val]) => `${key},${val}`).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transitops-report.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <PageTransition>
      <PageHeader
        title="Reports & Analytics"
        description="Operational insights, cost analysis, and fleet performance metrics."
        action={
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        }
      />

      <div className="grid gap-6 mb-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Operational Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Total Trips', value: summary.totalTrips, icon: TrendingUp },
                  { label: 'Completed Trips', value: summary.completedTrips, icon: TrendingUp },
                  { label: 'Total Fuel Cost', value: `$${summary.totalFuelCost?.toLocaleString()}`, icon: Fuel },
                  { label: 'Total Maintenance', value: `$${summary.totalMaintenanceCost?.toLocaleString()}`, icon: DollarSign },
                  { label: 'Other Expenses', value: `$${summary.totalOtherExpenses?.toLocaleString()}`, icon: DollarSign },
                  { label: 'Total Operational', value: `$${summary.totalOperationalCost?.toLocaleString()}`, icon: DollarSign },
                  { label: 'Total Fuel (L)', value: `${summary.totalFuelLiters?.toFixed(0)} L`, icon: Fuel },
                  { label: 'Total Vehicles', value: summary.totalVehicles, icon: Gauge },
                ].map((item, i) => (
                  <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="rounded-lg bg-muted/50 p-3"
                  >
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-bold mt-1">{item.value}</p>
                  </motion.div>
                ))}
              </div>
            ) : <TableSkeleton rows={4} cols={2} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Fleet Utilization</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {utilization ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <span className="text-sm font-medium">Overall Utilization Rate</span>
                  <span className="text-2xl font-bold text-primary">{utilization.utilizationRate}%</span>
                </div>
                {[
                  { label: 'On Trip', value: utilization.onTrip, total: utilization.total, color: 'bg-blue-500' },
                  { label: 'Available', value: utilization.available, total: utilization.total, color: 'bg-green-500' },
                  { label: 'In Shop', value: utilization.inShop, total: utilization.total, color: 'bg-amber-500' },
                  { label: 'Retired', value: utilization.retired, total: utilization.total, color: 'bg-gray-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.label}</span>
                      <span className="font-medium">{item.value} / {item.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${item.color}`} style={{ width: `${(item.value / Math.max(item.total, 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <TableSkeleton rows={5} cols={2} />}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mb-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Operational Cost per Vehicle</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {operationalCost && operationalCost.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Vehicle</th>
                      <th className="pb-2 font-medium">Fuel</th>
                      <th className="pb-2 font-medium">Maintenance</th>
                      <th className="pb-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationalCost.map((item: any, i: number) => (
                      <tr key={item.vehicleId} className="border-b last:border-0">
                        <td className="py-2 font-medium">{item.vehicleName}</td>
                        <td className="py-2">${item.fuelCost.toLocaleString()}</td>
                        <td className="py-2">${item.maintenanceCost.toLocaleString()}</td>
                        <td className="py-2 font-semibold">${item.totalOperationalCost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-muted-foreground py-4 text-center">No cost data available</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Vehicle ROI</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {roi && roi.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Vehicle</th>
                      <th className="pb-2 font-medium">Revenue</th>
                      <th className="pb-2 font-medium">Cost</th>
                      <th className="pb-2 font-medium">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roi.map((item: any, i: number) => (
                      <tr key={item.vehicleId} className="border-b last:border-0">
                        <td className="py-2 font-medium">{item.vehicleName}</td>
                        <td className="py-2">${item.totalRevenue.toLocaleString()}</td>
                        <td className="py-2">${item.operationalCost.toLocaleString()}</td>
                        <td className="py-2">
                          <span className={`font-semibold ${item.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.roi.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-muted-foreground py-4 text-center">No ROI data available yet. Complete some trips first.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Fuel Efficiency (km/L)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {fuelEfficiency && fuelEfficiency.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Vehicle</th>
                    <th className="pb-2 font-medium">Total Distance</th>
                    <th className="pb-2 font-medium">Total Fuel</th>
                    <th className="pb-2 font-medium">Efficiency (km/L)</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelEfficiency.map((item: any, i: number) => (
                    <tr key={item.vehicleId} className="border-b last:border-0">
                      <td className="py-2 font-medium">{item.vehicleName} ({item.registrationNumber})</td>
                      <td className="py-2">{item.totalDistance.toLocaleString()} km</td>
                      <td className="py-2">{item.totalFuel.toFixed(1)} L</td>
                      <td className="py-2 font-semibold">{item.efficiency} km/L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-muted-foreground py-4 text-center">No fuel efficiency data available yet. Complete trips to generate data.</p>}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
