import React, { useState, useEffect } from 'react';
import {
  IconGraduationCap,
  IconEdit,
  IconSearch,
  IconCheckCircle,
  IconXCircle,
  IconClock,
  IconUsers,
  IconUser,
  IconMosque,
  IconBuilding,
  IconTrophy,
  IconMapPin,
  IconTrash,
  IconPlus,
  IconDownload,
  IconWhatsApp,
} from '../alumni/AlumniIcons';

interface AlumniRecord {
  id: string;
  nama_lengkap: string;
  nisn?: string;
  tahun_lulus: number;
  jenis_kelamin: 'L' | 'P';
  nomor_wa: string;
  tipe_sekolah_lanjutan: string;
  nama_sekolah_lanjutan: string;
  kabupaten_kota: string;
  jalur_masuk?: string;
  kategori_prestasi?: string;
  rincian_prestasi?: string;
  kesan_pesan?: string;
  status_verifikasi: 'pending' | 'disetujui' | 'ditolak';
  catatan_admin?: string;
  created_at: string;
  updated_at: string;
}

const TIPE_SEKOLAH_LABELS: Record<string, string> = {
  mts_negeri: 'MTs Negeri',
  mts_swasta: 'MTs Swasta',
  smp_negeri: 'SMP Negeri',
  smp_swasta: 'SMP Swasta',
  pesantren: 'Pondok Pesantren',
  lainnya: 'Lainnya',
};

export default function AlumniManager() {
  const [records, setRecords] = useState<AlumniRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    disetujui: 0,
    ditolak: 0,
    mts: 0,
    smp: 0,
    pesantren: 0,
  });
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<AlumniRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Manual Form State
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState<Partial<AlumniRecord>>({
    nama_lengkap: '',
    nisn: '',
    tahun_lulus: currentYear,
    jenis_kelamin: 'L',
    nomor_wa: '',
    tipe_sekolah_lanjutan: 'mts_negeri',
    nama_sekolah_lanjutan: '',
    kabupaten_kota: '',
    jalur_masuk: 'Reguler',
    kategori_prestasi: '',
    rincian_prestasi: '',
    kesan_pesan: '',
    status_verifikasi: 'disetujui',
    catatan_admin: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterYear !== 'all') params.append('tahun', filterYear);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());

      const res = await fetch(`/api/alumni/admin?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
        if (json.stats) setStats(json.stats);
        if (json.availableYears) setAvailableYears(json.availableYears);
      } else {
        setErrorMsg(json.error || 'Gagal memuat data');
      }
    } catch (err: any) {
      setErrorMsg('Kesalahan jaringan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterYear]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData();
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Quick Action Approve / Reject
  const handleQuickAction = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      const confirmReject = window.confirm('Apakah Anda yakin ingin menolak data alumni ini? Data yang ditolak tidak akan tampil di direktori publik.');
      if (!confirmReject) return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/alumni/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id }),
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
        if (isDetailModalOpen) setIsDetailModalOpen(false);
      } else {
        alert('Gagal: ' + json.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Action
  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data alumni atas nama "${nama}"? Data yang dihapus tidak dapat dipulihkan.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/alumni/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
        if (isDetailModalOpen) setIsDetailModalOpen(false);
      } else {
        alert('Gagal menghapus: ' + json.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Save Edit from Detail Modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/alumni/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual_update',
          id: selectedRecord.id,
          formData: selectedRecord,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsDetailModalOpen(false);
        fetchData();
      } else {
        alert('Gagal menyimpan: ' + json.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Save Create Manual
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/alumni/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual_create',
          formData,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        setFormData({
          nama_lengkap: '',
          nisn: '',
          tahun_lulus: currentYear,
          jenis_kelamin: 'L',
          nomor_wa: '',
          tipe_sekolah_lanjutan: 'mts_negeri',
          nama_sekolah_lanjutan: '',
          kabupaten_kota: '',
          jalur_masuk: 'Reguler',
          kategori_prestasi: '',
          rincian_prestasi: '',
          kesan_pesan: '',
          status_verifikasi: 'disetujui',
          catatan_admin: '',
        });
        fetchData();
      } else {
        alert('Gagal membuat data: ' + json.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (records.length === 0) {
      alert('Tidak ada data untuk diexport.');
      return;
    }

    const headers = [
      'No',
      'Nama Lengkap',
      'NISN',
      'Tahun Lulus',
      'L/P',
      'No WhatsApp',
      'Kategori Sekolah Lanjutan',
      'Nama Sekolah Lanjutan',
      'Kab/Kota Sekolah',
      'Jalur Masuk',
      'Kategori Prestasi',
      'Rincian Prestasi',
      'Kesan & Pesan',
      'Status Verifikasi',
      'Catatan Admin',
      'Tanggal Input',
    ];

    const rows = records.map((r, idx) => [
      idx + 1,
      `"${(r.nama_lengkap || '').replace(/"/g, '""')}"`,
      `"${r.nisn || ''}"`,
      r.tahun_lulus,
      r.jenis_kelamin,
      `="${r.nomor_wa}"`,
      `"${TIPE_SEKOLAH_LABELS[r.tipe_sekolah_lanjutan] || r.tipe_sekolah_lanjutan}"`,
      `"${(r.nama_sekolah_lanjutan || '').replace(/"/g, '""')}"`,
      `"${(r.kabupaten_kota || '').replace(/"/g, '""')}"`,
      `"${(r.jalur_masuk || '').replace(/"/g, '""')}"`,
      `"${(r.kategori_prestasi || '').replace(/"/g, '""')}"`,
      `"${(r.rincian_prestasi || '').replace(/"/g, '""')}"`,
      `"${(r.kesan_pesan || '').replace(/"/g, '""')}"`,
      r.status_verifikasi.toUpperCase(),
      `"${(r.catatan_admin || '').replace(/"/g, '""')}"`,
      new Date(r.created_at).toLocaleDateString('id-ID'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Tracer_Study_MIS_Nur_Aziz_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="alumni-admin-wrapper">
      {/* ── Summary Cards ── */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="stat-icon-wrap bg-blue-subtle">
            <IconUsers size={20} />
          </div>
          <div>
            <span className="stat-val">{stats.total}</span>
            <span className="stat-tit">Total Alumni</span>
          </div>
        </div>

        <div className={`admin-stat-card ${stats.pending > 0 ? 'card-highlight-pending' : ''}`}>
          <div className="stat-icon-wrap bg-amber-subtle">
            <IconClock size={20} />
          </div>
          <div>
            <span className="stat-val text-amber">{stats.pending}</span>
            <span className="stat-tit">Menunggu Verifikasi</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrap bg-emerald-subtle">
            <IconCheckCircle size={20} />
          </div>
          <div>
            <span className="stat-val text-emerald">{stats.disetujui}</span>
            <span className="stat-tit">Disetujui</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrap bg-cyan-subtle">
            <IconMosque size={20} />
          </div>
          <div>
            <span className="stat-val">{stats.mts}</span>
            <span className="stat-tit">MTs Negeri / Swasta</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrap bg-indigo-subtle">
            <IconBuilding size={20} />
          </div>
          <div>
            <span className="stat-val">{stats.smp}</span>
            <span className="stat-tit">SMP Negeri / Swasta</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrap bg-green-subtle">
            <IconGraduationCap size={20} />
          </div>
          <div>
            <span className="stat-val">{stats.pesantren}</span>
            <span className="stat-tit">Pesantren</span>
          </div>
        </div>
      </div>

      {/* ── Filter Bar & Actions ── */}
      <div className="admin-toolbar-card">
        <div className="toolbar-left">
          <div className="search-input-admin">
            <IconSearch size={16} />
            <input
              type="text"
              placeholder="Cari nama, NISN, sekolah lanjutan, no WA..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="admin-select"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu Verifikasi ({stats.pending})</option>
            <option value="disetujui">Disetujui ({stats.disetujui})</option>
            <option value="ditolak">Ditolak ({stats.ditolak})</option>
          </select>

          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="admin-select"
          >
            <option value="all">Semua Tahun Angkatan</option>
            {availableYears.map(y => (
              <option key={y} value={y}>Lulus {y}</option>
            ))}
          </select>
        </div>

        <div className="toolbar-right">
          <button
            type="button"
            className="btn-toolbar btn-export"
            onClick={handleExportCSV}
            title="Download Rekap Data Alumni (Format CSV / Excel)"
          >
            <IconDownload size={15} />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            className="btn-toolbar btn-primary-admin"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <IconPlus size={16} />
            <span>Tambah Data Manual</span>
          </button>
        </div>
      </div>

      {/* ── Table Content ── */}
      <div className="admin-table-container">
        {loading ? (
          <div className="table-loading-box">
            <span className="spinner-large"></span>
            <p>Memuat data alumni...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="table-empty-box">
            <div className="empty-icon-wrap">
              <IconGraduationCap size={44} />
            </div>
            <h4>Tidak Ada Data Alumni</h4>
            <p>Data tidak ditemukan untuk kriteria filter atau pencarian saat ini.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th>Nama & Identitas</th>
                  <th>Angkatan</th>
                  <th>Studi Lanjutan</th>
                  <th>Prestasi & Pesan</th>
                  <th>Kontak WA</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi Moderasi</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const cleanWa = (r.nomor_wa || '').replace(/\D/g, '');
                  return (
                    <tr key={r.id}>
                      <td className="text-center">{i + 1}</td>
                      <td>
                        <div className="student-profile-cell">
                          <span className="avatar-mini">
                            <IconUser size={18} />
                          </span>
                          <div>
                            <strong className="name-bold text-capitalize">{r.nama_lengkap}</strong>
                            <div className="sub-meta">
                              {r.nisn ? `NISN: ${r.nisn}` : 'NISN: -'} • {r.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="pill-year">{r.tahun_lulus}</span>
                      </td>
                      <td>
                        <div className="school-cell">
                          <span className={`school-type-tag tag-${r.tipe_sekolah_lanjutan}`}>
                            {TIPE_SEKOLAH_LABELS[r.tipe_sekolah_lanjutan] || r.tipe_sekolah_lanjutan}
                          </span>
                          <span className="school-target-name text-capitalize">{r.nama_sekolah_lanjutan}</span>
                          <span className="school-target-city text-capitalize">
                            <IconMapPin size={11} /> {r.kabupaten_kota} ({r.jalur_masuk || 'Reguler'})
                          </span>
                        </div>
                      </td>
                      <td>
                        {r.rincian_prestasi || r.kategori_prestasi ? (
                          <div className="achievement-cell" title={r.rincian_prestasi || r.kategori_prestasi}>
                            <IconTrophy size={12} /> {r.rincian_prestasi || r.kategori_prestasi}
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                        {r.kesan_pesan && (
                          <div className="quote-cell" title={r.kesan_pesan}>
                            “{r.kesan_pesan}”
                          </div>
                        )}
                      </td>
                      <td>
                        <a
                          href={`https://wa.me/${cleanWa}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-wa-pill"
                          title="Hubungi via WhatsApp"
                        >
                          <IconWhatsApp size={13} />
                          <span>+{cleanWa}</span>
                        </a>
                      </td>
                      <td>
                        <span className={`status-pill status-${r.status_verifikasi}`}>
                          {r.status_verifikasi === 'pending' && (
                            <>
                              <IconClock size={12} />
                              <span>Pending</span>
                            </>
                          )}
                          {r.status_verifikasi === 'disetujui' && (
                            <>
                              <IconCheckCircle size={12} />
                              <span>Disetujui</span>
                            </>
                          )}
                          {r.status_verifikasi === 'ditolak' && (
                            <>
                              <IconXCircle size={12} />
                              <span>Ditolak</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-group">
                          {r.status_verifikasi !== 'disetujui' && (
                            <button
                              type="button"
                              className="btn-action-icon btn-approve"
                              title="Setujui Data"
                              disabled={actionLoading}
                              onClick={() => handleQuickAction(r.id, 'approve')}
                            >
                              <IconCheckCircle size={16} />
                            </button>
                          )}

                          {r.status_verifikasi !== 'ditolak' && (
                            <button
                              type="button"
                              className="btn-action-icon btn-reject"
                              title="Tolak Data"
                              disabled={actionLoading}
                              onClick={() => handleQuickAction(r.id, 'reject')}
                            >
                              <IconXCircle size={16} />
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn-action-icon btn-edit"
                            title="Edit / Detail Lengkap"
                            onClick={() => { setSelectedRecord(r); setIsDetailModalOpen(true); }}
                          >
                            <IconEdit size={15} />
                          </button>

                          <button
                            type="button"
                            className="btn-action-icon btn-delete"
                            title="Hapus Data"
                            disabled={actionLoading}
                            onClick={() => handleDelete(r.id, r.nama_lengkap)}
                          >
                            <IconTrash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MODAL DETAIL & EDIT
         ══════════════════════════════════════════════════════════════ */}
      {isDetailModalOpen && selectedRecord && (
        <div className="admin-modal-backdrop" onClick={() => setIsDetailModalOpen(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <h3>Edit / Detail Data Alumni</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsDetailModalOpen(false)}
                aria-label="Tutup"
              >
                <IconXCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-form-body">
              <div className="form-grid-2">
                <div className="form-field">
                  <label>Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={selectedRecord.nama_lengkap}
                    onChange={e => setSelectedRecord({ ...selectedRecord, nama_lengkap: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>NISN</label>
                  <input
                    type="text"
                    value={selectedRecord.nisn || ''}
                    onChange={e => setSelectedRecord({ ...selectedRecord, nisn: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Tahun Lulus</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    required
                    placeholder="Contoh: 2025"
                    value={selectedRecord.tahun_lulus}
                    onChange={e => {
                      const clean = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setSelectedRecord({ ...selectedRecord, tahun_lulus: clean ? parseInt(clean, 10) : 0 });
                    }}
                  />
                </div>

                <div className="form-field">
                  <label>Jenis Kelamin</label>
                  <select
                    value={selectedRecord.jenis_kelamin}
                    onChange={e => setSelectedRecord({ ...selectedRecord, jenis_kelamin: e.target.value as 'L' | 'P' })}
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Nomor WhatsApp</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={selectedRecord.nomor_wa}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.startsWith('0')) val = '62' + val.slice(1);
                      setSelectedRecord({ ...selectedRecord, nomor_wa: val });
                    }}
                  />
                </div>

                <div className="form-field">
                  <label>Status Verifikasi</label>
                  <select
                    value={selectedRecord.status_verifikasi}
                    onChange={e => setSelectedRecord({ ...selectedRecord, status_verifikasi: e.target.value as any })}
                  >
                    <option value="pending">Pending (Menunggu Verifikasi)</option>
                    <option value="disetujui">Disetujui (Tampil di Publik)</option>
                    <option value="ditolak">Ditolak</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2 mt-3">
                <div className="form-field">
                  <label>Kategori Sekolah Lanjutan</label>
                  <select
                    value={selectedRecord.tipe_sekolah_lanjutan}
                    onChange={e => setSelectedRecord({ ...selectedRecord, tipe_sekolah_lanjutan: e.target.value })}
                  >
                    <option value="mts_negeri">MTs Negeri</option>
                    <option value="mts_swasta">MTs Swasta</option>
                    <option value="smp_negeri">SMP Negeri</option>
                    <option value="smp_swasta">SMP Swasta</option>
                    <option value="pesantren">Pondok Pesantren</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Jalur Penerimaan</label>
                  <select
                    value={selectedRecord.jalur_masuk || "Reguler"}
                    onChange={e => setSelectedRecord({ ...selectedRecord, jalur_masuk: e.target.value })}
                  >
                    <option value="Reguler">Reguler / Zonasi</option>
                    <option value="Prestasi Akademik">Prestasi Akademik</option>
                    <option value="Prestasi Non-Akademik">Prestasi Non-Akademik / Olahraga</option>
                    <option value="Beasiswa / Tahfidz">Beasiswa / Jalur Tahfidz</option>
                    <option value="Tes Masuk Mandiri">Tes Masuk Mandiri</option>
                    <option value="Mutasi / Pindahan">Mutasi / Siswa Pindahan</option>
                    <option value="Afirmasi / Mitra">Afirmasi / Kemitraan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Nama Sekolah / Pesantren</label>
                  <input
                    type="text"
                    required
                    value={selectedRecord.nama_sekolah_lanjutan}
                    onChange={e => setSelectedRecord({ ...selectedRecord, nama_sekolah_lanjutan: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Kabupaten / Kota</label>
                  <input
                    type="text"
                    required
                    value={selectedRecord.kabupaten_kota}
                    onChange={e => setSelectedRecord({ ...selectedRecord, kabupaten_kota: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-field mt-3">
                <label>Prestasi</label>
                <textarea
                  rows={2}
                  value={selectedRecord.rincian_prestasi || selectedRecord.kategori_prestasi || ''}
                  onChange={e => setSelectedRecord({ ...selectedRecord, rincian_prestasi: e.target.value })}
                />
              </div>

              <div className="form-field mt-3">
                <label>Kesan & Pesan Alumni</label>
                <textarea
                  rows={2}
                  value={selectedRecord.kesan_pesan || ''}
                  onChange={e => setSelectedRecord({ ...selectedRecord, kesan_pesan: e.target.value })}
                />
              </div>

              <div className="form-field mt-3">
                <label>Catatan Admin (Internal)</label>
                <input
                  type="text"
                  placeholder="Catatan validasi atau keterangan..."
                  value={selectedRecord.catatan_admin || ''}
                  onChange={e => setSelectedRecord({ ...selectedRecord, catatan_admin: e.target.value })}
                />
              </div>

              <div className="modal-footer-actions mt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL TAMBAH DATA MANUAL
         ══════════════════════════════════════════════════════════════ */}
      {isCreateModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <h3>Tambah Data Alumni (Manual)</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Tutup"
              >
                <IconXCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCreate} className="modal-form-body">
              <div className="form-grid-2">
                <div className="form-field">
                  <label>Nama Lengkap <span className="req">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.nama_lengkap}
                    onChange={e => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>NISN</label>
                  <input
                    type="text"
                    value={formData.nisn}
                    onChange={e => setFormData({ ...formData, nisn: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Tahun Kelulusan <span className="req">*</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    required
                    placeholder="Contoh: 2025"
                    value={formData.tahun_lulus}
                    onChange={e => {
                      const clean = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setFormData({ ...formData, tahun_lulus: clean ? parseInt(clean, 10) : 0 });
                    }}
                  />
                </div>

                <div className="form-field">
                  <label>Jenis Kelamin</label>
                  <select
                    value={formData.jenis_kelamin}
                    onChange={e => setFormData({ ...formData, jenis_kelamin: e.target.value as 'L' | 'P' })}
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Nomor WhatsApp (Contoh: 6285694841807) <span className="req">*</span></label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={formData.nomor_wa}
                    onChange={e => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.startsWith('0')) val = '62' + val.slice(1);
                    setFormData({ ...formData, nomor_wa: val });
                  }}
                  />
                </div>

                <div className="form-field">
                  <label>Status Verifikasi</label>
                  <select
                    value={formData.status_verifikasi}
                    onChange={e => setFormData({ ...formData, status_verifikasi: e.target.value as any })}
                  >
                    <option value="disetujui">Langsung Disetujui</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2 mt-3">
                <div className="form-field">
                  <label>Kategori Sekolah Lanjutan</label>
                  <select
                    value={formData.tipe_sekolah_lanjutan}
                    onChange={e => setFormData({ ...formData, tipe_sekolah_lanjutan: e.target.value })}
                  >
                    <option value="mts_negeri">MTs Negeri</option>
                    <option value="mts_swasta">MTs Swasta</option>
                    <option value="smp_negeri">SMP Negeri</option>
                    <option value="smp_swasta">SMP Swasta</option>
                    <option value="pesantren">Pondok Pesantren</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Jalur Penerimaan</label>
                  <select
                    value={formData.jalur_masuk || "Reguler"}
                    onChange={e => setFormData({ ...formData, jalur_masuk: e.target.value })}
                  >
                    <option value="Reguler">Reguler / Zonasi</option>
                    <option value="Prestasi Akademik">Prestasi Akademik</option>
                    <option value="Prestasi Non-Akademik">Prestasi Non-Akademik / Olahraga</option>
                    <option value="Beasiswa / Tahfidz">Beasiswa / Jalur Tahfidz</option>
                    <option value="Tes Masuk Mandiri">Tes Masuk Mandiri</option>
                    <option value="Mutasi / Pindahan">Mutasi / Siswa Pindahan</option>
                    <option value="Afirmasi / Mitra">Afirmasi / Kemitraan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Nama Sekolah / Pesantren <span className="req">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.nama_sekolah_lanjutan}
                    onChange={e => setFormData({ ...formData, nama_sekolah_lanjutan: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Kabupaten / Kota Lokasi <span className="req">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.kabupaten_kota}
                    onChange={e => setFormData({ ...formData, kabupaten_kota: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-field mt-3">
                <label>Prestasi</label>
                <textarea
                  rows={2}
                  placeholder="Prestasi yang pernah diraih..."
                  value={formData.rincian_prestasi}
                  onChange={e => setFormData({ ...formData, rincian_prestasi: e.target.value })}
                />
              </div>

              <div className="form-field mt-3">
                <label>Kesan & Pesan</label>
                <textarea
                  rows={2}
                  placeholder="Kesan atau pesan..."
                  value={formData.kesan_pesan}
                  onChange={e => setFormData({ ...formData, kesan_pesan: e.target.value })}
                />
              </div>

              <div className="modal-footer-actions mt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Data Alumni'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
