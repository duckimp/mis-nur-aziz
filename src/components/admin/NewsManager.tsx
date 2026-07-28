import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const NewsManager = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setNews(data);
    setLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = '';
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `news/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('news').insert([
        {
          title,
          description,
          date,
          image_url: imageUrl,
          author: user?.email,
        },
      ]);

      if (error) throw error;

      setTitle('');
      setDescription('');
      setDate('');
      setImage(null);
      fetchNews();
      alert('Berita berhasil disimpan!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Input Berita Baru</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Judul Berita</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Berita</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 outline-none h-32"
              required
            ></textarea>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Foto (WebP)</label>
            <input
              type="file"
              accept="image/webp"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full"
              required
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Menyimpan...' : 'Simpan Berita'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Riwayat Berita</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-3 px-4">Judul</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Input Oleh</th>
                <th className="py-3 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-4">Memuat...</td></tr>
              ) : news.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-4">Belum ada berita.</td></tr>
              ) : (
                news.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{item.title}</td>
                    <td className="py-3 px-4">{item.date}</td>
                    <td className="py-3 px-4">{item.author}</td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={async () => {
                          if(confirm('Hapus berita ini?')) {
                            await supabase.from('news').delete().eq('id', item.id);
                            fetchNews();
                          }
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
