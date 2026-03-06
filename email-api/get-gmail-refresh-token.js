require('dotenv').config();

const readline = require('readline');

const AUTH_BASE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DEFAULT_REDIRECT_URI = 'http://localhost';
const MAIL_SCOPE = 'https://mail.google.com/';

function requireEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error('Missing env var: ' + name);
  }
  return value;
}

function buildAuthUrl(clientId, redirectUri) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: MAIL_SCOPE,
    access_type: 'offline',
    prompt: 'consent'
  });
  return AUTH_BASE_URL + '?' + params.toString();
}

function extractCodeFromInput(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';

  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      return String(url.searchParams.get('code') || '').trim();
    } catch (_error) {
      return '';
    }
  }

  return text;
}

async function exchangeCodeForToken(clientId, clientSecret, redirectUri, code) {
  const body = new URLSearchParams({
    code: code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  const data = await response.json().catch(function () {
    return {};
  });

  if (!response.ok) {
    throw new Error((data && data.error_description) || (data && data.error) || ('HTTP ' + response.status));
  }

  return data;
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(function (resolve) {
    rl.question(question, function (answer) {
      rl.close();
      resolve(String(answer || ''));
    });
  });
}

async function main() {
  try {
    const clientId = requireEnv('GMAIL_CLIENT_ID');
    const clientSecret = requireEnv('GMAIL_CLIENT_SECRET');
    const redirectUri = String(process.env.GMAIL_REDIRECT_URI || DEFAULT_REDIRECT_URI).trim();
    const args = process.argv.slice(2);

    if (args.indexOf('--print-auth-url') >= 0) {
      process.stdout.write(buildAuthUrl(clientId, redirectUri) + '\n');
      return;
    }

    const codeArgIndex = args.indexOf('--code');
    if (codeArgIndex >= 0) {
      const rawCode = String(args[codeArgIndex + 1] || '').trim();
      const code = extractCodeFromInput(rawCode);
      if (!code) {
        throw new Error('Authorization code tidak valid pada arg --code.');
      }

      const tokenData = await exchangeCodeForToken(clientId, clientSecret, redirectUri, code);
      const refreshToken = String(tokenData.refresh_token || '').trim();
      if (!refreshToken) {
        throw new Error('Refresh token tidak ditemukan. Ulangi consent dengan prompt=consent dan pastikan akses offline.');
      }

      process.stdout.write('GMAIL_REFRESH_TOKEN=' + refreshToken + '\n');
      return;
    }

    const authUrl = buildAuthUrl(clientId, redirectUri);
    process.stdout.write('\n1) Buka URL berikut di browser dan login akun Gmail pengirim:\n\n');
    process.stdout.write(authUrl + '\n\n');
    process.stdout.write('2) Setelah redirect, copy URL lengkap dari address bar (atau langsung value code).\n\n');

    const userInput = await ask('Paste URL / code di sini: ');
    const code = extractCodeFromInput(userInput);

    if (!code) {
      throw new Error('Authorization code tidak ditemukan dari input.');
    }

    const tokenData = await exchangeCodeForToken(clientId, clientSecret, redirectUri, code);
    const refreshToken = String(tokenData.refresh_token || '').trim();

    if (!refreshToken) {
      throw new Error('Refresh token tidak ditemukan. Ulangi consent dengan prompt=consent dan pastikan akses offline.');
    }

    process.stdout.write('\nSUKSES. Simpan nilai berikut ke env Vercel/local:\n\n');
    process.stdout.write('GMAIL_REFRESH_TOKEN=' + refreshToken + '\n');

    if (tokenData.access_token) {
      process.stdout.write('\nInfo: access token juga diterima (sementara), tapi yang dibutuhkan server adalah refresh token.\n');
    }
  } catch (error) {
    process.stderr.write('\nGagal: ' + String((error && error.message) || error) + '\n');
    process.exitCode = 1;
  }
}

main();
