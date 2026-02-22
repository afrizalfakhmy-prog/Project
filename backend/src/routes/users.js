const express = require('express');
const { authRequired, isPrivileged } = require('../middleware/auth');
const { readJson, writeJson } = require('../utils/store');

const router = express.Router();

function normalizeUserPayload(payload) {
  const role = payload.role || payload.kategori || 'User';
  return {
    ...payload,
    role,
    kategori: payload.kategori || role
  };
}

router.get('/', authRequired, (req, res) => {
  const users = readJson('users.json', []);
  if (isPrivileged(req.user.role)) return res.json(users);
  return res.json(users.filter((u) => u.username === req.user.username));
});

router.post('/', authRequired, (req, res) => {
  if (!isPrivileged(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const list = readJson('users.json', []);
  const payload = normalizeUserPayload(req.body || {});
  const item = {
    ...payload,
    id: payload.id || `u-${Date.now()}`
  };
  list.push(item);
  writeJson('users.json', list);
  res.status(201).json(item);
});

router.put('/:id', authRequired, (req, res) => {
  if (!isPrivileged(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const list = readJson('users.json', []);
  const idx = list.findIndex((u) => u.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: 'Not found' });
  list[idx] = { ...list[idx], ...normalizeUserPayload(req.body || {}), id: list[idx].id };
  writeJson('users.json', list);
  res.json(list[idx]);
});

router.delete('/:id', authRequired, (req, res) => {
  if (!isPrivileged(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const list = readJson('users.json', []);
  const next = list.filter((u) => u.id !== req.params.id);
  if (next.length === list.length) return res.status(404).json({ message: 'Not found' });
  writeJson('users.json', next);
  res.json({ message: 'Deleted' });
});

module.exports = router;
