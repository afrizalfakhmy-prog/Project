(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';

  const loginScreen = document.getElementById('login-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginMessage = document.getElementById('login-message');
  const activeRole = document.getElementById('active-role');
  const sidebarMenu = document.getElementById('sidebar-menu');
  const sidebar = document.getElementById('role-sidebar');
  const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
  const mobileSidebarBackdrop = document.getElementById('mobile-sidebar-backdrop');
  const mainMenu = document.getElementById('main-menu');

  const ROLE_SIDEBAR_ITEMS = {
    'Super Admin': [
      'My Profile',
      'Achievement',
      'Tasklist',
      'Daftar User',
      'Daftar Departemen',
      'Daftar Perusahaan',
      'Daftar PJA',
      'Logout'
    ],
    Admin: [
      'My Profile',
      'Achievement',
      'Tasklist',
      'Daftar User',
      'Logout'
    ],
    User: [
      'My Profile',
      'Achievement',
      'Tasklist',
      'Logout'
    ]
  };

  function setLoginMessage(text, type) {
    if (!loginMessage) return;
    loginMessage.textContent = text || '';
    loginMessage.classList.remove('error', 'success');
    if (type) loginMessage.classList.add(type);
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

  function ensureDefaultUsers() {
    const current = readUsers();
    if (Array.isArray(current) && current.length > 0) return;

    const seeded = [
      {
        id: 'u-superadmin',
        username: 'superadmin',
        email: 'superadmin@aios.local',
        password: 'superadmin',
        nama: 'Super Admin',
        role: 'Super Admin',
        kategori: 'Super Admin'
      },
      {
        id: 'u-admin',
        username: 'admin',
        email: 'admin@aios.local',
        password: 'admin',
        nama: 'Admin',
        role: 'Admin',
        kategori: 'Admin'
      },
      {
        id: 'u-user',
        username: 'user',
        email: 'user@aios.local',
        password: 'user',
        nama: 'User',
        role: 'User',
        kategori: 'User'
      }
    ];
    writeUsers(seeded);
  }

  function normalizeRole(user) {
    const roleRaw = String((user && (user.kategori || user.role)) || '').trim().toLowerCase();
    if (roleRaw === 'super admin' || roleRaw === 'superadmin') return 'Super Admin';
    if (roleRaw === 'admin') return 'Admin';
    return 'User';
  }

  function authenticateUser(identifier, password) {
    const users = readUsers();
    const normalizedIdentifier = String(identifier || '').trim().toLowerCase();
    const normalizedPassword = String(password || '');

    return users.find(function (user) {
      const username = String((user && user.username) || '').trim().toLowerCase();
      const email = String((user && user.email) || '').trim().toLowerCase();
      const userPassword = String((user && user.password) || '');
      const identifierMatch = normalizedIdentifier === username || normalizedIdentifier === email;
      return identifierMatch && normalizedPassword === userPassword;
    }) || null;
  }

  function saveSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function syncSessionAgainstUsers() {
    const currentSession = readSession();
    if (!currentSession || !currentSession.username) return;

    const users = readUsers();
    const account = users.find(function (user) {
      return String((user && user.username) || '').trim().toLowerCase() === String(currentSession.username || '').trim().toLowerCase();
    });

    if (!account) {
      clearSession();
      showLogin();
      setLoginMessage('Akun tidak ditemukan atau sudah dihapus. Silakan login ulang.', 'error');
      return;
    }

    const latestRole = normalizeRole(account);
    if (currentSession.role !== latestRole) {
      saveSession({ username: account.username || currentSession.username, role: latestRole });
      showDashboard(latestRole);
    }
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function isMobileViewport() {
    return window.matchMedia('(max-width: 699px)').matches;
  }

  function closeMobileSidebar() {
    if (!dashboardScreen) return;
    dashboardScreen.classList.remove('mobile-sidebar-open');
    if (mobileSidebarToggle) mobileSidebarToggle.setAttribute('aria-expanded', 'false');
  }

  function toggleMobileSidebar() {
    if (!dashboardScreen || !isMobileViewport()) return;
    const opened = dashboardScreen.classList.toggle('mobile-sidebar-open');
    if (mobileSidebarToggle) mobileSidebarToggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
  }

  function showDashboard(role) {
    if (activeRole) activeRole.textContent = role;
    if (loginScreen) loginScreen.classList.add('hidden');
    if (dashboardScreen) dashboardScreen.classList.remove('hidden');
    renderSidebar(role);
    closeMobileSidebar();
  }

  function showLogin() {
    if (dashboardScreen) dashboardScreen.classList.add('hidden');
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    setLoginMessage('');
    closeMobileSidebar();
  }

  function renderSidebar(role) {
    if (!sidebarMenu) return;
    const items = ROLE_SIDEBAR_ITEMS[role] || [];
    sidebarMenu.innerHTML = '';

    items.forEach(function (label) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sidebar-item';
      button.dataset.menu = label;
      button.textContent = label;
      sidebarMenu.appendChild(button);
    });
  }

  function goToPage(menuLabel) {
    const routeMap = {
      Achievement: 'pages/achievement.html',
      'Frontline Leadership': 'pages/frontline_leadership.html',
      Inspeksi: 'pages/inspeksi.html',
      'OHS Talk': 'pages/ohs_talk.html',
      Observasi: 'pages/observasi.html',
      Tasklist: 'pages/tasklist.html',
      'Daftar User': 'pages/daftar_user.html',
      'Daftar Departemen': 'pages/daftar_departemen.html',
      'Daftar Perusahaan': 'pages/daftar_perusahaan.html',
      'Daftar PJA': 'pages/daftar_pja.html'
    };

    const target = routeMap[menuLabel];
    if (!target) {
      alert(menuLabel + ' dipilih.');
      return;
    }
    window.location.href = target;
  }

  if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const username = String(usernameInput && usernameInput.value ? usernameInput.value : '').trim();
      const password = String(passwordInput && passwordInput.value ? passwordInput.value : '');

      if (!username || !password) {
        setLoginMessage('Username/email dan password wajib diisi.', 'error');
        return;
      }

      const account = authenticateUser(username, password);
      if (!account) {
        setLoginMessage('Login gagal. Periksa username/email atau password.', 'error');
        return;
      }

      const role = normalizeRole(account);
      setLoginMessage('Login berhasil.', 'success');
      saveSession({ username: account.username || username, role: role });
      showDashboard(role);
    });
  }

  if (sidebarMenu) {
    sidebarMenu.addEventListener('click', function (event) {
      const target = event.target;
      if (!target || !target.matches('.sidebar-item')) return;
      const menu = target.dataset.menu || '';

      if (isMobileViewport()) {
        closeMobileSidebar();
      }

      if (menu === 'Logout') {
        clearSession();
        showLogin();
        return;
      }

      goToPage(menu);
    });
  }

  if (mobileSidebarToggle) {
    mobileSidebarToggle.addEventListener('click', function () {
      toggleMobileSidebar();
    });
  }

  if (mobileSidebarBackdrop) {
    mobileSidebarBackdrop.addEventListener('click', function () {
      closeMobileSidebar();
    });
  }

  window.addEventListener('resize', function () {
    if (!isMobileViewport()) {
      closeMobileSidebar();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeMobileSidebar();
    }
  });

  window.addEventListener('storage', function (event) {
    if (!event || (event.key !== USER_KEY && event.key !== null)) return;
    syncSessionAgainstUsers();
  });

  window.addEventListener('aios:cloud-sync', function (event) {
    const changedKeys = event && event.detail && Array.isArray(event.detail.changedKeys)
      ? event.detail.changedKeys
      : [];
    if (changedKeys.length > 0 && changedKeys.indexOf(USER_KEY) < 0) return;
    syncSessionAgainstUsers();
  });

  if (mainMenu) {
    mainMenu.addEventListener('click', function (event) {
      const item = event.target.closest('.menu-item[data-menu]');
      if (!item) return;
      const menu = item.dataset.menu || '';
      if (!menu) return;
      goToPage(menu);
    });
  }

  ensureDefaultUsers();

  const existingSession = readSession();
  if (existingSession && existingSession.role) {
    showDashboard(existingSession.role);
  } else {
    showLogin();
  }
})();
