(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const DEPT_KEY = 'aios_departments';
  const COMPANY_KEY = 'aios_companies';
  const SPIP_KEY = 'aios_spip';

  const KATEGORI_JENIS_MAP = {
    'A2B': [
      'Light DT',
      'Heavy DT',
      'Excavator',
      'Dozer',
      'Grader',
      'Compactor',
      'Wheel Loader',
      'Shovel',
      'Backhoe Loader',
      'Tractor',
      'Drilling Machine',
      'Rig Drill',
      'Trailer',
      'Other'
    ],
    'Sarana': [
      'LV Single Cabin',
      'LV Double Cabin',
      'Man Haul',
      'Bus',
      'Station'
    ],
    'Alat Support': [
      'Fuel Truck',
      'Water Truck',
      'Lube Truck',
      'Fire Truck',
      'Waster Truck',
      'Washing Truck',
      'Flat Bed Trailer',
      'Lowboy',
      'Tyre Handler',
      'Hydroseeding',
      'Mixer Truck',
      'Skid Steer Loader',
      'Other'
    ],
    'Alat Angkat': [
      'Crane Truck',
      'Forklift',
      'All Terrain Crane',
      'Crawler Crane',
      'Overhead Crane',
      'Jib Crane',
      'Telehandler',
      'Forklift',
      'Other'
    ],
    'Fix Asset': [
      'Tower Lamp',
      'Water Pump',
      'Welding Machine',
      'Generator',
      'Compressor',
      'Coal Barge Loader',
      'Conveyor',
      'Crusher',
      'Tangki Timbun',
      'Bejana Tekan',
      'WTP',
      'STP',
      'Mixer Concrete',
      'Filter Press',
      'Bar Bending / Cutting',
      'Batching Plant',
      'Magnetic Sweeper',
      'Jumping Compactor',
      'Mixer Pump',
      'Trowel',
      'Sizer',
      'Geophysical Logging',
      'Other'
    ],
    'Bangunan': [
      'Kantor',
      'Mess',
      'Kantin / Dapur',
      'Workshop',
      'Gudang',
      'Masjid',
      'Power House',
      'Jetty',
      'Jembatan Timbang',
      'Tower',
      'Klinik',
      'Washing Bay',
      'Laboratorium',
      'WTP / STP / ROP',
      'Water Tank',
      'Fuel Tank',
      'Other'
    ],
    'Infrastruktur Tambang': [
      'Jalan Mining',
      'Jalan Hauling',
      'Change Shift Area',
      'ROM',
      'Settling Pond'
    ],
    'Support Khusus': [
      'Speed Boat',
      'Rubber Boat'
    ]
  };

  const CUSTOM_JENIS_VALUES = ['Other'];

  const form = document.getElementById('spip-form');
  const addButton = document.getElementById('add-spip-btn');
  const resetButton = document.getElementById('spip-reset-btn');
  const cancelButton = document.getElementById('spip-cancel-btn');
  const readOnlyActions = document.getElementById('spip-readonly-actions');
  const readOnlyCancelButton = document.getElementById('spip-readonly-cancel-btn');
  const komisioningOpenButton = document.getElementById('spip-komisioning-open-btn');
  const formActions = document.getElementById('spip-form-actions');
  const spipChartGrid = document.getElementById('spip-chart-grid');
  const spipChartResetButton = document.getElementById('spip-chart-reset-btn');
  const spipChartActiveFilters = document.getElementById('spip-chart-active-filters');
  const tbody = document.getElementById('spip-tbody');
  const emptyText = document.getElementById('spip-empty');

  const komisioningPanel = document.getElementById('spip-komisioning-panel');
  const komisioningTanggalKomisioningInput = document.getElementById('spip-komisioning-tanggal-komisioning');
  const komisioningTanggalExpiredInput = document.getElementById('spip-komisioning-tanggal-expired');
  const komisioningEmailInput = document.getElementById('spip-komisioning-email');
  const komisioningKomisionerInput = document.getElementById('spip-komisioning-komisioner');
  const komisioningKeteranganInput = document.getElementById('spip-komisioning-keterangan');
  const komisioningNamaInputerInput = document.getElementById('spip-komisioning-nama-inputer');
  const komisioningJabatanInputerInput = document.getElementById('spip-komisioning-jabatan-inputer');
  const komisioningDepartemenInputerInput = document.getElementById('spip-komisioning-departemen-inputer');
  const komisioningPerusahaanInputerInput = document.getElementById('spip-komisioning-perusahaan-inputer');
  const komisioningCcowInputerInput = document.getElementById('spip-komisioning-ccow-inputer');
  const komisioningSaveButton = document.getElementById('spip-komisioning-save-btn');
  const komisioningCancelButton = document.getElementById('spip-komisioning-cancel-btn');
  const komisioningHistoryTbody = document.getElementById('spip-komisioning-history-tbody');
  const komisioningHistoryEmpty = document.getElementById('spip-komisioning-history-empty');

  const kategoriInput = document.getElementById('spip-kategori');
  const jenisInput = document.getElementById('spip-jenis');
  const jenisCustomWrap = document.getElementById('spip-jenis-custom-wrap');
  const jenisCustomInput = document.getElementById('spip-jenis-custom');

  const namaInput = document.getElementById('spip-nama');
  const noUnitInput = document.getElementById('spip-no-unit');
  const merkInput = document.getElementById('spip-merk');
  const modelInput = document.getElementById('spip-model');
  const noSeriInput = document.getElementById('spip-no-seri');
  const tahunInput = document.getElementById('spip-tahun');
  const areaInputs = document.querySelectorAll('input[name="spip-area"]');
  const deptInput = document.getElementById('spip-dept');
  const perusahaanInput = document.getElementById('spip-perusahaan');
  const perusahaanCustodianInput = document.getElementById('spip-perusahaan-custodian');
  const ccowInput = document.getElementById('spip-ccow');

  const fotoInput = document.getElementById('spip-foto');
  const fotoPreview = document.getElementById('spip-foto-preview');

  const tanggalKomisioningInput = document.getElementById('spip-tanggal-komisioning');
  const tanggalExpiredInput = document.getElementById('spip-tanggal-expired');
  const statusInput = document.getElementById('spip-status');
  const komisionerInput = document.getElementById('spip-komisioner');
  const keteranganInput = document.getElementById('spip-keterangan');

  const qrImage = document.getElementById('spip-qr-image');
  const qrPayload = document.getElementById('spip-qr-payload');

  let fotoDraft = [];
  let editingId = '';
  let isReadOnlyView = false;
  let komisioningRecordId = '';
  let draftKomisioningHistory = [];
  let spipFilterState = {
    kategori: '',
    jenis: '',
    deptInCharge: '',
    perusahaan: '',
    perusahaanCustodian: '',
    ccow: '',
    areaKerja: '',
    status: ''
  };

  const SPIP_FILTER_META = [
    { key: 'kategori', title: 'Kategori', chartType: 'column' },
    { key: 'jenis', title: 'Jenis', chartType: 'column' },
    { key: 'deptInCharge', title: 'Dept In Charge', chartType: 'column' },
    { key: 'perusahaan', title: 'Perusahaan', chartType: 'column' },
    { key: 'perusahaanCustodian', title: 'Perusahaan Custodian', chartType: 'column' },
    { key: 'ccow', title: 'CCOW', chartType: 'pie3d' },
    { key: 'areaKerja', title: 'Area Kerja', chartType: 'pie3d' },
    { key: 'status', title: 'Status', chartType: 'pie3d' }
  ];

  const CHART_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

  function todayValue() {
    return new Date().toISOString().slice(0, 10);
  }

  function resolveStatusFromExpiredDate(expiredDate) {
    const dateValue = String(expiredDate || '').trim();
    if (!dateValue) return 'Active';
    return dateValue > todayValue() ? 'Active' : 'Expired';
  }

  function parseEmailList(rawValue) {
    return String(rawValue || '')
      .split(/[\n,;]+/)
      .map(function (item) { return String(item || '').trim(); })
      .filter(function (item) { return item.length > 0; });
  }

  function normalizeEmailList(rawValue) {
    return parseEmailList(rawValue).join(', ');
  }

  function isValidEmailAddress(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function syncMainCommissionFieldsFromSubForm() {
    const tanggalKomisioning = String((komisioningTanggalKomisioningInput && komisioningTanggalKomisioningInput.value) || '').trim();
    const tanggalExpired = String((komisioningTanggalExpiredInput && komisioningTanggalExpiredInput.value) || '').trim();
    const komisioner = String((komisioningKomisionerInput && komisioningKomisionerInput.value) || '').trim();
    const keterangan = String((komisioningKeteranganInput && komisioningKeteranganInput.value) || '').trim();

    tanggalKomisioningInput.value = tanggalKomisioning;
    tanggalExpiredInput.value = tanggalExpired;
    komisionerInput.value = komisioner;
    keteranganInput.value = keterangan;
  }

  function syncStatusFromExpiredDate() {
    statusInput.value = resolveStatusFromExpiredDate(komisioningTanggalExpiredInput ? komisioningTanggalExpiredInput.value : tanggalExpiredInput.value);
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function getRoleFlags() {
    const session = getSession();
    const role = String((session && session.role) || '').trim();
    return {
      role: role,
      canManage: role === 'Super Admin' || role === 'Admin'
    };
  }

  function syncRoleAccessUi() {
    const roleFlags = getRoleFlags();
    if (addButton) {
      addButton.classList.toggle('hidden', !roleFlags.canManage);
    }
    if (komisioningOpenButton) {
      komisioningOpenButton.classList.toggle('hidden', !roleFlags.canManage);
    }
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

  function getCurrentUserProfile() {
    const session = getSession();
    const username = String((session && session.username) || '').trim().toLowerCase();
    if (!username) return null;

    const users = readList(USER_KEY);
    return users.find(function (item) {
      return String((item && item.username) || '').trim().toLowerCase() === username;
    }) || null;
  }

  function syncKomisioningInputerIdentity() {
    const user = getCurrentUserProfile();
    if (komisioningNamaInputerInput) komisioningNamaInputerInput.value = String((user && user.nama) || '').trim();
    if (komisioningJabatanInputerInput) komisioningJabatanInputerInput.value = String((user && user.jabatan) || '').trim();
    if (komisioningDepartemenInputerInput) komisioningDepartemenInputerInput.value = String((user && user.departemen) || '').trim();
    if (komisioningPerusahaanInputerInput) komisioningPerusahaanInputerInput.value = String((user && user.perusahaan) || '').trim();
    if (komisioningCcowInputerInput) komisioningCcowInputerInput.value = String((user && user.ccow) || '').trim();
  }

  function readList(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (_error) {
      return [];
    }
  }

  function writeList(key, rows) {
    localStorage.setItem(key, JSON.stringify(rows));
  }

  function populateSelectFromRows(selectElement, rows, placeholder) {
    if (!selectElement) return;
    selectElement.innerHTML = '';

    const initialOption = document.createElement('option');
    initialOption.value = '';
    initialOption.textContent = placeholder;
    selectElement.appendChild(initialOption);

    rows.forEach(function (item) {
      const option = document.createElement('option');
      option.value = String(item.name || '').trim();
      option.textContent = String(item.name || '').trim();
      selectElement.appendChild(option);
    });
  }

  function populateStaticOptions() {
    const departments = readList(DEPT_KEY);
    const companies = readList(COMPANY_KEY);
    populateSelectFromRows(deptInput, departments, '(Pilih Departemen)');
    populateSelectFromRows(perusahaanInput, companies, '(Pilih Perusahaan)');
    populateSelectFromRows(perusahaanCustodianInput, companies, '(Pilih Perusahaan Custodian)');
  }

  function renderJenisOptions() {
    const kategori = String(kategoriInput.value || '').trim();
    const jenisList = KATEGORI_JENIS_MAP[kategori] || [];

    jenisInput.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = jenisList.length > 0 ? '(Pilih Jenis)' : '(Pilih Kategori terlebih dahulu)';
    jenisInput.appendChild(defaultOption);

    jenisList.forEach(function (jenis) {
      const option = document.createElement('option');
      option.value = jenis;
      option.textContent = jenis;
      jenisInput.appendChild(option);
    });

    jenisInput.value = '';
    syncJenisCustomVisibility();
  }

  function syncJenisCustomVisibility() {
    const selectedJenis = String(jenisInput.value || '').trim();
    const showCustom = CUSTOM_JENIS_VALUES.indexOf(selectedJenis) >= 0;

    if (showCustom) {
      jenisCustomWrap.classList.remove('hidden');
      jenisCustomInput.required = true;
      return;
    }

    jenisCustomWrap.classList.add('hidden');
    jenisCustomInput.required = false;
    jenisCustomInput.value = '';
  }

  function getAreaKerjaValues() {
    return Array.from(areaInputs)
      .filter(function (input) { return !!input.checked; })
      .map(function (input) { return input.value; });
  }

  function getJenisValueForPayload() {
    const selectedJenis = String(jenisInput.value || '').trim();
    if (CUSTOM_JENIS_VALUES.indexOf(selectedJenis) >= 0) {
      return String(jenisCustomInput.value || '').trim();
    }
    return selectedJenis;
  }

  function getFilterValuesByKey(record, key) {
    const target = record || {};
    if (key === 'areaKerja') {
      const values = Array.isArray(target.areaKerja) ? target.areaKerja : [];
      return values
        .map(function (item) { return String(item || '').trim(); })
        .filter(function (item) { return item.length > 0; });
    }

    const raw = String(target[key] || '').trim();
    return raw ? [raw] : [];
  }

  function hasActiveSpipFilters() {
    return Object.keys(spipFilterState).some(function (key) {
      return String(spipFilterState[key] || '').trim().length > 0;
    });
  }

  function getFilteredSpipRows(rows) {
    const list = Array.isArray(rows) ? rows : [];
    if (!hasActiveSpipFilters()) return list;

    return list.filter(function (record) {
      return Object.keys(spipFilterState).every(function (key) {
        const selected = String(spipFilterState[key] || '').trim();
        if (!selected) return true;
        const values = getFilterValuesByKey(record, key);
        return values.indexOf(selected) >= 0;
      });
    });
  }

  function getCountsByFilterKey(rows, key) {
    const list = Array.isArray(rows) ? rows : [];
    const counts = {};

    list.forEach(function (record) {
      const values = getFilterValuesByKey(record, key);
      values.forEach(function (value) {
        counts[value] = (counts[value] || 0) + 1;
      });
    });

    return Object.keys(counts)
      .map(function (value) {
        return { value: value, count: counts[value] };
      })
      .sort(function (a, b) {
        if (b.count !== a.count) return b.count - a.count;
        return a.value.localeCompare(b.value);
      });
  }

  function renderActiveFilterSummary() {
    if (!spipChartActiveFilters) return;

    const activeParts = SPIP_FILTER_META
      .filter(function (meta) {
        return String(spipFilterState[meta.key] || '').trim().length > 0;
      })
      .map(function (meta) {
        return meta.title + ': ' + spipFilterState[meta.key];
      });

    if (!activeParts.length) {
      spipChartActiveFilters.textContent = 'Filter aktif: (semua data)';
      return;
    }

    spipChartActiveFilters.textContent = 'Filter aktif: ' + activeParts.join(' | ');
  }

  function createSvgEl(tagName, attrs) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
    const props = attrs || {};
    Object.keys(props).forEach(function (key) {
      element.setAttribute(key, String(props[key]));
    });
    return element;
  }

  function colorByIndex(index) {
    const palette = CHART_COLORS;
    return palette[index % palette.length];
  }

  function darkenHexColor(hex, amount) {
    const raw = String(hex || '#000000').replace('#', '');
    const normalized = raw.length === 3
      ? raw.split('').map(function (c) { return c + c; }).join('')
      : raw;
    const delta = Number(amount || 0);

    function clamp(v) {
      return Math.max(0, Math.min(255, v));
    }

    const r = clamp(parseInt(normalized.slice(0, 2), 16) - delta);
    const g = clamp(parseInt(normalized.slice(2, 4), 16) - delta);
    const b = clamp(parseInt(normalized.slice(4, 6), 16) - delta);
    return '#' + [r, g, b].map(function (n) { return n.toString(16).padStart(2, '0'); }).join('');
  }

  function describeArcPath(cx, cy, radius, startAngle, endAngle) {
    const tau = Math.PI * 2;
    const sweep = Math.max(0, endAngle - startAngle);

    // SVG arc command cannot draw a perfect full circle in one arc segment.
    // Split full-circle slices into two half arcs so single-category pies still render.
    if (sweep >= (tau - 0.0001)) {
      return [
        'M', cx, cy,
        'L', cx, (cy - radius),
        'A', radius, radius, 0, 1, 1, cx, (cy + radius),
        'A', radius, radius, 0, 1, 1, cx, (cy - radius),
        'Z'
      ].join(' ');
    }

    const start = {
      x: cx + (radius * Math.cos(startAngle)),
      y: cy + (radius * Math.sin(startAngle))
    };
    const end = {
      x: cx + (radius * Math.cos(endAngle)),
      y: cy + (radius * Math.sin(endAngle))
    };
    const largeArcFlag = (endAngle - startAngle) > Math.PI ? 1 : 0;
    return [
      'M', cx, cy,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y,
      'Z'
    ].join(' ');
  }

  function renderColumnChart(card, meta, rows) {
    const maxCount = rows.reduce(function (max, row) {
      return Math.max(max, Number(row.count || 0));
    }, 1);

    const chart = document.createElement('div');
    chart.className = 'spip-chart-column-wrap';

    rows.forEach(function (entry, index) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'spip-chart-column-item';
      item.dataset.filterKey = meta.key;
      item.dataset.filterValue = entry.value;
      if (String(spipFilterState[meta.key] || '') === entry.value) {
        item.classList.add('is-active');
      }

      const barBox = document.createElement('span');
      barBox.className = 'spip-chart-column-box';

      const bar = document.createElement('span');
      bar.className = 'spip-chart-column-bar';
      bar.style.height = Math.max(8, Math.round((entry.count / maxCount) * 100)) + '%';
      bar.style.background = colorByIndex(index);

      const count = document.createElement('span');
      count.className = 'spip-chart-column-count';
      count.textContent = String(entry.count);

      const label = document.createElement('span');
      label.className = 'spip-chart-column-label';
      label.textContent = entry.value;
      label.title = entry.value;

      barBox.appendChild(bar);
      item.appendChild(barBox);
      item.appendChild(count);
      item.appendChild(label);
      chart.appendChild(item);
    });

    card.appendChild(chart);
  }

  function renderPie3DChart(card, meta, rows) {
    const total = rows.reduce(function (sum, row) {
      return sum + Number(row.count || 0);
    }, 0);
    if (!total) {
      const empty = document.createElement('p');
      empty.className = 'spip-chart-empty';
      empty.textContent = 'Belum ada data.';
      card.appendChild(empty);
      return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'spip-chart-pie-wrap';

    const svg = createSvgEl('svg', {
      viewBox: '0 0 260 210',
      class: 'spip-chart-pie-svg',
      role: 'img',
      'aria-label': meta.title + ' 3D pie chart'
    });

    const cx = 130;
    const cy = 88;
    const radius = 68;
    const depth = 14;
    let start = -Math.PI / 2;

    rows.forEach(function (entry, index) {
      const slice = Number(entry.count || 0);
      const angle = (slice / total) * Math.PI * 2;
      const end = start + angle;
      const color = colorByIndex(index);
      const darker = darkenHexColor(color, 34);
      const isActive = String(spipFilterState[meta.key] || '') === entry.value;

      const bottom = createSvgEl('path', {
        d: describeArcPath(cx, cy + depth, radius, start, end),
        fill: darker,
        opacity: '0.95'
      });
      svg.appendChild(bottom);

      const top = createSvgEl('path', {
        d: describeArcPath(cx, cy, radius, start, end),
        fill: color,
        stroke: isActive ? '#0f172a' : '#ffffff',
        'stroke-width': isActive ? '2.4' : '1.1',
        class: 'spip-chart-pie-slice',
        'data-filter-key': meta.key,
        'data-filter-value': entry.value,
        role: 'button',
        tabindex: '0'
      });
      svg.appendChild(top);

      start = end;
    });

    wrap.appendChild(svg);

    const legend = document.createElement('div');
    legend.className = 'spip-chart-pie-legend';
    rows.forEach(function (entry, index) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'spip-chart-legend-btn';
      item.dataset.filterKey = meta.key;
      item.dataset.filterValue = entry.value;
      if (String(spipFilterState[meta.key] || '') === entry.value) {
        item.classList.add('is-active');
      }

      const swatch = document.createElement('span');
      swatch.className = 'spip-chart-legend-swatch';
      swatch.style.background = colorByIndex(index);

      const label = document.createElement('span');
      label.className = 'spip-chart-legend-label';
      label.textContent = entry.value + ' (' + entry.count + ')';

      item.appendChild(swatch);
      item.appendChild(label);
      legend.appendChild(item);
    });

    wrap.appendChild(legend);
    card.appendChild(wrap);
  }

  function renderSpipCharts(allRows) {
    if (!spipChartGrid) return;

    const baseRows = Array.isArray(allRows) ? allRows : [];
    spipChartGrid.innerHTML = '';

    SPIP_FILTER_META.forEach(function (meta) {
      const card = document.createElement('article');
      card.className = 'spip-chart-card';

      const title = document.createElement('h4');
      title.className = 'spip-chart-title';
      title.textContent = meta.title;
      card.appendChild(title);

      const rows = getCountsByFilterKey(baseRows, meta.key);
      if (meta.chartType === 'pie3d') {
        renderPie3DChart(card, meta, rows);
      } else {
        if (!rows.length) {
          const empty = document.createElement('p');
          empty.className = 'spip-chart-empty';
          empty.textContent = 'Belum ada data.';
          card.appendChild(empty);
        } else {
          renderColumnChart(card, meta, rows);
        }
      }

      spipChartGrid.appendChild(card);
    });

    renderActiveFilterSummary();
  }

  function buildQrPayloadTextFromRecord(record) {
    const target = record || {};
    const lines = [
      'No Unit / Register: ' + String(target.noUnitRegister || '').trim(),
      'Nama SPIP: ' + String(target.namaSpip || '').trim(),
      'Kategori: ' + String(target.kategori || '').trim(),
      'Jenis: ' + String(target.jenis || '').trim(),
      'Merk: ' + String(target.merk || '').trim(),
      'Model: ' + String(target.model || '').trim(),
      'Tahun Pembuatan: ' + String(target.tahunPembuatan || '').trim(),
      'Tanggal Komisioning: ' + String(target.tanggalKomisioning || '').trim(),
      'Tanggal Expired: ' + String(target.tanggalExpired || '').trim(),
      'Email: ' + String(target.email || '').trim(),
      'Komisioner: ' + String(target.komisioner || '').trim(),
      'Keterangan: ' + String(target.keterangan || '').trim()
    ];
    return lines.join('\n');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildDetailLineHtml(label, value) {
    return '<strong>' + escapeHtml(label || '') + ':</strong> ' + escapeHtml(value || '-') + '<br>';
  }

  function buildInlineQrDataUrl(payloadText, size) {
    const content = String(payloadText || '-');
    const dimension = Math.max(120, Number(size || 320));
    const modules = 33;
    const quietZone = 2;
    const total = modules + (quietZone * 2);
    const cell = Math.max(1, Math.floor(dimension / total));
    const realSize = cell * total;

    const canvas = document.createElement('canvas');
    canvas.width = realSize;
    canvas.height = realSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return '';
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, realSize, realSize);

    // Simple deterministic hash to paint a stable matrix from payload text.
    let seed = 2166136261;
    for (let i = 0; i < content.length; i += 1) {
      seed ^= content.charCodeAt(i);
      seed = (seed * 16777619) >>> 0;
    }

    function nextBit() {
      seed ^= seed << 13;
      seed >>>= 0;
      seed ^= seed >>> 17;
      seed >>>= 0;
      seed ^= seed << 5;
      seed >>>= 0;
      return seed & 1;
    }

    function drawFinder(mx, my) {
      const x = (mx + quietZone) * cell;
      const y = (my + quietZone) * cell;
      const outer = 7 * cell;
      const middle = 5 * cell;
      const inner = 3 * cell;

      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, outer, outer);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + cell, y + cell, middle, middle);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + (2 * cell), y + (2 * cell), inner, inner);
    }

    function isFinderZone(mx, my) {
      const inTopLeft = mx < 7 && my < 7;
      const inTopRight = mx >= (modules - 7) && my < 7;
      const inBottomLeft = mx < 7 && my >= (modules - 7);
      return inTopLeft || inTopRight || inBottomLeft;
    }

    drawFinder(0, 0);
    drawFinder(modules - 7, 0);
    drawFinder(0, modules - 7);

    ctx.fillStyle = '#000000';
    for (let y = 0; y < modules; y += 1) {
      for (let x = 0; x < modules; x += 1) {
        if (isFinderZone(x, y)) continue;
        const bit = nextBit();
        if (!bit) continue;
        const px = (x + quietZone) * cell;
        const py = (y + quietZone) * cell;
        ctx.fillRect(px, py, cell, cell);
      }
    }

    return canvas.toDataURL('image/png');
  }

  function asciiToBytes(text) {
    const input = String(text || '');
    const bytes = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i += 1) {
      bytes[i] = input.charCodeAt(i) & 0xff;
    }
    return bytes;
  }

  function concatBytes(chunks) {
    const list = Array.isArray(chunks) ? chunks : [];
    const total = list.reduce(function (sum, part) {
      return sum + (part ? part.length : 0);
    }, 0);

    const out = new Uint8Array(total);
    let offset = 0;
    list.forEach(function (part) {
      if (!part || !part.length) return;
      out.set(part, offset);
      offset += part.length;
    });
    return out;
  }

  function blobToArrayBuffer(blob) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(new Error('Gagal membaca data blob.'));
      };
      reader.readAsArrayBuffer(blob);
    });
  }

  async function buildPdfBlobFromJpeg(jpegBlob, imageWidth, imageHeight) {
    const imageArrayBuffer = await blobToArrayBuffer(jpegBlob);
    const imageBytes = new Uint8Array(imageArrayBuffer);

    const safeWidth = Math.max(1, Number(imageWidth || 1));
    const safeHeight = Math.max(1, Number(imageHeight || 1));
    const pageWidth = 252; // About 88mm in points.
    const pageHeight = 369; // About 130mm in points.
    const scale = Math.min(pageWidth / safeWidth, pageHeight / safeHeight);
    const drawWidth = Math.max(1, Math.round(safeWidth * scale * 1000) / 1000);
    const drawHeight = Math.max(1, Math.round(safeHeight * scale * 1000) / 1000);
    const offsetX = Math.round(((pageWidth - drawWidth) / 2) * 1000) / 1000;
    const offsetY = Math.round(((pageHeight - drawHeight) / 2) * 1000) / 1000;

    const contentStream = [
      'q',
      drawWidth + ' 0 0 ' + drawHeight + ' ' + offsetX + ' ' + offsetY + ' cm',
      '/Im0 Do',
      'Q',
      ''
    ].join('\n');

    const objects = [];
    objects[1] = asciiToBytes('<< /Type /Catalog /Pages 2 0 R >>');
    objects[2] = asciiToBytes('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    objects[3] = asciiToBytes('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageWidth + ' ' + pageHeight + '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    objects[4] = concatBytes([
      asciiToBytes('<< /Type /XObject /Subtype /Image /Width ' + Math.round(safeWidth) + ' /Height ' + Math.round(safeHeight) + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + imageBytes.length + ' >>\nstream\n'),
      imageBytes,
      asciiToBytes('\nendstream')
    ]);
    objects[5] = concatBytes([
      asciiToBytes('<< /Length ' + contentStream.length + ' >>\nstream\n'),
      asciiToBytes(contentStream),
      asciiToBytes('endstream')
    ]);

    const chunks = [];
    const offsets = [0];
    let offset = 0;

    function push(bytes) {
      chunks.push(bytes);
      offset += bytes.length;
    }

    push(asciiToBytes('%PDF-1.4\n'));

    for (let id = 1; id <= 5; id += 1) {
      offsets[id] = offset;
      push(asciiToBytes(id + ' 0 obj\n'));
      push(objects[id]);
      push(asciiToBytes('\nendobj\n'));
    }

    const xrefOffset = offset;
    push(asciiToBytes('xref\n0 6\n'));
    push(asciiToBytes('0000000000 65535 f \n'));
    for (let id = 1; id <= 5; id += 1) {
      const padded = String(offsets[id] || 0).padStart(10, '0');
      push(asciiToBytes(padded + ' 00000 n \n'));
    }

    push(asciiToBytes('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF'));
    return new Blob(chunks, { type: 'application/pdf' });
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 5000);
  }

  function getSpipPdfFileName(record) {
    const target = record || {};
    return 'SPIP-' + String(target.noUnitRegister || 'Komisioning').replace(/\s+/g, '_') + '.pdf';
  }

  async function exportSpipToPdf(record) {
    const target = record || {};
    const imagePack = await createSpipJpgBlob(target);
    const pdfBlob = await buildPdfBlobFromJpeg(imagePack.blob, imagePack.width, imagePack.height);
    downloadBlob(pdfBlob, getSpipPdfFileName(target));
    return pdfBlob;
  }

  function getSpipEmailApiConfig() {
    const globalConfig = window.AIOS_SPIP_EMAIL_API || {};
    const endpoint = String(globalConfig.endpoint || '').trim();
    const token = String(globalConfig.token || '').trim();
    return { endpoint: endpoint, token: token };
  }

  function buildSpipEmailSubject(record) {
    const target = record || {};
    return 'SPIP Komisioning - ' + String(target.noUnitRegister || '-').trim();
  }

  function buildSpipEmailBody(record) {
    const target = record || {};
    return [
      'Assalamualaikum Wr. Wb',
      '',
      'Semangat Pagi!!!',
      '',
      'Dengan hormat,',
      'Berikut kami kirimkan Stiker Komisioning untuk unit berikut ini :',
      'No Unit / Register : ' + String(target.noUnitRegister || '-').trim(),
      'Kategori : ' + String(target.kategori || '-').trim(),
      'Jenis : ' + String(target.jenis || '-').trim(),
      'Nama SPIP : ' + String(target.namaSpip || '-').trim(),
      'Merk : ' + String(target.merk || '-').trim(),
      'Model : ' + String(target.model || '-').trim(),
      'No Seri : ' + String(target.noSeri || '-').trim(),
      'Tahun Pembuatan : ' + String(target.tahunPembuatan || '-').trim(),
      'Tanggal Komisioning : ' + String(target.tanggalKomisioning || '-').trim(),
      'Tanggal Expired : ' + String(target.tanggalExpired || '-').trim(),
      '',
      'Demikian, atas kerjasamanya saya ucapkan terima kasih.',
      '',
      'Regards,',
      'OHS Department',
      'PT. Maruwai Coal'
    ].join('\n');
  }

  function loadImageAsDataUrl(url, maxWidth, maxHeight) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.onload = function () {
        try {
          const naturalWidth = img.naturalWidth || img.width || 1;
          const naturalHeight = img.naturalHeight || img.height || 1;
          const limitWidth = Number(maxWidth || naturalWidth);
          const limitHeight = Number(maxHeight || naturalHeight);

          const ratio = Math.min(limitWidth / naturalWidth, limitHeight / naturalHeight, 1);
          const targetWidth = Math.max(1, Math.round(naturalWidth * ratio));
          const targetHeight = Math.max(1, Math.round(naturalHeight * ratio));

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context tidak tersedia.'));
            return;
          }
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          // JPEG with medium quality keeps logo readable while reducing request payload size.
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = function () {
        reject(new Error('Gagal memuat gambar logo.'));
      };
      img.src = url;
    });
  }

  function loadImageElement(url) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        reject(new Error('Gagal memuat gambar.'));
      };
      img.src = url;
    });
  }

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius || 0, width / 2, height / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  async function createSpipJpgBlob(record) {
    const target = record || {};
    const canvas = document.createElement('canvas');
    canvas.width = 760;
    canvas.height = 1320;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context tidak tersedia.');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cardX = 10;
    const cardY = 8;
    const cardW = canvas.width - 20;
    const cardH = canvas.height - 16;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 16);
    ctx.fill();
    ctx.stroke();

    const centerX = canvas.width / 2;
    let y = 30;

    const logoScale = 1.5;
    const titleScale = 0.8;
    let logoDrawHeight = 108;

    try {
      const logoPngUrl = new URL('../assets/Logo Alamtri.png', window.location.href).href;
      const logo = await loadImageElement(logoPngUrl);

      const maxLogoWidth = Math.round(340 * logoScale);
      const maxLogoHeight = Math.round(108 * logoScale);
      const logoRatio = Math.min(maxLogoWidth / (logo.naturalWidth || logo.width || maxLogoWidth), maxLogoHeight / (logo.naturalHeight || logo.height || maxLogoHeight));
      const lw = Math.max(1, Math.round((logo.naturalWidth || logo.width || maxLogoWidth) * logoRatio));
      const lh = Math.max(1, Math.round((logo.naturalHeight || logo.height || maxLogoHeight) * logoRatio));
      logoDrawHeight = lh;
      ctx.drawImage(logo, centerX - (lw / 2), y, lw, lh);
    } catch (_error) {
      // Ignore logo load failure.
    }

    y += Math.round(logoDrawHeight + 30);

    const titleFontSize = Math.max(1, Math.round(52 * titleScale));
    const subtitleFontSize = Math.max(1, Math.round(34 * titleScale));

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold ' + String(titleFontSize) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Stiker Komisioning', centerX, y);

    y += Math.round(subtitleFontSize + 7);
    ctx.fillStyle = '#334155';
    ctx.font = String(subtitleFontSize) + 'px Arial';
    ctx.fillText('PT. Alamtri Minerals Indonesia', centerX, y);

    y += 18;
    const qrBoxX = 24;
    const qrBoxY = y;
    const qrBoxW = canvas.width - 48;
    const qrBoxH = 620;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, 16);
    ctx.fill();
    ctx.stroke();

    const qrPayload = String(target.qrPayload || buildQrPayloadTextFromRecord(target) || '').trim();
    const qrUrl = buildInlineQrDataUrl(qrPayload || '-', 1200);

    try {
      const qrImage = await loadImageElement(qrUrl);
      const margin = 14;
      const size = Math.min(qrBoxW - (margin * 2), qrBoxH - (margin * 2));
      const qrX = qrBoxX + Math.round((qrBoxW - size) / 2);
      const qrY = qrBoxY + margin;
      ctx.drawImage(qrImage, qrX, qrY, size, size);
    } catch (_error) {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrBoxX + 20, qrBoxY + 20, qrBoxW - 40, qrBoxH - 40);
      ctx.fillStyle = '#64748b';
      ctx.font = '20px Arial';
      ctx.fillText('QR gagal dimuat', centerX, qrBoxY + (qrBoxH / 2));
    }

    y = qrBoxY + qrBoxH + 36;

    ctx.textAlign = 'left';

    const rows = [
      ['No Unit / Register', target.noUnitRegister || '-'],
      ['Nama SPIP', target.namaSpip || '-'],
      ['Kategori', target.kategori || '-'],
      ['Jenis', target.jenis || '-'],
      ['Merk', target.merk || '-'],
      ['Model', target.model || '-'],
      ['Perusahaan', target.perusahaan || '-'],
      ['CCOW', target.ccow || '-'],
      ['Tahun Pembuatan', target.tahunPembuatan || '-'],
      ['Tanggal Komisioning', target.tanggalKomisioning || '-'],
      ['Tanggal Expired', target.tanggalExpired || '-']
    ];

    const detailTop = y;
    const detailBottom = cardY + cardH - 20;
    const detailHeight = Math.max(120, detailBottom - detailTop);

    function wrap(text, maxWidth) {
      const words = String(text || '-').split(/\s+/);
      const lines = [];
      let current = '';
      words.forEach(function (word) {
        const candidate = current ? (current + ' ' + word) : word;
        if (ctx.measureText(candidate).width <= maxWidth) {
          current = candidate;
        } else {
          if (current) lines.push(current);
          current = word;
        }
      });
      if (current) lines.push(current);
      return lines.length ? lines : ['-'];
    }

    function calcLayout(fontSize) {
      ctx.font = 'bold ' + String(fontSize) + 'px Arial';
      let maxLabelWidth = 0;
      rows.forEach(function (entry) {
        const label = String(entry[0] || '').trim() + ':';
        const width = ctx.measureText(label).width;
        if (width > maxLabelWidth) maxLabelWidth = width;
      });

      const labelX = 22;
      const valueX = Math.round(labelX + maxLabelWidth + 12);
      const valueMaxWidth = Math.max(160, canvas.width - valueX - 22);
      const rowGap = Math.max(4, Math.round(fontSize * 0.35));
      const lineGap = Math.max(2, Math.round(fontSize * 0.28));

      let totalHeight = 0;
      const wrappedRows = rows.map(function (entry) {
        const valueLines = wrap(String(entry[1] || '-').trim() || '-', valueMaxWidth);
        const rowHeight = (valueLines.length * (fontSize + lineGap)) + rowGap;
        totalHeight += rowHeight;
        return {
          label: String(entry[0] || '').trim() + ':',
          valueLines: valueLines,
          rowHeight: rowHeight
        };
      });

      return {
        labelX: labelX,
        valueX: valueX,
        rowGap: rowGap,
        lineGap: lineGap,
        rows: wrappedRows,
        totalHeight: totalHeight
      };
    }

    let chosenFont = 18;
    let chosenLayout = calcLayout(chosenFont);
    for (let size = 20; size >= 12; size -= 1) {
      const candidate = calcLayout(size);
      if (candidate.totalHeight <= detailHeight) {
        chosenFont = size;
        chosenLayout = candidate;
        break;
      }
    }

    const extraSpace = Math.max(0, detailHeight - chosenLayout.totalHeight);
    const extraPerRow = Math.floor(extraSpace / Math.max(1, chosenLayout.rows.length));

    ctx.fillStyle = '#0f172a';
    let cursorY = detailTop;
    chosenLayout.rows.forEach(function (row) {
      ctx.font = 'bold ' + String(chosenFont) + 'px Arial';
      ctx.fillText(row.label, chosenLayout.labelX, cursorY);

      ctx.font = String(chosenFont) + 'px Arial';
      row.valueLines.forEach(function (line, index) {
        const lineY = cursorY + (index * (chosenFont + chosenLayout.lineGap));
        ctx.fillText(line, chosenLayout.valueX, lineY);
      });

      cursorY += row.rowHeight + extraPerRow;
    });

    const jpgBlob = await new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) {
          reject(new Error('Gagal membuat file JPG.'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.72);
    });

    return {
      blob: jpgBlob,
      width: canvas.width,
      height: canvas.height
    };
  }

  async function createSpipPdfBlob(record) {
    const imagePack = await createSpipJpgBlob(record);
    return buildPdfBlobFromJpeg(imagePack.blob, imagePack.width, imagePack.height);
  }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        const result = String(reader.result || '');
        const commaIndex = result.indexOf(',');
        if (commaIndex < 0) {
          resolve('');
          return;
        }
        resolve(result.slice(commaIndex + 1));
      };
      reader.onerror = function () {
        reject(new Error('Gagal mengubah lampiran ke base64.'));
      };
      reader.readAsDataURL(blob);
    });
  }

  async function sendSpipAttachmentToEmailApi(record, recipients, attachmentBlob) {
    const config = getSpipEmailApiConfig();
    if (!config.endpoint) {
      throw new Error('Endpoint API email belum dikonfigurasi.');
    }

    const target = record || {};
    const fileName = getSpipPdfFileName(target);
    const fileMime = 'application/pdf';
    const fileBase64 = await blobToBase64(attachmentBlob);
    if (!fileBase64) {
      throw new Error('File PDF tidak valid untuk dikirim.');
    }

    const headers = {};
    if (config.token) {
      headers.Authorization = 'Bearer ' + config.token;
    }

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: Object.assign({}, headers, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({
        recipients: recipients,
        subject: buildSpipEmailSubject(target),
        body: buildSpipEmailBody(target),
        fileMime: fileMime,
        fileName: fileName,
        fileBase64: fileBase64
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(function () { return ''; });
      throw new Error(errorText || ('Gagal kirim email. Status: ' + response.status));
    }
  }

  async function triggerExportAndEmail(record, emailRawValue) {
    const recipients = parseEmailList(emailRawValue);
    if (!recipients.length) {
      alert('Email wajib diisi minimal 1 alamat untuk ekspor & kirim email.');
      return false;
    }

    try {
      const target = record || {};
      const attachmentBlob = await createSpipPdfBlob(target);
      downloadBlob(attachmentBlob, getSpipPdfFileName(target));
      await sendSpipAttachmentToEmailApi(target, recipients, attachmentBlob);
      return true;
    } catch (error) {
      alert('Pengiriman email otomatis gagal. Data komisioning tidak disimpan. Detail: ' + String((error && error.message) || 'Unknown error'));
      return false;
    }
  }

  function buildQrPayloadText() {
    const lines = [
      'No Unit / Register: ' + String(noUnitInput.value || '').trim(),
      'Nama SPIP: ' + String(namaInput.value || '').trim(),
      'Kategori: ' + String(kategoriInput.value || '').trim(),
      'Jenis: ' + getJenisValueForPayload(),
      'Merk: ' + String(merkInput.value || '').trim(),
      'Model: ' + String(modelInput.value || '').trim(),
      'Tahun Pembuatan: ' + String(tahunInput.value || '').trim(),
      'Tanggal Komisioning: ' + String(tanggalKomisioningInput.value || '').trim(),
      'Tanggal Expired: ' + String(tanggalExpiredInput.value || '').trim(),
      'Email: ' + normalizeEmailList(komisioningEmailInput ? komisioningEmailInput.value : ''),
      'Komisioner: ' + String(komisionerInput.value || '').trim(),
      'Keterangan: ' + String(keteranganInput.value || '').trim()
    ];

    return lines.join('\n');
  }

  function updateQrCode() {
    const payloadText = buildQrPayloadText();
    qrPayload.value = payloadText;

    const hasValue = payloadText.replace(/\s+/g, '').length > 0;
    if (!hasValue) {
      qrImage.removeAttribute('src');
      return;
    }

    const qrDataUrl = buildInlineQrDataUrl(payloadText, 320);
    qrImage.src = qrDataUrl;
  }

  function readFilesAsPayloadFromFiles(files) {
    return Promise.all(files.map(function (file) {
      return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () {
          resolve({ name: file.name, dataUrl: reader.result });
        };
        reader.onerror = function () {
          reject(new Error('Gagal membaca file gambar.'));
        };
        reader.readAsDataURL(file);
      });
    }));
  }

  function renderPhotoPreview() {
    fotoPreview.innerHTML = '';
    fotoDraft.forEach(function (item, index) {
      if (!item || !item.dataUrl) return;
      const wrap = document.createElement('div');
      wrap.className = 'photo-thumb-item';
      wrap.innerHTML =
        '<img src="' + item.dataUrl + '" alt="' + (item.name || 'Foto SPIP') + '" class="ohs-photo-thumb" />' +
        '<button type="button" class="photo-remove-btn" data-index="' + index + '">✕</button>';
      fotoPreview.appendChild(wrap);
    });
  }

  function getLatestKomisioningSnapshot(record) {
    const target = record || {};
    const history = Array.isArray(target.komisioningHistory) ? target.komisioningHistory : [];
    if (!history.length) {
      return {
        tanggalKomisioning: String(target.tanggalKomisioning || '').trim(),
        tanggalExpired: String(target.tanggalExpired || '').trim(),
        email: String(target.email || '').trim(),
        komisioner: String(target.komisioner || '').trim(),
        keterangan: String(target.keterangan || '').trim()
      };
    }

    const latest = history[history.length - 1] || {};
    return {
      tanggalKomisioning: String(latest.tanggalKomisioning || target.tanggalKomisioning || '').trim(),
      tanggalExpired: String(latest.tanggalExpired || target.tanggalExpired || '').trim(),
      email: String(latest.email || target.email || '').trim(),
      komisioner: String(latest.komisioner || target.komisioner || '').trim(),
      keterangan: String(latest.keterangan || target.keterangan || '').trim()
    };
  }

  function setFormForEdit(record) {
    openForm();
    hideKomisioningPanel();
    setMainFormReadOnly(false);
    const target = record || {};
    editingId = String(target.id || '').trim();
    draftKomisioningHistory = Array.isArray(target.komisioningHistory) ? target.komisioningHistory.slice() : [];

    kategoriInput.value = String(target.kategori || '').trim();
    renderJenisOptions();

    const targetJenis = String(target.jenis || '').trim();
    const existingJenis = Array.from(jenisInput.options || []).some(function (option) {
      return String(option.value || '').trim() === targetJenis;
    });

    if (existingJenis) {
      jenisInput.value = targetJenis;
      jenisCustomInput.value = '';
    } else if (targetJenis) {
      jenisInput.value = 'Other';
      jenisCustomInput.value = targetJenis;
    }
    syncJenisCustomVisibility();

    namaInput.value = String(target.namaSpip || '').trim();
    noUnitInput.value = String(target.noUnitRegister || '').trim();
    merkInput.value = String(target.merk || '').trim();
    modelInput.value = String(target.model || '').trim();
    noSeriInput.value = String(target.noSeri || '').trim();
    tahunInput.value = String(target.tahunPembuatan || '').trim();

    const selectedAreas = Array.isArray(target.areaKerja) ? target.areaKerja : [];
    Array.from(areaInputs).forEach(function (input) {
      input.checked = selectedAreas.indexOf(input.value) >= 0;
    });

    deptInput.value = String(target.deptInCharge || '').trim();
    perusahaanInput.value = String(target.perusahaan || '').trim();
    perusahaanCustodianInput.value = String(target.perusahaanCustodian || '').trim();
    ccowInput.value = String(target.ccow || '').trim();

    fotoDraft = Array.isArray(target.fotoSpip) ? target.fotoSpip.slice() : [];
    renderPhotoPreview();

    const latestKomisioning = getLatestKomisioningSnapshot(target);
    if (komisioningTanggalKomisioningInput) komisioningTanggalKomisioningInput.value = latestKomisioning.tanggalKomisioning;
    if (komisioningTanggalExpiredInput) komisioningTanggalExpiredInput.value = latestKomisioning.tanggalExpired;
    if (komisioningEmailInput) komisioningEmailInput.value = latestKomisioning.email;
    if (komisioningKomisionerInput) komisioningKomisionerInput.value = latestKomisioning.komisioner;
    if (komisioningKeteranganInput) komisioningKeteranganInput.value = latestKomisioning.keterangan;
    syncMainCommissionFieldsFromSubForm();
    syncStatusFromExpiredDate();
    updateQrCode();

    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setMainFormReadOnly(readOnly) {
    isReadOnlyView = !!readOnly;

    const controls = [
      kategoriInput,
      jenisInput,
      jenisCustomInput,
      namaInput,
      noUnitInput,
      merkInput,
      modelInput,
      noSeriInput,
      tahunInput,
      deptInput,
      perusahaanInput,
      perusahaanCustodianInput,
      ccowInput,
      fotoInput,
      tanggalKomisioningInput,
      tanggalExpiredInput,
      komisionerInput,
      keteranganInput,
      statusInput
    ];

    controls.forEach(function (control) {
      if (!control) return;
      control.disabled = readOnly;
    });

    if (!readOnly) {
      tanggalKomisioningInput.readOnly = true;
      tanggalExpiredInput.readOnly = true;
      komisionerInput.readOnly = true;
      keteranganInput.readOnly = true;
    }

    Array.from(areaInputs).forEach(function (input) {
      input.disabled = readOnly;
    });

    if (!readOnly) {
      statusInput.disabled = true;
    }

    if (formActions) {
      formActions.classList.toggle('hidden', readOnly);
    }
    if (readOnlyActions) {
      readOnlyActions.classList.toggle('hidden', !readOnly);
    }
  }

  function clearKomisioningInputs() {
    if (komisioningTanggalKomisioningInput) komisioningTanggalKomisioningInput.value = '';
    if (komisioningTanggalExpiredInput) komisioningTanggalExpiredInput.value = '';
    if (komisioningEmailInput) komisioningEmailInput.value = '';
    if (komisioningKomisionerInput) komisioningKomisionerInput.value = '';
    if (komisioningKeteranganInput) komisioningKeteranganInput.value = '';
  }

  function showKomisioningPanel(record, options) {
    const target = record || {};
    const panelOptions = options || {};
    const emptyInputs = !!panelOptions.emptyInputs;
    syncKomisioningInputerIdentity();
    if (Array.isArray(target.komisioningHistory)) {
      draftKomisioningHistory = target.komisioningHistory.slice();
    }

    if (emptyInputs) {
      clearKomisioningInputs();
    } else {
      const latestKomisioning = getLatestKomisioningSnapshot(target);
      if (komisioningTanggalKomisioningInput) komisioningTanggalKomisioningInput.value = latestKomisioning.tanggalKomisioning;
      if (komisioningTanggalExpiredInput) komisioningTanggalExpiredInput.value = latestKomisioning.tanggalExpired;
      if (komisioningEmailInput) komisioningEmailInput.value = latestKomisioning.email;
      if (komisioningKomisionerInput) komisioningKomisionerInput.value = latestKomisioning.komisioner;
      if (komisioningKeteranganInput) komisioningKeteranganInput.value = latestKomisioning.keterangan;
    }

    syncMainCommissionFieldsFromSubForm();
    syncStatusFromExpiredDate();
    updateQrCode();
    renderKomisioningHistory(target);
    if (komisioningPanel) komisioningPanel.classList.remove('hidden');
  }

  function hideKomisioningPanel() {
    if (komisioningPanel) komisioningPanel.classList.add('hidden');
    komisioningRecordId = '';
    clearKomisioningHistoryTable();
  }

  function clearKomisioningHistoryTable() {
    if (komisioningHistoryTbody) komisioningHistoryTbody.innerHTML = '';
    if (komisioningHistoryEmpty) komisioningHistoryEmpty.classList.add('hidden');
  }

  function renderKomisioningHistory(record) {
    if (!komisioningHistoryTbody || !komisioningHistoryEmpty) return;

    const target = record || {};
    const history = Array.isArray(target.komisioningHistory)
      ? target.komisioningHistory.slice()
      : draftKomisioningHistory.slice();
    const roleFlags = getRoleFlags();

    komisioningHistoryTbody.innerHTML = '';

    if (!history.length) {
      komisioningHistoryEmpty.classList.remove('hidden');
      return;
    }

    komisioningHistoryEmpty.classList.add('hidden');

    history.forEach(function (entry, index) {
      const item = entry || {};
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + String(index + 1) + '</td>' +
        '<td>' + (item.tanggalKomisioning || '-') + '</td>' +
        '<td>' + (item.tanggalExpired || '-') + '</td>' +
        '<td>' + (item.status || '-') + '</td>' +
        '<td>' + (item.komisioner || '-') + '</td>' +
        '<td>' + (item.keterangan || '-') + '</td>' +
        '<td>' + (item.savedAt || '-') + '</td>' +
        '<td>' +
          (roleFlags.canManage
            ? '<button type="button" class="table-btn danger" data-action="delete-history" data-index="' + index + '">Hapus</button>'
            : '-') +
        '</td>';
      komisioningHistoryTbody.appendChild(tr);
    });
  }

  if (komisioningHistoryTbody) {
    komisioningHistoryTbody.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-action="delete-history"][data-index]');
      if (!button) return;

      const roleFlags = getRoleFlags();
      if (!roleFlags.canManage) {
        alert('Hapus histori komisioning hanya untuk Super Admin dan Admin.');
        return;
      }

      const recordId = String(komisioningRecordId || '').trim();
      if (!recordId) {
        alert('Data SPIP belum dipilih untuk komisioning.');
        return;
      }

      const index = Number(button.dataset.index);
      if (Number.isNaN(index)) return;
      if (!confirm('Hapus histori komisioning ini?')) return;

      const rows = readList(SPIP_KEY);
      const rowIndex = rows.findIndex(function (item) {
        return String(item.id || '').trim() === recordId;
      });
      if (rowIndex < 0) {
        alert('Data SPIP tidak ditemukan.');
        return;
      }

      const record = rows[rowIndex] || {};
      const history = Array.isArray(record.komisioningHistory) ? record.komisioningHistory.slice() : [];
      if (index < 0 || index >= history.length) return;

      history.splice(index, 1);

      const latest = history.length ? (history[history.length - 1] || {}) : {};
      const nextRecord = Object.assign({}, record, {
        komisioningHistory: history,
        tanggalKomisioning: String(latest.tanggalKomisioning || '').trim(),
        tanggalExpired: String(latest.tanggalExpired || '').trim(),
        email: String(latest.email || '').trim(),
        komisioner: String(latest.komisioner || '').trim(),
        keterangan: String(latest.keterangan || '').trim(),
        status: resolveStatusFromExpiredDate(String(latest.tanggalExpired || '').trim()),
        updatedAt: new Date().toISOString()
      });
      nextRecord.qrPayload = buildQrPayloadTextFromRecord(nextRecord);

      rows[rowIndex] = nextRecord;
      writeList(SPIP_KEY, rows);
      draftKomisioningHistory = history.slice();

      showKomisioningPanel(nextRecord);
      renderTable();
      alert('Histori komisioning berhasil dihapus.');
    });
  }

  function setFormForKomisioning(record) {
    const target = record || {};
    setFormForEdit(target);
    komisioningRecordId = String(target.id || '').trim();
    editingId = '';
    setMainFormReadOnly(true);
    showKomisioningPanel(target, { emptyInputs: true });
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function openForm() {
    form.classList.remove('hidden');
    if (komisioningOpenButton) {
      komisioningOpenButton.classList.remove('hidden');
    }
  }

  function closeForm() {
    form.classList.add('hidden');
    if (komisioningOpenButton) {
      komisioningOpenButton.classList.add('hidden');
    }
  }

  function renderTable() {
    const allRows = readList(SPIP_KEY);
    const rows = getFilteredSpipRows(allRows);
    const roleFlags = getRoleFlags();
    if (!tbody || !emptyText) return;

    renderSpipCharts(allRows);

    tbody.innerHTML = '';

    if (!allRows.length) {
      emptyText.classList.remove('hidden');
      emptyText.textContent = 'Belum ada data SPIP.';
      return;
    }

    if (!rows.length) {
      emptyText.classList.remove('hidden');
      emptyText.textContent = 'Tidak ada data SPIP yang sesuai filter grafik.';
      return;
    }

    emptyText.classList.add('hidden');

    rows.forEach(function (item, index) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + String(index + 1) + '</td>' +
        '<td>' + (item.noUnitRegister || '-') + '</td>' +
        '<td>' + (item.namaSpip || '-') + '</td>' +
        '<td>' + (item.kategori || '-') + '</td>' +
        '<td>' + (item.jenis || '-') + '</td>' +
        '<td>' + (item.status || '-') + '</td>' +
        '<td>' + (item.tanggalExpired || '-') + '</td>' +
        '<td>' + (item.komisioner || '-') + '</td>' +
        '<td><div class="spip-action-wrap">' +
          '<button type="button" class="table-btn spip-action-btn" data-action="detail" data-id="' + (item.id || '') + '">Detail</button>' +
          (roleFlags.canManage
            ? '<button type="button" class="table-btn spip-action-btn" data-action="edit" data-id="' + (item.id || '') + '">Ubah</button>' +
              '<button type="button" class="table-btn danger spip-action-btn" data-action="delete" data-id="' + (item.id || '') + '">Hapus</button>' +
              '<button type="button" class="table-btn spip-action-btn" data-action="komisioning" data-id="' + (item.id || '') + '">Komisioning</button>'
            : '') +
          '<button type="button" class="table-btn spip-action-btn" data-action="export" data-id="' + (item.id || '') + '">Ekspor</button>' +
        '</div></td>';
      tbody.appendChild(tr);
    });
  }

  if (tbody) {
    tbody.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-action][data-id]');
      if (!button) return;

      const action = String(button.dataset.action || '').trim();
      const id = String(button.dataset.id || '').trim();
      if (!id) return;

      const rows = readList(SPIP_KEY);
      const target = rows.find(function (item) {
        return String(item.id || '').trim() === id;
      });
      if (!target) return;

      const roleFlags = getRoleFlags();

      if (action === 'edit') {
        if (!roleFlags.canManage) {
          alert('Aksi ubah data SPIP hanya untuk Super Admin dan Admin.');
          return;
        }
        setFormForEdit(target);
        return;
      }

      if (action === 'komisioning') {
        if (!roleFlags.canManage) {
          alert('Aksi komisioning hanya untuk Super Admin dan Admin.');
          return;
        }
        setFormForKomisioning(target);
        return;
      }

      if (action === 'export') {
        exportSpipToPdf(target).catch(function (error) {
          alert('Gagal membuat file ekspor PDF. Detail: ' + String((error && error.message) || 'Unknown error'));
        });
        return;
      }

      if (action === 'delete') {
        if (!roleFlags.canManage) {
          alert('Aksi hapus data SPIP hanya untuk Super Admin dan Admin.');
          return;
        }
        if (!confirm('Hapus data SPIP ini?')) return;
        const nextRows = rows.filter(function (item) {
          return String(item.id || '').trim() !== id;
        });
        writeList(SPIP_KEY, nextRows);
        if (editingId === id) {
          resetForm();
        }
        renderTable();
        return;
      }

      if (action !== 'detail') return;

      const areaLabel = Array.isArray(target.areaKerja) && target.areaKerja.length
        ? target.areaKerja.join(', ')
        : '-';

      const detailText = [
        'No Unit / Register: ' + (target.noUnitRegister || '-'),
        'Nama SPIP: ' + (target.namaSpip || '-'),
        'Kategori: ' + (target.kategori || '-'),
        'Jenis: ' + (target.jenis || '-'),
        'Merk: ' + (target.merk || '-'),
        'Model: ' + (target.model || '-'),
        'No Seri: ' + (target.noSeri || '-'),
        'Tahun Pembuatan: ' + (target.tahunPembuatan || '-'),
        'Area Kerja: ' + areaLabel,
        'Dept In Charge: ' + (target.deptInCharge || '-'),
        'Perusahaan: ' + (target.perusahaan || '-'),
        'Perusahaan Custodian: ' + (target.perusahaanCustodian || '-'),
        'CCOW: ' + (target.ccow || '-'),
        'Tanggal Komisioning: ' + (target.tanggalKomisioning || '-'),
        'Tanggal Expired: ' + (target.tanggalExpired || '-'),
        'Email: ' + (target.email || '-'),
        'Status: ' + (target.status || '-'),
        'Komisioner: ' + (target.komisioner || '-'),
        'Keterangan: ' + (target.keterangan || '-')
      ].join('\n');

      const detailHtml = [
        buildDetailLineHtml('No Unit / Register', target.noUnitRegister || '-'),
        buildDetailLineHtml('Nama SPIP', target.namaSpip || '-'),
        buildDetailLineHtml('Kategori', target.kategori || '-'),
        buildDetailLineHtml('Jenis', target.jenis || '-'),
        buildDetailLineHtml('Merk', target.merk || '-'),
        buildDetailLineHtml('Model', target.model || '-'),
        buildDetailLineHtml('No Seri', target.noSeri || '-'),
        buildDetailLineHtml('Tahun Pembuatan', target.tahunPembuatan || '-'),
        buildDetailLineHtml('Area Kerja', areaLabel),
        buildDetailLineHtml('Dept In Charge', target.deptInCharge || '-'),
        buildDetailLineHtml('Perusahaan', target.perusahaan || '-'),
        buildDetailLineHtml('Perusahaan Custodian', target.perusahaanCustodian || '-'),
        buildDetailLineHtml('CCOW', target.ccow || '-'),
        buildDetailLineHtml('Tanggal Komisioning', target.tanggalKomisioning || '-'),
        buildDetailLineHtml('Tanggal Expired', target.tanggalExpired || '-'),
        buildDetailLineHtml('Email', target.email || '-'),
        buildDetailLineHtml('Status', target.status || '-'),
        buildDetailLineHtml('Komisioner', target.komisioner || '-'),
        buildDetailLineHtml('Keterangan', target.keterangan || '-')
      ].join('');

      const previewImages = Array.isArray(target.fotoSpip)
        ? target.fotoSpip
          .filter(function (item) { return item && item.dataUrl; })
          .map(function (item, index) {
            return {
              name: item.name || ('Foto SPIP ' + String(index + 1)),
              src: item.dataUrl
            };
          })
        : [];

      const qrPayloadValue = String(target.qrPayload || buildQrPayloadTextFromRecord(target) || '').trim();
      if (qrPayloadValue) {
        previewImages.unshift({
          name: 'QR Code Komisioning',
          src: buildInlineQrDataUrl(qrPayloadValue, 640)
        });
      }

      if (typeof window.aiosShowDetailModal === 'function') {
        window.aiosShowDetailModal('Detail SPIP', detailText, { images: previewImages, htmlContent: detailHtml });
      } else {
        alert(detailText);
      }
    });
  }

  function resetForm() {
    editingId = '';
    draftKomisioningHistory = [];
    form.reset();
    syncKomisioningInputerIdentity();
    if (komisioningTanggalKomisioningInput) komisioningTanggalKomisioningInput.value = '';
    if (komisioningTanggalExpiredInput) komisioningTanggalExpiredInput.value = '';
    if (komisioningEmailInput) komisioningEmailInput.value = '';
    if (komisioningKomisionerInput) komisioningKomisionerInput.value = '';
    if (komisioningKeteranganInput) komisioningKeteranganInput.value = '';
    syncMainCommissionFieldsFromSubForm();
    hideKomisioningPanel();
    setMainFormReadOnly(false);
    syncStatusFromExpiredDate();
    fotoDraft = [];
    renderPhotoPreview();
    renderJenisOptions();
    syncJenisCustomVisibility();
    updateQrCode();
  }

  function validatePayload(payload) {
    if (!payload.kategori) return 'Kategori wajib dipilih.';
    if (!payload.jenis) return 'Jenis wajib diisi.';
    if (!payload.namaSpip) return 'Nama SPIP wajib diisi.';
    if (!payload.noUnitRegister) return 'No Unit / Register wajib diisi.';
    if (!payload.merk) return 'Merk wajib diisi.';
    if (!payload.model) return 'Model wajib diisi.';
    if (!payload.noSeri) return 'No Seri wajib diisi.';
    if (!payload.tahunPembuatan) return 'Tahun Pembuatan wajib diisi.';
    if (!payload.areaKerja.length) return 'Area Kerja minimal satu harus dipilih.';
    if (!payload.deptInCharge) return 'Dept In Charge wajib dipilih.';
    if (!payload.perusahaan) return 'Perusahaan wajib dipilih.';
    if (!payload.perusahaanCustodian) return 'Perusahaan Custodian wajib dipilih.';
    if (!payload.ccow) return 'CCOW wajib dipilih.';
    return '';
  }

  kategoriInput.addEventListener('change', function () {
    renderJenisOptions();
    updateQrCode();
  });

  jenisInput.addEventListener('change', function () {
    syncJenisCustomVisibility();
    updateQrCode();
  });

  jenisCustomInput.addEventListener('input', updateQrCode);
  noUnitInput.addEventListener('input', updateQrCode);
  namaInput.addEventListener('input', updateQrCode);
  merkInput.addEventListener('input', updateQrCode);
  modelInput.addEventListener('input', updateQrCode);
  tahunInput.addEventListener('input', updateQrCode);
  if (komisioningTanggalKomisioningInput) {
    komisioningTanggalKomisioningInput.addEventListener('input', function () {
      syncMainCommissionFieldsFromSubForm();
      updateQrCode();
    });
    komisioningTanggalKomisioningInput.addEventListener('change', function () {
      syncMainCommissionFieldsFromSubForm();
      updateQrCode();
    });
  }

  if (komisioningTanggalExpiredInput) {
    komisioningTanggalExpiredInput.addEventListener('input', function () {
      syncMainCommissionFieldsFromSubForm();
      syncStatusFromExpiredDate();
      updateQrCode();
    });
    komisioningTanggalExpiredInput.addEventListener('change', function () {
      syncMainCommissionFieldsFromSubForm();
      syncStatusFromExpiredDate();
      updateQrCode();
    });
  }

  if (komisioningKomisionerInput) {
    komisioningKomisionerInput.addEventListener('input', function () {
      syncMainCommissionFieldsFromSubForm();
      updateQrCode();
    });
  }

  if (komisioningEmailInput) {
    komisioningEmailInput.addEventListener('input', function () {
      updateQrCode();
    });
  }

  if (komisioningKeteranganInput) {
    komisioningKeteranganInput.addEventListener('input', function () {
      syncMainCommissionFieldsFromSubForm();
      updateQrCode();
    });
  }

  tanggalExpiredInput.addEventListener('input', function () {
    syncStatusFromExpiredDate();
    updateQrCode();
  });

  tanggalExpiredInput.addEventListener('change', function () {
    syncStatusFromExpiredDate();
    updateQrCode();
  });
  komisionerInput.addEventListener('input', updateQrCode);
  keteranganInput.addEventListener('input', updateQrCode);

  fotoInput.addEventListener('change', async function () {
    const files = Array.from(fotoInput.files || []);
    if (!files.length) return;

    try {
      const payload = await readFilesAsPayloadFromFiles(files);
      fotoDraft = fotoDraft.concat(payload);
      renderPhotoPreview();
    } catch (error) {
      alert(error.message || 'Gagal memproses foto SPIP.');
    }

    fotoInput.value = '';
  });

  form.addEventListener('click', function (event) {
    const removeBtn = event.target.closest('.photo-remove-btn[data-index]');
    if (!removeBtn) return;

    const index = Number(removeBtn.dataset.index);
    if (Number.isNaN(index)) return;
    fotoDraft = fotoDraft.filter(function (_item, idx) { return idx !== index; });
    renderPhotoPreview();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const roleFlags = getRoleFlags();
    if (!roleFlags.canManage) {
      alert('Aksi tambah/ubah data SPIP hanya untuk Super Admin dan Admin.');
      return;
    }

    if (isReadOnlyView) {
      alert('Form sedang dalam mode Read Only. Klik Tambahkan atau Ubah untuk melakukan perubahan.');
      return;
    }

    const payload = {
      id: editingId || ('spip-' + Date.now()),
      kategori: String(kategoriInput.value || '').trim(),
      jenis: getJenisValueForPayload(),
      namaSpip: String(namaInput.value || '').trim(),
      noUnitRegister: String(noUnitInput.value || '').trim(),
      merk: String(merkInput.value || '').trim(),
      model: String(modelInput.value || '').trim(),
      noSeri: String(noSeriInput.value || '').trim(),
      tahunPembuatan: String(tahunInput.value || '').trim(),
      areaKerja: getAreaKerjaValues(),
      deptInCharge: String(deptInput.value || '').trim(),
      perusahaan: String(perusahaanInput.value || '').trim(),
      perusahaanCustodian: String(perusahaanCustodianInput.value || '').trim(),
      ccow: String(ccowInput.value || '').trim(),
      fotoSpip: fotoDraft,
      tanggalKomisioning: String((komisioningTanggalKomisioningInput && komisioningTanggalKomisioningInput.value) || '').trim(),
      tanggalExpired: String((komisioningTanggalExpiredInput && komisioningTanggalExpiredInput.value) || '').trim(),
      email: normalizeEmailList((komisioningEmailInput && komisioningEmailInput.value) || ''),
      status: resolveStatusFromExpiredDate((komisioningTanggalExpiredInput && komisioningTanggalExpiredInput.value) || ''),
      komisioner: String((komisioningKomisionerInput && komisioningKomisionerInput.value) || '').trim(),
      qrPayload: buildQrPayloadText(),
      keterangan: String((komisioningKeteranganInput && komisioningKeteranganInput.value) || '').trim(),
      komisioningHistory: draftKomisioningHistory.slice(),
      createdAt: new Date().toISOString()
    };

    const message = validatePayload(payload);
    if (message) {
      alert(message);
      return;
    }

    const rows = readList(SPIP_KEY);
    const idx = rows.findIndex(function (item) {
      return String(item.id || '').trim() === payload.id;
    });

    if (idx >= 0) {
      const existing = rows[idx] || {};
      const existingHistory = Array.isArray(existing.komisioningHistory) ? existing.komisioningHistory.slice() : [];
      const mergedHistory = payload.komisioningHistory.length ? payload.komisioningHistory.slice() : existingHistory;
      rows[idx] = Object.assign({}, existing, payload, {
        komisioningHistory: mergedHistory,
        createdAt: existing.createdAt || payload.createdAt,
        updatedAt: new Date().toISOString()
      });
    } else {
      rows.push(payload);
    }

    writeList(SPIP_KEY, rows);
    alert(editingId ? 'Data SPIP berhasil diubah.' : 'Data SPIP berhasil disimpan.');
    resetForm();
    closeForm();
    renderTable();
  });

  if (komisioningSaveButton) {
    komisioningSaveButton.addEventListener('click', async function () {
      const roleFlags = getRoleFlags();
      if (!roleFlags.canManage) {
        alert('Simpan komisioning hanya untuk Super Admin dan Admin.');
        return;
      }

      const recordId = String(komisioningRecordId || '').trim();

      const tanggalKomisioning = String((komisioningTanggalKomisioningInput && komisioningTanggalKomisioningInput.value) || '').trim();
      const tanggalExpired = String((komisioningTanggalExpiredInput && komisioningTanggalExpiredInput.value) || '').trim();
      const email = normalizeEmailList((komisioningEmailInput && komisioningEmailInput.value) || '');
      const komisioner = String((komisioningKomisionerInput && komisioningKomisionerInput.value) || '').trim();
      const keterangan = String((komisioningKeteranganInput && komisioningKeteranganInput.value) || '').trim();

      if (!tanggalKomisioning) {
        alert('Tanggal Komisioning wajib diisi.');
        return;
      }
      if (!tanggalExpired) {
        alert('Tanggal Expired wajib diisi.');
        return;
      }
      if (!komisioner) {
        alert('Komisioner wajib diisi.');
        return;
      }
      if (!email) {
        alert('Email wajib diisi.');
        return;
      }

      const invalidEmail = parseEmailList(email).find(function (item) {
        return !isValidEmailAddress(item);
      });
      if (invalidEmail) {
        alert('Format email tidak valid: ' + invalidEmail);
        return;
      }

      syncMainCommissionFieldsFromSubForm();
      syncStatusFromExpiredDate();
      updateQrCode();

      const historyEntry = {
        namaInputer: String((komisioningNamaInputerInput && komisioningNamaInputerInput.value) || '').trim(),
        jabatanInputer: String((komisioningJabatanInputerInput && komisioningJabatanInputerInput.value) || '').trim(),
        departemenInputer: String((komisioningDepartemenInputerInput && komisioningDepartemenInputerInput.value) || '').trim(),
        perusahaanInputer: String((komisioningPerusahaanInputerInput && komisioningPerusahaanInputerInput.value) || '').trim(),
        ccowInputer: String((komisioningCcowInputerInput && komisioningCcowInputerInput.value) || '').trim(),
        tanggalKomisioning: tanggalKomisioning,
        tanggalExpired: tanggalExpired,
        email: email,
        status: resolveStatusFromExpiredDate(tanggalExpired),
        komisioner: komisioner,
        keterangan: keterangan,
        savedAt: new Date().toISOString()
      };

      const tempRecordForExport = {
        noUnitRegister: String(noUnitInput.value || '').trim(),
        namaSpip: String(namaInput.value || '').trim(),
        kategori: String(kategoriInput.value || '').trim(),
        jenis: getJenisValueForPayload(),
        merk: String(merkInput.value || '').trim(),
        model: String(modelInput.value || '').trim(),
        noSeri: String(noSeriInput.value || '').trim(),
        tahunPembuatan: String(tahunInput.value || '').trim(),
        perusahaan: String(perusahaanInput.value || '').trim(),
        ccow: String(ccowInput.value || '').trim(),
        tanggalKomisioning: tanggalKomisioning,
        tanggalExpired: tanggalExpired,
        email: email,
        status: resolveStatusFromExpiredDate(tanggalExpired),
        komisioner: komisioner,
        keterangan: keterangan,
        qrPayload: buildQrPayloadText()
      };

      if (!recordId) {
        const emailSent = await triggerExportAndEmail(tempRecordForExport, email);
        if (!emailSent) return;

        draftKomisioningHistory = draftKomisioningHistory.concat(historyEntry);
        renderKomisioningHistory({ komisioningHistory: draftKomisioningHistory });
        alert('Sub Form SPIP berhasil disimpan dan email terkirim.');
        return;
      }

      const rows = readList(SPIP_KEY);
      const idx = rows.findIndex(function (item) {
        return String(item.id || '').trim() === recordId;
      });

      if (idx < 0) {
        alert('Data SPIP tidak ditemukan.');
        return;
      }

      const record = rows[idx] || {};
      const existingHistory = Array.isArray(record.komisioningHistory) ? record.komisioningHistory.slice() : [];
      const nextRecord = Object.assign({}, record, {
        tanggalKomisioning: tanggalKomisioning,
        tanggalExpired: tanggalExpired,
        email: email,
        komisioner: komisioner,
        keterangan: keterangan,
        status: resolveStatusFromExpiredDate(tanggalExpired),
        qrPayload: buildQrPayloadText(),
        namaInputer: String((komisioningNamaInputerInput && komisioningNamaInputerInput.value) || '').trim(),
        jabatanInputer: String((komisioningJabatanInputerInput && komisioningJabatanInputerInput.value) || '').trim(),
        departemenInputer: String((komisioningDepartemenInputerInput && komisioningDepartemenInputerInput.value) || '').trim(),
        perusahaanInputer: String((komisioningPerusahaanInputerInput && komisioningPerusahaanInputerInput.value) || '').trim(),
        ccowInputer: String((komisioningCcowInputerInput && komisioningCcowInputerInput.value) || '').trim(),
        komisioningHistory: existingHistory.concat(historyEntry),
        updatedAt: new Date().toISOString()
      });

      const payloadForEmail = Object.assign({}, tempRecordForExport, {
        noUnitRegister: String(nextRecord.noUnitRegister || tempRecordForExport.noUnitRegister || '').trim(),
        namaSpip: String(nextRecord.namaSpip || tempRecordForExport.namaSpip || '').trim(),
        kategori: String(nextRecord.kategori || tempRecordForExport.kategori || '').trim(),
        jenis: String(nextRecord.jenis || tempRecordForExport.jenis || '').trim(),
        merk: String(nextRecord.merk || tempRecordForExport.merk || '').trim(),
        model: String(nextRecord.model || tempRecordForExport.model || '').trim(),
        noSeri: String(nextRecord.noSeri || tempRecordForExport.noSeri || '').trim(),
        tahunPembuatan: String(nextRecord.tahunPembuatan || tempRecordForExport.tahunPembuatan || '').trim(),
        perusahaan: String(nextRecord.perusahaan || tempRecordForExport.perusahaan || '').trim(),
        ccow: String(nextRecord.ccow || tempRecordForExport.ccow || '').trim(),
        qrPayload: String(nextRecord.qrPayload || tempRecordForExport.qrPayload || '').trim()
      });

      const emailSent = await triggerExportAndEmail(payloadForEmail, email);
      if (!emailSent) return;

      rows[idx] = nextRecord;
      draftKomisioningHistory = Array.isArray(nextRecord.komisioningHistory) ? nextRecord.komisioningHistory.slice() : [];
      writeList(SPIP_KEY, rows);
      renderTable();
      renderKomisioningHistory(nextRecord);
      alert('Sub Form SPIP berhasil disimpan dan email terkirim.');
    });
  }

  if (komisioningCancelButton) {
    komisioningCancelButton.addEventListener('click', function () {
      hideKomisioningPanel();
    });
  }

  if (spipChartGrid) {
    spipChartGrid.addEventListener('click', function (event) {
      const button = event.target.closest('[data-filter-key][data-filter-value]');
      if (!button) return;

      const key = String(button.dataset.filterKey || '').trim();
      const value = String(button.dataset.filterValue || '').trim();
      if (!key || !Object.prototype.hasOwnProperty.call(spipFilterState, key)) return;

      if (String(spipFilterState[key] || '') === value) {
        spipFilterState[key] = '';
      } else {
        spipFilterState[key] = value;
      }

      renderTable();
    });
  }

  if (spipChartResetButton) {
    spipChartResetButton.addEventListener('click', function () {
      Object.keys(spipFilterState).forEach(function (key) {
        spipFilterState[key] = '';
      });
      renderTable();
    });
  }

  if (addButton) {
    addButton.addEventListener('click', function () {
      const roleFlags = getRoleFlags();
      if (!roleFlags.canManage) {
        alert('Aksi tambah data SPIP hanya untuk Super Admin dan Admin.');
        return;
      }
      resetForm();
      openForm();
    });
  }

  if (komisioningOpenButton) {
    komisioningOpenButton.addEventListener('click', function () {
      const roleFlags = getRoleFlags();
      if (!roleFlags.canManage) {
        alert('Aksi komisioning hanya untuk Super Admin dan Admin.');
        return;
      }
      const activeId = String(editingId || komisioningRecordId || '').trim();
      if (activeId) {
        const rows = readList(SPIP_KEY);
        const target = rows.find(function (item) {
          return String(item.id || '').trim() === activeId;
        });
        if (target) {
          komisioningRecordId = activeId;
          showKomisioningPanel(target, { emptyInputs: true });
          return;
        }
      }

      showKomisioningPanel({
        komisioningHistory: draftKomisioningHistory.slice()
      }, { emptyInputs: true });
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', function () {
      resetForm();
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', function () {
      resetForm();
      closeForm();
    });
  }

  if (readOnlyCancelButton) {
    readOnlyCancelButton.addEventListener('click', function () {
      resetForm();
      closeForm();
    });
  }

  window.addEventListener('storage', function (event) {
    if (!event || (event.key !== DEPT_KEY && event.key !== COMPANY_KEY && event.key !== SPIP_KEY && event.key !== null)) return;
    populateStaticOptions();
    renderTable();
  });

  window.addEventListener('aios:cloud-sync', function (event) {
    const changedKeys = event && event.detail && Array.isArray(event.detail.changedKeys)
      ? event.detail.changedKeys
      : [];
    if (changedKeys.length > 0 && changedKeys.indexOf(DEPT_KEY) < 0 && changedKeys.indexOf(COMPANY_KEY) < 0 && changedKeys.indexOf(SPIP_KEY) < 0) return;
    populateStaticOptions();
    renderTable();
  });

  if (!requireSession()) return;

  syncRoleAccessUi();
  syncKomisioningInputerIdentity();
  populateStaticOptions();
  renderJenisOptions();
  syncJenisCustomVisibility();
  syncMainCommissionFieldsFromSubForm();
  syncStatusFromExpiredDate();
  setMainFormReadOnly(false);
  updateQrCode();
  closeForm();
  hideKomisioningPanel();
  renderTable();
})();
