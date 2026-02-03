import { useStore } from '../../store/useStore';
import { ArrowLeft, Share2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';

export default function BeneficiaryCard() {
  const { currentUser, beneficiaries } = useStore();
  const navigate = useNavigate();
  const profile = beneficiaries.find(b => b.userId === currentUser?.id) || beneficiaries[0];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="p-4 flex items-center gap-3 text-white">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">My Digital ID</h1>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative">
          {/* Header */}
          <div className="bg-rose-600 p-6 text-white text-center relative">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} 
              alt="Profile" 
              className="w-24 h-24 rounded-full bg-white border-4 border-white mx-auto shadow-lg mb-3"
            />
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <p className="text-rose-100">ID: {profile.id.toUpperCase()}</p>
          </div>

          {/* QR Section */}
          <div className="p-8 flex flex-col items-center justify-center bg-white">
            <div className="p-4 bg-white rounded-xl shadow-lg border-2 border-slate-100">
              <QRCode 
                value={JSON.stringify({ id: profile.id, name: profile.name })} 
                size={200}
                level="H"
                fgColor="#e11d48"
              />
            </div>
            <p className="text-slate-500 text-sm mt-6 text-center px-4">
              Show this QR code to ASHA Didi or at the Hospital for quick check-up.
            </p>
          </div>

          {/* Details Grid */}
          <div className="bg-slate-50 p-6 grid grid-cols-2 gap-4 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500 uppercase">Risk Level</p>
              <span className={`inline-block px-2 py-1 rounded text-xs font-bold mt-1 ${
                profile.riskLevel === 'high' ? 'bg-red-100 text-red-700' : 
                profile.riskLevel === 'medium' ? 'bg-orange-100 text-orange-700' : 
                'bg-green-100 text-green-700'
              }`}>
                {profile.riskLevel.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Pregnancy</p>
              <p className="font-bold text-slate-800">{profile.pregnancyStage.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 w-full max-w-sm mt-6">
          <button className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 backdrop-blur-sm">
            <Share2 size={20} /> Share
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-900/50">
            <Download size={20} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
