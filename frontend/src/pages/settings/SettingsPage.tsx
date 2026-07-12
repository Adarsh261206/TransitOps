import { useState } from 'react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { PageTransition } from '@/components/shared/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/shared/Toast';
import { usePermission } from '@/components/auth/PermissionGuard';
import { Permissions, getNotificationCategories } from '@/utils/permissions';
import ForbiddenPage from '@/pages/ForbiddenPage';
import { Building2, Shield, User, Bell } from 'lucide-react';

const roles = [
  { value: 'FLEET_MANAGER', label: 'Fleet Manager', permissions: ['Full Access'] },
  { value: 'DISPATCHER', label: 'Dispatcher', permissions: ['Create Trips', 'Assign Drivers', 'Dispatch'] },
  { value: 'SAFETY_OFFICER', label: 'Safety Officer', permissions: ['Driver Compliance', 'License Tracking'] },
  { value: 'FINANCIAL_ANALYST', label: 'Financial Analyst', permissions: ['Expenses', 'Reports', 'Analytics'] },
];

const roleNotificationPrefs: Record<string, Array<{ label: string; desc: string }>> = {
  FLEET_MANAGER: [
    { label: 'Maintenance Due Alerts', desc: 'Get notified when vehicles are due for maintenance' },
    { label: 'Vehicle Status Changes', desc: 'Notifications when vehicle status changes' },
    { label: 'Fleet Report Digest', desc: 'Receive weekly fleet operational reports' },
    { label: 'New Vehicle Registered', desc: 'Alert when a new vehicle is added to the fleet' },
  ],
  DISPATCHER: [
    { label: 'Trip Assigned', desc: 'Get notified when a trip is assigned to a driver' },
    { label: 'Trip Completed', desc: 'Notifications when trips are completed' },
    { label: 'Trip Cancelled', desc: 'Alert when a trip gets cancelled' },
    { label: 'Driver Available', desc: 'Get notified when a driver becomes available' },
  ],
  SAFETY_OFFICER: [
    { label: 'License Expiry Reminders', desc: 'Get notified when driver licenses are about to expire' },
    { label: 'Driver Suspension Alert', desc: 'Notification when a driver is suspended' },
    { label: 'Driver Activated', desc: 'Alert when a suspended driver is reactivated' },
    { label: 'Compliance Report', desc: 'Receive weekly compliance summary' },
  ],
  FINANCIAL_ANALYST: [
    { label: 'Expense Added', desc: 'Get notified when new expenses are recorded' },
    { label: 'Budget Threshold', desc: 'Alert when spending exceeds budget limits' },
    { label: 'Fuel Cost Change', desc: 'Notifications about fuel cost fluctuations' },
    { label: 'Financial Report', desc: 'Receive monthly financial summary reports' },
  ],
};

type TabKey = 'general' | 'rbac' | 'profile' | 'notifications' | 'appearance';

interface Tab {
  key: TabKey;
  label: string;
  icon: any;
  roles: string[];
}

const allTabs: Tab[] = [
  { key: 'general', label: 'General', icon: Building2, roles: ['FLEET_MANAGER'] },
  { key: 'rbac', label: 'RBAC', icon: Shield, roles: ['FLEET_MANAGER'] },
  { key: 'profile', label: 'Profile', icon: User, roles: ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
  { key: 'notifications', label: 'Notifications', icon: Bell, roles: ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
];

export function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { can } = usePermission();
  const role = user?.role ?? '';

  const visibleTabs = allTabs.filter(t => t.roles.includes(role));
  const [activeTab, setActiveTab] = useState<TabKey>(visibleTabs[0]?.key ?? 'profile');

  if (!can(Permissions.SETTINGS_READ)) {
    return <ForbiddenPage />;
  }

  const roleLabel = role.replace(/_/g, ' ');

  return (
    <PageTransition>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold tracking-tight mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {role === 'FLEET_MANAGER'
          ? 'Configure your organization, roles, and preferences.'
          : `Manage your profile and notification preferences as ${roleLabel}.`}
      </p>

      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        {visibleTabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && can(Permissions.SETTINGS_WRITE) && (
        <Card>
          <CardHeader><CardTitle className="text-lg">General Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Company Name</Label><Input placeholder="TransitOps Corp" defaultValue="TransitOps Corp" /></div>
              <div className="space-y-2"><Label>Depot / Base Location</Label><Input placeholder="New York, USA" defaultValue="New York, USA" /></div>
              <div className="space-y-2"><Label>Currency</Label><Select defaultValue="USD"><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option></Select></div>
              <div className="space-y-2"><Label>Distance Unit</Label><Select defaultValue="km"><option value="km">Kilometers (km)</option><option value="mi">Miles (mi)</option></Select></div>
            </div>
            <Button onClick={() => toast('Settings saved', 'success')}>Save Settings</Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'rbac' && can(Permissions.SETTINGS_WRITE) && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Role-Based Access Control</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Configure which modules each role can access.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left">
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium text-center text-xs">Dashboard</th>
                    <th className="pb-3 font-medium text-center text-xs">Fleet</th>
                    <th className="pb-3 font-medium text-center text-xs">Drivers</th>
                    <th className="pb-3 font-medium text-center text-xs">Trips</th>
                    <th className="pb-3 font-medium text-center text-xs">Maintenance</th>
                    <th className="pb-3 font-medium text-center text-xs">Fuel</th>
                    <th className="pb-3 font-medium text-center text-xs">Expenses</th>
                    <th className="pb-3 font-medium text-center text-xs">Reports</th>
                    <th className="pb-3 font-medium text-center text-xs">Settings</th>
                  </tr></thead>
                  <tbody>
                    {roles.map(r => (
                      <tr key={r.value} className="border-b last:border-0">
                        <td className="py-3 font-medium">{r.label}</td>
                        <td className="py-3 text-center"><input type="checkbox" defaultChecked className="rounded" /></td>
                        <td className="py-3 text-center"><input type="checkbox" defaultChecked={r.value !== 'DISPATCHER' && r.value !== 'SAFETY_OFFICER'} className="rounded" /></td>
                        <td className="py-3 text-center"><input type="checkbox" defaultChecked className="rounded" /></td>
                        <td className="py-3 text-center"><input type="checkbox" defaultChecked className="rounded" /></td>
                        <td className="py-3 text-center"><input type="checkbox" defaultChecked={r.value === 'FLEET_MANAGER'} className="rounded" /></td>
                        <td className="py-3 text-center"><input type="checkbox" defaultChecked={r.value === 'FLEET_MANAGER' || r.value === 'FINANCIAL_ANALYST'} className="rounded" /></td>
                        <td className="py-3 text-center"><input type="checkbox" defaultChecked={r.value === 'FLEET_MANAGER' || r.value === 'FINANCIAL_ANALYST'} className="rounded" /></td>
                        <td className="py-3 text-center"><input type="checkbox" defaultChecked={r.value === 'FLEET_MANAGER' || r.value === 'FINANCIAL_ANALYST'} className="rounded" /></td>
                        <td className="py-3 text-center"><input type="checkbox" defaultChecked={r.value === 'FLEET_MANAGER'} className="rounded" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button className="mt-4" onClick={() => toast('Permissions updated', 'success')}>Save Permissions</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'profile' && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Profile Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">{user?.name?.charAt(0)}</div>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge variant="secondary">{roleLabel}</Badge>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Full Name</Label><Input defaultValue={user?.name} /></div>
              <div className="space-y-2"><Label>Email</Label><Input defaultValue={user?.email} type="email" disabled className="opacity-60" /></div>
              <div className="space-y-2"><Label>Current Password</Label><Input type="password" placeholder="Enter current password" /></div>
              <div className="space-y-2"><Label>New Password</Label><Input type="password" placeholder="Enter new password" /></div>
            </div>
            <Button onClick={() => toast('Profile updated', 'success')}>Update Profile</Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Notification Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground mb-2">
              Manage the notifications you receive as a <Badge variant="secondary">{roleLabel}</Badge>
            </p>
            {(roleNotificationPrefs[role] ?? []).map(item => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border p-4">
                <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
            ))}
            <Button onClick={() => toast('Notification preferences saved', 'success')}>Save Preferences</Button>
          </CardContent>
        </Card>
      )}
    </PageTransition>
  );
}
