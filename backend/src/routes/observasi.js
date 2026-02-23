const express = require('express');
const { authRequired, isPrivileged } = require('../middleware/auth');
const { readJson, writeJson } = require('../utils/store');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const list = readJson('observasi.json', []);
  if (isPrivileged(req.user.role)) return res.json(list);
  return res.json(list.filter((item) => item.reporterUsername === req.user.username));
});

router.post('/', authRequired, (req, res) => {
  const list = readJson('observasi.json', []);
  const payload = req.body || {};

  const record = {
    ...payload,
    id: payload.id || `OBS-${Date.now()}`,
    reporterUsername: req.user.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  list.push(record);
  writeJson('observasi.json', list);
  return res.status(201).json(record);
});

router.put('/:id', authRequired, (req, res) => {
  if (req.user.role !== 'Super Admin') {
    return res.status(403).json({ message: 'Only Super Admin can update' });
  }

  const list = readJson('observasi.json', []);
  const idx = list.findIndex((item) => item.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: 'Data not found' });

  const existing = list[idx];

  const payload = req.body || {};
  list[idx] = {
    ...existing,
    ...payload,
    id: existing.id,
    reporterUsername: existing.reporterUsername,
    updatedAt: new Date().toISOString()
  };

  writeJson('observasi.json', list);
  return res.json(list[idx]);
});

router.delete('/:id', authRequired, (req, res) => {
  if (req.user.role !== 'Super Admin') {
    return res.status(403).json({ message: 'Only Super Admin can delete' });
  }

  const list = readJson('observasi.json', []);
  const next = list.filter((item) => item.id !== req.params.id);
  if (next.length === list.length) return res.status(404).json({ message: 'Data not found' });

  writeJson('observasi.json', next);
  return res.json({ message: 'Deleted' });
});

module.exports = router;
