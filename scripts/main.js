(function () {
  const startButton = document.getElementById('start-design-btn');
  const clearButton = document.getElementById('clear-draft-btn');
  const statusText = document.getElementById('status-text');
  const DRAFT_KEY = 'website_new_draft_started_at';

  function setStatus(message) {
    if (!statusText) return;
    statusText.textContent = message || '';
  }

  function formatTimestamp(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('id-ID');
  }

  function showCurrentDraftStatus() {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) {
      setStatus('Belum ada draft aktif.');
      return;
    }
    setStatus('Draft aktif sejak ' + formatTimestamp(saved));
  }

  if (startButton) {
    startButton.addEventListener('click', function () {
      const now = new Date().toISOString();
      localStorage.setItem(DRAFT_KEY, now);
      setStatus('Draft baru dibuat: ' + formatTimestamp(now));
    });
  }

  if (clearButton) {
    clearButton.addEventListener('click', function () {
      localStorage.removeItem(DRAFT_KEY);
      setStatus('Draft direset. Anda bisa mulai desain ulang dari nol.');
    });
  }

  showCurrentDraftStatus();
})();
