import React, { useState, useEffect, useRef } from 'react';
import {
  IconGraduationCap,
  IconEdit,
  IconSearch,
  IconCheckCircle,
  IconAlertTriangle,
  IconUser,
  IconMosque,
  IconBuilding,
  IconTrophy,
  IconMapPin,
  IconTag,
  IconWhatsApp,
  IconShare,
} from './AlumniIcons';

interface AlumniItem {
  id: string;
  nama_lengkap: string;
  nisn?: string;
  tahun_lulus: number;
  jenis_kelamin: 'L' | 'P';
  tipe_sekolah_lanjutan: string;
  nama_sekolah_lanjutan: string;
  kabupaten_kota: string;
  jalur_masuk?: string;
  kategori_prestasi?: string;
  rincian_prestasi?: string;
  kesan_pesan?: string;
  created_at?: string;
}

const TIPE_SEKOLAH_META: Record<string, { label: string; badgeClass: string; renderIcon: () => React.ReactNode }> = {
  mts_negeri: { label: 'MTs Negeri', badgeClass: 'badge-mts', renderIcon: () => <IconMosque size={13} /> },
  mts_swasta: { label: 'MTs Swasta', badgeClass: 'badge-mts', renderIcon: () => <IconMosque size={13} /> },
  smp_negeri: { label: 'SMP Negeri', badgeClass: 'badge-smp', renderIcon: () => <IconBuilding size={13} /> },
  smp_swasta: { label: 'SMP Swasta', badgeClass: 'badge-smp', renderIcon: () => <IconBuilding size={13} /> },
  pesantren: { label: 'Pondok Pesantren', badgeClass: 'badge-pesantren', renderIcon: () => <IconGraduationCap size={13} /> },
  lainnya: { label: 'Lainnya', badgeClass: 'badge-lainnya', renderIcon: () => <IconTag size={13} /> },
};

const KATEGORI_PRESTASI_LIST = [
  'Tahfidz Al-Qur\'an',
  'Juara Kelas / Lulusan Terbaik',
  'Juara Olimpiade Sains / Matematika',
  'Juara MTQ / MHQ / Pildacil',
  'Juara Pidato / Bahasa Arab / Inggris',
  'Juara Olahraga (Futsal, Bulutangkis, Silat, dll)',
  'Juara Seni / Kaligrafi / Hadroh',
  'Kepanduan Pramuka',
  'Lainnya (Tulis Sendiri di bawah)',
];

const ADMIN_WA_NUMBER = '6285233783768';

export default function AlumniPublicPortal() {
  const [activeTab, setActiveTab] = useState<'form' | 'edit' | 'directory'>('form');
  const editFormRef = useRef<HTMLFormElement | null>(null);

  // Phone input handlers with auto-strip 0 and 62
  const handlePhoneChange = (val: string) => {
    let cleaned = val.replace(/\D/g, "");
    if (countryCode === "62") {
      if (cleaned.startsWith("62")) cleaned = cleaned.slice(2);
      if (cleaned.startsWith("0")) cleaned = cleaned.replace(/^0+/, "");
    } else {
      if (cleaned.startsWith("0")) cleaned = cleaned.replace(/^0+/, "");
    }
    setPhoneInput(cleaned);
  };

  const handleLookupPhoneChange = (val: string) => {
    let cleaned = val.replace(/\D/g, "");
    if (lookupCountryCode === "62") {
      if (cleaned.startsWith("62")) cleaned = cleaned.slice(2);
      if (cleaned.startsWith("0")) cleaned = cleaned.replace(/^0+/, "");
    } else {
      if (cleaned.startsWith("0")) cleaned = cleaned.replace(/^0+/, "");
    }
    setLookupPhone(cleaned);
  };

  const handleEditPhoneChange = (val: string) => {
    let cleaned = val.replace(/\D/g, "");
    if (editCountryCode === "62") {
      if (cleaned.startsWith("62")) cleaned = cleaned.slice(2);
      if (cleaned.startsWith("0")) cleaned = cleaned.replace(/^0+/, "");
    } else {
      if (cleaned.startsWith("0")) cleaned = cleaned.replace(/^0+/, "");
    }
    setEditPhone(cleaned);
  };

  const handleShareWhatsApp = () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "https://mis-nuraziz.sch.id/alumni";
    const shareText = "Assalamu'alaikum wr. wb. Sahabat Alumni MIS Nur Aziz, yuk luangkan waktu 1 menit untuk mengisi Formulir Tracer Study (Jejak Alumni) di tautan berikut:\n\n" + shareUrl + "\n\nData ini sangat penting bagi madrasah tercinta untuk memetakan keberhasilan studi lanjutan kita. Terima kasih!";
    window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(shareText), "_blank");
  };


  // Directory State
  const [alumniList, setAlumniList] = useState<AlumniItem[]>([]);
  const [stats, setStats] = useState({ total: 0, mts: 0, smp: 0, pesantren: 0, lainnya: 0 });
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterTipe, setFilterTipe] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingDirectory, setIsLoadingDirectory] = useState<boolean>(false);

  // Form Submission State (Tab 1: Baru)
  const currentYear = new Date().getFullYear();

  const [countryCode, setCountryCode] = useState('62');
  const [phoneInput, setPhoneInput] = useState('');
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nisn: '',
    tahun_lulus: String(currentYear),
    jenis_kelamin: 'L' as 'L' | 'P',
    tipe_sekolah_lanjutan: 'mts_negeri',
    nama_sekolah_lanjutan: '',
    kabupaten_kota: '',
    jalur_masuk: 'Reguler',
    kategori_prestasi: '',
    rincian_prestasi: '',
    kesan_pesan: '',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);
  const [submitError, setSubmitError] = useState('');

  // Edit Mandiri State (Tab 2: Opsi B)
  const [lookupYear, setLookupYear] = useState(String(currentYear));
  const [lookupNameOrNisn, setLookupNameOrNisn] = useState('');
  const [lookupCountryCode, setLookupCountryCode] = useState('62');
  const [lookupPhone, setLookupPhone] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [editTargetData, setEditTargetData] = useState<any | null>(null);

  // Edit Form Fields
  const [editFormData, setEditFormData] = useState<any | null>(null);
  const [editCountryCode, setEditCountryCode] = useState('62');
  const [editPhone, setEditPhone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState('');

  // Fetch Directory Data
  const fetchDirectory = async () => {
    setIsLoadingDirectory(true);
    try {
      const params = new URLSearchParams();
      if (filterYear !== 'all') params.append('tahun', filterYear);
      if (filterTipe !== 'all') params.append('tipe', filterTipe);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());

      const res = await fetch(`/api/alumni/public-list?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setAlumniList(json.data || []);
        if (json.stats) setStats(json.stats);
        if (json.availableYears) setAvailableYears(json.availableYears);
      }
    } catch (err) {
      console.error('Fetch directory error:', err);
    } finally {
      setIsLoadingDirectory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'directory') {
      fetchDirectory();
    }
  }, [activeTab, filterYear, filterTipe]);

  // Debounced Search for Directory
  useEffect(() => {
    if (activeTab !== 'directory') return;
    const timeout = setTimeout(() => {
      fetchDirectory();
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Handle Form Input Change
  const handleInputChange = (field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  // Submit Baru
  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setFormSubmitting(true);

    const fullWa = `${countryCode}${phoneInput.replace(/^0+/, '')}`;

    try {
      const res = await fetch('/api/alumni/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          nomor_wa: fullWa,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setSubmitError(json.error || 'Terjadi kesalahan saat menyimpan data.');
      } else {
        setSubmitSuccess({
          nama: formData.nama_lengkap,
          tahun: formData.tahun_lulus,
          sekolah: formData.nama_sekolah_lanjutan,
          tipe: formData.tipe_sekolah_lanjutan,
          wa: fullWa,
        });
        // Reset form
        setFormData({
          nama_lengkap: '',
          nisn: '',
          tahun_lulus: String(currentYear),
          jenis_kelamin: 'L',
          tipe_sekolah_lanjutan: 'mts_negeri',
          nama_sekolah_lanjutan: '',
          kabupaten_kota: '',
          jalur_masuk: 'Reguler',
          kategori_prestasi: '',
          rincian_prestasi: '',
          kesan_pesan: '',
        });
        setPhoneInput('');
      }
    } catch (err: any) {
      setSubmitError('Koneksi terputus: ' + (err.message || 'Coba lagi nanti'));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Lookup Alumni (Opsi B)
  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setIsLookingUp(true);
    setEditTargetData(null);
    setUpdateSuccess(null);

    const fullWa = `${lookupCountryCode}${lookupPhone.replace(/^0+/, '')}`;

    try {
      const res = await fetch('/api/alumni/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tahun_lulus: lookupYear,
          nama_atau_nisn: lookupNameOrNisn,
          nomor_wa: fullWa,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setLookupError(json.error || 'Data alumni tidak ditemukan.');
      } else {
        const item = json.data;
        setEditTargetData(item);
        setEditFormData({
          id: item.id,
          nama_lengkap: item.nama_lengkap,
          nisn: item.nisn || '',
          tahun_lulus: String(item.tahun_lulus),
          jenis_kelamin: item.jenis_kelamin,
          tipe_sekolah_lanjutan: item.tipe_sekolah_lanjutan,
          nama_sekolah_lanjutan: item.nama_sekolah_lanjutan,
          kabupaten_kota: item.kabupaten_kota,
          jalur_masuk: item.jalur_masuk || 'Reguler',
          kategori_prestasi: item.kategori_prestasi || '',
          rincian_prestasi: item.rincian_prestasi || '',
          kesan_pesan: item.kesan_pesan || '',
          current_wa: item.nomor_wa,
        });

                // Parse WA number
        const rawWa = String(item.nomor_wa || "");
        if (rawWa.startsWith("62")) {
          setEditCountryCode("62");
          setEditPhone(rawWa.slice(2));
        } else if (rawWa.startsWith("966")) {
          setEditCountryCode("966");
          setEditPhone(rawWa.slice(3));
        } else {
          setEditCountryCode("62");
          setEditPhone(rawWa);
        }

        setTimeout(() => {
          if (editFormRef.current) {
            editFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 150);
      }
    } catch (err: any) {
      setLookupError('Terjadi kesalahan jaringan: ' + err.message);
    } finally {
      setIsLookingUp(false);
    }
  };

  // Submit Update Alumni
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess(null);
    setIsUpdating(true);

    const fullNewWa = `${editCountryCode}${editPhone.replace(/^0+/, '')}`;

    try {
      const res = await fetch('/api/alumni/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          nomor_wa: fullNewWa,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setUpdateError(json.error || 'Gagal memperbarui data.');
      } else {
        setUpdateSuccess(json.message || 'Data alumni berhasil diperbarui dan dikirim ke admin!');
        setEditTargetData(null);
        setEditFormData(null);
      }
    } catch (err: any) {
      setUpdateError('Gagal mengirim pembaruan: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="alumni-portal-container">
      
      {/* ── Top Share Banner ── */}
      <div className="portal-share-banner">
        <div className="share-banner-info">
          <span className="share-badge">Ayo Berbagi</span>
          <p className="share-text">Bantu sebarkan tracer study ini ke grup WhatsApp teman seangkatan atau wali murid!</p>
        </div>
        <button
          type="button"
          className="btn-share-wa"
          onClick={handleShareWhatsApp}
          title="Bagikan ke WhatsApp"
        >
          <IconWhatsApp size={16} />
          <span>Bagikan ke WhatsApp</span>
        </button>
      </div>

      {/* ── Top Tabs Navigation ── */}
      <div className="portal-tabs-nav">
        <button
          type="button"
          className={`portal-tab-btn ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => { setActiveTab('form'); setSubmitSuccess(null); }}
        >
          <IconEdit size={16} />
          <span>Isi Data Baru</span>
        </button>

        <button
          type="button"
          className={`portal-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => { setActiveTab('edit'); setUpdateSuccess(null); }}
        >
          <IconSearch size={16} />
          <span>Cek & Edit Data</span>
        </button>

        <button
          type="button"
          className={`portal-tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          <IconGraduationCap size={16} />
          <span>Direktori Lulusan</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: FORM PENGISIAN BARU
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'form' && (
        <div className="tab-content-panel">
          {submitSuccess ? (
            <div className="portal-success-card animate-fade-in">
              <div className="success-icon-badge">
                <IconCheckCircle size={32} />
              </div>
              <h3 className="success-title">Alhamdulillah, Data Berhasil Dikirim!</h3>
              <p className="success-desc">
                Terima kasih <strong>{submitSuccess.nama}</strong> (Alumni Angkatan {submitSuccess.tahun}) telah berpartisipasi dalam Tracer Study MIS Nur Aziz. Data Anda sedang ditinjau oleh pihak madrasah untuk diverifikasi ke direktori lulusan.
              </p>

              <div className="success-info-box">
                <div className="info-row">
                  <span>Studi Lanjutan:</span>
                  <strong>{submitSuccess.sekolah}</strong>
                </div>
                <div className="info-row">
                  <span>Nomor Kontak:</span>
                  <strong>+{submitSuccess.wa}</strong>
                </div>
              </div>

              <div className="success-actions">
                <a
                  href={`https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(
                    `Assalamu'alaikum Admin MIS Nur Aziz, saya *${submitSuccess.nama}* (Alumni Angkatan ${submitSuccess.tahun}), telah mengisi data tracer study studi lanjutan ke *${submitSuccess.sekolah}*. Mohon diverifikasi. Terima kasih.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-wa-confirm"
                >
                  <IconWhatsApp size={18} />
                  <span>Kirim Konfirmasi ke WhatsApp Admin</span>
                </a>

                <button
                  type="button"
                  className="btn-link-action"
                  onClick={() => setSubmitSuccess(null)}
                >
                  ← Isi Data Lulusan Lain
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitNew} className="portal-form">
              <div className="form-intro">
                <h3 className="form-title">Formulir Penelusuran Alumni (Tracer Study)</h3>
                <p className="form-subtitle">
                  Bantu madrasah memetakan jejak keberhasilan studi lulusan MIS Nur Aziz. Data ini sangat bermanfaat bagi pengembangan sekolah dan motivasi adik-adik kelas.
                </p>
              </div>

              {submitError && (
                <div className="alert-box alert-error">
                  <IconAlertTriangle size={16} />
                  <span>{submitError}</span>
                </div>
              )}

              {/* ── Bagian 1: Identitas ── */}
              <div className="form-section-card">
                <h4 className="section-heading">1. Identitas Alumni</h4>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Nama Lengkap Alumni <span className="req">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Muhammad Fatih Al-Ayyubi"
                      value={formData.nama_lengkap}
                      onChange={e => handleInputChange('nama_lengkap', e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label>NISN <span className="opt">(Opsional jika ingat)</span></label>
                    <input
                      type="text"
                      placeholder="Contoh: 0123456789"
                      value={formData.nisn}
                      onChange={e => handleInputChange('nisn', e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label>Tahun Kelulusan / Angkatan <span className="req">*</span></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      required
                      placeholder="Contoh: 2025"
                      value={formData.tahun_lulus}
                      onChange={e => handleInputChange('tahun_lulus', e.target.value.replace(/\D/g, "").slice(0, 4))}
                    />
                  </div>

                  <div className="form-field">
                    <label>Jenis Kelamin <span className="req">*</span></label>
                    <div className="radio-group-modern">
                      <label className={`radio-pill ${formData.jenis_kelamin === 'L' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="jenis_kelamin"
                          value="L"
                          checked={formData.jenis_kelamin === 'L'}
                          onChange={() => handleInputChange('jenis_kelamin', 'L')}
                        />
                        <span>Laki-laki</span>
                      </label>
                      <label className={`radio-pill ${formData.jenis_kelamin === 'P' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="jenis_kelamin"
                          value="P"
                          checked={formData.jenis_kelamin === 'P'}
                          onChange={() => handleInputChange('jenis_kelamin', 'P')}
                        />
                        <span>Perempuan</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Nomor WhatsApp dengan Kode Negara */}
                <div className="form-field mt-3">
                  <label htmlFor="wa-input">Nomor WhatsApp Alumni / Wali Murid <span className="req">*</span></label>
                  <div className="phone-input-group">
                    <div className="country-code-select-wrap">
                      <select
                        value={countryCode}
                        onChange={e => setCountryCode(e.target.value)}
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
                        id="wa-input"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="8512345678"
                        value={phoneInput}
                        onChange={e => handlePhoneChange(e.target.value)}
                        className="phone-number-input"
                        required
                      />
                    </div>
                  </div>
                  <span className="field-hint">
                    Ketik nomor tanpa angka 0 di depan (contoh: 85694841807). Digunakan untuk silaturahmi & verifikasi mandiri jika ingin mengedit data.
                  </span>
                </div>
              </div>

              {/* ── Bagian 2: Sekolah Lanjutan ── */}
              <div className="form-section-card">
                <h4 className="section-heading">2. Studi Lanjutan</h4>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Kategori Sekolah Lanjutan <span className="req">*</span></label>
                    <select
                      value={formData.tipe_sekolah_lanjutan}
                      onChange={e => handleInputChange('tipe_sekolah_lanjutan', e.target.value)}
                    >
                      <option value="mts_negeri">MTs Negeri</option>
                      <option value="mts_swasta">MTs Swasta</option>
                      <option value="smp_negeri">SMP Negeri</option>
                      <option value="smp_swasta">SMP Swasta</option>
                      <option value="pesantren">Pondok Pesantren / Islamic Boarding</option>
                      <option value="lainnya">Lainnya (PKBM / Luar Kota)</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Jalur Penerimaan Masuk</label>
                    <select
                      value={formData.jalur_masuk}
                      onChange={e => handleInputChange('jalur_masuk', e.target.value)}
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
                    <label>Nama Sekolah / Pondok Pesantren Lanjutan <span className="req">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: MTsN 1 Kota Serang / SMPN 2 / Ponpes Darussalam"
                      value={formData.nama_sekolah_lanjutan}
                      onChange={e => handleInputChange('nama_sekolah_lanjutan', e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label>Kabupaten / Kota Lokasi Sekolah <span className="req">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kota Serang / Kab. Tangerang / Kab. Bogor"
                      value={formData.kabupaten_kota}
                      onChange={e => handleInputChange('kabupaten_kota', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ── Bagian 3: Prestasi & Kesan Pesan ── */}
              <div className="form-section-card">
                <h4 className="section-heading">3. Catatan Prestasi & Kesan Pesan</h4>
                <div className="form-field">
                  <label>Rekomendasi Kategori Prestasi</label>
                  <select
                    value={formData.kategori_prestasi}
                    onChange={e => handleInputChange('kategori_prestasi', e.target.value)}
                  >
                    <option value="">-- Pilih Kategori Prestasi (Opsional) --</option>
                    {KATEGORI_PRESTASI_LIST.map((kat, i) => (
                      <option key={i} value={kat}>{kat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field mt-2">
                  <label>Rincian Prestasi yang Pernah Diraih <span className="opt">(Input Teks Bebas)</span></label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Juara 1 MTQ Tingkat Kecamatan, Hafal Juz 30 & 29, Juara 2 Pidato Bahasa Arab di MTs..."
                    value={formData.rincian_prestasi}
                    onChange={e => handleInputChange('rincian_prestasi', e.target.value)}
                  />
                  <span className="field-hint">Tuliskan prestasi yang diraih selama di MIS Nur Aziz atau prestasi membanggakan di sekolah lanjutan saat ini.</span>
                </div>

                <div className="form-field mt-3">
                  <label>Kesan, Pesan & Doa untuk MIS Nur Aziz</label>
                  <textarea
                    rows={3}
                    placeholder="Tuliskan pesan kenangan, ucapan terima kasih kepada bapak/ibu guru, atau motivasi untuk adik-adik kelas..."
                    value={formData.kesan_pesan}
                    onChange={e => handleInputChange('kesan_pesan', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions-bar">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn-submit-tracer"
                >
                  {formSubmitting ? (
                    <>
                      <span className="spinner-dot"></span>
                      <span>Menyimpan Data...</span>
                    </>
                  ) : (
                    <>
                      <span>Kirim Data Tracer Study</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: CEK & EDIT DATA MANDIRI (OPSI B)
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'edit' && (
        <div className="tab-content-panel">
          <div className="form-intro">
            <h3 className="form-title">Cek & Edit Mandiri Data Alumni</h3>
            <p className="form-subtitle">
              Pernah mengisi tracer study tapi ada penulisan nama sekolah atau data yang keliru? Masukkan data Anda di bawah ini untuk mencari dan memperbaruinya secara mandiri.
            </p>
          </div>

          {updateSuccess && (
            <div className="alert-box alert-success animate-fade-in">
              <IconCheckCircle size={18} />
              <span>{updateSuccess}</span>
            </div>
          )}

          {/* Form Pencarian Identitas (Opsi B) */}
          <div className="portal-lookup-card">
            <h4 className="lookup-title">Verifikasi Identitas Anda</h4>
            {lookupError && (
              <div className="alert-box alert-error mb-3">
                <IconAlertTriangle size={16} />
                <span>{lookupError}</span>
              </div>
            )}
            <form onSubmit={handleLookupSubmit} className="lookup-form-grid">
              <div className="form-field">
                <label>Tahun Kelulusan <span className="req">*</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  required
                  placeholder="Contoh: 2025"
                  value={lookupYear}
                  onChange={e => setLookupYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </div>

              <div className="form-field">
                <label>Nama Lengkap atau NISN <span className="req">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ketik Nama Lengkap atau NISN Anda"
                  value={lookupNameOrNisn}
                  onChange={e => setLookupNameOrNisn(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Nomor WhatsApp Terdaftar <span className="req">*</span></label>
                <div className="phone-input-group">
                  <div className="country-code-select-wrap">
                    <select
                      value={lookupCountryCode}
                      onChange={e => setLookupCountryCode(e.target.value)}
                      className="country-code-select"
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
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      placeholder="8512345678"
                      value={lookupPhone}
                      onChange={e => handleLookupPhoneChange(e.target.value)}
                      className="phone-number-input"
                    />
                  </div>
                </div>
              </div>

              <div className="lookup-btn-wrap">
                <button
                  type="submit"
                  disabled={isLookingUp}
                  className="btn-lookup"
                >
                  <IconSearch size={16} />
                  <span>{isLookingUp ? 'Mencari Data...' : 'Cari Data Saya'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Form Edit jika Data Ditemukan */}
          {editTargetData && editFormData && (
            <form onSubmit={handleUpdateSubmit} ref={editFormRef} className="portal-form animate-fade-in mt-4">
              <div className="edit-notice-banner">
                <IconEdit size={18} />
                <div>
                  <strong>Data Ditemukan!</strong> Anda dapat mengoreksi kolom yang salah di bawah ini. Setelah disimpan, data akan ditinjau kembali oleh admin madrasah.
                </div>
              </div>

              {updateError && (
                <div className="alert-box alert-error mb-3">
                  <IconAlertTriangle size={16} />
                  <span>{updateError}</span>
                </div>
              )}

              <div className="form-section-card">
                <h4 className="section-heading">Koreksi Data Alumni</h4>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Nama Lengkap <span className="req">*</span></label>
                    <input
                      type="text"
                      required
                      value={editFormData.nama_lengkap}
                      onChange={e => setEditFormData({ ...editFormData, nama_lengkap: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label>NISN</label>
                    <input
                      type="text"
                      value={editFormData.nisn}
                      onChange={e => setEditFormData({ ...editFormData, nisn: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label>Kategori Sekolah Lanjutan <span className="req">*</span></label>
                    <select
                      value={editFormData.tipe_sekolah_lanjutan}
                      onChange={e => setEditFormData({ ...editFormData, tipe_sekolah_lanjutan: e.target.value })}
                    >
                      <option value="mts_negeri">MTs Negeri</option>
                      <option value="mts_swasta">MTs Swasta</option>
                      <option value="smp_negeri">SMP Negeri</option>
                      <option value="smp_swasta">SMP Swasta</option>
                      <option value="pesantren">Pondok Pesantren / Islamic Boarding</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Jalur Penerimaan</label>
                    <select
                      value={editFormData.jalur_masuk}
                      onChange={e => setEditFormData({ ...editFormData, jalur_masuk: e.target.value })}
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
                    <label>Nama Sekolah / Pondok Pesantren Lanjutan <span className="req">*</span></label>
                    <input
                      type="text"
                      required
                      value={editFormData.nama_sekolah_lanjutan}
                      onChange={e => setEditFormData({ ...editFormData, nama_sekolah_lanjutan: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label>Kabupaten / Kota Lokasi Sekolah <span className="req">*</span></label>
                    <input
                      type="text"
                      required
                      value={editFormData.kabupaten_kota}
                      onChange={e => setEditFormData({ ...editFormData, kabupaten_kota: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-field mt-3">
                  <label>Nomor WhatsApp</label>
                  <div className="phone-input-group">
                    <div className="country-code-select-wrap">
                      <select
                        value={editCountryCode}
                        onChange={e => setEditCountryCode(e.target.value)}
                        className="country-code-select"
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
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={editPhone}
                        onChange={e => handleEditPhoneChange(e.target.value)}
                        className="phone-number-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-field mt-3">
                  <label>Rekomendasi Kategori Prestasi</label>
                  <select
                    value={editFormData.kategori_prestasi}
                    onChange={e => setEditFormData({ ...editFormData, kategori_prestasi: e.target.value })}
                  >
                    <option value="">-- Pilih Kategori Prestasi --</option>
                    {KATEGORI_PRESTASI_LIST.map((kat, i) => (
                      <option key={i} value={kat}>{kat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field mt-2">
                  <label>Rincian Prestasi (Input Teks Bebas)</label>
                  <textarea
                    rows={2}
                    value={editFormData.rincian_prestasi}
                    onChange={e => setEditFormData({ ...editFormData, rincian_prestasi: e.target.value })}
                  />
                </div>

                <div className="form-field mt-3">
                  <label>Kesan & Pesan</label>
                  <textarea
                    rows={3}
                    value={editFormData.kesan_pesan}
                    onChange={e => setEditFormData({ ...editFormData, kesan_pesan: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions-bar">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn-submit-tracer"
                >
                  <IconCheckCircle size={18} />
                  <span>{isUpdating ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Data'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: DIREKTORI LULUSAN & STATISTIK
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'directory' && (
        <div className="tab-content-panel">
          {/* Quick Statistics Banner */}
          <div className="stats-banner-grid">
            <div className="stat-card">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total Alumni Terdata</span>
            </div>
            <div className="stat-card stat-mts">
              <span className="stat-number">{stats.mts}</span>
              <span className="stat-label">Lanjut ke MTs (Negeri/Swasta)</span>
            </div>
            <div className="stat-card stat-smp">
              <span className="stat-number">{stats.smp}</span>
              <span className="stat-label">Lanjut ke SMP (Negeri/Swasta)</span>
            </div>
            <div className="stat-card stat-pesantren">
              <span className="stat-number">{stats.pesantren}</span>
              <span className="stat-label">Pondok Pesantren</span>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="directory-filters-bar">
            <div className="search-box">
              <IconSearch size={16} />
              <input
                type="text"
                placeholder="Cari nama alumni, nama sekolah lanjutan, atau kota..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filters-dropdowns">
              <select
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="filter-select"
              >
                <option value="all">Semua Tahun Angkatan</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>Lulus {y}</option>
                ))}
              </select>

              <select
                value={filterTipe}
                onChange={e => setFilterTipe(e.target.value)}
                className="filter-select"
              >
                <option value="all">Semua Sekolah Lanjutan</option>
                <option value="mts">Semua MTs</option>
                <option value="smp">Semua SMP</option>
                <option value="pesantren">Pondok Pesantren</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Directory Content List */}
          {isLoadingDirectory ? (
            <div className="directory-loading">
              <div className="spinner-large"></div>
              <p>Memuat direktori alumni...</p>
            </div>
          ) : alumniList.length === 0 ? (
            <div className="directory-empty-card">
              <div className="empty-icon-wrap">
                <IconGraduationCap size={44} />
              </div>
              <h4>Belum Ada Data Alumni yang Ditampilkan</h4>
              <p>Data yang cocok dengan filter belum tersedia atau masih dalam proses verifikasi pihak madrasah.</p>
              <button
                type="button"
                className="btn-empty-action"
                onClick={() => { setFilterYear('all'); setFilterTipe('all'); setSearchQuery(''); }}
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="alumni-cards-grid">
              {alumniList.map((item) => {
                const meta = TIPE_SEKOLAH_META[item.tipe_sekolah_lanjutan] || {
                  label: 'Lainnya',
                  badgeClass: 'badge-lainnya',
                  renderIcon: () => <IconTag size={13} />,
                };

                return (
                  <div key={item.id} className="alumni-card">
                    <div className="card-top">
                      <div className="avatar-circle">
                        <IconUser size={22} />
                      </div>
                      <div className="student-meta">
                        <h4 className="student-name text-capitalize">{item.nama_lengkap}</h4>
                        <span className="grad-badge">Lulusan {item.tahun_lulus}</span>
                      </div>
                    </div>

                    <div className="school-info-row">
                      <span className={`school-type-pill ${meta.badgeClass}`}>
                        {meta.renderIcon()}
                        <span>{meta.label}</span>
                      </span>
                      <h5 className="next-school-name text-capitalize">{item.nama_sekolah_lanjutan}</h5>
                      <span className="school-city text-capitalize">
                        <IconMapPin size={12} />
                        <span>{item.kabupaten_kota}</span>
                      </span>
                    </div>

                    {item.jalur_masuk && item.jalur_masuk !== 'Reguler' && (
                      <div className="jalur-pill">
                        <IconTag size={12} />
                        <span>Jalur: {item.jalur_masuk}</span>
                      </div>
                    )}

                    {(item.rincian_prestasi || item.kategori_prestasi) && (
                      <div className="achievement-box">
                        <span className="achieve-title">
                          <IconTrophy size={13} />
                          <span>Prestasi:</span>
                        </span>
                        <p className="achieve-text">{item.rincian_prestasi || item.kategori_prestasi}</p>
                      </div>
                    )}

                    {item.kesan_pesan && (
                      <div className="quote-box">
                        <p className="quote-text">“{item.kesan_pesan}”</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
