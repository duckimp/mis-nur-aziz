import React from 'react';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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

export const DashboardCharts = () => {
  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Pengunjung Website',
        data: [120, 190, 300, 500, 200, 300],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
      },
    ],
  };

  const barData = {
    labels: ['Berita', 'Galeri', 'Guru', 'Siswa'],
    datasets: [
      {
        label: 'Total Data',
        data: [12, 45, 20, 150],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      },
    ],
  };

  const doughnutData = {
    labels: ['KBM', 'Eskul', 'Wisuda', 'Lainnya'],
    datasets: [
      {
        data: [30, 20, 15, 35],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Statistik Pengunjung</h3>
        <Line data={lineData} />
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Data Konten</h3>
        <Bar data={barData} />
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm md:col-span-2 flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-4 w-full">Kategori Galeri</h3>
        <div className="w-full max-w-md">
          <Doughnut data={doughnutData} />
        </div>
      </div>
    </div>
  );
};
