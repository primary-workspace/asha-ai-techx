export type Role = 'beneficiary' | 'asha_worker' | 'partner';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
}

export interface BeneficiaryProfile {
  id: string;
  userId: string;
  name: string;
  pregnancyStage: 'trimester_1' | 'trimester_2' | 'trimester_3' | 'postpartum';
  lastPeriodDate: string;
  anemiaStatus: 'normal' | 'mild' | 'moderate' | 'severe';
  riskLevel: 'low' | 'medium' | 'high';
  location: { lat: number; lng: number };
  linkedAshaId: string;
  nextCheckup: string;
  economicStatus?: 'bpl' | 'apl'; // Below/Above Poverty Line
}

export interface HealthLog {
  id: string;
  beneficiaryId: string;
  date: string;
  bpSystolic: number;
  bpDiastolic: number;
  symptoms: string[];
  mood: string;
  isEmergency: boolean;
}

export interface Alert {
  id: string;
  beneficiaryId: string;
  severity: 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved';
  timestamp: string;
  type: 'sos' | 'health_risk';
}

export interface Scheme {
  id: string;
  title: string;
  provider: 'Govt' | 'NGO';
  description: string;
  heroImage: string;
  benefits: string[];
  eligibilityCriteria: string[];
  targetAudience: {
    pregnancyStage?: string[];
    economicStatus?: string[];
    riskLevel?: string[];
  };
  status: 'active' | 'draft' | 'closed';
  budget: number;
  enrolledCount: number;
  startDate: string;
}

export interface Enrollment {
  id: string;
  schemeId: string;
  beneficiaryId: string;
  status: 'pending' | 'approved' | 'rejected';
  enrolledBy: string; // User ID (ASHA or Self)
  date: string;
}
