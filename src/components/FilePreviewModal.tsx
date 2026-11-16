import React, { useEffect, useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Code, 
  File, 
  ZoomIn, 
  ZoomOut
} from 'lucide-react';
import { VirtualFile } from '../types/container.ts';
import { formatBytes } from '../utils/crypto.ts';

interface FilePreviewModalProps {
  isOpen: boolean;
  file: VirtualFile | null;
  onClose: () => void;
  onExport: (file: VirtualFile) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  file,
  onClose,
  onExport
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

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
    if (!file) {
      setBlobUrl(null);
      setTextContent(null);
      return;
    }

    const mime = file.mimeType.toLowerCase();
    const isText = mime.startsWith('text/') || 
                   mime.includes('json') || 
                   mime.includes('javascript') || 
                   mime.includes('typescript') ||
                   file.name.endsWith('.txt') ||
                   file.name.endsWith('.md') ||
                   file.name.endsWith('.json') ||
                   file.name.endsWith('.js') ||
                   file.name.endsWith('.ts') ||
                   file.name.endsWith('.py');

    if (isText) {
      try {
        const text = new TextDecoder('utf-8').decode(file.data);
        setTextContent(text);
      } catch {
        setTextContent('Tidak dapat membaca konten teks.');
      }
    } else {
      setTextContent(null);
    }

    const blob = new Blob([file.data.buffer as ArrayBuffer], { type: file.mimeType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    setZoomLevel(1);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!isOpen || !file) return null;

  const isImage = file.mimeType.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf' || file.name.endsWith('.pdf');
  const isText = textContent !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#070B19]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-[28px] shadow-2xl flex flex-col overflow-hidden text-[#0B132B]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Toolbar */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#163AC7] shrink-0">
              {isImage ? <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" /> : isPdf ? <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#163AC7]" /> : isText ? <Code className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" /> : <File className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />}
            </div>
            <div className="overflow-hidden min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-[#0B132B] truncate">{file.name}</h3>
              <p className="text-[11px] sm:text-xs font-mono text-[#64748B]">
                {formatBytes(file.size)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isImage && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200 mr-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                  aria-label="Perkecil tampilan gambar"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white text-[#64748B] hover:text-[#0B132B] transition"
                  title="Perkecil"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono px-1.5 text-[#0B132B] font-semibold">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                  aria-label="Perbesar tampilan gambar"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white text-[#64748B] hover:text-[#0B132B] transition"
                  title="Perbesar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => onExport(file)}
              aria-label={`Ekspor berkas ${file.name}`}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-[#0B132B] transition"
              title="Unduh berkas keluar dari brankas"
            >
              <Download className="w-4 h-4 text-[#163AC7]" />
              <span className="hidden sm:inline">Ekspor</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup jendela pratinjau"
              className="min-h-[44px] min-w-[44px] rounded-full bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#0B132B] flex items-center justify-center transition border border-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#F4F6FA] flex items-center justify-center min-h-[350px]">
          {isImage && blobUrl && (
            <div className="relative overflow-auto max-h-[70vh] flex items-center justify-center w-full">
              <img 
                src={blobUrl} 
                alt={file.name} 
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                className="max-h-[65vh] object-contain rounded-xl shadow-lg transition-transform duration-200 bg-white"
              />
              <div className="sm:hidden absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-md rounded-full p-1 border border-slate-200 shadow-md">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                  aria-label="Perkecil tampilan gambar"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-slate-100 text-[#64748B]"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono px-1 text-[#0B132B] font-semibold">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                  aria-label="Perbesar tampilan gambar"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-slate-100 text-[#0B132B]"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {isPdf && blobUrl && (
            <iframe
              src={blobUrl}
              title={file.name}
              className="w-full h-[65vh] rounded-xl border border-slate-200 bg-white shadow-sm"
            />
          )}

          {isText && textContent !== null && (
            <div className="w-full h-[65vh] bg-white rounded-2xl border border-slate-200 p-5 overflow-auto shadow-sm">
              <pre className="font-mono text-xs text-[#0B132B] leading-relaxed whitespace-pre-wrap break-all">
                <code>{textContent}</code>
              </pre>
            </div>
          )}

          {!isImage && !isPdf && !isText && (
            <div className="text-center py-12 space-y-4 max-w-md">
              <div className="w-16 h-16 rounded-3xl bg-[#EEF2FF] text-[#163AC7] flex items-center justify-center mx-auto shadow-sm">
                <File className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-[#0B132B] text-base">Pratinjau Langsung Tidak Didukung</h4>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Format berkas biner ini (<span className="font-mono text-[#163AC7]">{file.mimeType}</span>) tidak dapat dirender langsung di peramban. Anda dapat mengekspor berkas ini ke komputer untuk membukanya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onExport(file)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3B5BFF] hover:bg-[#2745E8] text-xs font-semibold text-white shadow-md transition min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Ekspor File ({formatBytes(file.size)})</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 text-[11px] text-[#64748B]">
          <span>MIME: <code className="text-[#0B132B] font-mono">{file.mimeType}</code></span>
          <span className="font-mono text-emerald-600 font-medium">RAM Protected (Auto-Revoke)</span>
        </div>
      </div>
    </div>
  );
};