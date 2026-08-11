-- ============================================================================
-- Tabel Teachers untuk Manajemen Guru & Staff
-- ============================================================================
-- File: supabase-teachers-table.sql
-- Deskripsi: Schema database untuk tabel teachers dengan fitur upload foto WebP
-- ============================================================================

-- Drop tabel jika sudah ada (hati-hati, ini akan menghapus semua data)
-- DROP TABLE IF EXISTS public.teachers;

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

-- Buat index untuk performa query
CREATE INDEX IF NOT EXISTS idx_teachers_order ON public.teachers(order_index);
CREATE INDEX IF NOT EXISTS idx_teachers_created ON public.teachers(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Policy: Semua orang bisa membaca (untuk halaman publik /guru)
CREATE POLICY "Anyone can read teachers"
  ON public.teachers
  FOR SELECT
  USING (true);

-- Policy: Hanya authenticated users yang bisa insert
CREATE POLICY "Authenticated users can insert teachers"
  ON public.teachers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Hanya authenticated users yang bisa update
CREATE POLICY "Authenticated users can update teachers"
  ON public.teachers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Hanya authenticated users yang bisa delete
CREATE POLICY "Authenticated users can delete teachers"
  ON public.teachers
  FOR DELETE
  TO authenticated
  USING (true);

-- Buat function untuk auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Buat trigger untuk auto-update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.teachers;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Storage Bucket untuk Foto Guru
-- ============================================================================
-- Catatan: Jalankan ini di Supabase Storage UI atau via SQL

-- Buat bucket 'teachers' jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('teachers', 'teachers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Semua orang bisa membaca
CREATE POLICY "Anyone can read teacher images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'teachers');

-- Storage Policy: Authenticated users bisa upload
CREATE POLICY "Authenticated users can upload teacher images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'teachers');

-- Storage Policy: Authenticated users bisa update
CREATE POLICY "Authenticated users can update teacher images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'teachers');

-- Storage Policy: Authenticated users bisa delete
CREATE POLICY "Authenticated users can delete teacher images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'teachers');

-- ============================================================================
-- Data Awal (Optional - untuk testing)
-- ============================================================================
-- Uncomment untuk insert data awal

/*
INSERT INTO public.teachers (name, role, image_url, order_index) VALUES
  ('Muji As''ari, S.HI., M.Pd.I', 'Kepala Madrasah', '#', 1),
  ('Yuyun Novi Ikawati, S.Pd', 'Guru Kelas 1', '#', 2),
  ('Mar''ah Rohmatul Ummah, S.Pd', 'Guru Kelas 2', '#', 3),
  ('Ana Farida, S.Pd.I', 'Guru Kelas 3', '#', 4),
  ('Sukartini, S.Pd.I', 'Guru Kelas 4', '#', 5),
  ('Holila, S.Pd.I', 'Guru Kelas 5', '#', 6),
  ('Hartini Zubaidah, S.Pd.I', 'Guru Kelas 6', '#', 7),
  ('Masfin Khoirona, S.Pd.I', 'Guru Agama', '#', 8),
  ('Siti Saudah, S.Pd', 'Guru SKI', '#', 9),
  ('Nur Hidayat', 'Guru PJOK', '#', 10),
  ('Andi Mariono', 'Operator Data & IT', '#', 11);
*/

-- ============================================================================
-- Verifikasi
-- ============================================================================
-- SELECT * FROM public.teachers ORDER BY order_index;
-- SELECT * FROM storage.buckets WHERE id = 'teachers';
