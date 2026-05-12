import { fetchData } from './apiClient';

export interface SysAdminSummary {
  totalSchools: number;
  activeSchools: number;
  totalPackages: number;
  totalUsers: number;
  totalStudents: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  suspendedSubscriptions: number;
  mrrEstimate: number;
  seatsSold: number;
  recentSchools: School[];
}

export interface School {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  registrationNumber?: string;
  primaryContact?: { name?: string; email?: string; phone?: string };
  activeSubscription?: Subscription | null;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPackage {
  _id: string;
  name: string;
  type: 'prepaid' | 'custom';
  studentLimit: number;
  pricePerStudent: number;
  totalPrice: number;
  billingCycle: 'monthly' | 'termly' | 'annually';
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Subscription {
  _id: string;
  school: School | string;
  package: SubscriptionPackage | string;
  studentLimit: number;
  status: 'trial' | 'active' | 'suspended' | 'expired' | 'cancelled';
  billingCycle: 'monthly' | 'termly' | 'annually';
  startDate: string;
  endDate: string;
  amountDue: number;
  amountPaid: number;
  paymentRef?: string;
  notes?: string;
  createdAt: string;
}

export interface PlatformOverview {
  totalSchools: number;
  activeSubscriptions: number;
  trialSchools: number;
  suspendedSubscriptions: number;
  mrr: number;
  churnedThisMonth: number;
  seatsSold: number;
  recentSchools: School[];
}

const BASE = '/sys-admin';

export const sysAdminService = {
  // Dashboard
  getOverview: (): Promise<PlatformOverview> => fetchData(`${BASE}/overview`),
  getSummary: (): Promise<SysAdminSummary> => fetchData(`${BASE}/summary`),

  // Schools
  getSchools: (): Promise<School[]> => fetchData(`${BASE}/schools`),
  getSchool: (id: string): Promise<School> => fetchData(`${BASE}/schools/${id}`),
  createSchool: (data: Partial<School>): Promise<School> =>
    fetchData(`${BASE}/schools`, { method: 'POST', body: JSON.stringify(data) }),
  updateSchool: (id: string, data: Partial<School>): Promise<School> =>
    fetchData(`${BASE}/schools/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSchool: (id: string): Promise<{ message: string }> =>
    fetchData(`${BASE}/schools/${id}`, { method: 'DELETE' }),

  // Packages
  getPackages: (): Promise<SubscriptionPackage[]> => fetchData(`${BASE}/packages`),
  getPackage: (id: string): Promise<SubscriptionPackage> => fetchData(`${BASE}/packages/${id}`),
  createPackage: (data: Partial<SubscriptionPackage>): Promise<SubscriptionPackage> =>
    fetchData(`${BASE}/packages`, { method: 'POST', body: JSON.stringify(data) }),
  updatePackage: (id: string, data: Partial<SubscriptionPackage>): Promise<SubscriptionPackage> =>
    fetchData(`${BASE}/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePackage: (id: string): Promise<{ message: string }> =>
    fetchData(`${BASE}/packages/${id}`, { method: 'DELETE' }),

  // Subscriptions
  getSubscriptions: (): Promise<Subscription[]> => fetchData(`${BASE}/subscriptions`),
  getSubscription: (id: string): Promise<Subscription> => fetchData(`${BASE}/subscriptions/${id}`),
  createSubscription: (data: {
    schoolId: string;
    packageId: string;
    studentLimit: number;
    billingCycle?: string;
    startDate: string;
    endDate: string;
    amountDue?: number;
    paymentRef?: string;
    notes?: string;
  }): Promise<Subscription> =>
    fetchData(`${BASE}/subscriptions`, { method: 'POST', body: JSON.stringify(data) }),
  updateSubscription: (id: string, data: Partial<Subscription> & { packageId?: string }): Promise<Subscription> =>
    fetchData(`${BASE}/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubscription: (id: string): Promise<{ message: string }> =>
    fetchData(`${BASE}/subscriptions/${id}`, { method: 'DELETE' }),
};
