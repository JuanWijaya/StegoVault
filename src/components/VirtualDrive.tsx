import React, { useState, useRef } from 'react';
import { 
  FolderLock, 
  Upload, 
  Save, 
  Trash2, 
  Eye, 
  Download, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Code, 
  FileArchive, 
  File, 
  ShieldCheck, 
  Loader2,
  HardDrive
} from 'lucide-react';
import { VirtualFile } from '../types/container.ts';
import { formatBytes } from '../utils/crypto.ts';
import { FilePreviewModal } from './FilePreviewModal.tsx';

interface VirtualDriveProps {
  volumeName: string;
  files: Map<string, VirtualFile>;
  onAddFiles: (newFiles: { name: string; mimeType: string; data: Uint8Array }[]) => void;
  onDeleteFile: (fileId: string) => void;
  onUnmount: (shouldSave: boolean) => Promise<void>;
  isUnmounting: boolean;
}

export const VirtualDrive: React.FC<VirtualDriveProps> = ({
  volumeName,
  files,
  onAddFiles,
  onDeleteFile,
  onUnmount,
  isUnmounting
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [previewFile, setPreviewFile] = useState<VirtualFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileList = Array.from(files.values());
  const totalBytes = fileList.reduce((acc, f) => acc + f.size, 0);

  const filteredFiles = fileList.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await processUploadedFiles(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processUploadedFiles = async (uploaded: File[]) => {
    const prepared: { name: string; mimeType: string; data: Uint8Array }[] = [];
    for (const f of uploaded) {
      const buffer = await f.arrayBuffer();
      prepared.push({
        name: f.name,
        mimeType: f.type || 'application/octet-stream',
        data: new Uint8Array(buffer),
      });
    }
    onAddFiles(prepared);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processUploadedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleExportFile = (file: VirtualFile) => {
    const blob = new Blob([file.data.buffer as ArrayBuffer], { type: file.mimeType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (file: VirtualFile) => {
    const mime = file.mimeType.toLowerCase();
    if (mime.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-purple-600" />;
    if (mime === 'application/pdf' || file.name.endsWith('.pdf')) return <FileText className="w-5 h-5 text-[#163AC7]" />;
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || mime.includes('gzip')) return <FileArchive className="w-5 h-5 text-amber-600" />;
    if (mime.startsWith('text/') || mime.includes('json') || mime.includes('javascript') || mime.includes('typescript')) return <Code className="w-5 h-5 text-emerald-600" />;
    return <File className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* 1. Compact Cobalt Top Header */}
      <div className="fluted-hero-bg rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-sky-500/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 p-0.5 flex items-center justify-center shrink-0">
            <FolderLock className="w-6 h-6 text-sky-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="text-xl font-extrabold text-white tracking-tight">{volumeName}</h2>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-mono text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Mounted (AES-256-GCM Active)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono text-[#B8C7F0] mt-1.5">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-sky-300" />
                {files.size} Berkas
              </span>
              <span>•</span>
              <span className="text-white font-semibold">{formatBytes(totalBytes)} Payload</span>
              <span>•</span>
              <span className="text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero-Knowledge RAM
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Add File & Unmount */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start sm:justify-end">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUnmounting}
            aria-label="Tambah berkas baru ke brankas"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3B5BFF] hover:bg-[#2745E8] text-xs font-semibold text-white shadow-md transition-all min-h-[44px]"
          >
            <Upload className="w-4 h-4 text-white" />
            <span>+ Tambah Berkas</span>
          </button>

          <button
            type="button"
            onClick={() => onUnmount(true)}
            disabled={isUnmounting}
            aria-label="Simpan perubahan dan kunci brankas"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-xs font-semibold text-white shadow-md transition-all min-h-[44px] disabled:opacity-50"
          >
            {isUnmounting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membungkus Ulang PDF...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan &amp; Unmount</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Main Explorer Canvas (#F4F6FA) */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white border rounded-3xl shadow-sm overflow-hidden transition-all duration-200 ${
          isDragOver 
            ? 'border-[#3B5BFF] ring-2 ring-blue-100 bg-blue-50/20' 
            : 'border-slate-200'
        }`}
      >
        {/* Search & Stats Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berkas dalam brankas..."
              aria-label="Cari berkas dalam brankas"
              className="w-full pl-10 pr-4 py-2 rounded-full bg-white border border-slate-200 text-xs text-[#0B132B] placeholder:text-[#64748B] focus:outline-none focus:border-[#3B5BFF] transition"
            />
          </div>

          <span className="text-xs font-mono text-[#64748B] shrink-0">
            Menampilkan {filteredFiles.length} dari {files.size} berkas
          </span>
        </div>

        {/* File Content Area */}
        {files.size === 0 ? (
          <div className="text-center py-20 px-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#EEF2FF] text-[#163AC7] flex items-center justify-center mx-auto shadow-sm">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-[#0B132B] text-base">Brankas Virtual Masih Kosong</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 leading-relaxed">
                Tarik dan lepas berkas apa saja ke area ini, atau klik tombol <span className="text-[#163AC7] font-semibold">+ Tambah Berkas</span> di atas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3B5BFF] hover:bg-[#2745E8] text-xs font-semibold text-white shadow-md transition min-h-[44px]"
            >
              <Upload className="w-4 h-4" />
              <span>Pilih Berkas dari Komputer</span>
            </button>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-16 px-6 text-[#64748B] text-xs">
            Tidak ada berkas yang cocok dengan pencarian "{searchQuery}".
          </div>
        ) : (
          <div>
            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-mono text-[#64748B] uppercase tracking-wider bg-slate-50/40">
                    <th className="py-3.5 px-6 font-semibold">Nama Berkas</th>
                    <th className="py-3.5 px-4 font-semibold">Tipe MIME</th>
                    <th className="py-3.5 px-4 font-semibold">Ukuran</th>
                    <th className="py-3.5 px-4 font-semibold">Waktu Ditambahkan</th>
                    <th className="py-3.5 px-6 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredFiles.map((file) => (
                    <tr 
                      key={file.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="py-3.5 px-6 font-medium text-[#0B132B]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
                            {getFileIcon(file)}
                          </div>
                          <span className="font-semibold text-[#0B132B] truncate max-w-xs">{file.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#64748B] text-[11px]">
                        {file.mimeType}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#0B132B] text-[11px]">
                        {formatBytes(file.size)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#64748B] text-[11px]">
                        {new Date(file.modifiedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewFile(file)}
                            aria-label={`Lihat pratinjau ${file.name}`}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-[#EEF2FF] text-[#163AC7] transition"
                            title="Lihat Pratinjau di Memori (Zero-Disk)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportFile(file)}
                            aria-label={`Ekspor ${file.name} ke komputer`}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 text-[#0B132B] transition"
                            title="Ekspor Berkas ke Komputer"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteFile(file.id)}
                            aria-label={`Hapus ${file.name} dari brankas`}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-rose-50 text-rose-600 transition"
                            title="Hapus dari Brankas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (Reflow for small screens) */}
            <div className="md:hidden p-4 space-y-3">
              {filteredFiles.map((file) => (
                <div 
                  key={file.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
                      {getFileIcon(file)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-[#0B132B] truncate">{file.name}</p>
                      <p className="text-[11px] font-mono text-[#64748B]">
                        {formatBytes(file.size)} • {file.mimeType}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[10px] font-mono text-[#64748B]">
                      {new Date(file.modifiedAt).toLocaleTimeString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewFile(file)}
                        aria-label={`Lihat pratinjau ${file.name}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-blue-50 text-[#163AC7]"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportFile(file)}
                        aria-label={`Ekspor ${file.name}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 text-[#0B132B]"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteFile(file.id)}
                        aria-label={`Hapus ${file.name}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-rose-50 text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drag Hint Footer */}
        <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#64748B] gap-1">
          <span>Tarik dan lepas berkas langsung ke area ini kapan saja.</span>
          <span className="font-mono text-[#163AC7] font-medium">Enkripsi AES-256-GCM diterapkan saat Unmount</span>
        </div>
      </div>

      <FilePreviewModal
        isOpen={previewFile !== null}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onExport={handleExportFile}
      />
    </div>
  );
};