import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminLaporan = () => {
    const [laporan, setLaporan] = useState([]);
    const [filteredLaporan, setFilteredLaporan] = useState([]);
    const [filterOutlet, setFilterOutlet] = useState('all');
    const [filterTime, setFilterTime] = useState('7 Hari Terakhir');

    useEffect(() => {
        fetch('http://localhost:5000/api/laporan')
            .then(res => res.json())
            .then(data => {
                setLaporan(data);
                setFilteredLaporan(data);
            })
            .catch(err => console.error(err));
    }, []);

    const handleFilter = () => {
        let result = laporan;

        if (filterOutlet !== 'all') {
            const outletMap = {
                'outlet_1': 'Cabang UNNES Sekaran',
                'outlet_2': 'Cabang Banaran',
                'outlet_3': 'Cabang Patemon',
                'outlet_4': 'Cabang Sampangan'
            };
            result = result.filter(item => item.outlet === outletMap[filterOutlet]);
        }

        // Mock Time Filter (Just shuffling or limiting for demo)
        if (filterTime === 'Bulan Ini (Desember)') {
            result = result.filter(item => item.tanggal.includes('Des'));
        }
        
        setFilteredLaporan(result);
    };

    const handleExport = () => {
        import('sweetalert2').then((Swal) => {
            Swal.default.fire({
                icon: 'success',
                title: 'Export Berhasil',
                text: 'Laporan telah diunduh sebagai .xlsx',
                timer: 2000,
                showConfirmButton: false
            });
        });
    };

    const barData = {
        labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
        datasets: [
            {
                label: 'Sekaran',
                data: [2500000, 2800000, 2600000, 3000000, 3500000, 4200000, 3800000],
                backgroundColor: '#eb6f0a',
                borderRadius: 4
            },
            {
                label: 'Banaran',
                data: [1800000, 1900000, 1850000, 2100000, 2400000, 2800000, 2600000],
                backgroundColor: '#fcd34d',
                borderRadius: 4
            }
        ]
    };

    const doughnutData = {
        labels: ['Dada', 'Paha Atas', 'Paha Bawah', 'Sayap', 'Nasi'],
        datasets: [{
            data: [35, 25, 20, 15, 45],
            backgroundColor: [
                '#eb6f0a', 
                '#f97316', 
                '#fb923c',
                '#fdba74',
                '#9ca3af'
            ],
            borderWidth: 0
        }]
    };

    return (
        <>
            <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 sticky top-0 z-30">
                <h2 className="text-xl font-bold text-gray-800">Laporan Penjualan</h2>
                <div className="flex items-center gap-4">
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 bg-white">
                        <span className="material-symbols-outlined text-lg">download</span>
                        Export Excel
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-primary">
                        <img src="https://ui-avatars.com/api/?name=Rifqy+Tsaqif&background=eb6f0a&color=fff" alt="Admin" />
                    </div>
                </div>
            </header>

            <main className="p-8 bg-background-light">
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Rentang Waktu</label>
                        <select 
                            value={filterTime}
                            onChange={(e) => setFilterTime(e.target.value)}
                            className="w-full border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                        >
                            <option>7 Hari Terakhir</option>
                            <option>Bulan Ini (Desember)</option>
                            <option>Bulan Lalu (November)</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Filter Outlet</label>
                        <select 
                            value={filterOutlet}
                            onChange={(e) => setFilterOutlet(e.target.value)}
                            className="w-full border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                        >
                            <option value="all">Semua Outlet</option>
                            <option value="outlet_1">Cabang UNNES Sekaran</option>
                            <option value="outlet_2">Cabang Banaran</option>
                            <option value="outlet_3">Cabang Patemon</option>
                            <option value="outlet_4">Cabang Sampangan</option>
                        </select>
                    </div>
                    <button onClick={handleFilter} className="px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-primary transition-colors h-[38px]">
                        Terapkan Filter
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                                <span className="material-symbols-outlined">payments</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Omzet (7 Hari)</p>
                                <h3 className="text-2xl font-bold text-gray-900">Rp 45.200.000</h3>
                                <span className="text-xs text-green-600 font-bold">▲ 8.2% vs minggu lalu</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 text-primary rounded-lg">
                                <span className="material-symbols-outlined">receipt_long</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Transaksi</p>
                                <h3 className="text-2xl font-bold text-gray-900">1,845</h3>
                                <span className="text-xs text-green-600 font-bold">▲ 120 Transaksi baru</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                <span className="material-symbols-outlined">store</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Top Performa Outlet</p>
                                <h3 className="text-lg font-bold text-gray-900">Cabang UNNES Sekaran</h3>
                                <span className="text-xs text-gray-500">Kontribusi 42% dari total omzet</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Tren Pendapatan Harian</h3>
                        <div className="h-64">
                            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Produk Terlaris</h3>
                        <div className="h-64 flex items-center justify-center">
                            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900">Rincian Penjualan per Outlet (Harian)</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Tanggal</th>
                                    <th className="px-6 py-3">Nama Outlet</th>
                                    <th className="px-6 py-3 text-right">Jml Transaksi</th>
                                    <th className="px-6 py-3 text-right">Item Terjual (Pcs)</th>
                                    <th className="px-6 py-3 text-right">Total Omzet</th>
                                    <th className="px-6 py-3 text-center">Status Laporan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLaporan.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.tanggal}</td>
                                        <td className="px-6 py-4">{item.outlet}</td>
                                        <td className="px-6 py-4 text-right">{item.transaksi}</td>
                                        <td className="px-6 py-4 text-right">{item.item_terjual}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">Rp {item.omzet.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.status === 'Final' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </>
    );
};

export default AdminLaporan;
