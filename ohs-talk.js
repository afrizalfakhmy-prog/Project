(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const COMPANY_KEY = 'aios_companies';
  const OHS_TALK_KEY = 'aios_ohs_talk_records';
  const OHS_TALK_SEQ_PREFIX = 'aios_ohs_talk_seq_';

  let currentRole = '';
  let editingId = null;

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

  function getSession() {
    return readJson(SESSION_KEY) || {};
  }

  function getUsers() {
    return readJson(USER_KEY) || [];
  }

  function getCompanies() {
    return readJson(COMPANY_KEY) || [];
  }

  function getMonthYearKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}_${month}`;
  }

  function nextOhsTalkId() {
    const key = getMonthYearKey();
    const seqKey = `${OHS_TALK_SEQ_PREFIX}${key}`;
    const [year, month] = key.split('_');

    const currentSeq = Number(localStorage.getItem(seqKey) || '0');
    const nextSeq = Number.isFinite(currentSeq) ? currentSeq + 1 : 1;
    return `OHS Talk - ${month}/${year} - ${String(nextSeq).padStart(3, '0')}`;
  }

  function commitOhsTalkId(id) {
    const match = /^OHS Talk\s-\s(\d{2})\/(\d{4})\s-\s(\d+)$/.exec(id || '');
    if (!match) return;

    const month = match[1];
    const year = match[2];
    const seq = Number(match[3]);
    const seqKey = `${OHS_TALK_SEQ_PREFIX}${year}_${month}`;

    const currentSeq = Number(localStorage.getItem(seqKey) || '0');
    if (seq > currentSeq) localStorage.setItem(seqKey, String(seq));
  }

  function canManageData() {
    return currentRole === 'Super Admin' || currentRole === 'Admin';
  }

  function setSaveButtonText(text) {
    const saveButton = document.getElementById('save-ohs-talk-btn');
    if (saveButton) saveButton.textContent = text;
  }

  function showForm() {
    const form = document.getElementById('ohs-talk-form');
    if (!form) return;
    form.classList.remove('hidden');
    setTimeout(function () {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function hideForm() {
    const form = document.getElementById('ohs-talk-form');
    if (form) form.classList.add('hidden');
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

  function populatePerusahaanPemateriOptions(selectedValue) {
    const select = document.getElementById('ohs-perusahaan-pemateri');
    if (!select) return;

    const current = selectedValue || select.value || '';
    select.innerHTML = '<option value="">(Pilih Perusahaan)</option>';

    const companies = getCompanies();
    companies.forEach(function (company) {
      const label = company.name || company.id || '';
      if (!label) return;
      const option = document.createElement('option');
      option.value = label;
      option.textContent = label;
      if (current && current === label) option.selected = true;
      select.appendChild(option);
    });
  }

  async function syncMasterDataIfNeeded() {
    try {
      if (!window.AIOSApi || !window.AIOSApi.getToken || !window.AIOSApi.getToken()) return;

      if (typeof window.AIOSApi.listUsers === 'function') {
        const users = await window.AIOSApi.listUsers();
        const localUsers = readJson(USER_KEY) || [];
        if (shouldApplyApiList(localUsers, users, 'Users')) writeJson(USER_KEY, users);
      }

      if (typeof window.AIOSApi.listCompanies === 'function') {
        const companies = await window.AIOSApi.listCompanies();
        const localCompanies = readJson(COMPANY_KEY) || [];
        if (shouldApplyApiList(localCompanies, companies, 'Companies')) writeJson(COMPANY_KEY, companies);
      }
    } catch (err) {
      console.warn('OHS Talk sync master data failed:', err && err.message ? err.message : err);
    }
  }

  async function syncOhsTalkFromApi() {
    try {
      if (!window.AIOSApi || typeof window.AIOSApi.listOhsTalk !== 'function') return;
      if (!window.AIOSApi.getToken || !window.AIOSApi.getToken()) return;
      const list = await window.AIOSApi.listOhsTalk();
      const localList = readJson(OHS_TALK_KEY) || [];
      if (shouldApplyApiList(localList, list, 'OHS Talk')) writeJson(OHS_TALK_KEY, list);
    } catch (err) {
      console.warn('OHS Talk sync from API failed:', err && err.message ? err.message : err);
    }
  }

  function readRecords() {
    return readJson(OHS_TALK_KEY) || [];
  }

  function writeRecords(list) {
    writeJson(OHS_TALK_KEY, list);
  }

  function autofillParticipant() {
    const session = getSession();
    const users = getUsers();
    const loginIdentity = (session.username || '').trim();

    const matchedUser = users.find(function (user) {
      return user.username === loginIdentity || user.email === loginIdentity;
    });

    setValue('ohs-nama-peserta', (matchedUser && matchedUser.nama) || loginIdentity || '-');
    setValue('ohs-jabatan-peserta', (matchedUser && matchedUser.jabatan) || '-');
    setValue('ohs-departemen-peserta', (matchedUser && matchedUser.departemen) || '-');
    setValue('ohs-perusahaan-peserta', (matchedUser && matchedUser.perusahaan) || '-');
    setValue('ohs-ccow', (matchedUser && matchedUser.ccow) || '-');
  }

  function collectFormData() {
    const session = getSession();
    return {
      id: (document.getElementById('ohs-id') || {}).value || '',
      reporterUsername: (session.username || '').trim(),
      namaPeserta: (document.getElementById('ohs-nama-peserta') || {}).value || '',
      jabatanPeserta: (document.getElementById('ohs-jabatan-peserta') || {}).value || '',
      departemenPeserta: (document.getElementById('ohs-departemen-peserta') || {}).value || '',
      perusahaanPeserta: (document.getElementById('ohs-perusahaan-peserta') || {}).value || '',
      ccow: (document.getElementById('ohs-ccow') || {}).value || '',
      kategori: (document.getElementById('ohs-kategori') || {}).value || '',
      tanggalPelaksanaan: (document.getElementById('ohs-tanggal') || {}).value || '',
      waktuPelaksanaan: (document.getElementById('ohs-waktu') || {}).value || '',
      lokasi: (document.getElementById('ohs-lokasi') || {}).value || '',
      detailLokasi: (document.getElementById('ohs-detail-lokasi') || {}).value || '',
      pemateri: (document.getElementById('ohs-pemateri') || {}).value || '',
      perusahaanPemateri: (document.getElementById('ohs-perusahaan-pemateri') || {}).value || '',
      topik: (document.getElementById('ohs-topik') || {}).value || '',
      fotoKegiatan: toFileNameList('ohs-foto-kegiatan')
    };
  }

  function validateForm(data) {
    if (!data.id) return 'No ID wajib terisi';
    if (!data.namaPeserta) return 'Nama Peserta wajib terisi';
    if (!data.jabatanPeserta) return 'Jabatan Peserta wajib terisi';
    if (!data.departemenPeserta) return 'Departemen Peserta wajib terisi';
    if (!data.perusahaanPeserta) return 'Perusahaan Peserta wajib terisi';
    if (!data.ccow) return 'CCOW wajib terisi';
    if (!data.kategori) return 'Kategori wajib dipilih';
    if (!data.tanggalPelaksanaan) return 'Tanggal Pelaksanaan wajib diisi';
    if (!data.waktuPelaksanaan) return 'Waktu Pelaksanaan wajib diisi';
    if (!data.lokasi) return 'Lokasi wajib dipilih';
    if (!data.detailLokasi) return 'Detail Lokasi wajib diisi';
    if (!data.pemateri) return 'Pemateri wajib diisi';
    if (!data.perusahaanPemateri) return 'Perusahaan Pemateri wajib dipilih';
    if (!data.topik) return 'Topik wajib diisi';
    return '';
  }

  function fillForm(data) {
    setValue('ohs-id', data.id);
    setValue('ohs-nama-peserta', data.namaPeserta);
    setValue('ohs-jabatan-peserta', data.jabatanPeserta);
    setValue('ohs-departemen-peserta', data.departemenPeserta);
    setValue('ohs-perusahaan-peserta', data.perusahaanPeserta);
    setValue('ohs-ccow', data.ccow);
    setValue('ohs-kategori', data.kategori);
    setValue('ohs-tanggal', data.tanggalPelaksanaan);
    setValue('ohs-waktu', data.waktuPelaksanaan);
    setValue('ohs-lokasi', data.lokasi);
    setValue('ohs-detail-lokasi', data.detailLokasi);
    setValue('ohs-pemateri', data.pemateri);
    populatePerusahaanPemateriOptions(data.perusahaanPemateri);
    setValue('ohs-topik', data.topik);
  }

  function resetFormForNew() {
    editingId = null;
    const form = document.getElementById('ohs-talk-form');
    if (form) form.reset();

    setValue('ohs-id', nextOhsTalkId());
    autofillParticipant();
    populatePerusahaanPemateriOptions();
    setSaveButtonText('Simpan');
  }

  function renderTable() {
    const tbody = document.querySelector('#ohs-talk-list tbody');
    if (!tbody) return;

    const list = readRecords();
    tbody.innerHTML = '';

    if (list.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="10" class="muted">Belum ada data OHS Talk</td>';
      tbody.appendChild(tr);
      return;
    }

    const canManage = canManageData();

    list.forEach(function (item) {
      const tr = document.createElement('tr');
      const thumb = item.fotoKegiatanPreview && item.fotoKegiatanPreview[0]
        ? `<img src="${item.fotoKegiatanPreview[0]}" alt="Foto ${escapeHtml(item.id)}" class="table-thumb" />`
        : '<span class="muted">No Image</span>';
      const actionHtml = canManage
        ? `<button type="button" class="small edit-ohs-talk" data-id="${escapeHtml(item.id)}">Edit</button> <button type="button" class="small delete-ohs-talk" data-id="${escapeHtml(item.id)}">Hapus</button>`
        : '-';

      tr.innerHTML = `
        <td>${escapeHtml(item.id)}</td>
        <td>${escapeHtml(item.namaPeserta)}</td>
        <td>${escapeHtml(item.kategori)}</td>
        <td>${escapeHtml(item.tanggalPelaksanaan)}</td>
        <td>${escapeHtml(item.waktuPelaksanaan)}</td>
        <td>${escapeHtml(item.lokasi)}</td>
        <td>${escapeHtml(item.pemateri)}</td>
        <td>${escapeHtml(item.topik)}</td>
        <td>${thumb}</td>
        <td>${actionHtml}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  async function saveFormData(event) {
    event.preventDefault();

    const data = collectFormData();
    const validationMessage = validateForm(data);
    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    const list = readRecords();
    const idx = list.findIndex(function (item) {
      return item.id === (editingId || data.id);
    });
    const previous = idx >= 0 ? list[idx] : null;

    const previewList = await readImageDataUrls('ohs-foto-kegiatan', 6);
    data.fotoKegiatanPreview = previewList.length ? previewList : ((previous && previous.fotoKegiatanPreview) || []);
    if ((!data.fotoKegiatan || data.fotoKegiatan.length === 0) && previous && previous.fotoKegiatan) {
      data.fotoKegiatan = previous.fotoKegiatan;
    }

    if (idx >= 0) {
      if (!canManageData()) {
        alert('Hanya Super Admin dan Admin yang dapat mengubah data OHS Talk.');
        return;
      }
      list[idx] = Object.assign({}, previous, data);
      writeRecords(list);
      try {
        if (window.AIOSApi && typeof window.AIOSApi.updateOhsTalk === 'function' && window.AIOSApi.getToken && window.AIOSApi.getToken()) {
          await window.AIOSApi.updateOhsTalk(data.id, list[idx]);
        }
      } catch (err) {
        console.warn('OHS Talk update API failed:', err && err.message ? err.message : err);
      }
    } else {
      list.push(data);
      writeRecords(list);
      commitOhsTalkId(data.id);
      try {
        if (window.AIOSApi && typeof window.AIOSApi.createOhsTalk === 'function' && window.AIOSApi.getToken && window.AIOSApi.getToken()) {
          await window.AIOSApi.createOhsTalk(data);
        }
      } catch (err) {
        console.warn('OHS Talk create API failed:', err && err.message ? err.message : err);
      }
    }

    renderTable();
    resetFormForNew();
    hideForm();
    alert('Data OHS Talk berhasil disimpan.');
  }

  async function onTableClick(event) {
    const editBtn = event.target.closest('.edit-ohs-talk');
    const deleteBtn = event.target.closest('.delete-ohs-talk');
    if (!editBtn && !deleteBtn) return;

    if (!canManageData()) {
      alert('Hanya Super Admin dan Admin yang dapat edit atau hapus data OHS Talk.');
      return;
    }

    const id = (editBtn || deleteBtn).getAttribute('data-id');
    const list = readRecords();
    const row = list.find(function (item) { return item.id === id; });
    if (!row) return;

    if (editBtn) {
      editingId = row.id;
      fillForm(row);
      setSaveButtonText('Simpan Perubahan');
      showForm();
      return;
    }

    if (!confirm('Hapus data OHS Talk ini?')) return;

    const nextList = list.filter(function (item) { return item.id !== id; });
    writeRecords(nextList);
    try {
      if (window.AIOSApi && typeof window.AIOSApi.deleteOhsTalk === 'function' && window.AIOSApi.getToken && window.AIOSApi.getToken()) {
        await window.AIOSApi.deleteOhsTalk(id);
      }
    } catch (err) {
      console.warn('OHS Talk delete API failed:', err && err.message ? err.message : err);
    }

    renderTable();
    if (editingId === id) {
      resetFormForNew();
      hideForm();
    }
  }

  async function init() {
    const session = getSession();
    if (!session || !session.username) {
      alert('Silakan login terlebih dahulu.');
      window.location.href = 'index.html';
      return;
    }

    currentRole = session.role || '';

    await syncMasterDataIfNeeded();
    await syncOhsTalkFromApi();

    resetFormForNew();
    renderTable();

    const form = document.getElementById('ohs-talk-form');
    if (form) form.addEventListener('submit', saveFormData);

    const showBtn = document.getElementById('show-ohs-talk-form-btn');
    if (showBtn) {
      showBtn.addEventListener('click', function () {
        resetFormForNew();
        showForm();
      });
    }

    const cancelBtn = document.getElementById('cancel-ohs-talk-form-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        resetFormForNew();
        hideForm();
      });
    }

    const table = document.getElementById('ohs-talk-list');
    if (table) table.addEventListener('click', onTableClick);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
