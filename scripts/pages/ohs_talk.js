(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const COMPANY_KEY = 'aios_companies';
  const OHS_TALK_KEY = 'aios_ohs_talk';

  const addButton = document.getElementById('add-ohs-btn');
  const form = document.getElementById('ohs-talk-form');
  const tbody = document.getElementById('ohs-talk-tbody');
  const noIdInput = document.getElementById('ohs-no-id');
  const namaPesertaInput = document.getElementById('ohs-nama-peserta');
  const jabatanPesertaInput = document.getElementById('ohs-jabatan-peserta');
  const departemenPesertaInput = document.getElementById('ohs-departemen-peserta');
  const perusahaanPesertaInput = document.getElementById('ohs-perusahaan-peserta');
  const ccowInput = document.getElementById('ohs-ccow');
  const kategoriInput = document.getElementById('ohs-kategori');
  const tanggalInput = document.getElementById('ohs-tanggal');
  const waktuInput = document.getElementById('ohs-waktu');
  const lokasiInput = document.getElementById('ohs-lokasi');
  const detailLokasiInput = document.getElementById('ohs-detail-lokasi');
  const pemateriInput = document.getElementById('ohs-pemateri');
  const perusahaanPemateriInput = document.getElementById('ohs-perusahaan-pemateri');
  const topikInput = document.getElementById('ohs-topik');
  const fotoInput = document.getElementById('ohs-foto');
  const fotoPreview = document.getElementById('ohs-foto-preview');
  const cancelButton = document.getElementById('ohs-cancel-btn');
  let editingId = '';
  let fotoDraft = [];

  function openForm() {
    form.classList.remove('hidden');
  }

  function closeForm() {
    form.classList.add('hidden');
  }

  function readList(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (_error) {
      return [];
    }
  }

  function writeList(key, rows) {
    localStorage.setItem(key, JSON.stringify(rows));
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function requireSession() {
    const session = getSession();
    if (!session || !session.username) {
      alert('Silakan login terlebih dahulu.');
      window.location.href = '../index.html';
      return null;
    }
    return session;
  }

  function getCurrentUser(session) {
    const users = readList(USER_KEY);
    return users.find(function (user) {
      return String(user.username || '').toLowerCase() === String(session.username || '').toLowerCase();
    }) || null;
  }

  function fillPerusahaanPemateri() {
    const companies = readList(COMPANY_KEY);
    perusahaanPemateriInput.innerHTML = '<option value="">(Pilih Perusahaan)</option>';

    companies.forEach(function (company) {
      const value = String((company && company.name) || '').trim();
      if (!value) return;
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      perusahaanPemateriInput.appendChild(option);
    });
  }

  function buildNoId() {
    const rows = readList(OHS_TALK_KEY);
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    const prefix = 'OHS Talk - ' + month + '/' + year + ' - ';

    const usedNumbers = rows
      .map(function (row) { return String(row.noId || ''); })
      .filter(function (value) { return value.indexOf(prefix) === 0; })
      .map(function (value) {
        const numberPart = value.split(' - ').pop();
        return parseInt(numberPart, 10);
      })
      .filter(function (value) { return !Number.isNaN(value); });

    const next = usedNumbers.length > 0 ? Math.max.apply(null, usedNumbers) + 1 : 1;
    return prefix + String(next).padStart(3, '0');
  }

  function readFilesAsPayloadFromFiles(files) {
    return Promise.all(files.map(function (file) {
      return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () {
          resolve({ name: file.name, dataUrl: reader.result });
        };
        reader.onerror = function () {
          reject(new Error('Gagal membaca file gambar.'));
        };
        reader.readAsDataURL(file);
      });
    }));
  }

  function renderPhotoPreview(payloads) {
    fotoPreview.innerHTML = '';
    if (!payloads.length) return;

    payloads.forEach(function (item, index) {
      if (!item || !item.dataUrl) return;
      const wrap = document.createElement('div');
      wrap.className = 'photo-thumb-item';
      wrap.innerHTML =
        '<img src="' + item.dataUrl + '" alt="' + (item.name || 'Foto Kegiatan') + '" class="ohs-photo-thumb" />' +
        '<button type="button" class="photo-remove-btn" data-index="' + index + '">✕</button>';
      fotoPreview.appendChild(wrap);
    });
  }

  async function appendPhotos(files) {
    if (!files.length) return;
    try {
      const payload = await readFilesAsPayloadFromFiles(files);
      fotoDraft = fotoDraft.concat(payload);
      renderPhotoPreview(fotoDraft);
    } catch (error) {
      alert(error.message || 'Gagal memproses foto kegiatan.');
    }
  }

  function getThumbUrl(payload) {
    if (!Array.isArray(payload) || payload.length === 0) return '';
    const first = payload[0];
    return first && first.dataUrl ? first.dataUrl : '';
  }

  function renderRows() {
    const session = getSession();
    const canManage = !!(session && session.role === 'Super Admin');
    const rows = readList(OHS_TALK_KEY);
    tbody.innerHTML = '';

    rows.forEach(function (row) {
      const thumb = getThumbUrl(row.fotoKegiatan);
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + (row.noId || '-') + '</td>' +
        '<td>' + (row.namaPeserta || '-') + '</td>' +
        '<td>' + (row.kategori || '-') + '</td>' +
        '<td>' + (row.tanggalPelaksanaan || '-') + '</td>' +
        '<td>' + (row.waktuPelaksanaan || '-') + '</td>' +
        '<td>' + (row.lokasi || '-') + '</td>' +
        '<td>' + (row.pemateri || '-') + '</td>' +
        '<td>' + (row.perusahaanPemateri || '-') + '</td>' +
        '<td>' + (row.topik || '-') + '</td>' +
        '<td>' + (thumb ? '<img src="' + thumb + '" alt="Foto Kegiatan" class="ohs-photo-thumb" />' : '-') + '</td>' +
        '<td>' +
          (canManage
            ? '<button type="button" class="table-btn" data-action="edit" data-id="' + row.id + '">Ubah</button> ' +
              '<button type="button" class="table-btn danger" data-action="delete" data-id="' + row.id + '">Hapus</button>'
            : '-') +
        '</td>';
      tbody.appendChild(tr);
    });
  }

  function fillAutoFields(user) {
    namaPesertaInput.value = user.nama || '';
    jabatanPesertaInput.value = user.jabatan || '';
    departemenPesertaInput.value = user.departemen || '';
    perusahaanPesertaInput.value = user.perusahaan || '';
    ccowInput.value = user.ccow || '';
  }

  function resetFormState(user) {
    editingId = '';
    fotoDraft = [];
    noIdInput.value = buildNoId();
    fillAutoFields(user);
    kategoriInput.value = '';
    tanggalInput.value = '';
    waktuInput.value = '';
    lokasiInput.value = '';
    detailLokasiInput.value = '';
    pemateriInput.value = '';
    perusahaanPemateriInput.value = '';
    topikInput.value = '';
    fotoInput.value = '';
    renderPhotoPreview(fotoDraft);
  }

  function validatePayload(payload) {
    if (!payload.noId) return 'No ID tidak valid.';
    if (!payload.namaPeserta) return 'Nama Peserta tidak ditemukan.';
    if (!payload.kategori) return 'Kategori wajib dipilih.';
    if (!payload.tanggalPelaksanaan) return 'Tanggal Pelaksanaan wajib diisi.';
    if (!payload.waktuPelaksanaan) return 'Waktu Pelaksanaan wajib diisi.';
    if (!payload.lokasi) return 'Lokasi wajib dipilih.';
    if (!payload.detailLokasi) return 'Detail Lokasi wajib diisi.';
    if (!payload.pemateri) return 'Pemateri wajib diisi.';
    if (!payload.perusahaanPemateri) return 'Perusahaan Pemateri wajib dipilih.';
    if (!payload.topik) return 'Topik wajib diisi.';
    return '';
  }

  fotoInput.addEventListener('change', async function () {
    const files = Array.from(fotoInput.files || []);
    appendPhotos(files);
    fotoInput.value = '';
  });

  form.addEventListener('click', function (event) {
    const removeBtn = event.target.closest('.photo-remove-btn[data-index]');
    if (!removeBtn) return;
    const index = Number(removeBtn.dataset.index);
    if (Number.isNaN(index)) return;
    fotoDraft = fotoDraft.filter(function (_item, idx) { return idx !== index; });
    renderPhotoPreview(fotoDraft);
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const session = requireSession();
    if (!session) return;
    const user = getCurrentUser(session);
    if (!user) {
      alert('Data user login tidak ditemukan.');
      return;
    }

    if (editingId) {
      const sessionCheck = getSession();
      if (!sessionCheck || sessionCheck.role !== 'Super Admin') {
        alert('Aksi ubah data OHS Talk hanya dapat dilakukan oleh Super Admin.');
        return;
      }
    }

    const payloadId = editingId || ('ohs-talk-' + Date.now());
    const payload = {
      id: payloadId,
      noId: String(noIdInput.value || '').trim(),
      username: user.username || '',
      namaPeserta: String(namaPesertaInput.value || '').trim(),
      jabatanPeserta: String(jabatanPesertaInput.value || '').trim(),
      departemenPeserta: String(departemenPesertaInput.value || '').trim(),
      perusahaanPeserta: String(perusahaanPesertaInput.value || '').trim(),
      ccow: String(ccowInput.value || '').trim(),
      kategori: String(kategoriInput.value || '').trim(),
      tanggalPelaksanaan: String(tanggalInput.value || '').trim(),
      waktuPelaksanaan: String(waktuInput.value || '').trim(),
      lokasi: String(lokasiInput.value || '').trim(),
      detailLokasi: String(detailLokasiInput.value || '').trim(),
      pemateri: String(pemateriInput.value || '').trim(),
      perusahaanPemateri: String(perusahaanPemateriInput.value || '').trim(),
      topik: String(topikInput.value || '').trim(),
      fotoKegiatan: fotoDraft
    };

    const validationMessage = validatePayload(payload);
    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    const rows = readList(OHS_TALK_KEY);
    const idx = rows.findIndex(function (item) { return item.id === payloadId; });
    if (idx >= 0) rows[idx] = payload;
    else rows.push(payload);
    writeList(OHS_TALK_KEY, rows);
    alert(editingId ? 'Data OHS Talk berhasil diubah.' : 'Data OHS Talk berhasil disimpan.');

    resetFormState(user);
    renderRows();
    closeForm();
  });

  tbody.addEventListener('click', function (event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const session = getSession();
    if (!session || session.role !== 'Super Admin') {
      alert('Aksi ubah/hapus data OHS Talk hanya dapat dilakukan oleh Super Admin.');
      return;
    }

    const action = button.dataset.action;
    const id = button.dataset.id;
    const rows = readList(OHS_TALK_KEY);
    const target = rows.find(function (item) { return item.id === id; });
    if (!target) return;

    if (action === 'edit') {
      editingId = target.id;
      fotoDraft = Array.isArray(target.fotoKegiatan) ? target.fotoKegiatan.slice() : [];

      noIdInput.value = target.noId || '';
      namaPesertaInput.value = target.namaPeserta || '';
      jabatanPesertaInput.value = target.jabatanPeserta || '';
      departemenPesertaInput.value = target.departemenPeserta || '';
      perusahaanPesertaInput.value = target.perusahaanPeserta || '';
      ccowInput.value = target.ccow || '';
      kategoriInput.value = target.kategori || '';
      tanggalInput.value = target.tanggalPelaksanaan || '';
      waktuInput.value = target.waktuPelaksanaan || '';
      lokasiInput.value = target.lokasi || '';
      detailLokasiInput.value = target.detailLokasi || '';
      pemateriInput.value = target.pemateri || '';
      perusahaanPemateriInput.value = target.perusahaanPemateri || '';
      topikInput.value = target.topik || '';
      fotoInput.value = '';
      renderPhotoPreview(fotoDraft);
      openForm();
      return;
    }

    if (action === 'delete') {
      if (!confirm('Hapus data OHS Talk ini?')) return;
      const nextRows = rows.filter(function (item) { return item.id !== id; });
      writeList(OHS_TALK_KEY, nextRows);
      renderRows();
      const sessionActive = requireSession();
      if (!sessionActive) return;
      const user = getCurrentUser(sessionActive);
      if (!user) return;
      resetFormState(user);
      closeForm();
    }
  });

  if (cancelButton) {
    cancelButton.addEventListener('click', function () {
      const session = requireSession();
      if (!session) return;
      const user = getCurrentUser(session);
      if (!user) return;
      resetFormState(user);
      closeForm();
    });
  }

  if (addButton) {
    addButton.addEventListener('click', function () {
      const session = requireSession();
      if (!session) return;
      const user = getCurrentUser(session);
      if (!user) return;
      resetFormState(user);
      openForm();
    });
  }

  function init() {
    const session = requireSession();
    if (!session) return;

    const user = getCurrentUser(session);
    if (!user) {
      alert('Profil user tidak ditemukan. Silakan login ulang.');
      window.location.href = '../index.html';
      return;
    }

    fillPerusahaanPemateri();
    resetFormState(user);
    closeForm();
    renderRows();
  }

  init();
})();
