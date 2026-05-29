/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppConfig } from '../types';
import { 
  Clipboard, 
  Check, 
  HelpCircle, 
  Link, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  Sheet
} from 'lucide-react';
import { motion } from 'motion/react';

interface AppsScriptGuideProps {
  config: AppConfig;
  onConfigSaved: (newConfig: { appsScriptUrl: string; spreadsheetId: string }) => void;
}

export default function AppsScriptGuide({ config, onConfigSaved }: AppsScriptGuideProps) {
  const [appsScriptUrl, setAppsScriptUrl] = useState(config.appsScriptUrl);
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const appsScriptCode = `// KODE GOOGLE APPS SCRIPT - PENGHUBUNG GOOGLE SHEET DENGAN APLIKASI WEB KPU
// Petunjuk Lengkap:
// 1. Buat Spreadsheet baru di Google Drive Anda.
// 2. Buat sheet pertama bernama "Users" (tanpa tanda kutip), buat header di baris ke-1:
//    ID | Username | Password | Nama | Jabatan | Subbagian | Role
// 3. Masukkan data awal sesuai screenshots (misal U001 | admin | admin123 | Admin KPU | Kepala Sub Bagian | Parmas dan SDM | admin)
// 4. Buat sheet kedua bernama "Laporan" (tanpa tanda kutip), buat header di baris ke-1:
//    ID | UserID | Nama | Jabatan | Subbagian | Tanggal | Kegiatan | Output
// 5. Masuk menu Ekstensi > Apps Script. Hapus kode bawaan, pasang kode di bawah, simpan, lalu klik "Deploy" > "Deployment Baru"
// 6. Pilih tipe: Aplikasi Web. Jalankan sebagai: "Saya" (Me). Akses: "Siapa Saja" (Anyone). Deploy & salin URL-nya!

const SPREADSHEET_ID = ""; // Kosongkan jika script terikat langsung pada Google Spreadsheet Anda

function doGet(e) {
  const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  const action = e.parameter.action;
  
  if (action === "get_users") {
    const sheet = ss.getSheetByName("Users");
    if (!sheet) return createResponse({ error: "Sheet 'Users' tidak ditemukan" });
    const data = getSheetData(sheet);
    return createResponse(data);
  } else if (action === "get_laporan") {
    const sheet = ss.getSheetByName("Laporan");
    if (!sheet) return createResponse({ error: "Sheet 'Laporan' tidak ditemukan" });
    const data = getSheetData(sheet);
    return createResponse(data);
  }
  
  return createResponse({ error: "Action doGet tidak dikenali" });
}

function doPost(e) {
  const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    if (action === "add_laporan") {
      const sheet = ss.getSheetByName("Laporan");
      if (!sheet) return createResponse({ success: false, error: "Sheet 'Laporan' tidak ditemukan" });
      
      const rowData = [
        postData.id,
        postData.userId,
        postData.nama,
        postData.jabatan,
        postData.subbagian,
        postData.tanggal,
        postData.kegiatan,
        postData.output
      ];
      sheet.appendRow(rowData);
      return createResponse({ success: true, message: "Laporan berhasil ditambahkan" });
    } else if (action === "delete_laporan") {
      const sheet = ss.getSheetByName("Laporan");
      if (!sheet) return createResponse({ success: false, error: "Sheet 'Laporan' tidak ditemukan" });
      
      const rows = sheet.getDataRange().getValues();
      const idToDelete = postData.id;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] == idToDelete) {
          sheet.deleteRow(i + 1);
          return createResponse({ success: true, message: "Laporan berhasil dihapus" });
        }
      }
      return createResponse({ success: false, message: "Laporan tidak ditemukan" });
    } else if (action === "update_laporan") {
      const sheet = ss.getSheetByName("Laporan");
      if (!sheet) return createResponse({ success: false, error: "Sheet 'Laporan' tidak ditemukan" });
      
      const rows = sheet.getDataRange().getValues();
      const idToUpdate = postData.id;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] == idToUpdate) {
          sheet.getRange(i + 1, 6).setValue(postData.tanggal); // Tanggal
          sheet.getRange(i + 1, 7).setValue(postData.kegiatan); // Kegiatan
          sheet.getRange(i + 1, 8).setValue(postData.output);   // Output
          return createResponse({ success: true, message: "Laporan berhasil diperbarui" });
        }
      }
      return createResponse({ success: false, message: "Laporan tidak ditemukan" });
    } else if (action === "add_user") {
      const sheet = ss.getSheetByName("Users");
      if (!sheet) return createResponse({ success: false, error: "Sheet 'Users' tidak ditemukan" });
      
      const rowData = [
        postData.id,
        postData.username,
        postData.password,
        postData.nama,
        postData.jabatan,
        postData.subbagian,
        postData.role
      ];
      sheet.appendRow(rowData);
      return createResponse({ success: true, message: "Pegawai berhasil ditambahkan" });
    } else if (action === "delete_user") {
      const sheet = ss.getSheetByName("Users");
      if (!sheet) return createResponse({ success: false, error: "Sheet 'Users' tidak ditemukan" });
      
      const rows = sheet.getDataRange().getValues();
      const idToDelete = postData.id;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] == idToDelete) {
          sheet.deleteRow(i + 1);
          return createResponse({ success: true, message: "Pegawai berhasil dihapus" });
        }
      }
      return createResponse({ success: false, message: "Pegawai tidak ditemukan" });
    } else if (action === "update_user") {
      const sheet = ss.getSheetByName("Users");
      if (!sheet) return createResponse({ success: false, error: "Sheet 'Users' tidak ditemukan" });
      
      const rows = sheet.getDataRange().getValues();
      const idToUpdate = postData.id;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] == idToUpdate) {
          sheet.getRange(i + 1, 2).setValue(postData.username); // Username
          sheet.getRange(i + 1, 3).setValue(postData.password); // Password
          sheet.getRange(i + 1, 4).setValue(postData.nama);     // Nama
          sheet.getRange(i + 1, 5).setValue(postData.jabatan);  // Jabatan
          sheet.getRange(i + 1, 6).setValue(postData.subbagian);// Subbagian
          sheet.getRange(i + 1, 7).setValue(postData.role);     // Role
          return createResponse({ success: true, message: "Pegawai berhasil diperbarui" });
        }
      }
      return createResponse({ success: false, message: "Pegawai tidak ditemukan" });
    }
  } catch(err) {
    return createResponse({ success: false, error: err.toString() });
  }
}

function getSheetData(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];
  const data = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    data.push(obj);
  }
  return data;
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    // Validate if WebApp URL is configured
    if (!appsScriptUrl.trim()) {
      // Clear URL
      onConfigSaved({ appsScriptUrl: '', spreadsheetId: '' });
      setTestResult({ success: true, message: 'Koneksi dinonaktifkan. Aplikasi kembali ke database lokal.' });
      setTesting(false);
      return;
    }

    try {
      // Test the URL through server-side controller to totally bypass browser CORS + show full diagnostics
      const testRes = await fetch('/api/config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appsScriptUrl })
      });
      
      if (testRes.ok) {
        const testData = await testRes.json();
        if (testData.success) {
          setTestResult({ 
            success: true, 
            message: testData.message || 'Koneksi Berhasil! Terhubung dengan Google Sheet Anda.' 
          });
          // Save actual configuration to Express
          const saveRes = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appsScriptUrl, spreadsheetId })
          });
          if (saveRes.ok) {
            onConfigSaved({ appsScriptUrl, spreadsheetId });
          }
        } else {
          setTestResult({ 
            success: false, 
            message: testData.error || 'Terjadi kesalahan saat menguji URL Apps Script Anda.' 
          });
        }
      } else {
        setTestResult({ 
          success: false, 
          message: 'Gagal menghubungi server lokal untuk pengujian. Silakan coba lagi.' 
        });
      }
    } catch (err: any) {
      console.error(err);
      setTestResult({ 
        success: false, 
        message: `Gagal melakukan pengetesan: ${err.message || 'Error internal server'}` 
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
              <Settings className="h-4 w-4 text-red-600" />
              Integrasi Google Sheets & Apps Script
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hubungkan database aplikasi dengan Spreadsheet pribadi Anda secara real-time.
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <Sheet className="h-4 w-4" />
          </div>
        </div>

        {/* Configurations input forms */}
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="apps-script-url-input" className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Link className="h-3 w-3" /> URL Web App Google Apps Script
              </label>
              <input
                id="apps-script-url-input"
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs"
              />
            </div>
            
            <div>
              <label htmlFor="spreadsheet-id-input" className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                ID Google Spreadsheet (Opsional)
              </label>
              <input
                id="spreadsheet-id-input"
                type="text"
                placeholder="Masukkan ID unik berkas Spreadsheet"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-400">
              Kosongkan URL Apps Script untuk kembali menggunakan database simulasi lokal server
            </span>
            <button
              id="btn-save-config"
              type="submit"
              disabled={testing}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {testing ? 'Menguji Koneksi...' : 'Simpan & Uji Koneksi'}
            </button>
          </div>
        </form>

        {/* Test Connection feedback alert */}
        {testResult && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg flex items-start gap-3 border text-xs ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold">{testResult.success ? 'Berhasil Terhubung' : 'Gagal Menghubungkan'}</div>
              <div className="mt-1 text-slate-600 leading-relaxed">{testResult.message}</div>
            </div>
          </motion.div>
        )}

        {/* Persistent Sync Status Diagnostics */}
        {config.appsScriptUrl && (
          <div className={`p-4 rounded-lg flex items-start gap-3 border text-xs ${
            config.lastSyncError 
              ? 'bg-amber-50 border-amber-200 text-amber-905' 
              : 'bg-emerald-50/60 border-emerald-100 text-emerald-800'
          }`}>
            {config.lastSyncError ? (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 w-full">
              <div className="font-bold flex items-center justify-between">
                <span className="flex items-center gap-1">Status Sinkronisasi Background</span>
                <span className={`px-1.5 py-0.5 text-[9px] rounded font-semibold uppercase ${
                  config.lastSyncError ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {config.lastSyncError ? 'Hambatan Terdeteksi' : 'Normal / Aktif'}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed mt-0.5">
                {config.lastSyncError 
                  ? `Hambatan terakhir: "${config.lastSyncError}".` 
                  : 'Sistem sinkronisasi otomatis berjalan lancar di latar belakang.'
                }
              </p>
              {config.lastSyncTime && (
                <div className="text-[10px] text-slate-400 mt-1">
                  Sinkronisasi terakhir: {config.lastSyncTime}
                </div>
              )}
              {config.lastSyncError && (
                <div className="pt-2 text-[10px] border-t border-amber-200/50 mt-2 space-y-1">
                  <span className="font-semibold text-amber-900 block font-sans">Saran Pemecahan Masalah:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 font-sans pl-1">
                    <li>Pastikan nama tab sheet di Google Spreadsheet persis sama yaitu <code className="font-mono bg-amber-100 text-amber-900 px-1 py-0.5 font-bold rounded">Users</code> (dengan huruf 'U' kapital) dan <code className="font-mono bg-amber-100 text-amber-900 px-1 py-0.5 font-bold rounded">Laporan</code> (dengan huruf 'L' kapital).</li>
                    <li>Pastikan Anda telah menyalin dan menempelkan <b>seluruh kode Apps Script terbaru</b> (ada di panel kanan) yang mencakup bagian manajemen pegawai terbaru.</li>
                    <li>Silakan lakukan <b>"Deployment Baru"</b> (New Deployment) di Google Apps Script editor Anda, dan pastikan setelan akses diatur ke <b>"Anyone"</b> (Siapa Saja) serta jalankan sebagai <b>"Me"</b> (Saya). Salin URL Web App yang baru dan simpan di kolom di atas.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Structured Guides of Implementation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Indonesian Guides text */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4 text-xs">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
            <HelpCircle className="h-4 w-4 text-red-500" /> Panduan Pemasangan Google Spreadsheet
          </h4>
          
          <ol className="list-decimal list-inside space-y-3 text-slate-600 leading-relaxed">
            <li>
              Buat sebuah **Google Spreadsheet baru** di akun Google Drive Anda.
            </li>
            <li>
              Ubah nama lembar pertama (Tab bawah) menjadi <code className="font-mono bg-slate-100 px-1 py-0.5 text-red-700 font-semibold rounded">Users</code>. Buat nama header kolom di baris ke-1 persis seperti ini:
              <pre className="mt-1.5 p-2 bg-slate-50 rounded border border-slate-100 font-mono text-[10px] text-slate-700 overflow-x-auto">
                ID, Username, Password, Nama, Jabatan, Subbagian, Role
              </pre>
            </li>
            <li>
              Buat lembar (Tab) kedua dengan mengklik tombol (<code className="font-bold text-slate-700">+</code>), beri nama tab tersebut <code className="font-mono bg-slate-100 px-1 py-0.5 text-red-700 font-semibold rounded">Laporan</code>. Buat nama header kolom di baris ke-1 persis seperti ini:
              <pre className="mt-1.5 p-2 bg-slate-50 rounded border border-slate-100 font-mono text-[10px] text-slate-700 overflow-x-auto">
                ID, UserID, Nama, Jabatan, Subbagian, Tanggal, Kegiatan, Output
              </pre>
            </li>
            <li>
              Masuk ke menu **Ekstensi** kemudian pilih **Apps Script**.
            </li>
            <li>
              Hapus seluruh kode bawaan editor, salin kode Apps Script di panel kanan dan tempelkan kedalam editor Apps Script tersebut.
            </li>
            <li>
              Simpan, lalu klik tombol **Deploy** di bagian kanan atas kemudian pilih **Deployment baru**.
            </li>
            <li>
              Pilih tipe: **Aplikasi Web** (ikon roda gigi / Web App). Isi keterangan. Atur bagian <i>Jalankan sebagai</i> ke **Saya** (Me), dan <i>Siapa yang memiliki akses</i> ke **Siapa saja** (Anyone).
            </li>
            <li>
              Klik **Deploy**. Setujui izin akses Google Drive Google Sheets jika diminta. Salin tautan _URL Aplikasi Web_ yang muncul dan tempel ke kolom di atas!
            </li>
          </ol>
        </div>

        {/* Google Apps Script code box panel */}
        <div className="bg-slate-950 rounded-xl border border-slate-900 p-6 flex flex-col justify-between overflow-hidden shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              Source Code Google Apps Script
            </span>
            <button
              id="btn-copy-script"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-all cursor-pointer"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Clipboard className="h-3 w-3" />}
              <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[350px]">
            <pre className="text-[10px] font-mono text-emerald-400 leading-normal whitespace-pre">
              {appsScriptCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
