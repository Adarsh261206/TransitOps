import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Truck, CheckCircle, XCircle, Clock, Mail } from 'lucide-react';
import api from '@/services/api';

type State = 'loading' | 'success' | 'expired' | 'used' | 'invalid' | 'error';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<State>('loading');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setState('invalid'); return; }

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setState('success'))
      .catch((err) => {
        const code = err.response?.data?.code;
        const emailFromApi = err.response?.data?.email ?? '';
        setEmail(emailFromApi);
        if (code === 'TOKEN_EXPIRED') setState('expired');
        else if (err.response?.data?.error?.includes('already been used')) setState('used');
        else if (err.response?.data?.error?.includes('Invalid')) setState('invalid');
        else setState('error');
      });
  }, [searchParams]);

  const handleResend = async () => {
    setResending(true);
    setResendError('');
    try {
      await api.post('/auth/resend-verification', { email });
      setResent(true);
    } catch (err: any) {
      setResendError(err.response?.data?.error || 'Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const screens: Record<State, React.ReactNode> = {
    loading: (
      <div className="text-center space-y-4">
        <Spinner className="mx-auto h-10 w-10" />
        <p className="text-muted-foreground">Verifying your email…</p>
      </div>
    ),
    success: (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Email Verified</h2>
          <p className="text-muted-foreground mt-1">Your account is now active. You're all set.</p>
        </div>
        <Link to="/login">
          <Button className="w-full">Sign In to TransitOps</Button>
        </Link>
      </div>
    ),
    expired: (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
          <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Link Expired</h2>
          <p className="text-muted-foreground mt-1">This verification link expired after 24 hours.</p>
        </div>
        {resent ? (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            New verification email sent — check your inbox
          </div>
        ) : (
          <>
            {email && (
              <Button onClick={handleResend} disabled={resending} className="w-full">
                {resending ? <Spinner /> : <><Mail className="h-4 w-4 mr-2" />Send New Verification Email</>}
              </Button>
            )}
            {!email && (
              <p className="text-sm text-muted-foreground">
                Go to <Link to="/login" className="text-primary hover:underline">login</Link> and use the "Resend verification" option.
              </p>
            )}
          </>
        )}
        {resendError && <p className="text-sm text-red-600 dark:text-red-400">{resendError}</p>}
      </div>
    ),
    used: (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
          <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Already Verified</h2>
          <p className="text-muted-foreground mt-1">This link has already been used. Your account is active.</p>
        </div>
        <Link to="/login"><Button className="w-full">Sign In</Button></Link>
      </div>
    ),
    invalid: (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
          <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Invalid Link</h2>
          <p className="text-muted-foreground mt-1">This verification link is invalid or has been tampered with.</p>
        </div>
        <Link to="/login"><Button variant="outline" className="w-full">Back to Sign In</Button></Link>
      </div>
    ),
    error: (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
          <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground mt-1">We couldn't verify your email. Please try again later.</p>
        </div>
        <Link to="/login"><Button variant="outline" className="w-full">Back to Sign In</Button></Link>
      </div>
    ),
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold">TransitOps</p>
            <p className="text-xs text-muted-foreground">Email Verification</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          {screens[state]}
        </div>
      </div>
    </div>
  );
}
