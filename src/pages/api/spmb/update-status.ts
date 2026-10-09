import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

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

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { id, status, catatan_admin, alasan_batal } = await request.json();
  if (!id || !status) {
    return new Response(JSON.stringify({ error: 'ID dan status diperlukan.' }), { status: 400 });
  }

  const validStatuses = ['PENDING', 'DITERIMA', 'DITOLAK', 'BATAL'];
  if (!validStatuses.includes(status)) {
    return new Response(JSON.stringify({ error: 'Status tidak valid.' }), { status: 400 });
  }

  const updateData: any = { status };
  if (catatan_admin !== undefined) updateData.catatan_admin = catatan_admin;
  if (status === 'BATAL' && alasan_batal) updateData.alasan_batal = alasan_batal;

  const { data, error } = await supabase
    .from('spmb_pendaftar')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ success: true, data }), { status: 200 });
};
