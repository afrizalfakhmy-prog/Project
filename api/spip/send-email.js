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
    // Handle accidental URL-encoded token input from copy/paste.
    return decodeURIComponent(token);
  } catch (_error) {
    return token;
  }
}

function parseRecipients(rawValue) {
  if (!rawValue) return [];

  if (Array.isArray(rawValue)) {
    return rawValue.map((item) => String(item || '').trim()).filter(Boolean);
  }

  const text = String(rawValue || '').trim();
  if (!text) return [];

  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || '').trim()).filter(Boolean);
      }
    } catch (_error) {
    }
  }

  return text
    .split(/[\n,;]+/)
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  try {
    const requiredToken = String(process.env.EMAIL_API_BEARER_TOKEN || '').trim();
    if (requiredToken) {
      const authHeader = String(req.headers.authorization || '');
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing bearer token.' });
      }
      const token = authHeader.slice('Bearer '.length).trim();
      if (token !== requiredToken) {
        return res.status(401).json({ message: 'Invalid bearer token.' });
      }
    }

    const recipients = parseRecipients(req.body && req.body.recipients);
    if (!recipients.length) {
      return res.status(400).json({ message: 'Recipients is required.' });
    }

    const invalidRecipient = recipients.find((item) => !isValidEmail(item));
    if (invalidRecipient) {
      return res.status(400).json({ message: 'Invalid email: ' + invalidRecipient });
    }

    const subject = String((req.body && req.body.subject) || '').trim() || 'SPIP Komisioning';
    const body = String((req.body && req.body.body) || '').trim() || 'Terlampir file SPIP.';
    const rawBase64 = String((req.body && req.body.fileBase64) || '').trim();
    const normalizedBase64 = rawBase64.replace(/^data:[^;]+;base64,/i, '');
    const fileBuffer = normalizedBase64 ? Buffer.from(normalizedBase64, 'base64') : null;

    if (!fileBuffer || !fileBuffer.length) {
      return res.status(400).json({ message: 'Attachment is required in fileBase64.' });
    }

    const requestedMime = String((req.body && req.body.fileMime) || '').trim().toLowerCase();
    const supportedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const resolvedMime = supportedMimes.indexOf(requestedMime) >= 0
      ? (requestedMime === 'image/jpg' ? 'image/jpeg' : requestedMime)
      : 'application/pdf';

    const defaultExt = resolvedMime === 'image/jpeg' ? 'jpg' : (resolvedMime === 'image/png' ? 'png' : 'pdf');
    const fileName = String((req.body && req.body.fileName) || '').trim() || ('SPIP-Komisioning.' + defaultExt);

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
          content: fileBuffer,
          contentType: resolvedMime
        }
      ]
    });

    return res.status(200).json({ ok: true, sentTo: recipients, fileName: fileName });
  } catch (error) {
    console.error('[spip-send-email] Failed to send email', {
      code: error && error.code,
      responseCode: error && error.responseCode,
      command: error && error.command,
      message: error && error.message
    });
    return res.status(500).json({
      message: error && error.message ? error.message : 'Failed to send email.'
    });
  }
};
