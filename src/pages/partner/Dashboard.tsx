import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, LayoutGrid, FileText, Users } from 'lucide-react';

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { beneficiaries, alerts, schemes } = useStore();

  const riskData = [
    { name: 'High Risk', value: beneficiaries.filter(b => b.riskLevel === 'high').length },
    { name: 'Medium Risk', value: beneficiaries.filter(b => b.riskLevel === 'medium').length },
    { name: 'Low Risk', value: beneficiaries.filter(b => b.riskLevel === 'low').length },
  ];

  const COLORS = ['#ef4444', '#f97316', '#22c55e'];

  // Defensive calculation for total enrolled
  const totalEnrolled = schemes.reduce((acc, s) => {
    const count = Number(s.enrolledCount);
    return acc + (isNaN(count) ? 0 : count);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">G</div>
          <h1 className="text-xl font-bold text-slate-800">Govt<span className="text-indigo-600">Portal</span></h1>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/partner/schemes')}>Manage Schemes</Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>Logout</Button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 text-white flex justify-between items-center shadow-xl">
          <div>
            <h2 className="text-3xl font-bold mb-2">Campaign Manager</h2>
            <p className="text-indigo-100 max-w-xl">Launch targeted health schemes, monitor enrollment in real-time, and manage budgets efficiently.</p>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => navigate('/partner/schemes/create')} className="bg-white text-indigo-600 hover:bg-indigo-50 border-none">
                <Plus className="w-4 h-4 mr-2" /> Launch New Scheme
              </Button>
              <Button variant="outline" onClick={() => navigate('/partner/schemes')} className="text-white border-white hover:bg-white/10">
                View All Campaigns
              </Button>
            </div>
          </div>
          <div className="hidden md:block opacity-80">
            <LayoutGrid size={120} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Users size={20} /></div>
              <h3 className="text-slate-500 text-sm font-medium">Total Beneficiaries</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{beneficiaries.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><FileText size={20} /></div>
              <h3 className="text-slate-500 text-sm font-medium">Active Schemes</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{schemes.filter(s => s.status === 'active').length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg text-green-600"><Users size={20} /></div>
              <h3 className="text-slate-500 text-sm font-medium">Total Enrolled</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {totalEnrolled}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-50 rounded-lg text-red-600"><Users size={20} /></div>
              <h3 className="text-slate-500 text-sm font-medium">High Risk Cases</h3>
            </div>
            <p className="text-3xl font-bold text-red-600">{beneficiaries.filter(b => b.riskLevel === 'high').length}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px]">
            <h3 className="font-bold text-slate-800 mb-6">Population Health Risk</h3>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-sm text-slate-500">
              {riskData.map((entry, index) => (
                 <span key={entry.name} className="flex items-center gap-1">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div> 
                   {entry.name}
                 </span>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">Top Performing Schemes</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/partner/schemes')}>View All</Button>
            </div>
            <div className="space-y-4">
              {schemes.sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0)).slice(0, 4).map(scheme => (
                <div key={scheme.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => navigate(`/partner/schemes/${scheme.id}`)}>
                  <img src={scheme.heroImage} alt={scheme.title} className="w-16 h-12 object-cover rounded-lg" />
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-sm">{scheme.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{scheme.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">{isNaN(Number(scheme.enrolledCount)) ? 0 : scheme.enrolledCount}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Enrolled</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
