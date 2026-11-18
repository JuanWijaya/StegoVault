# TECHNICAL IMPLEMENTATION BRIEFING: STEGOVAULT

**Project:** StegoVault: Web-Based Encrypted Container Vault (PDF-Wrapped)  
**Target Environment:** AI Agentic IDE (Antigravity IDE)  
**Context:** Lomba CAPSTONE 2026: Kategori Kriptografi dan Keamanan Data  
**Status:** Production Ready (Versi Implementasi Final)

---

## 1. DIRECTIVE SISTEM (SYSTEM INSTRUCTION)

StegoVault dibangun sebagai aplikasi web brankas terenkripsi dengan arsitektur keamanan tingkat tinggi (*Zero-Knowledge & Client-Side Only*) untuk mengamankan berkas penting di balik samaran dokumen PDF resmi.

**Prinsip Utama Pembangunan:**
1. **100% Client-Side (Zero-Knowledge Architecture):** Seluruh proses derivasi kunci, pengumpulan keacakan fisik, enkripsi, dekripsi, pengepakan biner virtual filesystem, dan penggabungan dengan dokumen PDF berjalan sepenuhnya di memori peramban pengguna menggunakan **Native Web Crypto API** (`window.crypto.subtle` dan `window.crypto.getRandomValues`). Tidak ada berkas, kata sandi, maupun kunci privat yang dikirim ke server eksternal mana pun.
2. **Zero-Configuration Security:** Pengguna tidak dibebani konfigurasi algoritma yang rumit. Seluruh parameter kriptografi dikunci pada standar tertinggi yang direkomendasikan industri secara otomatis.
3. **Biomechanical Dual-Source Entropy (Standar VeraCrypt):** Pengumpulan keacakan fisik melalui pergerakan kursor mouse atau usapan layar sentuh diwajibkan sebelum kontainer dapat dibuat, menghasilkan kombinasi entropi hibrida (*Hardware CSPRNG* dipadukan dengan *Physical Pointer Movement* via *XOR Diffusion*).
4. **Memory Hygiene & Ephemeral RAM Buffers:** Saat volume ditutup (*Unmount*) atau saat pengguna memilih *Kembali ke Beranda*, seluruh referensi `ArrayBuffer`, `Blob`, `ObjectURL`, serta kunci di memori dibersihkan secara eksplisit (`zeroMemory`) untuk mencegah kebocoran memori (*RAM memory dump attack*).

---

## 2. REKOMENDASI TECH STACK & STRUKTUR FILE AKTUAL

Aplikasi dibangun menggunakan stack modern yang cepat, tanpa dependensi kriptografi pihak ketiga:
* **Framework:** React 18+ dengan TypeScript (`Vite` template)
* **Styling & UI:** Tailwind CSS, `lucide-react`, kustom fluted ribbed background, Spotlight dynamic cards, dan responsive mobile layout
* **Cryptography Engine:** Native Browser `Web Crypto API` (`crypto.subtle` & `crypto.getRandomValues`) murni tanpa CryptoJS demi performa O(1) dan keamanan bebas celah dependensi
* **PDF Engine:** `pdf-lib` (membuat sampul PDF kamuflase faktur/invoice komersial 1 halaman yang valid secara struktur standar ISO 32000-1)

### Struktur Berkas Inti:
* `src/utils/crypto.ts`: Primitif kriptografi (PBKDF2-SHA256, AES-256-GCM, generator Salt/IV, kalkulator Strict Avalanche Criterion, pembersih memori `zeroMemory`).
* `src/utils/entropy.ts`: Mesin pengumpul entropi biomekanis (`EntropyPool`) dengan peredam interval sampel, pendeteksi jarak gerakan, dan difusi hibrida XOR SHA-256.
* `src/utils/container.ts`: Serialisasi virtual filesystem biner, pembungkus kontainer PDF, dan ekstraksi instan $O(1)$ penanda trailer `SV_END`.
* `src/components/Dashboard.tsx`: Halaman utama dengan typewriter headline, 3-Card Showcase, modal tutorial mobile, dan 4 pilar fitur keamanan.
* `src/components/Navbar.tsx`: Header adaptif transparan/frosted-glass dengan indikator status volume aktif dan pintasan panel metrik.
* `src/components/CreateVolumeModal.tsx`: Modal inisiasi kontainer baru dengan pengukur kekuatan kata sandi dan kanvas entropi fisik wajib.
* `src/components/MountGateModal.tsx`: Gerbang pembukaan kontainer dengan validasi format biner PDF dan verifikasi tag GCM.
* `src/components/VirtualDrive.tsx`: Ruang kerja brankas virtual (eksplorasi berkas, multi-upload, pencarian instan, tabel desktop, kartu mobile, opsi kembali ke beranda, dan unmount).
* `src/components/FilePreviewModal.tsx`: Pratinjau berkas *on-the-fly* di RAM (gambar dengan zoom responsif, PDF via iframe Blob, kode/teks, fallback berkas biner) dengan auto-revoke Object URL.
* `src/components/EntropyHarvester.tsx`: Kanvas interaktif partikel glowing dengan progres dinamis tiga tahap (Amber -> Sky Blue -> Emerald).
* `src/components/SecurityDrawer.tsx`: Panel inspektor keamanan dan telemetri lomba (Telemetri Live, Avalanche Lab dengan matriks 256-bit, dan Panduan Skenario Demo Juri).
* `src/components/SpotlightCard.tsx`: Komponen kartu elegan dengan efek sorotan spotlight dinamis mengikuti kursor pengguna.

---

## 3. ARSITEKTUR KRIPTOGRAFI & FORMAT BINER KONTAINER `.PDF`

### A. Spesifikasi Algoritma Tetap (Fixed Algorithms)
1. **Key Derivation Function (KDF):**
   * Algoritma: `PBKDF2`
   * Hash: `SHA-256`
   * Salt: $16\text{ byte}$ (`128-bit`) dihasilkan melalui difusi hibrida XOR antara CSPRNG hardware dan digest SHA-256 dari sampel keacakan fisik pengguna.
   * Iterasi: `310,000` iterasi (standar keamanan OWASP untuk PBKDF2-HMAC-SHA256).
   * Output: Kunci simetris `AES-GCM` sepanjang $256\text{-bit}$ (`non-extractable`).
2. **Authenticated Encryption with Associated Data (AEAD):**
   * Algoritma: `AES-256-GCM`
   * Initialization Vector (IV): $12\text{ byte}$ (`96-bit`) hibrida acak, **wajib digenerasi ulang setiap kali kontainer disimpan atau di-unmount**.
   * Authentication Tag: $128\text{-bit}$ (otomatis diperiksa oleh Web Crypto API; 1 bit berubah pada ciphertext akan menggagalkan seluruh proses dekripsi).
3. **Biomechanical Dual-Source Hybrid Entropy:**
   * Target sampel: minimal 350 sampel gerakan.
   * Throttling: minimal jeda 15 milidetik dan perpindahan minimal 4 piksel antar sampel untuk mencegah pengisian instan artifisial, membutuhkan 6 hingga 10 detik interaksi manusia aktif.
   * Rumus Penggabungan:
     $$\text{HybridSalt} = \text{HardwareSalt} \oplus \text{SHA256}(\text{PointerEntropy})[0..15]$$
     $$\text{HybridIV} = \text{HardwareIV} \oplus \text{SHA256}(\text{PointerEntropy})[16..27]$$

### B. Struktur Biner Kontainer `.pdf` (PDF-Wrapped Container)
Untuk mencegah pembaca PDF biasa mengalami *hang/freeze* saat membuka berkas kontainer, struktur berkas disusun menggabungkan 1 halaman PDF valid di awal dan blok terenkripsi di akhir dokumen setelah penanda `%%EOF`:

```text
+-------------------------------------------------------------------+
| 1. VALID COVER PDF (Generated via pdf-lib)                        |
|    - 1 halaman standar ISO berisi dokumen kamuflase resmi:        |
|      Faktur Komersial / Tax Invoice Layanan Enterprise Cloud      |
|    - Referensi proyek menyamarkan nama volume kontainer           |
|    - Diakhiri penanda standar PDF: %%EOF                          |
+-------------------------------------------------------------------+
| 2. MAGIC HEADER (14 Bytes ASCII) : "STEGOVAULT_V1\0"              |
+-------------------------------------------------------------------+
| 3. SALT (16 Bytes)               : Hibrida Salt untuk PBKDF2      |
+-------------------------------------------------------------------+
| 4. IV (12 Bytes)                 : Hibrida IV untuk AES-256-GCM   |
+-------------------------------------------------------------------+
| 5. ENCRYPTED PAYLOAD (N Bytes)   : Ciphertext + 16-byte Auth Tag  |
+-------------------------------------------------------------------+
| 6. PAYLOAD LENGTH (8 Bytes)      : Uint64 Big-Endian (nilai N)    |
+-------------------------------------------------------------------+
| 7. MAGIC FOOTER (6 Bytes ASCII)  : "SV_END"                       |
+-------------------------------------------------------------------+
```

**Keunggulan Format Ini:**
* **Kompatibilitas Penuh:** Pembaca PDF apa pun (Chrome, Edge, Adobe Acrobat) langsung menampilkan halaman sampul tanpa peringatan dokumen korup.
* **Ekstraksi Biner $O(1)$:** Sistem membaca 14 byte trailer terakhir dokumen (`Payload Length` 8 byte + `"SV_END"` 6 byte), memverifikasi penanda, lalu melompat langsung (*trailer jump*) ke offset payload tanpa perlu memindai seluruh dokumen.
* **Anti-Tamper Mutlak:** Pengubahan 1 byte pada blok terenkripsi di editor teks/hex akan membatalkan dekripsi seketika.

### C. Struktur Internal Virtual Filesystem (Sebelum Dienkripsi)
Seluruh berkas disimpan dalam format biner murni tanpa Base64 untuk menghemat ruang memori hingga 33%:
`[Manifest Length (4 Bytes Uint32)]` + `[Manifest JSON UTF-8]` + `[Concatenated Raw File Bytes]`

Contoh struktur `Manifest JSON`:
```json
{
  "volumeName": "Dokumen_Pribadi",
  "createdAt": "2026-11-15T10:00:00Z",
  "updatedAt": "2026-11-15T10:05:00Z",
  "files": [
    {
      "id": "uuid-1",
      "name": "laporan_keuangan.pdf",
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

Antarmuka menggunakan palet visual bertema keamanan kelas enterprise (*Deep Royal Cobalt & Midnight Navy* `#070B19` - `#0B132B`, fluted ribbed textures, glowing sheen text, frosted glass cards, dan aksen biru kobalt `#3B5BFF` serta emerald `#10B981`):

### Layar 1: Dashboard Awal (Unmounted State)
* **Hero Section:** Dilengkapi headline dinamis dengan efek *typewriter loop* bolak-balik antara `"STEGOVAULT"` dan `"BRANKAS TERSEMBUNYI DI DALAM PDF"` yang tersinkronisasi dengan efek *sheen*.
* **Tiga Kartu Showcase Utama (The 3-Card Vault Showcase):**
  1. **Kartu Kiri (Desktop):** Panduan Buka Kontainer (3 langkah ringkas cara membuka brankas).
  2. **Kartu Tengah:** Kartu interaktif utama dengan *Gliding Segmented Pill Switcher* (`Buka Kontainer (.pdf)` / `Buat Kontainer Baru`), area dropzone atau peluncur yang ekspansif (`flex-1`) tanpa ruang kosong, dan tombol aksi responsif (`w-full` di mobile, mepet kanan di desktop).
  3. **Kartu Kanan (Desktop):** Panduan Buat Kontainer (3 langkah ringkas cara menginisiasi brankas).
* **Adaptasi Khusus Mobile:** Pada layar smartphone, kartu kiri dan kanan otomatis berganti menjadi 2 tombol berdampingan (*Cara Buka* dan *Cara Buat*) yang jika ditekan memunculkan **Pop Up Modal Panduan Interaktif** lengkap dengan animasi buka-tutup halus.
* **Empat Pilar Fitur Keamanan:** Kartu informatif ringkas di bagian bawah (Kontainer PDF Anti-Hang, 100% Client-Side Privacy, Enkripsi Tetap AES-256-GCM, dan Ekstraksi Biner O(1)).

### Layar 2: Form Pembuatan Kontainer (Create Volume Modal)
* Input: **Nama Volume Kontainer**, **Kata Sandi**, dan **Konfirmasi Kata Sandi** (dilengkapi meteran kekuatan sandi real-time).
* **Kanvas Entropi Fisik Wajib:** Pengguna wajib menggerakkan kursor mouse atau mengusap kanvas layar hingga meteran mencapai 100% (350 sampel). Indikator warna bertransisi dari Amber (< 40%) -> Sky Blue (40%-99%) -> Emerald Green (100%).
* Tombol submit otomatis dinonaktifkan hingga entropi fisik terkumpul penuh.
* Alur Eksekusi: Derivasi KDF hibrida -> Enkripsi AES-GCM -> Pengemasan PDF -> Unduhan otomatis -> Ringkasan metrik sukses.

### Layar 3: Gerbang Autentikasi (Mount Gate Modal)
* Dipicu otomatis saat berkas PDF diletakkan di dropzone atau dipilih via file picker.
* Menampilkan verifikasi format biner: Badge hijau jika berkas merupakan kontainer StegoVault valid, atau badge merah jika file PDF biasa.
* Input: **Kata Sandi Kontainer** (dengan tombol lihat/sembunyikan sandi).
* Menolak proses dan menampilkan notifikasi kesalahan jika kata sandi salah atau tag integritas GCM tidak cocok.

### Layar 4: Ruang Kerja Brankas Virtual (Virtual Drive Workspace)
* Header Cobalt ringkas menampilkan nama volume aktif, status brankas terbuka, total berkas, dan total ukuran data.
* **Tiga Tombol Aksi Terstruktur:**
  * **Kembali ke Beranda:** Opsi keluar aman ke dashboard awal tanpa menyimpan ulang jika pengguna hanya ingin melihat/pratinjau berkas, dengan tetap menjalankan pembersihan memori (*RAM memory wipe*).
  * **+ Tambah Berkas:** Mendukung multi-file upload dokumen apa saja ke RAM.
  * **Simpan & Unmount:** Menjalankan enkripsi ulang dengan Salt dan IV baru, membungkus ulang dokumen PDF, memicu unduhan otomatis berkas terbaru, dan menghapus seluruh buffer memori.
* **Bilah Pencarian Instan & Statistik:** Filter pencarian berkas secara *on-the-fly*.
* **Tampilan Ganda Responsif:**
  * Desktop: Tabel elegan lengkap dengan kolom *Nama Berkas*, *Tipe Berkas* (human-readable: Dokumen PDF, Gambar PNG, Arsip ZIP, dsb.), *Ukuran*, *Waktu*, dan *Tombol Aksi*.
  * Mobile: Kartu bertumpuk (*stacked cards*) yang nyaman disentuh ibu jari.

### Layar 5: Modal Pratinjau Berkas (File Preview Modal)
* Membuka dokumen langsung di memori tanpa meninggalkan jejak di disk lokal:
  * **Gambar (PNG, JPG, WEBP, SVG):** Menampilkan gambar dengan kontrol Zoom In dan Zoom Out (kontrol mengambang di mobile).
  * **Dokumen PDF:** Dirender melalui Blob URL di dalam iframe.
  * **Teks & Kode:** Format `pre` dan `code` dengan scroll yang rapi.
  * **Berkas Tak Didukung (Biner Lain):** Menampilkan status MIME dan tombol ekspor langsung.
* Keamanan Memori: `URL.revokeObjectURL()` otomatis dipanggil saat modal ditutup.

### Fitur Penunjang: Panel Metrik & Inspektor Keamanan (SecurityDrawer.tsx)
Drawer geser dari sisi kanan yang memuat 3 tab komprehensif untuk demonstrasi juri lomba:
1. **Tab 1: Telemetri Live:**
   * Latensi derivasi kunci `PBKDF2` (310k iterasi).
   * Latensi enkripsi dan dekripsi `AES-256-GCM` beserta *throughput* real-time (`MB/s`).
   * Uji Anti-Tamper live (simulasi modifikasi 1-bit otomatis tertangkap dan ditolak).
   * Rasio efisiensi kemasan biner (overhead PDF < 0.1%).
   * Checklist kepatuhan standar NIST SP 800-38D dan OWASP.
2. **Tab 2: Avalanche Lab (Strict Avalanche Criterion):**
   * Pengujian perbandingan 2 input teks dengan selisih 1 karakter.
   * Menghitung persentase perubahan bit keluaran (target ideal ~50%).
   * **Visualisasi Matriks 256-Bit SHA-256:** Kisi 16x16 interaktif yang menampilkan status setiap bit (Merah = Berubah, Abu-abu = Tetap).
3. **Tab 3: Panduan Skenario Demo Juri:**
   * 4 skenario terstruktur langkah demi langkah untuk presentasi (Uji Kamuflase PDF, Uji Mounting O(1), Uji Anti-Tamper, dan Uji Avalanche Effect).

---

## 5. OPTIMASI TATA LETAK MOBILE (MOBILE-FIRST REFLOW)

* **Tombol CTA Adaptif:** Tombol utama pada kartu dan modal menggunakan `w-full` di layar ponsel agar mudah dijangkau ibu jari, serta beralih ke ukuran otomatis di desktop.
* **Struktur Tombol Aksi Brankas:** Di mobile, tombol *Kembali ke Beranda* tampil penuh di baris pertama, disusul grid seimbang 50%-50% untuk *+ Tambah Berkas* dan *Simpan & Unmount*.
* **Area Sentuh Aman:** Seluruh elemen interaktif memiliki target sentuh minimal 44 x 44 piksel dengan jarak spasi yang cukup.
* **Penyelarasan Copywriting Layar Sentuh:** Instruksi drag-and-drop dan mouse digantikan secara kontekstual dengan instruksi sentuhan dan tombol pada perangkat mobile.
* **Bebas Em Dash (Aturan R-02):** Seluruh kode, komentar, dan copywriting menggunakan tanda hubung biasa, titik dua, atau kurung untuk menjaga konsistensi tipografi.

---

## 6. VERIFIKASI & PENGUJIAN AKHIR

1. **Pengujian Fungsionalitas:**
   * Pembuatan kontainer PDF baru berhasil dan dapat dibuka di Google Chrome / Adobe Reader sebagai faktur tagihan (invoice) komersial resmi tanpa kecurigaan.
   * Kontainer dapat dimuat ulang (*mount*) di StegoVault dengan password yang benar.
   * Tambah berkas baru, hapus berkas, dan pratinjau berkas berjalan instan di memori.
   * Proses *Simpan & Unmount* mengunduh PDF yang telah diperbarui dengan IV baru.
   * Pengujian password salah atau modifikasi biner langsung memicu penolakan aman (*tamper detection*).
2. **Pengujian Build & Kompilasi:**
   * Lulus verifikasi TypeScript `tsc -b` dan bundler `vite build` tanpa galat (*0 errors*).
   * Lulus inspeksi tidak adanya karakter em dash di seluruh repositori.
