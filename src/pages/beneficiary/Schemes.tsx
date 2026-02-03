import { useStore } from '../../store/useStore';
import SchemeCard from '../../components/beneficiary/SchemeCard';
import { ArrowLeft, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BeneficiarySchemes() {
  const { currentUser, beneficiaries, schemes, enrollments, enrollBeneficiary } = useStore();
  const navigate = useNavigate();
  
  const profile = beneficiaries.find(b => b.userId === currentUser?.id) || beneficiaries[0];
  const mySchemes = schemes.filter(s => s.status === 'active');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-indigo-600 p-4 text-white sticky top-0 z-10 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Gift size={20} /> My Benefits ( योजनाएं )
        </h1>
      </div>

      <div className="p-4 space-y-4">
        {mySchemes.map(scheme => {
          const isEnrolled = enrollments.some(e => e.schemeId === scheme.id && e.beneficiaryId === profile.id);
          return (
            <div key={scheme.id} className="h-full">
              <SchemeCard 
                scheme={scheme} 
                isEnrolled={isEnrolled}
                onEnroll={() => enrollBeneficiary(scheme.id, profile.id, profile.userId)}
              />
            </div>
          );
        })}
        {mySchemes.length === 0 && (
          <div className="text-center p-8 text-slate-500">
            No active schemes available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}
