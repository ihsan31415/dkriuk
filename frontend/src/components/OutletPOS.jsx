import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const OutletPOS = () => {
    const [cart, setCart] = useState([]);

    const menuItems = [
        { id: 1, name: 'Ayam Dada', price: 10000, image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=300&auto=format&fit=crop', stock: 24 },
        { id: 2, name: 'Paha Atas', price: 10000, image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?q=80&w=300&auto=format&fit=crop', stock: 18 },
        { id: 3, name: 'Sayap', price: 8000, image: 'https://i.huffpost.com/gen/1350227/images/o-MIGHTY-WINGS-facebook.jpg', stock: 5 },
        { id: 4, name: 'Paha Bawah', price: 8000, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=300&auto=format&fit=crop', stock: 12 },
        { id: 5, name: 'Nasi Putih', price: 4000, image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=300&auto=format&fit=crop', stock: 50 },
        { id: 6, name: 'Es Teh', price: 3000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=300&auto=format&fit=crop', stock: 100 },
    ];

    const addToCart = (item) => {
        const existingItem = cart.find(c => c.id === item.id);
        if (existingItem) {
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
                    body: JSON.stringify({ items: cart, total: total, date: new Date().toISOString() })
                })
                .then(res => res.json())
                .then(() => {
                    Swal.fire({ title: 'Pembayaran Berhasil!', text: 'Struk telah dicetak. Terima kasih.', icon: 'success', timer: 2000, showConfirmButton: false });
                    setCart([]);
                });
            }
        });
    };

    const requestStokModal = () => {
        Swal.fire({
            title: 'Request Stok',
            input: 'textarea',
            inputLabel: 'Catatan Request',
            inputPlaceholder: 'Tulis item yang dibutuhkan...',
            showCancelButton: true,
            confirmButtonText: 'Kirim',
            confirmButtonColor: '#eb6f0a'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('Terkirim!', 'Request stok telah dikirim ke pusat.', 'success');
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
                        {menuItems.map(item => (
                            <div key={item.id} onClick={() => addToCart(item)} 
                                className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-primary transition-all active:scale-95">
                                <div className="relative aspect-square">
                                    <img className="w-full h-full object-cover" src={item.image} alt={item.name} />
                                    <span className="absolute top-2 right-2 bg-gray-900/80 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">Sisa: {item.stock}</span>
                                </div>
                                <div className="p-3">
                                    <h4 className="font-bold text-gray-800">{item.name}</h4>
                                    <p className="text-primary font-bold">{formatRupiah(item.price)}</p>
                                </div>
                            </div>
                        ))}
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
