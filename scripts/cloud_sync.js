(function () {
  const SUPABASE_HEADERS = {
    'Content-Type': 'application/json'
  };
  const DEFAULT_TABLE_NAME = 'aios_kv';

  let remoteConfigCache = {
    supabaseUrl: '',
    supabaseAnonKey: '',
    tableName: DEFAULT_TABLE_NAME,
    loaded: false
  };

  function normalizeUrl(url) {
    return String(url || '').trim().replace(/\/+$/, '');
  }

  function getConfig() {
    const inline = window.AIOS_CLOUD_CONFIG || {};
    const supabaseUrl = normalizeUrl(
      inline.supabaseUrl ||
      localStorage.getItem('aios_supabase_url') ||
      remoteConfigCache.supabaseUrl
    );
    const supabaseAnonKey = String(
      inline.supabaseAnonKey ||
      localStorage.getItem('aios_supabase_anon_key') ||
      remoteConfigCache.supabaseAnonKey ||
      ''
    ).trim();
    const tableName = String(
      inline.tableName ||
      remoteConfigCache.tableName ||
      DEFAULT_TABLE_NAME
    ).trim();

    return {
      supabaseUrl: supabaseUrl,
      supabaseAnonKey: supabaseAnonKey,
      tableName: tableName || DEFAULT_TABLE_NAME
    };
  }

  async function loadRemoteConfig() {
    if (remoteConfigCache.loaded) return;

    try {
      const response = await fetch('/config/cloud-config.json', { cache: 'no-store' });
      if (!response.ok) {
        remoteConfigCache.loaded = true;
        return;
      }

      const json = await response.json();
      remoteConfigCache = {
        supabaseUrl: normalizeUrl(json && json.supabaseUrl),
        supabaseAnonKey: String((json && json.supabaseAnonKey) || '').trim(),
        tableName: String((json && json.tableName) || DEFAULT_TABLE_NAME).trim() || DEFAULT_TABLE_NAME,
        loaded: true
      };
    } catch (_error) {
      remoteConfigCache.loaded = true;
    }
  }

  function isEnabled() {
    const config = getConfig();
    return !!(config.supabaseUrl && config.supabaseAnonKey);
  }

  function getHeaders() {
    const config = getConfig();
    return Object.assign({}, SUPABASE_HEADERS, {
      apikey: config.supabaseAnonKey,
      Authorization: 'Bearer ' + config.supabaseAnonKey
    });
  }

  function endpoint(path) {
    const config = getConfig();
    return config.supabaseUrl + '/rest/v1/' + path;
  }

  async function getAllRowsForKey(key) {
    if (!isEnabled()) return [];
    const config = getConfig();
    const url = endpoint(config.tableName + '?key=eq.' + encodeURIComponent(key) + '&select=key,value,updated_at&order=updated_at.desc');
    try {
      const response = await fetch(url, { method: 'GET', headers: getHeaders() });
      if (!response.ok) return [];
      const rows = await response.json();
      return Array.isArray(rows) ? rows : [];
    } catch (_e) {
      return [];
    }
  }

  async function deleteAllRowsForKey(key) {
    if (!isEnabled()) return false;
    const config = getConfig();
    const url = endpoint(config.tableName + '?key=eq.' + encodeURIComponent(key));
    try {
      const response = await fetch(url, { method: 'DELETE', headers: getHeaders() });
      return response.ok;
    } catch (_e) {
      return false;
    }
  }

  async function pullOne(key) {
    if (!isEnabled()) return { found: false, key: key };

    const rows = await getAllRowsForKey(key);
    if (!rows.length) return { found: false, key: key };

    const row = rows[0] || {};
    let parsedValue = row.value;
    if (typeof parsedValue === 'string') {
      try { parsedValue = JSON.parse(parsedValue); } catch (_e) { /* keep as string */ }
    }
    return {
      found: true,
      key: key,
      value: parsedValue,
      updatedAt: row.updated_at || null
    };
  }

  async function pushOne(key, value) {
    if (!isEnabled()) return;

    const config = getConfig();

    // Strategy 1: UPSERT via ?on_conflict=key (works when key has unique constraint or PK).
    const upsertUrl = endpoint(config.tableName + '?on_conflict=key');
    try {
      const upsertResponse = await fetch(upsertUrl, {
        method: 'POST',
        headers: Object.assign({}, getHeaders(), {
          Prefer: 'resolution=merge-duplicates,return=minimal'
        }),
        body: JSON.stringify([{ key: key, value: value }])
      });
      if (upsertResponse.ok) return;
    } catch (_e) { /* fall through */ }

    // Strategy 2: PATCH (update) existing row.
    const patchUrl = endpoint(config.tableName + '?key=eq.' + encodeURIComponent(key));
    try {
      const patchResponse = await fetch(patchUrl, {
        method: 'PATCH',
        headers: Object.assign({}, getHeaders(), { Prefer: 'return=minimal' }),
        body: JSON.stringify({ value: value })
      });
      if (patchResponse.ok) return;
    } catch (_e) { /* fall through */ }

    // Strategy 3: DELETE then INSERT.
    await deleteAllRowsForKey(key);
    const insertUrl = endpoint(config.tableName);
    const insertResponse = await fetch(insertUrl, {
      method: 'POST',
      headers: Object.assign({}, getHeaders(), { Prefer: 'return=minimal' }),
      body: JSON.stringify([{ key: key, value: value }])
    });

    if (!insertResponse.ok) {
      throw new Error('Gagal push cloud data (' + key + '): HTTP ' + insertResponse.status);
    }
  }

  // Remove duplicate rows in Supabase for a single key.
  // Keeps only the row with the latest updated_at.
  async function deduplicateKey(key) {
    if (!isEnabled()) return;
    const rows = await getAllRowsForKey(key);
    if (rows.length <= 1) return;

    // rows[0] is the newest (order by updated_at desc)
    const latest = rows[0];
    let latestValue = latest.value;
    if (typeof latestValue === 'string') {
      try { latestValue = JSON.parse(latestValue); } catch (_e) { /* keep */ }
    }

    await deleteAllRowsForKey(key);

    const config = getConfig();
    const url = endpoint(config.tableName);
    try {
      await fetch(url, {
        method: 'POST',
        headers: Object.assign({}, getHeaders(), { Prefer: 'return=minimal' }),
        body: JSON.stringify([{ key: latest.key, value: latestValue }])
      });
    } catch (_e) { /* ignore */ }
  }

  // Remove duplicate rows for a list of keys.
  async function deduplicateAll(keys) {
    if (!isEnabled()) return;
    const list = Array.isArray(keys) ? keys : [];
    for (let i = 0; i < list.length; i += 1) {
      try {
        await deduplicateKey(list[i]);
      } catch (_e) { /* continue even if one key fails */ }
    }
  }

  async function pullMany(keys) {
    const list = Array.isArray(keys) ? keys : [];
    const results = [];

    for (let index = 0; index < list.length; index += 1) {
      const key = list[index];
      const row = await pullOne(key);
      results.push(row);
    }

    return results;
  }

  window.aiosCloudSync = {
    isEnabled: isEnabled,
    pullOne: pullOne,
    pullMany: pullMany,
    pushOne: pushOne,
    deduplicateKey: deduplicateKey,
    deduplicateAll: deduplicateAll,
    getConfig: getConfig,
    loadRemoteConfig: loadRemoteConfig
  };

  loadRemoteConfig();
})();
