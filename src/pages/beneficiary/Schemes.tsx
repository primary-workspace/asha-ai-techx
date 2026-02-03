import { useStore } from '../../store/useStore';
import { ArrowLeft, Search, ArrowUpRight, CheckCircle2, XCircle, AlertCircle, Info, Syringe, Baby } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Scheme, BeneficiaryProfile } from '../../types';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';

export default function BeneficiarySchemes() {
  const { schemes, currentUser, beneficiaries } = useStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'financial' | 'nutrition'>('all');
  const [checkingScheme, setCheckScheme] = useState<Scheme | null>(null);
  
  const profile = beneficiaries.find(b => b.userId === currentUser?.id);

  const relevantSchemes = schemes.filter(s => {
    if (s.status !== 'active') return false;
    if (filter !== 'all' && s.category !== filter) return false;
    if (!profile) return true;

    const audience = s.targetAudience || {};
    if (audience.pregnancyStage && audience.pregnancyStage.length > 0) {
      if (profile.userType === 'girl') return false;
      if (profile.userType === 'pregnant' && !audience.pregnancyStage.some(stage => stage.includes('trimester'))) {
         if (audience.pregnancyStage.every(stage => stage === 'postpartum')) return false;
      }
      if (profile.userType === 'mother' && !audience.pregnancyStage.includes('postpartum')) {
         return false;
      }
    }
    return true;
  });

  const checkEligibility = (scheme: Scheme, userProfile: BeneficiaryProfile) => {
    const criteria = [];
    let isEligible = true;
    const fmt = (s: string) => s.replace('_', ' ').toUpperCase();

    if (scheme.targetAudience?.economicStatus?.length) {
      const userEco = userProfile.economicStatus || 'apl';
      const met = scheme.targetAudience.economicStatus.includes(userEco);
      
      criteria.push({
        label: 'Economic Status',
        required: scheme.targetAudience.economicStatus.join(' / ').toUpperCase(),
        actual: userEco.toUpperCase(),
        met
      });
      if (!met) isEligible = false;
    }

    if (scheme.targetAudience?.pregnancyStage?.length) {
      let userStage = userProfile.pregnancyStage as string;
      if (userProfile.userType === 'mother') userStage = 'postpartum';
      
      const met = userStage 
        ? scheme.targetAudience.pregnancyStage.includes(userStage)
        : (userProfile.userType === 'pregnant' && scheme.targetAudience.pregnancyStage.some(s => s.includes('trimester')));

      criteria.push({
        label: 'Life Stage',
        required: scheme.targetAudience.pregnancyStage.map(s => fmt(s)).join(', '),
        actual: userStage ? fmt(userStage) : fmt(userProfile.userType),
        met
      });
      if (!met) isEligible = false;
    }

    if (scheme.targetAudience?.riskLevel?.length) {
      const userRisk = userProfile.riskLevel || 'low';
      const met = scheme.targetAudience.riskLevel.includes(userRisk);
      
      criteria.push({
        label: 'Health Risk',
        required: scheme.targetAudience.riskLevel.map(s => fmt(s)).join(', '),
        actual: fmt(userRisk),
        met
      });
      if (!met) isEligible = false;
    }

    return { isEligible, criteria };
  };

  const SchemeCard = ({ scheme }: { scheme: Scheme }) => {
    const eligibility = profile ? checkEligibility(scheme, profile) : { isEligible: false, criteria: [] };
    
    return (
      <div 
        onClick={() => setCheckScheme(scheme)}
        className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 group hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
      >
        <div className="w-full md:w-32 h-32 rounded-[2rem] bg-slate-50 shrink-0 overflow-hidden relative">
           <img src={scheme.heroImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
           <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
        </div>
  
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
             <div>
               <div className="flex gap-2 mb-2">
                 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                   scheme.category === 'financial' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                 }`}>
                   {scheme.category}
                 </span>
                 {profile && (
                   <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1 ${
                     eligibility.isEligible ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
                   }`}>
                     {eligibility.isEligible ? <CheckCircle2 size={10} /> : <Info size={10} />}
                     {eligibility.isEligible ? t('schemes.eligible') : t('schemes.check_criteria')}
                   </span>
                 )}
               </div>
               <h3 className="text-xl font-bold text-slate-900 leading-tight">{scheme.title}</h3>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
               <ArrowUpRight size={20} />
             </div>
          </div>
          <p className="text-slate-500 font-medium text-sm line-clamp-2 mb-4">
            {scheme.description}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {(scheme.benefits || []).slice(0, 2).map((benefit, i) => (
               <div key={i} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full">
                 <CheckCircle2 size={12} className="text-teal-500" /> {benefit}
               </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white p-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft size={24} className="text-slate-800" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">{t('schemes.title')}</h1>
        </div>
        <button className="p-2 hover:bg-slate-100 rounded-full">
          <Search size={24} className="text-slate-800" />
        </button>
      </div>

      <div className="p-6 max-w-3xl mx-auto space-y-8">
        
        <div className="bg-[#E0E7FF] p-8 rounded-[2.5rem] relative overflow-hidden shadow-sm">
          <div className="relative z-10 max-w-xs">
            <p className="text-xs font-bold tracking-widest opacity-60 uppercase mb-3">{t('schemes.featured')}</p>
            <h2 className="text-3xl font-black text-slate-900 mb-4 leading-tight">
              {t('schemes.hero_title')}
            </h2>
            <p className="text-slate-700 font-medium mb-6">
              {t('schemes.hero_desc')}
            </p>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold text-sm hover:bg-indigo-700 transition-colors">
              {t('schemes.browse')}
            </button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {['all', 'financial', 'nutrition'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t as any)}
              className={`px-6 py-3 rounded-full text-sm font-bold capitalize transition-all whitespace-nowrap ${
                filter === t 
                  ? 'bg-black text-white shadow-md' 
                  : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {relevantSchemes.length > 0 ? (
            relevantSchemes.map(scheme => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 font-medium">No active schemes found.</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 px-2">Health Tools</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-[#CCFBF1] p-6 rounded-[2rem] text-left hover:scale-[1.02] transition-transform">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-teal-600 mb-3">
                <Syringe size={20} />
              </div>
              <h4 className="font-bold text-slate-900">Vaccine Tracker</h4>
              <p className="text-xs text-slate-600 font-medium mt-1">Upcoming shots</p>
            </button>
            <button className="bg-[#FEF3C7] p-6 rounded-[2rem] text-left hover:scale-[1.02] transition-transform">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-amber-500 mb-3">
                <Baby size={20} />
              </div>
              <h4 className="font-bold text-slate-900">Growth Monitor</h4>
              <p className="text-xs text-slate-600 font-medium mt-1">Baby's progress</p>
            </button>
          </div>
        </div>

      </div>

      <AnimatePresence>
        {checkingScheme && profile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{checkingScheme.title}</h2>
                  <p className="text-slate-400 text-sm mt-1">Eligibility Check</p>
                </div>
                <button 
                  onClick={() => setCheckScheme(null)}
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {(() => {
                  const { isEligible, criteria } = checkEligibility(checkingScheme, profile);
                  return (
                    <>
                      <div className={`p-4 rounded-xl flex items-center gap-3 mb-6 ${
                        isEligible ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                      }`}>
                        {isEligible ? (
                          <CheckCircle2 className="w-8 h-8 text-green-600" />
                        ) : (
                          <AlertCircle className="w-8 h-8 text-red-600" />
                        )}
                        <div>
                          <h3 className={`font-bold ${isEligible ? 'text-green-800' : 'text-red-800'}`}>
                            {isEligible ? t('schemes.eligible') : t('schemes.not_eligible')}
                          </h3>
                          <p className={`text-xs ${isEligible ? 'text-green-600' : 'text-red-600'}`}>
                            {isEligible ? 'You meet all the criteria.' : 'Review the missing criteria below.'}
                          </p>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('schemes.criteria_checklist')}</h3>
                      
                      <div className="space-y-3">
                        {criteria.map((c, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            {c.met ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-800">{c.label}</p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-slate-500">{t('schemes.required')}: {c.required}</span>
                                <span className={`text-xs font-bold ${c.met ? 'text-green-600' : 'text-red-500'}`}>
                                  {t('schemes.you')}: {c.actual}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8">
                        {isEligible ? (
                          <button className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg shadow-green-200">
                            {t('schemes.apply')}
                          </button>
                        ) : (
                          <button 
                            onClick={() => navigate('/beneficiary/card')}
                            className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-lg hover:bg-slate-200"
                          >
                            {t('dash.update')}
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
