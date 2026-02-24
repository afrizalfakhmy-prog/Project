const express = require('express');
const { readJson, writeJson } = require('../utils/store');
const jwt = require('jsonwebtoken');

const router = express.Router();

const CHAT_FILE = 'chat.json';
const PRESENCE_TTL = 10000;
const PRESENCE_MAX_AGE = 24 * 60 * 60 * 1000;
const CHAT_MAX = 500;

let presenceCache = {};
let ioRef = null;
const socketUsers = new Map();
const socketUserCounts = new Map();

router.use((req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return next();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'change_me');
  } catch (_e) {
    req.user = null;
  }
  next();
});

function readPresenceMap() {
  const value = presenceCache;
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function writePresenceMap(next) {
  presenceCache = next && typeof next === 'object' && !Array.isArray(next) ? next : {};
}

function getChatList() {
  const list = readJson(CHAT_FILE, []);
  return Array.isArray(list) ? list : [];
}

function broadcastPresence() {
  if (!ioRef) return;
  ioRef.emit('presence:update', readPresenceMap());
}

function broadcastChatSnapshot() {
  if (!ioRef) return;
  ioRef.emit('chat:snapshot', getChatList().slice(-200));
}

function appendChatMessage(input) {
  const list = getChatList();
  const message = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    username: input.username,
    role: input.role || 'User',
    ts: Date.now(),
    text: input.text
  };
  list.push(message);
  writeJson(CHAT_FILE, list.slice(-CHAT_MAX));
  if (ioRef) {
    ioRef.emit('chat:new', message);
  }
  return message;
}

function setPresenceOnline(username, role) {
  if (!username) return null;
  const map = readPresenceMap();
  map[username] = {
    username,
    role: role || (map[username] && map[username].role) || 'User',
    lastSeen: Date.now(),
    online: true
  };
  cleanupPresence(map);
  writePresenceMap(map);
  broadcastPresence();
  return map[username];
}

function setPresenceOffline(username, role) {
  if (!username) return null;
  const map = readPresenceMap();
  const existing = map[username] || { username, role: role || 'User' };
  existing.online = false;
  existing.lastSeen = Date.now();
  existing.role = existing.role || role || 'User';
  map[username] = existing;
  cleanupPresence(map);
  writePresenceMap(map);
  broadcastPresence();
  return existing;
}

function trackSocketUser(socketId, username) {
  if (!socketId || !username) return;
  socketUsers.set(socketId, username);
  const nextCount = Number(socketUserCounts.get(username) || 0) + 1;
  socketUserCounts.set(username, nextCount);
}

function untrackSocketUser(socketId) {
  const username = socketUsers.get(socketId);
  if (!username) return null;
  socketUsers.delete(socketId);
  const nextCount = Number(socketUserCounts.get(username) || 1) - 1;
  if (nextCount <= 0) {
    socketUserCounts.delete(username);
    return username;
  }
  socketUserCounts.set(username, nextCount);
  return null;
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
  cleanupPresence(map);
  writePresenceMap(map);
  broadcastPresence();
  res.json(map);
});

router.post('/presence/heartbeat', (req, res) => {
  const username = (req.user && req.user.username) || (req.body && req.body.username) || '';
  const role = (req.user && req.user.role) || (req.body && req.body.role) || 'User';
  if (!username) return res.status(400).json({ message: 'Username not found in token' });

  const item = setPresenceOnline(username, role);
  res.status(201).json(item);
});

router.post('/presence/offline', (req, res) => {
  const username = (req.user && req.user.username) || (req.body && req.body.username) || '';
  if (!username) return res.status(400).json({ message: 'Username not found in token' });

  const existing = setPresenceOffline(username, (req.user && req.user.role) || (req.body && req.body.role) || 'User');
  res.json(existing);
});

router.get('/chat', (_req, res) => {
  res.json(getChatList().slice(-200));
});

router.post('/chat', (req, res) => {
  const text = String((req.body && req.body.text) || '').trim();
  if (!text) return res.status(400).json({ message: 'Message text is required' });

  const username = (req.user && req.user.username) || (req.body && req.body.username) || '';
  const role = (req.user && req.user.role) || (req.body && req.body.role) || 'User';
  if (!username) return res.status(400).json({ message: 'Username is required' });

  const message = appendChatMessage({ username, role, text });
  res.status(201).json(message);
});

function resolveSocketIdentity(socket, payload) {
  const data = payload && typeof payload === 'object' ? payload : {};
  const token = (data.token || socket.handshake.auth && socket.handshake.auth.token || '').trim();

  if (token) {
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET || 'change_me');
      return {
        username: user.username,
        role: user.role || 'User'
      };
    } catch (_e) {
      // fallback to payload
    }
  }

  const username = String(data.username || socket.handshake.auth && socket.handshake.auth.username || '').trim();
  const role = String(data.role || socket.handshake.auth && socket.handshake.auth.role || 'User').trim() || 'User';
  if (!username) return null;
  return { username, role };
}

function attachCollabSocket(io) {
  ioRef = io;

  io.on('connection', (socket) => {
    socket.emit('presence:update', readPresenceMap());
    socket.emit('chat:snapshot', getChatList().slice(-200));

    socket.on('presence:join', (payload) => {
      const identity = resolveSocketIdentity(socket, payload);
      if (!identity || !identity.username) return;
      trackSocketUser(socket.id, identity.username);
      setPresenceOnline(identity.username, identity.role);
    });

    socket.on('presence:heartbeat', (payload) => {
      const identity = resolveSocketIdentity(socket, payload);
      if (!identity || !identity.username) return;
      setPresenceOnline(identity.username, identity.role);
    });

    socket.on('presence:offline', (payload) => {
      const identity = resolveSocketIdentity(socket, payload);
      if (!identity || !identity.username) return;
      setPresenceOffline(identity.username, identity.role);
    });

    socket.on('chat:send', (payload) => {
      const identity = resolveSocketIdentity(socket, payload);
      const text = String(payload && payload.text || '').trim();
      if (!identity || !identity.username || !text) return;
      appendChatMessage({ username: identity.username, role: identity.role, text });
    });

    socket.on('disconnect', () => {
      const username = untrackSocketUser(socket.id);
      if (!username) return;
      setPresenceOffline(username, 'User');
    });
  });

  setInterval(() => {
    const map = readPresenceMap();
    const changed = cleanupPresence(map);
    if (changed) {
      writePresenceMap(map);
      broadcastPresence();
    }
  }, 3000);
}

module.exports = {
  router,
  attachCollabSocket
};
