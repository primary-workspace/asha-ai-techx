import { useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { simulateVoiceToText } from '../../services/ai';
import { clsx } from 'clsx';
import { runVoiceAgent } from "../../services/voiceAgent";

interface VoiceInputProps {
  beneficiaryId?: string; // optional for ASHA mode
  className?: string;
  label?: string;
}

export default function VoiceInput({
  beneficiaryId,
  className,
  label = 'Tap to Speak',
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleListen = async () => {
    if (isListening || isProcessing) return;

    setIsListening(true);

    setTimeout(async () => {
      setIsListening(false);
      setIsProcessing(true);

      // 1️⃣ Voice → Text
      const transcript = await simulateVoiceToText();

      // 2️⃣ Run Voice Agent
      const result = await runVoiceAgent({
        transcript,
        beneficiaryId,
      });

      // 3️⃣ Speak response
      if (result?.guidance) {
        const utterance = new SpeechSynthesisUtterance(result.guidance);
        utterance.lang = 'hi-IN';
        speechSynthesis.speak(utterance);
      }

      setIsProcessing(false);
    }, 2500);
  };

  return (
    <button
      type="button"
      onClick={handleListen}
      disabled={isListening || isProcessing}
      className={clsx(
        'relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all w-full',
        isListening
          ? 'bg-red-50 text-red-600 border-2 border-red-200'
          : isProcessing
          ? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-200'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
        className
      )}
    >
      {isListening ? (
        <>
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span>Listening...</span>
        </>
      ) : isProcessing ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <Mic className="w-5 h-5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
