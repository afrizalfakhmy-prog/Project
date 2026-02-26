(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const PJA_KEY = 'aios_pja';
  const TTA_KEY = 'aios_tta';

  const addButton = document.getElementById('add-tta-btn');
  const form = document.getElementById('tta-form');
  const tbody = document.getElementById('tta-tbody');

  const noIdInput = document.getElementById('tta-no-id');
  const tanggalLaporanInput = document.getElementById('tta-tanggal-laporan');
  const namaPelaporInput = document.getElementById('tta-nama-pelapor');
  const jabatanInput = document.getElementById('tta-jabatan');
  const departemenInput = document.getElementById('tta-departemen');
  const perusahaanInput = document.getElementById('tta-perusahaan');
  const ccowInput = document.getElementById('tta-ccow');

  const tanggalTemuanInput = document.getElementById('tta-tanggal-temuan');
  const jamTemuanInput = document.getElementById('tta-jam-temuan');
  const kategoriTemuanInput = document.getElementById('tta-kategori-temuan');
  const lokasiTemuanInput = document.getElementById('tta-lokasi-temuan');
  const detailLokasiInput = document.getElementById('tta-detail-lokasi');
  const riskLevelInput = document.getElementById('tta-risk-level');
  const namaPjaInput = document.getElementById('tta-nama-pja');

  const namaPelakuInput = document.getElementById('tta-nama-pelaku');
  const jabatanPelakuInput = document.getElementById('tta-jabatan-pelaku');
  const departemenPelakuInput = document.getElementById('tta-departemen-pelaku');
  const perusahaanPelakuInput = document.getElementById('tta-perusahaan-pelaku');

  const detailTemuanInput = document.getElementById('tta-detail-temuan');
  const fotoTemuanInput = document.getElementById('tta-foto-temuan');
  const fotoTemuanPreview = document.getElementById('tta-foto-temuan-preview');
  const perbaikanLangsungInput = document.getElementById('tta-perbaikan-langsung');

  const perbaikanSection = document.getElementById('tta-perbaikan-section');
  const tindakanPerbaikanInput = document.getElementById('tta-tindakan-perbaikan');
  const fotoPerbaikanInput = document.getElementById('tta-foto-perbaikan');
  const fotoPerbaikanPreview = document.getElementById('tta-foto-perbaikan-preview');
  const tanggalPerbaikanInput = document.getElementById('tta-tanggal-perbaikan');
  const statusInput = document.getElementById('tta-status');
  const cancelButton = document.getElementById('tta-cancel-btn');
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

  function findUserByUsername(username) {
    const users = readList(USER_KEY);
    return users.find(function (item) {
      return String(item.username || '').toLowerCase() === String(username || '').toLowerCase();
    }) || null;
  }

  function populateReporterProfile(username) {
    const user = findUserByUsername(username);

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

  function populatePelakuDropdown(selectedId) {
    const users = readList(USER_KEY);
    namaPelakuInput.innerHTML = '<option value="">(Pilih Nama Pelaku TTA)</option>';

    users.forEach(function (user) {
      const option = document.createElement('option');
      option.value = user.id || '';
      option.textContent = (user.username || '-') + ' - ' + (user.nama || '-');
      if (selectedId && selectedId === user.id) option.selected = true;
      namaPelakuInput.appendChild(option);
    });
  }

  function setPelakuProfile(userId) {
    const users = readList(USER_KEY);
    const user = users.find(function (item) {
      return String(item.id || '') === String(userId || '');
    });

    jabatanPelakuInput.value = user ? (user.jabatan || '') : '';
    departemenPelakuInput.value = user ? (user.departemen || '') : '';
    perusahaanPelakuInput.value = user ? (user.perusahaan || '') : '';
  }

  function buildNoId() {
    const rows = readList(TTA_KEY);
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    const prefix = 'TTA - ' + month + '/' + year + ' - ';

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
    const rows = readList(TTA_KEY);
    tbody.innerHTML = '';

    rows.forEach(function (item) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + (item.noId || '') + '</td>' +
        '<td>' + (item.tanggalLaporan || '') + '</td>' +
        '<td>' + (item.namaPelapor || '') + '</td>' +
        '<td>' + (item.namaPelakuLabel || '') + '</td>' +
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
    jamTemuanInput.value = '';
    kategoriTemuanInput.value = '';
    lokasiTemuanInput.value = '';
    detailLokasiInput.value = '';
    riskLevelInput.value = '';
    namaPjaInput.value = '';
    namaPelakuInput.value = '';
    jabatanPelakuInput.value = '';
    departemenPelakuInput.value = '';
    perusahaanPelakuInput.value = '';
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
    populatePelakuDropdown('');
    togglePerbaikanSection();
  }

  function validate(payload) {
    if (!payload.tanggalTemuan) return 'Tanggal Temuan wajib diisi.';
    if (!payload.jamTemuan) return 'Jam Temuan wajib diisi.';
    if (!payload.kategoriTemuan) return 'Kategori Temuan wajib diisi.';
    if (!payload.lokasiTemuan) return 'Lokasi Temuan wajib dipilih.';
    if (!payload.detailLokasiTemuan) return 'Detail Lokasi Temuan wajib diisi.';
    if (!payload.riskLevel) return 'Risk Level wajib dipilih.';
    if (!payload.namaPjaId) return 'Nama PJA wajib dipilih.';
    if (!payload.namaPelakuId) return 'Nama Pelaku TTA wajib dipilih.';
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
    const selectedPelakuOption = namaPelakuInput.options[namaPelakuInput.selectedIndex];
    if (editingId) {
      const sessionCheck = getSession();
      if (!sessionCheck || sessionCheck.role !== 'Super Admin') {
        alert('Aksi ubah data TTA hanya dapat dilakukan oleh Super Admin.');
        return;
      }
    }

    const payloadId = editingId || ('tta-' + Date.now());
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
      jamTemuan: jamTemuanInput.value,
      kategoriTemuan: String(kategoriTemuanInput.value || '').trim(),
      lokasiTemuan: String(lokasiTemuanInput.value || '').trim(),
      detailLokasiTemuan: String(detailLokasiInput.value || '').trim(),
      riskLevel: String(riskLevelInput.value || '').trim(),
      namaPjaId: String(namaPjaInput.value || '').trim(),
      namaPjaLabel: toNameOnlyLabel(selectedPjaOption ? selectedPjaOption.textContent : ''),
      namaPelakuId: String(namaPelakuInput.value || '').trim(),
      namaPelakuLabel: selectedPelakuOption ? selectedPelakuOption.textContent : '',
      jabatanPelaku: jabatanPelakuInput.value,
      departemenPelaku: departemenPelakuInput.value,
      perusahaanPelaku: perusahaanPelakuInput.value,
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

    const rows = readList(TTA_KEY);
    const idx = rows.findIndex(function (item) { return item.id === payloadId; });
    if (idx >= 0) rows[idx] = payload;
    else rows.push(payload);
    writeList(TTA_KEY, rows);
    alert(editingId ? 'Data TTA berhasil diubah.' : 'Data TTA berhasil disimpan.');
    renderRows();
    resetFormAfterSave();
    closeForm();
  });

  tbody.addEventListener('click', function (event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const session = getSession();
    if (!session || session.role !== 'Super Admin') {
      alert('Aksi ubah/hapus data TTA hanya dapat dilakukan oleh Super Admin.');
      return;
    }

    const action = button.dataset.action;
    const id = button.dataset.id;
    const rows = readList(TTA_KEY);
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
      jamTemuanInput.value = target.jamTemuan || '';
      kategoriTemuanInput.value = target.kategoriTemuan || '';
      lokasiTemuanInput.value = target.lokasiTemuan || '';
      detailLokasiInput.value = target.detailLokasiTemuan || '';
      riskLevelInput.value = target.riskLevel || '';
      namaPjaInput.value = target.namaPjaId || '';
      namaPelakuInput.value = target.namaPelakuId || '';
      setPelakuProfile(namaPelakuInput.value);
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
      if (!confirm('Hapus data TTA ini?')) return;
      const nextRows = rows.filter(function (item) { return item.id !== id; });
      writeList(TTA_KEY, nextRows);
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

  namaPelakuInput.addEventListener('change', function () {
    setPelakuProfile(namaPelakuInput.value);
  });

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
  populatePelakuDropdown('');
  togglePerbaikanSection();
  closeForm();
  renderRows();
})();
