import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { User } from '../types';
import { UserCircle2, Stethoscope, Building2 } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const login = useStore(state => state.login);

  const handleLogin = (role: User['role']) => {
    login(role);
    if (role === 'beneficiary') navigate('/beneficiary');
    else if (role === 'asha_worker') navigate('/asha');
    else navigate('/partner');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-rose-100 rounded-full flex items-center justify-center mb-4">
            <Stethoscope className="h-10 w-10 text-rose-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">ASHA AI</h1>
          <p className="mt-2 text-slate-600">Maternal Health Companion for Rural India</p>
        </div>

        <div className="grid gap-4 mt-8">
          <button
            onClick={() => handleLogin('beneficiary')}
            className="flex items-center p-6 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-rose-500 transition-all group"
          >
            <div className="h-12 w-12 bg-rose-100 rounded-full flex items-center justify-center group-hover:bg-rose-600 transition-colors">
              <UserCircle2 className="h-6 w-6 text-rose-600 group-hover:text-white" />
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-lg font-bold text-slate-900">I am a Beneficiary</h3>
              <p className="text-sm text-slate-500">गर्भवती महिला (Pregnant Woman)</p>
            </div>
          </button>

          <button
            onClick={() => handleLogin('asha_worker')}
            className="flex items-center p-6 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-teal-500 transition-all group"
          >
            <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center group-hover:bg-teal-600 transition-colors">
              <Stethoscope className="h-6 w-6 text-teal-600 group-hover:text-white" />
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-lg font-bold text-slate-900">ASHA Worker</h3>
              <p className="text-sm text-slate-500">आशा कार्यकर्ता (Health Worker)</p>
            </div>
          </button>

          <button
            onClick={() => handleLogin('partner')}
            className="flex items-center p-6 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-indigo-500 transition-all group"
          >
            <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
              <Building2 className="h-6 w-6 text-indigo-600 group-hover:text-white" />
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-lg font-bold text-slate-900">Government / NGO</h3>
              <p className="text-sm text-slate-500">Dashboard & Analytics</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
