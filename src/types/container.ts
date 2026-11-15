// Tipe data kontainer dan virtual filesystem StegoVault.

export interface VirtualFileMeta {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  offset: number;
  modifiedAt: string;
}

export interface VirtualFile extends VirtualFileMeta {
  data: Uint8Array;
  blobUrl?: string;
}

export interface VolumeManifest {
  volumeName: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  files: VirtualFileMeta[];
}

export interface ContainerHeaderInfo {
  isValidStegoVault: boolean;
  coverPdfSize: number;
  salt?: Uint8Array;
  iv?: Uint8Array;
  ciphertext?: Uint8Array;
  payloadLength?: number;
  totalFileSize: number;
  errorMessage?: string;
}

export interface SealVaultResult {
  pdfBytes: Uint8Array;
  manifest: VolumeManifest;
  salt: Uint8Array;
  iv: Uint8Array;
  kdfDurationMs: number;
  encryptionDurationMs: number;
  packagingDurationMs: number;
  totalDurationMs: number;
  totalFilesCount: number;
  payloadSize: number;
  totalPdfSize: number;
}

export interface UnsealVaultResult {
  manifest: VolumeManifest;
  files: Map<string, VirtualFile>;
  kdfDurationMs: number;
  decryptionDurationMs: number;
  unpackDurationMs: number;
  totalDurationMs: number;
  totalFilesCount: number;
}
