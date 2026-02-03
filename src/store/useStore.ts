import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, BeneficiaryProfile, HealthLog, Alert, Scheme, Enrollment } from '../types';
import { MOCK_USERS, MOCK_BENEFICIARIES, MOCK_ALERTS, MOCK_SCHEMES, MOCK_ENROLLMENTS } from './mockData';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  currentUser: User | null;
  users: User[];
  beneficiaries: BeneficiaryProfile[];
  healthLogs: HealthLog[];
  alerts: Alert[];
  schemes: Scheme[];
  enrollments: Enrollment[];
  
  // Actions
  login: (role: User['role']) => void;
  logout: () => void;
  addHealthLog: (log: Omit<HealthLog, 'id'>) => void;
  triggerSOS: (beneficiaryId: string) => void;
  resolveAlert: (alertId: string) => void;
  
  // Scheme Actions
  addScheme: (scheme: Omit<Scheme, 'id' | 'enrolledCount'>) => void;
  deleteScheme: (id: string) => void;
  enrollBeneficiary: (schemeId: string, beneficiaryId: string, enrolledBy: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: MOCK_USERS,
      beneficiaries: MOCK_BENEFICIARIES,
      healthLogs: [],
      alerts: MOCK_ALERTS,
      schemes: MOCK_SCHEMES,
      enrollments: MOCK_ENROLLMENTS,

      login: (role) => {
        const user = get().users.find(u => u.role === role);
        if (user) set({ currentUser: user });
      },

      logout: () => set({ currentUser: null }),

      addHealthLog: (log) => set((state) => ({
        healthLogs: [...state.healthLogs, { ...log, id: uuidv4() }]
      })),

      triggerSOS: (beneficiaryId) => set((state) => ({
        alerts: [
          {
            id: uuidv4(),
            beneficiaryId,
            severity: 'critical',
            status: 'open',
            timestamp: new Date().toISOString(),
            type: 'sos'
          },
          ...state.alerts
        ]
      })),

      resolveAlert: (alertId) => set((state) => ({
        alerts: state.alerts.map(a => a.id === alertId ? { ...a, status: 'resolved' } : a)
      })),

      addScheme: (scheme) => set((state) => ({
        schemes: [...state.schemes, { ...scheme, id: uuidv4(), enrolledCount: 0 }]
      })),

      deleteScheme: (id) => set((state) => ({
        schemes: state.schemes.filter(s => s.id !== id)
      })),

      enrollBeneficiary: (schemeId, beneficiaryId, enrolledBy) => set((state) => {
        // Check if already enrolled
        const exists = state.enrollments.some(e => e.schemeId === schemeId && e.beneficiaryId === beneficiaryId);
        if (exists) return state;

        // Update scheme count
        const updatedSchemes = state.schemes.map(s => 
          s.id === schemeId ? { ...s, enrolledCount: s.enrolledCount + 1 } : s
        );

        return {
          schemes: updatedSchemes,
          enrollments: [
            ...state.enrollments,
            {
              id: uuidv4(),
              schemeId,
              beneficiaryId,
              status: 'approved', // Auto-approve for MVP
              enrolledBy,
              date: new Date().toISOString()
            }
          ]
        };
      }),
    }),
    {
      name: 'asha-ai-storage',
    }
  )
);
