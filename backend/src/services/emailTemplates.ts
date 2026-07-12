// ─── Email HTML Templates ─────────────────────────────────────────────────────
// All templates share a base layout for consistent branding.

const APP_URL = process.env.APP_URL ?? 'http://localhost:5174';

// ─── Base Layout ──────────────────────────────────────────────────────────────

function baseLayout(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <title>TransitOps</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; color: #1e293b; }
    .wrapper { width: 100%; background: #f1f5f9; padding: 40px 16px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 36px 40px; text-align: center; }
    .logo-text { color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .logo-dot { color: #93c5fd; }
    .tagline { color: #bfdbfe; font-size: 12px; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
    .body { padding: 40px; }
    .greeting { font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 12px; }
    .text { font-size: 15px; color: #475569; line-height: 1.7; margin-bottom: 16px; }
    .btn-wrap { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #1e40af, #3b82f6); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.2px; }
    .btn:hover { background: linear-gradient(135deg, #1e3a8a, #2563eb); }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
    .fallback-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .fallback-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .fallback-url { font-size: 12px; color: #3b82f6; word-break: break-all; }
    .expiry-badge { display: inline-block; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; border-radius: 6px; padding: 4px 12px; font-size: 13px; font-weight: 500; margin: 12px 0; }
    .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 20px 0; }
    .info-box p { font-size: 13px; color: #1e40af; line-height: 1.6; }
    .warning-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 20px 0; }
    .warning-box p { font-size: 13px; color: #9a3412; line-height: 1.6; }
    .danger-box { background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 20px 0; }
    .danger-box p { font-size: 13px; color: #991b1b; line-height: 1.6; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 28px 40px; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; line-height: 1.8; }
    .footer a { color: #64748b; text-decoration: none; }
    .footer a:hover { color: #3b82f6; }
    @media (max-width: 600px) {
      .body { padding: 28px 24px; }
      .header { padding: 28px 24px; }
      .footer { padding: 20px 24px; }
    }
    @media (prefers-color-scheme: dark) {
      body { background: #0f172a !important; color: #e2e8f0 !important; }
      .wrapper { background: #0f172a !important; }
      .container { background: #1e293b !important; box-shadow: 0 4px 24px rgba(0,0,0,0.4) !important; }
      .greeting { color: #f1f5f9 !important; }
      .text { color: #94a3b8 !important; }
      .fallback-box { background: #0f172a !important; border-color: #334155 !important; }
      .footer { background: #0f172a !important; border-color: #334155 !important; }
      .footer p { color: #475569 !important; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ''}
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-text">Transit<span class="logo-dot">Ops</span></div>
        <div class="tagline">Smart Transport Operations Platform</div>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        <p>
          © ${new Date().getFullYear()} TransitOps · Smart Transport Operations Platform<br />
          <a href="mailto:support@transitops.com">support@transitops.com</a> · 
          <a href="${APP_URL}">transitops.com</a>
        </p>
        <p style="margin-top:10px;">
          If you didn't request this email, you can safely ignore it.<br />
          This is an automated message — please do not reply directly.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── 1. Email Verification ────────────────────────────────────────────────────

export function emailVerificationTemplate(name: string, token: string): string {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
  const content = `
    <p class="greeting">Hi ${name},</p>
    <p class="text">Welcome to TransitOps. You're one step away from activating your account.</p>
    <p class="text">Click the button below to verify your email address and get started.</p>
    <div class="btn-wrap">
      <a href="${verifyUrl}" class="btn">Verify Email Address</a>
    </div>
    <div class="expiry-badge">⏱ This link expires in 24 hours</div>
    <hr class="divider" />
    <p class="text" style="font-size:13px;">If the button doesn't work, copy and paste this URL into your browser:</p>
    <div class="fallback-box">
      <p class="fallback-label">Verification URL</p>
      <p class="fallback-url">${verifyUrl}</p>
    </div>
    <div class="info-box">
      <p>For security, this link is single-use and expires in 24 hours. If you didn't create a TransitOps account, you can safely ignore this email.</p>
    </div>
  `;
  return baseLayout(content, 'Verify your email to activate your TransitOps account.');
}

// ─── 2. Password Reset ────────────────────────────────────────────────────────

export function passwordResetTemplate(name: string, token: string): string {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const content = `
    <p class="greeting">Hi ${name},</p>
    <p class="text">We received a request to reset the password for your TransitOps account.</p>
    <div class="btn-wrap">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <div class="expiry-badge">⏱ This link expires in 15 minutes</div>
    <hr class="divider" />
    <p class="text" style="font-size:13px;">Or copy and paste this URL into your browser:</p>
    <div class="fallback-box">
      <p class="fallback-label">Reset URL</p>
      <p class="fallback-url">${resetUrl}</p>
    </div>
    <div class="warning-box">
      <p>This link is single-use and expires in 15 minutes. If you didn't request a password reset, your account is safe — no changes have been made.</p>
    </div>
  `;
  return baseLayout(content, 'Reset your TransitOps password — link expires in 15 minutes.');
}

// ─── 3. Welcome (Post-Verification) ──────────────────────────────────────────

export function welcomeTemplate(name: string, role: string): string {
  const roleLabel = role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const content = `
    <p class="greeting">Welcome aboard, ${name}!</p>
    <p class="text">Your TransitOps account has been verified and activated. You're all set to get started.</p>
    <p class="text"><strong>Your role:</strong> ${roleLabel}</p>
    <div class="btn-wrap">
      <a href="${APP_URL}/login" class="btn">Go to Dashboard</a>
    </div>
    <div class="info-box">
      <p>If you ever run into issues, reach out to us at <a href="mailto:support@transitops.com">support@transitops.com</a> — we're happy to help.</p>
    </div>
  `;
  return baseLayout(content, 'Your TransitOps account is now active.');
}

// ─── 4. Account Status Change ─────────────────────────────────────────────────

export function accountStatusTemplate(name: string, status: 'DISABLED' | 'SUSPENDED' | 'ACTIVE', reason?: string): string {
  const messages = {
    DISABLED: { title: 'Account Disabled', body: 'Your TransitOps account has been disabled by an administrator.', box: 'danger' },
    SUSPENDED: { title: 'Account Suspended', body: 'Your TransitOps account has been temporarily suspended.', box: 'warning' },
    ACTIVE: { title: 'Account Reactivated', body: 'Your TransitOps account has been reactivated. You can now log in.', box: 'info' },
  };
  const msg = messages[status];
  const boxClass = msg.box === 'danger' ? 'danger-box' : msg.box === 'warning' ? 'warning-box' : 'info-box';
  const content = `
    <p class="greeting">Hi ${name},</p>
    <p class="text">${msg.body}</p>
    ${reason ? `<div class="${boxClass}"><p><strong>Reason:</strong> ${reason}</p></div>` : ''}
    ${status === 'ACTIVE' ? `<div class="btn-wrap"><a href="${APP_URL}/login" class="btn">Log In Now</a></div>` : ''}
    <p class="text" style="font-size:13px;">If you have questions, contact <a href="mailto:support@transitops.com" style="color:#3b82f6;">support@transitops.com</a>.</p>
  `;
  return baseLayout(content, `TransitOps account ${msg.title.toLowerCase()}.`);
}

// ─── 5. License Expiry Reminder ───────────────────────────────────────────────

export type ExpiryUrgency = 30 | 15 | 7 | 3 | 1 | 0;

export function licenseReminderTemplate(opts: {
  recipientName: string;
  driverName: string;
  licenseNumber: string;
  expiryDate: string;
  daysLeft: ExpiryUrgency;
  driverLink: string;
}): string {
  const expired = opts.daysLeft === 0;
  const urgencyColor = expired ? '#ef4444' : opts.daysLeft <= 3 ? '#f97316' : opts.daysLeft <= 7 ? '#eab308' : '#3b82f6';
  const urgencyBg = expired ? '#fef2f2' : opts.daysLeft <= 3 ? '#fff7ed' : opts.daysLeft <= 7 ? '#fefce8' : '#eff6ff';
  const urgencyBorder = expired ? '#fecaca' : opts.daysLeft <= 3 ? '#fed7aa' : opts.daysLeft <= 7 ? '#fde68a' : '#bfdbfe';
  const subject = expired
    ? `⚠️ License Expired — ${opts.driverName}`
    : `⏰ License Expiring in ${opts.daysLeft} Day${opts.daysLeft > 1 ? 's' : ''} — ${opts.driverName}`;

  const content = `
    <p class="greeting">Hi ${opts.recipientName},</p>
    <p class="text">This is an automated compliance reminder regarding driver license expiry.</p>
    <div style="background:${urgencyBg};border:1px solid ${urgencyBorder};border-radius:10px;padding:20px;margin:20px 0;">
      <p style="font-size:13px;font-weight:600;color:${urgencyColor};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">
        ${expired ? '🚨 License Expired' : `⏰ Expiring in ${opts.daysLeft} Day${opts.daysLeft > 1 ? 's' : ''}`}
      </p>
      <table style="width:100%;font-size:14px;color:#374151;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#6b7280;">Driver</td><td style="padding:4px 0;font-weight:600;">${opts.driverName}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">License No.</td><td style="padding:4px 0;font-weight:600;">${opts.licenseNumber}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Expiry Date</td><td style="padding:4px 0;font-weight:600;color:${urgencyColor};">${opts.expiryDate}</td></tr>
      </table>
    </div>
    ${expired
      ? `<div class="danger-box"><p>This driver's license has expired. They have been automatically marked as <strong>License Expired</strong> and cannot be assigned to new trips until the license is renewed.</p></div>`
      : `<div class="${opts.daysLeft <= 7 ? 'warning-box' : 'info-box'}"><p>Please ensure the license renewal is initiated promptly to avoid operational disruption. Expired-license drivers are automatically blocked from new trip assignments.</p></div>`
    }
    <div class="btn-wrap">
      <a href="${opts.driverLink}" class="btn">View Driver Profile</a>
    </div>
  `;
  return baseLayout(content, subject);
}

// ─── 6. Vehicle Document Reminder ─────────────────────────────────────────────

export function vehicleDocumentReminderTemplate(opts: {
  recipientName: string;
  vehicleName: string;
  registrationNumber: string;
  documentType: string;
  expiryDate: string;
  daysLeft: ExpiryUrgency;
  vehicleLink: string;
}): string {
  const expired = opts.daysLeft === 0;
  const urgencyColor = expired ? '#ef4444' : opts.daysLeft <= 3 ? '#f97316' : opts.daysLeft <= 7 ? '#eab308' : '#3b82f6';
  const urgencyBg = expired ? '#fef2f2' : opts.daysLeft <= 3 ? '#fff7ed' : opts.daysLeft <= 7 ? '#fefce8' : '#eff6ff';
  const urgencyBorder = expired ? '#fecaca' : opts.daysLeft <= 3 ? '#fed7aa' : opts.daysLeft <= 7 ? '#fde68a' : '#bfdbfe';

  const content = `
    <p class="greeting">Hi ${opts.recipientName},</p>
    <p class="text">This is an automated vehicle compliance reminder for your fleet.</p>
    <div style="background:${urgencyBg};border:1px solid ${urgencyBorder};border-radius:10px;padding:20px;margin:20px 0;">
      <p style="font-size:13px;font-weight:600;color:${urgencyColor};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">
        ${expired ? `🚨 ${opts.documentType} Expired` : `⏰ ${opts.documentType} Expiring in ${opts.daysLeft} Day${opts.daysLeft > 1 ? 's' : ''}`}
      </p>
      <table style="width:100%;font-size:14px;color:#374151;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#6b7280;">Vehicle</td><td style="padding:4px 0;font-weight:600;">${opts.vehicleName}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Reg. Number</td><td style="padding:4px 0;font-weight:600;">${opts.registrationNumber}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Document</td><td style="padding:4px 0;font-weight:600;">${opts.documentType}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Expiry Date</td><td style="padding:4px 0;font-weight:600;color:${urgencyColor};">${opts.expiryDate}</td></tr>
      </table>
    </div>
    <div class="${expired ? 'danger-box' : opts.daysLeft <= 7 ? 'warning-box' : 'info-box'}">
      <p>${expired
        ? `The ${opts.documentType} for this vehicle has expired. Immediate renewal is required for regulatory compliance.`
        : `Please initiate the renewal process to ensure continued compliance and uninterrupted fleet operations.`
      }</p>
    </div>
    <div class="btn-wrap">
      <a href="${opts.vehicleLink}" class="btn">View Vehicle</a>
    </div>
  `;
  return baseLayout(content, expired ? `🚨 ${opts.documentType} expired — ${opts.vehicleName}` : `⏰ ${opts.documentType} expiring — ${opts.vehicleName}`);
}

// ─── 7. Trip Notification ─────────────────────────────────────────────────────

export type TripEmailEvent = 'ASSIGNED' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export function tripNotificationTemplate(opts: {
  recipientName: string;
  event: TripEmailEvent;
  tripId: string;
  source: string;
  destination: string;
  driverName: string;
  vehicleName: string;
  vehicleReg: string;
  dispatchedBy?: string;
  remarks?: string;
}): string {
  const configs: Record<TripEmailEvent, { emoji: string; title: string; color: string; bg: string; border: string; msg: string }> = {
    ASSIGNED:   { emoji: '📋', title: 'Trip Assigned',    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', msg: 'A new trip has been assigned and is ready for dispatch.' },
    DISPATCHED: { emoji: '🚛', title: 'Trip Dispatched',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', msg: 'The vehicle has been dispatched and is en route.' },
    COMPLETED:  { emoji: '✅', title: 'Trip Completed',   color: '#15803d', bg: '#f0fdf4', border: '#86efac', msg: 'The trip has been successfully completed.' },
    CANCELLED:  { emoji: '❌', title: 'Trip Cancelled',   color: '#dc2626', bg: '#fef2f2', border: '#fecaca', msg: 'This trip has been cancelled.' },
  };
  const cfg = configs[opts.event];
  const tripLink = `${APP_URL}/trips/${opts.tripId}`;

  const content = `
    <p class="greeting">Hi ${opts.recipientName},</p>
    <p class="text">${cfg.msg}</p>
    <div style="background:${cfg.bg};border:1px solid ${cfg.border};border-radius:10px;padding:20px;margin:20px 0;">
      <p style="font-size:13px;font-weight:700;color:${cfg.color};margin-bottom:14px;">${cfg.emoji} ${cfg.title}</p>
      <table style="width:100%;font-size:14px;color:#374151;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#6b7280;width:130px;">Route</td><td style="padding:4px 0;font-weight:600;">${opts.source} → ${opts.destination}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Driver</td><td style="padding:4px 0;">${opts.driverName}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Vehicle</td><td style="padding:4px 0;">${opts.vehicleName} · ${opts.vehicleReg}</td></tr>
        ${opts.dispatchedBy ? `<tr><td style="padding:4px 0;color:#6b7280;">${opts.event === 'CANCELLED' ? 'Cancelled By' : 'Dispatched By'}</td><td style="padding:4px 0;">${opts.dispatchedBy}</td></tr>` : ''}
        ${opts.remarks ? `<tr><td style="padding:4px 0;color:#6b7280;">Remarks</td><td style="padding:4px 0;font-style:italic;">${opts.remarks}</td></tr>` : ''}
      </table>
    </div>
    <div class="btn-wrap">
      <a href="${tripLink}" class="btn">View Trip Details</a>
    </div>
  `;
  return baseLayout(content, `${cfg.emoji} ${cfg.title} — ${opts.source} to ${opts.destination}`);
}

// ─── 8. User Management ───────────────────────────────────────────────────────

export type UserMgmtEvent = 'ACCOUNT_CREATED' | 'PASSWORD_CHANGED' | 'ROLE_CHANGED' | 'ACCOUNT_DISABLED' | 'ACCOUNT_ENABLED';

export function userManagementTemplate(opts: {
  recipientName: string;
  event: UserMgmtEvent;
  email?: string;
  newRole?: string;
  tempPassword?: string;
  reason?: string;
}): string {
  const roleLabel = opts.newRole?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? '';

  const configs: Record<UserMgmtEvent, { title: string; body: string; boxType: string }> = {
    ACCOUNT_CREATED:  { title: 'Welcome to TransitOps',     body: `Your account has been created by an administrator. Your login email is <strong>${opts.email}</strong>.`, boxType: 'info' },
    PASSWORD_CHANGED: { title: 'Password Changed',           body: 'Your TransitOps account password has been changed successfully.', boxType: 'info' },
    ROLE_CHANGED:     { title: 'Role Updated',               body: `Your role has been updated to <strong>${roleLabel}</strong>. Your access permissions have changed accordingly.`, boxType: 'info' },
    ACCOUNT_DISABLED: { title: 'Account Disabled',           body: 'Your TransitOps account has been disabled by an administrator.', boxType: 'danger' },
    ACCOUNT_ENABLED:  { title: 'Account Reactivated',        body: 'Your TransitOps account has been reactivated. You can now log in.', boxType: 'info' },
  };

  const cfg = configs[opts.event];
  const boxClass = cfg.boxType === 'danger' ? 'danger-box' : 'info-box';

  const content = `
    <p class="greeting">Hi ${opts.recipientName},</p>
    <div class="${boxClass}">
      <p><strong>${cfg.title}</strong></p>
      <p style="margin-top:6px;">${cfg.body}</p>
      ${opts.tempPassword ? `<p style="margin-top:8px;">Temporary password: <code style="background:#e0e7ff;padding:2px 6px;border-radius:4px;font-size:13px;">${opts.tempPassword}</code><br/><small>Please change it after your first login.</small></p>` : ''}
      ${opts.reason ? `<p style="margin-top:8px;"><strong>Reason:</strong> ${opts.reason}</p>` : ''}
    </div>
    ${['ACCOUNT_CREATED', 'ACCOUNT_ENABLED', 'ROLE_CHANGED'].includes(opts.event)
      ? `<div class="btn-wrap"><a href="${APP_URL}/login" class="btn">Sign In to TransitOps</a></div>`
      : ''
    }
    <p class="text" style="font-size:13px;">Questions? Contact <a href="mailto:support@transitops.com" style="color:#3b82f6;">support@transitops.com</a></p>
  `;
  return baseLayout(content, `TransitOps — ${cfg.title}`);
}
