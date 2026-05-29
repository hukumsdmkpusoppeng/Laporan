/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Laporan, User } from '../types';
import { Calendar, Users, ClipboardList, Database, CheckCircle, HelpCircle, History, Clock, ArrowRight, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import CalendarChecklist from './CalendarChecklist';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface DashboardStatsProps {
  currentLaporan: Laporan[];
  users: User[];
  appsScriptConfig: { appsScriptUrl: string; isConnected: boolean };
  currentUser: User;
}

export default function DashboardStats({ currentLaporan, users, appsScriptConfig, currentUser }: DashboardStatsProps) {
  const [todayCount, setTodayCount] = useState(0);
  const [totalPegawai, setTotalPegawai] = useState(0);
  
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [targetHariKerja, setTargetHariKerja] = useState<number>(() => {
    const cached = localStorage.getItem('kpu_target_hari_kerja');
    return cached ? Number(cached) : 20;
  });

  const handleTargetChange = (val: number) => {
    setTargetHariKerja(val);
    localStorage.setItem('kpu_target_hari_kerja', String(val));
  };

  const isPegawai = currentUser.Role === 'pegawai';

  // Construct year-month string for filtering, e.g. "2026-05"
  const monthStr = useMemo(() => {
    return `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  }, [selectedYear, selectedMonth]);

  // Filter laporan for selected month & year
  const monthlyLaporan = useMemo(() => {
    return currentLaporan.filter(l => l.Tanggal && l.Tanggal.startsWith(monthStr));
  }, [currentLaporan, monthStr]);

  // Filter laporan for pegawai to ONLY show their own reports in the selected month
  const filteredLaporan = useMemo(() => {
    return isPegawai
      ? monthlyLaporan.filter(l => l.Nama === currentUser.Nama)
      : monthlyLaporan;
  }, [isPegawai, monthlyLaporan, currentUser.Nama]);

  useEffect(() => {
    // Get current date in locally formatted YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Count today's submissions for the active context (unfiltered by selectedMonth to represent real today status)
    const activeOverallLaporan = isPegawai
      ? currentLaporan.filter(l => l.Nama === currentUser.Nama)
      : currentLaporan;
    const todays = activeOverallLaporan.filter(l => l.Tanggal === todayStr);
    setTodayCount(todays.length);

    // Count pegawai users (excluding Admin)
    const pegawais = users.filter(u => u.Role === 'pegawai');
    setTotalPegawai(pegawais.length);
  }, [currentLaporan, users, isPegawai, currentUser.Nama]);

  const employeeContributions: Record<string, { count: number; subbagian: string; jabatan: string; reportedDates: string[] }> = {};
  if (!isPegawai) {
    users.forEach(u => {
      if (u.Role === 'pegawai') {
        employeeContributions[u.Nama] = { count: 0, subbagian: u.Subbagian, jabatan: u.Jabatan, reportedDates: [] };
      }
    });

    monthlyLaporan.forEach(l => {
      if (!employeeContributions[l.Nama]) {
        employeeContributions[l.Nama] = {
          count: 0,
          subbagian: l.Subbagian || 'Tidak Diketahui',
          jabatan: l.Jabatan || 'Staf',
          reportedDates: []
        };
      }
      employeeContributions[l.Nama].count += 1;
      if (l.Tanggal && !employeeContributions[l.Nama].reportedDates.includes(l.Tanggal)) {
        employeeContributions[l.Nama].reportedDates.push(l.Tanggal);
      }
    });
  }

  const employeeDataList = Object.entries(employeeContributions)
    .map(([nama, val]) => {
      const uniqueDays = val.reportedDates.length;
      const percentage = Math.min(100, Math.round((uniqueDays / targetHariKerja) * 100));
      return { nama, ...val, uniqueDays, percentage };
    })
    .sort((a, b) => b.percentage - a.percentage || b.count - a.count);

  // Meneropong aktivitas terbaru secara global (diurutkan berdasarkan Tanggal terbaru)
  const sortedRecentLaporan = useMemo(() => {
    return [...currentLaporan]
      .sort((a, b) => {
        const dateA = a.Tanggal || '';
        const dateB = b.Tanggal || '';
        if (dateA === dateB) {
          const idA = a.ID || '';
          const idB = b.ID || '';
          // Numerical safe or string representation fallback
          return idB.localeCompare(idA);
        }
        return dateB.localeCompare(dateA);
      })
      .slice(0, 5);
  }, [currentLaporan]);

  // Pegawai specific compliance values for selected month
  const myReports = filteredLaporan;
  const myUniqueDates = Array.from(new Set(myReports.map(l => l.Tanggal)));
  const myUniqueReportedDays = myUniqueDates.length;
  const myCompliancePercentage = Math.min(100, Math.round((myUniqueReportedDays / targetHariKerja) * 100));

  // Additional helper metrics for tidier view for selected month
  const myRemainingDays = Math.max(0, targetHariKerja - myUniqueReportedDays);
  const myAverageDailyCount = myUniqueReportedDays > 0 
    ? (myReports.length / myUniqueReportedDays).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Parameter Konfigurasi Target Hari Kerja */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-red-50/40 via-white to-white p-5 rounded-2xl border border-red-100/50 shadow-xs">
        <div>
          <h4 className="text-xs font-extrabold text-red-750 text-red-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-650 inline-block animate-pulse"></span>
            Metode Pengukuran Kepatuhan
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Persentase kepatuhan dihitung berdasarkan jumlah hari aktif kirim laporan dibandingkan dengan target hari kerja bulanan.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-150/40 p-2 rounded-xl w-full lg:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-650 text-slate-600">Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 outline-none focus:border-red-500 font-bold shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-650 text-slate-600">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 outline-none focus:border-red-500 font-bold shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"
            >
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200/80 pl-3">
            <span className="text-xs font-semibold text-slate-650 text-slate-600">Target Absen:</span>
            <select
              value={targetHariKerja}
              onChange={(e) => handleTargetChange(Number(e.target.value))}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 outline-none focus:border-red-500 font-bold shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"
            >
              {[10, 15, 18, 20, 21, 22, 23, 24, 25, 26, 30].map(h => (
                <option key={h} value={h}>{h} Hari</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Conditional Rendering based on Role */}
      {isPegawai ? (
        /* PEGAWAI SECURE / PRIVATE VIEW: No details of other pegawai are included */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Status Pelaporan Keaktifan Mandiri</h3>
                <p className="text-xs text-slate-700 font-bold mt-1">Ringkasan kepatuhan dan status pelaporan harian Anda.</p>
              </div>
              <span className="text-[10px] bg-red-50 text-red-700 px-3 py-1 rounded-full font-bold border border-red-100">Evaluasi Baru</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Card 1: Compliance Rate */}
              <div className="bg-slate-50/50 p-4.5 rounded-xl border border-slate-100/80 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Kepatuhan Melaporkan</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Rasio hari kerja terlaporkan lengkap</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900">{myCompliancePercentage}%</span>
                    <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded-md">
                      {myUniqueReportedDays} / {targetHariKerja} Hari
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/50 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${myCompliancePercentage}%` }}
                      transition={{ duration: 0.6 }}
                      className="bg-emerald-500 h-full rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Remaining days to target */}
              <div className="bg-slate-50/50 p-4.5 rounded-xl border border-slate-100/80 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Sisa Hari Kerja Target</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Kekurangan pengiriman laporan harian</span>
                </div>
                <div className="mt-4">
                  {myRemainingDays === 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xl font-black text-emerald-600">Target Tercap</span>
                      <span className="text-[10px] font-extrabold text-white bg-emerald-500 px-1.5 py-0.5 rounded uppercase tracking-wide scale-90">Selesai</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-rose-600">{myRemainingDays}</span>
                      <span className="text-xs font-semibold text-slate-500">Hari lagi</span>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Berdasarkan pengaturan target {targetHariKerja} hari kerja.</p>
                </div>
              </div>

              {/* Card 3: Intensity of activities */}
              <div className="bg-slate-50/50 p-4.5 rounded-xl border border-slate-100/80 flex flex-col justify-between block">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Rata-rata Intensitas</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Rata-rata kegiatan yang dilaporkan per hari aktif</span>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{myAverageDailyCount}</span>
                    <span className="text-xs font-semibold text-slate-500">Kegiatan / Hari</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Dari total {myReports.length} rincian kegiatan terdaftar.</p>
                </div>
              </div>
            </div>
          </div>

          <CalendarChecklist 
            currentLaporan={currentLaporan} 
            users={users} 
            currentUser={currentUser} 
            targetHariKerja={targetHariKerja} 
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />

          {/* Pegawai-only timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wide">Aktivitas Laporan Kegiatan Terbaru Anda</h3>
            <div className="relative border-l-2 border-slate-100 pl-4 space-y-6">
              {filteredLaporan.slice(0, 5).map((lap) => (
                <div key={lap.ID} className="relative">
                  <div className="absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full bg-red-650 border-2 border-white ring-4 ring-red-50"></div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
                    <div className="text-xs font-medium">
                      <span className="font-bold text-slate-900">Anda ({lap.Jabatan})</span> 
                      <span className="text-slate-500"> mengisi laporan pada tanggal </span>
                      <span className="font-bold text-red-650 text-[#dc2626] font-mono">{lap.Tanggal}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                      ID: {lap.ID}
                    </div>
                  </div>
                  
                  <div className="mt-2.5 text-xs bg-slate-50/60 p-3 rounded-xl text-slate-700 border border-slate-100 italic leading-relaxed">
                    "{lap.Kegiatan}"
                    <div className="text-[10px] mt-1.5 text-slate-500 not-italic font-semibold flex items-center gap-1">
                      <span className="w-1 h-3 bg-red-500 rounded-full inline-block"></span>
                      Hasil/Output: {lap.Output}
                    </div>
                  </div>
                </div>
              ))}

              {filteredLaporan.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">Belum ada kegiatan yang dilaporkan harian secara mandiri.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ADMIN FULL/AGREGATE VIEW with full ranking statistics & details of all employees */
        <div className="space-y-6">
          {/* Real-time Employee Productivity ranking Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Progres Kepatuhan Laporan Pegawai</h3>
                <p className="text-[10px] text-slate-400 font-medium">Berdasarkan rasio hari absensi laporan terhadap target hari kerja.</p>
              </div>
              <span className="text-[10px] bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-bold border border-red-100">Bulan Ini</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-650">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5">Nama Pegawai / Jabatan</th>
                    <th className="py-2.5 hidden md:table-cell">Subbagian</th>
                    <th className="py-2.5 font-bold text-right">Hari Kirim Laporan</th>
                    <th className="py-2.5 text-right font-bold">Progres Target ({targetHariKerja} H)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-sans">
                  {employeeDataList.map((emp, index) => (
                    <tr key={emp.nama} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 font-medium text-slate-900 flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 bg-slate-100 text-slate-700 font-bold rounded text-[10px]">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-800">{emp.nama}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{emp.jabatan || 'Staf'}</div>
                        </div>
                      </td>
                      <td className="py-2.5 hidden md:table-cell text-slate-500">{emp.subbagian}</td>
                      <td className="py-2.5 font-bold text-slate-800 text-right">
                        {emp.uniqueDays} / {targetHariKerja} Hari 
                        <span className="block text-[9px] font-normal text-slate-450 mt-0.5">({emp.count} total laporan)</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="inline-flex flex-col items-end gap-1 min-w-[100px]">
                          <span className="font-extrabold text-red-650 text-xs text-[#dc2626]">
                            {emp.percentage}%
                          </span>
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${emp.percentage}%` }}
                              transition={{ duration: 0.6 }}
                              className="bg-red-500 h-full rounded-full"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {employeeDataList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400">Belum ada pegawai terdaftar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <CalendarChecklist 
            currentLaporan={currentLaporan} 
            users={users} 
            currentUser={currentUser} 
            targetHariKerja={targetHariKerja} 
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />

          {/* Recent submissions feed - Real-time activity timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                  <History className="h-4 w-4 text-red-600 animate-spin-slow" />
                  Aktivitas Terbaru Pegawai
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Lini masa kronologis 5 pengiriman laporan kegiatan harian pegawai teranyar secara real-time.
                </p>
              </div>
              <span className="text-[10px] bg-red-50 text-red-600 border border-red-100/60 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider font-mono">
                Live Feed
              </span>
            </div>

            <div className="relative border-l-2 border-slate-100 pl-6 space-y-6">
              {sortedRecentLaporan.map((lap) => {
                const initials = lap.Nama ? lap.Nama.slice(0, 2).toUpperCase() : 'PE';
                return (
                  <div key={lap.ID} className="relative group">
                    {/* Ring timeline indicator node */}
                    <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-red-600 border-4 border-white ring-2 ring-red-100 group-hover:scale-125 transition-transform duration-200"></div>
                    
                    <div className="bg-slate-50/65 hover:bg-slate-50 border border-slate-100/80 rounded-xl p-4.5 space-y-3 shadow-2xs hover:shadow-xs hover:border-slate-200/50 transition-all duration-200">
                      
                      {/* Submissions header: User Info & Meta */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="flex items-center gap-3">
                          {/* Round initial bubble */}
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-250 flex items-center justify-center font-black font-mono text-[10px] text-slate-700 shrink-0 uppercase tracking-widest shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                              {lap.Nama}
                              <span className="text-[9px] font-bold bg-white text-slate-500 border border-slate-200 px-2 py-0.5 rounded">
                                {lap.Jabatan}
                              </span>
                            </div>
                            <div className="text-[10px] font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                              <span className="font-semibold text-slate-500">{lap.Subbagian || 'Umum & Logistik'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Submission Date / ID Badge */}
                        <div className="flex items-center sm:flex-col items-end gap-2 sm:gap-1 text-right mt-1 sm:mt-0">
                          <span className="text-[10px] text-slate-400 font-mono bg-white border border-slate-200/80 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-red-500" />
                            <span>{lap.Tanggal}</span>
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 font-mono hidden sm:inline">
                            ID: #{lap.ID}
                          </span>
                        </div>
                      </div>

                      {/* Content block */}
                      <div className="text-xs text-slate-700 leading-relaxed font-medium bg-white/90 border border-slate-100 p-3.5 rounded-xl italic relative shadow-3xs">
                        <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest not-italic mb-1.5 flex items-center gap-1">
                          <FileText className="h-3 w-3 text-slate-400" />
                          <span>Rincian Kegiatan:</span>
                        </div>
                        <span className="text-slate-800">"{lap.Kegiatan}"</span>
                        
                        <div className="mt-2.5 pt-2 border-t border-slate-50 not-italic flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0 text-[10px] tracking-wide inline-flex items-center gap-1 font-bold">
                            Hasil / Output
                          </span>
                          <span className="text-slate-600 truncate">{lap.Output}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}

              {sortedRecentLaporan.length === 0 && (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                  <ClipboardList className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <span className="block font-bold text-xs text-slate-700">Belum ada aktivitas</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Silakan tunggu pegawai mengirimkan laporan harian pertama mereka.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
