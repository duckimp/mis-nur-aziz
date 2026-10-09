import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const regId = url.searchParams.get('id');
  if (!regId) {
    return new Response(JSON.stringify({ error: 'ID Registrasi diperlukan.' }), { status: 400 });
  }

  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
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

  const { data, error } = await supabase
    .from('spmb_pendaftar')
    .select('id, registration_id, nama_lengkap, tempat_lahir, tanggal_lahir, status, alasan_batal, catatan_admin, tahun_ajaran, created_at')
    .eq('registration_id', regId.toUpperCase())
    .single();

  if (error || !data) {
    return new Response(
      JSON.stringify({ error: 'ID Registrasi tidak ditemukan.' }),
      { status: 404 }
    );
  }

  return new Response(JSON.stringify(data), { status: 200 });
};
