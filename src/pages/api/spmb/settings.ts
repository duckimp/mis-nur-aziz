import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

function getSupabase(request: Request, cookies: any) {
  return createServerClient(
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
}

// GET: ambil settings SPMB (public)
export const GET: APIRoute = async ({ request, cookies }) => {
  const supabase = getSupabase(request, cookies);
  const { data, error } = await supabase.from('spmb_settings').select('*').eq('id', 1).single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
};

// POST: update settings (admin only)
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = getSupabase(request, cookies);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body = await request.json();
  const { is_open, tahun_ajaran, kuota } = body;

  const { data, error } = await supabase
    .from('spmb_settings')
    .update({ is_open, tahun_ajaran, kuota: kuota || null })
    .eq('id', 1)
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
};
