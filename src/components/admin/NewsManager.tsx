import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export const NewsManager = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState("guru");

  useEffect(() => {
    fetchUserRole();
    fetchNews();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile) {
          setUserRole(profile.role || "guru");
        }
      }
    } catch (e) {}
  };

  const fetchNews = async () => {
    const { data } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setNews(data);
    setLoading(false);
  };

  const toSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title || "");
    setSlug(item.slug || "");
    setDescription(item.description || "");
    setDate(item.date || "");
    setCurrentImageUrl(item.image_url || "");
    setImage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setDate("");
    setImage(null);
    setCurrentImageUrl("");
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalImageUrl = currentImageUrl;
      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `news/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);
        
        finalImageUrl = publicUrl;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const finalSlug = slug || toSlug(title);

      if (editingId) {
        const { error } = await supabase
          .from("news")
          .update({
            title,
            slug: finalSlug,
            description,
            date,
            image_url: finalImageUrl,
          })
          .eq("id", editingId);

        if (error) throw error;
        alert("Berita berhasil diperbarui!");
        cancelEdit();
      } else {
        const { error } = await supabase.from("news").insert([
          {
            title,
            slug: finalSlug,
            description,
            date,
            image_url: finalImageUrl,
            author: user?.email,
          },
        ]);

        if (error) throw error;
        alert("Berita berhasil disimpan!");
        cancelEdit();
      }

      fetchNews();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {editingId ? "Edit Berita" : "Input Berita Baru"}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
            >
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Judul Berita</label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editingId) setSlug(toSlug(e.target.value));
                }}
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
            <label className="text-sm font-medium">Slug URL</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
              placeholder="otomatis-dari-judul"
            />
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
            <label className="text-sm font-medium">
              Foto Sampul {editingId && <span className="text-gray-500 font-normal">(Kosongkan jika tidak ingin mengganti)</span>}
            </label>
            {editingId && currentImageUrl && (
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded border mb-2">
                <img src={currentImageUrl} alt="Sampul" className="w-12 h-12 object-cover rounded" />
                <span className="text-xs text-gray-500">Foto sampul saat ini. Pilih file baru hanya jika ingin menggantinya.</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full"
              required={!editingId && !currentImageUrl}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {uploading ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Berita"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Batal
              </button>
            )}
          </div>
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
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{item.title}</div>
                      {item.slug && <span className="text-xs text-green-600">/berita/{item.slug}</span>}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.date}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.author}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => startEdit(item)}
                          className="text-green-600 hover:underline font-medium text-sm"
                        >
                          Edit
                        </button>
                        {userRole === "admin" && (
                          <button 
                            onClick={async () => {
                              if(confirm(`Hapus berita "${item.title}"?`)) {
                                await supabase.from("news").delete().eq("id", item.id);
                                if (editingId === item.id) cancelEdit();
                                fetchNews();
                              }
                            }}
                            className="text-red-600 hover:underline font-medium text-sm"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
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
