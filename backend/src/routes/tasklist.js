const express = require('express');
const { authRequired, isPrivileged } = require('../middleware/auth');
const { readJson } = require('../utils/store');

const router = express.Router();

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function isOpenOrProgress(status) {
  return status === 'Open' || status === 'Progress';
}

function isAssignedToPja(userName, item) {
  const a = normalizeName(userName);
  const b = normalizeName(item && item.namaPja);
  return !!a && !!b && a === b;
}

router.get('/', authRequired, (req, res) => {
  const kta = readJson('kta.json', []);
  const tta = readJson('tta.json', []);

  const currentNama = req.user && req.user.nama;

  const scopedKta = isPrivileged(req.user.role)
    ? kta
    : kta.filter((item) => {
      if (item.reporterUsername === req.user.username) return true;
      return isOpenOrProgress(item.status) && isAssignedToPja(currentNama, item);
    });

  const scopedTta = isPrivileged(req.user.role)
    ? tta
    : tta.filter((item) => {
      if (item.reporterUsername === req.user.username) return true;
      return isOpenOrProgress(item.status) && isAssignedToPja(currentNama, item);
    });

  const list = [
    ...scopedKta.map((item) => ({ type: 'KTA', ...item })),
    ...scopedTta.map((item) => ({ type: 'TTA', ...item }))
  ].sort((a, b) => {
    const da = new Date(a.tanggalLaporan || a.createdAt || 0).getTime();
    const db = new Date(b.tanggalLaporan || b.createdAt || 0).getTime();
    return db - da;
  });

  return res.json(list);
});

module.exports = router;
