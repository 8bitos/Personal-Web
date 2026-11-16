# 🗜️ 8BitCompress — Precision File & Media Compressor

> **Client-Side Precision Compression Engine for Images, Video, Audio, and PDF Documents**

![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local%20RAM-zinc.svg)
![Zero-Server](https://img.shields.io/badge/Server-Zero%20(Client--Side)-blue.svg)
![Engines](https://img.shields.io/badge/Engines-PDF%20%7C%20Image%20%7C%20Video%20%7C%20Audio-emerald.svg)

---

## 🌟 Fitur Utama & Pembaruan

- 🎛️ **Pengaturan Mandiri Setiap File (*Independent Per-File Settings*)**:
  - Setiap berkas dalam antrean dapat diatur target, resolusi, dan format outputnya secara terpisah.
  - Tipe file campuran (Video + Audio + Gambar + PDF) dapat diproses sekaligus dengan setelan masing-masing.
  - Tombol **"Terapkan ke Semua Berkas"** untuk menyalin setelan global ke semua antrean dalam 1 klik.

- 📐 **Rentang Resolusi Penuh (Dari 16p sampai 4K dan Asli)**:
  - `Asli (Original)`
  - `4K UHD (3840×2160)`
  - `2K QHD (2560×1440)`
  - `1080p FHD (1920×1080)`
  - `720p HD (1280×720)`
  - `480p SD (854×480)`
  - `360p (640×360)`
  - `240p (426×240)`
  - `144p (256×144)`
  - `72p (128×72)`
  - `36p (64×36)`
  - `16p Pixel (28×16)` — kompresi retro piksel ekstrem.

- 🔄 **Pilihan Format Output Lengkap Per Media**:
  - **Gambar**: WebP, JPG/JPEG, PNG, AVIF, BMP (Bitmap murni), GIF, ICO (Favicon Windows), PDF Document.
  - **Video**: MP4, WebM, MKV, MOV, Ekstrak Audio (MP3), Ekstrak Audio (WAV).
  - **Audio**: MP3, WAV (PCM), OGG, M4A/AAC, FLAC, WebM Audio.
  - **Dokumen PDF**: PDF Terkompresi (.pdf), Arsip ZIP (.zip).
  - **Dokumen/Arsip Umum**: ZIP Deflate Level 9 (.zip).

- 🎯 **Target Ukuran Berkas & Persentase**:
  - Tentukan target ukuran (misal `2 MB`, `500 KB`) atau persentase kompresi (misal `60%`, `75%`).
  - Sistem secara otomatis menghitung anggaran bit (*bit budget*), skala resolusi kanvas, dan kualitas encoding agar ukuran berkas hasil pas berada di bawah target.

- 📄 **Kompresi PDF Nyata (*Real PDF Compression*)**:
  - Halaman PDF dipindai dan dikompresi ulang menggunakan PDF.js dan jsPDF.
  - Hasil kompresi tetap berupa berkas `.pdf` asli yang dapat dibuka di semua PDF viewer (bukan sekadar ZIP).

- 🔒 **100% Client-Side Privacy**:
  - Seluruh pemrosesan dilakukan di memori RAM lokal komputer/ponsel Anda tanpa satu bit pun data dikirim ke server.

---

## 💻 Jalur Akses

Buka langsung file [`index.html`](file:///c:/kuliah/CV/Portofolio/tool/format/compressor/index.html) di peramban web modern Anda.
