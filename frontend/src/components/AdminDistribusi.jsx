import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const AdminDistribusi = () => {
    const navigate = useNavigate();
    const [outlet, setOutlet] = useState('');
    const [items, setItems] = useState({
        paha_atas: 0,
        dada: 0,
        sayap: 0
    });
    const [history, setHistory] = useState([]);

    React.useEffect(() => {
        fetch('http://localhost:5000/api/distribusi')
            .then(res => res.json())
            .then(data => setHistory(data))
            .catch(err => console.error(err));
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setItems(prev => ({
            ...prev,
            [name]: parseInt(value) || 0
        }));
    };

    const totalItems = Object.values(items).reduce((a, b) => a + b, 0);

    const prosesKirim = () => {
        if (outlet === "") {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Silakan pilih Outlet Tujuan terlebih dahulu!',
                confirmButtonColor: '#eb6f0a'
            });
            return;
        }

        if (totalItems === 0) {
             Swal.fire({
                icon: 'warning',
                title: 'Stok Kosong',
                text: 'Masukkan jumlah ayam yang ingin dikirim.',
                confirmButtonColor: '#eb6f0a'
            });
            return;
        }

        Swal.fire({
            title: 'Sedang Memproses...',
            timer: 1000,
            didOpen: () => {
                Swal.showLoading()
            }
        }).then(() => {
            // Map UI items to Backend IDs
            // 1: Dada, 2: Paha Atas, 3: Sayap
            const itemsPayload = [];
            if (items.dada > 0) itemsPayload.push({ id: 1, qty: items.dada });
            if (items.paha_atas > 0) itemsPayload.push({ id: 2, qty: items.paha_atas });
            if (items.sayap > 0) itemsPayload.push({ id: 3, qty: items.sayap });

            // Send data to backend
            fetch('http://localhost:5000/api/distribusi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    outlet_id: outlet, 
                    items: itemsPayload, 
                    date: new Date().toISOString() 
                })
            })
            .then(res => res.json())
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Stok Terkirim!',
                    text: `Berhasil mengirim ${totalItems} item ke Outlet.`,
                    confirmButtonColor: '#eb6f0a',
                    confirmButtonText: 'Kembali ke Dashboard'
                }).then((result) => {
                    if (result.isConfirmed) {
                        navigate('/');
                    }
                });
                // Refresh history
                fetch('http://localhost:5000/api/distribusi')
                    .then(res => res.json())
                    .then(data => setHistory(data));
            });
        });
    };

    return (
        <div className="flex flex-col w-full max-w-5xl flex-1 mx-auto p-8">
            
            <div className="flex items-center gap-4 px-1 py-3 border-b border-gray-200 mb-6">
                <Link to="/" className="p-2 text-gray-500 hover:text-primary hover:bg-orange-50 rounded-full transition-colors">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </Link>
                <div>
                    <h1 className="text-gray-900 text-2xl sm:text-3xl font-bold leading-tight">Distribusi Stok Baru</h1>
                    <p className="text-sm text-gray-500">Kirim stok dari Hub Pusat ke Outlet Satelit</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-gray-900 text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">local_shipping</span>
                            Detail Pengiriman
                        </h3>
                        
                        <div className="flex flex-col gap-4">
                            <label className="flex flex-col w-full">
                                <p className="text-gray-700 text-sm font-medium pb-2">Asal Stok (Source)</p>
                                <select className="form-select w-full rounded-lg border-gray-300 bg-gray-50 text-gray-500 h-12" disabled>
                                    <option selected value="hub-utama">Hub Pusat (Dapur Utama)</option>
                                </select>
                            </label>

                            <label className="flex flex-col w-full">
                                <p className="text-gray-700 text-sm font-medium pb-2">Outlet Tujuan</p>
                                <select 
                                    value={outlet} 
                                    onChange={(e) => setOutlet(e.target.value)}
                                    className="form-select w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary h-12"
                                >
                                    <option disabled value="">-- Pilih Outlet --</option>
                                    <option value="outlet_1">Cabang UNNES Sekaran (Kritis)</option>
                                    <option value="outlet_2">Cabang Banaran</option>
                                    <option value="outlet_3">Cabang Patemon</option>
                                    <option value="outlet_4">Cabang Sampangan</option>
                                </select>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-gray-900 text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">inventory_2</span>
                            Item yang Dikirim
                        </h3>
                        
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-orange-200 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-primary font-bold">PA</div>
                                    <span className="text-gray-800 font-medium">Ayam Paha Atas</span>
                                </div>
                                <input 
                                    name="paha_atas"
                                    value={items.paha_atas}
                                    onChange={handleInputChange}
                                    className="qty-input form-input w-24 rounded-md border-gray-300 text-center text-lg font-bold focus:border-primary focus:ring-primary" 
                                    min="0" 
                                    type="number" 
                                />
                            </div>

                            <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-orange-200 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-primary font-bold">DA</div>
                                    <span className="text-gray-800 font-medium">Ayam Dada</span>
                                </div>
                                <input 
                                    name="dada"
                                    value={items.dada}
                                    onChange={handleInputChange}
                                    className="qty-input form-input w-24 rounded-md border-gray-300 text-center text-lg font-bold focus:border-primary focus:ring-primary" 
                                    min="0" 
                                    type="number" 
                                />
                            </div>

                            <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-orange-200 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-primary font-bold">SA</div>
                                    <span className="text-gray-800 font-medium">Ayam Sayap</span>
                                </div>
                                <input 
                                    name="sayap"
                                    value={items.sayap}
                                    onChange={handleInputChange}
                                    className="qty-input form-input w-24 rounded-md border-gray-300 text-center text-lg font-bold focus:border-primary focus:ring-primary" 
                                    min="0" 
                                    type="number" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-gray-600 font-medium text-lg">Total Item</span>
                            <span className="text-primary font-black text-4xl">{totalItems}</span>
                        </div>
                        
                        <button onClick={prosesKirim} className="w-full bg-gray-900 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:bg-primary hover:shadow-orange-500/30 transform hover:-translate-y-1 transition-all duration-200 flex justify-center items-center gap-2">
                            <span className="material-symbols-outlined">send</span>
                            Konfirmasi & Kirim Stok
                        </button>
                    </div>
                </div>

                <div className="col-span-full">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-gray-900 text-lg font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-500">history</span>
                                Riwayat Pengiriman Terakhir
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3">Waktu</th>
                                        <th className="px-6 py-3">Outlet Tujuan</th>
                                        <th className="px-6 py-3 text-right">Jumlah Item</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {history.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-gray-400">Belum ada riwayat pengiriman.</td>
                                        </tr>
                                    ) : (
                                        history.map((log, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">{new Date(log.date).toLocaleString()}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{log.outlet}</td>
                                                <td className="px-6 py-4 text-right font-bold">{log.items_count}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded-full">Sukses</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDistribusi;
