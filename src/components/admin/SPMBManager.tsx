import { useState, useEffect, useCallback } from 'react';
import { generateWALink, generateWAMessage, getAlasanBatalLabel, formatWhatsApp, type AlasanBatal } from '../../lib/spmb';
import {
  IconRefresh,
  IconCalendar,
  IconEye,
  IconCheck,
  IconCheckCircle,
  IconX,
  IconBan,
  IconTrash,
  IconWhatsApp,
  IconFileText,
  IconClock,
  IconInbox,
  IconSpinner,
  IconAlertTriangle,
} from './SPMBIcons';

interface Pendaftar {
  id: string;
  registration_id: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  nomor_wa: string;
  foto_kk_url: string;
  foto_akta_url: string;
  status: 'PENDING' | 'DITERIMA' | 'DITOLAK' | 'BATAL';
  alasan_batal?: string;
  catatan_batal?: string;
  catatan_admin?: string;
  tahun_ajaran: string;
  created_at: string;
}

const statusBadgeConfig = {
  PENDING: { label: 'Menunggu', cls: 'badge-pending' },
  DITERIMA: { label: 'Diterima', cls: 'badge-diterima' },
  DITOLAK: { label: 'Ditolak', cls: 'badge-ditolak' },
  BATAL: { label: 'Batal', cls: 'badge-batal' },
};

function StatusBadge({ status }: { status: Pendaftar['status'] }) {
  const cfg = statusBadgeConfig[status] || { label: status, cls: '' };
  return <span className={`status-badge-admin ${cfg.cls}`}>{cfg.label}</span>;
}

export default function SPMBManager() {
  const [data, setData] = useState<Pendaftar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterTahun, setFilterTahun] = useState<string>('ALL');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<Pendaftar | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal Alasan Tolak
  const [showTolakModal, setShowTolakModal] = useState(false);
  const [tolakTarget, setTolakTarget] = useState<Pendaftar | null>(null);
  const [catatanTolak, setCatatanTolak] = useState('');

  // Modal Alasan Batal
  const [showBatalModal, setShowBatalModal] = useState(false);
  const [batalTarget, setBatalTarget] = useState<Pendaftar | null>(null);
  const [alasanBatal, setAlasanBatal] = useState<AlasanBatal>('LAINNYA');
  const [catatanBatalAdmin, setCatatanBatalAdmin] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch available years on mount
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const [settingsRes, pendaftarRes] = await Promise.all([
          fetch('/api/spmb/settings'),
          fetch('/api/spmb/pendaftar'),
        ]);
        const settingsData = await settingsRes.json();
        const pendaftarData = await pendaftarRes.json();

        const years = new Set<string>();
        if (settingsData?.tahun_ajaran) years.add(settingsData.tahun_ajaran);
        if (Array.isArray(pendaftarData)) {
          pendaftarData.forEach(p => { if (p.tahun_ajaran) years.add(p.tahun_ajaran); });
        }
        setAvailableYears(Array.from(years).sort().reverse());
      } catch {
        // ignore
      }
    };
    fetchYears();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      if (filterTahun !== 'ALL') params.set('tahun_ajaran', filterTahun);
      if (search) params.set('search', search);
      const res = await fetch(`/api/spmb/pendaftar?${params}`);
      const json = await res.json();
      if (Array.isArray(json)) setData(json);
    } catch { setData([]); }
    setLoading(false);
  }, [filterStatus, filterTahun, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (
    id: string,
    newStatus: 'DITERIMA' | 'DITOLAK' | 'BATAL',
    catatan?: string,
    alasan?: AlasanBatal
  ) => {
    setActionLoading(id + newStatus);
    try {
      const res = await fetch('/api/spmb/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus,
          catatan_admin: catatan,
          alasan_batal: alasan,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      showToast('success', `Status berhasil diubah ke ${newStatus}`);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mengubah status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenTolakModal = (item: Pendaftar) => {
    setTolakTarget(item);
    setCatatanTolak('');
    setShowTolakModal(true);
  };

  const handleConfirmTolak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tolakTarget) return;
    await updateStatus(tolakTarget.id, 'DITOLAK', catatanTolak.trim() || undefined);
    setShowTolakModal(false);
    setTolakTarget(null);
  };

  const handleOpenBatalModal = (item: Pendaftar) => {
    setBatalTarget(item);
    setAlasanBatal('LAINNYA');
    setCatatanBatalAdmin('');
    setShowBatalModal(true);
  };

  const handleConfirmBatal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batalTarget) return;
    await updateStatus(
      batalTarget.id,
      'BATAL',
      catatanBatalAdmin.trim() || undefined,
      alasanBatal
    );
    setShowBatalModal(false);
    setBatalTarget(null);
  };

  const hapusPendaftar = async (item: Pendaftar) => {
    if (!confirm(`Hapus permanen pendaftar "${item.nama_lengkap}" (${item.registration_id})?\n\nTindakan ini tidak dapat dibatalkan.`)) return;
    setActionLoading(item.id + 'hapus');
    try {
      const res = await fetch('/api/spmb/hapus', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          tahun_ajaran: item.tahun_ajaran,
          registration_id: item.registration_id,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      showToast('success', `Data ${item.nama_lengkap} berhasil dihapus`);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus data');
    } finally {
      setActionLoading(null);
    }
  };

  const openWA = (item: Pendaftar, type: 'DITERIMA' | 'DITOLAK') => {
    // Guard: pastikan data valid sebelum generate pesan
    const nama = item?.nama_lengkap;
    const regId = item?.registration_id;
    if (!nama || !regId) {
      console.error('[openWA] Data item tidak lengkap:', item);
      showToast('error', 'Data pendaftar tidak lengkap. Coba refresh halaman.');
      return;
    }
    const msg = generateWAMessage(
      type,
      nama,
      regId,
      item.tahun_ajaran,
      item.catatan_admin
    );
    window.open(generateWALink(item.nomor_wa, msg), '_blank');
  };

  const counts = {
    ALL: data.length,
    PENDING: data.filter(d => d.status === 'PENDING').length,
    DITERIMA: data.filter(d => d.status === 'DITERIMA').length,
    DITOLAK: data.filter(d => d.status === 'DITOLAK').length,
    BATAL: data.filter(d => d.status === 'BATAL').length,
  };

  const quickRejectReasons = [
    'Berkas Foto KK / Akta tidak terbaca jelas',
    'Usia calon murid belum memenuhi kriteria minimal',
    'Kuota rombel / kelas pendaftar telah terpenuhi',
    'Data formulir ganda / terduplikasi',
  ];

  return (
    <div className="admin-spmb-manager">
      {/* Toast Notification */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === 'success' ? <IconCheckCircle size={16} /> : <IconAlertTriangle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar">
        {/* Status Tabs */}
        <div className="filter-tabs">
          {(['ALL', 'PENDING', 'DITERIMA', 'DITOLAK', 'BATAL'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`filter-tab ${filterStatus === s ? 'active' : ''}`}
            >
              <span>{s === 'ALL' ? 'Semua' : statusBadgeConfig[s as keyof typeof statusBadgeConfig]?.label || s}</span>
              <span className="tab-count">{counts[s]}</span>
            </button>
          ))}
        </div>

        {/* Search & Tahun Ajaran */}
        <div className="filter-controls">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau ID registrasi..."
            className="filter-search"
          />
          {availableYears.length > 0 && (
            <div className="select-year-wrap">
              <IconCalendar size={14} className="calendar-icon" />
              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                className="filter-select-tahun"
              >
                <option value="ALL">Semua Tahun Ajaran</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>Tahun Ajaran {yr}</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={fetchData} className="btn-refresh" title="Refresh data">
            <IconRefresh size={15} />
          </button>
        </div>
      </div>

      {/* Table Data */}
      {loading ? (
        <div className="table-loading">
          <IconSpinner size={28} />
          <p>Memuat data pendaftar...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="table-empty">
          <IconInbox size={48} />
          <h3>Tidak Ada Data Pendaftar</h3>
          <p>Belum ada calon murid yang terdaftar dengan filter ini.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="spmb-table">
            <thead>
              <tr>
                <th>Calon Murid & ID</th>
                <th>Kontak WA</th>
                <th>Status Seleksi</th>
                <th style={{ textAlign: 'center', width: '160px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const isLoading = (s: string) => actionLoading === item.id + s;
                const formattedBirthDate = new Date(item.tanggal_lahir).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{item.nama_lengkap}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                          <span className="reg-id-cell">{item.registration_id}</span>
                          <span style={{ color: '#cbd5e1' }}>•</span>
                          <span className="badge-ta">{item.tahun_ajaran}</span>
                          <span style={{ color: '#cbd5e1' }}>•</span>
                          <span style={{ color: '#64748b' }}>Lahir: {formattedBirthDate}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <a
                        href={`https://wa.me/${formatWhatsApp(item.nomor_wa)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="wa-link"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: '#059669',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          background: '#ecfdf5',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        <IconWhatsApp size={13} />
                        <span>{item.nomor_wa}</span>
                      </a>
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <div className="action-btns" style={{ justifyContent: 'center' }}>
                        {/* Detail */}
                        <button
                          onClick={() => { setSelectedItem(item); setShowDetail(true); }}
                          className="btn-action btn-detail"
                          title="Lihat Detail & Berkas"
                        >
                          <IconEye size={14} />
                        </button>

                        {/* Setujui */}
                        {item.status === 'PENDING' && (
                          <button
                            onClick={() => updateStatus(item.id, 'DITERIMA')}
                            disabled={isLoading('DITERIMA')}
                            className="btn-action btn-terima"
                            title="Terima Pendaftaran"
                          >
                            {isLoading('DITERIMA') ? <IconSpinner size={13} /> : <IconCheck size={14} />}
                          </button>
                        )}

                        {/* Tolak (Buka Modal Alasan) */}
                        {item.status === 'PENDING' && (
                          <button
                            onClick={() => handleOpenTolakModal(item)}
                            disabled={isLoading('DITOLAK')}
                            className="btn-action btn-tolak"
                            title="Tolak Pendaftaran dengan Alasan"
                          >
                            {isLoading('DITOLAK') ? <IconSpinner size={13} /> : <IconX size={14} />}
                          </button>
                        )}

                        {/* Set Batal (Buka Modal Alasan Pembatalan Admin) */}
                        {(item.status === 'PENDING' || item.status === 'DITERIMA') && (
                          <button
                            onClick={() => handleOpenBatalModal(item)}
                            disabled={isLoading('BATAL')}
                            className="btn-action btn-batal-admin"
                            title="Batalkan Pendaftaran"
                          >
                            {isLoading('BATAL') ? <IconSpinner size={13} /> : <IconBan size={14} />}
                          </button>
                        )}

                        {/* WhatsApp - DITERIMA */}
                        {item.status === 'DITERIMA' && (
                          <button
                            onClick={() => openWA(item, 'DITERIMA')}
                            className="btn-action btn-wa"
                            title="Kirim Pesan WhatsApp (Diterima)"
                          >
                            <IconWhatsApp size={14} />
                          </button>
                        )}

                        {/* WhatsApp - DITOLAK */}
                        {item.status === 'DITOLAK' && (
                          <button
                            onClick={() => openWA(item, 'DITOLAK')}
                            className="btn-action btn-wa"
                            title="Kirim Pesan WhatsApp (Ditolak)"
                          >
                            <IconWhatsApp size={14} />
                          </button>
                        )}

                        {/* Hapus */}
                        <button
                          onClick={() => hapusPendaftar(item)}
                          disabled={isLoading('hapus')}
                          className="btn-action btn-hapus"
                          title="Hapus Permanen"
                        >
                          {isLoading('hapus') ? <IconSpinner size={13} /> : <IconTrash size={14} />}
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

      {/* Modal Alasan Penolakan (TolakModal) */}
      {showTolakModal && tolakTarget && (
        <div className="modal-overlay-spmb" onClick={e => e.target === e.currentTarget && setShowTolakModal(false)}>
          <div className="modal-card-spmb modal-detail" style={{ maxWidth: '520px' }}>
            <button onClick={() => setShowTolakModal(false)} className="modal-close-spmb" aria-label="Tutup">
              <IconX size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconX size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Tolak Pendaftaran</h3>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {tolakTarget.nama_lengkap} ({tolakTarget.registration_id})
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmTolak} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Pilih Alasan Cepat (Opsional):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {quickRejectReasons.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCatatanTolak(r)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: catatanTolak === r ? '#fee2e2' : '#f8fafc',
                        color: catatanTolak === r ? '#dc2626' : '#475569',
                        fontWeight: catatanTolak === r ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="catatan_tolak" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Catatan / Alasan Penolakan untuk Wali Murid:
                </label>
                <textarea
                  id="catatan_tolak"
                  rows={3}
                  value={catatanTolak}
                  onChange={(e) => setCatatanTolak(e.target.value)}
                  placeholder="Tuliskan catatan atau penjelasan detail alasan penolakan..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontFamily: 'Inter, sans-serif',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Catatan ini akan tersimpan di <code>catatan_admin</code> dan otomatis tampil di halaman Cek Status wali murid.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowTolakModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === tolakTarget.id + 'DITOLAK'}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {actionLoading === tolakTarget.id + 'DITOLAK' ? <IconSpinner size={14} /> : <IconX size={14} />}
                  <span>Konfirmasi Tolak</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Alasan Pembatalan Admin (AdminBatalModal) */}
      {showBatalModal && batalTarget && (
        <div className="modal-overlay-spmb" onClick={e => e.target === e.currentTarget && setShowBatalModal(false)}>
          <div className="modal-card-spmb modal-detail" style={{ maxWidth: '520px' }}>
            <button onClick={() => setShowBatalModal(false)} className="modal-close-spmb" aria-label="Tutup">
              <IconX size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#f3f4f6', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconBan size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Batalkan Pendaftaran</h3>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {batalTarget.nama_lengkap} ({batalTarget.registration_id})
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmBatal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="alasan_batal_select" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Kategori Alasan Pembatalan:
                </label>
                <select
                  id="alasan_batal_select"
                  value={alasanBatal}
                  onChange={(e) => setAlasanBatal(e.target.value as AlasanBatal)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontFamily: 'Inter, sans-serif',
                    background: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="PINDAH_DOMISILI">Pindah Domisili</option>
                  <option value="DITERIMA_SEKOLAH_LAIN">Diterima di Sekolah Lain</option>
                  <option value="KENDALA_BIAYA">Kendala Biaya</option>
                  <option value="LAINNYA">Lainnya / Permintaan Orang Tua</option>
                </select>
              </div>

              <div>
                <label htmlFor="catatan_batal_admin" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Catatan Admin (Opsional):
                </label>
                <textarea
                  id="catatan_batal_admin"
                  rows={3}
                  value={catatanBatalAdmin}
                  onChange={(e) => setCatatanBatalAdmin(e.target.value)}
                  placeholder="Contoh: Dibatalkan atas permintaan wali murid via WhatsApp / telepon..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontFamily: 'Inter, sans-serif',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Kategori akan disimpan ke <code>alasan_batal</code> dan keterangan disimpan ke <code>catatan_admin</code>.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowBatalModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === batalTarget.id + 'BATAL'}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#6b7280',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {actionLoading === batalTarget.id + 'BATAL' ? <IconSpinner size={14} /> : <IconBan size={14} />}
                  <span>Konfirmasi Pembatalan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedItem && (
        <div className="modal-overlay-spmb" onClick={e => e.target === e.currentTarget && setShowDetail(false)}>
          <div className="modal-card-spmb modal-detail">
            <button onClick={() => setShowDetail(false)} className="modal-close-spmb" aria-label="Tutup">
              <IconX size={18} />
            </button>
            <h3>Detail Pendaftar</h3>
            <div className="detail-grid">
              {[
                ['ID Registrasi', selectedItem.registration_id],
                ['Nama Lengkap', selectedItem.nama_lengkap],
                ['Tempat Lahir', selectedItem.tempat_lahir],
                ['Tanggal Lahir', new Date(selectedItem.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })],
                ['Nomor WhatsApp', selectedItem.nomor_wa],
                ['Tahun Ajaran', selectedItem.tahun_ajaran],
                ['Status', selectedItem.status],
                ...(selectedItem.alasan_batal ? [['Alasan Batal', getAlasanBatalLabel(selectedItem.alasan_batal as any)]] : []),
                ...(selectedItem.catatan_batal ? [['Catatan Batal (User)', selectedItem.catatan_batal]] : []),
                ...(selectedItem.catatan_admin ? [['Catatan Admin', selectedItem.catatan_admin]] : []),
                ['Tanggal Daftar', new Date(selectedItem.created_at).toLocaleString('id-ID')],
              ].map(([l, v]) => (
                <div key={l} className="detail-row">
                  <span className="detail-label">{l}</span>
                  <span className="detail-value">{v}</span>
                </div>
              ))}
            </div>
            <div className="detail-files">
              <a href={selectedItem.foto_kk_url} target="_blank" rel="noopener" className="btn-file">
                <IconFileText size={15} />
                <span>Lihat Foto Kartu Keluarga</span>
              </a>
              <a href={selectedItem.foto_akta_url} target="_blank" rel="noopener" className="btn-file">
                <IconFileText size={15} />
                <span>Lihat Foto Akta Kelahiran</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
