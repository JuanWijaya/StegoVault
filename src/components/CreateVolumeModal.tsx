import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  FilePlus, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { sealVaultToPdf } from '../utils/container.ts';
import { SealVaultResult } from '../types/container.ts';
import { EntropyHarvester } from './EntropyHarvester.tsx';

interface CreateVolumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVaultCreated?: (result: SealVaultResult, password: string) => void;
}

export const CreateVolumeModal: React.FC<CreateVolumeModalProps> = ({
  isOpen,
  onClose,
  onVaultCreated
}) => {
  const [volumeName, setVolumeName] = useState('vault_container');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<SealVaultResult | null>(null);

  const [useEntropyHarvester, setUseEntropyHarvester] = useState(false);
  const [hybridSalt, setHybridSalt] = useState<Uint8Array | null>(null);
  const [hybridIV, setHybridIV] = useState<Uint8Array | null>(null);

  // Modal Escape key down handler (R-32)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  const entropyAnalysis = useMemo(() => {
    if (!password) {
      return { score: 0, label: 'Kosong', color: 'bg-slate-300', textCol: 'text-slate-500', crackTime: '0 detik' };
    }

    let pool = 0;
    if (/[a-z]/.test(password)) pool += 26;
    if (/[A-Z]/.test(password)) pool += 26;
    if (/[0-9]/.test(password)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(password)) pool += 33;

    const entropyBits = Math.floor(password.length * Math.log2(pool || 1));

    if (entropyBits < 30 || password.length < 8) {
      return { score: 25, label: 'Sangat Lemah', color: 'bg-rose-500', textCol: 'text-rose-600', crackTime: '< 1 detik (Mudah diretas)' };
    } else if (entropyBits < 50 || password.length < 10) {
      return { score: 50, label: 'Cukup', color: 'bg-amber-500', textCol: 'text-amber-600', crackTime: 'Beberapa jam / hari' };
    } else if (entropyBits < 75 || password.length < 14) {
      return { score: 75, label: 'Kuat', color: 'bg-[#3B5BFF]', textCol: 'text-[#163AC7]', crackTime: 'Ratusan tahun' };
    } else {
      return { score: 100, label: 'Sangat Kuat (Maksimal)', color: 'bg-emerald-500', textCol: 'text-emerald-600', crackTime: 'Miliaran tahun (Aman terhadap Brute-Force)' };
    }
  }, [password]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = volumeName.trim() || 'vault_container';
    if (!password) {
      setErrorMsg('Kata sandi wajib diisi.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Kata sandi minimal 8 karakter demi keamanan kriptografi.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (useEntropyHarvester && !hybridSalt) {
      setErrorMsg('Mode VeraCrypt Aktif: Silakan gerakkan mouse di kanvas hingga entropi 100% terkumpul.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await sealVaultToPdf(
        cleanName, 
        [], 
        password, 
        hybridSalt || undefined, 
        hybridIV || undefined
      );

      const blob = new Blob([result.pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${cleanName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setSuccessResult(result);

      if (onVaultCreated) {
        onVaultCreated(result, password);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal membuat kontainer.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070B19]/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-[28px] p-6 sm:p-8 shadow-2xl relative text-[#0B132B]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          aria-label="Tutup jendela buat kontainer"
          className="absolute top-5 right-5 min-h-[44px] min-w-[44px] rounded-full bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#0B132B] flex items-center justify-center transition border border-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        {successResult ? (
          <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#0B132B]">Kontainer Berhasil Dibuat!</h3>
              <p className="text-xs text-[#64748B] mt-1">
                Berkas <span className="font-mono text-[#163AC7] font-semibold">{volumeName}.pdf</span> telah diunduh otomatis ke komputer Anda.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F4F6FA] border border-slate-200 text-left text-xs font-mono">
              <div>
                <span className="text-[#64748B] block">KDF PBKDF2 (310k):</span>
                <span className="text-[#163AC7] font-bold">{successResult.kdfDurationMs} ms</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Enkripsi AES-256-GCM:</span>
                <span className="text-emerald-600 font-bold">{successResult.encryptionDurationMs} ms</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Sumber Entropi:</span>
                <span className="text-emerald-600 font-bold">
                  {hybridSalt ? 'Hibrida (CSPRNG + Human)' : 'CSPRNG Hardware'}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Status Sampul:</span>
                <span className="text-emerald-600 font-bold">Valid %PDF- (1 Page)</span>
              </div>
            </div>

            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Anda dapat membuka berkas PDF ini di Adobe Reader untuk melihat sampul peringatan resmi, atau gunakan StegoVault untuk membuka brankas terenkripsinya.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] py-2.5 rounded-full bg-[#3B5BFF] hover:bg-[#2745E8] text-xs font-semibold text-white shadow-md transition"
              >
                Selesai &amp; Buka Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#163AC7] flex items-center justify-center">
                <FilePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0B132B]">Buat Kontainer Baru</h3>
                <p className="text-xs text-[#64748B]">Enkripsi AES-256-GCM terselubung dalam 1 dokumen PDF</p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Input Nama Volume */}
            <div>
              <label htmlFor="create-volume-name" className="block text-xs font-medium text-[#0B132B] mb-1.5">
                Nama Volume Kontainer
              </label>
              <input
                id="create-volume-name"
                type="text"
                value={volumeName}
                onChange={(e) => setVolumeName(e.target.value)}
                placeholder="misal: dokumen_pribadi_2026"
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-[#0B132B] text-xs font-mono focus:outline-none focus:border-[#3B5BFF] focus:bg-white transition"
              />
              <span className="text-[10px] text-[#64748B] mt-1 block">
                Nama berkas akan disimpan sebagai <code className="text-[#163AC7]">{volumeName || 'vault_container'}.pdf</code>
              </span>
            </div>

            {/* Input Kata Sandi */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="create-master-password" className="text-xs font-medium text-[#0B132B]">
                  Kata Sandi Brankas (Master Password)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="min-h-[44px] min-w-[44px] text-[#64748B] hover:text-[#163AC7] text-xs inline-flex items-center justify-center gap-1 transition"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Sembunyikan' : 'Lihat'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  id="create-master-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi berkekuatan tinggi..."
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-[#0B132B] text-xs font-mono focus:outline-none focus:border-[#3B5BFF] focus:bg-white transition"
                />
              </div>

              {password && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#64748B]">Kekuatan Sandi:</span>
                    <span className={`font-semibold ${entropyAnalysis.textCol}`}>
                      {entropyAnalysis.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${entropyAnalysis.color} transition-all duration-300 rounded-full`}
                      style={{ width: `${entropyAnalysis.score}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#64748B] block">
                    Estimasi Brute-Force: <span className="text-[#0B132B] font-mono">{entropyAnalysis.crackTime}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Konfirmasi Kata Sandi */}
            <div>
              <label htmlFor="create-confirm-password" className="block text-xs font-medium text-[#0B132B] mb-1.5">
                Konfirmasi Kata Sandi
              </label>
              <input
                id="create-confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi..."
                required
                className={`w-full px-4 py-2.5 rounded-2xl bg-slate-50 border text-[#0B132B] text-xs font-mono focus:outline-none transition ${
                  confirmPassword && confirmPassword !== password 
                    ? 'border-rose-400 focus:border-rose-500' 
                    : confirmPassword && confirmPassword === password 
                    ? 'border-emerald-400 focus:border-emerald-500' 
                    : 'border-slate-200 focus:border-[#3B5BFF] focus:bg-white'
                }`}
              />
            </div>

            {/* Toggle VeraCrypt Mode: Entropi Fisik Gerakan Mouse */}
            <div className="pt-1 space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F4F6FA] border border-slate-200 hover:border-[#3B5BFF]/30 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#163AC7] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0B132B] block">
                      Mode VeraCrypt (Entropi Fisik Mouse)
                    </span>
                    <span className="text-[10px] text-[#64748B] block">
                      Kumpulkan keacakan alami dari gerakan tangan Anda (CSPRNG + Human)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={useEntropyHarvester}
                  aria-label="Aktifkan Mode VeraCrypt untuk Entropi Fisik Gerakan Mouse"
                  onClick={() => {
                    setUseEntropyHarvester(!useEntropyHarvester);
                    setHybridSalt(null);
                    setHybridIV(null);
                  }}
                  className={`min-h-[44px] min-w-[44px] flex items-center justify-center`}
                >
                  <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    useEntropyHarvester ? 'bg-[#3B5BFF]' : 'bg-slate-300'
                  }`}>
                    <div 
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        useEntropyHarvester ? 'translate-x-5' : 'translate-x-0'
                      }`} 
                    />
                  </div>
                </button>
              </div>

              {useEntropyHarvester && (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  <EntropyHarvester
                    onEntropyReady={(salt, iv) => {
                      setHybridSalt(salt);
                      setHybridIV(iv);
                    }}
                    onReset={() => {
                      setHybridSalt(null);
                      setHybridIV(null);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Security Guarantee Note */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-[#0B132B] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Kata sandi tidak pernah disimpan di disk atau dikirim ke server mana pun. Kunci AES-256-GCM diderivasi secara lokal menggunakan <span className="text-[#163AC7] font-mono font-medium">PBKDF2-SHA256 (310.000 iterasi)</span>.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="min-h-[44px] px-5 py-2.5 rounded-full text-xs font-semibold text-[#64748B] hover:text-[#0B132B] transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#3B5BFF] hover:bg-[#2745E8] text-xs font-semibold text-white shadow-md transition disabled:opacity-50 min-h-[44px]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menderivasi Kunci &amp; Menyegel PDF...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Buat &amp; Unduh Kontainer (.pdf)</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};