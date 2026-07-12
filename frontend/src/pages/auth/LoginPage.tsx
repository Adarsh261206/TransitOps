import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Truck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '', role: 'FLEET_MANAGER', rememberMe: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attempts >= 5) {
      setError('Account locked. Too many failed attempts. Please try again later.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err: any) {
      setAttempts(a => a + 1);
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
                <Truck className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">TransitOps</h1>
                <p className="text-xs text-muted-foreground">Smart Transport Operations Platform</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" type="email" placeholder="you@company.com" 
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" 
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
                  required className="pr-9"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select id="role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="FLEET_MANAGER">Fleet Manager</option>
                <option value="DRIVER">Driver</option>
                <option value="SAFETY_OFFICER">Safety Officer</option>
                <option value="FINANCIAL_ANALYST">Financial Analyst</option>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.rememberMe} onChange={e => setForm(f => ({ ...f, rememberMe: e.target.checked }))} className="rounded border-gray-300" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {attempts >= 3 && attempts < 5 && (
              <p className="text-xs text-amber-600">{5 - attempts} attempt(s) remaining before lockout</p>
            )}

            <Button type="submit" className="w-full h-10" disabled={loading || attempts >= 5}>
              {loading ? <Spinner /> : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/register" className="text-primary hover:underline font-medium">Create account</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-xl">
            <Truck className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Transport Operations Platform</h2>
          <p className="text-muted-foreground mb-6">
            Manage your entire fleet operations from vehicle registration and driver management to dispatching, maintenance, fuel logging, and analytics — all in one place.
          </p>
          <div className="grid grid-cols-2 gap-3 text-left">
            {['Fleet Management', 'Driver Compliance', 'Trip Dispatching', 'Maintenance Tracking', 'Fuel & Expense', 'Reports & Analytics'].map(f => (
              <div key={f} className="flex items-center gap-2 rounded-lg bg-background/80 p-3 text-sm font-medium">
                <div className="h-2 w-2 rounded-full bg-primary" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
