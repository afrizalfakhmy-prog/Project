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

  async function pullOne(key) {
    if (!isEnabled()) return { found: false, key: key };

    const config = getConfig();
    const url = endpoint(config.tableName + '?key=eq.' + encodeURIComponent(key) + '&select=key,value,updated_at&order=updated_at.desc&limit=1');
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Gagal pull cloud data (' + key + '): HTTP ' + response.status);
    }

    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) return { found: false, key: key };

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
    const url = endpoint(config.tableName);

    // Try UPSERT first (requires key column to be primary key or have unique constraint)
    const upsertResponse = await fetch(url, {
      method: 'POST',
      headers: Object.assign({}, getHeaders(), {
        Prefer: 'resolution=merge-duplicates,return=minimal'
      }),
      body: JSON.stringify([{ key: key, value: value }])
    });

    if (upsertResponse.ok) return;

    // Fallback: DELETE existing then INSERT new
    try {
      const deleteUrl = endpoint(config.tableName + '?key=eq.' + encodeURIComponent(key));
      await fetch(deleteUrl, { method: 'DELETE', headers: getHeaders() });
    } catch (_e) { /* ignore delete errors */ }

    const insertResponse = await fetch(url, {
      method: 'POST',
      headers: Object.assign({}, getHeaders(), { Prefer: 'return=minimal' }),
      body: JSON.stringify([{ key: key, value: value }])
    });

    if (!insertResponse.ok) {
      throw new Error('Gagal push cloud data (' + key + '): HTTP ' + insertResponse.status);
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
    getConfig: getConfig,
    loadRemoteConfig: loadRemoteConfig
  };

  loadRemoteConfig();
})();
