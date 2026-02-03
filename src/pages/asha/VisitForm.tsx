import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Save, ArrowLeft, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { simulateVoiceToText, simulateExtractMedicalData } from '../../services/ai';
import { useStore } from '../../store/useStore';
import { assessRisk } from '../../utils/riskAssessment';

export default function VisitForm() {
  const navigate = useNavigate();
  const addHealthLog = useStore(state => state.addHealthLog);
  
  const [step, setStep] = useState<'record' | 'review'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null);

  const handleRecord = async () => {
    setIsRecording(true);
    // Simulate recording time
    setTimeout(async () => {
      setIsRecording(false);
      setIsProcessing(true);
      
      const text = await simulateVoiceToText();
      setTranscription(text);
      
      const data = await simulateExtractMedicalData(text);
      setExtractedData(data);
      
      // Run Risk Assessment
      const risk = assessRisk(data.bpSystolic, data.bpDiastolic, data.symptoms, 'trimester_3');
      setRiskAnalysis(risk);
      
      setIsProcessing(false);
      setStep('review');
    }, 2000);
  };

  const handleSave = () => {
    if (extractedData) {
      addHealthLog({
        beneficiaryId: 'b1', // Hardcoded for demo
        date: new Date().toISOString(),
        ...extractedData
      });
      navigate('/asha');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white p-4 border-b flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="font-bold text-lg">New Visit Entry</h1>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        {step === 'record' ? (
          <div className="text-center w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Voice Entry</h2>
              <p className="text-slate-500">Tap the microphone and speak the patient details naturally.</p>
              <p className="text-xs text-slate-400 mt-2 bg-slate-100 inline-block px-3 py-1 rounded-full">
                Try saying: "BP is 150/100 and she has severe headache"
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

            {isRecording && <p className="text-red-500 font-medium animate-pulse">Listening...</p>}
            {isProcessing && <p className="text-teal-600 font-medium">Processing & Analyzing Risk...</p>}
          </div>
        ) : (
          <div className="w-full max-w-md space-y-6 pb-20">
            {/* Risk Alert Banner */}
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
                      {riskAnalysis.riskLevel.toUpperCase()} RISK DETECTED
                    </h3>
                    <p className="text-sm text-slate-700 mt-1">{riskAnalysis.summary}</p>
                    {riskAnalysis.referral && (
                      <div className="mt-2 bg-white/50 p-2 rounded text-sm font-bold">
                        Recommendation: Refer to {riskAnalysis.referral}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Auto Summary */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Auto-Generated Summary</h3>
              <p className="text-slate-800 italic">"{transcription}"</p>
            </div>

            {/* Extracted Data */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-lg font-bold text-teal-700 flex items-center gap-2">
                Vitals & Symptoms
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-500">BP (Systolic)</span>
                  <p className={`text-xl font-bold ${extractedData.bpSystolic > 140 ? 'text-red-600' : 'text-slate-900'}`}>
                    {isNaN(Number(extractedData.bpSystolic)) ? '-' : extractedData.bpSystolic}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-500">BP (Diastolic)</span>
                  <p className={`text-xl font-bold ${extractedData.bpDiastolic > 90 ? 'text-red-600' : 'text-slate-900'}`}>
                    {isNaN(Number(extractedData.bpDiastolic)) ? '-' : extractedData.bpDiastolic}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500">Symptoms</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {extractedData.symptoms.map((s: string) => (
                    <span key={s} className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-sm font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('record')}>Retry</Button>
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Confirm & Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
