import React, { useState, useEffect } from 'react';
import {
  FileUp, FileText, Trash2, ToggleLeft, ToggleRight,
  Loader2, Inbox, Download, CheckCircle2, XCircle,
  Paperclip, Tag, AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ─── Styles ───────────────────────────────────────────────────────────────────
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
    fontFamily: "'Inter', sans-serif",
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
    fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box' as const,
    cursor: 'pointer',
  },
  fileInput: { width: '100%', padding: '0.5rem 0', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
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
    fontFamily: "'Inter', sans-serif",
  },
  btnDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.625rem',
    background: '#fef2f2',
    color: '#dc2626',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  },
  toggleBtn: (active: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    background: active ? '#dcfce7' : '#f1f5f9',
    color: active ? '#16a34a' : '#64748b',
    borderRadius: '8px',
    border: `1px solid ${active ? '#bbf7d0' : '#e2e8f0'}`,
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s',
  }),
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
  spinner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '2rem',
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
};

interface Doc {
  id: string;
  name: string;
  category: string;
  file_url: string;
  file_size: string;
  is_active: boolean;
  created_at: string;
}

const categories = ['Kalender Akademik', 'Tata Tertib', 'Brosur', 'Pengumuman', 'Formulir', 'Lainnya'];

// ─── DocumentManager ──────────────────────────────────────────────────────────
export const DocumentManager = () => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState<string>('guru'); // default aman ke guru

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchUserRole();
    fetchDocs();
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

  const fetchDocs = async () => {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setDocs(data as Doc[]);
    setLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Pilih file dokumen!');
    setUploading(true);
    try {
      // Upload file ke Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `documents/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);

      // Format ukuran file
      const sizeKB = file.size / 1024;
      const sizeMB = sizeKB / 1024;
      const fileSize = sizeMB >= 1 ? `${sizeMB.toFixed(1)} MB` : `${Math.round(sizeKB)} KB`;

      // Insert ke tabel
      const { error } = await supabase.from('documents').insert([{
        name,
        category,
        file_url: publicUrl,
        file_size: fileSize,
        is_active: false, // default nonaktif, admin aktifkan manual
      }]);
      if (error) throw error;

      setName(''); setCategory(''); setFile(null);
      fetchDocs();
      alert('Dokumen berhasil diupload!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (doc: Doc) => {
    const { error } = await supabase
      .from('documents')
      .update({ is_active: !doc.is_active })
      .eq('id', doc.id);
    if (!error) fetchDocs();
  };

  const handleDelete = async (doc: Doc) => {
    if (!confirm(`Hapus dokumen "${doc.name}"? File juga akan dihapus dari storage.`)) return;
    try {
      // Hapus dari storage
      const path = doc.file_url.split('/documents/').pop();
      if (path) await supabase.storage.from('documents').remove([`documents/${path}`]);

      // Hapus dari tabel
      await supabase.from('documents').delete().eq('id', doc.id);
      fetchDocs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  const activeCount = docs.filter(d => d.is_active).length;

  return (
    <div style={S.page}>
      {/* ── Upload Form ── */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>
          <FileUp size={18} color="#059669" />
          Upload Dokumen Baru
        </h3>
        <form onSubmit={handleUpload}>
          <div style={S.grid2}>
            <div style={S.formGroup}>
              <label style={S.label}>
                <FileText size={13} color="#6b7280" />
                Nama Dokumen
              </label>
              <input
                style={S.input}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="cth. Kalender Akademik 2025/2026"
                required
              />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>
                <Tag size={13} color="#6b7280" />
                Kategori
              </label>
              <select style={S.select} value={category} onChange={e => setCategory(e.target.value)} required>
                <option value="">— Pilih Kategori —</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>
              <Paperclip size={13} color="#6b7280" />
              File Dokumen (PDF / DOC / DOCX / XLSX)
            </label>
            <input
              style={S.fileInput}
              type="file"
              accept=".pdf,.doc,.docx,.xlsx,.xls"
              onChange={e => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="submit" disabled={uploading} style={{ ...S.btnPrimary, opacity: uploading ? 0.6 : 1 }}>
              {uploading
                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Mengupload...</>
                : <><FileUp size={15} /> Upload Dokumen</>
              }
            </button>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
              Dokumen baru otomatis <strong>nonaktif</strong> — aktifkan manual di tabel.
            </p>
          </div>
        </form>
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ ...S.card, flex: 1, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Dokumen Aktif</p>
            <p style={{ fontFamily: "'Outfit'", fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{activeCount}</p>
          </div>
        </div>
        <div style={{ ...S.card, flex: 1, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={20} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Nonaktif</p>
            <p style={{ fontFamily: "'Outfit'", fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{docs.length - activeCount}</p>
          </div>
        </div>
        <div style={{ ...S.card, flex: 1, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dbeafe', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Total Dokumen</p>
            <p style={{ fontFamily: "'Outfit'", fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{docs.length}</p>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>
          <FileText size={18} color="#059669" />
          Daftar Dokumen
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}>
            Toggle "Aktif" agar dokumen tampil di halaman publik
          </span>
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead style={S.thead}>
              <tr>
                <th style={S.th}>Nama Dokumen</th>
                <th style={S.th}>Kategori</th>
                <th style={S.th}>Ukuran</th>
                <th style={S.th}>Tanggal Upload</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div style={S.spinner}>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Memuat dokumen...</span>
                    </div>
                  </td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div style={S.emptyState}>
                      <Inbox size={32} strokeWidth={1.5} />
                      <span>Belum ada dokumen yang diupload.</span>
                    </div>
                  </td>
                </tr>
              ) : docs.map(doc => (
                <tr key={doc.id} style={{ background: doc.is_active ? '#f0fdf4' : 'transparent', transition: 'background 0.2s' }}>
                  <td style={S.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={15} color="#64748b" />
                      </div>
                      <span style={{ fontWeight: 500, color: '#0f172a' }}>{doc.name}</span>
                    </div>
                  </td>
                  <td style={S.td}>
                    <span style={{ display: 'inline-flex', padding: '0.2rem 0.6rem', background: '#eff6ff', color: '#3b82f6', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                      {doc.category}
                    </span>
                  </td>
                  <td style={{ ...S.td, color: '#64748b' }}>{doc.file_size}</td>
                  <td style={{ ...S.td, color: '#64748b' }}>{formatDate(doc.created_at)}</td>
                  <td style={S.td}>
                    {userRole === 'admin' ? (
                      <button
                        style={S.toggleBtn(doc.is_active)}
                        onClick={() => toggleActive(doc)}
                        title={doc.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                      >
                        {doc.is_active
                          ? <><ToggleRight size={16} /> Aktif</>
                          : <><ToggleLeft size={16} /> Nonaktif</>
                        }
                      </button>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', background: '#f1f5f9', color: '#94a3b8', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: 600 }}>
                        {doc.is_active ? 'Aktif' : 'Nonaktif'} (Admin Only)
                      </span>
                    )}
                  </td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...S.btnDanger, background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', textDecoration: 'none' }}
                        title="Preview / Unduh"
                      >
                        <Download size={13} />
                      </a>
                      {userRole === 'admin' && (
                        <button style={S.btnDanger} onClick={() => handleDelete(doc)} title="Hapus permanen">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {docs.length > 0 && (
          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <AlertCircle size={12} />
            Baris hijau = dokumen aktif dan terlihat di halaman publik /akademik.
          </p>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
