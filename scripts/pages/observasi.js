(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const OBS_KEY = 'aios_observasi';

  const QUESTION_KEYS = ['sop', 'apd', 'kompetensi', 'lima-r', 'fit'];

  const addButton = document.getElementById('add-observasi-btn');
  const form = document.getElementById('observasi-form');
  const tbody = document.getElementById('observasi-tbody');
  const noIdInput = document.getElementById('obs-no-id');
  const tanggalLaporanInput = document.getElementById('obs-tanggal-laporan');
  const namaObserverInput = document.getElementById('obs-nama-observer');
  const jabatanObserverInput = document.getElementById('obs-jabatan-observer');
  const departemenObserverInput = document.getElementById('obs-departemen-observer');
  const perusahaanObserverInput = document.getElementById('obs-perusahaan-observer');
  const ccowInput = document.getElementById('obs-ccow');

  const tanggalObservasiInput = document.getElementById('obs-tanggal-observasi');
  const waktuObservasiInput = document.getElementById('obs-waktu-observasi');
  const lokasiInput = document.getElementById('obs-lokasi');
  const detailLokasiInput = document.getElementById('obs-detail-lokasi');
  const pengawasInput = document.getElementById('obs-pengawas');
  const pekerjaList = document.getElementById('obs-pekerja-list');

  const aktivitasInput = document.getElementById('obs-aktivitas');
  const noSopInput = document.getElementById('obs-no-sop');
  const apresiasiInput = document.getElementById('obs-apresiasi');
  const tindakLanjutInput = document.getElementById('obs-tindak-lanjut');
  const lampiranInput = document.getElementById('obs-lampiran');
  const lampiranList = document.getElementById('obs-lampiran-list');
  const cancelButton = document.getElementById('obs-cancel-btn');
  let editingId = '';
  let editingLampiran = [];

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

  function toNameOnlyLabel(value) {
    const raw = String(value || '').trim();
    if (!raw) return '-';
    return raw.includes(' - ') ? raw.split(' - ')[0].trim() : raw;
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

  function todayValue() {
    return new Date().toISOString().slice(0, 10);
  }

  function buildNoId() {
    const rows = readList(OBS_KEY);
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    const prefix = 'OBS - ' + month + '/' + year + ' - ';

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

  function fillObserverProfile(user) {
    namaObserverInput.value = user.nama || '';
    jabatanObserverInput.value = user.jabatan || '';
    departemenObserverInput.value = user.departemen || '';
    perusahaanObserverInput.value = user.perusahaan || '';
    ccowInput.value = user.ccow || '';
  }

  function fillUserSelections() {
    const users = readList(USER_KEY);

    pengawasInput.innerHTML = '<option value="">(Pilih Pengawas)</option>';
    users.forEach(function (user) {
      const option = document.createElement('option');
      option.value = user.id || '';
      option.textContent = toNameOnlyLabel(user.nama || user.username || '-');
      pengawasInput.appendChild(option);
    });

    pekerjaList.innerHTML = '';
    users.forEach(function (user) {
      const label = document.createElement('label');
      label.className = 'multi-check-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = user.id || '';
      checkbox.dataset.nama = toNameOnlyLabel(user.nama || user.username || '');

      const span = document.createElement('span');
      span.textContent = toNameOnlyLabel(user.nama || user.username || '-');

      label.appendChild(checkbox);
      label.appendChild(span);
      pekerjaList.appendChild(label);
    });
  }

  function getQuestionElements(key) {
    return {
      answer: document.getElementById('obs-' + key + '-answer'),
      detailWrap: document.getElementById('obs-' + key + '-detail'),
      alasan: document.getElementById('obs-' + key + '-alasan'),
      status: document.getElementById('obs-' + key + '-status'),
      tindakanWrap: document.getElementById('obs-' + key + '-tindakan-wrap'),
      tindakan: document.getElementById('obs-' + key + '-tindakan')
    };
  }

  function toggleQuestionFields(key) {
    const fields = getQuestionElements(key);
    const isTidak = fields.answer.value === 'Tidak';

    if (isTidak) {
      fields.detailWrap.classList.remove('hidden');
      fields.alasan.required = true;
      fields.status.required = true;
    } else {
      fields.detailWrap.classList.add('hidden');
      fields.alasan.required = false;
      fields.status.required = false;
      fields.alasan.value = '';
      fields.status.value = '';
      fields.tindakan.required = false;
      fields.tindakan.value = '';
      fields.tindakanWrap.classList.add('hidden');
      return;
    }

    const isClose = fields.status.value === 'Close';
    if (isClose) {
      fields.tindakanWrap.classList.remove('hidden');
      fields.tindakan.required = true;
    } else {
      fields.tindakanWrap.classList.add('hidden');
      fields.tindakan.required = false;
      fields.tindakan.value = '';
    }
  }

  function collectSelectedWorkers() {
    const checked = Array.from(pekerjaList.querySelectorAll('input[type="checkbox"]:checked'));
    return checked.map(function (item) {
      return {
        id: item.value,
        nama: item.dataset.nama || ''
      };
    });
  }

  function collectLampiranMeta() {
    const files = Array.from(lampiranInput.files || []);
    return files.map(function (file) {
      return {
        name: file.name,
        size: file.size,
        type: file.type || ''
      };
    });
  }

  function renderLampiranListFromMeta(list) {
    lampiranList.innerHTML = '';

    list.forEach(function (file) {
      const li = document.createElement('li');
      li.textContent = file.name;
      lampiranList.appendChild(li);
    });
  }

  function renderLampiranList() {
    const files = Array.from(lampiranInput.files || []);
    const list = files.map(function (file) {
      return { name: file.name };
    });
    renderLampiranListFromMeta(list);
  }

  function renderRows() {
    const session = getSession();
    const canManage = !!(session && session.role === 'Super Admin');
    const rows = readList(OBS_KEY);
    tbody.innerHTML = '';

    rows.forEach(function (row) {
      const tr = document.createElement('tr');
      const jumlahPekerja = Array.isArray(row.namaPekerja) ? row.namaPekerja.length : 0;
      const jumlahLampiran = Array.isArray(row.lampiran) ? row.lampiran.length : 0;
      tr.innerHTML =
        '<td>' + (row.noId || '-') + '</td>' +
        '<td>' + (row.tanggalLaporan || '-') + '</td>' +
        '<td>' + (row.namaObserver || '-') + '</td>' +
        '<td>' + (row.lokasi || '-') + '</td>' +
        '<td>' + toNameOnlyLabel(row.pengawasLabel) + '</td>' +
        '<td>' + (row.aktivitas || '-') + '</td>' +
        '<td>' + jumlahPekerja + '</td>' +
        '<td>' + jumlahLampiran + '</td>' +
        '<td>' +
          (canManage
            ? '<button type="button" class="table-btn" data-action="edit" data-id="' + row.id + '">Ubah</button> ' +
              '<button type="button" class="table-btn danger" data-action="delete" data-id="' + row.id + '">Hapus</button>'
            : '-') +
        '</td>';
      tbody.appendChild(tr);
    });
  }

  function collectQuestionData(key) {
    const fields = getQuestionElements(key);
    return {
      jawaban: String(fields.answer.value || '').trim(),
      alasan: String(fields.alasan.value || '').trim(),
      status: String(fields.status.value || '').trim(),
      tindakanPerbaikan: String(fields.tindakan.value || '').trim()
    };
  }

  function validatePayload(payload) {
    if (!payload.noId) return 'No ID tidak valid.';
    if (!payload.tanggalLaporan) return 'Tanggal Laporan tidak valid.';
    if (!payload.namaObserver) return 'Nama Observer tidak valid.';
    if (!payload.tanggalObservasi) return 'Tanggal Observasi wajib diisi.';
    if (!payload.waktuObservasi) return 'Waktu Observasi wajib diisi.';
    if (!payload.lokasi) return 'Lokasi wajib dipilih.';
    if (!payload.detailLokasi) return 'Detail Lokasi wajib diisi.';
    if (!payload.pengawasId) return 'Nama Pengawas Pekerjaan wajib dipilih.';
    if (!Array.isArray(payload.namaPekerja) || payload.namaPekerja.length === 0) return 'Nama Pekerja minimal 1 orang harus dipilih.';
    if (!payload.aktivitas) return 'Aktifitas / Pekerjaan wajib diisi.';
    if (!payload.noSopWinJsa) return 'No SOP / WIN / JSA wajib diisi.';

    const questionKeys = ['sop', 'apd', 'kompetensi', 'limaR', 'fit'];
    for (let index = 0; index < questionKeys.length; index += 1) {
      const key = questionKeys[index];
      const item = payload.questions[key];
      if (!item || !item.jawaban) return 'Semua pertanyaan Ya/Tidak wajib dijawab.';
      if (item.jawaban === 'Tidak') {
        if (!item.alasan) return 'Alasan / Keterangan wajib diisi untuk jawaban Tidak.';
        if (!item.status) return 'Status wajib dipilih untuk jawaban Tidak.';
        if (item.status === 'Close' && !item.tindakanPerbaikan) {
          return 'Tindakan Perbaikan wajib diisi jika status Close.';
        }
      }
    }

    if (!payload.apresiasi) return 'Tindakan apresiasi wajib diisi.';
    if (!payload.tindakLanjut) return 'Tindak lanjut dan komitmen wajib diisi.';

    return '';
  }

  function resetFormState(user) {
    editingId = '';
    editingLampiran = [];
    noIdInput.value = buildNoId();
    tanggalLaporanInput.value = todayValue();
    fillObserverProfile(user);

    tanggalObservasiInput.value = '';
    waktuObservasiInput.value = '';
    lokasiInput.value = '';
    detailLokasiInput.value = '';
    pengawasInput.value = '';
    aktivitasInput.value = '';
    noSopInput.value = '';
    apresiasiInput.value = '';
    tindakLanjutInput.value = '';

    Array.from(pekerjaList.querySelectorAll('input[type="checkbox"]')).forEach(function (checkbox) {
      checkbox.checked = false;
    });

    QUESTION_KEYS.forEach(function (key) {
      const fields = getQuestionElements(key);
      fields.answer.value = '';
      fields.alasan.value = '';
      fields.status.value = '';
      fields.tindakan.value = '';
      fields.detailWrap.classList.add('hidden');
      fields.tindakanWrap.classList.add('hidden');
      fields.alasan.required = false;
      fields.status.required = false;
      fields.tindakan.required = false;
    });

    lampiranInput.value = '';
    lampiranList.innerHTML = '';
  }

  QUESTION_KEYS.forEach(function (key) {
    const fields = getQuestionElements(key);
    fields.answer.addEventListener('change', function () {
      toggleQuestionFields(key);
    });
    fields.status.addEventListener('change', function () {
      toggleQuestionFields(key);
    });
  });

  lampiranInput.addEventListener('change', function () {
    renderLampiranList();
  });

  function applyQuestionData(key, item) {
    const fields = getQuestionElements(key);
    fields.answer.value = (item && item.jawaban) || '';
    fields.alasan.value = (item && item.alasan) || '';
    fields.status.value = (item && item.status) || '';
    fields.tindakan.value = (item && item.tindakanPerbaikan) || '';
    toggleQuestionFields(key);
  }

  function fillFormForEdit(target) {
    editingId = target.id;
    editingLampiran = Array.isArray(target.lampiran) ? target.lampiran : [];

    noIdInput.value = target.noId || '';
    tanggalLaporanInput.value = target.tanggalLaporan || todayValue();
    namaObserverInput.value = target.namaObserver || '';
    jabatanObserverInput.value = target.jabatanObserver || '';
    departemenObserverInput.value = target.departemenObserver || '';
    perusahaanObserverInput.value = target.perusahaanObserver || '';
    ccowInput.value = target.ccow || '';

    tanggalObservasiInput.value = target.tanggalObservasi || '';
    waktuObservasiInput.value = target.waktuObservasi || '';
    lokasiInput.value = target.lokasi || '';
    detailLokasiInput.value = target.detailLokasi || '';
    pengawasInput.value = target.pengawasId || '';
    aktivitasInput.value = target.aktivitas || '';
    noSopInput.value = target.noSopWinJsa || '';
    apresiasiInput.value = target.apresiasi || '';
    tindakLanjutInput.value = target.tindakLanjut || '';

    const selectedMap = {};
    (Array.isArray(target.namaPekerja) ? target.namaPekerja : []).forEach(function (item) {
      selectedMap[String(item.id || '')] = true;
    });
    Array.from(pekerjaList.querySelectorAll('input[type="checkbox"]')).forEach(function (checkbox) {
      checkbox.checked = !!selectedMap[String(checkbox.value || '')];
    });

    const questions = target.questions || {};
    applyQuestionData('sop', questions.sop);
    applyQuestionData('apd', questions.apd);
    applyQuestionData('kompetensi', questions.kompetensi);
    applyQuestionData('lima-r', questions.limaR);
    applyQuestionData('fit', questions.fit);

    lampiranInput.value = '';
    renderLampiranListFromMeta(editingLampiran);
  }

  form.addEventListener('submit', function (event) {
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
        alert('Aksi ubah data Observasi hanya dapat dilakukan oleh Super Admin.');
        return;
      }
    }

    const lampiranPayload = (lampiranInput.files && lampiranInput.files.length > 0)
      ? collectLampiranMeta()
      : (editingId ? editingLampiran : []);

    const selectedPengawasOption = pengawasInput.options[pengawasInput.selectedIndex];
    const payloadId = editingId || ('obs-' + Date.now());
    const payload = {
      id: payloadId,
      noId: String(noIdInput.value || '').trim(),
      tanggalLaporan: String(tanggalLaporanInput.value || '').trim(),
      username: user.username || '',
      namaObserver: String(namaObserverInput.value || '').trim(),
      jabatanObserver: String(jabatanObserverInput.value || '').trim(),
      departemenObserver: String(departemenObserverInput.value || '').trim(),
      perusahaanObserver: String(perusahaanObserverInput.value || '').trim(),
      ccow: String(ccowInput.value || '').trim(),
      tanggalObservasi: String(tanggalObservasiInput.value || '').trim(),
      waktuObservasi: String(waktuObservasiInput.value || '').trim(),
      lokasi: String(lokasiInput.value || '').trim(),
      detailLokasi: String(detailLokasiInput.value || '').trim(),
      pengawasId: String(pengawasInput.value || '').trim(),
      pengawasLabel: toNameOnlyLabel(selectedPengawasOption ? selectedPengawasOption.textContent : ''),
      namaPekerja: collectSelectedWorkers(),
      aktivitas: String(aktivitasInput.value || '').trim(),
      noSopWinJsa: String(noSopInput.value || '').trim(),
      questions: {
        sop: collectQuestionData('sop'),
        apd: collectQuestionData('apd'),
        kompetensi: collectQuestionData('kompetensi'),
        limaR: collectQuestionData('lima-r'),
        fit: collectQuestionData('fit')
      },
      apresiasi: String(apresiasiInput.value || '').trim(),
      tindakLanjut: String(tindakLanjutInput.value || '').trim(),
      lampiran: lampiranPayload
    };

    const validationMessage = validatePayload(payload);
    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    const rows = readList(OBS_KEY);
    const idx = rows.findIndex(function (item) { return item.id === payloadId; });
    if (idx >= 0) rows[idx] = payload;
    else rows.push(payload);
    writeList(OBS_KEY, rows);

    alert(editingId ? 'Data Observasi berhasil diubah.' : 'Data Observasi berhasil disimpan.');
    resetFormState(user);
    renderRows();
    closeForm();
  });

  tbody.addEventListener('click', function (event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const session = getSession();
    if (!session || session.role !== 'Super Admin') {
      alert('Aksi ubah/hapus data Observasi hanya dapat dilakukan oleh Super Admin.');
      return;
    }

    const action = button.dataset.action;
    const id = button.dataset.id;
    const rows = readList(OBS_KEY);
    const target = rows.find(function (item) { return item.id === id; });
    if (!target) return;

    if (action === 'edit') {
      fillFormForEdit(target);
      openForm();
      return;
    }

    if (action === 'delete') {
      if (!confirm('Hapus data Observasi ini?')) return;
      const nextRows = rows.filter(function (item) { return item.id !== id; });
      writeList(OBS_KEY, nextRows);
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

    fillUserSelections();
    resetFormState(user);
    closeForm();
    renderRows();
  }

  init();
})();
