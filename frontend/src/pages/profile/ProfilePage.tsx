import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { PageTransition } from '@/components/shared/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/shared/Toast';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = { name: name.trim() };
      if (currentPassword && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      return api.put('/auth/profile', payload);
    },
    onSuccess: (res) => {
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setCurrentPassword('');
      setNewPassword('');
      toast('Profile updated', 'success');
    },
    onError: (err: any) => {
      toast(err.response?.data?.error || 'Failed to update profile', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast('Name is required', 'error'); return; }
    if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
      toast('Both current and new password required to change password', 'error');
      return;
    }
    mutation.mutate();
  };

  return (
    <PageTransition>
      <Breadcrumbs />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-1">My Profile</h1>
        <p className="text-sm text-muted-foreground mb-6">View and update your account information.</p>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-3xl font-bold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge variant="secondary" className="mt-1">{user?.role?.replace(/_/g, ' ')}</Badge>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div><p className="text-xs text-muted-foreground">Name</p><p className="text-sm font-medium">{user?.name}</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium">{user?.email}</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div><p className="text-xs text-muted-foreground">Role</p><p className="text-sm font-medium">{user?.role?.replace(/_/g, ' ')}</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div><p className="text-xs text-muted-foreground">Member Since</p><p className="text-sm font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Edit Profile</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} type="email" disabled className="opacity-60" />
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-4">Change Password (optional)</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input type="password" placeholder="Enter current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Spinner /> : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
