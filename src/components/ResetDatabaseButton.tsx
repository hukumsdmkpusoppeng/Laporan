/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ResetDatabaseButtonProps {
  onResetComplete: () => void;
}

export default function ResetDatabaseButton({ onResetComplete }: ResetDatabaseButtonProps) {
  const [resetting, setResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleReset = async () => {
    setResetting(true);
    setShowConfirm(false);
    setFeedback(null);
    try {
      const response = await fetch('/api/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setFeedback({
          type: 'success',
          message: 'Database simulasi lokal berhasil disetel ulang sesuai default data screenshots!'
        });
        onResetComplete();
      } else {
        setFeedback({
          type: 'error',
          message: 'Gagal menyetel ulang database.'
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: 'Koneksi terganggu. Gagal reset.'
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="relative">
      <button
        id="btn-reset-db"
        onClick={() => setShowConfirm(true)}
        disabled={resetting}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 font-semibold text-[11px] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        title="Setel Ulang Data Simulasi ke Default Screenshots"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>{resetting ? 'Mereset...' : 'Setel Ulang Data'}</span>
      </button>

      {/* Temporary Feedbacks */}
      <AnimatePresence>
        {feedback && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFeedback(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-xl p-5 max-w-sm w-full border border-slate-100 space-y-4"
            >
              <div className="space-y-1">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${feedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {feedback.type === 'success' ? 'Berhasil' : 'Kesalahan'}
                </h4>
                <p className="text-xs text-slate-600 leading-normal">
                  {feedback.message}
                </p>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold transition-colors"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-xl p-5 max-w-sm w-full border border-slate-100 space-y-4"
            >
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider">Setel Ulang Database</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Apakah Anda ingin menyetel ulang database simulasi lokal ke nilai awal? Semua laporan baru yang disimpan secara lokal akan dihapus.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-semibold text-slate-700 transition-colors animate-none"
                >
                  Batal
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                >
                  Ya, Setel Ulang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
