import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';

// Beneficiary Pages
import BeneficiaryDashboard from './pages/beneficiary/Dashboard';
import BeneficiarySchemes from './pages/beneficiary/Schemes';
import BeneficiaryNutrition from './pages/beneficiary/Nutrition';
import BeneficiaryEducation from './pages/beneficiary/Education';
import BeneficiaryCard from './pages/beneficiary/DigitalCardPage';

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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Beneficiary Routes */}
        <Route path="/beneficiary" element={<BeneficiaryDashboard />} />
        <Route path="/beneficiary/schemes" element={<BeneficiarySchemes />} />
        <Route path="/beneficiary/nutrition" element={<BeneficiaryNutrition />} />
        <Route path="/beneficiary/education" element={<BeneficiaryEducation />} />
        <Route path="/beneficiary/card" element={<BeneficiaryCard />} />
        
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
    </BrowserRouter>
  );
}

export default App;
