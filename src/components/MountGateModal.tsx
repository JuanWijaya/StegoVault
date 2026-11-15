import React, { useState, useEffect } from 'react';
import { 
  X, 
  Unlock, 
  FileText, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  ShieldCheck, 
  Loader2, 
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { inspectAndExtractContainer, unsealVaultFromPdf } from '../utils/container.ts';
import { ContainerHeaderInfo, UnsealVaultResult } from '../types/container.ts';
import { formatBytes } from '../utils/crypto.ts';

interface MountGateModalProps {
  isOpen: boolean;
  file: File | null;
  fileBytes: Uint8Array | null;
  onClose: () => void;
  onMounted: (result: UnsealVaultResult, password: string, fileBytes: Uint8Array) => void;
}

export const MountGateModal: React.FC<MountGateModalProps> = ({
  isOpen,
  file,
  fileBytes,
  onClose,
  onMounted
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [containerInfo, setContainerInfo] = useState<ContainerHeaderInfo | null>(null);
  const [isMounting, setIsMounting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal Escape key down handler (R-32)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isMounting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMounting, onClose]);

  useEffect(() => {
    if (fileBytes) {
      const info = inspectAndExtractContainer(fileBytes);
      setContainerInfo(info);
      setErrorMessage(info.isValidStegoVault ? null : (info.errorMessage || 'Berkas bukan kontainer StegoVault valid.'));
    } else {
      setContainerInfo(null);
      setErrorMessage(null);
    }
    setPassword('');
  }, [fileBytes]);

  if (!isOpen || !file || !fileBytes) return null;

  const handleMount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage('Kata sandi wajib diisi.');
      return;
    }

    if (!containerInfo?.isValidStegoVault) {
      setErrorMessage('Berkas PDF ini bukan merupakan kontainer StegoVault yang valid.');
      return;
    }

    setIsMounting(true);
    setErrorMessage(null);

    try {
      const result = await unsealVaultFromPdf(fileBytes, password);
      onMounted(result, password, fileBytes);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal membuka volume. Pastikan kata sandi Anda benar.');
      }
    } finally {
      setIsMounting(false);
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
          disabled={isMounting}
          aria-label="Tutup jendela buka kontainer"
          className="absolute top-5 right-5 min-h-[44px] min-w-[44px] rounded-full bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#0B132B] flex items-center justify-center transition border border-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        <form onSubmit={handleMount} className="space-y-5">
          {/* Header Modal */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#163AC7] flex items-center justify-center">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0B132B]">Buka Kontainer (Mount Gate)</h3>
              <p className="text-xs text-[#64748B]">Dekripsi virtual filesystem langsung di memori RAM</p>
            </div>
          </div>

          {/* Kartu Informasi Berkas */}
          <div className="p-4 rounded-2xl bg-[#F4F6FA] border border-slate-200 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#163AC7] shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-[#0B132B] truncate">{file.name}</p>
                  <p className="text-[11px] font-mono text-[#64748B]">{formatBytes(file.size)}</p>
                </div>
              </div>

              {containerInfo?.isValidStegoVault ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-mono text-emerald-700 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>STEGOVAULT_V1 Valid</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-mono text-rose-700 shrink-0">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Format Tidak Valid</span>
                </div>
              )}
            </div>

            {/* Detail Biner O(1) */}
            {containerInfo?.isValidStegoVault && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px] font-mono text-[#64748B]">
                <div>
                  <span className="text-[#64748B]">Ukuran Sampul PDF:</span>
                  <p className="text-[#0B132B] font-semibold">{formatBytes(containerInfo.coverPdfSize)}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Payload Terenkripsi:</span>
                  <p className="text-[#163AC7] font-semibold">{formatBytes(containerInfo.payloadLength || 0)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Banner Error */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Kesalahan Verifikasi</p>
                <p className="text-[11px] text-rose-600 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Input Password */}
          {containerInfo?.isValidStegoVault ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="mount-gate-password" className="text-xs font-medium text-[#0B132B]">
                  Kata Sandi Kontainer
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
              <input
                id="mount-gate-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi untuk mendekripsi..."
                autoFocus
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-[#0B132B] text-xs font-mono focus:outline-none focus:border-[#3B5BFF] focus:bg-white transition"
              />
              <span className="text-[10px] text-[#64748B] mt-1 block">
                Dekripsi AES-256-GCM akan otomatis gagal jika kata sandi salah atau bit payload telah dimodifikasi.
              </span>
            </div>
          ) : (
            <p className="text-xs text-[#64748B] leading-relaxed">
              Berkas yang Anda pilih tidak memiliki blok kontainer terenkripsi StegoVault di bagian akhir dokumen. Pastikan Anda memilih berkas PDF yang sebelumnya dibuat oleh StegoVault.
            </p>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isMounting}
              className="min-h-[44px] px-5 py-2.5 rounded-full text-xs font-semibold text-[#64748B] hover:text-[#0B132B] transition"
            >
              Tutup
            </button>
            {containerInfo?.isValidStegoVault && (
              <button
                type="submit"
                disabled={isMounting || !password}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#3B5BFF] hover:bg-[#2745E8] text-xs font-semibold text-white shadow-md transition disabled:opacity-50 min-h-[44px]"
              >
                {isMounting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mendekripsi di RAM (310k Iterasi)...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Buka Brankas (Mount)</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};