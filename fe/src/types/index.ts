export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'staff' | 'client';
  avatar?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  startDate: string;
  endDate: string;
  remainingDays: number;
  salesRep: string;
  memberManager: string;
  trainer?: string;
  attendanceId: string;
  clubId: string;
  gstNo?: string;
  notifications: {
    sms: boolean;
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  avatar?: string;
  status: 'active' | 'expired' | 'pending';
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  designation: string;
  phone: string;
  email: string;
  joiningDate: string;
  salary: number;
  role: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  name: string;
  contact: string;
  email?: string;
  status: 'new' | 'contacted' | 'interested' | 'converted' | 'lost';
  assignedStaff: string;
  followUpDate: string;
  comments: string;
  source: string;
  createdAt: string;
}

export interface DashboardStats {
  totalSales: number;
  paymentsCollected: number;
  paymentsPending: number;
  newClients: number;
  renewals: number;
  checkIns: number;
}