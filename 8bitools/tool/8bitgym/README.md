# 8BitGym — Gym Progress Tracker (PWA)

Web native (Vanilla HTML/CSS/JS + PWA) untuk mencatat workout, routine, progress beban, dan ukuran tubuh, dengan penyimpanan lokal (`localStorage`) serta sinkronisasi gratis ke **Google Drive pribadi** (`appDataFolder`) tanpa VPS/database.

Visualisasi gambar demo (`0.jpg` ↔ `1.jpg`) dan panduan gerakan bersumber dari [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Public Domain).

## Deploy Gratis ke GitHub Pages

1. Buat repository baru di GitHub (misalnya `ironlog`) dan push isi folder `gym-tracker/` ini ke branch `main`.
2. Di GitHub repository, buka **Settings → Pages → Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `(root)`
3. Tunggu ~1 menit, lalu buka `https://<username>.github.io/<nama-repo>/`.

## Mengaktifkan Sync Akun Google Pribadi

1. Buka [Google Cloud Console](https://console.cloud.google.com/) → buat project → aktifkan **Google Drive API**.
2. Di **OAuth consent screen**, pilih **External** dan tambahkan email Gmail Anda ke **Test users**.
3. Di **Credentials → Create Credentials → OAuth client ID (Web application)**, tambahkan origin GitHub Pages Anda (`https://<username>.github.io`) ke **Authorized JavaScript origins**.
4. Salin **Client ID**, buka **Pengaturan** di 8BitGym, paste Client ID, lalu klik **Login & Simpan**.
