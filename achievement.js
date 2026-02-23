(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const KTA_KEY = 'aios_kta_records';
  const TTA_KEY = 'aios_tta_records';

  const state = {
    identity: null,
    activeTab: 'KTA',
    records: {
      KTA: [],
      TTA: []
    },
    filters: {
      departemen: null,
      perusahaan: null,
      kategoriTemuan: null,
      lokasiTemuan: null,
      riskLevel: null,
      namaPja: null
    }
  };

  const chartDimensions = [
    { key: 'departemen', title: 'Berdasarkan Departemen' },
    { key: 'perusahaan', title: 'Berdasarkan Perusahaan' },
    { key: 'kategoriTemuan', title: 'Berdasarkan Kategori Temuan' },
    { key: 'lokasiTemuan', title: 'Berdasarkan Lokasi Temuan' },
    { key: 'riskLevel', title: 'Berdasarkan Risk Level' },
    { key: 'namaPja', title: 'Berdasarkan Nama PJA' }
  ];

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

  function normalizeStatus(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'open') return 'Open';
    if (raw === 'progress') return 'Progress';
    if (raw === 'close') return 'Close';
    return '-';
  }

  function normalizeLabel(value) {
    const text = String(value || '').trim();
    return text || '-';
  }

  function normalizeDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function getIdentity() {
    const session = readJson(SESSION_KEY) || {};
    const users = readJson(USER_KEY) || [];
    const username = (session.username || '').trim();

    const matched = users.find(function (user) {
      return user.username === username || user.email === username;
    });

    return {
      username: username,
      nama: (matched && matched.nama) || '',
      role: session.role || ''
    };
  }

  function mapKtaRecord(item) {
    return {
      source: 'KTA',
      id: item.id || '-',
      tanggalLaporan: item.tanggalLaporan || '',
      namaPelapor: normalizeLabel(item.namaPelapor),
      departemen: normalizeLabel(item.departemen || item.departemenPelapor),
      perusahaan: normalizeLabel(item.perusahaan || item.perusahaanPelapor),
      kategoriTemuan: normalizeLabel(item.kategoriTemuan),
      lokasiTemuan: normalizeLabel(item.lokasiTemuan),
      riskLevel: normalizeLabel(item.riskLevel),
      namaPja: normalizeLabel(item.namaPja),
      status: normalizeStatus(item.status),
      detailTemuan: normalizeLabel(item.detailTemuan)
    };
  }

  function mapTtaRecord(item) {
    return {
      source: 'TTA',
      id: item.id || '-',
      tanggalLaporan: item.tanggalLaporan || '',
      namaPelapor: normalizeLabel(item.namaPelapor),
      departemen: normalizeLabel(item.departemenPelapor || item.departemen),
      perusahaan: normalizeLabel(item.perusahaanPelapor || item.perusahaan),
      kategoriTemuan: normalizeLabel(item.kategoriTemuan),
      lokasiTemuan: normalizeLabel(item.lokasiTemuan),
      riskLevel: normalizeLabel(item.riskLevel),
      namaPja: normalizeLabel(item.namaPja),
      status: normalizeStatus(item.status),
      detailTemuan: normalizeLabel(item.detailTemuan)
    };
  }

  async function syncDataFromApiIfReady() {
    try {
      if (!window.AIOSApi || !window.AIOSApi.getToken || !window.AIOSApi.getToken()) return;

      if (typeof window.AIOSApi.listUsers === 'function') {
        const users = await window.AIOSApi.listUsers();
        if (Array.isArray(users)) writeJson(USER_KEY, users);
      }

      if (typeof window.AIOSApi.listKta === 'function') {
        const kta = await window.AIOSApi.listKta();
        if (Array.isArray(kta)) writeJson(KTA_KEY, kta);
      }

      if (typeof window.AIOSApi.listTta === 'function') {
        const tta = await window.AIOSApi.listTta();
        if (Array.isArray(tta)) writeJson(TTA_KEY, tta);
      }
    } catch (err) {
      console.warn('Achievement API sync failed:', err && err.message ? err.message : err);
    }
  }

  function loadRecords() {
    const kta = (readJson(KTA_KEY) || []).map(mapKtaRecord);
    const tta = (readJson(TTA_KEY) || []).map(mapTtaRecord);

    state.records.KTA = kta;
    state.records.TTA = tta;
  }

  function clearFilters() {
    Object.keys(state.filters).forEach(function (key) {
      state.filters[key] = null;
    });
  }

  function filteredRecords(excludeDimension) {
    const list = state.records[state.activeTab] || [];
    return list.filter(function (item) {
      return Object.keys(state.filters).every(function (key) {
        if (excludeDimension && key === excludeDimension) return true;
        const selected = state.filters[key];
        if (!selected) return true;
        return normalizeLabel(item[key]) === selected;
      });
    });
  }

  function aggregateStatus(records) {
    const counts = { Open: 0, Progress: 0, Close: 0, '-': 0 };
    records.forEach(function (item) {
      const s = normalizeStatus(item.status);
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }

  function renderSummary(records) {
    const summary = document.getElementById('achievement-summary');
    if (!summary) return;

    const statusCounts = aggregateStatus(records);
    const total = records.length;
    const open = statusCounts.Open || 0;
    const progress = statusCounts.Progress || 0;
    const close = statusCounts.Close || 0;
    const openPercentage = total > 0 ? ((open / total) * 100) : 0;

    summary.innerHTML = `
      <article class="achievement-card">
        <span>Open</span>
        <strong>${open}</strong>
      </article>
      <article class="achievement-card">
        <span>Progress</span>
        <strong>${progress}</strong>
      </article>
      <article class="achievement-card">
        <span>Close</span>
        <strong>${close}</strong>
      </article>
      <article class="achievement-card">
        <span>Total ${escapeHtml(state.activeTab)}</span>
        <strong>${total}</strong>
      </article>
      <article class="achievement-card">
        <span>Persentase Open</span>
        <strong>${openPercentage.toFixed(1)}%</strong>
      </article>
    `;
  }

  function aggregateByDimension(records, key) {
    const map = new Map();
    records.forEach(function (item) {
      const label = normalizeLabel(item[key]);
      if (!map.has(label)) {
        map.set(label, {
          label: label,
          value: 0,
          open: 0,
          progress: 0,
          close: 0
        });
      }
      const bucket = map.get(label);
      bucket.value += 1;
      const status = normalizeStatus(item.status);
      if (status === 'Open') bucket.open += 1;
      else if (status === 'Progress') bucket.progress += 1;
      else if (status === 'Close') bucket.close += 1;
    });

    return Array.from(map.values())
      .sort(function (a, b) {
        if (b.value !== a.value) return b.value - a.value;
        return a.label.localeCompare(b.label);
      });
  }

  function renderActiveFilters() {
    const wrap = document.getElementById('achievement-active-filters');
    if (!wrap) return;

    const active = Object.keys(state.filters)
      .filter(function (key) { return !!state.filters[key]; })
      .map(function (key) {
        const def = chartDimensions.find(function (item) { return item.key === key; });
        const title = (def && def.title) || key;
        return `<button type="button" class="achievement-filter-chip" data-remove-filter="${escapeHtml(key)}">${escapeHtml(title)}: ${escapeHtml(state.filters[key])} ✕</button>`;
      });

    wrap.innerHTML = active.length
      ? `${active.join('')}<button type="button" id="achievement-reset-filter" class="achievement-filter-reset">Reset Semua</button>`
      : '<span class="muted">Tidak ada filter aktif.</span>';
  }

  function renderCharts() {
    const charts = document.getElementById('achievement-charts');
    if (!charts) return;

    const html = chartDimensions.map(function (dimension) {
      const baseRecords = filteredRecords(dimension.key);
      const rows = aggregateByDimension(baseRecords, dimension.key);
      const max = Math.max(1, ...rows.map(function (row) { return row.value; }), 1);
      const selected = state.filters[dimension.key];
      const totalGroup = rows.reduce(function (sum, row) { return sum + row.value; }, 0);

      const body = rows.length
        ? rows.map(function (row) {
            const width = Math.max(8, Math.round((row.value / max) * 100));
            const isActive = selected === row.label;
            return `
              <button type="button" class="achievement-bar-row ${isActive ? 'active' : ''}" data-dim="${escapeHtml(dimension.key)}" data-val="${escapeHtml(row.label)}">
                <span class="achievement-bar-label">${escapeHtml(row.label)} (${row.value})</span>
                <span class="achievement-bar-track"><span class="achievement-bar-fill" style="width:${width}%"></span></span>
                <span class="achievement-bar-value">${row.value}</span>
              </button>
            `;
          }).join('')
        : '<div class="muted">Belum ada data.</div>';

      const miniBars = rows.length
        ? rows.slice(0, 8).map(function (row) {
            const height = Math.max(12, Math.round((row.value / max) * 100));
            const shortLabel = row.label.length > 14 ? row.label.slice(0, 14) + '…' : row.label;
            const isActive = selected === row.label;
            return `
              <button type="button" class="achievement-mini-col ${isActive ? 'active' : ''}" data-dim="${escapeHtml(dimension.key)}" data-val="${escapeHtml(row.label)}" title="${escapeHtml(row.label)}: ${row.value}">
                <div class="achievement-mini-bar-wrap">
                  <span class="achievement-mini-bar" style="height:${height}%"></span>
                </div>
                <span class="achievement-mini-value">${row.value}</span>
                <span class="achievement-mini-label">${escapeHtml(shortLabel)}</span>
              </button>
            `;
          }).join('')
        : '';

      return `
        <section class="achievement-chart-card">
          <h4>${escapeHtml(dimension.title)}</h4>
          <p class="achievement-chart-note">Total data pada grafik ini: ${totalGroup} temuan. Klik bar untuk memfilter dashboard.</p>
          <div class="achievement-mini-chart" role="img" aria-label="Grafik batang ${escapeHtml(dimension.title)}">${miniBars}</div>
          <div class="achievement-bars" role="group">${body}</div>
        </section>
      `;
    }).join('');

    charts.innerHTML = html;
  }

  function renderDetailTable(records) {
    const title = document.getElementById('achievement-table-title');
    if (title) {
      title.textContent = state.activeTab === 'KTA'
        ? 'Tabel Detail Temuan KTA'
        : 'Tabel Detail Temuan TTA';
    }

    const tbody = document.querySelector('#achievement-detail-table tbody');
    if (!tbody) return;

    if (!records.length) {
      tbody.innerHTML = '<tr><td colspan="11" class="muted">Belum ada data.</td></tr>';
      return;
    }

    const rows = records
      .slice()
      .sort(function (a, b) {
        const da = new Date(a.tanggalLaporan || 0).getTime();
        const db = new Date(b.tanggalLaporan || 0).getTime();
        return db - da;
      })
      .map(function (item) {
        return `
          <tr>
            <td>${escapeHtml(item.id)}</td>
            <td>${escapeHtml(normalizeDate(item.tanggalLaporan))}</td>
            <td>${escapeHtml(item.namaPelapor)}</td>
            <td>${escapeHtml(item.departemen)}</td>
            <td>${escapeHtml(item.perusahaan)}</td>
            <td>${escapeHtml(item.kategoriTemuan)}</td>
            <td>${escapeHtml(item.lokasiTemuan)}</td>
            <td>${escapeHtml(item.riskLevel)}</td>
            <td>${escapeHtml(item.namaPja)}</td>
            <td>${escapeHtml(item.status)}</td>
            <td>${escapeHtml(item.detailTemuan)}</td>
          </tr>
        `;
      }).join('');

    tbody.innerHTML = rows;
  }

  function updateTabUi() {
    const tabKta = document.getElementById('tab-kta');
    const tabTta = document.getElementById('tab-tta');
    if (tabKta) tabKta.classList.toggle('active', state.activeTab === 'KTA');
    if (tabTta) tabTta.classList.toggle('active', state.activeTab === 'TTA');

    const title = document.getElementById('achievement-chart-title');
    if (title) title.textContent = `Grafik Pencapaian ${state.activeTab}`;
  }

  function renderAll() {
    updateTabUi();
    const data = filteredRecords();
    renderSummary(data);
    renderActiveFilters();
    renderCharts();
    renderDetailTable(data);
  }

  function setupInteractions() {
    const tabKta = document.getElementById('tab-kta');
    const tabTta = document.getElementById('tab-tta');
    const chartWrap = document.getElementById('achievement-charts');
    const activeFilterWrap = document.getElementById('achievement-active-filters');

    if (tabKta) {
      tabKta.addEventListener('click', function () {
        state.activeTab = 'KTA';
        clearFilters();
        renderAll();
      });
    }

    if (tabTta) {
      tabTta.addEventListener('click', function () {
        state.activeTab = 'TTA';
        clearFilters();
        renderAll();
      });
    }

    if (chartWrap) {
      chartWrap.addEventListener('click', function (event) {
        const row = event.target.closest('[data-dim][data-val]');
        if (!row) return;
        const dim = row.getAttribute('data-dim') || '';
        const val = row.getAttribute('data-val') || '';
        if (!dim || !val) return;

        state.filters[dim] = state.filters[dim] === val ? null : val;
        renderAll();
      });
    }

    if (activeFilterWrap) {
      activeFilterWrap.addEventListener('click', function (event) {
        const removeBtn = event.target.closest('[data-remove-filter]');
        if (removeBtn) {
          const key = removeBtn.getAttribute('data-remove-filter');
          if (key && Object.prototype.hasOwnProperty.call(state.filters, key)) {
            state.filters[key] = null;
            renderAll();
          }
          return;
        }

        const resetBtn = event.target.closest('#achievement-reset-filter');
        if (resetBtn) {
          clearFilters();
          renderAll();
        }
      });
    }
  }

  async function init() {
    state.identity = getIdentity();
    const meta = document.getElementById('achievement-meta');

    if (!state.identity.username) {
      if (meta) meta.textContent = 'Silakan login terlebih dahulu untuk melihat dashboard achievement.';
      return;
    }

    if (state.identity.role !== 'Super Admin' && state.identity.role !== 'Admin') {
      alert('Akses ditolak. Dashboard Achievement hanya untuk Admin dan Super Admin.');
      window.location.href = 'index.html';
      return;
    }

    if (meta) {
      meta.textContent = `Dashboard Achievement seluruh user. Login: ${state.identity.username} (${state.identity.role})`;
    }

    await syncDataFromApiIfReady();
    loadRecords();
    clearFilters();
    setupInteractions();
    renderAll();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
