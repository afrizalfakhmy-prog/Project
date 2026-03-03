(function () {
  const buttons = Array.from(document.querySelectorAll('.inspeksi-menu-btn[data-url]'));
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      const nextUrl = String(button.dataset.url || '').trim();
      if (!nextUrl) return;
      window.location.href = nextUrl;
    });
  });
})();
