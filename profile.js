(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';

  const fieldLabels = {
    kategori: 'Kategori',
    role: 'Role',
    username: 'Username',
    nama: 'Nama Lengkap',
    tempat: 'Tempat Lahir',
    tgl: 'Tanggal Lahir',
    hp: 'No HP',
    email: 'Alamat Email',
    alamat: 'Alamat Lengkap',
    ktp: 'No KTP',
    karyawan: 'No Karyawan',
    mine: 'No Mine Permit',
    jabatan: 'Jabatan',
    kelompok: 'Kelompok Jabatan',
    departemen: 'Departemen',
    perusahaan: 'Perusahaan',
    ccow: 'CCOW'
  };

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizeValue(value) {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  }

  function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function getSession() {
    return readJson(SESSION_KEY) || null;
  }

  function getUsers() {
    return readJson(USER_KEY) || [];
  }

  function findCurrentUser(session, users) {
    if (!session) return null;
    const username = (session.username || '').trim();
    return users.find(function (user) {
      return user.username === username || user.email === username;
    }) || null;
  }

  async function saveUserProfile(updatedUser) {
    const users = getUsers();
    const idx = users.findIndex(function (user) { return user.id === updatedUser.id; });
    if (idx === -1) return;

    users[idx] = Object.assign({}, users[idx], updatedUser);
    writeJson(USER_KEY, users);

    try {
      if (window.AIOSApi && typeof window.AIOSApi.updateUser === 'function' && window.AIOSApi.getToken && window.AIOSApi.getToken()) {
        await window.AIOSApi.updateUser(updatedUser.id, users[idx]);
      }
    } catch (err) {
      console.warn('Profile API sync failed:', err && err.message ? err.message : err);
    }
  }

  function renderDetails(user, session) {
    const grid = document.getElementById('profile-detail-grid');
    if (!grid) return;

    const source = user || session || {};
    const rows = [
      ['kategori', source.kategori || source.role],
      ['username', source.username],
      ['nama', source.nama],
      ['tempat', source.tempat],
      ['tgl', formatDate(source.tgl)],
      ['hp', source.hp],
      ['email', source.email],
      ['alamat', source.alamat],
      ['ktp', source.ktp],
      ['karyawan', source.karyawan],
      ['mine', source.mine],
      ['jabatan', source.jabatan],
      ['kelompok', source.kelompok],
      ['departemen', source.departemen],
      ['perusahaan', source.perusahaan],
      ['ccow', source.ccow]
    ];

    grid.innerHTML = rows.map(function (row) {
      const key = row[0];
      const value = row[1];
      return `
        <div class="profile-item">
          <span class="profile-label">${escapeHtml(fieldLabels[key] || key)}</span>
          <strong class="profile-value">${escapeHtml(normalizeValue(value))}</strong>
        </div>
      `;
    }).join('');
  }

  function renderPhoto(user) {
    const img = document.getElementById('profile-photo-preview');
    if (!img) return;

    const photo = user && user.profilePhoto ? user.profilePhoto : '';
    if (photo) {
      img.src = photo;
    } else {
      img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="%2364748b">Foto Profil</text></svg>';
    }
  }

  function setMessage(text, isError) {
    const msg = document.getElementById('profile-photo-msg');
    if (!msg) return;
    msg.textContent = text || '';
    msg.classList.toggle('error', !!isError);
  }

  function initPhotoUpload(user) {
    const input = document.getElementById('profile-photo-input');
    const removeBtn = document.getElementById('profile-photo-remove');
    if (!input || !removeBtn) return;

    input.addEventListener('change', async function () {
      const file = input.files && input.files[0];
      if (!file) return;
      if (!file.type || !file.type.startsWith('image/')) {
        setMessage('File harus berupa gambar.', true);
        return;
      }

      const reader = new FileReader();
      reader.onload = async function () {
        const photoData = String(reader.result || '');
        if (!user) return;
        user.profilePhoto = photoData;
        renderPhoto(user);
        await saveUserProfile(user);
        setMessage('Foto profil berhasil diperbarui.', false);
      };
      reader.onerror = function () {
        setMessage('Gagal membaca file gambar.', true);
      };
      reader.readAsDataURL(file);
    });

    removeBtn.addEventListener('click', async function () {
      if (!user) return;
      user.profilePhoto = '';
      renderPhoto(user);
      await saveUserProfile(user);
      setMessage('Foto profil dihapus.', false);
    });
  }

  function init() {
    const session = getSession();
    if (!session || !session.username) {
      alert('Silakan login terlebih dahulu.');
      window.location.href = 'index.html';
      return;
    }

    const users = getUsers();
    const user = findCurrentUser(session, users);

    renderPhoto(user);
    renderDetails(user, session);
    initPhotoUpload(user);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
