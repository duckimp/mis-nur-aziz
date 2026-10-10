import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

export const DELETE: APIRoute = async ({ request, cookies }) => {
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

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  // Baca id dari JSON body (sesuai cara frontend mengirimnya)
  let id: string | undefined;
  let tahunAjaran: string | undefined;
  let regId: string | undefined;

  try {
    const body = await request.json();
    id = body?.id;
    tahunAjaran = body?.tahun_ajaran;
    regId = body?.registration_id;
  } catch {
    return new Response(JSON.stringify({ error: 'Request body tidak valid.' }), { status: 400 });
  }

  if (!id) return new Response(JSON.stringify({ error: 'ID diperlukan.' }), { status: 400 });

  // Hapus berkas dari storage jika ada
  if (tahunAjaran && regId) {
    const folder = `${tahunAjaran.replace('/', '-')}/${regId}/`;
    const { data: files } = await supabase.storage.from('berkas-spmb').list(folder);
    if (files && files.length > 0) {
      const paths = files.map((f: any) => `${folder}${f.name}`);
      await supabase.storage.from('berkas-spmb').remove(paths);
    }
  }

  // Hard delete dari DB
  const { error } = await supabase.from('spmb_pendaftar').delete().eq('id', id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
