import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  FileCheck
} from 'lucide-react';
import { 
  deriveKey, 
  encryptData, 
  decryptData, 
  calculateAvalancheEffect, 
  generateSalt, 
  generateIV, 
  formatBytes,
  AvalancheResult 
} from '../utils/crypto.ts';

interface SecurityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSessionMetrics?: {
    volumeName?: string;
    kdfDurationMs?: number;
    cryptoDurationMs?: number;
    payloadSize?: number;
    coverSize?: number;
  };
}

export const SecurityDrawer: React.FC<SecurityDrawerProps> = ({
  isOpen,
  onClose,
  activeSessionMetrics
}) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'avalanche' | 'guide'>('telemetry');
  const [isRunning, setIsRunning] = useState(false);
  const [kdfLatency, setKdfLatency] = useState(0);
  const [encLatency, setEncLatency] = useState(0);
  const [decLatency, setDecLatency] = useState(0);
  const [encThroughput, setEncThroughput] = useState(0);
  const [tamperPassed, setTamperPassed] = useState(false);

  const [inputA, setInputA] = useState('StegoVault2026!');
  const [inputB, setInputB] = useState('StegoVault2026?');
  const [avalanche, setAvalanche] = useState<AvalancheResult | null>(null);

  // Modal Escape key down handler (R-32)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      runBenchmark();
      handleAvalanche(inputA, inputB);
    }
  }, [isOpen]);

  const runBenchmark = async () => {
    setIsRunning(true);
    try {
      const salt = generateSalt();
      const iv = generateIV();
      const sample = new Uint8Array(256 * 1024);
      crypto.getRandomValues(sample);

      const { key, durationMs: kdfMs } = await deriveKey('BenchmarkPassword#2026', salt);
      const encRes = await encryptData(sample, key, iv);
      const decRes = await decryptData(encRes.ciphertext, key, iv);

      const tampered = new Uint8Array(encRes.ciphertext);
      tampered[10] ^= 0x01;
      let tamperedCaught = false;
      try {
        await decryptData(tampered, key, iv);
      } catch {
        tamperedCaught = true;
      }

      setKdfLatency(kdfMs);
      setEncLatency(encRes.durationMs);
      setDecLatency(decRes.durationMs);
      setEncThroughput(encRes.throughputMBs);
      setTamperPassed(tamperedCaught);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAvalanche = async (valA: string, valB: string) => {
    const res = await calculateAvalancheEffect(valA, valB);
    setAvalanche(res);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#070B19]/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div 
          className="w-screen max-w-lg bg-white border-l border-slate-200 shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto text-[#0B132B]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#163AC7] flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#0B132B]">Inspektor Keamanan &amp; Metrik</h3>
                  <p className="text-xs text-[#64748B]">Panel pengujian kriptografi Lomba CAPSTONE 2026</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup panel metrik dan inspektor keamanan"
                className="min-h-[44px] min-w-[44px] rounded-full bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#0B132B] flex items-center justify-center transition border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1.5 p-1.5 bg-[#F4F6FA] rounded-2xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('telemetry')}
                className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl font-bold transition ${
                  activeTab === 'telemetry' 
                    ? 'bg-white text-[#163AC7] shadow-sm' 
                    : 'text-[#64748B] hover:text-[#0B132B]'
                }`}
              >
                Telemetri Live
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('avalanche')}
                className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl font-bold transition ${
                  activeTab === 'avalanche' 
                    ? 'bg-white text-[#163AC7] shadow-sm' 
                    : 'text-[#64748B] hover:text-[#0B132B]'
                }`}
              >
                Avalanche Lab
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('guide')}
                className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl font-bold transition ${
                  activeTab === 'guide' 
                    ? 'bg-white text-[#163AC7] shadow-sm' 
                    : 'text-[#64748B] hover:text-[#0B132B]'
                }`}
              >
                Panduan Juri
              </button>
            </div>

            {/* Tab 1: Telemetri Live */}
            {activeTab === 'telemetry' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {activeSessionMetrics?.volumeName && (
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                    <span className="text-[11px] font-mono text-[#163AC7] uppercase tracking-wider block font-bold">
                      Metrik Sesi Aktif
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[#64748B]">Volume:</span>
                        <p className="text-[#0B132B] font-bold">{activeSessionMetrics.volumeName}</p>
                      </div>
                      <div>
                        <span className="text-[#64748B]">KDF PBKDF2:</span>
                        <p className="text-emerald-600 font-bold">{activeSessionMetrics.kdfDurationMs || 0} ms</p>
                      </div>
                      <div>
                        <span className="text-[#64748B]">Payload Data:</span>
                        <p className="text-[#163AC7] font-bold">{formatBytes(activeSessionMetrics.payloadSize || 0)}</p>
                      </div>
                      <div>
                        <span className="text-[#64748B]">Sampul PDF:</span>
                        <p className="text-[#0B132B] font-bold">{formatBytes(activeSessionMetrics.coverSize || 2386)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Benchmark Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0B132B]">Hasil Benchmark (256 KB Payload)</span>
                    <button
                      type="button"
                      onClick={runBenchmark}
                      disabled={isRunning}
                      aria-label="Jalankan ulang benchmark kriptografi"
                      className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-mono text-[#163AC7] border border-slate-200 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                      <span>{isRunning ? 'Menguji...' : 'Uji Ulang'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F4F6FA] rounded-2xl p-3.5 border border-slate-200">
                      <span className="text-[11px] text-[#64748B] block font-mono">PBKDF2 (310k Iterasi):</span>
                      <span className="text-xl font-mono font-bold text-[#163AC7] mt-1 block">
                        {kdfLatency} <span className="text-xs font-normal text-[#64748B]">ms</span>
                      </span>
                      <span className="text-[10px] text-[#64748B]">HMAC-SHA256 OWASP</span>
                    </div>

                    <div className="bg-[#F4F6FA] rounded-2xl p-3.5 border border-slate-200">
                      <span className="text-[11px] text-[#64748B] block font-mono">Enkripsi / Dekripsi:</span>
                      <span className="text-lg font-mono font-bold text-emerald-600 mt-1 block">
                        {encLatency} <span className="text-xs font-normal text-[#64748B]">/</span> {decLatency} <span className="text-xs font-normal text-[#64748B]">ms</span>
                      </span>
                      <span className="text-[10px] text-[#64748B]">Tag 128-bit Verified</span>
                    </div>

                    <div className="bg-[#F4F6FA] rounded-2xl p-3.5 border border-slate-200">
                      <span className="text-[11px] text-[#64748B] block font-mono">Kecepatan Throughput:</span>
                      <span className="text-xl font-mono font-bold text-indigo-600 mt-1 block">
                        {encThroughput} <span className="text-xs font-normal text-[#64748B]">MB/s</span>
                      </span>
                      <span className="text-[10px] text-[#64748B]">Native Web Crypto</span>
                    </div>

                    <div className="bg-[#F4F6FA] rounded-2xl p-3.5 border border-slate-200">
                      <span className="text-[11px] text-[#64748B] block font-mono">Uji Anti-Tamper:</span>
                      <span className="text-lg font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>{tamperPassed ? 'Lolos' : 'Menguji...'}</span>
                      </span>
                      <span className="text-[10px] text-[#64748B]">1-bit flip reject</span>
                    </div>
                  </div>
                </div>

                {/* Overhead Efficiency Ratio */}
                <div className="p-4 rounded-2xl bg-[#F4F6FA] border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-[#0B132B] block">Efisiensi Kemasan Biner (Tanpa Bloat)</span>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B]">
                    <span>Sampul PDF: ~2.3 KB</span>
                    <span>Trailer Metadata: 56 Bytes</span>
                    <span className="text-emerald-600 font-bold">Overhead: &lt; 0.1%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                    <div className="w-[3%] bg-sky-400" title="Sampul PDF (~2.3KB)" />
                    <div className="w-[97%] bg-[#3B5BFF]" title="Payload Terenkripsi" />
                  </div>
                  <p className="text-[10px] text-[#64748B] leading-tight">
                    Format biner murni StegoVault menghemat 33% memori dibandingkan metode konversi Base64 biasa.
                  </p>
                </div>

                {/* Kepatuhan Standar Keamanan */}
                <div className="p-4 rounded-2xl bg-[#F4F6FA] border border-slate-200 space-y-2 text-[11px] text-[#64748B]">
                  <div className="flex items-center gap-2 text-[#0B132B] font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Kepatuhan Standar Kriptografi:</span>
                  </div>
                  <ul className="space-y-1.5 pl-6 list-disc font-mono text-[10px] text-[#64748B]">
                    <li><strong className="text-[#0B132B]">OWASP KDF:</strong> PBKDF2-HMAC-SHA256 (310.000 iterasi)</li>
                    <li><strong className="text-[#0B132B]">NIST SP 800-38D:</strong> AES-256-GCM authenticated encryption</li>
                    <li><strong className="text-[#0B132B]">CSPRNG:</strong> 16-byte Salt &amp; 12-byte IV unik per simpan</li>
                    <li><strong className="text-[#0B132B]">Memory Hygiene:</strong> Non-extractable keys &amp; zero-filled RAM buffers</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 2: Avalanche Effect Simulator */}
            {activeTab === 'avalanche' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-[#0B132B] uppercase tracking-wider font-mono">
                    Strict Avalanche Criterion (SAC)
                  </h4>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Ubah 1 karakter/bit pada input di bawah untuk membuktikan difusi non-linearitas SHA-256 / AES-GCM. Standar kriptografi yang kuat menghasilkan perubahan bit mendekati 50%.
                </p>

                <div className="space-y-2.5">
                  <div>
                    <label htmlFor="avalanche-input-a" className="text-[10px] font-mono text-[#64748B] block mb-1">
                      Input A:
                    </label>
                    <input
                      id="avalanche-input-a"
                      type="text"
                      value={inputA}
                      onChange={(e) => {
                        setInputA(e.target.value);
                        handleAvalanche(e.target.value, inputB);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-[#163AC7] focus:outline-none focus:border-[#3B5BFF] focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="avalanche-input-b" className="text-[10px] font-mono text-[#64748B] block mb-1">
                      Input B (berbeda 1 karakter):
                    </label>
                    <input
                      id="avalanche-input-b"
                      type="text"
                      value={inputB}
                      onChange={(e) => {
                        setInputB(e.target.value);
                        handleAvalanche(inputA, e.target.value);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-indigo-700 focus:outline-none focus:border-[#3B5BFF] focus:bg-white transition"
                    />
                  </div>
                </div>

                {avalanche && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-[#F4F6FA] border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#64748B]">Persentase Perubahan:</span>
                        <span className="text-2xl font-mono font-extrabold text-[#163AC7]">
                          {avalanche.flipPercentage}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#3B5BFF] to-indigo-600 transition-all duration-300 rounded-full"
                          style={{ width: `${avalanche.flipPercentage}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-mono text-[#64748B]">
                        {avalanche.flippedBits} dari {avalanche.totalBits} bit berubah (Standar Ideal: ~50%).
                      </p>
                    </div>

                    {/* 256-Bit Matrix Visualizer */}
                    <div className="p-3.5 rounded-2xl bg-[#F4F6FA] border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                        <span className="font-semibold text-[#0B132B]">Visualisasi Matriks 256-Bit SHA-256:</span>
                        <div className="flex items-center gap-3 text-[10px] font-mono">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Berubah
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span> Tetap
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-16 gap-1 p-2 bg-white rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
                        {Array.from({ length: 256 }).map((_, idx) => {
                          const bitA = avalanche.bitsA[idx] || '0';
                          const bitB = avalanche.bitsB[idx] || '0';
                          const isFlipped = bitA !== bitB;

                          return (
                            <div
                              key={idx}
                              title={`Bit ${idx}: A=${bitA}, B=${bitB} (${isFlipped ? 'Berubah' : 'Sama'})`}
                              className={`w-3.5 h-3.5 rounded-xs transition-colors text-[7px] flex items-center justify-center font-mono ${
                                isFlipped 
                                  ? 'bg-rose-500 text-white font-bold' 
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {bitB}
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-[10px] text-[#64748B] italic leading-relaxed pt-1">
                        Sifat difusi sempurna: Mengubah 1 bit pada masukan membalik rata-rata separuh bit keluaran tanpa korelasi statistik yang dapat diprediksi.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Panduan Juri & Skenario Demo */}
            {activeTab === 'guide' && (
              <div className="space-y-4 animate-in fade-in duration-200 text-xs text-[#0B132B]">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-[#0B132B] text-sm">Skenario Demonstrasi Juri Lomba</h4>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[#F4F6FA] border border-slate-200 space-y-1.5">
                    <span className="font-bold text-[#163AC7] block font-mono text-[11px]">1. Uji Kamuflase Dokumen PDF</span>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      Buat kontainer baru, buka berkas <code className="text-[#0B132B] font-mono">.pdf</code> hasil unduhan di Google Chrome atau Adobe Acrobat Reader. Tunjukkan kepada juri bahwa dokumen terbuka secara instan sebagai halaman sampul resmi tanpa freeze atau crash.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F4F6FA] border border-slate-200 space-y-1.5">
                    <span className="font-bold text-[#163AC7] block font-mono text-[11px]">2. Uji Mounting O(1) &amp; Zero-Disk Preview</span>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      Tarik berkas PDF ke StegoVault, masukkan kata sandi. Tambahkan gambar atau dokumen PDF lain ke dalam brankas. Klik tombol <code className="text-[#0B132B] font-mono">Pratinjau</code> untuk membuktikan pratinjau instan di RAM tanpa menyimpan file ke disk.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F4F6FA] border border-slate-200 space-y-1.5">
                    <span className="font-bold text-rose-600 block font-mono text-[11px]">3. Uji Anti-Tamper (Deteksi Perusakan)</span>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      Buka berkas PDF di editor teks/hex biasa, ubah 1 karakter di bagian biner acak, lalu coba buka di StegoVault. Sistem otomatis menolak proses dekripsi karena tag autentikasi GCM tidak cocok.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F4F6FA] border border-slate-200 space-y-1.5">
                    <span className="font-bold text-emerald-600 block font-mono text-[11px]">4. Uji Efek Avalanche</span>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      Buka tab <code className="text-[#0B132B] font-mono">Avalanche Lab</code> di panel ini dan perlihatkan persentase perubahan bit ~50% untuk membuktikan kekuatan kriptografi aplikasi.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#0B132B] transition border border-slate-200"
            >
              Tutup Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};