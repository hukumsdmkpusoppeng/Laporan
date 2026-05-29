/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  LogOut, 
  Award, 
  FileText, 
  BarChart3, 
  Database, 
  Settings, 
  UserCheck, 
  Clock,
  Menu,
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Laporan, User, AppConfig } from './types.ts';
import Login from './components/Login.tsx';
import DashboardStats from './components/DashboardStats.tsx';
import InputLaporan from './components/InputLaporan.tsx';
import DaftarLaporan from './components/DaftarLaporan.tsx';
import AppsScriptGuide from './components/AppsScriptGuide.tsx';
import ResetDatabaseButton from './components/ResetDatabaseButton.tsx';
import KelolaPegawai from './components/KelolaPegawai.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<AppConfig>({
    appsScriptUrl: '',
    spreadsheetId: '',
    isConnected: false
  });
  
  const [activeTab, setActiveTab] = useState<'stats' | 'laporan' | 'input' | 'guide' | 'pegawai'>('stats');
  const [editTarget, setEditTarget] = useState<Laporan | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingDb, setLoadingDb] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 1. Restore login or settings on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('kpu_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }

    // Initialize clock
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('id-ID', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch data (laporan, users, config) when user logs in
  const fetchData = async () => {
    if (!currentUser) return;
    setLoadingDb(true);
    try {
      // Config
      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        const parsedConfig = await configRes.json();
        setConfig(parsedConfig);
      }

      // Laporan
      const laporanRes = await fetch('/api/laporan');
      if (laporanRes.ok) {
        const data = await laporanRes.json();
        setLaporan(data);
      }

      // Users
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
      // Set initial tab depending on user role
      if (currentUser.Role === 'admin') {
        setActiveTab('stats');
      } else {
        setActiveTab('input');
      }
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    localStorage.setItem('kpu_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    showConfirm(
      'Keluar dari Aplikasi',
      'Apakah Anda yakin ingin keluar dari akun Anda saat ini?',
      () => {
        setCurrentUser(null);
        localStorage.removeItem('kpu_user');
        setLaporan([]);
        setEditTarget(null);
      }
    );
  };

  const handleLaporanAdded = async (newLaporan: Laporan) => {
    setLaporan((prev) => [newLaporan, ...prev]);
    // Refresh configuration to get lastSyncError/lastSyncTime
    try {
      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        const parsedConfig = await configRes.json();
        setConfig(parsedConfig);
      }
    } catch (_) {}
  };

  const handleLaporanUpdated = async (updatedLaporan: Laporan) => {
    setLaporan((prev) => prev.map((l) => (l.ID === updatedLaporan.ID ? updatedLaporan : l)));
    setEditTarget(null);
    // Refresh configuration to get lastSyncError/lastSyncTime
    try {
      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        const parsedConfig = await configRes.json();
        setConfig(parsedConfig);
      }
    } catch (_) {}
  };

  const handleEditClick = (lap: Laporan) => {
    setEditTarget(lap);
    setActiveTab('input');
  };

  const handleDeleteClick = (id: string) => {
    showConfirm(
      'Hapus Laporan Kegiatan',
      'Apakah Anda yakin ingin menghapus laporan kegiatan harian ini dari database secara permanen?',
      async () => {
        try {
          const res = await fetch(`/api/laporan/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            setLaporan((prev) => prev.filter((l) => l.ID !== id));
            // Refresh configuration to get lastSyncError/lastSyncTime
            try {
              const configRes = await fetch('/api/config');
              if (configRes.ok) {
                const parsedConfig = await configRes.json();
                setConfig(parsedConfig);
              }
            } catch (_) {}
          }
        } catch (err) {
          console.error('Failed to delete report:', err);
        }
      }
    );
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = currentUser.Role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Top indicator ribbon */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-amber-500 to-amber-600 z-50"></div>

      {/* MOBILE HEADER BAR */}
      <header className="md:hidden bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
            KPU
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 uppercase tracking-tight">KPU SOPPENG</h1>
            <p className="text-[10px] text-slate-400">Pelaporan Kegiatan</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {timeStr}
          </span>
          <button 
            id="mobile-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* SIDEBAR FOR DESKTOP & SLIDE OUT OVERLAY FOR MOBILE */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-slate-200 transform md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col justify-between border-r border-slate-900
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative
      `}>
        {/* Main sidebar parts */}
        <div className="flex flex-col flex-1 py-6 px-4">
          {/* Logo & Info */}
          <div className="flex items-center gap-3 pb-6 border-b border-slate-900">
            <div className="h-10 w-10 bg-gradient-to-tr from-red-600 to-amber-500 rounded-xl flex items-center justify-center text-white shadow shadow-red-500/10">
              <Award className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wider text-white uppercase">KPU SOPPENG</h2>
              <div className="text-[10px] text-slate-400 font-medium">Pelaporan Kegiatan</div>
            </div>
          </div>

          {/* User profile metadata */}
          <div className="py-4 my-2 bg-slate-900/40 rounded-xl p-3 border border-slate-900/60 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold tracking-wider">
              {currentUser.Nama.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate" title={currentUser.Nama}>
                {currentUser.Nama}
              </div>
              <div className="text-[9px] text-slate-400 truncate max-w-[150px]">
                {currentUser.Jabatan}
              </div>
              <div className="text-[8px] uppercase tracking-wider bg-red-600/15 border border-red-500/10 text-red-500 px-1 rounded inline-block font-bold mt-1 scale-95 origin-left">
                Role: {currentUser.Role}
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5 flex-1 mt-6">
            {/* 1. Dashboard tab */}
            <button
              id="lnk-tab-stats"
              onClick={() => { setActiveTab('stats'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'stats' 
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/15 font-bold' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span>Dashboard Statistik</span>
            </button>

            {/* 2. Input Form (Pegawai View Only or admin preview) */}
            {!isAdmin && (
              <button
                id="lnk-tab-input"
                onClick={() => { setActiveTab('input'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'input' 
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/15 font-bold' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span>Pengisian Laporan</span>
              </button>
            )}

            {/* 3. Logs table tab */}
            <button
              id="lnk-tab-laporan"
              onClick={() => { setActiveTab('laporan'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'laporan' 
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/15 font-bold' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Database className="h-4 w-4 shrink-0" />
              <span>{isAdmin ? 'Pantau Semua Laporan' : 'Laporan Saya'}</span>
            </button>

            {/* 3b. Manage Employees tab for admin */}
            {isAdmin && (
              <button
                id="lnk-tab-pegawai"
                onClick={() => { setActiveTab('pegawai'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'pegawai' 
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/15 font-bold' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <UserCheck className="h-4 w-4 shrink-0" />
                <span>Kelola Akun Pegawai</span>
              </button>
            )}

            {/* 4. Configuration tab for admin */}
            {isAdmin && (
              <button
                id="lnk-tab-guide"
                onClick={() => { setActiveTab('guide'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'guide' 
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/15 font-bold' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span>Pengaturan Link Sheets</span>
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer Operations */}
        <div className="p-4 border-t border-slate-900 space-y-3">
          {/* Synchronized status indicators */}
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${loadingDb ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
              <span>{loadingDb ? 'Menyinkronkan...' : 'Sinkron Aktif'}</span>
            </div>
            <div className="font-mono text-[9px] text-slate-400 font-semibold inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {timeStr}
            </div>
          </div>

          {/* Reset database button (Admin only) */}
          {isAdmin && (
            <div className="pt-1.5 border-t border-slate-900">
              <ResetDatabaseButton onResetComplete={fetchData} />
            </div>
          )}

          {/* Logout button */}
          <button
            id="lnk-logout"
            onClick={handleLogout}
            className="w-full flex justify-center items-center py-2 px-3 border border-slate-900 text-slate-400 hover:text-red-500 hover:bg-red-600/5 hover:border-red-500/10 rounded-lg text-xs transition-all gap-1.5 font-semibold cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BACKDROP DRAWER COVER WITH ANIMATIONS */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* CORE VIEWPORT MAIN LAYOUT SCREEN */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {/* Dynamic header navigation metadata cards */}
        <div className="bg-white px-5 py-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-none">
          <div>
            <h1 className="text-lg font-bold text-slate-950 font-sans tracking-tight">
              {activeTab === 'stats' && 'Dashboard Produktivitas Harian'}
              {activeTab === 'input' && 'Pelaporan Kegiatan Harian'}
              {activeTab === 'laporan' && 'Pantau Laporan Kegiatan Pegawai'}
              {activeTab === 'guide' && 'Konfigurasi Spreadsheet Apps Script'}
              {activeTab === 'pegawai' && 'Kelola Akun & Hak Akses Pegawai'}
            </h1>
            <p className="text-xs text-slate-500">
              {activeTab === 'stats' && 'Laporan analisis statistik produktivitas pegawai KPU secara real-time.'}
              {activeTab === 'input' && 'Halaman input laporan harian mandiri pegawai KPU Kabupaten Soppeng.'}
              {activeTab === 'laporan' && 'Daftar rekapitulasi pelaporan kegiatan harian pegawai.'}
              {activeTab === 'guide' && 'Langkah penyiapan Spreadsheet sebagai database live aplikasi.'}
              {activeTab === 'pegawai' && 'Antarmuka manajemen akun pegawai Komisi Pemilihan Umum Soppeng.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Simple User Connection badge status */}
            <div className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
              <UserCheck className="h-3.5 w-3.5 text-slate-500" />
              <span>Peran: <strong className="text-slate-900 font-bold">{currentUser.Nama} ({currentUser.Role === 'admin' ? 'Admin' : 'Operator'})</strong></span>
            </div>

            {config.isConnected && (
              <div className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span>Google Sheet Terkoneksi</span>
              </div>
            )}
          </div>
        </div>

        {/* LOADING STATE COVER */}
        {loadingDb && laporan.length === 0 && (
          <div className="flex flex-col justify-center items-center py-24 space-y-3">
            <div className="relative">
              <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-xs font-semibold text-slate-500">Menyinkronkan data dari Google Sheet...</p>
          </div>
        )}

        {/* DYNAMIC TAB CONTROLLER ACTIONS */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'stats' && (
              <DashboardStats 
                currentLaporan={laporan} 
                users={users} 
                appsScriptConfig={config} 
                currentUser={currentUser}
              />
            )}

            {activeTab === 'input' && (
              <div className="max-w-xl mx-auto">
                <InputLaporan 
                  currentUser={currentUser} 
                  onLaporanAdded={handleLaporanAdded}
                  editTarget={editTarget}
                  onCancelEdit={() => { setEditTarget(null); setActiveTab('laporan'); }}
                  onLaporanUpdated={handleLaporanUpdated}
                />
              </div>
            )}

            {activeTab === 'laporan' && (
              <DaftarLaporan 
                currentLaporan={laporan} 
                currentUser={currentUser}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            )}

            {activeTab === 'guide' && isAdmin && (
              <AppsScriptGuide 
                config={config} 
                onConfigSaved={(newConfig) => {
                  setConfig((prev) => ({ ...prev, ...newConfig, isConnected: !!newConfig.appsScriptUrl }));
                  fetchData();
                }}
              />
            )}

            {activeTab === 'pegawai' && isAdmin && (
              <KelolaPegawai
                users={users}
                currentUser={currentUser}
                onUserAdded={(newUser) => setUsers(prev => [...prev, newUser])}
                onUserUpdated={(updatedUser) => setUsers(prev => prev.map(u => u.ID === updatedUser.ID ? updatedUser : u))}
                onUserDeleted={(user) => {
                  showConfirm(
                    'Hapus Data Pegawai',
                    `Apakah Anda yakin ingin menghapus akun pegawai "${user.Nama}" (@${user.Username}) secara permanen dari database? Seluruh rekam pelaporan kegiatan pegawai ini juga akan ditiadakan.`,
                    async () => {
                      try {
                        const response = await fetch(`/api/users/${user.ID}`, {
                          method: 'DELETE'
                        });
                        if (response.ok) {
                          setUsers(prev => prev.filter(u => u.ID !== user.ID));
                        } else {
                          const data = await response.json();
                          showConfirm(
                            'Gagal Menghapus',
                            data.error || 'Gagal menghapus data pegawai dari database.',
                            () => {}
                          );
                        }
                      } catch (err) {
                        console.error(err);
                        showConfirm(
                          'Gangguan Koneksi',
                          'Gagal terhubung ke server. Periksa kembali stabilitas internet Anda.',
                          () => {}
                        );
                      }
                    }
                  );
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* CUSTOM CENTRAL CONFIRMATION MODAL TO AVOID IFRAME POPUP CONSTRAINT */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            />
            
            {/* Modal Card content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="relative bg-white rounded-2xl shadow-xl border border-slate-100 p-6 max-w-sm w-full space-y-4"
            >
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
              
              <div className="flex gap-2.5 pt-1">
                <button
                  id="confirm-modal-cancel"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="confirm-modal-ok"
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-sm shadow-red-500/10 transition-colors cursor-pointer"
                >
                  Ya, Lanjutkan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
