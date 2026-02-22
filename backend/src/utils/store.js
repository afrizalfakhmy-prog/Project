const fs = require('fs');
const path = require('path');

function resolveDataPath(fileName) {
  return path.join(__dirname, '..', '..', 'data', fileName);
}

function readJson(fileName, fallback = []) {
  const filePath = resolveDataPath(fileName);
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(fileName, value) {
  const filePath = resolveDataPath(fileName);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
}

module.exports = {
  readJson,
  writeJson
};
