import { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import {
  IconFileText,
  IconDownload,
  IconSchool,
  IconCheckCircle,
  IconClock,
  IconBan,
  IconXCircle,
} from './SPMBIcons';

interface Pendaftar {
  id: string;
  registration_id: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  status: 'PENDING' | 'DITERIMA' | 'DITOLAK' | 'BATAL';
  tahun_ajaran: string;
  created_at: string;
}

interface Props {
  pendaftar: Pendaftar;
}

export default function KartuBukti({ pendaftar }: Props) {
  const kartuRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Link verifikasi resmi real-time
  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/spmb/cek-status?id=${encodeURIComponent(pendaftar.registration_id)}`
    : `https://mis-nur-aziz.vercel.app/spmb/cek-status?id=${encodeURIComponent(pendaftar.registration_id)}`;

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#065f46',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Gagal generate QR Code:', err));
  }, [verifyUrl]);

  const handleDownload = async () => {
    if (!kartuRef.current || downloading) return;
    setDownloading(true);
    try {
      const node = kartuRef.current;
      const rect = node.getBoundingClientRect();
      const width = Math.round(rect.width || 460);
      const height = Math.round(rect.height || 560);

      // Pastikan style terisolasi tanpa margin offset saat di-capture
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 3, // Kualitas HD 3x
        backgroundColor: '#ffffff',
        width: width,
        height: height,
        canvasWidth: width * 3,
        canvasHeight: height * 3,
        style: {
          margin: '0',
          marginLeft: '0',
          marginRight: '0',
          marginTop: '0',
          marginBottom: '0',
          transform: 'none',
          left: '0',
          top: '0',
          position: 'static',
          boxSizing: 'border-box',
        },
      });
      const link = document.createElement('a');
      link.download = `kartu-bukti-${pendaftar.registration_id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Gagal download kartu:', err);
      alert('Gagal mengunduh kartu. Silakan coba kembali.');
    } finally {
      setDownloading(false);
    }
  };

  const isDiterima = pendaftar.status === 'DITERIMA';
  const statusLabel = isDiterima ? 'DITERIMA' : pendaftar.status === 'PENDING' ? 'DALAM PROSES' : pendaftar.status;
  const statusColor = isDiterima ? '#059669' : pendaftar.status === 'PENDING' ? '#d97706' : '#dc2626';
  const statusBg = isDiterima ? '#d1fae5' : pendaftar.status === 'PENDING' ? '#fef3c7' : '#fee2e2';

  return (
    <div className="kartu-bukti-wrapper" style={{ marginTop: '24px' }}>
      <div className="kartu-title-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <IconFileText size={20} />
        <h4 className="kartu-title" style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
          Kartu Bukti Pendaftaran Digital
        </h4>
      </div>

      {/* Outer wrapper yang memusatkan kartu di layar */}
      <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto', paddingBottom: '8px' }}>
        <div
          ref={kartuRef}
          className="kartu-bukti-card-export"
          style={{
            width: '460px',
            minWidth: '460px',
            maxWidth: '460px',
            margin: '0',
            padding: '0',
            background: '#ffffff',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          {/* Header Kartu */}
          <div
            style={{
              background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0,
                }}
              >
                <IconSchool size={26} />
              </div>
              <div>
                <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '17px', letterSpacing: '-0.01em' }}>
                  MIS Nur Aziz
                </div>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', fontWeight: 500 }}>
                  Kartu Bukti SPMB {pendaftar.tahun_ajaran}
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '5px 12px',
                borderRadius: '20px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {statusLabel}
            </div>
          </div>

          {/* Body Kartu */}
          <div style={{ padding: '22px 24px', background: '#ffffff' }}>
            {/* Box Nomor Registrasi */}
            <div
              style={{
                background: statusBg,
                border: `2px dashed ${statusColor}`,
                borderRadius: '12px',
                padding: '12px 16px',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Nomor Registrasi Calon Murid
              </div>
              <div
                style={{
                  color: statusColor,
                  fontWeight: 800,
                  fontSize: '22px',
                  letterSpacing: '0.08em',
                  fontFamily: 'monospace',
                  marginTop: '2px',
                }}
              >
                {pendaftar.registration_id}
              </div>
            </div>

            {/* Tabel Data Siswa */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {[
                  ['Nama Lengkap', pendaftar.nama_lengkap],
                  ['Tempat Lahir', pendaftar.tempat_lahir],
                  [
                    'Tanggal Lahir',
                    new Date(pendaftar.tanggal_lahir).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }),
                  ],
                  ['Tahun Ajaran', pendaftar.tahun_ajaran],
                  [
                    'Tanggal Daftar',
                    new Date(pendaftar.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }),
                  ],
                  ['Status Seleksi', statusLabel],
                ].map(([label, value], idx) => (
                  <tr key={label} style={{ borderBottom: idx === 5 ? 'none' : '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 0', color: '#64748b', width: '38%', fontWeight: 500 }}>
                      {label}
                    </td>
                    <td style={{ padding: '7px 0', color: '#0f172a', fontWeight: 600 }}>
                      : {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer dengan Real Scannable QR Code */}
          <div
            style={{
              padding: '14px 24px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#047857' }}>
                Verifikasi Keaslian Dokumen
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', lineHeight: 1.4, marginTop: '2px' }}>
                Scan QR untuk memverifikasi data resmi di web SPMB MIS Nur Aziz.
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', fontFamily: 'monospace' }}>
                mis-nur-aziz.vercel.app
              </div>
            </div>

            {/* QR Code Container */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: '#ffffff',
                padding: '6px',
                borderRadius: '10px',
                border: '1.5px solid #a7f3d0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                flexShrink: 0,
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code Verifikasi"
                  style={{ width: '72px', height: '72px', display: 'block' }}
                />
              ) : (
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: '#94a3b8',
                  }}
                >
                  Memuat QR...
                </div>
              )}
              <span style={{ fontSize: '8px', color: '#047857', fontWeight: 700, marginTop: '3px' }}>
                SCAN VERIFIKASI
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn-download-kartu"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #059669, #047857)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: downloading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
            transition: 'transform 0.15s ease, opacity 0.15s ease',
            opacity: downloading ? 0.7 : 1,
          }}
        >
          <IconDownload size={18} />
          <span>{downloading ? 'Memproses Gambar HD...' : 'Download Kartu Bukti (PNG)'}</span>
        </button>
      </div>
    </div>
  );
}

