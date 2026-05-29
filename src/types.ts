/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  ID: string;
  Username: string;
  Password?: string;
  Nama: string;
  Jabatan: string;
  Subbagian: string;
  Role: 'admin' | 'pegawai';
}

export interface Laporan {
  ID: string;
  UserID: string;
  Nama: string;
  Jabatan: string;
  Subbagian: string;
  Tanggal: string; // YYYY-MM-DD
  Kegiatan: string;
  Output: string;
}

export interface AppConfig {
  appsScriptUrl: string;
  spreadsheetId: string;
  isConnected: boolean;
  lastSyncError?: string;
  lastSyncTime?: string;
}

export interface DashboardStats {
  totalLaporan: number;
  totalPegawai: number;
  laporanHariIni: number;
  kegiatanPerSubbagian: Record<string, number>;
  kegiatanPerHari: { tanggal: string; jumlah: number }[];
  produktivitasPegawai: { nama: string; jumlah: number }[];
}
