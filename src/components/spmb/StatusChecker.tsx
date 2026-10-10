import { useState, useEffect, useCallback, useRef } from 'react';
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
  const currentYear = new Date().getFullYear();
  const [yearPart, setYearPart] = useState('');
  const [seqPart, setSeqPart] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendaftar, setPendaftar] = useState<Pendaftar | null>(null);
  const [showBatalModal, setShowBatalModal] = useState(false);
  const [batalSuccess, setBatalSuccess] = useState(false);

  const yearInputRef = useRef<HTMLInputElement>(null);
  const seqInputRef = useRef<HTMLInputElement>(null);

  // Helper untuk parsing ID utuh (contoh: SPMB-2027-001 atau 2027-001 atau 001)
  const parseAndSetId = useCallback((raw: string) => {
    const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const parts = clean.split('-');

    if (parts.length >= 3) {
      // SPMB-2027-001
      setYearPart(parts[1] || String(currentYear));
      setSeqPart(parts[2] || '');
      return `SPMB-${parts[1]}-${parts[2]}`;
    } else if (parts.length === 2) {
      // 2027-001
      setYearPart(parts[0] || String(currentYear));
      setSeqPart(parts[1] || '');
      return `SPMB-${parts[0]}-${parts[1]}`;
    } else if (clean.startsWith('SPMB') && clean.length > 4) {
      // SPMB2027001
      const numOnly = clean.replace('SPMB', '');
      const yr = numOnly.slice(0, 4) || String(currentYear);
      const sq = numOnly.slice(4) || '';
      setYearPart(yr);
      setSeqPart(sq);
      return `SPMB-${yr}-${sq}`;
    } else if (/^\d{5,}$/.test(clean)) {
      // 2027001
      const yr = clean.slice(0, 4);
      const sq = clean.slice(4);
      setYearPart(yr);
      setSeqPart(sq);
      return `SPMB-${yr}-${sq}`;
    } else if (/^\d{1,4}$/.test(clean)) {
      // Hanya nomor urut misal: 1 atau 001
      const padSeq = clean.padStart(3, '0');
      setSeqPart(padSeq);
      return `SPMB-${yearPart || currentYear}-${padSeq}`;
    }

    return null;
  }, [currentYear, yearPart]);

  const fetchStatus = useCallback(async (fullId: string) => {
    const id = fullId.trim().toUpperCase();
    if (!id || id === 'SPMB--' || id.endsWith('-')) {
      setError('Masukkan nomor urut pendaftaran.');
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

      // Sinkronkan login external_id & tag spmb_id ke OneSignal
      if (data?.registration_id && typeof window !== 'undefined') {
        const win = window as any;
        const regId = data.registration_id;
        const bindDevice = async (os: any) => {
          try {
            if (os.login) await os.login(regId);
            if (os.User?.addTag) await os.User.addTag('spmb_id', regId);
            console.log('[OneSignal] Sinkronisasi akun & tag sukses:', regId);
          } catch (e) {
            console.info('[OneSignal] Sinkronisasi error:', e);
          }
        };

        if (win.OneSignal) {
          bindDevice(win.OneSignal);
        } else {
          win.OneSignalDeferred = win.OneSignalDeferred || [];
          win.OneSignalDeferred.push(bindDevice);
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
        const parsed = parseAndSetId(urlId);
        if (parsed) {
          fetchStatus(parsed);
        } else {
          fetchStatus(urlId);
        }
      }
    }
  }, [fetchStatus, parseAndSetId]);

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYearPart(val);
    if (val.length === 4) {
      seqInputRef.current?.focus();
    }
  };

  const handleSeqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
    setSeqPart(val);
  };

  const handleSeqKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !seqPart) {
      yearInputRef.current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted) {
      e.preventDefault();
      const parsed = parseAndSetId(pasted);
      if (parsed) {
        const newUrl = `${window.location.pathname}?id=${encodeURIComponent(parsed)}`;
        window.history.replaceState(null, '', newUrl);
        fetchStatus(parsed);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seqPart.trim()) {
      setError('Silakan masukkan nomor urut pendaftaran Anda.');
      seqInputRef.current?.focus();
      return;
    }

    // Format nomor urut (pad minimal 3 digit misal "1" -> "001")
    const formattedSeq = seqPart.length < 3 ? seqPart.padStart(3, '0') : seqPart;
    const fullId = `SPMB-${yearPart || currentYear}-${formattedSeq}`;

    const newUrl = `${window.location.pathname}?id=${encodeURIComponent(fullId)}`;
    window.history.replaceState(null, '', newUrl);
    fetchStatus(fullId);
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
      {/* Search Form PIN/Segmented Style */}
      <form onSubmit={handleSubmit} className="search-form-spmb">
        <div className="pin-search-container">
          <label className="pin-search-label">
            <span>Nomor Registrasi SPMB</span>
            <span className="pin-helper-text">Cukup ketik angka tahun & nomor urut</span>
          </label>

          <div className="pin-input-group" onPaste={handlePaste}>
            {/* Read-Only SPMB Badge Prefix */}
            <div className="pin-prefix-badge" title="Format Awalan Resmi">
              <span className="pin-badge-text">SPMB</span>
            </div>

            <span className="pin-separator">-</span>

            {/* Year Input (4 Digits) */}
            <div className="pin-field-wrap">
              <input
                ref={yearInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={yearPart}
                onChange={handleYearChange}
                placeholder="2027"
                className="pin-box pin-box-year"
                aria-label="Tahun Registrasi"
              />
              <span className="pin-sub-label">Tahun</span>
            </div>

            <span className="pin-separator">-</span>

            {/* Sequence Input (3-4 Digits) */}
            <div className="pin-field-wrap">
              <input
                ref={seqInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
                value={seqPart}
                onChange={handleSeqChange}
                onKeyDown={handleSeqKeyDown}
                placeholder="001"
                className="pin-box pin-box-seq"
                aria-label="Nomor Urut Pendaftaran"
                autoFocus
              />
              <span className="pin-sub-label">No. Urut</span>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="pin-submit-btn">
              {loading ? (
                <IconSpinner size={18} />
              ) : (
                <>
                  <IconSearch size={18} />
                  <span>Cek Status</span>
                </>
              )}
            </button>
          </div>
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
