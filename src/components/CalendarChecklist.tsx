/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Laporan, User } from '../types';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Inbox, 
  Clock, 
  FileText, 
  User as UserIcon,
  HelpCircle,
  Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Indonesian National Public Holidays list (empty as requested to satisfy Saturday and Sunday only)
const HOLIDAYS_BY_DATE: Record<string, string> = {
};

interface CalendarChecklistProps {
  currentLaporan: Laporan[];
  users: User[];
  currentUser: User;
  targetHariKerja: number;
  selectedMonth?: number;
  selectedYear?: number;
  onMonthChange?: (month: number) => void;
  onYearChange?: (year: number) => void;
}

export default function CalendarChecklist({ 
  currentLaporan, 
  users, 
  currentUser, 
  targetHariKerja,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange
}: CalendarChecklistProps) {
  const isPegawai = currentUser.Role === 'pegawai';

  // State to filter employee (for admins)
  const [selectedPegawai, setSelectedPegawai] = useState<string>(() => {
    if (isPegawai) return currentUser.Nama;
    // For admin, default to "all" or the first employee
    const pegawais = users.filter(u => u.Role === 'pegawai');
    return pegawais.length > 0 ? pegawais[0].Nama : 'all';
  });

  // Calendar Year and Month states (0-indexed for month, i.e., 4 = May)
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(selectedYear ?? today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(selectedMonth ?? today.getMonth());

  // Keep internal calendar state synchronized with external prop values
  useEffect(() => {
    if (selectedYear !== undefined) {
      setCurrentYear(selectedYear);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (selectedMonth !== undefined) {
      setCurrentMonth(selectedMonth);
    }
  }, [selectedMonth]);

  // Filter laporan based on active employee
  const employeeLaporan = useMemo(() => {
    if (selectedPegawai === 'all') {
      return currentLaporan;
    }
    return currentLaporan.filter(l => l.Nama === selectedPegawai);
  }, [currentLaporan, selectedPegawai]);

  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  // Names of months in Indonesian
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Helper to change month
  const prevMonth = () => {
    let newMonth = currentMonth;
    let newYear = currentYear;
    if (currentMonth === 0) {
      newMonth = 11;
      newYear = currentYear - 1;
      setCurrentMonth(newMonth);
      setCurrentYear(newYear);
      if (onYearChange) onYearChange(newYear);
    } else {
      newMonth = currentMonth - 1;
      setCurrentMonth(newMonth);
    }
    if (onMonthChange) onMonthChange(newMonth);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    let newMonth = currentMonth;
    let newYear = currentYear;
    if (currentMonth === 11) {
      newMonth = 0;
      newYear = currentYear + 1;
      setCurrentMonth(newMonth);
      setCurrentYear(newYear);
      if (onYearChange) onYearChange(newYear);
    } else {
      newMonth = currentMonth + 1;
      setCurrentMonth(newMonth);
    }
    if (onMonthChange) onMonthChange(newMonth);
    setSelectedDay(null);
  };

  // Days in month calculation
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // Index of first day of the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  // Convert first day index to Monday-based index (0 = Monday, ..., 6 = Sunday)
  const startOffset = useMemo(() => {
    return firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  }, [firstDayIndex]);

  // Generate calendar days array
  const calendarDays = useMemo(() => {
    const days = [];
    // Pad previous month days placeholder
    for (let i = 0; i < startOffset; i++) {
      days.push({ placeholder: true, dayNum: 0, isHoliday: false, holidayName: '', isWeekend: false, dateStr: '', reports: [] });
    }
    // Fill current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(currentYear, currentMonth, d).getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const dayReports = employeeLaporan.filter(l => l.Tanggal === dateStr);
      const isSubmitted = dayReports.length > 0;
      
      const holidayName = HOLIDAYS_BY_DATE[dateStr] || null;
      const isHoliday = !!holidayName;

      days.push({
        placeholder: false,
        dayNum: d,
        dateStr,
        isWeekend,
        isSubmitted,
        isHoliday,
        holidayName: holidayName || '',
        reports: dayReports
      });
    }
    return days;
  }, [currentYear, currentMonth, daysInMonth, startOffset, employeeLaporan]);

  // Selected Day Reports
  const activeDayData = useMemo(() => {
    if (!selectedDay) return null;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    const dayOfWeek = new Date(currentYear, currentMonth, selectedDay).getDay();
    const dayNamesList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const holidayName = HOLIDAYS_BY_DATE[dateStr] || null;
    
    return {
      dateLabel: `${dayNamesList[dayOfWeek]}, ${selectedDay} ${monthNames[currentMonth]} ${currentYear}`,
      dateStr,
      holidayName,
      isHoliday: !!holidayName,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      reports: employeeLaporan.filter(l => l.Tanggal === dateStr)
    };
  }, [selectedDay, currentYear, currentMonth, employeeLaporan]);

  // Pegawais for admin selector
  const listPegawai = useMemo(() => {
    return users.filter(u => u.Role === 'pegawai');
  }, [users]);

  // Compliance calculations for the selected month
  const monthComplianceStats = useMemo(() => {
    let weekdayCount = 0;
    let weekdaySubmittedCount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = !!HOLIDAYS_BY_DATE[dateStr];
      
      if (!isWeekend && !isHoliday) {
        weekdayCount++;
        const hasReport = employeeLaporan.some(l => l.Tanggal === dateStr);
        if (hasReport) {
          weekdaySubmittedCount++;
        }
      }
    }

    const percentage = weekdayCount > 0 
      ? Math.round((weekdaySubmittedCount / weekdayCount) * 100) 
      : 0;

    return {
      weekdayCount,
      weekdaySubmittedCount,
      percentage
    };
  }, [currentYear, currentMonth, daysInMonth, employeeLaporan]);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Kalender Checklist Kepatuhan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monitoring riwayat keaktifan pengiriman laporan harian per tanggal.</p>
            </div>
          </div>
        </div>

        {/* Filter Selection */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {!isPegawai && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/50 rounded-lg px-2.5 py-1.5 w-full sm:w-auto">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Pegawai:</span>
              <select
                value={selectedPegawai}
                onChange={(e) => {
                  setSelectedPegawai(e.target.value);
                  setSelectedDay(null);
                }}
                className="text-xs bg-transparent border-none text-slate-800 font-semibold focus:ring-0 outline-none cursor-pointer p-0 pr-6"
              >
                <option value="all">📊 Akumulasi Seluruh Pegawai</option>
                {listPegawai.map(p => (
                  <option key={p.Nama} value={p.Nama}>👤 {p.Nama}</option>
                ))}
              </select>
            </div>
          )}

          {/* Month Navigator */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm w-full sm:w-auto justify-between">
            <button
              onClick={prevMonth}
              className="p-1 px-2.5 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-3 whitespace-nowrap">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 px-2.5 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>



      {/* Main Grid: Calendar Grid & Details Column */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Calendar Board (grid cols span 3) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Days notation names header */}
          <div className="grid grid-cols-7 gap-1 font-sans text-center">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((dayName, idx) => (
              <div 
                key={dayName} 
                className={`text-[11px] font-bold uppercase tracking-wider py-1.5 ${
                  idx >= 5 ? 'text-rose-500 bg-rose-50/20 rounded' : 'text-slate-400'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Actual Month Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day, idx) => {
              if (day.placeholder) {
                return (
                  <div 
                    key={`place-${idx}`} 
                    className="aspect-square bg-slate-50/30 rounded-lg border border-slate-50 border-dashed"
                  />
                );
              }

              const isSelected = selectedDay === day.dayNum;
              const hasReports = day.reports && day.reports.length > 0;
              
              // Determine visual backgrounds
              let dayStyles = "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-100";
              let badgeHighlight = null;

              if (hasReports) {
                dayStyles = "bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-150 relative";
                if (day.isHoliday) {
                  dayStyles = "bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-rose-300 relative ring-1 ring-rose-200";
                }
                badgeHighlight = (
                  <span className="absolute bottom-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                );
              } else if (day.isHoliday) {
                dayStyles = "bg-rose-100/50 hover:bg-rose-150/60 text-rose-700 border-rose-200 shadow-xs cursor-help animate-pulse-subtle";
              } else if (day.isWeekend) {
                dayStyles = "bg-rose-50/80 hover:bg-rose-100/85 text-rose-700 border-rose-150/30";
              }

              if (isSelected) {
                dayStyles += " ring-2 ring-red-500 ring-offset-1 font-extrabold scale-102 shadow-sm";
              }

              // Checks if the date matches today
              const todayStr = today.toISOString().split('T')[0];
              const isToday = day.dateStr === todayStr;

              return (
                <button
                  key={`day-${day.dayNum}`}
                  onClick={() => setSelectedDay(day.dayNum)}
                  className={`aspect-square rounded-xl border flex flex-col justify-between p-1.5 transition-all text-left group relative ${dayStyles}`}
                  title={day.isHoliday ? `${day.dayNum} ${monthNames[currentMonth]} - ${day.holidayName}` : undefined}
                >
                  {/* Day Number and status tick */}
                  <div className="flex justify-between items-start w-full">
                    <span className={`text-xs ${isToday ? 'font-black px-1.5 py-0.5 bg-red-600 text-white rounded-md shadow-sm' : 'font-semibold'}`}>
                      {day.dayNum}
                    </span>
                    {hasReports ? (
                      <div className="flex items-center gap-1">
                        {day.isHoliday && (
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" title={day.holidayName} />
                        )}
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      </div>
                    ) : day.isHoliday ? (
                      <span className="text-[8px] sm:text-[9px] text-rose-700 bg-rose-200/70 font-extrabold px-1 rounded cursor-help" title={day.holidayName}>LIBUR</span>
                    ) : day.isWeekend ? (
                      <span className="text-[8px] sm:text-[9px] text-rose-700 bg-rose-200/50 font-extrabold px-1 rounded">LIBUR</span>
                    ) : (
                      <span className="text-[10px] text-slate-350 shrink-0 select-none">-</span>
                    )}
                  </div>

                  {/* Tiny text context for admin / or report count */}
                  <div className="flex flex-col justify-end items-start w-full mt-1 overflow-hidden">
                    {day.reports && day.reports.length > 0 ? (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1 py-0.5 rounded leading-none shrink-0" title={`${day.reports.length} Laporan`}>
                        {day.reports.length} lap
                      </span>
                    ) : (
                      <span />
                    )}
                    {day.isHoliday && (
                      <span className="text-[7.5px] font-bold text-rose-700 bg-rose-100/70 px-1 py-0.5 rounded truncate w-full block mt-0.5 cursor-help" title={day.holidayName}>
                        🎉 {day.holidayName}
                      </span>
                    )}
                    {badgeHighlight}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Calendar Indicators Legends */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-555 pt-3 border-t border-slate-50 gap-2">
            <div className="flex flex-wrap items-center gap-3.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                <span>Laporan Tersedia (Ceklist OK)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-50 border border-rose-100/50 inline-block"></span>
                <span className="font-bold text-rose-600">Hari Libur (Sabtu & Minggu)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-white border border-slate-200 inline-block"></span>
                <span>Belum Terlapor</span>
              </span>
            </div>
            
            <div className="font-medium text-slate-400">
              *Klik kotak tanggal untuk detail kegiatan Anda/Pegawai
            </div>
          </div>

        </div>

        {/* Right Side: Specific Selected Day Detail Drawer layout */}
        <div className="lg:col-span-2 bg-slate-50 border border-slate-100 rounded-xl p-5 flex flex-col justify-between space-y-4 min-h-[300px]">
          
          <div className="space-y-4">
            <div className="border-b border-rose-100/60 pb-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" /> detail aktivitas tanggal
                </span>
                <h4 className="text-xs font-bold text-slate-900 mt-1">
                  {activeDayData ? activeDayData.dateLabel : 'Pilih tanggal di kalender'}
                </h4>
              </div>
              <Flag className="h-4 w-4 text-red-500/70" />
            </div>

            {activeDayData && activeDayData.isHoliday && (
              <div className="bg-rose-50 border border-rose-100/60 p-3 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
                <Flag className="h-4 w-4 shrink-0 text-rose-650 text-rose-600 mt-0.5 animate-pulse" />
                <div>
                  <p className="font-black text-[10px] text-rose-800 uppercase tracking-wider">Hari Libur Nasional / Keagamaan</p>
                  <p className="font-semibold text-rose-700 mt-0.5">{activeDayData.holidayName}</p>
                </div>
              </div>
            )}

            {/* List of Laporan of this Day */}
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {activeDayData && activeDayData.reports.length > 0 ? (
                  activeDayData.reports.map((lap) => (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      key={lap.ID}
                      className="bg-white p-3 rounded-lg border border-slate-200/50 shadow-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-1 pb-1.5 border-b border-slate-50 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-900 truncate" title={lap.Nama}>
                          👤 {lap.Nama}
                        </span>
                        <span className="text-[9px] font-bold text-red-650 bg-red-50 text-red-700 px-1.5 py-0.5 rounded shrink-0">
                          {lap.Subbagian}
                        </span>
                      </div>

                      <div className="text-[11px] font-semibold text-slate-700 leading-normal flex gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-450 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800">Kegiatan:</p>
                          <p className="font-normal text-slate-600 italic whitespace-pre-line leading-relaxed">{lap.Kegiatan}</p>
                        </div>
                      </div>

                      <div className="mt-2 text-[10px] text-slate-500 leading-normal bg-slate-50 p-2 rounded">
                        <span className="font-semibold text-slate-800">Capaian/Output:</span> {lap.Output}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 flex flex-col items-center justify-center text-center space-y-2 bg-white rounded-lg border border-slate-100"
                  >
                    <Inbox className="h-8 w-8 text-slate-300" />
                    <div className="text-xs font-semibold text-slate-500">
                      {selectedPegawai === 'all' 
                        ? 'Tidak Ada Laporan Dari Seluruh Pegawai' 
                        : 'Tidak Ada Laporan Kegiatan'}
                    </div>
                    <div className="text-[10px] text-slate-400 max-w-[200px]">
                      Belum ada laporan keaktifan harian terkirim untuk tanggal ini.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick tips reminder footer card panel */}
          <div className="text-[10px] text-slate-400 leading-normal bg-white p-3 rounded-lg border border-slate-200/40">
            <span className="font-bold text-slate-800">Catatan Sistem:</span> Sesuai tata tertib kinerja, setiap pegawai berkewajiban melaporkan keaktifan harian mandiri minimal {targetHariKerja} hari kerja terlaporkan setiap periodenya.
          </div>

        </div>

      </div>
    </div>
  );
}
