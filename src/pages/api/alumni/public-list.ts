import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { sanitizeSearchQuery } from '../../../lib/alumni';

export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    const rawTahun = url.searchParams.get('tahun');
    const rawTipe = url.searchParams.get('tipe');
    const rawQ = url.searchParams.get('q');

    const cleanQ = sanitizeSearchQuery(rawQ);

    const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
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

    // Query hanya yang statusnya 'disetujui'
    let query = supabase
      .from('alumni_tracer')
      .select('id, nama_lengkap, tahun_lulus, jenis_kelamin, tipe_sekolah_lanjutan, nama_sekolah_lanjutan, kabupaten_kota, jalur_masuk, kategori_prestasi, rincian_prestasi, kesan_pesan, created_at')
      .eq('status_verifikasi', 'disetujui')
      .order('tahun_lulus', { ascending: false })
      .order('nama_lengkap', { ascending: true });

    if (rawTahun && rawTahun !== 'all') {
      const yearInt = parseInt(rawTahun, 10);
      if (!isNaN(yearInt)) {
        query = query.eq('tahun_lulus', yearInt);
      }
    }

    if (rawTipe && rawTipe !== 'all') {
      if (rawTipe === 'mts') {
        query = query.in('tipe_sekolah_lanjutan', ['mts_negeri', 'mts_swasta']);
      } else if (rawTipe === 'smp') {
        query = query.in('tipe_sekolah_lanjutan', ['smp_negeri', 'smp_swasta']);
      } else {
        const allowedTypes = ['pesantren', 'lainnya', 'mts_negeri', 'mts_swasta', 'smp_negeri', 'smp_swasta'];
        if (allowedTypes.includes(rawTipe)) {
          query = query.eq('tipe_sekolah_lanjutan', rawTipe);
        }
      }
    }

    // Sanitasi pencarian: bebas dari PostgREST syntax injection
    if (cleanQ) {
      query = query.or(`nama_lengkap.ilike.%${cleanQ}%,nama_sekolah_lanjutan.ilike.%${cleanQ}%,kabupaten_kota.ilike.%${cleanQ}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetch public alumni:', error);
      return new Response(
        JSON.stringify({ error: 'Gagal memuat data.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hitung statistik keseluruhan alumni disetujui
    const { data: allApproved } = await supabase
      .from('alumni_tracer')
      .select('tahun_lulus, tipe_sekolah_lanjutan')
      .eq('status_verifikasi', 'disetujui');

    const totalApproved = allApproved?.length || 0;
    const stats = {
      total: totalApproved,
      mts: allApproved?.filter(r => r.tipe_sekolah_lanjutan.startsWith('mts')).length || 0,
      smp: allApproved?.filter(r => r.tipe_sekolah_lanjutan.startsWith('smp')).length || 0,
      pesantren: allApproved?.filter(r => r.tipe_sekolah_lanjutan === 'pesantren').length || 0,
      lainnya: allApproved?.filter(r => r.tipe_sekolah_lanjutan === 'lainnya').length || 0,
    };

    const distinctYears = Array.from(
      new Set(allApproved?.map(r => r.tahun_lulus).filter(Boolean))
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
    console.error('Public list API error:', err);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
