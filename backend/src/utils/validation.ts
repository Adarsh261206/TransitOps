import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']).optional(),
});

export const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  name: z.string().min(1, 'Vehicle name is required'),
  type: z.string().min(1, 'Type is required'),
  maxLoadCapacity: z.number().positive('Max load must be positive'),
  odometer: z.number().min(0).default(0),
  acquisitionCost: z.number().min(0).default(0),
  acquisitionDate: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  fuelType: z.string().optional(),
  owner: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  pucExpiry: z.string().optional(),
  region: z.string().optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional(),
});

export const driverSchema = z.object({
  name: z.string().min(1, 'Driver name is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseCategory: z.string().min(1, 'License category is required'),
  licenseExpiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  safetyScore: z.number().min(0).max(10).default(5),
});

export const tripSchema = z.object({
  source: z.string().min(1),
  destination: z.string().min(1),
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  cargoWeight: z.number().positive(),
  goodsType: z.string().optional(),
  priority: z.string().optional(),
  plannedDistance: z.number().positive(),
  estimatedCost: z.number().min(0).optional(),
  estimatedFuel: z.number().min(0).optional(),
  revenue: z.number().min(0).optional(),
});

export const tripCompletionSchema = z.object({
  actualDistance: z.number().positive(),
  fuelConsumed: z.number().positive(),
  finalOdometer: z.number().positive(),
  revenue: z.number().min(0).optional(),
  toll: z.number().min(0).optional(),
  remarks: z.string().optional(),
});

export const maintenanceSchema = z.object({
  vehicleId: z.string().uuid(),
  description: z.string().min(1),
  type: z.string().min(1),
  cost: z.number().min(0).default(0),
  actualCost: z.number().min(0).optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  expectedCompletion: z.string().optional(),
  priority: z.string().optional(),
  vendor: z.string().optional(),
});

export const fuelLogSchema = z.object({
  vehicleId: z.string().uuid(),
  liters: z.number().positive(),
  cost: z.number().positive(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
});

export const expenseSchema = z.object({
  vehicleId: z.string().uuid(),
  type: z.enum(['TOLL', 'MAINTENANCE', 'FUEL', 'OTHER']),
  amount: z.number().positive(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  description: z.string().optional(),
});
