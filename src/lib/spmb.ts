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
    .min(8, 'Nomor WhatsApp minimal 8 digit')
    .max(20, 'Nomor WhatsApp terlalu panjang')
    .regex(/^(\+?\d{8,16})$/, 'Format nomor WhatsApp tidak valid'),
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
 * Format nomor WA ke format internasional murni angka (contoh: 6285694841807)
 */
export function formatWhatsApp(nomor: string): string {
  if (!nomor) return '';
  let clean = nomor.replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '62' + clean.slice(1);
  if (clean.startsWith('8')) clean = '62' + clean;
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
  regId: string,
  tahunAjaran?: string,
  catatan?: string
): string {
  // Fallback defensif jika data undefined (misal dari cache browser lama)
  const safeName = nama || '(Nama tidak tersedia)';
  const safeRegId = regId || '(ID tidak tersedia)';
  const siteUrl = 'https://mis-nur-aziz.vercel.app';
  const taText = tahunAjaran ? ` Tahun Ajaran ${tahunAjaran}` : '';
  const noteText = catatan ? `\n\n*Catatan dari Sekolah:*\n_"${catatan}"_` : '';

  if (status === 'DITERIMA') {
    return `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Yth. Bapak/Ibu Wali Murid dari *${safeName}*,

Alhamdulillah, kami dari Panitia SPMB MIS Nur Aziz menginformasikan bahwa putra/putri Bapak/Ibu dengan ID Registrasi *${safeRegId}* telah resmi dinyatakan:

🎉 *DITERIMA SEBAGAI CALON SISWA BARU*${taText} 🎉${noteText}

Silakan melihat dan mengunduh Kartu Bukti Penerimaan Digital melalui tautan resmi berikut:
${siteUrl}/spmb/cek-status?id=${safeRegId}

Untuk informasi jadwal daftar ulang dan orientasi siswa, panitia akan menghubungi melalui nomor ini.

Wassalamu'alaikum Warahmatullahi Wabarakatuh.
*Panitia SPMB MIS Nur Aziz*`;
  }

  return `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Yth. Bapak/Ibu Wali Murid dari *${safeName}*,

Kami dari Panitia SPMB MIS Nur Aziz menyampaikan permohonan maaf bahwa pendaftaran calon siswa dengan ID Registrasi *${safeRegId}* pada kesempatan ini *belum dapat kami terima* dikarenakan keterbatasan kuota kelas.${noteText}

Kami mengucapkan terima kasih yang sebesar-besarnya atas kepercayaan dan partisipasi Bapak/Ibu. Semoga ananda selalu diberikan kemudahan dan kesuksesan di sekolah pilihan terbaik.

Wassalamu'alaikum Warahmatullahi Wabarakatuh.
*Panitia SPMB MIS Nur Aziz*`;
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
    LAINNYA: 'Lainnya / Permintaan Orang Tua',
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
