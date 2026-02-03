import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Gift, User, Mic, Users, ScanLine, 
  AlertCircle, LayoutGrid, FileText, LogOut, Activity, ChevronLeft, Volume2
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { LanguageToggle } from '../ui/LanguageToggle'; // Updated Import
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import VoiceAssistant from '../VoiceAssistant';
import { useTranslation } from '../../hooks/useTranslation'; // Import Translation Hook

interface RoleLayoutProps {
  children: ReactNode;
  role: 'beneficiary' | 'asha_worker' | 'partner';
  title?: string;
  showBack?: boolean;
  hideHeader?: boolean;
}

export function RoleLayout({ children, role, title, hideHeader = false }: RoleLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser } = useStore();
  const { t } = useTranslation(); // Use Hook

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isRoot = 
    location.pathname === '/beneficiary' || 
    location.pathname === '/asha' || 
    location.pathname === '/partner';

  const showBack = !isRoot;

  const NavItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => {
    const isActive = location.pathname === path;
    return (
      <button
        onClick={() => navigate(path)}
        className={clsx(
          "flex flex-col items-center justify-center w-full py-2 space-y-1 transition-all duration-300 relative",
          isActive ? "text-rose-600" : "text-slate-400"
        )}
      >
        <div className={clsx("p-1 rounded-xl transition-all", isActive && "bg-rose-50")}>
          <Icon 
            className={clsx("w-6 h-6", isActive && "fill-current")} 
            strokeWidth={isActive ? 0 : 2}
          />
        </div>
        <span className={clsx("text-[10px] font-bold", isActive ? "opacity-100" : "opacity-0")}>{label}</span>
      </button>
    );
  };

  const BeneficiaryNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-2 flex justify-between items-center z-40 shadow-[0_-5px_30px_rgba(0,0,0,0.02)] pb-safe">
      <NavItem icon={Home} label={t('nav.home')} path="/beneficiary" />
      <NavItem icon={Activity} label={t('nav.tracker')} path="/beneficiary/tracker" />
      <div className="relative -top-6">
        <VoiceAssistant customTrigger={(onClick, isSpeaking) => (
           <button 
             onClick={onClick}
             className={clsx(
               "w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-white hover:scale-105 transition-transform border-4 border-white",
               isSpeaking ? "bg-green-500 animate-pulse" : "bg-black"
             )}
           >
             {isSpeaking ? <Volume2 className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
           </button>
        )} />
      </div>
      <NavItem icon={Gift} label={t('nav.schemes')} path="/beneficiary/schemes" />
      <NavItem icon={User} label={t('nav.profile')} path="/beneficiary/card" />
    </div>
  );

  const AshaNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-2 flex justify-between items-center z-40 shadow-[0_-5px_30px_rgba(0,0,0,0.02)] pb-safe">
      <NavItem icon={Home} label={t('nav.dashboard')} path="/asha" />
      <NavItem icon={Users} label={t('nav.patients')} path="/asha/patients" />
      <div className="relative -top-6">
        <button 
          onClick={() => navigate('/asha/visit')}
          className="w-16 h-16 rounded-full bg-teal-600 shadow-xl flex items-center justify-center text-white hover:scale-105 transition-transform border-4 border-white"
        >
          <Mic className="w-7 h-7" />
        </button>
      </div>
      <NavItem icon={ScanLine} label={t('nav.scan')} path="/asha/scan" />
      <NavItem icon={AlertCircle} label={t('nav.alerts')} path="/asha/alerts" />
    </div>
  );

  const PartnerSidebar = () => (
    <div className="hidden md:flex flex-col w-72 fixed inset-y-0 left-0 bg-white border-r border-slate-100 z-50">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-bold text-xl">A</div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">ASHA AI</h1>
      </div>
      
      <div className="flex-1 px-6 space-y-3 mt-4">
        <button onClick={() => navigate('/partner')} className={clsx("w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all font-bold text-lg", location.pathname === '/partner' ? "bg-black text-white shadow-lg" : "text-slate-500 hover:bg-slate-50")}>
          <LayoutGrid size={22} /> {t('nav.dashboard')}
        </button>
        <button onClick={() => navigate('/partner/schemes')} className={clsx("w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all font-bold text-lg", location.pathname.includes('schemes') ? "bg-black text-white shadow-lg" : "text-slate-500 hover:bg-slate-50")}>
          <FileText size={22} /> {t('nav.schemes')}
        </button>
      </div>

      <div className="p-6 border-t border-slate-100">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-red-500 hover:bg-red-50 transition-all font-bold">
          <LogOut size={22} /> {t('common.logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 md:pb-0 bg-white text-slate-900 font-sans">
      {/* Mobile Header */}
      {!hideHeader && (
        <div className="sticky top-0 z-30 px-6 py-5 bg-white/90 backdrop-blur-lg border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-4">
             {showBack ? (
               <button 
                 onClick={() => navigate(-1)} 
                 className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-900 transition-colors"
               >
                 <ChevronLeft size={28} />
               </button>
             ) : (
               <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-base">
                 {currentUser?.name?.[0] || 'A'}
               </div>
             )}
             <h1 className="font-black text-2xl text-slate-900 truncate max-w-[200px] tracking-tight">
               {title || 'ASHA AI'}
             </h1>
           </div>
           
           <div className="flex items-center gap-2">
              <LanguageToggle /> {/* Replaced ThemeToggle */}
              <button 
                onClick={handleLogout} 
                className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={24} />
              </button>
           </div>
        </div>
      )}

      <div className={clsx("md:min-h-screen", role === 'partner' && "md:pl-72")}>
        {role === 'partner' && <PartnerSidebar />}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={clsx("max-w-3xl mx-auto md:max-w-none", !hideHeader && "p-6 md:p-10")}
        >
          {children}
        </motion.div>
      </div>

      {role === 'beneficiary' && <BeneficiaryNav />}
      {role === 'asha_worker' && <AshaNav />}
    </div>
  );
}
