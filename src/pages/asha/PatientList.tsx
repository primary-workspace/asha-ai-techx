import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ChevronRight, User, Baby, UserPlus, Flower2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

export default function PatientList() {
  const { beneficiaries } = useStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = beneficiaries.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const getPatientIcon = (type: string) => {
    switch (type) {
      case 'mother': return <Baby size={20} />;
      case 'pregnant': return <UserPlus size={20} />;
      case 'girl': return <Flower2 size={20} />;
      default: return <User size={20} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white sticky top-0 z-10 border-b shadow-sm">
        <div className="p-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h1 className="font-bold text-lg text-slate-800">{t('asha.patients_total')} ({beneficiaries.length})</h1>
        </div>
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder={t('common.search')}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl border-none focus:ring-2 focus:ring-teal-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {filtered.map(patient => (
          <div 
            key={patient.id} 
            onClick={() => navigate(`/asha/patient/${patient.id}`)}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-sm ${
                patient.riskLevel === 'high' ? 'bg-red-500' : 
                patient.riskLevel === 'medium' ? 'bg-orange-500' : 
                'bg-green-500'
              }`}>
                {getPatientIcon(patient.userType)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{patient.name}</h3>
                <p className="text-sm text-slate-500 capitalize flex items-center gap-1">
                  {patient.pregnancyStage ? patient.pregnancyStage.replace('_', ' ') : patient.userType}
                </p>
              </div>
            </div>
            <ChevronRight className="text-slate-300" />
          </div>
        ))}
      </div>
    </div>
  );
}
