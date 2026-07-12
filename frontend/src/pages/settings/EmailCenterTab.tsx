import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/shared/Toast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import {
  Mail, Settings2, Send, RefreshCw, CheckCircle, XCircle,
  Clock, MailOpen, Filter, Eye, Play, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  template: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'OPENED';
  sentAt: string | null;
  failedReason: string | null;
  retryCount: number;
  createdAt: string;
  user?: { name: string; email: string } | null;
}

interface EmailStats { total: number; sent: number; failed: number; pending: number; successRate: number; }

interface EmailSetting {
  smtpHost: string | null; smtpPort: number | null; smtpSecure: boolean;
  smtpUser: string | null; smtpPassword: string | null;
  senderName: string; senderEmail: string; replyTo: string; supportEmail: string; maxRetries: number;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: EmailLog['status'] }) {
  const map = {
    SENT: { icon: CheckCircle, label: 'Sent', cls: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
    FAILED: { icon: XCircle, label: 'Failed', cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
    PENDING: { icon: Clock, label: 'Pending', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
    OPENED: { icon: MailOpen, label: 'Opened', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  };
  const { icon: Icon, label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
}

// ─── Log Detail Modal ─────────────────────────────────────────────────────────

function LogDetailModal({ log, onClose }: { log: EmailLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-semibold">Email Log Detail</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={log.status} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Recipient</span><span className="font-medium">{log.recipient}</span></div>
          <div className="flex justify-between gap-4"><span className="text-muted-foreground shrink-0">Subject</span><span className="text-right">{log.subject}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Template</span><span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{log.template}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Retries</span><span>{log.retryCount}</span></div>
          {log.sentAt && <div className="flex justify-between"><span className="text-muted-foreground">Sent At</span><span>{new Date(log.sentAt).toLocaleString()}</span></div>}
          {log.failedReason && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3">
              <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Failure Reason</p>
              <p className="text-xs text-red-600 dark:text-red-300">{log.failedReason}</p>
            </div>
          )}
          <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>Created</span><span>{new Date(log.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Email Logs Tab ───────────────────────────────────────────────────────────

function EmailLogsSection() {
  const [filters, setFilters] = useState({ status: '', recipient: '', template: '' });
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const { data: stats } = useQuery<EmailStats>({
    queryKey: ['email-stats'],
    queryFn: () => api.get('/email/logs/stats').then(r => r.data),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['email-logs', filters, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (filters.status) params.set('status', filters.status);
      if (filters.recipient) params.set('recipient', filters.recipient);
      if (filters.template) params.set('template', filters.template);
      return api.get(`/email/logs?${params}`).then(r => r.data);
    },
  });

  const logs: EmailLog[] = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-5">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-foreground' },
            { label: 'Sent', value: stats.sent, color: 'text-green-600' },
            { label: 'Failed', value: stats.failed, color: 'text-red-600' },
            { label: 'Success Rate', value: `${stats.successRate}%`, color: stats.successRate >= 90 ? 'text-green-600' : 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border bg-card p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Filter className="h-3.5 w-3.5" />Filters:</div>
        <select
          className="h-8 rounded-md border bg-background px-2 text-sm"
          value={filters.status}
          onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
          <option value="PENDING">Pending</option>
          <option value="OPENED">Opened</option>
        </select>
        <Input
          placeholder="Filter by recipient…"
          value={filters.recipient}
          onChange={e => { setFilters(f => ({ ...f, recipient: e.target.value })); setPage(1); }}
          className="h-8 w-48 text-sm"
        />
        <Input
          placeholder="Filter by template…"
          value={filters.template}
          onChange={e => { setFilters(f => ({ ...f, template: e.target.value })); setPage(1); }}
          className="h-8 w-44 text-sm"
        />
        <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Recipient</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Template</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sent At</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Retries</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={7} className="py-12 text-center"><Spinner className="mx-auto" /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No email logs found</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-xs font-medium">{log.recipient}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-48 truncate" title={log.subject}>{log.subject}</td>
                  <td className="px-4 py-3"><span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{log.template}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{log.sentAt ? new Date(log.sentAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-xs text-center">{log.retryCount > 0 ? <span className="text-amber-600">{log.retryCount}</span> : '0'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedLog(log)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}

// ─── SMTP Settings Section ────────────────────────────────────────────────────

function SmtpSettingsSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery<EmailSetting>({
    queryKey: ['email-settings'],
    queryFn: () => api.get('/email/settings').then(r => r.data),
  });

  const [form, setForm] = useState<Partial<EmailSetting>>({});
  const [testEmail, setTestEmail] = useState(user?.email ?? '');
  const [testing, setTesting] = useState(false);
  const [triggering, setTriggering] = useState('');

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.put('/email/settings', data).then(r => r.data),
    onSuccess: () => { toast('SMTP settings saved', 'success'); qc.invalidateQueries({ queryKey: ['email-settings'] }); },
    onError: (err: any) => toast(err.response?.data?.error || 'Failed to save', 'error'),
  });

  const merged = { ...settings, ...form };

  const handleTest = async () => {
    setTesting(true);
    try {
      await api.post('/email/test', { to: testEmail });
      toast(`Test email sent to ${testEmail}`, 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Test failed', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleTrigger = async (job: string) => {
    setTriggering(job);
    try {
      const res = await api.post('/email/trigger-jobs', { job });
      toast(res.data.message, 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Job failed', 'error');
    } finally {
      setTriggering('');
    }
  };

  if (isLoading) return <div className="py-12 text-center"><Spinner className="mx-auto" /></div>;

  return (
    <div className="space-y-6">
      {/* SMTP Config */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings2 className="h-4 w-4" />SMTP Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>SMTP Host</Label>
              <Input placeholder="smtp.gmail.com" value={merged.smtpHost ?? ''} onChange={e => setForm(f => ({ ...f, smtpHost: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>SMTP Port</Label>
              <Input type="number" placeholder="587" value={merged.smtpPort ?? ''} onChange={e => setForm(f => ({ ...f, smtpPort: parseInt(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label>SMTP Username</Label>
              <Input placeholder="you@gmail.com" value={merged.smtpUser ?? ''} onChange={e => setForm(f => ({ ...f, smtpUser: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>SMTP Password</Label>
              <Input type="password" placeholder="App password" value={merged.smtpPassword ?? ''} onChange={e => setForm(f => ({ ...f, smtpPassword: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Sender Name</Label>
              <Input placeholder="TransitOps" value={merged.senderName ?? ''} onChange={e => setForm(f => ({ ...f, senderName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Sender Email</Label>
              <Input type="email" placeholder="noreply@transitops.com" value={merged.senderEmail ?? ''} onChange={e => setForm(f => ({ ...f, senderEmail: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Reply-To</Label>
              <Input type="email" placeholder="support@transitops.com" value={merged.replyTo ?? ''} onChange={e => setForm(f => ({ ...f, replyTo: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Max Retries</Label>
              <Input type="number" min={1} max={10} value={merged.maxRetries ?? 3} onChange={e => setForm(f => ({ ...f, maxRetries: parseInt(e.target.value) }))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="smtpSecure"
              checked={merged.smtpSecure ?? true}
              onChange={e => setForm(f => ({ ...f, smtpSecure: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="smtpSecure">Use TLS/SSL</Label>
          </div>
          <Button onClick={() => saveMutation.mutate(merged)} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Spinner /> : 'Save SMTP Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Test Email */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Send className="h-4 w-4" />Send Test Email</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="email" placeholder="test@example.com"
              value={testEmail} onChange={e => setTestEmail(e.target.value)}
              className="max-w-72"
            />
            <Button onClick={handleTest} disabled={testing || !testEmail} variant="outline">
              {testing ? <Spinner /> : <><Send className="h-4 w-4 mr-2" />Send Test</>}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Sends a test email to verify your SMTP configuration is working.</p>
        </CardContent>
      </Card>

      {/* Manual Job Triggers */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Play className="h-4 w-4" />Manual Job Triggers</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Jobs run automatically on schedule. Use these buttons to trigger them manually for testing.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { job: 'license', label: 'License Expiry Check' },
              { job: 'documents', label: 'Vehicle Documents Check' },
              { job: 'cleanup', label: 'Token Cleanup' },
              { job: 'all', label: 'Run All Jobs' },
            ].map(({ job, label }) => (
              <Button
                key={job}
                variant="outline"
                size="sm"
                disabled={!!triggering}
                onClick={() => handleTrigger(job)}
              >
                {triggering === job ? <Spinner /> : <Play className="h-3.5 w-3.5 mr-1.5" />}
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Email Center Tab ────────────────────────────────────────────────────

type EmailTab = 'logs' | 'smtp';

export function EmailCenterTab() {
  const [activeTab, setActiveTab] = useState<EmailTab>('logs');

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b">
        {[
          { key: 'logs' as EmailTab, label: 'Email Logs', icon: Mail },
          { key: 'smtp' as EmailTab, label: 'SMTP Settings', icon: Settings2 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'logs' && <EmailLogsSection />}
      {activeTab === 'smtp' && <SmtpSettingsSection />}
    </div>
  );
}
