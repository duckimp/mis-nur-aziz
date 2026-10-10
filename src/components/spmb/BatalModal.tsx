import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  IconBan,
  IconX,
  IconAlertTriangle,
  IconSpinner,
} from './SPMBIcons';

interface Props {
  registrationId: string;
  namaMurid: string;
  onClose: () => void;
  onSuccess: () => void;
}

const alasanOptions = [
  { value: 'PINDAH_DOMISILI', label: 'Pindah Domisili' },
  { value: 'DITERIMA_SEKOLAH_LAIN', label: 'Diterima di Sekolah Lain' },
  { value: 'KENDALA_BIAYA', label: 'Kendala Biaya' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

export default function BatalModal({ registrationId, namaMurid, onClose, onSuccess }: Props) {
  const [alasan, setAlasan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alasan) { setError('Pilih alasan pembatalan terlebih dahulu.'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/spmb/batal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: registrationId, alasan_batal: alasan, catatan_batal: catatan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membatalkan');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Render modal ke document.body via Portal agar position:fixed selalu ke viewport
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  if (!mounted) return null;

  return createPortal(
    <div className="modal-overlay-spmb" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card-spmb">
        <button onClick={onClose} className="modal-close-spmb" aria-label="Tutup">
          <IconX size={18} />
        </button>
        <div className="modal-icon-spmb">
          <IconBan size={28} />
        </div>
        <h3>Batalkan Pendaftaran</h3>
        <p className="modal-desc">
          Anda akan membatalkan pendaftaran atas nama <strong>{namaMurid}</strong> ({registrationId}).
          Tindakan ini tidak dapat dibatalkan.
        </p>

        {error && (
          <div className="modal-error-spmb">
            <IconAlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field-group-spmb" style={{ marginBottom: '1rem' }}>
            <label>Alasan Pembatalan <span className="required">*</span></label>
            <div className="alasan-options">
              {alasanOptions.map((opt) => (
                <label key={opt.value} className={`alasan-option ${alasan === opt.value ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="alasan"
                    value={opt.value}
                    checked={alasan === opt.value}
                    onChange={() => setAlasan(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="field-group-spmb">
            <label htmlFor="catatan_batal">Catatan Tambahan (opsional)</label>
            <textarea
              id="catatan_batal"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tuliskan keterangan tambahan jika ada..."
              rows={3}
              maxLength={500}
            />
            <span className="field-hint">{catatan.length}/500 karakter</span>
          </div>

          <div className="modal-actions-spmb">
            <button type="button" onClick={onClose} className="btn-spmb btn-outline-spmb">
              Kembali
            </button>
            <button type="submit" disabled={loading} className="btn-spmb btn-danger-spmb">
              {loading ? (
                <>
                  <IconSpinner size={15} />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <IconBan size={15} />
                  <span>Konfirmasi Pembatalan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  , document.body);
}
