(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const DEPT_KEY = 'aios_departments';
  const COMPANY_KEY = 'aios_companies';
  const JSA_KEY = 'aios_jsa';

  const addButton = document.getElementById('add-jsa-btn');
  const form = document.getElementById('jsa-form');
  const tbody = document.getElementById('jsa-tbody');
  const cancelButton = document.getElementById('jsa-cancel-btn');

  const jenisInput = document.getElementById('jsa-jenis');
  const tanggalInput = document.getElementById('jsa-tanggal');
  const noJsaInput = document.getElementById('jsa-no');
  const departemenInput = document.getElementById('jsa-departemen');
  const perusahaanInput = document.getElementById('jsa-perusahaan');
  const apdList = document.getElementById('jsa-apd-list');
  const apdLainnyaCheck = document.getElementById('jsa-apd-lainnya-check');
  const apdLainnyaWrap = document.getElementById('jsa-apd-lainnya-wrap');
  const apdLainnyaInput = document.getElementById('jsa-apd-lainnya');
  const langkahList = document.getElementById('jsa-langkah-list');
  const addLangkahButton = document.getElementById('jsa-add-langkah-btn');

  const disiapkanInput = document.getElementById('jsa-disiapkan');
  const tanggalPengawasInput = document.getElementById('jsa-tanggal-pengawas');
  const diperiksaInput = document.getElementById('jsa-diperiksa');
  const tanggalHseInput = document.getElementById('jsa-tanggal-hse');
  const disetujuiInput = document.getElementById('jsa-disetujui');
  const tanggalPenyeliaInput = document.getElementById('jsa-tanggal-penyelia');
  const berlakuSampaiInput = document.getElementById('jsa-berlaku-sampai');

  let editingId = '';

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

  function requireSession() {
    const session = getSession();
    if (!session || !session.username) {
      alert('Silakan login terlebih dahulu.');
      window.location.href = '../index.html';
      return null;
    }
    return session;
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

  function getCurrentUser(session) {
    const users = readList(USER_KEY);
    return users.find(function (user) {
      return String(user.username || '').toLowerCase() === String(session.username || '').toLowerCase();
    }) || null;
  }

  function userDisplayName(user) {
    return String((user && (user.nama || user.username)) || '').trim();
  }

  function fillPerusahaanDropdown(selectedValue) {
    const companies = readList(COMPANY_KEY);
    perusahaanInput.innerHTML = '<option value="">(Pilih Perusahaan)</option>';

    companies.forEach(function (item) {
      const value = String((item && (item.name || item.id)) || '').trim();
      if (!value) return;
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      perusahaanInput.appendChild(option);
    });

    if (selectedValue) perusahaanInput.value = selectedValue;
  }

  function fillDepartemenDropdown(selectedValue) {
    const departments = readList(DEPT_KEY);
    departemenInput.innerHTML = '<option value="">(Pilih Departemen)</option>';

    departments.forEach(function (item) {
      const value = String((item && (item.name || item.id)) || '').trim();
      if (!value) return;
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      departemenInput.appendChild(option);
    });

    if (selectedValue) departemenInput.value = selectedValue;
  }

  function fillUserDropdown(select, placeholder, selectedValue) {
    const users = readList(USER_KEY);
    select.innerHTML = '<option value="">' + placeholder + '</option>';

    users.forEach(function (user) {
      const id = String(user.id || '').trim();
      if (!id) return;
      const option = document.createElement('option');
      option.value = id;
      option.textContent = userDisplayName(user) || '-';
      select.appendChild(option);
    });

    if (selectedValue) select.value = selectedValue;
  }

  function openForm() {
    form.classList.remove('hidden');
  }

  function closeForm() {
    form.classList.add('hidden');
  }

  function toggleLainnya() {
    const checked = !!(apdLainnyaCheck && apdLainnyaCheck.checked);
    if (checked) {
      apdLainnyaWrap.classList.remove('hidden');
      apdLainnyaInput.required = true;
      return;
    }

    apdLainnyaWrap.classList.add('hidden');
    apdLainnyaInput.required = false;
    apdLainnyaInput.value = '';
  }

  function initSignaturePad(canvasId, clearButtonId) {
    const canvas = document.getElementById(canvasId);
    const clearButton = document.getElementById(clearButtonId);
    const context = canvas.getContext('2d');
    let isDrawing = false;
    let hasStroke = false;

    function resizeCanvas() {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.floor(rect.width * ratio));
      const nextHeight = Math.max(1, Math.floor(rect.height * ratio));
      if (canvas.width === nextWidth && canvas.height === nextHeight) return;

      const previous = canvas.toDataURL('image/png');
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(ratio, ratio);
      context.lineWidth = 2;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = '#0f172a';
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, rect.width, rect.height);

      if (previous && previous.length > 0) {
        const image = new Image();
        image.onload = function () {
          context.drawImage(image, 0, 0, rect.width, rect.height);
        };
        image.src = previous;
      }
    }

    function getPoint(event) {
      const rect = canvas.getBoundingClientRect();
      const pointer = event.touches && event.touches.length > 0 ? event.touches[0] : event;
      return {
        x: pointer.clientX - rect.left,
        y: pointer.clientY - rect.top
      };
    }

    function startDraw(event) {
      event.preventDefault();
      const point = getPoint(event);
      context.beginPath();
      context.moveTo(point.x, point.y);
      isDrawing = true;
    }

    function draw(event) {
      if (!isDrawing) return;
      event.preventDefault();
      const point = getPoint(event);
      context.lineTo(point.x, point.y);
      context.stroke();
      hasStroke = true;
    }

    function endDraw() {
      isDrawing = false;
      context.closePath();
    }

    function clear() {
      const rect = canvas.getBoundingClientRect();
      context.clearRect(0, 0, rect.width, rect.height);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, rect.width, rect.height);
      hasStroke = false;
    }

    function setDataUrl(dataUrl) {
      clear();
      if (!dataUrl) return;
      const image = new Image();
      image.onload = function () {
        const rect = canvas.getBoundingClientRect();
        context.drawImage(image, 0, 0, rect.width, rect.height);
        hasStroke = true;
      };
      image.src = dataUrl;
    }

    if (clearButton) {
      clearButton.addEventListener('click', function () {
        clear();
      });
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', endDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', endDraw);

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    clear();

    return {
      clear: clear,
      isEmpty: function () { return !hasStroke; },
      getDataUrl: function () { return canvas.toDataURL('image/png'); },
      setDataUrl: setDataUrl
    };
  }

  const signPengawas = initSignaturePad('jsa-sign-pengawas', 'jsa-clear-pengawas');
  const signHse = initSignaturePad('jsa-sign-hse', 'jsa-clear-hse');
  const signPenyelia = initSignaturePad('jsa-sign-penyelia', 'jsa-clear-penyelia');

  function collectApdSelections() {
    const checked = Array.from(apdList.querySelectorAll('input[type="checkbox"]:checked'));
    return checked.map(function (item) {
      const value = String(item.value || '').trim();
      if (value !== 'Lainnya') return value;
      const detail = String(apdLainnyaInput.value || '').trim();
      return detail ? ('Lainnya: ' + detail) : 'Lainnya';
    });
  }

  function refreshLangkahLabels() {
    const cards = Array.from(langkahList.querySelectorAll('.jsa-step-item'));
    cards.forEach(function (card, index) {
      const title = card.querySelector('[data-role="step-title"]');
      if (title) title.textContent = 'Langkah Kerja ' + (index + 1);
    });
  }

  function createSimpleSubItem(inputClassName, placeholder, removeAction, value) {
    const row = document.createElement('div');
    row.className = 'jsa-sub-item';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = inputClassName;
    input.placeholder = placeholder;
    input.value = String(value || '');

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'table-btn danger';
    removeButton.dataset.action = removeAction;
    removeButton.textContent = 'Hapus';

    row.appendChild(input);
    row.appendChild(removeButton);
    return row;
  }

  function createTextareaSubItem(inputClassName, placeholder, removeAction, value) {
    const row = document.createElement('div');
    row.className = 'jsa-sub-item';

    const textarea = document.createElement('textarea');
    textarea.className = inputClassName;
    textarea.placeholder = placeholder;
    textarea.rows = 3;
    textarea.value = String(value || '');

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'table-btn danger';
    removeButton.dataset.action = removeAction;
    removeButton.textContent = 'Hapus';

    row.appendChild(textarea);
    row.appendChild(removeButton);
    return row;
  }

  function appendSubItems(container, inputClassName, placeholder, removeAction, values) {
    const rows = Array.isArray(values) && values.length > 0 ? values : [''];
    rows.forEach(function (value) {
      container.appendChild(createSimpleSubItem(inputClassName, placeholder, removeAction, value));
    });
  }

  function appendSubTextareas(container, inputClassName, placeholder, removeAction, values) {
    const rows = Array.isArray(values) && values.length > 0 ? values : [''];
    rows.forEach(function (value) {
      container.appendChild(createTextareaSubItem(inputClassName, placeholder, removeAction, value));
    });
  }

  function normalizeBahayaItem(raw) {
    if (typeof raw === 'string') {
      return {
        bahaya: raw,
        tindakanPengendalian: [''],
        penanggungJawab: [''],
        keterangan: ['']
      };
    }

    const item = raw || {};
    const tindakan = Array.isArray(item.tindakanPengendalian) ? item.tindakanPengendalian : [''];
    const penanggungJawab = Array.isArray(item.penanggungJawab) ? item.penanggungJawab : [''];
    const keterangan = Array.isArray(item.keterangan)
      ? item.keterangan
      : (String(item.keterangan || '').trim() ? [String(item.keterangan || '').trim()] : ['']);
    return {
      bahaya: String(item.bahaya || ''),
      tindakanPengendalian: tindakan,
      penanggungJawab: penanggungJawab,
      keterangan: keterangan
    };
  }

  function createBahayaItem(value) {
    const item = normalizeBahayaItem(value);
    const wrapper = document.createElement('div');
    wrapper.className = 'jsa-bahaya-item';

    const head = document.createElement('div');
    head.className = 'jsa-bahaya-head';

    const input = document.createElement('textarea');
    input.className = 'jsa-bahaya-input';
    input.placeholder = 'Potensi Bahaya / Insiden';
    input.rows = 3;
    input.value = item.bahaya;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'table-btn danger';
    removeButton.dataset.action = 'remove-bahaya';
    removeButton.textContent = 'Hapus Potensi';

    head.appendChild(input);
    head.appendChild(removeButton);

    const tindakanWrap = document.createElement('div');
    tindakanWrap.className = 'jsa-sub-block';
    tindakanWrap.dataset.sub = 'tindakan';
    const tindakanLabel = document.createElement('label');
    tindakanLabel.textContent = 'Tindakan Pengendalian Resiko / Pengendalian Kecelakaan';
    const tindakanList = document.createElement('div');
    tindakanList.className = 'jsa-sub-list';
    appendSubTextareas(
      tindakanList,
      'jsa-tindakan-input',
      'Isi tindakan pengendalian resiko / pengendalian kecelakaan',
      'remove-tindakan',
      item.tindakanPengendalian
    );
    const tindakanActionWrap = document.createElement('div');
    tindakanActionWrap.className = 'form-inline-actions';
    const addTindakanButton = document.createElement('button');
    addTindakanButton.type = 'button';
    addTindakanButton.className = 'ghost';
    addTindakanButton.dataset.action = 'add-tindakan';
    addTindakanButton.textContent = 'Tambah Tindakan Pengendalian';
    tindakanActionWrap.appendChild(addTindakanButton);
    tindakanWrap.appendChild(tindakanLabel);
    tindakanWrap.appendChild(tindakanList);
    tindakanWrap.appendChild(tindakanActionWrap);

    const pjWrap = document.createElement('div');
    pjWrap.className = 'jsa-sub-block';
    pjWrap.dataset.sub = 'penanggung';
    const pjLabel = document.createElement('label');
    pjLabel.textContent = 'Penanggung Jawab';
    const pjList = document.createElement('div');
    pjList.className = 'jsa-sub-list';
    appendSubItems(
      pjList,
      'jsa-penanggung-input',
      'Isi nama penanggung jawab',
      'remove-penanggung',
      item.penanggungJawab
    );
    const pjActionWrap = document.createElement('div');
    pjActionWrap.className = 'form-inline-actions';
    const addPjButton = document.createElement('button');
    addPjButton.type = 'button';
    addPjButton.className = 'ghost';
    addPjButton.dataset.action = 'add-penanggung';
    addPjButton.textContent = 'Tambah Penanggung Jawab';
    pjActionWrap.appendChild(addPjButton);
    pjWrap.appendChild(pjLabel);
    pjWrap.appendChild(pjList);
    pjWrap.appendChild(pjActionWrap);

    const keteranganWrap = document.createElement('div');
    keteranganWrap.className = 'jsa-sub-block';
    keteranganWrap.dataset.sub = 'keterangan';
    const keteranganLabel = document.createElement('label');
    keteranganLabel.textContent = 'Keterangan';
    const keteranganList = document.createElement('div');
    keteranganList.className = 'jsa-sub-list';
    appendSubTextareas(
      keteranganList,
      'jsa-keterangan-input',
      'Isi keterangan tambahan',
      'remove-keterangan',
      item.keterangan
    );
    const keteranganActionWrap = document.createElement('div');
    keteranganActionWrap.className = 'form-inline-actions';
    const addKeteranganButton = document.createElement('button');
    addKeteranganButton.type = 'button';
    addKeteranganButton.className = 'ghost';
    addKeteranganButton.dataset.action = 'add-keterangan';
    addKeteranganButton.textContent = 'Tambah Keterangan';
    keteranganActionWrap.appendChild(addKeteranganButton);
    keteranganWrap.appendChild(keteranganLabel);
    keteranganWrap.appendChild(keteranganList);
    keteranganWrap.appendChild(keteranganActionWrap);

    wrapper.appendChild(head);
    wrapper.appendChild(tindakanWrap);
    wrapper.appendChild(pjWrap);
    wrapper.appendChild(keteranganWrap);
    return wrapper;
  }

  function addBahayaToStep(stepCard, value) {
    const list = stepCard.querySelector('.jsa-bahaya-list');
    if (!list) return;
    list.appendChild(createBahayaItem(value));
  }

  function createLangkahItem(stepValue, hazards) {
    const card = document.createElement('div');
    card.className = 'jsa-step-item';

    const header = document.createElement('div');
    header.className = 'jsa-step-header';

    const title = document.createElement('strong');
    title.dataset.role = 'step-title';
    title.textContent = 'Langkah Kerja';

    const removeStepButton = document.createElement('button');
    removeStepButton.type = 'button';
    removeStepButton.className = 'table-btn danger';
    removeStepButton.dataset.action = 'remove-langkah';
    removeStepButton.textContent = 'Hapus Langkah';

    header.appendChild(title);
    header.appendChild(removeStepButton);

    const langkahWrap = document.createElement('div');
    langkahWrap.className = 'field-wrap';

    const langkahInput = document.createElement('input');
    langkahInput.type = 'text';
    langkahInput.className = 'jsa-langkah-input';
    langkahInput.placeholder = 'Isi langkah kerja';
    langkahInput.value = String(stepValue || '');
    langkahWrap.appendChild(langkahInput);

    const bahayaWrap = document.createElement('div');
    bahayaWrap.className = 'field-wrap';

    const bahayaLabel = document.createElement('label');
    bahayaLabel.textContent = 'Potensi Bahaya / Insiden';

    const bahayaList = document.createElement('div');
    bahayaList.className = 'jsa-bahaya-list';

    const actionWrap = document.createElement('div');
    actionWrap.className = 'form-inline-actions';

    const addBahayaButton = document.createElement('button');
    addBahayaButton.type = 'button';
    addBahayaButton.className = 'ghost';
    addBahayaButton.dataset.action = 'add-bahaya';
    addBahayaButton.textContent = 'Tambah Potensi Bahaya / Insiden';

    actionWrap.appendChild(addBahayaButton);
    bahayaWrap.appendChild(bahayaLabel);
    bahayaWrap.appendChild(bahayaList);
    bahayaWrap.appendChild(actionWrap);

    card.appendChild(header);
    card.appendChild(langkahWrap);
    card.appendChild(bahayaWrap);

    const values = Array.isArray(hazards) && hazards.length > 0 ? hazards : [''];
    values.forEach(function (item) {
      addBahayaToStep(card, item);
    });

    langkahList.appendChild(card);
    refreshLangkahLabels();
  }

  function collectLangkahKerja() {
    const cards = Array.from(langkahList.querySelectorAll('.jsa-step-item'));
    return cards.map(function (card) {
      const langkah = String((card.querySelector('.jsa-langkah-input') || {}).value || '').trim();
      const bahaya = Array.from(card.querySelectorAll('.jsa-bahaya-item')).map(function (hazardCard) {
        const bahayaValue = String((hazardCard.querySelector('.jsa-bahaya-input') || {}).value || '').trim();
        const tindakan = Array.from(hazardCard.querySelectorAll('.jsa-tindakan-input')).map(function (input) {
          return String(input.value || '').trim();
        });
        const penanggung = Array.from(hazardCard.querySelectorAll('.jsa-penanggung-input')).map(function (input) {
          return String(input.value || '').trim();
        });
        const keterangan = Array.from(hazardCard.querySelectorAll('.jsa-keterangan-input')).map(function (input) {
          return String(input.value || '').trim();
        });
        return {
          bahaya: bahayaValue,
          tindakanPengendalian: tindakan,
          penanggungJawab: penanggung,
          keterangan: keterangan
        };
      });
      return {
        langkah: langkah,
        potensiBahayaInsiden: bahaya
      };
    });
  }

  function setLangkahKerja(list) {
    langkahList.innerHTML = '';
    const rows = Array.isArray(list) && list.length > 0
      ? list
      : [{ langkah: '', potensiBahayaInsiden: [{ bahaya: '', tindakanPengendalian: [''], penanggungJawab: [''], keterangan: [''] }] }];
    rows.forEach(function (item) {
      createLangkahItem(item && item.langkah, item && item.potensiBahayaInsiden);
    });
  }

  function resetForm(user) {
    editingId = '';
    jenisInput.value = '';
    tanggalInput.value = todayValue();
    noJsaInput.value = '';
    fillDepartemenDropdown('');
    fillPerusahaanDropdown('');
    fillUserDropdown(diperiksaInput, '(Pilih User Pemeriksa)', '');
    fillUserDropdown(disetujuiInput, '(Pilih User Penyetuju)', '');

    Array.from(apdList.querySelectorAll('input[type="checkbox"]')).forEach(function (checkbox) {
      checkbox.checked = false;
    });
    toggleLainnya();
    setLangkahKerja([]);

    disiapkanInput.value = userDisplayName(user);
    tanggalPengawasInput.value = todayValue();
    tanggalHseInput.value = '';
    tanggalPenyeliaInput.value = '';
    berlakuSampaiInput.value = '';

    signPengawas.clear();
    signHse.clear();
    signPenyelia.clear();
  }

  function validatePayload(payload) {
    if (!payload.jenis) return 'Jenis JSA wajib dipilih.';
    if (!payload.tanggal) return 'Tanggal wajib diisi.';
    if (!payload.noJsa) return 'No JSA wajib diisi.';
    if (!payload.departemen) return 'Departemen wajib dipilih.';
    if (!payload.perusahaan) return 'Perusahaan wajib dipilih.';
    if (!Array.isArray(payload.apd) || payload.apd.length === 0) return 'Minimal satu APD wajib dipilih.';
    if (!Array.isArray(payload.langkahKerja) || payload.langkahKerja.length === 0) {
      return 'Minimal satu Langkah Kerja wajib diisi.';
    }
    for (let index = 0; index < payload.langkahKerja.length; index += 1) {
      const item = payload.langkahKerja[index] || {};
      if (!String(item.langkah || '').trim()) {
        return 'Langkah Kerja pada baris ' + (index + 1) + ' wajib diisi.';
      }
      const hazards = Array.isArray(item.potensiBahayaInsiden) ? item.potensiBahayaInsiden : [];
      if (hazards.length === 0) {
        return 'Minimal satu Potensi Bahaya / Insiden pada Langkah Kerja ' + (index + 1) + ' wajib diisi.';
      }

      for (let hazardIndex = 0; hazardIndex < hazards.length; hazardIndex += 1) {
        const hazard = hazards[hazardIndex] || {};
        if (!String(hazard.bahaya || '').trim()) {
          return 'Potensi Bahaya / Insiden pada Langkah Kerja ' + (index + 1) + ' wajib diisi.';
        }

        const tindakanList = Array.isArray(hazard.tindakanPengendalian) ? hazard.tindakanPengendalian : [];
        if (tindakanList.length === 0 || tindakanList.every(function (value) { return !String(value || '').trim(); })) {
          return 'Minimal satu Tindakan Pengendalian pada Potensi Bahaya ' + (hazardIndex + 1) + ' wajib diisi.';
        }

        const penanggungList = Array.isArray(hazard.penanggungJawab) ? hazard.penanggungJawab : [];
        if (penanggungList.length === 0 || penanggungList.every(function (value) { return !String(value || '').trim(); })) {
          return 'Minimal satu Penanggung Jawab pada Potensi Bahaya ' + (hazardIndex + 1) + ' wajib diisi.';
        }
      }
    }
    if (apdLainnyaCheck.checked && !String(apdLainnyaInput.value || '').trim()) return 'APD Lainnya wajib diisi.';
    if (!payload.disiapkanOleh) return 'JSA disiapkan oleh tidak valid.';
    if (!payload.tanggalPengawas) return 'Tanggal by Pengawas tidak valid.';
    if (!payload.diperiksaId) return 'Diperiksa atau dikaji oleh wajib dipilih.';
    if (!payload.tanggalHse) return 'Tanggal by HSE wajib diisi.';
    if (!payload.disetujuiId) return 'Disetujui oleh wajib dipilih.';
    if (!payload.tanggalPenyelia) return 'Tanggal by Penyelia wajib diisi.';
    if (!payload.berlakuSampai) return 'JSA ini berlaku sampai wajib diisi.';
    if (!payload.ttdPengawas) return 'Tanda tangan Pengawas wajib diisi.';
    if (!payload.ttdHse) return 'Tanda tangan HSE wajib diisi.';
    if (!payload.ttdPenyelia) return 'Tanda tangan Penyelia wajib diisi.';
    return '';
  }

  function renderRows() {
    const session = getSession();
    const canManage = !!(session && session.role === 'Super Admin');
    const rows = readList(JSA_KEY);
    tbody.innerHTML = '';

    rows.forEach(function (item) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + (item.noJsa || '-') + '</td>' +
        '<td>' + (item.tanggal || '-') + '</td>' +
        '<td>' + (item.departemen || '-') + '</td>' +
        '<td>' + (item.perusahaan || '-') + '</td>' +
        '<td>' + (item.disiapkanOleh || '-') + '</td>' +
        '<td>' + (item.diperiksaLabel || '-') + '</td>' +
        '<td>' + (item.disetujuiLabel || '-') + '</td>' +
        '<td>' +
          '<button type="button" class="table-btn" data-action="detail" data-id="' + item.id + '">Detail</button> ' +
          '<button type="button" class="table-btn" data-action="export" data-id="' + item.id + '">Export PDF</button>' +
          (canManage
            ? ' <button type="button" class="table-btn" data-action="edit" data-id="' + item.id + '">Ubah</button> ' +
              '<button type="button" class="table-btn danger" data-action="delete" data-id="' + item.id + '">Hapus</button>'
            : '') +
        '</td>';
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function printableValue(value) {
    const text = String(value || '').trim();
    return text ? text : '-';
  }

  function buildLangkahKerjaTableRows(target) {
    const rows = Array.isArray(target.langkahKerja) ? target.langkahKerja : [];
    if (rows.length === 0) {
      return '<tr><td>1</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>';
    }

    let html = '';
    rows.forEach(function (step, stepIndex) {
      const hazards = Array.isArray(step.potensiBahayaInsiden) ? step.potensiBahayaInsiden : [];
      if (hazards.length === 0) {
        html += '<tr>' +
          '<td>' + (stepIndex + 1) + '</td>' +
          '<td>' + escapeHtml(printableValue(step.langkah)) + '</td>' +
          '<td>-</td>' +
          '<td>-</td>' +
          '<td>-</td>' +
          '<td>-</td>' +
          '</tr>';
        return;
      }

      hazards.forEach(function (hazard, hazardIndex) {
        const isLegacy = typeof hazard === 'string';
        const bahayaText = isLegacy ? hazard : hazard.bahaya;
        const tindakan = isLegacy
          ? []
          : (Array.isArray(hazard.tindakanPengendalian) ? hazard.tindakanPengendalian : []);
        const penanggung = isLegacy
          ? []
          : (Array.isArray(hazard.penanggungJawab) ? hazard.penanggungJawab : []);
        const keterangan = isLegacy
          ? []
          : (Array.isArray(hazard.keterangan) ? hazard.keterangan : [String(hazard.keterangan || '')]);

        html += '<tr>' +
          '<td>' + (hazardIndex === 0 ? (stepIndex + 1) : '') + '</td>' +
          '<td>' + (hazardIndex === 0 ? escapeHtml(printableValue(step.langkah)) : '') + '</td>' +
          '<td>' + escapeHtml(printableValue(bahayaText)) + '</td>' +
          '<td>' + escapeHtml(printableValue(tindakan.filter(function (item) { return String(item || '').trim(); }).join('; '))) + '</td>' +
          '<td>' + escapeHtml(printableValue(penanggung.filter(function (item) { return String(item || '').trim(); }).join('; '))) + '</td>' +
            '<td>' + escapeHtml(printableValue(keterangan.filter(function (item) { return String(item || '').trim(); }).join('; '))) + '</td>' +
          '</tr>';
      });
    });

    return html;
  }

  function buildJsaPdfHtml(target) {
    const apdText = Array.isArray(target.apd) ? target.apd.join(', ') : '';
    const langkahRows = buildLangkahKerjaTableRows(target);
    const pengawasSign = target.ttdPengawas ? '<img src="' + target.ttdPengawas + '" alt="Tanda Tangan Pengawas" style="max-width:220px; max-height:90px;" />' : '-';
    const hseSign = target.ttdHse ? '<img src="' + target.ttdHse + '" alt="Tanda Tangan HSE" style="max-width:220px; max-height:90px;" />' : '-';
    const penyeliaSign = target.ttdPenyelia ? '<img src="' + target.ttdPenyelia + '" alt="Tanda Tangan Penyelia" style="max-width:220px; max-height:90px;" />' : '-';
    const logoPngUrl = new URL('../assets/Logo Alamtri.png', window.location.href).href;
    const logoSvgUrl = new URL('../assets/alamtri-logo.svg', window.location.href).href;

    return '<!doctype html>' +
      '<html><head><meta charset="utf-8" />' +
      '<style>' +
      '@page{size:A4 landscape;margin:1.27cm;}' +
      'html,body{margin:0;padding:0;}' +
      'body{font-family:Segoe UI,Arial,sans-serif;font-size:11px;color:#111;}' +
      '.doc-wrap{width:100%;}' +
      '.doc-header{position:relative;min-height:44px;margin-bottom:8px;}' +
      '.doc-logo{position:absolute;top:0;right:0;max-width:260px;max-height:68px;object-fit:contain;}' +
      'h1{font-size:18px;margin:0 0 10px 0;text-align:center;}' +
      'h2{font-size:13px;margin:12px 0 6px 0;}' +
      'table{width:100%;border-collapse:collapse;table-layout:fixed;}' +
      'th,td{border:1px solid #555;padding:5px 6px;vertical-align:top;word-wrap:break-word;}' +
      'th{background:#efefef;text-align:left;}' +
      '.meta td:first-child{width:180px;font-weight:600;background:#fafafa;}' +
      '.sig-grid{width:100%;margin-top:12px;border-collapse:collapse;table-layout:fixed;}' +
      '.sig-grid td{width:33.33%;height:138px;vertical-align:top;}' +
      '.sig-title{font-weight:600;margin-bottom:8px;}' +
      '.sig-name{margin-top:12px;font-weight:600;}' +
      '.sig-date{margin-top:8px;}' +
      '</style></head><body>' +
      '<div class="doc-wrap">' +
      '<div class="doc-header">' +
      '<img class="doc-logo" src="' + logoPngUrl + '" alt="Logo Alamtri" onerror="this.onerror=null;this.src=\'' + logoSvgUrl + '\';" />' +
      '<h1>JOB SAFETY ANALYSIS (JSA)</h1>' +
      '</div>' +

      '<h2>Informasi Umum</h2>' +
      '<table class="meta">' +
        '<tr><td>JSA</td><td>' + escapeHtml(printableValue(target.jenis)) + '</td></tr>' +
        '<tr><td>Tanggal</td><td>' + escapeHtml(printableValue(target.tanggal)) + '</td></tr>' +
        '<tr><td>No JSA</td><td>' + escapeHtml(printableValue(target.noJsa)) + '</td></tr>' +
        '<tr><td>Departemen</td><td>' + escapeHtml(printableValue(target.departemen)) + '</td></tr>' +
        '<tr><td>Perusahaan</td><td>' + escapeHtml(printableValue(target.perusahaan)) + '</td></tr>' +
        '<tr><td>Alat Pelindung Diri</td><td>' + escapeHtml(printableValue(apdText)) + '</td></tr>' +
        '<tr><td>JSA Disiapkan Oleh</td><td>' + escapeHtml(printableValue(target.disiapkanOleh)) + '</td></tr>' +
        '<tr><td>JSA ini berlaku sampai</td><td>' + escapeHtml(printableValue(target.berlakuSampai)) + '</td></tr>' +
      '</table>' +

      '<h2>Langkah Kerja & Potensi Bahaya</h2>' +
      '<table>' +
        '<thead><tr>' +
          '<th style="width:4%;">No</th>' +
          '<th style="width:18%;">Langkah Kerja</th>' +
          '<th style="width:19%;">Potensi Bahaya / Insiden</th>' +
          '<th style="width:27%;">Tindakan Pengendalian Resiko / Pengendalian Kecelakaan</th>' +
          '<th style="width:16%;">Penanggung Jawab</th>' +
          '<th style="width:16%;">Keterangan</th>' +
        '</tr></thead>' +
        '<tbody>' + langkahRows + '</tbody>' +
      '</table>' +

      '<h2>Pemeriksaan & Persetujuan</h2>' +
      '<table class="sig-grid">' +
        '<tr>' +
          '<td>' +
            '<div class="sig-title">JSA disiapkan oleh</div>' +
            '<div class="sig-name">' + escapeHtml(printableValue(target.disiapkanOleh)) + '</div>' +
            '<div>' + pengawasSign + '</div>' +
            '<div class="sig-date">Tanggal: ' + escapeHtml(printableValue(target.tanggalPengawas)) + '</div>' +
          '</td>' +
          '<td>' +
            '<div class="sig-title">Diperiksa / Dikaji oleh</div>' +
            '<div class="sig-name">' + escapeHtml(printableValue(target.diperiksaLabel)) + '</div>' +
            '<div>' + hseSign + '</div>' +
            '<div class="sig-date">Tanggal: ' + escapeHtml(printableValue(target.tanggalHse)) + '</div>' +
          '</td>' +
          '<td>' +
            '<div class="sig-title">Disetujui oleh</div>' +
            '<div class="sig-name">' + escapeHtml(printableValue(target.disetujuiLabel)) + '</div>' +
            '<div>' + penyeliaSign + '</div>' +
            '<div class="sig-date">Tanggal: ' + escapeHtml(printableValue(target.tanggalPenyelia)) + '</div>' +
          '</td>' +
        '</tr>' +
      '</table>' +
      '</div>' +
      '</body></html>';
  }

  function exportJsaToPdf(target) {
    const html = buildJsaPdfHtml(target);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup diblokir browser. Izinkan popup lalu coba export PDF lagi.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    const rawName = String(target.noJsa || 'JSA').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'JSA';
    printWindow.document.title = rawName + '.pdf';
    printWindow.focus();
    printWindow.onload = function () {
      setTimeout(function () {
        printWindow.print();
      }, 300);
    };
  }

  function setApdSelections(selected) {
    const list = Array.isArray(selected) ? selected : [];
    const plainValues = [];
    let lainnyaValue = '';

    list.forEach(function (value) {
      const raw = String(value || '').trim();
      if (!raw) return;
      if (raw.indexOf('Lainnya:') === 0) {
        lainnyaValue = raw.replace('Lainnya:', '').trim();
        plainValues.push('Lainnya');
      } else {
        plainValues.push(raw);
      }
    });

    Array.from(apdList.querySelectorAll('input[type="checkbox"]')).forEach(function (checkbox) {
      checkbox.checked = plainValues.indexOf(String(checkbox.value || '').trim()) >= 0;
    });

    apdLainnyaInput.value = lainnyaValue;
    toggleLainnya();
  }

  function fillFormForEdit(target) {
    editingId = target.id || '';
    jenisInput.value = target.jenis || '';
    tanggalInput.value = target.tanggal || '';
    noJsaInput.value = target.noJsa || '';
    fillDepartemenDropdown(target.departemen || '');
    fillPerusahaanDropdown(target.perusahaan || '');
    fillUserDropdown(diperiksaInput, '(Pilih User Pemeriksa)', target.diperiksaId || '');
    fillUserDropdown(disetujuiInput, '(Pilih User Penyetuju)', target.disetujuiId || '');
    setApdSelections(target.apd || []);
    setLangkahKerja(target.langkahKerja || []);

    disiapkanInput.value = target.disiapkanOleh || '';
    tanggalPengawasInput.value = target.tanggalPengawas || todayValue();
    tanggalHseInput.value = target.tanggalHse || '';
    tanggalPenyeliaInput.value = target.tanggalPenyelia || '';
    berlakuSampaiInput.value = target.berlakuSampai || '';

    signPengawas.setDataUrl(target.ttdPengawas || '');
    signHse.setDataUrl(target.ttdHse || '');
    signPenyelia.setDataUrl(target.ttdPenyelia || '');
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
      const roleSession = getSession();
      if (!roleSession || roleSession.role !== 'Super Admin') {
        alert('Aksi ubah data JSA hanya dapat dilakukan oleh Super Admin.');
        return;
      }
    }

    const diperiksaOption = diperiksaInput.options[diperiksaInput.selectedIndex];
    const disetujuiOption = disetujuiInput.options[disetujuiInput.selectedIndex];
    const payloadId = editingId || ('jsa-' + Date.now());
    const payload = {
      id: payloadId,
      jenis: String(jenisInput.value || '').trim(),
      tanggal: String(tanggalInput.value || '').trim(),
      noJsa: String(noJsaInput.value || '').trim(),
      departemen: String(departemenInput.value || '').trim(),
      perusahaan: String(perusahaanInput.value || '').trim(),
      apd: collectApdSelections(),
      langkahKerja: collectLangkahKerja(),
      disiapkanOleh: String(disiapkanInput.value || '').trim(),
      disiapkanUsername: String(user.username || '').trim(),
      ttdPengawas: signPengawas.isEmpty() ? '' : signPengawas.getDataUrl(),
      tanggalPengawas: String(tanggalPengawasInput.value || '').trim(),
      diperiksaId: String(diperiksaInput.value || '').trim(),
      diperiksaLabel: String(diperiksaOption ? diperiksaOption.textContent : '').trim(),
      ttdHse: signHse.isEmpty() ? '' : signHse.getDataUrl(),
      tanggalHse: String(tanggalHseInput.value || '').trim(),
      disetujuiId: String(disetujuiInput.value || '').trim(),
      disetujuiLabel: String(disetujuiOption ? disetujuiOption.textContent : '').trim(),
      ttdPenyelia: signPenyelia.isEmpty() ? '' : signPenyelia.getDataUrl(),
      tanggalPenyelia: String(tanggalPenyeliaInput.value || '').trim(),
      berlakuSampai: String(berlakuSampaiInput.value || '').trim()
    };

    const validationMessage = validatePayload(payload);
    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    const rows = readList(JSA_KEY);
    const idx = rows.findIndex(function (item) { return item.id === payloadId; });
    if (idx >= 0) rows[idx] = payload;
    else rows.push(payload);
    writeList(JSA_KEY, rows);

    alert(editingId ? 'Data JSA berhasil diubah.' : 'Data JSA berhasil disimpan.');
    resetForm(user);
    renderRows();
    closeForm();
  });

  tbody.addEventListener('click', function (event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    const rows = readList(JSA_KEY);
    const target = rows.find(function (item) { return item.id === id; });
    if (!target) return;

    if (action === 'detail') {
      const detailText = [
        'JSA: ' + (target.jenis || '-'),
        'Tanggal: ' + (target.tanggal || '-'),
        'No JSA: ' + (target.noJsa || '-'),
        'Departemen: ' + (target.departemen || '-'),
        'Perusahaan: ' + (target.perusahaan || '-'),
        'Alat Pelindung Diri: ' + ((target.apd || []).join(', ') || '-'),
        'Langkah Kerja: ' + ((target.langkahKerja || []).map(function (item, index) {
          const hazardText = (item && Array.isArray(item.potensiBahayaInsiden) ? item.potensiBahayaInsiden : [])
            .map(function (hazard, hazardIndex) {
              if (typeof hazard === 'string') return (hazardIndex + 1) + ') ' + hazard;
              const tindakan = (Array.isArray(hazard.tindakanPengendalian) ? hazard.tindakanPengendalian : [])
                .filter(function (value) { return String(value || '').trim(); })
                .join(', ');
              const pj = (Array.isArray(hazard.penanggungJawab) ? hazard.penanggungJawab : [])
                .filter(function (value) { return String(value || '').trim(); })
                .join(', ');
              const keterangan = (Array.isArray(hazard.keterangan) ? hazard.keterangan : [String(hazard.keterangan || '')])
                .filter(function (value) { return String(value || '').trim(); })
                .join(', ');
              return (hazardIndex + 1) + ') ' + (hazard.bahaya || '-') +
                ' [Tindakan: ' + (tindakan || '-') + '; Penanggung Jawab: ' + (pj || '-') + '; Keterangan: ' + (keterangan || '-') + ']';
            })
            .join(' ; ');
          return (index + 1) + '. ' + (item.langkah || '-') + ' (Potensi Bahaya / Insiden: ' + (hazardText || '-') + ')';
        }).join(' | ') || '-'),
        'JSA disiapkan oleh: ' + (target.disiapkanOleh || '-'),
        'Tanggal by Pengawas: ' + (target.tanggalPengawas || '-'),
        'Diperiksa atau dikaji oleh: ' + (target.diperiksaLabel || '-'),
        'Tanggal by HSE: ' + (target.tanggalHse || '-'),
        'Disetujui oleh: ' + (target.disetujuiLabel || '-'),
        'Tanggal by Penyelia: ' + (target.tanggalPenyelia || '-'),
        'JSA ini berlaku sampai: ' + (target.berlakuSampai || '-')
      ].join('\n');

      if (typeof window.aiosShowDetailModal === 'function') {
        window.aiosShowDetailModal('Detail JSA', detailText, {
          media: [
            { type: 'image', src: target.ttdPengawas, title: 'Tanda Tangan Pengawas' },
            { type: 'image', src: target.ttdHse, title: 'Tanda Tangan HSE' },
            { type: 'image', src: target.ttdPenyelia, title: 'Tanda Tangan Penyelia' }
          ].filter(function (item) { return !!item.src; })
        });
      } else {
        alert(detailText);
      }
      return;
    }

    if (action === 'export') {
      exportJsaToPdf(target);
      return;
    }

    const session = getSession();
    if (!session || session.role !== 'Super Admin') {
      alert('Aksi ubah/hapus data JSA hanya dapat dilakukan oleh Super Admin.');
      return;
    }

    if (action === 'edit') {
      fillFormForEdit(target);
      openForm();
      return;
    }

    if (action === 'delete') {
      if (!confirm('Hapus data JSA ini?')) return;
      const nextRows = rows.filter(function (item) { return item.id !== id; });
      writeList(JSA_KEY, nextRows);
      renderRows();

      const activeSession = requireSession();
      if (!activeSession) return;
      const user = getCurrentUser(activeSession);
      if (!user) return;
      resetForm(user);
      closeForm();
    }
  });

  if (apdLainnyaCheck) {
    apdLainnyaCheck.addEventListener('change', toggleLainnya);
  }

  if (addLangkahButton) {
    addLangkahButton.addEventListener('click', function () {
      createLangkahItem('', [{ bahaya: '', tindakanPengendalian: [''], penanggungJawab: [''], keterangan: [''] }]);
    });
  }

  if (langkahList) {
    langkahList.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-action]');
      if (!button) return;

      const action = button.dataset.action;
      const stepCard = button.closest('.jsa-step-item');
      if (!stepCard) return;

      if (action === 'add-bahaya') {
        addBahayaToStep(stepCard, { bahaya: '', tindakanPengendalian: [''], penanggungJawab: [''], keterangan: [''] });
        return;
      }

      if (action === 'remove-bahaya') {
        const list = stepCard.querySelector('.jsa-bahaya-list');
        const rows = list ? list.querySelectorAll('.jsa-bahaya-item') : [];
        if (!rows || rows.length <= 1) {
          alert('Minimal satu Potensi Bahaya / Insiden harus ada pada setiap Langkah Kerja.');
          return;
        }
        const row = button.closest('.jsa-bahaya-item');
        if (row) row.remove();
        return;
      }

      if (action === 'add-tindakan') {
        const hazardCard = button.closest('.jsa-bahaya-item');
        if (!hazardCard) return;
        const block = hazardCard.querySelector('.jsa-sub-block[data-sub="tindakan"]');
        const list = block ? block.querySelector('.jsa-sub-list') : null;
        if (!list) return;
        list.appendChild(createTextareaSubItem('jsa-tindakan-input', 'Isi tindakan pengendalian resiko / pengendalian kecelakaan', 'remove-tindakan', ''));
        return;
      }

      if (action === 'remove-tindakan') {
        const block = button.closest('.jsa-sub-block');
        const list = block ? block.querySelector('.jsa-sub-list') : null;
        const rows = list ? list.querySelectorAll('.jsa-sub-item') : [];
        if (!rows || rows.length <= 1) {
          alert('Minimal satu Tindakan Pengendalian harus ada di setiap Potensi Bahaya / Insiden.');
          return;
        }
        const row = button.closest('.jsa-sub-item');
        if (row) row.remove();
        return;
      }

      if (action === 'add-penanggung') {
        const hazardCard = button.closest('.jsa-bahaya-item');
        if (!hazardCard) return;
        const block = hazardCard.querySelector('.jsa-sub-block[data-sub="penanggung"]');
        const list = block ? block.querySelector('.jsa-sub-list') : null;
        if (!list) return;
        list.appendChild(createSimpleSubItem('jsa-penanggung-input', 'Isi nama penanggung jawab', 'remove-penanggung', ''));
        return;
      }

      if (action === 'remove-penanggung') {
        const block = button.closest('.jsa-sub-block');
        const list = block ? block.querySelector('.jsa-sub-list') : null;
        const rows = list ? list.querySelectorAll('.jsa-sub-item') : [];
        if (!rows || rows.length <= 1) {
          alert('Minimal satu Penanggung Jawab harus ada di setiap Potensi Bahaya / Insiden.');
          return;
        }
        const row = button.closest('.jsa-sub-item');
        if (row) row.remove();
        return;
      }

      if (action === 'add-keterangan') {
        const hazardCard = button.closest('.jsa-bahaya-item');
        if (!hazardCard) return;
        const block = hazardCard.querySelector('.jsa-sub-block[data-sub="keterangan"]');
        const list = block ? block.querySelector('.jsa-sub-list') : null;
        if (!list) return;
        list.appendChild(createTextareaSubItem('jsa-keterangan-input', 'Isi keterangan tambahan', 'remove-keterangan', ''));
        return;
      }

      if (action === 'remove-keterangan') {
        const block = button.closest('.jsa-sub-block');
        const list = block ? block.querySelector('.jsa-sub-list') : null;
        const rows = list ? list.querySelectorAll('.jsa-sub-item') : [];
        if (!rows || rows.length <= 1) {
          alert('Minimal satu Keterangan harus ada di setiap Potensi Bahaya / Insiden.');
          return;
        }
        const row = button.closest('.jsa-sub-item');
        if (row) row.remove();
        return;
      }

      if (action === 'remove-langkah') {
        const cards = langkahList.querySelectorAll('.jsa-step-item');
        if (!cards || cards.length <= 1) {
          alert('Minimal satu Langkah Kerja harus ada.');
          return;
        }
        stepCard.remove();
        refreshLangkahLabels();
      }
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', function () {
      const session = requireSession();
      if (!session) return;
      const user = getCurrentUser(session);
      if (!user) return;
      resetForm(user);
      closeForm();
    });
  }

  if (addButton) {
    addButton.addEventListener('click', function () {
      const session = requireSession();
      if (!session) return;
      const user = getCurrentUser(session);
      if (!user) return;
      resetForm(user);
      openForm();
    });
  }

  window.addEventListener('storage', function (event) {
    if (!event || (event.key !== JSA_KEY && event.key !== USER_KEY && event.key !== DEPT_KEY && event.key !== COMPANY_KEY && event.key !== null)) return;
    const selectedDept = String(departemenInput.value || '').trim();
    const selectedCompany = String(perusahaanInput.value || '').trim();
    const selectedDiperiksa = String(diperiksaInput.value || '').trim();
    const selectedDisetujui = String(disetujuiInput.value || '').trim();
    fillDepartemenDropdown(selectedDept);
    fillPerusahaanDropdown(selectedCompany);
    fillUserDropdown(diperiksaInput, '(Pilih User Pemeriksa)', selectedDiperiksa);
    fillUserDropdown(disetujuiInput, '(Pilih User Penyetuju)', selectedDisetujui);
    renderRows();
  });

  window.addEventListener('aios:cloud-sync', function (event) {
    const changedKeys = event && event.detail && Array.isArray(event.detail.changedKeys)
      ? event.detail.changedKeys
      : [];
    if (
      changedKeys.length > 0 &&
      changedKeys.indexOf(JSA_KEY) < 0 &&
      changedKeys.indexOf(USER_KEY) < 0 &&
      changedKeys.indexOf(DEPT_KEY) < 0 &&
      changedKeys.indexOf(COMPANY_KEY) < 0
    ) {
      return;
    }
    const selectedDept = String(departemenInput.value || '').trim();
    const selectedCompany = String(perusahaanInput.value || '').trim();
    const selectedDiperiksa = String(diperiksaInput.value || '').trim();
    const selectedDisetujui = String(disetujuiInput.value || '').trim();
    fillDepartemenDropdown(selectedDept);
    fillPerusahaanDropdown(selectedCompany);
    fillUserDropdown(diperiksaInput, '(Pilih User Pemeriksa)', selectedDiperiksa);
    fillUserDropdown(disetujuiInput, '(Pilih User Penyetuju)', selectedDisetujui);
    renderRows();
  });

  function init() {
    const session = requireSession();
    if (!session) return;

    const user = getCurrentUser(session);
    if (!user) {
      alert('Profil user tidak ditemukan. Silakan login ulang.');
      window.location.href = '../index.html';
      return;
    }

    fillDepartemenDropdown('');
    fillPerusahaanDropdown('');
    fillUserDropdown(diperiksaInput, '(Pilih User Pemeriksa)', '');
    fillUserDropdown(disetujuiInput, '(Pilih User Penyetuju)', '');
    resetForm(user);
    closeForm();
    renderRows();
  }

  init();
})();
