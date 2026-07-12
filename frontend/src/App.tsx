import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { ToastProvider } from '@/components/shared/Toast';
import { NotificationProvider } from '@/hooks/useNotifications';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import FleetManagerDashboard from '@/pages/dashboards/FleetManagerDashboard';
import { DispatcherDashboard } from '@/pages/dashboards/DispatcherDashboard';
import { SafetyOfficerDashboard } from '@/pages/dashboards/SafetyOfficerDashboard';
import FinancialAnalystDashboard from '@/pages/dashboards/FinancialAnalystDashboard';
import { VehiclesPage } from '@/pages/vehicles/VehiclesPage';
import { DriversPage } from '@/pages/drivers/DriversPage';
import { TripsPage } from '@/pages/trips/TripsPage';
import { MaintenancePage } from '@/pages/maintenance/MaintenancePage';
import { FuelExpensesPage } from '@/pages/fuel/FuelExpensesPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { AuditLogPage } from '@/pages/audit/AuditLogPage';
import { CompliancePage } from '@/pages/compliance/CompliancePage';
import { IncidentsPage } from '@/pages/incidents/IncidentsPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import PermissionGuard from './components/auth/PermissionGuard';
import { Permissions } from './utils/permissions';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 10000 } },
});

function RoleBasedDashboard() {
  const { user } = useAuth();
  switch (user?.role) {
    case 'FLEET_MANAGER': return <FleetManagerDashboard />;
    case 'DISPATCHER': return <DispatcherDashboard />;
    case 'SAFETY_OFFICER': return <SafetyOfficerDashboard />;
    case 'FINANCIAL_ANALYST': return <FinancialAnalystDashboard />;
    case 'DRIVER': return <DispatcherDashboard />;
    default: return <Navigate to="/login" />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<RoleBasedDashboard />} />
                  <Route path="/vehicles" element={<PermissionGuard permission={Permissions.FLEET_READ}><VehiclesPage /></PermissionGuard>} />
                  <Route path="/vehicles/:id" element={<PermissionGuard permission={Permissions.FLEET_READ}><VehiclesPage /></PermissionGuard>} />
                  <Route path="/drivers" element={<PermissionGuard permission={Permissions.DRIVERS_READ}><DriversPage /></PermissionGuard>} />
                  <Route path="/drivers/:id" element={<PermissionGuard permission={Permissions.DRIVERS_READ}><DriversPage /></PermissionGuard>} />
                  <Route path="/trips" element={<PermissionGuard permission={Permissions.TRIPS_READ}><TripsPage /></PermissionGuard>} />
                  <Route path="/trips/:id" element={<PermissionGuard permission={Permissions.TRIPS_READ}><TripsPage /></PermissionGuard>} />
                  <Route path="/maintenance" element={<PermissionGuard permission={Permissions.MAINTENANCE_READ}><MaintenancePage /></PermissionGuard>} />
                  <Route path="/maintenance/:id" element={<PermissionGuard permission={Permissions.MAINTENANCE_READ}><MaintenancePage /></PermissionGuard>} />
                  <Route path="/fuel-expenses" element={<PermissionGuard permission={Permissions.FUEL_READ}><FuelExpensesPage /></PermissionGuard>} />
                  <Route path="/fuel" element={<Navigate to="/fuel-expenses" replace />} />
                  <Route path="/expenses" element={<Navigate to="/fuel-expenses" replace />} />
                  <Route path="/analytics" element={<Navigate to="/reports" replace />} />
                  <Route path="/reports" element={<PermissionGuard permission={Permissions.REPORTS_READ}><ReportsPage /></PermissionGuard>} />
                  <Route path="/audit" element={<PermissionGuard permission={Permissions.AUDIT_READ}><AuditLogPage /></PermissionGuard>} />
                  <Route path="/compliance" element={<PermissionGuard permission={Permissions.COMPLIANCE_READ}><CompliancePage /></PermissionGuard>} />
                  <Route path="/compliance/:id" element={<PermissionGuard permission={Permissions.COMPLIANCE_READ}><CompliancePage /></PermissionGuard>} />
                  <Route path="/incidents" element={<PermissionGuard permission={Permissions.INCIDENTS_READ}><IncidentsPage /></PermissionGuard>} />
                  <Route path="/incidents/:id" element={<PermissionGuard permission={Permissions.INCIDENTS_READ}><IncidentsPage /></PermissionGuard>} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<PermissionGuard permission={Permissions.SETTINGS_READ}><SettingsPage /></PermissionGuard>} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
