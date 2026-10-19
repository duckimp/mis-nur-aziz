import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { sanitizeSearchQuery, AlumniSubmitSchema } from '../../../lib/alumni';

export const GET: APIRoute = async ({ request, cookies, url }) => {
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

  try {
    const status = url.searchParams.get('status');
    const tahun = url.searchParams.get('tahun');
    const rawQ = url.searchParams.get('q');
    const cleanQ = sanitizeSearchQuery(rawQ);

    let query = supabase
      .from('alumni_tracer')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && ['pending', 'disetujui', 'ditolak'].includes(status)) {
      query = query.eq('status_verifikasi', status);
    }

    if (tahun && tahun !== 'all') {
      const yearInt = parseInt(tahun, 10);
      if (!isNaN(yearInt)) {
        query = query.eq('tahun_lulus', yearInt);
      }
    }

    if (cleanQ) {
      query = query.or(`nama_lengkap.ilike.%${cleanQ}%,nama_sekolah_lanjutan.ilike.%${cleanQ}%,nomor_wa.ilike.%${cleanQ}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Hitung counter summary
    const { data: allData, error: allErr } = await supabase
      .from('alumni_tracer')
      .select('status_verifikasi, tipe_sekolah_lanjutan, tahun_lulus');

    if (allErr) throw allErr;

    const stats = {
      total: allData?.length || 0,
      pending: allData?.filter(r => r.status_verifikasi === 'pending').length || 0,
      disetujui: allData?.filter(r => r.status_verifikasi === 'disetujui').length || 0,
      ditolak: allData?.filter(r => r.status_verifikasi === 'ditolak').length || 0,
      mts: allData?.filter(r => r.tipe_sekolah_lanjutan?.startsWith('mts')).length || 0,
      smp: allData?.filter(r => r.tipe_sekolah_lanjutan?.startsWith('smp')).length || 0,
      pesantren: allData?.filter(r => r.tipe_sekolah_lanjutan === 'pesantren').length || 0,
    };

    const distinctYears = Array.from(
      new Set(allData?.map(r => r.tahun_lulus).filter(Boolean))
    ).sort((a: any, b: any) => b - a);

    return new Response(
      JSON.stringify({
        success: true,
        data: data || [],
        stats,
        availableYears: distinctYears,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

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

  try {
    const body = await request.json();
    const { action, id, catatan_admin, formData } = body;

    if (action === 'approve') {
      const { data, error } = await supabase
        .from('alumni_tracer')
        .update({ status_verifikasi: 'disetujui', catatan_admin: catatan_admin ? String(catatan_admin).slice(0, 500) : null })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    }

    if (action === 'reject') {
      const { data, error } = await supabase
        .from('alumni_tracer')
        .update({ status_verifikasi: 'ditolak', catatan_admin: catatan_admin ? String(catatan_admin).slice(0, 500) : null })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    }

    if (action === 'delete') {
      const { error } = await supabase
        .from('alumni_tracer')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === 'manual_create') {
      const parseResult = AlumniSubmitSchema.safeParse(formData);
      if (!parseResult.success) {
        return new Response(
          JSON.stringify({ error: parseResult.error.errors[0]?.message || 'Data tidak valid' }),
          { status: 400 }
        );
      }
      const valid = parseResult.data;
      const insertPayload = {
        ...valid,
        status_verifikasi: formData.status_verifikasi === 'pending' ? 'pending' : 'disetujui',
        catatan_admin: formData.catatan_admin ? String(formData.catatan_admin).slice(0, 500) : null,
      };
      const { data, error } = await supabase
        .from('alumni_tracer')
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    }

    if (action === 'manual_update') {
      const parseResult = AlumniSubmitSchema.safeParse(formData);
      if (!parseResult.success) {
        return new Response(
          JSON.stringify({ error: parseResult.error.errors[0]?.message || 'Data tidak valid' }),
          { status: 400 }
        );
      }
      const valid = parseResult.data;
      const updatePayload = {
        ...valid,
        status_verifikasi: formData.status_verifikasi || 'pending',
        catatan_admin: formData.catatan_admin ? String(formData.catatan_admin).slice(0, 500) : null,
      };
      const { data, error } = await supabase
        .from('alumni_tracer')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Aksi tidak dikenali' }), { status: 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
