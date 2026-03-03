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
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;
  const validationModeBanner = document.getElementById('jsa-validation-mode-banner');

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
  const signPengawasCanvas = document.getElementById('jsa-sign-pengawas');
  const signPengawasBox = signPengawasCanvas ? signPengawasCanvas.closest('.signature-box') : null;
  const diperiksaInput = document.getElementById('jsa-diperiksa');
  const validasiHseInput = document.getElementById('jsa-validasi-hse');
  const catatanHseWrap = document.getElementById('jsa-catatan-hse-wrap');
  const catatanHseInput = document.getElementById('jsa-catatan-hse');
  const signHseBox = document.getElementById('jsa-sign-hse-box');
  const clearPengawasButton = document.getElementById('jsa-clear-pengawas');
  const clearHseButton = document.getElementById('jsa-clear-hse');
  const uploadHseInput = document.getElementById('jsa-upload-hse');
  const tanggalHseInput = document.getElementById('jsa-tanggal-hse');
  const disetujuiInput = document.getElementById('jsa-disetujui');
  const validasiPenyeliaInput = document.getElementById('jsa-validasi-penyelia');
  const catatanPenyeliaWrap = document.getElementById('jsa-catatan-penyelia-wrap');
  const catatanPenyeliaInput = document.getElementById('jsa-catatan-penyelia');
  const signPenyeliaBox = document.getElementById('jsa-sign-penyelia-box');
  const clearPenyeliaButton = document.getElementById('jsa-clear-penyelia');
  const uploadPenyeliaInput = document.getElementById('jsa-upload-penyelia');
  const tanggalPenyeliaInput = document.getElementById('jsa-tanggal-penyelia');
  const berlakuSampaiInput = document.getElementById('jsa-berlaku-sampai');
  const uploadPengawasInput = document.getElementById('jsa-upload-pengawas');
  const previewPengawas = document.getElementById('jsa-preview-pengawas');
  const previewHse = document.getElementById('jsa-preview-hse');
  const previewPenyelia = document.getElementById('jsa-preview-penyelia');

  let editingId = '';
  let lockedRoleByAssignment = {
    hse: false,
    penyelia: false
  };
  let validationMode = null;
  let reworkMode = null;

  function todayValue() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDaysToIsoDate(isoDate, daysToAdd) {
    const raw = String(isoDate || '').trim();
    if (!raw) return '';
    const parts = raw.split('-');
    if (parts.length !== 3) return '';

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (!year || !month || !day) return '';

    const nextDate = new Date(Date.UTC(year, month - 1, day));
    nextDate.setUTCDate(nextDate.getUTCDate() + Number(daysToAdd || 0));
    return nextDate.toISOString().slice(0, 10);
  }

  function syncBerlakuSampaiWithTanggal() {
    if (!berlakuSampaiInput) return;
    berlakuSampaiInput.value = addDaysToIsoDate(tanggalInput && tanggalInput.value, 30);
  }

  function applyDateMaximumToday() {
    const maxDate = todayValue();
    if (tanggalInput) tanggalInput.max = maxDate;
    if (tanggalHseInput) tanggalHseInput.max = maxDate;
    if (tanggalPenyeliaInput) tanggalPenyeliaInput.max = maxDate;
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

  function getJsaOpenRequest() {
    const params = new URLSearchParams(window.location.search || '');
    const mode = String(params.get('mode') || '').trim();
    const id = String(params.get('id') || '').trim();
    const stage = String(params.get('stage') || '').trim().toLowerCase();

    if (!id) return null;
    if (mode !== 'validate' && mode !== 'rework') return null;
    if (mode === 'validate') {
      if (stage !== 'hse' && stage !== 'penyelia') return null;
      return { mode: mode, id: id, stage: stage };
    }

    if (mode === 'rework') {
      if (stage && stage !== 'hse' && stage !== 'penyelia') return null;
      return { mode: mode, id: id, stage: stage || '' };
    }

    return null;
  }

  function isCurrentUserCreator(source, currentUser) {
    const row = source || {};
    const user = currentUser || null;
    if (!user) return false;

    const creatorUsername = String(row.disiapkanUsername || '').trim().toLowerCase();
    const currentUsername = String(user.username || '').trim().toLowerCase();
    if (creatorUsername && currentUsername && creatorUsername === currentUsername) return true;

    const creatorName = String(row.disiapkanOleh || '').trim().toLowerCase();
    const currentName = String(userDisplayName(user) || '').trim().toLowerCase();
    return !!creatorName && !!currentName && creatorName === currentName;
  }

  function isValidationCompleted(role, source) {
    const row = source || {};
    const isHse = role === 'hse';
    const status = String(isHse ? row.validasiHse : row.validasiPenyelia || '').trim();
    const note = String(isHse ? row.catatanHse : row.catatanPenyelia || '').trim();
    const date = String(isHse ? row.tanggalHse : row.tanggalPenyelia || '').trim();
    const sign = String(isHse ? row.ttdHse : row.ttdPenyelia || '').trim();

    if (status === 'Approved') return !!(date && sign);
    if (status === 'Not Approved') return !!note;
    return false;
  }

  function isCurrentUserAssignedToRole(role, source, currentUser) {
    const row = source || {};
    const user = currentUser || null;
    if (!user || !user.id) return false;
    const selectedId = role === 'hse' ? String(row.diperiksaId || '').trim() : String(row.disetujuiId || '').trim();
    return !!selectedId && selectedId === String(user.id || '').trim();
  }

  function setFieldsDisabled(list, disabled) {
    (list || []).forEach(function (element) {
      if (!element) return;
      element.disabled = !!disabled;
    });
  }

  function setSignatureRoleLocked(role, locked) {
    const isHse = role === 'hse';
    const signBox = isHse ? signHseBox : signPenyeliaBox;
    const clearButton = isHse ? clearHseButton : clearPenyeliaButton;
    const uploadInput = isHse ? uploadHseInput : uploadPenyeliaInput;
    if (clearButton) clearButton.disabled = !!locked;
    if (uploadInput) uploadInput.disabled = !!locked;
    if (signBox) {
      if (locked) signBox.classList.add('signature-box-disabled');
      else signBox.classList.remove('signature-box-disabled');
    }
  }

  function setPengawasSignatureLocked(locked) {
    if (clearPengawasButton) clearPengawasButton.disabled = !!locked;
    if (uploadPengawasInput) uploadPengawasInput.disabled = !!locked;
    if (signPengawasBox) {
      if (locked) signPengawasBox.classList.add('signature-box-disabled');
      else signPengawasBox.classList.remove('signature-box-disabled');
    }
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
    requestAnimationFrame(function () {
      if (signPengawas && typeof signPengawas.resize === 'function') signPengawas.resize();
      if (signHse && typeof signHse.resize === 'function') signHse.resize();
      if (signPenyelia && typeof signPenyelia.resize === 'function') signPenyelia.resize();
    });
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

    function drawImageContain(image) {
      const rect = canvas.getBoundingClientRect();
      const canvasWidth = rect.width;
      const canvasHeight = rect.height;
      const imageWidth = image.naturalWidth || image.width || 1;
      const imageHeight = image.naturalHeight || image.height || 1;
      const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
      const drawWidth = imageWidth * scale;
      const drawHeight = imageHeight * scale;
      const offsetX = (canvasWidth - drawWidth) / 2;
      const offsetY = (canvasHeight - drawHeight) / 2;

      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvasWidth, canvasHeight);
      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      hasStroke = true;
    }

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
      context.lineWidth = 3;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = '#000000';
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, rect.width, rect.height);

      if (previous && previous.length > 0) {
        const image = new Image();
        image.onload = function () {
          drawImageContain(image);
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
        drawImageContain(image);
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
      setDataUrl: setDataUrl,
      resize: resizeCanvas
    };
  }

  const signPengawas = initSignaturePad('jsa-sign-pengawas', 'jsa-clear-pengawas');
  const signHse = initSignaturePad('jsa-sign-hse', 'jsa-clear-hse');
  const signPenyelia = initSignaturePad('jsa-sign-penyelia', 'jsa-clear-penyelia');

  function setSignaturePreview(previewElement, dataUrl) {
    if (!previewElement) return;
    const value = String(dataUrl || '').trim();
    if (!value) {
      previewElement.removeAttribute('src');
      previewElement.classList.add('hidden');
      return;
    }
    previewElement.src = value;
    previewElement.classList.remove('hidden');
  }

  function bindSignatureUpload(input, signPad, previewElement) {
    if (!input || !signPad) return;
    input.addEventListener('change', function () {
      const file = input.files && input.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function () {
        signPad.setDataUrl(reader.result);
        setSignaturePreview(previewElement, reader.result);
        input.value = '';
      };
      reader.onerror = function () {
        alert('Gagal membaca file tanda tangan.');
        input.value = '';
      };
      reader.readAsDataURL(file);
    });
  }

  bindSignatureUpload(uploadPengawasInput, signPengawas, previewPengawas);
  bindSignatureUpload(uploadHseInput, signHse, previewHse);
  bindSignatureUpload(uploadPenyeliaInput, signPenyelia, previewPenyelia);

  if (clearPengawasButton) {
    clearPengawasButton.addEventListener('click', function () {
      setSignaturePreview(previewPengawas, '');
    });
  }
  if (clearHseButton) {
    clearHseButton.addEventListener('click', function () {
      setSignaturePreview(previewHse, '');
    });
  }
  if (clearPenyeliaButton) {
    clearPenyeliaButton.addEventListener('click', function () {
      setSignaturePreview(previewPenyelia, '');
    });
  }

  function applyValidationRoleState(role, clearWhenNotApproved) {
    const isHse = role === 'hse';
    const validationInput = isHse ? validasiHseInput : validasiPenyeliaInput;
    const noteWrap = isHse ? catatanHseWrap : catatanPenyeliaWrap;
    const noteInput = isHse ? catatanHseInput : catatanPenyeliaInput;
    const dateInput = isHse ? tanggalHseInput : tanggalPenyeliaInput;
    const signPad = isHse ? signHse : signPenyelia;
    const status = String((validationInput && validationInput.value) || '').trim();
    const approved = status === 'Approved';
    const notApproved = status === 'Not Approved';
    const lockedByRole = !!lockedRoleByAssignment[isHse ? 'hse' : 'penyelia'];

    if (approved) {
      if (noteWrap) noteWrap.classList.add('hidden');
      if (noteInput) {
        noteInput.required = false;
        noteInput.value = '';
        noteInput.disabled = true;
      }
      if (dateInput) {
        dateInput.value = todayValue();
        dateInput.readOnly = true;
        dateInput.disabled = lockedByRole;
        dateInput.required = true;
      }
      setSignatureRoleLocked(role, lockedByRole);
      return;
    }

    if (notApproved) {
      if (noteWrap) noteWrap.classList.remove('hidden');
      if (noteInput) {
        noteInput.required = true;
        noteInput.disabled = lockedByRole;
      }
      if (dateInput) {
        dateInput.required = false;
        dateInput.readOnly = true;
        dateInput.disabled = true;
        dateInput.value = '';
      }
      setSignatureRoleLocked(role, true);
      if (clearWhenNotApproved && signPad) signPad.clear();
      return;
    }

    if (noteWrap) noteWrap.classList.add('hidden');
    if (noteInput) {
      noteInput.required = false;
      noteInput.disabled = true;
      noteInput.value = '';
    }
    if (dateInput) {
      dateInput.required = false;
      dateInput.readOnly = true;
      dateInput.disabled = true;
      dateInput.value = '';
    }
    setSignatureRoleLocked(role, true);
    if (clearWhenNotApproved && signPad) signPad.clear();
  }

  function collectApdSelections() {
    const checked = Array.from(apdList.querySelectorAll('input[type="checkbox"]:checked'));
    return checked.map(function (item) {
      const value = String(item.value || '').trim();
      if (value !== 'Lainnya') return value;
      const detail = String(apdLainnyaInput.value || '').trim();
      return detail ? ('Lainnya: ' + detail) : 'Lainnya';
    });
  }

  function applyAssignmentLocks(source, currentUser) {
    const row = source || {};
    const user = currentUser || null;

    const hseAssigned = isCurrentUserAssignedToRole('hse', row, user);
    const penyeliaAssigned = isCurrentUserAssignedToRole('penyelia', row, user);
    const hseDone = isValidationCompleted('hse', row);

    lockedRoleByAssignment.hse = !hseAssigned;
    lockedRoleByAssignment.penyelia = !penyeliaAssigned || !hseDone;

    setFieldsDisabled([validasiHseInput], lockedRoleByAssignment.hse);
    setFieldsDisabled([validasiPenyeliaInput], lockedRoleByAssignment.penyelia);
    applyValidationRoleState('hse', false);
    applyValidationRoleState('penyelia', false);
  }

  function applyValidationMode(record, currentUser) {
    if (!validationMode) {
      if (submitButton) submitButton.textContent = 'Simpan JSA';
      setPengawasSignatureLocked(false);
      if (validationModeBanner) {
        if (reworkMode && reworkMode.message) {
          validationModeBanner.classList.remove('hidden');
          validationModeBanner.innerHTML = '<p class="subtitle"><strong>Mode Revisi:</strong> ' + escapeHtml(reworkMode.message) + '</p>';
        } else {
          validationModeBanner.classList.add('hidden');
          validationModeBanner.innerHTML = '<p class="subtitle"><strong>Mode Validasi:</strong> Anda sedang mengisi tahap validasi.</p>';
        }
      }
      Array.from(form.querySelectorAll('input, select, textarea, button')).forEach(function (element) {
        if (!element) return;
        if (element.type === 'hidden') return;
        element.disabled = false;
      });

      if (reworkMode) {
        setFieldsDisabled([
          validasiHseInput,
          tanggalHseInput,
          catatanHseInput,
          validasiPenyeliaInput,
          tanggalPenyeliaInput,
          catatanPenyeliaInput,
          clearHseButton,
          uploadHseInput,
          clearPenyeliaButton,
          uploadPenyeliaInput
        ], true);
        setSignatureRoleLocked('hse', true);
        setSignatureRoleLocked('penyelia', true);
      }
      return;
    }

    const stage = validationMode.stage;
    setPengawasSignatureLocked(true);
    if (validationModeBanner) {
      validationModeBanner.classList.remove('hidden');
      validationModeBanner.innerHTML = '<p class="subtitle"><strong>Mode Validasi:</strong> Anda sedang mengisi validasi ' + (stage === 'hse' ? 'HSE' : 'Penyelia') + '.</p>';
    }
    const assigned = isCurrentUserAssignedToRole(stage, record, currentUser);
    if (!assigned) {
      alert('Anda tidak memiliki akses untuk mengisi validasi pada tahap ini.');
      validationMode = null;
      closeForm();
      return;
    }

    if (stage === 'penyelia' && !isValidationCompleted('hse', record)) {
      alert('Validasi by HSE harus diselesaikan terlebih dahulu sebelum validasi by Penyelia.');
      validationMode = null;
      closeForm();
      return;
    }

    const allowedIds = stage === 'hse'
      ? ['jsa-validasi-hse', 'jsa-tanggal-hse', 'jsa-catatan-hse', 'jsa-clear-hse', 'jsa-upload-hse']
      : ['jsa-validasi-penyelia', 'jsa-tanggal-penyelia', 'jsa-catatan-penyelia', 'jsa-clear-penyelia', 'jsa-upload-penyelia'];
    const allowLangkahEditing = stage === 'hse';

    Array.from(form.querySelectorAll('input, select, textarea, button')).forEach(function (element) {
      if (!element) return;
      if (element.type === 'submit' || element.id === 'jsa-cancel-btn') return;
      if (allowLangkahEditing) {
        if (element.id === 'jsa-add-langkah-btn') {
          element.disabled = false;
          return;
        }
        if (element.closest && element.closest('#jsa-langkah-list')) {
          element.disabled = false;
          return;
        }
      }
      if (element.id && allowedIds.indexOf(element.id) >= 0) {
        element.disabled = false;
        return;
      }
      element.disabled = true;
    });

    setSignatureRoleLocked(stage, false);
    if (submitButton) submitButton.textContent = stage === 'hse' ? 'Simpan Validasi HSE' : 'Simpan Validasi Penyelia';
  }

  function refreshLangkahLabels() {
    const cards = Array.from(langkahList.querySelectorAll('.jsa-step-item'));
    const total = cards.length;
    cards.forEach(function (card, index) {
      const title = card.querySelector('[data-role="step-title"]');
      if (title) title.textContent = 'Langkah Kerja ' + (index + 1);

      const moveUpButton = card.querySelector('button[data-action="move-langkah-up"]');
      const moveDownButton = card.querySelector('button[data-action="move-langkah-down"]');

      if (moveUpButton) moveUpButton.disabled = index === 0;
      if (moveDownButton) moveDownButton.disabled = index === total - 1;
    });
  }

  function normalizePengendalianSet(item) {
    const tindakanList = Array.isArray(item.tindakanPengendalian) ? item.tindakanPengendalian : [];
    const penanggungList = Array.isArray(item.penanggungJawab) ? item.penanggungJawab : [];
    const keteranganList = Array.isArray(item.keterangan)
      ? item.keterangan
      : (String(item.keterangan || '').trim() ? [String(item.keterangan || '').trim()] : []);

    const rowCount = Math.max(tindakanList.length, penanggungList.length, keteranganList.length, 1);
    const rows = [];
    for (let index = 0; index < rowCount; index += 1) {
      rows.push({
        tindakan: String(tindakanList[index] || ''),
        penanggungJawab: String(penanggungList[index] || ''),
        keterangan: String(keteranganList[index] || '')
      });
    }
    return rows;
  }

  function createPengendalianSetItem(value) {
    const row = value || {};
    const wrapper = document.createElement('div');
    wrapper.className = 'jsa-control-set';

    const grid = document.createElement('div');
    grid.className = 'jsa-control-set-grid';

    const tindakanWrap = document.createElement('div');
    tindakanWrap.className = 'field-wrap';
    const tindakanLabel = document.createElement('label');
    tindakanLabel.textContent = 'Tindakan Pengendalian Resiko / Pengendalian Kecelakaan';
    const tindakanInput = document.createElement('textarea');
    tindakanInput.className = 'jsa-tindakan-input';
    tindakanInput.placeholder = 'Isi tindakan pengendalian resiko / pengendalian kecelakaan';
    tindakanInput.rows = 3;
    tindakanInput.value = String(row.tindakan || '');
    tindakanWrap.appendChild(tindakanLabel);
    tindakanWrap.appendChild(tindakanInput);

    const penanggungWrap = document.createElement('div');
    penanggungWrap.className = 'field-wrap';
    const penanggungLabel = document.createElement('label');
    penanggungLabel.textContent = 'Penanggung Jawab';
    const penanggungInput = document.createElement('input');
    penanggungInput.type = 'text';
    penanggungInput.className = 'jsa-penanggung-input';
    penanggungInput.placeholder = 'Isi nama penanggung jawab';
    penanggungInput.value = String(row.penanggungJawab || '');
    penanggungWrap.appendChild(penanggungLabel);
    penanggungWrap.appendChild(penanggungInput);

    const keteranganWrap = document.createElement('div');
    keteranganWrap.className = 'field-wrap';
    const keteranganLabel = document.createElement('label');
    keteranganLabel.textContent = 'Keterangan';
    const keteranganInput = document.createElement('textarea');
    keteranganInput.className = 'jsa-keterangan-input';
    keteranganInput.placeholder = 'Isi keterangan tambahan';
    keteranganInput.rows = 3;
    keteranganInput.value = String(row.keterangan || '');
    keteranganWrap.appendChild(keteranganLabel);
    keteranganWrap.appendChild(keteranganInput);

    grid.appendChild(tindakanWrap);
    grid.appendChild(penanggungWrap);
    grid.appendChild(keteranganWrap);

    const actionWrap = document.createElement('div');
    actionWrap.className = 'form-inline-actions';
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'table-btn danger';
    removeButton.dataset.action = 'remove-pengendalian-set';
    removeButton.textContent = 'Hapus Set';
    actionWrap.appendChild(removeButton);

    wrapper.appendChild(grid);
    wrapper.appendChild(actionWrap);
    return wrapper;
  }

  function appendPengendalianSets(container, values) {
    const rows = Array.isArray(values) && values.length > 0 ? values : [{ tindakan: '', penanggungJawab: '', keterangan: '' }];
    rows.forEach(function (value) {
      container.appendChild(createPengendalianSetItem(value));
    });
  }

  function normalizeBahayaItem(raw) {
    if (typeof raw === 'string') {
      return {
        bahaya: raw,
        pengendalianSet: [{ tindakan: '', penanggungJawab: '', keterangan: '' }]
      };
    }

    const item = raw || {};
    const pengendalianSet = Array.isArray(item.pengendalianSet) && item.pengendalianSet.length > 0
      ? item.pengendalianSet.map(function (row) {
          return {
            tindakan: String((row && row.tindakan) || ''),
            penanggungJawab: String((row && row.penanggungJawab) || ''),
            keterangan: String((row && row.keterangan) || '')
          };
        })
      : normalizePengendalianSet(item);
    return {
      bahaya: String(item.bahaya || ''),
      pengendalianSet: pengendalianSet
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

    const pengendalianWrap = document.createElement('div');
    pengendalianWrap.className = 'jsa-sub-block';
    const pengendalianLabel = document.createElement('label');
    pengendalianLabel.textContent = 'Set Pengendalian (Tindakan / Penanggung Jawab / Keterangan)';
    const pengendalianList = document.createElement('div');
    pengendalianList.className = 'jsa-control-set-list';
    appendPengendalianSets(pengendalianList, item.pengendalianSet);
    const pengendalianActionWrap = document.createElement('div');
    pengendalianActionWrap.className = 'form-inline-actions';
    const addPengendalianButton = document.createElement('button');
    addPengendalianButton.type = 'button';
    addPengendalianButton.className = 'ghost';
    addPengendalianButton.dataset.action = 'add-pengendalian-set';
    addPengendalianButton.textContent = 'Tambah Set Pengendalian';
    pengendalianActionWrap.appendChild(addPengendalianButton);
    pengendalianWrap.appendChild(pengendalianLabel);
    pengendalianWrap.appendChild(pengendalianList);
    pengendalianWrap.appendChild(pengendalianActionWrap);

    wrapper.appendChild(head);
    wrapper.appendChild(pengendalianWrap);
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

    const moveUpButton = document.createElement('button');
    moveUpButton.type = 'button';
    moveUpButton.className = 'table-btn';
    moveUpButton.dataset.action = 'move-langkah-up';
    moveUpButton.textContent = 'Naik';

    const moveDownButton = document.createElement('button');
    moveDownButton.type = 'button';
    moveDownButton.className = 'table-btn';
    moveDownButton.dataset.action = 'move-langkah-down';
    moveDownButton.textContent = 'Turun';

    const headerActions = document.createElement('div');
    headerActions.className = 'form-inline-actions';
    headerActions.appendChild(moveUpButton);
    headerActions.appendChild(moveDownButton);
    headerActions.appendChild(removeStepButton);

    header.appendChild(title);
    header.appendChild(headerActions);

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
        const pengendalianSet = Array.from(hazardCard.querySelectorAll('.jsa-control-set')).map(function (setItem) {
          return {
            tindakan: String((setItem.querySelector('.jsa-tindakan-input') || {}).value || '').trim(),
            penanggungJawab: String((setItem.querySelector('.jsa-penanggung-input') || {}).value || '').trim(),
            keterangan: String((setItem.querySelector('.jsa-keterangan-input') || {}).value || '').trim()
          };
        });

        const tindakan = pengendalianSet.map(function (item) { return item.tindakan; });
        const penanggung = pengendalianSet.map(function (item) { return item.penanggungJawab; });
        const keterangan = pengendalianSet.map(function (item) { return item.keterangan; });

        return {
          bahaya: bahayaValue,
          pengendalianSet: pengendalianSet,
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
    validasiHseInput.value = '';
    catatanHseInput.value = '';
    tanggalHseInput.value = '';
    validasiPenyeliaInput.value = '';
    catatanPenyeliaInput.value = '';
    tanggalPenyeliaInput.value = '';
    berlakuSampaiInput.value = '';

    applyDateMaximumToday();
    syncBerlakuSampaiWithTanggal();

    signPengawas.clear();
    signHse.clear();
    signPenyelia.clear();
    setSignaturePreview(previewPengawas, '');
    setSignaturePreview(previewHse, '');
    setSignaturePreview(previewPenyelia, '');
    if (uploadPengawasInput) uploadPengawasInput.value = '';
    if (uploadHseInput) uploadHseInput.value = '';
    if (uploadPenyeliaInput) uploadPenyeliaInput.value = '';
    applyValidationRoleState('hse', true);
    applyValidationRoleState('penyelia', true);
    applyAssignmentLocks({
      diperiksaId: String(diperiksaInput.value || '').trim(),
      disetujuiId: String(disetujuiInput.value || '').trim(),
      validasiHse: String(validasiHseInput.value || '').trim(),
      tanggalHse: String(tanggalHseInput.value || '').trim(),
      ttdHse: ''
    }, user);
  }

  function validatePayload(payload) {
    const maxDate = todayValue();

    if (!payload.jenis) return 'Jenis JSA wajib dipilih.';
    if (!payload.tanggal) return 'Tanggal wajib diisi.';
    if (payload.tanggal > maxDate) return 'Tanggal tidak boleh melebihi hari ini.';
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
    if (payload.validasiHse === 'Not Approved' && !payload.catatanHse) return 'Catatan by HSE wajib diisi saat Not Approved.';
    if (payload.validasiHse === 'Approved') {
      if (!payload.tanggalHse) return 'Tanggal by HSE wajib diisi.';
      if (payload.tanggalHse > maxDate) return 'Tanggal by HSE tidak boleh melebihi hari ini.';
      if (!payload.ttdHse) return 'Tanda tangan HSE wajib diisi.';
    }
    if (!payload.disetujuiId) return 'Disetujui oleh wajib dipilih.';
    if (payload.validasiPenyelia === 'Not Approved' && !payload.catatanPenyelia) return 'Catatan by Penyelia wajib diisi saat Not Approved.';
    if (payload.validasiPenyelia === 'Approved') {
      if (!payload.tanggalPenyelia) return 'Tanggal by Penyelia wajib diisi.';
      if (payload.tanggalPenyelia > maxDate) return 'Tanggal by Penyelia tidak boleh melebihi hari ini.';
      if (!payload.ttdPenyelia) return 'Tanda tangan Penyelia wajib diisi.';
    }
    if (payload.validasiHse && payload.validasiHse !== 'Approved' && payload.validasiHse !== 'Not Approved') {
      return 'Nilai Validasi by HSE tidak valid.';
    }
    if (payload.validasiPenyelia && payload.validasiPenyelia !== 'Approved' && payload.validasiPenyelia !== 'Not Approved') {
      return 'Nilai Validasi by Penyelia tidak valid.';
    }
    if (!payload.berlakuSampai) return 'JSA ini berlaku sampai wajib diisi.';
    if (!payload.ttdPengawas) return 'Tanda tangan Pengawas wajib diisi.';
    return '';
  }

  function renderRows() {
    const session = getSession();
    const canManage = !!(session && session.role === 'Super Admin');
    const rows = readList(JSA_KEY);
    tbody.innerHTML = '';

    rows.forEach(function (item) {
      const canExport = isValidationCompleted('hse', item) && isValidationCompleted('penyelia', item);
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
          (canExport ? '<button type="button" class="table-btn" data-action="export" data-id="' + item.id + '">Export PDF</button>' : '') +
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
          '<td class="preserve-space">' + escapeHtml(printableValue(tindakan.filter(function (item) { return String(item || '').trim(); }).join('\n'))) + '</td>' +
          '<td>' + escapeHtml(printableValue(penanggung.filter(function (item) { return String(item || '').trim(); }).join('; '))) + '</td>' +
            '<td class="preserve-space">' + escapeHtml(printableValue(keterangan.filter(function (item) { return String(item || '').trim(); }).join('\n'))) + '</td>' +
          '</tr>';
      });
    });

    return html;
  }

  function buildJsaPdfHtml(target) {
    const apdText = Array.isArray(target.apd) ? target.apd.join(', ') : '';
    const langkahRows = buildLangkahKerjaTableRows(target);
    const hseApproved = String(target.validasiHse || '') === 'Approved';
    const penyeliaApproved = String(target.validasiPenyelia || '') === 'Approved';
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
      '.preserve-space{white-space:pre-wrap;}' +
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
        '<tr><td>No JSA</td><td>' + escapeHtml(printableValue(target.noJsa)) + '</td></tr>' +
        '<tr><td>Tanggal</td><td>' + escapeHtml(printableValue(target.tanggal)) + '</td></tr>' +
        '<tr><td>JSA ini berlaku sampai</td><td>' + escapeHtml(printableValue(target.berlakuSampai)) + '</td></tr>' +
        '<tr><td>Departemen</td><td>' + escapeHtml(printableValue(target.departemen)) + '</td></tr>' +
        '<tr><td>Perusahaan</td><td>' + escapeHtml(printableValue(target.perusahaan)) + '</td></tr>' +
        '<tr><td>Alat Pelindung Diri</td><td>' + escapeHtml(printableValue(apdText)) + '</td></tr>' +
        '<tr><td>JSA Disiapkan Oleh</td><td>' + escapeHtml(printableValue(target.disiapkanOleh)) + '</td></tr>' +
        '<tr><td>Diperiksa / Dikaji Oleh</td><td>' + escapeHtml(printableValue(target.diperiksaLabel)) + '</td></tr>' +
        '<tr><td>Disetujui Oleh</td><td>' + escapeHtml(printableValue(target.disetujuiLabel)) + '</td></tr>' +
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
            '<div>' + (hseApproved ? hseSign : '-') + '</div>' +
            '<div class="sig-date">Tanggal: ' + escapeHtml(printableValue(hseApproved ? target.tanggalHse : '-')) + '</div>' +
          '</td>' +
          '<td>' +
            '<div class="sig-title">Disetujui oleh</div>' +
            '<div class="sig-name">' + escapeHtml(printableValue(target.disetujuiLabel)) + '</div>' +
            '<div>' + (penyeliaApproved ? penyeliaSign : '-') + '</div>' +
            '<div class="sig-date">Tanggal: ' + escapeHtml(printableValue(penyeliaApproved ? target.tanggalPenyelia : '-')) + '</div>' +
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

  function fillFormForEdit(target, options) {
    const editOptions = options || {};
    const isRework = !!editOptions.rework;

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
    validasiHseInput.value = isRework ? '' : (target.validasiHse || '');
    catatanHseInput.value = isRework ? '' : (target.catatanHse || '');
    tanggalHseInput.value = isRework ? '' : (target.tanggalHse || '');
    validasiPenyeliaInput.value = isRework ? '' : (target.validasiPenyelia || '');
    catatanPenyeliaInput.value = isRework ? '' : (target.catatanPenyelia || '');
    tanggalPenyeliaInput.value = isRework ? '' : (target.tanggalPenyelia || '');
    berlakuSampaiInput.value = target.berlakuSampai || '';

    applyDateMaximumToday();
    syncBerlakuSampaiWithTanggal();

    signPengawas.setDataUrl(target.ttdPengawas || '');
    signHse.setDataUrl(isRework ? '' : (target.ttdHse || ''));
    signPenyelia.setDataUrl(isRework ? '' : (target.ttdPenyelia || ''));
    setSignaturePreview(previewPengawas, target.ttdPengawas || '');
    setSignaturePreview(previewHse, isRework ? '' : (target.ttdHse || ''));
    setSignaturePreview(previewPenyelia, isRework ? '' : (target.ttdPenyelia || ''));
    if (uploadPengawasInput) uploadPengawasInput.value = '';
    if (uploadHseInput) uploadHseInput.value = '';
    if (uploadPenyeliaInput) uploadPenyeliaInput.value = '';
    const session = getSession();
    const currentUser = session ? getCurrentUser(session) : null;
    applyAssignmentLocks(target, currentUser);
    applyValidationMode(target, currentUser);
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

    if (editingId && validationMode) {
      const rows = readList(JSA_KEY);
      const idx = rows.findIndex(function (item) { return item.id === editingId; });
      if (idx < 0) {
        alert('Data JSA tidak ditemukan.');
        return;
      }

      const current = rows[idx] || {};
      const stage = validationMode.stage;
      const assigned = isCurrentUserAssignedToRole(stage, current, user);
      if (!assigned) {
        alert('Anda tidak memiliki akses untuk mengisi validasi pada tahap ini.');
        return;
      }

      if (stage === 'penyelia' && !isValidationCompleted('hse', current)) {
        alert('Validasi by HSE harus diselesaikan terlebih dahulu sebelum validasi by Penyelia.');
        return;
      }

      const maxDate = todayValue();

      if (stage === 'hse') {
        const status = String(validasiHseInput.value || '').trim();
        const note = String(catatanHseInput.value || '').trim();
        const date = status === 'Approved' ? todayValue() : '';
        const sign = status === 'Approved' ? (signHse.isEmpty() ? '' : signHse.getDataUrl()) : '';

        if (!status) {
          alert('Validasi by HSE wajib dipilih.');
          return;
        }
        if (status === 'Not Approved' && !note) {
          alert('Catatan by HSE wajib diisi saat Not Approved.');
          return;
        }
        if (status === 'Approved') {
          if (!date) {
            alert('Tanggal by HSE wajib diisi.');
            return;
          }
          if (date > maxDate) {
            alert('Tanggal by HSE tidak boleh melebihi hari ini.');
            return;
          }
          if (!sign) {
            alert('Tanda tangan HSE wajib diisi.');
            return;
          }
        }

        rows[idx] = Object.assign({}, current, {
          validasiHse: status,
          catatanHse: status === 'Not Approved' ? note : '',
          tanggalHse: status === 'Approved' ? date : '',
          ttdHse: status === 'Approved' ? sign : ''
        });
      }

      if (stage === 'penyelia') {
        const status = String(validasiPenyeliaInput.value || '').trim();
        const note = String(catatanPenyeliaInput.value || '').trim();
        const date = status === 'Approved' ? todayValue() : '';
        const sign = status === 'Approved' ? (signPenyelia.isEmpty() ? '' : signPenyelia.getDataUrl()) : '';

        if (!status) {
          alert('Validasi by Penyelia wajib dipilih.');
          return;
        }
        if (status === 'Not Approved' && !note) {
          alert('Catatan by Penyelia wajib diisi saat Not Approved.');
          return;
        }
        if (status === 'Approved') {
          if (!date) {
            alert('Tanggal by Penyelia wajib diisi.');
            return;
          }
          if (date > maxDate) {
            alert('Tanggal by Penyelia tidak boleh melebihi hari ini.');
            return;
          }
          if (!sign) {
            alert('Tanda tangan Penyelia wajib diisi.');
            return;
          }
        }

        rows[idx] = Object.assign({}, current, {
          validasiPenyelia: status,
          catatanPenyelia: status === 'Not Approved' ? note : '',
          tanggalPenyelia: status === 'Approved' ? date : '',
          ttdPenyelia: status === 'Approved' ? sign : ''
        });
      }

      writeList(JSA_KEY, rows);
      alert('Validasi JSA berhasil disimpan.');
      const latest = rows[idx];
      validationMode = null;
      if (addButton) addButton.disabled = false;
      fillFormForEdit(latest);
      renderRows();
      closeForm();
      return;
    }

    if (editingId) {
      if (reworkMode) {
        const existingRows = readList(JSA_KEY);
        const existing = existingRows.find(function (item) { return item.id === editingId; }) || null;
        if (!existing || !isCurrentUserCreator(existing, user)) {
          alert('Aksi revisi JSA hanya dapat dilakukan oleh user pembuat.');
          return;
        }
      }

      const roleSession = getSession();
      if ((!roleSession || roleSession.role !== 'Super Admin') && !reworkMode) {
        alert('Aksi ubah data JSA hanya dapat dilakukan oleh Super Admin.');
        return;
      }
    }

    const diperiksaOption = diperiksaInput.options[diperiksaInput.selectedIndex];
    const disetujuiOption = disetujuiInput.options[disetujuiInput.selectedIndex];
    const validasiHse = reworkMode ? '' : String(validasiHseInput.value || '').trim();
    const validasiPenyelia = reworkMode ? '' : String(validasiPenyeliaInput.value || '').trim();
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
      validasiHse: validasiHse,
      catatanHse: reworkMode ? '' : String(catatanHseInput.value || '').trim(),
      ttdHse: validasiHse === 'Approved' ? (signHse.isEmpty() ? '' : signHse.getDataUrl()) : '',
      tanggalHse: validasiHse === 'Approved' ? String(tanggalHseInput.value || '').trim() : '',
      disetujuiId: String(disetujuiInput.value || '').trim(),
      disetujuiLabel: String(disetujuiOption ? disetujuiOption.textContent : '').trim(),
      validasiPenyelia: validasiPenyelia,
      catatanPenyelia: reworkMode ? '' : String(catatanPenyeliaInput.value || '').trim(),
      ttdPenyelia: validasiPenyelia === 'Approved' ? (signPenyelia.isEmpty() ? '' : signPenyelia.getDataUrl()) : '',
      tanggalPenyelia: validasiPenyelia === 'Approved' ? String(tanggalPenyeliaInput.value || '').trim() : '',
      berlakuSampai: addDaysToIsoDate(String(tanggalInput.value || '').trim(), 30)
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

    reworkMode = null;
    validationMode = null;
    if (addButton) addButton.disabled = false;

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
        'Validasi by HSE: ' + (target.validasiHse || '-'),
        'Catatan by HSE: ' + (target.validasiHse === 'Not Approved' ? (target.catatanHse || '-') : '-'),
        'Tanggal by HSE: ' + (target.tanggalHse || '-'),
        'Disetujui oleh: ' + (target.disetujuiLabel || '-'),
        'Validasi by Penyelia: ' + (target.validasiPenyelia || '-'),
        'Catatan by Penyelia: ' + (target.validasiPenyelia === 'Not Approved' ? (target.catatanPenyelia || '-') : '-'),
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
      if (!(isValidationCompleted('hse', target) && isValidationCompleted('penyelia', target))) {
        alert('Export PDF hanya tersedia setelah validasi HSE dan Penyelia lengkap.');
        return;
      }
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

  if (validasiHseInput) {
    validasiHseInput.addEventListener('change', function () {
      applyValidationRoleState('hse', true);
    });
  }

  if (validasiPenyeliaInput) {
    validasiPenyeliaInput.addEventListener('change', function () {
      applyValidationRoleState('penyelia', true);
    });
  }

  if (diperiksaInput) {
    diperiksaInput.addEventListener('change', function () {
      const session = getSession();
      const currentUser = session ? getCurrentUser(session) : null;
      applyAssignmentLocks({
        diperiksaId: String(diperiksaInput.value || '').trim(),
        disetujuiId: String(disetujuiInput.value || '').trim(),
        validasiHse: String(validasiHseInput.value || '').trim(),
        tanggalHse: String(tanggalHseInput.value || '').trim(),
        ttdHse: signHse.isEmpty() ? '' : signHse.getDataUrl()
      }, currentUser);
    });
  }

  if (disetujuiInput) {
    disetujuiInput.addEventListener('change', function () {
      const session = getSession();
      const currentUser = session ? getCurrentUser(session) : null;
      applyAssignmentLocks({
        diperiksaId: String(diperiksaInput.value || '').trim(),
        disetujuiId: String(disetujuiInput.value || '').trim(),
        validasiHse: String(validasiHseInput.value || '').trim(),
        tanggalHse: String(tanggalHseInput.value || '').trim(),
        ttdHse: signHse.isEmpty() ? '' : signHse.getDataUrl()
      }, currentUser);
    });
  }

  if (tanggalInput) {
    tanggalInput.addEventListener('change', function () {
      syncBerlakuSampaiWithTanggal();
    });
    tanggalInput.addEventListener('input', function () {
      syncBerlakuSampaiWithTanggal();
    });
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

      if (action === 'add-pengendalian-set') {
        const hazardCard = button.closest('.jsa-bahaya-item');
        if (!hazardCard) return;
        const list = hazardCard.querySelector('.jsa-control-set-list');
        if (!list) return;
        list.appendChild(createPengendalianSetItem({ tindakan: '', penanggungJawab: '', keterangan: '' }));
        return;
      }

      if (action === 'remove-pengendalian-set') {
        const list = button.closest('.jsa-control-set-list');
        const rows = list ? list.querySelectorAll('.jsa-control-set') : [];
        if (!rows || rows.length <= 1) {
          alert('Minimal satu Set Pengendalian harus ada di setiap Potensi Bahaya / Insiden.');
          return;
        }
        const row = button.closest('.jsa-control-set');
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
        return;
      }

      if (action === 'move-langkah-up') {
        const previous = stepCard.previousElementSibling;
        if (!previous) return;
        langkahList.insertBefore(stepCard, previous);
        refreshLangkahLabels();
        return;
      }

      if (action === 'move-langkah-down') {
        const next = stepCard.nextElementSibling;
        if (!next) return;
        langkahList.insertBefore(next, stepCard);
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
      validationMode = null;
      reworkMode = null;
      if (addButton) addButton.disabled = false;
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
      validationMode = null;
      reworkMode = null;
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
    applyDateMaximumToday();
    resetForm(user);
    closeForm();
    renderRows();

    const request = getJsaOpenRequest();
    if (!request) return;

    const rows = readList(JSA_KEY);
    const target = rows.find(function (item) { return item.id === request.id; });
    if (!target) {
      alert('Data JSA tujuan notifikasi tidak ditemukan.');
      return;
    }

    editingId = target.id || '';

    if (request.mode === 'validate') {
      reworkMode = null;
      validationMode = { stage: request.stage, id: request.id };
      fillFormForEdit(target);
      openForm();
      if (addButton) addButton.disabled = true;
      return;
    }

    const isCreator = isCurrentUserCreator(target, user);
    if (!isCreator) {
      alert('Notifikasi revisi JSA hanya dapat dibuka oleh user pembuat.');
      return;
    }

    const notes = [];
    if (String(target.validasiHse || '').trim() === 'Not Approved' && String(target.catatanHse || '').trim()) {
      notes.push('Catatan HSE: ' + String(target.catatanHse || '').trim());
    }
    if (String(target.validasiPenyelia || '').trim() === 'Not Approved' && String(target.catatanPenyelia || '').trim()) {
      notes.push('Catatan Penyelia: ' + String(target.catatanPenyelia || '').trim());
    }

    validationMode = null;
    reworkMode = {
      stage: request.stage || '',
      message: notes.length > 0
        ? ('Perlu revisi JSA. ' + notes.join(' | '))
        : 'Perlu revisi JSA berdasarkan hasil validasi sebelumnya.'
    };
    fillFormForEdit(target, { rework: true });
    openForm();
    if (addButton) addButton.disabled = true;
  }

  init();
})();
