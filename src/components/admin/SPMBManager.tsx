import { useState, useEffect, useCallback } from 'react';
import { generateWALink, generateWAMessage, getAlasanBatalLabel } from '../../lib/spmb';
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

type FilterStatus = 'ALL' | 'PENDING' | 'DITERIMA' | 'DITOLAK' | 'BATAL';

function StatusBadge({ status }: { status: 'PENDING' | 'DITERIMA' | 'DITOLAK' | 'BATAL' }) {
  switch (status) {
    case 'PENDING':
      return (
        <span className="status-badge-admin status-pending">
          <IconClock size={13} />
          <span>Menunggu</span>
        </span>
      );
    case 'DITERIMA':
      return (
        <span className="status-badge-admin status-diterima">
          <IconCheckCircle size={13} />
          <span>Diterima</span>
        </span>
      );
    case 'DITOLAK':
      return (
        <span className="status-badge-admin status-ditolak">
          <IconX size={13} />
          <span>Tidak Diterima</span>
        </span>
      );
    case 'BATAL':
      return (
        <span className="status-badge-admin status-batal">
          <IconBan size={13} />
          <span>Dibatalkan</span>
        </span>
      );
  }
}

export default function SPMBManager() {
  const [data, setData] = useState<Pendaftar[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [filterTahun, setFilterTahun] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Pendaftar | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch all distinct years from initial settings & all data
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const [resPendaftar, resSettings] = await Promise.all([
          fetch('/api/spmb/pendaftar'),
          fetch('/api/spmb/settings'),
        ]);
        const pendaftarData: Pendaftar[] = await resPendaftar.json();
        const settingsData = await resSettings.json();

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

  const updateStatus = async (id: string, newStatus: 'DITERIMA' | 'DITOLAK' | 'BATAL', catatan?: string) => {
    setActionLoading(id + newStatus);
    try {
      const res = await fetch('/api/spmb/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, catatan_admin: catatan }),
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
    const msg = generateWAMessage({
      type,
      nama: item.nama_lengkap,
      regId: item.registration_id,
      tahunAjaran: item.tahun_ajaran,
    });
    window.open(generateWALink(item.nomor_wa, msg), '_blank');
  };

  const counts = {
    ALL: data.length,
    PENDING: data.filter(d => d.status === 'PENDING').length,
    DITERIMA: data.filter(d => d.status === 'DITERIMA').length,
    DITOLAK: data.filter(d => d.status === 'DITOLAK').length,
    BATAL: data.filter(d => d.status === 'BATAL').length,
  };

  return (
    <div className="spmb-manager">
      {/* Toast */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === 'success' ? <IconCheckCircle size={16} /> : <IconAlertTriangle size={16} />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Controls */}
      <div className="manager-controls">
        <div className="search-control">
          <input
            type="text"
            placeholder="Cari nama atau ID registrasi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="admin-search"
          />
        </div>

        {/* Dropdown Filter Tahun Ajaran */}
        <div className="filter-tahun-wrapper">
          <div className="select-with-icon">
            <IconCalendar size={15} className="select-lead-icon" />
            <select
              id="filter-tahun"
              value={filterTahun}
              onChange={e => setFilterTahun(e.target.value)}
              className="admin-year-select"
            >
              <option value="ALL">Semua Tahun Ajaran</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>
                  TA {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={fetchData} className="btn-refresh" title="Muat Ulang">
          <IconRefresh size={15} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {(['ALL', 'PENDING', 'DITERIMA', 'DITOLAK', 'BATAL'] as FilterStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`filter-tab ${filterStatus === s ? 'active' : ''} ${s.toLowerCase()}`}
          >
            <span>{s === 'ALL' ? 'Semua' : s}</span>
            <span className="tab-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading">
          <IconSpinner size={20} />
          <span>Memuat data pendaftar...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="admin-empty">
          <IconInbox size={36} className="empty-icon" />
          <p>Tidak ada data pendaftar {filterTahun !== 'ALL' ? `untuk Tahun Ajaran ${filterTahun}` : ''}</p>
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
                          title="Lihat Detail"
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

                        {/* Tolak */}
                        {item.status === 'PENDING' && (
                          <button
                            onClick={() => updateStatus(item.id, 'DITOLAK')}
                            disabled={isLoading('DITOLAK')}
                            className="btn-action btn-tolak"
                            title="Tolak Pendaftaran"
                          >
                            {isLoading('DITOLAK') ? <IconSpinner size={13} /> : <IconX size={14} />}
                          </button>
                        )}

                        {/* Set Batal */}
                        {(item.status === 'PENDING' || item.status === 'DITERIMA') && (
                          <button
                            onClick={() => updateStatus(item.id, 'BATAL')}
                            disabled={isLoading('BATAL')}
                            className="btn-action btn-batal-admin"
                            title="Set Dibatalkan"
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
                ...(selectedItem.catatan_batal ? [['Catatan Batal', selectedItem.catatan_batal]] : []),
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
