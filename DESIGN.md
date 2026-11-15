# DESIGN SYSTEM & UI/UX SPECIFICATION: STEGOVAULT

**Project:** StegoVault — Web-Based Encrypted Container Vault (PDF-Wrapped)

**Visual Direction:** Modern Trust-Tech & Clean SaaS Aesthetic (Inspired by High-Contrast Split-Tone UI)

**Target Stack:** React + TypeScript + Tailwind CSS + Lucide Icons

## 1. FILOSOFI VISUAL & ADAPTASI REFERENSI

Antarmuka **StegoVault** meninggalkan gaya terminal gelap yang kaku dan mengintimidasi, lalu menggantinya dengan estetika **Clean Trust-Tech SaaS** yang ramah bagi pengguna awam namun tetap memancarkan presisi keamanan tingkat tinggi:

1. **Kontras Dua Zona (*Split-Tone Layout*):**

   * **Zona Atas (*Hero & Vault Gateway*):** Menggunakan latar gradasi *Deep Midnight Navy* ke *Vibrant Royal Cobalt* dengan tekstur garis vertikal halus (*fluted glass effect*) untuk memberikan kesan ruang brankas digital yang dalam, aman, dan eksklusif.

   * **Zona Bawah (*Feature Grid & Virtual File Explorer*):** Beralih ke kanvas *Crisp Ice-White* (`#F4F6FA`) yang terang, lapang, dan bersih agar pengguna nyaman saat mengelola berkas, membaca pratinjau dokumen, maupun memeriksa metrik pengujian.

2. **Komposisi Tiga Kartu Mengambang (*3-Card Hero Showcase*):**

   * Mengadaptasi tata letak kartu utama di tengah yang diapit dua kartu pendukung (*floating peripheral cards*) pada area *Hero* sebagai pusat interaksi pembuatan dan pembukaan (*mount*) kontainer `.pdf`.

3. **Elemen Khas UI (*Signature Motifs*):**

   * *Pill Badges* berlapis kaca (*frosted pill*) untuk indikator algoritma tetap (`AES-256-GCM • PBKDF2`).

   * *Pill CTA Buttons* berwarna biru elektrik dengan lingkaran putih berisi ikon panah (`->`) di sisi kanan tombol.

   * Garis penghubung melengkung putus-putus (*dashed curved SVG path*) dengan ikon gembok/kunci kecil untuk memvisualisasikan alur enkripsi.

## 2. PALET WARNA (*COLOR TOKENS*)

### A. Latar Belakang & Permukaan (*Backgrounds & Surfaces*)

| Token Name | Hex / CSS Value | Kegunaan |
| :--- | :--- | :--- |
| `bg-hero-gradient` | `linear-gradient(180deg, #03071E 0%, #091859 55%, #163AC7 100%)` | Latar utama bagian atas (*Hero / Mount Gateway*). |
| `bg-canvas-light` | `#F4F6FA` | Latar utama bagian bawah (*Feature Grid & File Explorer*). |
| `surface-card-white` | `#FFFFFF` | Kartu utama, modal pratinjau, dan item berkas di *File Explorer*. |
| `surface-card-active` | `linear-gradient(135deg, #0A1F8F 0%, #1738CF 100%)` | Kartu fitur yang sedang aktif / di-*hover* (teks berubah putih). |
| `surface-glass-dark` | `rgba(255, 255, 255, 0.08)` + `backdrop-filter: blur(16px)` | Kartu transparan *frosted glass* di atas latar biru gelap. |

### B. Warna Aksen & Status (*Accents & Semantic Colors*)

| Token Name | Hex Value | Kegunaan |
| :--- | :--- | :--- |
| `accent-primary` | `#3B5BFF` | Tombol aksi utama (*Primary Pill Button*), indikator aktif, dan fokus input. |
| `accent-primary-hover` | `#2745E8` | Keadaan *hover* tombol utama. |
| `accent-soft-tint` | `#EEF2FF` | Latar kotak ikon (*icon squircle*) pada kartu putih. |
| `status-secure` | `#10B981` | Indikator kontainer valid, status *Zero-Knowledge*, dan *Auth Tag* terverifikasi. |
| `status-warning` | `#F59E0B` | Indikator kekuatan kata sandi sedang / peringatan *unsaved changes*. |
| `status-danger` | `#EF4444` | Tombol aksi **Simpan & Unmount** dan peringatan gagal dekripsi / *tampering*. |

### C. Warna Teks (*Typography Colors*)

| Token Name | Hex Value | Kegunaan |
| :--- | :--- | :--- |
| `text-on-dark-primary` | `#FFFFFF` | Judul utama (*Hero Headline*) dan teks pada kartu biru gelap. |
| `text-on-dark-muted` | `#B8C7F0` | Subjudul dan deskripsi sekunder di atas latar *Hero* biru gelap. |
| `text-on-light-primary` | `#0B132B` | Judul bagian (*Section Heading*), nama berkas, dan angka metrik utama. |
| `text-on-light-muted` | `#64748B` | Deskripsi kartu, metadata ukuran berkas, dan label sekunder. |

## 3. TIPOGRAFI (*TYPOGRAPHY SYSTEM*)

* **Font Utama (UI & Headings):** `'Plus Jakarta Sans', 'Inter', sans-serif`

* **Font Teknis (Crypto Metrics & Hex/Hash):** `'JetBrains Mono', monospace`

### Skala Tipografi

* **Hero Title:** `44px`–`52px` (`text-4xl md:text-5xl`), `font-extrabold`, `tracking-tight` (`-0.03em`), `leading-[1.15]`.

* **Section Title:** `32px`–`36px` (`text-3xl`), `font-bold`, `tracking-tight` (`-0.02em`), warna `#0B132B`.

* **Card Title:** `18px` (`text-lg`), `font-bold`, `leading-snug`.

* **Body / Subtitle:** `14px`–`16px` (`text-sm md:text-base`), `font-normal`, `leading-relaxed`.

* **Badge / Pill Text:** `12px` (`text-xs`), `font-semibold`, `tracking-wide`.

## 4. KOMPONEN KUNCI & EFEK CSS KHUSUS

### A. Tekstur Garis Vertikal (*Fluted Glass Background*)

Gunakan *overlay* CSS berikut pada bagian *Hero* biru gelap untuk menciptakan efek lipatan kaca vertikal seperti pada referensi desain:

```
.fluted-hero-bg {
  background: linear-gradient(180deg, #03071E 0%, #091859 55%, #163AC7 100%);
  position: relative;
}

.fluted-hero-bg::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 0px,
    rgba(255, 255, 255, 0.03) 1px,
    transparent 1px,
    transparent 36px
  );
  pointer-events: none;
}

```

### B. Tombol Kapsul dengan Lingkaran Panah (*Signature Pill Button*)

Setiap tombol ajakan utama (*Call-to-Action*) menggunakan bentuk kapsul penuh (`rounded-full`) dengan lingkaran putih berisi ikon panah di sisi kanan:

```
<button className="inline-flex items-center gap-3 rounded-full bg-[#3B5BFF] hover:bg-[#2745E8] pl-6 pr-2 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition-all">
  <span>Buat Kontainer Baru</span>
  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#163AC7]">
    <ArrowRight className="h-4 w-4" />
  </span>
</button>

```

### C. Kartu Fitur dengan Efek Sorot Biru Aktif (*Interactive Feature Card*)

* Bentuk kartu: `rounded-3xl` (`24px`), `p-6`, bayangan halus `shadow-[0_10px_30px_rgba(11,19,43,0.04)]`.

* Keadaan Normal: Latar `#FFFFFF`, kotak ikon `w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#163AC7]`, judul `#0B132B`, deskripsi `#64748B`.

* Keadaan Aktif / Hover: Latar berubah menjadi gradasi biru pekat (`from-[#0A1F8F] to-[#1738CF]`), kotak ikon menjadi kaca transparan `bg-white/15 text-white`, dan seluruh teks berubah menjadi `#FFFFFF`.

## 5. BLUEPRINT TATA LETAK 4 LAYAR STEGOVAULT

### Layar 1 & 2: Unmounted Hero & Interactive 3-Card Vault Center

Saat aplikasi pertama kali dibuka, tampilkan halaman dengan struktur vertikal berikut:

1. **Top Navigation Bar (Transparan di atas Hero):**

   * Kiri: Logo **StegoVault** (ikon perisai/gembok geometris putih + teks tebal putih).

   * Tengah: Tautan navigasi bersih (`Beranda`, `Cara Kerja`, `Arsitektur Keamanan`, `Uji Metrik`).

   * Kanan: Tombol kapsul kecil `Buka Kontainer` (`bg-[#3B5BFF] text-white rounded-full px-5 py-2`).

2. **Hero Header:**

   * *Frosted Pill Badge:* `Enkripsi Client-Side • AES-256-GCM & PBKDF2` (`bg-white/10 border border-white/15 text-blue-200 rounded-full px-4 py-1.5 text-xs`).

   * *Headline:* **"Amankan Berkas Rahasia dalam Satu Kontainer PDF"**

   * *Subheadline:* *"Simpan, kelola, dan pratinjau dokumen pribadi secara on-the-fly langsung di browser tanpa server eksternal."*

3. **Komposisi 3 Kartu Mengambang (*The 3-Card Vault Showcase*):**

   * **Kartu Kiri (*Floating White Card* — Spesifikasi Keamanan Tetap):**

     * Kartu putih melayang (`rounded-3xl bg-white p-5 shadow-2xl`).

     * Menampilkan informasi kunci tetap: `256-Bit` (*AES-GCM Encryption*), lencana biru kecil `Zero-Config`, serta sub-kartu kecil di bawahnya bertuliskan `PBKDF2-SHA256 • 310.000 Iterasi`.

   * **Kartu Tengah (*Centerpiece Elevated White Card* — Aksi Utama Buat / Mount):**

     * Kartu putih utama berukuran lebih besar (`rounded-[28px] bg-white p-7 shadow-2xl border border-slate-100`).

     * Memiliki *Segmented Pill Switcher* di bagian atas kartu: **`Buka Kontainer (.pdf)`** | **`Buat Kontainer Baru`**.

     * **Tab Buka Kontainer (Layar 3 — Mount Gate):** Area *dropzone* berbingkai putus-putus biru lembut untuk memilih file `.pdf`, kolom input *Password* dengan ikon mata (*show/hide*), dan tombol *pill* utama **`Mount Volume`**. Jika *password* salah atau file rusak, tampilkan *alert banner* merah lembut di dalam kartu ini.

     * **Tab Buat Kontainer (Layar 2 — Create Volume):** Input **Nama Kontainer**, input **Kata Sandi** + *Password Strength Bar* 4 segmen, dan tombol *pill* utama **`Buat & Unduh PDF`**.

   * **Kartu Kanan (*Floating Frosted-Glass Card* — Visualisasi Alur PDF):**

     * Kartu kaca transparan di atas latar biru (`rounded-3xl bg-white/10 backdrop-blur-md border border-white/25 p-5 text-white`).

     * Menampilkan visualisasi ringkas `Plaintext -> AES-256 -> .PDF` dengan garis melengkung putus-putus dan ikon gembok kecil.

4. **Zona Bawah (`#F4F6FA` Ice-White Canvas) — Grid 4 Pilar Keamanan:**

   * Judul tengah: **"Keamanan Tingkat Industri Tanpa Konfigurasi Rumit"**

   * Grid 4 kolom kartu fitur (`rounded-3xl`) dengan kartu pertama disorot biru pekat (`#0D2499`):

     1. *Kontainer PDF Anti-Hang* (Membungkus *ciphertext* di balik sampul PDF 1 halaman yang ringan).

     2. *100% Client-Side Privacy* (Seluruh operasi berjalan di RAM *browser* tanpa unggahan ke *server*).

     3. *Enkripsi Tetap AES-256-GCM* (Perlindungan kerahasiaan sekaligus deteksi manipulasi data).

     4. *Pratinjau Memori On-the-Fly* (Baca dokumen & gambar langsung di *browser* tanpa meninggalkan jejak).

### Layar 4: Ruang Kerja Virtual Drive (*Mounted Workspace State*)

Ketika kontainer `.pdf` berhasil di-*mount*, transisikan tampilan menjadi ruang kerja brankas aktif yang rapi dan profesional:

1. **Compact Cobalt Top Header:**

   * Tinggi ringkas (`py-5`), mempertahankan latar gradasi *Deep Navy-Cobalt*.

   * Menampilkan nama kontainer yang sedang terbuka (misal: `Dokumen_Rahasia.pdf`), lencana hijau menyala `● Mounted (AES-256-GCM Active)`, jumlah berkas, dan total ukuran *payload*.

   * Di sisi kanan terdapat dua tombol utama:

     * Tombol kapsul biru terang: **`+ Tambah Berkas`**

     * Tombol kapsul merah koral (`bg-red-500 hover:bg-red-600`): **`Simpan & Unmount`**

2. **Main Explorer Canvas (`#F4F6FA`):**

   * **Toolbar Pencarian & Filter:** Input pencarian berkas dengan sudut membulat penuh (`rounded-full bg-white border-slate-200`) serta tombol pintasan membuka **Panel Metrik & Uji Keamanan**.

   * **Daftar Berkas (*Clean White File Cards / Table*):**

     * Setiap berkas ditampilkan dalam baris/kartu putih bersih (`bg-white rounded-2xl p-4 border border-slate-100 hover:border-blue-300 transition-all`) dengan kotak ikon berwarna lembut sesuai tipe berkas (Biru untuk PDF, Ungu untuk Gambar, Hijau untuk Teks).

     * Tombol aksi cepat pada setiap berkas: **`Pratinjau`** (ikon mata), **`Ekstrak`** (ikon unduh), dan **`Hapus`** (ikon tempat sampah merah).

3. **Modal Pratinjau *On-the-Fly* (*In-Memory Viewer Modal*):**

   * Latar *backdrop* gelap transparan (`bg-slate-950/60 backdrop-blur-sm`).

   * Kontainer modal putih besar (`rounded-3xl bg-white shadow-2xl max-w-4xl`), menampilkan nama berkas di bagian atas, area pratinjau gambar/PDF/teks di tengah (memuat dari `Blob URL` memori), serta tombol tutup `X` yang otomatis memanggil `URL.revokeObjectURL()` saat ditutup.

### Drawer Tambahan: Panel Metrik & Simulator Pengujian (*Security Benchmark Drawer*)

* Dapat dibuka dari *navbar* atau *toolbar* ruang kerja melalui *slide-over drawer* berwarna putih bersih dengan aksen kartu *JetBrains Mono*.

* Menampilkan:

  1. Kartu metrik waktu eksekusi (`PBKDF2 Key Derivation: ... ms`, `AES-256-GCM Process: ... ms`, `Throughput: ... MB/s`).

  2. Struktur anatomi biner kontainer `.pdf` yang sedang aktif (`Cover PDF Size` vs `Encrypted Payload Size`).

  3. **Simulator Interaktif *Avalanche Effect*:** Dua kolom input teks untuk menguji perubahan 1 karakter dan menampilkan persentase perbedaan bit *ciphertext* dalam bilah progres biru-hijau (`~50.0% Bit Changed`).