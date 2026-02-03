import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { MapPin, AlertCircle, Mic, QrCode, CalendarClock, ChevronRight, Users, ClipboardList } from 'lucide-react';

export default function AshaDashboard() {
  const { beneficiaries, alerts } = useStore();
  const navigate = useNavigate();

  // Filter high risk
  const highRiskPatients = beneficiaries.filter(b => b.riskLevel === 'high' || b.riskLevel === 'medium');
  const activeAlerts = alerts.filter(a => a.status === 'open');

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-teal-700 text-white p-6 sticky top-0 z-10 rounded-b-[2rem] shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">ASHA Dashboard</h1>
            <p className="text-teal-200 text-sm">Sector 4, Village Rampur</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/')} className="bg-teal-800 text-white border-none">Exit</Button>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/asha/visit')}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 p-4 rounded-xl backdrop-blur-sm transition-all border border-white/10"
          >
            <Mic className="w-5 h-5 text-teal-200" />
            <span className="font-bold">Log Visit</span>
          </button>
          <button 
            onClick={() => navigate('/asha/scan')}
            className="flex items-center justify-center gap-2 bg-white text-teal-800 p-4 rounded-xl shadow-lg hover:bg-teal-50 transition-all font-bold"
          >
            <QrCode className="w-5 h-5" />
            <span>Scan Card</span>
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6 -mt-2">
        {/* Stats Row */}
        <div className="flex gap-4 overflow-x-auto pb-2 px-2">
          <button onClick={() => navigate('/asha/patients')} className="bg-white p-4 rounded-xl shadow-sm min-w-[140px] border border-slate-100 text-left hover:bg-slate-50 transition-colors">
            <Users className="w-5 h-5 text-teal-600 mb-2" />
            <p className="text-3xl font-bold text-slate-800">{beneficiaries.length}</p>
            <p className="text-xs text-slate-500 uppercase font-bold mt-1">Total Patients</p>
          </button>
          <button onClick={() => navigate('/asha/alerts')} className="bg-white p-4 rounded-xl shadow-sm min-w-[140px] border border-slate-100 text-left hover:bg-slate-50 transition-colors">
            <AlertCircle className="w-5 h-5 text-red-600 mb-2" />
            <p className="text-3xl font-bold text-red-600">{activeAlerts.length}</p>
            <p className="text-xs text-slate-500 uppercase font-bold mt-1">Active Alerts</p>
          </button>
        </div>

        {/* Critical Alerts Preview */}
        {activeAlerts.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-3 px-2">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle className="text-red-600 w-5 h-5" />
                Critical Alerts
              </h2>
              <button onClick={() => navigate('/asha/alerts')} className="text-xs font-bold text-teal-600 uppercase">View All</button>
            </div>
            <div className="space-y-3">
              {activeAlerts.slice(0, 2).map(alert => {
                const patient = beneficiaries.find(b => b.id === alert.beneficiaryId);
                return (
                  <div key={alert.id} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-red-900">{patient?.name || 'Unknown'}</h3>
                        <p className="text-sm text-red-700 mt-1">SOS Triggered • {new Date(alert.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <Button size="sm" variant="danger" onClick={() => navigate('/asha/alerts')}>View</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tasks / Follow Ups */}
        <section>
          <div className="flex justify-between items-center mb-3 px-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-teal-600" />
              Follow-Ups Due
            </h2>
             <button onClick={() => navigate('/asha/patients')} className="text-xs font-bold text-teal-600 uppercase">View All</button>
          </div>
          
          <div className="space-y-3">
            {highRiskPatients.slice(0, 3).map(patient => (
              <div 
                key={patient.id} 
                onClick={() => navigate(`/asha/patient/${patient.id}`)}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center active:scale-[0.98] transition-transform"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{patient.name}</h3>
                    {patient.riskLevel === 'high' && (
                      <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold">HIGH RISK</span>
                    )}
                  </div>
                  <div className="flex items-center text-slate-500 text-sm mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>Sector 4 • Due Today</span>
                  </div>
                </div>
                <ChevronRight className="text-slate-300" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
