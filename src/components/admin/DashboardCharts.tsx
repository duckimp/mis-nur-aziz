import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Newspaper, Image, Users, LayoutGrid, Loader2, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  news: number;
  gallery: number;
  users: number;
  galleryByCategory: Record<string, number>;
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const S = {
  page: { display: 'flex', flexDirection: 'column' as const, gap: '1.5rem' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1.25rem',
  },
  statCard: (accent: string) => ({
    background: '#ffffff',
    borderRadius: '16px',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9',
    borderLeft: `4px solid ${accent}`,
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default',
  }),
  iconBox: (bg: string, color: string) => ({
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: bg,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }),
  statLabel: {
    fontSize: '0.78rem',
    color: '#64748b',
    fontWeight: 500,
    margin: '0 0 0.2rem',
  },
  statValue: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
    lineHeight: 1,
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.25rem',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9',
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #f1f5f9',
  },
  spinner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '3rem',
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
};

// ─── StatCard Component ───────────────────────────────────────────────────────
const StatCard = ({
  label, value, icon, accent, iconBg, iconColor, loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  iconBg: string;
  iconColor: string;
  loading: boolean;
}) => (
  <div style={S.statCard(accent)}>
    <div style={S.iconBox(iconBg, iconColor)}>{icon}</div>
    <div>
      <p style={S.statLabel}>{label}</p>
      {loading
        ? <p style={{ ...S.statValue, fontSize: '1rem', color: '#94a3b8' }}>—</p>
        : <p style={S.statValue}>{value.toLocaleString('id-ID')}</p>
      }
    </div>
  </div>
);

// ─── DashboardCharts ──────────────────────────────────────────────────────────
export const DashboardCharts = () => {
  const [stats, setStats] = useState<Stats>({
    news: 0,
    gallery: 0,
    users: 0,
    galleryByCategory: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Parallel fetch all counts
      const [
        { count: newsCount },
        { count: galleryCount },
        { count: usersCount },
        { data: galleryRows },
      ] = await Promise.all([
        supabase.from('news').select('*', { count: 'exact', head: true }),
        supabase.from('gallery').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('gallery').select('category'),
      ]);

      // Count gallery by category
      const byCat: Record<string, number> = {};
      for (const row of galleryRows ?? []) {
        const cat = row.category || 'Lainnya';
        byCat[cat] = (byCat[cat] ?? 0) + 1;
      }

      setStats({
        news: newsCount ?? 0,
        gallery: galleryCount ?? 0,
        users: usersCount ?? 0,
        galleryByCategory: byCat,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Bar Chart: Ringkasan Konten ──
  const barData = {
    labels: ['Berita', 'Galeri', 'Admin'],
    datasets: [
      {
        label: 'Jumlah',
        data: [stats.news, stats.gallery, stats.users],
        backgroundColor: [
          'rgba(5, 150, 105, 0.85)',
          'rgba(59, 130, 246, 0.85)',
          'rgba(168, 85, 247, 0.85)',
        ],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.parsed.y} item`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0 },
        grid: { color: '#f1f5f9' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  // ── Doughnut Chart: Kategori Galeri ──
  const categoryLabels = Object.keys(stats.galleryByCategory);
  const categoryValues = Object.values(stats.galleryByCategory);

  const doughnutData = {
    labels: categoryLabels.length ? categoryLabels : ['Belum ada data'],
    datasets: [
      {
        data: categoryValues.length ? categoryValues : [1],
        backgroundColor: [
          'rgba(5, 150, 105, 0.85)',
          'rgba(59, 130, 246, 0.85)',
          'rgba(249, 115, 22, 0.85)',
          'rgba(168, 85, 247, 0.85)',
          'rgba(236, 72, 153, 0.85)',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { padding: 16, font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed} foto`,
        },
      },
    },
  };

  return (
    <div style={S.page}>
      {/* ── Stat Cards ── */}
      <div className="stats-grid">
        <StatCard
          label="Total Berita"
          value={stats.news}
          icon={<Newspaper size={22} />}
          accent="#059669"
          iconBg="#dcfce7"
          iconColor="#059669"
          loading={loading}
        />
        <StatCard
          label="Total Foto Galeri"
          value={stats.gallery}
          icon={<Image size={22} />}
          accent="#3b82f6"
          iconBg="#dbeafe"
          iconColor="#3b82f6"
          loading={loading}
        />
        <StatCard
          label="Kategori Galeri"
          value={Object.keys(stats.galleryByCategory).length}
          icon={<LayoutGrid size={22} />}
          accent="#f97316"
          iconBg="#ffedd5"
          iconColor="#f97316"
          loading={loading}
        />
        <StatCard
          label="Total Admin"
          value={stats.users}
          icon={<Users size={22} />}
          accent="#8b5cf6"
          iconBg="#ede9fe"
          iconColor="#8b5cf6"
          loading={loading}
        />
      </div>

      {/* ── Charts ── */}
      {loading ? (
        <div style={{ ...S.card, ...S.spinner }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Memuat data dari database...</span>
        </div>
      ) : (
        <div className="charts-grid">
          {/* Bar Chart */}
          <div style={S.card}>
            <h3 style={S.cardTitle}>
              <TrendingUp size={18} color="#059669" />
              Ringkasan Konten
            </h3>
            <Bar data={barData} options={barOptions} />
          </div>

          {/* Doughnut Chart */}
          <div style={S.card}>
            <h3 style={S.cardTitle}>
              <LayoutGrid size={18} color="#059669" />
              Kategori Galeri
            </h3>
            {categoryLabels.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontSize: '0.875rem' }}>
                Belum ada foto di galeri.
              </div>
            ) : (
              <div style={{ maxWidth: '320px', margin: '0 auto' }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.25rem;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .charts-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
