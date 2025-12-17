import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestsCount, setRequestsCount] = useState(0);

    const fetchData = () => {
        setLoading(true);
        fetch('http://localhost:5000/api/dashboard')
            .then(response => response.json())
            .then(data => {
                setStats(data?.stats || { total_outlet: 0, total_pendapatan: 0, stok_gudang: 0, outlet_kritis: 0, potensi_waste: '0%', potensi_waste_pcs: 0 });
                setInventory(Array.isArray(data?.inventory) ? data.inventory : []);
                setRequestsCount(data?.requests_count || 0);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching dashboard data:', error);
                setStats({ total_outlet: 0, total_pendapatan: 0, stok_gudang: 0, outlet_kritis: 0, potensi_waste: '0%', potensi_waste_pcs: 0 });
                setInventory([]);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDetailClick = (outletName) => {
        // Dummy Detail Modal using SweetAlert2
        import('sweetalert2').then((Swal) => {
             Swal.default.fire({
                title: `Detail Outlet: ${outletName}`,
                html: `
                    <div class="text-left">
                        <div class="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-primary">
                                <span class="material-symbols-outlined">store</span>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-gray-800">Manager: Budi Santoso</p>
                                <p class="text-xs text-gray-500">Bergabung sejak 2021</p>
                            </div>
                        </div>
                        <div class="space-y-2 text-sm">
                            <p><strong>Alamat:</strong> Jl. Sekaran No. 12, Gunungpati</p>
                            <p><strong>Status Sewa:</strong> <span class="text-green-600 font-bold">Aktif (s/d Des 2025)</span></p>
                            <p><strong>Jam Operasional:</strong> 09:00 - 21:00 WIB</p>
                        </div>
                        <hr class="my-3 border-gray-200">
                        <div class="grid grid-cols-2 gap-2 text-center">
                            <div class="p-2 bg-blue-50 rounded-lg">
                                <p class="text-xs text-gray-500">Omzet Bulan Ini</p>
                                <p class="font-bold text-blue-600">Rp 45.2 Jt</p>
                            </div>
                            <div class="p-2 bg-green-50 rounded-lg">
                                <p class="text-xs text-gray-500">Performa</p>
                                <p class="font-bold text-green-600">Sangat Baik</p>
                            </div>
                        </div>
                    </div>
                `,
                confirmButtonColor: '#eb6f0a',
                confirmButtonText: 'Tutup'
            });
        });
    };

    if (loading && !stats) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    const safeStats = stats || { total_outlet: 0, total_pendapatan: 0, stok_gudang: 0, outlet_kritis: 0, potensi_waste: '0%', potensi_waste_pcs: 0 };
    const wastePercent = parseFloat(String(safeStats.potensi_waste || '0').replace('%', '')) || 0;
    const wasteBadgeClass = wastePercent >= 60
        ? 'bg-red-100 text-red-700 border-red-200'
        : wastePercent >= 30
            ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
            : 'bg-green-100 text-green-700 border-green-200';

    return (
        <>
            <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-800">Control Tower</h2>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                        HUB STATUS: NORMAL
                    </span>
                </div>
                
                <div className="flex items-center gap-6">
                    <button className="relative p-2 text-gray-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                        {requestsCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                                {requestsCount}
                            </span>
                        )}
                    </button>
                    
                    <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-800">Rifqy Tsaqif</p>
                            <p className="text-xs text-gray-500">Super Admin</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-primary">
                            <img src="https://ui-avatars.com/api/?name=Rifqy+Tsaqif&background=eb6f0a&color=fff" alt="Admin" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-8 bg-background-light">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="animate-fade-in-up p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-orange-100 rounded-lg text-primary">
                                <span className="material-symbols-outlined">inventory_2</span>
                            </div>
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">+12% vs Kemarin</span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Stok Ayam (Hub Pusat)</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{safeStats.stok_gudang} <span className="text-lg text-gray-400 font-normal">pcs</span></h3>
                    </div>

                    <div className="animate-fade-in-up delay-100 p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <span className="material-symbols-outlined">payments</span>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Total Omzet Hari Ini</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">Rp {((safeStats.total_pendapatan || 0) / 1000000).toFixed(1)} Jt</h3>
                    </div>

                    <div className="animate-fade-in-up delay-200 p-6 bg-white rounded-xl border border-red-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-16 h-16 bg-red-500/10 rounded-bl-full -mr-4 -mt-4"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                <span className="material-symbols-outlined">warning</span>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Outlet Stok Kritis</p>
                        <h3 className="text-3xl font-bold text-red-600 mt-1">{safeStats.outlet_kritis} <span className="text-lg text-gray-400 font-normal">Outlet</span></h3>
                        <p className="text-xs text-red-500 mt-2 font-medium">Butuh pengiriman segera!</p>
                    </div>

                    <div className="animate-fade-in-up delay-300 p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                                <span className="material-symbols-outlined">delete_forever</span>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${wasteBadgeClass}`}>
                                {wastePercent >= 60 ? 'HIGH' : wastePercent >= 30 ? 'MEDIUM' : 'LOW'}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Potensi Waste (Sisa)</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{safeStats.potensi_waste}</h3>
                    </div>
                </div>

                <div className="animate-fade-in-up delay-300 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900">Live Inventory Monitoring (Real-time)</h2>
                        <button onClick={fetchData} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                            <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span> 
                            {loading ? 'Refreshing...' : 'Refresh Data'}
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Nama Outlet</th>
                                    <th className="px-6 py-4 text-right">Paha Atas</th>
                                    <th className="px-6 py-4 text-right">Paha Bawah</th>
                                    <th className="px-6 py-4 text-right">Dada</th>
                                    <th className="px-6 py-4 text-right">Sayap</th>
                                    <th className="px-6 py-4 text-center">Status Stok</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {inventory.map((item) => (
                                    <tr key={item.id} className={item.status === 'CRITICAL' ? "bg-red-50/50 hover:bg-red-50 transition-colors" : "hover:bg-gray-50 transition-colors"}>
                                        <th className="px-6 py-4 font-medium text-gray-900">
                                            <div className="flex flex-col">
                                                <span>{item.outlet}</span>
                                                <span className={`text-xs font-normal flex items-center gap-1 ${item.status === 'CRITICAL' ? 'text-red-500' : 'text-gray-500'}`}>
                                                    <span className="material-symbols-outlined text-[10px]">schedule</span>
                                                    Updated: {item.last_update}
                                                </span>
                                            </div>
                                        </th>
                                        <td className={`px-6 py-4 text-right ${item.paha_atas < 10 ? 'font-bold text-red-600' : ''}`}>{item.paha_atas}</td>
                                        <td className={`px-6 py-4 text-right ${item.paha_bawah < 10 ? 'font-bold text-red-600' : ''}`}>{item.paha_bawah}</td>
                                        <td className={`px-6 py-4 text-right ${item.dada < 10 ? 'font-bold text-red-600' : ''}`}>{item.dada}</td>
                                        <td className={`px-6 py-4 text-right ${item.sayap < 10 ? 'font-bold text-red-600' : ''}`}>{item.sayap}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                                                item.status === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-200' :
                                                item.status === 'AMAN' ? 'bg-green-100 text-green-800 border-green-200' :
                                                'bg-yellow-100 text-yellow-800 border-yellow-200'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {item.status === 'CRITICAL' ? (
                                                <Link to="/distribusi" className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-red-700 shadow-sm hover:shadow">
                                                    <span className="material-symbols-outlined text-sm">local_shipping</span> Kirim Stok
                                                </Link>
                                            ) : (
                                                <button onClick={() => handleDetailClick(item.outlet)} className="text-gray-400 hover:text-primary font-medium text-xs">Detail</button>
                                            )}
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

export default AdminDashboard;
