import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { ToastProvider } from '@/components/shared/Toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { VehiclesPage } from '@/pages/vehicles/VehiclesPage';
import { DriversPage } from '@/pages/drivers/DriversPage';
import { TripsPage } from '@/pages/trips/TripsPage';
import { MaintenancePage } from '@/pages/maintenance/MaintenancePage';
import { FuelExpensesPage } from '@/pages/fuel/FuelExpensesPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 10000 } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/vehicles" element={<VehiclesPage />} />
                  <Route path="/drivers" element={<DriversPage />} />
                  <Route path="/trips" element={<TripsPage />} />
                  <Route path="/maintenance" element={<MaintenancePage />} />
                  <Route path="/fuel-expenses" element={<FuelExpensesPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
