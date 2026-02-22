(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const KTA_KEY = 'aios_kta_records';
  const TTA_KEY = 'aios_tta_records';

  const filterState = {
    source: 'ALL',
    status: 'ALL'
  };

  let remoteItems = null;

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizeDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function getCurrentIdentity() {
    const session = readJson(SESSION_KEY) || {};
    const users = readJson(USER_KEY) || [];

    const loginIdentity = (session.username || '').trim();
    const matchedUser = users.find(function (user) {
      return user.username === loginIdentity || user.email === loginIdentity;
    });

    return {
      username: loginIdentity,
      nama: (matchedUser && matchedUser.nama) || '',
      role: session.role || ''
    };
  }

  function buildItems(identity) {
    if (Array.isArray(remoteItems)) {
      const mapped = remoteItems.map(function (item) {
        return {
          source: item.type || item.source || '-',
          id: item.id || '-',
          tanggalLaporan: item.tanggalLaporan || '',
          namaPelapor: item.namaPelapor || '-',
          perusahaanPelapor: item.perusahaan || item.perusahaanPelapor || '-',
          status: item.status || '-',
          fotoTemuanPreview: (item.fotoTemuanPreview && item.fotoTemuanPreview[0]) || ''
        };
      });

      mapped.sort(function (a, b) {
        const da = new Date(a.tanggalLaporan || 0).getTime();
        const db = new Date(b.tanggalLaporan || 0).getTime();
        return db - da;
      });
      return mapped;
    }

    const kta = readJson(KTA_KEY) || [];
    const tta = readJson(TTA_KEY) || [];
    const isAdminScope = identity.role === 'Admin' || identity.role === 'Super Admin';

    const nameSet = new Set([identity.username, identity.nama].filter(Boolean).map(function (value) {
      return value.toLowerCase();
    }));

    function belongsToCurrentUser(item) {
      if (isAdminScope) return true;
      const reporterUsername = String(item.reporterUsername || '').toLowerCase();
      const reporterName = String(item.namaPelapor || '').toLowerCase();
      if (identity.username && reporterUsername === identity.username.toLowerCase()) return true;
      return nameSet.has(reporterName);
    }

    function mapItem(source, item) {
      return {
        source: source,
        id: item.id || '-',
        tanggalLaporan: item.tanggalLaporan || '',
        namaPelapor: item.namaPelapor || '-',
        perusahaanPelapor: item.perusahaan || item.perusahaanPelapor || '-',
        status: item.status || '-',
        fotoTemuanPreview: (item.fotoTemuanPreview && item.fotoTemuanPreview[0]) || ''
      };
    }

    const merged = [];
    kta.forEach(function (item) {
      if (belongsToCurrentUser(item)) merged.push(mapItem('KTA', item));
    });
    tta.forEach(function (item) {
      if (belongsToCurrentUser(item)) merged.push(mapItem('TTA', item));
    });

    merged.sort(function (a, b) {
      const da = new Date(a.tanggalLaporan || 0).getTime();
      const db = new Date(b.tanggalLaporan || 0).getTime();
      return db - da;
    });

    return merged;
  }

  async function syncTasklistFromApi() {
    try {
      if (!window.AIOSApi || typeof window.AIOSApi.listTasklist !== 'function') return;
      if (!window.AIOSApi.getToken || !window.AIOSApi.getToken()) return;
      const list = await window.AIOSApi.listTasklist();
      if (Array.isArray(list)) {
        remoteItems = list;
      }
    } catch (err) {
      console.warn('Tasklist API failed, fallback local data:', err && err.message ? err.message : err);
    }
  }

  function applyFilters(items) {
    return items.filter(function (item) {
      const sourceOk = filterState.source === 'ALL' || item.source === filterState.source;
      const statusValue = item.status || '-';
      const statusOk = filterState.status === 'ALL' || statusValue === filterState.status;
      return sourceOk && statusOk;
    });
  }

  function render(identity) {
    const cards = document.getElementById('tasklist-cards');
    const meta = document.getElementById('tasklist-meta');
    if (!cards || !meta) return;

    if (!identity.username) {
      meta.textContent = 'Silakan login terlebih dahulu untuk melihat Tasklist.';
      cards.innerHTML = '';
      return;
    }

    const allItems = buildItems(identity);
    const items = applyFilters(allItems);
    if (identity.role === 'Admin' || identity.role === 'Super Admin') {
      meta.textContent = `Notifikasi semua user (${identity.role})`;
    } else {
      meta.textContent = `Notifikasi untuk login: ${identity.username}`;
    }

    if (items.length === 0) {
      cards.innerHTML = '<article class="task-card"><p class="muted">Belum ada notifikasi KTA/TTA untuk akun ini.</p></article>';
      return;
    }

    cards.innerHTML = items.map(function (item) {
      const thumbnailHtml = item.fotoTemuanPreview
        ? `<a href="${item.fotoTemuanPreview}" target="_blank" rel="noopener noreferrer" class="task-thumb-link"><img src="${item.fotoTemuanPreview}" alt="Thumbnail ${escapeHtml(item.id)}" class="task-thumb" /></a>`
        : '<div class="task-thumb task-thumb-empty">No Image</div>';

      return `
        <article class="task-card">
          <div class="task-card-head">
            <span class="task-badge">${escapeHtml(item.source)}</span>
            <strong>${escapeHtml(item.id)}</strong>
          </div>

          <div class="task-thumb-wrap">${thumbnailHtml}</div>

          <ul class="task-fields">
            <li><span>Tanggal Laporan</span><strong>${escapeHtml(normalizeDate(item.tanggalLaporan) || '-')}</strong></li>
            <li><span>Nama Pelapor</span><strong>${escapeHtml(item.namaPelapor)}</strong></li>
            <li><span>Perusahaan Pelapor</span><strong>${escapeHtml(item.perusahaanPelapor)}</strong></li>
            <li><span>Status</span><strong>${escapeHtml(item.status)}</strong></li>
          </ul>
        </article>
      `;
    }).join('');
  }

  async function init() {
    const identity = getCurrentIdentity();
    const sourceFilter = document.getElementById('filter-source');
    const statusFilter = document.getElementById('filter-status');

    if (sourceFilter) {
      sourceFilter.addEventListener('change', function (event) {
        filterState.source = event.target.value || 'ALL';
        render(identity);
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', function (event) {
        filterState.status = event.target.value || 'ALL';
        render(identity);
      });
    }

    await syncTasklistFromApi();
    render(identity);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
