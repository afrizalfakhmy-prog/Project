const express = require('express');
const jwt = require('jsonwebtoken');
const { readJson } = require('../utils/store');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const users = readJson('users.json', []);
  const user = users.find((item) => item.username === username && item.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const role = user.role || user.kategori || 'User';

  const token = jwt.sign(
    {
      username: user.username,
      nama: user.nama,
      role
    },
    process.env.JWT_SECRET || 'change_me',
    { expiresIn: '12h' }
  );

  return res.json({
    token,
    user: {
      username: user.username,
      nama: user.nama,
      role,
      jabatan: user.jabatan,
      departemen: user.departemen,
      perusahaan: user.perusahaan,
      ccow: user.ccow
    }
  });
});

router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
