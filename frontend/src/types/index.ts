export interface User {
  id: string;
  email: string;
  name: string;
  role: 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';
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
  status: 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';
  region: string | null;
  createdAt: string;
  updatedAt: string;
  trips?: Trip[];
  maintenanceLogs?: MaintenanceLog[];
  fuelLogs?: FuelLog[];
  expenses?: Expense[];
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  trips?: Trip[];
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance: number | null;
  fuelConsumed: number | null;
  finalOdometer: number | null;
  revenue: number | null;
  status: 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  vehicleId: string;
  vehicle?: { id: string; name: string; registrationNumber: string };
  driverId: string;
  driver?: { id: string; name: string };
  createdById: string;
  createdBy?: { id: string; name: string; email: string };
}

export interface MaintenanceLog {
  id: string;
  description: string;
  type: string;
  cost: number;
  date: string;
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  vehicleId: string;
  vehicle?: { id: string; name: string; registrationNumber: string; status?: string };
}

export interface FuelLog {
  id: string;
  liters: number;
  cost: number;
  date: string;
  createdAt: string;
  updatedAt: string;
  vehicleId: string;
  vehicle?: { id: string; name: string; registrationNumber: string };
}

export interface Expense {
  id: string;
  type: 'TOLL' | 'MAINTENANCE' | 'FUEL' | 'OTHER';
  amount: number;
  date: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  vehicleId: string;
  vehicle?: { id: string; name: string; registrationNumber: string };
}

export interface DashboardKPIs {
  totalVehicles: number;
  activeVehicles: number;
  availableVehicles: number;
  inShopVehicles: number;
  retiredVehicles: number;
  totalDrivers: number;
  availableDrivers: number;
  onTripDrivers: number;
  offDutyDrivers: number;
  suspendedDrivers: number;
  activeTrips: number;
  pendingTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  fleetUtilization: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalOtherExpenses: number;
  recentTrips: Trip[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
