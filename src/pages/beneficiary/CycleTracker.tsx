import React, { useState } from 'react';
import { 
  ChevronLeft, 
  MoreHorizontal, 
  Droplet, 
  Calendar as CalendarIcon, 
  Home, 
  Activity, 
  FileText, 
  User,
  Plus,
  Flower2,
  Circle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- Types & Mock Data ---

interface CycleData {
  id: string;
  startDate: string;
  endDate: string;
  year: string;
  length: number;
  periodLength: number;
  fertileStartDay: number; // Day index relative to start
  fertileEndDay: number;
  ovulationDay: number;
}

const MOCK_CYCLES: CycleData[] = [
  { 
    id: '1', 
    startDate: 'Aug 16', 
    endDate: 'Aug 19', 
    year: '2024', 
    length: 28, 
    periodLength: 4, 
    fertileStartDay: 10,
    fertileEndDay: 15,
    ovulationDay: 14
  },
  { 
    id: '2', 
    startDate: 'Jul 18', 
    endDate: 'Jul 22', 
    year: '2024', 
    length: 29, 
    periodLength: 5, 
    fertileStartDay: 11,
    fertileEndDay: 16,
    ovulationDay: 15
  },
  { 
    id: '3', 
    startDate: 'Jun 22', 
    endDate: 'Jun 25', 
    year: '2024', 
    length: 26, 
    periodLength: 4, 
    fertileStartDay: 9,
    fertileEndDay: 14,
    ovulationDay: 13
  },
  { 
    id: '4', 
    startDate: 'May 23', 
    endDate: 'May 28', 
    year: '2024', 
    length: 30, 
    periodLength: 6, 
    fertileStartDay: 12,
    fertileEndDay: 17,
    ovulationDay: 16
  },
  { 
    id: '5', 
    startDate: 'Apr 24', 
    endDate: 'Apr 28', 
    year: '2024', 
    length: 29, 
    periodLength: 5, 
    fertileStartDay: 11,
    fertileEndDay: 16,
    ovulationDay: 15
  },
];

// --- Components ---

const Header = () => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between p-4 bg-white sticky top-0 z-20">
      <button 
        onClick={() => navigate(-1)}
        className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
      >
        <ChevronLeft className="w-6 h-6 text-slate-800" />
      </button>
      <h1 className="text-lg font-bold text-slate-900">My Cycles</h1>
      <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all">
        <MoreHorizontal className="w-6 h-6 text-slate-800" />
      </button>
    </div>
  );
};

const StatCard = ({ 
  value, 
  label, 
  icon: Icon, 
  iconColor, 
  iconBg
}: { 
  value: string; 
  label: string; 
  icon: React.ElementType; 
  iconColor: string; 
  iconBg: string;
}) => (
  <div className="flex-1 bg-white p-5 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col items-center text-center">
    <h3 className="text-2xl font-extrabold text-slate-900 mb-1">{value}</h3>
    <p className="text-xs font-medium text-slate-400 mb-4">{label}</p>
    <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>
      <Icon className={`w-6 h-6 ${iconColor} fill-current`} />
    </div>
  </div>
);

const TimelineBar = ({ cycle }: { cycle: CycleData }) => {
  // Visual calculation based on a fixed width assumption
  // Total width represents roughly 30 days
  const totalDays = 30;
  
  const getPercent = (days: number) => (days / totalDays) * 100;

  return (
    <div className="relative w-full h-2.5 bg-slate-100 rounded-full mt-4 overflow-visible">
      {/* Period Segment (Pink) */}
      <div 
        className="absolute top-0 left-0 h-full bg-[#FF4D67] rounded-full z-10"
        style={{ width: `${getPercent(cycle.periodLength)}%` }}
      />

      {/* Fertile Segment (Yellow) */}
      <div 
        className="absolute top-0 h-full bg-[#FFC107] rounded-full z-0"
        style={{ 
          left: `${getPercent(cycle.fertileStartDay)}%`,
          width: `${getPercent(cycle.fertileEndDay - cycle.fertileStartDay)}%`
        }}
      />

      {/* Ovulation Dot (Purple) */}
      <div 
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#7C3AED] border-2 border-white rounded-full z-20 shadow-sm"
        style={{ left: `${getPercent(cycle.ovulationDay)}%` }}
      />
    </div>
  );
};

const CycleListItem = ({ cycle }: { cycle: CycleData }) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mb-4 active:scale-[0.99] transition-transform">
    <div className="flex justify-between items-start">
      <div>
        <h4 className="font-bold text-slate-900 text-sm">
          {cycle.startDate} - {cycle.endDate}, {cycle.year}
        </h4>
      </div>
      <div className="text-right">
        <span className="text-lg font-bold text-slate-900">{cycle.length}</span>
      </div>
    </div>
    
    <TimelineBar cycle={cycle} />
  </div>
);

const LegendItem = ({ label, color, type = 'dot' }: { label: string, color: string, type?: 'pill' | 'dot' }) => {
  if (type === 'pill') {
    return (
      <span className={`px-4 py-1.5 rounded-full text-xs font-bold text-white ${color} shadow-md shadow-rose-200`}>
        {label}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-medium text-slate-500">{label}</span>
    </div>
  );
};

const BottomNavItem = ({ icon: Icon, label, active }: { icon: React.ElementType; label: string; active?: boolean }) => (
  <button className="flex flex-col items-center justify-center w-full py-1 space-y-1 group">
    <Icon 
      className={`w-6 h-6 transition-colors ${active ? 'text-[#FF4D67] fill-current' : 'text-slate-300 group-hover:text-slate-400'}`} 
      strokeWidth={active ? 0 : 2}
    />
    <span className={`text-[10px] font-bold ${active ? 'text-[#FF4D67]' : 'text-slate-300 group-hover:text-slate-400'}`}>
      {label}
    </span>
  </button>
);

// --- Main Screen ---

export default function CycleTrackerScreen() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-28 font-sans max-w-md mx-auto relative shadow-2xl overflow-hidden">
      <Header />

      <div className="px-6 space-y-8 mt-2">
        {/* Stats Row */}
        <div className="flex gap-4">
          <StatCard 
            value="4 days" 
            label="Average period" 
            icon={Droplet} 
            iconColor="text-[#FF4D67]" 
            iconBg="bg-[#FFF0F3]" 
          />
          <StatCard 
            value="28 days" 
            label="Average cycle" 
            icon={CalendarIcon} 
            iconColor="text-[#7C3AED]" 
            iconBg="bg-[#F3E8FF]" 
          />
        </div>

        {/* Edit Button */}
        <button className="w-full bg-[#FF4D67] hover:bg-[#E11D48] active:scale-[0.98] text-white font-bold py-4 rounded-full shadow-[0_10px_20px_rgba(255,77,103,0.3)] transition-all">
          Edit Period
        </button>

        {/* History Section */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">History</h2>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
            <LegendItem label="All" color="bg-[#FF4D67]" type="pill" />
            <LegendItem label="Period" color="bg-[#FF4D67]" />
            <LegendItem label="Ovulation" color="bg-[#7C3AED]" />
            <LegendItem label="Fertile" color="bg-[#FFC107]" />
          </div>

          {/* List */}
          <div className="space-y-1">
            {MOCK_CYCLES.map((cycle) => (
              <CycleListItem key={cycle.id} cycle={cycle} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-3 flex justify-around items-center z-50 max-w-md mx-auto rounded-t-[2rem] shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
        <BottomNavItem icon={Home} label="Home" />
        <BottomNavItem icon={CalendarIcon} label="Calendar" />
        <BottomNavItem icon={Activity} label="Tracker" active />
        <BottomNavItem icon={FileText} label="Articles" />
        <BottomNavItem icon={User} label="Account" />
      </div>
    </div>
  );
}
