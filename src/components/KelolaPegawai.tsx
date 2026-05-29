/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  X, 
  ShieldAlert, 
  ShieldCheck,
  Briefcase,
  Layers,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KelolaPegawaiProps {
  users: User[];
  currentUser: User;
  onUserAdded: (newUser: User) => void;
  onUserUpdated: (updatedUser: User) => void;
  onUserDeleted: (user: User) => void;
}

const SUBBAGIAN_OPTIONS = [
  'Parmas dan SDM',
  'Teknis Penyelenggaraan',
  'Perencanaan, Data dan Informasi',
  'Keuangan, Umum dan Logistik',
  'Hukum dan Pengawasan'
];

const JABATAN_OPTIONS = [
  'Kepala Sub Bagian',
  'Staf Pelaksana',
  'PPK (Pejabat Pembuat Komitmen)',
  'Bendahara',
  'Operator'
];

export default function KelolaPegawai({
  users,
  currentUser,
  onUserAdded,
  onUserUpdated,
  onUserDeleted
}: KelolaPegawaiProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [subbagian, setSubbagian] = useState('');
  const [role, setRole] = useState<'admin' | 'pegawai'>('pegawai');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({});

  // Toggle password visibility for specific row
  const togglePassVisibility = (userId: string) => {
    setShowPassMap(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleOpenCreateForm = () => {
    setEditUser(null);
    setUsername('');
    setPassword('');
    setNama('');
    setJabatan(JABATAN_OPTIONS[1]);
    setSubbagian(SUBBAGIAN_OPTIONS[0]);
    setRole('pegawai');
    setFormError('');
    setFormSuccess('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (user: User) => {
    setEditUser(user);
    setUsername(user.Username);
    setPassword(user.Password || 'demo123');
    setNama(user.Nama);
    setJabatan(user.Jabatan);
    setSubbagian(user.Subbagian);
    setRole(user.Role);
    setFormError('');
    setFormSuccess('');
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!username.trim() || !password.trim() || !nama.trim() || !jabatan || !subbagian) {
      setFormError('Semua field wajib diisi');
      return;
    }

    setLoading(true);

    try {
      if (editUser) {
        // Edit user call
        const response = await fetch(`/api/users/${editUser.ID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Username: username.trim(),
            Password: password.trim(),
            Nama: nama.trim(),
            Jabatan: jabatan,
            Subbagian: subbagian,
            Role: role
          })
        });

        const data = await response.json();
        if (response.ok) {
          onUserUpdated(data);
          setFormSuccess('Pegawai berhasil diperbarui!');
          setTimeout(() => {
            setIsFormOpen(false);
            setEditUser(null);
          }, 800);
        } else {
          setFormError(data.error || 'Gagal memperbarui data pegawai');
        }
      } else {
        // Create user call
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Username: username.toLowerCase().trim(),
            Password: password.trim(),
            Nama: nama.trim(),
            Jabatan: jabatan,
            Subbagian: subbagian,
            Role: role
          })
        });

        const data = await response.json();
        if (response.ok) {
          onUserAdded(data);
          setFormSuccess('Pegawai baru berhasil ditambahkan!');
          setUsername('');
          setPassword('');
          setNama('');
          setTimeout(() => {
            setIsFormOpen(false);
          }, 800);
        } else {
          setFormError(data.error || 'Gagal menambahkan pegawai baru');
        }
      }
    } catch (err) {
      console.error(err);
      setFormError('Koneksi server bermasalah saat mengirim data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    if (user.ID === currentUser.ID) {
      setFormError('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }
    onUserDeleted(user);
  };

  // Filter employees based on search query
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(u => 
      u.Nama.toLowerCase().includes(q) || 
      u.Username.toLowerCase().includes(q) || 
      u.Jabatan.toLowerCase().includes(q) || 
      u.Subbagian.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200/50 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
            <Users className="h-4 w-4 text-red-600" />
            Kelola Pegawai KPU
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Tambah, edit, atau hapus database akun pegawai pelapor demi ketertiban administrasi kerja.
          </p>
        </div>
        
        <button
          id="btn-tambah-pegawai"
          onClick={handleOpenCreateForm}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow-sm shadow-red-500/10"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Tambah Pegawai</span>
        </button>
      </div>

      {/* Main Form overlay/inline panel for Add/Edit */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200/80 p-5 rounded-xl space-y-4 mb-2">
              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {editUser ? `Edit Data: ${editUser.Nama}` : 'Form Tambah Pegawai Baru'}
                </span>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {formError && (
                <div className="bg-red-50 text-red-750 border-l-4 border-red-500 p-2 text-xs rounded-r-lg flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 p-2 text-xs rounded-r-lg flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 animate-bounce" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* 1. Nama Lengkap */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Darma"
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500"
                  />
                </div>

                {/* 2. Username */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Username Login</label>
                  <input
                    type="text"
                    required
                    disabled={!!editUser}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username_pegawai"
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500 disabled:bg-slate-100 disabled:text-slate-400 cursor-not-allowed"
                  />
                </div>

                {/* 3. Password */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Password Akses</label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contoh: budi123"
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500"
                  />
                </div>

                {/* 4. Jabatan */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Jabatan Kerja</label>
                  <select
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500 cursor-pointer text-slate-800"
                  >
                    {JABATAN_OPTIONS.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Subbagian */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Subbagian</label>
                  <select
                    value={subbagian}
                    onChange={(e) => setSubbagian(e.target.value)}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500 cursor-pointer text-slate-800"
                  >
                    {SUBBAGIAN_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* 6. Peran/Role */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Hak Akses (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'pegawai')}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500 cursor-pointer font-bold text-slate-800"
                  >
                    <option value="pegawai">Pegawai Biasa</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-755 font-bold text-xs py-1.5 px-3 rounded-md transition-colors cursor-pointer"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-4 rounded-md transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Data Pegawai'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Statistics Overview */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch shadow-none">
        
        {/* Search Input Box */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            id="search-pegawai-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pegawai berdasarkan Nama, Jabatan, Subbagian..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Short counts */}
        <div className="bg-slate-50 border border-slate-150 rounded-lg px-3 py-1 flex items-center gap-4 text-xs font-medium text-slate-600 self-start md:self-auto shrink-0 leading-none h-[32px]">
          <span>Total Pegawai: <strong className="text-slate-900 font-bold">{users.length}</strong></span>
          <span className="w-1 h-3 bg-slate-200"></span>
          <span>Admin: <strong className="text-slate-900 font-bold">{users.filter(u => u.Role === 'admin').length}</strong></span>
        </div>
      </div>

      {/* Employees table */}
      <div className="overflow-x-auto rounded-xl border border-slate-150">
        <table className="w-full text-left border-collapse text-slate-800">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              <th className="py-2.5 px-4">Nama & Username</th>
              <th className="py-2.5 px-4">Jabatan & Subbagian</th>
              <th className="py-2.5 px-4">Password Akses</th>
              <th className="py-2.5 px-4 text-center">Peran</th>
              <th className="py-2.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
            {filteredUsers.map((user) => {
              const isSelf = user.ID === currentUser.ID;
              const hasShowPass = showPassMap[user.ID] || false;
              
              return (
                <tr key={user.ID} className="hover:bg-slate-50/50 transition-colors">
                  
                  {/* Nama Lengkap & Username */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 font-extrabold text-[10px] text-slate-700 flex items-center justify-center uppercase tracking-wide shrink-0 font-mono">
                        {user.Nama.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          {user.Nama}
                          {isSelf && (
                            <span className="text-[8px] bg-red-50 border border-red-100 text-red-650 px-1 py-0.2 rounded font-mono font-bold uppercase">
                              Anda
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">@{user.Username}</div>
                      </div>
                    </div>
                  </td>

                  {/* Jabatan & Subbagian */}
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 font-semibold text-slate-700">
                        <Briefcase className="h-3 w-3 text-slate-400" />
                        <span>{user.Jabatan}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Layers className="h-3 w-3 text-slate-400" />
                        <span>{user.Subbagian}</span>
                      </div>
                    </div>
                  </td>

                  {/* Password (Visible in real-time) */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                      <span className="bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded text-slate-800 font-bold">
                        {hasShowPass ? (user.Password || 'demo123') : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePassVisibility(user.ID)}
                        className="p-1 hover:bg-slate-150 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                        title={hasShowPass ? "Sembunyikan password" : "Tampilkan password"}
                      >
                        {hasShowPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>

                  {/* Peran / Role badge */}
                  <td className="py-3 px-4 text-center">
                    {user.Role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-red-100 text-red-750 border border-red-200">
                        <ShieldAlert className="h-3.5 w-3.5 text-red-650" />
                        <span>Admin</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                        <span>Pegawai</span>
                      </span>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditForm(user)}
                        className="p-1 text-slate-500 hover:text-red-750 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-200 transition-all cursor-pointer"
                        title="Edit data pegawai"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={isSelf}
                        className={`p-1 rounded-lg border transition-all cursor-pointer ${
                          isSelf 
                            ? 'text-slate-300 bg-slate-50 border-slate-100 cursor-not-allowed opacity-40' 
                            : 'text-slate-500 hover:text-red-600 hover:bg-red-50 border-slate-200 hover:border-red-200'
                        }`}
                        title={isSelf ? "Tidak bisa menghapus akun sendiri" : "Hapus pegawai dari sistem"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <span className="block font-medium">Pegawai tidak ditemukan</span>
                  <span className="text-[10px]">Coba cari dengan kata kunci pencarian yang lain.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
