import { ArrowLeft, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EDUCATION_TOPICS } from '../../data/healthContent';
import EducationCard from '../../components/beneficiary/EducationCard';

export default function BeneficiaryEducation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-orange-500 p-4 text-white sticky top-0 z-10 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BookOpen size={20} /> Health Guide ( जानकारी )
        </h1>
      </div>

      <div className="p-4">
        <p className="text-slate-600 mb-6 text-center">
          Tap on any card to learn more.
          <br/>
          अधिक जानने के लिए किसी भी कार्ड पर टैप करें।
        </p>
        
        <div className="grid grid-cols-1 gap-4">
          {EDUCATION_TOPICS.map((topic) => (
            <EducationCard key={topic.id} topic={topic} />
          ))}
        </div>
      </div>
    </div>
  );
}
