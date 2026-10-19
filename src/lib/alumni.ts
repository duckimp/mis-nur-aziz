import { z } from 'zod';

// ============================================================
// Security Helpers: Sanitasi & Anti-Injection
// ============================================================

/**
 * Menghapus tag HTML dan script untuk mencegah XSS tersimpan
 */
export function sanitizeText(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]*>?/gm, '') // Hapus tag HTML
    .replace(/[\u0000-\u001F\u007F]/g, '') // Hapus control characters
    .trim();
}

/**
 * Membersihkan parameter search agar kebal terhadap PostgREST filter injection
 * Mencegah karakter seperti: ( ) , " ' % . ;
 */
export function sanitizeSearchQuery(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Hanya izinkan alfanumerik, spasi, dan dash
    .trim()
    .slice(0, 50); // Maksimal 50 karakter
}

/**
 * Membersihkan nomor WA hanya berisi digit angka
 */
export function sanitizePhoneNumber(val: unknown): string {
  if (typeof val !== 'string' && typeof val !== 'number') return '';
  return String(val).replace(/\D/g, '').slice(0, 20);
}

// ============================================================
// Zod Validation Schemas
// ============================================================

const currentYear = new Date().getFullYear();

export const AlumniSubmitSchema = z.object({
  nama_lengkap: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter')),

  nisn: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val ? sanitizeText(val).replace(/\D/g, '') : null))
    .pipe(z.string().max(20, 'NISN maksimal 20 digit').nullable()),

  tahun_lulus: z.coerce
    .number()
    .int('Tahun kelulusan harus berupa bilangan bulat')
    .min(1980, 'Tahun kelulusan tidak valid')
    .max(2099, 'Tahun kelulusan tidak valid'),

  jenis_kelamin: z.enum(['L', 'P'], {
    errorMap: () => ({ message: 'Pilihan jenis kelamin harus L atau P' }),
  }),

  nomor_wa: z
    .string()
    .transform(sanitizePhoneNumber)
    .pipe(z.string().min(8, 'Nomor WhatsApp minimal 8 digit').max(20, 'Nomor WhatsApp maksimal 20 digit')),

  tipe_sekolah_lanjutan: z.enum([
    'mts_negeri',
    'mts_swasta',
    'smp_negeri',
    'smp_swasta',
    'pesantren',
    'lainnya',
  ], {
    errorMap: () => ({ message: 'Kategori sekolah lanjutan tidak valid' }),
  }),

  nama_sekolah_lanjutan: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(2, 'Nama sekolah lanjutan minimal 2 karakter').max(150, 'Nama sekolah maksimal 150 karakter')),

  kabupaten_kota: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(2, 'Kota lokasi minimal 2 karakter').max(100, 'Kota lokasi maksimal 100 karakter')),

  jalur_masuk: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val ? sanitizeText(val) : 'Reguler'))
    .pipe(z.string().max(50)),

  kategori_prestasi: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val ? sanitizeText(val) : null))
    .pipe(z.string().max(100).nullable()),

  rincian_prestasi: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val ? sanitizeText(val) : null))
    .pipe(z.string().max(500, 'Rincian prestasi maksimal 500 karakter').nullable()),

  kesan_pesan: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val ? sanitizeText(val) : null))
    .pipe(z.string().max(1000, 'Kesan & pesan maksimal 1000 karakter').nullable()),
});

export const AlumniLookupSchema = z.object({
  tahun_lulus: z.coerce.number().int().min(1980).max(2099),
  nama_atau_nisn: z.string().transform(sanitizeText).pipe(z.string().min(2).max(100)),
  nomor_wa: z.string().transform(sanitizePhoneNumber).pipe(z.string().min(8).max(20)),
});

export const AlumniUpdateSchema = AlumniSubmitSchema.extend({
  id: z.string().uuid('ID data tidak valid'),
  current_wa: z.string().transform(sanitizePhoneNumber).pipe(z.string().min(8).max(20)),
});

// ============================================================
// Simple Anti-Spam / Rate Limiter (In-Memory sliding window)
// ============================================================
const requestCounts = new Map<string, { count: number; firstReqTime: number }>();

export function checkRateLimit(clientIp: string, maxRequests = 10, windowMs = 5 * 60 * 1000): boolean {
  if (!clientIp || clientIp === 'unknown') return true;

  const now = Date.now();
  const record = requestCounts.get(clientIp);

  if (!record) {
    requestCounts.set(clientIp, { count: 1, firstReqTime: now });
    return true;
  }

  if (now - record.firstReqTime > windowMs) {
    // Reset window
    requestCounts.set(clientIp, { count: 1, firstReqTime: now });
    return true;
  }

  record.count += 1;
  return record.count <= maxRequests;
}
