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
  seatsUsed?: number;
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
  suspensionReason?: string;
  suspensionNote?: string;
  statusChangedAt?: string;
  statusChangedBy?: string | { _id: string; firstName: string; lastName: string };
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

export interface SchoolStats {
  teachers: number;
  students: number;
  classes: number;
  admins: number;
  seatsUsed: number;
  seatsLicensed: number;
  utilizationPct: number;
  seatHistory: { month: string; count: number }[];
  aiUsage: {
    gradedThisTerm: number;
    tutorSessions: number;
    ocrJobs: number;
  };
}

export interface PlatformSettings {
  _id: string;
  trialDurationDays: number;
  defaultPackageId: SubscriptionPackage | null;
  platformName: string;
}

export interface SysNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  data?: Record<string, any>;
}

const BASE = '/sys-admin';
const NOTIF_BASE = '/notifications';

export const sysAdminService = {
  // Dashboard
  getOverview: (): Promise<PlatformOverview> => fetchData(`${BASE}/overview`),
  getSummary: (): Promise<SysAdminSummary> => fetchData(`${BASE}/summary`),

  // Schools
  getSchools: (): Promise<School[]> => fetchData(`${BASE}/schools`),
  getSchool: (id: string): Promise<School> => fetchData(`${BASE}/schools/${id}`),
  createSchool: (data: {
    name: string; email: string; phone?: string; address?: string;
    registrationNumber?: string; primaryContact?: { name?: string; email?: string; phone?: string };
    notes?: string;
    adminFirstName?: string; adminLastName?: string; adminEmail?: string;
    planId?: string;
    startOnTrial?: boolean;
    trialDays?: number;
    billingCycle?: 'monthly' | 'termly' | 'annually';
    studentLimit?: number;
    amountDue?: number;
    paymentRef?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<School & { defaultPassword?: string }> =>
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
  updateSubscription: (id: string, data: Partial<Subscription> & { packageId?: string; suspensionReason?: string; suspensionNote?: string }): Promise<Subscription> =>
    fetchData(`${BASE}/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  changeSubscriptionStatus: (id: string, data: { status: string; suspensionReason?: string; suspensionNote?: string }): Promise<Subscription> =>
    fetchData(`${BASE}/subscriptions/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSubscription: (id: string): Promise<{ message: string }> =>
    fetchData(`${BASE}/subscriptions/${id}`, { method: 'DELETE' }),
  extendTrial: (id: string, days: number): Promise<Subscription> =>
    fetchData(`${BASE}/subscriptions/${id}/extend-trial`, { method: 'POST', body: JSON.stringify({ days }) }),

  // School subscriptions (with statusChangedBy populated)
  getSchoolSubscriptions: (id: string): Promise<Subscription[]> => fetchData(`${BASE}/schools/${id}/subscriptions`),

  // School stats & actions
  getSchoolStats: (id: string): Promise<SchoolStats> => fetchData(`${BASE}/schools/${id}/stats`),
  resetAdminPassword: (id: string): Promise<{ message: string; email: string; temporaryPassword: string }> =>
    fetchData(`${BASE}/schools/${id}/reset-password`, { method: 'POST' }),

  // Platform settings
  getPlatformSettings: (): Promise<PlatformSettings> => fetchData(`${BASE}/platform-settings`),
  updatePlatformSettings: (data: Partial<Pick<PlatformSettings, 'trialDurationDays' | 'platformName'> & { defaultPackageId: string | null }>): Promise<PlatformSettings> =>
    fetchData(`${BASE}/platform-settings`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Sys admin personal profile
  updateProfile: (data: { firstName?: string; lastName?: string; phoneNumber?: string; email?: string; currentPassword?: string; newPassword?: string }): Promise<any> =>
    fetchData(`${BASE}/profile`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: (params?: { unreadOnly?: boolean; limit?: number }): Promise<{ notifications: SysNotification[]; unreadCount: number }> =>
    fetchData(`${NOTIF_BASE}?${new URLSearchParams({ ...(params?.unreadOnly ? { unreadOnly: 'true' } : {}), limit: String(params?.limit ?? 20) }).toString()}`),
  getUnreadCount: (): Promise<{ count: number }> => fetchData(`${NOTIF_BASE}/unread-count`),
  markNotificationRead: (id: string): Promise<SysNotification> =>
    fetchData(`${NOTIF_BASE}/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: (): Promise<{ message: string }> =>
    fetchData(`${NOTIF_BASE}/read-all`, { method: 'PUT' }),
};
