import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getComplianceSummary(req: AuthRequest, res: Response) {
  try {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [drivers, vehicles] = await Promise.all([
      prisma.driver.findMany({
        select: {
          id: true, name: true, licenseNumber: true, licenseCategory: true,
          licenseExpiryDate: true, medicalExpiryDate: true, status: true,
        },
      }),
      prisma.vehicle.findMany({
        select: {
          id: true, name: true, registrationNumber: true,
          insuranceExpiry: true, pucExpiry: true, permitExpiry: true, fitnessExpiry: true, status: true,
        },
      }),
    ]);

    const expiredLicenses = drivers.filter(d => d.licenseExpiryDate < now).map(d => ({
      id: d.id, name: d.name, type: 'License', item: d.licenseNumber, expiryDate: d.licenseExpiryDate, severity: 'CRITICAL',
    }));

    const expiringLicenses = drivers.filter(d => d.licenseExpiryDate >= now && d.licenseExpiryDate <= thirtyDays).map(d => ({
      id: d.id, name: d.name, type: 'License', item: d.licenseNumber, expiryDate: d.licenseExpiryDate, severity: 'WARNING',
    }));

    const expiredMedical = drivers.filter(d => d.medicalExpiryDate && d.medicalExpiryDate < now).map(d => ({
      id: d.id, name: d.name, type: 'Medical', item: d.medicalExpiryDate ? d.medicalExpiryDate.toLocaleDateString() : '', expiryDate: d.medicalExpiryDate!, severity: 'HIGH',
    }));

    const vehicleCompliance: any[] = [];
    vehicles.forEach(v => {
      if (v.insuranceExpiry && v.insuranceExpiry < now) vehicleCompliance.push({ id: v.id, name: v.name, type: 'Insurance', item: v.registrationNumber, expiryDate: v.insuranceExpiry, severity: 'CRITICAL' });
      if (v.pucExpiry && v.pucExpiry < now) vehicleCompliance.push({ id: v.id, name: v.name, type: 'PUC', item: v.registrationNumber, expiryDate: v.pucExpiry, severity: 'CRITICAL' });
      if (v.fitnessExpiry && v.fitnessExpiry < now) vehicleCompliance.push({ id: v.id, name: v.name, type: 'Fitness', item: v.registrationNumber, expiryDate: v.fitnessExpiry, severity: 'CRITICAL' });
      if (v.permitExpiry && v.permitExpiry < now) vehicleCompliance.push({ id: v.id, name: v.name, type: 'Permit', item: v.registrationNumber, expiryDate: v.permitExpiry, severity: 'HIGH' });
      if (v.insuranceExpiry && v.insuranceExpiry > now && v.insuranceExpiry <= thirtyDays) vehicleCompliance.push({ id: v.id, name: v.name, type: 'Insurance (Expiring)', item: v.registrationNumber, expiryDate: v.insuranceExpiry, severity: 'WARNING' });
      if (v.pucExpiry && v.pucExpiry > now && v.pucExpiry <= thirtyDays) vehicleCompliance.push({ id: v.id, name: v.name, type: 'PUC (Expiring)', item: v.registrationNumber, expiryDate: v.pucExpiry, severity: 'WARNING' });
    });

    const allIssues = [...expiredLicenses, ...expiringLicenses, ...expiredMedical, ...vehicleCompliance];
    const sorted = allIssues.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    const stats = {
      totalDrivers: drivers.length,
      totalVehicles: vehicles.length,
      expiredLicenses: expiredLicenses.length,
      expiringLicenses: expiringLicenses.length,
      expiredMedical: expiredMedical.length,
      vehicleComplianceIssues: vehicleCompliance.length,
      totalIssues: sorted.length,
      drivers, vehicles,
    };

    res.json({ stats, issues: sorted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
