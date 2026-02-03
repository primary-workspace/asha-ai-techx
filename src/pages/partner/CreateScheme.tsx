import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useToast } from '../../store/useToast';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export default function CreateScheme() {
  const navigate = useNavigate();
  const addScheme = useStore(state => state.addScheme);
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    provider: 'Govt' as const,
    description: '',
    heroImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    benefits: [''],
    eligibilityCriteria: [''],
    budget: 100000,
    startDate: new Date().toISOString().split('T')[0],
    targetAudience: {
      pregnancyStage: [] as string[],
      economicStatus: [] as string[]
    }
  });

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData({ ...formData, benefits: newBenefits });
  };

  const addBenefitField = () => {
    setFormData({ ...formData, benefits: [...formData.benefits, ''] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addScheme({
        ...formData,
        status: 'active',
        targetAudience: {
          pregnancyStage: ['trimester_1', 'trimester_2', 'trimester_3'],
          economicStatus: ['bpl']
        }
      });
      
      addToast(t('common.success'), 'success');
      navigate('/partner/schemes');
    } catch (error) {
      console.error(error);
      addToast(t('common.error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => navigate('/partner/schemes')} className="p-2 hover:bg-slate-100 rounded-full">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">{t('partner.create_campaign')}</h1>
      </nav>

      <main className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="h-2 bg-slate-100">
            <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${(step / 2) * 100}%` }} />
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('partner.campaign_basics')}</h2>
                  <p className="text-slate-500">Set up the identity of your microsite.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('partner.campaign_title')}</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Matru Vandana Yojana 2.0"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('partner.description')}</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Describe the scheme..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hero Image URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      className="flex-1 p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                      value={formData.heroImage}
                      onChange={e => setFormData({...formData, heroImage: e.target.value})}
                    />
                    <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                      <img src={formData.heroImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('partner.budget')} (₹)</label>
                    <input 
                      type="number" 
                      className="w-full p-3 rounded-xl border border-slate-300"
                      value={formData.budget}
                      onChange={e => setFormData({...formData, budget: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('partner.start_date')}</label>
                    <input 
                      type="date" 
                      className="w-full p-3 rounded-xl border border-slate-300"
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                </div>

                <Button type="button" onClick={() => setStep(2)} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Next: {t('partner.benefits_rules')}
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('partner.benefits_rules')}</h2>
                  <p className="text-slate-500">Define what beneficiaries get and who is eligible.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Key Benefits</label>
                  {formData.benefits.map((benefit, idx) => (
                    <div key={idx} className="mb-2 flex gap-2">
                      <input 
                        type="text"
                        className="flex-1 p-3 rounded-xl border border-slate-300"
                        placeholder={`Benefit ${idx + 1}`}
                        value={benefit}
                        onChange={e => handleBenefitChange(idx, e.target.value)}
                      />
                    </div>
                  ))}
                  <button type="button" onClick={addBenefitField} className="text-sm text-indigo-600 font-bold hover:underline">
                    + Add Another Benefit
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('partner.target_audience')}</label>
                  <div className="flex flex-wrap gap-2">
                    {['BPL', 'Trimester 1', 'Trimester 2', 'Trimester 3', 'Anemia', 'High Risk'].map(tag => (
                      <label key={tag} className="inline-flex items-center px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm font-medium text-slate-700">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    {t('common.back')}
                  </Button>
                  <Button type="submit" isLoading={isSubmitting} className="flex-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> {t('partner.launch_scheme')}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
