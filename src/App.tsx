import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { supabase } from './lib/supabase';
import { ToastContainer } from './components/ui/ToastContainer';
import NetworkStatus from './components/ui/NetworkStatus'; // New Import

import Landing from './pages/Landing';
import RoleSelection from './pages/auth/RoleSelection';
import Login from './pages/auth/Login';

// Beneficiary Pages
import BeneficiaryDashboard from './pages/beneficiary/Dashboard';
import BeneficiarySchemes from './pages/beneficiary/Schemes';
import BeneficiaryNutrition from './pages/beneficiary/Nutrition';
import BeneficiaryEducation from './pages/beneficiary/Education';
import BeneficiaryCard from './pages/beneficiary/DigitalCardPage';
import CycleTrackerScreen from './pages/beneficiary/CycleTracker';

// ASHA Pages
import AshaDashboard from './pages/asha/Dashboard';
import VisitForm from './pages/asha/VisitForm';
import QRScanner from './pages/asha/QRScanner';
import PatientProfile from './pages/asha/PatientProfile';
import PatientList from './pages/asha/PatientList';
import AshaAlerts from './pages/asha/Alerts';

// Partner Pages
import PartnerDashboard from './pages/partner/Dashboard';
import SchemesList from './pages/partner/SchemesList';
import CreateScheme from './pages/partner/CreateScheme';
import SchemeDetails from './pages/partner/SchemeDetails';

function App() {
  const { 
    fetchInitialData, 
    logout, 
    setOnlineStatus, 
    processSyncQueue 
  } = useStore();

  useEffect(() => {
    // 1. Load initial data
    fetchInitialData();

    // 2. Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        fetchInitialData();
      } else if (event === 'SIGNED_OUT') {
        logout();
      }
    });

    // 3. Network Listeners
    const handleOnline = () => {
      setOnlineStatus(true);
      processSyncQueue(); // Sync when back online
    };
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchInitialData, logout, setOnlineStatus, processSyncQueue]);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <NetworkStatus /> {/* Global Network Bar */}
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/role-select" element={<RoleSelection />} />
          <Route path="/login" element={<Login />} />
          
          {/* Beneficiary Routes */}
          <Route path="/beneficiary" element={<BeneficiaryDashboard />} />
          <Route path="/beneficiary/schemes" element={<BeneficiarySchemes />} />
          <Route path="/beneficiary/nutrition" element={<BeneficiaryNutrition />} />
          <Route path="/beneficiary/education" element={<BeneficiaryEducation />} />
          <Route path="/beneficiary/card" element={<BeneficiaryCard />} />
          <Route path="/beneficiary/tracker" element={<CycleTrackerScreen />} />
          
          {/* ASHA Routes */}
          <Route path="/asha" element={<AshaDashboard />} />
          <Route path="/asha/visit" element={<VisitForm />} />
          <Route path="/asha/scan" element={<QRScanner />} />
          <Route path="/asha/patients" element={<PatientList />} />
          <Route path="/asha/alerts" element={<AshaAlerts />} />
          <Route path="/asha/patient/:id" element={<PatientProfile />} />
          
          {/* Partner Routes */}
          <Route path="/partner" element={<PartnerDashboard />} />
          <Route path="/partner/schemes" element={<SchemesList />} />
          <Route path="/partner/schemes/create" element={<CreateScheme />} />
          <Route path="/partner/schemes/:id" element={<SchemeDetails />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
