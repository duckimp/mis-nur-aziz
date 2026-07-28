import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const UserManager = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    // Mengambil data dari tabel profiles (asumsi tabel ini menyimpan info user)
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (data) setProfiles(data);
    setFetching(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mendaftarkan user baru ke Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Jika pendaftaran berhasil, kita tambahkan ke tabel profiles secara manual 
      // (Supabase biasanya punya trigger otomatis, tapi ini untuk memastikan)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user?.id, email: email, role: 'admin' }]);

      alert('User berhasil didaftarkan! Silakan cek email untuk konfirmasi (jika aktif).');
      setEmail('');
      setPassword('');
      fetchProfiles();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus akses user ini? (Hanya menghapus dari tabel profiles, untuk menghapus permanen gunakan dashboard Supabase)')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchProfiles();
      alert('Akses user berhasil dihapus.');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Tambah Admin Baru</h3>
        <form onSubmit={handleAddUser} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Rekan Kerja</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="email@sekolah.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password Sementara</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Minimal 6 karakter"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Mendaftarkan...' : 'Daftarkan Admin'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Daftar Admin / User</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {fetching ? (
                <tr><td colSpan={3} className="text-center py-4">Memuat...</td></tr>
              ) : profiles.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-4">Belum ada data user di tabel profiles.</td></tr>
              ) : (
                profiles.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{user.email || user.id}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium uppercase">
                        {user.role || 'Admin'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:underline"
                      >
                        Hapus Akses
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-gray-500 italic">
          * Catatan: Menghapus di sini hanya menghapus data dari tabel profiles. Untuk menghapus akun secara permanen dari sistem autentikasi, silakan gunakan Dashboard Supabase.
        </p>
      </div>
    </div>
  );
};
