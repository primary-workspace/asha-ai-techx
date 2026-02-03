import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, BeneficiaryProfile, HealthLog, Alert, Scheme, Enrollment, DailyLog, SyncQueueItem, Language, Child } from '../types';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  theme: 'light' | 'dark';
  language: Language;
  isLoading: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  currentUser: User | null;
  
  // Data
  users: User[];
  beneficiaries: BeneficiaryProfile[];
  children: Child[];
  healthLogs: HealthLog[];
  dailyLogs: DailyLog[];
  alerts: Alert[];
  schemes: Scheme[];
  enrollments: Enrollment[];
  
  // Offline Queue
  syncQueue: SyncQueueItem[];
  
  // Actions
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  setOnlineStatus: (status: boolean) => void;
  fetchInitialData: () => Promise<void>;
  processSyncQueue: () => Promise<void>;
  
  login: (user: User) => void;
  logout: () => void;
  
  // Data Operations
  ensureBeneficiaryProfile: (userId: string, name: string) => Promise<void>;
  updateBeneficiaryProfile: (id: string, updates: Partial<BeneficiaryProfile>) => Promise<void>;
  deleteBeneficiary: (id: string) => Promise<void>;
  addChild: (child: Omit<Child, 'id'>) => Promise<void>;
  updateChild: (id: string, updates: Partial<Child>) => Promise<void>;
  addHealthLog: (log: Omit<HealthLog, 'id'>) => Promise<void>;
  addDailyLog: (log: Omit<DailyLog, 'id'>) => Promise<void>;
  updateDailyLog: (log: DailyLog) => void;
  triggerSOS: (beneficiaryId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  
  // Scheme Actions
  addScheme: (scheme: Omit<Scheme, 'id' | 'enrolledCount'>) => Promise<void>;
  deleteScheme: (id: string) => Promise<void>;
  enrollBeneficiary: (schemeId: string, beneficiaryId: string, enrolledBy: string) => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'en',
      isLoading: false,
      isOnline: navigator.onLine,
      isSyncing: false,
      currentUser: null,
      users: [],
      beneficiaries: [],
      children: [],
      healthLogs: [],
      dailyLogs: [],
      alerts: [],
      schemes: [],
      enrollments: [],
      syncQueue: [],

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      setLanguage: (lang) => set({ language: lang }),

      setOnlineStatus: (status) => set({ isOnline: status }),

      fetchInitialData: async () => {
        if (!navigator.onLine) return;
        
        set({ isLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
             const { data: user } = await supabase.from('users').select('*').eq('id', session.user.id).single();
             if (user) {
               set({ currentUser: user as User });
             }
          }

          const [
            { data: users },
            { data: beneficiaries },
            { data: children },
            { data: schemes },
            { data: enrollments },
            { data: dailyLogs },
            { data: healthLogs },
            { data: alerts }
          ] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('beneficiary_profiles').select('*'),
            supabase.from('children').select('*'),
            supabase.from('schemes').select('*'),
            supabase.from('scheme_beneficiaries').select('*'),
            supabase.from('daily_logs').select('*'),
            supabase.from('health_logs').select('*'),
            supabase.from('alerts').select('*')
          ]);
          
          set({ 
            users: users as User[] || [],
            beneficiaries: beneficiaries?.map(b => ({
              ...b,
              userId: b.user_id,
              userType: b.user_type,
              bloodGroup: b.blood_group,
              pregnancyStage: b.pregnancy_stage,
              lastPeriodDate: b.last_period_date,
              anemiaStatus: b.anemia_status,
              riskLevel: b.risk_level,
              linkedAshaId: b.linked_asha_id,
              nextCheckup: b.next_checkup,
              medicalHistory: b.medical_history,
              currentMedications: b.current_medications,
              complications: b.complications,
              height: b.height,
              weight: b.weight,
              economicStatus: b.economic_status,
              address: b.address,
              gps_coords: b.gps_coords
            })) as BeneficiaryProfile[] || [],
            children: children?.map(c => ({
              ...c,
              beneficiaryId: c.beneficiary_id,
              bloodGroup: c.blood_group
            })) as Child[] || [],
            schemes: schemes?.map(s => ({
              ...s,
              title: s.scheme_name,
              heroImage: s.hero_image,
              enrolledCount: s.enrolled_count || 0,
              startDate: s.start_date,
              eligibilityCriteria: s.eligibility_criteria,
              targetAudience: s.target_audience,
              benefits: s.benefits || []
            })) as Scheme[] || [],
            enrollments: enrollments?.map(e => ({
              ...e,
              schemeId: e.scheme_id,
              beneficiaryId: e.beneficiary_id,
              enrolledBy: e.enrolled_by
            })) as Enrollment[] || [],
            dailyLogs: dailyLogs?.map(l => ({
              ...l,
              userId: l.user_id
            })) as DailyLog[] || [],
            healthLogs: healthLogs?.map(l => ({
              ...l,
              beneficiaryId: l.beneficiary_id,
              bpSystolic: l.vitals?.bpSystolic,
              bpDiastolic: l.vitals?.bpDiastolic,
              symptoms: l.symptoms || [],
              isEmergency: l.is_emergency
            })) as HealthLog[] || [],
            // FIX: Map created_at to timestamp for SOS date display
            alerts: alerts?.map(a => ({
              ...a,
              beneficiaryId: a.beneficiary_id,
              timestamp: a.created_at || new Date().toISOString()
            })) as Alert[] || []
          });

        } catch (error) {
          console.error('Error fetching initial data:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      processSyncQueue: async () => {
        const { syncQueue, isOnline } = get();
        if (!isOnline || syncQueue.length === 0) return;

        set({ isSyncing: true });
        const queue = [...syncQueue];
        const remainingQueue: SyncQueueItem[] = [];

        for (const item of queue) {
          try {
            let error = null;
            
            switch (item.type) {
              case 'ADD_DAILY_LOG':
                ({ error } = await supabase.from('daily_logs').upsert({
                  id: item.payload.id,
                  user_id: item.payload.userId,
                  date: item.payload.date,
                  mood: item.payload.mood,
                  symptoms: item.payload.symptoms,
                  notes: item.payload.notes
                }, { onConflict: 'user_id, date' }));
                break;
                
              case 'ADD_HEALTH_LOG':
                ({ error } = await supabase.from('health_logs').insert({
                  id: item.payload.id,
                  beneficiary_id: item.payload.beneficiaryId,
                  date: item.payload.date,
                  vitals: {
                    bpSystolic: item.payload.bpSystolic,
                    bpDiastolic: item.payload.bpDiastolic
                  },
                  symptoms: item.payload.symptoms,
                  mood: item.payload.mood,
                  is_emergency: item.payload.isEmergency
                }));
                break;

              case 'TRIGGER_SOS':
                ({ error } = await supabase.from('alerts').insert({
                  id: item.payload.id,
                  beneficiary_id: item.payload.beneficiaryId,
                  severity: 'critical',
                  status: 'open',
                  type: 'sos',
                  reason: 'SOS Button Triggered'
                }));
                break;
                
              case 'ENROLL_SCHEME':
                ({ error } = await supabase.from('scheme_beneficiaries').insert({
                  id: item.payload.id,
                  scheme_id: item.payload.schemeId,
                  beneficiary_id: item.payload.beneficiaryId,
                  enrolled_by: item.payload.enrolledBy,
                  status: 'approved',
                  enrollment_date: item.payload.date
                }));
                if (!error) {
                  await supabase.rpc('increment_enrollment_count', { scheme_id: item.payload.schemeId });
                }
                break;
                
              case 'UPDATE_PROFILE':
                const { id, updates } = item.payload;
                const dbUpdates: any = {};
                // Map camelCase to snake_case for DB
                if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
                if (updates.height !== undefined) dbUpdates.height = updates.height;
                if (updates.userType !== undefined) dbUpdates.user_type = updates.userType;
                if (updates.bloodGroup !== undefined) dbUpdates.blood_group = updates.bloodGroup;
                if (updates.lastPeriodDate !== undefined) dbUpdates.last_period_date = updates.lastPeriodDate;
                if (updates.anemiaStatus !== undefined) dbUpdates.anemia_status = updates.anemiaStatus;
                if (updates.medicalHistory !== undefined) dbUpdates.medical_history = updates.medicalHistory;
                if (updates.currentMedications !== undefined) dbUpdates.current_medications = updates.currentMedications;
                if (updates.complications !== undefined) dbUpdates.complications = updates.complications;
                if (updates.riskLevel !== undefined) dbUpdates.risk_level = updates.riskLevel;
                if (updates.pregnancyStage !== undefined) dbUpdates.pregnancy_stage = updates.pregnancyStage;
                if (updates.nextCheckup !== undefined) dbUpdates.next_checkup = updates.nextCheckup;
                if (updates.address !== undefined) dbUpdates.address = updates.address;
                if (updates.gps_coords !== undefined) dbUpdates.gps_coords = updates.gps_coords;
                
                ({ error } = await supabase.from('beneficiary_profiles').update(dbUpdates).eq('id', id));
                break;

              case 'ADD_CHILD':
                ({ error } = await supabase.from('children').insert({
                  id: item.payload.id,
                  beneficiary_id: item.payload.beneficiaryId,
                  name: item.payload.name,
                  dob: item.payload.dob,
                  gender: item.payload.gender,
                  blood_group: item.payload.bloodGroup,
                  vaccinations: item.payload.vaccinations
                }));
                break;
            }

            if (error) throw error;

          } catch (err: any) {
            console.error(`Failed to sync item ${item.id}:`, err);
            if (err?.code === '23505') continue; 
            const isNetworkError = err.message === 'TypeError: Failed to fetch' || err.message?.includes('fetch');
            if (isNetworkError || item.retryCount < 5) {
              remainingQueue.push({ ...item, retryCount: item.retryCount + 1 });
            }
          }
        }

        set({ syncQueue: remainingQueue, isSyncing: false });
        if (remainingQueue.length < queue.length) {
          get().fetchInitialData();
        }
      },

      login: (user) => {
        set({ currentUser: user });
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ currentUser: null });
      },

      ensureBeneficiaryProfile: async (userId, name) => {
        const state = get();
        const exists = state.beneficiaries.find(b => b.userId === userId);
        
        if (!exists) {
          const newProfile = {
            id: uuidv4(),
            user_id: userId,
            name: name,
            last_period_date: null,
            pregnancy_stage: null,
            risk_level: 'low',
            user_type: 'girl'
          };

          set(state => ({
            beneficiaries: [...state.beneficiaries, {
              id: newProfile.id,
              userId: userId,
              name: name,
              riskLevel: 'low',
              userType: 'girl',
            } as BeneficiaryProfile]
          }));

          const { error } = await supabase.from('beneficiary_profiles').insert(newProfile);
          if (error) console.error('Error creating profile:', error);
        }
      },

      updateBeneficiaryProfile: async (id, updates) => {
        set((state) => ({
          beneficiaries: state.beneficiaries.map(b => b.id === id ? { ...b, ...updates } : b)
        }));
        
        try {
          const dbUpdates: any = {};
          if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
          if (updates.height !== undefined) dbUpdates.height = updates.height;
          if (updates.userType !== undefined) dbUpdates.user_type = updates.userType;
          if (updates.bloodGroup !== undefined) dbUpdates.blood_group = updates.bloodGroup;
          if (updates.lastPeriodDate !== undefined) dbUpdates.last_period_date = updates.lastPeriodDate;
          if (updates.anemiaStatus !== undefined) dbUpdates.anemia_status = updates.anemiaStatus;
          if (updates.medicalHistory !== undefined) dbUpdates.medical_history = updates.medicalHistory;
          if (updates.currentMedications !== undefined) dbUpdates.current_medications = updates.currentMedications;
          if (updates.complications !== undefined) dbUpdates.complications = updates.complications;
          if (updates.riskLevel !== undefined) dbUpdates.risk_level = updates.riskLevel;
          if (updates.pregnancyStage !== undefined) dbUpdates.pregnancy_stage = updates.pregnancyStage;
          if (updates.nextCheckup !== undefined) dbUpdates.next_checkup = updates.nextCheckup;
          if (updates.address !== undefined) dbUpdates.address = updates.address;
          if (updates.gps_coords !== undefined) dbUpdates.gps_coords = updates.gps_coords;
          
          const { error } = await supabase.from('beneficiary_profiles').update(dbUpdates).eq('id', id);
          if (error) throw error;
        } catch (err) {
          set(state => ({
            syncQueue: [...state.syncQueue, {
              id: uuidv4(),
              type: 'UPDATE_PROFILE',
              payload: { id, updates },
              timestamp: Date.now(),
              retryCount: 0
            }]
          }));
        }
      },

      deleteBeneficiary: async (id) => {
        set((state) => ({
          beneficiaries: state.beneficiaries.filter(b => b.id !== id),
          children: state.children.filter(c => c.beneficiaryId !== id),
          healthLogs: state.healthLogs.filter(l => l.beneficiaryId !== id),
          alerts: state.alerts.filter(a => a.beneficiaryId !== id),
          enrollments: state.enrollments.filter(e => e.beneficiaryId !== id)
        }));

        try {
          const { error } = await supabase.from('beneficiary_profiles').delete().eq('id', id);
          if (error) throw error;
        } catch (err) {
          console.error("Failed to delete beneficiary:", err);
        }
      },

      addChild: async (child) => {
        const newChild = { ...child, id: uuidv4() };
        set(state => ({ children: [...state.children, newChild] }));

        try {
          const { error } = await supabase.from('children').insert({
            id: newChild.id,
            beneficiary_id: child.beneficiaryId,
            name: child.name,
            dob: child.dob,
            gender: child.gender,
            blood_group: child.bloodGroup,
            vaccinations: child.vaccinations || []
          });
          if (error) throw error;
        } catch (err) {
          set(state => ({
            syncQueue: [...state.syncQueue, {
              id: uuidv4(),
              type: 'ADD_CHILD',
              payload: newChild,
              timestamp: Date.now(),
              retryCount: 0
            }]
          }));
        }
      },

      updateChild: async (id, updates) => {
        set((state) => ({
          children: state.children.map(c => c.id === id ? { ...c, ...updates } : c)
        }));

        try {
          const dbUpdates: any = {};
          if (updates.vaccinations !== undefined) dbUpdates.vaccinations = updates.vaccinations;
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.dob !== undefined) dbUpdates.dob = updates.dob;
          if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
          if (updates.bloodGroup !== undefined) dbUpdates.blood_group = updates.bloodGroup;
          
          const { error } = await supabase.from('children').update(dbUpdates).eq('id', id);
          if (error) throw error;
        } catch (err) {
          console.error("Failed to update child:", err);
        }
      },

      addHealthLog: async (log) => {
        const newLog = { ...log, id: uuidv4() };
        set((state) => ({ healthLogs: [...state.healthLogs, newLog] }));
        
        try {
          const { error } = await supabase.from('health_logs').insert({
            id: newLog.id,
            beneficiary_id: log.beneficiaryId,
            date: log.date,
            vitals: {
              bpSystolic: log.bpSystolic,
              bpDiastolic: log.bpDiastolic
            },
            symptoms: log.symptoms,
            mood: log.mood,
            is_emergency: log.isEmergency
          });
          if (error) throw error;
        } catch (err) {
          set(state => ({
            syncQueue: [...state.syncQueue, {
              id: uuidv4(),
              type: 'ADD_HEALTH_LOG',
              payload: newLog,
              timestamp: Date.now(),
              retryCount: 0
            }]
          }));
        }
      },

      addDailyLog: async (log) => {
        const newLog = { ...log, id: uuidv4() };
        set((state) => {
          const filtered = state.dailyLogs.filter(l => l.date !== log.date || l.userId !== log.userId);
          return { dailyLogs: [...filtered, newLog] };
        });

        try {
          const { error } = await supabase.from('daily_logs').upsert({
            id: newLog.id,
            user_id: log.userId,
            date: log.date,
            mood: log.mood,
            symptoms: log.symptoms,
            notes: log.notes
          }, { onConflict: 'user_id, date' });
          if (error) throw error;
        } catch (err) {
          set(state => ({
            syncQueue: [...state.syncQueue, {
              id: uuidv4(),
              type: 'ADD_DAILY_LOG',
              payload: newLog,
              timestamp: Date.now(),
              retryCount: 0
            }]
          }));
        }
      },

      updateDailyLog: (log) => set((state) => ({
        dailyLogs: state.dailyLogs.map(l => l.id === log.id ? log : l)
      })),

      triggerSOS: async (beneficiaryId) => {
        const newAlert: Alert = {
          id: uuidv4(),
          beneficiaryId,
          severity: 'critical',
          status: 'open',
          timestamp: new Date().toISOString(),
          type: 'sos'
        };

        set((state) => ({ alerts: [newAlert, ...state.alerts] }));

        try {
          const { error } = await supabase.from('alerts').insert({
            id: newAlert.id,
            beneficiary_id: beneficiaryId,
            severity: 'critical',
            status: 'open',
            type: 'sos',
            reason: 'SOS Button Triggered'
          });
          if (error) throw error;
        } catch (err) {
          set(state => ({
            syncQueue: [...state.syncQueue, {
              id: uuidv4(),
              type: 'TRIGGER_SOS',
              payload: { id: newAlert.id, beneficiaryId },
              timestamp: Date.now(),
              retryCount: 0
            }]
          }));
        }
      },

      resolveAlert: async (alertId) => {
        set((state) => ({
          alerts: state.alerts.map(a => a.id === alertId ? { ...a, status: 'resolved' } : a)
        }));

        await supabase.from('alerts').update({ status: 'resolved' }).eq('id', alertId);
      },

      addScheme: async (scheme) => {
        const newScheme = { ...scheme, id: uuidv4(), enrolledCount: 0 };
        set((state) => ({ schemes: [...state.schemes, newScheme] }));

        const { error } = await supabase.from('schemes').insert({
          id: newScheme.id,
          scheme_name: scheme.title,
          description: scheme.description,
          provider: scheme.provider,
          category: scheme.category,
          budget: scheme.budget,
          start_date: scheme.startDate,
          hero_image: scheme.heroImage,
          benefits: scheme.benefits,
          eligibility_criteria: scheme.eligibilityCriteria,
          target_audience: scheme.targetAudience,
          status: scheme.status
        });
        
        if (error) throw error;
      },

      deleteScheme: async (id) => {
        set((state) => ({ schemes: state.schemes.filter(s => s.id !== id) }));
        await supabase.from('schemes').delete().eq('id', id);
      },

      enrollBeneficiary: async (schemeId, beneficiaryId, enrolledBy) => {
        const state = get();
        const exists = state.enrollments.some(e => e.schemeId === schemeId && e.beneficiaryId === beneficiaryId);
        if (exists) return;

        const newEnrollment: Enrollment = {
          id: uuidv4(),
          schemeId,
          beneficiaryId,
          status: 'approved',
          enrolledBy,
          date: new Date().toISOString()
        };

        set((state) => ({
          schemes: state.schemes.map(s => 
            s.id === schemeId ? { ...s, enrolledCount: s.enrolledCount + 1 } : s
          ),
          enrollments: [...state.enrollments, newEnrollment]
        }));
        
        try {
          const { error } = await supabase.from('scheme_beneficiaries').insert({
            id: newEnrollment.id,
            scheme_id: schemeId,
            beneficiary_id: beneficiaryId,
            enrolled_by: enrolledBy,
            status: 'approved',
            enrollment_date: newEnrollment.date
          });

          if (error) throw error;
          await supabase.rpc('increment_enrollment_count', { scheme_id: schemeId });
        } catch (err) {
          set(state => ({
            syncQueue: [...state.syncQueue, {
              id: uuidv4(),
              type: 'ENROLL_SCHEME',
              payload: newEnrollment,
              timestamp: Date.now(),
              retryCount: 0
            }]
          }));
        }
      },
    }),
    {
      name: 'asha-ai-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  )
);
