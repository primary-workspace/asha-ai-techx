import { useState } from 'react';
import { Mic, X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { simulateHindiResponse } from '../services/ai';
import { clsx } from 'clsx';

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleMicClick = async () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsListening(true);
      // Simulate listening delay
      setTimeout(async () => {
        setIsListening(false);
        setIsSpeaking(true);
        const text = await simulateHindiResponse("My head hurts");
        setResponse(text);
        // Simulate speech duration
        setTimeout(() => setIsSpeaking(false), 3000);
      }, 2000);
    } else {
      // Reset
      setIsListening(true);
      setResponse(null);
      setTimeout(async () => {
        setIsListening(false);
        setIsSpeaking(true);
        const text = await simulateHindiResponse("Diet plan");
        setResponse(text);
        setTimeout(() => setIsSpeaking(false), 3000);
      }, 2000);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-4 left-4 md:left-auto md:w-80 bg-white rounded-2xl shadow-2xl p-6 border border-rose-100 z-50"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Asha" alt="Asha" className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Asha Didi</h3>
                  <p className="text-xs text-slate-500">AI Health Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="min-h-[100px] flex items-center justify-center text-center">
              {isListening ? (
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [10, 24, 10] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                      className="w-2 bg-rose-500 rounded-full"
                    />
                  ))}
                </div>
              ) : response ? (
                <p className="text-lg font-medium text-slate-700 leading-relaxed">
                  "{response}"
                </p>
              ) : (
                <p className="text-slate-400">Tap microphone to speak...</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleMicClick}
        className={clsx(
          "fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-xl flex items-center justify-center z-50 transition-colors",
          isSpeaking ? "bg-green-500 animate-pulse" : "bg-rose-600 hover:bg-rose-700"
        )}
      >
        {isSpeaking ? <Volume2 className="text-white w-8 h-8" /> : <Mic className="text-white w-8 h-8" />}
      </motion.button>
    </>
  );
}
