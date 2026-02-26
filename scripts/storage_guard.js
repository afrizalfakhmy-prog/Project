(function () {
  function enforceCanonicalLocalOrigin() {
    const protocol = String(window.location.protocol || '').toLowerCase();
    const hostname = String(window.location.hostname || '').toLowerCase();

    if ((protocol === 'http:' || protocol === 'https:') && hostname === 'localhost') {
      const targetUrl = window.location.protocol + '//127.0.0.1' +
        (window.location.port ? ':' + window.location.port : '') +
        window.location.pathname +
        window.location.search +
        window.location.hash;

      if (window.location.href !== targetUrl) {
        window.location.replace(targetUrl);
        return true;
      }
    }

    return false;
  }

  if (enforceCanonicalLocalOrigin()) {
    return;
  }

  const DATA_KEYS = [
    'aios_users',
    'aios_departments',
    'aios_companies',
    'aios_pja',
    'aios_kta',
    'aios_tta',
    'aios_ohs_talk',
    'aios_observasi'
  ];

  function getBackupKey(key) {
    return 'aios_backup__' + key;
  }

  function isJsonParsable(value) {
    if (typeof value !== 'string' || value.trim() === '') return false;
    try {
      JSON.parse(value);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function restoreFromBackupIfNeeded(key) {
    const backupKey = getBackupKey(key);
    const currentValue = localStorage.getItem(key);
    const backupValue = localStorage.getItem(backupKey);

    const currentValid = isJsonParsable(currentValue);
    const backupValid = isJsonParsable(backupValue);

    if (currentValid) {
      if (backupValue !== currentValue) {
        localStorage.setItem(backupKey, currentValue);
      }
      return;
    }

    if (backupValid) {
      localStorage.setItem(key, backupValue);
    }
  }

  DATA_KEYS.forEach(function (key) {
    restoreFromBackupIfNeeded(key);
  });

  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);

    if (DATA_KEYS.indexOf(key) >= 0) {
      originalSetItem.call(this, getBackupKey(key), value);
    }
  };

  Storage.prototype.removeItem = function (key) {
    originalRemoveItem.call(this, key);

    if (DATA_KEYS.indexOf(key) >= 0) {
      originalRemoveItem.call(this, getBackupKey(key));
    }
  };
})();
