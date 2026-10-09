import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { BatalSchema } from '../../../lib/spmb';

export const POST: APIRoute = async ({ request, cookies }) => {
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

  const body = await request.json();
  const parsed = BatalSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Data tidak valid.' }), { status: 400 });
  }

  const { registration_id, alasan_batal, catatan_batal } = parsed.data;

  // Cek pendaftar exists & status bukan BATAL
  const { data: existing } = await supabase
    .from('spmb_pendaftar')
    .select('id, status')
    .eq('registration_id', registration_id)
    .single();

  if (!existing) {
    return new Response(JSON.stringify({ error: 'ID tidak ditemukan.' }), { status: 404 });
  }

  if (existing.status === 'BATAL') {
    return new Response(JSON.stringify({ error: 'Pendaftaran sudah dibatalkan sebelumnya.' }), { status: 400 });
  }

  if (existing.status === 'DITERIMA') {
    return new Response(
      JSON.stringify({ error: 'Pendaftaran yang sudah diterima tidak dapat dibatalkan secara mandiri. Hubungi sekolah langsung.' }),
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('spmb_pendaftar')
    .update({ status: 'BATAL', alasan_batal, catatan_batal: catatan_batal || null })
    .eq('registration_id', registration_id);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
