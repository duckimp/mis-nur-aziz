-- ============================================================================
-- TRACER STUDY & JEJAK LULUSAN - DATABASE SCHEMA
-- MIS Nur Aziz Web Platform
-- Jalankan seluruh script ini di SQL Editor Supabase Anda.
-- ============================================================================

-- 1. Buat Tabel: alumni_tracer
CREATE TABLE IF NOT EXISTS alumni_tracer (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identitas Alumni
  nama_lengkap          TEXT NOT NULL,
  nisn                  VARCHAR(20) DEFAULT NULL,
  tahun_lulus           INT NOT NULL,
  jenis_kelamin         VARCHAR(10) NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
  nomor_wa              VARCHAR(30) NOT NULL,
  
  -- Studi Lanjutan
  tipe_sekolah_lanjutan VARCHAR(30) NOT NULL CHECK (
    tipe_sekolah_lanjutan IN ('mts_negeri', 'mts_swasta', 'smp_negeri', 'smp_swasta', 'pesantren', 'lainnya')
  ),
  nama_sekolah_lanjutan TEXT NOT NULL,
  kabupaten_kota        TEXT NOT NULL,
  jalur_masuk           VARCHAR(50) DEFAULT 'Reguler',
  
  -- Prestasi & Pesan
  kategori_prestasi     VARCHAR(100) DEFAULT NULL,
  rincian_prestasi      TEXT DEFAULT NULL,
  kesan_pesan           TEXT DEFAULT NULL,
  
  -- Status Verifikasi & Moderasi Admin
  status_verifikasi     VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    status_verifikasi IN ('pending', 'disetujui', 'ditolak')
  ),
  catatan_admin         TEXT DEFAULT NULL,
  
  -- Metadata Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes untuk Performa Query & Pencarian
CREATE INDEX IF NOT EXISTS idx_tracer_tahun_lulus ON alumni_tracer(tahun_lulus);
CREATE INDEX IF NOT EXISTS idx_tracer_tipe_sekolah ON alumni_tracer(tipe_sekolah_lanjutan);
CREATE INDEX IF NOT EXISTS idx_tracer_status_verifikasi ON alumni_tracer(status_verifikasi);
CREATE INDEX IF NOT EXISTS idx_tracer_nomor_wa ON alumni_tracer(nomor_wa);
CREATE INDEX IF NOT EXISTS idx_tracer_nama ON alumni_tracer USING gin(to_tsvector('indonesian', nama_lengkap));

-- 3. Trigger Otomatis Update Kolom updated_at
CREATE OR REPLACE FUNCTION update_alumni_tracer_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_alumni_tracer_timestamp ON alumni_tracer;
CREATE TRIGGER trg_update_alumni_tracer_timestamp
  BEFORE UPDATE ON alumni_tracer
  FOR EACH ROW
  EXECUTE FUNCTION update_alumni_tracer_timestamp();

-- 4. Row Level Security (RLS)
ALTER TABLE alumni_tracer ENABLE ROW LEVEL SECURITY;

-- Policy 1: Publik (anonim) dapat melihat data alumni yang SUDAH DISETUJUI oleh admin
CREATE POLICY "Public read approved alumni"
  ON alumni_tracer
  FOR SELECT
  USING (status_verifikasi = 'disetujui');

-- Policy 2: Publik (anonim) dapat mengirim data alumni baru (default pending)
CREATE POLICY "Public insert alumni"
  ON alumni_tracer
  FOR INSERT
  WITH CHECK (status_verifikasi = 'pending');

-- Policy 3: User terautentikasi (Admin & Guru) memiliki akses penuh (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Authenticated full access on alumni"
  ON alumni_tracer
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
