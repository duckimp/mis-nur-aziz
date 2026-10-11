import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { sendPushNotification } from '../../../lib/onesignal-server';

export const POST: APIRoute = async ({ request, cookies }) => {
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

  // Kirim Push Notification otomatis jika status DITERIMA / DITOLAK
  if (data && (status === 'DITERIMA' || status === 'DITOLAK')) {
    const isLulus = status === 'DITERIMA';
    const heading = isLulus
      ? '🎉 SELAMAT! Pendaftaran Diterima'
      : '📢 Info Seleksi SPMB MIS Nur Aziz';

    let message = '';
    if (isLulus) {
      message = `Selamat! Calon siswa ${data.nama_lengkap} (${data.registration_id}) dinyatakan DITERIMA di MIS Nur Aziz.`;
    } else {
      message = data.catatan_admin
        ? `Status pendaftaran an. ${data.nama_lengkap} (${data.registration_id}) belum dapat diterima. Catatan: ${data.catatan_admin}`
        : `Pemberitahuan status seleksi pendaftaran an. ${data.nama_lengkap} (${data.registration_id}) telah diperbarui.`;
    }

    // Kirim notifikasi tertarget berdasarkan external_id & tag spmb_id
    await sendPushNotification({
      headings: heading,
      contents: message,
      url: `https://mis-nur-aziz.vercel.app/spmb/cek-status?id=${data.registration_id}`,
      tagKey: 'spmb_id',
      tagValue: data.registration_id,
    });
  }

  return new Response(JSON.stringify({ success: true, data }), { status: 200 });
};
