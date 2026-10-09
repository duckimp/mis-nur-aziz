import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

export const GET: APIRoute = async ({ request, cookies, url }) => {
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

  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');
  const tahun = url.searchParams.get('tahun_ajaran');

  let query = supabase.from('spmb_pendaftar').select('*').order('created_at', { ascending: false });

  if (status && status !== 'ALL') query = query.eq('status', status);
  if (tahun) query = query.eq('tahun_ajaran', tahun);
  if (search) query = query.or(`nama_lengkap.ilike.%${search}%,registration_id.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
};
