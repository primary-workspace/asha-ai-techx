import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mic, Save, ArrowLeft, Loader2, AlertTriangle, Plus, X, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { simulateVoiceToText, simulateExtractMedicalData } from '../../services/ai';
import { useStore } from '../../store/useStore';
import { assessRisk } from '../../utils/riskAssessment';
import { useTranslation } from '../../hooks/useTranslation';

export default function VisitForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedId = searchParams.get('patientId');
  const { t } = useTranslation();
  const { addHealthLog, beneficiaries } = useStore();
  
  const [step, setStep] = useState<'record' | 'review'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null);
  const [newSymptom, setNewSymptom] = useState('');
  
  const [selectedPatientId, setSelectedPatientId] = useState(preSelectedId || '');

  const handleRecord = async () => {
    setIsRecording(true);
    setTimeout(async () => {
      setIsRecording(false);
      setIsProcessing(true);
      
      const text = await simulateVoiceToText();
      setTranscription(text);
      
      const data = await simulateExtractMedicalData(text);
      setExtractedData(data);
      
      const risk = assessRisk(data.bpSystolic, data.bpDiastolic, data.symptoms, 'trimester_3');
      setRiskAnalysis(risk);
      
      setIsProcessing(false);
      setStep('review');
    }, 2000);
  };

  const handleSave = () => {
    if (extractedData && selectedPatientId) {
      addHealthLog({
        beneficiaryId: selectedPatientId,
        date: new Date().toISOString(),
        ...extractedData
      });
      navigate('/asha');
    }
  };

  const addSymptom = () => {
    if (newSymptom.trim()) {
      setExtractedData({
        ...extractedData,
        symptoms: [...extractedData.symptoms, newSymptom.trim()]
      });
      setNewSymptom('');
    }
  };

  const removeSymptom = (symptom: string) => {
    setExtractedData({
      ...extractedData,
      symptoms: extractedData.symptoms.filter((s: string) => s !== symptom)
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white p-4 border-b flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="font-bold text-lg">{t('asha.new_visit')}</h1>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        {step === 'record' ? (
          <div className="text-center w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('asha.voice_entry')}</h2>
              <p className="text-slate-500">{t('asha.voice_inst')}</p>
              <p className="text-xs text-slate-400 mt-2 bg-slate-100 inline-block px-3 py-1 rounded-full">
                {t('asha.try_saying')}
              </p>
            </div>

            <button
              onClick={handleRecord}
              disabled={isRecording || isProcessing}
              className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 transition-all ${
                isRecording ? 'bg-red-500 animate-pulse shadow-red-200' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-200'
              } shadow-xl text-white`}
            >
              {isProcessing ? (
                <Loader2 className="w-12 h-12 animate-spin" />
              ) : (
                <Mic className="w-12 h-12" />
              )}
            </button>

            {isRecording && <p className="text-red-500 font-medium animate-pulse">{t('asha.listening')}</p>}
            {isProcessing && <p className="text-teal-600 font-medium">{t('asha.processing')}</p>}
          </div>
        ) : (
          <div className="w-full max-w-md space-y-6 pb-20">
            
            {/* Patient Selector (If not pre-selected) */}
            {!preSelectedId && (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Select Patient</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                  <select 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-teal-500 outline-none font-bold text-slate-800"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                  >
                    <option value="">-- Choose Patient --</option>
                    {beneficiaries.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.userType})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {riskAnalysis?.riskLevel !== 'low' && (
              <div className={`p-4 rounded-xl border-l-4 shadow-sm ${
                riskAnalysis.riskLevel === 'high' ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-6 h-6 shrink-0 ${
                    riskAnalysis.riskLevel === 'high' ? 'text-red-600' : 'text-orange-600'
                  }`} />
                  <div>
                    <h3 className={`font-bold ${
                      riskAnalysis.riskLevel === 'high' ? 'text-red-800' : 'text-orange-800'
                    }`}>
                      {t('asha.risk_detected')}
                    </h3>
                    <p className="text-sm text-slate-700 mt-1">{riskAnalysis.summary}</p>
                    {riskAnalysis.referral && (
                      <div className="mt-2 bg-white/50 p-2 rounded text-sm font-bold">
                        {t('asha.recommendation')}: {riskAnalysis.referral}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">{t('asha.auto_summary')}</h3>
              <p className="text-slate-800 italic">"{transcription}"</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-teal-700 flex items-center gap-2">
                  {t('asha.vitals')}
                </h3>
                <span className="text-xs text-slate-400 font-bold uppercase">Editable</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all">
                  <span className="text-xs text-slate-500 font-bold uppercase">BP (Systolic)</span>
                  <input 
                    type="number" 
                    className={`w-full bg-transparent font-bold text-2xl outline-none ${extractedData.bpSystolic > 140 ? 'text-red-600' : 'text-slate-900'}`}
                    value={extractedData.bpSystolic}
                    onChange={(e) => setExtractedData({...extractedData, bpSystolic: Number(e.target.value)})}
                  />
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all">
                  <span className="text-xs text-slate-500 font-bold uppercase">BP (Diastolic)</span>
                  <input 
                    type="number" 
                    className={`w-full bg-transparent font-bold text-2xl outline-none ${extractedData.bpDiastolic > 90 ? 'text-red-600' : 'text-slate-900'}`}
                    value={extractedData.bpDiastolic}
                    onChange={(e) => setExtractedData({...extractedData, bpDiastolic: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-bold uppercase">{t('tracker.symptoms')}</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {extractedData.symptoms.map((s: string) => (
                    <span key={s} className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-sm font-medium flex items-center gap-2 border border-rose-100">
                      {s}
                      <button onClick={() => removeSymptom(s)} className="hover:bg-rose-200 rounded-full p-0.5">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-2 w-full mt-2">
                    <input 
                      type="text" 
                      placeholder="Add symptom..." 
                      className="flex-1 p-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                      value={newSymptom}
                      onChange={(e) => setNewSymptom(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                    />
                    <button 
                      onClick={addSymptom}
                      className="p-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('record')}>{t('common.retry')}</Button>
              <Button 
                className="flex-1 bg-teal-600 hover:bg-teal-700" 
                onClick={handleSave}
                disabled={!selectedPatientId}
              >
                <Save className="w-4 h-4 mr-2" />
                {t('asha.confirm_save')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
