import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { PageTransition } from '@/components/shared/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Users, Truck } from 'lucide-react';

const severityColor: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  CRITICAL: 'destructive', HIGH: 'destructive', WARNING: 'secondary',
};

export function CompliancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['compliance-summary'],
    queryFn: async () => { const r = await api.get('/compliance/summary'); return r.data; },
  });

  const stats = data?.stats;
  const issues = data?.issues || [];

  const statCards = [
    { label: 'Total Issues', value: stats?.totalIssues ?? 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20' },
    { label: 'Expired Licenses', value: stats?.expiredLicenses ?? 0, icon: Users, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20' },
    { label: 'Vehicle Compliance', value: stats?.vehicleComplianceIssues ?? 0, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20' },
    { label: 'Expiring Soon', value: stats?.expiringLicenses ?? 0, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
  ];

  return (
    <PageTransition>
      <Breadcrumbs />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Driver license validity, vehicle document expiries, and regulatory compliance tracking.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-lg font-bold">{s.value}</p></div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Compliance Issues</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <TableSkeleton rows={5} cols={4} /> : issues.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No compliance issues found. All documents are up to date.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Entity</th><th className="pb-3 font-medium">Type</th><th className="pb-3 font-medium">Item</th><th className="pb-3 font-medium">Expiry</th><th className="pb-3 font-medium">Severity</th>
                </tr></thead>
                <tbody>
                  {issues.map((issue: any, i: number) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 font-medium">{issue.name}</td>
                      <td className="py-3">{issue.type}</td>
                      <td className="py-3 text-muted-foreground">{issue.item}</td>
                      <td className="py-3">{new Date(issue.expiryDate).toLocaleDateString()}</td>
                      <td className="py-3"><Badge variant={severityColor[issue.severity] || 'default'}>{issue.severity}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
