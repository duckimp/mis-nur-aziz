# Sistem Manajemen Guru & Staff

## 📋 Overview
Sistem untuk mengelola data guru dan staff dengan fitur upload foto yang otomatis dikompresi dan dikonversi ke format WebP untuk performa optimal.

## ✨ Fitur Utama
1. **CRUD Guru & Staff** - Tambah, edit, hapus data guru
2. **Upload Foto dengan Auto-Compress** - Foto otomatis dikompresi dan convert ke WebP
3. **Reorder/Urutan** - Atur urutan tampilan dengan tombol up/down
4. **Import Data Awal** - Tombol untuk import 11 data guru default
5. **Responsive Design** - Tampilan mobile-friendly
6. **Public Page** - Halaman `/guru` untuk publik (fetch dari database)
7. **Admin Page** - Halaman `/admin/guru` untuk manajemen (authenticated only)

## 🗂️ Struktur File

### Frontend Components
- **`src/components/admin/TeacherManager.tsx`** - Component React untuk manajemen guru
  - Form add/edit guru dengan upload foto
  - Tabel daftar guru dengan fitur reorder
  - Fungsi kompresi WebP
  - Integration dengan Supabase storage & database

### Pages
- **`src/pages/guru.astro`** - Halaman publik untuk menampilkan daftar guru (fetch dari DB)
- **`src/pages/admin/guru.astro`** - Halaman admin untuk manajemen guru (authenticated)

### Database
- **`supabase-teachers-table.sql`** - SQL schema untuk tabel teachers dan storage bucket

### Types
- **`src/lib/types.ts`** - Interface TypeScript untuk Teacher

## 🗄️ Database Schema

### Tabel: `teachers`
```sql
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- Nama lengkap & gelar
  role TEXT NOT NULL,                    -- Jabatan/peran
  image_url TEXT DEFAULT '#',            -- URL foto (dari Supabase storage)
  order_index INTEGER NOT NULL DEFAULT 0, -- Urutan tampilan
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Storage Bucket: `teachers`
- Public bucket untuk menyimpan foto guru
- Format: WebP (auto-convert dari JPG/PNG)
- Max width: 800px
- Quality: 82%

## 🚀 Cara Setup

### 1. Buat Tabel di Supabase
Jalankan SQL di Supabase SQL Editor:
```bash
# Copy isi file supabase-teachers-table.sql
# Paste di Supabase Dashboard > SQL Editor > New Query
# Run query
```

### 2. Verifikasi Storage Bucket
- Buka Supabase Dashboard > Storage
- Pastikan bucket `teachers` sudah dibuat
- Set bucket sebagai `public`

### 3. Install Dependencies (sudah ada)
```bash
npm install lucide-react
```

### 4. Deploy/Run
```bash
npm run dev
```

## 📱 Cara Penggunaan

### Admin (Authenticated User)
1. Login ke `/admin/login`
2. Buka menu **Guru & Staff** di sidebar
3. **Tambah Guru Baru:**
   - Isi nama lengkap & gelar (mis. "Muji As'ari, S.HI., M.Pd.I")
   - Isi jabatan (mis. "Kepala Madrasah")
   - Upload foto (otomatis compress ke WebP)
   - Klik **Tambah**
4. **Edit Guru:**
   - Klik tombol **Edit** pada guru yang ingin diedit
   - Ubah data
   - Klik **Simpan**
5. **Hapus Guru:**
   - Klik tombol **Hapus** (hanya untuk role `admin`)
6. **Reorder:**
   - Gunakan tombol ↑ ↓ untuk mengubah urutan tampilan
7. **Import Data Awal:**
   - Jika tabel kosong, klik tombol **Impor Data** untuk menambahkan 11 guru default

### Public User
1. Buka halaman `/guru`
2. Lihat daftar guru yang sudah diurutkan

## 🔧 Technical Details

### Kompresi WebP
Fungsi `compressAndConvertToWebp` di TeacherManager:
- Resize gambar max width 800px (maintain aspect ratio)
- Convert ke WebP format
- Quality 82% (balance antara size & quality)
- Canvas API untuk rendering

### Upload Flow
1. User pilih file (JPG/PNG/WebP)
2. File dikompresi client-side (browser canvas API)
3. Upload WebP blob ke Supabase storage bucket `teachers`
4. Get public URL dari storage
5. Save URL ke database field `image_url`

### Security (RLS)
- **Read**: Public (anyone dapat melihat daftar guru)
- **Insert/Update/Delete**: Authenticated users only
- **Storage**: Public read, authenticated write

### Role Management
- **Editor**: Bisa add, edit guru (tidak bisa hapus)
- **Admin**: Full access (add, edit, delete, reorder)

## 🎨 UI/UX

### Admin Page (`/admin/guru`)
- Card form untuk add/edit
- Tabel daftar guru dengan foto thumbnail
- Badge untuk jabatan
- Tombol aksi (edit, hapus, reorder)
- Loading state & upload progress
- Responsive grid layout

### Public Page (`/guru`)
- Grid layout kartu guru
- Foto portrait dengan aspect ratio 3:4
- Nama & jabatan di bawah foto
- Fallback placeholder jika foto tidak ada
- Animate on scroll

## 📊 Data Initial (11 Guru)
Data default yang di-import via tombol "Impor Data":
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

## 🐛 Troubleshooting

### Upload gagal
- Pastikan bucket `teachers` sudah dibuat
- Cek RLS policies di storage
- Cek file size (max biasanya 5MB)

### Foto tidak muncul
- Cek bucket adalah `public`
- Cek URL storage di database field `image_url`
- Cek browser console untuk CORS errors

### Reorder tidak work
- Refresh halaman
- Cek database field `order_index` sudah terisi
- Pastikan tidak ada duplicate order_index

## 🔄 Future Enhancements
- [ ] Drag & drop untuk reorder
- [ ] Bulk upload
- [ ] Export to Excel/PDF
- [ ] Search & filter
- [ ] Kategori guru (Kelas, Agama, Olahraga, dll)
- [ ] Struktur organisasi (tree view)

---

**Developer**: Andi Mariono  
**Last Updated**: 11 Agustus 2026  
**Version**: 1.0.0
