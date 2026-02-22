(function () {
  const SESSION_KEY = 'aios_session';
  const USER_KEY = 'aios_users';
  const KTA_KEY = 'aios_kta_records';
  const TTA_KEY = 'aios_tta_records';

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

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

  function normalizeStatus(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'open') return 'Open';
    if (raw === 'progress') return 'Progress';
    if (raw === 'close') return 'Close';
    return '-';
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

  function buildDataset(identity) {
    const kta = readJson(KTA_KEY) || [];
    const tta = readJson(TTA_KEY) || [];

    const nameSet = new Set([identity.username, identity.nama].filter(Boolean).map(function (value) {
      return value.toLowerCase();
    }));

    function belongsToUser(item) {
      const reporterUsername = String(item.reporterUsername || '').toLowerCase();
      const reporterName = String(item.namaPelapor || '').toLowerCase();
      if (identity.username && reporterUsername === identity.username.toLowerCase()) return true;
      return nameSet.has(reporterName);
    }

    return {
      kta: kta.filter(belongsToUser),
      tta: tta.filter(belongsToUser)
    };
  }

  function aggregateMonthly(records) {
    const yearNow = new Date().getFullYear();
    const monthlyKta = new Array(12).fill(0);
    const monthlyTta = new Array(12).fill(0);
    const monthlyStatus = {
      Open: new Array(12).fill(0),
      Progress: new Array(12).fill(0),
      Close: new Array(12).fill(0)
    };

    records.kta.forEach(function (item) {
      const date = new Date(item.tanggalLaporan || '');
      if (Number.isNaN(date.getTime()) || date.getFullYear() !== yearNow) return;
      const monthIndex = date.getMonth();
      monthlyKta[monthIndex] += 1;
      const status = normalizeStatus(item.status);
      if (monthlyStatus[status]) monthlyStatus[status][monthIndex] += 1;
    });

    records.tta.forEach(function (item) {
      const date = new Date(item.tanggalLaporan || '');
      if (Number.isNaN(date.getTime()) || date.getFullYear() !== yearNow) return;
      const monthIndex = date.getMonth();
      monthlyTta[monthIndex] += 1;
      const status = normalizeStatus(item.status);
      if (monthlyStatus[status]) monthlyStatus[status][monthIndex] += 1;
    });

    return { year: yearNow, monthlyKta: monthlyKta, monthlyTta: monthlyTta, monthlyStatus: monthlyStatus };
  }

  function aggregateStatus(records) {
    const statusCounts = { Open: 0, Progress: 0, Close: 0, '-': 0 };

    records.kta.forEach(function (item) {
      const status = normalizeStatus(item.status);
      statusCounts[status] += 1;
    });

    records.tta.forEach(function (item) {
      const status = normalizeStatus(item.status);
      statusCounts[status] += 1;
    });

    return statusCounts;
  }

  function renderSummary(records) {
    const summary = document.getElementById('achievement-summary');
    if (!summary) return;

    const totalKta = records.kta.length;
    const totalTta = records.tta.length;
    const totalAll = totalKta + totalTta;

    summary.innerHTML = `
      <article class="achievement-card">
        <span>Total KTA</span>
        <strong>${totalKta}</strong>
      </article>
      <article class="achievement-card">
        <span>Total TTA</span>
        <strong>${totalTta}</strong>
      </article>
      <article class="achievement-card">
        <span>Total Pencapaian</span>
        <strong>${totalAll}</strong>
      </article>
    `;
  }

  function renderMonthlyChart(monthly) {
    const chart = document.getElementById('achievement-monthly-chart');
    if (!chart) return;

    const maxValue = Math.max(1, ...monthly.monthlyKta, ...monthly.monthlyTta);

    chart.innerHTML = monthLabels.map(function (label, index) {
      const kta = monthly.monthlyKta[index];
      const tta = monthly.monthlyTta[index];
      const openCount = monthly.monthlyStatus.Open[index];
      const progressCount = monthly.monthlyStatus.Progress[index];
      const closeCount = monthly.monthlyStatus.Close[index];
      const ktaHeight = Math.max(6, Math.round((kta / maxValue) * 100));
      const ttaHeight = Math.max(6, Math.round((tta / maxValue) * 100));

      return `
        <div class="ach-month-col">
          <div class="ach-bars">
            <div class="ach-bar ach-bar-kta" style="height:${ktaHeight}%" title="KTA ${label}: ${kta}"></div>
            <div class="ach-bar ach-bar-tta" style="height:${ttaHeight}%" title="TTA ${label}: ${tta}"></div>
          </div>
          <div class="ach-values">${kta} / ${tta}</div>
          <div class="ach-status-detail">O:${openCount} P:${progressCount} C:${closeCount}</div>
          <div class="ach-label">${label}</div>
        </div>
      `;
    }).join('');
  }

  function renderStatus(statusCounts) {
    const container = document.getElementById('achievement-status');
    if (!container) return;

    const descriptions = {
      Open: 'Temuan sudah dicatat, belum ditindaklanjuti.',
      Progress: 'Temuan sedang dalam proses tindak lanjut.',
      Close: 'Temuan sudah selesai ditindaklanjuti.',
      '-': 'Status belum ditentukan.'
    };

    const ordered = ['Open', 'Progress', 'Close', '-'];
    container.innerHTML = ordered.map(function (key) {
      return `
        <article class="achievement-status-card">
          <h4>${key}</h4>
          <p>${descriptions[key]}</p>
          <strong>${statusCounts[key] || 0}</strong>
        </article>
      `;
    }).join('');
  }

  function init() {
    const meta = document.getElementById('achievement-meta');
    const identity = getIdentity();

    if (!identity.username) {
      if (meta) meta.textContent = 'Silakan login terlebih dahulu untuk melihat dashboard pencapaian.';
      return;
    }

    if (meta) {
      if (identity.role === 'User') {
        meta.textContent = `Dashboard pencapaian bulanan untuk ${identity.username}`;
      } else {
        meta.textContent = `Dashboard ini fokus untuk role User. Login saat ini: ${identity.username} (${identity.role || '-'})`;
      }
    }

    const records = buildDataset(identity);
    const monthly = aggregateMonthly(records);
    const statusCounts = aggregateStatus(records);

    renderSummary(records);
    renderMonthlyChart(monthly);
    renderStatus(statusCounts);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
