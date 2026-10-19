import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { AlumniLookupSchema, checkRateLimit } from '../../../lib/alumni';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Anti-Brute-Force Rate Limiting (Maks 15 pencarian per 5 menit per IP)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('cf-connecting-ip') ||
                     'unknown';

    if (!checkRateLimit(`lookup_${clientIp}`, 15, 5 * 60 * 1000)) {
      return new Response(
        JSON.stringify({ error: 'Terlalu banyak percobaan pencarian. Silakan coba lagi nanti.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validasi input dengan Zod
    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
      return new Response(
        JSON.stringify({ error: 'Payload tidak valid.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const parseResult = AlumniLookupSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Mohon isi Tahun Lulus, Nama Lengkap / NISN, dan Nomor WhatsApp terdaftar dengan benar.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { tahun_lulus, nama_atau_nisn, nomor_wa } = parseResult.data;
    const searchWaTail = nomor_wa.slice(-8);
    const searchTarget = nama_atau_nisn.toLowerCase();

    const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createServerClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      supabaseKey,
      {
        cookies: {
          getAll() {
            const h = request.headers.get('cookie');
            if (!h) return [];
            return parseCookieHeader(h);
          },
          setAll(list) {
            list.forEach(({ name, value, options }) => cookies.set(name, value, options));
          },
        },
      }
    );

    // Ambil data hanya pada tahun kelulusan tersebut
    const { data: candidates, error } = await supabase
      .from('alumni_tracer')
      .select('*')
      .eq('tahun_lulus', tahun_lulus);

    if (error) {
      console.error('Error lookup alumni:', error);
      return new Response(
        JSON.stringify({ error: 'Gagal mencari data alumni: ' + error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verifikasi kecocokan nomor WA dan identitas
    const match = candidates?.find((row: any) => {
      const rowWaClean = String(row.nomor_wa || '').replace(/\D/g, '');
      const waMatches = rowWaClean.endsWith(searchWaTail) || nomor_wa.endsWith(rowWaClean.slice(-8));

      if (!waMatches) return false;

      const rowNama = String(row.nama_lengkap || '').toLowerCase();
      const rowNisn = String(row.nisn || '').toLowerCase();

      const nameMatches = rowNama.includes(searchTarget) || searchTarget.includes(rowNama);
      const nisnMatches = rowNisn && rowNisn === searchTarget;

      return nameMatches || nisnMatches;
    });

    if (!match) {
      return new Response(
        JSON.stringify({
          error: 'Data alumni tidak ditemukan. Pastikan Tahun Lulus, Nama / NISN, dan Nomor WhatsApp sesuai dengan data yang pernah diisi.'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: match,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Lookup API error:', err);
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan server: ' + (err.message || 'Unknown error') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
