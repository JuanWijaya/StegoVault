import React, { useState, useRef, useEffect } from 'react';
import { 
  FolderPlus, 
  FileUp, 
  Lock, 
  FileText, 
  Zap, 
  ArrowRight,
  ShieldCheck, 
  CheckCircle2,
  Cpu,
  X
} from 'lucide-react';
import { SpotlightCard } from './SpotlightCard.tsx';

interface DashboardProps {
  onCreateVolumeClick: () => void;
  onFileSelected: (file: File) => void;
  onOpenBenchmark?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onCreateVolumeClick,
  onFileSelected
}) => {
  const [activeTab, setActiveTab] = useState<'mount' | 'create'>('mount');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mobile Tutorial Modal State & Animation Handler
  const [tutorialModal, setTutorialModal] = useState<'mount' | 'create' | null>(null);
  const [isModalClosing, setIsModalClosing] = useState<boolean>(false);

  const handleOpenTutorial = (mode: 'mount' | 'create') => {
    setIsModalClosing(false);
    setTutorialModal(mode);
  };

  const handleCloseTutorial = () => {
    if (isModalClosing || !tutorialModal) return;
    setIsModalClosing(true);
    setTimeout(() => {
      setTutorialModal(null);
      setIsModalClosing(false);
    }, 180);
  };

  // Escape key handler for Tutorial Modal
  useEffect(() => {
    if (!tutorialModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseTutorial();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tutorialModal, isModalClosing]);

  // Typewriter Loop State (StegoVault <-> Amankan Berkas Rahasia...)
  const [phraseIndex, setPhraseIndex] = useState<0 | 1>(0);
  const [charIndex, setCharIndex] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const BRAND_TEXT = 'StegoVault';
  const LINE_1 = 'Amankan Berkas Rahasia';
  const LINE_2 = 'dalam Satu Kontainer PDF';
  const PHRASE_2_TOTAL = LINE_1.length + LINE_2.length; // 22 + 24 = 46

  useEffect(() => {
    const isBrand = phraseIndex === 0;
    const maxChars = isBrand ? BRAND_TEXT.length : PHRASE_2_TOTAL;

    const typeSpeed = 55;
    const eraseSpeed = 25;
    const pauseAtEnd = 2400;
    const pauseAtEmpty = 400;

    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (charIndex < maxChars) {
        timer = setTimeout(() => {
          setCharIndex(prev => prev + 1);
        }, typeSpeed);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, pauseAtEnd);
      }
    } else {
      if (charIndex > 0) {
        timer = setTimeout(() => {
          setCharIndex(prev => prev - 1);
        }, eraseSpeed);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(false);
          setPhraseIndex(prev => (prev === 0 ? 1 : 0));
        }, pauseAtEmpty);
      }
    }

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, phraseIndex]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      onFileSelected(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-0 pb-16">
      {/* Zona Atas: Split-Tone Deep Navy to Royal Cobalt with Fluted Ribbed Texture */}
      <section className="fluted-hero-bg pt-28 pb-24 px-4 sm:px-6 relative overflow-hidden text-center">
        <div className="max-w-6xl mx-auto relative z-10 space-y-6">
          {/* Hero Headline Dinamis dengan Efek Typewriter Loop & Sheen Sinkron */}
          <div className="min-h-[140px] sm:min-h-[160px] md:min-h-[175px] flex flex-col justify-center items-center">
            {phraseIndex === 0 ? (
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none py-1">
                <span className="sheen-text">
                  {BRAND_TEXT.slice(0, charIndex)}
                </span>
                <span className="inline-block w-1.5 md:w-2 h-[0.75em] ml-2 bg-sky-400 animate-pulse align-middle rounded-xs" />
              </h1>
            ) : (
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight md:leading-snug text-center">
                <span className="block">
                  <span className="sheen-text">
                    {charIndex <= LINE_1.length ? LINE_1.slice(0, charIndex) : LINE_1}
                  </span>
                  {charIndex <= LINE_1.length && (
                    <span className="inline-block w-1 md:w-1.5 h-[0.8em] ml-1.5 bg-sky-400 animate-pulse align-middle rounded-xs" />
                  )}
                </span>
                <span className="block min-h-[1.2em]">
                  <span className="sheen-text">
                    {charIndex > LINE_1.length ? LINE_2.slice(0, charIndex - LINE_1.length) : ''}
                  </span>
                  {charIndex > LINE_1.length && (
                    <span className="inline-block w-1 md:w-1.5 h-[0.8em] ml-1.5 bg-sky-400 animate-pulse align-middle rounded-xs" />
                  )}
                </span>
              </h1>
            )}
          </div>

          <p className="text-base sm:text-lg text-[#B8C7F0] max-w-2xl mx-auto leading-relaxed">
            Simpan, kelola, dan pratinjau dokumen pribadi secara on-the-fly langsung di browser tanpa server eksternal.
          </p>

          {/* The 3-Card Vault Showcase with Spotlight Effect */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-stretch text-left">
            {/* Card 1: Left Floating White Card - Panduan Buka Kontainer (Desktop Only) */}
            <SpotlightCard 
              className={`hidden lg:flex lg:col-span-3 rounded-3xl bg-white p-6 sm:p-7 shadow-2xl flex-col justify-between border transition-all duration-300 ${
                activeTab === 'mount' ? 'border-[#163AC7]/30 ring-1 ring-[#163AC7]/15' : 'border-slate-100'
              }`}
              spotlightColor="rgba(59, 91, 255, 0.08)"
            >
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-[#EEF2FF] text-[#163AC7] flex items-center justify-center shrink-0 shadow-xs">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold font-mono tracking-wider text-[#163AC7] uppercase block">
                    Panduan Buka
                  </span>
                  <h3 className="text-base font-bold text-[#0B132B] leading-tight">
                    Cara Buka Kontainer
                  </h3>
                  <p className="text-[11px] text-[#64748B] mt-0.5">3 langkah mengakses brankas</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 hover:border-blue-200 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-[#163AC7] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#0B132B]">Pilih Berkas PDF</p>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      Tarik atau unggah dokumen PDF kontainer StegoVault ke dropzone tengah.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 hover:border-blue-200 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-[#163AC7] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#0B132B]">Ketik Kata Sandi</p>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      Masukkan Master Password untuk memvalidasi tag autentikasi GCM.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 hover:border-blue-200 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#0B132B]">Akses di Memori</p>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      Buka dan pratinjau berkas secara instan di RAM tanpa jejak disk.
                    </p>
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* Centerpiece Column: Card 2 (Elevated White Card) + Mobile-Only Tutorial Buttons */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <SpotlightCard 
                className="w-full flex-1 rounded-[28px] bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 flex flex-col"
                spotlightColor="rgba(59, 91, 255, 0.08)"
              >
                {/* Gliding Segmented Pill Switcher */}
                <div className="relative flex items-center p-1.5 bg-[#F4F6FA] rounded-full border border-slate-200/80 mb-4 shrink-0">
                  <div 
                    className={`absolute top-1.5 bottom-1.5 rounded-full bg-white shadow-sm transition-all duration-300 ease-out z-0 ${
                      activeTab === 'mount' 
                        ? 'left-1.5 w-[calc(50%-6px)]' 
                        : 'left-[calc(50%+3px)] w-[calc(50%-6px)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setActiveTab('mount')}
                    aria-label="Pilih mode buka kontainer"
                    className={`relative z-10 flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-full text-xs font-bold transition-colors duration-200 ${
                      activeTab === 'mount' ? 'text-[#163AC7]' : 'text-[#64748B] hover:text-[#0B132B]'
                    }`}
                  >
                    <FileUp className="w-4 h-4" />
                    <span>Buka Kontainer (.pdf)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    aria-label="Pilih mode buat kontainer baru"
                    className={`relative z-10 flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-full text-xs font-bold transition-colors duration-200 ${
                      activeTab === 'create' ? 'text-[#163AC7]' : 'text-[#64748B] hover:text-[#0B132B]'
                    }`}
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Buat Kontainer Baru</span>
                  </button>
                </div>

                {/* Tab 1 Content: Mount Gate Dropzone */}
                {activeTab === 'mount' && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 min-h-[220px] group ${
                      isDragOver
                        ? 'border-[#3B5BFF] bg-blue-50/90 ring-4 ring-blue-100/90 scale-[1.01] animate-drag-pulse shadow-lg shadow-blue-500/10'
                        : 'border-blue-200 hover:border-[#3B5BFF] bg-slate-50/60 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,application/pdf"
                      className="hidden"
                    />
                    <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] text-[#163AC7] flex items-center justify-center mx-auto mb-3.5 group-hover:scale-105 transition-transform duration-200 shadow-xs">
                      <FileUp className="w-7 h-7" />
                    </div>
                    <h4 className="font-bold text-base sm:text-lg text-[#0B132B]">
                      {isDragOver ? 'Lepaskan Berkas PDF Sekarang' : 'Tarik Berkas PDF Kontainer ke Sini'}
                    </h4>
                    <p className="text-xs text-[#64748B] mt-1.5 max-w-sm mx-auto">
                      Atau klik untuk memilih berkas PDF dari komputer Anda.
                    </p>
                  </div>
                )}

                {/* Tab 2 Content: Create Volume Quick Launcher */}
                {activeTab === 'create' && (
                  <div 
                    onClick={onCreateVolumeClick}
                    className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 p-6 sm:p-8 bg-slate-50/50 hover:bg-slate-50 hover:border-[#3B5BFF]/40 cursor-pointer transition-all duration-200 min-h-[220px] text-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] text-[#163AC7] flex items-center justify-center mx-auto mb-3.5 group-hover:scale-105 transition-transform duration-200 shadow-xs">
                      <FolderPlus className="w-7 h-7" />
                    </div>
                    <h4 className="font-bold text-base sm:text-lg text-[#0B132B]">Buat Brankas Kontainer Baru</h4>
                    <p className="text-xs text-[#64748B] mt-1.5 max-w-sm mx-auto leading-relaxed">
                      Amankan dokumen penting Anda di dalam berkas PDF bertopeng yang dilindungi kata sandi.
                    </p>
                  </div>
                )}

                {/* Bottom CTA Action Button */}
                <div className="flex items-center justify-end pt-4 shrink-0">
                  {activeTab === 'mount' ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="group/btn inline-flex items-center gap-3 rounded-full bg-[#3B5BFF] hover:bg-[#2745E8] active:scale-[0.97] pl-6 pr-2 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition-all duration-150 min-h-[44px]"
                    >
                      <span>Pilih Berkas PDF</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#163AC7] group-hover/btn:translate-x-1 transition-transform duration-200">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onCreateVolumeClick}
                      className="group/btn inline-flex items-center gap-3 rounded-full bg-[#3B5BFF] hover:bg-[#2745E8] active:scale-[0.97] pl-6 pr-2 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition-all duration-150 min-h-[44px]"
                    >
                      <span>Mulai Buat (.pdf)</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#163AC7] group-hover/btn:translate-x-1 transition-transform duration-200">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </button>
                  )}
                </div>
              </SpotlightCard>

            {/* Baris Khusus Mobile: 2 Kartu Tombol Tutorial Bersebelahan */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:hidden">
              <button
                type="button"
                onClick={() => handleOpenTutorial('mount')}
                aria-label="Buka panduan cara buka kontainer"
                className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200/80 shadow-md text-[#0B132B] flex items-center gap-2.5 sm:gap-3 text-left active:scale-[0.97] transition-all duration-150 cursor-pointer min-h-[56px] group"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#EEF2FF] text-[#163AC7] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold font-mono tracking-wider text-[#163AC7] uppercase block">
                    Panduan
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-[#0B132B] truncate">
                    Cara Buka
                  </h4>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOpenTutorial('create')}
                aria-label="Buka panduan cara buat kontainer"
                className="p-3.5 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 shadow-md text-white flex items-center gap-2.5 sm:gap-3 text-left active:scale-[0.97] transition-all duration-150 cursor-pointer min-h-[56px] group"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 text-sky-300 border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FolderPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold font-mono tracking-wider text-sky-300 uppercase block">
                    Panduan
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    Cara Buat
                  </h4>
                </div>
              </button>
            </div>
          </div>

          {/* Card 3: Right Floating Frosted-Glass Card - Panduan Buat Kontainer (Desktop Only) */}
          <SpotlightCard 
            className={`hidden lg:flex lg:col-span-3 rounded-3xl bg-white/10 backdrop-blur-md border p-6 sm:p-7 text-white shadow-xl flex-col justify-between transition-all duration-300 ${
              activeTab === 'create' ? 'border-sky-400/50 ring-1 ring-sky-400/20' : 'border-white/20'
            }`}
            spotlightColor="rgba(255, 255, 255, 0.16)"
          >
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-white/15 text-sky-300 border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold font-mono tracking-wider text-sky-300 uppercase block">
                    Panduan Buat
                  </span>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Cara Buat Kontainer
                  </h3>
                  <p className="text-[11px] text-sky-200/80 mt-0.5">3 langkah membuat brankas</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between gap-3 font-sans text-xs">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/25 border border-white/10 hover:border-white/20 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-sky-400 text-slate-900 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Nama & Kata Sandi</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Tentukan nama kontainer dan masukkan password berkekuatan tinggi.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/25 border border-white/10 hover:border-white/20 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-sky-400 text-slate-900 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Entropi Gerakan Mouse</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Gerakkan kursor untuk mengumpulkan keacakan fisik ala VeraCrypt.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-950/60 border border-sky-400/30 hover:border-sky-400/60 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-emerald-400 text-slate-900 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Unduh Berkas PDF</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Simpan file PDF resmi yang menyamarkan payload terenkripsi di dalamnya.
                    </p>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* Zona Bawah: Ice-White Canvas (#F4F6FA) - Grid 4 Pilar Keamanan dengan Spotlight */}
      <section id="security-features" className="bg-[#F4F6FA] pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-[#0B132B]">
              Keamanan Tingkat Industri Tanpa Konfigurasi Rumit
            </h2>
            <p className="text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
              Semua parameter kriptografi dikunci pada standar tertinggi secara otomatis demi menjamin privasi absolut.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Kartu 1: Active Highlight Card (Cobalt Gradient) dengan White Spotlight */}
            <SpotlightCard 
              className="rounded-3xl bg-gradient-to-b from-[#0A1F8F] to-[#1738CF] p-7 text-white shadow-xl flex flex-col justify-between"
              spotlightColor="rgba(255, 255, 255, 0.2)"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-5 text-white group-hover:scale-105 transition-transform duration-300">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">Kontainer PDF Anti-Hang</h3>
                <p className="text-xs text-blue-100/90 leading-relaxed">
                  Membungkus ciphertext di balik sampul PDF 1 halaman yang valid. Dapat dibuka di Adobe Acrobat atau Chrome tanpa freeze atau crash.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/15 flex items-center gap-1.5 text-xs font-semibold text-sky-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" />
                <span>%%EOF Boundary Safe</span>
              </div>
            </SpotlightCard>

            {/* Kartu 2: White Card - 100% Client-Side Privacy */}
            <SpotlightCard 
              className="rounded-3xl bg-white border border-slate-200/80 p-7 shadow-sm hover:shadow-md text-[#0B132B] flex flex-col justify-between"
              spotlightColor="rgba(59, 91, 255, 0.08)"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#163AC7] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-[#0B132B]">100% Client-Side Privacy</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Kunci privat diderivasi lokal menggunakan Web Crypto API. Berkas Anda tidak pernah melintasi internet atau disimpan di server mana pun.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-[#163AC7]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Standar OWASP PBKDF2</span>
              </div>
            </SpotlightCard>

            {/* Kartu 3: White Card - Enkripsi Tetap AES-256-GCM */}
            <SpotlightCard 
              className="rounded-3xl bg-white border border-slate-200/80 p-7 shadow-sm hover:shadow-md text-[#0B132B] flex flex-col justify-between"
              spotlightColor="rgba(59, 91, 255, 0.08)"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#163AC7] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-[#0B132B]">Enkripsi Tetap AES-256-GCM</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Perlindungan kerahasiaan sekaligus integritas biner via 128-bit Authentication Tag. Satu bit berubah, dekripsi digagalkan seketika.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Tamper Detection 100%</span>
              </div>
            </SpotlightCard>

            {/* Kartu 4: White Card - Ekstraksi Biner O(1) */}
            <SpotlightCard 
              className="rounded-3xl bg-white border border-slate-200/80 p-7 shadow-sm hover:shadow-md text-[#0B132B] flex flex-col justify-between"
              spotlightColor="rgba(59, 91, 255, 0.08)"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#163AC7] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-[#0B132B]">Ekstraksi Biner O(1)</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Membaca 14 byte trailer terakhir dokumen untuk memvalidasi penanda SV_END dan panjang payload N, melompat instan tanpa scanning loop.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-[#163AC7]">
                <Zap className="w-3.5 h-3.5" />
                <span>Trailer Jump O(1)</span>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* Pop Up Modal Tutorial Mobile dengan Animasi Buka & Tutup */}
      {tutorialModal && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070B19]/80 backdrop-blur-md ${
            isModalClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
          }`}
          onClick={handleCloseTutorial}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-modal-title"
        >
          <div 
            className={`w-full max-w-md max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-[28px] p-6 sm:p-7 shadow-2xl relative text-[#0B132B] ${
              isModalClosing ? 'animate-modal-scale-out' : 'animate-modal-scale-in'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tombol Tutup X */}
            <button
              type="button"
              onClick={handleCloseTutorial}
              aria-label="Tutup jendela panduan"
              className="absolute top-5 right-5 min-h-[44px] min-w-[44px] rounded-full bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#0B132B] flex items-center justify-center transition border border-slate-200 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>

            {tutorialModal === 'mount' ? (
              <div>
                {/* Header Panduan Buka */}
                <div className="flex items-center gap-3.5 mb-5 pr-10">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#163AC7] flex items-center justify-center shrink-0 shadow-xs">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold font-mono tracking-wider text-[#163AC7] uppercase block">
                      Panduan Buka
                    </span>
                    <h3 id="tutorial-modal-title" className="text-lg font-bold text-[#0B132B] leading-tight">
                      Cara Buka Kontainer
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">3 langkah mengakses brankas</p>
                  </div>
                </div>

                {/* Steps Panduan Buka */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
                    <div className="w-7 h-7 rounded-xl bg-[#163AC7] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                      1
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#0B132B]">Pilih Berkas PDF</p>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        Tarik atau unggah dokumen PDF kontainer StegoVault ke dropzone tengah.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
                    <div className="w-7 h-7 rounded-xl bg-[#163AC7] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                      2
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#0B132B]">Ketik Kata Sandi</p>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        Masukkan Master Password untuk memvalidasi tag autentikasi GCM.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                      3
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#0B132B]">Akses di Memori</p>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        Buka dan pratinjau berkas secara instan di RAM tanpa jejak disk.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Header Panduan Buat */}
                <div className="flex items-center gap-3.5 mb-5 pr-10">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#163AC7] flex items-center justify-center shrink-0 shadow-xs">
                    <FolderPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold font-mono tracking-wider text-[#163AC7] uppercase block">
                      Panduan Buat
                    </span>
                    <h3 id="tutorial-modal-title" className="text-lg font-bold text-[#0B132B] leading-tight">
                      Cara Buat Kontainer
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">3 langkah membuat brankas</p>
                  </div>
                </div>

                {/* Steps Panduan Buat */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
                    <div className="w-7 h-7 rounded-xl bg-[#163AC7] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                      1
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#0B132B]">Nama & Kata Sandi</p>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        Tentukan nama kontainer dan masukkan password berkekuatan tinggi.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
                    <div className="w-7 h-7 rounded-xl bg-[#163AC7] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                      2
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#0B132B]">Entropi Gerakan Mouse</p>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        Gerakkan kursor untuk mengumpulkan keacakan fisik ala VeraCrypt.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                      3
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#0B132B]">Unduh Berkas PDF</p>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        Simpan file PDF resmi yang menyamarkan payload terenkripsi di dalamnya.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tombol Mengerti / Tutup */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseTutorial}
                className="w-full min-h-[44px] flex items-center justify-center px-5 py-2.5 rounded-full bg-[#163AC7] hover:bg-[#0A1F8F] active:scale-[0.98] text-xs font-bold text-white transition-all shadow-md shadow-blue-900/10"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};