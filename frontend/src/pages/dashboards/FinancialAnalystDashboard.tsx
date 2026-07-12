import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { PageTransition } from '@/components/shared/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Fuel, Receipt, BarChart3, TrendingUp, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function FinancialAnalystDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
          <Button variant="outline" onClick={() => navigate('/reports')}>
            <Download className="h-4 w-4 mr-2" /> Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/fuel')}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fuel Costs</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">Track</p>
              </div>
              <div className="rounded-lg p-2.5 bg-amber-100 dark:bg-amber-900/20">
                <Fuel className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/expenses')}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">Manage</p>
              </div>
              <div className="rounded-lg p-2.5 bg-red-100 dark:bg-red-900/20">
                <Receipt className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/analytics')}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Analytics</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">Insights</p>
              </div>
              <div className="rounded-lg p-2.5 bg-green-100 dark:bg-green-900/20">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader><CardTitle className="text-lg">Cost Trends</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Fuel & expense trends will be displayed here
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Budget Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Budget tracking and forecasts coming soon
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
