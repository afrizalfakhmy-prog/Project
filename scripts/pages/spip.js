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

  function exportSpipToPdf(record) {
    const target = record || {};
    const qrPayload = String(target.qrPayload || buildQrPayloadTextFromRecord(target) || '').trim();
    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=' + encodeURIComponent(qrPayload || '-');
    const logoUrl = new URL('../assets/Logo Alamtri.png', window.location.href).href;

    const html =
      '<!doctype html>' +
      '<html><head><meta charset="utf-8" />' +
      '<title>SPIP Export - ' + escapeHtml(target.noUnitRegister || '-') + '</title>' +
      '<style>' +
      '@page{size:A4;margin:10mm;}' +
      'body{font-family:Arial,sans-serif;color:#0f172a;font-size:12px;background:#ffffff;}' +
      '.sticker{position:relative;width:88mm;min-height:130mm;border:1px solid #bfc8d4;border-radius:8px;padding:8px;box-sizing:border-box;}' +
      '.sticker-head{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;margin-bottom:6px;text-align:center;}' +
      '.sticker-title{font-size:16px;font-weight:700;line-height:1.1;margin:0;white-space:nowrap;}' +
      '.sticker-subtitle{font-size:9px;line-height:1.2;color:#334155;margin:2px 0 0;white-space:nowrap;}' +
      '.sticker-logo{width:176px;max-height:68px;object-fit:contain;display:block;margin:0 auto 6px;}' +
      '.qr-wrap{border:1px solid #bfc8d4;border-radius:8px;padding:4px;width:100%;box-sizing:border-box;margin-bottom:6px;}' +
      '.qr{width:100%;aspect-ratio:1/1;display:block;object-fit:contain;}' +
      '.meta-row{display:flex;justify-content:space-between;gap:10px;font-size:11px;line-height:1.2;margin:0 0 6px;}' +
      '.meta-cell{max-width:48%;word-break:break-word;}' +
      '.line{font-size:12px;line-height:1.15;margin:0;white-space:normal;word-break:break-word;}' +
      '</style></head><body>' +
      '<section class="sticker">' +
      '<img class="sticker-logo" src="' + logoUrl + '" alt="Logo Alamtri" />' +
      '<div class="sticker-head">' +
      '<div><h1 class="sticker-title">Stiker Komisioning</h1><p class="sticker-subtitle">PT. Alamtri Minerals Indonesia</p></div>' +
      '</div>' +
      '<div class="qr-wrap">' +
      '<img class="qr" src="' + qrUrl + '" alt="QR Komisioning" />' +
      '</div>' +
      '<div class="meta-row">' +
      '<div class="meta-cell"><strong>' + escapeHtml(target.perusahaan || '') + '</strong></div>' +
      '<div class="meta-cell" style="text-align:right;"><strong>' + escapeHtml(target.ccow || '') + '</strong></div>' +
      '</div>' +
      '<p class="line"><strong>No Unit / Register:</strong> ' + escapeHtml(target.noUnitRegister || '') + '</p>' +
      '<p class="line"><strong>Nama SPIP:</strong> ' + escapeHtml(target.namaSpip || '') + '</p>' +
      '<p class="line"><strong>Kategori:</strong> ' + escapeHtml(target.kategori || '') + '</p>' +
      '<p class="line"><strong>Jenis:</strong> ' + escapeHtml(target.jenis || '') + '</p>' +
      '<p class="line"><strong>Merk:</strong> ' + escapeHtml(target.merk || '') + '</p>' +
      '<p class="line"><strong>Model:</strong> ' + escapeHtml(target.model || '') + '</p>' +
      '<p class="line"><strong>Tahun Pembuatan:</strong> ' + escapeHtml(target.tahunPembuatan || '') + '</p>' +
      '<p class="line"><strong>Tanggal Komisioning:</strong> ' + escapeHtml(target.tanggalKomisioning || '') + '</p>' +
      '<p class="line"><strong>Tanggal Expired:</strong> ' + escapeHtml(target.tanggalExpired || '') + '</p>' +
      '</section>' +
      '</body></html>';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup diblokir browser. Izinkan popup lalu coba ekspor lagi.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    const images = Array.from(printWindow.document.images || []);
    if (!images.length) {
      printWindow.print();
      return;
    }

    let loadedCount = 0;
    let hasPrinted = false;
    function tryPrint() {
      if (hasPrinted) return;
      if (loadedCount < images.length) return;
      hasPrinted = true;
      printWindow.print();
    }

    images.forEach(function (img) {
      if (img.complete) {
        loadedCount += 1;
        tryPrint();
        return;
      }

      img.onload = function () {
        loadedCount += 1;
        tryPrint();
      };
      img.onerror = function () {
        loadedCount += 1;
        tryPrint();
      };
    });

    setTimeout(function () {
      if (hasPrinted) return;
      hasPrinted = true;
      printWindow.print();
    }, 2200);
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
      'Halo,',
      '',
      'Berikut data SPIP yang telah disimpan:',
      '- No Unit / Register: ' + String(target.noUnitRegister || '-').trim(),
      '- Nama SPIP: ' + String(target.namaSpip || '-').trim(),
      '- Tanggal Komisioning: ' + String(target.tanggalKomisioning || '-').trim(),
      '- Tanggal Expired: ' + String(target.tanggalExpired || '-').trim(),
      '- Status: ' + String(target.status || '-').trim(),
      '',
      'Terlampir file PDF hasil ekspor SPIP.',
      '',
      'Terima kasih.'
    ].join('\n');
  }

  function createSpipPdfBlob(record) {
    const target = record || {};
    const jsPdfApi = window.jspdf && window.jspdf.jsPDF;
    if (!jsPdfApi) {
      throw new Error('Library PDF belum tersedia.');
    }

    const doc = new jsPdfApi({ unit: 'pt', format: 'a4' });
    let y = 56;
    const left = 48;
    const lineHeight = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('SPIP Komisioning', left, y);
    y += 26;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    const lines = [
      ['No Unit / Register', target.noUnitRegister || '-'],
      ['Nama SPIP', target.namaSpip || '-'],
      ['Kategori', target.kategori || '-'],
      ['Jenis', target.jenis || '-'],
      ['Merk', target.merk || '-'],
      ['Model', target.model || '-'],
      ['Tahun Pembuatan', target.tahunPembuatan || '-'],
      ['Perusahaan', target.perusahaan || '-'],
      ['CCOW', target.ccow || '-'],
      ['Tanggal Komisioning', target.tanggalKomisioning || '-'],
      ['Tanggal Expired', target.tanggalExpired || '-'],
      ['Status', target.status || '-'],
      ['Email', target.email || '-'],
      ['Komisioner', target.komisioner || '-'],
      ['Keterangan', target.keterangan || '-']
    ];

    lines.forEach(function (entry) {
      const label = String(entry[0] || '').trim();
      const value = String(entry[1] || '-').trim() || '-';
      const composed = label + ': ' + value;
      const wrapped = doc.splitTextToSize(composed, 500);
      doc.text(wrapped, left, y);
      y += lineHeight * wrapped.length;
      if (y > 770) {
        doc.addPage();
        y = 56;
      }
    });

    return doc.output('blob');
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
        reject(new Error('Gagal mengubah PDF ke base64.'));
      };
      reader.readAsDataURL(blob);
    });
  }

  async function sendSpipPdfToEmailApi(record, recipients, pdfBlob) {
    const config = getSpipEmailApiConfig();
    if (!config.endpoint) {
      throw new Error('Endpoint API email belum dikonfigurasi.');
    }

    const target = record || {};
    const fileName = 'SPIP-' + String(target.noUnitRegister || 'Komisioning').replace(/\s+/g, '_') + '.pdf';
    const fileBase64 = await blobToBase64(pdfBlob);
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
        payload: target,
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

    const target = record || {};
    exportSpipToPdf(target);

    try {
      const pdfBlob = createSpipPdfBlob(target);
      await sendSpipPdfToEmailApi(target, recipients, pdfBlob);
      return true;
    } catch (error) {
      alert('Pengiriman email otomatis gagal: ' + String((error && error.message) || 'Unknown error'));
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

    const encoded = encodeURIComponent(payloadText);
    qrImage.src = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encoded;
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

  function showKomisioningPanel(record) {
    const target = record || {};
    syncKomisioningInputerIdentity();
    if (Array.isArray(target.komisioningHistory)) {
      draftKomisioningHistory = target.komisioningHistory.slice();
    }
    const latestKomisioning = getLatestKomisioningSnapshot(target);
    if (komisioningTanggalKomisioningInput) komisioningTanggalKomisioningInput.value = latestKomisioning.tanggalKomisioning;
    if (komisioningTanggalExpiredInput) komisioningTanggalExpiredInput.value = latestKomisioning.tanggalExpired;
    if (komisioningEmailInput) komisioningEmailInput.value = latestKomisioning.email;
    if (komisioningKomisionerInput) komisioningKomisionerInput.value = latestKomisioning.komisioner;
    if (komisioningKeteranganInput) komisioningKeteranganInput.value = latestKomisioning.keterangan;
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
    showKomisioningPanel(target);
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
    const rows = readList(SPIP_KEY);
    const roleFlags = getRoleFlags();
    if (!tbody || !emptyText) return;

    tbody.innerHTML = '';

    if (!rows.length) {
      emptyText.classList.remove('hidden');
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
        exportSpipToPdf(target);
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
          src: 'https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=' + encodeURIComponent(qrPayloadValue)
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
    if (!payload.tanggalKomisioning) return 'Tanggal Komisioning wajib diisi.';
    if (!payload.tanggalExpired) return 'Tanggal Expired wajib diisi.';
    if (!payload.status) return 'Status wajib dipilih.';
    if (!payload.komisioner) return 'Komisioner wajib diisi.';
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

      if (!recordId) {
        draftKomisioningHistory = draftKomisioningHistory.concat(historyEntry);
        renderKomisioningHistory({ komisioningHistory: draftKomisioningHistory });
        const tempRecordForExport = {
          noUnitRegister: String(noUnitInput.value || '').trim(),
          namaSpip: String(namaInput.value || '').trim(),
          kategori: String(kategoriInput.value || '').trim(),
          jenis: getJenisValueForPayload(),
          merk: String(merkInput.value || '').trim(),
          model: String(modelInput.value || '').trim(),
          tahunPembuatan: String(tahunInput.value || '').trim(),
          perusahaan: String(perusahaanInput.value || '').trim(),
          ccow: String(ccowInput.value || '').trim(),
          tanggalKomisioning: tanggalKomisioning,
          tanggalExpired: tanggalExpired,
          email: email,
          komisioner: komisioner,
          keterangan: keterangan,
          qrPayload: buildQrPayloadText()
        };
        const emailSent = await triggerExportAndEmail(tempRecordForExport, email);
        if (emailSent) {
          alert('Sub Form SPIP berhasil disimpan dan email terkirim.');
        } else {
          alert('Sub Form SPIP berhasil disimpan, tetapi email tidak terkirim otomatis.');
        }
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
      rows[idx] = Object.assign({}, record, {
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
      draftKomisioningHistory = Array.isArray(rows[idx].komisioningHistory) ? rows[idx].komisioningHistory.slice() : [];

      writeList(SPIP_KEY, rows);
      renderTable();
      renderKomisioningHistory(rows[idx]);
      const emailSent = await triggerExportAndEmail(rows[idx], email);
      if (emailSent) {
        alert('Sub Form SPIP berhasil disimpan dan email terkirim.');
      } else {
        alert('Sub Form SPIP berhasil disimpan, tetapi email tidak terkirim otomatis.');
      }
    });
  }

  if (komisioningCancelButton) {
    komisioningCancelButton.addEventListener('click', function () {
      hideKomisioningPanel();
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
          showKomisioningPanel(target);
          return;
        }
      }

      showKomisioningPanel({
        tanggalKomisioning: String(tanggalKomisioningInput.value || '').trim(),
        tanggalExpired: String(tanggalExpiredInput.value || '').trim(),
        email: String((komisioningEmailInput && komisioningEmailInput.value) || '').trim(),
        komisioner: String(komisionerInput.value || '').trim(),
        keterangan: String(keteranganInput.value || '').trim(),
        komisioningHistory: draftKomisioningHistory.slice()
      });
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
