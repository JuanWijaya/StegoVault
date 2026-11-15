import React from 'react';
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
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#070B19]/90 border-b border-sky-500/15 px-4 sm:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#163AC7] to-[#3A86FF] p-0.5 flex items-center justify-center shadow-sm">
            <div className="w-full h-full bg-[#070B19] rounded-[14px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#3A86FF]" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              StegoVault
            </span>
            {activeScreen === 'workspace' && volumeName && (
              <p className="text-[11px] text-emerald-400 font-mono truncate max-w-[200px]">
                ● Volume: {volumeName}
              </p>
            )}
          </div>
        </div>

        {/* Right Action: Metrik Kripto */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenBenchmark && (
            <button
              onClick={onOpenBenchmark}
              aria-label="Buka Telemetri dan Metrik Kriptografi"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-700 hover:border-[#3A86FF]/40 transition-colors"
            >
              <Activity className="w-4 h-4 text-[#3A86FF]" />
              <span className="hidden sm:inline">Metrik Kripto</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
