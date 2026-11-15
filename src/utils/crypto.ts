// Mesin kriptografi Web Crypto API: PBKDF2-SHA256 (310.000 iterasi) dan AES-256-GCM.

export const CRYPTO_CONFIG = {
  PBKDF2_ITERATIONS: 310000,
  SALT_BYTE_LENGTH: 16,
  IV_BYTE_LENGTH: 12,
  KEY_ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256,
  TAG_LENGTH: 128,
  HASH_ALGORITHM: 'SHA-256',
} as const;

export class CryptographicError extends Error {
  public readonly code: 'TAMPER_OR_PASSWORD_ERROR' | 'INVALID_KEY' | 'DERIVATION_FAILED' | 'UNKNOWN';

  constructor(message: string, code: 'TAMPER_OR_PASSWORD_ERROR' | 'INVALID_KEY' | 'DERIVATION_FAILED' | 'UNKNOWN') {
    super(message);
    this.code = code;
    this.name = 'CryptographicError';
  }
}

export interface KeyDerivationResult {
  key: CryptoKey;
  durationMs: number;
}

export interface EncryptionResult {
  ciphertext: Uint8Array;
  durationMs: number;
  throughputMBs: number;
}

export interface DecryptionResult {
  decrypted: Uint8Array;
  durationMs: number;
  throughputMBs: number;
}

export interface AvalancheResult {
  hashA: string;
  hashB: string;
  bitsA: string;
  bitsB: string;
  totalBits: number;
  flippedBits: number;
  flipPercentage: number;
  durationMs: number;
}

/**
 * Menghasilkan byte acak menggunakan CSPRNG browser (crypto.getRandomValues).
 */
export function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Menghasilkan 16-byte Salt acak untuk KDF PBKDF2.
 */
export function generateSalt(): Uint8Array {
  return generateRandomBytes(CRYPTO_CONFIG.SALT_BYTE_LENGTH);
}

/**
 * Menghasilkan 12-byte IV acak untuk enkripsi AES-256-GCM.
 * Wajib digenerate baru setiap kali kontainer disimpan/dimount ulang.
 */
export function generateIV(): Uint8Array {
  return generateRandomBytes(CRYPTO_CONFIG.IV_BYTE_LENGTH);
}

/**
 * Menderivasi kunci AES-256-GCM dari kata sandi dan salt menggunakan PBKDF2-SHA256.
 * Dikonfigurasi dengan 310.000 iterasi sesuai standar OWASP.
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = CRYPTO_CONFIG.PBKDF2_ITERATIONS
): Promise<KeyDerivationResult> {
  const startTime = performance.now();
  const textEncoder = new TextEncoder();
  const passwordKeyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: iterations,
      hash: CRYPTO_CONFIG.HASH_ALGORITHM,
    },
    passwordKeyMaterial,
    {
      name: CRYPTO_CONFIG.KEY_ALGORITHM,
      length: CRYPTO_CONFIG.KEY_LENGTH,
    },
    false, // non-extractable demi keamanan memori
    ['encrypt', 'decrypt']
  );

  const durationMs = performance.now() - startTime;
  return {
    key: derivedKey,
    durationMs: Number(durationMs.toFixed(2)),
  };
}

/**
 * Mengenkripsi data biner menggunakan AES-256-GCM dengan tag autentikasi 128-bit.
 */
export async function encryptData(
  plaintext: Uint8Array,
  key: CryptoKey,
  iv: Uint8Array
): Promise<EncryptionResult> {
  const startTime = performance.now();

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: CRYPTO_CONFIG.KEY_ALGORITHM,
      iv: iv as unknown as BufferSource,
      tagLength: CRYPTO_CONFIG.TAG_LENGTH,
    },
    key,
    plaintext as unknown as BufferSource
  );

  const durationMs = performance.now() - startTime;
  const sizeInMB = plaintext.byteLength / (1024 * 1024);
  const throughputMBs = durationMs > 0 ? (sizeInMB / (durationMs / 1000)) : 0;

  return {
    ciphertext: new Uint8Array(ciphertextBuffer),
    durationMs: Number(durationMs.toFixed(2)),
    throughputMBs: Number(throughputMBs.toFixed(2)),
  };
}

/**
 * Mendekripsi data biner terenkripsi menggunakan AES-256-GCM.
 * Menjamin deteksi integritas (Tamper Detection). Jika 1 bit data atau IV berubah,
 * operasi akan gagal dan melempar CryptographicError.
 */
export async function decryptData(
  ciphertext: Uint8Array,
  key: CryptoKey,
  iv: Uint8Array
): Promise<DecryptionResult> {
  const startTime = performance.now();

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: CRYPTO_CONFIG.KEY_ALGORITHM,
        iv: iv as unknown as BufferSource,
        tagLength: CRYPTO_CONFIG.TAG_LENGTH,
      },
      key,
      ciphertext as unknown as BufferSource
    );

    const durationMs = performance.now() - startTime;
    const sizeInMB = decryptedBuffer.byteLength / (1024 * 1024);
    const throughputMBs = durationMs > 0 ? (sizeInMB / (durationMs / 1000)) : 0;

    return {
      decrypted: new Uint8Array(decryptedBuffer),
      durationMs: Number(durationMs.toFixed(2)),
      throughputMBs: Number(throughputMBs.toFixed(2)),
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'OperationError') {
      throw new CryptographicError(
        'Autentikasi gagal: Kata sandi salah atau integritas kontainer telah rusak (GCM Auth Tag Mismatch).',
        'TAMPER_OR_PASSWORD_ERROR'
      );
    }
    throw new CryptographicError(
      `Dekripsi gagal: ${error instanceof Error ? error.message : 'Kesalahan tidak diketahui'}`,
      'UNKNOWN'
    );
  }
}

/**
 * Menghitung Efek Salju Runtuh (Avalanche Effect) antara dua input teks.
 * Digunakan untuk panel demonstrasi dan pengujian akademis pada proposal/lomba.
 * Standar Avalanche Effect kriptografi yang ideal adalah perbedaan mendekati 50%.
 */
export async function calculateAvalancheEffect(
  inputA: string,
  inputB: string
): Promise<AvalancheResult> {
  const startTime = performance.now();
  const encoder = new TextEncoder();

  const [bufferA, bufferB] = await Promise.all([
    crypto.subtle.digest(CRYPTO_CONFIG.HASH_ALGORITHM, encoder.encode(inputA)),
    crypto.subtle.digest(CRYPTO_CONFIG.HASH_ALGORITHM, encoder.encode(inputB)),
  ]);

  const bytesA = new Uint8Array(bufferA);
  const bytesB = new Uint8Array(bufferB);

  let bitsA = '';
  let bitsB = '';
  let flippedBits = 0;
  const totalBits = bytesA.length * 8; // 256 bits

  for (let i = 0; i < bytesA.length; i++) {
    const binA = bytesA[i].toString(2).padStart(8, '0');
    const binB = bytesB[i].toString(2).padStart(8, '0');
    bitsA += binA;
    bitsB += binB;

    // Hitung Hamming Distance per bit
    for (let b = 0; b < 8; b++) {
      if (binA[b] !== binB[b]) {
        flippedBits++;
      }
    }
  }

  const flipPercentage = Number(((flippedBits / totalBits) * 100).toFixed(2));
  const durationMs = Number((performance.now() - startTime).toFixed(2));

  return {
    hashA: bytesToHex(bytesA),
    hashB: bytesToHex(bytesB),
    bitsA,
    bitsB,
    totalBits,
    flippedBits,
    flipPercentage,
    durationMs,
  };
}

/**
 * Mengonversi Uint8Array ke representasi string heksadesimal.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Mengonversi string heksadesimal ke Uint8Array.
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.trim().replace(/^0x/i, '');
  const bytes = new Uint8Array(Math.ceil(cleanHex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16) || 0;
  }
  return bytes;
}

/**
 * Membersihkan data sensitif dari memori RAM (Zero-fill buffer).
 */
export function zeroMemory(buffer: Uint8Array): void {
  buffer.fill(0);
}

/**
 * Format ukuran biner ke satuan yang mudah dibaca (B, KB, MB, GB).
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
