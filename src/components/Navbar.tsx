import React, { useState, useEffect } from 'react';
import { Shield, Activity } from 'lucide-react';

interface NavbarProps {
  onOpenBenchmark?: () => void;
  activeScreen?: string;
  volumeName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenBenchmark, 
  activeScreen = 'dashboard',
  volumeName 
}) => {
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (activeScreen === 'workspace') {
        setIsScrolledPastHero(true);
        return;
      }
      const section = document.getElementById('security-features');
      if (section) {
        const rect = section.getBoundingClientRect();
        setIsScrolledPastHero(rect.top <= 80);
      } else {
        setIsScrolledPastHero(window.scrollY > 400);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeScreen]);

  return (
    <header 
      className={`sticky top-0 z-40 transition-all duration-300 ease-out px-4 sm:px-6 ${
        isScrolledPastHero
          ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/90 shadow-sm py-2.5'
          : 'bg-transparent border-b border-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div 
            className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full transition-all duration-300 ${
              isScrolledPastHero
                ? 'bg-slate-100 border border-slate-200 shadow-xs'
                : 'bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md shadow-sm'
            }`}
          >
            <div 
              className={`w-7 h-7 rounded-xl flex items-center justify-center p-0.5 transition-colors ${
                isScrolledPastHero
                  ? 'bg-[#163AC7] text-white'
                  : 'bg-gradient-to-tr from-[#163AC7] to-[#3A86FF] text-[#3A86FF]'
              }`}
            >
              {isScrolledPastHero ? (
                <Shield className="w-4 h-4 text-white" />
              ) : (
                <div className="w-full h-full bg-[#070B19] rounded-[10px] flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-[#3A86FF]" />
                </div>
              )}
            </div>
            <span 
              className={`font-extrabold text-base tracking-tight transition-colors ${
                isScrolledPastHero ? 'text-[#0B132B]' : 'text-white'
              }`}
            >
              StegoVault
            </span>
          </div>

          {activeScreen === 'workspace' && volumeName && (
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 truncate max-w-[200px]">
              ● {volumeName}
            </span>
          )}
        </div>

        {/* Right Action: Metrik Kripto */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenBenchmark && (
            <button
              onClick={onOpenBenchmark}
              aria-label="Buka Telemetri dan Metrik Kriptografi"
              className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-semibold active:scale-[0.97] transition-all duration-200 ${
                isScrolledPastHero
                  ? 'bg-[#EEF2FF] hover:bg-blue-100 text-[#163AC7] border border-blue-200 shadow-xs'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/20 backdrop-blur-md shadow-sm'
              }`}
            >
              <Activity className={`w-4 h-4 ${isScrolledPastHero ? 'text-[#163AC7]' : 'text-sky-300'}`} />
              <span className="hidden sm:inline">Metrik Kripto</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
