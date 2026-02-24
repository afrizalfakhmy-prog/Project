(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const PJA_KEY = 'aios_pja';
  const OBS_KEY = 'aios_observasi_records';
  const OBS_SEQ_PREFIX = 'aios_observasi_seq_';

  const checkDefs = [
    { key: 'sop', label: 'SOP / WIN / JSA' },
    { key: 'apd', label: 'Penggunaan APD' },
    { key: 'kompetensi', label: 'Kompetensi Pekerja' },
    { key: 'limaR', label: 'Program 5R' },
    { key: 'fit', label: 'Kondisi Fit Kerja' }
  ];

  let currentRole = '';
  let editingId = null;

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_e) {
      return null;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function shouldApplyApiList(localList, apiList, label) {
    if (!Array.isArray(apiList)) return false;
    if (apiList.length === 0 && Array.isArray(localList) && localList.length > 0) {
      console.warn(`${label} sync skipped: API kosong, data lokal dipertahankan.`);
      return false;
    }
    return true;
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = value || '';
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function todayInputValue() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getMonthYearKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}_${month}`;
  }

  function nextObsId() {
    const key = getMonthYearKey();
    const seqKey = `${OBS_SEQ_PREFIX}${key}`;
    const [year, month] = key.split('_');
    const currentSeq = Number(localStorage.getItem(seqKey) || '0');
    const nextSeq = Number.isFinite(currentSeq) ? currentSeq + 1 : 1;
    return `OBS - ${month}/${year} - ${String(nextSeq).padStart(3, '0')}`;
  }

  function commitObsId(id) {
    const match = /^OBS\s-\s(\d{2})\/(\d{4})\s-\s(\d+)$/.exec(id || '');
    if (!match) return;
    const month = match[1];
    const year = match[2];
    const seq = Number(match[3]);
    const seqKey = `${OBS_SEQ_PREFIX}${year}_${month}`;
    const currentSeq = Number(localStorage.getItem(seqKey) || '0');
    if (seq > currentSeq) localStorage.setItem(seqKey, String(seq));
  }

  function getSession() {
    return readJson(SESSION_KEY) || {};
  }

  function getUsers() {
    return readJson(USER_KEY) || [];
  }

  function isPrivileged() {
    return currentRole === 'Admin' || currentRole === 'Super Admin';
  }

  function isSuperAdmin() {
    return currentRole === 'Super Admin';
  }

  function readObservasiRecords() {
    return readJson(OBS_KEY) || [];
  }

  function writeObservasiRecords(list) {
    writeJson(OBS_KEY, list || []);
  }

  async function syncUsersFromApiIfReady() {
    try {
      if (!window.AIOSApi || typeof window.AIOSApi.listUsers !== 'function') return;
      if (!window.AIOSApi.getToken || !window.AIOSApi.getToken()) return;
      const users = await window.AIOSApi.listUsers();
      const localUsers = readJson(USER_KEY) || [];
      if (shouldApplyApiList(localUsers, users, 'Users')) writeJson(USER_KEY, users);
    } catch (err) {
      console.warn('Observasi users sync failed:', err && err.message ? err.message : err);
    }
  }

  async function syncObservasiFromApiIfReady() {
    try {
      if (!window.AIOSApi || typeof window.AIOSApi.listObservasi !== 'function') return;
      if (!window.AIOSApi.getToken || !window.AIOSApi.getToken()) return;
      const list = await window.AIOSApi.listObservasi();
      const localList = readObservasiRecords();
      if (shouldApplyApiList(localList, list, 'Observasi')) writeObservasiRecords(list);
    } catch (err) {
      console.warn('Observasi sync failed:', err && err.message ? err.message : err);
    }
  }

  async function syncPjaFromApiIfReady() {
    try {
      if (!window.AIOSApi || typeof window.AIOSApi.listPja !== 'function') return;
      if (!window.AIOSApi.getToken || !window.AIOSApi.getToken()) return;
      const list = await window.AIOSApi.listPja();
      const localList = readJson(PJA_KEY) || [];
      if (shouldApplyApiList(localList, list, 'PJA')) writeJson(PJA_KEY, list);
    } catch (err) {
      console.warn('Observasi PJA sync failed:', err && err.message ? err.message : err);
    }
  }

  function getLoggedUser() {
    const session = getSession();
    const users = getUsers();
    const loginIdentity = (session.username || '').trim();
    return users.find(function (user) {
      return user.username === loginIdentity || user.email === loginIdentity;
    }) || null;
  }

  function autofillObserver() {
    const session = getSession();
    const user = getLoggedUser();
    const fallback = (session.username || '').trim();

    setValue('obs-nama-observer', (user && user.nama) || fallback || '-');
    setValue('obs-jabatan-observer', (user && user.jabatan) || '-');
    setValue('obs-departemen-observer', (user && user.departemen) || '-');
    setValue('obs-perusahaan-observer', (user && user.perusahaan) || '-');
    setValue('obs-ccow-observer', (user && user.ccow) || '-');
  }

  function toFileNameList(inputId) {
    const input = document.getElementById(inputId);
    if (!input || !input.files) return [];
    return Array.from(input.files).map(function (file) { return file.name; });
  }

  function setSaveButtonText(text) {
    const btn = document.getElementById('save-observasi-btn');
    if (btn) btn.textContent = text;
  }

  function getUserLabel(user) {
    const nama = (user && user.nama) || '';
    const username = (user && user.username) || '';
    if (!nama && !username) return '-';
    if (!nama) return username;
    if (!username) return nama;
    return `${nama} (${username})`;
  }

  function populatePengawasOptions() {
    const select = document.getElementById('obs-nama-pengawas');
    if (!select) return;

    select.innerHTML = '<option value="">(Pilih Nama Pengawas)</option>';
    getUsers().forEach(function (user) {
      const option = document.createElement('option');
      option.value = String(user.id || user.username || '').trim();
      option.textContent = getUserLabel(user);
      option.dataset.nama = user.nama || '';
      option.dataset.username = user.username || '';
      option.dataset.jabatan = user.jabatan || '';
      option.dataset.departemen = user.departemen || '';
      option.dataset.perusahaan = user.perusahaan || '';
      select.appendChild(option);
    });
  }

  function populatePjaOptions() {
    const select = document.getElementById('obs-nama-pja');
    if (!select) return;

    const pjaList = readJson(PJA_KEY) || [];
    const users = getUsers();

    select.innerHTML = '<option value="">(Pilih Nama PJA)</option>';
    pjaList.forEach(function (pja) {
      const user = users.find(function (item) { return item.id === pja.userId; });
      const option = document.createElement('option');
      option.value = String((pja && pja.userId) || '').trim();
      option.textContent = (user && (user.nama || user.username)) || pja.userId || '';
      option.dataset.nama = (user && user.nama) || option.textContent;
      if (!option.value || !option.textContent) return;
      select.appendChild(option);
    });
  }

  function populatePekerjaCheckboxes(selectedIds) {
    const wrap = document.getElementById('obs-nama-pekerja-list');
    if (!wrap) return;

    const selectedSet = new Set((selectedIds || []).map(function (id) { return String(id); }));
    const users = getUsers();

    if (!users.length) {
      wrap.innerHTML = '<p class="muted">Belum ada data user.</p>';
      return;
    }

    wrap.innerHTML = users.map(function (user) {
      const id = String(user.id || user.username || '');
      const checked = selectedSet.has(id) ? 'checked' : '';
      return `
        <label class="user-checkbox-item">
          <input type="checkbox" class="obs-pekerja-checkbox" value="${escapeHtml(id)}" ${checked}>
          <span>${escapeHtml(getUserLabel(user))}</span>
        </label>
      `;
    }).join('');
  }

  function getSelectedPekerja() {
    const users = getUsers();
    const checked = Array.from(document.querySelectorAll('.obs-pekerja-checkbox:checked'));
    return checked.map(function (input) {
      const id = String(input.value || '').trim();
      const user = users.find(function (item) { return String(item.id || item.username || '').trim() === id; }) || {};
      return {
        id: id,
        nama: user.nama || '',
        username: user.username || '',
        jabatan: user.jabatan || '',
        departemen: user.departemen || '',
        perusahaan: user.perusahaan || ''
      };
    });
  }

  function getCheckValue(key) {
    return {
      hasil: (document.getElementById(`obs-check-${key}`) || {}).value || '',
      alasan: (document.getElementById(`obs-check-${key}-alasan`) || {}).value || '',
      status: (document.getElementById(`obs-check-${key}-status`) || {}).value || '',
      tindakanPerbaikan: (document.getElementById(`obs-check-${key}-tindakan`) || {}).value || ''
    };
  }

  function setCheckValue(key, value) {
    const val = value || {};
    setValue(`obs-check-${key}`, val.hasil || '');
    setValue(`obs-check-${key}-alasan`, val.alasan || '');
    setValue(`obs-check-${key}-status`, val.status || '');
    setValue(`obs-check-${key}-tindakan`, val.tindakanPerbaikan || '');
    syncCheckUi(key);
  }

  function syncCheckUi(key) {
    const hasil = (document.getElementById(`obs-check-${key}`) || {}).value || '';
    const status = (document.getElementById(`obs-check-${key}-status`) || {}).value || '';
    const detailWrap = document.getElementById(`obs-check-${key}-detail`);
    const tindakanWrap = document.getElementById(`obs-check-${key}-tindakan-wrap`);
    const alasanEl = document.getElementById(`obs-check-${key}-alasan`);
    const statusEl = document.getElementById(`obs-check-${key}-status`);
    const tindakanEl = document.getElementById(`obs-check-${key}-tindakan`);

    const showDetail = hasil === 'Tidak';
    if (detailWrap) detailWrap.classList.toggle('hidden', !showDetail);
    if (alasanEl) alasanEl.disabled = !showDetail;
    if (statusEl) statusEl.disabled = !showDetail;

    const showTindakan = showDetail && status === 'Close';
    if (tindakanWrap) tindakanWrap.classList.toggle('hidden', !showTindakan);
    if (tindakanEl) tindakanEl.disabled = !showTindakan;
  }

  function wireCheckInteractions() {
    checkDefs.forEach(function (def) {
      const hasilEl = document.getElementById(`obs-check-${def.key}`);
      const statusEl = document.getElementById(`obs-check-${def.key}-status`);

      if (hasilEl) {
        hasilEl.addEventListener('change', function () {
          if (hasilEl.value !== 'Tidak') {
            setValue(`obs-check-${def.key}-alasan`, '');
            setValue(`obs-check-${def.key}-status`, '');
            setValue(`obs-check-${def.key}-tindakan`, '');
          }
          syncCheckUi(def.key);
        });
      }

      if (statusEl) {
        statusEl.addEventListener('change', function () {
          if (statusEl.value !== 'Close') {
            setValue(`obs-check-${def.key}-tindakan`, '');
          }
          syncCheckUi(def.key);
        });
      }

      syncCheckUi(def.key);
    });
  }

  function computeStatusSummary(checks) {
    const entries = Object.keys(checks || {}).map(function (key) { return checks[key]; });
    const notOk = entries.filter(function (item) { return item && item.hasil === 'Tidak'; });
    const openCount = notOk.filter(function (item) { return item.status === 'Open'; }).length;
    const closeCount = notOk.filter(function (item) { return item.status === 'Close'; }).length;

    if (!notOk.length) {
      return { status: 'Aman', openCount: 0, closeCount: 0 };
    }

    return {
      status: openCount > 0 ? 'Open' : 'Close',
      openCount: openCount,
      closeCount: closeCount
    };
  }

  function collectFormData() {
    const session = getSession();
    const pjaSelect = document.getElementById('obs-nama-pja');
    const pjaOption = pjaSelect && pjaSelect.options[pjaSelect.selectedIndex];
    const pengawasSelect = document.getElementById('obs-nama-pengawas');
    const pengawasOption = pengawasSelect && pengawasSelect.options[pengawasSelect.selectedIndex];

    const checks = {};
    checkDefs.forEach(function (def) {
      checks[def.key] = getCheckValue(def.key);
    });

    const summary = computeStatusSummary(checks);

    return {
      id: (document.getElementById('obs-id') || {}).value || '',
      reporterUsername: (session.username || '').trim(),
      tanggalLaporan: (document.getElementById('obs-tanggal-laporan') || {}).value || '',
      namaObserver: (document.getElementById('obs-nama-observer') || {}).value || '',
      jabatanObserver: (document.getElementById('obs-jabatan-observer') || {}).value || '',
      departemenObserver: (document.getElementById('obs-departemen-observer') || {}).value || '',
      perusahaanObserver: (document.getElementById('obs-perusahaan-observer') || {}).value || '',
      ccowObserver: (document.getElementById('obs-ccow-observer') || {}).value || '',
      tanggalObservasi: (document.getElementById('obs-tanggal-observasi') || {}).value || '',
      waktuObservasi: (document.getElementById('obs-waktu-observasi') || {}).value || '',
      lokasi: (document.getElementById('obs-lokasi') || {}).value || '',
      detailLokasi: (document.getElementById('obs-detail-lokasi') || {}).value || '',
      namaPja: (pjaOption && pjaOption.dataset && pjaOption.dataset.nama) || '',
      pjaId: (pjaSelect && pjaSelect.value) || '',
      namaPengawas: (pengawasOption && pengawasOption.dataset && pengawasOption.dataset.nama) || '',
      pengawasId: (pengawasSelect && pengawasSelect.value) || '',
      namaPekerja: getSelectedPekerja(),
      aktivitasPekerjaan: (document.getElementById('obs-aktivitas') || {}).value || '',
      noSopWinJsa: (document.getElementById('obs-no-sop') || {}).value || '',
      checks: checks,
      tindakanApresiasi: (document.getElementById('obs-tindakan-apresiasi') || {}).value || '',
      tindakLanjutKomitmen: (document.getElementById('obs-tindak-lanjut') || {}).value || '',
      lampiran: toFileNameList('obs-lampiran'),
      statusTemuan: summary.status,
      statusOpenCount: summary.openCount,
      statusCloseCount: summary.closeCount
    };
  }

  function validateForm(data) {
    if (!data.id) return 'No ID wajib terisi';
    if (!data.tanggalLaporan) return 'Tanggal Laporan wajib terisi';
    if (!data.namaObserver) return 'Nama Observer wajib terisi';
    if (!data.tanggalObservasi) return 'Tanggal Observasi wajib diisi';
    if (!data.waktuObservasi) return 'Waktu Observasi wajib diisi';
    if (!data.lokasi) return 'Lokasi wajib dipilih';
    if (!data.detailLokasi) return 'Detail Lokasi wajib diisi';
    if (!data.pjaId) return 'Nama PJA wajib dipilih';
    if (!data.pengawasId) return 'Nama Pengawas Pekerjaan wajib dipilih';
    if (!data.namaPekerja || data.namaPekerja.length === 0) return 'Nama Pekerja wajib dipilih minimal 1';
    if (!data.aktivitasPekerjaan) return 'Aktifitas / Pekerjaan wajib diisi';
    if (!data.noSopWinJsa) return 'No SOP / WIN / JSA wajib diisi';

    for (let index = 0; index < checkDefs.length; index += 1) {
      const def = checkDefs[index];
      const item = data.checks[def.key] || {};
      if (!item.hasil) return `${def.label}: pilih Ya/Tidak`;

      if (item.hasil === 'Tidak') {
        if (!item.alasan) return `${def.label}: Alasan / Keterangan wajib diisi`;
        if (!item.status) return `${def.label}: Status wajib dipilih`;
        if (item.status === 'Close' && !item.tindakanPerbaikan) {
          return `${def.label}: Tindakan Perbaikan wajib diisi saat status Close`;
        }
      }
    }

    if (!data.tindakanApresiasi) return 'Tindakan apresiasi wajib diisi';
    if (!data.tindakLanjutKomitmen) return 'Tindak lanjut dan komitmen wajib diisi';

    return '';
  }

  function resetFormForNew() {
    editingId = null;

    const form = document.getElementById('observasi-form');
    if (form) form.reset();

    setValue('obs-id', nextObsId());
    setValue('obs-tanggal-laporan', todayInputValue());
    autofillObserver();
    setSaveButtonText('Simpan');
    populatePekerjaCheckboxes([]);
    checkDefs.forEach(function (def) {
      setCheckValue(def.key, { hasil: '', alasan: '', status: '', tindakanPerbaikan: '' });
    });
  }

  function fillForm(data) {
    setValue('obs-id', data.id);
    setValue('obs-tanggal-laporan', data.tanggalLaporan);
    setValue('obs-nama-observer', data.namaObserver);
    setValue('obs-jabatan-observer', data.jabatanObserver);
    setValue('obs-departemen-observer', data.departemenObserver);
    setValue('obs-perusahaan-observer', data.perusahaanObserver);
    setValue('obs-ccow-observer', data.ccowObserver);
    setValue('obs-tanggal-observasi', data.tanggalObservasi);
    setValue('obs-waktu-observasi', data.waktuObservasi);
    setValue('obs-lokasi', data.lokasi);
    setValue('obs-detail-lokasi', data.detailLokasi);
    setValue('obs-nama-pja', data.pjaId || '');
    setValue('obs-nama-pengawas', data.pengawasId || '');
    setValue('obs-aktivitas', data.aktivitasPekerjaan);
    setValue('obs-no-sop', data.noSopWinJsa);
    setValue('obs-tindakan-apresiasi', data.tindakanApresiasi);
    setValue('obs-tindak-lanjut', data.tindakLanjutKomitmen);

    const pekerjaIds = (data.namaPekerja || []).map(function (item) {
      return String((item && item.id) || '');
    }).filter(Boolean);
    populatePekerjaCheckboxes(pekerjaIds);

    checkDefs.forEach(function (def) {
      setCheckValue(def.key, (data.checks || {})[def.key] || {});
    });

    setSaveButtonText('Update');
  }

  function showForm() {
    const form = document.getElementById('observasi-form');
    if (!form) return;
    form.classList.remove('hidden');
    setTimeout(function () {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function hideForm() {
    const form = document.getElementById('observasi-form');
    if (form) form.classList.add('hidden');
  }

  function normalizeDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function getVisibleRecords() {
    const list = readObservasiRecords();
    if (isPrivileged()) return list;
    const session = getSession();
    return list.filter(function (item) {
      return item.reporterUsername === session.username;
    });
  }

  function renderTable() {
    const tbody = document.querySelector('#observasi-list tbody');
    if (!tbody) return;

    const session = getSession();
    const visible = getVisibleRecords().slice().sort(function (a, b) {
      const da = new Date(a.tanggalLaporan || 0).getTime();
      const db = new Date(b.tanggalLaporan || 0).getTime();
      return db - da;
    });

    if (!visible.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="muted">Belum ada data observasi.</td></tr>';
      return;
    }

    tbody.innerHTML = visible.map(function (item) {
      const aksi = isSuperAdmin()
        ? `<button type="button" class="small" data-action="edit" data-id="${escapeHtml(item.id)}">Edit</button> <button type="button" class="small" data-action="delete" data-id="${escapeHtml(item.id)}">Hapus</button>`
        : '-';

      const jumlahPekerja = Array.isArray(item.namaPekerja) ? item.namaPekerja.length : 0;
      const statusText = item.statusTemuan === 'Aman'
        ? 'Aman'
        : `Open: ${item.statusOpenCount || 0}, Close: ${item.statusCloseCount || 0}`;

      return `
        <tr>
          <td>${escapeHtml(item.id)}</td>
          <td>${escapeHtml(normalizeDate(item.tanggalLaporan))}</td>
          <td>${escapeHtml(item.namaObserver)}</td>
          <td>${escapeHtml(item.lokasi || '-')}</td>
          <td>${escapeHtml(item.namaPengawas || '-')}</td>
          <td>${jumlahPekerja}</td>
          <td>${escapeHtml(statusText)}</td>
          <td>${aksi}</td>
        </tr>
      `;
    }).join('');
  }

  function excelSafe(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function exportRowsToExcel(filePrefix, headers, rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const thead = `<tr>${headers.map((h) => `<th>${excelSafe(h)}</th>`).join('')}</tr>`;
    const tbody = rows.map((row) => `<tr>${row.map((cell) => `<td>${excelSafe(cell)}</td>`).join('')}</tr>`).join('');
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body><table border="1">${thead}${tbody}</table></body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${filePrefix}-${stamp}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportObservasiToExcel() {
    const rows = getVisibleRecords().slice().sort(function (a, b) {
      const da = new Date(a.tanggalLaporan || 0).getTime();
      const db = new Date(b.tanggalLaporan || 0).getTime();
      return db - da;
    }).map(function (item) {
      const jumlahPekerja = Array.isArray(item.namaPekerja) ? item.namaPekerja.length : 0;
      const statusText = item.statusTemuan === 'Aman'
        ? 'Aman'
        : `Open: ${item.statusOpenCount || 0}, Close: ${item.statusCloseCount || 0}`;

      return [
        item.id || '',
        normalizeDate(item.tanggalLaporan) || '',
        item.namaObserver || '',
        item.lokasi || '-',
        item.namaPengawas || '-',
        jumlahPekerja,
        statusText
      ];
    });

    exportRowsToExcel('data-observasi', ['No ID', 'Tanggal Laporan', 'Nama Observer', 'Lokasi', 'Nama Pengawas', 'Jumlah Pekerja', 'Status Temuan'], rows);
  }

  async function saveData() {
    const data = collectFormData();
    const message = validateForm(data);
    if (message) {
      alert(message);
      return;
    }

    const list = readObservasiRecords();
    const nowIso = new Date().toISOString();

    if (editingId) {
      if (!isSuperAdmin()) {
        alert('Hanya Super Admin yang dapat mengubah data observasi.');
        return;
      }

      const index = list.findIndex(function (item) { return item.id === editingId; });
      if (index < 0) {
        alert('Data tidak ditemukan.');
        return;
      }

      const existing = list[index];
      const payload = {
        ...existing,
        ...data,
        id: existing.id,
        reporterUsername: existing.reporterUsername,
        createdAt: existing.createdAt,
        updatedAt: nowIso
      };

      list[index] = payload;
      writeObservasiRecords(list);

      try {
        if (window.AIOSApi && typeof window.AIOSApi.updateObservasi === 'function') {
          await window.AIOSApi.updateObservasi(existing.id, payload);
        }
      } catch (err) {
        console.warn('Update observasi ke API gagal:', err && err.message ? err.message : err);
      }
    } else {
      const payload = {
        ...data,
        createdAt: nowIso,
        updatedAt: nowIso
      };

      list.push(payload);
      writeObservasiRecords(list);

      try {
        if (window.AIOSApi && typeof window.AIOSApi.createObservasi === 'function') {
          await window.AIOSApi.createObservasi(payload);
        }
      } catch (err) {
        console.warn('Create observasi ke API gagal:', err && err.message ? err.message : err);
      }

      commitObsId(payload.id);
    }

    renderTable();
    hideForm();
    resetFormForNew();
  }

  async function deleteData(id) {
    if (!isSuperAdmin()) {
      alert('Hanya Super Admin yang dapat menghapus data.');
      return;
    }

    if (!confirm('Hapus data observasi ini?')) return;

    const list = readObservasiRecords();
    const next = list.filter(function (item) { return item.id !== id; });
    writeObservasiRecords(next);

    try {
      if (window.AIOSApi && typeof window.AIOSApi.deleteObservasi === 'function') {
        await window.AIOSApi.deleteObservasi(id);
      }
    } catch (err) {
      console.warn('Delete observasi ke API gagal:', err && err.message ? err.message : err);
    }

    renderTable();
    hideForm();
    resetFormForNew();
  }

  function openForEdit(id) {
    const list = readObservasiRecords();
    const found = list.find(function (item) { return item.id === id; });
    if (!found) {
      alert('Data tidak ditemukan.');
      return;
    }

    if (!isSuperAdmin()) {
      alert('Anda tidak memiliki akses untuk mengubah data ini.');
      return;
    }

    editingId = found.id;
    fillForm(found);
    showForm();
  }

  function bindEvents() {
    const showBtn = document.getElementById('show-observasi-form-btn');
    const form = document.getElementById('observasi-form');
    const cancelBtn = document.getElementById('cancel-observasi-form-btn');
    const table = document.getElementById('observasi-list');

    if (showBtn) {
      showBtn.addEventListener('click', function () {
        resetFormForNew();
        showForm();
      });
    }

    const exportBtn = document.getElementById('export-observasi-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportObservasiToExcel);
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        hideForm();
        resetFormForNew();
      });
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        saveData();
      });
    }

    if (table) {
      table.addEventListener('click', function (event) {
        const button = event.target.closest('button[data-action][data-id]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        const id = button.getAttribute('data-id') || '';
        if (!id) return;

        if (action === 'edit') openForEdit(id);
        if (action === 'delete') deleteData(id);
      });
    }

    wireCheckInteractions();
  }

  async function init() {
    const session = getSession();
    if (!session || !session.username) {
      alert('Silakan login terlebih dahulu.');
      window.location.href = 'index.html';
      return;
    }

    currentRole = (session.role || '').trim();

    await syncUsersFromApiIfReady();
    await syncPjaFromApiIfReady();
    await syncObservasiFromApiIfReady();

    populatePjaOptions();
    populatePengawasOptions();
    populatePekerjaCheckboxes([]);
    bindEvents();
    resetFormForNew();
    renderTable();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
