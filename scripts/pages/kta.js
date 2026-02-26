(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const PJA_KEY = 'aios_pja';
  const KTA_KEY = 'aios_kta';

  const addButton = document.getElementById('add-kta-btn');
  const form = document.getElementById('kta-form');
  const tbody = document.getElementById('kta-tbody');
  const noIdInput = document.getElementById('kta-no-id');
  const tanggalLaporanInput = document.getElementById('kta-tanggal-laporan');
  const namaPelaporInput = document.getElementById('kta-nama-pelapor');
  const jabatanInput = document.getElementById('kta-jabatan');
  const departemenInput = document.getElementById('kta-departemen');
  const perusahaanInput = document.getElementById('kta-perusahaan');
  const ccowInput = document.getElementById('kta-ccow');

  const tanggalTemuanInput = document.getElementById('kta-tanggal-temuan');
  const kategoriTemuanInput = document.getElementById('kta-kategori-temuan');
  const lokasiTemuanInput = document.getElementById('kta-lokasi-temuan');
  const detailLokasiInput = document.getElementById('kta-detail-lokasi');
  const riskLevelInput = document.getElementById('kta-risk-level');
  const namaPjaInput = document.getElementById('kta-nama-pja');
  const detailTemuanInput = document.getElementById('kta-detail-temuan');
  const fotoTemuanInput = document.getElementById('kta-foto-temuan');
  const fotoTemuanPreview = document.getElementById('kta-foto-temuan-preview');
  const perbaikanLangsungInput = document.getElementById('kta-perbaikan-langsung');

  const perbaikanSection = document.getElementById('kta-perbaikan-section');
  const tindakanPerbaikanInput = document.getElementById('kta-tindakan-perbaikan');
  const fotoPerbaikanInput = document.getElementById('kta-foto-perbaikan');
  const fotoPerbaikanPreview = document.getElementById('kta-foto-perbaikan-preview');
  const tanggalPerbaikanInput = document.getElementById('kta-tanggal-perbaikan');
  const statusInput = document.getElementById('kta-status');
  const cancelButton = document.getElementById('kta-cancel-btn');
  let editingId = '';
  let fotoTemuanDraft = [];
  let fotoPerbaikanDraft = [];

  function todayValue() {
    return new Date().toISOString().slice(0, 10);
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
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

  function toNameOnlyLabel(value) {
    const raw = String(value || '').trim();
    if (!raw) return '-';
    return raw.includes(' - ') ? raw.split(' - ')[0].trim() : raw;
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

  function populateReporterProfile(username) {
    const users = readList(USER_KEY);
    const user = users.find(function (item) {
      return String(item.username || '').toLowerCase() === String(username || '').toLowerCase();
    });

    namaPelaporInput.value = user ? (user.nama || '') : '';
    jabatanInput.value = user ? (user.jabatan || '') : '';
    departemenInput.value = user ? (user.departemen || '') : '';
    perusahaanInput.value = user ? (user.perusahaan || '') : '';
    ccowInput.value = user ? (user.ccow || '') : '';
  }

  function populatePjaDropdown() {
    const pjaRows = readList(PJA_KEY);
    namaPjaInput.innerHTML = '<option value="">(Pilih Nama PJA)</option>';

    pjaRows.forEach(function (item) {
      const option = document.createElement('option');
      option.value = item.userId || '';
      option.textContent = toNameOnlyLabel(item.userLabel);
      namaPjaInput.appendChild(option);
    });
  }

  function buildNoId() {
    const rows = readList(KTA_KEY);
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    const prefix = 'KTA - ' + month + '/' + year + ' - ';

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

  function togglePerbaikanSection() {
    const isYes = perbaikanLangsungInput.value === 'Ya';
    if (isYes) {
      perbaikanSection.classList.remove('hidden');
      tindakanPerbaikanInput.required = true;
      tanggalPerbaikanInput.required = true;
      statusInput.required = true;
      return;
    }

    perbaikanSection.classList.add('hidden');
    tindakanPerbaikanInput.required = false;
    tanggalPerbaikanInput.required = false;
    statusInput.required = false;
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

  function renderPhotoPreview(container, items, fieldType) {
    container.innerHTML = '';
    items.forEach(function (item, index) {
      if (!item || !item.dataUrl) return;
      const wrap = document.createElement('div');
      wrap.className = 'photo-thumb-item';
      wrap.innerHTML =
        '<img src="' + item.dataUrl + '" alt="' + (item.name || 'Foto') + '" class="ohs-photo-thumb" />' +
        '<button type="button" class="photo-remove-btn" data-field="' + fieldType + '" data-index="' + index + '">✕</button>';
      container.appendChild(wrap);
    });
  }

  async function appendPhotos(fieldType, files) {
    if (!files.length) return;
    try {
      const payload = await readFilesAsPayloadFromFiles(files);
      if (fieldType === 'temuan') {
        fotoTemuanDraft = fotoTemuanDraft.concat(payload);
        renderPhotoPreview(fotoTemuanPreview, fotoTemuanDraft, 'temuan');
      } else {
        fotoPerbaikanDraft = fotoPerbaikanDraft.concat(payload);
        renderPhotoPreview(fotoPerbaikanPreview, fotoPerbaikanDraft, 'perbaikan');
      }
    } catch (error) {
      alert(error.message || 'Gagal memproses foto.');
    }
  }

  function openForm() {
    form.classList.remove('hidden');
  }

  function closeForm() {
    form.classList.add('hidden');
  }

  function renderRows() {
    const session = getSession();
    const canManage = !!(session && session.role === 'Super Admin');
    const rows = readList(KTA_KEY);
    tbody.innerHTML = '';

    rows.forEach(function (item) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + (item.noId || '') + '</td>' +
        '<td>' + (item.tanggalLaporan || '') + '</td>' +
        '<td>' + (item.namaPelapor || '') + '</td>' +
        '<td>' + (item.kategoriTemuan || '') + '</td>' +
        '<td>' + (item.riskLevel || '') + '</td>' +
        '<td>' + toNameOnlyLabel(item.namaPjaLabel) + '</td>' +
        '<td>' + (item.status || (item.perbaikanLangsung === 'Ya' ? 'Open' : '-')) + '</td>' +
        '<td>' +
          (canManage
            ? '<button type="button" class="table-btn" data-action="edit" data-id="' + item.id + '">Ubah</button> ' +
              '<button type="button" class="table-btn danger" data-action="delete" data-id="' + item.id + '">Hapus</button>'
            : '-') +
        '</td>';
      tbody.appendChild(tr);
    });
  }

  function resetFormAfterSave() {
    editingId = '';
    fotoTemuanDraft = [];
    fotoPerbaikanDraft = [];
    tanggalTemuanInput.value = '';
    kategoriTemuanInput.value = '';
    lokasiTemuanInput.value = '';
    detailLokasiInput.value = '';
    riskLevelInput.value = '';
    namaPjaInput.value = '';
    detailTemuanInput.value = '';
    fotoTemuanInput.value = '';
    renderPhotoPreview(fotoTemuanPreview, fotoTemuanDraft, 'temuan');
    perbaikanLangsungInput.value = 'Tidak';
    tindakanPerbaikanInput.value = '';
    fotoPerbaikanInput.value = '';
    renderPhotoPreview(fotoPerbaikanPreview, fotoPerbaikanDraft, 'perbaikan');
    tanggalPerbaikanInput.value = '';
    statusInput.value = 'Open';

    tanggalLaporanInput.value = todayValue();
    noIdInput.value = buildNoId();
    populatePjaDropdown();
    togglePerbaikanSection();
  }

  function validate(payload) {
    if (!payload.tanggalTemuan) return 'Tanggal Temuan wajib diisi.';
    if (!payload.kategoriTemuan) return 'Kategori Temuan wajib diisi.';
    if (!payload.lokasiTemuan) return 'Lokasi Temuan wajib dipilih.';
    if (!payload.detailLokasiTemuan) return 'Detail Lokasi Temuan wajib diisi.';
    if (!payload.riskLevel) return 'Risk Level wajib dipilih.';
    if (!payload.namaPjaId) return 'Nama PJA wajib dipilih.';
    if (!payload.detailTemuan) return 'Detail Temuan wajib diisi.';

    if (payload.perbaikanLangsung === 'Ya') {
      if (!payload.tindakanPerbaikan) return 'Tindakan Perbaikan wajib diisi.';
      if (!payload.tanggalPerbaikan) return 'Tanggal Perbaikan wajib diisi.';
      if (!payload.status) return 'Status wajib dipilih.';
    }

    return '';
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const selectedPjaOption = namaPjaInput.options[namaPjaInput.selectedIndex];
    if (editingId) {
      const sessionCheck = getSession();
      if (!sessionCheck || sessionCheck.role !== 'Super Admin') {
        alert('Aksi ubah data KTA hanya dapat dilakukan oleh Super Admin.');
        return;
      }
    }

    const payloadId = editingId || ('kta-' + Date.now());
    const payload = {
      id: payloadId,
      noId: noIdInput.value,
      tanggalLaporan: tanggalLaporanInput.value,
      namaPelapor: namaPelaporInput.value,
      jabatan: jabatanInput.value,
      departemen: departemenInput.value,
      perusahaan: perusahaanInput.value,
      ccow: ccowInput.value,
      tanggalTemuan: tanggalTemuanInput.value,
      kategoriTemuan: String(kategoriTemuanInput.value || '').trim(),
      lokasiTemuan: String(lokasiTemuanInput.value || '').trim(),
      detailLokasiTemuan: String(detailLokasiInput.value || '').trim(),
      riskLevel: String(riskLevelInput.value || '').trim(),
      namaPjaId: String(namaPjaInput.value || '').trim(),
      namaPjaLabel: toNameOnlyLabel(selectedPjaOption ? selectedPjaOption.textContent : ''),
      detailTemuan: String(detailTemuanInput.value || '').trim(),
      fotoTemuan: fotoTemuanDraft,
      perbaikanLangsung: perbaikanLangsungInput.value,
      tindakanPerbaikan: String(tindakanPerbaikanInput.value || '').trim(),
      fotoPerbaikan: fotoPerbaikanDraft,
      tanggalPerbaikan: String(tanggalPerbaikanInput.value || '').trim(),
      status: String(statusInput.value || '').trim()
    };

    const message = validate(payload);
    if (message) {
      alert(message);
      return;
    }

    const rows = readList(KTA_KEY);
    const idx = rows.findIndex(function (item) { return item.id === payloadId; });
    if (idx >= 0) rows[idx] = payload;
    else rows.push(payload);
    writeList(KTA_KEY, rows);
    alert(editingId ? 'Data KTA berhasil diubah.' : 'Data KTA berhasil disimpan.');
    renderRows();
    resetFormAfterSave();
    closeForm();
  });

  tbody.addEventListener('click', function (event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const session = getSession();
    if (!session || session.role !== 'Super Admin') {
      alert('Aksi ubah/hapus data KTA hanya dapat dilakukan oleh Super Admin.');
      return;
    }

    const action = button.dataset.action;
    const id = button.dataset.id;
    const rows = readList(KTA_KEY);
    const target = rows.find(function (item) { return item.id === id; });
    if (!target) return;

    if (action === 'edit') {
      editingId = target.id;
      fotoTemuanDraft = Array.isArray(target.fotoTemuan) ? target.fotoTemuan.slice() : [];
      fotoPerbaikanDraft = Array.isArray(target.fotoPerbaikan) ? target.fotoPerbaikan.slice() : [];
      renderPhotoPreview(fotoTemuanPreview, fotoTemuanDraft, 'temuan');
      renderPhotoPreview(fotoPerbaikanPreview, fotoPerbaikanDraft, 'perbaikan');

      noIdInput.value = target.noId || '';
      tanggalLaporanInput.value = target.tanggalLaporan || todayValue();
      namaPelaporInput.value = target.namaPelapor || '';
      jabatanInput.value = target.jabatan || '';
      departemenInput.value = target.departemen || '';
      perusahaanInput.value = target.perusahaan || '';
      ccowInput.value = target.ccow || '';

      tanggalTemuanInput.value = target.tanggalTemuan || '';
      kategoriTemuanInput.value = target.kategoriTemuan || '';
      lokasiTemuanInput.value = target.lokasiTemuan || '';
      detailLokasiInput.value = target.detailLokasiTemuan || '';
      riskLevelInput.value = target.riskLevel || '';
      namaPjaInput.value = target.namaPjaId || '';
      detailTemuanInput.value = target.detailTemuan || '';
      fotoTemuanInput.value = '';

      perbaikanLangsungInput.value = target.perbaikanLangsung || 'Tidak';
      tindakanPerbaikanInput.value = target.tindakanPerbaikan || '';
      fotoPerbaikanInput.value = '';
      tanggalPerbaikanInput.value = target.tanggalPerbaikan || '';
      statusInput.value = target.status || 'Open';
      togglePerbaikanSection();
      openForm();
      return;
    }

    if (action === 'delete') {
      if (!confirm('Hapus data KTA ini?')) return;
      const nextRows = rows.filter(function (item) { return item.id !== id; });
      writeList(KTA_KEY, nextRows);
      renderRows();
      resetFormAfterSave();
      closeForm();
    }
  });

  fotoTemuanInput.addEventListener('change', function () {
    const files = Array.from(fotoTemuanInput.files || []);
    appendPhotos('temuan', files);
    fotoTemuanInput.value = '';
  });

  fotoPerbaikanInput.addEventListener('change', function () {
    const files = Array.from(fotoPerbaikanInput.files || []);
    appendPhotos('perbaikan', files);
    fotoPerbaikanInput.value = '';
  });

  form.addEventListener('click', function (event) {
    const removeBtn = event.target.closest('.photo-remove-btn[data-field][data-index]');
    if (!removeBtn) return;

    const field = removeBtn.dataset.field;
    const index = Number(removeBtn.dataset.index);
    if (Number.isNaN(index)) return;

    if (field === 'temuan') {
      fotoTemuanDraft = fotoTemuanDraft.filter(function (_item, idx) { return idx !== index; });
      renderPhotoPreview(fotoTemuanPreview, fotoTemuanDraft, 'temuan');
      return;
    }

    if (field === 'perbaikan') {
      fotoPerbaikanDraft = fotoPerbaikanDraft.filter(function (_item, idx) { return idx !== index; });
      renderPhotoPreview(fotoPerbaikanPreview, fotoPerbaikanDraft, 'perbaikan');
    }
  });

  perbaikanLangsungInput.addEventListener('change', togglePerbaikanSection);

  if (cancelButton) {
    cancelButton.addEventListener('click', function () {
      resetFormAfterSave();
      closeForm();
    });
  }

  if (addButton) {
    addButton.addEventListener('click', function () {
      resetFormAfterSave();
      openForm();
    });
  }

  const session = requireSession();
  if (!session) return;

  tanggalLaporanInput.value = todayValue();
  noIdInput.value = buildNoId();
  populateReporterProfile(session.username);
  populatePjaDropdown();
  togglePerbaikanSection();
  closeForm();
  renderRows();
})();
