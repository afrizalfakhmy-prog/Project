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
  let currentIdentity = null;

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

  function normalizeName(value) {
    return String(value || '').trim().toLowerCase();
  }

  function isOpenOrProgress(status) {
    return status === 'Open' || status === 'Progress';
  }

  function isPjaAssignee(identity, item) {
    const userName = normalizeName(identity && identity.nama);
    const pjaName = normalizeName(item && item.namaPja);
    if (!userName || !pjaName) return false;
    return userName === pjaName;
  }

  function buildItems(identity) {
    if (Array.isArray(remoteItems)) {
      const mapped = remoteItems.map(function (item) {
        const mappedItem = {
          source: item.type || item.source || '-',
          id: item.id || '-',
          tanggalLaporan: item.tanggalLaporan || '',
          namaPelapor: item.namaPelapor || '-',
          perusahaanPelapor: item.perusahaan || item.perusahaanPelapor || '-',
          status: item.status || '-',
          namaPja: item.namaPja || '-',
          fotoTemuanPreview: (item.fotoTemuanPreview && item.fotoTemuanPreview[0]) || ''
        };
        mappedItem.followUpEligible = isOpenOrProgress(mappedItem.status) && isPjaAssignee(identity, mappedItem);
        return mappedItem;
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
      const pjaName = String(item.namaPja || '').toLowerCase();
      const isPjaNotificationTarget = isOpenOrProgress(item.status || '-') && !!pjaName && nameSet.has(pjaName);
      if (identity.username && reporterUsername === identity.username.toLowerCase()) return true;
      if (isPjaNotificationTarget) return true;
      return nameSet.has(reporterName);
    }

    function mapItem(source, item) {
      const mappedItem = {
        source: source,
        id: item.id || '-',
        tanggalLaporan: item.tanggalLaporan || '',
        namaPelapor: item.namaPelapor || '-',
        perusahaanPelapor: item.perusahaan || item.perusahaanPelapor || '-',
        status: item.status || '-',
        namaPja: item.namaPja || '-',
        fotoTemuanPreview: (item.fotoTemuanPreview && item.fotoTemuanPreview[0]) || ''
      };
      mappedItem.followUpEligible = isOpenOrProgress(mappedItem.status) && isPjaAssignee(identity, mappedItem);
      return mappedItem;
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
      meta.textContent = `Notifikasi untuk login: ${identity.username} (termasuk tugas follow-up sebagai PJA)`;
    }

    if (items.length === 0) {
      cards.innerHTML = '<article class="task-card"><p class="muted">Belum ada notifikasi KTA/TTA untuk akun ini.</p></article>';
      return;
    }

    cards.innerHTML = items.map(function (item) {
      const superAdminActions = identity.role === 'Super Admin'
        ? `<div class="form-actions"><button type="button" class="small task-edit-btn" data-source="${escapeHtml(item.source)}" data-id="${escapeHtml(item.id)}">Edit</button><button type="button" class="small task-delete-btn" data-source="${escapeHtml(item.source)}" data-id="${escapeHtml(item.id)}">Hapus</button></div>`
        : '';
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
            <li><span>Nama PJA</span><strong>${escapeHtml(item.namaPja || '-')}</strong></li>
            <li><span>Status</span><strong>${escapeHtml(item.status)}</strong></li>
          </ul>

          ${item.followUpEligible ? `<div class="form-actions"><button type="button" class="small task-followup-btn" data-source="${escapeHtml(item.source)}" data-id="${escapeHtml(item.id)}">Tindak Lanjut</button></div>` : ''}
          ${superAdminActions}
        </article>
      `;
    }).join('');
  }

  async function deleteTaskItem(source, id) {
    if (!id || !source) return;

    if (source === 'KTA') {
      const list = readJson(KTA_KEY) || [];
      writeJson(KTA_KEY, list.filter(function (item) { return item.id !== id; }));
      try {
        if (window.AIOSApi && typeof window.AIOSApi.deleteKta === 'function' && window.AIOSApi.getToken && window.AIOSApi.getToken()) {
          await window.AIOSApi.deleteKta(id);
        }
      } catch (err) {
        console.warn('Tasklist delete KTA API failed:', err && err.message ? err.message : err);
      }
    }

    if (source === 'TTA') {
      const list = readJson(TTA_KEY) || [];
      writeJson(TTA_KEY, list.filter(function (item) { return item.id !== id; }));
      try {
        if (window.AIOSApi && typeof window.AIOSApi.deleteTta === 'function' && window.AIOSApi.getToken && window.AIOSApi.getToken()) {
          await window.AIOSApi.deleteTta(id);
        }
      } catch (err) {
        console.warn('Tasklist delete TTA API failed:', err && err.message ? err.message : err);
      }
    }

    if (Array.isArray(remoteItems)) {
      remoteItems = remoteItems.filter(function (item) {
        const itemSource = item.type || item.source || '-';
        const itemId = item.id || '-';
        return !(itemSource === source && itemId === id);
      });
    }
  }

  async function handleCardActions(event) {
    const followupBtn = event.target.closest('.task-followup-btn');
    const editBtn = event.target.closest('.task-edit-btn');
    const deleteBtn = event.target.closest('.task-delete-btn');

    if (followupBtn) {
      const source = followupBtn.getAttribute('data-source') || '';
      const id = followupBtn.getAttribute('data-id') || '';
      if (!source || !id) return;

      if (source === 'KTA') {
        window.location.href = `kta.html?action=followup&id=${encodeURIComponent(id)}`;
        return;
      }

      if (source === 'TTA') {
        window.location.href = `tta.html?action=followup&id=${encodeURIComponent(id)}`;
      }
      return;
    }

    if (!currentIdentity || currentIdentity.role !== 'Super Admin') return;

    if (editBtn) {
      const source = editBtn.getAttribute('data-source') || '';
      const id = editBtn.getAttribute('data-id') || '';
      if (!source || !id) return;
      if (source === 'KTA') {
        window.location.href = `kta.html?action=edit&id=${encodeURIComponent(id)}`;
        return;
      }
      if (source === 'TTA') {
        window.location.href = `tta.html?action=edit&id=${encodeURIComponent(id)}`;
      }
      return;
    }

    if (deleteBtn) {
      const source = deleteBtn.getAttribute('data-source') || '';
      const id = deleteBtn.getAttribute('data-id') || '';
      if (!source || !id) return;
      if (!confirm(`Hapus data ${source} ${id}?`)) return;
      await deleteTaskItem(source, id);
      render(currentIdentity);
    }
  }

  async function init() {
    const identity = getCurrentIdentity();
    currentIdentity = identity;
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

    const cards = document.getElementById('tasklist-cards');
    if (cards) cards.addEventListener('click', handleCardActions);

    await syncTasklistFromApi();
    render(identity);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
