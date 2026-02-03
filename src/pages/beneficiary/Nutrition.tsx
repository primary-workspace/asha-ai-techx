import { ArrowLeft, Apple } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NUTRITION_ADVICE } from '../../data/healthContent';

export default function BeneficiaryNutrition() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-green-600 p-4 text-white sticky top-0 z-10 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Apple size={20} /> Nutrition ( पोषण )
        </h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-green-50 p-4 rounded-xl border border-green-200 mb-6">
          <p className="text-green-800 font-medium text-center">
            "Eat healthy, stay strong for your baby."
            <br/>
            "अच्छा खाएं, अपने बच्चे के लिए मजबूत रहें।"
          </p>
        </div>

        {NUTRITION_ADVICE.map((item) => (
          <div key={item.id} className={`p-6 rounded-2xl ${item.color} shadow-sm`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/60 rounded-full flex items-center justify-center">
                <item.icon size={24} />
              </div>
              <h2 className="text-xl font-bold">{item.title}</h2>
            </div>
            <ul className="space-y-3">
              {item.items.map((food, i) => (
                <li key={i} className="flex items-center gap-3 bg-white/40 p-3 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="font-medium text-lg">{food}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
