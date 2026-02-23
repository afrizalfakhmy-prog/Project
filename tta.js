(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const PJA_KEY = 'aios_pja';
  const TTA_KEY = 'aios_tta_records';
  const TTA_SEQ_PREFIX = 'aios_tta_seq_';

  let currentRole = '';
  let editingId = null;
  let followUpMode = false;

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = value || '';
  }

  function normalizeName(value) {
    return String(value || '').trim().toLowerCase();
  }

  function isOpenOrProgress(status) {
    return status === 'Open' || status === 'Progress';
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

  function nextTtaId() {
    const key = getMonthYearKey();
    const seqKey = `${TTA_SEQ_PREFIX}${key}`;
    const [year, month] = key.split('_');

    const currentSeq = Number(localStorage.getItem(seqKey) || '0');
    const nextSeq = Number.isFinite(currentSeq) ? currentSeq + 1 : 1;
    return `TTA - ${month}/${year} - ${String(nextSeq).padStart(3, '0')}`;
  }

  function commitTtaId(id) {
    const match = /^TTA\s-\s(\d{2})\/(\d{4})\s-\s(\d+)$/.exec(id || '');
    if (!match) return;

    const month = match[1];
    const year = match[2];
    const seq = Number(match[3]);
    const seqKey = `${TTA_SEQ_PREFIX}${year}_${month}`;

    const currentSeq = Number(localStorage.getItem(seqKey) || '0');
    if (seq > currentSeq) localStorage.setItem(seqKey, String(seq));
  }

  function toFileNameList(fileInputId) {
    const input = document.getElementById(fileInputId);
    if (!input || !input.files) return [];
    return Array.from(input.files).map(function (file) { return file.name; });
  }

  function readImageDataUrls(fileInputId, maxItems) {
    const input = document.getElementById(fileInputId);
    const files = Array.from((input && input.files) || [])
      .filter(function (file) { return file.type && file.type.startsWith('image/'); })
      .slice(0, maxItems || 1);

    return Promise.all(files.map(function (file) {
      return new Promise(function (resolve) {
        const reader = new FileReader();
        reader.onload = function () { resolve(reader.result || ''); };
        reader.onerror = function () { resolve(''); };
        reader.readAsDataURL(file);
      });
    })).then(function (list) {
      return list.filter(Boolean);
    });
  }

  function readTtaRecords() {
    return readJson(TTA_KEY) || [];
  }

  function writeTtaRecords(list) {
    writeJson(TTA_KEY, list);
  }

  function shouldApplyApiList(localList, apiList, label) {
    if (!Array.isArray(apiList)) return false;
    if (apiList.length === 0 && Array.isArray(localList) && localList.length > 0) {
      console.warn(`${label} sync skipped: API kosong, data lokal dipertahankan.`);
      return false;
    }
    return true;
  }

  async function syncTtaFromApi() {
    try {
      if (!window.AIOSApi || typeof window.AIOSApi.listTta !== 'function') return;
      if (!window.AIOSApi.getToken || !window.AIOSApi.getToken()) return;
      const apiList = await window.AIOSApi.listTta();
      const localList = readTtaRecords();
      if (shouldApplyApiList(localList, apiList, 'TTA')) {
        writeTtaRecords(apiList);
      }
    } catch (err) {
      console.warn('TTA sync from API failed:', err && err.message ? err.message : err);
    }
  }

  function getSession() {
    return readJson(SESSION_KEY) || {};
  }

  function getUsers() {
    return readJson(USER_KEY) || [];
  }

  function setSaveButtonText(text) {
    const saveButton = document.getElementById('save-tta-btn');
    if (saveButton) saveButton.textContent = text;
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showForm() {
    const form = document.getElementById('tta-form');
    if (!form) return;
    form.classList.remove('hidden');
    setTimeout(function () {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function hideForm() {
    const form = document.getElementById('tta-form');
    if (form) form.classList.add('hidden');
  }

  function setFollowUpFieldMode(enabled) {
    const form = document.getElementById('tta-form');
    if (!form) return;

    const editableIds = new Set(['tta-tindakan-perbaikan', 'tta-foto-perbaikan', 'tta-tanggal-perbaikan', 'tta-status-perbaikan']);
    const controls = form.querySelectorAll('input, select, textarea');
    controls.forEach(function (control) {
      if (!control || !control.id) return;
      if (enabled) {
        control.disabled = !editableIds.has(control.id);
      } else {
        control.disabled = false;
      }
    });
  }

  function getLoggedUserNama() {
    const session = getSession();
    const users = getUsers();
    const loginIdentity = (session.username || '').trim();
    const matchedUser = users.find(function (user) {
      return user.username === loginIdentity || user.email === loginIdentity;
    });
    return (matchedUser && matchedUser.nama) || session.nama || '';
  }

  function canFollowUpAsPja(record) {
    if (!record) return false;
    const namaUser = normalizeName(getLoggedUserNama());
    const namaPja = normalizeName(record.namaPja);
    if (!namaUser || !namaPja) return false;
    return namaUser === namaPja && isOpenOrProgress(record.status);
  }

  function autofillReporter() {
    const session = getSession();
    const users = getUsers();
    const loginIdentity = (session.username || '').trim();

    const matchedUser = users.find(function (user) {
      return user.username === loginIdentity || user.email === loginIdentity;
    });

    setValue('tta-nama-pelapor', (matchedUser && matchedUser.nama) || loginIdentity || '-');
    setValue('tta-jabatan-pelapor', (matchedUser && matchedUser.jabatan) || '-');
    setValue('tta-departemen-pelapor', (matchedUser && matchedUser.departemen) || '-');
    setValue('tta-perusahaan-pelapor', (matchedUser && matchedUser.perusahaan) || '-');
    setValue('tta-ccow-pelapor', (matchedUser && matchedUser.ccow) || '-');
  }

  function populatePjaOptions() {
    const select = document.getElementById('tta-nama-pja');
    if (!select) return;

    const pjaList = readJson(PJA_KEY) || [];
    const users = getUsers();

    pjaList.forEach(function (pja) {
      const user = users.find(function (item) { return item.id === pja.userId; });
      const label = (user && (user.nama || user.username)) || pja.userId || '';
      if (!label) return;

      const option = document.createElement('option');
      option.value = label;
      option.textContent = label;
      select.appendChild(option);
    });
  }

  function getPelakuLabel(user) {
    const nama = (user && user.nama) || '';
    const username = (user && user.username) || '';
    if (!nama && !username) return '';
    if (!nama) return username;
    if (!username) return nama;
    return `${nama} (${username})`;
  }

  function populatePelakuOptions() {
    const select = document.getElementById('tta-nama-pelaku');
    if (!select) return;

    const users = getUsers();
    users.forEach(function (user) {
      const label = getPelakuLabel(user);
      if (!label) return;

      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = label;
      select.appendChild(option);
    });
  }

  function syncPelakuDetails() {
    const pelakuSelect = document.getElementById('tta-nama-pelaku');
    const userId = (pelakuSelect && pelakuSelect.value) || '';

    if (!userId) {
      setValue('tta-jabatan-pelaku', '');
      setValue('tta-departemen-pelaku', '');
      setValue('tta-perusahaan-pelaku', '');
      return;
    }

    const users = getUsers();
    const user = users.find(function (item) { return item.id === userId; });

    setValue('tta-jabatan-pelaku', (user && user.jabatan) || '');
    setValue('tta-departemen-pelaku', (user && user.departemen) || '');
    setValue('tta-perusahaan-pelaku', (user && user.perusahaan) || '');
  }

  function togglePerbaikanSection() {
    const perbaikanLangsung = document.getElementById('tta-perbaikan-langsung');
    const perbaikanSection = document.getElementById('tta-perbaikan-section');
    const tindakanPerbaikan = document.getElementById('tta-tindakan-perbaikan');
    const tanggalPerbaikan = document.getElementById('tta-tanggal-perbaikan');
    const statusPerbaikan = document.getElementById('tta-status-perbaikan');

    if (!perbaikanLangsung || !perbaikanSection) return;

    const isYa = perbaikanLangsung.value === 'Ya';
    perbaikanSection.classList.toggle('hidden', !isYa);

    if (!isYa && statusPerbaikan) {
      statusPerbaikan.value = 'Open';
    }

    if (tindakanPerbaikan) tindakanPerbaikan.required = isYa;
    if (tanggalPerbaikan) tanggalPerbaikan.required = isYa;
    if (statusPerbaikan) statusPerbaikan.required = isYa;
  }

  function collectFormData() {
    const pelakuSelect = document.getElementById('tta-nama-pelaku');
    const pelakuId = (pelakuSelect && pelakuSelect.value) || '';
    const perbaikanLangsung = (document.getElementById('tta-perbaikan-langsung') || {}).value || 'Tidak';
    const statusValue = (document.getElementById('tta-status-perbaikan') || {}).value || '';
    const session = getSession();
    const users = getUsers();
    const pelakuUser = users.find(function (item) { return item.id === pelakuId; });

    return {
      id: (document.getElementById('tta-id') || {}).value || '',
      reporterUsername: (session.username || '').trim(),
      tanggalLaporan: (document.getElementById('tta-tanggal-laporan') || {}).value || '',
      namaPelapor: (document.getElementById('tta-nama-pelapor') || {}).value || '',
      jabatanPelapor: (document.getElementById('tta-jabatan-pelapor') || {}).value || '',
      departemenPelapor: (document.getElementById('tta-departemen-pelapor') || {}).value || '',
      perusahaanPelapor: (document.getElementById('tta-perusahaan-pelapor') || {}).value || '',
      ccowPelapor: (document.getElementById('tta-ccow-pelapor') || {}).value || '',
      tanggalTemuan: (document.getElementById('tta-tanggal-temuan') || {}).value || '',
      jamTemuan: (document.getElementById('tta-jam-temuan') || {}).value || '',
      kategoriTemuan: (document.getElementById('tta-kategori-temuan') || {}).value || '',
      lokasiTemuan: (document.getElementById('tta-lokasi-temuan') || {}).value || '',
      detailLokasiTemuan: (document.getElementById('tta-detail-lokasi-temuan') || {}).value || '',
      riskLevel: (document.getElementById('tta-risk-level') || {}).value || '',
      namaPja: (document.getElementById('tta-nama-pja') || {}).value || '',
      pelakuId: pelakuId,
      namaPelaku: getPelakuLabel(pelakuUser),
      jabatanPelaku: (document.getElementById('tta-jabatan-pelaku') || {}).value || '',
      departemenPelaku: (document.getElementById('tta-departemen-pelaku') || {}).value || '',
      perusahaanPelaku: (document.getElementById('tta-perusahaan-pelaku') || {}).value || '',
      detailTemuan: (document.getElementById('tta-detail-temuan') || {}).value || '',
      fotoTemuan: toFileNameList('tta-foto-temuan'),
      perbaikanLangsung: perbaikanLangsung,
      tindakanPerbaikan: (document.getElementById('tta-tindakan-perbaikan') || {}).value || '',
      fotoPerbaikan: toFileNameList('tta-foto-perbaikan'),
      tanggalPerbaikan: (document.getElementById('tta-tanggal-perbaikan') || {}).value || '',
      status: perbaikanLangsung === 'Tidak' ? 'Open' : statusValue
    };
  }

  function fillForm(data) {
    setValue('tta-id', data.id);
    setValue('tta-tanggal-laporan', data.tanggalLaporan);
    setValue('tta-nama-pelapor', data.namaPelapor);
    setValue('tta-jabatan-pelapor', data.jabatanPelapor);
    setValue('tta-departemen-pelapor', data.departemenPelapor);
    setValue('tta-perusahaan-pelapor', data.perusahaanPelapor);
    setValue('tta-ccow-pelapor', data.ccowPelapor);
    setValue('tta-tanggal-temuan', data.tanggalTemuan);
    setValue('tta-jam-temuan', data.jamTemuan);
    setValue('tta-kategori-temuan', data.kategoriTemuan);
    setValue('tta-lokasi-temuan', data.lokasiTemuan);
    setValue('tta-detail-lokasi-temuan', data.detailLokasiTemuan);
    setValue('tta-risk-level', data.riskLevel);
    setValue('tta-nama-pja', data.namaPja);
    setValue('tta-nama-pelaku', data.pelakuId || '');
    setValue('tta-jabatan-pelaku', data.jabatanPelaku);
    setValue('tta-departemen-pelaku', data.departemenPelaku);
    setValue('tta-perusahaan-pelaku', data.perusahaanPelaku);
    setValue('tta-detail-temuan', data.detailTemuan);
    setValue('tta-perbaikan-langsung', data.perbaikanLangsung || 'Tidak');
    setValue('tta-tindakan-perbaikan', data.tindakanPerbaikan);
    setValue('tta-tanggal-perbaikan', data.tanggalPerbaikan);
    setValue('tta-status-perbaikan', data.status || '');

    togglePerbaikanSection();
    syncPelakuDetails();
  }

  function resetFormForNew() {
    editingId = null;
    followUpMode = false;
    const form = document.getElementById('tta-form');
    if (form) form.reset();

    setValue('tta-id', nextTtaId());
    setValue('tta-tanggal-laporan', todayInputValue());
    autofillReporter();
    setValue('tta-perbaikan-langsung', 'Tidak');
    setValue('tta-status-perbaikan', '');
    setValue('tta-jabatan-pelaku', '');
    setValue('tta-departemen-pelaku', '');
    setValue('tta-perusahaan-pelaku', '');
    togglePerbaikanSection();
    setFollowUpFieldMode(false);
    setSaveButtonText('Simpan');
  }

  function validateForm(data) {
    if (!data.id) return 'No ID wajib terisi';
    if (!data.tanggalLaporan) return 'Tanggal Laporan wajib terisi';
    if (!data.tanggalTemuan) return 'Tanggal Temuan wajib diisi';
    if (!data.jamTemuan) return 'Jam Temuan wajib diisi';
    if (!data.kategoriTemuan) return 'Kategori Temuan wajib diisi';
    if (!data.lokasiTemuan) return 'Lokasi Temuan wajib dipilih';
    if (!data.riskLevel) return 'Risk Level wajib dipilih';
    if (!data.namaPja) return 'Nama PJA wajib dipilih';
    if (!data.pelakuId) return 'Nama Pelaku TTA wajib dipilih';
    if (!data.detailTemuan) return 'Detail Temuan wajib diisi';

    if (data.perbaikanLangsung === 'Ya') {
      if (!data.tindakanPerbaikan) return 'Tindakan Perbaikan wajib diisi';
      if (!data.tanggalPerbaikan) return 'Tanggal Perbaikan wajib diisi';
      if (!data.status) return 'Status wajib dipilih';
    }

    return '';
  }

  function renderTable() {
    const tbody = document.querySelector('#tta-list tbody');
    if (!tbody) return;

    const list = readTtaRecords();
    tbody.innerHTML = '';

    if (list.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="10" class="muted">Belum ada data TTA</td>';
      tbody.appendChild(tr);
      return;
    }

    list.forEach(function (item) {
      const tr = document.createElement('tr');
      const canManage = currentRole === 'Super Admin';
      const thumb = item.fotoTemuanPreview && item.fotoTemuanPreview[0]
        ? `<img src="${item.fotoTemuanPreview[0]}" alt="Foto ${escapeHtml(item.id)}" class="table-thumb" />`
        : '<span class="muted">No Image</span>';
      const aksiHtml = canManage
        ? `<button type="button" class="small edit-tta" data-id="${escapeHtml(item.id)}">Edit</button> <button type="button" class="small delete-tta" data-id="${escapeHtml(item.id)}">Hapus</button>`
        : '-';

      tr.innerHTML = `
        <td>${escapeHtml(item.id)}</td>
        <td>${escapeHtml(item.tanggalLaporan)}</td>
        <td>${escapeHtml(item.jamTemuan || '-')}</td>
        <td>${escapeHtml(item.namaPelapor)}</td>
        <td>${thumb}</td>
        <td>${escapeHtml(item.namaPelaku || '-')}</td>
        <td>${escapeHtml(item.lokasiTemuan)}</td>
        <td>${escapeHtml(item.riskLevel)}</td>
        <td>${escapeHtml(item.status || '-')}</td>
        <td>${aksiHtml}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  async function saveFormData() {
    if (followUpMode) {
      if (!editingId) {
        alert('Data follow-up tidak valid.');
        return;
      }

      const list = readTtaRecords();
      const idx = list.findIndex(function (item) { return item.id === editingId; });
      if (idx < 0) {
        alert('Data TTA tidak ditemukan.');
        return;
      }

      const previous = list[idx];
      if (!canFollowUpAsPja(previous)) {
        alert('Anda tidak memiliki akses follow-up untuk data ini.');
        return;
      }

      const tindakanPerbaikan = (document.getElementById('tta-tindakan-perbaikan') || {}).value || '';
      const fotoPerbaikan = toFileNameList('tta-foto-perbaikan');
      const tanggalPerbaikan = (document.getElementById('tta-tanggal-perbaikan') || {}).value || '';
      const status = (document.getElementById('tta-status-perbaikan') || {}).value || '';
      const fotoPerbaikanPreviewList = await readImageDataUrls('tta-foto-perbaikan', 6);

      if (!tindakanPerbaikan) return alert('Tindakan Perbaikan wajib diisi');
      if (!tanggalPerbaikan) return alert('Tanggal Perbaikan wajib diisi');
      if (!status) return alert('Status wajib dipilih');

      const updated = {
        ...previous,
        tindakanPerbaikan,
        fotoPerbaikan: fotoPerbaikan.length ? fotoPerbaikan : (previous.fotoPerbaikan || []),
        fotoPerbaikanPreview: fotoPerbaikanPreviewList.length ? fotoPerbaikanPreviewList : (previous.fotoPerbaikanPreview || []),
        tanggalPerbaikan,
        status,
        perbaikanLangsung: 'Ya'
      };

      list[idx] = updated;
      writeTtaRecords(list);
      try {
        if (window.AIOSApi && typeof window.AIOSApi.updateTta === 'function' && window.AIOSApi.getToken && window.AIOSApi.getToken()) {
          await window.AIOSApi.updateTta(updated.id, updated);
        }
      } catch (err) {
        console.warn('TTA follow-up API update failed:', err && err.message ? err.message : err);
      }

      renderTable();
      resetFormForNew();
      hideForm();
      alert('Follow-up TTA berhasil disimpan.');
      return;
    }

    const data = collectFormData();
    const validationMessage = validateForm(data);
    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    const list = readTtaRecords();
    const idx = list.findIndex(function (item) {
      return item.id === (editingId || data.id);
    });

    const previous = idx >= 0 ? list[idx] : null;

    const previewList = await readImageDataUrls('tta-foto-temuan', 6);
    data.fotoTemuanPreview = previewList.length ? previewList : ((previous && previous.fotoTemuanPreview) || []);
    if ((!data.fotoTemuan || data.fotoTemuan.length === 0) && previous && previous.fotoTemuan) {
      data.fotoTemuan = previous.fotoTemuan;
    }

    if (idx >= 0) {
      list[idx] = data;
      try {
        if (window.AIOSApi && typeof window.AIOSApi.updateTta === 'function' && window.AIOSApi.getToken && window.AIOSApi.getToken()) {
          await window.AIOSApi.updateTta(data.id, data);
        }
      } catch (err) {
        console.warn('TTA update API failed:', err && err.message ? err.message : err);
      }
    } else {
      list.push(data);
      commitTtaId(data.id);
      try {
        if (window.AIOSApi && typeof window.AIOSApi.createTta === 'function' && window.AIOSApi.getToken && window.AIOSApi.getToken()) {
          await window.AIOSApi.createTta(data);
        }
      } catch (err) {
        console.warn('TTA create API failed:', err && err.message ? err.message : err);
      }
    }

    writeTtaRecords(list);
    renderTable();
    resetFormForNew();
    hideForm();
  }

  function onTableClick(event) {
    const editBtn = event.target.closest('.edit-tta');
    const deleteBtn = event.target.closest('.delete-tta');
    if (!editBtn && !deleteBtn) return;

    if (currentRole !== 'Super Admin') {
      alert('Hanya Super Admin yang dapat edit atau hapus data TTA.');
      return;
    }

    const id = (editBtn || deleteBtn).getAttribute('data-id');
    const list = readTtaRecords();
    const row = list.find(function (item) { return item.id === id; });
    if (!row) return;

    if (editBtn) {
      editingId = row.id;
      fillForm(row);
      setSaveButtonText('Simpan Perubahan');
      showForm();
      return;
    }

    if (!confirm('Hapus data TTA ini?')) return;

    const nextList = list.filter(function (item) { return item.id !== id; });
    writeTtaRecords(nextList);
    try {
      if (window.AIOSApi && typeof window.AIOSApi.deleteTta === 'function' && window.AIOSApi.getToken && window.AIOSApi.getToken()) {
        window.AIOSApi.deleteTta(id).catch(() => {});
      }
    } catch (err) {
      console.warn('TTA delete API failed:', err && err.message ? err.message : err);
    }
    renderTable();
    if (editingId === id) resetFormForNew();
  }

  async function init() {
    const session = getSession();
    currentRole = session.role || '';

    autofillReporter();
    populatePjaOptions();
    populatePelakuOptions();

    const perbaikanLangsung = document.getElementById('tta-perbaikan-langsung');
    if (perbaikanLangsung) {
      perbaikanLangsung.addEventListener('change', togglePerbaikanSection);
    }

    const pelakuSelect = document.getElementById('tta-nama-pelaku');
    if (pelakuSelect) {
      pelakuSelect.addEventListener('change', syncPelakuDetails);
    }

    const showFormButton = document.getElementById('show-tta-form-btn');
    if (showFormButton) {
      showFormButton.addEventListener('click', function () {
        resetFormForNew();
        showForm();
      });
    }

    const cancelFormButton = document.getElementById('cancel-tta-form-btn');
    if (cancelFormButton) {
      cancelFormButton.addEventListener('click', function () {
        resetFormForNew();
        hideForm();
      });
    }

    const form = document.getElementById('tta-form');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        saveFormData();
      });
    }

    const ttaTable = document.getElementById('tta-list');
    if (ttaTable) {
      ttaTable.addEventListener('click', onTableClick);
    }

    await syncTtaFromApi();
    resetFormForNew();
    hideForm();
    togglePerbaikanSection();
    renderTable();

    try {
      const params = new URLSearchParams(window.location.search || '');
      if (params.get('action') === 'edit') {
        const targetId = params.get('id') || '';
        if (targetId && currentRole === 'Super Admin') {
          const list = readTtaRecords();
          const target = list.find(function (item) { return item.id === targetId; });
          if (target) {
            editingId = target.id;
            followUpMode = false;
            fillForm(target);
            setFollowUpFieldMode(false);
            setSaveButtonText('Simpan Perubahan');
            showForm();
          }
        }
      }
      if (params.get('action') === 'followup') {
        const targetId = params.get('id') || '';
        if (targetId) {
          const list = readTtaRecords();
          const target = list.find(function (item) { return item.id === targetId; });
          if (target && canFollowUpAsPja(target)) {
            editingId = target.id;
            followUpMode = true;
            fillForm(target);
            setValue('tta-perbaikan-langsung', 'Ya');
            togglePerbaikanSection();
            setFollowUpFieldMode(true);
            setSaveButtonText('Simpan Follow-up');
            showForm();
          } else if (target) {
            alert('Notifikasi ini tidak dapat ditindaklanjuti oleh akun Anda.');
          }
        }
      }
    } catch (err) {
      console.warn('TTA follow-up open from URL failed:', err && err.message ? err.message : err);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
