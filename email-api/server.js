require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const port = Number(process.env.PORT || 8080);

const allowedOrigins = String(process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.length) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  }
}));

app.use(express.json({ limit: '1mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

function parseRecipients(rawValue) {
  if (!rawValue) return [];

  let source = rawValue;
  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    if (trimmed.startsWith('[')) {
      try {
        source = JSON.parse(trimmed);
      } catch (_error) {
        source = trimmed;
      }
    } else {
      source = trimmed;
    }
  }

  if (Array.isArray(source)) {
    return source
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  return String(source || '')
    .split(/[\n,;]+/)
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function requireBearerToken(req, res, next) {
  const requiredToken = String(process.env.EMAIL_API_BEARER_TOKEN || '').trim();
  if (!requiredToken) {
    return next();
  }

  const authHeader = String(req.headers.authorization || '');
  const prefix = 'Bearer ';
  if (!authHeader.startsWith(prefix)) {
    return res.status(401).json({ message: 'Missing bearer token.' });
  }

  const token = authHeader.slice(prefix.length).trim();
  if (token !== requiredToken) {
    return res.status(401).json({ message: 'Invalid bearer token.' });
  }

  return next();
}

function createTransporter() {
  const host = String(process.env.SMTP_HOST || '').trim();
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  const portValue = Number(process.env.SMTP_PORT || 587);
  const secureValue = String(process.env.SMTP_SECURE || 'false').trim().toLowerCase() === 'true';

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration is incomplete.');
  }

  return nodemailer.createTransport({
    host: host,
    port: portValue,
    secure: secureValue,
    auth: {
      user: user,
      pass: pass
    }
  });
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'project-app-email-api' });
});

app.post('/api/spip/send-email', requireBearerToken, upload.single('file'), async (req, res) => {
  try {
    const recipients = parseRecipients(req.body.recipients);
    const invalidRecipient = recipients.find((item) => !isValidEmail(item));

    if (!recipients.length) {
      return res.status(400).json({ message: 'Recipients is required.' });
    }
    if (invalidRecipient) {
      return res.status(400).json({ message: 'Invalid email: ' + invalidRecipient });
    }

    const subject = String(req.body.subject || '').trim() || 'SPIP Komisioning';
    const body = String(req.body.body || '').trim() || 'Terlampir file SPIP.';

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'PDF attachment is required in field "file".' });
    }

    const transporter = createTransporter();
    const fromAddress = String(process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();

    await transporter.sendMail({
      from: fromAddress,
      to: recipients.join(', '),
      subject: subject,
      text: body,
      attachments: [
        {
          filename: req.file.originalname || 'SPIP-Komisioning.pdf',
          content: req.file.buffer,
          contentType: req.file.mimetype || 'application/pdf'
        }
      ]
    });

    return res.json({
      ok: true,
      sentTo: recipients,
      fileName: req.file.originalname || 'SPIP-Komisioning.pdf'
    });
  } catch (error) {
    return res.status(500).json({
      message: error && error.message ? error.message : 'Failed to send email.'
    });
  }
});

app.listen(port, () => {
  process.stdout.write('Email API listening on http://localhost:' + port + '\n');
});
