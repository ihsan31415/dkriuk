import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import AdminDistribusi from './components/AdminDistribusi';
import AdminLaporan from './components/AdminLaporan';
import OutletPOS from './components/OutletPOS';

function Layout({ children }) {
  const location = useLocation();
  const isPos = location.pathname === '/pos';

  if (isPos) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-gray-900 text-white flex flex-col transition-transform translate-x-0">
        <div className="flex flex-col gap-4 p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg">
                    <span className="material-symbols-outlined text-primary">fastfood</span>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-white text-lg font-bold leading-tight">D'Kriuk System</h1>
                    <p className="text-gray-400 text-xs">Hub Management</p>
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-2 p-4 flex-1">
            <Link to="/" className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${location.pathname === '/' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <span className="material-symbols-outlined">dashboard</span>
                <p className="text-sm font-medium">Dashboard</p>
            </Link>
            
            <Link to="/distribusi" className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${location.pathname === '/distribusi' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <span className="material-symbols-outlined">local_shipping</span>
                <p className="text-sm font-medium">Distribusi Stok</p>
            </Link>
            
            <Link to="/laporan" className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${location.pathname === '/laporan' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <span className="material-symbols-outlined">bar_chart</span>
                <p className="text-sm font-medium">Laporan & Analitik</p>
            </Link>

             <Link to="/pos" className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${location.pathname === '/pos' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <span className="material-symbols-outlined">point_of_sale</span>
                <p className="text-sm font-medium">POS Outlet</p>
            </Link>
        </div>

        <div className="p-4 border-t border-gray-800">
            <button className="flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors w-full">
                <span className="material-symbols-outlined">logout</span>
                <p className="text-sm font-medium">Logout</p>
            </button>
        </div>
      </aside>

      <div className="ml-64 flex-1 flex flex-col h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/distribusi" element={<AdminDistribusi />} />
          <Route path="/laporan" element={<AdminLaporan />} />
          <Route path="/pos" element={<OutletPOS />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
