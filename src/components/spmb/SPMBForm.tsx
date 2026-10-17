import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import imageCompression from 'browser-image-compression';
import { SPMBFormSchema } from '../../lib/spmb';
import {
  IconCheck,
  IconCopy,
  IconCamera,
  IconLock,
  IconPartyPopper,
  IconArrowRight,
  IconInfo,
  IconAlertTriangle,
  IconSearch,
  IconX,
  IconSpinner,
  IconBell,
} from './SPMBIcons';

interface Settings {
  is_open: boolean;
  tahun_ajaran: string;
  kuota: number | null;
}

interface Props {
  settings: Settings;
}

interface FileInfo {
  name: string;
  sizeFormatted: string;
}

type UploadStage = 'COMPRESS_KK' | 'COMPRESS_AKTA' | 'UPLOADING' | 'SAVING' | 'DONE';

export default function SPMBForm({ settings }: Props) {
  const [step, setStep] = useState<'form' | 'uploading' | 'success'>('form');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [countryCode, setCountryCode] = useState("62");
  const [phoneNum, setPhoneNum] = useState("");

  // Progress tracking states
  const [uploadStage, setUploadStage] = useState<UploadStage>('COMPRESS_KK');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [stageMessage, setStageMessage] = useState<string>('');

  const [kkPreview, setKkPreview] = useState<string | null>(null);
  const [kkInfo, setKkInfo] = useState<FileInfo | null>(null);

  const [aktaPreview, setAktaPreview] = useState<string | null>(null);
  const [aktaInfo, setAktaInfo] = useState<FileInfo | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleImageSelect = (
    file: File,
    setPreview: (val: string | null) => void,
    setInfo: (info: FileInfo | null) => void
  ) => {
    setInfo({
      name: file.name,
      sizeFormatted: formatFileSize(file.size),
    });
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEnableNotification = async () => {
    if (typeof window === 'undefined') return;

    const win = window as any;

    // Cek apakah permission sudah diberikan sebelumnya
    if (win.Notification && win.Notification.permission === 'granted') {
      setNotifEnabled(true);
      return;
    }

    // Cek apakah permission sudah ditolak (tidak bisa minta lagi)
    if (win.Notification && win.Notification.permission === 'denied') {
      alert('Notifikasi diblokir oleh browser. Silakan aktifkan manual di pengaturan browser Anda (ikon kunci/gembok di address bar).');
      return;
    }

    try {
      // Akses window.OneSignal langsung jika sudah init (cara yang benar di v16)
      if (win.OneSignal && win.OneSignal.Notifications) {
        const perm = await win.OneSignal.Notifications.requestPermission();
        if (perm) {
          // Tag user dengan ID registrasi agar bisa kirim notifikasi personal
          if (registrationId && win.OneSignal.User && win.OneSignal.User.addTag) {
            await win.OneSignal.User.addTag('spmb_id', registrationId);
          }
          setNotifEnabled(true);
        }
      } else {
        // Fallback: OneSignal belum selesai init, tunggu via Deferred
        win.OneSignalDeferred = win.OneSignalDeferred || [];
        win.OneSignalDeferred.push(async (OneSignal: any) => {
          try {
            const perm = await OneSignal.Notifications.requestPermission();
            if (perm) {
              if (registrationId && OneSignal.User?.addTag) {
                await OneSignal.User.addTag('spmb_id', registrationId);
              }
              setNotifEnabled(true);
            }
          } catch (e) {
            console.info('OneSignal permission via deferred:', e);
          }
        });
      }
    } catch (e) {
      console.info('Notif enable error:', e);
    }
  };

  if (!settings.is_open) {
    return (
      <div className="spmb-closed-notice">
        <div className="closed-icon">
          <IconLock size={40} />
        </div>
        <h2>Pendaftaran Belum Dibuka</h2>
        <p>Pendaftaran SPMB Tahun Ajaran {settings.tahun_ajaran} saat ini belum dibuka atau telah ditutup.</p>
        <a href="/spmb" className="btn-spmb btn-secondary-spmb">Kembali ke Info SPMB</a>
      </div>
    );
  }

  if (step === 'success' && registrationId) {
    return (
      <div className="spmb-success-card">
        <div className="success-icon-badge">
          <IconPartyPopper size={36} />
        </div>
        <h2 className="success-title">Pendaftaran Berhasil Dikirim!</h2>
        <p className="success-subtitle">
          Selamat, data pendaftaran calon murid telah berhasil diterima oleh sistem SPMB MIS Nur Aziz.
        </p>

        {/* Highlighted Registration ID Card */}
        <div className="reg-id-card">
          <span className="reg-id-label">NOMOR REGISTRASI PENDAFTARAN</span>
          <div className="reg-id-highlight">{registrationId}</div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(registrationId);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            }}
            className={`btn-copy-id ${copied ? 'copied' : ''}`}
          >
            {copied ? (
              <>
                <IconCheck size={16} />
                <span>Nomor Registrasi Tersalin!</span>
              </>
            ) : (
              <>
                <IconCopy size={16} />
                <span>Salin Nomor Registrasi</span>
              </>
            )}
          </button>
        </div>

        {/* Soft Notification Prompt */}
        <div
          style={{
            background: notifEnabled ? '#ecfdf5' : '#f0fdf4',
            border: `1.5px solid ${notifEnabled ? '#a7f3d0' : '#86efac'}`,
            borderRadius: '12px',
            padding: '14px 16px',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: notifEnabled ? '#059669' : '#16a34a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconBell size={18} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#065f46' }}>
                {notifEnabled ? 'Notifikasi Pengumuman Aktif!' : 'Terima Notifikasi Hasil Seleksi di HP'}
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>
                {notifEnabled
                  ? 'Kami akan mengirimkan kabar kelulusan langsung ke perangkat ini.'
                  : 'Dapatkan pemberitahuan otomatis saat status diverifikasi sekolah.'}
              </div>
            </div>
          </div>

          {!notifEnabled && (
            <button
              type="button"
              onClick={handleEnableNotification}
              style={{
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Aktifkan
            </button>
          )}
        </div>

        {/* Warning Callout Box */}
        <div className="success-warning-box">
          <div className="warning-icon-wrap">
            <IconAlertTriangle size={20} />
          </div>
          <div className="warning-text">
            <strong>Penting: Harap Simpan Nomor Registrasi Ini</strong>
            <p>
              Gunakan ID ini untuk mengecek status penerimaan pendaftaran, melihat catatan verifikasi sekolah, dan mencetak Kartu Bukti Digital.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="success-action-btns">
          <a href={`/spmb/cek-status?id=${registrationId}`} className="btn-spmb btn-primary-spmb btn-with-icon">
            <IconSearch size={16} />
            <span>Cek Status & Kartu Bukti</span>
          </a>
          <button
            type="button"
            onClick={() => {
              setStep('form');
              setRegistrationId(null);
              setKkPreview(null);
              setKkInfo(null);
              setAktaPreview(null);
              setAktaInfo(null);
              setProgressPercent(0);
              formRef.current?.reset();
            }}
            className="btn-spmb btn-secondary-spmb"
          >
            Daftar Calon Murid Baru
          </button>
        </div>
      </div>
    );
  }


  const compressImage = async (
    file: File,
    stage: 'KK' | 'AKTA',
    onProgress: (percent: number) => void
  ): Promise<File> => {
    const options = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: 'image/webp',
      onProgress: (p: number) => {
        onProgress(p);
      },
    };
    try {
      const compressedBlob = await imageCompression(file, options);
      const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
      return new File([compressedBlob], newFileName, { type: 'image/webp' });
    } catch (err) {
      console.warn('Kompresi gagal, menggunakan file asli:', err);
      return file;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (countryCode === "62") {
      if (val.startsWith("62")) val = val.slice(2);
      if (val.startsWith("0")) val = val.replace(/^0+/, "");
    }
    setPhoneNum(val);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);

    const nama = (formData.get('nama_lengkap') as string) || '';
    const tempat = (formData.get('tempat_lahir') as string) || '';
    const tgl = (formData.get('tanggal_lahir') as string) || '';
    const wa = phoneNum.trim() ? (countryCode + phoneNum.trim()) : ((formData.get('nomor_wa') as string) || '');
    const kk = formData.get('foto_kk') as File;
    const akta = formData.get('foto_akta') as File;

    // Validate Zod
    const validation = SPMBFormSchema.safeParse({
      nama_lengkap: nama,
      tempat_lahir: tempat,
      tanggal_lahir: tgl,
      nomor_wa: wa,
    });

    const errors: Record<string, string> = {};
    if (!validation.success) {
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
    }

    if (!kk || kk.size === 0) errors.foto_kk = 'Foto Kartu Keluarga wajib diupload';
    if (!akta || akta.size === 0) errors.foto_akta = 'Foto Akta Kelahiran wajib diupload';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Start upload process with visible progress
    setStep('uploading');
    setUploadStage('COMPRESS_KK');
    setProgressPercent(5);
    setStageMessage('Mengompresi & konversi Foto Kartu Keluarga (KK) ke WebP...');

    try {
      // Step 1: Compress KK (0% -> 35%)
      const compressedKK = await compressImage(kk, 'KK', (p) => {
        const pct = Math.round(5 + (p * 0.3));
        setProgressPercent(pct);
        setStageMessage(`Mengompresi Foto KK (${p}%)...`);
      });

      // Step 2: Compress Akta (35% -> 70%)
      setUploadStage('COMPRESS_AKTA');
      setStageMessage('Mengompresi & konversi Foto Akta Kelahiran ke WebP...');
      const compressedAkta = await compressImage(akta, 'AKTA', (p) => {
        const pct = Math.round(35 + (p * 0.35));
        setProgressPercent(pct);
        setStageMessage(`Mengompresi Foto Akta (${p}%)...`);
      });

      // Step 3: Upload to server (70% -> 90%)
      setUploadStage('UPLOADING');
      setProgressPercent(75);
      setStageMessage('Mengunggah berkas terkompresi ke Cloud Storage...');

      const uploadData = new FormData();
      uploadData.append('nama_lengkap', nama);
      uploadData.append('tempat_lahir', tempat);
      uploadData.append('tanggal_lahir', tgl);
      uploadData.append('nomor_wa', wa);
      uploadData.append('foto_kk', compressedKK);
      uploadData.append('foto_akta', compressedAkta);

      // Step 4: Saving database (90% -> 100%)
      setUploadStage('SAVING');
      setProgressPercent(90);
      setStageMessage('Menerbitkan Nomor Registrasi & menyimpan data pendaftaran...');

      const res = await fetch('/api/spmb/daftar', {
        method: 'POST',
        body: uploadData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal mengirim pendaftaran');

      setProgressPercent(100);
      setUploadStage('DONE');
      setStageMessage('Pendaftaran berhasil disimpan!');

      const regId = result.registration_id;
      setTimeout(() => {
        setRegistrationId(regId);
        setStep('success');
      }, 600);

      // Otomatis bind perangkat ke Nomor Registrasi di OneSignal (login & addTag)
      if (typeof window !== "undefined") {
        const win = window as any;
        const bindDevice = async (os: any) => {
          try {
            if (os.login) await os.login(regId);
            if (os.User?.addTag) await os.User.addTag("spmb_id", regId);
            console.log("[OneSignal] Perangkat otomatis terhubung ke:", regId);
          } catch (e) {
            console.info("[OneSignal] Bind error:", e);
          }
        };

        if (win.OneSignal) {
          bindDevice(win.OneSignal);
        } else {
          win.OneSignalDeferred = win.OneSignalDeferred || [];
          win.OneSignalDeferred.push(bindDevice);
        }
      }

      // Prompt OneSignal notification
      setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).OneSignal) {
          (window as any).OneSignalDeferred?.push(async (OneSignal: any) => {
            await OneSignal.Slidedown.promptPush();
          });
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat upload. Silakan coba lagi.');
      setStep('form');
    }
  };

  if (step === 'uploading') {
    return createPortal(
      <div className="spmb-upload-overlay">
        <div className="spmb-uploading-card">
        <div className="upload-header-box">
          <div className="upload-spinner-ring">
            <IconSpinner size={32} />
          </div>
          <h3>Memproses Pendaftaran SPMB</h3>
          <p className="upload-current-message">{stageMessage}</p>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="progress-percent-label">{progressPercent}%</div>
        </div>

        {/* Multi-step Checklist */}
        <div className="upload-steps-checklist">
          <div className={`step-check-item ${progressPercent >= 35 ? 'done' : uploadStage === 'COMPRESS_KK' ? 'active' : ''}`}>
            <span className="step-check-icon">
              {progressPercent >= 35 ? <IconCheck size={14} /> : uploadStage === 'COMPRESS_KK' ? <IconSpinner size={13} /> : '1'}
            </span>
            <span>Kompresi Foto KK ke format WebP</span>
          </div>

          <div className={`step-check-item ${progressPercent >= 70 ? 'done' : uploadStage === 'COMPRESS_AKTA' ? 'active' : ''}`}>
            <span className="step-check-icon">
              {progressPercent >= 70 ? <IconCheck size={14} /> : uploadStage === 'COMPRESS_AKTA' ? <IconSpinner size={13} /> : '2'}
            </span>
            <span>Kompresi Foto Akta Kelahiran ke format WebP</span>
          </div>

          <div className={`step-check-item ${progressPercent >= 90 ? 'done' : uploadStage === 'UPLOADING' ? 'active' : ''}`}>
            <span className="step-check-icon">
              {progressPercent >= 90 ? <IconCheck size={14} /> : uploadStage === 'UPLOADING' ? <IconSpinner size={13} /> : '3'}
            </span>
            <span>Unggah berkas ke Supabase Storage</span>
          </div>

          <div className={`step-check-item ${progressPercent >= 100 ? 'done' : uploadStage === 'SAVING' ? 'active' : ''}`}>
            <span className="step-check-icon">
              {progressPercent >= 100 ? <IconCheck size={14} /> : uploadStage === 'SAVING' ? <IconSpinner size={13} /> : '4'}
            </span>
            <span>Simpan data & terbitkan ID Registrasi</span>
          </div>
        </div>

        <div className="upload-note-box">
          <IconInfo size={15} />
          <span>Foto otomatis dioptimasi dan dikonversi ke WebP untuk menghemat kuota dan mempercepat transmisi. Mohon jangan menutup halaman ini.</span>
        </div>
        </div>
      </div>
    , document.body);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="spmb-form" noValidate>
      <div className="form-header">
        <div className="form-badge">Formulir Pendaftaran</div>
        <p className="form-subtitle">Tahun Ajaran <strong>{settings.tahun_ajaran}</strong></p>
      </div>

      {error && (
        <div className="form-error-global">
          <IconAlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="form-section">
        <h3 className="form-section-title">Data Calon Murid</h3>

        <div className="field-group-spmb">
          <label htmlFor="nama_lengkap">Nama Lengkap Murid <span className="required">*</span></label>
          <input
            id="nama_lengkap"
            name="nama_lengkap"
            type="text"
            placeholder="Masukkan nama lengkap sesuai akta kelahiran"
            className={fieldErrors.nama_lengkap ? 'error' : ''}
          />
          {fieldErrors.nama_lengkap && <span className="field-error">{fieldErrors.nama_lengkap}</span>}
        </div>

        <div className="form-row">
          <div className="field-group-spmb">
            <label htmlFor="tempat_lahir">Tempat Lahir <span className="required">*</span></label>
            <input
              id="tempat_lahir"
              name="tempat_lahir"
              type="text"
              placeholder="Contoh: Probolinggo"
              className={fieldErrors.tempat_lahir ? 'error' : ''}
            />
            {fieldErrors.tempat_lahir && <span className="field-error">{fieldErrors.tempat_lahir}</span>}
          </div>

          <div className="field-group-spmb">
            <label htmlFor="tanggal_lahir">Tanggal Lahir <span className="required">*</span></label>
            <input
              id="tanggal_lahir"
              name="tanggal_lahir"
              type="date"
              max={new Date().toISOString().split('T')[0]}
              className={fieldErrors.tanggal_lahir ? 'error' : ''}
            />
            {fieldErrors.tanggal_lahir && <span className="field-error">{fieldErrors.tanggal_lahir}</span>}
          </div>
        </div>

        <div className="field-group-spmb">
          <label htmlFor="nomor_wa">Nomor WhatsApp Orang Tua / Wali <span className="required">*</span></label>
          <div className="phone-input-group">
            <div className="country-code-select-wrap">
              <select
                id="country_code"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="country-code-select"
                aria-label="Kode Negara"
              >
                <option value="62">🇮🇩 +62</option>
                <option value="60">🇲🇾 +60</option>
                <option value="65">🇸🇬 +65</option>
                <option value="673">🇧🇳 +673</option>
                <option value="966">🇸🇦 +966</option>
              </select>
            </div>
            <div className="phone-number-field-wrap">
              <input
                id="nomor_wa"
                name="nomor_wa"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={phoneNum}
                onChange={handlePhoneChange}
                placeholder="85694841807"
                className={`phone-number-input ${fieldErrors.nomor_wa ? "error" : ""}`}
                required
              />
            </div>
          </div>
          {fieldErrors.nomor_wa && <span className="field-error">{fieldErrors.nomor_wa}</span>}
          <span className="field-hint">Pilih kode negara & ketik nomor WhatsApp tanpa angka 0 di depan (contoh: 85694841807).</span>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Upload Berkas Persyaratan</h3>
        <div className="upload-note-info">
          <IconInfo size={16} />
          <span>Gambar akan otomatis dikompresi & dikonversi ke format WebP sebelum diunggah ke server.</span>
        </div>

        <div className="form-row">
          {/* KK Upload */}
          <div className="field-group-spmb">
            <label htmlFor="foto_kk">Foto Kartu Keluarga (KK) <span className="required">*</span></label>
            <div className={`upload-area ${fieldErrors.foto_kk ? 'error' : ''}`}>
              {kkPreview ? (
                <div className="upload-preview">
                  <img src={kkPreview} alt="Preview KK" />
                  <div className="preview-meta">
                    <span className="preview-name">{kkInfo?.name}</span>
                    <span className="preview-size">{kkInfo?.sizeFormatted}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setKkPreview(null);
                      setKkInfo(null);
                    }}
                    className="remove-preview"
                    aria-label="Hapus foto KK"
                    title="Ganti Foto KK"
                  >
                    <IconX size={14} />
                  </button>
                </div>
              ) : (
                <label htmlFor="foto_kk" className="upload-label">
                  <span className="upload-icon">
                    <IconCamera size={26} />
                  </span>
                  <span className="upload-title">Pilih Foto Kartu Keluarga</span>
                  <span className="upload-hint">JPG, PNG, WEBP • Maksimal 5MB</span>
                </label>
              )}
              <input
                id="foto_kk"
                name="foto_kk"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSelect(file, setKkPreview, setKkInfo);
                }}
              />
            </div>
            {fieldErrors.foto_kk && <span className="field-error">{fieldErrors.foto_kk}</span>}
          </div>

          {/* Akta Upload */}
          <div className="field-group-spmb">
            <label htmlFor="foto_akta">Foto Akta Kelahiran <span className="required">*</span></label>
            <div className={`upload-area ${fieldErrors.foto_akta ? 'error' : ''}`}>
              {aktaPreview ? (
                <div className="upload-preview">
                  <img src={aktaPreview} alt="Preview Akta" />
                  <div className="preview-meta">
                    <span className="preview-name">{aktaInfo?.name}</span>
                    <span className="preview-size">{aktaInfo?.sizeFormatted}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAktaPreview(null);
                      setAktaInfo(null);
                    }}
                    className="remove-preview"
                    aria-label="Hapus foto Akta"
                    title="Ganti Foto Akta"
                  >
                    <IconX size={14} />
                  </button>
                </div>
              ) : (
                <label htmlFor="foto_akta" className="upload-label">
                  <span className="upload-icon">
                    <IconCamera size={26} />
                  </span>
                  <span className="upload-title">Pilih Foto Akta Kelahiran</span>
                  <span className="upload-hint">JPG, PNG, WEBP • Maksimal 5MB</span>
                </label>
              )}
              <input
                id="foto_akta"
                name="foto_akta"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSelect(file, setAktaPreview, setAktaInfo);
                }}
              />
            </div>
            {fieldErrors.foto_akta && <span className="field-error">{fieldErrors.foto_akta}</span>}
          </div>
        </div>
      </div>

      <div className="form-footer">
        <p className="form-disclaimer">
          Dengan mengklik tombol kirim, Anda menyetujui bahwa semua data dan berkas yang dimasukkan adalah benar.
        </p>
        <button type="submit" className="btn-spmb btn-primary-spmb btn-submit">
          <span>Kirim Pendaftaran</span>
          <IconArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
