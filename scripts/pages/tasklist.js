(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const KTA_KEY = 'aios_kta';
  const TTA_KEY = 'aios_tta';
  const JSA_KEY = 'aios_jsa';

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
  const detailContent = document.getElementById('task-detail-content');
  const detailFotoTemuan = document.getElementById('task-detail-foto-temuan');
  const tanggalPerbaikanInput = document.getElementById('task-tanggal-perbaikan');
  const statusInput = document.getElementById('task-status');
  let fotoPerbaikanDraft = [];

  const DETAIL_LABELS = {
    KTA: {
      noId: 'No ID',
      tanggalLaporan: 'Tanggal Laporan',
      namaPelapor: 'Nama Pelapor',
      jabatanPelapor: 'Jabatan Pelapor',
      departemenPelapor: 'Departemen Pelapor',
      perusahaan: 'Perusahaan Pelaporan',
      ccow: 'CCOW',
      tanggalTemuan: 'Tanggal Temuan',
      kategoriTemuan: 'Kategori Temuan',
      lokasiTemuan: 'Lokasi Temuan',
      detailLokasiTemuan: 'Detail Lokasi Temuan',
      riskLevel: 'Risk Level',
      namaPjaLabel: 'Nama PJA',
      detailTemuan: 'Detail Temuan',
      perbaikanLangsung: 'Perbaikan Langsung',
      status: 'Status'
    },
    TTA: {
      noId: 'No ID',
      tanggalLaporan: 'Tanggal Laporan',
      namaPelapor: 'Nama Pelapor',
      jabatanPelapor: 'Jabatan Pelapor',
      departemenPelapor: 'Departemen Pelapor',
      perusahaan: 'Perusahaan Pelaporan',
      ccow: 'CCOW',
      tanggalTemuan: 'Tanggal Temuan',
      jamTemuan: 'Jam Temuan',
      kategoriTemuan: 'Kategori Temuan',
      lokasiTemuan: 'Lokasi Temuan',
      detailLokasiTemuan: 'Detail Lokasi Temuan',
      riskLevel: 'Risk Level',
      namaPjaLabel: 'Nama PJA',
      namaPelakuLabel: 'Nama Pelaku TTA',
      jabatanPelaku: 'Jabatan Pelaku TTA',
      departemenPelaku: 'Departemen Pelaku TTA',
      perusahaanPelaku: 'Perusahaan Pelaku TTA',
      detailTemuan: 'Detail Temuan',
      perbaikanLangsung: 'Perbaikan Langsung',
      status: 'Status'
    }
  };

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

  function getRoleFlags() {
    const session = getSession();
    const role = String((session && session.role) || '').trim();
    return {
      role: role,
      isSuperAdmin: role === 'Super Admin',
      isAdmin: role === 'Admin'
    };
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

  function isJsaValidationCompleted(stage, row) {
    const target = row || {};
    const isHse = stage === 'hse';
    const status = String(isHse ? target.validasiHse : target.validasiPenyelia || '').trim();
    const date = String(isHse ? target.tanggalHse : target.tanggalPenyelia || '').trim();
    const sign = String(isHse ? target.ttdHse : target.ttdPenyelia || '').trim();
    const note = String(isHse ? target.catatanHse : target.catatanPenyelia || '').trim();
    if (status === 'Approved') return !!(date && sign);
    if (status === 'Not Approved') return !!note;
    return false;
  }

  function isJsaCreator(target, currentUser) {
    const row = target || {};
    const user = currentUser || {};
    const creatorUsername = String(row.disiapkanUsername || '').trim().toLowerCase();
    const currentUsername = String(user.username || '').trim().toLowerCase();
    if (creatorUsername && currentUsername && creatorUsername === currentUsername) return true;

    const creatorName = String(row.disiapkanOleh || '').trim().toLowerCase();
    const currentName = String(user.nama || user.username || '').trim().toLowerCase();
    return !!creatorName && !!currentName && creatorName === currentName;
  }

  function buildJsaNotifications(rows, currentUser, roleFlags) {
    const list = Array.isArray(rows) ? rows : [];
    const isPrivilegedViewer = roleFlags.isSuperAdmin || roleFlags.isAdmin;

    return list.reduce(function (acc, row) {
      const target = row || {};
      const hseStatus = String(target.validasiHse || '').trim();
      const penyeliaStatus = String(target.validasiPenyelia || '').trim();
      const hseApproved = hseStatus === 'Approved' && isJsaValidationCompleted('hse', target);
      const hseRejected = hseStatus === 'Not Approved' && isJsaValidationCompleted('hse', target);
      const penyeliaApproved = penyeliaStatus === 'Approved' && isJsaValidationCompleted('penyelia', target);
      const penyeliaRejected = penyeliaStatus === 'Not Approved' && isJsaValidationCompleted('penyelia', target);

      const hseAssigneeId = String(target.diperiksaId || '').trim();
      const penyeliaAssigneeId = String(target.disetujuiId || '').trim();
      const isCreator = isJsaCreator(target, currentUser);

      const canViewHse = isPrivilegedViewer || (hseAssigneeId && hseAssigneeId === String(currentUser.id || '').trim());
      const canViewPenyelia = isPrivilegedViewer || (penyeliaAssigneeId && penyeliaAssigneeId === String(currentUser.id || '').trim());
      const canViewCreator = isPrivilegedViewer || isCreator;

      if (hseRejected && canViewCreator) {
        acc.push({
          sourceType: 'JSA',
          mode: 'rework',
          stage: 'hse',
          id: target.id,
          noId: target.noJsa || '-',
          tanggalLaporan: target.tanggal || '-',
          namaPelapor: target.disiapkanOleh || '-',
          perusahaan: target.perusahaan || '-',
          status: 'Revisi JSA (Not Approved HSE)',
          canEdit: isCreator,
          actionLabel: 'Revisi JSA'
        });
      }

      if (penyeliaRejected && canViewCreator) {
        acc.push({
          sourceType: 'JSA',
          mode: 'rework',
          stage: 'penyelia',
          id: target.id,
          noId: target.noJsa || '-',
          tanggalLaporan: target.tanggal || '-',
          namaPelapor: target.disiapkanOleh || '-',
          perusahaan: target.perusahaan || '-',
          status: 'Revisi JSA (Not Approved Penyelia)',
          canEdit: isCreator,
          actionLabel: 'Revisi JSA'
        });
      }

      if (!hseApproved && !hseRejected && canViewHse && hseAssigneeId) {
        acc.push({
          sourceType: 'JSA',
          mode: 'validate',
          stage: 'hse',
          id: target.id,
          noId: target.noJsa || '-',
          tanggalLaporan: target.tanggal || '-',
          namaPelapor: target.disiapkanOleh || '-',
          perusahaan: target.perusahaan || '-',
          status: 'Menunggu Validasi HSE',
          assigneeId: hseAssigneeId,
          canEdit: hseAssigneeId === String(currentUser.id || '').trim(),
          actionLabel: 'Isi Validasi'
        });
      }

      if (!penyeliaApproved && !penyeliaRejected && hseApproved && canViewPenyelia && penyeliaAssigneeId) {
        acc.push({
          sourceType: 'JSA',
          mode: 'validate',
          stage: 'penyelia',
          id: target.id,
          noId: target.noJsa || '-',
          tanggalLaporan: target.tanggal || '-',
          namaPelapor: target.disiapkanOleh || '-',
          perusahaan: target.perusahaan || '-',
          status: 'Menunggu Validasi Penyelia',
          assigneeId: penyeliaAssigneeId,
          canEdit: penyeliaAssigneeId === String(currentUser.id || '').trim(),
          actionLabel: 'Isi Validasi'
        });
      }

      return acc;
    }, []);
  }

  function getThumbnailUrl(fotos) {
    if (!Array.isArray(fotos) || fotos.length === 0) return '';
    const first = fotos[0];
    if (typeof first === 'string') return '';
    return first && first.dataUrl ? first.dataUrl : '';
  }

  function getDetailFields(sourceType) {
    const labels = DETAIL_LABELS[sourceType] || {};
    return Object.keys(labels).map(function (key) {
      return { key: key, label: labels[key] };
    });
  }

  function toDisplayValue(value) {
    if (value === null || value === undefined) return '-';
    const text = String(value).trim();
    return text ? text : '-';
  }

  function renderDetailView(record, sourceType) {
    if (!detailContent || !detailFotoTemuan) return;

    const fields = getDetailFields(sourceType);
    detailContent.innerHTML = '';

    fields.forEach(function (field) {
      const row = document.createElement('div');
      row.className = 'task-detail-row';

      const label = document.createElement('span');
      label.className = 'task-detail-label';
      label.textContent = field.label;

      const value = document.createElement('span');
      value.className = 'task-detail-value';
      value.textContent = toDisplayValue(record[field.key]);

      row.appendChild(label);
      row.appendChild(value);
      detailContent.appendChild(row);
    });

    detailFotoTemuan.innerHTML = '';
    const fotoTemuan = Array.isArray(record.fotoTemuan) ? record.fotoTemuan : [];
    fotoTemuan.forEach(function (item) {
      if (!item || !item.dataUrl) return;
      const img = document.createElement('img');
      img.src = item.dataUrl;
      img.alt = item.name || 'Foto Temuan';
      img.className = 'ohs-photo-thumb';
      detailFotoTemuan.appendChild(img);
    });
  }

  function showEditPanel(record) {
    recordTypeInput.value = record.sourceType;
    recordIdInput.value = record.id;
    tindakanInput.value = record.tindakanPerbaikan || '';
    tanggalPerbaikanInput.value = record.tanggalPerbaikan || '';
    statusInput.value = record.status && record.status !== '-' ? record.status : 'Open';
    fotoPerbaikanInput.value = '';
    fotoPerbaikanDraft = Array.isArray(record.fotoPerbaikan) ? record.fotoPerbaikan.slice() : [];
    renderDetailView(record, record.sourceType);
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
    if (detailContent) detailContent.innerHTML = '';
    if (detailFotoTemuan) detailFotoTemuan.innerHTML = '';
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

  function buildCardElement(row, roleFlags, currentUser) {
    const isJsaRow = row.sourceType === 'JSA';
    const canEdit = isJsaRow
      ? !!row.canEdit
      : (roleFlags.isSuperAdmin || (row.namaPjaId === currentUser.id && isOpenOrProgress(row.status)));
    const canDelete = isJsaRow ? false : roleFlags.isSuperAdmin;
    const thumb = isJsaRow ? '' : getThumbnailUrl(row.fotoTemuan);
    const badgeLabel = isJsaRow
      ? (row.mode === 'rework'
        ? (row.stage === 'penyelia' ? 'REVISI PENYELIA' : 'REVISI HSE')
        : (row.stage === 'penyelia' ? 'VALIDASI PENYELIA' : 'VALIDASI HSE'))
      : '';
    const badgeClass = isJsaRow
      ? (row.mode === 'rework'
        ? 'task-badge task-badge-rework'
        : 'task-badge task-badge-validate')
      : '';

    const card = document.createElement('article');
    card.className = 'task-card';
    card.dataset.sourceType = row.sourceType;
    card.dataset.recordId = row.id;
    card.dataset.canEdit = canEdit ? 'yes' : 'no';
    card.dataset.canDelete = canDelete ? 'yes' : 'no';
    if (isJsaRow) {
      card.dataset.stage = String(row.stage || '');
      card.dataset.mode = String(row.mode || 'validate');
    }

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
        (isJsaRow ? '<p><span class="' + badgeClass + '">' + badgeLabel + '</span></p>' : '') +
        '<p><strong>Status:</strong> ' + row.status + '</p>' +
        '<p class="task-source">Sumber: ' + row.sourceType + '</p>' +
        (isJsaRow
          ? (canEdit
            ? '<p class="task-edit-hint">Klik card atau tombol untuk lanjutkan proses JSA.</p>'
            : '<p class="task-edit-hint">Notifikasi untuk user terpilih.</p>')
          : (canEdit ? '<p class="task-edit-hint">Klik card untuk edit tindak lanjut.</p>' : '')) +
        ((canEdit || canDelete)
          ? '<div class="form-inline-actions">' +
            (canEdit ? '<button type="button" class="table-btn" data-action="' + (isJsaRow ? 'open-jsa' : 'edit') + '">' + (isJsaRow ? (row.actionLabel || 'Isi Validasi') : 'Ubah') + '</button>' : '') +
            (canDelete ? '<button type="button" class="table-btn danger" data-action="delete">Hapus</button>' : '') +
            '</div>'
          : '') +
      '</div>';

    return card;
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
    const jsaRows = readList(JSA_KEY);
    const allRows = ktaRows.concat(ttaRows);
    const roleFlags = getRoleFlags();
    const isPrivilegedViewer = roleFlags.isSuperAdmin || roleFlags.isAdmin;

    const baseNotifications = isPrivilegedViewer ? allRows : allRows.filter(function (row) {
      const reporterMatch = String(row.namaPelapor || '').toLowerCase() === String(currentUser.nama || '').toLowerCase();
      const pjaMatch = row.namaPjaId && row.namaPjaId === currentUser.id && isOpenOrProgress(row.status);
      return reporterMatch || pjaMatch;
    });
    const jsaNotifications = buildJsaNotifications(jsaRows, currentUser, roleFlags);
    const notifications = baseNotifications.concat(jsaNotifications);
    const groupedNotifications = {
      KTA: [],
      TTA: [],
      JSA: []
    };
    notifications.forEach(function (item) {
      const key = String(item.sourceType || '').toUpperCase();
      if (!groupedNotifications[key]) return;
      groupedNotifications[key].push(item);
    });

    cardsContainer.innerHTML = '';
    if (notifications.length === 0) {
      emptyText.classList.remove('hidden');
      hideEditPanel();
      return;
    }

    emptyText.classList.add('hidden');

    [
      { type: 'KTA', title: 'Notifikasi KTA' },
      { type: 'TTA', title: 'Notifikasi TTA' },
      { type: 'JSA', title: 'Notifikasi JSA' }
    ].forEach(function (sectionMeta) {
      const section = document.createElement('section');
      section.className = 'tasklist-section';

      const title = document.createElement('h3');
      title.className = 'tasklist-section-title';
      title.textContent = sectionMeta.title;
      section.appendChild(title);

      const rows = groupedNotifications[sectionMeta.type] || [];
      if (rows.length === 0) {
        const sectionEmpty = document.createElement('p');
        sectionEmpty.className = 'tasklist-section-empty subtitle';
        sectionEmpty.textContent = 'Belum ada notifikasi ' + sectionMeta.type + '.';
        section.appendChild(sectionEmpty);
      } else {
        const groupGrid = document.createElement('div');
        groupGrid.className = 'tasklist-grid tasklist-grid-group';
        rows.forEach(function (row) {
          groupGrid.appendChild(buildCardElement(row, roleFlags, currentUser));
        });
        section.appendChild(groupGrid);
      }

      cardsContainer.appendChild(section);
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

    const actionButton = event.target.closest('button[data-action]');
    if (actionButton) {
      const action = actionButton.dataset.action;
      const sourceType = card.dataset.sourceType;
      const recordId = card.dataset.recordId;

      if (sourceType === 'JSA') {
        if (action === 'open-jsa') {
          if (card.dataset.canEdit !== 'yes') {
            alert('Notifikasi ini hanya dapat diisi oleh user yang ditunjuk pada form JSA.');
            return;
          }
          const stage = String(card.dataset.stage || '').trim();
          const mode = String(card.dataset.mode || 'validate').trim();
          window.location.href = 'jsa.html?mode=' + encodeURIComponent(mode) + '&id=' + encodeURIComponent(recordId) + '&stage=' + encodeURIComponent(stage);
          return;
        }
        return;
      }

      const key = sourceType === 'KTA' ? KTA_KEY : TTA_KEY;
      const rows = readList(key);
      const record = rows.find(function (row) { return row.id === recordId; });
      if (!record) return;

      if (action === 'delete') {
        if (card.dataset.canDelete !== 'yes') {
          alert('Hanya Super Admin yang dapat menghapus data pada Tasklist.');
          return;
        }
        if (!confirm('Hapus notifikasi tasklist ini?')) return;
        const nextRows = rows.filter(function (row) { return row.id !== recordId; });
        writeList(key, nextRows);

        if (recordTypeInput.value === sourceType && recordIdInput.value === recordId) {
          hideEditPanel();
        }
        renderCards();
        return;
      }

      if (action === 'edit') {
        if (card.dataset.canEdit !== 'yes') {
          alert('Anda tidak memiliki akses edit untuk item ini.');
          return;
        }

        showEditPanel({
          sourceType: sourceType,
          id: record.id,
          noId: record.noId || '-',
          tanggalLaporan: record.tanggalLaporan || '-',
          namaPelapor: record.namaPelapor || '-',
          jabatanPelapor: record.jabatanPelapor || '-',
          departemenPelapor: record.departemenPelapor || '-',
          perusahaan: record.perusahaan || '-',
          ccow: record.ccow || '-',
          tanggalTemuan: record.tanggalTemuan || '-',
          jamTemuan: record.jamTemuan || '-',
          kategoriTemuan: record.kategoriTemuan || '-',
          lokasiTemuan: record.lokasiTemuan || '-',
          detailLokasiTemuan: record.detailLokasiTemuan || '-',
          riskLevel: record.riskLevel || '-',
          namaPjaLabel: record.namaPjaLabel || '-',
          namaPelakuLabel: record.namaPelakuLabel || '-',
          jabatanPelaku: record.jabatanPelaku || '-',
          departemenPelaku: record.departemenPelaku || '-',
          perusahaanPelaku: record.perusahaanPelaku || '-',
          detailTemuan: record.detailTemuan || '-',
          perbaikanLangsung: record.perbaikanLangsung || '-',
          tindakanPerbaikan: record.tindakanPerbaikan || '',
          tanggalPerbaikan: record.tanggalPerbaikan || '',
          status: record.status || 'Open',
          fotoTemuan: Array.isArray(record.fotoTemuan) ? record.fotoTemuan : [],
          fotoPerbaikan: Array.isArray(record.fotoPerbaikan) ? record.fotoPerbaikan : []
        });
        return;
      }
    }

    if (card.dataset.canEdit !== 'yes') return;

    const sourceType = card.dataset.sourceType;
    const recordId = card.dataset.recordId;

    if (sourceType === 'JSA') {
      const stage = String(card.dataset.stage || '').trim();
      const mode = String(card.dataset.mode || 'validate').trim();
      window.location.href = 'jsa.html?mode=' + encodeURIComponent(mode) + '&id=' + encodeURIComponent(recordId) + '&stage=' + encodeURIComponent(stage);
      return;
    }

    const key = sourceType === 'KTA' ? KTA_KEY : TTA_KEY;
    const rows = readList(key);
    const record = rows.find(function (row) { return row.id === recordId; });
    if (!record) return;

    showEditPanel({
      sourceType: sourceType,
      id: record.id,
      noId: record.noId || '-',
      tanggalLaporan: record.tanggalLaporan || '-',
      namaPelapor: record.namaPelapor || '-',
      jabatanPelapor: record.jabatanPelapor || '-',
      departemenPelapor: record.departemenPelapor || '-',
      perusahaan: record.perusahaan || '-',
      ccow: record.ccow || '-',
      tanggalTemuan: record.tanggalTemuan || '-',
      jamTemuan: record.jamTemuan || '-',
      kategoriTemuan: record.kategoriTemuan || '-',
      lokasiTemuan: record.lokasiTemuan || '-',
      detailLokasiTemuan: record.detailLokasiTemuan || '-',
      riskLevel: record.riskLevel || '-',
      namaPjaLabel: record.namaPjaLabel || '-',
      namaPelakuLabel: record.namaPelakuLabel || '-',
      jabatanPelaku: record.jabatanPelaku || '-',
      departemenPelaku: record.departemenPelaku || '-',
      perusahaanPelaku: record.perusahaanPelaku || '-',
      detailTemuan: record.detailTemuan || '-',
      perbaikanLangsung: record.perbaikanLangsung || '-',
      tindakanPerbaikan: record.tindakanPerbaikan || '',
      tanggalPerbaikan: record.tanggalPerbaikan || '',
      status: record.status || 'Open',
      fotoTemuan: Array.isArray(record.fotoTemuan) ? record.fotoTemuan : [],
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
    const roleFlags = getRoleFlags();

    const record = rows[idx];
    const allowed = roleFlags.isSuperAdmin || (record.namaPjaId === currentUser.id && isOpenOrProgress(record.status || ''));
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
