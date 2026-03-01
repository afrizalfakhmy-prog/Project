(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';

  const profileForm = document.getElementById('my-profile-form');
  const profileMessage = document.getElementById('profile-message');
  let currentUserId = '';
  let currentUsername = '';

  const readonlyFieldMap = {
    username: document.getElementById('profile-username'),
    kategori: document.getElementById('profile-kategori'),
    nama: document.getElementById('profile-nama'),
    kelompok: document.getElementById('profile-kelompok'),
    departemen: document.getElementById('profile-departemen'),
    perusahaan: document.getElementById('profile-perusahaan'),
    ccow: document.getElementById('profile-ccow')
  };

  const editableFieldMap = {
    password: document.getElementById('profile-password-input'),
    tempat: document.getElementById('profile-tempat-input'),
    tgl: document.getElementById('profile-tgl-input'),
    hp: document.getElementById('profile-hp-input'),
    email: document.getElementById('profile-email-input'),
    alamat: document.getElementById('profile-alamat-input'),
    ktp: document.getElementById('profile-ktp-input'),
    karyawan: document.getElementById('profile-karyawan-input'),
    mine: document.getElementById('profile-mine-input'),
    jabatan: document.getElementById('profile-jabatan-input')
  };

  function readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
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

  function setMessage(text, type) {
    if (!profileMessage) return;
    profileMessage.textContent = text || '';
    profileMessage.classList.remove('error', 'success');
    if (type) profileMessage.classList.add(type);
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
  }

  function setFieldValue(element, value) {
    if (!element) return;
    element.textContent = String(value || '-').trim() || '-';
  }

  function setInputValue(element, value) {
    if (!element) return;
    element.value = String(value || '').trim();
  }

  function getInputValue(element) {
    return String((element && element.value) || '').trim();
  }

  function validateEditablePayload(payload, users, userId, username) {
    if (!payload.password || payload.password.length < 8) return 'Password minimal 8 huruf.';
    if (!payload.tempat) return 'Tempat Lahir wajib diisi.';
    if (!payload.tgl) return 'Tanggal Lahir wajib diisi.';
    if (!payload.hp) return 'No HP wajib diisi.';
    if (!/^\d+$/.test(payload.hp) || payload.hp.length > 13) return 'No HP harus angka dan maksimal 13 angka.';
    if (!payload.email || !isEmail(payload.email)) return 'Alamat Email tidak valid.';
    if (!payload.alamat) return 'Alamat wajib diisi.';
    if (!payload.ktp) return 'No KTP wajib diisi.';
    if (!/^\d+$/.test(payload.ktp) || payload.ktp.length < 15 || payload.ktp.length > 17) {
      return 'No KTP harus angka, minimal 15 dan maksimal 17 angka.';
    }
    if (!payload.karyawan) return 'No Karyawan wajib diisi.';
    if (!payload.mine) return 'No Mine Permit wajib diisi.';
    if (!payload.jabatan) return 'Jabatan wajib diisi.';

    const duplicateEmail = users.find(function (item) {
      const sameEmail = String(item.email || '').toLowerCase() === payload.email.toLowerCase();
      const sameUserById = userId && item.id && String(item.id) === String(userId);
      const sameUserByUsername = String(item.username || '').trim().toLowerCase() === String(username || '').trim().toLowerCase();
      return sameEmail && !sameUserById && !sameUserByUsername;
    });
    if (duplicateEmail) return 'Alamat Email tidak boleh duplikasi.';

    return '';
  }

  function fillProfile(user) {
    currentUserId = user.id || '';
    currentUsername = user.username || '';
    const kategoriValue = user.kategori || user.role || '-';
    setFieldValue(readonlyFieldMap.username, user.username);
    setFieldValue(readonlyFieldMap.kategori, kategoriValue);
    setFieldValue(readonlyFieldMap.nama, user.nama);
    setFieldValue(readonlyFieldMap.kelompok, user.kelompok);
    setFieldValue(readonlyFieldMap.departemen, user.departemen);
    setFieldValue(readonlyFieldMap.perusahaan, user.perusahaan);
    setFieldValue(readonlyFieldMap.ccow, user.ccow);

    setInputValue(editableFieldMap.password, user.password);
    setInputValue(editableFieldMap.tempat, user.tempat);
    setInputValue(editableFieldMap.tgl, user.tgl);
    setInputValue(editableFieldMap.hp, user.hp);
    setInputValue(editableFieldMap.email, user.email);
    setInputValue(editableFieldMap.alamat, user.alamat);
    setInputValue(editableFieldMap.ktp, user.ktp);
    setInputValue(editableFieldMap.karyawan, user.karyawan);
    setInputValue(editableFieldMap.mine, user.mine);
    setInputValue(editableFieldMap.jabatan, user.jabatan);
  }

  function syncProfile() {
    const session = readSession();
    if (!session || !session.username) {
      alert('Silakan login terlebih dahulu.');
      window.location.href = '../index.html';
      return;
    }

    const users = readUsers();
    const currentUser = users.find(function (user) {
      return String(user.username || '').trim().toLowerCase() === String(session.username || '').trim().toLowerCase();
    });

    if (!currentUser) {
      alert('Data profil tidak ditemukan. Silakan login ulang.');
      window.location.href = '../index.html';
      return;
    }

    fillProfile(currentUser);
    setMessage('');
  }

  if (profileForm) {
    profileForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const session = readSession();
      if (!session || !session.username) {
        alert('Silakan login terlebih dahulu.');
        window.location.href = '../index.html';
        return;
      }

      const users = readUsers();
      const idx = users.findIndex(function (user) {
        return String(user.username || '').trim().toLowerCase() === String(session.username || '').trim().toLowerCase();
      });

      if (idx < 0) {
        alert('Data profil tidak ditemukan. Silakan login ulang.');
        window.location.href = '../index.html';
        return;
      }

      const payload = {
        password: getInputValue(editableFieldMap.password),
        tempat: getInputValue(editableFieldMap.tempat),
        tgl: getInputValue(editableFieldMap.tgl),
        hp: getInputValue(editableFieldMap.hp),
        email: getInputValue(editableFieldMap.email),
        alamat: getInputValue(editableFieldMap.alamat),
        ktp: getInputValue(editableFieldMap.ktp),
        karyawan: getInputValue(editableFieldMap.karyawan),
        mine: getInputValue(editableFieldMap.mine),
        jabatan: getInputValue(editableFieldMap.jabatan)
      };

      const validationMessage = validateEditablePayload(payload, users, currentUserId, currentUsername || session.username);
      if (validationMessage) {
        setMessage(validationMessage, 'error');
        return;
      }

      users[idx] = Object.assign({}, users[idx], payload);
      writeUsers(users);
      fillProfile(users[idx]);
      setMessage('Perubahan profil berhasil disimpan dan otomatis sinkron ke Daftar User.', 'success');
    });
  }

  window.addEventListener('storage', function (event) {
    if (!event || (event.key !== USER_KEY && event.key !== SESSION_KEY && event.key !== null)) return;
    syncProfile();
  });

  window.addEventListener('aios:cloud-sync', function (event) {
    const changedKeys = event && event.detail && Array.isArray(event.detail.changedKeys)
      ? event.detail.changedKeys
      : [];
    if (changedKeys.length > 0 && changedKeys.indexOf(USER_KEY) < 0) return;
    syncProfile();
  });

  syncProfile();
})();
