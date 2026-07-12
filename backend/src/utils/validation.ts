import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['FLEET_MANAGER', 'DISPATCHER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']).optional(),
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
  permitExpiry: z.string().optional(),
  fitnessExpiry: z.string().optional(),
  region: z.string().optional(),
  currentDriverId: z.string().uuid().optional(),
  currentLocation: z.string().optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RESERVED', 'INACTIVE', 'RETIRED']).optional(),
});

export const vehicleStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RESERVED', 'INACTIVE', 'RETIRED']),
});

export const driverSchema = z.object({
  name: z.string().min(1, 'Driver name is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseCategory: z.string().min(1, 'License category is required'),
  licenseExpiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  medicalExpiryDate: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  policeVerification: z.boolean().optional(),
  contactNumber: z.string().min(1, 'Contact number is required'),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  address: z.string().optional(),
  safetyScore: z.number().min(0).max(10).default(5),
});

export const driverStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'LEAVE', 'SUSPENDED', 'INACTIVE', 'EXPIRED_LICENSE']),
});

export const tripSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  destination: z.string().min(1, 'Destination is required'),
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  cargoWeight: z.number().positive('Cargo weight must be positive'),
  goodsType: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  plannedDistance: z.number().positive('Distance must be positive'),
  estimatedCost: z.number().min(0).optional(),
  estimatedFuel: z.number().min(0).optional(),
  revenue: z.number().min(0).optional(),
});

export const tripCompletionSchema = z.object({
  actualDistance: z.number().positive('Actual distance must be positive'),
  fuelConsumed: z.number().positive('Fuel consumed must be positive'),
  finalOdometer: z.number().positive('Final odometer must be positive'),
  revenue: z.number().min(0).optional(),
  toll: z.number().min(0).optional(),
  expenses: z.number().min(0).optional(),
  remarks: z.string().optional(),
});

export const tripStatusSchema = z.object({
  status: z.enum(['ASSIGNED', 'DISPATCHED', 'REACHED', 'DELIVERED', 'COMPLETED', 'CANCELLED']),
  actualDistance: z.number().positive().optional(),
  fuelConsumed: z.number().positive().optional(),
  finalOdometer: z.number().positive().optional(),
  revenue: z.number().min(0).optional(),
  toll: z.number().min(0).optional(),
  expenses: z.number().min(0).optional(),
  remarks: z.string().optional(),
});

export const maintenanceSchema = z.object({
  vehicleId: z.string().uuid(),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['Oil', 'Oil Change', 'Brake', 'Engine', 'Tyre', 'Battery', 'AC', 'Insurance', 'Fitness', 'General Service', 'Repair', 'Electrical', 'Transmission', 'Suspension', 'Inspection', 'Other']),
  cost: z.number().min(0).default(0),
  actualCost: z.number().min(0).optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  expectedCompletion: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  vendor: z.string().optional(),
});

export const fuelLogSchema = z.object({
  vehicleId: z.string().uuid(),
  liters: z.number().positive(),
  cost: z.number().positive(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  mileage: z.number().positive().optional(),
  driverId: z.string().uuid().optional(),
  tripId: z.string().uuid().optional(),
});

export const expenseSchema = z.object({
  vehicleId: z.string().uuid(),
  type: z.enum(['FUEL', 'REPAIR', 'TOLL', 'SALARY', 'INSURANCE', 'FINE', 'PARKING', 'OTHER']),
  amount: z.number().positive(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  description: z.string().optional(),
  category: z.string().optional(),
  receiptUrl: z.string().optional(),
  tripId: z.string().uuid().optional(),
});
