const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

// 10 chars hex (5 bytes = 40 bits ≈ 1e12 combinaciones).
function generateShortId() {
  return crypto.randomBytes(5).toString('hex');
}

// Si POS_ID está en .env, lo usa (preferido para producción).
// Si existe %APPDATA%/dps-desk/posId.txt, lo lee (estable entre reinicios).
// Si no, genera un ID corto y lo persiste.
function getPosId() {
  if (process.env.POS_ID) {
    return process.env.POS_ID;
  }

  const dir = app.getPath('userData');
  const file = path.join(dir, 'posId.txt');
  if (fs.existsSync(file)) {
    return fs.readFileSync(file, 'utf8').trim();
  }
  const id = generateShortId();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, id);
  return id;
}

module.exports = { getPosId };
