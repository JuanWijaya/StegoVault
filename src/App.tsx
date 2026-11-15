import { useState } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { CreateVolumeModal } from './components/CreateVolumeModal.tsx';
import { MountGateModal } from './components/MountGateModal.tsx';
import { VirtualDrive } from './components/VirtualDrive.tsx';
import { SecurityDrawer } from './components/SecurityDrawer.tsx';
import { VirtualFile, SealVaultResult, UnsealVaultResult } from './types/container.ts';
import { sealVaultToPdf } from './utils/container.ts';
import { zeroMemory } from './utils/crypto.ts';

type AppScreen = 'dashboard' | 'workspace';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMountModalOpen, setIsMountModalOpen] = useState(false);
  const [isSecurityDrawerOpen, setIsSecurityDrawerOpen] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileBytes, setSelectedFileBytes] = useState<Uint8Array | null>(null);

  const [activeVolumeName, setActiveVolumeName] = useState<string>('');
  const [activeFiles, setActiveFiles] = useState<Map<string, VirtualFile>>(new Map());
  const [activePassword, setActivePassword] = useState<string>('');
  const [isUnmounting, setIsUnmounting] = useState(false);
  const [lastMetrics, setLastMetrics] = useState<{
    volumeName?: string;
    kdfDurationMs?: number;
    cryptoDurationMs?: number;
    payloadSize?: number;
    coverSize?: number;
  }>();

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    try {
      const buffer = await file.arrayBuffer();
      setSelectedFileBytes(new Uint8Array(buffer));
      setIsMountModalOpen(true);
    } catch {
      alert('Gagal membaca berkas PDF.');
    }
  };

  const handleMounted = (result: UnsealVaultResult, password: string) => {
    setActiveVolumeName(result.manifest.volumeName);
    setActiveFiles(result.files);
    setActivePassword(password);
    setIsMountModalOpen(false);
    setSelectedFile(null);
    setSelectedFileBytes(null);
    setLastMetrics({
      volumeName: result.manifest.volumeName,
      kdfDurationMs: result.kdfDurationMs,
      cryptoDurationMs: result.decryptionDurationMs,
      payloadSize: Array.from(result.files.values()).reduce((acc, f) => acc + f.size, 0),
    });
    setCurrentScreen('workspace');
  };

  const handleVaultCreated = (result: SealVaultResult, password: string) => {
    setActiveVolumeName(result.manifest.volumeName);
    setActiveFiles(new Map());
    setActivePassword(password);
    setIsCreateModalOpen(false);
    setLastMetrics({
      volumeName: result.manifest.volumeName,
      kdfDurationMs: result.kdfDurationMs,
      cryptoDurationMs: result.encryptionDurationMs,
      payloadSize: result.payloadSize,
      coverSize: 2386,
    });
    setCurrentScreen('workspace');
  };

  const handleAddFiles = (newFiles: { name: string; mimeType: string; data: Uint8Array }[]) => {
    setActiveFiles(prev => {
      const updated = new Map(prev);
      for (const f of newFiles) {
        const id = crypto.randomUUID ? crypto.randomUUID() : `file-${Math.random().toString(36).substring(2, 9)}`;
        updated.set(id, {
          id,
          name: f.name,
          mimeType: f.mimeType,
          size: f.data.byteLength,
          offset: 0,
          modifiedAt: new Date().toISOString(),
          data: f.data,
        });
      }
      return updated;
    });
  };

  const handleDeleteFile = (fileId: string) => {
    setActiveFiles(prev => {
      const updated = new Map(prev);
      const target = updated.get(fileId);
      if (target) {
        zeroMemory(target.data);
        updated.delete(fileId);
      }
      return updated;
    });
  };

  const handleUnmount = async (shouldSave: boolean) => {
    setIsUnmounting(true);
    try {
      if (shouldSave && activePassword) {
        const fileList = Array.from(activeFiles.values());
        const result = await sealVaultToPdf(activeVolumeName, fileList, activePassword);

        const blob = new Blob([result.pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${activeVolumeName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      }
    } catch (err: unknown) {
      alert(`Gagal menyimpan kontainer: ${err instanceof Error ? err.message : 'Kesalahan tidak diketahui'}`);
      setIsUnmounting(false);
      return;
    }

    for (const file of activeFiles.values()) {
      zeroMemory(file.data);
    }
    setActiveFiles(new Map());
    setActiveVolumeName('');
    setActivePassword('');
    setIsUnmounting(false);
    setCurrentScreen('dashboard');
  };

  return (
    <div className={`min-h-screen ${currentScreen === 'dashboard' ? 'bg-[#03071E]' : 'bg-[#F4F6FA]'} text-[#0B132B] flex flex-col font-sans selection:bg-[#3B5BFF] selection:text-white`}>
      <Navbar
        onOpenBenchmark={() => setIsSecurityDrawerOpen(true)}
        activeScreen={currentScreen}
        volumeName={activeVolumeName}
      />

      <main className={`flex-1 ${currentScreen === 'dashboard' ? '-mt-[72px]' : ''}`}>
        {currentScreen === 'dashboard' ? (
          <Dashboard
            onCreateVolumeClick={() => setIsCreateModalOpen(true)}
            onFileSelected={handleFileSelected}
            onOpenBenchmark={() => setIsSecurityDrawerOpen(true)}
          />
        ) : (
          <VirtualDrive
            volumeName={activeVolumeName}
            files={activeFiles}
            onAddFiles={handleAddFiles}
            onDeleteFile={handleDeleteFile}
            onUnmount={handleUnmount}
            isUnmounting={isUnmounting}
          />
        )}
      </main>

      <CreateVolumeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onVaultCreated={handleVaultCreated}
      />

      <MountGateModal
        isOpen={isMountModalOpen}
        file={selectedFile}
        fileBytes={selectedFileBytes}
        onClose={() => {
          setIsMountModalOpen(false);
          setSelectedFile(null);
          setSelectedFileBytes(null);
        }}
        onMounted={handleMounted}
      />

      <SecurityDrawer
        isOpen={isSecurityDrawerOpen}
        onClose={() => setIsSecurityDrawerOpen(false)}
        activeSessionMetrics={lastMetrics}
      />

      <footer className="border-t border-slate-200 bg-white px-6 py-6 text-center text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 StegoVault * Web-Based Encrypted Container Vault.</p>
          <p>Lomba CAPSTONE 2026 • Kriptografi dan Keamanan Data</p>
        </div>
      </footer>
    </div>
  );
}