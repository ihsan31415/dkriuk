import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const OutletPOS = () => {
    const [cart, setCart] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const OUTLET_ID = "outlet_1"; // Hardcoded for this demo

    React.useEffect(() => {
        fetch(`http://localhost:5000/api/products?outlet_id=${OUTLET_ID}`)
            .then(res => res.json())
            .then(data => {
                setMenuItems(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching menu:", err);
                setLoading(false);
            });
    }, []);

    const addToCart = (item) => {
        if (item.stock <= 0) {
            Swal.fire({ icon: 'error', title: 'Stok Habis', text: 'Item ini sedang kosong.', timer: 1500, showConfirmButton: false });
            return;
        }
        const existingItem = cart.find(c => c.id === item.id);
        if (existingItem) {
            if (existingItem.qty >= item.stock) {
                 Swal.fire({ icon: 'warning', title: 'Stok Tidak Cukup', text: `Hanya tersisa ${item.stock} porsi.`, timer: 1500, showConfirmButton: false });
                 return;
            }
            setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
        } else {
            setCart([...cart, { ...item, qty: 1 }]);
        }
    };

    const updateQty = (id, change) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = item.qty + change;
                return newQty > 0 ? { ...item, qty: newQty } : null;
            }
            return item;
        }).filter(Boolean));
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);

    const processCheckout = () => {
        if (cart.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Keranjang Kosong', text: 'Silakan pilih menu terlebih dahulu.', confirmButtonColor: '#eb6f0a' });
            return;
        }
        
        Swal.fire({
            title: 'Konfirmasi Pembayaran',
            html: `Total tagihan: <b>${formatRupiah(total)}</b><br>Lanjutkan proses bayar?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Bayar Tunai'
        }).then((result) => {
            if (result.isConfirmed) {
                // Send transaction to backend
                fetch('http://localhost:5000/api/pos/transaksi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        outlet_id: OUTLET_ID,
                        items: cart, 
                        total: total, 
                        date: new Date().toISOString() 
                    })
                })
                .then(res => {
                    if (!res.ok) throw new Error('Transaksi Gagal');
                    return res.json();
                })
                .then(() => {
                    Swal.fire({ title: 'Pembayaran Berhasil!', text: 'Struk telah dicetak. Terima kasih.', icon: 'success', timer: 2000, showConfirmButton: false });
                    setCart([]);
                    // Refresh menu to update stock
                    fetch(`http://localhost:5000/api/products?outlet_id=${OUTLET_ID}`)
                        .then(res => res.json())
                        .then(data => setMenuItems(data));
                })
                .catch(err => {
                    Swal.fire({ title: 'Error', text: err.message, icon: 'error' });
                });
            }
        });
    };

    const requestStokModal = () => {
        // Daftar Item yang bisa direquest
        const items = [
            'Ayam Dada', 'Paha Atas', 'Paha Bawah', 'Sayap', 
            'Nasi Putih', 'Es Teh'
        ];

        // Generate HTML untuk setiap baris item
        let itemsHtml = items.map(item => `
            <div class="flex items-center justify-between mb-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                <span class="text-sm font-medium text-gray-700">${item}</span>
                <div class="flex items-center gap-2">
                    <input type="number" data-name="${item}" class="req-input w-24 p-2 text-sm border border-gray-300 rounded-lg text-right focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" placeholder="0" min="0">
                    <span class="text-xs text-gray-400 w-6">pcs</span>
                </div>
            </div>
        `).join('');

        Swal.fire({
            title: 'Request Stok',
            width: '600px',
            html: `
                <div class="text-left">
                    <div class="p-3 mb-4 bg-orange-50 rounded-lg border border-orange-100 text-sm text-orange-800 flex items-start gap-2">
                        <span class="material-symbols-outlined text-lg mt-0.5">info</span>
                        <p class="leading-tight">Isi jumlah hanya pada item yang dibutuhkan. Kosongkan jika tidak perlu.</p>
                    </div>
                    
                    <div class="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border border-gray-100 rounded-lg p-2 bg-gray-50/50">
                        ${itemsHtml}
                    </div>

                    <label class="block mt-4">
                        <span class="text-xs font-bold text-gray-500 uppercase">Catatan Tambahan</span>
                        <textarea id="reqNote" class="w-full mt-1 p-2 border border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm" rows="2" placeholder="Cth: Stok menipis, butuh dikirim sebelum jam makan siang"></textarea>
                    </label>
                </div>
            `,
            showCancelButton: true,
            confirmButtonColor: '#eb6f0a',
            confirmButtonText: 'Kirim Request',
            cancelButtonText: 'Batal',
            focusConfirm: false,
            preConfirm: () => {
                // Ambil semua input
                const inputs = document.querySelectorAll('.req-input');
                const requests = [];
                
                inputs.forEach(input => {
                    const val = parseInt(input.value);
                    if (val > 0) {
                        const name = input.getAttribute('data-name');
                        requests.push({ item: name, qty: val });
                    }
                });

                if (requests.length === 0) {
                    Swal.showValidationMessage('Mohon isi minimal satu item!');
                    return false;
                }
                const note = document.getElementById('reqNote').value;
                return { requests, note };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const data = result.value;
                
                // Send request to backend
                fetch('http://localhost:5000/api/requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        outlet_id: OUTLET_ID,
                        requests: data.requests,
                        note: data.note
                    })
                })
                .then(res => res.json())
                .then(() => {
                    // Format pesan sukses (List item)
                    const listStr = data.requests.map(r => `<li><b>${r.qty}</b> ${r.item}</li>`).join('');

                    Swal.fire({
                        icon: 'success',
                        title: 'Request Terkirim!',
                        html: `
                            <p class="mb-2 text-sm text-gray-600">Permintaan berikut telah dikirim ke Hub Pusat:</p>
                            <ul class="text-left text-sm bg-gray-50 p-3 rounded-lg border border-gray-200 list-disc list-inside mb-2">
                                ${listStr}
                            </ul>
                            ${data.note ? `<p class="text-xs text-gray-500 italic">"Catatan: ${data.note}"</p>` : ''}
                        `,
                        timer: 4000,
                        showConfirmButton: true,
                        confirmButtonColor: '#16a34a' // Green for OK
                    });
                })
                .catch(err => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal Mengirim',
                        text: 'Terjadi kesalahan saat mengirim request.',
                    });
                });
            }
        });
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-background-light">
            <main className="flex-1 h-full overflow-y-auto relative">
                <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg text-primary">
                            <span className="material-symbols-outlined">storefront</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold leading-tight">Outlet: UNNES Sekaran</h2>
                            <p className="text-xs text-gray-500">Kasir: Staff Pagi</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Link to="/" className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                            <span className="material-symbols-outlined">logout</span>
                        </Link>
                    </div>
                </header>

                <div className="p-6 pb-24">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">fastfood</span>
                        Menu D'Kriuk
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                        {loading ? (
                            <div className="col-span-full flex justify-center py-10">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            menuItems.map((item, index) => (
                                <div key={item.id} onClick={() => addToCart(item)} 
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    className="animate-fade-in-up group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-primary transition-all active:scale-95">
                                    <div className="relative aspect-square">
                                        <img className="w-full h-full object-cover" src={item.image} alt={item.name} />
                                        <span className={`absolute top-2 right-2 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm ${item.stock === 0 ? 'bg-red-600' : 'bg-gray-900/80'}`}>
                                            {item.stock === 0 ? 'Habis' : `Sisa: ${item.stock}`}
                                        </span>
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-bold text-gray-800">{item.name}</h4>
                                        <p className="text-primary font-bold">{formatRupiah(item.price)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <aside className="w-full lg:w-96 bg-white border-l border-gray-200 shadow-2xl flex flex-col h-full">
                <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="material-symbols-outlined">shopping_cart</span>
                        Pesanan
                    </h2>
                    <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">{totalQty} Item</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <span className="material-symbols-outlined text-6xl mb-2 opacity-20">point_of_sale</span>
                            <p>Belum ada pesanan</p>
                            <p className="text-xs">Klik menu di kiri untuk menambah</p>
                        </div>
                    ) : (
                        cart.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                <img src={item.image} className="w-12 h-12 rounded-md object-cover" alt={item.name} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 truncate">{item.name}</p>
                                    <p className="text-xs text-gray-500">{formatRupiah(item.price)}</p>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                                    <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded border border-gray-200 text-gray-600 hover:bg-gray-100">-</button>
                                    <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded border border-gray-200 text-green-600 hover:bg-green-50">+</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-5 border-t border-gray-200 bg-gray-50 space-y-4">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-medium">{formatRupiah(total)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Pajak (0%)</span>
                            <span className="font-medium">Rp 0</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span className="text-primary">{formatRupiah(total)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={requestStokModal} className="flex items-center justify-center gap-2 px-4 py-3 border border-orange-200 text-primary font-bold rounded-xl hover:bg-orange-50 transition-colors">
                            <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                            Req Stok
                        </button>
                        
                        <button onClick={processCheckout} className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95">
                            Bayar
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default OutletPOS;
