(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const PJA_KEY = 'aios_pja';
  const INS_KEY = 'aios_inspeksi';

  const menuButtons = Array.from(document.querySelectorAll('.inspeksi-menu-btn'));
  const addButton = document.getElementById('inspeksi-add-btn');
  const form = document.getElementById('inspeksi-form');
  const cancelButton = document.getElementById('inspeksi-cancel-btn');
  const fixedJenis = String((document.body && document.body.dataset && document.body.dataset.inspeksiJenis) || '').trim();

  const jenisInput = document.getElementById('inspeksi-jenis');
  const noIdInput = document.getElementById('inspeksi-no-id');
  const tanggalLaporanInput = document.getElementById('inspeksi-tanggal-laporan');
  const tanggalInspeksiInput = document.getElementById('inspeksi-tanggal');
  const areaInput = document.getElementById('inspeksi-area');
  const detailAreaInput = document.getElementById('inspeksi-detail-area');

  const namaInspektorInput = document.getElementById('inspeksi-nama-inspektor');
  const jabatanInspektorInput = document.getElementById('inspeksi-jabatan-inspektor');
  const departemenInspektorInput = document.getElementById('inspeksi-departemen-inspektor');
  const perusahaanInspektorInput = document.getElementById('inspeksi-perusahaan-inspektor');
  const ccowInput = document.getElementById('inspeksi-ccow');

  const pengawasInput = document.getElementById('inspeksi-pengawas');
  const pjaInput = document.getElementById('inspeksi-pja');
  const tbody = document.getElementById('inspeksi-tbody');

  let selectedJenis = fixedJenis;
  let editingId = '';
  let pengawasDropdownRoot = null;
  let pengawasDropdownToggle = null;
  let pengawasDropdownPanel = null;
  let pengawasDropdownDocBound = false;

  function normalizePengawasField() {
    if (!pengawasInput) return;
    pengawasInput.multiple = true;
    pengawasInput.setAttribute('multiple', 'multiple');

    const label = document.querySelector('label[for="inspeksi-pengawas"]');
    if (label) {
      label.textContent = 'Tim Inspeksi';
    }

    ensurePengawasCheckboxDropdown();
  }

  function closePengawasDropdown() {
    if (!pengawasDropdownRoot || !pengawasDropdownToggle) return;
    pengawasDropdownRoot.classList.remove('open');
    pengawasDropdownToggle.setAttribute('aria-expanded', 'false');
  }

  function updatePengawasDropdownLabel() {
    if (!pengawasDropdownToggle) return;
    const selected = getSelectedPengawas();
    if (selected.length === 0) {
      pengawasDropdownToggle.textContent = '(Pilih Tim Inspeksi)';
      pengawasDropdownToggle.title = '(Pilih Tim Inspeksi)';
      return;
    }

    const labels = selected.map(function (item) { return item.label; });
    const labelText = labels.join(', ');
    pengawasDropdownToggle.textContent = labelText;
    pengawasDropdownToggle.title = labelText;
  }

  function renderPengawasCheckboxDropdownOptions() {
    if (!pengawasDropdownPanel || !pengawasInput) return;
    pengawasDropdownPanel.innerHTML = '';

    Array.from(pengawasInput.options || []).forEach(function (option) {
      const optionValue = String(option.value || '').trim();
      if (!optionValue) return;

      const item = document.createElement('label');
      item.className = 'inspeksi-checkbox-option';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = optionValue;
      checkbox.checked = !!option.selected;
      checkbox.addEventListener('change', function () {
        option.selected = checkbox.checked;
        updatePengawasDropdownLabel();
      });

      const text = document.createElement('span');
      text.textContent = String(option.textContent || '').trim();

      item.appendChild(checkbox);
      item.appendChild(text);
      pengawasDropdownPanel.appendChild(item);
    });

    updatePengawasDropdownLabel();
  }

  function syncPengawasSelectionToDropdown() {
    if (!pengawasDropdownPanel || !pengawasInput) return;
    const selectedMap = {};
    Array.from(pengawasInput.options || []).forEach(function (option) {
      selectedMap[String(option.value || '').trim()] = !!option.selected;
    });

    Array.from(pengawasDropdownPanel.querySelectorAll('input[type="checkbox"]')).forEach(function (checkbox) {
      checkbox.checked = !!selectedMap[String(checkbox.value || '').trim()];
    });

    updatePengawasDropdownLabel();
  }

  function ensurePengawasCheckboxDropdown() {
    if (!pengawasInput) return;

    if (!pengawasDropdownRoot) {
      pengawasInput.classList.add('inspeksi-pengawas-native-hidden');

      pengawasDropdownRoot = document.createElement('div');
      pengawasDropdownRoot.className = 'inspeksi-checkbox-dropdown';

      pengawasDropdownToggle = document.createElement('button');
      pengawasDropdownToggle.type = 'button';
      pengawasDropdownToggle.className = 'inspeksi-checkbox-dropdown-toggle';
      pengawasDropdownToggle.setAttribute('aria-haspopup', 'true');
      pengawasDropdownToggle.setAttribute('aria-expanded', 'false');
      pengawasDropdownToggle.textContent = '(Pilih Tim Inspeksi)';
      pengawasDropdownToggle.addEventListener('click', function () {
        const isOpen = pengawasDropdownRoot.classList.contains('open');
        if (isOpen) {
          closePengawasDropdown();
          return;
        }

        pengawasDropdownRoot.classList.add('open');
        pengawasDropdownToggle.setAttribute('aria-expanded', 'true');
      });

      pengawasDropdownPanel = document.createElement('div');
      pengawasDropdownPanel.className = 'inspeksi-checkbox-dropdown-panel';

      pengawasDropdownRoot.appendChild(pengawasDropdownToggle);
      pengawasDropdownRoot.appendChild(pengawasDropdownPanel);
      pengawasInput.insertAdjacentElement('afterend', pengawasDropdownRoot);
    }

    renderPengawasCheckboxDropdownOptions();

    if (!pengawasDropdownDocBound) {
      document.addEventListener('click', function (event) {
        if (!pengawasDropdownRoot) return;
        if (pengawasDropdownRoot.contains(event.target)) return;
        closePengawasDropdown();
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          closePengawasDropdown();
        }
      });
      pengawasDropdownDocBound = true;
    }
  }

  function todayValue() {
    return new Date().toISOString().slice(0, 10);
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

  function fillUserDropdown() {
    normalizePengawasField();
    const users = readList(USER_KEY);
    pengawasInput.innerHTML = '';

    users.forEach(function (user) {
      const id = String(user.id || '').trim();
      if (!id) return;
      const option = document.createElement('option');
      option.value = id;
      option.textContent = String((user.nama || user.username || '-') + ' - ' + (user.username || '-')).trim();
      pengawasInput.appendChild(option);
    });
  }

  function getSelectedPengawas() {
    return Array.from(pengawasInput.selectedOptions || [])
      .map(function (option) {
        return {
          id: String(option.value || '').trim(),
          label: String(option.textContent || '').trim()
        };
      })
      .filter(function (item) { return !!item.id; });
  }

  function getPengawasIdsFromRow(row) {
    const ids = row && Array.isArray(row.namaPengawasIds) ? row.namaPengawasIds : [];
    const normalized = ids
      .map(function (value) { return String(value || '').trim(); })
      .filter(function (value) { return !!value; });
    if (normalized.length > 0) return normalized;

    const fallbackId = String((row && row.namaPengawasId) || '').trim();
    return fallbackId ? [fallbackId] : [];
  }

  function getPengawasLabelText(row) {
    const labels = row && Array.isArray(row.namaPengawasLabels) ? row.namaPengawasLabels : [];
    const normalized = labels
      .map(function (value) { return String(value || '').trim(); })
      .filter(function (value) { return !!value; });
    if (normalized.length > 0) return normalized.join(', ');

    const fallbackLabel = String((row && row.namaPengawasLabel) || '').trim();
    return fallbackLabel || '-';
  }

  function setSelectedPengawas(ids) {
    const selectedIds = Array.isArray(ids) ? ids : [];
    const selectedMap = {};
    selectedIds.forEach(function (value) {
      const id = String(value || '').trim();
      if (!id) return;
      selectedMap[id] = true;
    });

    Array.from(pengawasInput.options || []).forEach(function (option) {
      option.selected = !!selectedMap[String(option.value || '').trim()];
    });

    syncPengawasSelectionToDropdown();
  }

  function fillPjaDropdown() {
    const pjaRows = readList(PJA_KEY);
    const users = readList(USER_KEY);
    pjaInput.innerHTML = '<option value="">(Pilih Nama PJA)</option>';

    pjaRows.forEach(function (item) {
      const user = users.find(function (row) { return row.id === item.userId; });
      const label = String((user && (user.nama || user.username)) || item.userLabel || '-').trim();
      const option = document.createElement('option');
      option.value = String(item.id || '').trim();
      option.textContent = label || '-';
      if (!option.value) return;
      pjaInput.appendChild(option);
    });
  }

  function generateNoId(dateValue) {
    const dateText = String(dateValue || '').trim() || todayValue();
    const parts = dateText.split('-');
    const year = parts[0] || new Date().getFullYear().toString();
    const month = parts[1] || String(new Date().getMonth() + 1).padStart(2, '0');

    const rows = readList(INS_KEY);
    const prefix = 'INS - ' + month + '/' + year + ' - ';
    const countInPeriod = rows.filter(function (row) {
      return String(row.noId || '').indexOf(prefix) === 0;
    }).length;

    const noTemuan = String(countInPeriod + 1).padStart(3, '0');
    return prefix + noTemuan;
  }

  function openForm() {
    if (!form) return;
    closePengawasDropdown();
    form.classList.remove('hidden');
  }

  function closeForm() {
    if (!form) return;
    closePengawasDropdown();
    form.classList.add('hidden');
  }

  function resetFormForJenis(user, jenis) {
    editingId = '';
    selectedJenis = fixedJenis || String(jenis || '').trim();
    jenisInput.value = selectedJenis;
    if (fixedJenis) jenisInput.readOnly = true;

    const today = todayValue();
    tanggalLaporanInput.value = today;
    noIdInput.value = generateNoId(today);

    tanggalInspeksiInput.value = '';
    areaInput.value = '';
    detailAreaInput.value = '';

    namaInspektorInput.value = String((user && (user.nama || user.username)) || '').trim();
    jabatanInspektorInput.value = String((user && user.jabatan) || '').trim();
    departemenInspektorInput.value = String((user && user.departemen) || '').trim();
    perusahaanInspektorInput.value = String((user && user.perusahaan) || '').trim();
    ccowInput.value = String((user && user.ccow) || '').trim();

    fillUserDropdown();
    fillPjaDropdown();
    setSelectedPengawas([]);
    pjaInput.value = '';
  }

  function fillFormForEdit(target) {
    if (!target) return;
    editingId = String(target.id || '').trim();
    selectedJenis = fixedJenis || String(target.jenisInspeksi || '').trim();

    jenisInput.value = selectedJenis;
    if (fixedJenis) jenisInput.readOnly = true;
    noIdInput.value = target.noId || '';
    tanggalLaporanInput.value = target.tanggalLaporan || todayValue();
    tanggalInspeksiInput.value = target.tanggalInspeksi || '';
    areaInput.value = target.areaLokasi || '';
    detailAreaInput.value = target.detailAreaLokasi || '';

    namaInspektorInput.value = target.namaInspektor || '';
    jabatanInspektorInput.value = target.jabatanInspektor || '';
    departemenInspektorInput.value = target.departemenInspektor || '';
    perusahaanInspektorInput.value = target.perusahaanInspektor || '';
    ccowInput.value = target.ccow || '';

    fillUserDropdown();
    fillPjaDropdown();
    setSelectedPengawas(getPengawasIdsFromRow(target));
    pjaInput.value = target.namaPjaId || '';
  }

  function validatePayload(payload) {
    if (!payload.jenisInspeksi) return 'Jenis Inspeksi tidak valid.';
    if (!payload.noId) return 'No ID tidak valid.';
    if (!payload.tanggalLaporan) return 'Tanggal Laporan tidak valid.';
    if (!payload.tanggalInspeksi) return 'Tanggal Inspeksi wajib diisi.';
    if (!payload.areaLokasi) return 'Area / Lokasi wajib dipilih.';
    if (!payload.detailAreaLokasi) return 'Detail Area / Lokasi wajib diisi.';
    if (!payload.namaInspektor) return 'Nama Inspektor tidak valid.';
    if (!payload.jabatanInspektor) return 'Jabatan Inspektor tidak valid.';
    if (!payload.departemenInspektor) return 'Departemen Inspektor tidak valid.';
    if (!payload.perusahaanInspektor) return 'Perusahaan Inspektor tidak valid.';
    if (!payload.ccow) return 'CCOW tidak valid.';
    if (!Array.isArray(payload.namaPengawasIds) || payload.namaPengawasIds.length === 0) return 'Tim Inspeksi wajib dipilih.';
    if (!payload.namaPjaId) return 'Nama PJA wajib dipilih.';
    return '';
  }

  function getCanManage() {
    const session = getSession();
    return !!(session && session.role === 'Super Admin');
  }

  function renderRows() {
    const rows = readList(INS_KEY);
    const canManage = getCanManage();
    if (!tbody) return;
    tbody.innerHTML = '';

    rows.filter(function (item) {
      if (!fixedJenis) return true;
      return String(item.jenisInspeksi || '').trim() === fixedJenis;
    }).forEach(function (item) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + (item.noId || '-') + '</td>' +
        '<td>' + (item.tanggalLaporan || '-') + '</td>' +
        '<td>' + (item.jenisInspeksi || '-') + '</td>' +
        '<td>' + (item.areaLokasi || '-') + '</td>' +
        '<td>' + (item.namaInspektor || '-') + '</td>' +
        '<td>' + getPengawasLabelText(item) + '</td>' +
        '<td>' + (item.namaPjaLabel || '-') + '</td>' +
        '<td>' +
          '<button type="button" class="table-btn" data-action="detail" data-id="' + item.id + '">Detail</button>' +
          (canManage
            ? ' <button type="button" class="table-btn" data-action="edit" data-id="' + item.id + '">Ubah</button>' +
              ' <button type="button" class="table-btn danger" data-action="delete" data-id="' + item.id + '">Hapus</button>'
            : '') +
        '</td>';
      tbody.appendChild(tr);
    });
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

    const session = requireSession();
    if (!session) return;
    const user = getCurrentUser(session);
    if (!user) {
      alert('Data user login tidak ditemukan.');
      return;
    }

    const selectedPengawas = getSelectedPengawas();
    const pjaOption = pjaInput.options[pjaInput.selectedIndex];

    const payload = {
      id: editingId || ('ins-' + Date.now()),
      jenisInspeksi: String(jenisInput.value || '').trim(),
      noId: String(noIdInput.value || '').trim(),
      tanggalLaporan: String(tanggalLaporanInput.value || '').trim(),
      tanggalInspeksi: String(tanggalInspeksiInput.value || '').trim(),
      areaLokasi: String(areaInput.value || '').trim(),
      detailAreaLokasi: String(detailAreaInput.value || '').trim(),
      namaInspektor: String(namaInspektorInput.value || '').trim(),
      jabatanInspektor: String(jabatanInspektorInput.value || '').trim(),
      departemenInspektor: String(departemenInspektorInput.value || '').trim(),
      perusahaanInspektor: String(perusahaanInspektorInput.value || '').trim(),
      ccow: String(ccowInput.value || '').trim(),
      namaPengawasIds: selectedPengawas.map(function (item) { return item.id; }),
      namaPengawasLabels: selectedPengawas.map(function (item) { return item.label; }),
      namaPengawasId: selectedPengawas.length > 0 ? selectedPengawas[0].id : '',
      namaPengawasLabel: selectedPengawas.map(function (item) { return item.label; }).join(', '),
      namaPjaId: String(pjaInput.value || '').trim(),
      namaPjaLabel: String(pjaOption ? pjaOption.textContent : '').trim(),
      createdBy: String(user.username || '').trim()
    };

    const validationMessage = validatePayload(payload);
    if (validationMessage) {
      alert(validationMessage);
      return;
    }

      const rows = readList(INS_KEY);
      const idx = rows.findIndex(function (item) { return item.id === payload.id; });
      if (idx >= 0) rows[idx] = payload;
      else rows.push(payload);
      writeList(INS_KEY, rows);

      alert(editingId ? 'Data Inspeksi berhasil diubah.' : 'Data Inspeksi berhasil disimpan.');
      resetFormForJenis(user, selectedJenis || fixedJenis);
      renderRows();
    });
  }

  if (tbody) {
    tbody.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-action]');
      if (!button) return;

      const action = button.dataset.action;
      const id = button.dataset.id;
      const rows = readList(INS_KEY);
      const target = rows.find(function (item) { return item.id === id; });
      if (!target) return;

      if (action === 'detail') {
        const detailText = [
          'No ID: ' + (target.noId || '-'),
          'Jenis Inspeksi: ' + (target.jenisInspeksi || '-'),
          'Tanggal Laporan: ' + (target.tanggalLaporan || '-'),
          'Tanggal Inspeksi: ' + (target.tanggalInspeksi || '-'),
          'Area / Lokasi: ' + (target.areaLokasi || '-'),
          'Detail Area / Lokasi: ' + (target.detailAreaLokasi || '-'),
          'Nama Inspektor: ' + (target.namaInspektor || '-'),
          'Jabatan Inspektor: ' + (target.jabatanInspektor || '-'),
          'Departemen Inspektor: ' + (target.departemenInspektor || '-'),
          'Perusahaan Inspektor: ' + (target.perusahaanInspektor || '-'),
          'CCOW: ' + (target.ccow || '-'),
          'Tim Inspeksi: ' + getPengawasLabelText(target),
          'Nama PJA: ' + (target.namaPjaLabel || '-')
        ].join('\n');
        if (typeof window.aiosShowDetailModal === 'function') {
          window.aiosShowDetailModal('Detail Inspeksi', detailText);
        } else {
          alert(detailText);
        }
        return;
      }

      if (!getCanManage()) {
        alert('Aksi ubah/hapus data Inspeksi hanya dapat dilakukan oleh Super Admin.');
        return;
      }

      if (action === 'edit') {
        fillFormForEdit(target);
        openForm();
        return;
      }

      if (action === 'delete') {
        if (!confirm('Hapus data Inspeksi ini?')) return;
        const nextRows = rows.filter(function (item) { return item.id !== id; });
        writeList(INS_KEY, nextRows);
        renderRows();
      }
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', function () {
      editingId = '';
      closeForm();
    });
  }

  menuButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const session = requireSession();
      if (!session) return;
      const user = getCurrentUser(session);
      if (!user) {
        alert('Data user login tidak ditemukan.');
        return;
      }

      resetFormForJenis(user, button.textContent || 'Inspeksi');
      openForm();
    });
  });

  if (addButton) {
    addButton.addEventListener('click', function () {
      const session = requireSession();
      if (!session) return;
      const user = getCurrentUser(session);
      if (!user) {
        alert('Data user login tidak ditemukan.');
        return;
      }

      resetFormForJenis(user, fixedJenis || 'Inspeksi');
      openForm();
    });
  }

  window.addEventListener('storage', function (event) {
    if (!event || (event.key !== USER_KEY && event.key !== PJA_KEY && event.key !== INS_KEY && event.key !== null)) return;
    fillUserDropdown();
    fillPjaDropdown();
    renderRows();
  });

  window.addEventListener('aios:cloud-sync', function (event) {
    const changedKeys = event && event.detail && Array.isArray(event.detail.changedKeys)
      ? event.detail.changedKeys
      : [];
    if (changedKeys.length > 0 && changedKeys.indexOf(USER_KEY) < 0 && changedKeys.indexOf(PJA_KEY) < 0 && changedKeys.indexOf(INS_KEY) < 0) return;
    fillUserDropdown();
    fillPjaDropdown();
    renderRows();
  });

  const session = requireSession();
  if (!session) return;
  normalizePengawasField();
  if (fixedJenis && jenisInput) {
    jenisInput.value = fixedJenis;
    jenisInput.readOnly = true;
  }
  fillUserDropdown();
  fillPjaDropdown();
  renderRows();
  closeForm();
})();
