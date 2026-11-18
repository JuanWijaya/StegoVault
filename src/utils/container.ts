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
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // Palette warna enterprise invoice
  const brandNavy = rgb(0.08, 0.16, 0.32);
  const accentBlue = rgb(0.14, 0.38, 0.82);
  const darkText = rgb(0.12, 0.15, 0.22);
  const bodyText = rgb(0.25, 0.30, 0.38);
  const mutedText = rgb(0.48, 0.54, 0.62);
  const borderLight = rgb(0.86, 0.89, 0.94);
  const greenText = rgb(0.10, 0.58, 0.32);

  // 1. Top Brand Accent Bar
  page.drawRectangle({
    x: 0,
    y: height - 6,
    width: width,
    height: 6,
    color: brandNavy,
  });

  // 2. Header Section (Company Info & Invoice Header)
  page.drawText('NEXA CLOUD TECHNOLOGIES', {
    x: 44,
    y: height - 50,
    size: 15,
    font: fontBold,
    color: brandNavy,
  });

  page.drawText('Enterprise Cloud Infrastructure & IT Solutions', {
    x: 44,
    y: height - 64,
    size: 8.5,
    font: fontRegular,
    color: mutedText,
  });

  page.drawText('Menara Sudirman Lt. 18, Jl. Jend. Sudirman Kav. 60, Jakarta 12190', {
    x: 44,
    y: height - 76,
    size: 8,
    font: fontRegular,
    color: mutedText,
  });

  page.drawText('Email: billing@nexacloud.id | Tel: +62 21 5289-7000 | www.nexacloud.id', {
    x: 44,
    y: height - 88,
    size: 8,
    font: fontRegular,
    color: mutedText,
  });

  // Invoice Title & Status Badge (Right)
  page.drawText('FAKTUR / INVOICE', {
    x: width - 195,
    y: height - 50,
    size: 15,
    font: fontBold,
    color: brandNavy,
  });

  page.drawRectangle({
    x: width - 145,
    y: height - 82,
    width: 101,
    height: 20,
    color: rgb(0.92, 0.98, 0.94),
    borderColor: greenText,
    borderWidth: 1,
  });

  page.drawText('LUNAS / PAID', {
    x: width - 130,
    y: height - 76,
    size: 8.5,
    font: fontBold,
    color: greenText,
  });

  // Divider Line
  page.drawLine({
    start: { x: 44, y: height - 104 },
    end: { x: width - 44, y: height - 104 },
    thickness: 1,
    color: borderLight,
  });

  // Dynamic values
  const now = new Date();
  const issueDateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const dueDateStr = dueDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  const safeVolumeName = volumeName.trim() || 'Data_Archive';
  let hashVal = 0;
  for (let i = 0; i < safeVolumeName.length; i++) {
    hashVal = (hashVal * 31 + safeVolumeName.charCodeAt(i)) & 0xffff;
  }
  const invNumber = `INV/${now.getFullYear()}/XI/${String((hashVal % 8999) + 1000)}`;
  const poNumber = `PO-${now.getFullYear()}-${String(((hashVal * 7) % 89999) + 10000)}`;
  const displayVolume = safeVolumeName.length > 26 ? safeVolumeName.substring(0, 23) + '...' : safeVolumeName;

  // 3. Billing Details (Two Columns)
  // Left: Customer / Billed To
  page.drawText('TAGIHAN KEPADA (BILLED TO):', {
    x: 44,
    y: height - 124,
    size: 8,
    font: fontBold,
    color: mutedText,
  });

  page.drawText('PT. CIPTA MEGA PERSADA', {
    x: 44,
    y: height - 138,
    size: 10,
    font: fontBold,
    color: darkText,
  });

  page.drawText('Divisi Teknologi Informasi & Pengadaan Sistem', {
    x: 44,
    y: height - 152,
    size: 8.5,
    font: fontRegular,
    color: bodyText,
  });

  page.drawText('NPWP: 01.345.678.9-012.000', {
    x: 44,
    y: height - 165,
    size: 8.5,
    font: fontRegular,
    color: bodyText,
  });

  page.drawText('Gedung Bursa Efek Indonesia Tower 2, Jakarta', {
    x: 44,
    y: height - 178,
    size: 8.5,
    font: fontRegular,
    color: bodyText,
  });

  page.drawText('Email: finance@ciptamega.co.id', {
    x: 44,
    y: height - 191,
    size: 8.5,
    font: fontRegular,
    color: bodyText,
  });

  // Right: Invoice Metadata
  page.drawText('Nomor Invoice', { x: 320, y: height - 124, size: 8, font: fontRegular, color: mutedText });
  page.drawText(`: ${invNumber}`, { x: 410, y: height - 124, size: 8.5, font: fontBold, color: darkText });

  page.drawText('Tanggal Terbit', { x: 320, y: height - 138, size: 8, font: fontRegular, color: mutedText });
  page.drawText(`: ${issueDateStr}`, { x: 410, y: height - 138, size: 8.5, font: fontRegular, color: darkText });

  page.drawText('Jatuh Tempo', { x: 320, y: height - 152, size: 8, font: fontRegular, color: mutedText });
  page.drawText(`: ${dueDateStr}`, { x: 410, y: height - 152, size: 8.5, font: fontRegular, color: darkText });

  page.drawText('No. Pemesanan (PO)', { x: 320, y: height - 165, size: 8, font: fontRegular, color: mutedText });
  page.drawText(`: ${poNumber}`, { x: 410, y: height - 165, size: 8.5, font: fontRegular, color: darkText });

  page.drawText('Referensi Proyek', { x: 320, y: height - 178, size: 8, font: fontRegular, color: mutedText });
  page.drawText(`: ${displayVolume}`, { x: 410, y: height - 178, size: 8.5, font: fontBold, color: accentBlue });

  page.drawText('Metode Pembayaran', { x: 320, y: height - 191, size: 8, font: fontRegular, color: mutedText });
  page.drawText(': Transfer Bank (BCA Corporate)', { x: 410, y: height - 191, size: 8.5, font: fontRegular, color: darkText });

  // 4. Line Items Table
  const tableY = height - 215;
  page.drawRectangle({
    x: 44,
    y: tableY - 22,
    width: width - 88,
    height: 22,
    color: rgb(0.93, 0.95, 0.98),
    borderColor: borderLight,
    borderWidth: 1,
  });

  page.drawText('NO', { x: 52, y: tableY - 15, size: 7.5, font: fontBold, color: darkText });
  page.drawText('DESKRIPSI LAYANAN / PRODUK', { x: 80, y: tableY - 15, size: 7.5, font: fontBold, color: darkText });
  page.drawText('DURASI', { x: 320, y: tableY - 15, size: 7.5, font: fontBold, color: darkText });
  page.drawText('HARGA SATUAN', { x: 395, y: tableY - 15, size: 7.5, font: fontBold, color: darkText });
  page.drawText('TOTAL (IDR)', { x: 480, y: tableY - 15, size: 7.5, font: fontBold, color: darkText });

  const items = [
    {
      no: '1',
      title: 'Enterprise Cloud Storage Vault & Automated Snapshot Enclave',
      subtitle: 'Kapasitas dedicated high-availability tier 1 multi-region SLA 99.9%',
      qty: '1 Tahun',
      rate: 'Rp 8.500.000',
      total: 'Rp 8.500.000',
    },
    {
      no: '2',
      title: 'Managed Security Compliance & Zero-Trust Protocol Service',
      subtitle: 'Proteksi end-to-end terisolasi, audit berkala & proteksi integritas',
      qty: '1 Paket',
      rate: 'Rp 6.200.000',
      total: 'Rp 6.200.000',
    },
    {
      no: '3',
      title: 'Dedicated SSL/TLS Transport & Virtual Endpoint Gateway',
      subtitle: 'Konfigurasi gateway reverse-proxy terenkripsi tersertifikasi ISO 27001',
      qty: '1 Tahun',
      rate: 'Rp 3.800.000',
      total: 'Rp 3.800.000',
    },
    {
      no: '4',
      title: 'Dukungan Teknis Prioritas 24/7 & Disaster Recovery SLA',
      subtitle: 'Pemeliharaan preventif dan backup berkala terverifikasi enterprise',
      qty: '12 Bulan',
      rate: 'Rp 2.500.000',
      total: 'Rp 2.500.000',
    },
  ];

  let currentItemY = tableY - 22;
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const rowHeight = 36;
    const rowBg = idx % 2 === 1 ? rgb(0.985, 0.99, 1.0) : rgb(1, 1, 1);

    page.drawRectangle({
      x: 44,
      y: currentItemY - rowHeight,
      width: width - 88,
      height: rowHeight,
      color: rowBg,
      borderColor: borderLight,
      borderWidth: 0.5,
    });

    page.drawText(item.no, { x: 56, y: currentItemY - 16, size: 8, font: fontRegular, color: bodyText });
    page.drawText(item.title, { x: 80, y: currentItemY - 14, size: 8, font: fontBold, color: darkText });
    page.drawText(item.subtitle, { x: 80, y: currentItemY - 26, size: 7, font: fontRegular, color: mutedText });
    page.drawText(item.qty, { x: 320, y: currentItemY - 18, size: 8, font: fontRegular, color: bodyText });
    page.drawText(item.rate, { x: 395, y: currentItemY - 18, size: 8, font: fontRegular, color: bodyText });
    page.drawText(item.total, { x: 480, y: currentItemY - 18, size: 8, font: fontBold, color: darkText });

    currentItemY -= rowHeight;
  }

  // 5. Payment Details (Left) & Totals Summary (Right)
  const summaryBoxY = currentItemY - 18;

  // Left: Bank Information Box
  page.drawRectangle({
    x: 44,
    y: summaryBoxY - 96,
    width: 250,
    height: 96,
    color: rgb(0.98, 0.99, 1.0),
    borderColor: borderLight,
    borderWidth: 1,
  });

  page.drawText('INFORMASI REKENING & PEMBAYARAN:', {
    x: 54,
    y: summaryBoxY - 16,
    size: 7.5,
    font: fontBold,
    color: brandNavy,
  });

  page.drawText('Nama Bank     : Bank Central Asia (BCA)', {
    x: 54,
    y: summaryBoxY - 32,
    size: 7.5,
    font: fontRegular,
    color: bodyText,
  });

  page.drawText('No. Rekening  : 541-098-2190', {
    x: 54,
    y: summaryBoxY - 45,
    size: 8,
    font: fontBold,
    color: darkText,
  });

  page.drawText('Atas Nama     : PT NEXA CLOUD TECHNOLOGIES', {
    x: 54,
    y: summaryBoxY - 58,
    size: 7.5,
    font: fontRegular,
    color: bodyText,
  });

  page.drawText('Status Verifikasi: LUNAS (Terekonsiliasi Otomatis)', {
    x: 54,
    y: summaryBoxY - 72,
    size: 7.5,
    font: fontBold,
    color: greenText,
  });

  page.drawText('* Bukti setor elektronik sah tercatat di server bank.', {
    x: 54,
    y: summaryBoxY - 86,
    size: 7,
    font: fontRegular,
    color: mutedText,
  });

  // Right: Summary Table Box
  page.drawRectangle({
    x: 308,
    y: summaryBoxY - 96,
    width: width - 44 - 308,
    height: 96,
    color: rgb(0.99, 0.99, 1.0),
    borderColor: borderLight,
    borderWidth: 1,
  });

  page.drawText('Subtotal Layanan', { x: 320, y: summaryBoxY - 18, size: 8, font: fontRegular, color: bodyText });
  page.drawText('Rp 21.000.000', { x: 440, y: summaryBoxY - 18, size: 8, font: fontRegular, color: darkText });

  page.drawText('PPN / VAT (11%)', { x: 320, y: summaryBoxY - 34, size: 8, font: fontRegular, color: bodyText });
  page.drawText('Rp 2.310.000', { x: 440, y: summaryBoxY - 34, size: 8, font: fontRegular, color: darkText });

  page.drawLine({
    start: { x: 320, y: summaryBoxY - 44 },
    end: { x: width - 56, y: summaryBoxY - 44 },
    thickness: 0.8,
    color: borderLight,
  });

  page.drawText('Total Pembayaran', { x: 320, y: summaryBoxY - 58, size: 9, font: fontBold, color: brandNavy });
  page.drawText('Rp 23.310.000', { x: 432, y: summaryBoxY - 58, size: 9, font: fontBold, color: brandNavy });

  page.drawText('Telah Dibayar (Paid)', { x: 320, y: summaryBoxY - 72, size: 7.5, font: fontRegular, color: mutedText });
  page.drawText('Rp 23.310.000', { x: 440, y: summaryBoxY - 72, size: 7.5, font: fontRegular, color: mutedText });

  page.drawText('Sisa Tagihan (Balance)', { x: 320, y: summaryBoxY - 86, size: 8, font: fontBold, color: greenText });
  page.drawText('Rp 0 (LUNAS)', { x: 440, y: summaryBoxY - 86, size: 8, font: fontBold, color: greenText });

  // 6. Notes (Left) & Authorized Signature Stamp (Right)
  const notesY = summaryBoxY - 114;

  // Left: Terms
  page.drawText('CATATAN DAN KETENTUAN (TERMS & CONDITIONS):', {
    x: 44,
    y: notesY,
    size: 7.5,
    font: fontBold,
    color: mutedText,
  });

  page.drawText('1. Faktur ini merupakan dokumen elektronik resmi yang diterbitkan sah oleh sistem ERP.', {
    x: 44,
    y: notesY - 14,
    size: 7.5,
    font: fontRegular,
    color: bodyText,
  });

  page.drawText('2. Layanan cloud provisioning dan data enclave telah aktif selama periode lisensi berjalan.', {
    x: 44,
    y: notesY - 26,
    size: 7.5,
    font: fontRegular,
    color: bodyText,
  });

  page.drawText('3. Bukti potong pajak dan faktur pajak elektronik dapat diunduh via portal billing.', {
    x: 44,
    y: notesY - 38,
    size: 7.5,
    font: fontRegular,
    color: bodyText,
  });

  page.drawText('4. Untuk pertanyaan seputar rekonsiliasi faktur, hubungi finance@nexacloud.id.', {
    x: 44,
    y: notesY - 50,
    size: 7.5,
    font: fontRegular,
    color: bodyText,
  });

  // Right: Signature & Seal
  page.drawText('Hormat kami,', { x: 360, y: notesY, size: 8, font: fontRegular, color: bodyText });
  page.drawText('PT NEXA CLOUD TECHNOLOGIES', { x: 360, y: notesY - 12, size: 8.5, font: fontBold, color: brandNavy });

  page.drawRectangle({
    x: 360,
    y: notesY - 58,
    width: 160,
    height: 40,
    color: rgb(0.95, 0.97, 1.0),
    borderColor: accentBlue,
    borderWidth: 1,
  });

  page.drawText('[ DIGITAL SIGNATURE & STAMP ]', {
    x: 372,
    y: notesY - 30,
    size: 7,
    font: fontBold,
    color: accentBlue,
  });

  page.drawText('VERIFIED & PAID INVOICE', {
    x: 382,
    y: notesY - 42,
    size: 6.5,
    font: fontBold,
    color: greenText,
  });

  page.drawText(`Auth Code: NX-${hashVal.toString(16).toUpperCase()}-2026`, {
    x: 384,
    y: notesY - 52,
    size: 6.5,
    font: fontMono,
    color: mutedText,
  });

  page.drawText('Ir. Hendra Wijaya, M.M.', { x: 360, y: notesY - 72, size: 8.5, font: fontBold, color: darkText });
  page.drawText('Head of Corporate Billing & Finance Operations', { x: 360, y: notesY - 84, size: 7.5, font: fontRegular, color: mutedText });

  // 7. Footer Bar
  page.drawLine({
    start: { x: 44, y: 44 },
    end: { x: width - 44, y: 44 },
    thickness: 0.5,
    color: borderLight,
  });

  page.drawText(`Faktur Pajak Sah | ID: ${invNumber} | Generated by Nexa ERP Billing Engine | Halaman 1 dari 1`, {
    x: 44,
    y: 30,
    size: 7,
    font: fontRegular,
    color: mutedText,
  });

  page.drawText('ISO 27001 Certified Enterprise Security Enclave', {
    x: width - 200,
    y: 30,
    size: 7,
    font: fontRegular,
    color: mutedText,
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
