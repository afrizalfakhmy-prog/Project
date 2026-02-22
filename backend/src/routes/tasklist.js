const express = require('express');
const { authRequired, isPrivileged } = require('../middleware/auth');
const { readJson } = require('../utils/store');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const kta = readJson('kta.json', []);
  const tta = readJson('tta.json', []);

  const scopedKta = isPrivileged(req.user.role)
    ? kta
    : kta.filter((item) => item.reporterUsername === req.user.username);

  const scopedTta = isPrivileged(req.user.role)
    ? tta
    : tta.filter((item) => item.reporterUsername === req.user.username);

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
