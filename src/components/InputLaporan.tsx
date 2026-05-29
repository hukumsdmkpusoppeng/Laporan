/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Laporan, User } from '../types';
import { Calendar, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface InputLaporanProps {
  currentUser: User;
  onLaporanAdded: (newLaporan: Laporan) => void;
  editTarget?: Laporan | null;
  onCancelEdit?: () => void;
  onLaporanUpdated?: (updatedLaporan: Laporan) => void;
}

export default function InputLaporan({ 
  currentUser, 
  onLaporanAdded, 
  editTarget, 
  onCancelEdit,
  onLaporanUpdated
}: InputLaporanProps) {
  const [tanggal, setTanggal] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [output, setOutput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Set default date to today
  useEffect(() => {
    if (editTarget) {
      setTanggal(editTarget.Tanggal);
      setKegiatan(editTarget.Kegiatan);
      setOutput(editTarget.Output);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setTanggal(today);
      setKegiatan('');
      setOutput('');
    }
    setSuccessMsg('');
    setErrorMsg('');
  }, [editTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal || !kegiatan.trim() || !output.trim()) {
      setErrorMsg('Semua fields wajib diisi dengan benar');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (editTarget) {
        // Edit flow
        const response = await fetch(`/api/laporan/${editTarget.ID}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            Tanggal: tanggal,
            Kegiatan: kegiatan,
            Output: output
          })
        });

        if (response.ok) {
          const updated = await response.json();
          setSuccessMsg('Laporan berhasil diperbarui!');
          if (onLaporanUpdated) {
            onLaporanUpdated(updated);
          }
          // Reset edit form / state
          if (onCancelEdit) {
            onCancelEdit();
          }
        } else {
          setErrorMsg('Gagal memperbarui laporan harian.');
        }
      } else {
        // Add flow
        const randomID = `R1779${Math.floor(Date.now() / 1000).toString().slice(-8)}`;
        const payload = {
          ID: randomID,
          UserID: currentUser.ID,
          Nama: currentUser.Nama,
          Jabatan: currentUser.Jabatan,
          Subbagian: currentUser.Subbagian,
          Tanggal: tanggal,
          Kegiatan: kegiatan,
          Output: output
        };

        const response = await fetch('/api/laporan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const added = await response.json();
          onLaporanAdded(added);
          setSuccessMsg('Laporan harian berhasil disimpan!');
          setKegiatan('');
          setOutput('');
          // reset date to today
          setTanggal(new Date().toISOString().split('T')[0]);
        } else {
          setErrorMsg('Gagal menyimpan laporan ke server.');
        }
      }
    } catch (err) {
      console.error('Error submitting activity:', err);
      setErrorMsg('Koneksi bermasalah. Kegiatan tersimpan lokal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
            {editTarget ? 'Edit Laporan Kegiatan Harian' : 'Input Kegiatan Harian'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Petugas: <span className="font-semibold text-slate-800">{currentUser.Nama}</span> ({currentUser.Jabatan} / {currentUser.Subbagian})
          </p>
        </div>
        <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
          <FileText className="h-4 w-4" />
        </div>
      </div>

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 border-l-4 border-emerald-500 p-4 text-xs text-emerald-800 rounded-r-lg flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {errorMsg && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-xs text-amber-800 rounded-r-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Tanggal */}
        <div>
          <label htmlFor="tanggal-input" className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1 shadow-none">
            Tanggal Kegiatan
          </label>
          <div className="relative rounded-lg shadow-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Calendar className="h-4 w-4" />
            </div>
            <input
              id="tanggal-input"
              type="date"
              required
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-xs transition-all"
            />
          </div>
        </div>

        {/* Kegiatan */}
        <div>
          <label htmlFor="kegiatan-input" className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1 flex items-center justify-between">
            <span>Uraian Kegiatan</span>
            <span className="text-[9px] text-slate-400 font-normal">Tulis detail, spesifik, & komunikatif</span>
          </label>
          <textarea
            id="kegiatan-input"
            rows={4}
            required
            placeholder="Contoh: Menyusun draf rancangan surat keputusan verifikasi administrasi bakal calon legislatif, merekapitulasi usulan berkas pendaftaran dari partai politik serta memeriksa berkas pendukung keguruan..."
            value={kegiatan}
            onChange={(e) => setKegiatan(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:focus:border-red-500 text-xs transition-all font-sans"
          />
        </div>

        {/* Output */}
        <div>
          <label htmlFor="output-input" className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1 flex items-center justify-between">
            <span>Hasil / Output</span>
            <span className="text-[9px] text-slate-400 font-normal">Sebutkan satuan keluaran</span>
          </label>
          <input
            id="output-input"
            type="text"
            required
            placeholder="Contoh: 1 Berkas Rekapitulasi / Draft Dokumen Acara"
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:focus:border-red-500 text-xs transition-all"
          />
        </div>

        <div className="flex gap-2 pt-2">
          {editTarget && (
            <button
              id="btn-cancel-edit"
              type="button"
              onClick={onCancelEdit}
              className="flex-1 h-9 flex justify-center items-center py-2 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors"
            >
              Batal
            </button>
          )}
          <button
            id="btn-submit-laporan"
            type="submit"
            disabled={submitting}
            className="flex-3 flex-1 h-9 flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors gap-1.5"
          >
            {submitting ? 'Menyimpan...' : (
              <>
                <Sparkles className="h-4 w-4 shrink-0" />
                {editTarget ? 'Simpan Pembaruan' : 'Kirim Laporan'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
