(function () {
  const MODAL_ID = 'aios-detail-modal';

  function normalizeImages(rawImages) {
    if (!Array.isArray(rawImages)) return [];
    return rawImages
      .map(function (item, index) {
        if (!item) return null;

        if (typeof item === 'string') {
          const src = String(item || '').trim();
          if (!src) return null;
          return {
            src: src,
            name: 'Gambar ' + String(index + 1)
          };
        }

        const src = String(item.src || item.dataUrl || '').trim();
        if (!src) return null;
        return {
          src: src,
          name: String(item.name || ('Gambar ' + String(index + 1))).trim()
        };
      })
      .filter(function (item) { return !!item; });
  }

  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'aios-detail-modal hidden';
    modal.innerHTML =
      '<div class="aios-detail-backdrop" data-detail-close="backdrop"></div>' +
      '<section class="aios-detail-dialog card" role="dialog" aria-modal="true" aria-labelledby="aios-detail-title">' +
      '<header class="module-header aios-detail-header">' +
      '<h2 id="aios-detail-title">Detail Data</h2>' +
      '<button type="button" class="ghost" data-detail-close="button">Tutup</button>' +
      '</header>' +
      '<pre id="aios-detail-content" class="aios-detail-content"></pre>' +
      '<section id="aios-detail-media" class="aios-detail-media hidden" aria-label="Preview Gambar">' +
      '<h3 class="aios-detail-media-title">Preview Gambar</h3>' +
      '<div id="aios-detail-media-grid" class="aios-detail-media-grid"></div>' +
      '</section>' +
      '</section>';

    document.body.appendChild(modal);

    modal.addEventListener('click', function (event) {
      const closeTarget = event.target.closest('[data-detail-close]');
      if (!closeTarget) return;
      hide();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
        hide();
      }
    });

    return modal;
  }

  function show(title, contentText, options) {
    const modal = ensureModal();
    const titleEl = modal.querySelector('#aios-detail-title');
    const contentEl = modal.querySelector('#aios-detail-content');
    const mediaSection = modal.querySelector('#aios-detail-media');
    const mediaGrid = modal.querySelector('#aios-detail-media-grid');
    const imageItems = normalizeImages(options && options.images ? options.images : []);

    if (titleEl) titleEl.textContent = title || 'Detail Data';
    if (contentEl) contentEl.textContent = contentText || '-';

    if (mediaSection && mediaGrid) {
      mediaGrid.innerHTML = '';
      if (imageItems.length > 0) {
        imageItems.forEach(function (item) {
          const link = document.createElement('a');
          link.className = 'aios-detail-image-link';
          link.href = item.src;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.title = 'Buka ukuran asli: ' + item.name;

          const image = document.createElement('img');
          image.className = 'aios-detail-image-thumb';
          image.src = item.src;
          image.alt = item.name;

          const caption = document.createElement('span');
          caption.className = 'aios-detail-image-caption';
          caption.textContent = item.name;

          link.appendChild(image);
          link.appendChild(caption);
          mediaGrid.appendChild(link);
        });
        mediaSection.classList.remove('hidden');
      } else {
        mediaSection.classList.add('hidden');
      }
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function hide() {
    const modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  window.aiosShowDetailModal = show;
})();
