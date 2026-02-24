require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const authRoutes = require('./routes/auth');
const ktaRoutes = require('./routes/kta');
const ttaRoutes = require('./routes/tta');
const tasklistRoutes = require('./routes/tasklist');
const usersRoutes = require('./routes/users');
const departmentsRoutes = require('./routes/departments');
const companiesRoutes = require('./routes/companies');
const pjaRoutes = require('./routes/pja');
const ohsTalkRoutes = require('./routes/ohsTalk');
const observasiRoutes = require('./routes/observasi');
const collabRoutes = require('./routes/collab');
const { authRequired } = require('./middleware/auth');

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const uploadStorage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({ storage: uploadStorage });

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'project-app-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/kta', ktaRoutes);
app.use('/api/tta', ttaRoutes);
app.use('/api/tasklist', tasklistRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/pja', pjaRoutes);
app.use('/api/ohs-talk', ohsTalkRoutes);
app.use('/api/observasi', observasiRoutes);
app.use('/api/collab', collabRoutes);

app.post('/api/upload/images', authRequired, upload.array('images', 10), (req, res) => {
  const files = (req.files || []).map((file) => ({
    fileName: file.filename,
    url: `/uploads/${file.filename}`,
    size: file.size,
    mimeType: file.mimetype
  }));

  res.status(201).json({ files });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
