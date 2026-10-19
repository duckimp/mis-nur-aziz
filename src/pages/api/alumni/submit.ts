import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { AlumniSubmitSchema, checkRateLimit } from '../../../lib/alumni';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Rate Limiting Protection (Anti-Spam / DoS)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('cf-connecting-ip') ||
                     'unknown';

    if (!checkRateLimit(clientIp, 10, 5 * 60 * 1000)) {
      return new Response(
        JSON.stringify({ error: 'Terlalu banyak permintaan pengisian. Silakan tunggu beberapa menit.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse & Validasi Input secara Ketat dengan Zod + Sanitasi XSS
    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
      return new Response(
        JSON.stringify({ error: 'Payload data tidak valid.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const parseResult = AlumniSubmitSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Data yang dimasukkan tidak valid.';
      return new Response(
        JSON.stringify({ error: firstError }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validatedData = parseResult.data;

    // 3. Supabase Auth Client
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

    // 4. Force status_verifikasi = 'pending' (Mencegah Privilege Escalation)
    const insertPayload = {
      nama_lengkap: validatedData.nama_lengkap,
      nisn: validatedData.nisn,
      tahun_lulus: validatedData.tahun_lulus,
      jenis_kelamin: validatedData.jenis_kelamin,
      nomor_wa: validatedData.nomor_wa,
      tipe_sekolah_lanjutan: validatedData.tipe_sekolah_lanjutan,
      nama_sekolah_lanjutan: validatedData.nama_sekolah_lanjutan,
      kabupaten_kota: validatedData.kabupaten_kota,
      jalur_masuk: validatedData.jalur_masuk || 'Reguler',
      kategori_prestasi: validatedData.kategori_prestasi,
      rincian_prestasi: validatedData.rincian_prestasi,
      kesan_pesan: validatedData.kesan_pesan,
      status_verifikasi: 'pending',
    };

    const { data, error } = await supabase
      .from('alumni_tracer')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Error insert alumni_tracer:', error);
      return new Response(
        JSON.stringify({ error: 'Gagal menyimpan data alumni: ' + error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Data alumni berhasil dikirim dan sedang menunggu verifikasi madrasah.',
        data,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Submit API error:', err);
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan server: ' + (err.message || 'Unknown error') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
