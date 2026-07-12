import cron from 'node-cron';
import { prisma } from '../index.js';
import { sendEmail } from '../services/email.js';
import { licenseReminderTemplate, vehicleDocumentReminderTemplate, type ExpiryUrgency } from '../services/emailTemplates.js';

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';
const REMINDER_DAYS: ExpiryUrgency[] = [30, 15, 7, 3, 1, 0];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Check if we already sent a reminder for this entity+days combination today
async function alreadySentToday(key: string): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const count = await prisma.emailLog.count({
    where: {
      template: key,
      status: 'SENT',
      sentAt: { gte: startOfDay },
    },
  });
  return count > 0;
}

// Get fleet managers and safety officers emails
async function getFleetManagers(): Promise<{ name: string; email: string }[]> {
  return prisma.user.findMany({
    where: {
      role: { in: ['FLEET_MANAGER', 'SAFETY_OFFICER'] },
      isVerified: true,
      status: 'ACTIVE',
    },
    select: { name: true, email: true },
  });
}

// ─── Job 1: License Expiry Reminders ─────────────────────────────────────────

async function runLicenseExpiryJob() {
  console.log('[Scheduler] Running license expiry check…');

  const drivers = await prisma.driver.findMany({
    where: { status: { notIn: ['INACTIVE'] } },
    select: { id: true, name: true, licenseNumber: true, licenseExpiryDate: true, status: true },
  });

  const managers = await getFleetManagers();

  for (const driver of drivers) {
    const days = daysUntil(driver.licenseExpiryDate);

    // Auto-expire driver if license is expired and status not already set
    if (days < 0 && driver.status !== 'EXPIRED_LICENSE' && driver.status !== 'ON_TRIP' && driver.status !== 'SUSPENDED') {
      await prisma.driver.update({ where: { id: driver.id }, data: { status: 'EXPIRED_LICENSE' } });
      console.log(`[Scheduler] Auto-expired driver: ${driver.name}`);
    }

    // Only send on exact reminder day thresholds
    const threshold = REMINDER_DAYS.find(d => d === days);
    if (threshold === undefined) continue;

    const templateKey = `license_reminder_${driver.id}_${days}d`;
    if (await alreadySentToday(templateKey)) continue;

    const driverLink = `${APP_URL}/drivers/${driver.id}`;
    const expiryDateStr = formatDate(driver.licenseExpiryDate);

    // Notify each fleet manager / safety officer
    for (const manager of managers) {
      await sendEmail({
        to: manager.email,
        subject: days === 0
          ? `🚨 Driver License Expired — ${driver.name}`
          : `⏰ Driver License Expiring in ${days} Day${days > 1 ? 's' : ''} — ${driver.name}`,
        html: licenseReminderTemplate({
          recipientName: manager.name,
          driverName: driver.name,
          licenseNumber: driver.licenseNumber,
          expiryDate: expiryDateStr,
          daysLeft: threshold,
          driverLink,
        }),
        template: templateKey,
        metadata: { driverId: driver.id, days },
      });
    }

    console.log(`[Scheduler] License reminder sent for ${driver.name} (${days} days)`);
  }
}

// ─── Job 2: Vehicle Document Reminders ───────────────────────────────────────

const VEHICLE_DOCS: { field: keyof typeof VEHICLE_DOC_LABELS; label: string }[] = [
  { field: 'insuranceExpiry', label: 'Insurance' },
  { field: 'pucExpiry', label: 'Pollution Certificate (PUC)' },
  { field: 'permitExpiry', label: 'Permit' },
  { field: 'fitnessExpiry', label: 'Fitness Certificate' },
];

const VEHICLE_DOC_LABELS = {
  insuranceExpiry: 'Insurance',
  pucExpiry: 'Pollution Certificate (PUC)',
  permitExpiry: 'Permit',
  fitnessExpiry: 'Fitness Certificate',
};

async function runVehicleDocumentJob() {
  console.log('[Scheduler] Running vehicle document expiry check…');

  const vehicles = await prisma.vehicle.findMany({
    where: { status: { notIn: ['RETIRED', 'INACTIVE'] } },
    select: {
      id: true, name: true, registrationNumber: true,
      insuranceExpiry: true, pucExpiry: true, permitExpiry: true, fitnessExpiry: true,
    },
  });

  const managers = await getFleetManagers();

  for (const vehicle of vehicles) {
    for (const doc of VEHICLE_DOCS) {
      const expiryDate = vehicle[doc.field] as Date | null;
      if (!expiryDate) continue;

      const days = daysUntil(expiryDate);
      const threshold = REMINDER_DAYS.find(d => d === days);
      if (threshold === undefined) continue;

      const templateKey = `vehicle_doc_${vehicle.id}_${doc.field}_${days}d`;
      if (await alreadySentToday(templateKey)) continue;

      const vehicleLink = `${APP_URL}/vehicles/${vehicle.id}`;
      const expiryDateStr = formatDate(expiryDate);

      for (const manager of managers) {
        await sendEmail({
          to: manager.email,
          subject: days === 0
            ? `🚨 ${doc.label} Expired — ${vehicle.name} (${vehicle.registrationNumber})`
            : `⏰ ${doc.label} Expiring in ${days} Day${days > 1 ? 's' : ''} — ${vehicle.name}`,
          html: vehicleDocumentReminderTemplate({
            recipientName: manager.name,
            vehicleName: vehicle.name,
            registrationNumber: vehicle.registrationNumber,
            documentType: doc.label,
            expiryDate: expiryDateStr,
            daysLeft: threshold,
            vehicleLink,
          }),
          template: templateKey,
          metadata: { vehicleId: vehicle.id, document: doc.field, days },
        });
      }

      console.log(`[Scheduler] Vehicle doc reminder sent: ${vehicle.name} / ${doc.label} (${days} days)`);
    }
  }
}

// ─── Job 3: Token Cleanup ─────────────────────────────────────────────────────

async function runTokenCleanup() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  const [evTokens, prTokens] = await Promise.all([
    prisma.emailVerificationToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: cutoff } }, { usedAt: { lt: cutoff } }] },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: cutoff } }, { usedAt: { lt: cutoff } }] },
    }),
  ]);

  console.log(`[Scheduler] Token cleanup: removed ${evTokens.count} verification, ${prTokens.count} reset tokens`);
}

// ─── Job 4: Retry Failed Emails ───────────────────────────────────────────────

async function runEmailRetry() {
  // Pick failed logs that haven't hit max retries
  const failed = await prisma.emailLog.findMany({
    where: {
      status: 'FAILED',
      retryCount: { lt: 3 },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // only retry emails from last 24h
    },
    take: 20,
  });

  if (failed.length === 0) return;
  console.log(`[Scheduler] Retrying ${failed.length} failed email(s)…`);

  // Reset to PENDING so email service picks them up fresh
  await prisma.emailLog.updateMany({
    where: { id: { in: failed.map(f => f.id) } },
    data: { status: 'PENDING', retryCount: { increment: 1 } },
  });
}

// ─── Scheduler Bootstrap ─────────────────────────────────────────────────────

export function startScheduler() {
  // License & vehicle doc reminders — every day at 7:00 AM
  cron.schedule('0 7 * * *', async () => {
    try { await runLicenseExpiryJob(); } catch (e) { console.error('[Scheduler] License job error:', e); }
    try { await runVehicleDocumentJob(); } catch (e) { console.error('[Scheduler] Vehicle doc job error:', e); }
  });

  // Token cleanup — every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try { await runTokenCleanup(); } catch (e) { console.error('[Scheduler] Token cleanup error:', e); }
  });

  // Retry failed emails — every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try { await runEmailRetry(); } catch (e) { console.error('[Scheduler] Email retry error:', e); }
  });

  console.log('[Scheduler] Background jobs started');
}

// Expose individual jobs for manual triggers (admin)
export { runLicenseExpiryJob, runVehicleDocumentJob, runTokenCleanup };
