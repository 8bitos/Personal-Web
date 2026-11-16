# 🌐 8BitShiftIMG — 100% Client-Side Universal Image Converter

> **Konversi format gambar instan, aman, dan beresolusi penuh langsung di peramban web tanpa server atau database.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Client-Side](https://img.shields.io/badge/Privacy-100%25%20Client--Side-emerald.svg)
![Zero-Backend](https://img.shields.io/badge/Backend-None%20(Local%20RAM)-purple.svg)

---

## 🌟 Fitur Utama

- 🔒 **100% Pemrosesan Lokal (Zero Database & Zero Backend)**:
  Semua proses konversi dan manipulasi biner berlangsung langsung di memori RAM peramban Anda melalui Web APIs dan HTML5 Canvas API. File gambar Anda **tidak pernah diunggah ke server mana pun**.
- 💎 **Kualitas Konversi 1:1 (Full Fidelity)**:
  Mempertahankan resolusi, dimensi, dan fidelity warna asli gambar tanpa kompresi agresif atau penurunan kualitas.
- 📸 **Dukungan Format Kamera RAW & iPhone HEIC**:
  - **Kamera RAW**: Mendukung file mentah kamera populer seperti Adobe DNG (`.dng`), Canon (`.cr2`, `.cr3`), Nikon (`.nef`, `.nrw`), Sony (`.arw`, `.srf`, `.sr2`), Fujifilm (`.raf`), Olympus (`.orf`), Panasonic Lumix (`.rw2`), dan Pentax (`.pef`, `.raw`).
  - **Apple HEIC/HEIF**: Mengonversi langsung foto kamera iPhone/iPad di Windows/Linux/Android tanpa instalasi perangkat lunak tambahan.
- 🗂️ **Format Output Lengkap Berdasarkan Kategori**:
  - **Format Web & Digital**: `WEBP`, `JPG`, `PNG`, `AVIF`, `GIF`
  - **Fotografi & Kamera RAW**: `DNG` (Adobe Digital Negative RAW), `TIFF` (Arsip kualitas tinggi)
  - **Ikon & Desain**: `ICO` (Favicon website), `CUR` (Kursor kustom Windows), `SVG` (Vector wrapper container)
  - **Dokumen & Publikasi**: `PDF` (Siap cetak)
  - **Game Dev & Grafis Klasik**: `TGA` (Truevision / tekstur 3D game), `BMP` (Windows Bitmap), `PPM` (Netpbm P6 binary), `WBMP` (Wireless Bitmap 1-bit)
- ⚡ **Dua Mode Konversi**:
  - **Mode Serentak (Batch Mode)**: Mengubah seluruh antrean file ke satu format target secara bersamaan.
  - **Mode Kustom per Baris (Per-Row Custom)**: Menentukan format tujuan berbeda untuk masing-masing baris gambar secara leluasa.
- 🌍 **Dukungan Multi-Bahasa (8 Bahasa Terbesar Dunia)**:
  Tersedia pilihan bahasa dengan deteksi otomatis:
  - 🇮🇩 Bahasa Indonesia
  - 🇺🇸 English
  - 🇨🇳 简体中文 (Chinese)
  - 🇪🇸 Español (Spanish)
  - 🇸🇦 العربية (Arabic)
  - 🇫🇷 Français (French)
  - 🇯🇵 日本語 (Japanese)
  - 🇧🇷 Português (Portuguese)
- 🌓 **Deteksi Otomatis Dark Mode & Light Mode**:
  Mengikuti preferensi sistem operasi pengguna secara otomatis dengan tampilan *Liquid Glass* berkontras tinggi agar tetap tajam dan terbaca jelas di tema terang.
- 💡 **50 Fun Facts Seputar Format Gambar**:
  Menyajikan edukasi trivia dan sejarah format gambar yang berotasi otomatis setiap 10 detik.
- 📱 **Progressive Web App (PWA) & Offline Ready**:
  Dapat di-install langsung ke homescreen Android, iOS, Windows, atau macOS. Berjalan cepat dan dapat digunakan secara offline via Service Worker.
- 🖐️ **Antarmuka Mobile Ringkas (Compact & One-Hand Friendly)**:
  Desain mode HP yang padat tanpa ruang kosong berlebih, tombol aksi mengambang (*sticky bottom bar*), dan baris antrean 2 tingkat yang nyaman digunakan dengan satu tangan.
- 📦 **Ekspor Batch ZIP & Paste Clipboard (`Ctrl + V`)**:
  Download seluruh hasil konversi sekaligus dalam satu arsip `.zip`, atau tempel gambar tangkapan layar langsung menggunakan shortcut keyboard.

---

## 🚀 Cara Menjalankan

Aplikasi ini dibangun menggunakan arsitektur web modern tanpa dependensi build (`no build step needed`):

### Opsi 1: Menjalankan dengan Python
```bash
python -m http.server 3000
```
Buka peramban di `http://localhost:3000`.

### Opsi 2: Menjalankan dengan Node.js
```bash
npx serve .
```

### Opsi 3: VS Code Live Server
Klik kanan pada file `index.html` dan pilih **Open with Live Server**.

---

## 🛠️ Struktur File Proyek

```text
├── index.html       # Antarmuka utama aplikasi (Tailwind CSS & Liquid Glass UI)
├── app.js           # Orkestrasi antrean gambar, event listener, dan logika konversi
├── encoders.js      # Binary encoder murni (BMP, ICO, CUR, TGA, PPM, WBMP, DNG, PDF, SVG)
├── funfacts.js      # 50 Trivia format gambar dalam 8 bahasa
├── i18n.js          # Terjemahan kamus UI & kategori format dalam 8 bahasa
├── sw.js            # PWA Service Worker (offline cache & stale-while-revalidate)
├── manifest.json    # Web App Manifest PWA
├── icon.svg         # Vektor master icon PWA
├── icon-192.png     # Maskable icon PWA 192x192
└── icon-512.png     # Splash icon PWA 512x512
```
└── README.md        # Dokumentasi proyek
```

---

## 📄 Lisensi

Didistribusikan di bawah Lisensi [MIT](LICENSE). Silakan gunakan secara bebas untuk keperluan portofolio, edukasi, maupun komersial.
