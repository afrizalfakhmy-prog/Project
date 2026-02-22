const express = require('express');
const { authRequired, isPrivileged } = require('../middleware/auth');
const { readJson, writeJson } = require('../utils/store');

const router = express.Router();

router.get('/', authRequired, (_req, res) => {
  res.json(readJson('companies.json', []));
});

router.post('/', authRequired, (req, res) => {
  if (!isPrivileged(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const list = readJson('companies.json', []);
  const payload = req.body || {};
  const item = { ...payload, id: payload.id || `c-${Date.now()}` };
  list.push(item);
  writeJson('companies.json', list);
  res.status(201).json(item);
});

router.put('/:id', authRequired, (req, res) => {
  if (!isPrivileged(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const list = readJson('companies.json', []);
  const idx = list.findIndex((x) => x.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: 'Not found' });
  list[idx] = { ...list[idx], ...req.body, id: list[idx].id };
  writeJson('companies.json', list);
  res.json(list[idx]);
});

router.delete('/:id', authRequired, (req, res) => {
  if (!isPrivileged(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const list = readJson('companies.json', []);
  const next = list.filter((x) => x.id !== req.params.id);
  if (next.length === list.length) return res.status(404).json({ message: 'Not found' });
  writeJson('companies.json', next);
  res.json({ message: 'Deleted' });
});

module.exports = router;
