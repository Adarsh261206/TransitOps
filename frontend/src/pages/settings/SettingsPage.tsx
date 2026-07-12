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
import { Building2, Globe, DollarSign, Ruler, Shield, User, Bell, Eye, EyeOff } from 'lucide-react';

const roles = [
  { value: 'FLEET_MANAGER', label: 'Fleet Manager', permissions: ['Full Access'] },
  { value: 'DRIVER', label: 'Driver', permissions: ['Create Trips', 'View Assignments'] },
  { value: 'SAFETY_OFFICER', label: 'Safety Officer', permissions: ['Driver Compliance', 'License Tracking'] },
  { value: 'FINANCIAL_ANALYST', label: 'Financial Analyst', permissions: ['Expenses', 'Reports'] },
];

const modules = ['Dashboard', 'Vehicles', 'Drivers', 'Trips', 'Maintenance', 'Fuel & Expenses', 'Analytics', 'Settings'];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'rbac' | 'profile' | 'notifications'>('general');
  const { user } = useAuth();
  const { toast } = useToast();

  return (
    <PageTransition>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold tracking-tight mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">Configure your organization, roles, and preferences.</p>

      <div className="flex gap-1 mb-6 border-b">
        {[
          { key: 'general' as const, label: 'General', icon: Building2 },
          { key: 'rbac' as const, label: 'RBAC', icon: Shield },
          { key: 'profile' as const, label: 'Profile', icon: User },
          { key: 'notifications' as const, label: 'Notifications', icon: Bell },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
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

      {activeTab === 'rbac' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Role-Based Access Control</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Configure which modules each role can access.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left">
                    <th className="pb-3 font-medium">Role</th>
                    {modules.map(m => <th key={m} className="pb-3 font-medium text-center text-xs">{m}</th>)}
                  </tr></thead>
                  <tbody>
                    {roles.map(role => (
                      <tr key={role.value} className="border-b last:border-0">
                        <td className="py-3 font-medium">{role.label}</td>
                        {modules.map(m => (
                          <td key={m} className="py-3 text-center">
                            <input type="checkbox" defaultChecked={role.label === 'Fleet Manager' || role.label === 'Financial Analyst' && ['Fuel & Expenses', 'Analytics'].includes(m) || role.label === 'Driver' && ['Dashboard', 'Trips'].includes(m) || role.label === 'Safety Officer' && ['Dashboard', 'Drivers'].includes(m)} className="rounded" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              <div><p className="font-medium">{user?.name}</p><p className="text-sm text-muted-foreground">{user?.email}</p><Badge variant="secondary">{user?.role?.replace(/_/g, ' ')}</Badge></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Full Name</Label><Input defaultValue={user?.name} /></div>
              <div className="space-y-2"><Label>Email</Label><Input defaultValue={user?.email} type="email" /></div>
              <div className="space-y-2"><Label>Current Password</Label><Input type="password" placeholder="Enter current password" /></div>
              <div className="space-y-2"><Label>New Password</Label><Input type="password" placeholder="Enter new password" /></div>
            </div>
            <Button onClick={() => toast('Profile updated', 'success')}>Update Profile</Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Notification Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'License Expiry Reminders', desc: 'Get notified when driver licenses are about to expire' },
              { label: 'Maintenance Due Alerts', desc: 'Receive alerts when vehicles are due for maintenance' },
              { label: 'Trip Status Updates', desc: 'Notifications when trips are dispatched or completed' },
              { label: 'Weekly Report Digest', desc: 'Receive weekly operational reports via email' },
            ].map(item => (
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
