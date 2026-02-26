(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const PJA_KEY = 'aios_pja';

  const form = document.getElementById('pja-form');
  const addButton = document.getElementById('add-pja-btn');
  const cancelButton = document.getElementById('cancel-pja-btn');
  const idInput = document.getElementById('pja-id');
  const userSelect = document.getElementById('pja-user');
  const tbody = document.getElementById('pja-tbody');

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

  function readUsers() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_error) {
      return [];
    }
  }

  function readPja() {
    try {
      const raw = localStorage.getItem(PJA_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_error) {
      return [];
    }
  }

  function writePja(rows) {
    localStorage.setItem(PJA_KEY, JSON.stringify(rows));
  }

  function fillUserDropdown(selectedId) {
    const users = readUsers();
    userSelect.innerHTML = '<option value="">(Pilih User)</option>';

    users.forEach(function (user) {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = (user.nama || user.username || '-') + ' - ' + (user.username || '-');
      if (selectedId && selectedId === user.id) option.selected = true;
      userSelect.appendChild(option);
    });
  }

  function renderRows() {
    const rows = readPja();
    const users = readUsers();
    tbody.innerHTML = '';

    rows.forEach(function (item) {
      const linkedUser = users.find(function (user) { return user.id === item.userId; });
      const namaPja = String((linkedUser && (linkedUser.nama || linkedUser.username)) || item.userLabel || '').trim();
      const pjaText = namaPja.includes(' - ') ? namaPja.split(' - ')[0] : namaPja;
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + (pjaText || '-') + '</td>' +
        '<td><button type="button" class="table-btn" data-action="edit" data-id="' + item.id + '">Ubah</button> ' +
        '<button type="button" class="table-btn danger" data-action="delete" data-id="' + item.id + '">Hapus</button></td>';
      tbody.appendChild(tr);
    });
  }

  function resetForm() {
    idInput.value = '';
    fillUserDropdown('');
  }

  function openForm() {
    form.classList.remove('hidden');
  }

  function closeForm() {
    form.classList.add('hidden');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const users = readUsers();
    const selectedId = String(userSelect.value || '').trim();
    const selectedUser = users.find(function (u) { return u.id === selectedId; });

    if (!selectedUser) {
      alert('PJA wajib dipilih dari Daftar User.');
      return;
    }

    const id = idInput.value || 'pja-' + Date.now();
    const rows = readPja();
    const idx = rows.findIndex(function (item) { return item.id === id; });
    const payload = {
      id: id,
      userId: selectedUser.id,
      userLabel: (selectedUser.nama || selectedUser.username || '-')
    };

    if (idx >= 0) rows[idx] = payload;
    else rows.push(payload);

    writePja(rows);
    renderRows();
    resetForm();
    closeForm();
  });

  tbody.addEventListener('click', function (event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    const rows = readPja();
    const target = rows.find(function (item) { return item.id === id; });
    if (!target) return;

    if (action === 'edit') {
      openForm();
      idInput.value = target.id;
      fillUserDropdown(target.userId);
      return;
    }

    if (action === 'delete') {
      if (!confirm('Hapus data PJA ini?')) return;
      const nextRows = rows.filter(function (item) { return item.id !== id; });
      writePja(nextRows);
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

  if (!guardAccess()) return;
  fillUserDropdown('');
  closeForm();
  renderRows();
})();
