import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase';

export const GET: APIRoute = async () => {
  const siteUrl = 'https://mis-nur-aziz.vercel.app';

  // Halaman Statis
  const staticPages = [
    '',
    '/profil',
    '/akademik',
    '/guru',
    '/berita',
    '/galeri',
    '/ppdb',
    '/kontak',
  ];

  // Fetch berita dinamis dari Supabase
  let newsUrls: string[] = [];
  try {
    const { data: news } = await supabase
      .from('news')
      .select('slug, id, updated_at, date')
      .order('date', { ascending: false });

    if (news) {
      newsUrls = news.map(item => `/berita/${item.slug || item.id}`);
    }
  } catch (error) {
    console.error('Error fetching news for sitemap:', error);
  }

  const currentDate = new Date().toISOString();

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Static Pages -->
  ${staticPages
    .map(
      page => `
  <url>
    <loc>${siteUrl}${page}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`
    )
    .join('')}

  <!-- Dynamic News Pages -->
  ${newsUrls
    .map(
      url => `
  <url>
    <loc>${siteUrl}${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('')}

</urlset>`.trim();

  return new Response(sitemapXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};