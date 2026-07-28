import React, { useState, useEffect } from 'react';
import {
  Pencil, Save, ClipboardList, Trash2,
  Image, Upload, LayoutGrid, Inbox,
  Loader2, UserPlus, Plus, Users,
  Calendar, FileText, Tag, Paperclip,
  AlertCircle, Download,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ─── Shared Styles ───────────────────────────────────────────────────────────
const S = {
  page: { display: 'flex', flexDirection: 'column' as const, gap: '1.5rem' },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9',
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #f1f5f9',
  },
  formGroup: { display: 'flex', flexDirection: 'column' as const, gap: '0.375rem', marginBottom: '1rem' },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#374151',
    letterSpacing: '0.02em',
  },
  input: {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '0.875rem',
    color: '#1e293b',
    background: '#fafafa',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '0.875rem',
    color: '#1e293b',
    background: '#fafafa',
    outline: 'none',
    resize: 'vertical' as const,
    minHeight: '120px',
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.6,
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '0.875rem',
    color: '#1e293b',
    background: '#fafafa',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box' as const,
  },
  fileInput: {
    width: '100%',
    padding: '0.5rem 0',
    fontSize: '0.875rem',
    color: '#475569',
    cursor: 'pointer',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1.25rem',
    background: 'linear-gradient(135deg, #059669, #047857)',
    color: '#ffffff',
    borderRadius: '10px',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.15s, transform 0.15s',
    fontFamily: "'Inter', sans-serif",
  },
  btnDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    background: '#fef2f2',
    color: '#dc2626',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s',
    fontFamily: "'Inter', sans-serif",
  },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  thead: { background: '#f8fafc' },
  th: {
    padding: '0.75rem 1rem',
    textAlign: 'left' as const,
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '0.875rem 1rem',
    fontSize: '0.875rem',
    color: '#374151',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle' as const,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '2.5rem 1rem',
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.2rem 0.6rem',
    background: '#dcfce7',
    color: '#16a34a',
    borderRadius: '20px',
    fontSize: '0.72rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  overflowX: { overflowX: 'auto' as const },
  spinnerWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '2rem',
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
};

// ─── Spinner Component ────────────────────────────────────────────────────────
const Spinner = ({ text = 'Memuat...' }: { text?: string }) => (
  <div style={S.spinnerWrap}>
    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
    <span>{text}</span>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── NewsManager ──────────────────────────────────────────────────────────────
export const NewsManager = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState<string>('guru');

  useEffect(() => {
    fetchUserRole();
    fetchNews();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) {
          setUserRole(profile.role || 'guru');
        }
      }
    } catch (e) {}
  };

  const fetchNews = async () => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
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
        const filePath = `news/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, image);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('news').insert([{ title, description, date, image_url: imageUrl, author: user?.email }]);
      if (error) throw error;
      setTitle(''); setDescription(''); setDate(''); setImage(null);
      fetchNews();
      alert('Berita berhasil disimpan!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={S.page}>
      {/* Form */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>
          <Pencil size={18} color="#059669" />
          Input Berita Baru
        </h3>
        <form onSubmit={handleUpload}>
          <div className="admin-grid-2">
            <div style={S.formGroup}>
              <label style={S.label}>
                <FileText size={13} color="#6b7280" />
                Judul Berita
              </label>
              <input className="admin-input" style={S.input} type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Masukkan judul berita..." required />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>
                <Calendar size={13} color="#6b7280" />
                Tanggal Berita
              </label>
              <input className="admin-input" style={S.input} type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>
              <FileText size={13} color="#6b7280" />
              Deskripsi
            </label>
            <textarea className="admin-textarea" style={S.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Tulis ringkasan berita..." required />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>
              <Paperclip size={13} color="#6b7280" />
              Foto Sampul (WebP)
            </label>
            <input style={S.fileInput} type="file" accept="image/webp" onChange={e => setImage(e.target.files?.[0] || null)} required />
          </div>
          <button type="submit" disabled={uploading} style={{ ...S.btnPrimary, opacity: uploading ? 0.6 : 1 }} className="admin-btn">
            {uploading
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</>
              : <><Save size={15} /> Simpan Berita</>
            }
          </button>
        </form>
      </div>

      {/* Table */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>
          <ClipboardList size={18} color="#059669" />
          Riwayat Berita
        </h3>
        <div style={S.overflowX}>
          <table className="admin-table">
            <thead style={S.thead}>
              <tr>
                <th style={S.th}>Judul</th>
                <th style={S.th}>Tanggal</th>
                <th style={S.th}>Input Oleh</th>
                <th style={S.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4}><Spinner /></td></tr>
              ) : news.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div style={S.emptyState}>
                      <Inbox size={32} strokeWidth={1.5} />
                      <span>Belum ada berita.</span>
                    </div>
                  </td>
                </tr>
              ) : news.map(item => (
                <tr key={item.id}>
                  <td style={S.td} data-label="Judul">{item.title}</td>
                  <td style={S.td} data-label="Tanggal">{item.date}</td>
                  <td style={S.td} data-label="Input Oleh"><span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.author}</span></td>
                  <td style={S.td} data-label="Aksi">
                    {userRole === 'admin' ? (
                      <button style={S.btnDanger} onClick={async () => {
                        if (confirm('Hapus berita ini?')) {
                          await supabase.from('news').delete().eq('id', item.id);
                          fetchNews();
                        }
                      }} className="admin-btn-action">
                        <Trash2 size={13} /> Hapus
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No Access</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── GalleryManager ───────────────────────────────────────────────────────────
export const GalleryManager = () => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState<string>('guru');

  const categories = ['KBM', 'Eskul', 'Wisuda', 'Lainnya'];

  useEffect(() => {
    fetchUserRole();
    fetchImages();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) {
          setUserRole(profile.role || 'guru');
        }
      }
    } catch (e) {}
  };

  const fetchImages = async () => {
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    if (data) setImages(data);
    setLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !image) return alert('Pilih kategori dan foto!');
    setUploading(true);
    try {
      const fileExt = image.name.split('.').pop();
      const filePath = `gallery/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, image);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
      const { error } = await supabase.from('gallery').insert([{ category, image_url: publicUrl }]);
      if (error) throw error;
      setCategory(''); setImage(null);
      fetchImages();
      alert('Foto berhasil diupload!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={S.page}>
      {/* Upload Form */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>
          <Upload size={18} color="#059669" />
          Upload Foto Galeri
        </h3>
        <form onSubmit={handleUpload}>
          <div style={S.formGroup}>
            <label style={S.label}>
              <Tag size={13} color="#6b7280" />
              Kategori Foto
            </label>
            <select className="admin-select" style={S.select} value={category} onChange={e => setCategory(e.target.value)} required>
              <option value="">— Pilih Kategori —</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>
              <Paperclip size={13} color="#6b7280" />
              File Foto (WebP)
            </label>
            <input style={S.fileInput} type="file" accept="image/webp" onChange={e => setImage(e.target.files?.[0] || null)} required />
          </div>
          <button type="submit" disabled={uploading} style={{ ...S.btnPrimary, opacity: uploading ? 0.6 : 1 }} className="admin-btn">
            {uploading
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Mengupload...</>
              : <><Upload size={15} /> Simpan / Deploy</>
            }
          </button>
        </form>
      </div>

      {/* Gallery Grid */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>
          <LayoutGrid size={18} color="#059669" />
          Koleksi Galeri
        </h3>
        {loading ? (
          <Spinner text="Memuat foto..." />
        ) : images.length === 0 ? (
          <div style={S.emptyState}>
            <Image size={36} strokeWidth={1.5} />
            <span>Belum ada foto.</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
            {images.map(img => (
              <div key={img.id} className="gallery-thumb" style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1', background: '#f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <img src={img.image_url} alt={img.category} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div className="gallery-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0.625rem' }}>
                  <span style={{ color: 'white', fontSize: '0.72rem', fontWeight: 600, marginBottom: userRole === 'admin' ? '0.375rem' : '0' }}>{img.category}</span>
                  {userRole === 'admin' ? (
                    <button
                      onClick={async () => {
                        if (confirm('Hapus foto ini?')) {
                          await supabase.from('gallery').delete().eq('id', img.id);
                          fetchImages();
                        }
                      }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', padding: '0.3rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', width: '100%', fontFamily: "'Inter', sans-serif" }}
                    >
                      <Trash2 size={11} /> Hapus
                    </button>
                  ) : (
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.65rem', fontStyle: 'italic', background: 'rgba(0,0,0,0.3)', padding: '0.2rem', borderRadius: '4px', textAlign: 'center' }}>Admin Only to Delete</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .gallery-thumb .gallery-overlay { opacity: 0; transition: opacity 0.2s ease; }
        .gallery-thumb:hover .gallery-overlay { opacity: 1; }
      `}</style>
    </div>
  );
};

// ─── UserManager ──────────────────────────────────────────────────────────────
export const UserManager = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) setProfiles(data);
    setFetching(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      await supabase.from('profiles').insert([{ id: data.user?.id, email, role: 'admin' }]);
      alert('User berhasil didaftarkan! Cek email untuk konfirmasi.');
      setEmail(''); setPassword('');
      fetchProfiles();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Hapus akses user ini dari sistem?')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      fetchProfiles();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div style={S.page}>
      {/* Form */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>
          <UserPlus size={18} color="#059669" />
          Tambah Admin Baru
        </h3>
        <form onSubmit={handleAddUser} style={{ maxWidth: '440px' }}>
          <div style={S.formGroup}>
            <label style={S.label}>
              <FileText size={13} color="#6b7280" />
              Email Admin
            </label>
            <input className="admin-input" style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@sekolah.com" required />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>
              <AlertCircle size={13} color="#6b7280" />
              Password Sementara
            </label>
            <input className="admin-input" style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimal 6 karakter" required />
          </div>
          <button type="submit" disabled={loading} style={{ ...S.btnPrimary, opacity: loading ? 0.6 : 1 }} className="admin-btn">
            {loading
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Mendaftarkan...</>
              : <><Plus size={15} /> Daftarkan Admin</>
            }
          </button>
        </form>
      </div>

      {/* Table */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>
          <Users size={18} color="#059669" />
          Daftar Admin / User
        </h3>
        <div style={S.overflowX}>
          <table className="admin-table">
            <thead style={S.thead}>
              <tr>
                <th style={S.th}>Email</th>
                <th style={S.th}>Role</th>
                <th style={S.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {fetching ? (
                <tr><td colSpan={3}><Spinner /></td></tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div style={S.emptyState}>
                      <Inbox size={32} strokeWidth={1.5} />
                      <span>Belum ada data user.</span>
                    </div>
                  </td>
                </tr>
              ) : profiles.map(user => (
                <tr key={user.id}>
                  <td style={S.td} data-label="Email">{user.email || user.id}</td>
                  <td style={S.td} data-label="Role"><span style={S.badge}>{user.role || 'Admin'}</span></td>
                  <td style={S.td} data-label="Aksi">
                    <button style={S.btnDanger} onClick={() => handleDeleteUser(user.id)} className="admin-btn-action">
                      <Trash2 size={13} /> Hapus Akses
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <AlertCircle size={12} />
          Menghapus di sini hanya menghapus dari tabel profiles. Untuk hapus akun permanen, gunakan Dashboard Supabase.
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .admin-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        @media (max-width: 768px) {
          .admin-grid-2 {
            grid-template-columns: 1fr !important;
          }

          /* Prevent auto-zooming inputs on mobile and scale fonts up */
          .admin-input, .admin-select, .admin-textarea, input, textarea, select {
            font-size: 16px !important;
            padding: 0.75rem 0.875rem !important;
          }

          .admin-btn {
            width: 100%;
            justify-content: center;
            padding: 0.875rem !important;
            font-size: 1rem !important;
          }

          /* Table card layout for mobile screen */
          .admin-table thead {
            display: none !important;
          }
          .admin-table tr {
            display: block;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            margin-bottom: 1rem;
            padding: 0.75rem 1rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          }
          .admin-table td {
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            padding: 0.625rem 0 !important;
            border-bottom: 1px dashed #f1f5f9 !important;
            font-size: 0.875rem !important;
          }
          .admin-table td::before {
            content: attr(data-label);
            font-weight: 700;
            color: #64748b;
            font-size: 0.75rem;
            text-transform: uppercase;
            margin-right: 1rem;
          }
          .admin-table td:last-child {
            border-bottom: none !important;
            justify-content: flex-end;
          }

          .admin-btn-action {
            padding: 0.5rem 0.75rem !important;
            font-size: 0.875rem !important;
          }
        }
      `}</style>
    </div>
  );
};
