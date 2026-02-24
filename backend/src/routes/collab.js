const express = require('express');
const { readJson, writeJson } = require('../utils/store');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const PRESENCE_FILE = 'presence.json';
const CHAT_FILE = 'chat.json';
const PRESENCE_TTL = 10000;
const PRESENCE_MAX_AGE = 24 * 60 * 60 * 1000;
const CHAT_MAX = 500;

router.use(authRequired);

function readPresenceMap() {
  const value = readJson(PRESENCE_FILE, {});
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function cleanupPresence(map) {
  const now = Date.now();
  let changed = false;

  Object.keys(map).forEach((username) => {
    const item = map[username] || {};
    const lastSeen = Number(item.lastSeen || 0);

    if (item.online && now - lastSeen > PRESENCE_TTL) {
      item.online = false;
      changed = true;
    }

    if (now - lastSeen > PRESENCE_MAX_AGE) {
      delete map[username];
      changed = true;
      return;
    }

    map[username] = {
      username,
      role: item.role || 'User',
      lastSeen,
      online: !!item.online
    };
  });

  return changed;
}

router.get('/presence', (_req, res) => {
  const map = readPresenceMap();
  const changed = cleanupPresence(map);
  if (changed) writeJson(PRESENCE_FILE, map);
  res.json(map);
});

router.post('/presence/heartbeat', (req, res) => {
  const username = req.user && req.user.username ? req.user.username : '';
  const role = (req.user && req.user.role) || (req.body && req.body.role) || 'User';
  if (!username) return res.status(400).json({ message: 'Username not found in token' });

  const map = readPresenceMap();
  map[username] = {
    username,
    role,
    lastSeen: Date.now(),
    online: true
  };

  cleanupPresence(map);
  writeJson(PRESENCE_FILE, map);
  res.status(201).json(map[username]);
});

router.post('/presence/offline', (req, res) => {
  const username = req.user && req.user.username ? req.user.username : '';
  if (!username) return res.status(400).json({ message: 'Username not found in token' });

  const map = readPresenceMap();
  const existing = map[username] || { username, role: (req.user && req.user.role) || 'User' };
  existing.online = false;
  existing.lastSeen = Date.now();
  map[username] = existing;

  cleanupPresence(map);
  writeJson(PRESENCE_FILE, map);
  res.json(existing);
});

router.get('/chat', (_req, res) => {
  const list = readJson(CHAT_FILE, []);
  const safeList = Array.isArray(list) ? list : [];
  res.json(safeList.slice(-200));
});

router.post('/chat', (req, res) => {
  const text = String((req.body && req.body.text) || '').trim();
  if (!text) return res.status(400).json({ message: 'Message text is required' });

  const message = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    username: (req.user && req.user.username) || 'unknown',
    role: (req.user && req.user.role) || 'User',
    ts: Date.now(),
    text
  };

  const list = readJson(CHAT_FILE, []);
  const safeList = Array.isArray(list) ? list : [];
  safeList.push(message);
  writeJson(CHAT_FILE, safeList.slice(-CHAT_MAX));

  res.status(201).json(message);
});

module.exports = router;
