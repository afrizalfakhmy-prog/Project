require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');

function readEnv(key) {
  const raw = String(process.env[key] || '').trim();
  if (!raw) return '';
  const quoted = (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"));
  return quoted ? raw.slice(1, -1).trim() : raw;
}

function normalizeRefreshToken(value) {
  const token = String(value || '').trim();
  if (!token) return '';
  try {
    return decodeURIComponent(token);
  } catch (_error) {
    return token;
  }
}

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

app.use(express.json({ limit: '15mb' }));

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
  const gmailUser = readEnv('GMAIL_USER') || readEnv('SMTP_USER');
  const gmailClientId = readEnv('GMAIL_CLIENT_ID') || readEnv('GOOGLE_CLIENT_ID');
  const gmailClientSecret = readEnv('GMAIL_CLIENT_SECRET') || readEnv('GOOGLE_CLIENT_SECRET');
  const gmailRefreshToken = normalizeRefreshToken(readEnv('GMAIL_REFRESH_TOKEN') || readEnv('GOOGLE_REFRESH_TOKEN'));
  const gmailValues = {
    GMAIL_USER: gmailUser,
    GMAIL_CLIENT_ID: gmailClientId,
    GMAIL_CLIENT_SECRET: gmailClientSecret,
    GMAIL_REFRESH_TOKEN: gmailRefreshToken
  };
  const gmailKeys = Object.keys(gmailValues);
  const hasAnyGmail = gmailKeys.some((key) => !!gmailValues[key]);
  const missingGmail = gmailKeys.filter((key) => !gmailValues[key]);

  if (hasAnyGmail && !missingGmail.length) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: gmailUser,
        clientId: gmailClientId,
        clientSecret: gmailClientSecret,
        refreshToken: gmailRefreshToken
      }
    });
  }

  if (hasAnyGmail && missingGmail.length) {
    throw new Error('Incomplete Gmail OAuth2 configuration. Missing: ' + missingGmail.join(', '));
  }

  const host = readEnv('SMTP_HOST');
  const user = readEnv('SMTP_USER');
  const pass = readEnv('SMTP_PASS');
  const portValue = Number(readEnv('SMTP_PORT') || 587);
  const secureValue = String(readEnv('SMTP_SECURE') || 'false').toLowerCase() === 'true';
  const smtpValues = {
    SMTP_HOST: host,
    SMTP_USER: user,
    SMTP_PASS: pass
  };
  const missingSmtp = Object.keys(smtpValues).filter((key) => !smtpValues[key]);

  if (missingSmtp.length) {
    throw new Error('SMTP configuration is incomplete. Missing: ' + missingSmtp.join(', ') + '. Or set Gmail OAuth2 vars (GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN).');
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

    const rawBase64 = String(req.body.fileBase64 || '').trim();
    const normalizedBase64 = rawBase64.replace(/^data:[^;]+;base64,/i, '');
    const attachmentFromJson = normalizedBase64
      ? Buffer.from(normalizedBase64, 'base64')
      : null;

    const attachmentBuffer = req.file && req.file.buffer
      ? req.file.buffer
      : attachmentFromJson;

    if (!attachmentBuffer || !attachmentBuffer.length) {
      return res.status(400).json({ message: 'Attachment is required (multipart file or fileBase64).' });
    }

    const requestedMime = String(req.body.fileMime || '').trim().toLowerCase();
    const supportedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const resolvedMime = supportedMimes.indexOf(requestedMime) >= 0
      ? (requestedMime === 'image/jpg' ? 'image/jpeg' : requestedMime)
      : 'application/pdf';

    const fileName = String(req.body.fileName || '').trim()
      || (req.file && req.file.originalname)
      || ('SPIP-Komisioning.' + (resolvedMime === 'image/jpeg' ? 'jpg' : (resolvedMime === 'image/png' ? 'png' : 'pdf')));

    const transporter = createTransporter();
    const fromAddress = readEnv('SMTP_FROM') || readEnv('SMTP_USER');

    await transporter.sendMail({
      from: fromAddress,
      to: recipients.join(', '),
      subject: subject,
      text: body,
      attachments: [
        {
          filename: fileName,
          content: attachmentBuffer,
          contentType: resolvedMime
        }
      ]
    });

    return res.json({
      ok: true,
      sentTo: recipients,
      fileName: fileName
    });
  } catch (error) {
    console.error('[spip-send-email-local] Failed to send email', {
      code: error && error.code,
      responseCode: error && error.responseCode,
      command: error && error.command,
      message: error && error.message
    });
    return res.status(500).json({
      message: error && error.message ? error.message : 'Failed to send email.'
    });
  }
});

app.listen(port, () => {
  process.stdout.write('Email API listening on http://localhost:' + port + '\n');
});
