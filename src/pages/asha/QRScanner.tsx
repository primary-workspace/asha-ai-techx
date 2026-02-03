import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ScanLine, AlertCircle, Search } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useToast } from '../../store/useToast';

export default function QRScanner() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');

  useEffect(() => {
    // Initialize Scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        showTorchButtonIfSupported: true
      },
      /* verbose= */ false
    );
    
    scannerRef.current = scanner;

    const onScanSuccess = (decodedText: string) => {
      try {
        // Attempt to parse our JSON format: { "id": "...", "name": "..." }
        const data = JSON.parse(decodedText);
        
        if (data.id) {
          scanner.clear(); // Stop scanning
          addToast(`Found patient: ${data.name}`, 'success');
          navigate(`/asha/patient/${data.id}`);
        } else {
          throw new Error("Invalid QR Code");
        }
      } catch (e) {
        // Handle raw IDs or invalid formats
        // If it's just a UUID string, try to use it directly
        if (decodedText.length > 10) { // Basic length check for UUID
           scanner.clear();
           navigate(`/asha/patient/${decodedText}`);
        } else {
           console.warn("Scan error:", e);
           // Don't toast on every frame error, only on valid-looking but wrong data
        }
      }
    };

    const onScanFailure = (error: any) => {
      // This fires continuously when no QR is found, so we usually ignore it
      // console.warn(`Code scan error = ${error}`);
    };

    scanner.render(onScanSuccess, onScanFailure);

    // Cleanup
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear scanner", error);
        });
      }
    };
  }, [navigate, addToast]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      navigate(`/asha/patient/${manualId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white font-bold text-lg tracking-wider">SCAN PATIENT CARD</h1>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-black rounded-3xl overflow-hidden relative">
          <div id="reader" className="w-full h-full"></div>
          
          {/* Custom Overlay Styling for html5-qrcode */}
          <style>{`
            #reader { border: none !important; }
            #reader__scan_region { background: transparent !important; }
            #reader__dashboard_section_csr span { display: none !important; } 
            #reader__dashboard_section_swaplink { color: white !important; text-decoration: underline; }
            #reader select { 
              background: white; color: black; padding: 8px; border-radius: 8px; margin-bottom: 10px; 
            }
          `}</style>
        </div>

        <div className="mt-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-teal-400">
            <ScanLine className="animate-pulse" />
            <span className="font-bold tracking-wider">CAMERA ACTIVE</span>
          </div>
          <p className="text-white/60 text-sm">Point camera at the beneficiary's QR code</p>
        </div>

        {/* Manual Fallback */}
        <div className="w-full max-w-xs mt-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px bg-white/20 flex-1" />
            <span className="text-white/40 text-xs uppercase font-bold">Or enter ID</span>
            <div className="h-px bg-white/20 flex-1" />
          </div>
          <form onSubmit={handleManualSubmit} className="relative">
            <input 
              type="text" 
              placeholder="Enter Patient ID..."
              className="w-full pl-4 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-teal-500 transition-colors"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Search size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
