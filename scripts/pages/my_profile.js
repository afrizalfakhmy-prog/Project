(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';

  const fieldMap = {
    username: document.getElementById('profile-username'),
    password: document.getElementById('profile-password'),
    kategori: document.getElementById('profile-kategori'),
    nama: document.getElementById('profile-nama'),
    tempat: document.getElementById('profile-tempat'),
    tgl: document.getElementById('profile-tgl'),
    hp: document.getElementById('profile-hp'),
    email: document.getElementById('profile-email'),
    alamat: document.getElementById('profile-alamat'),
    ktp: document.getElementById('profile-ktp'),
    karyawan: document.getElementById('profile-karyawan'),
    mine: document.getElementById('profile-mine'),
    jabatan: document.getElementById('profile-jabatan'),
    kelompok: document.getElementById('profile-kelompok'),
    departemen: document.getElementById('profile-departemen'),
    perusahaan: document.getElementById('profile-perusahaan'),
    ccow: document.getElementById('profile-ccow')
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

  function setFieldValue(element, value) {
    if (!element) return;
    element.textContent = String(value || '-').trim() || '-';
  }

  function fillProfile(user) {
    const kategoriValue = user.kategori || user.role || '-';
    setFieldValue(fieldMap.username, user.username);
    setFieldValue(fieldMap.password, user.password);
    setFieldValue(fieldMap.kategori, kategoriValue);
    setFieldValue(fieldMap.nama, user.nama);
    setFieldValue(fieldMap.tempat, user.tempat);
    setFieldValue(fieldMap.tgl, user.tgl);
    setFieldValue(fieldMap.hp, user.hp);
    setFieldValue(fieldMap.email, user.email);
    setFieldValue(fieldMap.alamat, user.alamat);
    setFieldValue(fieldMap.ktp, user.ktp);
    setFieldValue(fieldMap.karyawan, user.karyawan);
    setFieldValue(fieldMap.mine, user.mine);
    setFieldValue(fieldMap.jabatan, user.jabatan);
    setFieldValue(fieldMap.kelompok, user.kelompok);
    setFieldValue(fieldMap.departemen, user.departemen);
    setFieldValue(fieldMap.perusahaan, user.perusahaan);
    setFieldValue(fieldMap.ccow, user.ccow);
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
