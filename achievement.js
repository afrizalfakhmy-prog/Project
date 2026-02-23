(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const KTA_KEY = 'aios_kta_records';
  const TTA_KEY = 'aios_tta_records';

  const state = {
    identity: null,
    activeTab: 'KTA',
    monthlyFilter: null,
    monthlyYear: null,
    statusFilter: null,
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
    state.monthlyFilter = null;
    state.monthlyYear = null;
    state.statusFilter = null;
  }

  function filteredRecords(excludeDimension, ignoreMonthlyFilter) {
    const list = state.records[state.activeTab] || [];
    return list.filter(function (item) {
      if (state.statusFilter && normalizeStatus(item.status) !== state.statusFilter) return false;

      const passedDimensionFilter = Object.keys(state.filters).every(function (key) {
        if (excludeDimension && key === excludeDimension) return true;
        const selected = state.filters[key];
        if (!selected) return true;
        return normalizeLabel(item[key]) === selected;
      });
      if (!passedDimensionFilter) return false;

      if (ignoreMonthlyFilter || !state.monthlyFilter) return true;
      const date = new Date(item.tanggalLaporan);
      if (Number.isNaN(date.getTime())) return false;
      return date.getFullYear() === state.monthlyFilter.year && date.getMonth() === state.monthlyFilter.month;
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
    const openActive = state.statusFilter === 'Open' ? 'active' : '';
    const progressActive = state.statusFilter === 'Progress' ? 'active' : '';
    const closeActive = state.statusFilter === 'Close' ? 'active' : '';

    summary.innerHTML = `
      <article class="achievement-card filterable ${openActive}" data-summary-status="Open">
        <span>Open</span>
        <strong>${open}</strong>
      </article>
      <article class="achievement-card filterable ${progressActive}" data-summary-status="Progress">
        <span>Progress</span>
        <strong>${progress}</strong>
      </article>
      <article class="achievement-card filterable ${closeActive}" data-summary-status="Close">
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

    if (state.statusFilter) {
      active.push(`<button type="button" class="achievement-filter-chip" data-remove-status="1">Status: ${escapeHtml(state.statusFilter)} ✕</button>`);
    }

    if (state.monthlyFilter) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthText = `${monthNames[state.monthlyFilter.month]} ${state.monthlyFilter.year}`;
      active.push(`<button type="button" class="achievement-filter-chip" data-remove-month="1">Bulan: ${escapeHtml(monthText)} ✕</button>`);
    }

    wrap.innerHTML = active.length
      ? `${active.join('')}<button type="button" id="achievement-reset-filter" class="achievement-filter-reset">Reset Semua</button>`
      : '<span class="muted">Tidak ada filter aktif.</span>';
  }

  function buildMonthlySeries(records) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const validDates = records
      .map(function (item) {
        const date = new Date(item.tanggalLaporan);
        return Number.isNaN(date.getTime()) ? null : date;
      })
      .filter(Boolean);

    const years = Array.from(new Set(validDates.map(function (date) { return date.getFullYear(); }))).sort(function (a, b) { return b - a; });

    const latestYear = years.length ? years[0] : new Date().getFullYear();
    let targetYear = state.monthlyYear || latestYear;
    if (years.length && !years.includes(targetYear)) {
      targetYear = latestYear;
      state.monthlyYear = latestYear;
    }
    if (!state.monthlyYear) state.monthlyYear = targetYear;

    const values = new Array(12).fill(0);
    validDates.forEach(function (date) {
      if (date.getFullYear() === targetYear) {
        values[date.getMonth()] += 1;
      }
    });

    const maxValue = Math.max(1, ...values);

    return {
      targetYear: targetYear,
      years: years.length ? years : [targetYear],
      maxValue: maxValue,
      items: monthNames.map(function (name, index) {
        return { month: name, value: values[index] };
      })
    };
  }

  function getAvailableYearsFromRecords(records) {
    const years = Array.from(new Set((records || [])
      .map(function (item) {
        const date = new Date(item.tanggalLaporan);
        return Number.isNaN(date.getTime()) ? null : date.getFullYear();
      })
      .filter(function (year) { return year !== null; })))
      .sort(function (a, b) { return b - a; });

    if (!years.length) {
      years.push(new Date().getFullYear());
    }
    return years;
  }

  function getUserOwnedRecords(source) {
    const sourceRecords = state.records[source] || [];
    const identity = state.identity || {};
    const candidateNames = [identity.username, identity.nama]
      .map(function (item) { return String(item || '').trim().toLowerCase(); })
      .filter(Boolean);

    if (!candidateNames.length) return [];

    return sourceRecords.filter(function (item) {
      const reporter = String(item.namaPelapor || '').trim().toLowerCase();
      return candidateNames.includes(reporter);
    });
  }

  function buildMonthlyStatusSeries(records, targetYear) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const buckets = new Array(12).fill(null).map(function () {
      return { total: 0, open: 0, progress: 0, close: 0 };
    });

    records.forEach(function (item) {
      const date = new Date(item.tanggalLaporan);
      if (Number.isNaN(date.getTime()) || date.getFullYear() !== targetYear) return;

      const month = date.getMonth();
      const bucket = buckets[month];
      bucket.total += 1;

      const status = normalizeStatus(item.status);
      if (status === 'Open') bucket.open += 1;
      else if (status === 'Progress') bucket.progress += 1;
      else if (status === 'Close') bucket.close += 1;
    });

    const maxValue = Math.max(1, ...buckets.map(function (bucket) { return bucket.total; }));

    return {
      maxValue: maxValue,
      items: monthNames.map(function (name, index) {
        return {
          month: name,
          total: buckets[index].total,
          open: buckets[index].open,
          progress: buckets[index].progress,
          close: buckets[index].close
        };
      })
    };
  }

  function renderUserMonthlyChartCard(type, series, year) {
    const barClass = type === 'KTA' ? 'ach-bar ach-bar-kta' : 'ach-bar ach-bar-tta';

    const cols = series.items.map(function (item) {
      const height = Math.max(8, Math.round((item.total / series.maxValue) * 100));
      return `
        <div class="ach-month-col ach-month-col--user" title="${escapeHtml(item.month)} ${year} | Total: ${item.total}, Open: ${item.open}, Progress: ${item.progress}, Close: ${item.close}">
          <div class="ach-bars">
            <span class="${barClass}" style="height:${height}%"></span>
          </div>
          <div class="ach-values">${item.total}</div>
          <div class="ach-status-detail">
            <span>Open: ${item.open}</span>
            <span>Progress: ${item.progress}</span>
            <span>Close: ${item.close}</span>
          </div>
          <div class="ach-label">${escapeHtml(item.month)}</div>
        </div>
      `;
    }).join('');

    return `
      <section class="achievement-chart-card">
        <h4>Pencapaian Bulanan ${escapeHtml(type)} (${year})</h4>
        <div class="achievement-status-legend" aria-label="Keterangan status">
          <span class="status-chip status-chip--open">Open</span>
          <span class="status-chip status-chip--progress">Progress</span>
          <span class="status-chip status-chip--close">Close</span>
        </div>
        <div class="achievement-monthly-chart" role="img" aria-label="Grafik bulanan ${escapeHtml(type)} tahun ${year} dengan detail status Open, Progress, dan Close">
          ${cols}
        </div>
      </section>
    `;
  }

  function renderUserDashboard() {
    const submenu = document.querySelector('.achievement-submenu');
    const summary = document.getElementById('achievement-summary');
    const activeFilters = document.getElementById('achievement-active-filters');
    const tableWrap = document.getElementById('achievement-detail-table');

    if (submenu) submenu.style.display = 'none';
    if (summary) summary.style.display = 'none';
    if (activeFilters && activeFilters.closest('.achievement-section')) {
      activeFilters.closest('.achievement-section').style.display = 'none';
    }
    if (tableWrap && tableWrap.closest('.achievement-section')) {
      tableWrap.closest('.achievement-section').style.display = 'none';
    }

    const chartTitle = document.getElementById('achievement-chart-title');
    if (chartTitle) chartTitle.textContent = 'Dashboard Pencapaian Bulanan KTA & TTA';

    const userKtaRecords = getUserOwnedRecords('KTA');
    const userTtaRecords = getUserOwnedRecords('TTA');
    const allUserRecords = userKtaRecords.concat(userTtaRecords);

    const years = getAvailableYearsFromRecords(allUserRecords);
    if (!state.monthlyYear || !years.includes(state.monthlyYear)) {
      state.monthlyYear = years[0];
    }

    const yearOptions = years.map(function (year) {
      const selected = year === state.monthlyYear ? 'selected' : '';
      return `<option value="${year}" ${selected}>${year}</option>`;
    }).join('');

    const ktaSeries = buildMonthlyStatusSeries(userKtaRecords, state.monthlyYear);
    const ttaSeries = buildMonthlyStatusSeries(userTtaRecords, state.monthlyYear);
    const statusCounts = aggregateStatus(allUserRecords);
    const total = allUserRecords.length;
    const closePercentage = total > 0 ? ((statusCounts.Close || 0) / total) * 100 : 0;

    const charts = document.getElementById('achievement-charts');
    if (!charts) return;
    charts.classList.remove('achievement-dual-grid');
    charts.classList.add('achievement-user-single-column');
    charts.innerHTML = `
      <section class="achievement-chart-card achievement-chart-card--monthly">
        <div class="achievement-monthly-head">
          <h4>Ringkasan Achievement Role User</h4>
          <label class="achievement-year-filter">Tahun
            <select id="achievement-year-select-user" class="achievement-year-select">${yearOptions}</select>
          </label>
        </div>
        <p class="achievement-chart-note">Data ditampilkan hanya dari isian yang dibuat oleh user login. Grafik bulanan menampilkan total temuan serta detail status Open, Progress, dan Close untuk KTA dan TTA.</p>
        <div class="achievement-user-summary">
          <article class="achievement-card">
            <span>Status Open</span>
            <strong>${statusCounts.Open || 0}</strong>
          </article>
          <article class="achievement-card">
            <span>Status Progress</span>
            <strong>${statusCounts.Progress || 0}</strong>
          </article>
          <article class="achievement-card">
            <span>Status Close</span>
            <strong>${statusCounts.Close || 0}</strong>
          </article>
          <article class="achievement-card">
            <span>Persentase Close / Total</span>
            <strong>${closePercentage.toFixed(1)}%</strong>
          </article>
        </div>
      </section>
      ${renderUserMonthlyChartCard('KTA', ktaSeries, state.monthlyYear)}
      ${renderUserMonthlyChartCard('TTA', ttaSeries, state.monthlyYear)}
    `;
  }

  function renderCharts() {
    const charts = document.getElementById('achievement-charts');
    if (!charts) return;

    const filtered = filteredRecords(null, true);
    const monthlySeries = buildMonthlySeries(filtered);
    const yearOptions = monthlySeries.years.map(function (year) {
      const selectedAttr = year === monthlySeries.targetYear ? 'selected' : '';
      return `<option value="${year}" ${selectedAttr}>${year}</option>`;
    }).join('');

    const monthlyBars = monthlySeries.items.map(function (item, monthIndex) {
      const height = Math.max(8, Math.round((item.value / monthlySeries.maxValue) * 100));
      const isActiveMonth = !!(state.monthlyFilter && state.monthlyFilter.year === monthlySeries.targetYear && state.monthlyFilter.month === monthIndex);
      return `
        <button type="button" class="ach-month-col ${isActiveMonth ? 'active' : ''}" data-month="${monthIndex}" data-year="${monthlySeries.targetYear}" title="${escapeHtml(item.month)} ${monthlySeries.targetYear}: ${item.value}">
          <div class="ach-bars">
            <span class="ach-bar" style="height:${height}%"></span>
          </div>
          <div class="ach-values">${item.value}</div>
          <div class="ach-label">${escapeHtml(item.month)}</div>
        </button>
      `;
    }).join('');

    const monthlyChartHtml = `
      <section class="achievement-chart-card achievement-chart-card--monthly">
        <div class="achievement-monthly-head">
          <h4>Pencapaian Bulanan ${escapeHtml(state.activeTab)} (${monthlySeries.targetYear})</h4>
          <label class="achievement-year-filter">Tahun
            <select id="achievement-year-select" class="achievement-year-select">${yearOptions}</select>
          </label>
        </div>
        <p class="achievement-chart-note">Ringkasan jumlah temuan per bulan. Grafik ini selalu ditampilkan paling atas.</p>
        <div class="achievement-monthly-chart" role="img" aria-label="Grafik pencapaian bulanan ${escapeHtml(state.activeTab)} tahun ${monthlySeries.targetYear}">
          ${monthlyBars}
        </div>
      </section>
    `;

    const dimensionChartsHtml = chartDimensions.map(function (dimension) {
      const baseRecords = filteredRecords(dimension.key);
      const rows = aggregateByDimension(baseRecords, dimension.key);
      const max = Math.max(1, ...rows.map(function (row) { return row.value; }), 1);
      const selected = state.filters[dimension.key];
      const totalGroup = rows.reduce(function (sum, row) { return sum + row.value; }, 0);

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
        </section>
      `;
    }).join('');

    charts.innerHTML = monthlyChartHtml + dimensionChartsHtml;
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
    if (state.identity && state.identity.role === 'User') {
      const chartWrapUser = document.getElementById('achievement-charts');
      if (chartWrapUser) {
        chartWrapUser.addEventListener('change', function (event) {
          const yearSelectUser = event.target.closest('#achievement-year-select-user');
          if (!yearSelectUser) return;
          const year = Number(yearSelectUser.value);
          if (Number.isNaN(year)) return;
          state.monthlyYear = year;
          renderUserDashboard();
        });
      }
      return;
    }

    const tabKta = document.getElementById('tab-kta');
    const tabTta = document.getElementById('tab-tta');
    const chartWrap = document.getElementById('achievement-charts');
    const activeFilterWrap = document.getElementById('achievement-active-filters');
    const summaryWrap = document.getElementById('achievement-summary');

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
      chartWrap.addEventListener('change', function (event) {
        const yearSelect = event.target.closest('#achievement-year-select');
        if (!yearSelect) return;
        const year = Number(yearSelect.value);
        if (!Number.isNaN(year)) {
          state.monthlyYear = year;
          state.monthlyFilter = null;
          renderAll();
        }
      });

      chartWrap.addEventListener('click', function (event) {
        const monthBtn = event.target.closest('[data-month][data-year]');
        if (monthBtn) {
          const month = Number(monthBtn.getAttribute('data-month'));
          const year = Number(monthBtn.getAttribute('data-year'));
          if (!Number.isNaN(month) && !Number.isNaN(year)) {
            const same = state.monthlyFilter && state.monthlyFilter.month === month && state.monthlyFilter.year === year;
            state.monthlyFilter = same ? null : { month: month, year: year };
            renderAll();
          }
          return;
        }

        const row = event.target.closest('[data-dim][data-val]');
        if (!row) return;
        const dim = row.getAttribute('data-dim') || '';
        const val = row.getAttribute('data-val') || '';
        if (!dim || !val) return;

        state.filters[dim] = state.filters[dim] === val ? null : val;
        renderAll();
      });
    }

    if (summaryWrap) {
      summaryWrap.addEventListener('click', function (event) {
        const statusCard = event.target.closest('[data-summary-status]');
        if (!statusCard) return;
        const status = statusCard.getAttribute('data-summary-status');
        if (!status) return;
        state.statusFilter = state.statusFilter === status ? null : status;
        renderAll();
      });
    }

    if (activeFilterWrap) {
      activeFilterWrap.addEventListener('click', function (event) {
        const removeStatusBtn = event.target.closest('[data-remove-status]');
        if (removeStatusBtn) {
          state.statusFilter = null;
          renderAll();
          return;
        }

        const removeMonthBtn = event.target.closest('[data-remove-month]');
        if (removeMonthBtn) {
          state.monthlyFilter = null;
          renderAll();
          return;
        }

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

    if (state.identity.role !== 'Super Admin' && state.identity.role !== 'Admin' && state.identity.role !== 'User') {
      alert('Akses ditolak. Role Anda belum memiliki izin ke halaman Achievement.');
      window.location.href = 'index.html';
      return;
    }

    if (meta) {
      if (state.identity.role === 'User') {
        meta.textContent = `Dashboard Achievement bulanan KTA & TTA. Login: ${state.identity.username} (${state.identity.role})`;
      } else {
        meta.textContent = `Dashboard Achievement seluruh user. Login: ${state.identity.username} (${state.identity.role})`;
      }
    }

    await syncDataFromApiIfReady();
    loadRecords();
    setupInteractions();
    if (state.identity.role === 'User') {
      renderUserDashboard();
      return;
    }

    clearFilters();
    renderAll();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
