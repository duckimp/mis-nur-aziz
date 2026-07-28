import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const GalleryManager = () => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const categories = ['KBM', 'Eskul', 'Wisuda', 'Lainnya'];

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setImages(data);
    setLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !image) return alert('Pilih kategori dan foto!');
    
    setUploading(true);

    try {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      const { error } = await supabase.from('gallery').insert([
        {
          category,
          image_url: publicUrl,
        },
      ]);

      if (error) throw error;

      setCategory('');
      setImage(null);
      fetchImages();
      alert('Foto berhasil diupload!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Upload Foto Galeri</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 outline-none"
              required
            >
              <option value="">Pilih Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Foto (.webp)</label>
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
            {uploading ? 'Menyimpan...' : 'Simpan/Deploy'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Koleksi Galeri</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            <p className="col-span-full text-center py-4">Memuat...</p>
          ) : images.length === 0 ? (
            <p className="col-span-full text-center py-4">Belum ada foto.</p>
          ) : (
            images.map((img) => (
              <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={img.image_url} alt={img.category} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                  <span className="text-white text-xs font-medium mb-2">{img.category}</span>
                  <button
                    onClick={async () => {
                      if(confirm('Hapus foto ini?')) {
                        await supabase.from('gallery').delete().eq('id', img.id);
                        fetchImages();
                      }
                    }}
                    className="bg-red-600 text-white text-xs px-2 py-1 rounded"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
