/**
 * StegoVault Virtual Filesystem & PDF Container Wrapper.
 * 
 * Binary layout:
 * [COVER PDF] + [STEGOVAULT_V1\0 (14B)] + [SALT (16B)] + [IV (12B)] + [PAYLOAD (NB)] + [LENGTH (8B)] + [SV_END (6B)]
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { 
  VirtualFile, 
  VirtualFileMeta, 
  VolumeManifest, 
  ContainerHeaderInfo, 
  SealVaultResult, 
  UnsealVaultResult 
} from '../types/container.ts';
import { 
  deriveKey, 
  encryptData, 
  decryptData, 
  generateSalt, 
  generateIV, 
  zeroMemory
} from './crypto.ts';

export const CONTAINER_MAGIC = {
  HEADER: 'STEGOVAULT_V1\0',
  HEADER_BYTES_LENGTH: 14,
  SALT_BYTES_LENGTH: 16,
  IV_BYTES_LENGTH: 12,
  LENGTH_FIELD_BYTES: 8,
  FOOTER: 'SV_END',
  FOOTER_BYTES_LENGTH: 6,
  MINIMUM_CONTAINER_SIZE: 14 + 16 + 12 + 16 + 8 + 6,
} as const;

export class ContainerError extends Error {
  public readonly code: 'NOT_STEGOVAULT' | 'CORRUPTED' | 'INVALID_STRUCTURE';

  constructor(message: string, code: 'NOT_STEGOVAULT' | 'CORRUPTED' | 'INVALID_STRUCTURE') {
    super(message);
    this.code = code;
    this.name = 'ContainerError';
  }
}

export function packVirtualFilesystem(
  volumeName: string,
  files: { id?: string; name: string; mimeType: string; data: Uint8Array; modifiedAt?: string }[]
): { buffer: Uint8Array; manifest: VolumeManifest } {
  let currentOffset = 0;
  const fileMetas: VirtualFileMeta[] = [];

  for (const f of files) {
    const fileId = f.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `file-${Math.random().toString(36).substring(2, 9)}`);
    const size = f.data.byteLength;
    fileMetas.push({
      id: fileId,
      name: f.name,
      mimeType: f.mimeType || 'application/octet-stream',
      size: size,
      offset: currentOffset,
      modifiedAt: f.modifiedAt || new Date().toISOString(),
    });
    currentOffset += size;
  }

  const nowIso = new Date().toISOString();
  const manifest: VolumeManifest = {
    volumeName: volumeName.trim() || 'Vault_Container',
    version: '1.0',
    createdAt: nowIso,
    updatedAt: nowIso,
    files: fileMetas,
  };

  const manifestJson = JSON.stringify(manifest);
  const manifestBytes = new TextEncoder().encode(manifestJson);
  const manifestLength = manifestBytes.byteLength;

  const totalVfsSize = 4 + manifestLength + currentOffset;
  const vfsBuffer = new Uint8Array(totalVfsSize);
  const view = new DataView(vfsBuffer.buffer, vfsBuffer.byteOffset, vfsBuffer.byteLength);

  view.setUint32(0, manifestLength, false);
  vfsBuffer.set(manifestBytes, 4);

  const rawBytesBaseOffset = 4 + manifestLength;
  for (let i = 0; i < files.length; i++) {
    const meta = fileMetas[i];
    vfsBuffer.set(files[i].data, rawBytesBaseOffset + meta.offset);
  }

  return { buffer: vfsBuffer, manifest };
}

export function unpackVirtualFilesystem(
  decryptedBuffer: Uint8Array
): { manifest: VolumeManifest; files: Map<string, VirtualFile> } {
  if (decryptedBuffer.byteLength < 4) {
    throw new ContainerError('Data virtual filesystem rusak: buffer terlalu pendek.', 'CORRUPTED');
  }

  const view = new DataView(decryptedBuffer.buffer, decryptedBuffer.byteOffset, decryptedBuffer.byteLength);
  const manifestLength = view.getUint32(0, false);

  if (4 + manifestLength > decryptedBuffer.byteLength) {
    throw new ContainerError('Data virtual filesystem rusak: panjang manifest melebihi ukuran buffer.', 'CORRUPTED');
  }

  const manifestBytes = decryptedBuffer.subarray(4, 4 + manifestLength);
  const manifestJson = new TextDecoder().decode(manifestBytes);

  let manifest: VolumeManifest;
  try {
    manifest = JSON.parse(manifestJson) as VolumeManifest;
  } catch {
    throw new ContainerError('Gagal mem-parse manifest virtual filesystem.', 'CORRUPTED');
  }

  const rawBytesBaseOffset = 4 + manifestLength;
  const fileMap = new Map<string, VirtualFile>();

  for (const meta of manifest.files) {
    const start = rawBytesBaseOffset + meta.offset;
    const end = start + meta.size;

    if (end > decryptedBuffer.byteLength) {
      throw new ContainerError(`Ukuran file "${meta.name}" melebihi batas buffer kontainer.`, 'CORRUPTED');
    }

    const fileBytes = decryptedBuffer.slice(start, end);
    fileMap.set(meta.id, {
      ...meta,
      data: fileBytes,
    });
  }

  return { manifest, files: fileMap };
}

export async function generateCoverPdf(volumeName: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderColor: rgb(0.15, 0.35, 0.75),
    borderWidth: 2,
    color: rgb(0.98, 0.99, 1.0),
  });

  page.drawRectangle({
    x: 36,
    y: height - 120,
    width: width - 72,
    height: 84,
    color: rgb(0.04, 0.08, 0.18),
  });

  page.drawText('STEGOVAULT  *  SECURE STORAGE ENCLAVE', {
    x: 56,
    y: height - 68,
    size: 11,
    font: fontMono,
    color: rgb(0.22, 0.74, 0.97),
  });

  page.drawText('DOKUMEN KONTAINER TERENKRIPSI', {
    x: 56,
    y: height - 94,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawRectangle({
    x: 56,
    y: height - 180,
    width: width - 112,
    height: 38,
    color: rgb(0.93, 0.96, 1.0),
    borderColor: rgb(0.7, 0.82, 0.98),
    borderWidth: 1,
  });

  page.drawText('ENKRIPSI TERAUTENTIKASI: AES-256-GCM  *  KDF: PBKDF2-SHA256 (310,000 ITERASI)', {
    x: 72,
    y: height - 164,
    size: 9.5,
    font: fontMono,
    color: rgb(0.12, 0.35, 0.8),
  });

  const safeVolumeName = volumeName.length > 40 ? volumeName.substring(0, 37) + '...' : volumeName;
  page.drawText('INFORMASI VOLUME KONTAINER:', {
    x: 56,
    y: height - 220,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  page.drawText(`Nama Volume   : ${safeVolumeName}`, {
    x: 56,
    y: height - 242,
    size: 10,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawText(`Waktu Dibuat  : ${new Date().toUTCString()}`, {
    x: 56,
    y: height - 258,
    size: 10,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawText(`Format Wadah  : PDF-Wrapped Container (STEGOVAULT_V1)`, {
    x: 56,
    y: height - 274,
    size: 10,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawRectangle({
    x: 56,
    y: height - 440,
    width: width - 112,
    height: 140,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.85, 0.9, 0.95),
    borderWidth: 1,
  });

  page.drawText('PETUNJUK PENGGUNAAN:', {
    x: 76,
    y: height - 325,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });

  page.drawText('1. Berkas ini bukan dokumen PDF biasa. Dokumen ini merupakan brankas berkas virtual', {
    x: 76,
    y: height - 345,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawText('   yang dienkripsi menggunakan standar AES-256-GCM.', {
    x: 76,
    y: height - 360,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawText('2. Gunakan aplikasi web StegoVault untuk membuka (Mount), melihat pratinjau berkas,', {
    x: 76,
    y: height - 380,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawText('   atau mengekstrak kembali isi dokumen secara aman.', {
    x: 76,
    y: height - 395,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawText('3. Seluruh proses pembukaan volume berjalan di memori peramban Anda (Zero-Knowledge).', {
    x: 76,
    y: height - 415,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawRectangle({
    x: 56,
    y: 80,
    width: width - 112,
    height: 90,
    color: rgb(1.0, 0.96, 0.96),
    borderColor: rgb(0.95, 0.7, 0.7),
    borderWidth: 1,
  });

  page.drawText('PERINGATAN PENTING (SECURITY INTEGRITY NOTICE):', {
    x: 76,
    y: 145,
    size: 10,
    font: fontBold,
    color: rgb(0.75, 0.1, 0.1),
  });

  page.drawText('Dilarang mengedit, menggabungkan (merge), mengompres, atau menyimpan ulang berkas ini', {
    x: 76,
    y: 125,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.15, 0.15),
  });

  page.drawText('menggunakan aplikasi pembaca PDF eksternal. Perubahan akan merusak blok payload', {
    x: 76,
    y: 110,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.15, 0.15),
  });

  page.drawText('terenkripsi dan menyebabkan seluruh data volume gagal didekripsi secara permanen.', {
    x: 76,
    y: 95,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.15, 0.15),
  });

  page.drawText('StegoVault Architecture * Lomba CAPSTONE 2026 * Kriptografi dan Keamanan Data', {
    x: 56,
    y: 52,
    size: 8,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.65),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

export function assemblePdfContainer(
  coverPdfBytes: Uint8Array,
  salt: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array
): Uint8Array {
  const headerBytes = new TextEncoder().encode(CONTAINER_MAGIC.HEADER);
  const footerBytes = new TextEncoder().encode(CONTAINER_MAGIC.FOOTER);
  const payloadLength = ciphertext.byteLength;

  const totalLength = 
    coverPdfBytes.byteLength + 
    headerBytes.byteLength + 
    salt.byteLength + 
    iv.byteLength + 
    payloadLength + 
    CONTAINER_MAGIC.LENGTH_FIELD_BYTES + 
    footerBytes.byteLength;

  const container = new Uint8Array(totalLength);
  let offset = 0;

  container.set(coverPdfBytes, offset);
  offset += coverPdfBytes.byteLength;

  container.set(headerBytes, offset);
  offset += headerBytes.byteLength;

  container.set(salt, offset);
  offset += salt.byteLength;

  container.set(iv, offset);
  offset += iv.byteLength;

  container.set(ciphertext, offset);
  offset += payloadLength;

  const view = new DataView(container.buffer, container.byteOffset + offset, CONTAINER_MAGIC.LENGTH_FIELD_BYTES);
  view.setBigUint64(0, BigInt(payloadLength), false);
  offset += CONTAINER_MAGIC.LENGTH_FIELD_BYTES;

  container.set(footerBytes, offset);

  return container;
}

export function inspectAndExtractContainer(fileBytes: Uint8Array): ContainerHeaderInfo {
  const totalFileSize = fileBytes.byteLength;

  if (totalFileSize < CONTAINER_MAGIC.MINIMUM_CONTAINER_SIZE) {
    return {
      isValidStegoVault: false,
      coverPdfSize: 0,
      totalFileSize,
      errorMessage: 'Berkas terlalu kecil untuk menjadi kontainer StegoVault yang valid.',
    };
  }

  const footerOffset = totalFileSize - CONTAINER_MAGIC.FOOTER_BYTES_LENGTH;
  const footerBytes = fileBytes.subarray(footerOffset, totalFileSize);
  const footerStr = new TextDecoder().decode(footerBytes);

  if (footerStr !== CONTAINER_MAGIC.FOOTER) {
    return {
      isValidStegoVault: false,
      coverPdfSize: totalFileSize,
      totalFileSize,
      errorMessage: 'Berkas PDF ini bukan merupakan kontainer StegoVault yang valid (penanda SV_END tidak ditemukan).',
    };
  }

  const lengthOffset = footerOffset - CONTAINER_MAGIC.LENGTH_FIELD_BYTES;
  const view = new DataView(fileBytes.buffer, fileBytes.byteOffset + lengthOffset, CONTAINER_MAGIC.LENGTH_FIELD_BYTES);
  const payloadLengthBig = view.getBigUint64(0, false);
  const payloadLength = Number(payloadLengthBig);

  const trailerMetaSize = 
    CONTAINER_MAGIC.FOOTER_BYTES_LENGTH + 
    CONTAINER_MAGIC.LENGTH_FIELD_BYTES + 
    CONTAINER_MAGIC.IV_BYTES_LENGTH + 
    CONTAINER_MAGIC.SALT_BYTES_LENGTH + 
    CONTAINER_MAGIC.HEADER_BYTES_LENGTH;

  const headerOffset = totalFileSize - trailerMetaSize - payloadLength;

  if (headerOffset < 0 || payloadLength < 16) {
    return {
      isValidStegoVault: false,
      coverPdfSize: 0,
      totalFileSize,
      errorMessage: 'Struktur kontainer rusak: kalkulasi offset payload melebihi ukuran dokumen.',
    };
  }

  const headerBytes = fileBytes.subarray(headerOffset, headerOffset + CONTAINER_MAGIC.HEADER_BYTES_LENGTH);
  const headerStr = new TextDecoder().decode(headerBytes);

  if (headerStr !== CONTAINER_MAGIC.HEADER) {
    return {
      isValidStegoVault: false,
      coverPdfSize: 0,
      totalFileSize,
      errorMessage: 'Header STEGOVAULT_V1 tidak cocok. Kontainer tidak valid atau telah dirusak.',
    };
  }

  const saltStart = headerOffset + CONTAINER_MAGIC.HEADER_BYTES_LENGTH;
  const ivStart = saltStart + CONTAINER_MAGIC.SALT_BYTES_LENGTH;
  const ciphertextStart = ivStart + CONTAINER_MAGIC.IV_BYTES_LENGTH;
  const ciphertextEnd = ciphertextStart + payloadLength;

  const salt = fileBytes.slice(saltStart, ivStart);
  const iv = fileBytes.slice(ivStart, ciphertextStart);
  const ciphertext = fileBytes.slice(ciphertextStart, ciphertextEnd);

  return {
    isValidStegoVault: true,
    coverPdfSize: headerOffset,
    salt,
    iv,
    ciphertext,
    payloadLength,
    totalFileSize,
  };
}

export async function sealVaultToPdf(
  volumeName: string,
  files: { id?: string; name: string; mimeType: string; data: Uint8Array; modifiedAt?: string }[],
  password: string,
  customSalt?: Uint8Array,
  customIV?: Uint8Array
): Promise<SealVaultResult> {
  const startTime = performance.now();

  const packStartTime = performance.now();
  const { buffer: vfsBuffer, manifest } = packVirtualFilesystem(volumeName, files);
  const packagingDurationMs = performance.now() - packStartTime;

  try {
    const salt = customSalt || generateSalt();
    const iv = customIV || generateIV();

    const { key, durationMs: kdfDurationMs } = await deriveKey(password, salt);
    const { ciphertext, durationMs: encryptionDurationMs } = await encryptData(vfsBuffer, key, iv);
    const coverPdfBytes = await generateCoverPdf(volumeName);
    const pdfBytes = assemblePdfContainer(coverPdfBytes, salt, iv, ciphertext);
    const totalDurationMs = performance.now() - startTime;

    return {
      pdfBytes,
      manifest,
      salt,
      iv,
      kdfDurationMs,
      encryptionDurationMs,
      packagingDurationMs: Number(packagingDurationMs.toFixed(2)),
      totalDurationMs: Number(totalDurationMs.toFixed(2)),
      totalFilesCount: files.length,
      payloadSize: ciphertext.byteLength,
      totalPdfSize: pdfBytes.byteLength,
    };
  } finally {
    zeroMemory(vfsBuffer);
  }
}

export async function unsealVaultFromPdf(
  pdfBytes: Uint8Array,
  password: string
): Promise<UnsealVaultResult> {
  const startTime = performance.now();

  const containerInfo = inspectAndExtractContainer(pdfBytes);
  if (!containerInfo.isValidStegoVault || !containerInfo.salt || !containerInfo.iv || !containerInfo.ciphertext) {
    throw new ContainerError(
      containerInfo.errorMessage || 'Berkas bukan kontainer StegoVault valid.',
      'NOT_STEGOVAULT'
    );
  }

  const { key, durationMs: kdfDurationMs } = await deriveKey(password, containerInfo.salt);
  const { decrypted, durationMs: decryptionDurationMs } = await decryptData(
    containerInfo.ciphertext,
    key,
    containerInfo.iv
  );

  try {
    const unpackStartTime = performance.now();
    const { manifest, files } = unpackVirtualFilesystem(decrypted);
    const unpackDurationMs = performance.now() - unpackStartTime;
    const totalDurationMs = performance.now() - startTime;

    return {
      manifest,
      files,
      kdfDurationMs,
      decryptionDurationMs,
      unpackDurationMs: Number(unpackDurationMs.toFixed(2)),
      totalDurationMs: Number(totalDurationMs.toFixed(2)),
      totalFilesCount: files.size,
    };
  } finally {
    zeroMemory(decrypted);
  }
}
