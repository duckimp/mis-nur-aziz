import { useState } from 'react';
import {
  IconInfo,
  IconSave,
  IconCheckCircle,
  IconAlertTriangle,
  IconSpinner,
  IconBell,
} from './SPMBIcons';

interface Settings {
  is_open: boolean;
  tahun_ajaran: string;
  kuota: number | null;
}

interface Props {
  initialSettings: Settings;
}

export default function SPMBPengaturan({ initialSettings }: Props) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = async () => {
    const newOpen = !settings.is_open;
    setSettings(prev => ({ ...prev, is_open: newOpen }));
    await saveSettings({ ...settings, is_open: newOpen });
  };

  const saveSettings = async (data: Settings) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/spmb/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan pengaturan.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings(settings);
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || 'Gagal mengirim test notifikasi');
      setMessage({ type: 'success', text: '🔔 Test push notifikasi berhasil dikirim ke semua perangkat yang berlangganan!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal mengirim test notifikasi.' });
    } finally {
      setTestingPush(false);
    }
  };

  return (
    <div className="admin-spmb-settings">
      {message && (
        <div className={`admin-message ${message.type}`}>
          {message.type === 'success' ? <IconCheckCircle size={16} /> : <IconAlertTriangle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="settings-info-banner">
        <div className="info-icon">
          <IconInfo size={20} />
        </div>
        <div className="info-text">
          <strong>Penyimpanan Arsip Aman:</strong> Mengganti Tahun Ajaran Aktif tidak akan menghapus data pendaftar lama.
          Semua data pendaftar dari tahun ajaran sebelumnya tetap tersimpan utuh dan dapat diakses/difilter di menu <strong>Pendaftar</strong> dan <strong>Laporan</strong>.
        </div>
      </div>

      {/* Toggle ON/OFF */}
      <div className="settings-card">
        <div className="settings-toggle-row">
          <div>
            <h3>Status Pendaftaran SPMB</h3>
            <p>Aktifkan untuk membuka formulir pendaftaran, nonaktifkan jika periode SPMB telah selesai.</p>
          </div>
          <div className="toggle-wrapper">
            <button
              onClick={handleToggle}
              disabled={saving}
              className={`toggle-btn ${settings.is_open ? 'on' : 'off'}`}
              role="switch"
              aria-checked={settings.is_open}
            >
              <span className="toggle-knob"></span>
            </button>
            <span className={`toggle-label ${settings.is_open ? 'open' : 'closed'}`}>
              <span className={`status-dot ${settings.is_open ? 'dot-open' : 'dot-closed'}`}></span>
              <span>{settings.is_open ? 'DIBUKA' : 'DITUTUP'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Form Pengaturan */}
      <div className="settings-card">
        <h3>Konfigurasi Periode Aktif</h3>
        <form onSubmit={handleSave} className="settings-form">
          <div className="field-group-admin">
            <label htmlFor="tahun_ajaran">Tahun Ajaran Aktif</label>
            <input
              id="tahun_ajaran"
              type="text"
              value={settings.tahun_ajaran}
              onChange={e => setSettings(prev => ({ ...prev, tahun_ajaran: e.target.value }))}
              placeholder="Contoh: 2026/2027"
              required
            />
            <span className="field-hint">
              Format: YYYY/YYYY (misal: 2026/2027). Pendaftar baru yang mengisi formulir akan otomatis terdaftar pada tahun ajaran ini.
            </span>
          </div>

          <div className="field-group-admin">
            <label htmlFor="kuota">Kuota Pendaftar (kosongkan untuk unlimited)</label>
            <input
              id="kuota"
              type="number"
              min="0"
              value={settings.kuota ?? ''}
              onChange={e => setSettings(prev => ({ ...prev, kuota: e.target.value ? parseInt(e.target.value) : null }))}
              placeholder="Kosongkan untuk unlimited"
            />
            <span className="field-hint">
              Jika diisi, sistem akan otomatis menutup pendaftaran ketika jumlah pendaftar yang diterima mencapai batas kuota ini.
            </span>
          </div>

          <button type="submit" disabled={saving} className="btn-admin-primary">
            {saving ? (
              <>
                <IconSpinner size={15} />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <IconSave size={15} />
                <span>Simpan Pengaturan</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Uji Push Notifikasi */}
      <div className="settings-card">
        <h3>Uji Coba Push Notifikasi</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', lineHeight: '1.5' }}>
          Gunakan tombol di bawah untuk menguji apakah push notifikasi berhasil dikirim ke perangkat Android yang sudah mengaktifkan izin notifikasi atau memasang PWA.
        </p>
        <button
          type="button"
          onClick={handleTestPush}
          disabled={testingPush}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          {testingPush ? (
            <>
              <IconSpinner size={16} />
              <span>Mengirim Notifikasi...</span>
            </>
          ) : (
            <>
              <IconBell size={16} />
              <span>Kirim Test Notifikasi Sekarang</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
