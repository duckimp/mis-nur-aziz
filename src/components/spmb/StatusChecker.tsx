import { useState, useEffect, useCallback } from 'react';
import KartuBukti from './KartuBukti';
import BatalModal from './BatalModal';
import {
  IconSearch,
  IconCheckCircle,
  IconClock,
  IconXCircle,
  IconBan,
  IconAlertTriangle,
  IconPin,
  IconSpinner,
} from './SPMBIcons';

interface Pendaftar {
  id: string;
  registration_id: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  status: 'PENDING' | 'DITERIMA' | 'DITOLAK' | 'BATAL';
  alasan_batal?: string;
  catatan_admin?: string;
  tahun_ajaran: string;
  created_at: string;
}

const statusConfig = {
  PENDING: {
    label: 'Menunggu Verifikasi',
    color: '#d97706',
    bg: '#fef3c7',
    border: '#fcd34d',
    renderIcon: () => <IconClock size={24} />,
  },
  DITERIMA: {
    label: 'Diterima',
    color: '#059669',
    bg: '#d1fae5',
    border: '#6ee7b7',
    renderIcon: () => <IconCheckCircle size={24} />,
  },
  DITOLAK: {
    label: 'Tidak Diterima',
    color: '#dc2626',
    bg: '#fee2e2',
    border: '#fca5a5',
    renderIcon: () => <IconXCircle size={24} />,
  },
  BATAL: {
    label: 'Dibatalkan',
    color: '#6b7280',
    bg: '#f3f4f6',
    border: '#d1d5db',
    renderIcon: () => <IconBan size={24} />,
  },
};

export default function StatusChecker() {
  const [inputId, setInputId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendaftar, setPendaftar] = useState<Pendaftar | null>(null);
  const [showBatalModal, setShowBatalModal] = useState(false);
  const [batalSuccess, setBatalSuccess] = useState(false);

  const fetchStatus = useCallback(async (idToFetch: string) => {
    const id = idToFetch.trim().toUpperCase();
    if (!id) {
      setError('Masukkan Nomor Registrasi terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError('');
    setPendaftar(null);
    setBatalSuccess(false);

    try {
      const res = await fetch(`/api/spmb/cek-status?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nomor Registrasi tidak ditemukan.');
      setPendaftar(data);
      // Sinkronkan tag spmb_id ke OneSignal untuk menerima notifikasi personal
      if (data?.registration_id && typeof window !== "undefined") {
        const win = window as any;
        if (win.OneSignal?.User?.addTag) {
          win.OneSignal.User.addTag("spmb_id", data.registration_id);
        } else {
          win.OneSignalDeferred = win.OneSignalDeferred || [];
          win.OneSignalDeferred.push((OneSignal: any) => {
            OneSignal.User?.addTag?.("spmb_id", data.registration_id);
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-read ?id= from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlId = params.get('id');
      if (urlId) {
        setInputId(urlId.toUpperCase());
        fetchStatus(urlId.toUpperCase());
      }
    }
  }, [fetchStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputId.trim()) {
      // Update browser URL query param without full page reload
      const newUrl = `${window.location.pathname}?id=${encodeURIComponent(inputId.trim().toUpperCase())}`;
      window.history.replaceState(null, '', newUrl);
      fetchStatus(inputId);
    }
  };

  const handleBatalSuccess = () => {
    setShowBatalModal(false);
    setBatalSuccess(true);
    if (pendaftar) {
      setPendaftar({ ...pendaftar, status: 'BATAL' });
    }
  };

  const cfg = pendaftar ? statusConfig[pendaftar.status] : null;

  return (
    <div className="status-checker">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="search-form-spmb">
        <div className="search-wrapper">
          <input
            type="text"
            value={inputId}
            onChange={(e) => setInputId(e.target.value.toUpperCase())}
            placeholder="Contoh: SPMB-2027-001"
            className="search-input-spmb"
            maxLength={25}
            aria-label="Nomor Registrasi SPMB"
          />
          <button type="submit" disabled={loading} className="search-btn-spmb">
            {loading ? (
              <IconSpinner size={16} />
            ) : (
              <>
                <IconSearch size={16} />
                <span>Cek Status</span>
              </>
            )}
          </button>
        </div>
        {error && (
          <div className="search-error">
            <IconAlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
      </form>

      {batalSuccess && (
        <div className="batal-success-banner">
          <IconCheckCircle size={18} />
          <span>Pendaftaran berhasil dibatalkan. Data Anda telah diperbarui.</span>
        </div>
      )}

      {/* Result Card */}
      {pendaftar && cfg && (
        <div className="result-card">
          {/* Status Banner */}
          <div
            className="status-banner"
            style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
          >
            <span className="status-icon">{cfg.renderIcon()}</span>
            <div>
              <div className="status-label">Status Pendaftaran</div>
              <div className="status-value">{cfg.label}</div>
            </div>
          </div>

          {pendaftar.catatan_admin && (
            <div className="admin-note">
              <div className="admin-note-header">
                <IconPin size={15} />
                <strong>Catatan dari Sekolah:</strong>
              </div>
              <p>{pendaftar.catatan_admin}</p>
            </div>
          )}

          {/* Data Pendaftar */}
          <div className="pendaftar-info">
            <div className="info-row">
              <span className="info-label">ID Registrasi</span>
              <span className="info-value reg-id-text">{pendaftar.registration_id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Nama Murid</span>
              <span className="info-value"><strong>{pendaftar.nama_lengkap}</strong></span>
            </div>
            <div className="info-row">
              <span className="info-label">Tempat, Tgl Lahir</span>
              <span className="info-value">
                {pendaftar.tempat_lahir}, {new Date(pendaftar.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Tahun Ajaran</span>
              <span className="info-value">{pendaftar.tahun_ajaran}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Tanggal Daftar</span>
              <span className="info-value">
                {new Date(pendaftar.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {pendaftar.status === 'BATAL' && pendaftar.alasan_batal && (
              <div className="info-row">
                <span className="info-label">Alasan Batal</span>
                <span className="info-value">
                  {{ PINDAH_DOMISILI: 'Pindah Domisili', DITERIMA_SEKOLAH_LAIN: 'Diterima di Sekolah Lain', KENDALA_BIAYA: 'Kendala Biaya', LAINNYA: 'Lainnya' }[pendaftar.alasan_batal] || pendaftar.alasan_batal}
                </span>
              </div>
            )}
          </div>

          {/* Kartu Bukti - show untuk PENDING dan DITERIMA */}
          {(pendaftar.status === 'PENDING' || pendaftar.status === 'DITERIMA') && (
            <KartuBukti pendaftar={pendaftar} />
          )}

          {/* Aksi Pembatalan */}
          {(pendaftar.status === 'PENDING') && (
            <div className="batal-section">
              <button
                onClick={() => setShowBatalModal(true)}
                className="btn-batal"
              >
                <IconBan size={15} />
                <span>Batalkan Pendaftaran</span>
              </button>
              <p className="batal-note">Pendaftaran yang sudah diterima tidak dapat dibatalkan secara mandiri.</p>
            </div>
          )}
        </div>
      )}

      {showBatalModal && pendaftar && (
        <BatalModal
          registrationId={pendaftar.registration_id}
          namaMurid={pendaftar.nama_lengkap}
          onClose={() => setShowBatalModal(false)}
          onSuccess={handleBatalSuccess}
        />
      )}
    </div>
  );
}
