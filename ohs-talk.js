(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const COMPANY_KEY = 'aios_companies';
  const OHS_TALK_KEY = 'aios_ohs_talk_records';
  const OHS_TALK_SEQ_PREFIX = 'aios_ohs_talk_seq_';

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

  function populatePerusahaanPemateriOptions() {
    const select = document.getElementById('ohs-perusahaan-pemateri');
    if (!select) return;

    const companies = getCompanies();
    companies.forEach(function (company) {
      const label = company.name || company.id || '';
      if (!label) return;
      const option = document.createElement('option');
      option.value = label;
      option.textContent = label;
      select.appendChild(option);
    });
  }

  async function syncMasterDataIfNeeded() {
    try {
      if (!window.AIOSApi || !window.AIOSApi.getToken || !window.AIOSApi.getToken()) return;

      if (typeof window.AIOSApi.listUsers === 'function') {
        const users = await window.AIOSApi.listUsers();
        if (Array.isArray(users)) writeJson(USER_KEY, users);
      }

      if (typeof window.AIOSApi.listCompanies === 'function') {
        const companies = await window.AIOSApi.listCompanies();
        if (Array.isArray(companies)) writeJson(COMPANY_KEY, companies);
      }
    } catch (err) {
      console.warn('OHS Talk sync master data failed:', err && err.message ? err.message : err);
    }
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

  async function syncOhsTalkFromApi() {
    try {
      if (!window.AIOSApi || typeof window.AIOSApi.listOhsTalk !== 'function') return;
      if (!window.AIOSApi.getToken || !window.AIOSApi.getToken()) return;
      const list = await window.AIOSApi.listOhsTalk();
      if (Array.isArray(list)) writeJson(OHS_TALK_KEY, list);
    } catch (err) {
      console.warn('OHS Talk sync from API failed:', err && err.message ? err.message : err);
    }
  }

  async function saveFormData(event) {
    event.preventDefault();

    const data = collectFormData();
    const validationMessage = validateForm(data);
    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    const previewList = await readImageDataUrls('ohs-foto-kegiatan', 6);
    data.fotoKegiatanPreview = previewList;

    const list = readJson(OHS_TALK_KEY) || [];
    list.push(data);
    writeJson(OHS_TALK_KEY, list);
    commitOhsTalkId(data.id);

    try {
      if (window.AIOSApi && typeof window.AIOSApi.createOhsTalk === 'function' && window.AIOSApi.getToken && window.AIOSApi.getToken()) {
        await window.AIOSApi.createOhsTalk(data);
      }
    } catch (err) {
      console.warn('OHS Talk create API failed:', err && err.message ? err.message : err);
    }

    alert('Data OHS Talk berhasil disimpan.');

    const form = document.getElementById('ohs-talk-form');
    if (form) form.reset();
    setValue('ohs-id', nextOhsTalkId());
    autofillParticipant();
  }

  async function init() {
    const session = getSession();
    if (!session || !session.username) {
      alert('Silakan login terlebih dahulu.');
      window.location.href = 'index.html';
      return;
    }

    await syncMasterDataIfNeeded();
    await syncOhsTalkFromApi();

    populatePerusahaanPemateriOptions();
    autofillParticipant();
    setValue('ohs-id', nextOhsTalkId());

    const form = document.getElementById('ohs-talk-form');
    if (form) {
      form.addEventListener('submit', saveFormData);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
