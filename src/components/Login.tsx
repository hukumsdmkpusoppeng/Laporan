/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogIn, Key, User as UserIcon, ShieldAlert, Award } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username dan password wajib diisi');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Username atau password salah');
      }
    } catch (err) {
      setError('Koneksi ke server gagal. Pastikan backend aktif.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Background decoration elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-amber-500 to-amber-600"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-red-600 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-red-100">
            <Award className="h-9 w-9" />
          </div>
          <h2 id="login-title" className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 font-sans">
            Sistem Pelaporan Kegiatan Pegawai
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Komisi Pemilihan Umum (KPU) Subbagian Pelaporan
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white py-8 px-4 shadow-xl shadow-slate-200 border border-slate-100 rounded-2xl sm:px-10"
        >
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700 rounded-r-lg flex items-start gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username-input" className="block text-xs font-medium text-slate-700 uppercase tracking-wider">
                Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="username-input"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-input" className="block text-xs font-medium text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password-input"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <button
                id="login-btn"
                type="submit"
                disabled={loading}
                className="w-full h-11 flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Memvalidasi...' : <span className="flex items-center gap-2"><LogIn className="h-4 w-4" /> Masuk Aplikasi</span>}
              </button>
            </div>
          </form>

          {/* Quick Select Panel matching the spreadsheet screenshots */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider text-center mb-4">
              Demo Akun Sesuai Data Spreadsheet:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <button
                id="btn-demo-admin"
                type="button"
                onClick={() => handleQuickSelect('admin', 'admin123')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 text-left hover:bg-slate-50 hover:border-slate-200 transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Admin KPU
                  </div>
                  <div className="text-[10px] text-slate-500">Kepala Sub Bagian (Parmas dan SDM)</div>
                </div>
                <div className="text-[10px] bg-red-50 text-red-700 font-mono px-1.5 py-0.5 rounded uppercase font-semibold group-hover:bg-red-100">
                  Role: Admin
                </div>
              </button>

              <button
                id="btn-demo-budi"
                type="button"
                onClick={() => handleQuickSelect('budi', 'budi123')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 text-left hover:bg-slate-50 hover:border-slate-200 transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Budi
                  </div>
                  <div className="text-[10px] text-slate-500">Staf Pelaksana (Teknis Penyelenggaraan)</div>
                </div>
                <div className="text-[10px] bg-emerald-50 text-emerald-700 font-mono px-1.5 py-0.5 rounded uppercase font-semibold group-hover:bg-emerald-100">
                  Role: Pegawai
                </div>
              </button>

              <button
                id="btn-demo-dadar"
                type="button"
                onClick={() => handleQuickSelect('dadar', 'dadar123')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 text-left hover:bg-slate-50 hover:border-slate-200 transition-all group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Darma (username: dadar)
                  </div>
                  <div className="text-[10px] text-slate-500">Staf Pelaksana (Teknis Penyelenggaraan)</div>
                </div>
                <div className="text-[10px] bg-emerald-50 text-emerald-700 font-mono px-1.5 py-0.5 rounded uppercase font-semibold group-hover:bg-emerald-100">
                  Role: Pegawai
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs text-slate-400">
          KPU Kabupaten Soppeng © 2026 • Terhubung dengan Google Sheets
        </p>
      </motion.div>
    </div>
  );
}
