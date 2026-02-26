(function () {
  const SESSION_KEY = 'aios_session';
  const DEPT_KEY = 'aios_departments';

  const form = document.getElementById('dept-form');
  const addButton = document.getElementById('add-dept-btn');
  const cancelButton = document.getElementById('cancel-dept-btn');
  const idInput = document.getElementById('dept-id');
  const nameInput = document.getElementById('dept-name');
  const tbody = document.getElementById('dept-tbody');

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function guardAccess() {
    const session = getSession();
    if (!session || session.role !== 'Super Admin') {
      alert('Akses ditolak. Hanya Super Admin.');
      window.location.href = '../index.html';
      return false;
    }
    return true;
  }

  function readData() {
    try {
      const raw = localStorage.getItem(DEPT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_error) {
      return [];
    }
  }

  function writeData(rows) {
    localStorage.setItem(DEPT_KEY, JSON.stringify(rows));
  }

  function renderRows() {
    const rows = readData();
    tbody.innerHTML = '';

    rows.forEach(function (item) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + (item.name || '') + '</td>' +
        '<td><button type="button" class="table-btn" data-action="edit" data-id="' + item.id + '">Ubah</button> ' +
        '<button type="button" class="table-btn danger" data-action="delete" data-id="' + item.id + '">Hapus</button></td>';
      tbody.appendChild(tr);
    });
  }

  function resetForm() {
    idInput.value = '';
    nameInput.value = '';
  }

  function openForm() {
    form.classList.remove('hidden');
  }

  function closeForm() {
    form.classList.add('hidden');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const id = idInput.value || 'd-' + Date.now();
    const name = String(nameInput.value || '').trim();
    if (!name) {
      alert('Departemen wajib diisi.');
      return;
    }

    const rows = readData();
    const idx = rows.findIndex(function (item) { return item.id === id; });
    const payload = { id: id, name: name };

    if (idx >= 0) rows[idx] = payload;
    else rows.push(payload);

    writeData(rows);
    renderRows();
    resetForm();
    closeForm();
  });

  tbody.addEventListener('click', function (event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    const rows = readData();
    const target = rows.find(function (item) { return item.id === id; });
    if (!target) return;

    if (action === 'edit') {
      openForm();
      idInput.value = target.id;
      nameInput.value = target.name || '';
      return;
    }

    if (action === 'delete') {
      if (!confirm('Hapus departemen ini?')) return;
      const nextRows = rows.filter(function (item) { return item.id !== id; });
      writeData(nextRows);
      renderRows();
      resetForm();
      closeForm();
    }
  });

  if (addButton) {
    addButton.addEventListener('click', function () {
      resetForm();
      openForm();
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', function () {
      resetForm();
      closeForm();
    });
  }

  window.addEventListener('storage', function (event) {
    if (!event || (event.key !== DEPT_KEY && event.key !== null)) return;
    renderRows();
  });

  window.addEventListener('aios:cloud-sync', function (event) {
    const changedKeys = event && event.detail && Array.isArray(event.detail.changedKeys)
      ? event.detail.changedKeys
      : [];
    if (changedKeys.length > 0 && changedKeys.indexOf(DEPT_KEY) < 0) return;
    renderRows();
  });

  if (!guardAccess()) return;
  closeForm();
  renderRows();
})();
