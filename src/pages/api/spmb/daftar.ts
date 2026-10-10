import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { SPMBFormSchema } from '../../../lib/spmb';

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
    // 1. Cek status SPMB (open/closed)
    const { data: settings } = await supabase
      .from('spmb_settings').select('*').eq('id', 1).single();

    if (!settings?.is_open) {
      return new Response(
        JSON.stringify({ error: 'Pendaftaran SPMB sedang ditutup.' }),
        { status: 400 }
      );
    }

    // 2. Cek kuota
    if (settings.kuota) {
      const { count } = await supabase
        .from('spmb_pendaftar')
        .select('*', { count: 'exact', head: true })
        .eq('tahun_ajaran', settings.tahun_ajaran)
        .in('status', ['PENDING', 'DITERIMA']);

      if ((count ?? 0) >= settings.kuota) {
        return new Response(
          JSON.stringify({ error: 'Kuota pendaftaran telah penuh.' }),
          { status: 400 }
        );
      }
    }

    // 3. Parse multipart form data
    const formData = await request.formData();
    const rawData = {
      nama_lengkap: formData.get('nama_lengkap') as string,
      tempat_lahir: formData.get('tempat_lahir') as string,
      tanggal_lahir: formData.get('tanggal_lahir') as string,
      nomor_wa: formData.get('nomor_wa') as string,
    };

    // 4. Validasi Zod
    const parsed = SPMBFormSchema.safeParse(rawData);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Validasi gagal', details: parsed.error.flatten() }),
        { status: 400 }
      );
    }

    const fotoKK = formData.get('foto_kk') as File | null;
    const fotoAkta = formData.get('foto_akta') as File | null;

    if (!fotoKK || !fotoAkta) {
      return new Response(
        JSON.stringify({ error: 'Foto KK dan Akta Kelahiran wajib diupload.' }),
        { status: 400 }
      );
    }

    // 5. Generate Guaranteed Unique Registration ID (Max sequence + safety check)
    const year = settings.tahun_ajaran.split('/')[0];
    const { data: existingRecords } = await supabase
      .from('spmb_pendaftar')
      .select('registration_id');

    let maxSeq = 0;
    const existingSet = new Set<string>();

    if (existingRecords && existingRecords.length > 0) {
      for (const r of existingRecords) {
        if (r.registration_id) {
          existingSet.add(r.registration_id);
          if (r.registration_id.startsWith(`SPMB-${year}-`)) {
            const parts = r.registration_id.split('-');
            const num = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(num) && num > maxSeq) {
              maxSeq = num;
            }
          }
        }
      }
    }

    let nextSeq = maxSeq + 1;
    let registrationId = `SPMB-${year}-${String(nextSeq).padStart(3, '0')}`;

    // Loop pencegah tabrakan nomor ID
    while (existingSet.has(registrationId)) {
      nextSeq++;
      registrationId = `SPMB-${year}-${String(nextSeq).padStart(3, '0')}`;
    }

    // 6. Upload foto KK
    const kkExt = fotoKK.name.split('.').pop() || 'webp';
    const kkPath = `${settings.tahun_ajaran.replace('/', '-')}/${registrationId}/kk.${kkExt}`;
    const { error: kkError } = await supabase.storage
      .from('berkas-spmb')
      .upload(kkPath, fotoKK, { contentType: fotoKK.type, upsert: true });

    if (kkError) throw new Error(`Upload KK gagal: ${kkError.message}`);

    // 7. Upload foto Akta
    const aktaExt = fotoAkta.name.split('.').pop() || 'webp';
    const aktaPath = `${settings.tahun_ajaran.replace('/', '-')}/${registrationId}/akta.${aktaExt}`;
    const { error: aktaError } = await supabase.storage
      .from('berkas-spmb')
      .upload(aktaPath, fotoAkta, { contentType: fotoAkta.type, upsert: true });

    if (aktaError) throw new Error(`Upload Akta gagal: ${aktaError.message}`);

    // 8. Get public URLs
    const { data: kkPublic } = supabase.storage.from('berkas-spmb').getPublicUrl(kkPath);
    const { data: aktaPublic } = supabase.storage.from('berkas-spmb').getPublicUrl(aktaPath);

    // 9. Insert to DB
    const { data: pendaftar, error: insertError } = await supabase
      .from('spmb_pendaftar')
      .insert({
        registration_id: registrationId,
        nama_lengkap: parsed.data.nama_lengkap,
        tempat_lahir: parsed.data.tempat_lahir,
        tanggal_lahir: parsed.data.tanggal_lahir,
        nomor_wa: parsed.data.nomor_wa,
        foto_kk_url: kkPublic.publicUrl,
        foto_akta_url: aktaPublic.publicUrl,
        tahun_ajaran: settings.tahun_ajaran,
        status: 'PENDING',
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    return new Response(
      JSON.stringify({ success: true, registration_id: registrationId, data: pendaftar }),
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[SPMB Daftar]', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Terjadi kesalahan server.' }),
      { status: 500 }
    );
  }
};
