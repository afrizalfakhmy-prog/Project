const express = require('express');
const { authRequired, isPrivileged } = require('../middleware/auth');
const { readJson, writeJson } = require('../utils/store');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const list = readJson('ohs_talk.json', []);
  if (isPrivileged(req.user.role)) return res.json(list);
  return res.json(list.filter((item) => item.reporterUsername === req.user.username));
});

router.post('/', authRequired, (req, res) => {
  const list = readJson('ohs_talk.json', []);
  const payload = req.body || {};

  const record = {
    ...payload,
    id: payload.id || `OHS-TALK-${Date.now()}`,
    reporterUsername: req.user.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  list.push(record);
  writeJson('ohs_talk.json', list);
  return res.status(201).json(record);
});

router.put('/:id', authRequired, (req, res) => {
  const list = readJson('ohs_talk.json', []);
  const idx = list.findIndex((item) => item.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: 'Data not found' });

  const existing = list[idx];
  if (!isPrivileged(req.user.role) && existing.reporterUsername !== req.user.username) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  list[idx] = {
    ...existing,
    ...req.body,
    id: existing.id,
    reporterUsername: existing.reporterUsername,
    updatedAt: new Date().toISOString()
  };

  writeJson('ohs_talk.json', list);
  return res.json(list[idx]);
});

router.delete('/:id', authRequired, (req, res) => {
  if (!isPrivileged(req.user.role)) {
    return res.status(403).json({ message: 'Only Admin/Super Admin can delete' });
  }

  const list = readJson('ohs_talk.json', []);
  const next = list.filter((item) => item.id !== req.params.id);
  if (next.length === list.length) return res.status(404).json({ message: 'Data not found' });

  writeJson('ohs_talk.json', next);
  return res.json({ message: 'Deleted' });
});

module.exports = router;
