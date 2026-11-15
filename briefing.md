# TECHNICAL IMPLEMENTATION BRIEFING: STEGOVAULT

**Project:** StegoVault — Web-Based Encrypted Container Vault (PDF-Wrapped)  
**Target Environment:** AI Agentic IDE (Antigravity IDE)  
**Context:** Lomba CAPSTONE 2026 — Kategori Kriptografi dan Keamanan Data  

---

## 1. DIRECTIVE UNTUK AI AGENT (SYSTEM INSTRUCTION)

Bertindaklah sebagai **Senior Full-Stack & Security Engineer**. Tugasmu adalah membangun aplikasi web **StegoVault** secara utuh dan fungsional (*working product*) berdasarkan spesifikasi arsitektur di bawah ini.

**Prinsip Utama Pembangunan:**
1. **100% Client-Side (*Zero-Knowledge Architecture*):** Seluruh proses pembuatan kunci, enkripsi, dekripsi, pengemasan PDF, dan manajemen berkas virtual wajib berjalan sepenuhnya di memori *browser* pengguna menggunakan **Native Web Crypto API** (`window.crypto.subtle`). Dilarang mengirim berkas atau kata sandi ke *server* eksternal mana pun.
2. **Zero-Configuration Security:** Pengguna tidak boleh disuguhi pilihan algoritma atau konfigurasi teknis yang rumit. Semua parameter kriptografi dikunci pada standar keamanan tertinggi secara otomatis.
3. **Memory Safety & Hygiene:** Saat volume ditutup (*Unmount*), seluruh referensi `ArrayBuffer`, `Blob`, dan `ObjectURL` berkas yang didekripsi wajib dibersihkan dari memori/state aplikasi.

---

## 2. REKOMENDASI TECH STACK

Gunakan *stack* modern yang ringan, cepat di-*build*, dan memiliki dukungan manipulasi biner (*TypedArrays / ArrayBuffer*) yang kuat:
* **Framework:** React 18+ dengan TypeScript (`Vite` template)
* **Styling & UI:** Tailwind CSS + `lucide-react` (untuk ikon *file manager* & keamanan)
* **Cryptography Engine:** Native Browser `Web Crypto API` (`crypto.subtle` & `crypto.getRandomValues`) — *jangan menggunakan library pihak ketiga seperti CryptoJS agar performa cepat dan bebas celah kompatibilitas.*
* **PDF Generator:** `pdf-lib` (hanya digunakan untuk membuat 1 halaman sampul peringatan PDF yang valid secara struktur).

---

## 3. ARSITEKTUR KRIPTOGRAFI & FORMAT BINER KONTAINER `.PDF`

### A. Spesifikasi Algoritma Tetap (*Fixed Algorithms*)
1. **Key Derivation Function (KDF):**
   * Algoritma: `PBKDF2`
   * Hash: `SHA-256`
   * Salt: $16\text{ byte}$ (`128-bit`) acak dari `crypto.getRandomValues(new Uint8Array(16))`
   * Iterasi: `310,000` iterasi (standar OWASP untuk PBKDF2-HMAC-SHA256)
   * Output: Kunci turunan `AES-GCM` sepanjang $256\text{-bit}$ (`non-extractable`)
2. **Authenticated Encryption:**
   * Algoritma: `AES-256-GCM`
   * Initialization Vector (IV): $12\text{ byte}$ (`96-bit`) acak dari `crypto.getRandomValues(new Uint8Array(12))` — **wajib di-generate ulang setiap kali kontainer disimpan/di-unmount.**
   * Authentication Tag: $128\text{-bit}$ (otomatis disertakan di akhir *ciphertext* oleh Web Crypto API).

### B. Struktur Biner Kontainer `.pdf` (*PDF-Wrapped Container*)
Agar file kontainer tidak membuat aplikasi pembaca teks/PDF menjadi *hang/freeze* saat tidak sengaja dibuka secara langsung, file `.pdf` disusun dengan menggabungkan **1 halaman PDF valid** di bagian depan dan **blok biner terenkripsi** setelah penanda `%%EOF`:

```text
+-------------------------------------------------------------------+
| 1. VALID COVER PDF (Generated via pdf-lib)                        |
|    - 1 halaman ringan berisi teks peringatan:                     |
|      "DOKUMEN KONTAINER TERENKRIPSI (STEGOVAULT)"                 |
|      "Gunakan aplikasi web StegoVault untuk membuka isi volume."  |
|    - Diakhiri penanda standar PDF: %%EOF                          |
+-------------------------------------------------------------------+
| 2. MAGIC HEADER (14 Bytes ASCII) : "STEGOVAULT_V1\0"              |
+-------------------------------------------------------------------+
| 3. SALT (16 Bytes)               : Random Salt untuk PBKDF2       |
+-------------------------------------------------------------------+
| 4. IV (12 Bytes)                 : Random IV untuk AES-256-GCM    |
+-------------------------------------------------------------------+
| 5. ENCRYPTED PAYLOAD (N Bytes)   : Ciphertext + 16-byte Auth Tag  |
+-------------------------------------------------------------------+
| 6. PAYLOAD LENGTH (8 Bytes)      : Uint64 Big-Endian (nilai N)    |
+-------------------------------------------------------------------+
| 7. MAGIC FOOTER (6 Bytes ASCII)  : "SV_END"                       |
+-------------------------------------------------------------------+
```

**Keunggulan Teknis Struktur Ini:**
* Pembaca PDF biasa (Chrome/Adobe Reader) hanya merender 1 halaman sampul peringatan secara instan dalam hitungan milidetik.
* Saat StegoVault melakukan *Mount*, sistem cukup membaca $14\text{ byte}$ terakhir untuk memvalidasi `"SV_END"` dan mengambil nilai `Payload Length` ($N$), lalu melompat langsung ke *offset* awal kontainer dengan kompleksitas $O(1)$.
* Jika 1 byte saja di dalam blok terenkripsi berubah/rusak, `AES-256-GCM` otomatis menggagalkan dekripsi (*Tamper Detection*).

### C. Struktur Internal *Virtual Filesystem* (Sebelum Dienkripsi)
Untuk menghindari pembengkakan ukuran file akibat konversi *Base64*, kemas seluruh berkas di dalam volume menjadi satu `ArrayBuffer` biner dengan format:
`[Manifest Length (4 Bytes Uint32)]` + `[Manifest JSON UTF-8]` + `[Concatenated Raw File Bytes]`

Contoh isi `Manifest JSON`:
```json
{
  "volumeName": "Dokumen_Rahasia",
  "createdAt": "2026-11-15T10:00:00Z",
  "updatedAt": "2026-11-15T10:05:00Z",
  "files": [
    {
      "id": "uuid-1",
      "name": "kontrak_kerja.pdf",
      "mimeType": "application/pdf",
      "size": 245120,
      "offset": 0,
      "modifiedAt": "2026-11-15T10:02:00Z"
    }
  ]
}
```

---

## 4. SPESIFIKASI ANTARMUKA & ALUR PENGGUNA (UI/UX)

Desain antarmuka harus bersih, modern, bertema keamanan (*dark/slate mode* dengan aksen *emerald/cyan*), dan terbagi menjadi **4 Layar/State Utama** ditambah **1 Panel Pengujian Keamanan**:

### Layar 1: Dashboard Awal (*Unmounted State*)
* Header menampilkan nama aplikasi **StegoVault** beserta *badge* status: `Client-Side AES-256-GCM • Zero-Knowledge`.
* Dua kartu aksi utama:
  1. **Buat Kontainer Baru (*Create Volume*):** Membuka form pembuatan kontainer `.pdf` baru.
  2. **Buka Kontainer (*Mount Volume*):** Area *drag-and-drop* untuk memilih berkas `.pdf` kontainer dari perangkat.

### Layar 2: Form Pembuatan Kontainer (*Create Volume*)
* Input: **Nama Kontainer** (default: `vault_container`), **Kata Sandi**, dan **Konfirmasi Kata Sandi** (dilengkapi indikator kekuatan *password*).
* Proses saat tombol **Buat & Unduh Kontainer (.pdf)** ditekan:
  1. Generate `salt` & `IV` baru.
  2. Buat struktur volume kosong $\rightarrow$ enkripsi dengan `AES-256-GCM`.
  3. Bungkus ke dalam dokumen `.pdf` 1 halaman dan picu unduhan otomatis (`nama_kontainer.pdf`).
  4. Tampilkan notifikasi sukses beserta catatan waktu proses pembuatan (dalam `ms`).

### Layar 3: Gerbang Autentikasi (*Mount Gate*)
* Muncul setelah pengguna memilih berkas `.pdf`.
* Menampilkan informasi file: Nama berkas dan ukuran total berkas.
* Input: **Kata Sandi** + tombol **Mount Volume**.
* Validasi Error Spesifik:
  * Jika file `.pdf` biasa (bukan kontainer StegoVault): tampilkan pesan *"Berkas PDF ini bukan merupakan kontainer StegoVault yang valid."*
  * Jika kata sandi salah atau bit kontainer rusak/dimodifikasi: tangkap `OperationError` dari Web Crypto API dan tampilkan pesan *"Autentikasi gagal: Kata sandi salah atau integritas kontainer telah rusak."*

### Layar 4: Ruang Kerja *Virtual Drive* (*Mounted State*)
* Tampilan menyerupai *File Explorer* modern dengan informasi nama volume dan jumlah berkas tersimpan.
* Fitur wajib di dalam ruang kerja:
  1. **Tambah Berkas (`+ Tambah File`):** Mendukung *multi-file upload* (gambar, PDF, dokumen teks, arsip, dll.) ke dalam memori volume virtual.
  2. **Pratinjau *On-the-Fly* (`Lihat / Baca`):** Saat berkas diklik, tampilkan pratinjau langsung di dalam *modal pop-up* aplikasi (mendukung pratinjau gambar `PNG/JPG/WEBP`, dokumen `PDF` via iframe Blob URL, dan teks/kode) tanpa mengunduhnya ke penyimpanan lokal komputer. Pastikan `URL.revokeObjectURL()` dipanggil saat modal ditutup.
  3. **Ekstrak Keluar (`Export File`):** Opsi untuk mengunduh satu berkas tertentu keluar dari brankas jika diperlukan.
  4. **Hapus Berkas (`Delete`):** Menghapus berkas dari memori volume.
  5. **Tombol Utama `Simpan & Unmount`:**
     * Mengenripsi ulang seluruh berkas aktif di dalam volume menggunakan `salt` dan `IV` yang baru.
     * Membungkus ulang menjadi berkas `.pdf` terbaru dan memicu unduhan otomatis ke perangkat pengguna.
     * Menghapus bersih seluruh data berkas dari *state* React/RAM dan mengembalikan layar ke **Dashboard Awal**.

### Fitur Tambahan: Panel Metrik & Pengujian Kriptografi (*Crypto Benchmark Drawer*)
*Sangat penting untuk kebutuhan dokumentasi dan demonstrasi Bab 3 proposal lomba:*
* Tambahkan tombol atau *tab* kecil **"Metrik & Uji Keamanan"** yang menampilkan log metrik *real-time* dari sesi berjalan:
  * Waktu derivasi kunci `PBKDF2` (`ms`).
  * Waktu enkripsi / dekripsi `AES-256-GCM` (`ms`) dan *throughput* (`MB/s`).
  * Ukuran *overhead* PDF vs ukuran *payload* asli.
  * **Simulator *Avalanche Effect*:** Fitur interaktif kecil di dalam drawer di mana pengguna/juri dapat memasukkan 2 teks/password berbeda 1 karakter untuk melihat persentase perubahan bit *ciphertext* ($\approx 50\%$) secara langsung.

---

## 5. RENCANA EKSEKUSI BERTAHAP UNTUK ANTIGRAVITY IDE

Eksekusi pembangunan aplikasi dalam 4 tahap berikut secara berurutan:

* **Tahap 1 — Inisialisasi Proyek & Core Crypto Engine (`src/utils/crypto.ts`):**
  Inisialisasi proyek Vite + React + TypeScript + Tailwind CSS. Buat modul kriptografi yang mengimplementasikan derivasi kunci `PBKDF2-SHA256` serta fungsi enkripsi dan dekripsi `AES-256-GCM` berbasis `Web Crypto API`.
* **Tahap 2 — Virtual Filesystem & PDF Wrapper (`src/utils/container.ts`):**
  Implementasikan fungsi pengepakan/pembongkaran biner *virtual filesystem* (`ArrayBuffer`) dan fungsi pembungkusan/ekstraksi blok biner dengan `pdf-lib` sesuai struktur `STEGOVAULT_V1` hingga `SV_END`.
* **Tahap 3 — Pembangunan Antarmuka 4 Layar & On-the-Fly Viewer (`src/components/`):**
  Bangun komponen UI untuk *Dashboard*, *Create Volume*, *Mount Gate*, dan *Virtual Drive Workspace* lengkap dengan modal pratinjau berkas di memori dan mekanisme *Unmount* yang aman.
* **Tahap 4 — Panel Metrik Keamanan & Pengujian Akhir (`src/components/SecurityMetrics.tsx`):**
  Integrasikan pencatatan latensi (`performance.now()`) pada setiap operasi kriptografi, tambahkan simulator *Avalanche Effect*, dan lakukan pengujian end-to-end (buat volume $\rightarrow$ tambah file $\rightarrow$ preview $\rightarrow$ unmount $\rightarrow$ mount ulang $\rightarrow$ uji password salah $\rightarrow$ uji buka file `.pdf` di tab browser baru).