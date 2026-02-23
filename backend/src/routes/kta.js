const express = require('express');
const { authRequired, isPrivileged } = require('../middleware/auth');
const { readJson, writeJson } = require('../utils/store');

const router = express.Router();

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function isOpenOrProgress(status) {
  return status === 'Open' || status === 'Progress';
}

function isAssignedPjaFollowUpAllowed(user, item) {
  const namaUser = normalizeName(user && user.nama);
  const namaPja = normalizeName(item && item.namaPja);
  if (!namaUser || !namaPja) return false;
  return namaUser === namaPja && isOpenOrProgress(item && item.status);
}

router.get('/', authRequired, (req, res) => {
  const list = readJson('kta.json', []);
  if (isPrivileged(req.user.role)) return res.json(list);
  return res.json(list.filter((item) => item.reporterUsername === req.user.username));
});

router.post('/', authRequired, (req, res) => {
  const list = readJson('kta.json', []);
  const payload = req.body || {};

  const record = {
    ...payload,
    id: payload.id || `KTA-${Date.now()}`,
    reporterUsername: req.user.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  list.push(record);
  writeJson('kta.json', list);
  return res.status(201).json(record);
});

router.put('/:id', authRequired, (req, res) => {
  const list = readJson('kta.json', []);
  const idx = list.findIndex((item) => item.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: 'Data not found' });

  const existing = list[idx];
  const privileged = isPrivileged(req.user.role);
  const isOwner = existing.reporterUsername === req.user.username;
  const isPjaFollowUp = !privileged && !isOwner && isAssignedPjaFollowUpAllowed(req.user, existing);

  if (!privileged && !isOwner && !isPjaFollowUp) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  let payload = req.body || {};
  if (isPjaFollowUp) {
    payload = {
      tindakanPerbaikan: payload.tindakanPerbaikan || existing.tindakanPerbaikan || '',
      tanggalPerbaikan: payload.tanggalPerbaikan || existing.tanggalPerbaikan || '',
      status: payload.status || existing.status || 'Open',
      perbaikanLangsung: 'Ya'
    };
  }

  list[idx] = {
    ...existing,
    ...payload,
    id: existing.id,
    reporterUsername: existing.reporterUsername,
    updatedAt: new Date().toISOString()
  };

  writeJson('kta.json', list);
  return res.json(list[idx]);
});

router.delete('/:id', authRequired, (req, res) => {
  if (!isPrivileged(req.user.role)) {
    return res.status(403).json({ message: 'Only Admin/Super Admin can delete' });
  }

  const list = readJson('kta.json', []);
  const next = list.filter((item) => item.id !== req.params.id);
  if (next.length === list.length) return res.status(404).json({ message: 'Data not found' });

  writeJson('kta.json', next);
  return res.json({ message: 'Deleted' });
});

module.exports = router;
