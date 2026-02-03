import { User, BeneficiaryProfile, Alert, Scheme, Enrollment } from '../types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Sunita Devi', role: 'beneficiary', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop' },
  { id: 'u2', name: 'Priya ASHA', role: 'asha_worker', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop' },
  { id: 'u3', name: 'Dr. Rajesh (Govt)', role: 'partner' },
  { id: 'u4', name: 'Anita Kumar', role: 'beneficiary' }
];

export const MOCK_BENEFICIARIES: BeneficiaryProfile[] = [
  {
    id: 'b1',
    userId: 'u1',
    name: 'Sunita Devi',
    pregnancyStage: 'trimester_3',
    lastPeriodDate: '2024-08-15',
    anemiaStatus: 'mild',
    riskLevel: 'medium',
    location: { lat: 28.6139, lng: 77.2090 },
    linkedAshaId: 'u2',
    nextCheckup: '2025-05-20',
    economicStatus: 'bpl'
  },
  {
    id: 'b2',
    userId: 'u4', 
    name: 'Anita Kumar',
    pregnancyStage: 'trimester_2',
    lastPeriodDate: '2024-11-01',
    anemiaStatus: 'severe',
    riskLevel: 'high',
    location: { lat: 28.6200, lng: 77.2100 },
    linkedAshaId: 'u2',
    nextCheckup: '2025-05-18',
    economicStatus: 'apl'
  }
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'a1',
    beneficiaryId: 'b2',
    severity: 'high',
    status: 'open',
    timestamp: new Date().toISOString(),
    type: 'health_risk'
  }
];

export const MOCK_SCHEMES: Scheme[] = [
  {
    id: 's1',
    title: 'Janani Suraksha Yojana (JSY)',
    provider: 'Govt',
    description: 'Safe motherhood intervention under the National Health Mission. Promotes institutional delivery among poor pregnant women.',
    heroImage: 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=800&q=80',
    benefits: ['₹1400 Cash Assistance', 'Free Transport', 'Free Medicines'],
    eligibilityCriteria: ['Below Poverty Line (BPL)', 'Age > 19 Years'],
    targetAudience: {
      economicStatus: ['bpl'],
      pregnancyStage: ['trimester_3', 'postpartum']
    },
    status: 'active',
    budget: 5000000,
    enrolledCount: 1240,
    startDate: '2024-01-01'
  },
  {
    id: 's2',
    title: 'Poshan Abhiyaan (Nutrition)',
    provider: 'NGO',
    description: 'Special nutrition drive for high-risk anemic mothers. Provides weekly nutrition baskets.',
    heroImage: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&q=80',
    benefits: ['Weekly Fruit Basket', 'Iron Supplements', 'Protein Powder'],
    eligibilityCriteria: ['Anemia: Moderate/Severe', 'All Trimesters'],
    targetAudience: {
      riskLevel: ['medium', 'high']
    },
    status: 'active',
    budget: 1200000,
    enrolledCount: 450,
    startDate: '2024-03-15'
  }
];

export const MOCK_ENROLLMENTS: Enrollment[] = [
  {
    id: 'e1',
    schemeId: 's1',
    beneficiaryId: 'b1',
    status: 'approved',
    enrolledBy: 'u2',
    date: '2024-04-10'
  }
];
