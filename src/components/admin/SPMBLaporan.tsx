import { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { getAlasanBatalLabel } from '../../lib/spmb';
import {
  IconCalendar,
  IconChart,
  IconPieChart,
  IconBan,
  IconInbox,
  IconSpinner,
} from './SPMBIcons';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface Pendaftar {
  status: string;
  alasan_batal?: string;
  tahun_ajaran?: string;
}

export default function SPMBLaporan() {
  const [allData, setAllData] = useState<Pendaftar[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/spmb/pendaftar').then(r => r.json()),
      fetch('/api/spmb/settings').then(r => r.json()),
    ])
      .then(([pendaftarData, settingsData]) => {
        if (Array.isArray(pendaftarData)) {
          setAllData(pendaftarData);
          const years = new Set<string>();
          if (settingsData?.tahun_ajaran) years.add(settingsData.tahun_ajaran);
          pendaftarData.forEach(p => { if (p.tahun_ajaran) years.add(p.tahun_ajaran); });
          setAvailableYears(Array.from(years).sort().reverse());
        }
      })
      .catch(() => setAllData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        <IconSpinner size={20} />
        <span>Memuat data laporan...</span>
      </div>
    );
  }

  // Filter data by selected year
  const data = selectedYear === 'ALL'
    ? allData
    : allData.filter(d => d.tahun_ajaran === selectedYear);

  const total = data.length;
  const counts = {
    PENDING: data.filter(d => d.status === 'PENDING').length,
    DITERIMA: data.filter(d => d.status === 'DITERIMA').length,
    DITOLAK: data.filter(d => d.status === 'DITOLAK').length,
    BATAL: data.filter(d => d.status === 'BATAL').length,
  };

  const batalData = data.filter(d => d.status === 'BATAL' && d.alasan_batal);
  const alasanCounts: Record<string, number> = {};
  batalData.forEach(d => {
    if (d.alasan_batal) alasanCounts[d.alasan_batal] = (alasanCounts[d.alasan_batal] || 0) + 1;
  });

  const statusColors = {
    PENDING: '#d97706',
    DITERIMA: '#059669',
    DITOLAK: '#dc2626',
    BATAL: '#6b7280',
  };

  const doughnutData = {
    labels: ['Pending', 'Diterima', 'Ditolak', 'Batal'],
    datasets: [{
      data: [counts.PENDING, counts.DITERIMA, counts.DITOLAK, counts.BATAL],
      backgroundColor: ['#fbbf24', '#10b981', '#ef4444', '#9ca3af'],
      borderWidth: 0,
    }],
  };

  const alasanLabels = Object.keys(alasanCounts).map(k => getAlasanBatalLabel(k as any));
  const barData = {
    labels: alasanLabels,
    datasets: [{
      label: 'Jumlah',
      data: Object.values(alasanCounts),
      backgroundColor: '#6b7280',
      borderRadius: 6,
    }],
  };

  return (
    <div className="laporan-container">
      {/* Year Filter Header */}
      <div className="laporan-header-filter">
        <div>
          <h2 className="laporan-title">Rekapitulasi & Statistik SPMB</h2>
          <p className="laporan-subtitle">
            {selectedYear === 'ALL'
              ? 'Menampilkan akumulasi seluruh tahun ajaran'
              : `Menampilkan data khusus Tahun Ajaran ${selectedYear}`}
          </p>
        </div>
        <div className="filter-tahun-wrapper">
          <div className="select-with-icon">
            <IconCalendar size={15} className="select-lead-icon" />
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
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
      </div>

      {/* Summary Cards */}
      <div className="laporan-summary">
        <div className="laporan-card total">
          <div className="laporan-num">{total}</div>
          <div className="laporan-lbl">Total Pendaftar</div>
        </div>
        {(Object.entries(counts) as [keyof typeof counts, number][]).map(([status, count]) => (
          <div key={status} className="laporan-card" style={{ borderTop: `4px solid ${statusColors[status]}` }}>
            <div className="laporan-num" style={{ color: statusColors[status] }}>{count}</div>
            <div className="laporan-lbl">{status}</div>
            <div className="laporan-pct">
              {total > 0 ? `${Math.round((count / total) * 100)}%` : '-'}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="laporan-charts">
        <div className="chart-card">
          <div className="card-header-icon">
            <IconPieChart size={18} />
            <h3>Distribusi Status Pendaftar</h3>
          </div>
          {total > 0 ? (
            <div className="chart-wrapper">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'bottom' } },
                  cutout: '65%',
                }}
              />
            </div>
          ) : (
            <div className="no-data">
              <IconInbox size={32} />
              <p>Belum ada data pendaftar {selectedYear !== 'ALL' ? `di TA ${selectedYear}` : ''}</p>
            </div>
          )}
        </div>

        <div className="chart-card">
          <div className="card-header-icon">
            <IconBan size={18} />
            <h3>Analisis Alasan Pembatalan</h3>
          </div>
          {batalData.length > 0 ? (
            <>
              <div className="chart-wrapper">
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                  }}
                />
              </div>
              <div className="alasan-breakdown">
                {Object.entries(alasanCounts).map(([alasan, count]) => (
                  <div key={alasan} className="alasan-row">
                    <span>{getAlasanBatalLabel(alasan as any)}</span>
                    <div className="alasan-bar-wrap">
                      <div
                        className="alasan-bar-fill"
                        style={{ width: `${(count / batalData.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="alasan-pct">{Math.round((count / batalData.length) * 100)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-data">
              <IconInbox size={32} />
              <p>Tidak ada data pembatalan {selectedYear !== 'ALL' ? `di TA ${selectedYear}` : ''}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
