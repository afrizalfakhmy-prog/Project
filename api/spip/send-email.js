const nodemailer = require('nodemailer');

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
    const normalizedBase64 = rawBase64.replace(/^data:application\/pdf;base64,/i, '');
    const fileBuffer = normalizedBase64 ? Buffer.from(normalizedBase64, 'base64') : null;

    if (!fileBuffer || !fileBuffer.length) {
      return res.status(400).json({ message: 'PDF attachment is required in fileBase64.' });
    }

    const fileName = String((req.body && req.body.fileName) || '').trim() || 'SPIP-Komisioning.pdf';

    const transporter = createTransporter();
    const fromAddress = String(process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();

    await transporter.sendMail({
      from: fromAddress,
      to: recipients.join(', '),
      subject: subject,
      text: body,
      attachments: [
        {
          filename: fileName,
          content: fileBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    return res.status(200).json({ ok: true, sentTo: recipients, fileName: fileName });
  } catch (error) {
    return res.status(500).json({
      message: error && error.message ? error.message : 'Failed to send email.'
    });
  }
};
