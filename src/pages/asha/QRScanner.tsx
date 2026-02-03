import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ScanLine, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function QRScanner() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const { beneficiaries } = useStore();

  // Simulate scanning process
  useEffect(() => {
    const timer = setTimeout(() => {
      setScanning(false);
      // Simulate finding the first beneficiary for demo purposes
      // In real app, this would be the result of the QR scan
      navigate(`/asha/patient/${beneficiaries[0].id}`);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, beneficiaries]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-6 left-6 p-3 bg-white/20 rounded-full text-white hover:bg-white/30 z-20"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="relative w-72 h-72 border-2 border-white/30 rounded-3xl overflow-hidden">
        {/* Camera Feed Simulation */}
        <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
          <p className="text-white/50 text-sm">Camera Feed Active</p>
        </div>
        
        {/* Scanning Overlay */}
        <div className="absolute inset-0 border-[3px] border-teal-500 rounded-3xl z-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
        </div>
      </div>

      <div className="mt-8 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-teal-400">
          <ScanLine className="animate-pulse" />
          <span className="font-bold tracking-wider">SCANNING...</span>
        </div>
        <p className="text-white/60 text-sm">Align the QR code within the frame</p>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 1; }
          50% { top: 100%; opacity: 1; }
          51% { top: 100%; opacity: 0; }
          52% { top: 0; opacity: 0; }
          100% { top: 0; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
