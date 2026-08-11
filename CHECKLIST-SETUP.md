# ✅ CHECKLIST SETUP - Sistem Guru & Staff

## 📋 Pre-Setup (Sudah Selesai)
- [x] Component TeacherManager dibuat (470 lines)
- [x] Halaman admin /admin/guru dibuat
- [x] Halaman public /guru updated
- [x] Menu "Guru & Staff" ditambahkan ke sidebar
- [x] SQL schema dibuat (supabase-teachers-table.sql)
- [x] Storage bucket "teachers" sudah ada di Supabase
- [x] Storage policies sudah lengkap (4 policies)
- [x] Dokumentasi lengkap (4 files)

## 🔧 Setup yang Harus Dilakukan (Action Required)

### Step 1: Setup Environment Variables
- [ ] Buka https://app.supabase.com
- [ ] Login dan pilih project: **si-aziz**
- [ ] Klik **Settings** > **API**
- [ ] Copy **Project URL** (https://xxxxx.supabase.co)
- [ ] Copy **anon public** key (eyJhbGci...)
- [ ] Copy **service_role** key (eyJhbGci...)
- [ ] Buka file `.env` di root project
- [ ] Paste ketiga nilai tersebut
- [ ] Save file (Ctrl+S)
- [ ] Restart dev server (Ctrl+C, lalu `npm run dev`)

**Format .env yang benar:**
```
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**Cek:** Website http://localhost:4321 bisa dibuka tanpa error

### Step 2: Setup Database Tabel
- [ ] Buka Supabase Dashboard > **SQL Editor**
- [ ] Klik **New Query**
- [ ] Copy isi file `supabase-teachers-table.sql`
- [ ] Paste di SQL Editor
- [ ] Klik **Run** (atau Ctrl+Enter)
- [ ] Tunggu sampai query berhasil (lihat success message)

**Cek:** Di Table Editor, tabel `teachers` sudah muncul dengan 7 kolom

### Step 3: Verifikasi Storage
- [ ] Buka Supabase Dashboard > **Storage**
- [ ] Cek bucket `teachers` sudah ada
- [ ] Cek status bucket: **PUBLIC** (bukan private)
- [ ] Klik bucket `teachers` > tab **Policies**
- [ ] Pastikan ada 4 policies:
  - Anyone can read teacher images
  - Authenticated users can upload teacher images
  - Authenticated users can update teacher images
  - Authenticated users can delete teacher images

**Cek:** Semua policies aktif (toggle ON)

### Step 4: Test di Browser
- [ ] Buka http://localhost:4321
- [ ] Website bisa dibuka tanpa error ✅
- [ ] Login ke /admin/login
- [ ] Klik menu **Guru & Staff**
- [ ] Halaman /admin/guru terbuka
- [ ] Lihat tombol **"Impor Data"** (jika tabel kosong)

**Cek:** Tidak ada error di browser console (F12)

### Step 5: Import Data Awal
- [ ] Di halaman /admin/guru
- [ ] Klik tombol **"Impor Data"**
- [ ] Tunggu proses selesai (loading indicator)
- [ ] 11 guru muncul di tabel

**Data yang di-import:**
1. Muji As'ari, S.HI., M.Pd.I - Kepala Madrasah
2. Yuyun Novi Ikawati, S.Pd - Guru Kelas 1
3. Mar'ah Rohmatul Ummah, S.Pd - Guru Kelas 2
4. Ana Farida, S.Pd.I - Guru Kelas 3
5. Sukartini, S.Pd.I - Guru Kelas 4
6. Holila, S.Pd.I - Guru Kelas 5
7. Hartini Zubaidah, S.Pd.I - Guru Kelas 6
8. Masfin Khoirona, S.Pd.I - Guru Agama
9. Siti Saudah, S.Pd - Guru SKI
10. Nur Hidayat - Guru PJOK
11. Andi Mariono - Operator Data & IT

### Step 6: Test Upload Foto
- [ ] Klik tombol **Edit** pada salah satu guru
- [ ] Klik input file untuk upload foto
- [ ] Pilih foto (JPG/PNG, max 5MB)
- [ ] Klik **Simpan**
- [ ] Tunggu upload selesai
- [ ] Foto muncul sebagai thumbnail di tabel
- [ ] Cek di Supabase Storage > bucket `teachers` > ada file .webp

**Cek:** File foto berformat `.webp` dan ukuran lebih kecil dari original

### Step 7: Test Reorder
- [ ] Gunakan tombol ↑ (naik) atau ↓ (turun)
- [ ] Urutan berubah
- [ ] Refresh halaman (F5)
- [ ] Urutan tetap sesuai yang di-set

**Cek:** Urutan tersimpan di database (kolom `order_index`)

### Step 8: Test Halaman Public
- [ ] Buka tab baru (incognito/private)
- [ ] Buka http://localhost:4321/guru
- [ ] Daftar guru tampil (tanpa perlu login)
- [ ] Foto guru (jika sudah diupload) tampil
- [ ] Urutan sesuai yang di-set di admin

**Cek:** Halaman public bisa diakses tanpa login

## 🎉 Final Verification

- [ ] Semua 8 steps di atas sudah selesai
- [ ] Tidak ada error di browser console
- [ ] Upload foto berfungsi dan auto-convert ke WebP
- [ ] Reorder berfungsi
- [ ] Halaman public bisa diakses
- [ ] Data tersimpan di Supabase

## 📚 Dokumentasi untuk Referensi

| File | Purpose |
|------|---------|
| `SETUP-ENV-VARIABLES.md` | Panduan setup .env lengkap |
| `SETUP-GURU-STAFF.md` | Setup database & storage |
| `GURU-STAFF-SYSTEM.md` | Dokumentasi sistem lengkap |
| `QUICK-REFERENCE-GURU.md` | Quick reference sehari-hari |
| `supabase-teachers-table.sql` | SQL schema untuk tabel |

## 🚨 Troubleshooting

### Error: Invalid supabaseUrl
**Solusi:** File .env masih placeholder. Isi dengan credentials asli dari Supabase.

### Upload foto gagal
**Solusi:** 
- Cek bucket `teachers` adalah PUBLIC
- Cek storage policies sudah dibuat
- Pastikan sudah login

### Foto tidak muncul di public
**Solusi:**
- Cek bucket `teachers` adalah PUBLIC (bukan private)
- Refresh browser (Ctrl+F5)

### Data tidak tersimpan
**Solusi:**
- Cek tabel `teachers` sudah dibuat
- Cek RLS policies sudah aktif
- Cek browser console untuk error

---

**Status:** Setup ready! Tinggal jalankan Step 1-8 di atas.  
**Last Updated:** 11 Agustus 2026  
**Version:** 1.0.0
