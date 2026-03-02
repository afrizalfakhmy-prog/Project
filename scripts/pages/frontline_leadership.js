(function () {
  const cardButtons = Array.from(document.querySelectorAll('.menu-item[data-menu]'));

  const routes = {
    KTA: 'kta.html',
    TTA: 'tta.html',
    JSA: 'jsa.html'
  };

  cardButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const menu = button.dataset.menu || '';
      const target = routes[menu];
      if (!target) return;
      window.location.href = target;
    });
  });
})();
