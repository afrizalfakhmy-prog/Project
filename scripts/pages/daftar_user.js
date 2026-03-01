(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const DEPT_KEY = 'aios_departments';
  const COMPANY_KEY = 'aios_companies';

  const form = document.getElementById('user-form');
  const addButton = document.getElementById('add-user-btn');
  const cancelButton = document.getElementById('cancel-user-btn');
  const idInput = document.getElementById('user-id');
  const usernameInput = document.getElementById('user-username');
  const passwordInput = document.getElementById('user-password');
  const kategoriInput = document.getElementById('user-kategori');
  const namaInput = document.getElementById('user-nama');
  const tempatLahirInput = document.getElementById('user-tempat-lahir');
  const tanggalLahirInput = document.getElementById('user-tanggal-lahir');
  const noHpInput = document.getElementById('user-no-hp');
  const emailInput = document.getElementById('user-email');
  const alamatInput = document.getElementById('user-alamat');
  const ktpInput = document.getElementById('user-ktp');
  const noKaryawanInput = document.getElementById('user-no-karyawan');
  const noMinePermitInput = document.getElementById('user-no-mine-permit');
  const jabatanInput = document.getElementById('user-jabatan');
  const kelompokJabatanInput = document.getElementById('user-kelompok-jabatan');
  const departemenInput = document.getElementById('user-departemen');
  const perusahaanInput = document.getElementById('user-perusahaan');
  const ccowInput = document.getElementById('user-ccow');
  const tbody = document.getElementById('user-tbody');
  const session = getSession();
  const isSuperAdmin = !!(session && session.role === 'Super Admin');
  const isAdmin = !!(session && session.role === 'Admin');

  function isUserCategoryAccount(user) {
    const roleValue = String((user && (user.kategori || user.role)) || '').trim().toLowerCase();
    return roleValue === 'user';
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function guardAccess() {
    if (!session || (session.role !== 'Super Admin' && session.role !== 'Admin')) {
      alert('Akses ditolak. Hanya Super Admin atau Admin.');
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

  function writeUsers(users) {
    localStorage.setItem(USER_KEY, JSON.stringify(users));
  }

  function readMaster(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (_error) {
      return [];
    }
  }

  function fillMasterSelect(select, rows, placeholder) {
    if (!select) return;
    select.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = placeholder;
    select.appendChild(defaultOption);

    rows.forEach(function (item) {
      const value = String((item && (item.name || item.id)) || '').trim();
      if (!value) return;
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function applyRoleRestriction() {
    if (!kategoriInput) return;
    if (session && session.role === 'Admin') {
      kategoriInput.innerHTML = '';
      const onlyUser = document.createElement('option');
      onlyUser.value = 'User';
      onlyUser.textContent = 'User';
      kategoriInput.appendChild(onlyUser);
      kategoriInput.value = 'User';
      kategoriInput.disabled = true;
    } else {
      kategoriInput.disabled = false;
    }
  }

  function fillDropdowns() {
    const deptRows = readMaster(DEPT_KEY);
    const companyRows = readMaster(COMPANY_KEY);
    fillMasterSelect(departemenInput, deptRows, '(Pilih Departemen)');
    fillMasterSelect(perusahaanInput, companyRows, '(Pilih Perusahaan)');
  }

  function fillDropdownsKeepSelection() {
    const selectedDept = String(departemenInput.value || '').trim();
    const selectedCompany = String(perusahaanInput.value || '').trim();
    fillDropdowns();

    if (selectedDept) departemenInput.value = selectedDept;
    if (selectedCompany) perusahaanInput.value = selectedCompany;
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validatePayload(payload, users) {
    if (!payload.username) return 'Username wajib diisi.';
    if (!payload.password || payload.password.length < 8) return 'Password minimal 8 huruf.';
    if (!payload.kategori) return 'Kategori wajib dipilih.';
    if (!payload.nama) return 'Nama Lengkap wajib diisi.';
    if (!payload.tempat) return 'Tempat Lahir wajib diisi.';
    if (!payload.tgl) return 'Tanggal Lahir wajib diisi.';
    if (!payload.hp) return 'No HP wajib diisi.';
    if (!/^\d+$/.test(payload.hp) || payload.hp.length > 13) return 'No HP harus angka dan maksimal 13 angka.';
    if (!payload.email || !isEmail(payload.email)) return 'Alamat Email tidak valid.';
    if (!payload.alamat) return 'Alamat Lengkap wajib diisi.';
    if (!payload.ktp) return 'No KTP wajib diisi.';
    if (!/^\d+$/.test(payload.ktp) || payload.ktp.length < 15 || payload.ktp.length > 17) return 'No KTP harus angka, minimal 15 dan maksimal 17 angka.';
    if (!payload.karyawan) return 'No Karyawan wajib diisi.';
    if (!payload.mine) return 'No Mine Permit wajib diisi.';
    if (!payload.jabatan) return 'Jabatan wajib diisi.';
    if (!payload.kelompok) return 'Kelompok Jabatan wajib dipilih.';
    if (!payload.departemen) return 'Departemen wajib dipilih.';
    if (!payload.perusahaan) return 'Perusahaan wajib dipilih.';
    if (!payload.ccow) return 'CCOW wajib dipilih.';

    if (session && session.role === 'Admin' && payload.kategori !== 'User') {
      return 'Role Admin hanya bisa memilih kategori User.';
    }

    const duplicate = users.find(function (item) {
      return String(item.username || '').toLowerCase() === payload.username.toLowerCase() && item.id !== payload.id;
    });
    if (duplicate) return 'Username tidak boleh duplikasi.';

    const duplicateEmail = users.find(function (item) {
      return String(item.email || '').toLowerCase() === payload.email.toLowerCase() && item.id !== payload.id;
    });
    if (duplicateEmail) return 'Alamat Email tidak boleh duplikasi.';

    return '';
  }

  function renderRows() {
    const users = readUsers();
    tbody.innerHTML = '';

    users.forEach(function (user) {
      const showEditForAdmin = isAdmin && isUserCategoryAccount(user);
      const canEdit = isSuperAdmin || showEditForAdmin;
      const canDelete = isSuperAdmin;

      const row = document.createElement('tr');
      row.innerHTML = '<td>' + (user.username || '') + '</td>' +
        '<td>' + (user.nama || '') + '</td>' +
        '<td>' + (user.kategori || user.role || '') + '</td>' +
        '<td>' + (user.departemen || '') + '</td>' +
        '<td>' + (user.perusahaan || '') + '</td>' +
        '<td>' +
        '<button type="button" class="table-btn" data-action="detail" data-id="' + user.id + '">Detail</button> ' +
        ((canEdit || canDelete)
          ? (canEdit
            ? '<button type="button" class="table-btn" data-action="edit" data-id="' + user.id + '">Ubah</button> '
            : '') +
            (canDelete
              ? '<button type="button" class="table-btn danger" data-action="delete" data-id="' + user.id + '">Hapus</button>'
              : '')
          : '-') +
        '</td>';
      tbody.appendChild(row);
    });
  }

  function resetForm() {
    idInput.value = '';
    usernameInput.value = '';
    passwordInput.value = '';
    kategoriInput.value = 'User';
    namaInput.value = '';
    tempatLahirInput.value = '';
    tanggalLahirInput.value = '';
    noHpInput.value = '';
    emailInput.value = '';
    alamatInput.value = '';
    ktpInput.value = '';
    noKaryawanInput.value = '';
    noMinePermitInput.value = '';
    jabatanInput.value = '';
    kelompokJabatanInput.value = 'Staff Up';
    departemenInput.value = '';
    perusahaanInput.value = '';
    ccowInput.value = 'PT. Maruwai Coal';
    applyRoleRestriction();
  }

  function openForm() {
    form.classList.remove('hidden');
  }

  function closeForm() {
    form.classList.add('hidden');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const id = idInput.value || 'u-' + Date.now();
    const payload = {
      id: id,
      username: String(usernameInput.value || '').trim(),
      password: String(passwordInput.value || '').trim(),
      kategori: String(kategoriInput.value || '').trim(),
      role: String(kategoriInput.value || '').trim(),
      nama: String(namaInput.value || '').trim(),
      tempat: String(tempatLahirInput.value || '').trim(),
      tgl: String(tanggalLahirInput.value || '').trim(),
      hp: String(noHpInput.value || '').trim(),
      email: String(emailInput.value || '').trim(),
      alamat: String(alamatInput.value || '').trim(),
      ktp: String(ktpInput.value || '').trim(),
      karyawan: String(noKaryawanInput.value || '').trim(),
      mine: String(noMinePermitInput.value || '').trim(),
      jabatan: String(jabatanInput.value || '').trim(),
      kelompok: String(kelompokJabatanInput.value || '').trim(),
      departemen: String(departemenInput.value || '').trim(),
      perusahaan: String(perusahaanInput.value || '').trim(),
      ccow: String(ccowInput.value || '').trim()
    };

    const users = readUsers();
    const validationMessage = validatePayload(payload, users);
    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    const idx = users.findIndex(function (item) { return item.id === id; });
    const existing = idx >= 0 ? users[idx] : null;

    if (idx >= 0 && !isSuperAdmin && !(isAdmin && existing && isUserCategoryAccount(existing))) {
      alert('Role Admin hanya dapat mengubah user dengan kategori User.');
      return;
    }

    if (idx >= 0) {
      users[idx] = Object.assign({}, users[idx], payload);
    } else {
      users.push(payload);
    }

    writeUsers(users);
    renderRows();
    resetForm();
    closeForm();
  });

  tbody.addEventListener('click', function (event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    const users = readUsers();
    const target = users.find(function (item) { return item.id === id; });
    if (!target) return;

    if (action === 'detail') {
      const detailText = [
        'Username: ' + (target.username || '-'),
        'Nama Lengkap: ' + (target.nama || '-'),
        'Kategori: ' + (target.kategori || target.role || '-'),
        'Tempat Lahir: ' + (target.tempat || '-'),
        'Tanggal Lahir: ' + (target.tgl || '-'),
        'No HP: ' + (target.hp || '-'),
        'Email: ' + (target.email || '-'),
        'Alamat: ' + (target.alamat || '-'),
        'No KTP: ' + (target.ktp || '-'),
        'No Karyawan: ' + (target.karyawan || '-'),
        'No Mine Permit: ' + (target.mine || '-'),
        'Jabatan: ' + (target.jabatan || '-'),
        'Kelompok Jabatan: ' + (target.kelompok || '-'),
        'Departemen: ' + (target.departemen || '-'),
        'Perusahaan: ' + (target.perusahaan || '-'),
        'CCOW: ' + (target.ccow || '-')
      ].join('\n');
      alert(detailText);
      return;
    }

    if (action === 'edit' && !isSuperAdmin && !(isAdmin && isUserCategoryAccount(target))) {
      alert('Role Admin hanya dapat mengubah user dengan kategori User.');
      return;
    }

    if (action === 'delete' && !isSuperAdmin) {
      alert('Aksi hapus user hanya dapat dilakukan oleh Super Admin.');
      return;
    }

    if (session && session.role === 'Admin' && (target.kategori || target.role) !== 'User') {
      alert('Role Admin hanya dapat mengelola kategori User.');
      return;
    }

    if (action === 'edit') {
      openForm();
      idInput.value = target.id;
      usernameInput.value = target.username || '';
      passwordInput.value = target.password || '';
      kategoriInput.value = target.kategori || target.role || 'User';
      namaInput.value = target.nama || '';
      tempatLahirInput.value = target.tempat || '';
      tanggalLahirInput.value = target.tgl || '';
      noHpInput.value = target.hp || '';
      emailInput.value = target.email || '';
      alamatInput.value = target.alamat || '';
      ktpInput.value = target.ktp || '';
      noKaryawanInput.value = target.karyawan || '';
      noMinePermitInput.value = target.mine || '';
      jabatanInput.value = target.jabatan || '';
      kelompokJabatanInput.value = target.kelompok || 'Staff Up';
      departemenInput.value = target.departemen || '';
      perusahaanInput.value = target.perusahaan || '';
      ccowInput.value = target.ccow || 'PT. Maruwai Coal';
      applyRoleRestriction();
      return;
    }

    if (action === 'delete') {
      if (!confirm('Hapus user ini?')) return;
      const nextUsers = users.filter(function (item) { return item.id !== id; });
      writeUsers(nextUsers);
      renderRows();
      resetForm();
      closeForm();
    }
  });

  if (addButton) {
    addButton.addEventListener('click', function () {
      fillDropdowns();
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
    if (!event) return;

    if (event.key === USER_KEY || event.key === null) {
      renderRows();
    }

    if (event.key === DEPT_KEY || event.key === COMPANY_KEY || event.key === null) {
      fillDropdownsKeepSelection();
    }
  });

  window.addEventListener('aios:cloud-sync', function (event) {
    const changedKeys = event && event.detail && Array.isArray(event.detail.changedKeys)
      ? event.detail.changedKeys
      : [];

    if (changedKeys.length === 0 || changedKeys.indexOf(USER_KEY) >= 0) {
      renderRows();
    }

    if (
      changedKeys.length === 0 ||
      changedKeys.indexOf(DEPT_KEY) >= 0 ||
      changedKeys.indexOf(COMPANY_KEY) >= 0
    ) {
      fillDropdownsKeepSelection();
    }
  });

  if (!guardAccess()) return;
  fillDropdowns();
  applyRoleRestriction();
  resetForm();
  closeForm();
  renderRows();
})();
