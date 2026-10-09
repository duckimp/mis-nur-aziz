import { z } from 'zod';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// ============================================================
// Zod Schemas
// ============================================================
export const SPMBFormSchema = z.object({
  nama_lengkap: z.string().min(3, 'Nama minimal 3 karakter').max(100),
  tempat_lahir: z.string().min(2, 'Tempat lahir harus diisi').max(100),
  tanggal_lahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  nomor_wa: z
    .string()
    .regex(/^(\+62|62|0)8[0-9]{8,12}$/, 'Format nomor WhatsApp tidak valid')
    .max(20),
});

export const CekStatusSchema = z.object({
  registration_id: z
    .string()
    .regex(/^SPMB-\d{4}-\d{3,}$/, 'Format ID tidak valid (contoh: SPMB-2026-001)'),
});

export const BatalSchema = z.object({
  registration_id: z.string(),
  alasan_batal: z.enum(['PINDAH_DOMISILI', 'DITERIMA_SEKOLAH_LAIN', 'KENDALA_BIAYA', 'LAINNYA']),
  catatan_batal: z.string().max(500).optional(),
});

// ============================================================
// Types
// ============================================================
export type SPMBStatus = 'PENDING' | 'DITERIMA' | 'DITOLAK' | 'BATAL';
export type AlasanBatal = 'PINDAH_DOMISILI' | 'DITERIMA_SEKOLAH_LAIN' | 'KENDALA_BIAYA' | 'LAINNYA';

export interface SPMBPendaftar {
  id: string;
  registration_id: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  nomor_wa: string;
  foto_kk_url: string;
  foto_akta_url: string;
  status: SPMBStatus;
  alasan_batal?: AlasanBatal;
  catatan_batal?: string;
  catatan_admin?: string;
  tahun_ajaran: string;
  created_at: string;
  updated_at: string;
}

export interface SPMBSettings {
  id: number;
  is_open: boolean;
  tahun_ajaran: string;
  kuota: number | null;
  updated_at: string;
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Generate registration ID unik
 * Format: SPMB-YYYY-XXX (e.g. SPMB-2026-001)
 */
export async function generateRegistrationId(tahun_ajaran: string): Promise<string> {
  const supabase = getSupabaseClient();
  const year = tahun_ajaran.split('/')[0];

  const { count } = await supabase
    .from('spmb_pendaftar')
    .select('*', { count: 'exact', head: true })
    .eq('tahun_ajaran', tahun_ajaran);

  const seq = String((count ?? 0) + 1).padStart(3, '0');
  return `SPMB-${year}-${seq}`;
}

/**
 * Format nomor WA ke format internasional
 */
export function formatWhatsApp(nomor: string): string {
  let clean = nomor.replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '62' + clean.slice(1);
  if (!clean.startsWith('62')) clean = '62' + clean;
  return clean;
}

/**
 * Generate WhatsApp deep link dengan template pesan
 */
export function generateWALink(nomor: string, pesan: string): string {
  const number = formatWhatsApp(nomor);
  const encoded = encodeURIComponent(pesan);
  return `https://api.whatsapp.com/send?phone=${number}&text=${encoded}`;
}

/**
 * Template pesan WA berdasarkan status
 */
export function generateWAMessage(
  status: 'DITERIMA' | 'DITOLAK',
  nama: string,
  regId: string
): string {
  const siteUrl = 'https://mis-nur-aziz.vercel.app';

  if (status === 'DITERIMA') {
    return `Assalamu'alaikum Bapak/Ibu wali murid *${nama}*,

Kami dari MIS Nur Aziz dengan senang hati menyampaikan bahwa putra/putri Bapak/Ibu dengan ID Registrasi *${regId}* telah resmi *DITERIMA* di MIS Nur Aziz. 🎉

Silakan cek kartu bukti penerimaan di:
${siteUrl}/spmb/cek-status

Untuk informasi daftar ulang, silakan hubungi pihak sekolah.

Wassalamu'alaikum Wr. Wb.
_MIS Nur Aziz_`;
  }

  return `Assalamu'alaikum Bapak/Ibu wali murid *${nama}*,

Kami dari MIS Nur Aziz menyampaikan bahwa pendaftaran putra/putri Bapak/Ibu dengan ID Registrasi *${regId}* belum dapat kami terima pada tahun ajaran ini.

Kami mohon maaf atas ketidaknyamanan ini. Untuk informasi lebih lanjut, silakan hubungi pihak sekolah secara langsung.

Wassalamu'alaikum Wr. Wb.
_MIS Nur Aziz_`;
}

/**
 * Status badge config
 */
export function getStatusConfig(status: SPMBStatus) {
  const configs = {
    PENDING: { label: 'Menunggu Verifikasi', color: '#d97706', bg: '#fef3c7', icon: '⏳' },
    DITERIMA: { label: 'Diterima', color: '#059669', bg: '#d1fae5', icon: '✅' },
    DITOLAK: { label: 'Tidak Diterima', color: '#dc2626', bg: '#fee2e2', icon: '❌' },
    BATAL: { label: 'Dibatalkan', color: '#6b7280', bg: '#f3f4f6', icon: '🚫' },
  };
  return configs[status];
}

export function getAlasanBatalLabel(alasan: AlasanBatal): string {
  const labels: Record<AlasanBatal, string> = {
    PINDAH_DOMISILI: 'Pindah Domisili',
    DITERIMA_SEKOLAH_LAIN: 'Diterima di Sekolah Lain',
    KENDALA_BIAYA: 'Kendala Biaya',
    LAINNYA: 'Lainnya',
  };
  return labels[alasan] || alasan;
}

/**
 * Format tanggal ke Bahasa Indonesia
 */
export function formatTanggal(tanggal: string): string {
  return new Date(tanggal).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
