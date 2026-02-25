const express = require('express');
const jwt = require('jsonwebtoken');
const { isPrivileged } = require('../middleware/auth');
const { readJson, writeJson } = require('../utils/store');

const router = express.Router();

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

function resolveRole(req) {
  return (req.user && req.user.role) || (req.body && req.body.actorRole) || '';
}

router.get('/', (_req, res) => {
  const list = readJson('departments.json', []);
  if (Array.isArray(list) && list.length > 0) {
    return res.json(list);
  }

  const users = readJson('users.json', []);
  const names = Array.from(new Set(
    (Array.isArray(users) ? users : [])
      .map((user) => (user && user.departemen ? String(user.departemen).trim() : ''))
      .filter(Boolean)
  ));

  const seeded = names.map((name, index) => ({
    id: `d-seed-${index + 1}`,
    name
  }));

  if (seeded.length > 0) {
    writeJson('departments.json', seeded);
    return res.json(seeded);
  }

  return res.json([]);
});

router.post('/', (req, res) => {
  if (!isPrivileged(resolveRole(req))) return res.status(403).json({ message: 'Forbidden' });
  const list = readJson('departments.json', []);
  const payload = req.body || {};
  const item = { ...payload, id: payload.id || `d-${Date.now()}` };
  list.push(item);
  writeJson('departments.json', list);
  res.status(201).json(item);
});

router.put('/:id', (req, res) => {
  if (!isPrivileged(resolveRole(req))) return res.status(403).json({ message: 'Forbidden' });
  const list = readJson('departments.json', []);
  const idx = list.findIndex((x) => x.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: 'Not found' });
  list[idx] = { ...list[idx], ...req.body, id: list[idx].id };
  writeJson('departments.json', list);
  res.json(list[idx]);
});

router.delete('/:id', (req, res) => {
  if (!isPrivileged(resolveRole(req))) return res.status(403).json({ message: 'Forbidden' });
  const list = readJson('departments.json', []);
  const next = list.filter((x) => x.id !== req.params.id);
  if (next.length === list.length) return res.status(404).json({ message: 'Not found' });
  writeJson('departments.json', next);
  res.json({ message: 'Deleted' });
});

module.exports = router;
