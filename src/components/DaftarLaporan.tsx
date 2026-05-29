/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Laporan, User } from '../types';
import { 
  Search, 
  Filter, 
  FileSpreadsheet, 
  FileDown, 
  Printer, 
  Edit3, 
  Trash2, 
  Clock, 
  Award,
  ChevronDown
} from 'lucide-react';

interface DaftarLaporanProps {
  currentLaporan: Laporan[];
  currentUser: User;
  onEdit: (laporan: Laporan) => void;
  onDelete: (id: string) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function DaftarLaporan({ 
  currentLaporan, 
  currentUser, 
  onEdit, 
  onDelete 
}: DaftarLaporanProps) {
  const today = new Date();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNama, setFilterNama] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(String(today.getMonth()));
  const [selectedYear, setSelectedYear] = useState<string>(String(today.getFullYear()));

  const isAdmin = currentUser.Role === 'admin';

  // Filter criteria logic
  const filteredLaporan = currentLaporan.filter((lap) => {
    // 1. If not admin, can only view own logs
    if (!isAdmin && lap.UserID !== currentUser.ID) {
      return false;
    }

    // 2. Search query matches Kegiatan, Output, or Nama
    const query = searchQuery.toLowerCase();
    const matchQuery = 
      lap.Kegiatan.toLowerCase().includes(query) || 
      lap.Output.toLowerCase().includes(query) ||
      lap.Nama.toLowerCase().includes(query);

    // 3. Nama filter (for admin specifically)
    const matchNama = filterNama ? lap.Nama.toLowerCase() === filterNama.toLowerCase() : true;

    // 4. Date filters
    const dateVal = new Date(lap.Tanggal).getTime();
    const matchStart = startDate ? dateVal >= new Date(startDate).getTime() : true;
    const matchEnd = endDate ? dateVal <= new Date(endDate).getTime() : true;

    // 5. Month & Year filter (Input month)
    let matchMonth = true;
    let matchYear = true;

    if (lap.Tanggal && lap.Tanggal.includes('-')) {
      const parts = lap.Tanggal.split('-');
      if (parts.length >= 2) {
        const lapYear = parts[0];
        const lapMonth = parts[1];

        if (selectedMonth !== 'all') {
          const targetMonthStr = String(parseInt(selectedMonth, 10) + 1).padStart(2, '0');
          matchMonth = lapMonth === targetMonthStr;
        }
        if (selectedYear !== 'all') {
          matchYear = lapYear === selectedYear;
        }
      } else {
        if (selectedMonth !== 'all' || selectedYear !== 'all') {
          return false;
        }
      }
    } else {
      if (selectedMonth !== 'all' || selectedYear !== 'all') {
        return false;
      }
    }

    return matchQuery && matchNama && matchStart && matchEnd && matchMonth && matchYear;
  });

  // Unique names of employees who have reported (for admin dropdown)
  const uniqueNames = Array.from(new Set(currentLaporan.map(l => l.Nama)));

  // EXPORT TO EXCEL / CSV WITH UTF-8 BOM
  const handleExportExcel = () => {
    // Column headers
    const headers = ['NO', 'ID LAPORAN', 'USER ID', 'NAMA PEGAWAI', 'JABATAN', 'SUBBAGIAN', 'TANGGAL', 'KEGIATAN', 'HASIL / OUTPUT'];
    
    // Map rows
    const rows = filteredLaporan.map((lap, index) => [
      index + 1,
      lap.ID,
      lap.UserID,
      lap.Nama,
      lap.Jabatan,
      lap.Subbagian,
      lap.Tanggal,
      // escape double quotes for CSV safety
      `"${lap.Kegiatan.replace(/"/g, '""')}"`,
      `"${lap.Output.replace(/"/g, '""')}"`
    ]);

    // Build CSV content
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    // Prefix UTF-8 BOM (Byte Order Mark) to ensure Excel displays symbols/letters flawlessly
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Laporan_KPU_${currentUser.Username}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT TO PERFECTLY PRINTED PDF VIA BROWSER
  const handlePrintPDF = () => {
    // Dynamic opening window showing print-optimized layout
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Mohon izinkan popup browser untuk mencetak PDF/Dokumen.');
      return;
    }

    const todayString = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const tableRows = filteredLaporan.map((lap, idx) => `
      <tr style="border-bottom: 1px solid #cbd5e1;">
        <td style="padding: 8px; text-align: center; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 8px; font-size: 11px; font-family: monospace;">${lap.ID}</td>
        <td style="padding: 8px; font-size: 11px;"><b>${lap.Nama}</b><br/><span style="color:#64748b; font-size: 10px;">${lap.Jabatan}</span></td>
        <td style="padding: 8px; font-size: 11px; text-align: center;">${lap.Tanggal}</td>
        <td style="padding: 8px; font-size: 11px; text-align: left; line-height: 1.4;">${lap.Kegiatan}</td>
        <td style="padding: 8px; font-size: 11px; text-align: left;">${lap.Output}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Rekapitulasi Laporan Kegiatan Harian</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              color: #1e293b; 
              padding: 24px; 
              margin: 0;
            }
            .kop-surat {
              border-bottom: 3px double #000;
              padding-bottom: 12px;
              margin-bottom: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 16px;
            }
            .kop-text {
              text-align: center;
            }
            .kop-text h2 {
              margin: 0;
              font-size: 14px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .kop-text h1 {
              margin: 4px 0;
              font-size: 18px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .kop-text p {
              margin: 0;
              font-size: 11px;
              color: #475569;
            }
            .document-title {
              text-align: center;
              margin-bottom: 20px;
            }
            .document-title h3 {
              margin: 0;
              font-size: 13px;
              text-transform: uppercase;
              text-decoration: underline;
              font-weight: bold;
            }
            .document-title p {
              margin: 4px 0 0 0;
              font-size: 11px;
              color: #475569;
            }
            .metadata-table {
              width: 100%;
              margin-bottom: 16px;
              font-size: 11px;
            }
            .metadata-table td {
              padding: 4px 0;
            }
            table.data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            table.data-table th {
              background-color: #f1f5f9;
              border: 1px solid #94a3b8;
              padding: 10px 8px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
            }
            table.data-table td {
              border: 1px solid #cbd5e1;
              padding: 10px 8px;
            }
            .signature-container {
              margin-top: 40px;
              text-align: right;
              font-size: 12px;
              float: right;
              width: 250px;
              page-break-inside: avoid;
            }
            .signature-space {
              height: 70px;
            }
            @media print {
              body { padding: 0; }
              @page { size: portrait; margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="kop-surat">
            <div class="kop-text">
              <h2>KOMISI PEMILIHAN UMUM</h2>
              <h1>KABUPATEN SOPPENG</h1>
              <p>Jalan Pemuda No. 1, Watansoppeng • Telp: (0484) 21111 • Email: kpusoppeng@kpu.go.id</p>
            </div>
          </div>
          
          <div class="document-title">
            <h3>REKAPITULASI LAPORAN KEGIATAN HARIAN PEGAWAI</h3>
            <p>Sistem Pelaporan Produktivitas Real-Time KPU Soppeng</p>
          </div>

          <table class="metadata-table">
            <tr>
              <td style="width: 15%;">Nama Operator</td>
              <td style="width: 2%;">:</td>
              <td style="width: 33%;"><b>${currentUser.Nama}</b></td>
              <td style="width: 15%;">Tanggal Cetak</td>
              <td style="width: 2%;">:</td>
              <td style="width: 33%;">${todayString}</td>
            </tr>
            <tr>
              <td>Jumlah Laporan</td>
              <td>:</td>
              <td colspan="4"><b>${filteredLaporan.length} Laporan</b></td>
            </tr>
            ${startDate || endDate ? `
              <tr>
                <td>Rentang Tanggal</td>
                <td>:</td>
                <td colspan="4">${startDate || 'Awal'} s.d. ${endDate || 'Akhir'}</td>
              </tr>
            ` : ''}
          </table>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 15%;">ID</th>
                <th style="width: 20%;">Pegawai / Jabatan</th>
                <th style="width: 12%;">Tanggal</th>
                <th style="width: 33%;">Detail Kegiatan Harian</th>
                <th style="width: 15%;">Output / Hasil</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="6" style="text-align:center; padding: 20px; font-size:12px; color:#64748b;">Tidak ada data laporan ditemukan untuk kriteria ini.</td></tr>'}
            </tbody>
          </table>

          <div class="signature-container">
            <p>Watansoppeng, ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>Mengetahui/Menyetujui,<br/><b>Kepala Sub Bagian Pelaporan</b></p>
            <div class="signature-space"></div>
            <p style="text-decoration: underline; font-weight: bold;">................................................</p>
            <p style="color: #475569; font-size: 10px;">NIP. .................................................</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Search and Filters Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
              {isAdmin ? 'Dashboard Pantau Semua Kegiatan Pegawai' : 'Daftar Laporan Pribadi'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {filteredLaporan.length} entri dari total {currentLaporan.filter(l => isAdmin || l.UserID === currentUser.ID).length} laporan kegiatan harian.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-export-excel"
              onClick={handleExportExcel}
              disabled={filteredLaporan.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs rounded-lg transition-colors border border-emerald-200/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0" />
              <span>Ekspor Excel</span>
            </button>
            <button
              id="btn-export-pdf"
              onClick={handlePrintPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-xs rounded-lg transition-colors border border-red-200/50 cursor-pointer"
            >
              <Printer className="h-4 w-4 shrink-0" />
              <span>Cetak Rekap / PDF</span>
            </button>
          </div>
        </div>

        {/* Filters Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 pt-2">
          {/* Search Input */}
          <div className="relative col-span-1 lg:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              id="search-input"
              type="text"
              placeholder="Cari kegiatan, output, nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Admin Filters - Nama Pegawai */}
          {isAdmin && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Filter className="h-3.5 w-3.5" />
              </div>
              <select
                id="filter-nama-select"
                value={filterNama}
                onChange={(e) => setFilterNama(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none cursor-pointer"
              >
                <option value="">Semua Pegawai</option>
                {uniqueNames.map((nama) => (
                  <option key={nama} value={nama}>{nama}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>
          )}

          {/* Month Filter */}
          <div className="relative">
            <select
              id="filter-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 border border-slate-200 bg-white rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none cursor-pointer"
            >
              <option value="all">Semua Bulan</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={String(idx)}>{m}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Year Filter */}
          <div className="relative">
            <select
              id="filter-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 border border-slate-200 bg-white rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none cursor-pointer"
            >
              <option value="all">Semua Tahun</option>
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>



          {/* Date Range - Start */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-medium shrink-0">Dari:</span>
            <input
              id="filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Date Range - End */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-medium shrink-0">S.d:</span>
            <input
              id="filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* Reports Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <th className="py-3 px-4 text-center w-12">No</th>
              <th className="py-3 px-4 w-32">ID Laporan</th>
              <th className="py-3 px-4 w-44">Nama / Jabatan</th>
              <th className="py-3 px-3 w-28 text-center">Tanggal</th>
              <th className="py-3 px-4">Uraian Detail Kegiatan</th>
              <th className="py-3 px-4 w-52">Output / Hasil</th>
              <th className="py-3 px-4 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredLaporan.map((lap, index) => (
              <tr key={lap.ID} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4 text-center font-medium text-slate-400">
                  {index + 1}
                </td>
                <td className="py-4 px-4 font-mono font-medium text-slate-500">
                  {lap.ID}
                </td>
                <td className="py-4 px-4">
                  <div className="font-semibold text-slate-900">{lap.Nama}</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{lap.Jabatan}</div>
                  <div className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded inline-block mt-0.5 max-w-[150px] truncate" title={lap.Subbagian}>
                    {lap.Subbagian}
                  </div>
                </td>
                <td className="py-4 px-3 text-center">
                  <div className="font-medium inline-flex items-center gap-1 text-slate-800">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {lap.Tanggal}
                  </div>
                </td>
                <td className="py-4 px-4 font-normal text-slate-800 text-xs leading-relaxed max-w-sm sm:max-w-md">
                  {lap.Kegiatan}
                </td>
                <td className="py-4 px-4 font-normal text-slate-700 italic max-w-[180px] truncate" title={lap.Output}>
                  {lap.Output}
                </td>
                <td className="py-4 px-4 text-center">
                  {/* Enable edit & delete only if it belongs to current active user (employees can edit their own logs, admins can delete for moderation/cleanups) */}
                  {lap.UserID === currentUser.ID ? (
                    <div className="inline-flex items-center gap-1.5 justify-center">
                      <button
                        title="Edit Laporan"
                        id={`btn-edit-${lap.ID}`}
                        onClick={() => onEdit(lap)}
                        className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Hapus Laporan"
                        id={`btn-delete-${lap.ID}`}
                        onClick={() => onDelete(lap.ID)}
                        className="p-1 px-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : isAdmin ? (
                    <div className="inline-flex items-center gap-1.5 justify-center">
                      <button
                        title="Hapus Laporan"
                        id={`btn-delete-${lap.ID}`}
                        onClick={() => onDelete(lap.ID)}
                        className="p-1 px-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] italic text-slate-400">Terkunci</span>
                  )}
                </td>
              </tr>
            ))}

            {filteredLaporan.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 px-4 text-center">
                  <div className="text-slate-400 text-xs">Tidak ditemukan laporan kegiatan harian yang cocok dengan kriteria filter.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
