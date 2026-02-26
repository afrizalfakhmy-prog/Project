(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const KTA_KEY = 'aios_kta';
  const TTA_KEY = 'aios_tta';

  const cardsContainer = document.getElementById('tasklist-cards');
  const emptyText = document.getElementById('tasklist-empty');
  const editPanel = document.getElementById('tasklist-edit-panel');
  const editForm = document.getElementById('tasklist-edit-form');
  const cancelButton = document.getElementById('task-cancel-btn');

  const recordTypeInput = document.getElementById('task-record-type');
  const recordIdInput = document.getElementById('task-record-id');
  const tindakanInput = document.getElementById('task-tindakan');
  const fotoPerbaikanInput = document.getElementById('task-foto-perbaikan');
  const fotoPreview = document.getElementById('task-foto-preview');
  const tanggalPerbaikanInput = document.getElementById('task-tanggal-perbaikan');
  const statusInput = document.getElementById('task-status');
  let fotoPerbaikanDraft = [];

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

  function getCurrentUser() {
    const session = getSession();
    if (!session || !session.username) return null;

    const users = readList(USER_KEY);
    return users.find(function (user) {
      return String(user.username || '').toLowerCase() === String(session.username || '').toLowerCase();
    }) || null;
  }

  function isOpenOrProgress(status) {
    return status === 'Open' || status === 'Progress';
  }

  function mapRecords(type, rows) {
    return rows.map(function (row) {
      return {
        sourceType: type,
        id: row.id,
        noId: row.noId || '-',
        tanggalLaporan: row.tanggalLaporan || '-',
        namaPelapor: row.namaPelapor || '-',
        perusahaan: row.perusahaan || '-',
        fotoTemuan: Array.isArray(row.fotoTemuan) ? row.fotoTemuan : [],
        status: row.status || '-',
        namaPjaId: row.namaPjaId || '',
        tindakanPerbaikan: row.tindakanPerbaikan || '',
        fotoPerbaikan: Array.isArray(row.fotoPerbaikan) ? row.fotoPerbaikan : [],
        tanggalPerbaikan: row.tanggalPerbaikan || ''
      };
    });
  }

  function getThumbnailUrl(fotos) {
    if (!Array.isArray(fotos) || fotos.length === 0) return '';
    const first = fotos[0];
    if (typeof first === 'string') return '';
    return first && first.dataUrl ? first.dataUrl : '';
  }

  function showEditPanel(record) {
    recordTypeInput.value = record.sourceType;
    recordIdInput.value = record.id;
    tindakanInput.value = record.tindakanPerbaikan || '';
    tanggalPerbaikanInput.value = record.tanggalPerbaikan || '';
    statusInput.value = record.status && record.status !== '-' ? record.status : 'Open';
    fotoPerbaikanInput.value = '';
    fotoPerbaikanDraft = Array.isArray(record.fotoPerbaikan) ? record.fotoPerbaikan.slice() : [];
    renderPhotoPreview();
    editPanel.classList.remove('hidden');
    editPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function hideEditPanel() {
    editPanel.classList.add('hidden');
    recordTypeInput.value = '';
    recordIdInput.value = '';
    tindakanInput.value = '';
    tanggalPerbaikanInput.value = '';
    statusInput.value = 'Open';
    fotoPerbaikanInput.value = '';
    fotoPerbaikanDraft = [];
    renderPhotoPreview();
  }

  function renderPhotoPreview() {
    fotoPreview.innerHTML = '';
    fotoPerbaikanDraft.forEach(function (item, index) {
      if (!item || !item.dataUrl) return;
      const wrap = document.createElement('div');
      wrap.className = 'photo-thumb-item';
      wrap.innerHTML =
        '<img src="' + item.dataUrl + '" alt="' + (item.name || 'Foto Perbaikan') + '" class="ohs-photo-thumb" />' +
        '<button type="button" class="photo-remove-btn" data-index="' + index + '">✕</button>';
      fotoPreview.appendChild(wrap);
    });
  }

  function renderCards() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert('Silakan login terlebih dahulu.');
      window.location.href = '../index.html';
      return;
    }

    const ktaRows = mapRecords('KTA', readList(KTA_KEY));
    const ttaRows = mapRecords('TTA', readList(TTA_KEY));
    const allRows = ktaRows.concat(ttaRows);

    const notifications = allRows.filter(function (row) {
      const reporterMatch = String(row.namaPelapor || '').toLowerCase() === String(currentUser.nama || '').toLowerCase();
      const pjaMatch = row.namaPjaId && row.namaPjaId === currentUser.id && isOpenOrProgress(row.status);
      return reporterMatch || pjaMatch;
    });

    cardsContainer.innerHTML = '';
    if (notifications.length === 0) {
      emptyText.classList.remove('hidden');
      hideEditPanel();
      return;
    }

    emptyText.classList.add('hidden');

    notifications.forEach(function (row) {
      const canEdit = row.namaPjaId === currentUser.id && isOpenOrProgress(row.status);
      const thumb = getThumbnailUrl(row.fotoTemuan);

      const card = document.createElement('article');
      card.className = 'task-card';
      card.dataset.sourceType = row.sourceType;
      card.dataset.recordId = row.id;
      card.dataset.canEdit = canEdit ? 'yes' : 'no';

      card.innerHTML = '<div class="task-thumb-wrap">' +
        (thumb
          ? '<img class="task-thumb" src="' + thumb + '" alt="Thumbnail Temuan" />'
          : '<div class="task-thumb task-thumb-empty">Tidak ada thumbnail</div>') +
        '</div>' +
        '<div class="task-body">' +
          '<p><strong>No ID:</strong> ' + row.noId + '</p>' +
          '<p><strong>Tanggal Laporan:</strong> ' + row.tanggalLaporan + '</p>' +
          '<p><strong>Nama Pelapor:</strong> ' + row.namaPelapor + '</p>' +
          '<p><strong>Perusahaan Pelaporan:</strong> ' + row.perusahaan + '</p>' +
          '<p><strong>Status:</strong> ' + row.status + '</p>' +
          '<p class="task-source">Sumber: ' + row.sourceType + '</p>' +
          (canEdit ? '<p class="task-edit-hint">Klik card untuk edit tindak lanjut.</p>' : '') +
        '</div>';

      cardsContainer.appendChild(card);
    });
  }

  function readFilesAsPayloadFromFiles(files) {
    return Promise.all(files.map(function (file) {
      return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () {
          resolve({ name: file.name, dataUrl: reader.result });
        };
        reader.onerror = function () {
          reject(new Error('Gagal membaca file gambar perbaikan.'));
        };
        reader.readAsDataURL(file);
      });
    }));
  }

  fotoPerbaikanInput.addEventListener('change', async function () {
    const files = Array.from(fotoPerbaikanInput.files || []);
    if (!files.length) return;

    try {
      const payload = await readFilesAsPayloadFromFiles(files);
      fotoPerbaikanDraft = fotoPerbaikanDraft.concat(payload);
      renderPhotoPreview();
    } catch (error) {
      alert(error.message || 'Gagal membaca file gambar perbaikan.');
    }

    fotoPerbaikanInput.value = '';
  });

  editForm.addEventListener('click', function (event) {
    const removeBtn = event.target.closest('.photo-remove-btn[data-index]');
    if (!removeBtn) return;
    const index = Number(removeBtn.dataset.index);
    if (Number.isNaN(index)) return;
    fotoPerbaikanDraft = fotoPerbaikanDraft.filter(function (_item, idx) { return idx !== index; });
    renderPhotoPreview();
  });

  cardsContainer.addEventListener('click', function (event) {
    const card = event.target.closest('.task-card');
    if (!card) return;

    if (card.dataset.canEdit !== 'yes') return;

    const sourceType = card.dataset.sourceType;
    const recordId = card.dataset.recordId;
    const key = sourceType === 'KTA' ? KTA_KEY : TTA_KEY;
    const rows = readList(key);
    const record = rows.find(function (row) { return row.id === recordId; });
    if (!record) return;

    showEditPanel({
      sourceType: sourceType,
      id: record.id,
      tindakanPerbaikan: record.tindakanPerbaikan || '',
      tanggalPerbaikan: record.tanggalPerbaikan || '',
      status: record.status || 'Open',
      fotoPerbaikan: Array.isArray(record.fotoPerbaikan) ? record.fotoPerbaikan : []
    });
  });

  editForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const sourceType = recordTypeInput.value;
    const recordId = recordIdInput.value;
    const key = sourceType === 'KTA' ? KTA_KEY : TTA_KEY;

    if (!sourceType || !recordId) return;

    const rows = readList(key);
    const idx = rows.findIndex(function (row) { return row.id === recordId; });
    if (idx < 0) {
      alert('Data tidak ditemukan.');
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const record = rows[idx];
    const allowed = record.namaPjaId === currentUser.id && isOpenOrProgress(record.status || '');
    if (!allowed) {
      alert('Anda tidak memiliki akses edit untuk item ini.');
      return;
    }

    const tindakan = String(tindakanInput.value || '').trim();
    const tanggalPerbaikan = String(tanggalPerbaikanInput.value || '').trim();
    const status = String(statusInput.value || '').trim();

    if (!tindakan) {
      alert('Tindakan Perbaikan wajib diisi.');
      return;
    }
    if (!tanggalPerbaikan) {
      alert('Tanggal Perbaikan wajib diisi.');
      return;
    }
    if (!status) {
      alert('Status wajib dipilih.');
      return;
    }

    rows[idx] = Object.assign({}, record, {
      tindakanPerbaikan: tindakan,
      tanggalPerbaikan: tanggalPerbaikan,
      status: status,
      fotoPerbaikan: fotoPerbaikanDraft
    });

    writeList(key, rows);
    hideEditPanel();
    renderCards();
    alert('Update tindak lanjut berhasil disimpan.');
  });

  if (cancelButton) {
    cancelButton.addEventListener('click', function () {
      hideEditPanel();
    });
  }

  renderCards();
})();
