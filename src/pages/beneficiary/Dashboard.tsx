import { useStore } from '../../store/useStore';
import VoiceAssistant from '../../components/VoiceAssistant';
import SOSButton from '../../components/SOSButton';
import { Pill, QrCode, Gift, Apple, BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { calculateCycleInsights } from '../../utils/healthCalculators';
import { useState } from 'react';

export default function BeneficiaryDashboard() {
  const { currentUser, beneficiaries } = useStore();
  const navigate = useNavigate();
  const [ifaTaken, setIfaTaken] = useState(false);
  
  const profile = beneficiaries.find(b => b.userId === currentUser?.id) || beneficiaries[0];
  const insights = calculateCycleInsights(profile.lastPeriodDate);

  const MenuCard = ({ title, icon: Icon, color, onClick, subtext }: any) => (
    <button 
      onClick={onClick}
      className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-left">
          <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
          <p className="text-xs text-slate-500 font-medium">{subtext}</p>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100">
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-rose-600 p-6 rounded-b-[2.5rem] shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">Namaste, {profile.name.split(' ')[0]}</h1>
                <p className="text-rose-100 text-sm">Stay Healthy, Stay Safe</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => navigate('/')} className="bg-white/20 text-white border-none hover:bg-white/30">Logout</Button>
          </div>

          {/* Main Insight Card */}
          <div className="bg-white text-slate-800 p-5 rounded-2xl shadow-lg flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Current Status</p>
              <h2 className="text-3xl font-bold text-rose-600 mt-1">
                {profile.pregnancyStage !== 'postpartum' ? `${insights.pregnancyWeek} Weeks` : 'Postpartum'}
              </h2>
              <p className="text-slate-600 text-sm font-medium mt-1">
                {profile.pregnancyStage !== 'postpartum' ? `Due: ${insights.edd}` : 'Recovery Mode'}
              </p>
            </div>
            <div className="h-16 w-16 rounded-full border-4 border-rose-100 flex items-center justify-center bg-rose-50">
               <span className="text-2xl">🤰</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* IFA Tablet Reminder */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Weekly Iron Tablet</h3>
              <p className="text-teal-100 text-sm">Did you take it today?</p>
            </div>
            <button 
              onClick={() => setIfaTaken(!ifaTaken)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${ifaTaken ? 'bg-white text-teal-600' : 'bg-black/20 text-white border-2 border-white/50'}`}
            >
              <Pill size={24} />
            </button>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 gap-4">
          <MenuCard 
            title="My Benefits" 
            subtext="Govt Schemes ( योजनाएं )"
            icon={Gift} 
            color="bg-indigo-500" 
            onClick={() => navigate('/beneficiary/schemes')} 
          />
          <MenuCard 
            title="Food Guide" 
            subtext="Nutrition ( पोषण )"
            icon={Apple} 
            color="bg-green-500" 
            onClick={() => navigate('/beneficiary/nutrition')} 
          />
          <MenuCard 
            title="Health Tips" 
            subtext="Education ( जानकारी )"
            icon={BookOpen} 
            color="bg-orange-500" 
            onClick={() => navigate('/beneficiary/education')} 
          />
           <MenuCard 
            title="My Digital Card" 
            subtext="Show to Doctor ( पहचान पत्र )"
            icon={QrCode} 
            color="bg-slate-700" 
            onClick={() => navigate('/beneficiary/card')} 
          />
        </div>

        {/* SOS Section */}
        <section className="pt-4">
          <h2 className="text-lg font-bold text-slate-800 mb-3 text-center">Emergency ( आपातकालीन )</h2>
          <SOSButton beneficiaryId={profile.id} />
        </section>
      </div>

      <VoiceAssistant />
    </div>
  );
}
