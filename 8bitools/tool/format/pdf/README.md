# 📄 8BitDoc — Smart Document Scanner & Image to PDF Studio

> **Konverter Gambar ke PDF Cerdas, Meluruskan Sudut (4-Point Perspective Warp), Menghilangkan Bayangan dengan Filter Scanner, 100% Client-Side Tanpa Server.**

---

## 🌟 Fitur Utama

- 📐 **Luruskan & Sudut Presisi (4-Point Projective Homography)**:
  - Koreksi distorsi keystone akibat memotret buku atau kertas dari samping atau sudut miring.
  - Pembesar *Loupe* (3x Zoom) dengan *crosshair* akurat saat menggeser pin sudut (TL, TR, BR, BL).
  - Deteksi sudut otomatis (*Auto-detect corners*) berdasarkan kontras tepi kertas.
  - Kunci aspek rasio dokumen (A4 1:1.414, US Letter, Folio F4).

- 🔄 **Kemiringan Halus & Rotasi (Fine Angle Deskew)**:
  - Slider kemiringan `-45.0°` hingga `+45.0°` dengan akurasi `0.1°`.
  - Garis kisi lurus (*Alignment Grid Lines*) untuk memastikan baris teks sejajar horizontal.
  - Putar cepat 90° searah/berlawanan jarum jam, serta balik horizontal/vertikal.

- 🎨 **Filter Khusus Dokumen (Document Enhancement Filters)**:
  - **✨ Magic Color (CamScanner Style)**: Memutihkan latar kertas dari bayangan lampu/kamera, menajamkan teks tulisan, dan mempertahankan warna stempel serta tanda tangan.
  - **📄 Scanner B&W**: Binarisasi adaptif untuk hasil fotokopi hitam putih ultra bersih tanpa noda bayangan.
  - **🌫️ Grayscale Lembut**: Gradasi abu-abu bersih tanpa rona kuning.
  - **☁️ Soft White**: Mencerahkan kertas kusam tanpa menghapus tulisan pensil tipis.
  - **🌟 Vivid**: Memperkuat saturasi dan kontras untuk KTP, piagam penghargaan, sertifikat, dan poster.
  - **🖼️ Asli (Normal)**: Resolusi dan warna murni kamera.
  - Slider manual untuk Kecerahan, Kontras, Ketajaman Tulisan (*Unsharp Mask*), dan Ambang Batas Pemutih Kertas.

- ⚙️ **Pengaturan Tata Letak PDF Lengkap**:
  - Ukuran Kertas: **A4**, **US Letter**, **Legal**, **F4 / Folio**, atau **Sesuai Ukuran Gambar** (*Fit Image Full Bleed*).
  - Orientasi Halaman: Otomatis (sesuai gambar masing-masing), Semua Portrait, Semua Landscape.
  - Margin: Tanpa Margin (0 mm), Tipis (5 mm), Standar (10 mm), Lebar (20 mm).
  - Kualitas Berkas: Maksimal (Crisp 1:1), Seimbang (Email/WA), Kompak (&lt; 1 MB).
  - Nomor Halaman Otomatis (Bawah Tengah / Bawah Kanan).
  - Watermark Teks Kustom (opsional) dengan transparansi halus.

- 🔒 **100% Client-Side & Privasi Mutlak**:
  - Berkas diproses sepenuhnya di RAM peramban (*HTML5 Canvas 2D + jsPDF*).
  - Nol kilobyte dikirim ke server. Sangat aman untuk dokumen rahasia, paspor, ijazah, atau identitas pribadi.
