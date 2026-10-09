-- ============================================================================
-- SPMB (Sistem Penerimaan Murid Baru) - Database Schema
-- MIS Nur Aziz Web Platform
-- Jalankan script ini di Supabase SQL Editor
-- ============================================================================

-- 1. Enum Status SPMB
DO $$ BEGIN
  CREATE TYPE spmb_status AS ENUM ('PENDING', 'DITERIMA', 'DITOLAK', 'BATAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Enum Alasan Pembatalan
DO $$ BEGIN
  CREATE TYPE alasan_pembatalan AS ENUM (
    'PINDAH_DOMISILI', 'DITERIMA_SEKOLAH_LAIN', 'KENDALA_BIAYA', 'LAINNYA'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Table: spmb_settings (Singleton)
CREATE TABLE IF NOT EXISTS spmb_settings (
  id           INT PRIMARY KEY DEFAULT 1,
  is_open      BOOLEAN NOT NULL DEFAULT FALSE,
  tahun_ajaran TEXT NOT NULL DEFAULT '2026/2027',
  kuota        INT DEFAULT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO spmb_settings (id, is_open, tahun_ajaran, kuota)
VALUES (1, FALSE, '2026/2027', NULL)
ON CONFLICT (id) DO NOTHING;

-- 4. Table: spmb_pendaftar
CREATE TABLE IF NOT EXISTS spmb_pendaftar (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id  TEXT NOT NULL UNIQUE,
  nama_lengkap     TEXT NOT NULL,
  tempat_lahir     TEXT NOT NULL,
  tanggal_lahir    DATE NOT NULL,
  nomor_wa         TEXT NOT NULL,
  foto_kk_url      TEXT NOT NULL,
  foto_akta_url    TEXT NOT NULL,
  status           spmb_status NOT NULL DEFAULT 'PENDING',
  alasan_batal     alasan_pembatalan DEFAULT NULL,
  catatan_batal    TEXT DEFAULT NULL,
  catatan_admin    TEXT DEFAULT NULL,
  tahun_ajaran     TEXT NOT NULL DEFAULT '2026/2027',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spmb_registration_id ON spmb_pendaftar (registration_id);
CREATE INDEX IF NOT EXISTS idx_spmb_status ON spmb_pendaftar (status);
CREATE INDEX IF NOT EXISTS idx_spmb_created_at ON spmb_pendaftar (created_at DESC);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_spmb_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS spmb_pendaftar_updated_at ON spmb_pendaftar;
CREATE TRIGGER spmb_pendaftar_updated_at
  BEFORE UPDATE ON spmb_pendaftar
  FOR EACH ROW EXECUTE FUNCTION update_spmb_updated_at();

DROP TRIGGER IF EXISTS spmb_settings_updated_at ON spmb_settings;
CREATE TRIGGER spmb_settings_updated_at
  BEFORE UPDATE ON spmb_settings
  FOR EACH ROW EXECUTE FUNCTION update_spmb_updated_at();

-- ============================================================================
-- 5. Row Level Security
-- ============================================================================
ALTER TABLE spmb_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spmb_settings_public_read" ON spmb_settings;
CREATE POLICY "spmb_settings_public_read" ON spmb_settings
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "spmb_settings_admin_update" ON spmb_settings;
CREATE POLICY "spmb_settings_admin_update" ON spmb_settings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE spmb_pendaftar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spmb_public_insert" ON spmb_pendaftar;
CREATE POLICY "spmb_public_insert" ON spmb_pendaftar
  FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "spmb_public_select" ON spmb_pendaftar;
CREATE POLICY "spmb_public_select" ON spmb_pendaftar
  FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "spmb_public_update_batal" ON spmb_pendaftar;
CREATE POLICY "spmb_public_update_batal" ON spmb_pendaftar
  FOR UPDATE TO anon
  USING (status != 'BATAL')
  WITH CHECK (status = 'BATAL');
DROP POLICY IF EXISTS "spmb_admin_all" ON spmb_pendaftar;
CREATE POLICY "spmb_admin_all" ON spmb_pendaftar
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 6. Storage Bucket: berkas-spmb
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('berkas-spmb', 'berkas-spmb', true, 5242880,
  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "berkas_spmb_upload" ON storage.objects;
CREATE POLICY "berkas_spmb_upload" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'berkas-spmb');
DROP POLICY IF EXISTS "berkas_spmb_read" ON storage.objects;
CREATE POLICY "berkas_spmb_read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'berkas-spmb');
DROP POLICY IF EXISTS "berkas_spmb_admin_delete" ON storage.objects;
CREATE POLICY "berkas_spmb_admin_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'berkas-spmb');
