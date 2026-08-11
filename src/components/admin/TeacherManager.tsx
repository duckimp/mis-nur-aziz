import React, { useState, useEffect } from 'react';
import {
  UserPlus, Upload, Trash2, Edit2, Loader2, Save, Users, MoveUp, MoveDown, Image as ImageIcon, AlertCircle, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Teacher {
  id: string;
  name: string;
  role: string;
  image_url: string;
  order_index: number;
  created_at?: string;
}

const INITIAL_TEACHERS = [
  { name: "Muji As'ari, S.HI., M.Pd.I", role: 'Kepala Madrasah', image_url: '/images/teachers/muji.jpg', order_index: 1 },
  { name: 'Yuyun Novi Ikawati, S.Pd', role: 'Guru Kelas 1', image_url: '/images/teachers/yuyun.jpg', order_index: 2 },
  { name: "Mar'ah Rohmatul Ummah, S.Pd", role: 'Guru Kelas 2', image_url: '/images/teachers/marah.jpg', order_index: 3 },
  { name: "Ana Farida, S.Pd.I", role: 'Guru Kelas 3', image_url: '/images/teachers/ana.jpg', order_index: 4 },
  { name: "Sukartini, S.Pd.I", role: 'Guru Kelas 4', image_url: '/images/teachers/sukartini.jpg', order_index: 5 },
  { name: 'Holila, S.Pd.I', role: 'Guru Kelas 5', image_url: '/images/teachers/holila.jpg', order_index: 6 },
  { name: 'Hartini Zubaidah, S.Pd.I', role: 'Guru Kelas 6', image_url: '/images/teachers/hartini.jpg', order_index: 7 },
  { name: 'Masfin Khoirona, S.Pd.I', role: 'Guru Agama', image_url: '/images/teachers/masfin.jpg', order_index: 8 },
  { name: 'Siti Saudah, S.Pd', role: 'Guru SKI', image_url: '/images/teachers/siti.jpg', order_index: 9 },
  { name: 'Nur Hidayat', role: 'Guru PJOK', image_url: '/images/teachers/dayat.jpg', order_index: 10 },
  { name: 'Andi Mariono', role: 'Operator Data & IT', image_url: '/images/teachers/andi.jpg', order_index: 11 },
];

const compressAndConvertToWebp = (file: File, maxWidth = 800, quality = 0.82): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Failed to get canvas context');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject('Canvas toBlob conversion failed');
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const S = {
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9',
    marginBottom: '1.5rem',
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
  label: { fontSize: '0.8rem', fontWeight: 600, color: '#374151' },
  input: {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '0.875rem',
    color: '#1e293b',
    background: '#fafafa',
    outline: 'none',
    boxSizing: 'border-box' as const,
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
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    background: '#f1f5f9',
    color: '#475569',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
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
  },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.875rem' },
  th: {
    padding: '0.75rem 1rem',
    textAlign: 'left' as const,
    fontWeight: 600,
    color: '#475569',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  td: { padding: '0.875rem 1rem', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
};

export const TeacherManager: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [userRole, setUserRole] = useState<string>('guru');

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  useEffect(() => {
    fetchUserRole();
    fetchTeachers();
  }, []);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile) {
        setUserRole(profile.role || 'guru');
      }
    }
  };

  const fetchTeachers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching teachers:', error);
    } else if (data) {
      setTeachers(data);
    }
    setLoading(false);
  };

  const handleSeedData = async () => {
    if (!confirm('Apakah Anda yakin ingin mengimpor data awal guru & staff ke database?')) return;
    setUploading(true);
    setUploadStatus('Mengimpor data awal...');

    try {
      const { error } = await supabase.from('teachers').insert(INITIAL_TEACHERS);
      if (error) throw error;
      alert('Berhasil mengimpor data awal guru!');
      fetchTeachers();
    } catch (err: any) {
      alert('Gagal mengimpor: ' + err.message + '\n(Pastikan tabel teachers sudah dibuat di Supabase)');
    } finally {
      setUploading(false);
      setUploadStatus('');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setRole('');
    setImageFile(null);
    setCurrentImageUrl('');
  };

  const startEdit = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setName(teacher.name);
    setRole(teacher.role);
    setCurrentImageUrl(teacher.image_url || '');
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) {
      alert('Nama dan Jabatan wajib diisi!');
      return;
    }

    setUploading(true);
    setUploadStatus('Mempersiapkan...');

    try {
      let finalImageUrl = currentImageUrl;

      if (imageFile) {
        setUploadStatus('Mengompresi & konversi foto ke WebP...');
        const webpBlob = await compressAndConvertToWebp(imageFile, 800, 0.82);

        setUploadStatus('Mengunggah foto ke storage...');
        const filePath = `teachers/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, webpBlob, { contentType: 'image/webp' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrl;
      }

      if (editingId) {
        setUploadStatus('Memperbarui data guru...');
        const { error } = await supabase
          .from('teachers')
          .update({
            name: name.trim(),
            role: role.trim(),
            image_url: finalImageUrl,
          })
          .eq('id', editingId);

        if (error) throw error;
        alert('Data guru berhasil diperbarui!');
      } else {
        setUploadStatus('Menyimpan guru baru...');
        const nextOrder = teachers.length > 0 ? Math.max(...teachers.map(t => t.order_index || 0)) + 1 : 1;

        const { error } = await supabase
          .from('teachers')
          .insert([{
            name: name.trim(),
            role: role.trim(),
            image_url: finalImageUrl || '#',
            order_index: nextOrder,
          }]);

        if (error) throw error;
        alert('Guru/Staff berhasil ditambahkan!');
      }

      resetForm();
      fetchTeachers();
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setUploading(false);
      setUploadStatus('');
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm('Hapus guru/staff ini?')) return;

    try {
      if (imageUrl && imageUrl.includes('/storage/v1/object/public/images/teachers/')) {
        const path = imageUrl.split('/images/').pop();
        if (path) {
          await supabase.storage.from('images').remove([path]);
        }
      }

      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) throw error;

      fetchTeachers();
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= teachers.length) return;

    const currentTeacher = teachers[index];
    const targetTeacher = teachers[targetIndex];

    try {
      await Promise.all([
        supabase.from('teachers').update({ order_index: targetTeacher.order_index }).eq('id', currentTeacher.id),
        supabase.from('teachers').update({ order_index: currentTeacher.order_index }).eq('id', targetTeacher.id),
      ]);
      fetchTeachers();
    } catch (err: any) {
      alert('Gagal mengubah urutan: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={S.card}>
        <div style={S.cardTitle}>
          {editingId ? <Edit2 size={18} /> : <UserPlus size={18} />}
          <span>{editingId ? 'Edit Data Guru & Staff' : 'Tambah Guru / Staff Baru'}</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-grid-2">
            <div style={S.formGroup}>
              <label style={S.label}>Nama Lengkap & Gelar *</label>
              <input type="text" style={S.input} placeholder="mis. Muji As'ari, S.HI., M.Pd.I" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Jabatan / Peran *</label>
              <input type="text" style={S.input} placeholder="mis. Guru Kelas 1" value={role} onChange={(e) => setRole(e.target.value)} required />
            </div>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Foto Profile (Otomatis Kompres & Convert WebP)</label>
            <input type="file" accept="image/*" style={S.input} onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            {currentImageUrl && !imageFile && (
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Foto saat ini:</span>
                <img src={currentImageUrl} alt="Preview" style={{ width: 36, height: 48, objectFit: 'cover', borderRadius: 4 }} />
              </div>
            )}
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Sistem otomatis mengompresi dan convert ke <strong>WebP</strong>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="submit" style={S.btnPrimary} disabled={uploading}>
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{uploading ? uploadStatus || 'Memproses...' : editingId ? 'Simpan' : 'Tambah'}</span>
            </button>
            {editingId && <button type="button" style={S.btnSecondary} onClick={resetForm} disabled={uploading}>Batal</button>}
          </div>
        </form>
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
          <div style={S.cardTitle as any}>
            <Users size={18} />
            <span>Daftar Guru & Staff ({teachers.length})</span>
          </div>
          {teachers.length === 0 && !loading && userRole === 'admin' && (
            <button style={S.btnSecondary} onClick={handleSeedData} disabled={uploading}><RefreshCw size={14} /> Impor Data</button>
          )}
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: '#64748b', gap: '0.5rem' }}>
            <Loader2 size={20} className="animate-spin" /> Memuat...
          </div>
        ) : teachers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Belum ada data guru.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table} className="admin-table">
              <thead>
                <tr>
                  <th style={{ ...S.th, width: '60px' }}>Urutan</th>
                  <th style={S.th}>Foto</th>
                  <th style={S.th}>Nama</th>
                  <th style={S.th}>Jabatan</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher, index) => (
                  <tr key={teacher.id}>
                    <td style={S.td} data-label="Urutan">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontWeight: 600 }}>{index + 1}</span>
                        {userRole === 'admin' && (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <button type="button" onClick={() => handleMoveOrder(index, 'up')} disabled={index === 0}
                              style={{ border: 'none', background: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', padding: 0, opacity: index === 0 ? 0.3 : 1 }}>
                              <MoveUp size={12} />
                            </button>
                            <button type="button" onClick={() => handleMoveOrder(index, 'down')} disabled={index === teachers.length - 1}
                              style={{ border: 'none', background: 'none', cursor: index === teachers.length - 1 ? 'not-allowed' : 'pointer', padding: 0, opacity: index === teachers.length - 1 ? 0.3 : 1 }}>
                              <MoveDown size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={S.td} data-label="Foto">
                      {teacher.image_url && teacher.image_url !== '#' ? (
                        <img src={teacher.image_url} alt={teacher.name} style={{ width: 40, height: 52, objectFit: 'cover', borderRadius: '6px' }} />
                      ) : (
                        <div style={{ width: 40, height: 52, background: '#e2e8f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </td>
                    <td style={{ ...S.td, fontWeight: 600 }} data-label="Nama">{teacher.name}</td>
                    <td style={S.td} data-label="Jabatan">
                      <span style={{ background: '#ecfdf5', color: '#047857', padding: '0.25rem 0.625rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600 }}>{teacher.role}</span>
                    </td>
                    <td style={S.td} data-label="Aksi">
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button style={{ ...S.btnSecondary, padding: '0.375rem 0.625rem', fontSize: '0.8rem' }} onClick={() => startEdit(teacher)}>
                          <Edit2 size={13} /> Edit
                        </button>
                        {userRole === 'admin' && (
                          <button style={S.btnDanger} onClick={() => handleDelete(teacher.id, teacher.image_url)}>
                            <Trash2 size={13} /> Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <AlertCircle size={12} /> Gunakan panah untuk mengubah urutan tampilan.
        </p>
      </div>
    </div>
  );
};
