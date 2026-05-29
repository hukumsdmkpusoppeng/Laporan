/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Hardcoded initial data as seen in the screenshots
const SEED_USERS = [
  {
    ID: 'U001',
    Username: 'admin',
    Password: 'admin123',
    Nama: 'Admin KPU',
    Jabatan: 'Kepala Sub Bagian',
    Subbagian: 'Parmas dan SDM',
    Role: 'admin'
  },
  {
    ID: 'U002',
    Username: 'budi',
    Password: 'budi123',
    Nama: 'Budi',
    Jabatan: 'Staf Pelaksana', // matching screenshot logs, user table says Sekretaris but logs say Staf Pelaksana
    Subbagian: 'Teknis Penyelenggaraan',
    Role: 'pegawai'
  },
  {
    ID: 'U003',
    Username: 'dadar',
    Password: 'dadar123',
    Nama: 'Darma',
    Jabatan: 'Staf Pelaksana',
    Subbagian: 'Teknis Penyelenggaraan',
    Role: 'pegawai'
  }
];

const SEED_LAPORAN = [
  {
    ID: 'R1779439641775',
    UserID: 'U002',
    Nama: 'Budi',
    Jabatan: 'Staf Pelaksana',
    Subbagian: 'Teknis Penyelenggaraan',
    Tanggal: '2026-05-22',
    Kegiatan: 'Mempersiapkan logistik rapat pleno teknis penyelenggaraan pemilu.',
    Output: 'Dokumen dan daftar hadir rapat'
  },
  {
    ID: 'R1779439657715',
    UserID: 'U002',
    Nama: 'Budi',
    Jabatan: 'Staf Pelaksana',
    Subbagian: 'Teknis Penyelenggaraan',
    Tanggal: '2026-05-04',
    Kegiatan: 'Melakukan verifikasi berkas administrasi calon anggota legislatif.',
    Output: 'Lembar hasil pemeriksaan berkas'
  },
  {
    ID: 'R1779439661377',
    UserID: 'U002',
    Nama: 'Budi',
    Jabatan: 'Staf Pelaksana',
    Subbagian: 'Teknis Penyelenggaraan',
    Tanggal: '2026-05-04',
    Kegiatan: 'Penyusunan laporan administrasi keuangan internal subbagian.',
    Output: 'File draf pelaporan'
  },
  {
    ID: 'R1779439667233',
    UserID: 'U002',
    Nama: 'Budi',
    Jabatan: 'Staf Pelaksana',
    Subbagian: 'Teknis Penyelenggaraan',
    Tanggal: '2026-05-04',
    Kegiatan: 'Mengikuti koordinasi rutin mingguan dengan Sub Bagian Parmas dan SDM.',
    Output: 'Catatan notulensi koordinasi'
  }
];

// Local file DB setup for persistence
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db = {
  users: [...SEED_USERS],
  laporan: [...SEED_LAPORAN],
  config: {
    appsScriptUrl: '',
    spreadsheetId: '',
    isConnected: false,
    lastSyncError: '',
    lastSyncTime: ''
  }
};

// Try loading db from file
if (fs.existsSync(DB_FILE)) {
  try {
    const fileContent = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(fileContent);
    if (parsed.users && parsed.laporan && parsed.config) {
      db = parsed;
      // Safeguard missing config properties
      db.config.lastSyncError = db.config.lastSyncError || '';
      db.config.lastSyncTime = db.config.lastSyncTime || '';
      console.log('Database loaded successfully from local file');
    }
  } catch (err) {
    console.error('Failed to parse db.json, using seed data:', err);
  }
} else {
  // Save seed data as initial file
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write db.json:', err);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save db.json:', err);
  }
}

async function syncToAppsScript(payload: any) {
  if (!db.config.appsScriptUrl) return { success: true };
  
  try {
    console.log(`[SYNC] Sending action '${payload.action}' to Apps Script:`, db.config.appsScriptUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(db.config.appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const textResult = await response.text();
    console.log(`[SYNC] Apps Script response for '${payload.action}':`, textResult.substring(0, 200));

    // Handle Google Login / Auth HTML responses
    if (textResult.includes('accounts.google.com') || textResult.includes('Service Login') || textResult.trim().startsWith('<!DOCTYPE')) {
      db.config.lastSyncError = 'Sinkronisasi gagal (Akses Ditolak oleh Google). Pastikan setelan Akses Web App diatur ke "Siapa Saja" (Anyone) setelah melakukan "Deployment Baru" di Apps Script Anda.';
      db.config.lastSyncTime = new Date().toLocaleString('id-ID');
      saveDb();
      return { success: false, error: db.config.lastSyncError };
    }

    try {
      const resJson = JSON.parse(textResult);
      if (resJson.success) {
        db.config.lastSyncError = '';
        db.config.lastSyncTime = new Date().toLocaleString('id-ID');
        saveDb();
        return { success: true };
      } else {
        db.config.lastSyncError = resJson.error || 'Server Google Apps Script gagal menyimpan data (cek nama tab sheet).';
        db.config.lastSyncTime = new Date().toLocaleString('id-ID');
        saveDb();
        return { success: false, error: db.config.lastSyncError };
      }
    } catch (_) {
      // Maybe clean success response, let's treat it as success if it returns a 200, but double check if we can parse
      if (response.ok) {
        db.config.lastSyncError = '';
        db.config.lastSyncTime = new Date().toLocaleString('id-ID');
        saveDb();
        return { success: true };
      }
      db.config.lastSyncError = 'Respon Google Apps Script bukan JSON yang valid. Hubungi administrator atau salin ulang script.';
      db.config.lastSyncTime = new Date().toLocaleString('id-ID');
      saveDb();
      return { success: false, error: db.config.lastSyncError };
    }
  } catch (err: any) {
    console.error(`[SYNC] Error syncing '${payload.action}':`, err);
    let errMsg = `Koneksi gagal: ${err.message || 'Error tidak dikenal'}`;
    if (err.name === 'AbortError') {
      errMsg = 'Koneksi timeout setelah 10 detik. Periksa kembali stabilitas jaringan.';
    }
    db.config.lastSyncError = errMsg;
    db.config.lastSyncTime = new Date().toLocaleString('id-ID');
    saveDb();
    return { success: false, error: errMsg };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware to log API calls
  app.use((req, res, next) => {
    console.log(`[API LOG] ${req.method} ${req.url}`);
    next();
  });

  // --- API ROUTING ===

  // Config routes
  app.get('/api/config', (req, res) => {
    res.json(db.config);
  });

  app.post('/api/config', async (req, res) => {
    const { appsScriptUrl, spreadsheetId } = req.body;
    db.config.appsScriptUrl = appsScriptUrl || '';
    db.config.spreadsheetId = spreadsheetId || '';
    
    if (db.config.appsScriptUrl) {
      db.config.isConnected = true;
    } else {
      db.config.isConnected = false;
    }
    
    saveDb();
    res.json({ success: true, config: db.config });
  });

  app.post('/api/config/test', async (req, res) => {
    const { appsScriptUrl } = req.body;
    if (!appsScriptUrl) {
      return res.status(400).json({ success: false, error: 'URL Google Apps Script tidak boleh kosong' });
    }

    // Check if it's an editor URL
    if (appsScriptUrl.includes('/edit') || !appsScriptUrl.includes('/macros/s/')) {
      return res.json({
        success: false,
        error: 'URL yang dimasukkan tampaknya adalah URL Editor/Project. Pastikan Anda memasukkan URL "Aplikasi Web" (Web App) yang diakhiri dengan "/exec" setelah melakukan Deployment Baru.'
      });
    }

    try {
      const testUrl = `${appsScriptUrl}?action=get_users`;
      console.log('[TEST] Fetching get_users from Apps Script:', testUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(testUrl, { 
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      if (!response.ok) {
        return res.json({
          success: false,
          error: `Server Google Apps Script mengembalikan status HTTP ${response.status}. Hubungi admin atau periksa kembali setup script.`
        });
      }

      // Check if it looks like a sign-in or login page (HTML)
      if (contentType.includes('text/html') || text.trim().startsWith('<!DOCTYPE') || text.includes('Service Login') || text.includes('accounts.google.com')) {
        return res.json({
          success: false,
          error: 'Menerima respon halaman login Google. Pastikan saat melakukan "Deployment Baru" pada Apps Script, Anda mengatur akses "Siapa saja" (Anyone) agar aplikasi web dapat berkomunikasi tanpa perlu login Google di latar belakang.'
        });
      }

      try {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          return res.json({
            success: true,
            message: `Koneksi Berhasil! Berhasil berkomunikasi dengan Spreadsheet. Ditemukan ${data.length} data pegawai pada sheet 'Users'.`
          });
        } else if (data && data.error) {
          return res.json({
            success: false,
            error: `Apps Script merespon dengan error: "${data.error}". Pastikan Anda telah membuat lembar bernama "Users" dan "Laporan" pada dokumen Spreadsheet Anda.`
          });
        } else {
          return res.json({
            success: false,
            error: 'Format data tidak sesuai. Pastikan Anda telah menyalin seluruh contoh kode Apps Script dengan benar.'
          });
        }
      } catch (e) {
        return res.json({
          success: false,
          error: `Respon Apps Script bukan format JSON yang valid. Silakan periksa kembali apakah kode script di Apps Script Anda sudah disimpan dan dideploy dengan benar. Isi respon: "${text.substring(0, 150)}..."`
        });
      }
    } catch (err: any) {
      console.error('[TEST] Error testing Apps Script URL:', err);
      let errorMsg = 'Gagal menghubungi server Apps Script. ';
      if (err.name === 'AbortError') {
        errorMsg += 'Koneksi timeout setelah 10 detik. Periksa kembali stabilitas jaringan.';
      } else {
        errorMsg += err.message || 'Harap periksa kecocokan URL.';
      }
      return res.json({
        success: false,
        error: errorMsg
      });
    }
  });

  // Auth/Login Route
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }

    const matched = db.users.find(
      u => u.Username.toLowerCase() === username.toLowerCase() && u.Password === password
    );

    if (matched) {
      // Return user context without password
      const userRes = { ...matched };
      delete userRes.Password;
      return res.json({ success: true, user: userRes });
    }

    return res.status(401).json({ error: 'Username atau password salah' });
  });

  // Users route (Admin view only)
  app.get('/api/users', async (req, res) => {
    // If connected to Apps Script, try reading from there
    if (db.config.appsScriptUrl) {
      try {
        const url = `${db.config.appsScriptUrl}?action=get_users`;
        console.log('Fetching users from Apps Script:', url);
        const response = await fetch(url);
        if (response.ok) {
          const remoteUsers = await response.json();
          if (Array.isArray(remoteUsers) && remoteUsers.length > 0) {
            // Check if schema matches (normalize lowercase/uppercase from AppScript)
            const normalized = remoteUsers.map((u: any) => ({
              ID: u.ID || u.id || '',
              Username: u.Username || u.username || '',
              Password: u.Password || u.password || 'demo123',
              Nama: u.Nama || u.nama || '',
              Jabatan: u.Jabatan || u.jabatan || '',
              Subbagian: u.Subbagian || u.subbagian || '',
              Role: u.Role || u.role || 'pegawai'
            }));
            // Update local users with what's on sheet to keep synced
            db.users = normalized;
            saveDb();
            return res.json(db.users);
          }
        }
      } catch (err) {
        console.error('Error fetching users from Apps Script, fallback to local database:', err);
      }
    }
    
    // Fallback to local
    res.json(db.users);
  });

  // Create user
  app.post('/api/users', (req, res) => {
    const { Username, Password, Nama, Jabatan, Subbagian, Role } = req.body;
    if (!Username || !Password || !Nama || !Jabatan || !Subbagian || !Role) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    const exists = db.users.some(u => u.Username.toLowerCase() === Username.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'Username sudah digunakan oleh pegawai lain' });
    }

    // Generate numeric-safe user ID like U004
    let newIdNum = 1;
    db.users.forEach(u => {
      const match = u.ID.match(/^U(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= newIdNum) {
          newIdNum = num + 1;
        }
      }
    });
    const newID = `U${String(newIdNum).padStart(3, '0')}`;

    const newUser = {
      ID: newID,
      Username,
      Password,
      Nama,
      Jabatan,
      Subbagian,
      Role
    };

    db.users.push(newUser);
    saveDb();

    // If connected to Apps Script, try forwarding
    if (db.config.appsScriptUrl) {
      syncToAppsScript({
        action: 'add_user',
        id: newID,
        username: Username,
        password: Password,
        nama: Nama,
        jabatan: Jabatan,
        subbagian: Subbagian,
        role: Role
      }).catch(e => console.error('Error in background sync user add:', e));
    }

    res.status(201).json(newUser);
  });

  // Update user
  app.put('/api/users/:id', (req, res) => {
    const id = req.params.id;
    const { Username, Password, Nama, Jabatan, Subbagian, Role } = req.body;

    const matchedIdx = db.users.findIndex(u => u.ID === id);
    if (matchedIdx === -1) {
      return res.status(404).json({ error: 'Pegawai tidak ditemukan' });
    }

    if (Username) {
      const exists = db.users.some(u => u.ID !== id && u.Username.toLowerCase() === Username.toLowerCase());
      if (exists) {
        return res.status(400).json({ error: 'Username sudah digunakan oleh pegawai lain' });
      }
    }

    const updated = {
      ...db.users[matchedIdx],
      Username: Username || db.users[matchedIdx].Username,
      Password: Password || db.users[matchedIdx].Password,
      Nama: Nama || db.users[matchedIdx].Nama,
      Jabatan: Jabatan || db.users[matchedIdx].Jabatan,
      Subbagian: Subbagian || db.users[matchedIdx].Subbagian,
      Role: Role || db.users[matchedIdx].Role
    };

    db.users[matchedIdx] = updated;
    saveDb();

    // If connected to Apps Script, forward updates
    if (db.config.appsScriptUrl) {
      syncToAppsScript({
        action: 'update_user',
        id,
        username: updated.Username,
        password: updated.Password,
        nama: updated.Nama,
        jabatan: updated.Jabatan,
        subbagian: updated.Subbagian,
        role: updated.Role
      }).catch(e => console.error('Error in background sync user update:', e));
    }

    res.json(updated);
  });

  // Delete user
  app.delete('/api/users/:id', (req, res) => {
    const id = req.params.id;
    const matchedIdx = db.users.findIndex(u => u.ID === id);
    if (matchedIdx === -1) {
      return res.status(404).json({ error: 'Pegawai tidak ditemukan' });
    }

    db.users.splice(matchedIdx, 1);
    saveDb();

    // If connected to Apps Script, forward deletion
    if (db.config.appsScriptUrl) {
      syncToAppsScript({
        action: 'delete_user',
        id
      }).catch(e => console.error('Error in background sync user delete:', e));
    }

    res.json({ success: true, message: 'Pegawai berhasil dihapus' });
  });

  // List all reports / activity summaries
  app.get('/api/laporan', async (req, res) => {
    if (db.config.appsScriptUrl) {
      try {
        const url = `${db.config.appsScriptUrl}?action=get_laporan`;
        console.log('Fetching reports from Apps Script:', url);
        const response = await fetch(url);
        if (response.ok) {
          const remoteLaporan = await response.json();
          if (Array.isArray(remoteLaporan)) {
            const normalized = remoteLaporan.map((l: any) => ({
              ID: l.ID || l.id || '',
              UserID: l.UserID || l.userid || l.userId || '',
              Nama: l.Nama || l.nama || '',
              Jabatan: l.Jabatan || l.jabatan || '',
              Subbagian: l.Subbagian || l.subbagian || '',
              Tanggal: l.Tanggal || l.tanggal || '',
              Kegiatan: l.Kegiatan || l.kegiatan || '',
              Output: l.Output || l.output || ''
            }));
            db.laporan = normalized;
            saveDb();
            return res.json(db.laporan);
          }
        }
      } catch (err) {
        console.error('Error fetching reports from Apps Script, fallback to local database:', err);
      }
    }
    
    res.json(db.laporan);
  });

  // Create a new report
  app.post('/api/laporan', async (req, res) => {
    const { ID, UserID, Nama, Jabatan, Subbagian, Tanggal, Kegiatan, Output } = req.body;
    
    if (!UserID || !Nama || !Tanggal || !Kegiatan || !Output) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    const newReport = {
      ID: ID || `R${Date.now()}`,
      UserID,
      Nama,
      Jabatan: Jabatan || '',
      Subbagian: Subbagian || '',
      Tanggal,
      Kegiatan,
      Output
    };

    // If connected to Apps Script, send webhook payload
    if (db.config.appsScriptUrl) {
      await syncToAppsScript({
        action: 'add_laporan',
        id: newReport.ID,
        userId: newReport.UserID,
        nama: newReport.Nama,
        jabatan: newReport.Jabatan,
        subbagian: newReport.Subbagian,
        tanggal: newReport.Tanggal,
        kegiatan: newReport.Kegiatan,
        output: newReport.Output
      }).catch(e => console.error('Error syncing laporan creation:', e));
    }

    // Always append locally for instant responsiveness & offline simulation
    db.laporan.unshift(newReport);
    saveDb();

    res.status(201).json(newReport);
  });

  // Edit / Update an existing report
  app.put('/api/laporan/:id', async (req, res) => {
    const id = req.params.id;
    const { Tanggal, Kegiatan, Output } = req.body;

    const findIndex = db.laporan.findIndex(l => l.ID === id);
    if (findIndex === -1) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    }

    // Update locally
    db.laporan[findIndex].Tanggal = Tanggal;
    db.laporan[findIndex].Kegiatan = Kegiatan;
    db.laporan[findIndex].Output = Output;
    saveDb();

    // If connected to Apps Script, update remotely
    if (db.config.appsScriptUrl) {
      await syncToAppsScript({
        action: 'update_laporan',
        id,
        tanggal: Tanggal,
        kegiatan: Kegiatan,
        output: Output
      }).catch(e => console.error('Error syncing laporan update:', e));
    }

    res.json(db.laporan[findIndex]);
  });

  // Delete a report
  app.delete('/api/laporan/:id', async (req, res) => {
    const id = req.params.id;
    const findIndex = db.laporan.findIndex(l => l.ID === id);

    if (findIndex === -1) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    }

    // Remove locally
    db.laporan.splice(findIndex, 1);
    saveDb();

    // If connected to Apps Script, delete remotely
    if (db.config.appsScriptUrl) {
      await syncToAppsScript({
        action: 'delete_laporan',
        id
      }).catch(e => console.error('Error syncing laporan deletion:', e));
    }

    res.json({ success: true, message: 'Laporan berhasil dihapus' });
  });

  // Reset database to seed logs (handy for testing)
  app.post('/api/reset', (req, res) => {
    db.users = [...SEED_USERS];
    db.laporan = [...SEED_LAPORAN];
    db.config = {
      appsScriptUrl: '',
      spreadsheetId: '',
      isConnected: false,
      lastSyncError: '',
      lastSyncTime: ''
    };
    saveDb();
    res.json({ success: true, message: 'Database reset to seed data' });
  });

  // Serve static assets in production, otherwise Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
