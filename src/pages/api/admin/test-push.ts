import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { sendPushNotification } from '../../../lib/onesignal-server';

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

  const body = await request.json().catch(() => ({}));
  const targetTag = body.tagValue; // optional specific registration ID

  const result = await sendPushNotification({
    headings: '🔔 Test Notifikasi MIS Nur Aziz',
    contents: 'Notifikasi berhasil terhubung ke perangkat Android Anda! Terima kasih telah mengaktifkan notifikasi.',
    url: 'https://mis-nur-aziz.vercel.app/spmb',
    tagKey: targetTag ? 'spmb_id' : undefined,
    tagValue: targetTag || undefined,
    sendToAll: !targetTag,
  });

  return new Response(JSON.stringify(result), { status: result.success ? 200 : 500 });
};
