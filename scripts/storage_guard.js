(function () {
  const CLOUD_SYNC_EVENT = 'aios:cloud-sync';
  let isApplyingRemoteData = false;

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
    'aios_observasi',
    'aios_jsa',
    'aios_inspeksi',
    'aios_spip'
  ];

  function getBackupKey(key) {
    return 'aios_backup__' + key;
  }

  function parseJsonSafe(value) {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return null;
    }
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

  async function pushCloudKeyIfNeeded(key, value) {
    if (isApplyingRemoteData) return;
    if (DATA_KEYS.indexOf(key) < 0) return;
    if (!window.aiosCloudSync || !window.aiosCloudSync.isEnabled || !window.aiosCloudSync.isEnabled()) return;

    const parsedValue = parseJsonSafe(value);
    if (parsedValue === null) return;

    try {
      await window.aiosCloudSync.pushOne(key, parsedValue);
    } catch (_error) {
    }
  }

  function applyRemoteValueToLocal(key, remoteValue) {
    const currentRaw = localStorage.getItem(key);
    const remoteRaw = JSON.stringify(remoteValue);
    if (currentRaw === remoteRaw) return false;

    isApplyingRemoteData = true;
    try {
      originalSetItem.call(localStorage, key, remoteRaw);
      originalSetItem.call(localStorage, getBackupKey(key), remoteRaw);
    } finally {
      isApplyingRemoteData = false;
    }

    return true;
  }

  async function syncFromCloud() {
    if (!window.aiosCloudSync || !window.aiosCloudSync.isEnabled || !window.aiosCloudSync.isEnabled()) return;

    const changedKeys = [];

    try {
      const rows = await window.aiosCloudSync.pullMany(DATA_KEYS);
      rows.forEach(function (row) {
        if (!row || !row.found) return;
        const changed = applyRemoteValueToLocal(row.key, row.value);
        if (changed) changedKeys.push(row.key);
      });

      for (let index = 0; index < DATA_KEYS.length; index += 1) {
        const key = DATA_KEYS[index];
        const remoteRow = rows.find(function (row) {
          return row && row.key === key;
        });
        if (remoteRow && remoteRow.found) continue;

        const localRaw = localStorage.getItem(key);
        const localParsed = parseJsonSafe(localRaw);
        if (localParsed === null) continue;

        try {
          await window.aiosCloudSync.pushOne(key, localParsed);
        } catch (_error) {
        }
      }
    } catch (_error) {
      return;
    }

    if (changedKeys.length > 0) {
      window.dispatchEvent(new CustomEvent(CLOUD_SYNC_EVENT, {
        detail: { changedKeys: changedKeys }
      }));
    }
  }

  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);

    if (DATA_KEYS.indexOf(key) >= 0) {
      originalSetItem.call(this, getBackupKey(key), value);
      pushCloudKeyIfNeeded(key, value);
    }
  };

  Storage.prototype.removeItem = function (key) {
    originalRemoveItem.call(this, key);

    if (DATA_KEYS.indexOf(key) >= 0) {
      originalRemoveItem.call(this, getBackupKey(key));
    }
  };

  syncFromCloud();
  setInterval(syncFromCloud, 8000);

  // Clean up duplicate rows in Supabase that may have accumulated due to
  // previous missing primary key constraint. Runs once per page load.
  if (window.aiosCloudSync && typeof window.aiosCloudSync.deduplicateAll === 'function') {
    window.aiosCloudSync.deduplicateAll(DATA_KEYS).catch(function () {});
  } else {
    window.addEventListener('load', function () {
      if (window.aiosCloudSync && typeof window.aiosCloudSync.deduplicateAll === 'function') {
        window.aiosCloudSync.deduplicateAll(DATA_KEYS).catch(function () {});
      }
    }, { once: true });
  }
})();
