(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const KTA_KEY = 'aios_kta';
  const TTA_KEY = 'aios_tta';
  const OBS_KEY = 'aios_observasi';
  const INSPEKSI_KEY = 'aios_inspeksi';
  const ROLE_USER = 'User';
  const ROLE_ADMIN = 'Admin';
  const ROLE_SUPER_ADMIN = 'Super Admin';

  const BASE_DIMENSIONS = ['nama', 'departemen', 'perusahaan', 'kategoriTemuan', 'lokasiTemuan', 'riskLevel', 'namaPjaLabel'];
  const TTA_EXTRA_DIMENSIONS = ['namaPelakuLabel', 'jabatanPelaku', 'departemenPelaku', 'perusahaanPelaku'];
  const OBS_DIMENSIONS = [
    'nama',
    'namaObserver',
    'jabatanObserver',
    'departemenObserver',
    'perusahaanObserver',
    'lokasi',
    'obsSopJawaban',
    'obsApdJawaban',
    'obsKompetensiJawaban',
    'obsLimaRJawaban',
    'obsFitJawaban'
  ];
  const INS_DIMENSIONS = ['nama', 'jenisInspeksi', 'namaInspektor', 'departemenInspektor', 'perusahaanInspektor'];
  const DIMENSION_LABELS = {
    monthKey: 'Bulan',
    status: 'Status',
    nama: 'Nama',
    departemen: 'Departemen',
    perusahaan: 'Perusahaan',
    kategoriTemuan: 'Kategori Temuan',
    lokasiTemuan: 'Lokasi Temuan',
    riskLevel: 'Risk Level',
    namaPjaLabel: 'Nama PJA',
    namaPelakuLabel: 'Nama Pelaku TTA',
    jabatanPelaku: 'Jabatan Pelaku TTA',
    departemenPelaku: 'Departemen Pelaku TTA',
    perusahaanPelaku: 'Perusahaan Pelaku TTA',
    namaObserver: 'Nama Observer',
    jabatanObserver: 'Jabatan Observer',
    departemenObserver: 'Departemen Observer',
    perusahaanObserver: 'Perusahaan Observer',
    lokasi: 'Lokasi',
    obsSopJawaban: 'SOP / WIN / JSA',
    obsApdJawaban: 'Penggunaan APD',
    obsKompetensiJawaban: 'Kesesuaian Kompetensi',
    obsLimaRJawaban: 'Program 5R',
    obsFitJawaban: 'Fit to Work',
    namaInspektor: 'Nama Inspektor',
    jenisInspeksi: 'Jenis Inspeksi',
    departemenInspektor: 'Departemen Inspektor',
    perusahaanInspektor: 'Perusahaan Inspektor'
  };

  const STATUS_COLORS = {
    Open: '#6366f1',
    Progress: '#fb923c',
    Close: '#10b981'
  };

  const BAR_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#14b8a6', '#f97316', '#e11d48', '#16a34a', '#4f46e5'];

  const userPanel = document.getElementById('achievement-user-panel');
  const adminPanel = document.getElementById('achievement-admin-panel');
  const submenu = document.getElementById('achievement-submenu');
  const lastUpdatedText = document.getElementById('achievement-last-updated');

  const userKtaCanvas = document.getElementById('kta-user-chart');
  const userTtaCanvas = document.getElementById('tta-user-chart');
  const userObsCanvas = document.getElementById('obs-user-chart');
  const userInspeksiCanvas = document.getElementById('inspeksi-user-chart');
  const userKtaDetail = document.getElementById('kta-user-detail');
  const userTtaDetail = document.getElementById('tta-user-detail');
  const userObsDetail = document.getElementById('obs-user-detail');
  const userInspeksiDetail = document.getElementById('inspeksi-user-detail');
  const userKtaEmpty = document.getElementById('kta-user-empty');
  const userTtaEmpty = document.getElementById('tta-user-empty');
  const userObsEmpty = document.getElementById('obs-user-empty');
  const userInspeksiEmpty = document.getElementById('inspeksi-user-empty');

  const kpiOpen = document.getElementById('kpi-open');
  const kpiProgress = document.getElementById('kpi-progress');
  const kpiClose = document.getElementById('kpi-close');
  const kpiTotal = document.getElementById('kpi-total');
  const kpiOpenPercent = document.getElementById('kpi-open-percent');

  const filterChips = document.getElementById('active-filter-chips');
  const nameFilterInput = document.getElementById('achievement-name-filter');
  const nameFilterList = document.getElementById('achievement-name-filter-list');
  const nameFilterResetButton = document.getElementById('achievement-name-filter-reset');
  const kpiSection = document.querySelector('.achievement-kpi-grid');
  const detailTbody = document.getElementById('achievement-admin-detail-tbody');
  const detailEmpty = document.getElementById('achievement-admin-detail-empty');
  const detailSection = document.querySelector('.achievement-table-wrap');
  const detailInsSection = document.getElementById('achievement-inspeksi-table-wrap');
  const detailInsTbody = document.getElementById('achievement-inspeksi-detail-tbody');
  const detailInsEmpty = document.getElementById('achievement-inspeksi-detail-empty');
  const detailObsSection = document.getElementById('achievement-observasi-table-wrap');
  const detailObsTbody = document.getElementById('achievement-observasi-detail-tbody');
  const detailObsEmpty = document.getElementById('achievement-observasi-detail-empty');
  const adminMonthlyCanvas = document.getElementById('admin-chart-monthly');
  const adminMonthlyDetail = document.getElementById('admin-monthly-detail');
  const adminMonthlyEmpty = document.getElementById('admin-monthly-empty');

  const adminChartCanvasMap = {
    nama: document.getElementById('admin-chart-nama'),
    departemen: document.getElementById('admin-chart-departemen'),
    perusahaan: document.getElementById('admin-chart-perusahaan'),
    kategoriTemuan: document.getElementById('admin-chart-kategoriTemuan'),
    lokasiTemuan: document.getElementById('admin-chart-lokasiTemuan'),
    riskLevel: document.getElementById('admin-chart-riskLevel'),
    namaPjaLabel: document.getElementById('admin-chart-namaPjaLabel'),
    namaPelakuLabel: document.getElementById('admin-chart-namaPelakuLabel'),
    jabatanPelaku: document.getElementById('admin-chart-jabatanPelaku'),
    departemenPelaku: document.getElementById('admin-chart-departemenPelaku'),
    perusahaanPelaku: document.getElementById('admin-chart-perusahaanPelaku'),
    namaObserver: document.getElementById('admin-chart-namaObserver'),
    jabatanObserver: document.getElementById('admin-chart-jabatanObserver'),
    departemenObserver: document.getElementById('admin-chart-departemenObserver'),
    perusahaanObserver: document.getElementById('admin-chart-perusahaanObserver'),
    obsSopJawaban: document.getElementById('admin-chart-obsSopJawaban'),
    obsApdJawaban: document.getElementById('admin-chart-obsApdJawaban'),
    obsKompetensiJawaban: document.getElementById('admin-chart-obsKompetensiJawaban'),
    obsLimaRJawaban: document.getElementById('admin-chart-obsLimaRJawaban'),
    obsFitJawaban: document.getElementById('admin-chart-obsFitJawaban'),
    namaInspektor: document.getElementById('admin-chart-namaInspektor'),
    jenisInspeksi: document.getElementById('admin-chart-jenisInspeksi'),
    departemenInspektor: document.getElementById('admin-chart-departemenInspektor'),
    perusahaanInspektor: document.getElementById('admin-chart-perusahaanInspektor')
  };

  const chartInstances = {};
  let activeModule = 'KTA';
  let activeFilters = createEmptyFilters();
  let isUserRealtimeBound = false;
  let isAdminRealtimeBound = false;
  let userRefreshTimer = null;
  let adminRefreshTimer = null;

  function createEmptyFilters() {
    return {
      monthKey: '',
      status: '',
      nama: '',
      departemen: '',
      perusahaan: '',
      kategoriTemuan: '',
      lokasiTemuan: '',
      riskLevel: '',
      namaPjaLabel: '',
      namaPelakuLabel: '',
      jabatanPelaku: '',
      departemenPelaku: '',
      perusahaanPelaku: '',
      namaObserver: '',
      jabatanObserver: '',
      departemenObserver: '',
      perusahaanObserver: '',
      lokasi: '',
      obsSopJawaban: '',
      obsApdJawaban: '',
      obsKompetensiJawaban: '',
      obsLimaRJawaban: '',
      obsFitJawaban: '',
      namaInspektor: '',
      jenisInspeksi: '',
      departemenInspektor: '',
      perusahaanInspektor: ''
    };
  }

  function updateLastUpdatedLabel() {
    if (!lastUpdatedText) return;
    const now = new Date();
    const formatted = now.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    lastUpdatedText.textContent = 'Data diperbarui: ' + formatted;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getNamaDimensionLabel() {
    if (activeModule === 'OBS') return 'Nama Observer';
    if (activeModule === 'INS') return 'Nama Inspektor';
    return 'Nama Pelapor';
  }

  function getActiveDimensions() {
    if (activeModule === 'INS') {
      return INS_DIMENSIONS.slice();
    }
    if (activeModule === 'OBS') {
      return OBS_DIMENSIONS.slice();
    }
    return activeModule === 'TTA'
      ? BASE_DIMENSIONS.concat(TTA_EXTRA_DIMENSIONS)
      : BASE_DIMENSIONS.slice();
  }

  function readList(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (_error) {
      return [];
    }
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function getCurrentUser() {
    const session = getSession();
    if (!session || !session.username) return null;

    const users = readList(USER_KEY);
    return users.find(function (user) {
      return String(user.username || '').toLowerCase() === String(session.username || '').toLowerCase();
    }) || null;
  }

  function requireSession() {
    const session = getSession();
    if (!session || !session.username) {
      alert('Silakan login terlebih dahulu.');
      window.location.href = '../index.html';
      return null;
    }
    return session;
  }

  function toMonthMeta(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return {
      key: year + '-' + month,
      label: date.toLocaleString('id-ID', { month: 'short', year: 'numeric' })
    };
  }

  function normalizeStatus(value) {
    const status = String(value || '').trim().toLowerCase();
    if (status === 'progress') return 'Progress';
    if (status === 'close') return 'Close';
    return 'Open';
  }

  function toNameOnlyLabel(value) {
    const raw = String(value || '').trim();
    if (!raw) return '-';
    return raw.includes(' - ') ? raw.split(' - ')[0].trim() : raw;
  }

  function normalizeRows(rows) {
    return rows.map(function (row) {
      const monthMeta = toMonthMeta(row.tanggalLaporan);
      return {
        id: row.id || '',
        monthKey: monthMeta ? monthMeta.key : '',
        noId: row.noId || '-',
        tanggalLaporan: row.tanggalLaporan || '-',
        nama: row.namaPelapor || '-',
        namaPelapor: row.namaPelapor || '-',
        departemen: row.departemen || '-',
        perusahaan: row.perusahaan || '-',
        kategoriTemuan: row.kategoriTemuan || '-',
        lokasiTemuan: row.lokasiTemuan || '-',
        riskLevel: row.riskLevel || '-',
        namaPjaLabel: toNameOnlyLabel(row.namaPjaLabel),
        namaPelakuLabel: row.namaPelakuLabel || '-',
        jabatanPelaku: row.jabatanPelaku || '-',
        departemenPelaku: row.departemenPelaku || '-',
        perusahaanPelaku: row.perusahaanPelaku || '-',
        status: normalizeStatus(row.status)
      };
    });
  }

  function getQuestionAnswer(row, key, fallbackKey) {
    const questions = row && row.questions ? row.questions : {};
    const source = questions[key] || questions[fallbackKey] || {};
    const value = String(source.jawaban || '').trim();
    return value || '-';
  }

  function normalizeObservasiRows(rows) {
    return rows.map(function (row) {
      const reportDate = String(row.tanggalLaporan || row.tanggalObservasi || '').trim();
      const monthMeta = toMonthMeta(reportDate);
      return {
        id: row.id || '',
        monthKey: monthMeta ? monthMeta.key : '',
        noId: row.noId || '-',
        tanggalLaporan: row.tanggalLaporan || row.tanggalObservasi || '-',
        nama: row.namaObserver || '-',
        namaObserver: row.namaObserver || '-',
        jabatanObserver: row.jabatanObserver || '-',
        departemenObserver: row.departemenObserver || '-',
        perusahaanObserver: row.perusahaanObserver || '-',
        lokasi: row.lokasi || '-',
        obsSopJawaban: getQuestionAnswer(row, 'sop'),
        obsApdJawaban: getQuestionAnswer(row, 'apd'),
        obsKompetensiJawaban: getQuestionAnswer(row, 'kompetensi'),
        obsLimaRJawaban: getQuestionAnswer(row, 'lima-r', 'limaR'),
        obsFitJawaban: getQuestionAnswer(row, 'fit')
      };
    });
  }

  function normalizeInspeksiRows(rows) {
    return rows.map(function (row) {
      const reportDate = String(row.tanggalLaporan || row.tanggalInspeksi || '').trim();
      const monthMeta = toMonthMeta(reportDate);
      return {
        id: row.id || '',
        monthKey: monthMeta ? monthMeta.key : '',
        noId: row.noId || '-',
        tanggalLaporan: row.tanggalLaporan || row.tanggalInspeksi || '-',
        nama: row.namaInspektor || '-',
        namaInspektor: row.namaInspektor || '-',
        jenisInspeksi: row.jenisInspeksi || '-',
        departemenInspektor: row.departemenInspektor || '-',
        perusahaanInspektor: row.perusahaanInspektor || '-'
      };
    });
  }

  function getModuleRows(module) {
    if (module === 'INS') {
      return normalizeInspeksiRows(readList(INSPEKSI_KEY));
    }
    if (module === 'OBS') {
      return normalizeObservasiRows(readList(OBS_KEY));
    }
    return normalizeRows(readList(module === 'KTA' ? KTA_KEY : TTA_KEY));
  }

  function aggregateMonthlyForUser(rows, currentUser) {
    const currentName = String((currentUser && currentUser.nama) || '').trim().toLowerCase();
    const map = {};

    rows.forEach(function (row) {
      if (String(row.namaPelapor || '').trim().toLowerCase() !== currentName) return;

      const monthMeta = toMonthMeta(row.tanggalLaporan);
      if (!monthMeta) return;

      if (!map[monthMeta.key]) {
        map[monthMeta.key] = {
          monthKey: monthMeta.key,
          monthLabel: monthMeta.label,
          Open: 0,
          Progress: 0,
          Close: 0
        };
      }
      map[monthMeta.key][normalizeStatus(row.status)] += 1;
    });

    return Object.keys(map)
      .map(function (key) { return map[key]; })
      .sort(function (a, b) { return a.monthKey.localeCompare(b.monthKey); });
  }

  function aggregateMonthlyForAdmin(rows) {
    const map = {};

    rows.forEach(function (row) {
      const monthMeta = toMonthMeta(row.tanggalLaporan);
      if (!monthMeta) return;

      if (!map[monthMeta.key]) {
        map[monthMeta.key] = {
          monthKey: monthMeta.key,
          monthLabel: monthMeta.label,
          Open: 0,
          Progress: 0,
          Close: 0
        };
      }

      map[monthMeta.key][normalizeStatus(row.status)] += 1;
    });

    return Object.keys(map)
      .map(function (key) { return map[key]; })
      .sort(function (a, b) { return a.monthKey.localeCompare(b.monthKey); });
  }

  function aggregateMonthlyTotal(rows) {
    const map = {};

    rows.forEach(function (row) {
      const monthMeta = toMonthMeta(row.tanggalLaporan);
      if (!monthMeta) return;

      if (!map[monthMeta.key]) {
        map[monthMeta.key] = {
          monthKey: monthMeta.key,
          monthLabel: monthMeta.label,
          total: 0
        };
      }

      map[monthMeta.key].total += 1;
    });

    return Object.keys(map)
      .map(function (key) { return map[key]; })
      .sort(function (a, b) { return a.monthKey.localeCompare(b.monthKey); });
  }

  function aggregateMonthlyObservasiForUser(rows, session, currentUser) {
    const sessionUsername = String((session && session.username) || '').trim().toLowerCase();
    const currentName = String((currentUser && currentUser.nama) || '').trim().toLowerCase();
    const map = {};

    rows.forEach(function (row) {
      const rowUsername = String((row && row.username) || '').trim().toLowerCase();
      const rowObserver = String((row && row.namaObserver) || '').trim().toLowerCase();
      const isOwnerByUsername = sessionUsername && rowUsername && rowUsername === sessionUsername;
      const isOwnerByName = currentName && rowObserver && rowObserver === currentName;
      if (!isOwnerByUsername && !isOwnerByName) return;

      const monthMeta = toMonthMeta(row.tanggalObservasi || row.tanggalLaporan);
      if (!monthMeta) return;

      if (!map[monthMeta.key]) {
        map[monthMeta.key] = {
          monthKey: monthMeta.key,
          monthLabel: monthMeta.label,
          total: 0
        };
      }

      map[monthMeta.key].total += 1;
    });

    return Object.keys(map)
      .map(function (key) { return map[key]; })
      .sort(function (a, b) { return a.monthKey.localeCompare(b.monthKey); });
  }

  function aggregateMonthlyInspeksiForUser(rows, session, currentUser) {
    const sessionUsername = String((session && session.username) || '').trim().toLowerCase();
    const currentName = String((currentUser && currentUser.nama) || '').trim().toLowerCase();
    const map = {};

    rows.forEach(function (row) {
      const rowCreatedBy = String((row && row.createdBy) || '').trim().toLowerCase();
      const rowInspector = String((row && row.namaInspektor) || '').trim().toLowerCase();
      const isOwnerByCreatedBy = sessionUsername && rowCreatedBy && rowCreatedBy === sessionUsername;
      const isOwnerByInspector = currentName && rowInspector && rowInspector === currentName;
      if (!isOwnerByCreatedBy && !isOwnerByInspector) return;

      const monthMeta = toMonthMeta(row.tanggalLaporan || row.tanggalInspeksi);
      if (!monthMeta) return;

      if (!map[monthMeta.key]) {
        map[monthMeta.key] = {
          monthKey: monthMeta.key,
          monthLabel: monthMeta.label,
          total: 0
        };
      }

      map[monthMeta.key].total += 1;
    });

    return Object.keys(map)
      .map(function (key) { return map[key]; })
      .sort(function (a, b) { return a.monthKey.localeCompare(b.monthKey); });
  }

  function destroyChart(key) {
    if (chartInstances[key]) {
      chartInstances[key].destroy();
      delete chartInstances[key];
    }
  }

  function renderUserDetail(detailContainer, rows) {
    if (!detailContainer) return;
    detailContainer.innerHTML = rows.map(function (item) {
      return '<span>' + item.monthLabel + ' | Open: <strong>' + item.Open + '</strong> | Progress: <strong>' + item.Progress + '</strong> | Close: <strong>' + item.Close + '</strong></span>';
    }).join('');
  }

  function renderUserMonthlyChart(canvas, chartKey, emptyText, detailContainer, rows, stackLabel) {
    destroyChart(chartKey);

    if (!rows.length) {
      if (emptyText) emptyText.classList.remove('hidden');
      if (detailContainer) detailContainer.innerHTML = '';
      return;
    }

    if (!canvas || typeof canvas.getContext !== 'function') {
      if (emptyText) emptyText.classList.remove('hidden');
      return;
    }

    if (emptyText) emptyText.classList.add('hidden');
    renderUserDetail(detailContainer, rows);

    const drawChart = function () {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      chartInstances[chartKey] = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: rows.map(function (item) { return item.monthLabel; }),
          datasets: [
            {
              label: 'Open',
              data: rows.map(function (item) { return item.Open; }),
              backgroundColor: STATUS_COLORS.Open,
              borderRadius: 6,
              stack: stackLabel
            },
            {
              label: 'Progress',
              data: rows.map(function (item) { return item.Progress; }),
              backgroundColor: STATUS_COLORS.Progress,
              borderRadius: 6,
              stack: stackLabel
            },
            {
              label: 'Close',
              data: rows.map(function (item) { return item.Close; }),
              backgroundColor: STATUS_COLORS.Close,
              borderRadius: 6,
              stack: stackLabel
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          },
          scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
          }
        }
      });

      if (chartInstances[chartKey]) {
        chartInstances[chartKey].resize();
        chartInstances[chartKey].update();
      }
    };

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(drawChart);
      return;
    }

    drawChart();
  }

  function renderUserMonthlyTotalChart(canvas, chartKey, emptyText, detailContainer, rows, datasetLabel, detailPrefix, color, onBarClick) {
    destroyChart(chartKey);

    if (!rows.length) {
      if (emptyText) emptyText.classList.remove('hidden');
      if (detailContainer) detailContainer.innerHTML = '';
      return;
    }

    if (!canvas || typeof canvas.getContext !== 'function') {
      if (emptyText) emptyText.classList.remove('hidden');
      return;
    }

    if (emptyText) emptyText.classList.add('hidden');
    if (detailContainer) {
      detailContainer.innerHTML = rows.map(function (item) {
        return '<span>' + item.monthLabel + ' | ' + detailPrefix + ': <strong>' + item.total + '</strong></span>';
      }).join('');
    }

    const drawChart = function () {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      chartInstances[chartKey] = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: rows.map(function (item) { return item.monthLabel; }),
          datasets: [{
            label: datasetLabel,
            data: rows.map(function (item) { return item.total; }),
            backgroundColor: color,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } }
          },
          onClick: function (_evt, activeElements) {
            if (typeof onBarClick !== 'function') return;
            if (!activeElements || !activeElements.length) return;
            const idx = activeElements[0].index;
            const selected = rows[idx] || null;
            onBarClick(selected);
          }
        }
      });

      if (chartInstances[chartKey]) {
        chartInstances[chartKey].resize();
        chartInstances[chartKey].update();
      }
    };

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(drawChart);
      return;
    }

    drawChart();
  }

  function renderUserMonthlyObservasiChart(canvas, chartKey, emptyText, detailContainer, rows, onBarClick) {
    renderUserMonthlyTotalChart(
      canvas,
      chartKey,
      emptyText,
      detailContainer,
      rows,
      'Total Observasi',
      'Total Observasi',
      '#0ea5e9',
      onBarClick
    );
  }

  function countByDimension(rows, dimension) {
    const counter = {};
    rows.forEach(function (row) {
      const value = String(row[dimension] || '-').trim() || '-';
      if (!counter[value]) counter[value] = 0;
      counter[value] += 1;
    });

    return Object.keys(counter)
      .map(function (label) {
        return { label: label, value: counter[label] };
      })
      .sort(function (a, b) {
        if (b.value !== a.value) return b.value - a.value;
        return a.label.localeCompare(b.label);
      });
  }

  function applyFilters(rows) {
    const dimensions = getActiveDimensions();
    return rows.filter(function (row) {
      if (activeFilters.monthKey && String(row.monthKey || '') !== String(activeFilters.monthKey)) {
        return false;
      }

      if (activeFilters.status && String(row.status || '') !== String(activeFilters.status)) {
        return false;
      }

      return dimensions.every(function (dimension) {
        if (!activeFilters[dimension]) return true;
        return String(row[dimension] || '') === String(activeFilters[dimension]);
      });
    });
  }

  function updateKpi(rows) {
    if (activeModule === 'OBS' || activeModule === 'INS') {
      kpiOpen.textContent = '-';
      kpiProgress.textContent = '-';
      kpiClose.textContent = '-';
      kpiOpenPercent.textContent = '-';
      kpiTotal.textContent = String(rows.length);
      return;
    }

    const openCount = rows.filter(function (item) { return item.status === 'Open'; }).length;
    const progressCount = rows.filter(function (item) { return item.status === 'Progress'; }).length;
    const closeCount = rows.filter(function (item) { return item.status === 'Close'; }).length;
    const totalCount = rows.length;
    const openPercent = totalCount > 0 ? (openCount / totalCount) * 100 : 0;

    kpiOpen.textContent = String(openCount);
    kpiProgress.textContent = String(progressCount);
    kpiClose.textContent = String(closeCount);
    kpiTotal.textContent = String(totalCount);
    kpiOpenPercent.textContent = openPercent.toFixed(2) + '%';
  }

  function renderFilterChips() {
    if (!filterChips) return;
    filterChips.innerHTML = '';
    const dimensions = getActiveDimensions();

    if (activeFilters.monthKey) {
      const monthChip = document.createElement('button');
      monthChip.type = 'button';
      monthChip.className = 'legend-chip filter-chip-btn';
      monthChip.dataset.dimension = 'monthKey';
      monthChip.textContent = DIMENSION_LABELS.monthKey + ': ' + activeFilters.monthKey + ' ×';
      filterChips.appendChild(monthChip);
    }

    if (activeFilters.status) {
      const statusChip = document.createElement('button');
      statusChip.type = 'button';
      statusChip.className = 'legend-chip filter-chip-btn';
      statusChip.dataset.dimension = 'status';
      statusChip.textContent = DIMENSION_LABELS.status + ': ' + activeFilters.status + ' ×';
      filterChips.appendChild(statusChip);
    }

    const activeKeys = dimensions.filter(function (dimension) {
      return !!activeFilters[dimension];
    });

    if (!activeKeys.length && !activeFilters.monthKey && !activeFilters.status) {
      const infoChip = document.createElement('span');
      infoChip.className = 'legend-chip';
      infoChip.textContent = 'Belum ada filter aktif';
      filterChips.appendChild(infoChip);
      return;
    }

    activeKeys.forEach(function (dimension) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'legend-chip filter-chip-btn';
      chip.dataset.dimension = dimension;
      const label = dimension === 'nama' ? getNamaDimensionLabel() : DIMENSION_LABELS[dimension];
      chip.textContent = label + ': ' + activeFilters[dimension] + ' ×';
      filterChips.appendChild(chip);
    });
  }

  function renderDetailTable(rows) {
    detailTbody.innerHTML = '';
    if (!rows.length) {
      detailEmpty.classList.remove('hidden');
      return;
    }

    detailEmpty.classList.add('hidden');
    rows.forEach(function (row) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + row.noId + '</td>' +
        '<td>' + row.tanggalLaporan + '</td>' +
        '<td>' + row.namaPelapor + '</td>' +
        '<td>' + row.departemen + '</td>' +
        '<td>' + row.perusahaan + '</td>' +
        '<td>' + row.kategoriTemuan + '</td>' +
        '<td>' + row.lokasiTemuan + '</td>' +
        '<td>' + row.riskLevel + '</td>' +
        '<td>' + row.namaPjaLabel + '</td>' +
        '<td>' + row.status + '</td>';
      detailTbody.appendChild(tr);
    });
  }

  function renderInspeksiDetailTable(rows) {
    if (!detailInsTbody || !detailInsEmpty) return;
    detailInsTbody.innerHTML = '';
    if (!rows.length) {
      detailInsEmpty.classList.remove('hidden');
      return;
    }

    detailInsEmpty.classList.add('hidden');
    rows.forEach(function (row) {
      const tr = document.createElement('tr');
      tr.dataset.monthKey = String(row.monthKey || '');
      tr.innerHTML =
        '<td>' + row.noId + '</td>' +
        '<td>' + row.tanggalLaporan + '</td>' +
        '<td>' + row.namaInspektor + '</td>' +
        '<td>' + row.jenisInspeksi + '</td>' +
        '<td>' + row.departemenInspektor + '</td>' +
        '<td>' + row.perusahaanInspektor + '</td>';
      detailInsTbody.appendChild(tr);
    });
  }

  function renderObservasiDetailTable(rows) {
    if (!detailObsTbody || !detailObsEmpty) return;
    detailObsTbody.innerHTML = '';
    if (!rows.length) {
      detailObsEmpty.classList.remove('hidden');
      return;
    }

    detailObsEmpty.classList.add('hidden');
    rows.forEach(function (row) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + row.noId + '</td>' +
        '<td>' + row.tanggalLaporan + '</td>' +
        '<td>' + row.namaObserver + '</td>' +
        '<td>' + row.jabatanObserver + '</td>' +
        '<td>' + row.departemenObserver + '</td>' +
        '<td>' + row.perusahaanObserver + '</td>' +
        '<td>' + row.lokasi + '</td>' +
        '<td>' + row.obsSopJawaban + '</td>' +
        '<td>' + row.obsApdJawaban + '</td>' +
        '<td>' + row.obsKompetensiJawaban + '</td>' +
        '<td>' + row.obsLimaRJawaban + '</td>' +
        '<td>' + row.obsFitJawaban + '</td>';
      detailObsTbody.appendChild(tr);
    });
  }

  function focusInspeksiRowByMonth(monthKey) {
    if (!detailInsSection || !detailInsTbody || !monthKey) return;
    const row = detailInsTbody.querySelector('tr[data-month-key="' + monthKey + '"]');
    if (!row) return;

    row.classList.add('achievement-row-highlight');
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });

    window.setTimeout(function () {
      row.classList.remove('achievement-row-highlight');
    }, 1400);
  }

  function renderAdminDimensionChart(dimension, rows) {
    const chartKey = 'admin-' + dimension;
    destroyChart(chartKey);

    const canvas = adminChartCanvasMap[dimension];
    if (!canvas) return;
    const entries = countByDimension(rows, dimension);

    const ctx = canvas.getContext('2d');
    chartInstances[chartKey] = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: entries.map(function (item) { return item.label; }),
        datasets: [{
          label: 'Total ' + activeModule,
          data: entries.map(function (item) { return item.value; }),
          backgroundColor: entries.map(function (_item, index) {
            return BAR_COLORS[index % BAR_COLORS.length];
          }),
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          x: {
            ticks: {
              callback: function (value) {
                const label = this.getLabelForValue(value);
                return label.length > 14 ? label.slice(0, 14) + '…' : label;
              }
            }
          },
          y: { beginAtZero: true, ticks: { precision: 0 } }
        },
        onClick: function (_evt, activeElements) {
          if (!activeElements || !activeElements.length) return;
          const idx = activeElements[0].index;
          const selectedLabel = entries[idx] ? entries[idx].label : '';
          if (!selectedLabel) return;

          if (activeFilters[dimension] === selectedLabel) {
            activeFilters[dimension] = '';
          } else {
            activeFilters[dimension] = selectedLabel;
          }
          renderAdminDashboard();
        }
      }
    });
  }

  function renderAdminMonthlyChart(rows) {
    if (!adminMonthlyCanvas) return;

    if (activeModule === 'INS') {
      const monthlyRows = aggregateMonthlyTotal(rows);
      renderUserMonthlyTotalChart(
        adminMonthlyCanvas,
        'admin-monthly',
        adminMonthlyEmpty,
        adminMonthlyDetail,
        monthlyRows,
        'Total Inspeksi',
        'Total Inspeksi',
        '#14b8a6',
        function (selected) {
          const selectedMonth = selected && selected.monthKey ? selected.monthKey : '';
          if (!selectedMonth) return;
          activeFilters.monthKey = activeFilters.monthKey === selectedMonth ? '' : selectedMonth;
          renderAdminDashboard();
          if (activeFilters.monthKey) {
            window.setTimeout(function () {
              focusInspeksiRowByMonth(activeFilters.monthKey);
            }, 0);
          }
        }
      );
      return;
    }

    if (activeModule === 'OBS') {
      const monthlyRows = aggregateMonthlyTotal(rows);
      renderUserMonthlyObservasiChart(
        adminMonthlyCanvas,
        'admin-monthly',
        adminMonthlyEmpty,
        adminMonthlyDetail,
        monthlyRows,
        function (selected) {
          const selectedMonth = selected && selected.monthKey ? selected.monthKey : '';
          if (!selectedMonth) return;
          activeFilters.monthKey = activeFilters.monthKey === selectedMonth ? '' : selectedMonth;
          renderAdminDashboard();
        }
      );
      return;
    }

    const monthlyRows = aggregateMonthlyForAdmin(rows);
    renderUserMonthlyChart(adminMonthlyCanvas, 'admin-monthly', adminMonthlyEmpty, adminMonthlyDetail, monthlyRows, activeModule);
  }

  function updateDimensionCardVisibility() {
    const dimensions = getActiveDimensions();
    const cards = document.querySelectorAll('[data-dimension-card]');

    cards.forEach(function (card) {
      const dimension = card.getAttribute('data-dimension-card') || '';
      if (dimension === 'monthly') {
        card.classList.remove('hidden');
        return;
      }
      if (dimensions.indexOf(dimension) >= 0) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }

  function updateNamaDimensionTitle() {
    const namaCard = document.querySelector('[data-dimension-card="nama"] h3');
    if (!namaCard) return;

    namaCard.textContent = 'Berdasarkan ' + getNamaDimensionLabel();
  }

  function applyFiltersWithoutNama(rows) {
    const dimensions = getActiveDimensions();
    return rows.filter(function (row) {
      if (activeFilters.monthKey && String(row.monthKey || '') !== String(activeFilters.monthKey)) {
        return false;
      }

      if (activeFilters.status && String(row.status || '') !== String(activeFilters.status)) {
        return false;
      }

      return dimensions.every(function (dimension) {
        if (dimension === 'nama') return true;
        if (!activeFilters[dimension]) return true;
        return String(row[dimension] || '') === String(activeFilters[dimension]);
      });
    });
  }

  function renderNamaFilterControl(rows) {
    if (!nameFilterInput || !nameFilterList) return;

    const rowsForOptions = applyFiltersWithoutNama(rows);
    const options = Array.from(new Set(rowsForOptions.map(function (item) {
      return String(item.nama || '-').trim();
    }).filter(function (value) {
      return !!value;
    })));

    options.sort(function (a, b) {
      return a.localeCompare(b, 'id', { sensitivity: 'base' });
    });

    nameFilterList.innerHTML = options.map(function (value) {
      return '<option value="' + escapeHtml(value) + '"></option>';
    }).join('');

    nameFilterInput.placeholder = 'Cari dan pilih ' + getNamaDimensionLabel().toLowerCase() + '...';
    nameFilterInput.disabled = options.length === 0;
    nameFilterInput.value = activeFilters.nama || '';
  }

  function syncStatusCardActiveState() {
    if (!kpiSection) return;
    const statusCards = kpiSection.querySelectorAll('[data-status-filter]');
    statusCards.forEach(function (card) {
      const value = String(card.getAttribute('data-status-filter') || '').trim();
      if (value && value === activeFilters.status) card.classList.add('active');
      else card.classList.remove('active');
    });
  }

  function renderAdminDashboard() {
    const baseRows = getModuleRows(activeModule);
    const filteredRows = applyFilters(baseRows);

    updateDimensionCardVisibility();
    updateNamaDimensionTitle();
    renderNamaFilterControl(baseRows);
    if (kpiSection) {
      kpiSection.classList.toggle('hidden', activeModule === 'OBS' || activeModule === 'INS');
    }
    if (detailSection) {
      detailSection.classList.toggle('hidden', activeModule === 'OBS' || activeModule === 'INS');
    }
    if (detailInsSection) {
      detailInsSection.classList.toggle('hidden', activeModule !== 'INS');
    }
    if (detailObsSection) {
      detailObsSection.classList.toggle('hidden', activeModule !== 'OBS');
    }
    if (activeModule === 'OBS' || activeModule === 'INS') {
      activeFilters.status = '';
    }
    updateKpi(filteredRows);
    syncStatusCardActiveState();
    renderFilterChips();
    if (activeModule === 'INS') {
      renderInspeksiDetailTable(filteredRows);
    } else if (activeModule === 'OBS') {
      renderObservasiDetailTable(filteredRows);
    } else if (activeModule !== 'OBS') {
      renderDetailTable(filteredRows);
    }
    renderAdminMonthlyChart(filteredRows);

    getActiveDimensions().forEach(function (dimension) {
      renderAdminDimensionChart(dimension, filteredRows);
    });

    Object.keys(chartInstances).forEach(function (key) {
      if (key.indexOf('admin-') !== 0) return;
      const dimension = key.replace('admin-', '');
      if (getActiveDimensions().indexOf(dimension) < 0) {
        destroyChart(key);
      }
    });

    updateLastUpdatedLabel();
  }

  function setSubmenuActive(module) {
    const buttons = submenu.querySelectorAll('.submenu-btn[data-module]');
    buttons.forEach(function (btn) {
      if (btn.dataset.module === module) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  function initUserDashboard() {
    const session = getSession();
    if (!session) return;

    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert('Profil user tidak ditemukan. Silakan login ulang.');
      window.location.href = '../index.html';
      return;
    }

    const ktaRows = getModuleRows('KTA');
    const ttaRows = getModuleRows('TTA');
    const observasiRows = readList(OBS_KEY);
    const inspeksiRows = readList(INSPEKSI_KEY);
    const ktaMonthly = aggregateMonthlyForUser(ktaRows, currentUser);
    const ttaMonthly = aggregateMonthlyForUser(ttaRows, currentUser);
    const observasiMonthly = aggregateMonthlyObservasiForUser(observasiRows, session, currentUser);
    const inspeksiMonthly = aggregateMonthlyInspeksiForUser(inspeksiRows, session, currentUser);

    renderUserMonthlyChart(userKtaCanvas, 'user-kta', userKtaEmpty, userKtaDetail, ktaMonthly, 'KTA');
    renderUserMonthlyChart(userTtaCanvas, 'user-tta', userTtaEmpty, userTtaDetail, ttaMonthly, 'TTA');
    renderUserMonthlyObservasiChart(userObsCanvas, 'user-observasi', userObsEmpty, userObsDetail, observasiMonthly);
    renderUserMonthlyTotalChart(
      userInspeksiCanvas,
      'user-inspeksi',
      userInspeksiEmpty,
      userInspeksiDetail,
      inspeksiMonthly,
      'Total Inspeksi',
      'Total Inspeksi',
      '#14b8a6'
    );

    updateLastUpdatedLabel();
  }

  function bindUserRealtimeRefresh() {
    if (isUserRealtimeBound) return;
    isUserRealtimeBound = true;

    window.addEventListener('storage', function (event) {
      if (!event) return;
      const watchKeys = [SESSION_KEY, USER_KEY, KTA_KEY, TTA_KEY, OBS_KEY, INSPEKSI_KEY];
      if (event.key !== null && watchKeys.indexOf(event.key) < 0) return;
      if (userRefreshTimer) window.clearTimeout(userRefreshTimer);
      userRefreshTimer = window.setTimeout(function () {
        initUserDashboard();
      }, 180);
    });

    window.addEventListener('aios:cloud-sync', function (event) {
      const changedKeys = event && event.detail && Array.isArray(event.detail.changedKeys)
        ? event.detail.changedKeys
        : [];
      if (changedKeys.length > 0) {
        const watchKeys = [SESSION_KEY, USER_KEY, KTA_KEY, TTA_KEY, OBS_KEY, INSPEKSI_KEY];
        const hasRelevantChange = changedKeys.some(function (key) {
          return watchKeys.indexOf(key) >= 0;
        });
        if (!hasRelevantChange) return;
      }
      if (userRefreshTimer) window.clearTimeout(userRefreshTimer);
      userRefreshTimer = window.setTimeout(function () {
        initUserDashboard();
      }, 180);
    });
  }

  function bindAdminRealtimeRefresh() {
    if (isAdminRealtimeBound) return;
    isAdminRealtimeBound = true;

    window.addEventListener('storage', function (event) {
      if (!event) return;
      const watchKeys = [SESSION_KEY, USER_KEY, KTA_KEY, TTA_KEY, OBS_KEY, INSPEKSI_KEY];
      if (event.key !== null && watchKeys.indexOf(event.key) < 0) return;
      if (adminRefreshTimer) window.clearTimeout(adminRefreshTimer);
      adminRefreshTimer = window.setTimeout(function () {
        renderAdminDashboard();
      }, 180);
    });

    window.addEventListener('aios:cloud-sync', function (event) {
      const changedKeys = event && event.detail && Array.isArray(event.detail.changedKeys)
        ? event.detail.changedKeys
        : [];
      if (changedKeys.length > 0) {
        const watchKeys = [SESSION_KEY, USER_KEY, KTA_KEY, TTA_KEY, OBS_KEY, INSPEKSI_KEY];
        const hasRelevantChange = changedKeys.some(function (key) {
          return watchKeys.indexOf(key) >= 0;
        });
        if (!hasRelevantChange) return;
      }
      if (adminRefreshTimer) window.clearTimeout(adminRefreshTimer);
      adminRefreshTimer = window.setTimeout(function () {
        renderAdminDashboard();
      }, 180);
    });
  }

  function initAdminDashboard() {
    activeModule = 'KTA';
    activeFilters = createEmptyFilters();
    setSubmenuActive(activeModule);

    submenu.addEventListener('click', function (event) {
      const button = event.target.closest('.submenu-btn[data-module]');
      if (!button) return;
      const module = button.dataset.module;
      if (!module || module === activeModule) return;
      activeModule = module;
      activeFilters = createEmptyFilters();
      setSubmenuActive(activeModule);
      renderAdminDashboard();
    });

    filterChips.addEventListener('click', function (event) {
      const chip = event.target.closest('.filter-chip-btn[data-dimension]');
      if (!chip) return;
      const dimension = chip.dataset.dimension;
      if (!dimension) return;
      activeFilters[dimension] = '';
      renderAdminDashboard();
    });

    if (kpiSection) {
      kpiSection.addEventListener('click', function (event) {
        const card = event.target.closest('[data-status-filter]');
        if (!card || activeModule === 'OBS' || activeModule === 'INS') return;
        const status = String(card.getAttribute('data-status-filter') || '').trim();
        if (!status) return;
        activeFilters.status = activeFilters.status === status ? '' : status;
        renderAdminDashboard();
      });
    }

    if (nameFilterInput) {
      const applyNamaFilter = function () {
        const selected = String(nameFilterInput.value || '').trim();
        activeFilters.nama = selected;
        renderAdminDashboard();
      };

      nameFilterInput.addEventListener('change', applyNamaFilter);

      nameFilterInput.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        applyNamaFilter();
      });

      nameFilterInput.addEventListener('input', function () {
        if (String(nameFilterInput.value || '').trim()) return;
        if (!activeFilters.nama) return;
        activeFilters.nama = '';
        renderAdminDashboard();
      });
    }

    if (nameFilterResetButton) {
      nameFilterResetButton.addEventListener('click', function () {
        if (nameFilterInput) nameFilterInput.value = '';
        if (!activeFilters.nama) return;
        activeFilters.nama = '';
        renderAdminDashboard();
      });
    }

    renderAdminDashboard();
  }

  function init() {
    if (!window.Chart) {
      alert('Library grafik belum tersedia. Muat ulang halaman lalu coba lagi.');
      return;
    }

    const session = requireSession();
    if (!session) return;

    if (session.role === ROLE_USER) {
      userPanel.classList.remove('hidden');
      adminPanel.classList.add('hidden');
      initUserDashboard();
      bindUserRealtimeRefresh();
      return;
    }

    if (session.role === ROLE_ADMIN || session.role === ROLE_SUPER_ADMIN) {
      userPanel.classList.add('hidden');
      adminPanel.classList.remove('hidden');
      initAdminDashboard();
      bindAdminRealtimeRefresh();
      return;
    }

    alert('Role tidak memiliki akses ke halaman Achievement.');
    window.location.href = '../index.html';
  }

  init();
})();
