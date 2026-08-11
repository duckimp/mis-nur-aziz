# Setup Guide - Guru & Staff System

## 🚀 Langkah-langkah Setup di Supabase

### Step 1: Buat Tabel `teachers`
1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Klik menu **SQL Editor** di sidebar kiri
4. Klik **New Query**
5. Copy paste SQL berikut:

```sql
-- Buat tabel teachers
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  image_url TEXT DEFAULT '#',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_teachers_order ON public.teachers(order_index);
CREATE INDEX IF NOT EXISTS idx_teachers_created ON public.teachers(created_at DESC);

-- Enable RLS
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read
CREATE POLICY "Anyone can read teachers"
  ON public.teachers FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can insert teachers"
  ON public.teachers FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update
CREATE POLICY "Authenticated users can update teachers"
  ON public.teachers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete
CREATE POLICY "Authenticated users can delete teachers"
  ON public.teachers FOR DELETE
  TO authenticated
  USING (true);
```


### Step 2: Buat Storage Bucket `teachers`
1. Klik menu **Storage** di sidebar kiri
2. Klik tombol **Create a new bucket**
3. Isi form:
   - **Name**: `teachers`
   - **Public bucket**: ✅ **Centang ini** (penting!)
   - **File size limit**: 5 MB (default)
   - **Allowed MIME types**: image/* (default)
4. Klik **Create bucket**

### Step 3: Setup Storage Policies
1. Masih di menu **Storage**
2. Klik bucket `teachers` yang baru dibuat
3. Klik tab **Policies**
4. Klik **New Policy** untuk setiap policy berikut:

**Policy 1: Anyone can read**
```sql
CREATE POLICY "Anyone can read teacher images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'teachers');
```

**Policy 2: Authenticated users can upload**
```sql
CREATE POLICY "Authenticated users can upload teacher images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'teachers');
```

**Policy 3: Authenticated users can update**
```sql
CREATE POLICY "Authenticated users can update teacher images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'teachers');
```

**Policy 4: Authenticated users can delete**
```sql
CREATE POLICY "Authenticated users can delete teacher images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'teachers');
```

### Step 4: Verifikasi Setup
1. Buka **Table Editor** > pilih tabel `teachers`
2. Pastikan kolom-kolom sudah ada
3. Buka **Storage** > bucket `teachers`
4. Pastikan bucket sudah ada dan berstatus **Public**

## ✅ Testing

### Test 1: Akses Halaman Admin
1. Buka browser: `http://localhost:4321/admin/login`
2. Login dengan user yang sudah terdaftar
3. Klik menu **Guru & Staff** di sidebar
4. Halaman `/admin/guru` harus terbuka tanpa error

### Test 2: Import Data Awal
1. Di halaman `/admin/guru`
2. Jika tabel masih kosong, klik tombol **Impor Data**
3. Tunggu proses selesai
4. 11 data guru harus muncul di tabel

### Test 3: Upload Foto
1. Klik tombol **Edit** pada salah satu guru
2. Pilih file foto (JPG/PNG)
3. Klik **Simpan**
4. Foto harus ter-upload dan tampil sebagai thumbnail
5. Cek di Supabase Storage > bucket `teachers` > harus ada file `.webp`

---

**Selamat!** Sistem Guru & Staff sudah siap digunakan 🎉

