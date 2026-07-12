export interface User {
  id: string;
  email: string;
  name: string;
  role: 'FLEET_MANAGER' | 'DISPATCHER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';
  isVerified?: boolean;
  status?: 'ACTIVE' | 'DISABLED' | 'SUSPENDED';
  createdAt?: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  acquisitionDate?: string;
  manufacturer?: string;
  model?: string;
  fuelType?: string;
  owner?: string;
  insuranceExpiry?: string;
  pucExpiry?: string;
  permitExpiry?: string;
  fitnessExpiry?: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RESERVED' | 'INACTIVE' | 'RETIRED';
  region: string | null;
  currentDriverId?: string;
  currentTripId?: string;
  currentLocation?: string;
  lastFuelDate?: string;
  lastMaintenanceDate?: string;
  fuelAverage?: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  trips?: Trip[];
  maintenanceLogs?: MaintenanceLog[];
  fuelLogs?: FuelLog[];
  expenses?: Expense[];
  documents?: VehicleDocument[];
  auditLogs?: AuditLog[];
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  medicalExpiryDate?: string;
  insuranceExpiry?: string;
  policeVerification?: boolean;
  contactNumber: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  safetyScore: number;
  totalTrips?: number;
  totalDistance?: number;
  averageRating?: number;
  violations?: number;
  fuelEfficiency?: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'LEAVE' | 'SUSPENDED' | 'INACTIVE' | 'EXPIRED_LICENSE';
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  trips?: Trip[];
  auditLogs?: AuditLog[];
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  cargoWeight: number;
  goodsType?: string;
  priority?: string;
  plannedDistance: number;
  estimatedCost?: number;
  estimatedFuel?: number;
  actualDistance: number | null;
  fuelConsumed: number | null;
  finalOdometer: number | null;
  revenue: number | null;
  toll?: number | null;
  expenses?: number | null;
  remarks?: string | null;
  status: 'DRAFT' | 'ASSIGNED' | 'DISPATCHED' | 'REACHED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  vehicleId: string;
  vehicle?: { id: string; name: string; registrationNumber: string; status?: string };
  driverId: string;
  driver?: { id: string; name: string; status?: string };
  createdById: string;
  createdBy?: { id: string; name: string; email: string };
  auditLogs?: AuditLog[];
}

export interface MaintenanceLog {
  id: string;
  description: string;
  type: 'Oil' | 'Brake' | 'Engine' | 'Tyre' | 'Battery' | 'AC' | 'Insurance' | 'Fitness' | 'General Service' | 'Repair';
  cost: number;
  actualCost?: number;
  date: string;
  expectedCompletion?: string;
  completedDate?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  vendor?: string;
  status: 'ACTIVE' | 'CLOSED';
  invoiceUrl?: string;
  createdAt: string;
  updatedAt: string;
  vehicleId: string;
  vehicle?: { id: string; name: string; registrationNumber: string; status?: string };
  auditLogs?: AuditLog[];
}

export interface FuelLog {
  id: string;
  liters: number;
  cost: number;
  date: string;
  mileage?: number;
  vehicleId: string;
  driverId?: string;
  tripId?: string;
  vehicle?: { id: string; name: string; registrationNumber: string };
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  type: 'FUEL' | 'REPAIR' | 'TOLL' | 'SALARY' | 'INSURANCE' | 'FINE' | 'PARKING' | 'OTHER';
  amount: number;
  date: string;
  description: string | null;
  category?: string;
  receiptUrl?: string;
  vehicleId: string;
  tripId?: string;
  vehicle?: { id: string; name: string; registrationNumber: string };
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  module?: string;
  link?: string;
  read: boolean;
  userId?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  description?: string;
  oldValue?: any;
  newValue?: any;
  userId?: string;
  user?: { name: string; email: string };
  vehicleId?: string;
  driverId?: string;
  tripId?: string;
  maintenanceId?: string;
  createdAt: string;
}

export interface VehicleDocument {
  id: string;
  name: string;
  fileUrl: string;
  type: string;
  expiryDate?: string;
  vehicleId: string;
  createdAt: string;
}

export interface DashboardKPIs {
  totalVehicles?: number;
  availableVehicles?: number;
  inShopVehicles?: number;
  onTripVehicles?: number;
  reservedVehicles?: number;
  retiredVehicles?: number;
  availableDrivers?: number;
  totalDrivers?: number;
  activeTrips?: number;
  maintenanceDue?: number;
  pendingApprovals?: number;
  unreadNotifications?: number;
  fleetUtilization?: number;
  todayTripsCount?: number;
  pendingDispatch?: number;
  inProgress?: number;
  completed?: number;
  cancelled?: number;
  recentTrips?: Trip[];
  recentMaintenance?: MaintenanceLog[];
  totalFuelCost?: number;
  totalMaintenanceCost?: number;
  totalOtherExpenses?: number;
  totalRevenue?: number;
  totalDistance?: number;
  totalOperationalCost?: number;
  roi?: number;
  expenseByType?: { type: string; _sum: { amount: number } }[];
  monthlyFuel?: FuelLog[];
  monthlyExpenses?: Expense[];
  monthlyTrips?: Trip[];
  expiredLicenses?: number;
  suspendedDrivers?: number;
  avgSafetyScore?: number;
  complianceRate?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
