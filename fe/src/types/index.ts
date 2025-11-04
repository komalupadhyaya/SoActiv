export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'sales' | 'trainer' | 'frontdesk';
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
  _id: string;
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'new' | 'contacted' | 'interested' | 'converted' | 'lost';
  assignedStaff: string | null;
  followUpDate: string | null;
  comments: string;
  source: string;
  interests: string;
  budget: string;
  expiryDays: number;
  expiryDate: string;
  isExpired: boolean;
  remainingDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  _id: string;
  userId: string;
  assignedTo: {
    _id: string;
    fullName: string;
    position: string;
    email: string;
  };
  type: 'enquiry' | 'client' | 'pt';
  relatedId: string;
  relatedName: string;
  scheduledDate: string;
  scheduledTime: string;
  note: string;
  status: 'pending' | 'completed' | 'cancelled';
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PTExpiryData {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  hasPersonalTraining: boolean;
  personalTrainingDurationWeeks?: number;
  personalTrainingPrice?: number;
  trainer?: {
    _id: string;
    fullName: string;
    position: string;
    email: string;
  };
  personalTrainer?: {
    _id: string;
    fullName: string;
    position: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  ptRemainingDays: number;
  ptIsExpired: boolean;
  ptExpiringSoon: boolean;
}

export interface DashboardStats {
  totalSales: number;
  paymentsCollected: number;
  paymentsPending: number;
  newClients: number;
  renewals: number;
  checkIns: number;
}