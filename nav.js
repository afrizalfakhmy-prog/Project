// nav.js — inject a top navigation bar and attach navigation handlers
(function(){
  // don't show top nav on login page
  if (document.getElementById('login-screen')) return;

  // inject top nav if not present
  if (!document.getElementById('top-nav')) {
    const nav = document.createElement('nav');
    nav.id = 'top-nav';
    nav.innerHTML = `
      <div class="top-nav-inner">
        <button id="nav-home" class="top-btn"><span class="nav-icon">🏠</span><span class="nav-label">Menu Utama</span></button>
        <button id="nav-back" class="top-btn"><span class="nav-icon">⬅️</span><span class="nav-label">Back</span></button>
      </div>`;
    document.body.insertBefore(nav, document.body.firstChild);
    // attach simple handlers
    document.getElementById('nav-home').addEventListener('click', () => { window.location.href = 'index.html'; });
    document.getElementById('nav-back').addEventListener('click', () => { history.back(); });
  }

  const routes = {
    'admin-profile':'profile.html',
    'admin-achievement':'achievement.html',
    'admin-tasklist':'tasklist.html',
    'admin-users':'daftar_user.html',
    
    'admin-logout':'index.html',

    'superadmin-profile':'profile.html',
    'superadmin-achievement':'achievement.html',
    'superadmin-tasklist':'tasklist.html',
    'superadmin-users':'daftar_user.html',
    'superadmin-departemen':'daftar_departemen.html',
    'superadmin-perusahaan':'daftar_perusahaan.html',
    'superadmin-pja':'daftar_pja.html',
    'superadmin-logout':'index.html',

    'user-profile':'profile.html',
    'user-achievement':'achievement.html',
    'user-tasklist':'tasklist.html',
    'user-logout':'index.html'
  };

  Object.keys(routes).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', () => {
      window.location.href = routes[id];
    });
  });

  function initImageUploadPreview(input) {
    if (!input || input.dataset.previewInitialized === 'true') return;
    input.dataset.previewInitialized = 'true';
    input.multiple = true;

    const counter = document.createElement('div');
    counter.className = 'upload-preview-count hidden';

    const preview = document.createElement('div');
    preview.className = 'upload-preview-grid hidden';
    preview.setAttribute('aria-live', 'polite');

    if (input.nextSibling) {
      input.parentNode.insertBefore(counter, input.nextSibling);
      input.parentNode.insertBefore(preview, input.nextSibling);
    } else {
      input.parentNode.appendChild(counter);
      input.parentNode.appendChild(preview);
    }

    let objectUrls = [];
    let selectedFiles = [];

    function revokeObjectUrls() {
      objectUrls.forEach(url => {
        try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
      });
      objectUrls = [];
    }

    function fileKey(file) {
      return `${file.name}__${file.size}__${file.lastModified}`;
    }

    function syncInputFileList() {
      const dt = new DataTransfer();
      selectedFiles.forEach(f => dt.items.add(f));
      input.files = dt.files;
    }

    function renderPreview() {
      preview.innerHTML = '';
      revokeObjectUrls();

      if (selectedFiles.length === 0) {
        counter.classList.add('hidden');
        preview.classList.add('hidden');
        return;
      }

      counter.textContent = `Jumlah gambar dipilih: ${selectedFiles.length}`;
      counter.classList.remove('hidden');
      preview.classList.remove('hidden');
      selectedFiles.forEach((file, index) => {
        const thumb = document.createElement('figure');
        thumb.className = 'upload-thumb';

        const img = document.createElement('img');
        const url = URL.createObjectURL(file);
        objectUrls.push(url);
        img.src = url;
        img.alt = file.name;

        const cap = document.createElement('figcaption');
        cap.textContent = file.name;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'upload-thumb-remove';
        removeBtn.textContent = 'Hapus';
        removeBtn.addEventListener('click', () => {
          selectedFiles.splice(index, 1);
          syncInputFileList();
          renderPreview();
        });

        thumb.appendChild(img);
        thumb.appendChild(cap);
        thumb.appendChild(removeBtn);
        preview.appendChild(thumb);
      });
    }

    input.addEventListener('change', () => {
      const incomingFiles = Array.from(input.files || []).filter(file => file.type && file.type.startsWith('image/'));
      if (incomingFiles.length === 0) {
        renderPreview();
        return;
      }

      const existingKeys = new Set(selectedFiles.map(fileKey));
      incomingFiles.forEach(file => {
        const key = fileKey(file);
        if (!existingKeys.has(key)) {
          selectedFiles.push(file);
          existingKeys.add(key);
        }
      });

      syncInputFileList();
      renderPreview();
    });

    selectedFiles = Array.from(input.files || []).filter(file => file.type && file.type.startsWith('image/'));
    syncInputFileList();
    renderPreview();
  }

  document.querySelectorAll('input[type="file"][accept*="image"]').forEach(initImageUploadPreview);
})();
