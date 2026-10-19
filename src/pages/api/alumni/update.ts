import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { AlumniUpdateSchema } from '../../../lib/alumni';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
      return new Response(
        JSON.stringify({ error: 'Payload tidak valid.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const parseResult = AlumniUpdateSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Data yang dimasukkan tidak valid.';
      return new Response(
        JSON.stringify({ error: firstError }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validatedData = parseResult.data;

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

    // 1. Ambil data saat ini untuk verifikasi kepemilikan keamanan
    const { data: existing, error: fetchErr } = await supabase
      .from('alumni_tracer')
      .select('id, nomor_wa')
      .eq('id', validatedData.id)
      .single();

    if (fetchErr || !existing) {
      return new Response(
        JSON.stringify({ error: 'Data alumni tidak ditemukan.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verifikasi kecocokan nomor WA lama
    const existingCleanWa = String(existing.nomor_wa || '').replace(/\D/g, '');
    const searchTail = validatedData.current_wa.slice(-8);
    if (!existingCleanWa.endsWith(searchTail) && !validatedData.current_wa.endsWith(existingCleanWa.slice(-8))) {
      return new Response(
        JSON.stringify({ error: 'Verifikasi keamanan gagal: Nomor WhatsApp tidak cocok dengan data awal.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Lakukan Update dengan data yang sudah disanitasi & di-reset ke pending
    const updatePayload = {
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
      status_verifikasi: 'pending', // Reset ke pending
    };

    const { data: updated, error: updateErr } = await supabase
      .from('alumni_tracer')
      .update(updatePayload)
      .eq('id', validatedData.id)
      .select()
      .single();

    if (updateErr) {
      console.error('Error update alumni_tracer:', updateErr);
      return new Response(
        JSON.stringify({ error: 'Gagal memperbarui data: ' + updateErr.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Data alumni berhasil diperbarui! Perubahan sedang menunggu peninjauan kembali oleh pihak madrasah.',
        data: updated,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Update API error:', err);
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan server: ' + (err.message || 'Unknown error') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
