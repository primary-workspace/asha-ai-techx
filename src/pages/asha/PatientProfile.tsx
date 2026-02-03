import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ArrowLeft, Phone, MapPin, Calendar, AlertTriangle, FileText, Activity, Gift, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useState } from 'react';

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { beneficiaries, healthLogs, schemes, enrollments, enrollBeneficiary } = useStore();
  const [activeTab, setActiveTab] = useState<'history' | 'schemes'>('history');
  
  const patient = beneficiaries.find(b => b.id === id);
  const patientLogs = healthLogs.filter(l => l.beneficiaryId === id);

  if (!patient) return <div className="p-6">Patient not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-10 border-b shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/asha')} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h1 className="font-bold text-lg text-slate-800">Patient Profile</h1>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          patient.riskLevel === 'high' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {patient.riskLevel.toUpperCase()} RISK
        </div>
      </div>

      <main className="p-4 space-y-6">
        {/* Identity Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.name}`} 
            alt={patient.name} 
            className="w-16 h-16 rounded-full bg-slate-100"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
            <p className="text-slate-500 text-sm">ID: {patient.id.toUpperCase()}</p>
            <div className="flex items-center gap-4 mt-3">
              <button className="flex items-center gap-1 text-xs font-bold text-teal-600 bg-teal-50 px-3 py-2 rounded-lg">
                <Phone size={14} /> Call
              </button>
              <button className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
                <MapPin size={14} /> Locate
              </button>
            </div>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Pregnancy Stage</p>
            <p className="font-bold text-slate-800">{patient.pregnancyStage.replace('_', ' ')}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Next Checkup</p>
            <p className="font-bold text-rose-600">{new Date(patient.nextCheckup).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
           <Button onClick={() => navigate('/asha/visit')} className="bg-teal-600 hover:bg-teal-700">
             <Activity className="w-4 h-4 mr-2" />
             Log Visit
           </Button>
           <div className="flex bg-white rounded-xl border border-slate-200 p-1">
             <button 
               onClick={() => setActiveTab('history')}
               className={`flex-1 rounded-lg text-sm font-bold transition-colors ${activeTab === 'history' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
             >
               History
             </button>
             <button 
               onClick={() => setActiveTab('schemes')}
               className={`flex-1 rounded-lg text-sm font-bold transition-colors ${activeTab === 'schemes' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}
             >
               Schemes
             </button>
           </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'history' ? (
          <section>
            <h3 className="font-bold text-slate-800 mb-3">Visit History</h3>
            {patientLogs.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400 text-sm">No recent visits recorded.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {patientLogs.map(log => (
                  <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-400">{new Date(log.date).toLocaleDateString()}</span>
                      {log.isEmergency && <AlertTriangle size={14} className="text-red-500" />}
                    </div>
                    <p className="text-sm text-slate-700">
                      BP: <span className="font-bold">{log.bpSystolic}/{log.bpDiastolic}</span> • Mood: {log.mood}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {log.symptoms.map(s => (
                        <span key={s} className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section>
            <h3 className="font-bold text-slate-800 mb-3">Eligible Schemes</h3>
            <div className="space-y-3">
              {schemes.map(scheme => {
                const isEnrolled = enrollments.some(e => e.schemeId === scheme.id && e.beneficiaryId === patient.id);
                return (
                  <div key={scheme.id} className="bg-white p-4 rounded-xl border border-slate-100 flex gap-3">
                    <img src={scheme.heroImage} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm">{scheme.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mb-2">{scheme.description}</p>
                      
                      {isEnrolled ? (
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          <CheckCircle2 size={12} /> Enrolled
                        </div>
                      ) : (
                        <button 
                          onClick={() => enrollBeneficiary(scheme.id, patient.id, 'asha_worker')}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                        >
                          Enroll Patient
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
