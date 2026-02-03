import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Search, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';

export default function SchemesList() {
  const navigate = useNavigate();
  const { schemes, deleteScheme } = useStore();
  const [filter, setFilter] = useState('all');

  const filteredSchemes = schemes.filter(s => filter === 'all' || s.status === filter);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => navigate('/partner')} className="p-2 hover:bg-slate-100 rounded-full">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Manage Schemes</h1>
        <div className="flex-1" />
        <Button onClick={() => navigate('/partner/schemes/create')} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> Launch New Scheme
        </Button>
      </nav>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'active', 'draft', 'closed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                filter === status 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map(scheme => (
            <div key={scheme.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="h-48 overflow-hidden relative">
                <img src={scheme.heroImage} alt={scheme.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase backdrop-blur-md ${
                    scheme.status === 'active' ? 'bg-green-500/90 text-white' : 'bg-slate-500/90 text-white'
                  }`}>
                    {scheme.status}
                  </span>
                </div>
              </div>
              
              <div className="p-5">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{scheme.title}</h3>
                  <p className="text-slate-500 text-sm line-clamp-2 mt-1">{scheme.description}</p>
                </div>

                <div className="flex justify-between items-center text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                  <div>
                    <p className="font-bold text-indigo-600">{isNaN(Number(scheme.enrolledCount)) ? 0 : scheme.enrolledCount}</p>
                    <p className="text-xs">Enrolled</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₹{((scheme.budget || 0) / 100000).toFixed(1)}L</p>
                    <p className="text-xs">Budget</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(`/partner/schemes/${scheme.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" /> Dashboard
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => {
                      if(confirm('Are you sure you want to delete this scheme?')) deleteScheme(scheme.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
