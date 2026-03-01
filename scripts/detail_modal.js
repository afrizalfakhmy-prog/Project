(function () {
  const MODAL_ID = 'aios-detail-modal';

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

  function show(title, contentText) {
    const modal = ensureModal();
    const titleEl = modal.querySelector('#aios-detail-title');
    const contentEl = modal.querySelector('#aios-detail-content');

    if (titleEl) titleEl.textContent = title || 'Detail Data';
    if (contentEl) contentEl.textContent = contentText || '-';

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
