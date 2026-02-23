(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const PJA_KEY = 'aios_pja';
  const KTA_KEY = 'aios_kta_records';
  const KTA_SEQ_PREFIX = 'aios_kta_seq_';

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

  function nextKtaId() {
    const key = getMonthYearKey();
    const seqKey = `${KTA_SEQ_PREFIX}${key}`;
    const [year, month] = key.split('_');

    const currentSeq = Number(localStorage.getItem(seqKey) || '0');
    const nextSeq = Number.isFinite(currentSeq) ? currentSeq + 1 : 1;
    return `KTA - ${month}/${year} - ${String(nextSeq).padStart(3, '0')}`;
  }

  function commitKtaId(id) {
    const match = /^KTA\s-\s(\d{2})\/(\d{4})\s-\s(\d+)$/.exec(id || '');
    if (!match) return;
    const month = match[1];
    const year = match[2];
    const seq = Number(match[3]);
    const seqKey = `${KTA_SEQ_PREFIX}${year}_${month}`;

    const currentSeq = Number(localStorage.getItem(seqKey) || '0');
    if (seq > currentSeq) {
      localStorage.setItem(seqKey, String(seq));
    }
  }

  function toFileNameList(fileInputId) {
    const input = document.getElementById(fileInputId);
    if (!input || !input.files) return [];
    return Array.from(input.files).map((file) => file.name);
  }

  function readImageDataUrls(fileInputId, maxItems) {
    const input = document.getElementById(fileInputId);
    const files = Array.from((input && input.files) || [])
      .filter((file) => file.type && file.type.startsWith('image/'))
      .slice(0, maxItems || 1);

    return Promise.all(files.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result || ''); };
      reader.onerror = function () { resolve(''); };
      reader.readAsDataURL(file);
    }))).then((list) => list.filter(Boolean));
  }

  function readKtaRecords() {
    return readJson(KTA_KEY) || [];
  }

  function writeKtaRecords(list) {
    writeJson(KTA_KEY, list);
  }

  async function syncKtaFromApi() {
    try {
      if (!window.AIOSApi || typeof window.AIOSApi.listKta !== 'function') return;
      if (!window.AIOSApi.getToken || !window.AIOSApi.getToken()) return;
      const apiList = await window.AIOSApi.listKta();
      if (Array.isArray(apiList)) {
        writeKtaRecords(apiList);
      }
    } catch (err) {
      console.warn('KTA sync from API failed:', err && err.message ? err.message : err);
    }
  }

  function setSaveButtonText(text) {
    const saveButton = document.getElementById('save-kta-btn');
    if (saveButton) saveButton.textContent = text;
  }

  function getSession() {
    return readJson(SESSION_KEY) || {};
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function collectFormData() {
    const session = getSession();
    const perbaikanLangsung = (document.getElementById('perbaikan-langsung') || {}).value || 'Tidak';
    const statusValue = (document.getElementById('status-perbaikan') || {}).value || '';
    return {
      id: (document.getElementById('kta-id') || {}).value || '',
      reporterUsername: (session.username || '').trim(),
      tanggalLaporan: (document.getElementById('tanggal-laporan') || {}).value || '',
      namaPelapor: (document.getElementById('nama-pelapor') || {}).value || '',
      jabatan: (document.getElementById('jabatan-pelapor') || {}).value || '',
      departemen: (document.getElementById('departemen-pelapor') || {}).value || '',
      perusahaan: (document.getElementById('perusahaan-pelapor') || {}).value || '',
      ccow: (document.getElementById('ccow-pelapor') || {}).value || '',
      tanggalTemuan: (document.getElementById('tanggal-temuan') || {}).value || '',
      kategoriTemuan: (document.getElementById('kategori-temuan') || {}).value || '',
      lokasiTemuan: (document.getElementById('lokasi-temuan') || {}).value || '',
      detailLokasiTemuan: (document.getElementById('detail-lokasi-temuan') || {}).value || '',
      riskLevel: (document.getElementById('risk-level') || {}).value || '',
      namaPja: (document.getElementById('nama-pja') || {}).value || '',
      detailTemuan: (document.getElementById('detail-temuan') || {}).value || '',
      fotoTemuan: toFileNameList('foto-temuan'),
      perbaikanLangsung: perbaikanLangsung,
      tindakanPerbaikan: (document.getElementById('tindakan-perbaikan') || {}).value || '',
      fotoPerbaikan: toFileNameList('foto-perbaikan'),
      tanggalPerbaikan: (document.getElementById('tanggal-perbaikan') || {}).value || '',
      status: perbaikanLangsung === 'Tidak' ? 'Open' : statusValue
    };
  }

  function fillForm(data) {
    setValue('kta-id', data.id);
    setValue('tanggal-laporan', data.tanggalLaporan);
    setValue('nama-pelapor', data.namaPelapor);
    setValue('jabatan-pelapor', data.jabatan);
    setValue('departemen-pelapor', data.departemen);
    setValue('perusahaan-pelapor', data.perusahaan);
    setValue('ccow-pelapor', data.ccow);
    setValue('tanggal-temuan', data.tanggalTemuan);
    setValue('kategori-temuan', data.kategoriTemuan);
    setValue('lokasi-temuan', data.lokasiTemuan);
    setValue('detail-lokasi-temuan', data.detailLokasiTemuan);
    setValue('risk-level', data.riskLevel);
    setValue('nama-pja', data.namaPja);
    setValue('detail-temuan', data.detailTemuan);
    setValue('perbaikan-langsung', data.perbaikanLangsung || 'Tidak');
    setValue('tindakan-perbaikan', data.tindakanPerbaikan);
    setValue('tanggal-perbaikan', data.tanggalPerbaikan);
    setValue('status-perbaikan', data.status || '');
    togglePerbaikanSection();
  }

  function showForm() {
    const form = document.getElementById('kta-form');
    if (!form) return;
    form.classList.remove('hidden');
    setTimeout(function () {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function hideForm() {
    const form = document.getElementById('kta-form');
    if (form) form.classList.add('hidden');
  }

  function setFollowUpFieldMode(enabled) {
    const form = document.getElementById('kta-form');
    if (!form) return;

    const editableIds = new Set(['tindakan-perbaikan', 'foto-perbaikan', 'tanggal-perbaikan', 'status-perbaikan']);
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
    const users = readJson(USER_KEY) || [];
    const loginIdentity = (session.username || '').trim();
    const matchedUser = users.find((user) => user.username === loginIdentity || user.email === loginIdentity);
    return (matchedUser && matchedUser.nama) || session.nama || '';
  }

  function canFollowUpAsPja(record) {
    if (!record) return false;
    const namaUser = normalizeName(getLoggedUserNama());
    const namaPja = normalizeName(record.namaPja);
    if (!namaUser || !namaPja) return false;
    return namaUser === namaPja && isOpenOrProgress(record.status);
  }

  function resetFormForNew() {
    editingId = null;
    followUpMode = false;
    const form = document.getElementById('kta-form');
    if (form) form.reset();

    setValue('kta-id', nextKtaId());
    setValue('tanggal-laporan', todayInputValue());
    autofillReporter();
    setValue('perbaikan-langsung', 'Tidak');
    setValue('status-perbaikan', '');
    togglePerbaikanSection();
    setFollowUpFieldMode(false);
    setSaveButtonText('Simpan');
  }

  function validateForm(data) {
    if (!data.id) return 'No ID wajib terisi';
    if (!data.tanggalLaporan) return 'Tanggal Laporan wajib terisi';
    if (!data.tanggalTemuan) return 'Tanggal Temuan wajib diisi';
    if (!data.kategoriTemuan) return 'Kategori Temuan wajib diisi';
    if (!data.lokasiTemuan) return 'Lokasi Temuan wajib dipilih';
    if (!data.riskLevel) return 'Risk Level wajib dipilih';
    if (!data.namaPja) return 'Nama PJA wajib dipilih';
    if (!data.detailTemuan) return 'Detail Temuan wajib diisi';
    if (data.perbaikanLangsung === 'Ya') {
      if (!data.tindakanPerbaikan) return 'Tindakan Perbaikan wajib diisi';
      if (!data.tanggalPerbaikan) return 'Tanggal Perbaikan wajib diisi';
      if (!data.status) return 'Status wajib dipilih';
    }
    return '';
  }

  function renderTable() {
    const tbody = document.querySelector('#kta-list tbody');
    if (!tbody) return;

    const list = readKtaRecords();
    tbody.innerHTML = '';

    if (list.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="10" class="muted">Belum ada data KTA</td>';
      tbody.appendChild(tr);
      return;
    }

    list.forEach((item) => {
      const tr = document.createElement('tr');
      const canManage = currentRole === 'Super Admin';
      const thumb = item.fotoTemuanPreview && item.fotoTemuanPreview[0]
        ? `<img src="${item.fotoTemuanPreview[0]}" alt="Foto ${escapeHtml(item.id)}" class="table-thumb" />`
        : '<span class="muted">No Image</span>';
      const aksiHtml = canManage
        ? `<button type="button" class="small edit-kta" data-id="${escapeHtml(item.id)}">Edit</button> <button type="button" class="small delete-kta" data-id="${escapeHtml(item.id)}">Hapus</button>`
        : '-';

      tr.innerHTML = `
        <td>${escapeHtml(item.id)}</td>
        <td>${escapeHtml(item.tanggalLaporan)}</td>
        <td>${escapeHtml(item.namaPelapor)}</td>
        <td>${thumb}</td>
        <td>${escapeHtml(item.lokasiTemuan)}</td>
        <td>${escapeHtml(item.riskLevel)}</td>
        <td>${escapeHtml(item.namaPja)}</td>
        <td>${escapeHtml(item.perbaikanLangsung)}</td>
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

      const list = readKtaRecords();
      const idx = list.findIndex((item) => item.id === editingId);
      if (idx < 0) {
        alert('Data KTA tidak ditemukan.');
        return;
      }

      const previous = list[idx];
      if (!canFollowUpAsPja(previous)) {
        alert('Anda tidak memiliki akses follow-up untuk data ini.');
        return;
      }

      const tindakanPerbaikan = (document.getElementById('tindakan-perbaikan') || {}).value || '';
      const fotoPerbaikan = toFileNameList('foto-perbaikan');
      const tanggalPerbaikan = (document.getElementById('tanggal-perbaikan') || {}).value || '';
      const status = (document.getElementById('status-perbaikan') || {}).value || '';
      const fotoPerbaikanPreviewList = await readImageDataUrls('foto-perbaikan', 6);

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
      writeKtaRecords(list);
      try {
        if (window.AIOSApi && typeof window.AIOSApi.updateKta === 'function' && window.AIOSApi.getToken && window.AIOSApi.getToken()) {
          await window.AIOSApi.updateKta(updated.id, updated);
        }
      } catch (err) {
        console.warn('KTA follow-up API update failed:', err && err.message ? err.message : err);
      }

      renderTable();
      resetFormForNew();
      hideForm();
      alert('Follow-up KTA berhasil disimpan.');
      return;
    }

    const data = collectFormData();
    const validationMessage = validateForm(data);
    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    const list = readKtaRecords();
    const idx = list.findIndex((item) => item.id === (editingId || data.id));

    const previous = idx >= 0 ? list[idx] : null;

    const previewList = await readImageDataUrls('foto-temuan', 6);
    data.fotoTemuanPreview = previewList.length ? previewList : ((previous && previous.fotoTemuanPreview) || []);
    if ((!data.fotoTemuan || data.fotoTemuan.length === 0) && previous && previous.fotoTemuan) {
      data.fotoTemuan = previous.fotoTemuan;
    }

    if (idx >= 0) {
      list[idx] = data;
      try {
        if (window.AIOSApi && typeof window.AIOSApi.updateKta === 'function' && window.AIOSApi.getToken && window.AIOSApi.getToken()) {
          await window.AIOSApi.updateKta(data.id, data);
        }
      } catch (err) {
        console.warn('KTA update API failed:', err && err.message ? err.message : err);
      }
    } else {
      list.push(data);
      commitKtaId(data.id);
      try {
        if (window.AIOSApi && typeof window.AIOSApi.createKta === 'function' && window.AIOSApi.getToken && window.AIOSApi.getToken()) {
          await window.AIOSApi.createKta(data);
        }
      } catch (err) {
        console.warn('KTA create API failed:', err && err.message ? err.message : err);
      }
    }

    writeKtaRecords(list);
    renderTable();
    resetFormForNew();
    hideForm();
  }

  function onTableClick(event) {
    const editBtn = event.target.closest('.edit-kta');
    const deleteBtn = event.target.closest('.delete-kta');
    if (!editBtn && !deleteBtn) return;

    if (currentRole !== 'Super Admin') {
      alert('Hanya Super Admin yang dapat edit atau hapus data KTA.');
      return;
    }

    const id = (editBtn || deleteBtn).getAttribute('data-id');
    const list = readKtaRecords();
    const row = list.find((item) => item.id === id);
    if (!row) return;

    if (editBtn) {
      editingId = row.id;
      fillForm(row);
      setSaveButtonText('Simpan Perubahan');
      showForm();
      return;
    }

    if (!confirm('Hapus data KTA ini?')) return;
    const nextList = list.filter((item) => item.id !== id);
    writeKtaRecords(nextList);
    try {
      if (window.AIOSApi && typeof window.AIOSApi.deleteKta === 'function' && window.AIOSApi.getToken && window.AIOSApi.getToken()) {
        window.AIOSApi.deleteKta(id).catch(() => {});
      }
    } catch (err) {
      console.warn('KTA delete API failed:', err && err.message ? err.message : err);
    }
    renderTable();
    if (editingId === id) resetFormForNew();
  }

  function autofillReporter() {
    const session = getSession();
    const users = readJson(USER_KEY) || [];

    const loginIdentity = (session.username || '').trim();
    const matchedUser = users.find((user) => {
      return user.username === loginIdentity || user.email === loginIdentity;
    });

    setValue('nama-pelapor', (matchedUser && matchedUser.nama) || loginIdentity || '-');
    setValue('jabatan-pelapor', (matchedUser && matchedUser.jabatan) || '-');
    setValue('departemen-pelapor', (matchedUser && matchedUser.departemen) || '-');
    setValue('perusahaan-pelapor', (matchedUser && matchedUser.perusahaan) || '-');
    setValue('ccow-pelapor', (matchedUser && matchedUser.ccow) || '-');
  }

  function populatePjaOptions() {
    const select = document.getElementById('nama-pja');
    if (!select) return;

    const pjaList = readJson(PJA_KEY) || [];
    const users = readJson(USER_KEY) || [];

    pjaList.forEach((pja) => {
      const user = users.find((item) => item.id === pja.userId);
      const label = (user && (user.nama || user.username)) || pja.userId || '';
      if (!label) return;

      const option = document.createElement('option');
      option.value = label;
      option.textContent = label;
      select.appendChild(option);
    });
  }

  function togglePerbaikanSection() {
    const perbaikanLangsung = document.getElementById('perbaikan-langsung');
    const perbaikanSection = document.getElementById('perbaikan-section');
    const tindakanPerbaikan = document.getElementById('tindakan-perbaikan');
    const tanggalPerbaikan = document.getElementById('tanggal-perbaikan');
    const statusPerbaikan = document.getElementById('status-perbaikan');

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

  async function init() {
    const session = getSession();
    currentRole = session.role || '';

    setValue('kta-id', nextKtaId());
    setValue('tanggal-laporan', todayInputValue());
    autofillReporter();
    populatePjaOptions();

    const perbaikanLangsung = document.getElementById('perbaikan-langsung');
    if (perbaikanLangsung) {
      perbaikanLangsung.addEventListener('change', togglePerbaikanSection);
    }

    const showFormButton = document.getElementById('show-kta-form-btn');
    if (showFormButton) {
      showFormButton.addEventListener('click', function () {
        resetFormForNew();
        showForm();
      });
    }

    const cancelFormButton = document.getElementById('cancel-kta-form-btn');
    if (cancelFormButton) {
      cancelFormButton.addEventListener('click', function () {
        resetFormForNew();
        hideForm();
      });
    }

    const form = document.getElementById('kta-form');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        saveFormData();
      });
    }

    const ktaTable = document.getElementById('kta-list');
    if (ktaTable) {
      ktaTable.addEventListener('click', onTableClick);
    }

    await syncKtaFromApi();
    resetFormForNew();
    hideForm();
    togglePerbaikanSection();
    renderTable();

    try {
      const params = new URLSearchParams(window.location.search || '');
      if (params.get('action') === 'edit') {
        const targetId = params.get('id') || '';
        if (targetId && currentRole === 'Super Admin') {
          const list = readKtaRecords();
          const target = list.find((item) => item.id === targetId);
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
          const list = readKtaRecords();
          const target = list.find((item) => item.id === targetId);
          if (target && canFollowUpAsPja(target)) {
            editingId = target.id;
            followUpMode = true;
            fillForm(target);
            setValue('perbaikan-langsung', 'Ya');
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
      console.warn('KTA follow-up open from URL failed:', err && err.message ? err.message : err);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
